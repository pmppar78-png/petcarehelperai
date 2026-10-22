import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const HOST = "https://petcarehelperai.com";

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join("/");
}
function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "test-results"].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}
function norm(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/[^a-z0-9']+/gi, " ")
    .toLowerCase()
    .trim();
}
function shingles(text) {
  const w = text.split(/\s+/).filter(Boolean);
  const s = new Set();
  for (let i = 0; i + 4 < w.length; i++) s.add(w.slice(i, i + 5).join(" "));
  return s;
}
function contain(a, b) {
  if (!a.size || !b.size) return 0;
  const [s, l] = a.size < b.size ? [a, b] : [b, a];
  let n = 0;
  for (const x of s) if (l.has(x)) n++;
  return n / s.size;
}
function article(html) {
  const m = html.match(/<article[\s\S]*?<\/article>/i);
  return m ? m[0] : html;
}
function load(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}
function pair(a, b) {
  const ha = load(a);
  const hb = load(b);
  return {
    a, b,
    full: Number(contain(shingles(norm(ha)), shingles(norm(hb))).toFixed(3)),
    article: Number(contain(shingles(norm(article(ha))), shingles(norm(article(hb)))).toFixed(3)),
  };
}

const assets = new Set(walk(ROOT).map(rel));
const htmlFiles = [...assets].filter((f) => f.endsWith(".html"));
const broken = new Map();
let missingImg = 0;
const missingSamples = [];
for (const file of htmlFiles) {
  const html = load(file);
  const dir = path.posix.dirname(file);
  for (const m of html.matchAll(/(?:href|src)="([^"]*)"/g)) {
    let url = m[1];
    if (!url || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("javascript:") || url.startsWith("data:")) continue;
    if (/^https?:\/\//i.test(url)) continue;
    url = url.split("#")[0].split("?")[0];
    if (!url || url === "/") url = "index.html";
    let target = url.startsWith("/") ? url.slice(1) : path.posix.normalize(path.posix.join(dir === "." ? "" : dir, url));
    if (target === "" || target === ".") target = "index.html";
    if (target.endsWith("/")) target += "index.html";
    const candidates = [target];
    if (!path.posix.extname(target)) candidates.push(`${target}.html`, `${target}/index.html`);
    if (candidates.some((c) => assets.has(c))) continue;
    const isImg = m[0].startsWith("src=") || /\.(png|jpe?g|webp|svg|gif|ico)$/i.test(url);
    if (isImg) {
      missingImg++;
      if (missingSamples.length < 15) missingSamples.push(`${file} -> ${m[1]}`);
    } else {
      const key = `${m[1]}`;
      const rec = broken.get(key) || { n: 0, from: file };
      rec.n++;
      broken.set(key, rec);
    }
  }
}
const brokenSorted = [...broken.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 40);

function urls(file) {
  const xml = fs.readFileSync(path.join(ROOT, file), "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
function urlToFile(loc) {
  let p = loc.replace(HOST, "");
  if (p.endsWith(".html")) p = p.slice(0, -5);
  if (!p || p === "/") return "index.html";
  if (p.endsWith("/")) return `${p.slice(1)}index.html`;
  return `${p.slice(1)}.html`;
}
const indexed = [...new Set([...urls("sitemap-pages.xml"), ...urls("sitemap-breeds.xml"), ...urls("sitemap-guides.xml")].map(urlToFile))].filter((f) => assets.has(f));
const short = [];
for (const f of indexed) {
  const text = norm(load(f));
  const wc = text.split(/\s+/).length;
  if (wc < 900) short.push({ f, wc, set: shingles(text) });
}
let shortWorst = 0;
let shortPair = null;
let shortOver = 0;
for (let i = 0; i < short.length; i++) {
  for (let j = i + 1; j < short.length; j++) {
    const c = contain(short[i].set, short[j].set);
    if (c > shortWorst) {
      shortWorst = c;
      shortPair = [short[i].f, short[j].f, short[i].wc, short[j].wc, Number(c.toFixed(3))];
    }
    if (c > 0.2) shortOver++;
  }
}

const samples = [
  pair("breeds/cats/chinchilla.html", "breeds/small-animals/chinchilla.html"),
  pair("breeds/dogs/american-eskimo.html", "breeds/dogs/american-eskimo-dog.html"),
  pair("breeds/dogs/labrador-retriever.html", "breeds/dogs/golden-retriever.html"),
  pair("locations/akron.html", "locations/albuquerque.html"),
  pair("guides/abyssinian-health-guide.html", "guides/maine-coon-health-guide.html"),
  pair("index.html", "terms-of-service.html"),
  pair("vet/symptoms/dog-vomiting.html", "vet/symptoms/cat-vomiting.html"),
  pair("vet/index.html", "vet/checker.html"),
  pair("breeds/dog-breeds.html", "breeds/cat-breeds.html"),
  pair("breeds/amphibian-breeds.html", "breeds/marine-fish-breeds.html"),
];

const paras = new Map();
for (const dir of ["guides", "commercial"]) {
  const files = walk(path.join(ROOT, dir)).filter((f) => f.endsWith(".html"));
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    const main = html.match(/<main[\s\S]*?<\/main>/i);
    if (!main) continue;
    for (const m of main[0].matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)) {
      const n = m[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
      if (n.length < 80) continue;
      paras.set(n, (paras.get(n) || 0) + 1);
    }
  }
}
let maxPara = 0;
let paras50 = 0;
for (const c of paras.values()) {
  if (c > maxPara) maxPara = c;
  if (c >= 50) paras50++;
}

console.log(JSON.stringify({
  brokenTargets: brokenSorted.map(([href, rec]) => ({ href, n: rec.n, example: rec.from })),
  brokenTargetCount: broken.size,
  missingImg,
  missingSamples,
  indexed: indexed.length,
  shortPages: short.length,
  shortWorst: shortPair,
  shortOver,
  samples,
  duplicateParagraphsAtLeast50: paras50,
  maxRepeatedParagraph: maxPara,
}, null, 2));
