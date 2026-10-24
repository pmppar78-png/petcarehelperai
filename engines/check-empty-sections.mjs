#!/usr/bin/env node
/**
 * Fails when a page has more empty H2 sections or empty health-note
 * boxes than its origin/main copy. A page whose HTML differs from
 * origin/main also fails when a transparency notice box is empty.
 * Pages that still match origin/main may keep an empty notice box.
 *
 * An H2 section is empty when the text before the next H2 has fewer than
 * four alphabetic words. A breed-health-note box and a transparency
 * box are empty on the same test. Writing real copy, or leaving a
 * section that was already empty on an unchanged page, both pass.
 * A missing origin/main baseline is a hard error.
 *
 * Usage: node engines/check-empty-sections.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { originFile, resolveOriginBase } from "./origin-base.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function walkHtml(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "engines", "test-results", "audit"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function decode(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;|&rsquo;/gi, "'")
    .replace(/&[a-z]+;/gi, " ");
}

function region(html) {
  const article = html.match(/<article\b[\s\S]*?<\/article>/i);
  if (article) return article[0];
  const main = html.match(/<main\b[\s\S]*?<\/main>/i);
  return main ? main[0] : html;
}

function alphaWords(html) {
  const text = decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
  return text.match(/[A-Za-z]{2,}/g) || [];
}

export function emptyH2Count(html) {
  const source = region(html).replace(/<script[\s\S]*?<\/script>/gi, " ");
  const heads = [...source.matchAll(/<h2\b[^>]*>[\s\S]*?<\/h2>/gi)];
  let empty = 0;
  for (let i = 0; i < heads.length; i++) {
    const start = heads[i].index + heads[i][0].length;
    const end = i + 1 < heads.length ? heads[i + 1].index : source.length;
    if (alphaWords(source.slice(start, end)).length < 4) empty += 1;
  }
  return empty;
}

export function emptyNoteCount(html) {
  const source = region(html);
  const notes = source.match(/<div\b[^>]*class\s*=\s*["'][^"']*breed-health-note[^"']*["'][^>]*>[\s\S]*?<\/div>/gi) || [];
  return notes.filter((note) => alphaWords(note).length < 4).length;
}

export function emptyTransparencyCount(html) {
  const notes =
    html.match(/<section\b[^>]*\bclass\s*=\s*["'][^"']*\btransparency\b[^"']*["'][^>]*>[\s\S]*?<\/section>/gi) ||
    [];
  return notes.filter((note) => alphaWords(note).length < 4).length;
}

export function changedPageHasEmptyNotice(currentHtml, originHtml) {
  if (currentHtml === originHtml) return false;
  return emptyTransparencyCount(currentHtml) > 0;
}

export function emptyBeyond(currentHtml, originHtml) {
  return {
    sections: emptyH2Count(currentHtml) - emptyH2Count(originHtml),
    notes: emptyNoteCount(currentHtml) - emptyNoteCount(originHtml),
  };
}

function fixtureFailures() {
  const failures = [];
  const origin = `<article><h2>Care</h2><p>Real words live in this section today.</p><h2>Cost</h2><div class="breed-health-note"><p>Hip dysplasia, elbow dysplasia, and obesity need a screening plan.</p></div></article>`;
  const extraSection = `<article><h2>Care</h2><h2>Cost</h2><div class="breed-health-note"><p>Hip dysplasia, elbow dysplasia, and obesity need a screening plan.</p></div></article>`;
  const extraNote = `<article><h2>Care</h2><p>Real words live in this section today.</p><h2>Cost</h2><div class="breed-health-note"></div></article>`;
  const same = origin;
  const extra = emptyBeyond(extraSection, origin);
  if (extra.sections <= 0) failures.push("fixture extra empty H2 did not fail");
  const note = emptyBeyond(extraNote, origin);
  if (note.notes <= 0) failures.push("fixture empty health note did not fail");
  const held = emptyBeyond(same, origin);
  if (held.sections > 0 || held.notes > 0) failures.push("fixture matching page failed");
  const filled = emptyBeyond(
    `<article><h2>Care</h2><p>Real words live in this section today and name hip dysplasia.</p><h2>Cost</h2><p>Budget notes live in this cost section now.</p></article>`,
    `<article><h2>Care</h2><p>Real words live in this section today and name hip dysplasia.</p><h2>Cost</h2></article>`,
  );
  if (filled.sections > 0) failures.push("fixture filled section failed");
  const emptyNotice = `<main><article><p>Real words live in this section today.</p></article><section class="transparency">\n      \n    </section></main>`;
  const filledNotice = `<main><article><p>Real words live in this section today.</p></article><section class="transparency"><p><strong>Important context:</strong> Online guidance can't diagnose your pet. If something seems wrong, see your veterinarian.</p></section></main>`;
  const other = `<main><article><p>Older copy lives on the origin page.</p></article><section class="transparency"></section></main>`;
  if (!changedPageHasEmptyNotice(emptyNotice, other)) failures.push("fixture empty notice on a changed page did not fail");
  if (changedPageHasEmptyNotice(filledNotice, emptyNotice)) failures.push("fixture filled notice on a changed page failed");
  if (changedPageHasEmptyNotice(emptyNotice, emptyNotice)) failures.push("fixture identical empty notice failed");
  const noBox = `<article><p>Real words live in this section today and name the hips.</p></article>`;
  if (changedPageHasEmptyNotice(noBox, `<article><p>Older copy lives here.</p></article>`)) {
    failures.push("fixture page without a notice box failed");
  }
  return failures;
}

function main() {
  const fixture = fixtureFailures();
  if (fixture.length) {
    console.error(`empty-section fixtures failed (${fixture.length})`);
    for (const line of fixture) console.error(line);
    process.exit(1);
  }
  console.log("empty-section fixtures ok (extra H2, empty note, matching page, filled section, notice box)");
  const BASE = resolveOriginBase({ root: ROOT });
  const problems = [];
  let pages = 0;
  for (const file of walkHtml(ROOT)) {
    const rel = path.relative(ROOT, file).split(path.sep).join("/");
    const originRel = originFile(BASE, rel);
    const originPath = path.join(BASE, originRel);
    if (!fs.existsSync(originPath)) continue;
    pages += 1;
    const current = fs.readFileSync(file, "utf8");
    const origin = fs.readFileSync(originPath, "utf8");
    const delta = emptyBeyond(current, origin);
    if (delta.sections > 0) problems.push(`${rel}: ${delta.sections} empty H2 section(s) beyond main`);
    if (delta.notes > 0) problems.push(`${rel}: ${delta.notes} empty health-note box(es) beyond main`);
    if (changedPageHasEmptyNotice(current, origin)) {
      problems.push(`${rel}: empty notice box on a page this change touches`);
    }
  }
  if (problems.length) {
    console.error(`empty-section check failed (${problems.length})`);
    for (const line of problems.slice(0, 40)) console.error(line);
    process.exit(1);
  }
  console.log(`empty-section check ok (${pages} html files)`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
