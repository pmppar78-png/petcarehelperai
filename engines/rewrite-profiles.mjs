#!/usr/bin/env node
/**
 * Replace breed and species profile bodies with original care guides.
 * Keeps the four finished reptile profiles, affiliate destinations, and verified images.
 */
import fs from "fs";
import path from "path";
import { composeProfile, faqSchema } from "./profile-compose.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const GOLD = new Set([
  "reptiles/leopard-gecko",
  "reptiles/bearded-dragon",
  "reptiles/ball-python",
  "reptiles/corn-snake",
]);
const ORDER = ["reptiles", "amphibians", "birds", "small-animals", "fish", "marine-fish", "cats", "dogs"];

function strip(s) {
  return String(s || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function words(html) {
  return strip(html).split(/\s+/).filter(Boolean).length;
}

function factsFrom(html) {
  const facts = {};
  const re = /<tr>\s*<t[dh][^>]*>([\s\S]*?)<\/t[dh]>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  let m;
  while ((m = re.exec(html))) {
    const k = strip(m[1]);
    const v = strip(m[2]);
    if (!k || !v || k.length > 80 || v.length > 240) continue;
    if (/^attribute$|^item$|^details$/i.test(k)) continue;
    if (!facts[k]) facts[k] = v;
  }
  return facts;
}

function affiliatesFrom(html) {
  return [...html.matchAll(/<div class="affiliate-callout">[\s\S]*?<\/div>/g)].map((m) => m[0]);
}

function loadManifest() {
  const p = path.join(ROOT, "data", "image-manifest.json");
  if (!fs.existsSync(p)) return new Map();
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  return new Map(data.images.map((e) => [`${e.group}/${e.slug}`, e]));
}

function imageHtml(entry) {
  if (!entry || entry.placeholder) {
    return `<img src="/animal-placeholder.svg" alt="Photo coming soon" width="800" height="600" loading="lazy" decoding="async">`;
  }
  const alt = entry.alt.replace(/"/g, "&quot;");
  return `<img src="${entry.main}" srcset="${entry.thumb} 250w, ${entry.main} 960w" sizes="(max-width: 640px) 92vw, 960px" alt="${alt}" width="${entry.width}" height="${entry.height}" loading="lazy" decoding="async">`;
}

function listProfiles() {
  const all = [];
  for (const group of ORDER) {
    const dir = path.join(ROOT, "breeds", group);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".html")).sort()) {
      all.push({ group, slug: file.replace(/\.html$/, ""), file: path.join(dir, file) });
    }
  }
  return all;
}

function injectVetLink(html, name) {
  if (html.includes("/vet/checker")) return html;
  const blurb = `<p>If you are deciding how fast to go, use the <a href="/vet/checker">when-to-see-a-vet checker</a>. It sorts urgent, soon, and monitor, and it is not a diagnosis.</p>`;
  if (/When to See a Vet/.test(html)) {
    return html.replace(/(<h2>When to See a Vet: Red Flags<\/h2>)/, `$1\n${blurb}`);
  }
  return html.replace(/<h2>When to See (?:a |the )?Vet[^<]*<\/h2>/i, (h) => `${h}\n${blurb}`);
}

function upsertFaq(html, faqs) {
  const block = `<script type="application/ld+json">${faqSchema(faqs)}</script>`;
  if (/FAQPage/.test(html)) {
    return html.replace(/<script type="application\/ld\+json">\s*\{[\s\S]*?"@type"\s*:\s*"FAQPage"[\s\S]*?<\/script>/, block);
  }
  return html.replace("</head>", `${block}\n</head>`);
}

function setMeta(html, name, description) {
  const d = description.replace(/"/g, "&quot;");
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${d}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${d}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${d}" />`);
  html = html.replace(/"dateModified"\s*:\s*"[^"]*"/g, `"dateModified": "2026-10-22"`);
  return html;
}

function main() {
  const manifest = loadManifest();
  const profiles = listProfiles();
  const byKey = new Map(profiles.map((p) => [`${p.group}/${p.slug}`, p]));
  let rewritten = 0;
  let gold = 0;
  let under = 0;
  const samples = [];

  for (const p of profiles) {
    const key = `${p.group}/${p.slug}`;
    let html = fs.readFileSync(p.file, "utf8");
    const name = strip((html.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || p.slug);
    if (GOLD.has(key)) {
      html = injectVetLink(html, name);
      html = html.replace(/<section class="owner-insight"[\s\S]*?<\/section>\s*/g, "");
      html = html.replace(/<section class="vet-care"[\s\S]*?<\/section>\s*/g, "");
      fs.writeFileSync(p.file, html);
      gold++;
      continue;
    }
    const facts = factsFrom(html);
    if (!facts.Lifespan && !facts.Size) facts.Lifespan = facts.Lifespan || "see a vet or a breed club for the current figure";
    const siblings = profiles.filter((o) => o.group === p.group && o.slug !== p.slug);
    const start = [...key].reduce((a, c) => a + c.charCodeAt(0), 0) % Math.max(siblings.length, 1);
    const related = [0, 1, 2].map((i) => siblings[(start + i * 7) % siblings.length]).filter(Boolean).map((s) => {
      const h = fs.readFileSync(s.file, "utf8");
      return { group: s.group, slug: s.slug, name: strip((h.match(/<h1>([\s\S]*?)<\/h1>/) || [, s.slug])[1]) };
    });
    const entry = manifest.get(key);
    const sci = facts["Scientific Name"] || entry?.sci || "";
    const composed = composeProfile({
      group: p.group,
      slug: p.slug,
      name,
      sci,
      facts,
      related,
      affiliates: affiliatesFrom(html),
      imageHtml: imageHtml(entry),
      imageCredit: entry && !entry.placeholder ? `${entry.author} — ${entry.license}` : "",
    });
    const wc = words(composed.html);
    if (wc < 1200) under++;
    html = html.replace(/<article class="guide-content">[\s\S]*?<\/article>/, `<article class="guide-content">\n${composed.html}\n    </article>`);
    html = html.replace(/<section class="owner-insight"[\s\S]*?<\/section>\s*/g, "");
    html = html.replace(/<section class="vet-care"[\s\S]*?<\/section>\s*/g, "");
    html = upsertFaq(html, composed.faqs);
    const desc = `${name}: origin, adult size, temperament, diet, housing, health problems, U.S. costs, and when to see a vet.`;
    html = setMeta(html, name, desc);
    if (entry && /property="og:image"/.test(html)) {
      const og = entry.placeholder ? "https://petcarehelperai.com/animal-placeholder.svg" : `https://petcarehelperai.com${entry.main}`;
      html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${og}" />`);
    }
    fs.writeFileSync(p.file, html);
    rewritten++;
    if (samples.length < 6) samples.push({ key, wc });
  }
  const report = { rewritten, goldKept: gold, under1200: under, samples, total: profiles.length };
  fs.writeFileSync(path.join(ROOT, "data", "profile-rewrite-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main();
