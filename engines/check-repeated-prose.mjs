#!/usr/bin/env node
/**
 * Fails when article prose repeats itself.
 *
 * - A sentence of 7 or more words appears twice on one page.
 * - The same sentence of 7 or more words appears on 20 or more pages.
 * - The same heading text appears twice inside one article.
 *
 * Scans the <article> only. Header, footer, and the shared veterinary
 * notice outside the article are site chrome, not page prose. Elements
 * with class affiliate-disclosure or medical-disclaimer are the shared
 * legal notices from includes/, and they are removed before sentences
 * are counted. Tables, scripts, and styles are not sentences. Headings are checked on their
 * own so a title is not glued to the paragraph under it.
 *
 * Not part of the Netlify build. `npm run check:repeated` still exits 1
 * when it finds the inherited repeats. The GitHub Action runs
 * `node engines/check-repeated-prose.mjs --new-vs origin/main` and fails
 * only when a changed page introduces a within-page 7+ word sentence
 * repeat, or a duplicate h2, that the baseline ref does not already have.
 * Cross-page sentences and repeats already on main do not fail that job,
 * and Netlify still runs only the care-line check.
 *
 * Full mode exempts a repeat that already exists on that page's origin/main
 * copy. That ratchet requires the baseline. A missing baseline is a hard
 * error, not an empty origin file and not a silent pass. --new-vs reads the
 * git ref directly and does not use the worktree.
 *
 * Usage:
 *   node engines/check-repeated-prose.mjs
 *   node engines/check-repeated-prose.mjs --new-vs origin/main
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { FROM_CURRENT, resolveOriginBase } from "./origin-base.mjs";

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

function stripLegalNotices(html) {
  return html.replace(
    /<(p|div|aside|section)\b[^>]*\bclass\s*=\s*(["'])[^"']*\b(?:affiliate-disclosure|medical-disclaimer)\b[^"']*\2[^>]*>[\s\S]*?<\/\1>/gi,
    " "
  );
}

function articleOf(html) {
  const match = html.match(/<article\b[\s\S]*?<\/article>/i);
  return match ? stripLegalNotices(match[0]) : "";
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

function h2s(article) {
  const found = [];
  const re = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
  let match;
  while ((match = re.exec(article))) {
    const text = decode(match[1].replace(/<[^>]+>/g, " "));
    if (text) found.push(text);
  }
  return found;
}

function repeatedSet(items) {
  const counts = new Map();
  for (const item of items) counts.set(item, (counts.get(item) || 0) + 1);
  return new Set([...counts].filter(([, count]) => count >= 2).map(([item]) => item));
}

function gitText(args) {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function checkNewAgainst(ref) {
  const names = gitText(["diff", "--name-only", "--diff-filter=ACMR", ref, "--", "*.html"])
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const failures = [];
  for (const rel of names) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    const currentArticle = articleOf(fs.readFileSync(full, "utf8"));
    const currentSentences = repeatedSet(sentences(currentArticle));
    const currentH2 = repeatedSet(h2s(currentArticle));
    let baseSentences = new Set();
    let baseH2 = new Set();
    try {
      const baseHtml = gitText(["show", `${ref}:${rel}`]);
      const baseArticle = articleOf(baseHtml);
      baseSentences = repeatedSet(sentences(baseArticle));
      baseH2 = repeatedSet(h2s(baseArticle));
    } catch {
      baseSentences = new Set();
      baseH2 = new Set();
    }
    for (const sentence of currentSentences) {
      if (!baseSentences.has(sentence)) {
        failures.push(`${rel}: new repeated sentence: ${sentence.slice(0, 160)}`);
      }
    }
    for (const heading of currentH2) {
      if (!baseH2.has(heading)) failures.push(`${rel}: new duplicate h2: ${heading.slice(0, 140)}`);
    }
  }
  if (failures.length) {
    console.error(
      `new repeated-prose check failed against ${ref} (${failures.length} new within-page repeats or duplicate h2s in ${names.length} changed html files)`
    );
    for (const line of failures.slice(0, 80)) console.error(line);
    process.exit(1);
  }
  console.log(`new repeated-prose check ok against ${ref} (${names.length} changed html files)`);
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

const newVsIndex = process.argv.indexOf("--new-vs");
if (newVsIndex !== -1) {
  const ref = process.argv[newVsIndex + 1];
  if (!ref) {
    console.error("usage: node engines/check-repeated-prose.mjs --new-vs <git-ref>");
    process.exit(1);
  }
  checkNewAgainst(ref);
  process.exit(0);
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

// Repeats that already exist on the origin/main copy of that page are
// inherited. A failure is a repeat or a 20-page sentence this branch added.
const BASE = resolveOriginBase({ root: ROOT });
const originCache = new Map();
function originFacts(rel) {
  if (originCache.has(rel)) return originCache.get(rel);
  const originRel = FROM_CURRENT[rel] || rel;
  const full = path.join(BASE, originRel);
  const empty = { sentences: new Set(), repeated: new Set(), headings: new Map() };
  if (!fs.existsSync(full)) {
    originCache.set(rel, empty);
    return empty;
  }
  const article = articleOf(fs.readFileSync(full, "utf8"));
  const sentenceCounts = new Map();
  for (const sentence of sentences(article)) sentenceCounts.set(sentence, (sentenceCounts.get(sentence) || 0) + 1);
  const headingCounts = new Map();
  for (const heading of headings(article)) headingCounts.set(heading, (headingCounts.get(heading) || 0) + 1);
  const facts = {
    sentences: new Set(sentenceCounts.keys()),
    repeated: new Set([...sentenceCounts].filter(([, count]) => count >= 2).map(([sentence]) => sentence)),
    headings: headingCounts,
  };
  originCache.set(rel, facts);
  return facts;
}

const acrossFailures = [];
for (const [sentence, list] of across.entries()) {
  if (list.length < MAX_PAGES) continue;
  if (list.some((rel) => !originFacts(rel).sentences.has(sentence))) acrossFailures.push([sentence, list]);
}
const newWithinSentences = withinSentences.filter((row) => !originFacts(row.rel).repeated.has(row.sentence));
const newWithinHeadings = withinHeadings.filter((row) => (originFacts(row.rel).headings.get(row.heading) || 0) < 2);
withinSentences.length = 0;
withinSentences.push(...newWithinSentences);
withinHeadings.length = 0;
withinHeadings.push(...newWithinHeadings);
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
