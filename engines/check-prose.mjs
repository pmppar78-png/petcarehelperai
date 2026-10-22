/**
 * Fails if any HTML page contains a CamelCase category-plus-name token
 * (DogsLabradorRetriever, CatsAmericanWirehair, FishHealth, and the same
 * shape) or if one sentence is repeated more than 3 times on that page.
 *
 * Usage: node engines/check-prose.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const TOKEN = /\b(?:Dogs|Cats|Birds|Reptiles|Amphibians|SmallAnimals|MarineFish|Marine|Fish)[A-Z][A-Za-z0-9]+\b/g;
const SELF_REF = [
  [/earlier version/i, "earlier version"],
  [/this page previously/i, "this page previously"],
  [/was wrong/i, "was wrong"],
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".rewrite-tmp") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;|&ldquo;|&rdquo;|&quot;/g, "'")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ");
}

function isBreedProfile(rel) {
  return rel.startsWith("breeds/") && !path.basename(rel).includes("-breeds");
}

function sentences(text) {
  const parts = text.split(/(?<=[.!?])\s+/);
  const kept = [];
  for (let part of parts) {
    part = part.trim().replace(/^[^A-Za-z]+/, "");
    if (!/^[A-Z]/.test(part)) continue;
    const words = part.split(/\s+/).filter(Boolean);
    if (words.length < 5) continue;
    kept.push(part);
  }
  return kept;
}

const failures = [];
for (const file of walk(ROOT)) {
  const raw = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file);
  const tokens = [...raw.matchAll(TOKEN)].map((m) => m[0]);
  if (tokens.length) {
    failures.push(`${rel}: CamelCase token ${[...new Set(tokens)].slice(0, 4).join(", ")}`);
  }
  const visible = visibleText(raw);
  for (const [re, label] of SELF_REF) {
    if (label === "was wrong" && !isBreedProfile(rel)) continue;
    if (re.test(visible)) failures.push(`${rel}: page talks about its own edits ("${label}")`);
  }
  const counts = new Map();
  for (const sentence of sentences(visibleText(raw))) {
    counts.set(sentence, (counts.get(sentence) || 0) + 1);
  }
  for (const [sentence, count] of counts) {
    if (count > 3) {
      failures.push(`${rel}: sentence x${count}: ${sentence.slice(0, 140)}`);
    }
  }
}

if (failures.length) {
  console.error(`prose check failed (${failures.length})`);
  for (const line of failures.slice(0, 80)) console.error(line);
  process.exit(1);
}
console.log(`prose check ok (${walk(ROOT).length} html files)`);
