#!/usr/bin/env node
/**
 * Replace stock bird and small-animal overview paragraphs with the essays
 * in bird-openers.mjs, small-openers-a.mjs, and small-openers-b.mjs.
 * One-shot. Refuses a page whose essay is shorter than the text it removes,
 * and does not write that page.
 */
import fs from "fs";
import path from "path";
import { OPENERS_BIRDS } from "./prose/bird-openers.mjs";
import { OPENERS_SMALL_A } from "./prose/small-openers-a.mjs";
import { OPENERS_SMALL_B } from "./prose/small-openers-b.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OPENERS = { ...OPENERS_BIRDS, ...OPENERS_SMALL_A, ...OPENERS_SMALL_B };

const FILLER = [
  /popular pet bird species known for/i,
  /Whether you are a first-time owner/i,
  /represents one of the most fascinating/i,
  /range of social and cognitive capabilities/i,
  /physical environment you create for your/i,
  /one of its most captivating qualities/i,
  /Understanding the social dynamics of/i,
  /Vocalization patterns in /i,
  /Diet has a compounding effect/i,
  /unique pet species known for/i,
  /has captivated pet owners/i,
  /popularity of .+ as pets has grown significantly/i,
  /rewarding small animal companion that brings unique/i,
  /most common misconceptions about/i,
  /social, intelligent animals that benefit enormously/i,
  /becomes most evident once the animal has settled/i,
  /well-balanced personality that/i,
  /Effective training uses positive reinforcement to build desired behaviors while strengthening the bond/i,
  /Regular grooming is about more than appearance/i,
  /are known for being /i,
];

function words(text) {
  return text.replace(/<[^>]+>/g, " ").replace(/&amp;/gi, " & ").replace(/\s+/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const short = [];
const missing = [];
const uneven = [];
let files = 0;

for (const [key, paras] of Object.entries(OPENERS)) {
  const file = path.join(ROOT, "breeds", `${key}.html`);
  if (!fs.existsSync(file)) {
    missing.push(`${key} (no file)`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const artMatch = html.match(/<article[\s\S]*?<\/article>/i);
  if (!artMatch) {
    missing.push(`${key} (no article)`);
    continue;
  }
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
  if (!hits.length) {
    missing.push(`${key} (no filler)`);
    continue;
  }
  const removed = hits.reduce((n, h) => n + words(h.inner), 0);
  const added = words(paras.join(" "));
  if (added < removed) {
    short.push(`${key} ${added}<${removed}`);
    continue;
  }
  if (paras.length < hits.length) uneven.push(`${key} essay ${paras.length} < slots ${hits.length}`);
  const chunks = paras.map((p) => `<p>${esc(p)}</p>`);
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
  console.error(JSON.stringify({ files, short, missing, uneven }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ files, uneven }));
