#!/usr/bin/env node
/**
 * Fails when new copy uses a tic phrase.
 *
 * The phrases are: "not a", "not the", "rather than", "not just",
 * and "is not that". A sentence already present on that page's
 * origin/main copy is exempt. Legal notices with class
 * affiliate-disclosure or medical-disclaimer are not copy. A missing
 * origin/main baseline is a hard error.
 *
 * Usage: node engines/check-tics.mjs
 */
import fs from "fs";
import path from "path";
import { FROM_CURRENT, resolveOriginBase } from "./origin-base.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const BASE = resolveOriginBase({ root: ROOT });
const TIC = /\b(?:not a|not the|rather than|not just|is not that)\b/i;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "engines", "test-results", "audit"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function decode(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function plain(html) {
  const match = html.match(/<main\b[\s\S]*?<\/main>/i) || html.match(/<article\b[\s\S]*?<\/article>/i);
  let text = match ? match[0] : "";
  text = text.replace(
    /<(p|div|aside|section)\b[^>]*\bclass\s*=\s*(["'])[^"']*\b(?:affiliate-disclosure|medical-disclaimer)\b[^"']*\2[^>]*>[\s\S]*?<\/\1>/gi,
    " "
  );
  text = text.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<\/(p|li|h[1-6]|div|section|tr|td|th)>/gi, ". ");
  text = decode(text.replace(/<[^>]+>/g, " "));
  return text.replace(/\s+/g, " ").trim();
}

function norm(sentence) {
  return sentence.replace(/[.!?]+$/g, "").replace(/\s+/g, " ").trim();
}

function sentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => norm(part))
    .filter((part) => part.split(/\s+/).length >= 4);
}

const failures = [];
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  const originRel = FROM_CURRENT[rel] || rel;
  const originPath = path.join(BASE, originRel);
  const origin = fs.existsSync(originPath) ? plain(fs.readFileSync(originPath, "utf8")) : "";
  const originKeys = new Set(sentences(origin));
  const current = plain(fs.readFileSync(file, "utf8"));
  const seen = new Set();
  for (const sentence of sentences(current)) {
    if (!TIC.test(sentence) || originKeys.has(sentence) || origin.includes(sentence) || seen.has(sentence)) continue;
    seen.add(sentence);
    failures.push(`${rel}: ${sentence.slice(0, 180)}`);
  }
}

if (failures.length) {
  console.error(`tic check failed (${failures.length} new sentences)`);
  for (const line of failures.slice(0, 80)) console.error(line);
  process.exit(1);
}
console.log("tic check ok");
