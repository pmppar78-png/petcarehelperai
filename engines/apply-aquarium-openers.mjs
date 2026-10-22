#!/usr/bin/env node
/**
 * Replace the stock aquarium overview paragraphs with the species essays
 * in aquarium-openers-a.mjs and aquarium-openers-b.mjs.
 * One-shot. Refuses a page whose essay is shorter than the text it removes.
 */
import fs from "fs";
import path from "path";
import { OPENERS_A } from "./prose/aquarium-openers-a.mjs";
import { OPENERS_B } from "./prose/aquarium-openers-b.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OPENERS = { ...OPENERS_A, ...OPENERS_B };

const FILLER = [
  /popular aquarium species known for/i,
  /Whether you are a first-time owner/i,
  /Understanding the full scope of/i,
  /behavioral repertoire extends well beyond/i,
  /The behavioral complexity of/i,
  /are known for being /i,
  /display .+ behavior and can coexist/i,
  /From a water chemistry perspective, maintaining an aquarium/i,
  /most reliable results come from parameter consistency/i,
  /In community aquarium settings, understanding/i,
];

function words(text) {
  return text.replace(/<[^>]+>/g, " ").replace(/&amp;/gi, " & ").replace(/\s+/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const short = [];
const missing = [];
let files = 0;

for (const [key, paras] of Object.entries(OPENERS)) {
  const file = path.join(ROOT, "breeds", `${key}.html`);
  if (!fs.existsSync(file)) {
    missing.push(`${key} (no file)`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const artMatch = html.match(/<article[\s\S]*?<\/article>/i);
  if (!artMatch) continue;
  const article = artMatch[0];
  const re = /<p>([\s\S]*?)<\/p>/gi;
  const hits = [];
  let m;
  while ((m = re.exec(article))) {
    const inner = m[1];
    if (/<a\b|<img|<table/i.test(inner)) continue;
    if (!FILLER.some((r) => r.test(inner))) continue;
    hits.push({ start: m.index, end: m.index + m[0].length, inner });
  }
  if (!hits.length) continue;
  const removed = hits.reduce((n, h) => n + words(h.inner), 0);
  const added = words(paras.join(" "));
  if (added < removed) {
    short.push(`${key} ${added}<${removed}`);
    continue;
  }
  const chunks = paras.map((p) => `<p>${esc(p)}</p>`);
  // One essay paragraph per removed slot. Extra essay paragraphs stay with the last slot.
  const slots = hits.map(() => []);
  chunks.forEach((chunk, i) => {
    const slot = Math.min(i, slots.length - 1);
    slots[slot].push(chunk);
  });
  let next = "";
  let cursor = 0;
  hits.forEach((hit, i) => {
    next += article.slice(cursor, hit.start);
    next += slots[i].join("\n");
    cursor = hit.end;
  });
  next += article.slice(cursor);
  const out = html.replace(article, next);
  fs.writeFileSync(file, out);
  files++;
}

if (short.length || missing.length) {
  console.error(JSON.stringify({ files, short, missing }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ files }));
