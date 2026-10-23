#!/usr/bin/env node
/**
 * Tables, affiliate lines, and short paragraphs stay aligned with origin/main.
 *
 * A table cell whose inner HTML differs from that page's origin/main cell
 * fails, including an added or missing cell. A line that ends in "</a> -"
 * fails. A paragraph of fewer than four words fails when that text is not
 * already on the origin/main page. Notices are not paragraphs for this check.
 * A missing origin/main baseline is a hard error.
 *
 * Usage: node engines/check-structure.mjs
 */
import fs from "fs";
import path from "path";
import { originFile, resolveOriginBase } from "./origin-base.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const BASE = resolveOriginBase({ root: ROOT });

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
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

export function tableCells(html) {
  const tables = [...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)].map((match) => match[0]);
  return tables.map((table) =>
    [...table.matchAll(/<(t[dh])\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => match[2]),
  );
}

export function danglingAffiliateLines(html) {
  return html.split("\n").filter((line) => /<\/a>\s*-\s*$/.test(line));
}

export function visiblePage(html) {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

export function shortParagraphs(html) {
  const out = [];
  const re = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = re.exec(html))) {
    if (/\b(?:affiliate-disclosure|medical-disclaimer)\b/i.test(match[1])) continue;
    const text = decode(match[2].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    if (!text) continue;
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 4) out.push(text);
  }
  return out;
}

export function structureProblems(currentHtml, originHtml, rel) {
  const problems = [];
  const currentCells = tableCells(currentHtml);
  const originCells = tableCells(originHtml);
  if (currentCells.length !== originCells.length) {
    problems.push(`${rel}: table count ${currentCells.length} vs main ${originCells.length}`);
  }
  const tables = Math.max(currentCells.length, originCells.length);
  for (let t = 0; t < tables; t++) {
    const current = currentCells[t] || [];
    const origin = originCells[t] || [];
    if (current.length !== origin.length) {
      problems.push(`${rel}: table ${t + 1} has ${current.length} cells vs main ${origin.length}`);
    }
    const cells = Math.max(current.length, origin.length);
    for (let c = 0; c < cells; c++) {
      if ((current[c] || "") !== (origin[c] || "")) {
        problems.push(`${rel}: table cell differs: ${(current[c] || "").replace(/\s+/g, " ").trim().slice(0, 80)}`);
        break;
      }
    }
  }
  const dangling = danglingAffiliateLines(currentHtml);
  if (dangling.length) problems.push(`${rel}: affiliate line ends with </a> -: ${dangling[0].trim().slice(-80)}`);
  const originText = visiblePage(originHtml);
  for (const text of shortParagraphs(currentHtml)) {
    if (!originText.includes(text)) problems.push(`${rel}: paragraph under 4 words is not on main: ${text.slice(0, 80)}`);
  }
  return problems;
}

function fixtureFailures() {
  const origin = `<table><tr><td>Very Small (5 in)</td><td>Good with Other Pets</td></tr></table>
<p><a href="https://www.chewy.com">Chewy</a> - Save 35% on supplies</p>
<p>This sentence is already on the page.</p>`;
  const bad = `<table><tr><td>Very. Small (5 in).</td><td>Good. With Other Pets.</td></tr></table>
<p>
  <a href="https://www.chewy.com">Chewy</a> - 
</p>
<p>35%.</p>
<p>This sentence is already on the page.</p>`;
  const clean = origin;
  const failures = [];
  if (!structureProblems(bad, origin, "fixture").length) failures.push("fixture damaged page did not fail");
  const kinds = structureProblems(bad, origin, "fixture").join("\n");
  if (!/table cell differs/.test(kinds)) failures.push("fixture missed a changed table cell");
  if (!/<\/a> -/.test(kinds)) failures.push("fixture missed a dangling affiliate line");
  if (!/under 4 words/.test(kinds)) failures.push("fixture missed a short paragraph");
  if (structureProblems(clean, origin, "fixture").length) failures.push("fixture clean page failed");
  return failures;
}

const fixture = fixtureFailures();
if (fixture.length) {
  console.error(`structure fixtures failed (${fixture.length})`);
  for (const line of fixture) console.error(line);
  process.exit(1);
}
console.log("structure fixtures ok (changed cell, dangling affiliate line, short paragraph)");

const failures = [];
let pages = 0;
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  const originRel = originFile(BASE, rel);
  const originPath = path.join(BASE, originRel);
  if (!fs.existsSync(originPath)) continue;
  pages += 1;
  failures.push(...structureProblems(fs.readFileSync(file, "utf8"), fs.readFileSync(originPath, "utf8"), rel));
}

if (failures.length) {
  console.error(`structure check failed (${failures.length})`);
  for (const line of failures.slice(0, 80)) console.error(line);
  process.exit(1);
}
console.log(`structure check ok (${pages} html files)`);
