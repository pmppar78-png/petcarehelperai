#!/usr/bin/env node
/**
 * Fails when article prose repeats itself.
 *
 * - A sentence of 7 or more words appears twice on one page.
 * - The same sentence of 7 or more words appears on 20 or more pages.
 * - The same heading text appears twice inside one article.
 *
 * Scans the <article> only. Header, footer, and the shared veterinary
 * notice outside the article are site chrome, not page prose. Tables,
 * scripts, and styles are not sentences. Headings are checked on their
 * own so a title is not glued to the paragraph under it.
 *
 * Usage: node engines/check-repeated-prose.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const MIN_WORDS = 7;
const MAX_PAGES = 20;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "engines" || entry.name === "test-results") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function decode(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;|&quot;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function articleOf(html) {
  const match = html.match(/<article\b[\s\S]*?<\/article>/i);
  return match ? match[0] : "";
}

function headings(article) {
  const found = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = re.exec(article))) {
    const text = decode(match[2].replace(/<[^>]+>/g, " "));
    if (text) found.push(text);
  }
  return found;
}

function sentences(article) {
  let text = article
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<table[\s\S]*?<\/table>/gi, " ")
    .replace(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi, " ");
  text = text.replace(/<\/(p|li|div|section|blockquote|figcaption|tr|dd|dt)>/gi, ". ");
  text = text.replace(/<br\s*\/?>/gi, ". ");
  text = decode(text.replace(/<[^>]+>/g, " "));
  const kept = [];
  for (const part of text.split(/(?<=[.!?])\s+/)) {
    const key = part.replace(/^[^A-Za-z]+/, "").replace(/[.!?]+$/, "").replace(/\s+/g, " ").trim();
    if (!/^[A-Z]/.test(key)) continue;
    if (key.split(/\s+/).length < MIN_WORDS) continue;
    kept.push(key);
  }
  return kept;
}

const files = walk(ROOT);
const across = new Map();
const withinSentences = [];
const withinHeadings = [];

for (const file of files) {
  const article = articleOf(fs.readFileSync(file, "utf8"));
  if (!article) continue;
  const rel = path.relative(ROOT, file);
  const sentenceCounts = new Map();
  for (const sentence of sentences(article)) {
    sentenceCounts.set(sentence, (sentenceCounts.get(sentence) || 0) + 1);
  }
  for (const [sentence, count] of sentenceCounts) {
    if (count >= 2) withinSentences.push({ rel, count, sentence });
    if (!across.has(sentence)) across.set(sentence, []);
    across.get(sentence).push(rel);
  }
  const headingCounts = new Map();
  for (const heading of headings(article)) {
    headingCounts.set(heading, (headingCounts.get(heading) || 0) + 1);
  }
  for (const [heading, count] of headingCounts) {
    if (count >= 2) withinHeadings.push({ rel, count, heading });
  }
}

const acrossFailures = [...across.entries()].filter(([, list]) => list.length >= MAX_PAGES);
acrossFailures.sort((a, b) => b[1].length - a[1].length);
withinSentences.sort((a, b) => b.count - a.count);
withinHeadings.sort((a, b) => b.count - a.count);

if (withinSentences.length || acrossFailures.length || withinHeadings.length) {
  console.error(
    `repeated prose check failed (${withinSentences.length} within-page sentences, ${acrossFailures.length} sentences on ${MAX_PAGES}+ pages, ${withinHeadings.length} repeated headings)`
  );
  for (const row of withinHeadings.slice(0, 20)) {
    console.error(`${row.rel}: heading x${row.count}: ${row.heading.slice(0, 140)}`);
  }
  for (const row of withinSentences.slice(0, 20)) {
    console.error(`${row.rel}: sentence x${row.count}: ${row.sentence.slice(0, 140)}`);
  }
  for (const [sentence, list] of acrossFailures.slice(0, 20)) {
    console.error(`${list.length} pages: ${sentence.slice(0, 160)}`);
    console.error(`  e.g. ${list.slice(0, 3).join(", ")}`);
  }
  process.exit(1);
}

console.log(`repeated prose check ok (${files.length} html files)`);
