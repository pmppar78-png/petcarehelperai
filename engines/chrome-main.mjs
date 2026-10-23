/**
 * Title, meta description, headings, JSON-LD headlines, image alts, and
 * link text against origin/main.
 *
 * Every origin heading must remain, at the same level, with the same text.
 * A completed page whose visible article differs from origin/main may add
 * headings. It may not drop or rewrite one. Title, meta description,
 * Open Graph title, Twitter title, and JSON-LD headline/name still have to
 * match origin/main on every page.
 *
 * The only exemption is a reviewed sentence row in
 * data/preservation-replacements.json: when an origin heading is that
 * row's original sentence, the same-level heading may be the replacement
 * text instead. There is no heading-exemption list.
 */
import fs from "fs";
import path from "path";
import { FROM_CURRENT, resolveOriginBase } from "./origin-base.mjs";

export function decode(text) {
  return String(text)
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;|&quot;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function norm(text) {
  return decode(text).toLowerCase().replace(/[.!?]+$/g, "").replace(/\s+/g, " ").trim();
}

export function escapeText(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function attr(tag, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i");
  const match = tag.match(re);
  return match ? decode(match[2]) : "";
}

export function stripNotices(html) {
  return html.replace(
    /<(p|div|aside|section)\b[^>]*\bclass\s*=\s*(["'])[^"']*\b(?:affiliate-disclosure|medical-disclaimer)\b[^"']*\2[^>]*>[\s\S]*?<\/\1>/gi,
    " ",
  );
}

function tagText(html, re) {
  const match = html.match(re);
  return match ? decode(match[1]) : "";
}

export function headingsOf(html) {
  const out = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = re.exec(html))) {
    const text = decode(match[2].replace(/<[^>]+>/g, " "));
    if (text) out.push({ level: match[1], text });
  }
  return out;
}

export function imagesOf(html) {
  const out = [];
  const re = /<img\b[^>]*>/gi;
  let match;
  while ((match = re.exec(html))) {
    out.push({ src: attr(match[0], "src"), alt: attr(match[0], "alt"), tag: match[0] });
  }
  return out;
}

export function linksOf(html) {
  const out = [];
  const source = stripNotices(html);
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(source))) {
    const text = decode(match[2].replace(/<[^>]+>/g, " "));
    if (!text) continue;
    const href = attr(`<a ${match[1]}>`, "href");
    out.push({ href, text });
  }
  return out;
}

function jsonNodes(html) {
  const headlines = [];
  const names = [];
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) {
    let data;
    try {
      data = JSON.parse(match[1]);
    } catch {
      headlines.push("INVALID JSON-LD");
      continue;
    }
    const stack = [data];
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== "object") continue;
      if (Array.isArray(node)) {
        stack.push(...node);
        continue;
      }
      const types = [].concat(node["@type"] || []);
      if (typeof node.headline === "string") headlines.push(decode(node.headline));
      if (
        typeof node.name === "string" &&
        types.some((type) => /Article|WebPage|BlogPosting|NewsArticle|MedicalWebPage/.test(String(type)))
      ) {
        names.push(decode(node.name));
      }
      for (const value of Object.values(node)) {
        if (value && typeof value === "object") stack.push(value);
      }
    }
  }
  return { headlines, names };
}

export function chromeOf(html) {
  const twitter = html.match(/<meta\b[^>]*name\s*=\s*["']twitter:title["'][^>]*>/i);
  const og = html.match(/<meta\b[^>]*property\s*=\s*["']og:title["'][^>]*>/i);
  const meta = html.match(/<meta\b[^>]*name\s*=\s*["']description["'][^>]*>/i);
  return {
    title: tagText(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    description: meta ? attr(meta[0], "content") : "",
    og: og ? attr(og[0], "content") : "",
    twitter: twitter ? attr(twitter[0], "content") : "",
    headings: headingsOf(html),
    images: imagesOf(html).map(({ src, alt }) => ({ src, alt })),
    links: linksOf(html),
    json: jsonNodes(html),
  };
}

export function visibleBody(html) {
  return decode(
    stripNotices(html)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function sameList(a, b) {
  return a.length === b.length && a.every((item, i) => item === b[i]);
}

function expectedHeading(head, rows) {
  for (const row of rows) {
    if (norm(row.original) === norm(head.text)) return row.replacement;
  }
  return head.text;
}

export function compareChrome(originHtml, currentHtml, rows = []) {
  const origin = chromeOf(originHtml);
  const current = chromeOf(currentHtml);
  const problems = [];
  if (origin.title !== current.title) problems.push(`title: ${JSON.stringify(current.title)} != ${JSON.stringify(origin.title)}`);
  if (origin.description !== current.description) problems.push("meta description differs");
  if (origin.og !== current.og) problems.push("og:title differs");
  if (origin.twitter !== current.twitter) problems.push("twitter:title differs");
  if (!sameList(origin.json.headlines, current.json.headlines)) problems.push("JSON-LD headline differs");
  if (!sameList(origin.json.names, current.json.names)) problems.push("JSON-LD name differs");

  const used = new Array(current.headings.length).fill(false);
  let cursor = 0;
  for (const head of origin.headings) {
    const expect = norm(expectedHeading(head, rows));
    let found = -1;
    for (let i = cursor; i < current.headings.length; i++) {
      if (used[i]) continue;
      if (current.headings[i].level === head.level && norm(current.headings[i].text) === expect) {
        found = i;
        break;
      }
    }
    if (found < 0) {
      problems.push(`missing h${head.level}: ${head.text.slice(0, 140)}`);
      continue;
    }
    used[found] = true;
    cursor = found + 1;
  }
  const originH1 = origin.headings.find((head) => head.level === "1");
  const currentH1 = current.headings.find((head) => head.level === "1");
  if (originH1) {
    const expect = norm(expectedHeading(originH1, rows));
    if (!currentH1 || norm(currentH1.text) !== expect) problems.push("H1 differs");
  }
  const extras = current.headings.filter((_, i) => !used[i]);
  const sameBody = visibleBody(originHtml) === visibleBody(currentHtml);
  if (sameBody && extras.length) problems.push(`extra headings on an unchanged page: ${extras.length}`);

  if (sameBody) {
    if (!sameList(origin.images.map((img) => `${img.src}\n${img.alt}`), current.images.map((img) => `${img.src}\n${img.alt}`))) {
      problems.push("image alt differs");
    }
    if (!sameList(origin.links.map((link) => link.text), current.links.map((link) => link.text))) {
      problems.push("link text differs");
    }
  } else {
    const altsBySrc = new Map(current.images.filter((img) => img.src).map((img) => [img.src, img.alt]));
    for (const img of origin.images) {
      if (!img.src) continue;
      if (!altsBySrc.has(img.src) || altsBySrc.get(img.src) !== img.alt) {
        problems.push(`image alt differs for ${img.src}`);
        break;
      }
    }
    let linkAt = 0;
    for (const link of origin.links) {
      let found = -1;
      for (let i = linkAt; i < current.links.length; i++) {
        if (current.links[i].text === link.text) {
          found = i;
          break;
        }
      }
      if (found < 0) {
        problems.push(`missing link text: ${link.text.slice(0, 120)}`);
        break;
      }
      linkAt = found + 1;
    }
  }
  return { ok: !problems.length, problems, sameBody, extras: extras.length };
}

export function loadSentenceRows(root) {
  const rows = JSON.parse(fs.readFileSync(path.join(root, "data/preservation-replacements.json"), "utf8"));
  const byPage = new Map();
  for (const row of rows) {
    if (row.kind) continue;
    if (!byPage.has(row.page)) byPage.set(row.page, []);
    byPage.get(row.page).push(row);
  }
  return byPage;
}

export function walkHtml(root) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (["node_modules", ".git", "engines", "audit"].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith(".html")) out.push(full);
    }
  }
  return out;
}

export function assertChrome(root, base) {
  const rows = loadSentenceRows(root);
  const problems = [];
  let pages = 0;
  for (const file of walkHtml(root)) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    const originRel = FROM_CURRENT[rel] || rel;
    const originPath = path.join(base, originRel);
    if (!fs.existsSync(originPath)) continue;
    pages += 1;
    const result = compareChrome(
      fs.readFileSync(originPath, "utf8"),
      fs.readFileSync(file, "utf8"),
      rows.get(rel) || [],
    );
    if (!result.ok) problems.push(`${rel}: ${result.problems.slice(0, 4).join("; ")}`);
  }
  return { pages, problems };
}

function main() {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const base = resolveOriginBase({ root });
  const { pages, problems } = assertChrome(root, base);
  if (problems.length) {
    console.error(`chrome check failed (${problems.length} pages)`);
    for (const line of problems.slice(0, 40)) console.error(line);
    process.exit(1);
  }
  console.log(`chrome check ok (${pages} html files)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();
