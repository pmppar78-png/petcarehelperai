#!/usr/bin/env node
/**
 * Fails when a masked frame in a new sentence appears on more than three pages.
 *
 * Breed and city names become "name" and digits become "#", using the same
 * masking as the cross-page prose check. A frame is the full masked sentence
 * (four or more words) or any five-word window of it that still contains a
 * content word. Function words, "name", and "#" do not count as content, so
 * a shared "while a name is the" does not fail. Windows such as
 * "at # # pounds and" do.
 *
 * Only sentences that are not already on that page's origin/main copy are
 * counted. A missing origin/main baseline is a hard error.
 *
 * Usage: node engines/check-frames.mjs
 */
import fs from "fs";
import path from "path";
import { originFile, resolveOriginBase } from "./origin-base.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const BASE = resolveOriginBase({ root: ROOT });
const MIN_WORDS = 4;
const FRAME = 5;

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "engines" || entry.name === "test-results") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function namesFrom(dir, skip) {
  const names = new Set();
  if (!fs.existsSync(dir)) return names;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith(".html") && !skip(entry.name)) {
        const slug = entry.name.replace(/\.html$/, "").replace(/-/g, " ").toLowerCase();
        if (slug.length > 3 && slug !== "index") names.add(slug);
      }
    }
  }
  return names;
}

const NAME_SET = new Set([
  ...namesFrom(path.join(ROOT, "breeds"), (name) => name.includes("-breeds")),
  ...namesFrom(path.join(ROOT, "locations"), () => false),
]);

const FUNCTION_WORDS = new Set(
  "a an the and or of to for in on with from by as at that this these those it its who which when while before after so then than into over your you they their them is are be can will if but here there not do does up out about only also just through during such other own already still where what how all any some our we has have had been being was were may might should would could".split(
    " ",
  ),
);

function decode(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;|&ldquo;|&rdquo;|&quot;/g, "'")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripLegalNotices(html) {
  return html.replace(
    /<(p|div|aside|section)\b[^>]*\bclass\s*=\s*(["'])[^"']*\b(?:affiliate-disclosure|medical-disclaimer)\b[^"']*\2[^>]*>[\s\S]*?<\/\1>/gi,
    " ",
  );
}

function regionText(html) {
  const article = html.match(/<article[\s\S]*?<\/article>/i);
  const main = html.match(/<main[\s\S]*?<\/main>/i);
  return stripLegalNotices((article || main || ["", ""])[0]);
}

function sentencesOf(html) {
  const region = regionText(html);
  if (!region) return [];
  let text = region
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|li|div|h[1-6]|td|th|tr|section|blockquote|figcaption|dd|dt|caption|a)>/gi, ". ")
    .replace(/<br\s*\/?>/gi, ". ");
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

function normalize(sentence) {
  const words = sentence.toLowerCase().match(/[a-z0-9']+/g) || [];
  const out = [];
  for (let i = 0; i < words.length; ) {
    let hit = 0;
    for (const len of [5, 4, 3, 2, 1]) {
      if (i + len > words.length) continue;
      const gram = words.slice(i, i + len).join(" ");
      if (NAME_SET.has(gram)) {
        hit = len;
        break;
      }
    }
    if (hit) {
      out.push("name");
      i += hit;
    } else {
      out.push(words[i].replace(/\d+/g, "#"));
      i += 1;
    }
  }
  return out.join(" ");
}

function framesOf(norm) {
  const words = norm.split(" ").filter(Boolean);
  const frames = [];
  if (words.length >= MIN_WORDS) frames.push(norm);
  if (words.length < FRAME) return frames;
  for (let i = 0; i <= words.length - FRAME; i++) {
    const slice = words.slice(i, i + FRAME);
    if (!slice.some((word) => word !== "#" && word !== "name" && !FUNCTION_WORDS.has(word))) continue;
    frames.push(slice.join(" "));
  }
  return frames;
}

export function changedNorms(currentHtml, originHtml) {
  const origin = new Set(sentencesOf(originHtml).map(normalize));
  const out = [];
  const seen = new Set();
  for (const sentence of sentencesOf(currentHtml)) {
    const key = normalize(sentence);
    if (key.split(" ").length < MIN_WORDS || origin.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function frameProblems(pages) {
  const hits = new Map();
  for (const page of pages) {
    const seen = new Set();
    for (const norm of page.norms) {
      for (const frame of framesOf(norm)) {
        if (seen.has(frame)) continue;
        seen.add(frame);
        if (!hits.has(frame)) hits.set(frame, []);
        hits.get(frame).push(page.rel);
      }
    }
  }
  const problems = [];
  for (const [frame, files] of hits) {
    if (files.length > 3) problems.push({ frame, files });
  }
  problems.sort((a, b) => b.files.length - a.files.length || a.frame.localeCompare(b.frame));
  return problems;
}

function page(sentence) {
  return `<article><p>${sentence}</p></article>`;
}

function fixtureFailures() {
  const slots = [
    "Coat upkeep sets the weekly bill when this dog at 10-20 pounds and 8-10 years, hip screening named, stays indoors.",
    "Farm leftovers still show up when this hound at 10-20 pounds and 8-10 years, hip screening named, stays indoors.",
    "Water work is the story when this retriever at 10-20 pounds and 8-10 years, hip screening named, stays indoors.",
    "Night barking is expected when this guardian at 10-20 pounds and 8-10 years, hip screening named, stays indoors.",
  ];
  const distinct = [
    "Hand stripping keeps a wiry jacket honest during a long daily outing.",
    "Baying follows a scent until the trail ends outside the yard.",
    "Night patrol with barking is the livestock guardian habit.",
    "Daily face cleaning keeps short nose folds dry after meals.",
  ];
  const empty = "<article></article>";
  const slotPages = (list) =>
    list.map((sentence, index) => ({
      rel: `fixture-slot-${index}.html`,
      norms: changedNorms(page(sentence), empty),
    }));
  const failures = [];
  const four = frameProblems(slotPages(slots));
  if (!four.length) failures.push("fixture four shared slot sentences did not fail");
  if (!four.some((item) => /pounds|screening/.test(item.frame))) {
    failures.push("fixture shared slot did not fail on the weight or screening frame");
  }
  if (frameProblems(slotPages(slots.slice(0, 3))).length) failures.push("fixture three shared slot sentences failed");
  const distinctPages = distinct.map((sentence, index) => ({
    rel: `fixture-distinct-${index}.html`,
    norms: changedNorms(page(sentence), empty),
  }));
  if (distinctPages.some((item) => !item.norms.length)) failures.push("fixture distinct sentence was not read");
  if (frameProblems(distinctPages).length) failures.push("fixture four distinct sentences failed");
  const exempt = slots.map((sentence, index) => ({
    rel: `fixture-origin-${index}.html`,
    norms: changedNorms(page(sentence), page(sentence)),
  }));
  if (exempt.some((item) => item.norms.length)) failures.push("fixture origin sentence was treated as new");
  if (frameProblems(exempt).length) failures.push("fixture origin sentences failed");
  return failures;
}

const fixture = fixtureFailures();
if (fixture.length) {
  console.error(`frame fixtures failed (${fixture.length})`);
  for (const line of fixture) console.error(line);
  process.exit(1);
}
console.log("frame fixtures ok (shared slot, three pages, distinct sentences, origin exempt)");

const pages = [];
let htmlFiles = 0;
for (const file of walkHtml(ROOT)) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  const originRel = originFile(BASE, rel);
  const originPath = path.join(BASE, originRel);
  const originHtml = fs.existsSync(originPath) ? fs.readFileSync(originPath, "utf8") : "";
  htmlFiles += 1;
  const norms = changedNorms(fs.readFileSync(file, "utf8"), originHtml);
  if (norms.length) pages.push({ rel, norms });
}

const problems = frameProblems(pages);
if (problems.length) {
  console.error(`frame check failed (${problems.length} frames)`);
  for (const item of problems.slice(0, 40)) {
    console.error(`${item.files.length} pages: ${item.frame}`);
    console.error(`  e.g. ${item.files.slice(0, 4).join(", ")}`);
  }
  process.exit(1);
}
console.log(`frame check ok (${htmlFiles} html files)`);
