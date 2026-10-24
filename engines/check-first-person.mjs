#!/usr/bin/env node
/**
 * Fails when new guide body text claims first-person experience.
 *
 * A health page may cite a registry or a textbook. It may not say the
 * author kept, weighed, treated, measured, carried, or watched the
 * patient. Pronouns I, me, my, mine, we, our, ours, and us count, including
 * the experience verbs kept, weighed, treated, and measured. Sentences
 * already on that page's origin/main copy are exempt. Legal notices are
 * not body text. A missing origin/main baseline is a hard error.
 *
 * Usage: node engines/check-first-person.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { originFile, resolveOriginBase } from "./origin-base.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PRONOUN =
  /\b(?:I|I'd|I'll|I'm|I've|[Mm]e|[Mm]y|[Mm]ine|[Ww]e(?:'re|'ve)?|[Oo]urs?|[Uu]s)\b/;
const EXPERIENCE =
  /\b(?:I|we|my|our)\b[^.!?]{0,80}\b(?:kept|keep|weighed|weigh|treated|treat|measured|measure|carried|carry|watched|watch|lived|live|shared|share)\b|\b(?:kept|weighed|treated|measured|carried|watched)\b[^.!?]{0,40}\b(?:I|me|my|we|our)\b/i;

function walkGuides(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith(".html")) out.push(path.join(dir, name));
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
    .replace(/&[a-z]+;/gi, " ");
}

function article(html) {
  const match = html.match(/<article\b[\s\S]*?<\/article>/i) || html.match(/<main\b[\s\S]*?<\/main>/i);
  return match ? match[0] : "";
}

function bodyText(html) {
  let text = article(html);
  text = text.replace(
    /<(p|div|aside|section)\b[^>]*\bclass\s*=\s*(["'])[^"']*\b(?:affiliate-disclosure|medical-disclaimer)\b[^"']*\2[^>]*>[\s\S]*?<\/\1>/gi,
    " ",
  );
  text = text.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = decode(text.replace(/<[^>]+>/g, " "));
  return text.replace(/\s+/g, " ").trim();
}

export function sentencesOf(html) {
  const text = bodyText(html);
  const kept = [];
  for (const part of text.split(/(?<=[.!?])\s+/)) {
    const key = part.replace(/^[^A-Za-z]+/, "").replace(/[.!?]+$/, "").replace(/\s+/g, " ").trim();
    if (!key || key.split(/\s+/).length < 4) continue;
    kept.push(key);
  }
  return kept;
}

export function firstPersonHit(sentence) {
  return PRONOUN.test(sentence) || EXPERIENCE.test(sentence);
}

export function newFirstPerson(currentHtml, originHtml) {
  const origin = new Set(sentencesOf(originHtml));
  const hits = [];
  for (const sentence of sentencesOf(currentHtml)) {
    if (origin.has(sentence) || !firstPersonHit(sentence)) continue;
    hits.push(sentence);
  }
  return hits;
}

function fixtureFailures() {
  const failures = [];
  const bad = [
    "The Beagles I have kept still bay at a rabbit in the yard today.",
    "I weighed the puppy on the clinic scale Tuesday morning.",
    "We treated the ear and measured the fever twice that night.",
    "My notes from last spring still list the hip scores.",
    "Nearly all the dogs I have weighed were near their adult pounds.",
  ];
  for (const sentence of bad) {
    if (!firstPersonHit(sentence)) failures.push(`fixture missed experience claim: ${sentence}`);
  }
  const good = [
    "AKC lists males at 24-27 in.",
    "Hip dysplasia, elbow dysplasia, and obesity belong on the screening list.",
    "The registry year line reads 11 to 14.",
  ];
  for (const sentence of good) {
    if (firstPersonHit(sentence)) failures.push(`fixture flagged neutral copy: ${sentence}`);
  }
  const inherited = "The Beagles I have kept still bay at a rabbit in the yard today.";
  const page = `<article><p>${inherited}</p></article>`;
  if (newFirstPerson(page, page).length) failures.push("fixture origin sentence was not exempt");
  const fresh = `<article><p>I have carried dogs to the car with the abdomen already drum-tight.</p></article>`;
  if (!newFirstPerson(fresh, "<article><p>Older copy stays here for the clinic visit.</p></article>").length) {
    failures.push("fixture new experience claim did not fail");
  }
  return failures;
}

function main() {
  const fixture = fixtureFailures();
  if (fixture.length) {
    console.error(`first-person fixtures failed (${fixture.length})`);
    for (const line of fixture) console.error(line);
    process.exit(1);
  }
  console.log("first-person fixtures ok (experience claim, neutral sentence, origin exempt)");
  const BASE = resolveOriginBase({ root: ROOT });
  const problems = [];
  let pages = 0;
  for (const file of walkGuides(path.join(ROOT, "guides"))) {
    const rel = path.relative(ROOT, file).split(path.sep).join("/");
    const originRel = originFile(BASE, rel);
    const originPath = path.join(BASE, originRel);
    const originHtml = fs.existsSync(originPath) ? fs.readFileSync(originPath, "utf8") : "";
    const hits = newFirstPerson(fs.readFileSync(file, "utf8"), originHtml);
    pages += 1;
    for (const sentence of hits) problems.push(`${rel}: ${sentence.slice(0, 180)}`);
  }
  if (problems.length) {
    console.error(`first-person check failed (${problems.length})`);
    for (const line of problems.slice(0, 40)) console.error(line);
    process.exit(1);
  }
  console.log(`first-person check ok (${pages} guides)`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
