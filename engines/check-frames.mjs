#!/usr/bin/env node
/**
 * Fails when a masked frame in a new sentence appears on more than three pages.
 *
 * Breed and city names become "name" and digits become "#", using the same
 * masking as the cross-page prose check. A frame is the full masked sentence
 * (four or more words) or any three-, four-, or five-word window that still
 * contains a content word. Function-word skeletons are counted too: "while a
 * name", "while an name", "a name while a name" (and the a/an variants), and
 * "define/defines a/an name". A sentence-final ", and <np> is the <noun>"
 * is counted on its own and fails above ten pages. A sentence may start with
 * a lowercase word. Article is read first, then main, then body. An html
 * document with none of those is an error. A fragment with none of them is
 * read whole, so the prose is not dropped.
 *
 * Only sentences that are not already on that page's origin/main copy are
 * counted. A missing origin/main baseline is a hard error.
 *
 * Usage: node engines/check-frames.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { originFile, resolveOriginBase } from "./origin-base.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const MIN_WORDS = 4;
const WIDTHS = [3, 4, 5];
const CLOSER_LIMIT = 10;
const STOCK_CLOSER = /,\s+and\s+(?:[A-Za-z0-9'’-]+\s+)+is\s+the\s+[A-Za-z0-9'’-]+(?:\s+[A-Za-z0-9'’-]+)*$/i;

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

export function readableRegion(html) {
  const article = html.match(/<article[\s\S]*?<\/article>/i);
  const main = html.match(/<main[\s\S]*?<\/main>/i);
  const body = html.match(/<body[\s\S]*?<\/body>/i);
  if (article) return stripLegalNotices(article[0]);
  if (main) return stripLegalNotices(main[0]);
  if (body) return stripLegalNotices(body[0]);
  if (/<html\b/i.test(html)) return null;
  return stripLegalNotices(html);
}

export function sentencesOf(html) {
  const region = readableRegion(html);
  if (region == null) return [];
  let text = region
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|li|div|h[1-6]|td|th|tr|section|blockquote|figcaption|dd|dt|caption|a)>/gi, ". ")
    .replace(/<br\s*\/?>/gi, ". ");
  text = decode(text.replace(/<[^>]+>/g, " "));
  const kept = [];
  for (const part of text.split(/(?<=[.!?])\s+/)) {
    const key = part.replace(/^[^A-Za-z]+/, "").replace(/[.!?]+$/, "").replace(/\s+/g, " ").trim();
    if (!key || !/[A-Za-z]/.test(key)) continue;
    if (key.split(/\s+/).length < MIN_WORDS) continue;
    kept.push(key);
  }
  return kept;
}

export function normalize(sentence) {
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

function functionFrames(words) {
  const frames = [];
  for (let i = 0; i < words.length; i++) {
    const a = words[i];
    const b = words[i + 1];
    const c = words[i + 2];
    const d = words[i + 3];
    const e = words[i + 4];
    if (a === "while" && (b === "a" || b === "an") && c === "name") frames.push(`while ${b} name`);
    if ((a === "define" || a === "defines") && (b === "a" || b === "an") && c === "name") {
      frames.push(`${a} ${b} name`);
    }
    if ((a === "a" || a === "an") && b === "name" && c === "while" && (d === "a" || d === "an") && e === "name") {
      frames.push(`${a} name while ${d} name`);
    }
  }
  return frames;
}

export function framesOf(norm) {
  const words = norm.split(" ").filter(Boolean);
  const frames = [];
  if (words.length >= MIN_WORDS) frames.push(norm);
  for (const width of WIDTHS) {
    if (words.length < width) continue;
    for (let i = 0; i <= words.length - width; i++) {
      const slice = words.slice(i, i + width);
      if (!slice.some((word) => word !== "#" && word !== "name" && !FUNCTION_WORDS.has(word))) continue;
      frames.push(slice.join(" "));
    }
  }
  frames.push(...functionFrames(words));
  return frames;
}

export function changedSentences(currentHtml, originHtml) {
  const origin = new Set(sentencesOf(originHtml).map(normalize));
  const out = [];
  const seen = new Set();
  for (const sentence of sentencesOf(currentHtml)) {
    const key = normalize(sentence);
    if (key.split(" ").length < MIN_WORDS || origin.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(sentence);
  }
  return out;
}

export function changedNorms(currentHtml, originHtml) {
  return changedSentences(currentHtml, originHtml).map(normalize);
}

export function isStockCloser(sentence) {
  const key = sentence.replace(/[.!?]+$/, "").replace(/\s+/g, " ").trim();
  return STOCK_CLOSER.test(key);
}

export function stockCloserProblems(pages, limit = CLOSER_LIMIT) {
  const files = [];
  for (const page of pages) {
    if ((page.sentences || []).some(isStockCloser)) files.push(page.rel);
  }
  if (files.length > limit) return [{ frame: ", and <np> is the <noun>", files }];
  return [];
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
  const lower = "and the coat upkeep sets the weekly bill at 10-20 pounds and 8-10 years, hip screening named.";
  const whileSentences = [
    "Owners like a quiet yard while a Collie watches the gate.",
    "Kids play outside while a Beagle follows the scent.",
    "Rain stays out while a Poodle shakes on the porch.",
    "Dinner waits inside while a Boxer guards the bowl.",
  ];
  const defineSentences = [
    "Handlers define a Collie through herding drive outdoors.",
    "Trainers define a Poodle through clipper dates at home.",
    "Owners define a Boxer through annual heart checks.",
    "Clinics define a Vizsla through the velcro habit indoors.",
  ];
  const pairedSentences = [
    "Choose a Collie while a Beagle stays home for the morning.",
    "Feed a Poodle while a Boxer waits outside the kitchen.",
    "Brush a Vizsla while a Whippet naps on the couch.",
    "Walk a Siberian Husky while a Great Dane rests near the sofa.",
  ];
  const chooseSentences = [
    "Owners so choose a Collie for the herding day.",
    "Families so choose a Poodle for the clipper plan.",
    "Handlers so choose a Boxer for the athletic week.",
    "Clinics so choose a Vizsla for the velcro habit.",
  ];
  const empty = "<article></article>";
  const asPages = (list, prefix, wrap = page) =>
    list.map((sentence, index) => ({
      rel: `${prefix}-${index}.html`,
      norms: changedNorms(wrap(sentence), wrap("")),
    }));
  const failures = [];
  const four = frameProblems(asPages(slots, "fixture-slot"));
  if (!four.length) failures.push("fixture four shared slot sentences did not fail");
  if (!four.some((item) => /pounds|screening/.test(item.frame))) {
    failures.push("fixture shared slot did not fail on the weight or screening frame");
  }
  if (frameProblems(asPages(slots.slice(0, 3), "fixture-slot3")).length) {
    failures.push("fixture three shared slot sentences failed");
  }
  const distinctPages = asPages(distinct, "fixture-distinct");
  if (distinctPages.some((item) => !item.norms.length)) failures.push("fixture distinct sentence was not read");
  if (frameProblems(distinctPages).length) failures.push("fixture four distinct sentences failed");
  const exempt = slots.map((sentence, index) => ({
    rel: `fixture-origin-${index}.html`,
    norms: changedNorms(page(sentence), page(sentence)),
  }));
  if (exempt.some((item) => item.norms.length)) failures.push("fixture origin sentence was treated as new");
  if (frameProblems(exempt).length) failures.push("fixture origin sentences failed");

  const lowerPages = asPages([lower, lower, lower, lower], "fixture-lower");
  if (lowerPages.some((item) => !item.norms.length)) failures.push("fixture lowercase sentence was skipped");
  if (!frameProblems(lowerPages).length) failures.push("fixture lowercase-start bypass did not fail");
  if (frameProblems(asPages([lower, lower, lower], "fixture-lower3")).length) {
    failures.push("fixture three lowercase sentences failed");
  }

  const bodyWrap = (sentence) => `<body><p>${sentence}</p></body>`;
  const bodyPages = asPages([lower, lower, lower, lower], "fixture-body", bodyWrap);
  if (bodyPages.some((item) => !item.norms.length)) failures.push("fixture body page sentence was not read");
  if (!frameProblems(bodyPages).length) failures.push("fixture page with no article tag did not fail");
  const noBody = `<html><head><title>Loose</title></head><p>${lower}</p></html>`;
  if (readableRegion(noBody) !== null) failures.push("fixture html without article, main, or body was read");

  const whileFour = frameProblems(asPages(whileSentences, "fixture-while"));
  if (!whileFour.some((item) => item.frame === "while a name")) {
    failures.push("fixture function-word frame while a name did not fail");
  }
  if (frameProblems(asPages(whileSentences.slice(0, 3), "fixture-while3")).length) {
    failures.push("fixture three while-a-name sentences failed");
  }
  const defineFour = frameProblems(asPages(defineSentences, "fixture-define"));
  if (!defineFour.some((item) => item.frame === "define a name")) {
    failures.push("fixture define a name did not fail");
  }
  if (frameProblems(asPages(defineSentences.slice(0, 3), "fixture-define3")).length) {
    failures.push("fixture three define-a-name sentences failed");
  }
  const pairedFour = frameProblems(asPages(pairedSentences, "fixture-paired"));
  if (!pairedFour.some((item) => item.frame === "a name while a name")) {
    failures.push("fixture a name while a name did not fail");
  }
  if (frameProblems(asPages(pairedSentences.slice(0, 3), "fixture-paired3")).length) {
    failures.push("fixture three a-name-while-a-name sentences failed");
  }
  const chooseFour = frameProblems(asPages(chooseSentences, "fixture-choose"));
  if (!chooseFour.some((item) => item.frame === "so choose a name" || item.frame === "choose a name")) {
    failures.push("fixture so choose a name did not fail");
  }
  if (frameProblems(asPages(chooseSentences.slice(0, 3), "fixture-choose3")).length) {
    failures.push("fixture three so-choose sentences failed");
  }
  const closerNouns = [
    "constant",
    "issue",
    "skill",
    "worry",
    "problem",
    "habit",
    "task",
    "chore",
    "focus",
    "limit",
    "pattern",
  ];
  const closerSentences = closerNouns.map(
    (noun, index) => `Crew ${index} brushes the dog, and coat care is the ${noun}.`,
  );
  const asCloser = (list) =>
    list.map((sentence, index) => ({ rel: `fixture-closer-${index}.html`, sentences: [sentence] }));
  if (!stockCloserProblems(asCloser(closerSentences)).length) {
    failures.push("fixture stock closer on 11 pages did not fail");
  }
  if (stockCloserProblems(asCloser(closerSentences.slice(0, 10))).length) {
    failures.push("fixture ten stock closers failed");
  }
  if (isStockCloser("Owners brush weekly and shedding is the constant.")) {
    failures.push("fixture closer matched without the comma");
  }
  if (!isStockCloser("Owners brush weekly, and shedding is the constant.")) {
    failures.push("fixture closer missed a sentence-final and-np-is-the-noun");
  }
  return failures;
}

function main() {
  const BASE = resolveOriginBase({ root: ROOT });
  const fixture = fixtureFailures();
  if (fixture.length) {
    console.error(`frame fixtures failed (${fixture.length})`);
    for (const line of fixture) console.error(line);
    process.exit(1);
  }
  console.log(
    "frame fixtures ok (shared slot, three pages, distinct sentences, origin exempt, lowercase start, body without article, function-word frame, so choose a name, stock closer)",
  );

  const pages = [];
  const bare = [];
  let htmlFiles = 0;
  for (const file of walkHtml(ROOT)) {
    const rel = path.relative(ROOT, file).split(path.sep).join("/");
    const originRel = originFile(BASE, rel);
    const originPath = path.join(BASE, originRel);
    const originHtml = fs.existsSync(originPath) ? fs.readFileSync(originPath, "utf8") : "";
    const html = fs.readFileSync(file, "utf8");
    htmlFiles += 1;
    if (readableRegion(html) == null) {
      bare.push(`${rel}: no article, main, or body`);
      continue;
    }
    const sentences = changedSentences(html, originHtml);
    const norms = sentences.map(normalize);
    if (norms.length) pages.push({ rel, norms, sentences });
  }

  const problems = frameProblems(pages);
  const closers = stockCloserProblems(pages);
  if (problems.length || bare.length || closers.length) {
    if (bare.length) {
      console.error(`frame check failed (${bare.length} pages with no article, main, or body)`);
      for (const line of bare.slice(0, 20)) console.error(line);
    }
    if (problems.length) {
      console.error(`frame check failed (${problems.length} frames)`);
      for (const item of problems.slice(0, 40)) {
        console.error(`${item.files.length} pages: ${item.frame}`);
        console.error(`  e.g. ${item.files.slice(0, 4).join(", ")}`);
      }
    }
    if (closers.length) {
      const item = closers[0];
      console.error(`stock closer check failed (${item.files.length} pages: ${item.frame})`);
      console.error(`  e.g. ${item.files.slice(0, 6).join(", ")}`);
    }
    process.exit(1);
  }
  console.log(`frame check ok (${htmlFiles} html files)`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
