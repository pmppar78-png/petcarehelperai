#!/usr/bin/env node
/**
 * Verify breed/species photos against Wikimedia Commons metadata,
 * self-host the ones that actually depict the animal as WebP
 * (960px main, 250px thumb), and point HTML at the local files.
 *
 * Files that are missing, non-free, or clearly a different subject
 * fall back to /animal-placeholder.svg.
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT_DIR = path.join(ROOT, "images", "breeds");
const MANIFEST = path.join(ROOT, "data", "image-manifest.json");
const UA = "PetCareHelperAI/1.0 (self-host breed images; attribution page /image-credits)";

const GENERIC = new Set(`dog dogs cat cats fish bird birds pet pets breed animal animals
the and with for from red blue white black green giant dwarf common domestic wild
small large miniature standard toy long short haired hair mix hybrid type group
american african asian european northern southern eastern western little big
terrier hound spaniel retriever shepherd pointer`.split(/\s+/));

const BAD_CAT = /(range map|locator map|distribution map|maps of|coat of arms|flag of|postage stamp|locator|diagram of the range|skeleton of|skull of|logo|icon of|coat of|herald)/i;

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".") || ent.name === "node_modules" || ent.name === "audit") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

function decodeFileName(url) {
  const m = url.match(/\/(?:\d+px-)?([^\/?#]+)$/);
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return m[1]; }
}

function stripHtml(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function norm(s) {
  return stripHtml(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function significantTokens(name) {
  return norm(name).split(" ").filter((w) => w.length > 2 && !GENERIC.has(w));
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchJson(url) {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (res.status === 429 || res.status >= 500) {
        await sleep(800 * (i + 1));
        continue;
      }
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } catch (err) {
      if (i === 3) throw err;
      await sleep(600 * (i + 1));
    }
  }
}

function collectProfiles() {
  const profiles = [];
  const breedRoot = path.join(ROOT, "breeds");
  for (const group of fs.readdirSync(breedRoot)) {
    const dir = path.join(breedRoot, group);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".html")) continue;
      const html = fs.readFileSync(path.join(dir, file), "utf8");
      const h1 = stripHtml((html.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || file.replace(".html", ""));
      const sci = stripHtml((html.match(/Scientific Name<\/td>\s*<td>([\s\S]*?)<\/td>/i) || [])[1] || "");
      const img = (html.match(/<img[^>]+src="(https:\/\/upload\.wikimedia\.org[^"]+)"/) || [])[1] || "";
      const placeholder = /animal-placeholder\.svg/.test(html) && !img;
      profiles.push({
        group,
        slug: file.replace(/\.html$/, ""),
        name: h1,
        sci,
        fileName: img ? decodeFileName(img) : null,
        placeholder,
      });
    }
  }
  return profiles;
}

async function queryCommons(fileNames) {
  const byName = new Map();
  const unique = [...new Set(fileNames.filter(Boolean))];
  const chunk = 20;
  for (let i = 0; i < unique.length; i += chunk) {
    const titles = unique.slice(i, i + chunk).map((n) => `File:${n.replace(/ /g, "_")}`).join("|");
    const url = "https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({
      action: "query",
      format: "json",
      redirects: "1",
      prop: "imageinfo|categories",
      iiprop: "url|size|mime|extmetadata",
      iiurlwidth: "1280",
      cllimit: "40",
      clshow: "!hidden",
      titles,
    });
    const data = await fetchJson(url);
    if (data?.error) {
      await sleep(1500);
      i -= chunk;
      continue;
    }
    const pages = data?.query?.pages || {};
    const byTitle = new Map();
    for (const page of Object.values(pages)) {
      if (page.missing !== undefined || !page.title) continue;
      byTitle.set(page.title, page);
    }
    const back = new Map();
    for (const n of data?.query?.normalized || []) back.set(n.to, n.from);
    for (const r of data?.query?.redirects || []) back.set(r.to, r.from);
    for (const [title, page] of byTitle) {
      const info = (page.imageinfo || [])[0] || {};
      const meta = info.extmetadata || {};
      const cats = (page.categories || []).map((c) => c.title.replace(/^Category:/, ""));
      const bare = title.replace(/^File:/, "");
      const record = {
        title: bare,
        description: stripHtml(meta.ImageDescription?.value || ""),
        objectName: stripHtml(meta.ObjectName?.value || ""),
        artist: stripHtml(meta.Artist?.value || "Unknown"),
        credit: stripHtml(meta.Credit?.value || ""),
        license: stripHtml(meta.LicenseShortName?.value || "See Commons"),
        licenseUrl: stripHtml(meta.LicenseUrl?.value || ""),
        commonsUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(bare)}`,
        mime: info.mime || "",
        thumb: info.thumburl || info.url,
        original: info.url,
        width: info.thumbwidth || info.width,
        height: info.thumbheight || info.height,
        categories: cats,
      };
      const keys = new Set([bare, bare.replace(/ /g, "_"), bare.replace(/_/g, " ")]);
      let cursor = title;
      for (let hop = 0; hop < 4 && back.has(cursor); hop++) {
        cursor = back.get(cursor);
        const b = cursor.replace(/^File:/, "");
        keys.add(b);
        keys.add(b.replace(/ /g, "_"));
        keys.add(b.replace(/_/g, " "));
      }
      for (const k of keys) {
        byName.set(k, record);
        byName.set(k.toLowerCase(), record);
      }
    }
    process.stdout.write(`\r  commons ${Math.min(i + chunk, unique.length)}/${unique.length}`);
    await sleep(120);
  }
  const missing = unique.filter((name) => !lookup(byName, name));
  process.stdout.write(`\n  retrying ${missing.length} files one by one\n`);
  for (let i = 0; i < missing.length; i++) {
    const name = missing[i];
    const url = "https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({
      action: "query",
      format: "json",
      redirects: "1",
      prop: "imageinfo|categories",
      iiprop: "url|size|mime|extmetadata",
      iiurlwidth: "1280",
      cllimit: "30",
      titles: `File:${name.replace(/ /g, "_")}`,
    });
    try {
      const data = await fetchJson(url);
      const page = Object.values(data?.query?.pages || {})[0];
      if (page && page.missing === undefined && page.title) {
        const info = (page.imageinfo || [])[0] || {};
        const meta = info.extmetadata || {};
        const cats = (page.categories || []).map((c) => c.title.replace(/^Category:/, ""));
        const bare = page.title.replace(/^File:/, "");
        const record = {
          title: bare,
          description: stripHtml(meta.ImageDescription?.value || ""),
          objectName: stripHtml(meta.ObjectName?.value || ""),
          artist: stripHtml(meta.Artist?.value || "Unknown"),
          credit: stripHtml(meta.Credit?.value || ""),
          license: stripHtml(meta.LicenseShortName?.value || "See Commons"),
          licenseUrl: stripHtml(meta.LicenseUrl?.value || ""),
          commonsUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(bare)}`,
          mime: info.mime || "",
          thumb: info.thumburl || info.url,
          original: info.url,
          width: info.thumbwidth || info.width,
          height: info.thumbheight || info.height,
          categories: cats,
        };
        for (const k of [name, bare, bare.replace(/ /g, "_"), name.replace(/_/g, " ")]) {
          byName.set(k, record);
          byName.set(k.toLowerCase(), record);
        }
      }
    } catch { /* leave missing */ }
    if (i % 20 === 0) process.stdout.write(`\r  single ${i}/${missing.length}`);
    await sleep(80);
  }
  process.stdout.write("\n");
  return byName;
}

function lookup(byName, fileName) {
  if (!fileName) return null;
  const keys = [fileName, fileName.replace(/_/g, " "), fileName.replace(/ /g, "_")];
  for (const k of keys) {
    if (byName.has(k)) return byName.get(k);
    if (byName.has(k.toLowerCase())) return byName.get(k.toLowerCase());
  }
  return null;
}

function depicts(profile, meta) {
  if (!meta) return { ok: false, why: "not on Commons" };
  if (!/^image\//.test(meta.mime) || /svg/.test(meta.mime)) return { ok: false, why: `mime ${meta.mime || "unknown"}` };
  const license = meta.license.toLowerCase();
  if (/non-free|fair use|all rights reserved/.test(license)) return { ok: false, why: `license ${meta.license}` };
  const catBlob = meta.categories.join(" | ");
  if (BAD_CAT.test(catBlob) && !/photograph|portraits|living/.test(catBlob)) {
    return { ok: false, why: "map, diagram, or emblem" };
  }
  const hay = norm([meta.title, meta.description, meta.objectName, catBlob].join(" "));
  const full = norm(profile.name);
  let score = 0;
  const reasons = [];
  if (full.length > 3 && hay.includes(full)) { score += 10; reasons.push("common name"); }
  const sci = norm((profile.sci || "").split(/[,;(]/)[0]);
  const sciParts = sci.split(" ").filter((w) => w.length > 3);
  if (sciParts.length >= 2 && sciParts.every((p) => hay.includes(p))) { score += 8; reasons.push("scientific name"); }
  else if (sciParts.length === 1 && hay.includes(sciParts[0])) { score += 4; reasons.push("genus"); }
  const toks = significantTokens(profile.name);
  const hit = toks.filter((t) => hay.includes(t));
  if (toks.length && hit.length === toks.length) { score += 6; reasons.push("name tokens"); }
  else if (hit.length) { score += hit.length; reasons.push(`partial ${hit.join("+")}`); }
  // A single generic-ish token match is not enough (e.g. "python" on a snake page that is the wrong python).
  if (toks.length >= 2 && hit.length < toks.length && score < 8) score = Math.min(score, 4);
  if (score < 6) return { ok: false, why: `weak match (${reasons.join(", ") || "none"})`, score };
  return { ok: true, why: reasons.join(", "), score };
}

function convertPair(srcPath, mainPath, thumbPath) {
  const py = `
from PIL import Image
im = Image.open(${JSON.stringify(srcPath)})
if im.mode not in ("RGB", "RGBA"):
    im = im.convert("RGB")
# Flatten transparency onto a light background so WebP stays photographic.
if im.mode == "RGBA":
    bg = Image.new("RGB", im.size, (245, 247, 246))
    bg.paste(im, mask=im.split()[-1])
    im = bg
w, h = im.size
def save(tw, dest):
    if w > tw:
        nh = max(1, round(h * tw / w))
        out = im.resize((tw, nh), Image.Resampling.LANCZOS)
    else:
        out = im
    out.save(dest, "WEBP", quality=78, method=4)
    return out.size
mw, mh = save(960, ${JSON.stringify(mainPath)})
tw, th = save(250, ${JSON.stringify(thumbPath)})
print(f"{mw} {mh} {tw} {th}")
`;
  const res = spawnSync("python3", ["-c", py], { encoding: "utf8" });
  if (res.status !== 0) throw new Error(res.stderr || "convert failed");
  const [mw, mh, tw, th] = res.stdout.trim().split(/\s+/).map(Number);
  return { width: mw, height: mh, thumbWidth: tw, thumbHeight: th };
}

async function download(url, dest) {
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.status === 429) {
        await sleep(1200 * (i + 1));
        continue;
      }
      if (!res.ok) throw new Error(String(res.status));
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 800) throw new Error("tiny file");
      fs.writeFileSync(dest, buf);
      return;
    } catch (err) {
      if (i === 4) throw err;
      await sleep(700 * (i + 1));
    }
  }
  throw new Error("429");
}

function altText(profile) {
  const sci = (profile.sci || "").split(/[,;(]/)[0].trim();
  return sci ? `${profile.name} (${sci})` : profile.name;
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function buildImgTag(entry, eager = false) {
  if (!entry || entry.placeholder) {
    return `<img src="/animal-placeholder.svg" alt="Photo coming soon" width="800" height="600" loading="lazy" decoding="async">`;
  }
  const loading = eager ? "eager" : "lazy";
  return `<img src="${entry.main}" srcset="${entry.thumb} 250w, ${entry.main} 960w" sizes="(max-width: 640px) 92vw, 960px" alt="${escapeAttr(entry.alt)}" width="${entry.width}" height="${entry.height}" loading="${loading}" decoding="async">`;
}

function replaceImages(html, fileToEntry) {
  return html.replace(/https:\/\/upload\.wikimedia\.org\/[^"'\s)]+/g, (url) => {
    const name = decodeFileName(url);
    const entry = name && (fileToEntry.get(name) || fileToEntry.get(name.replace(/_/g, " ")));
    if (!entry) return "/animal-placeholder.svg";
    if (entry.placeholder) return "/animal-placeholder.svg";
    if (/\/(\d+)px-/.test(url)) {
      const w = Number(url.match(/\/(\d+)px-/)[1]);
      return w <= 320 ? entry.thumb : entry.main;
    }
    return entry.main;
  });
}

function fixImgTags(html) {
  return html.replace(/<img\b([^>]*?)>/gi, (tag, attrs) => {
    if (!/src="\/(?:images\/breeds\/|animal-placeholder\.svg)/.test(tag)) return tag;
    let next = attrs;
    if (/animal-placeholder\.svg/.test(next)) {
      if (!/alt=/.test(next)) next += ` alt="Photo coming soon"`;
      else next = next.replace(/alt="[^"]*"/, `alt="Photo coming soon"`);
      if (!/\bwidth=/.test(next)) next += ` width="800"`;
      if (!/\bheight=/.test(next)) next += ` height="600"`;
      if (!/loading=/.test(next)) next += ` loading="lazy"`;
      if (!/decoding=/.test(next)) next += ` decoding="async"`;
      return `<img${next}>`;
    }
    if (!/loading=/.test(next)) next += ` loading="lazy"`;
    if (!/decoding=/.test(next)) next += ` decoding="async"`;
    return `<img${next}>`;
  });
}

async function main() {
  console.log("Collecting profiles…");
  const profiles = collectProfiles();
  if (fs.existsSync(MANIFEST)) {
    const previous = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
    const byKey = new Map((previous.images || []).map((e) => [`${e.group}/${e.slug}`, e]));
    for (const p of profiles) {
      const old = byKey.get(`${p.group}/${p.slug}`);
      if (old?.sourceFile && !p.fileName) p.fileName = old.sourceFile;
    }
  }
  console.log(`  ${profiles.length} profiles`);
  const fileNames = profiles.map((p) => p.fileName).filter(Boolean);
  console.log(`Querying Commons for ${new Set(fileNames).size} files…`);
  const byName = await queryCommons(fileNames);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = [];
  const fileToEntry = new Map();
  let hosted = 0;
  let placeholders = 0;
  const claimedFiles = new Map();
  const previous = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : null;
  const previousByKey = new Map((previous?.images || []).map((e) => [`${e.group}/${e.slug}`, e]));

  // Score every profile against its file first so a shared file goes to the best match.
  const judged = profiles.map((p) => {
    const meta = lookup(byName, p.fileName);
    const verdict = p.fileName ? depicts(p, meta) : { ok: false, why: p.placeholder ? "already placeholder" : "no image url", score: 0 };
    return { p, meta, verdict };
  });
  judged.sort((a, b) => (b.verdict.score || 0) - (a.verdict.score || 0));

  let n = 0;
  for (const item of judged) {
    n++;
    const { p, meta, verdict } = item;
    const prev = previousByKey.get(`${p.group}/${p.slug}`);
    if (prev && !prev.placeholder && prev.main && fs.existsSync(path.join(ROOT, prev.main.slice(1)))) {
      manifest.push(prev);
      if (prev.sourceFile) {
        if (!claimedFiles.has(prev.sourceFile)) claimedFiles.set(prev.sourceFile, p.slug);
        fileToEntry.set(prev.sourceFile, prev);
      }
      hosted++;
      continue;
    }
    const entry = {
      group: p.group,
      slug: p.slug,
      name: p.name,
      sci: p.sci,
      alt: altText(p),
      sourceFile: p.fileName,
      placeholder: true,
      reason: verdict.why,
    };
    const takenBy = p.fileName ? claimedFiles.get(p.fileName) : null;
    // The same photo may be used for two profiles only when both verified it.
    const usable = verdict.ok && meta && !(takenBy && !verdict.ok);
    if (usable) {
      try {
        const dir = path.join(OUT_DIR, p.group);
        fs.mkdirSync(dir, { recursive: true });
        const tmp = path.join(dir, `${p.slug}.src`);
        const main = path.join(dir, `${p.slug}.webp`);
        const thumb = path.join(dir, `${p.slug}-thumb.webp`);
        await download(meta.thumb || meta.original, tmp);
        const dims = convertPair(tmp, main, thumb);
        fs.unlinkSync(tmp);
        Object.assign(entry, {
          placeholder: false,
          reason: verdict.why,
          main: `/images/breeds/${p.group}/${p.slug}.webp`,
          thumb: `/images/breeds/${p.group}/${p.slug}-thumb.webp`,
          ...dims,
          author: meta.artist.slice(0, 240),
          license: meta.license,
          licenseUrl: meta.licenseUrl,
          commonsUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(meta.title)}`,
          commonsTitle: meta.title,
        });
        claimedFiles.set(p.fileName, p.slug);
        fileToEntry.set(p.fileName, entry);
        fileToEntry.set(p.fileName.replace(/_/g, " "), entry);
        hosted++;
      } catch (err) {
        entry.placeholder = true;
        entry.reason = `download failed: ${err.message}`;
        placeholders++;
      }
    } else {
      if (takenBy) entry.reason = `same file already used by ${takenBy}`;
      entry.placeholder = true;
      placeholders++;
      if (p.fileName && !fileToEntry.has(p.fileName)) {
        // Still map the remote file to the placeholder so stray copies don't stay hotlinked.
        fileToEntry.set(p.fileName, entry);
      }
    }
    manifest.push(entry);
    if (n % 25 === 0) process.stdout.write(`\r  images ${n}/${judged.length} hosted ${hosted} placeholder ${placeholders}`);
  }
  process.stdout.write("\n");

  // Profiles that lost a shared file still need their filename mapped to THEIR placeholder,
  // while the winner keeps the real image. Rebuild the filename map from winners only,
  // and rewrite each profile page explicitly.
  const winnerByFile = new Map();
  for (const e of manifest) {
    if (!e.placeholder && e.sourceFile) winnerByFile.set(e.sourceFile, e);
  }

  fs.writeFileSync(MANIFEST, JSON.stringify({
    generated: new Date().toISOString(),
    hosted,
    placeholders,
    images: manifest,
  }, null, 2));

  const byProfile = new Map(manifest.map((e) => [`${e.group}/${e.slug}`, e]));
  function pageProfile(file) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    let m = rel.match(/^breeds\/([^/]+)\/([^/]+)\.html$/);
    if (m && byProfile.has(`${m[1]}/${m[2]}`)) return byProfile.get(`${m[1]}/${m[2]}`);
    m = rel.match(/^commercial\/([^/]+)\/([^/]+)\//);
    if (m && byProfile.has(`${m[1]}/${m[2]}`)) return byProfile.get(`${m[1]}/${m[2]}`);
    return null;
  }
  function localFor(fileName, pageEntry, width) {
    const winner = fileName && winnerByFile.get(fileName);
    // A species page may only display a photo that passed for THAT species.
    if (pageEntry) {
      if (pageEntry.placeholder || pageEntry.sourceFile !== fileName) return "/animal-placeholder.svg";
      if (width && width <= 320) return pageEntry.thumb;
      return pageEntry.main;
    }
    if (!winner) return "/animal-placeholder.svg";
    if (width && width <= 320) return winner.thumb;
    return winner.main;
  }

  console.log("Rewriting HTML references…");
  const htmlFiles = walk(ROOT);
  let touched = 0;
  for (const file of htmlFiles) {
    let html = fs.readFileSync(file, "utf8");
    if (!html.includes("upload.wikimedia.org") && !html.includes("<img")) continue;
    const before = html;
    const pageEntry = pageProfile(file);
    html = html.replace(/https:\/\/upload\.wikimedia\.org\/[^"'\s)]+/g, (url) => {
      const name = decodeFileName(url);
      const width = Number((url.match(/\/(\d+)px-/) || [])[1] || 0);
      return localFor(name, pageEntry, width);
    });
    html = fixImgTags(html);
    if (pageEntry && /\/breeds\//.test(file)) {
      html = html.replace(/<img\b[^>]*src="\/(?:images\/breeds\/[^"]+|animal-placeholder\.svg)"[^>]*>/i, buildImgTag(pageEntry));
      const og = pageEntry.placeholder
        ? "https://petcarehelperai.com/animal-placeholder.svg"
        : `https://petcarehelperai.com${pageEntry.main}`;
      if (/property="og:image"/.test(html)) {
        html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${og}" />`);
      }
    }
    if (pageEntry && /\/commercial\//.test(file)) {
      const tag = buildImgTag(pageEntry);
      const og = pageEntry.placeholder
        ? "https://petcarehelperai.com/animal-placeholder.svg"
        : `https://petcarehelperai.com${pageEntry.main}`;
      html = html.replace(/<img\b[^>]*src="\/(?:images\/breeds\/[^"]+|animal-placeholder\.svg)"[^>]*>/i, tag);
      if (/property="og:image"/.test(html)) {
        html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${og}" />`);
      }
    }
    if (html !== before) {
      fs.writeFileSync(file, html);
      touched++;
    }
  }
  console.log(`  html files updated: ${touched}`);
  console.log(`Hosted ${hosted}, placeholders ${placeholders}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
