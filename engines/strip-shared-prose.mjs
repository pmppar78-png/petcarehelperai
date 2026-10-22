#!/usr/bin/env node
/**
 * Remove prose that the cross-page check would reject, plus the spliced
 * template clauses that name-swap onto otherwise specific paragraphs.
 * Quick facts, photos, affiliate blocks, and decision guides stay.
 * The four long reptile guides are left untouched.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const GOLD = new Set([
  "breeds/reptiles/leopard-gecko.html",
  "breeds/reptiles/bearded-dragon.html",
  "breeds/reptiles/ball-python.html",
  "breeds/reptiles/corn-snake.html",
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html") && !entry.name.includes("-breeds")) out.push(full);
  }
  return out;
}

function articleRegion(html) {
  const start = html.search(/<article[\s>]/i);
  const end = html.search(/<\/article>/i);
  if (start < 0 || end < 0) return null;
  return { start, end };
}

function visibleFrom(html) {
  let article = html;
  article = article.replace(/<table[\s\S]*?<\/table>/gi, " ");
  article = article.replace(/<div class="affiliate-callout"[\s\S]*?<\/div>/gi, " ");
  const commercial = article.indexOf("commercial-links-section");
  if (commercial >= 0) article = article.slice(0, commercial);
  article = article.replace(/<(p|li|h1|h2|h3|h4|div|tr|section|a)(\s[^>]*)?>/gi, ". ");
  article = article.replace(/<br\s*\/?>/gi, ". ");
  return article
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
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

function longSentences(text) {
  const kept = [];
  for (const part of text.split(/(?<=[.!?])\s+/)) {
    const key = sentenceKey(part);
    if (!/^[A-Z]/.test(key)) continue;
    if (key.split(/\s+/).filter(Boolean).length <= 12) continue;
    kept.push(key);
  }
  return kept;
}

function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;|&quot;/g, '"')
    .replace(/&mdash;|&ndash;/g, " ")
    .replace(/&[a-z]+;/gi, " ");
}

function encode(s) {
  return s.replace(/&/g, "&amp;");
}

const SPLICE = [
  /:\s*Understanding how this applies specifically to [^.:!?]+/gi,
  /:\s*Your veterinarian and experienced [^.:!?]+/gi,
  /Understanding how this applies specifically to [^.:!?]+/gi,
  /Your veterinarian and experienced [^.:!?]+ owners can offer perspective tailored to your situation/gi,
  /exemplifies the remarkable diversity of [^.:!?]+/gi,
  /has captivated hobbyists[^.:!?]*/gi,
];

function scrubPlain(text, bad) {
  let next = text.replace(/appetite,or/g, "appetite, or");
  for (const pattern of SPLICE) next = next.replace(pattern, "");
  const parts = next.split(/(?<=[.!?])\s+/);
  const kept = [];
  for (const part of parts) {
    const norm = sentenceKey(part);
    const words = norm.split(/\s+/).filter(Boolean);
    if (!norm) continue;
    if (words.length > 12 && bad.has(norm)) continue;
    if (/Understanding how this applies specifically/i.test(part)) continue;
    if (/Your veterinarian and experienced/i.test(part)) continue;
    if (/exemplifies the remarkable diversity/i.test(part)) continue;
    if (/has captivated hobbyists/i.test(part)) continue;
    kept.push(part.trim());
  }
  return kept.join(" ").replace(/\s{2,}/g, " ").replace(/\s+([,.;!?])/g, "$1").trim();
}

function scrubHtml(inner, bad) {
  if (!inner.trim()) return inner;
  const anchors = [];
  const marked = inner.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, (anchor) => {
    const token = `ANCHOR${anchors.length}TOKEN`;
    anchors.push(anchor);
    return token;
  });
  const plain = decode(marked.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
  const cleaned = scrubPlain(plain, bad);
  if (cleaned === plain) return inner;
  if (!cleaned) return "";
  let out = encode(cleaned);
  anchors.forEach((anchor, index) => {
    const token = `ANCHOR${index}TOKEN`;
    out = out.includes(token) ? out.replace(token, anchor) : out;
  });
  return out.replace(/\s{2,}/g, " ").trim();
}

const files = walk(path.join(ROOT, "breeds"));
const counts = new Map();
for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const region = articleRegion(html);
  if (!region) continue;
  for (const sentence of new Set(longSentences(visibleFrom(html.slice(region.start, region.end))))) {
    counts.set(sentence, (counts.get(sentence) || 0) + 1);
  }
}
const bad = new Set([...counts.entries()].filter(([, n]) => n > 3).map(([s]) => s));
console.log("shared long sentences", bad.size);

let touched = 0;
let emptied = 0;
for (const file of files) {
  const rel = path.relative(ROOT, file);
  if (GOLD.has(rel)) continue;
  let html = fs.readFileSync(file, "utf8");
  const region = articleRegion(html);
  if (!region) continue;
  const article = html.slice(region.start, region.end);
  const commercial = article.indexOf("commercial-links-section");
  const limit = commercial >= 0 ? commercial : article.length;
  const head = article.slice(0, limit);
  const tail = article.slice(limit);
  const nextHead = head.replace(/<(p|li)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, (full, tag, attrs = "", inner) => {
    const scrubbed = scrubHtml(inner, bad);
    const text = scrubbed.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!text || text.length < 2) {
      emptied++;
      return "";
    }
    if (scrubbed === inner) return full;
    return `<${tag}${attrs || ""}>${scrubbed}</${tag}>`;
  });
  if (nextHead === head) continue;
  html = html.slice(0, region.start) + nextHead + tail + html.slice(region.end);
  fs.writeFileSync(file, html);
  touched++;
}
console.log("profiles edited", touched, "empty blocks removed", emptied);
