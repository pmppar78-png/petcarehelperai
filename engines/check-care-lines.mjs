#!/usr/bin/env node
/**
 * Fails if the care-line generator pattern is back in site HTML:
 * "The {CamelCaseToken} {three-word care line}."
 * Also fails if finish-site.mjs emits that block again.
 *
 * Usage: node engines/check-care-lines.mjs
 */
import fs from "fs";
import path from "path";
import { CARE_LINES } from "./care-lines.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const alt = CARE_LINES.map((line) => line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const sentRe = new RegExp(`The [A-Z][A-Za-z0-9]+ (?:${alt})\\.`, "g");
const noteRe = /The [A-Z][A-Za-z0-9]+ notes local [^.]{1,80}\./g;

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "engines" || entry.name === "test-results") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

const finish = fs.readFileSync(path.join(ROOT, "engines/finish-site.mjs"), "utf8");
if (/sentenceBlock\s*\(\s*token\s*,\s*CARE_LINES\s*\)/.test(finish)) {
  console.error("engines/finish-site.mjs still emits care-line sentence blocks");
  process.exit(1);
}

const hits = [];
let sentences = 0;
const files = walk(ROOT);
for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const found = (html.match(sentRe) || []).length + (html.match(noteRe) || []).length;
  if (found) {
    sentences += found;
    if (hits.length < 25) hits.push(`${path.relative(ROOT, file)} ${found}`);
  }
}

if (hits.length) {
  console.error(`care-line sentences found: ${sentences} (showing ${hits.length} files)`);
  for (const line of hits) console.error(line);
  process.exit(1);
}

console.log(`care-line check ok (${files.length} html files)`);
