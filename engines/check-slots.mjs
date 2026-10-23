#!/usr/bin/env node
/**
 * Fails on unfilled name slots and broken articles in new copy.
 *
 * Double spaces that already exist on origin/main are inherited. A new
 * double-space gap, an empty name slot, an empty title, or an orphan
 * article fails.
 * "a UVB" is house style: the letter names are pronounced you-vee-bee,
 * so the article is "a". Diet-type labels (Omnivore, Insectivore,
 * Herbivore, Carnivore) dropped in after "a" or "an" fail. A missing
 * origin/main baseline is a hard error.
 *
 * Usage: node engines/check-slots.mjs
 */
import fs from "fs";
import path from "path";
import { FROM_CURRENT, resolveOriginBase } from "./origin-base.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const BASE = resolveOriginBase({ root: ROOT });

const A_OK = /^(?:uvb|uva|usda|u\.s|uk|unique|uniquely|unit|units|university|uniform|uniformly|united|usual|usually|useful|user|users|utility|european|eucalyptus|ewe|one(?:-[a-z0-9'’]+)*-?|once(?:-[a-z0-9'’]+)*-?|used|usable|universal|u-shaped|urinary|urinalysis|urine|urethra|urethral|uremic|uterine|uterus|uromastyx)$/i;
const AN_OK = /^(?:hour|hours|honest|honestly|honor|honour|heir|herb|herbs|herbal|f\d*|fda|fiv(?:-[a-z0-9]+)*|fvrcp|suv|mri|md[a-z]*\d*)$/i;

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
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripLegal(html) {
  return html.replace(
    /<(p|div|aside|section)\b[^>]*\bclass\s*=\s*(["'])[^"']*\b(?:affiliate-disclosure|medical-disclaimer)\b[^"']*\2[^>]*>[\s\S]*?<\/\1>/gi,
    " "
  );
}

function region(html) {
  const match = html.match(/<article\b[\s\S]*?<\/article>/i) || html.match(/<main\b[\s\S]*?<\/main>/i);
  return match ? stripLegal(match[0]) : "";
}

function spaced(html) {
  return decode(
    region(html)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function collapsed(html) {
  return spaced(html).replace(/\s+/g, " ").trim();
}

function headings(html) {
  const found = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  const source = region(html);
  while ((match = re.exec(source))) {
    found.push(decode(match[2].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim());
  }
  return found;
}

const SLOT_RES = [
  /\bHow long do\s{2,}live\b/g,
  /\bAre\s{2,}noisy\b/g,
  /\bCan\s{2,}talk\b/g,
  /\bDo\s{2,}need\b/g,
  /\bOwning an?\s{2,}is\b/g,
  /\bBringing an?\s{2,}into\b/g,
  /\ba\s{2,}(?:is|into)\b/g,
  /\byour\s+'s\b/g,
  /\b(?:for|about|of)\s{2,}(?:care|health|live)\b/g,
  /\ba\s+(?:Omnivore|Insectivore|Herbivore|Carnivore)\b/g,
  /\ba\s+animal\b/g,
  /\ba\s+awake\b/g,
  /\ba\s+Active\b/g,
  /\ba\s+avoids\b/g,
  /\ba\s+into\b/g,
  /\ba\s+is\b/g,
  /\ban\s+UVB\b/g,
];

const EMPTY_HEADING = /^(?:Decision Guides for|Where to Find|Quick Answers About|Daily Care Routine for|Best Diet for|Best Food for|Best Pet Insurance(?: for)?|Get Personalized|Signs of a|Save on)\s*$/i;

function titleCore(value) {
  return value.replace(/\s*(?:\||-)\s*Pet Care Helper AI\s*$/i, "").replace(/&amp;/gi, "&").trim();
}

function titleSlots(html) {
  const found = {};
  const patterns = [
    ["og:title", /property="og:title"\s+content="([^"]*)"/i],
    ["twitter:title", /name="twitter:title"\s+content="([^"]*)"/i],
    ["title", /<title>([^<]*)<\/title>/i],
  ];
  for (const [name, re] of patterns) {
    const match = html.match(re);
    if (match) found[name] = titleCore(match[1]);
  }
  return found;
}

function articleErrors(text) {
  const hits = [];
  const re = /\b(a|an)\s+([A-Za-z][A-Za-z0-9'’-]*)/g;
  let match;
  while ((match = re.exec(text))) {
    const art = match[1].toLowerCase();
    const word = match[2];
    const vowel = "aeiou".includes(word[0].toLowerCase());
    if (art === "a" && vowel && !A_OK.test(word)) hits.push(`a ${word}`);
    if (art === "an" && !vowel && !AN_OK.test(word)) hits.push(`an ${word}`);
  }
  return hits;
}

const failures = [];
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  const html = fs.readFileSync(file, "utf8");
  const originRel = FROM_CURRENT[rel] || rel;
  const originPath = path.join(BASE, originRel);
  const origin = fs.existsSync(originPath) ? fs.readFileSync(originPath, "utf8") : "";
  const nowSpaced = spaced(html);
  const thenSpaced = origin ? spaced(origin) : "";
  const now = collapsed(html);
  const then = origin ? collapsed(origin) : "";
  for (const re of SLOT_RES) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(nowSpaced))) {
      const hit = match[0].replace(/\s+/g, " ");
      if (!then.includes(hit) && !thenSpaced.includes(match[0])) failures.push(`${rel}: ${hit}`);
    }
  }
  const originHeads = new Set(headings(origin));
  for (const heading of headings(html)) {
    if (EMPTY_HEADING.test(heading) && !originHeads.has(heading)) failures.push(`${rel}: empty heading "${heading}"`);
  }
  const originTitles = origin ? titleSlots(origin) : {};
  const currentTitles = titleSlots(html);
  for (const [name, cur] of Object.entries(currentTitles)) {
    const old = originTitles[name] || "";
    if (cur.length < 2 && old.length > 8) failures.push(`${rel}: empty ${name}`);
  }
  const originArticles = new Set(articleErrors(then));
  const seen = new Set();
  for (const hit of articleErrors(now)) {
    if (originArticles.has(hit) || seen.has(hit)) continue;
    const extra = now.split(hit).length - 1 - (then.split(hit).length - 1);
    if (extra > 0) {
      seen.add(hit);
      failures.push(`${rel}: ${hit}`);
    }
  }
}

if (failures.length) {
  console.error(`slot check failed (${failures.length})`);
  for (const line of failures.slice(0, 80)) console.error(line);
  process.exit(1);
}
console.log(`slot check ok (${walk(ROOT).length} html files)`);
