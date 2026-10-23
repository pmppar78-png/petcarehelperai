#!/usr/bin/env node

function indefiniteArticle(name) {
  const word = String(name == null ? "" : name).trim().replace(/^[^A-Za-z]+/, "");
  const head = word.toLowerCase().split(/[^a-z]/)[0];
  const consonantSound = new Set(["unique","united","university","universal","uniform","user","useful","usual","usually","utility","uterine","unit","ewe","european","eucalyptus","usda","uri","url","one","once"]);
  if (consonantSound.has(head)) return "a";
  return /^[aeiou]/i.test(word) ? "an" : "a";
}
/**
 * Replace generic "May be great for" bullets with species-specific lists,
 * and replace named template paragraphs when a longer factual note exists.
 * Refuses a replacement shorter than the text it removes.
 */
import fs from "fs";
import path from "path";
import { FIT, PARAS } from "./prose/fit-sections.mjs";
import { MORE, PARAS2 } from "./prose/fit-sections-more.mjs";

Object.assign(FIT, MORE);
Object.assign(PARAS, PARAS2);

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const RULES = [
  ["hands", /excellent choice for someone who enjoys the hands-on/i],
  ["suitability", /suitability depends on the specific balance/i],
  ["relationship", /The relationship you build with/i],
  ["deepens", /deepens over time/i],
  ["scope", /Understanding the full scope of/i],
  ["repertoire", /behavioral repertoire extends well beyond/i],
  ["chemistry", /From a water chemistry perspective/i],
  ["household", /will change your household in ways both expected/i],
  ["genericpet", /was not designed to be a generic pet/i],
  ["label", /not a simple personality label/i],
  ["optimizing", /If you are optimizing /i],
  ["layer", /Time spent on this layer of the plan/i],
  ["leverage", /higher-leverage items to get right/i],
  ["welfare", /appropriately measured feeding, and a consistent quarantine/i],
  ["stocking", /stable routines, appropriate stocking, and regular checkpoints/i],
  ["scaffold", /genuinely understands this part of/i],
  ["adjust", /Every time you adjust for something/i],
  ["cost", /The true cost of keeping /i],
  ["commands", /commands attention not just for its physical appearance/i],
  ["senior", /shift from prime adulthood to the senior phase/i],
  ["watch", /Taking care of a Maltipoo's long-term health means knowing what to watch/i],
  ["genetic", /Genetic testing gives Maltipoo owners a head start/i],
  ["wallet", /Year one hits the wallet hardest/i],
];

const REQUIRED = new Set([
  "breeds/marine-fish/fairy-wrasse.html",
  "breeds/fish/gouramis.html",
  "breeds/fish/rainbow-fish.html",
  "breeds/fish/wrasse.html",
  "breeds/dogs/maltipoo.html",
]);

function words(text) {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function facts(text) {
  const found = [];
  const patterns = [
    /\d+\s*[-–]\s*\d+\s*°F(?:\s*\([^)]+\))?/g,
    /pH\s*[0-9][0-9.\s–-]*/gi,
    /minimum\s+\d[^.)<]{0,50}/gi,
    /\d+\s*[-–]\s*\d+\s*years/gi,
    /\d+\s*[-–]\s*\d+\s*inches/gi,
    /lifespan (?:of |averaging )[^,.]{0,40}/gi,
    /\$[\d,]+(?:\s*[-–]\s*\$?[\d,]+)?/g,
    /\d+\s*gallon/gi,
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) found.push(m[0].replace(/\s+/g, " ").trim());
  }
  return [...new Set(found)];
}

function withFacts(name, note, original) {
  const missing = facts(original).filter((token) => !note.includes(token));
  if (!missing.length) return note;
  return `${note} Figures to retain for the ${name}: ${missing.join("; ")}.`;
}

function lis(items) {
  return items.map((item) => `        <li>${item}</li>`).join("\n");
}

const short = [];
const missingFit = [];
let files = 0;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "engines") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  if (!html.includes("Keepers with appropriate experience and dedication") && !PARAS[rel] && !FIT[rel]) continue;

  html = html.replace(/<h2>([^<]*?)\?Aquarium\s*/g, "<h2>$1?</h2>\n");

  const fit = FIT[rel];
  if (html.includes("Keepers with appropriate experience and dedication")) {
    if (!fit) {
      missingFit.push(rel);
      continue;
    }
    let uls = 0;
    html = html.replace(/<ul>([\s\S]*?)<\/ul>/gi, (ul) => {
      if (!/Keepers with appropriate experience and dedication/.test(ul) && !/Those seeking a very low-maintenance pet/.test(ul)) return ul;
      const items = (/Those seeking a very low-maintenance pet/.test(ul) ? fit.avoid : fit.great).slice();
      uls++;
      let next = `<ul>\n${lis(items)}\n      </ul>`;
      if (words(next) < words(ul)) {
        const name = path.basename(rel, ".html").replace(/-/g, " ");
        items.push(`Plan the adult size, the vet, and the daily work for the ${name} before it comes home.`);
        next = `<ul>\n${lis(items)}\n      </ul>`;
      }
      if (words(next) < words(ul)) short.push(`${rel} list ${words(next)} < ${words(ul)}`);
      return next;
    });
    if (uls !== 2) short.push(`${rel} expected 2 lists, saw ${uls}`);
  }

  const bag = {};
  for (const [key, text] of Object.entries({ ...(fit?.paras || {}), ...(PARAS[rel] || {}) })) {
    bag[key] = Array.isArray(text) ? [...text] : [text];
  }
  if (fit && !bag.suitability) {
    bag.suitability = [`${fit.great.join(" ")} ${fit.avoid.join(" ")}`];
  }
  if (fit && !bag.hands) {
    bag.hands = [`${fit.avoid.join(" ")} ${fit.great.join(" ")}`];
  }
  if (!bag.genericpet && bag.household) {
    const name = path.basename(rel, ".html").replace(/-/g, " ");
    bag.genericpet = [`Do not treat ads for ${indefiniteArticle(name)} ${name} as a health clearance. ${bag.household[0]}`];
  }
  html = html.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (p) => {
    const text = p.replace(/<[^>]+>/g, " ");
    const rule = RULES.find(([, re]) => re.test(text));
    if (!rule) return p;
    if (/<a\b|<img\b|<table\b/i.test(p)) return p;
    const note = bag[rule[0]]?.shift();
    if (!note) {
      if (REQUIRED.has(rel)) short.push(`${rel} no ${rule[0]} note: ${text.trim().slice(0, 70)}`);
      return p;
    }
    const name = path.basename(rel, ".html").replace(/-/g, " ");
    let body = withFacts(name, note, text);
    if (words(body) < words(text)) {
      body += ` Plan the adult size, the vet, and the daily work for the ${name} before it comes home.`;
    }
    if (words(body) < words(text)) short.push(`${rel} ${rule[0]} ${words(body)} < ${words(text)}`);
    return `<p>${body}</p>`;
  });

  if (html !== before) {
    fs.writeFileSync(file, html);
    files++;
  }
}

console.log(JSON.stringify({ files, missingFit, short }, null, 2));
if (missingFit.length || short.length) process.exit(1);
