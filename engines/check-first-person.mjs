#!/usr/bin/env node
/**
 * Fails when new body text claims first-person experience or a clinic persona.
 *
 * A health page may cite a registry or a textbook. It may not say the
 * author kept, weighed, treated, measured, carried, or watched a patient.
 * Pronouns are matched without a minimum sentence length: I, i, me, my,
 * mine, myself, we, our, ours, ourselves, us, and let's. Persona phrases
 * count too: this writer, this author, in this or our practice or clinic,
 * speaking as a vet or vet tech, as a vet or vet tech, the patient,
 * here at the clinic, yours truly, personally, and having measured,
 * treated, or seen. Also speaking from experience, this vet has seen,
 * the author has, years in practice, your correspondent, the clinic
 * team here, the staff at this practice, this reviewer, take it
 * from a groomer, the present author, and the apostrophe-less
 * forms Ive and Im. General patterns also match this or our
 * clinic, practice, hospital, vet, or groomer; folks at this;
 * the undersigned; a humble writer; the grooming table; at the
 * practice, clinic, or hospital; a vet who has seen; and
 * speaking for the practice.
 * Article is read first, then main, then body. Guides, breeds, and the
 * other content directories are scanned. Sentences already on that page's
 * origin/main copy are exempt. Legal notices are not body text. A missing
 * origin/main baseline is a hard error.
 *
 * Usage: node engines/check-first-person.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { originFile, resolveOriginBase } from "./origin-base.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SKIP = new Set(["node_modules", ".git", "engines", "test-results", "audit"]);
const PRONOUN =
  /\b(?:i|i'd|i'll|i'm|i've|ive|im|me|my|mine|myself|we|we're|we've|our|ours|ourselves|us|let's|let’s)\b/i;
const PERSONA =
  /\b(?:this writer|this author|in (?:this|our) (?:practice|clinic)|speaking as a vet(?: tech)?|as a vet(?: tech)?|the patient|here at the clinic|yours truly|personally|having (?:measured|treated|seen)|speaking from experience|this vet has seen|the author has|years in practice|your correspondent|the clinic team here|the staff at this practice|this reviewer|take it from a groomer|the present author|(?:this|our) (?:clinic|practice|hospital|vet|groomer)|folks at this|the undersigned|humble writer|grooming table|at the (?:practice|clinic|hospital)|vet who has seen|speaking for the practice)\b/i;
const EXPERIENCE =
  /\b(?:i|we|my|our|myself|ourselves)\b[^.!?]{0,80}\b(?:kept|keep|weighed|weigh|treated|treat|measured|measure|carried|carry|watched|watch|lived|live|shared|share)\b|\b(?:kept|weighed|treated|measured|carried|watched)\b[^.!?]{0,40}\b(?:i|me|my|we|our|myself|ourselves)\b/i;

export function contentFiles(root) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (SKIP.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith(".html")) out.push(full);
    }
  }
  return out.sort();
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

export function readableRegion(html) {
  const article = html.match(/<article\b[\s\S]*?<\/article>/i);
  const main = html.match(/<main\b[\s\S]*?<\/main>/i);
  const body = html.match(/<body\b[\s\S]*?<\/body>/i);
  if (article) return article[0];
  if (main) return main[0];
  if (body) return body[0];
  if (/<html\b/i.test(html)) return "";
  return html;
}

function bodyText(html) {
  let text = readableRegion(html);
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
    if (!key || !/[A-Za-z]/.test(key)) continue;
    kept.push(key);
  }
  return kept;
}

export function firstPersonHit(sentence) {
  return PRONOUN.test(sentence) || PERSONA.test(sentence) || EXPERIENCE.test(sentence);
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
    ["kept", "The Beagles I have kept still bay at a rabbit in the yard today."],
    ["weighed", "I weighed the puppy on the clinic scale Tuesday morning."],
    ["treated", "We treated the ear and measured the fever twice that night."],
    ["my", "My notes from last spring still list the hip scores."],
    ["myself", "Myself, the scale read high before breakfast."],
    ["lets", "Let's weigh the puppy before the walk."],
    ["lowercase-i", "i think the ears look dirty this morning."],
    ["ourselves", "Ourselves included, every dog in the ward was weighed."],
    ["writer", "This writer has measured adult dogs for years."],
    ["practice", "The dogs seen in this practice were mostly seniors."],
    ["vet-tech", "Speaking as a vet tech, the ears were already infected."],
    ["patient", "The patient was lifted for a closer look at the hips."],
    ["clinic", "Here at the clinic the patients wait on the bench."],
    ["yours", "Yours truly weighed the puppy before breakfast."],
    ["personally", "Personally, the ears looked infected that morning."],
    ["having-measured", "Having measured dozens of Labs, the hip scores were often disappointing."],
    ["having-treated", "Having treated the ear overnight, the swelling was down by morning."],
    ["having-seen", "Having seen the seizure, the timing was written down."],
    ["experience", "Speaking from experience, the ears were already red that morning."],
    ["this-vet", "This vet has seen that seizure pattern in young hounds."],
    ["author-has", "The author has raised Beagles and still loses them to a scent."],
    ["years-practice", "Over twenty years in practice, the hips were scored the same way."],
    ["ive", "Ive weighed the puppy before breakfast."],
    ["im", "Im the one who measured the hips that morning."],
    ["correspondent", "Your correspondent has weighed Labs on that scale."],
    ["clinic-team", "The clinic team here has treated that ear twice."],
    ["staff-practice", "The staff at this practice weigh the puppy before breakfast."],
    ["reviewer", "This reviewer has seen that ear infection twice."],
    ["groomer", "Take it from a groomer: the ears were sour."],
    ["present-author", "The present author weighed the puppy on Tuesday."],
    ["undersigned", "The undersigned recommends weighing the puppy before breakfast."],
    ["vet-seen", "Trust a vet who has seen it: the ears were sour."],
    ["this-groomer", "This groomer has clipped that coat for years."],
    ["down-practice", "Down at the practice the scale sits by the door."],
    ["grooming-table", "After a decade at the grooming table, the ears were always sour."],
    ["hospital-team", "The team at this hospital weighed the puppy."],
    ["folks", "Folks at this clinic weigh the puppy before breakfast."],
    ["anyone-clinic", "Ask anyone at this clinic about that ear."],
    ["speaking-practice", "Speaking for the practice, the hips were scored that morning."],
    ["humble", "Your humble writer weighed the puppy on Tuesday."],
    ["back-when", "Back when this vet trained, the hips were scored by hand."],
    ["our-groomer", "Our groomer weighed the puppy before the bath."],
    ["short", "I weighed him."],
  ];
  for (const [label, sentence] of bad) {
    if (!firstPersonHit(sentence)) failures.push(`fixture missed ${label}: ${sentence}`);
  }
  const good = [
    "AKC lists males at 24-27 in.",
    "Hip dysplasia, elbow dysplasia, and obesity belong on the screening list.",
    "The registry year line reads 11 to 14.",
    "Be patient with a puppy who mouths sleeves.",
    "Ask a veterinarian before the next vaccine visit.",
    "Ask your vet before the next vaccine visit.",
    "The author of the textbook lists the hip scores.",
    "AKC lists a span of 10 to 12 years.",
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
  const short = `<article><p>I weighed him.</p></article>`;
  if (!newFirstPerson(short, "<article><p>Older copy stays here.</p></article>").length) {
    failures.push("fixture short sentence was skipped");
  }
  const bodyOnly = `<html><body><p>I have weighed puppies on that scale.</p></body></html>`;
  if (!sentencesOf(bodyOnly).length) failures.push("fixture body fallback found no sentence");
  if (!newFirstPerson(bodyOnly, "<html><body><p>Older copy stays here.</p></body></html>").length) {
    failures.push("fixture body-only page was not scanned");
  }
  const outside = `<html><body><article><p>AKC lists males at 24-27 in.</p></article><p>I weighed him.</p></body></html>`;
  if (newFirstPerson(outside, "<article><p>Different origin copy lives here.</p></article>").length) {
    failures.push("fixture text outside article was scanned");
  }
  const files = contentFiles(ROOT).map((file) => file.split(path.sep).join("/"));
  if (!files.some((file) => file.includes("/breeds/"))) failures.push("fixture walker missed breeds/");
  if (!files.some((file) => file.includes("/guides/hero/"))) failures.push("fixture walker missed guides/hero/");
  if (!files.some((file) => /\/guides\/[^/]+\.html$/.test(file))) failures.push("fixture walker missed guides/");
  return failures;
}

function main() {
  const fixture = fixtureFailures();
  if (fixture.length) {
    console.error(`first-person fixtures failed (${fixture.length})`);
    for (const line of fixture) console.error(line);
    process.exit(1);
  }
  console.log("first-person fixtures ok (pronouns, persona, clinic voice, experience, Ive/Im, correspondent, staff, reviewer, groomer, present author, undersigned, folks, humble writer, short sentence, body fallback, content dirs)");
  const BASE = resolveOriginBase({ root: ROOT });
  const problems = [];
  let pages = 0;
  for (const file of contentFiles(ROOT)) {
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
  console.log(`first-person check ok (${pages} html files)`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
