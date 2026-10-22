#!/usr/bin/env node
/**
 * Replace profile paragraphs that are the same template on 8 or more
 * profiles, once the name is removed, and that run at least 25 words.
 * Replacements come from engines/prose/repeated-*.jsonl.
 * A page is left untouched if any replacement is shorter than the
 * paragraph it removes.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const MIN_WORDS = 25;
const MIN_PAGES = 8;

export function words(text) {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, " & ")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function visible(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, " & ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;|&#x27;/gi, "'")
    .replace(/&ldquo;|&rdquo;|&quot;/g, '"')
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function namesFor(h1) {
  const names = [];
  if (!h1) return names;
  names.push(h1);
  if (!/s$/i.test(h1)) names.push(`${h1}s`);
  return names.sort((a, b) => b.length - a.length);
}

export function normalize(text, h1) {
  let norm = text;
  for (const name of namesFor(h1)) norm = norm.replace(new RegExp(escapeRe(name), "gi"), "{N}");
  return norm.replace(/\s+/g, " ").trim();
}

function profiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) profiles(full, out);
    else if (entry.name.endsWith(".html") && !entry.name.includes("-breeds")) out.push(full);
  }
  return out;
}

function articleSlice(html) {
  const match = html.match(/<article[\s\S]*?<\/article>/i);
  if (!match) return null;
  let article = match[0];
  const commercial = article.indexOf("commercial-links-section");
  if (commercial >= 0) article = article.slice(0, commercial);
  return article;
}

export function pageParagraphs(html) {
  const article = articleSlice(html);
  if (!article) return [];
  const h1 = (article.match(/<h1>([^<]+)/) || [, ""])[1].trim();
  const stripped = article
    .replace(/<table[\s\S]*?<\/table>/gi, " ")
    .replace(/<div class="affiliate-callout"[\s\S]*?<\/div>/gi, " ");
  const out = [];
  const re = /<p>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(stripped))) {
    const inner = m[1];
    if (/<a\b|<img|<table/i.test(inner)) continue;
    const text = visible(inner);
    if (words(text) < 8) continue;
    out.push({ text, norm: normalize(text, h1), h1 });
  }
  return out;
}

export function templateSet() {
  const counts = new Map();
  for (const file of profiles(path.join(ROOT, "breeds"))) {
    const html = fs.readFileSync(file, "utf8");
    const article = html.match(/<article[\s\S]*?<\/article>/i)?.[0];
    if (!article) continue;
    const h1 = (article.match(/<h1>([^<]+)/) || [, ""])[1].trim();
    const commercial = article.indexOf("commercial-links-section");
    const limit = commercial >= 0 ? commercial : article.length;
    const re = /<p>([\s\S]*?)<\/p>/gi;
    const seen = new Set();
    let m;
    while ((m = re.exec(article))) {
      if (m.index >= limit) break;
      const inner = m[1];
      if (/<a\b|<img|<table/i.test(inner)) continue;
      const text = visible(inner);
      const norm = normalize(text, h1);
      if (words(norm) < MIN_WORDS || seen.has(norm)) continue;
      seen.add(norm);
      counts.set(norm, (counts.get(norm) || 0) + 1);
    }
  }
  const keep = new Set();
  for (const [norm, n] of counts) if (n >= MIN_PAGES) keep.add(norm);
  return keep;
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function loadReplacements() {
  const dir = path.join(ROOT, "engines/prose");
  const map = new Map();
  if (!fs.existsSync(dir)) return map;
  for (const name of fs.readdirSync(dir)) {
    if (!name.startsWith("repeated-") || !name.endsWith(".jsonl")) continue;
    for (const line of fs.readFileSync(path.join(dir, name), "utf8").split("\n")) {
      if (!line.trim()) continue;
      const row = JSON.parse(line);
      map.set(row.slug, row.paragraphs);
    }
  }
  return map;
}

export function orderedSlots(html, templates) {
  const article = html.match(/<article[\s\S]*?<\/article>/i)?.[0];
  if (!article) return [];
  const h1 = (article.match(/<h1>([^<]+)/) || [, ""])[1].trim();
  const commercial = article.indexOf("commercial-links-section");
  const limit = commercial >= 0 ? commercial : article.length;
  const re = /<p>([\s\S]*?)<\/p>/gi;
  const hits = [];
  let m;
  while ((m = re.exec(article))) {
    if (m.index >= limit) break;
    const inner = m[1];
    if (/<a\b|<img|<table/i.test(inner)) continue;
    const text = visible(inner);
    const norm = normalize(text, h1);
    if (!templates.has(norm)) continue;
    hits.push({ start: m.index, end: m.index + m[0].length, words: words(text), text });
  }
  return hits;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isMain) {
  const templates = templateSet();
  const replacements = loadReplacements();
  const short = [];
  const missing = [];
  const mismatch = [];
  let files = 0;
  for (const file of profiles(path.join(ROOT, "breeds"))) {
    const slug = path.relative(path.join(ROOT, "breeds"), file).replace(/\.html$/, "");
    const html = fs.readFileSync(file, "utf8");
    const hits = orderedSlots(html, templates);
    if (!hits.length) continue;
    const paras = replacements.get(slug);
    if (!paras) {
      missing.push(slug);
      continue;
    }
    if (paras.length !== hits.length) {
      mismatch.push(`${slug} got ${paras.length} wanted ${hits.length}`);
      continue;
    }
    const tooShort = paras.findIndex((p, i) => words(p) < hits[i].words);
    if (tooShort >= 0) {
      short.push(`${slug} slot ${tooShort} ${words(paras[tooShort])}<${hits[tooShort].words}`);
      continue;
    }
    const article = html.match(/<article[\s\S]*?<\/article>/i)[0];
    let next = "";
    let cursor = 0;
    hits.forEach((hit, i) => {
      next += article.slice(cursor, hit.start);
      next += `<p>${esc(paras[i])}</p>`;
      cursor = hit.end;
    });
    next += article.slice(cursor);
    fs.writeFileSync(file, html.replace(article, next));
    files++;
  }
  const report = { files, templates: templates.size, missing: missing.length, mismatch, short };
  console.log(JSON.stringify(report, null, 2));
  if (mismatch.length || short.length) process.exit(1);
}
