/**
 * Credits, vet pages, boilerplate removal, location and duplicate-guide
 * rewrites, hub filters, nav, sitemaps, and a link/overlap audit.
 */
import fs from "fs";
import path from "path";
import { pageShell } from "./page-shell.mjs";
import { HUB_NOTES } from "./hub-notes.mjs";
import { symptoms, symptomHead, hubBody, checkerBody, creditsIntro } from "./vet-content.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const HOST = "https://petcarehelperai.com";

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".git" || ent.name === "test-results") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

function normText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;|&rsquo;|&#39;|&apos;/g, "'")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function dropBoilerSections(html) {
  return html
    .replace(/<section class="owner-insight"[\s\S]*?<\/section>/gi, "")
    .replace(/<section class="vet-care"[\s\S]*?<\/section>/gi, "")
    .replace(/<section class="sources-references-section"[\s\S]*?<\/section>/gi, "");
}

function addNav(html) {
  if (html.includes('href="/vet/"')) return html;
  const vet = '\n        <li><a href="/vet/" class="nav-link">Vet Help</a></li>';
  html = html.replace('<li><a href="/chat" class="nav-link">AI Pet Help</a></li>', `<li><a href="/chat" class="nav-link">AI Pet Help</a></li>${vet}`);
  html = html.replace('<li><a href="/chat" class="nav-link active">AI Pet Help</a></li>', `<li><a href="/chat" class="nav-link active">AI Pet Help</a></li>${vet}`);
  if (html.includes("<a href=\"/about\">About</a>") && !html.includes('href="/image-credits"')) {
    html = html.replace(
      "<a href=\"/about\">About</a>",
      '<a href="/vet/">Vet Help</a> &middot; <a href="/vet/checker">When to See a Vet</a> &middot; <a href="/image-credits">Image Credits</a> &middot; <a href="/about">About</a>'
    );
  }
  html = html.replace(/\s*<link rel="dns-prefetch" href="https:\/\/upload\.wikimedia\.org">\s*/g, "\n");
  html = html.replace(/\s*<link rel="preconnect" href="https:\/\/upload\.wikimedia\.org"[^>]*>\s*/g, "\n");
  return html;
}

function stripOldFilter(html) {
  const marker = "const filterBtns = document.querySelectorAll('.filter-btn');";
  const start = html.indexOf(marker);
  if (start < 0) return html;
  const forEach = html.indexOf("filterBtns.forEach", start);
  if (forEach < 0) return html;
  let i = html.indexOf("{", forEach);
  let depth = 0;
  for (; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      depth--;
      if (depth === 0) {
        const after = html.indexOf(";", i);
        return html.slice(0, start) + html.slice(after + 1);
      }
    }
  }
  return html;
}

const HUB_SCRIPT = `
<script>
document.addEventListener('DOMContentLoaded', function () {
  const root = document.getElementById('hub-tools');
  if (!root) return;
  const cards = [...document.querySelectorAll('.breed-card, .species-card')];
  const search = root.querySelector('.hub-search');
  const life = root.querySelector('.hub-life');
  const beginner = root.querySelector('.hub-beginner');
  const sizeBtns = [...document.querySelectorAll('.filter-btn')];
  const countEl = root.querySelector('.hub-count');
  let size = 'all';
  const active = sizeBtns.find((b) => b.classList.contains('active'));
  if (active && active.dataset.filter) size = active.dataset.filter;
  function apply() {
    const q = (search && search.value || '').trim().toLowerCase();
    const lifeV = life ? life.value : 'all';
    const beg = !!(beginner && beginner.checked);
    cards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      const cardSize = card.dataset.size || '';
      const cardType = card.dataset.type || '';
      const okS = size === 'all' || cardSize === size || cardType === size || (size === 'large' && cardSize === 'giant');
      const okL = lifeV === 'all' || card.dataset.life === lifeV;
      const okB = !beg || card.dataset.beginner === 'yes';
      const okQ = !q || text.includes(q);
      card.style.display = (okS && okL && okB && okQ) ? '' : 'none';
    });
    document.querySelectorAll('.letter-section, .category-section, .subcategory').forEach((sec) => {
      const inner = [...sec.querySelectorAll('.breed-card, .species-card')];
      if (!inner.length) return;
      sec.style.display = inner.some((c) => c.style.display !== 'none') ? '' : 'none';
    });
    if (countEl) {
      const shown = cards.filter((c) => c.style.display !== 'none').length;
      countEl.textContent = shown + ' of ' + cards.length + ' shown';
    }
  }
  sizeBtns.forEach((btn) => btn.addEventListener('click', function () {
    sizeBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    size = btn.dataset.filter || 'all';
    apply();
  }));
  if (search) search.addEventListener('input', apply);
  if (life) life.addEventListener('change', apply);
  if (beginner) beginner.addEventListener('change', apply);
  apply();
});
</script>`;

const HUB_TOOLS = `
<div class="hub-tools" id="hub-tools">
  <label>Search
    <input type="search" class="hub-search" placeholder="Search this directory" aria-label="Search this directory">
  </label>
  <label>Lifespan
    <select class="hub-life" aria-label="Filter by lifespan">
      <option value="all">Any lifespan</option>
      <option value="short">Under 8 years</option>
      <option value="medium">8 to 12 years</option>
      <option value="long">Over 12 years</option>
    </select>
  </label>
  <label class="hub-beg-label"><input type="checkbox" class="hub-beginner"> Beginner-friendly</label>
  <p class="hub-count" aria-live="polite"></p>
</div>`;

function lifeBucket(text) {
  const m = String(text || "").match(/(\d+)/);
  if (!m) return "unknown";
  const n = Number(m[1]);
  if (n < 8) return "short";
  if (n <= 12) return "medium";
  return "long";
}

function sizeBucket(text) {
  const t = String(text || "").toLowerCase();
  if (!t) return "unknown";
  if (t.includes("giant")) return "giant";
  if (t.includes("small") || t.includes("toy") || /\bmini/.test(t)) return "small";
  if (t.includes("large")) return "large";
  if (t.includes("medium")) return "medium";
  return "unknown";
}

function loadBreedMeta() {
  const map = new Map();
  const groups = fs.readdirSync(path.join(ROOT, "breeds"), { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const g of groups) {
    const dir = path.join(ROOT, "breeds", g.name);
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".html")) continue;
      const html = fs.readFileSync(path.join(dir, file), "utf8");
      const size = (html.match(/<td>\s*Size\s*<\/td>\s*<td>([^<]+)/i) || [])[1] || "";
      const life = (html.match(/<td>\s*Lifespan\s*<\/td>\s*<td>([^<]+)/i) || [])[1] || "";
      let beginner = "no";
      if (/suits careful beginners/i.test(html) || /beginner-friendly/i.test(html) || /perfect for beginners/i.test(html) || /good first/i.test(html)) beginner = "yes";
      if (/suits experienced keepers/i.test(html) || /suits prepared keepers/i.test(html)) beginner = "no";
      const slug = file.replace(/\.html$/, "");
      map.set(`/breeds/${g.name}/${slug}`, { size: sizeBucket(size), life: lifeBucket(life), beginner });
    }
  }
  return map;
}

function stampCards(html, meta) {
  return html.replace(/<a\b[^>]*class="[^"]*(?:breed-card|species-card)[^"]*"[^>]*>/g, (tag) => {
    const href = /href="([^"]+)"/.exec(tag);
    if (!href) return tag;
    const key = href[1].replace(/\.html$/, "").replace(/\/$/, "");
    const info = meta.get(key) || { size: "unknown", life: "unknown", beginner: "no" };
    let t = tag.replace(/\sdata-life="[^"]*"/, "").replace(/\sdata-beginner="[^"]*"/, "");
    if (info.size !== "unknown") {
      if (/data-size=/.test(t)) t = t.replace(/data-size="[^"]*"/, `data-size="${info.size}"`);
      else t = t.replace("<a ", `<a data-size="${info.size}" `);
    }
    t = t.replace("<a ", `<a data-life="${info.life}" data-beginner="${info.beginner}" `);
    return t;
  });
}

function shouldStrip(fileRel) {
  return fileRel.startsWith("guides/") || fileRel.startsWith("commercial/") || fileRel.startsWith("locations/") || /^breeds\/[^/]+-breeds\.html$/.test(fileRel);
}

function collectRepeat(files) {
  const pCount = new Map();
  const liCount = new Map();
  const store = new Map();
  for (const file of files) {
    const r = rel(file);
    if (!shouldStrip(r)) continue;
    const html = fs.readFileSync(file, "utf8");
    store.set(file, html);
    const main = html.match(/<main[\s\S]*?<\/main>/i);
    if (!main) continue;
    for (const m of main[0].matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)) {
      const n = normText(m[0]);
      if (n.length >= 60) pCount.set(n, (pCount.get(n) || 0) + 1);
    }
    for (const m of main[0].matchAll(/<li\b[^>]*>[\s\S]*?<\/li>/gi)) {
      const n = normText(m[0]);
      if (n.length >= 40) liCount.set(n, (liCount.get(n) || 0) + 1);
    }
  }
  const badP = new Set([...pCount.entries()].filter(([, c]) => c >= 8).map(([n]) => n));
  const badLi = new Set([...liCount.entries()].filter(([, c]) => c >= 8).map(([n]) => n));
  let maxP = 0;
  for (const c of pCount.values()) if (c > maxP) maxP = c;
  return { store, badP, badLi, pCount, liCount, maxP, repeatedP: badP.size, repeatedLi: badLi.size };
}

function stripMain(html, badP, badLi) {
  return html.replace(/<main[\s\S]*?<\/main>/i, (main) => {
    main = main.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (p) => (badP.has(normText(p)) ? "" : p));
    main = main.replace(/<li\b[^>]*>[\s\S]*?<\/li>/gi, (li) => (badLi.has(normText(li)) ? "" : li));
    return main;
  });
}

function wildlifeWords(article) {
  const block = article.match(/Local Wildlife[\s\S]*?<\/ul>/i);
  if (!block) return [];
  const words = [];
  for (const li of block[0].matchAll(/<li>([\s\S]*?)<\/li>/gi)) {
    const text = normText(li[1]).replace(/[^a-z0-9\s-]/g, "");
    const word = (text.split(/\s+/)[0] || "").replace(/-/g, "");
    if (word.length >= 3 && word.length <= 18) words.push(word);
  }
  return [...new Set(words)].slice(0, 8);
}

function sponsoredLinks(article) {
  const callouts = article.match(/<div class="affiliate-callout"[\s\S]*?<\/div>/gi) || [];
  const out = [];
  for (const c of callouts) {
    const sponsored = /rel="[^"]*sponsored/i.test(c);
    for (const h of c.matchAll(/href="(https?:\/\/[^"]+)"/g)) out.push({ href: h[1], sponsored });
  }
  return out.slice(0, 4);
}

function safeIntros(article, slug) {
  const words = new Set(slug.split(/[^a-z0-9]+/i).filter((w) => w.length > 2).map((w) => w.toLowerCase()));
  const kept = [];
  for (const m of article.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)) {
    const tokens = normText(m[0]).split(/\s+/).filter(Boolean);
    if (tokens.length < 8 || tokens.length > 70) continue;
    let ok = true;
    for (let i = 0; i + 4 < tokens.length; i++) {
      if (!tokens.slice(i, i + 5).some((w) => words.has(w))) { ok = false; break; }
    }
    if (ok) kept.push(m[0]);
    if (kept.length === 2) break;
  }
  return kept;
}

function rewriteArticle(html) {
  // The care-line rewriter was removed. It replaced real articles with
  // "The {Token} {three-word line}." sentences. engines/check-care-lines.mjs
  // fails the build if that pattern returns.
  return html;
}

function writePage(file, { title, description, canonical, active, crumb, body, extraHead = "" }) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const html = pageShell({ title, description, canonical, active, breadcrumb: crumb, body, extraHead });
  fs.writeFileSync(file, html);
}

function buildCredits() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "data/image-manifest.json"), "utf8"));
  const hosted = manifest.images.filter((i) => !i.placeholder);
  const missing = manifest.images.filter((i) => i.placeholder);
  const groups = ["reptiles", "amphibians", "birds", "small-animals", "fish", "marine-fish", "cats", "dogs"];
  const sections = groups.map((g) => {
    const rows = hosted.filter((i) => i.group === g).sort((a, b) => a.name.localeCompare(b.name));
    if (!rows.length) return "";
    const body = rows.map((i) => `<tr>
      <td><a href="/breeds/${esc(i.group)}/${esc(i.slug)}">${esc(i.name)}</a></td>
      <td><img src="${esc(i.thumb)}" alt="" width="${i.thumbWidth || 250}" height="${i.thumbHeight || 160}" loading="lazy" decoding="async"></td>
      <td>${esc(i.author || "Commons contributor")}</td>
      <td><a href="${esc(i.licenseUrl || i.commonsUrl)}">${esc(i.license || "See Commons")}</a></td>
      <td><a href="${esc(i.commonsUrl)}">Commons file</a></td>
    </tr>`).join("\n");
    return `<h2>${esc(g.replace("-", " "))}</h2>
    <div class="credits-wrap"><table class="credits-table"><thead><tr><th>Animal</th><th>Thumbnail</th><th>Author</th><th>License</th><th>Source</th></tr></thead><tbody>${body}</tbody></table></div>`;
  }).join("\n");
  const missingList = missing.sort((a, b) => a.name.localeCompare(b.name)).map((i) => `<li><a href="/breeds/${esc(i.group)}/${esc(i.slug)}">${esc(i.name)}</a></li>`).join("");
  const body = `${creditsIntro(hosted.length, missing.length)}
${sections}
<h2>Photo coming soon</h2>
<p>These profiles use the neutral placeholder. A Commons file was missing, was not freely licensed, or depicted a different animal.</p>
<ul class="credits-missing">${missingList}</ul>`;
  writePage(path.join(ROOT, "image-credits.html"), {
    title: "Image credits",
    description: "Author and license credits for self-hosted breed and species photographs from Wikimedia Commons.",
    canonical: `${HOST}/image-credits`,
    active: "",
    crumb: `<a href="/">Home</a> <span>&rsaquo;</span> Image credits`,
    body,
  });
  return { hosted: hosted.length, placeholders: missing.length };
}

function buildVet() {
  writePage(path.join(ROOT, "vet/index.html"), {
    title: "Vet help",
    description: "Symptom guides for dogs, cats, and exotic pets, plus a when-to-see-a-vet checker with emergency guidance.",
    canonical: `${HOST}/vet/`,
    active: "vet",
    crumb: `<a href="/">Home</a> <span>&rsaquo;</span> Vet help`,
    body: hubBody(),
  });
  writePage(path.join(ROOT, "vet/checker.html"), {
    title: "When to see a vet",
    description: "Interactive checker that sorts pet symptoms into urgent, soon, or monitor, with emergency guidance and a disclaimer.",
    canonical: `${HOST}/vet/checker`,
    active: "vet",
    crumb: `<a href="/">Home</a> <span>&rsaquo;</span> <a href="/vet/">Vet help</a> <span>&rsaquo;</span> When to see a vet`,
    body: checkerBody(),
  });
  for (const page of symptoms) {
    writePage(path.join(ROOT, "vet/symptoms", `${page.slug}.html`), {
      title: page.title,
      description: page.description,
      canonical: `${HOST}/vet/symptoms/${page.slug}`,
      active: "vet",
      crumb: `<a href="/">Home</a> <span>&rsaquo;</span> <a href="/vet/">Vet help</a> <span>&rsaquo;</span> ${esc(page.title)}`,
      body: page.html,
      extraHead: symptomHead(page),
    });
  }
}

function appendCss() {
  const file = path.join(ROOT, "styles.css");
  const css = fs.readFileSync(file, "utf8");
  if (css.includes("/* hub-and-vet */")) return;
  fs.appendFileSync(file, `

/* hub-and-vet */
.hub-tools{display:flex;flex-wrap:wrap;gap:12px 16px;align-items:flex-end;margin:8px 0 20px;padding:14px;background:rgba(255,255,255,.85);border:1px solid #99f6e4;border-radius:12px}
.hub-tools label{display:flex;flex-direction:column;gap:6px;font-size:.82rem;font-weight:650;color:#0f172a}
.hub-beg-label{flex-direction:row;align-items:center;min-height:44px}
.hub-search,.hub-life{min-height:44px;font-size:16px;padding:8px 12px;border:1px solid #99f6e4;border-radius:8px;background:#fff;color:#0f172a}
.hub-count{margin:0;font-weight:500;color:#475569}
.filter-section{margin:12px 0}
.filter-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.filter-btn{min-height:44px;padding:8px 14px;border-radius:999px;border:1px solid #99f6e4;background:#fff;color:#0f766e;font-weight:600;cursor:pointer}
.filter-btn.active{background:#0d9488;color:#fff;border-color:#0d9488}
.breed-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(240px,100%),1fr));gap:16px;margin:12px 0 28px}
.breed-card{display:block;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;color:inherit;text-decoration:none}
.breed-card h3{margin:0 0 8px;font-size:1.05rem;color:#0f172a}
.breed-card p{margin:0 0 8px;color:#475569;font-size:.92rem}
.breed-meta{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.breed-tag{display:inline-block;background:#f0fdfa;color:#0f766e;border:1px solid #99f6e4;border-radius:999px;padding:2px 8px;font-size:.75rem}
.checker-form{background:#fff;border:1px solid #99f6e4;border-radius:12px;padding:16px;margin:16px 0}
.checker-form label,.checker-species{display:flex;gap:10px;align-items:flex-start;margin:10px 0;line-height:1.4}
.checker-species{flex-direction:column;font-weight:650}
.checker-form select{min-height:44px;font-size:16px;padding:8px 12px;border-radius:8px;border:1px solid #99f6e4}
.checker-form fieldset{border:1px solid #e2e8f0;border-radius:10px;margin:12px 0}
.checker-result{border-radius:12px;padding:16px 18px;margin:16px 0}
.checker-result.urgent{background:#fef2f2;border:2px solid #dc2626}
.checker-result.soon{background:#fffbeb;border:2px solid #d97706}
.checker-result.monitor{background:#f0fdfa;border:2px solid #0d9488}
.credits-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:12px 0 28px}
.credits-table{width:100%;border-collapse:collapse;font-size:.9rem;background:#fff}
.credits-table th,.credits-table td{border-bottom:1px solid #e2e8f0;padding:8px 10px;text-align:left;vertical-align:top}
.credits-table th{background:#0d9488;color:#fff}
.credits-table img{width:96px;height:auto;border-radius:6px}
.hub-guide{margin:8px 0 18px}
@media (max-width:640px){
  .hub-tools{flex-direction:column;align-items:stretch}
  .breed-grid{grid-template-columns:1fr}
  .filter-btn{flex:1 1 auto}
}
`);
}

function sitemapUrls(file) {
  const xml = fs.readFileSync(path.join(ROOT, file), "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

function noindexSlugs() {
  const src = fs.readFileSync(path.join(ROOT, "netlify/edge-functions/fix-image-urls.js"), "utf8");
  const block = src.slice(src.indexOf("new Set(["), src.indexOf("]);"));
  return new Set([...block.matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]));
}

function updateSitemaps() {
  const banned = noindexSlugs();
  const guidesPath = path.join(ROOT, "sitemap-guides.xml");
  let guides = fs.readFileSync(guidesPath, "utf8");
  const before = sitemapUrls("sitemap-guides.xml");
  guides = guides.replace(/\s*<url>\s*<loc>https:\/\/petcarehelperai\.com\/guides\/([^<]+)<\/loc>[\s\S]*?<\/url>/g, (full, slug) => {
    return banned.has(slug) ? "" : full;
  });
  fs.writeFileSync(guidesPath, guides);
  const after = [...guides.matchAll(/<loc>/g)].length;

  const pagesPath = path.join(ROOT, "sitemap-pages.xml");
  let pages = fs.readFileSync(pagesPath, "utf8");
  const additions = [
    `${HOST}/image-credits`,
    `${HOST}/vet/`,
    `${HOST}/vet/checker`,
    ...symptoms.map((s) => `${HOST}/vet/symptoms/${s.slug}`),
  ];
  const block = additions.filter((u) => !pages.includes(u)).map((u) => `  <url>
    <loc>${u}</loc>
    <lastmod>2026-10-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join("\n");
  if (block) pages = pages.replace("</urlset>", `${block}\n</urlset>`);
  fs.writeFileSync(pagesPath, pages);
  let index = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
  index = index.replace(/<lastmod>[^<]+<\/lastmod>/g, "<lastmod>2026-10-22</lastmod>");
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), index);
  return { guidesBefore: before.length, guidesAfter: after, removedNoindex: before.length - after };
}

function urlToFile(loc) {
  let p = loc.replace(HOST, "");
  if (p.endsWith(".html")) p = p.slice(0, -5);
  if (p === "" || p === "/") return "index.html";
  if (p.endsWith("/")) return `${p.slice(1)}index.html`;
  return `${p.slice(1)}.html`;
}

function visibleWords(html) {
  return normText(html).split(/\s+/).filter(Boolean);
}

function shinglesOf(words) {
  const set = new Set();
  for (let i = 0; i + 4 < words.length; i++) set.add(words.slice(i, i + 5).join(" "));
  return set;
}

function containment(a, b) {
  if (!a.size || !b.size) return 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  let n = 0;
  for (const s of small) if (large.has(s)) n++;
  return n / small.size;
}

function indexedFiles() {
  const urls = [...sitemapUrls("sitemap-pages.xml"), ...sitemapUrls("sitemap-breeds.xml"), ...sitemapUrls("sitemap-guides.xml")];
  const files = [];
  for (const u of urls) {
    if (u.includes("/commercial/")) continue;
    const file = path.join(ROOT, urlToFile(u));
    if (fs.existsSync(file)) files.push(file);
  }
  return [...new Set(files)];
}

function worstOverlap(files, limitPairs = 30) {
  const sets = files.map((file) => ({ file: rel(file), set: shinglesOf(visibleWords(fs.readFileSync(file, "utf8"))) }));
  const step = Math.max(1, Math.floor(sets.length / 80));
  const sentinels = sets.filter((_, i) => i % step === 0).slice(0, 80);
  const hits = [];
  let worst = 0;
  let worstPair = null;
  let compared = 0;
  for (const s of sentinels) {
    for (const page of sets) {
      if (s.file >= page.file) continue;
      compared++;
      const c = containment(s.set, page.set);
      if (c > worst) {
        worst = c;
        worstPair = [s.file, page.file, c];
      }
      if (c > 0.2) hits.push([s.file, page.file, Number(c.toFixed(3))]);
    }
  }
  hits.sort((a, b) => b[2] - a[2]);
  return { worst, worstPair, over: hits.slice(0, limitPairs), overCount: hits.length, compared, sentinels: sentinels.length, pages: sets.length };
}

function articleWords(html) {
  const m = html.match(/<article[\s\S]*?<\/article>/i);
  const text = normText(m ? m[0] : html);
  return text ? text.split(/\s+/).length : 0;
}

function profileAudit() {
  const required = ["overview", "appearance", "temperament", "lifespan", "diet", "habitat", "handling", "health", "when to see a vet", "groom", "cost", "suitab", "legal", "faq"];
  let meet = 0;
  let total = 0;
  let under = 0;
  let noFaq = 0;
  const groups = fs.readdirSync(path.join(ROOT, "breeds"), { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const g of groups) {
    for (const file of fs.readdirSync(path.join(ROOT, "breeds", g.name))) {
      if (!file.endsWith(".html")) continue;
      total++;
      const html = fs.readFileSync(path.join(ROOT, "breeds", g.name, file), "utf8").toLowerCase();
      const wc = articleWords(html);
      if (wc < 1200) under++;
      if (!html.includes("faqpage")) noFaq++;
      const ok = wc >= 1200 && html.includes("faqpage") && required.every((needle) => html.includes(needle));
      if (ok) meet++;
    }
  }
  return { total, meet, under, noFaq };
}

function indexAssets(dir, acc = new Set()) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".git" || ent.name === "test-results") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) indexAssets(p, acc);
    else acc.add(rel(p));
  }
  return acc;
}

function linkCheck() {
  const files = walk(ROOT);
  const exists = indexAssets(ROOT);
  const broken = [];
  const missingImg = [];
  let brokenN = 0;
  let missingN = 0;
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    const r = rel(file);
    const dir = path.posix.dirname(r);
    for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      let url = m[1];
      if (!url || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("javascript:") || url.startsWith("data:")) continue;
      if (/^https?:\/\//.test(url)) continue;
      url = url.split("#")[0].split("?")[0];
      if (!url) continue;
      let target;
      if (url.startsWith("/")) target = url.slice(1);
      else target = path.posix.normalize(path.posix.join(dir === "." ? "" : dir, url));
      if (target.endsWith("/")) target += "index.html";
      const candidates = [target];
      if (!target.endsWith(".html") && !path.posix.extname(target)) {
        candidates.push(`${target}.html`, `${target}/index.html`);
      }
      if (candidates.some((c) => exists.has(c))) continue;
      const isImg = m[0].startsWith("src=") || /\.(png|jpe?g|webp|svg|gif|ico)$/i.test(url);
      if (isImg) {
        missingN++;
        if (missingImg.length < 30) missingImg.push(`${r} -> ${m[1]}`);
      } else {
        brokenN++;
        if (broken.length < 40) broken.push(`${r} -> ${m[1]}`);
      }
    }
  }
  return { broken, missingImg, brokenN, missingN };
}

function prepareHubs(meta) {
  const hubs = fs.readdirSync(path.join(ROOT, "breeds")).filter((f) => f.endsWith("-breeds.html"));
  for (const name of hubs) {
    const file = path.join(ROOT, "breeds", name);
    let html = fs.readFileSync(file, "utf8");
    html = stripOldFilter(html);
    html = stampCards(html, meta);
    if (!html.includes('id="hub-tools"')) {
      if (html.includes('<div class="filter-section">')) {
        html = html.replace('<div class="filter-section">', `${HUB_TOOLS}\n<div class="filter-section">`);
      } else if (html.includes('<div class="species-grid">')) {
        html = html.replace('<div class="species-grid">', `${HUB_TOOLS}\n<div class="species-grid">`);
      } else if (html.includes('<div class="breed-grid">')) {
        html = html.replace('<div class="breed-grid">', `${HUB_TOOLS}\n<div class="breed-grid">`);
      }
    }
    const note = HUB_NOTES[name.replace(".html", "")];
    if (note && !html.includes('class="hub-guide"')) {
      const hubDiv = '<div class="hub-tools"';
      html = html.replace(hubDiv, note + "\n" + hubDiv);
    }
    if (!html.includes('id="hub-tools"')) {
      /* tools missing */
    } else if (!html.includes("root.querySelector('.hub-search')")) {
      html = html.replace("</body>", HUB_SCRIPT + "\n</body>");
    }
    fs.writeFileSync(file, html);
  }
}

function main() {
  const report = { started: new Date().toISOString() };
  report.images = buildCredits();
  buildVet();
  appendCss();
  console.log("credits and vet written", report.images);

  const files = walk(ROOT);
  const repeat = collectRepeat(files);
  report.boilerplate = {
    repeatedParagraphs: repeat.repeatedP,
    repeatedListItems: repeat.repeatedLi,
    maxParagraphCount: repeat.maxP,
  };
  console.log("boilerplate", report.boilerplate);

  let stripped = 0;
  let navved = 0;
  for (const file of files) {
    let html = fs.readFileSync(file, "utf8");
    const orig = html;
    html = dropBoilerSections(html);
    html = addNav(html);
    if (shouldStrip(rel(file))) html = stripMain(html, repeat.badP, repeat.badLi);
    if (html !== orig) {
      fs.writeFileSync(file, html);
      stripped++;
    }
    if (html.includes('href="/vet/"')) navved++;
  }
  report.filesTouchedByHygiene = stripped;
  report.filesWithVetNav = navved;

  const meta = loadBreedMeta();
  prepareHubs(meta);
  console.log("hubs stamped", meta.size);

  report.locationsRewritten = 0;
  report.indexedGuidesRewritten = 0;
  console.log("skipped care-line rewrite");

  report.sitemaps = updateSitemaps();
  report.profiles = profileAudit();
  console.log("profiles", report.profiles);

  const indexed = indexedFiles();
  console.log("overlap scan", indexed.length);
  report.overlap = worstOverlap(indexed);
  console.log("worst", report.overlap.worstPair, "over", report.overlap.overCount);

  report.links = linkCheck();
  console.log("broken sample", report.links.broken.length, "missing img", report.links.missingImg.length);
  report.finished = new Date().toISOString();
  fs.writeFileSync(path.join(ROOT, "data/quality-report.json"), JSON.stringify(report, null, 2));
  console.log("wrote data/quality-report.json");
}

main();
