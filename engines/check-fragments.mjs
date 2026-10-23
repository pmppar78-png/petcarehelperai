#!/usr/bin/env node
/**
 * Fails on fragment sentences and on numbers glued to percent or hr.
 * A fragment here is a sentence whose last word still needs an object
 * (include, includes, including, underlying, "the following") or a short
 * sentence that stops on for/to/of/with/if/and/or/because/typically.
 * Stranded prepositions that already have a subject ("screen for",
 * "care for", "are prone to", "what the surgery includes") are left alone.
 *
 * Usage: node engines/check-fragments.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const TOKEN = /\b\d+(?:percent|hr|hrs)\b/gi;
const OBJECT_WORDS = new Set(["include", "includes", "including", "underlying"]);
const DANGLING = new Set([
  "for",
  "to",
  "of",
  "with",
  "if",
  "and",
  "or",
  "because",
  "typically",
  "usually",
  "generally",
]);
const WORD = /[A-Za-z0-9'’][A-Za-z0-9'’-]*/g;

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "test-results") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith(".html") || entry.name.endsWith(".mjs") || entry.name.endsWith(".js")) acc.push(full);
  }
  return acc;
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;|&ldquo;|&rdquo;|&quot;/g, "'")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ");
}

function fragmentReason(sentence) {
  const words = sentence.match(WORD) || [];
  if (!words.length) return "";
  const last = words[words.length - 1].toLowerCase();
  const prev = words.length > 1 ? words[words.length - 2].toLowerCase() : "";
  const low = words.join(" ").toLowerCase();
  if (words.length === 1 && (last === "usually" || last === "typically" || last === "generally")) return "";
  if (OBJECT_WORDS.has(last) && !/\b(what|which|whatever)\b/.test(low)) return last;
  if (last === "following" && (prev === "the" || prev === "as")) return "the following";
  if (last === "example" && words.length <= 4) return "example";
  if (/\?\s*$/.test(sentence)) return "";
  if (/\bprone to$/.test(low)) {
    if (/\b(is|are|was|were)\b(?:\s+\w+){0,3}\s+prone to$/.test(low)) return "";
    return "prone to";
  }
  if (!DANGLING.has(last) || words.length > 8) return "";
  if (/\b(what|which|who|whom|whose|where|when|whatever|that)\b/.test(low)) return "";
  if (words.length > 3 && /(?:care for|live with|known for|dealt with|screen for|watching for|monitor for|look for|shop for|listened to|listen to|tells you to|used to|aim for|hope for|pay for|account for|wait for|retreat to|need to|like to|love to|want to|exposed to|asked to|responds to|respond to|raised with|return(?:\s+\w+){0,4}\s+to)$/.test(low)) {
    return "";
  }
  return last;
}

const failures = [];
const files = walk(ROOT);
for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file);
  const tokens = raw.match(TOKEN);
  if (tokens) {
    failures.push(`${rel}: glued token ${[...new Set(tokens)].slice(0, 4).join(", ")}`);
  }
  if (!file.endsWith(".html")) continue;
  const visible = visibleText(raw);
  const seen = new Set();
  for (const part of visible.split(/(?<=[.!?])\s+/)) {
    const reason = fragmentReason(part);
    if (!reason) continue;
    const sample = part.trim().replace(/\s+/g, " ").slice(0, 140);
    const key = `${rel}|${sample}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (failures.length < 40) failures.push(`${rel}: fragment (${reason}): ${sample}`);
    else if (failures.length === 40) failures.push("… further fragment hits omitted");
  }
}

if (failures.length) {
  console.error(`fragment check failed (${failures.length} shown)`);
  for (const line of failures) console.error(line);
  process.exit(1);
}

const htmlCount = files.filter((file) => file.endsWith(".html")).length;
console.log(`fragment check ok (${htmlCount} html files)`);
