#!/usr/bin/env node
/**
 * Fails if the same sentence, or a breed-name swap of it, appears on more
 * than three pages. Tables and affiliate-callout boxes are prose. Short
 * sentences are included. Every directory is scanned.
 *
 * A sentence here is text inside p, li, td, or th (so a heading is not a
 * sentence). Fragments under five words are skipped so labels such as
 * "Home" are not treated as prose.
 *
 * Usage: node engines/check-prose-cross.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const MIN_WORDS = 5;

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "engines" || entry.name === "test-results") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function breedNames() {
  const names = new Set();
  const breeds = path.join(ROOT, "breeds");
  if (!fs.existsSync(breeds)) return names;
  const stack = [breeds];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith(".html") && !entry.name.includes("-breeds")) {
        const slug = entry.name.replace(/\.html$/, "").replace(/-/g, " ").toLowerCase();
        if (slug.length > 3) names.add(slug);
      }
    }
  }
  return names;
}

const NAME_SET = breedNames();

function decode(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;|&ldquo;|&rdquo;|&quot;/g, "'")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function regionText(html) {
  const article = html.match(/<article[\s\S]*?<\/article>/i);
  const main = html.match(/<main[\s\S]*?<\/main>/i);
  return (article || main || ["", ""])[0];
}

function sentencesOf(html) {
  const region = regionText(html);
  if (!region) return [];
  const chunks = region.match(/<(?:p|li|td|th)\b[^>]*>[\s\S]*?<\/(?:p|li|td|th)>/gi) || [];
  const kept = [];
  for (const chunk of chunks) {
    const text = decode(chunk.replace(/<[^>]+>/g, " "));
    for (const part of text.split(/(?<=[.!?])\s+/)) {
      const key = part.replace(/^[^A-Za-z]+/, "").replace(/[.!?]+$/, "").replace(/\s+/g, " ").trim();
      if (!/^[A-Z]/.test(key)) continue;
      if (key.split(/\s+/).length < MIN_WORDS) continue;
      kept.push(key);
    }
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

function shingles(norm) {
  const words = norm.split(" ");
  const set = new Set();
  const width = words.length >= 8 ? 5 : 4;
  if (words.length < width) return set;
  for (let i = 0; i <= words.length - width; i++) set.add(words.slice(i, i + width).join(" "));
  return set;
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const item of small) if (large.has(item)) inter += 1;
  return inter / (a.size + b.size - inter);
}

const files = walkHtml(ROOT);
const groups = new Map();
for (const file of files) {
  const rel = path.relative(ROOT, file);
  const html = fs.readFileSync(file, "utf8");
  for (const sentence of new Set(sentencesOf(html))) {
    const key = normalize(sentence);
    if (key.split(" ").length < MIN_WORDS) continue;
    // The FTC line and the two site disclaimers are required to stay
    // word-for-word. They are not the filler this check is for.
    if (
      key === "disclosure affiliate links may earn a commission" ||
      key === "editorial note this care page is educational and should be used to prepare questions for a veterinarian not replace an exam" ||
      key === "referral links when present do not influence the care guidance" ||
      key === "we are not a veterinary practice"
    ) continue;
    if (!groups.has(key)) groups.set(key, { example: sentence, files: [] });
    groups.get(key).files.push(rel);
  }
}

// Near-duplicates: same shingles after the breed name is replaced with "name".
const reps = [...groups.entries()].map(([key, info]) => ({
  key,
  info,
  sh: shingles(key),
  bucket: key.split(" ").slice(0, 8).join(" "),
}));
const byBucket = new Map();
for (const rep of reps) {
  if (!byBucket.has(rep.bucket)) byBucket.set(rep.bucket, []);
  byBucket.get(rep.bucket).push(rep);
}

const parent = new Map();
function find(key) {
  let root = key;
  while (parent.get(root) !== root) root = parent.get(root);
  while (key !== root) {
    const next = parent.get(key);
    parent.set(key, root);
    key = next;
  }
  return root;
}
function unite(a, b) {
  const pa = find(a);
  const pb = find(b);
  if (pa !== pb) parent.set(pb, pa);
}
for (const rep of reps) parent.set(rep.key, rep.key);
for (const bucket of byBucket.values()) {
  if (bucket.length < 2 || bucket.length > 250) continue;
  for (let i = 0; i < bucket.length; i++) {
    for (let j = i + 1; j < bucket.length; j++) {
      if (jaccard(bucket[i].sh, bucket[j].sh) >= 0.8) unite(bucket[i].key, bucket[j].key);
    }
  }
}

const clustered = new Map();
for (const rep of reps) {
  const root = find(rep.key);
  if (!clustered.has(root)) clustered.set(root, { example: rep.info.example, files: new Set() });
  const dest = clustered.get(root);
  for (const file of rep.info.files) dest.files.add(file);
}

const failures = [...clustered.values()]
  .map((item) => [item.example, [...item.files]])
  .filter(([, list]) => list.length > 3);

function visiblePage(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;|&ldquo;|&rdquo;|&quot;/g, "'")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ");
}

// Stock lines fail anywhere on the site, including link cards and
// headings, not only inside essay sentences.
const STOCK = [
  [/Expert guide for [A-Za-z0-9'’(). -]{1,50} owners/i, "Expert guide for [Breed] owners"],
  [/Every situation teaches something new/i, "Every situation teaches something new"],
  [/The framework here is solid/i, "The framework here is solid"],
  [/tend to trend upward whenever the plan becomes more specific/i, "tend to trend upward"],
  [/There is no universal ["“”']?right owner/i, "no universal right owner"],
  [/reshapes your daily routine in subtle ways/i, "reshapes your daily routine"],
  [/right shape of plan for most/i, "right shape of plan"],
  [/individuali[sz]ed safety check that generic advice cannot/i, "individualised safety check"],
  [/guidance with practical care checkpoints/i, "practical care checkpoints"],
  [/with practical ownership context/i, "practical ownership context"],
  [/before narrowing your shortlist/i, "before narrowing your shortlist"],
  [/help for everyday decisions/i, "help for everyday decisions"],
  [/wonderful companions for the right owner/i, "wonderful companions for the right owner"],
  [/matched with the right owner and environment/i, "matched with the right owner"],
  [/fine-tune these recommendations to your particular needs/i, "fine-tune these recommendations"],
  [/ongoing process that rewards patience, observation/i, "ongoing process that rewards patience"],
  [/consistency in the fundamentals/i, "consistency in the fundamentals"],
  [/obvious fundamentals done well/i, "obvious fundamentals done well"],
  [/weeks-long project rather than a days-long/i, "weeks-long project"],
  [/general direction is well-established/i, "general direction is well-established"],
  [/steady observation and a readiness to make small adjustments/i, "steady observation and a readiness"],
  [/adapt these guidelines based on what you observe/i, "adapt these guidelines"],
  [/ready to pivot when needed/i, "ready to pivot"],
  [/let observation and experience guide the specifics/i, "observation and experience guide the specifics"],
  [/build a more complete understanding/i, "build a more complete understanding"],
  [/hands-on experience with your own unique situation/i, "hands-on experience with your own unique situation"],
  [/Prospective [A-Za-z0-9'’(). -]{1,80} benefit from connecting with experienced breeders or rescue organizations/i, "Prospective owners benefit from connecting with breeders"],
  [/diet emergency backward/i, "diet emergency backward"],
  [/people buy when they have heard an Amazon/i, "people buy when they have heard an Amazon"],
  [/Confidence that you can provide what/i, "Confidence that you can provide what"],
  [/best possible foundation for a rewarding experience/i, "best possible foundation for a rewarding experience"],
  [/grows through daily routines/i, "grows through daily routines"],
  [/tends to sneak up on you/i, "tends to sneak up on you"],
  [/best part isn't what you'd expect/i, "best part isn't what you'd expect"],
  [/ownership genuinely rewarding/i, "ownership genuinely rewarding"],
  [/cumulative satisfaction of good care/i, "cumulative satisfaction of good care"],
  [/quiet pride in a thriving animal/i, "quiet pride in a thriving animal"],
  [/right for your specific household, schedule, and budget/i, "right for your specific household"],
  [/gradual process rather than an instant bond/i, "gradual process rather than an instant bond"],
  [/genuinely rewarding addition/i, "genuinely rewarding addition"],
  [/not enthusiasm alone/i, "preparation, not enthusiasm alone"],
  [/Keepers with appropriate experience and dedication/i, "Keepers with appropriate experience and dedication"],
  [/Enthusiasts interested in this (?:species|breed)'s unique characteristics/i, "Enthusiasts interested in unique characteristics"],
  [/Those seeking a very low-maintenance pet/i, "Those seeking a very low-maintenance pet"],
  [/Those with limited space or budget for proper setup/i, "Those with limited space or budget for proper setup"],
  [/excellent choice for someone who enjoys the hands-on aspects/i, "excellent choice for someone who enjoys the hands-on aspects"],
  [/suitability depends on the specific balance/i, "suitability depends on the specific balance"],
  [/will change your household in ways both expected and surprising/i, "will change your household in ways both expected"],
  [/was not designed to be a generic pet/i, "was not designed to be a generic pet"],
  [/popular aquarium species known for/i, "popular aquarium species known for"],
  [/popular pet bird species known for/i, "popular pet bird species known for"],
  [/Whether you are a first-time owner/i, "Whether you are a first-time owner"],
  [/represents one of the most fascinating/i, "represents one of the most fascinating"],
  [/range of social and cognitive capabilities/i, "range of social and cognitive capabilities"],
  [/physical environment you create for your/i, "physical environment you create for your"],
  [/one of its most captivating qualities/i, "one of its most captivating qualities"],
  [/Vocalization patterns in /i, "Vocalization patterns in"],
  [/unique pet species known for/i, "unique pet species known for"],
  [/has captivated pet owners/i, "has captivated pet owners"],
  [/popularity of .+ as pets has grown significantly/i, "popularity of as pets has grown significantly"],
  [/rewarding small animal companion that brings unique/i, "rewarding small animal companion that brings unique"],
  [/most common misconceptions about/i, "most common misconceptions about"],
  [/social, intelligent animals that benefit enormously/i, "social, intelligent animals that benefit enormously"],
  [/becomes most evident once the animal has settled/i, "becomes most evident once the animal has settled"],
  [/well-balanced personality that/i, "well-balanced personality that"],
];

const stockHits = [];
for (const file of walkHtml(ROOT)) {
  const text = visiblePage(fs.readFileSync(file, "utf8"));
  for (const [re, label] of STOCK) {
    if (re.test(text)) stockHits.push(`${path.relative(ROOT, file)}: ${label}`);
  }
}

if (failures.length || stockHits.length) {
  if (failures.length) {
    failures.sort((a, b) => b[1].length - a[1].length);
    console.error(`cross-page prose check failed (${failures.length} sentences)`);
    for (const [sentence, list] of failures.slice(0, 40)) {
      console.error(`${list.length} profiles: ${sentence.slice(0, 160)}`);
      console.error(`  e.g. ${list.slice(0, 3).join(", ")}`);
    }
  }
  if (stockHits.length) {
    console.error(`stock phrase check failed (${stockHits.length})`);
    for (const line of stockHits.slice(0, 40)) console.error(line);
  }
  process.exit(1);
}
console.log(`cross-page prose check ok (${files.length} html files, stock phrases clear)`);
