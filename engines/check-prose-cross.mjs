#!/usr/bin/env node
/**
 * Fails if the same sentence longer than 12 words appears on more than
 * three breed or species profiles. Shared site chrome, quick-fact tables,
 * affiliate blocks, and decision-guide lists are not profile prose.
 *
 * Usage: node engines/check-prose-cross.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function profiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) profiles(full, out);
    else if (entry.name.endsWith(".html") && !entry.name.includes("-breeds")) out.push(full);
  }
  return out;
}

function articleText(html) {
  const match = html.match(/<article[\s\S]*?<\/article>/i);
  if (!match) return "";
  let article = match[0];
  article = article.replace(/<table[\s\S]*?<\/table>/gi, " ");
  article = article.replace(/<div class="affiliate-callout"[\s\S]*?<\/div>/gi, " ");
  const commercial = article.indexOf("commercial-links-section");
  if (commercial >= 0) article = article.slice(0, commercial);
  article = article.replace(/<(p|li|h1|h2|h3|h4|div|tr|section|a)(\s[^>]*)?>/gi, ". ");
  article = article.replace(/<br\s*\/?>/gi, ". ");
  return article
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;|&ldquo;|&rdquo;|&quot;/g, "'")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ");
}

function sentenceKey(part) {
  return part.trim().replace(/^[^A-Za-z]+/, "").replace(/[.!?]+$/, "").replace(/\s+/g, " ").trim();
}

function sentences(text) {
  const kept = [];
  for (const part of text.split(/(?<=[.!?])\s+/)) {
    const key = sentenceKey(part);
    if (!/^[A-Z]/.test(key)) continue;
    const words = key.split(/\s+/).filter(Boolean);
    if (words.length <= 12) continue;
    kept.push(key);
  }
  return kept;
}

const seen = new Map();
const files = profiles(path.join(ROOT, "breeds"));
for (const file of files) {
  const unique = new Set(sentences(articleText(fs.readFileSync(file, "utf8"))));
  for (const sentence of unique) {
    if (!seen.has(sentence)) seen.set(sentence, []);
    seen.get(sentence).push(path.relative(ROOT, file));
  }
}

const failures = [...seen.entries()].filter(([, list]) => list.length > 3);
if (failures.length) {
  failures.sort((a, b) => b[1].length - a[1].length);
  console.error(`cross-page prose check failed (${failures.length} sentences)`);
  for (const [sentence, list] of failures.slice(0, 40)) {
    console.error(`${list.length} profiles: ${sentence.slice(0, 160)}`);
    console.error(`  e.g. ${list.slice(0, 3).join(", ")}`);
  }
  process.exit(1);
}
console.log(`cross-page prose check ok (${files.length} profiles)`);
