#!/usr/bin/env node
/**
 * Remove stock link blurbs and named filler paragraphs.
 * Link titles stay. A filler paragraph is replaced with a longer,
 * species-specific note so the page does not get thinner.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const NOTES = JSON.parse(fs.readFileSync(path.join(ROOT, "engines/prose/stock-replacements.json"), "utf8"));

const CARD_STOCK = [
  /^Expert guide for .+ owners\.?$/i,
  /Every situation teaches something new/i,
  /The framework here is solid/i,
  /tend to trend upward/i,
  /practical care checkpoints/i,
  /practical ownership context/i,
  /narrowing your shortlist/i,
  /help for everyday decisions/i,
  /steady observation and a readiness/i,
  /adapt these guidelines based on what you observe/i,
  /fine-tune these recommendations/i,
  /ongoing process that rewards patience/i,
  /ready to pivot when needed/i,
  /observation and experience guide the specifics/i,
  /consistency in the fundamentals/i,
  /obvious fundamentals done well/i,
  /weeks-long project rather than a days-long/i,
  /general direction is well-established/i,
  /build a more complete understanding/i,
  /hands-on experience with your own unique situation/i,
  /Prospective .+ benefit from connecting with experienced breeders/i,
  /Progress comes from consistent application of sound principles/i,
  /steady schedule you can maintain through busy weeks/i,
  /Activity levels, exercise needs, and fitness recommendations by breed/i,
  /advice tied to symptoms, costs, and next steps/i,
  /Build literacy here/i,
  /measurably less stressful/i,
];

const INTRO_STOCK = [
  /Build literacy here/i,
  /measurably less stressful/i,
  /broad guidance to orient yourself/i,
  /specific species with specific needs elevates/i,
  /who study the .+ closely/i,
  /little curiosity about how/i,
  /sharper view of this part of pet care/i,
  /time to learn what your individual/i,
  /fine-tuning for a specific/i,
  /by-the-book approach/i,
  /working understanding of this area/i,
  /removes a lot of the guesswork/i,
  /more universally a recommendation is worded/i,
  /individual animal's baseline/i,
  /solid grasp of this area/i,
  /focused thirty minutes on this topic/i,
  /clear picture of this side of pet care/i,
  /cheapest insurance policies available to an owner/i,
  /sidestep the expensive corrective/i,
  /rather than generic pet advice/i,
  /beats protocol/i,
  /sometimes skip past this when planning/i,
  /plan anchored in these traits/i,
  /rather than an abstract category/i,
  /owners who do best with/i,
  /narrow and specific wins/i,
  /pet in front of you/i,
  /two pet behave exactly alike/i,
];

const FILLER_START = /There is no universal ["“”']?right owner|Owning (?:a|an) .+?reshapes your daily routine|This is the right shape of plan for most|individuali[sz]ed safety check that generic advice cannot|tend to trend upward whenever the plan becomes more specific|The framework here is solid, but the fine-tuning comes from hands-on experience/i;

const GENERIC_PREFIX = /^(Proper nutrition is essential\b|Explore related topics\b|Consider seeking a veterinary specialist if\b|While not all causes are preventable\b.*|While monitoring this symptom at home\.?$|[\w\s]+ are relatively easy to care for\.?$|[\w\s]+ behavior traits\.?$)/i;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "engines", "data"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function plain(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;|&ldquo;|&rdquo;|&quot;/g, "'")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function words(s) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function slugFor(rel) {
  const parts = rel.split("/");
  if (parts[0] === "breeds" && parts.length >= 3) return parts[2].replace(/\.html$/, "");
  if (parts[0] === "commercial" && parts.length >= 3) return parts[2];
  return parts[parts.length - 1].replace(/\.html$/, "");
}

function isStockCard(text) {
  return CARD_STOCK.some((re) => re.test(text));
}

function isStockIntro(text) {
  if (words(text) > 90) return false;
  if (FILLER_START.test(text)) return false;
  return INTRO_STOCK.some((re) => re.test(text));
}

function keptPrefix(text) {
  const idx = text.search(FILLER_START);
  if (idx <= 0) return "";
  let pre = text.slice(0, idx).replace(/[:\s-]+$/, "").trim();
  if (!pre || words(pre) < 6 || GENERIC_PREFIX.test(pre)) return "";
  if (!/[.!?]$/.test(pre)) pre += ".";
  return pre;
}

function noteFor(slug, index) {
  const pack = NOTES[slug];
  if (!pack) return null;
  const arr = Array.isArray(pack) ? pack : [pack];
  return arr[Math.min(index, arr.length - 1)];
}

function stripCards(html) {
  return html.replace(/<a\b[^>]*class="guide-card"[^>]*>[\s\S]*?<\/a>/gi, (anchor) => {
    return anchor.replace(/<p>[\s\S]*?<\/p>/gi, (p) => (isStockCard(plain(p)) ? "" : p));
  });
}

function stripRightOwnerSentences(html) {
  return html.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (p) => {
    let next = p.replace(
      /\s*Both\s[\s\S]*?wonderful companions for the right owner; the key is honest self-assessment about which [\s\S]*?lifespan\./gi,
      ""
    );
    next = next.replace(
      /\s*(?:These|Both)\s[\s\S]*?wonderful companions for the right owner[^.]*\./gi,
      ""
    );
    next = next.replace(
      /\s*Both\s[\s\S]*?matched with the right owner and environment\./gi,
      ""
    );
    return next;
  });
}

function stripStockBodyParagraphs(html) {
  return html.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (p) => {
    if (p.includes("<a") || p.includes("<img") || p.includes("<strong")) return p;
    const text = plain(p);
    if (words(text) > 45) return p;
    if (isStockCard(text) || isStockIntro(text)) return "";
    return p;
  });
}

function stripStockIntros(html) {
  return html.replace(
    /(<h2[^>]*>[\s\S]*?<\/h2>\s*)<p>([\s\S]*?)<\/p>/gi,
    (full, head, inner) => {
      const text = plain(inner);
      if (inner.includes("<a") || inner.includes("<img")) return full;
      if (!isStockIntro(text)) return full;
      return head;
    }
  );
}

const DIRECT = [
  [
    "Cataracts in a degu are a diet emergency backward: the sugar already happened.",
    "By the time a degu's lens turns cloudy, the sugary food that caused it has already been eaten. Fruit and sweet treats do not belong in the cage.",
  ],
  [
    "The medium parrot people buy when they have heard an Amazon",
    "Calmer than an Amazon, and still a long-lived parrot",
  ],
];

function applyDirect(html) {
  let next = html;
  for (const [from, to] of DIRECT) next = next.split(from).join(to);
  return next;
}

const missing = new Set();
let cardPs = 0;
let intros = 0;
let replaced = 0;
let ownerSentences = 0;
const short = [];

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  html = stripCards(html);
  cardPs += (before.match(/<p>[\s\S]*?<\/p>/gi) || []).length - (html.match(/<p>[\s\S]*?<\/p>/gi) || []).length;

  const slug = slugFor(rel);
  let used = 0;
  html = html.replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (full, attrs, inner) => {
    const text = plain(inner);
    if (!FILLER_START.test(text)) return full;
    if (/class="guide-card"/.test(full)) return full;
    const note = noteFor(slug, used);
    used += 1;
    if (!note) {
      missing.add(slug + " :: " + rel);
      return full;
    }
    const prefix = keptPrefix(text);
    const body = prefix ? `${prefix} ${note}` : note;
    if (words(body) < words(text)) short.push(`${rel} ${words(text)} -> ${words(body)}`);
    replaced += 1;
    return `<p${attrs}>${esc(body)}</p>`;
  });

  const mid = html;
  html = stripRightOwnerSentences(html);
  ownerSentences += (mid.length - html.length > 0) ? 1 : 0;
  html = stripStockIntros(html);
  html = stripStockBodyParagraphs(html);
  html = applyDirect(html);
  if (html !== before) fs.writeFileSync(file, html);
}

if (missing.size) {
  console.error("MISSING NOTES");
  for (const line of [...missing].sort()) console.error(line);
  process.exit(1);
}
console.log(JSON.stringify({ replaced, filesWithOwnerSentence: ownerSentences, short: short.slice(0, 20), shortCount: short.length }, null, 2));
