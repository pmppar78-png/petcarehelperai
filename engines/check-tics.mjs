#!/usr/bin/env node
/**
 * Fails when new copy uses a tic phrase.
 *
 * The phrases are: "not a", "not the", "not an", "not as", "not because",
 * "rather than", "not just", "is not that", "is not a", "is not the",
 * and any "X, not Y" contrast (a comma before "not"). Headings and FAQ
 * JSON-LD text are checked the same way as body sentences. A multi-sentence
 * FAQ answer is checked sentence by sentence. A sentence or heading already
 * present on that page's origin/main copy is exempt.
 * A heading that is repeated as the next sentence fails, unless that
 * page's origin/main copy already repeats it. Legal notices with class
 * affiliate-disclosure or medical-disclaimer are not copy. A missing
 * origin/main baseline is a hard error.
 *
 * Usage: node engines/check-tics.mjs
 */
import fs from "fs";
import path from "path";
import { originFile, resolveOriginBase } from "./origin-base.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const BASE = resolveOriginBase({ root: ROOT });
const TIC = /,\s+not\b|\b(?:not a|not an|not as|not because|not the|rather than|not just|is not that|is not a|is not the)\b/i;

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

function region(html) {
  const match = html.match(/<main\b[\s\S]*?<\/main>/i) || html.match(/<article\b[\s\S]*?<\/article>/i);
  return match ? match[0] : "";
}

function headings(html) {
  const found = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  const source = region(html).replace(/<script[\s\S]*?<\/script>/gi, " ");
  while ((match = re.exec(source))) {
    found.push(norm(decode(match[2].replace(/<[^>]+>/g, " "))));
  }
  return found.filter(Boolean);
}

function faqTexts(html) {
  const out = [];
  const re = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) {
    let data;
    try {
      data = JSON.parse(match[1]);
    } catch {
      continue;
    }
    const stack = Array.isArray(data) ? [...data] : [data];
    if (data && data["@graph"]) stack.push(...data["@graph"]);
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== "object") continue;
      const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
      if (types.includes("FAQPage") && Array.isArray(node.mainEntity)) {
        for (const question of node.mainEntity) {
          out.push(norm(decode(question.name || "")));
          out.push(norm(decode((question.acceptedAnswer && question.acceptedAnswer.text) || "")));
        }
      }
    }
  }
  return out.filter(Boolean);
}

function headingRepeats(html) {
  const hits = [];
  const source = region(html).replace(/<script[\s\S]*?<\/script>/gi, " ");
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = re.exec(source))) {
    const heading = norm(decode(match[2].replace(/<[^>]+>/g, " ")));
    const after = source.slice(match.index + match[0].length);
    const paragraphMatch = after.match(/^\s*<p\b[^>]*>([\s\S]*?)<\/p>/i);
    if (!paragraphMatch) continue;
    const paragraph = decode(paragraphMatch[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    const next = norm(paragraph.split(/(?<=[.!?])\s+/)[0] || "");
    if (heading && next && heading === next && heading.split(/\s+/).length >= 4) hits.push(heading);
  }
  return hits;
}

const failures = [];
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  const originRel = originFile(BASE, rel);
  const originPath = path.join(BASE, originRel);
  const originHtml = fs.existsSync(originPath) ? fs.readFileSync(originPath, "utf8") : "";
  const origin = originHtml ? plain(originHtml) : "";
  const originKeys = new Set(sentences(origin));
  for (const heading of headings(originHtml)) originKeys.add(heading);
  for (const bit of faqTexts(originHtml)) {
    originKeys.add(bit);
    for (const sentence of sentences(bit)) originKeys.add(sentence);
  }
  const html = fs.readFileSync(file, "utf8");
  const current = plain(html);
  const seen = new Set();
  const candidates = [
    ...sentences(current),
    ...headings(html),
    ...faqTexts(html).flatMap((bit) => {
      const pieces = bit.split(/(?<=[.!?])\s+/).map((part) => norm(part)).filter(Boolean);
      return pieces.length > 1 ? sentences(bit) : [bit];
    }),
  ];
  for (const sentence of candidates) {
    if (!TIC.test(sentence) || originKeys.has(sentence) || seen.has(sentence)) continue;
    seen.add(sentence);
    failures.push(`${rel}: ${sentence.slice(0, 180)}`);
  }
  const originRepeats = new Set(headingRepeats(originHtml));
  for (const heading of headingRepeats(html)) {
    if (originRepeats.has(heading)) continue;
    failures.push(`${rel}: heading repeated as next sentence: ${heading.slice(0, 160)}`);
  }
}

if (failures.length) {
  console.error(`tic check failed (${failures.length} new sentences)`);
  for (const line of failures.slice(0, 80)) console.error(line);
  process.exit(1);
}
console.log("tic check ok");
