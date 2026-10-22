#!/usr/bin/env node
/**
 * Splice hand-written profile prose into an existing breed page.
 * Keeps the heading, photo, review badge, quick-facts card, affiliate
 * callouts, and decision-guide block. Replaces the article body and the
 * FAQPage schema from the same question list.
 *
 * Usage: node engines/apply-profile-prose.mjs engines/prose/amphibians.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function balancedDiv(html, start) {
  let i = start;
  let depth = 0;
  while (i < html.length) {
    if (html.startsWith("<div", i)) {
      depth++;
      i += 4;
      continue;
    }
    if (html.startsWith("</div>", i)) {
      depth--;
      i += 6;
      if (depth === 0) return i;
      continue;
    }
    i++;
  }
  throw new Error("unbalanced div");
}

function sliceArticle(article) {
  const cardStart = article.indexOf('<div class="breed-stats-card">');
  if (cardStart < 0) throw new Error("missing quick-facts card");
  const cardEnd = balancedDiv(article, cardStart);
  const head = article.slice(0, cardEnd);
  const affiliates = [...article.matchAll(/<div class="affiliate-callout">[\s\S]*?<\/div>/g)].map((m) => m[0]);
  const commercialStart = article.indexOf('<div class="breed-stats-card commercial-links-section"');
  if (commercialStart < 0) throw new Error("missing decision guides");
  const commercialEnd = balancedDiv(article, commercialStart);
  return { head, affiliates, commercial: article.slice(commercialStart, commercialEnd) };
}

function faqScript(faqs) {
  const json = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return `<script type="application/ld+json">\n${JSON.stringify(json, null, 2)}\n</script>`;
}

function replaceFaq(html, faqs) {
  const block = faqScript(faqs);
  const idx = html.search(/"@type"\s*:\s*"FAQPage"/);
  if (idx < 0) return html.replace("</head>", `${block}\n</head>`);
  const scriptStart = html.lastIndexOf("<script", idx);
  const scriptEnd = html.indexOf("</script>", idx) + "</script>".length;
  return html.slice(0, scriptStart) + block + html.slice(scriptEnd);
}

function faqBlock(faqs) {
  return faqs.map((f) => `<h3>${esc(f.q)}</h3>\n<p>${esc(f.a)}</p>`).join("\n");
}

function setMeta(html, description) {
  const d = esc(description);
  let next = html.replace(/(<meta name="description" content=")[^"]*(")/i, `$1${d}$2`);
  next = next.replace(/(<meta property="og:description" content=")[^"]*(")/i, `$1${d}$2`);
  next = next.replace(/(<meta name="twitter:description" content=")[^"]*(")/i, `$1${d}$2`);
  next = next.replace(/("description":")((?:\\.|[^"\\])*)(")/, `$1${description.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}$3`);
  return next;
}

const modPath = path.resolve(process.argv[2] || "");
if (!modPath) {
  console.error("pass a prose module");
  process.exit(1);
}
const { profiles } = await import(modPath);
let n = 0;
for (const [rel, page] of Object.entries(profiles)) {
  const file = path.join(ROOT, rel);
  let html = fs.readFileSync(file, "utf8");
  const articleMatch = html.match(/<article class="guide-content">([\s\S]*?)<\/article>/);
  if (!articleMatch) throw new Error(`no article ${rel}`);
  const { head, affiliates, commercial } = sliceArticle(articleMatch[1]);
  const body = `${head}\n${affiliates.join("\n")}\n${page.html}\n<h2>${esc(page.faqTitle)}</h2>\n${faqBlock(page.faqs)}\n${commercial}`;
  html = html.replace(articleMatch[0], `<article class="guide-content">${body}\n</article>`);
  html = replaceFaq(html, page.faqs);
  html = setMeta(html, page.description);
  if (/on the card/i.test(page.html + page.faqs.map((f) => f.q + f.a).join(" "))) {
    throw new Error(`stock phrase in ${rel}`);
  }
  fs.writeFileSync(file, html);
  n++;
  console.log("rewrote", rel);
}
console.log("profiles", n);
