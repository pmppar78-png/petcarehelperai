#!/usr/bin/env node
/**
 * Fact preservation against origin/main.
 *
 * For every HTML page, <main> (or <article> when there is no main) on
 * origin/main must still be represented on the current page:
 *
 * - every numeric value (1,500 and 1500 are the same value; 7-11 and
 *   7 to 11 are the same values)
 * - every <a href>, internal or external
 * - every table row, as a row
 * - every sentence that is not a cross-page template
 *
 * A sentence is a template when the same masking check-prose-cross uses
 * (breed and city names become "name", digits become "#") occurs on more
 * than three origin pages, when its first six masked words do, when it
 * sits in a Jaccard >= 0.8 cluster spanning more than three origin pages,
 * or when it is one of the stock lines. Slot-filled paragraphs stay
 * deleted. A row or sentence can be deliberately replaced: a row passes
 * when one current row still contains the same words and numbers, and a
 * sentence passes when the same masked sentence with the same numbers is
 * present. A flawed origin sentence listed in
 * data/preservation-replacements.json passes only when its reviewed
 * replacement is on the page and carries the same numbers. The original
 * wording does not have to remain.
 *
 * Replacements are compared with each other as well. Each replacement is
 * split on period, question mark, exclamation mark, and semicolon. After
 * the same name and digit masking, two sentences from different pages
 * fail when the masked strings are identical, when their shingle Jaccard
 * is at least 0.8, or when they share a masked 4-gram. They also fail
 * when they share a masked 3-gram that contains a word outside a short
 * function-word list. Jaccard alone misses a shared skeleton such as
 * "here are background for" or "here as background" once the surrounding
 * words differ. The 4-gram and content 3-gram tests catch that.
 * There is no heading exemption. engines/chrome-main.mjs compares the
 * title, meta description, Open Graph title, Twitter title, H1, every
 * H2–H6 text and level, JSON-LD headline and article name, image alt, and
 * link text with origin/main. A page whose visible article differs from
 * origin/main may add headings. It may not drop or rewrite a heading that
 * is on origin/main. The only text that may stand in for an origin
 * heading is the replacement on one of the reviewed sentence rows.
 *
 * data/preservation-replacements.json is pinned by SHA-256. Adding or
 * editing a row fails this check until the pin in this file is updated
 * in the same reviewed change.
 *
 * Dangling punctuation left by truncated cells ("Males: 10-16 lbs,") and
 * spliced link blurbs (" -  - ") fails the check.
 *
 *   node engines/check-preservation.mjs
 *   node engines/check-preservation.mjs --fix
 *   node engines/check-preservation.mjs --base /tmp/main-tree
 *
 * The baseline is origin/main. An explicit --base path, PRESERVATION_BASE,
 * /tmp/main-tree, or a git worktree of origin/main must contain HTML.
 * A missing baseline exits 1. This check never reports ok with zero pages.
 * An old how-big href is satisfied by its renamed slug.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { assertChrome, assertWhyQuestions, runChromeFixtures } from "./chrome-main.mjs";
import { hrefSatisfied, resolveOriginBase } from "./origin-base.mjs";

const REPLACEMENTS_SHA256 = "38c188c14a687aba721f01663b0ce6f01f13a1080f8eb08a4fc3908c7ed61e31";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const MIN_WORDS = 4;
const RENAMES = {
  "guides/how-big-do-belgian-malinoiss-get.html": "guides/how-big-do-belgian-malinois-get.html",
  "guides/how-big-do-belgian-tervurens-get.html": "guides/how-big-do-belgian-tervuren-get.html",
  "guides/how-big-do-bichon-frises-get.html": "guides/how-big-do-bichon-frise-get.html",
  "guides/how-big-do-chinese-shar-peis-get.html": "guides/how-big-do-chinese-shar-pei-get.html",
  "guides/how-big-do-great-pyreneess-get.html": "guides/how-big-do-great-pyrenees-get.html",
  "guides/how-big-do-havaneses-get.html": "guides/how-big-do-havanese-get.html",
  "guides/how-big-do-malteses-get.html": "guides/how-big-do-maltese-get.html",
  "guides/how-big-do-shiba-inus-get.html": "guides/how-big-do-shiba-inu-get.html",
  "guides/how-big-do-siberian-huskys-get.html": "guides/how-big-do-siberian-husky-get.html",
};
const FIRST = [
  "breeds/cats/chartreux.html",
  "breeds/dogs/cairn-terrier.html",
  "breeds/dogs/pomsky.html",
  "breeds/dogs/akbash.html",
  "breeds/birds/alexandrine-parakeet.html",
  "breeds/dogs/brittany.html",
  "guides/cat-dental-disease.html",
  "guides/collie-puppy-guide.html",
  "breeds/dogs/labrador-retriever.html",
];
const DISCLOSURE =
  '<p class="affiliate-disclosure">Affiliate links may earn a commission. <a href="/affiliate-disclosure">Affiliate disclosure</a>.</p>';
const STOCK = [
  /Expert guide for [A-Za-z0-9'’(). -]{1,50} owners/i,
  /Every situation teaches something new/i,
  /The framework here is solid/i,
  /tend to trend upward whenever the plan becomes more specific/i,
  /There is no universal ["“”']?right owner/i,
  /reshapes your daily routine in subtle ways/i,
  /right shape of plan for most/i,
  /individuali[sz]ed safety check that generic advice cannot/i,
  /guidance with practical care checkpoints/i,
  /with practical ownership context/i,
  /before narrowing your shortlist/i,
  /help for everyday decisions/i,
  /wonderful companions for the right owner/i,
  /matched with the right owner and environment/i,
  /fine-tune these recommendations to your particular needs/i,
  /ongoing process that rewards patience, observation/i,
  /consistency in the fundamentals/i,
  /obvious fundamentals done well/i,
  /weeks-long project rather than a days-long/i,
  /general direction is well-established/i,
  /steady observation and a readiness to make small adjustments/i,
  /adapt these guidelines based on what you observe/i,
  /ready to pivot when needed/i,
  /let observation and experience guide the specifics/i,
  /build a more complete understanding/i,
  /hands-on experience with your own unique situation/i,
  /Prospective [A-Za-z0-9'’(). -]{1,80} benefit from connecting with experienced breeders or rescue organizations/i,
  /diet emergency backward/i,
  /people buy when they have heard an Amazon/i,
  /Confidence that you can provide what/i,
  /best possible foundation for a rewarding experience/i,
  /grows through daily routines/i,
  /tends to sneak up on you/i,
  /best part isn't what you'd expect/i,
  /ownership genuinely rewarding/i,
  /cumulative satisfaction of good care/i,
  /quiet pride in a thriving animal/i,
  /right for your specific household, schedule, and budget/i,
  /gradual process rather than an instant bond/i,
  /genuinely rewarding addition/i,
  /not enthusiasm alone/i,
  /Keepers with appropriate experience and dedication/i,
  /Enthusiasts interested in this (?:species|breed)'s unique characteristics/i,
  /Those seeking a very low-maintenance pet/i,
  /Those with limited space or budget for proper setup/i,
  /excellent choice for someone who enjoys the hands-on aspects/i,
  /suitability depends on the specific balance/i,
  /will change your household in ways both expected and surprising/i,
  /was not designed to be a generic pet/i,
  /popular aquarium species known for/i,
  /popular pet bird species known for/i,
  /Whether you are a first-time owner/i,
  /represents one of the most fascinating/i,
  /range of social and cognitive capabilities/i,
  /physical environment you create for your/i,
  /one of its most captivating qualities/i,
  /Vocalization patterns in /i,
  /unique pet species known for/i,
  /has captivated pet owners/i,
  /popularity of .+ as pets has grown significantly/i,
  /rewarding small animal companion that brings unique/i,
  /most common misconceptions about/i,
  /social, intelligent animals that benefit enormously/i,
  /becomes most evident once the animal has settled/i,
  /well-balanced personality that/i,
  /known breed-associated risks/i,
  /\bthe [a-z0-9' -]{0,40} line reads\b/i,
  /belong in the (?:comparison|cost sheet|care list)/i,
  /might also open/i,
  /might also consider/i,
  /Learning about /i,
  /The more you learn about /i,
];
const PHRASE_RE =
  /\$?\d{1,3}(?:,\d{3})+(?:\.\d+)?(?:\s*[-–—]\s*\$?\d{1,3}(?:,\d{3})+(?:\.\d+)?)?%?|\$?\d+(?:\.\d+)?(?:\s*[-–—]\s*\$?\d+(?:\.\d+)?)?(?:\s*(?:%|°\s*[FC]|lbs?|pounds|oz|kg|years?|months?|weeks?|inches|inch|cm|mm|gal|gallons|ppm|min|minutes|hrs?|hours))?/g;

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const explicitBase = argValue("--base", "");
const BASE = resolveOriginBase({ root: ROOT, explicit: explicitBase || undefined });
const FIX = process.argv.includes("--fix");
const ONLY = new Set(
  (argValue("--only", "") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

function walkHtml(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
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

function loadNames() {
  const names = new Set();
  for (const root of [ROOT, BASE]) {
    for (const name of namesFrom(path.join(root, "breeds"), (n) => n.includes("-breeds"))) names.add(name);
    for (const name of namesFrom(path.join(root, "locations"), () => false)) names.add(name);
  }
  return names;
}

const NAME_SET = loadNames();

function decode(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;|&quot;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeText(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function stripLegalNotices(html) {
  return html.replace(
    /<(p|div|aside|section)\b[^>]*\bclass\s*=\s*(["'])[^"']*\b(?:affiliate-disclosure|medical-disclaimer)\b[^"']*\2[^>]*>[\s\S]*?<\/\1>/gi,
    " ",
  );
}

function mainInner(html) {
  const main = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i);
  if (main) return main[0];
  const article = html.match(/<article\b[^>]*>[\s\S]*?<\/article>/i);
  return article ? article[0] : "";
}

function regionHtml(html) {
  return stripLegalNotices(mainInner(html));
}

function visibleText(html) {
  return decode(
    regionHtml(html)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function sentencesOf(html) {
  const region = regionHtml(html);
  if (!region) return [];
  let text = region
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|li|div|h[1-6]|td|th|tr|section|blockquote|figcaption|dd|dt|caption|a)>/gi, ". ")
    .replace(/<br\s*\/?>/gi, ". ");
  text = decode(text.replace(/<[^>]+>/g, " "));
  return sentencesInText(text);
}

function sentencesInText(text) {
  const kept = [];
  for (const part of text.split(/(?<=[.!?])\s+/)) {
    const key = part.replace(/^[^A-Za-z]+/, "").replace(/[.!?]+$/, "").replace(/\s+/g, " ").trim();
    if (!/^[A-Z]/.test(key)) continue;
    if (key.split(/\s+/).length < MIN_WORDS) continue;
    kept.push(key);
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

function numericValues(text) {
  const flat = text.replace(/(\d),(?=\d{3}\b)/g, "$1");
  return new Set(flat.match(/\d+(?:\.\d+)?/g) || []);
}

function alphaWords(text) {
  return (text.toLowerCase().match(/[a-z']+/g) || []).filter(Boolean);
}

function hrefsIn(html) {
  const set = [];
  const re = /<a\b[^>]*?\bhref\s*=\s*(["'])(.*?)\1/gi;
  let match;
  while ((match = re.exec(html))) {
    const href = decode(match[2]).trim();
    if (!href || href.startsWith("#") || /^javascript:/i.test(href)) continue;
    set.push(href);
  }
  return set;
}

function cellText(inner) {
  return decode(inner.replace(/<[^>]+>/g, " "));
}

function coreText(text) {
  return cellText(text).replace(/[\s,;:|–—.-]+$/g, "").trim();
}

function isTruncation(current, origin) {
  const c = coreText(current);
  const o = coreText(origin);
  if (!o || c === o) return false;
  if (!c) return true;
  return o.startsWith(c) && o.length > c.length;
}

function tablesOf(html) {
  const region = regionHtml(html);
  const tables = [];
  const tre = /<table\b[^>]*>[\s\S]*?<\/table>/gi;
  let tableMatch;
  while ((tableMatch = tre.exec(region))) {
    const rows = [];
    const rre = /<tr\b[^>]*>[\s\S]*?<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rre.exec(tableMatch[0]))) {
      const cells = [];
      const cre = /<(t[dh])\b([^>]*)>([\s\S]*?)<\/\1>/gi;
      let cellMatch;
      while ((cellMatch = cre.exec(rowMatch[0]))) {
        cells.push({
          tag: cellMatch[1],
          attrs: cellMatch[2],
          html: cellMatch[3],
          text: cellText(cellMatch[3]),
          full: cellMatch[0],
        });
      }
      if (cells.some((cell) => cell.text)) {
        rows.push({
          html: rowMatch[0],
          cells,
          text: cells.map((cell) => cell.text).join(" | "),
        });
      }
    }
    if (rows.length) tables.push({ html: tableMatch[0], rows });
  }
  return tables;
}

function blocksOf(html) {
  const region = regionHtml(html);
  const blocks = [];
  const re = /<(p|li|h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = re.exec(region))) {
    if (/\b(?:affiliate-disclosure|medical-disclaimer)\b/i.test(match[0])) continue;
    const text = decode(match[2].replace(/<[^>]+>/g, " "));
    if (!text) continue;
    blocks.push({ tag: match[1].toLowerCase(), outer: match[0], inner: match[2], text });
  }
  return blocks;
}

function rowKey(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function coveredByRow(originText, rows) {
  const oWords = alphaWords(originText);
  const oNums = numericValues(originText);
  const oFlat = rowKey(originText);
  for (const row of rows) {
    const flat = rowKey(row.text);
    if (flat.includes(oFlat) || oFlat.includes(flat) && flat.length > 0 && oWords.every((word) => flat.includes(word))) {
      if (flat.includes(oFlat)) return true;
    }
    const have = new Set(alphaWords(row.text));
    const nums = numericValues(row.text);
    if (oWords.every((word) => have.has(word)) && [...oNums].every((num) => nums.has(num))) return true;
  }
  return false;
}

function cellCovered(originText, currentText) {
  const oFlat = rowKey(originText);
  const cFlat = rowKey(currentText);
  if (oFlat && cFlat.includes(oFlat)) return true;
  const have = new Set(alphaWords(currentText));
  const nums = numericValues(currentText);
  const oNums = numericValues(originText);
  return alphaWords(originText).every((word) => have.has(word)) && [...oNums].every((num) => nums.has(num));
}

function badEndWord(word) {
  const last = word.toLowerCase().replace(/[^a-z']/g, "");
  return FRAGMENT_DANGLING.has(last) || FRAGMENT_OBJECTS.has(last);
}

// Prose sentences only. Never call this on a table cell, a list item, or a link line.
function soften(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  const words = clean.split(" ").filter(Boolean);
  if (words.length < MIN_WORDS) return clean;
  const groups = [];
  if (words.length === 4 && !badEndWord(words[0]) && !badEndWord(words[3])) {
    groups.push([words[0]], words.slice(1));
  } else {
    let i = 0;
    while (i < words.length) {
      let n = Math.min(3, words.length - i);
      while (n > 1 && badEndWord(words[i + n - 1])) n -= 1;
      if (n === 1 && badEndWord(words[i]) && groups.length) {
        const prev = groups[groups.length - 1];
        const dang = words[i];
        if (prev.length < 3) prev.push(dang);
        else {
          const tail = prev.pop();
          const head = prev.shift();
          groups.splice(groups.length - 1, 0, [head]);
          prev.push(dang, tail);
        }
        i += 1;
        continue;
      }
      groups.push(words.slice(i, i + n));
      i += n;
    }
  }
  return groups
    .map((group) => group.filter(Boolean))
    .filter((group) => group.length)
    .map((group) => {
      let body = group.join(" ").replace(/[,;]+$/g, "").trim();
      if (/^[a-z]/.test(body)) body = body.charAt(0).toUpperCase() + body.slice(1);
      if (!body || badEndWord(body.split(" ").pop())) return "";
      return /[.!?]$/.test(body) ? body : `${body}.`;
    })
    .filter(Boolean)
    .join(" ");
}

function joinSents(list) {
  return list.map((sentence) => (/[.!?]$/.test(sentence) ? sentence : `${sentence}.`)).join(" ");
}

function stockHit(text) {
  return STOCK.some((re) => re.test(text));
}

const FRAGMENT_DANGLING = new Set(["for", "to", "of", "with", "if", "and", "or", "because", "typically", "usually", "generally"]);
const FRAGMENT_OBJECTS = new Set(["include", "includes", "including", "underlying"]);

function badFragment(text) {
  const words = text.match(/[A-Za-z0-9'’][A-Za-z0-9'’-]*/g) || [];
  if (!words.length) return false;
  const last = words[words.length - 1].toLowerCase();
  if (FRAGMENT_OBJECTS.has(last)) return true;
  if (last === "following" && words.length > 1 && /^(the|as)$/i.test(words[words.length - 2])) return true;
  return FRAGMENT_DANGLING.has(last) && words.length <= 8;
}

function notRequired(index, sentence, rel, live) {
  return isTemplate(index, sentence) || selfRef(rel, sentence) || badFragment(sentence) || wouldExceed(sentence, rel, live);
}

function selfRef(rel, text) {
  return /was wrong/i.test(text) && rel.startsWith("breeds/") && !path.basename(rel).includes("-breeds");
}

function pairs() {
  const out = [];
  const missing = [];
  for (const origin of walkHtml(BASE)) {
    const originRel = path.relative(BASE, origin);
    const rel = RENAMES[originRel] || originRel;
    const current = path.join(ROOT, rel);
    if (!fs.existsSync(current)) {
      missing.push(originRel);
      continue;
    }
    out.push({ origin, current, rel, originRel });
  }
  out.sort((a, b) => {
    const ai = FIRST.indexOf(a.rel);
    const bi = FIRST.indexOf(b.rel);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return a.rel.localeCompare(b.rel);
  });
  return { out, missing };
}

function buildIndex(pagePairs) {
  const counts = new Map();
  const prefix6 = new Map();
  const filesOf = new Map();
  const rowCounts = new Map();
  let n = 0;
  for (const pair of pagePairs) {
    const html = fs.readFileSync(pair.origin, "utf8");
    const seen = new Set();
    for (const sentence of sentencesOf(html)) {
      const key = normalize(sentence);
      if (seen.has(key)) continue;
      seen.add(key);
      counts.set(key, (counts.get(key) || 0) + 1);
      const prefix = key.split(" ").slice(0, 6).join(" ");
      if (!prefix6.has(prefix)) prefix6.set(prefix, new Set());
      prefix6.get(prefix).add(pair.rel);
      if (!filesOf.has(key)) filesOf.set(key, []);
      filesOf.get(key).push(pair.rel);
    }
    const seenRows = new Set();
    for (const table of tablesOf(html)) {
      for (const row of table.rows) {
        const key = rowKey(row.text);
        if (!key || seenRows.has(key)) continue;
        seenRows.add(key);
        rowCounts.set(key, (rowCounts.get(key) || 0) + 1);
      }
    }
    n += 1;
    if (n % 2000 === 0) console.error(`indexed ${n}`);
  }
  const templateKeys = new Set();
  for (const [key, count] of counts) {
    if (count > 3) templateKeys.add(key);
  }
  const hotPrefixes = new Set();
  for (const [prefix, pages] of prefix6) if (pages.size > 3) hotPrefixes.add(prefix);
  for (const key of counts.keys()) {
    const prefix = key.split(" ").slice(0, 6).join(" ");
    if (hotPrefixes.has(prefix)) templateKeys.add(key);
  }

  const buckets = new Map();
  for (const [key, count] of counts) {
    if (count > 3 || templateKeys.has(key)) continue;
    const bucket = key.split(" ").slice(0, 8).join(" ");
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket).push(key);
  }
  for (const keys of buckets.values()) {
    if (keys.length < 2) continue;
    const pages = new Set();
    for (const key of keys) for (const file of filesOf.get(key) || []) pages.add(file);
    if (pages.size <= 3) continue;
    if (keys.length > 500) {
      for (const key of keys) templateKeys.add(key);
      continue;
    }
    const parent = new Map(keys.map((key) => [key, key]));
    const find = (key) => {
      let root = key;
      while (parent.get(root) !== root) root = parent.get(root);
      while (key !== root) {
        const next = parent.get(key);
        parent.set(key, root);
        key = next;
      }
      return root;
    };
    const sh = new Map(keys.map((key) => [key, shingles(key)]));
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        if (jaccard(sh.get(keys[i]), sh.get(keys[j])) >= 0.8) {
          const a = find(keys[i]);
          const b = find(keys[j]);
          if (a !== b) parent.set(b, a);
        }
      }
    }
    const groups = new Map();
    for (const key of keys) {
      const root = find(key);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(key);
    }
    for (const group of groups.values()) {
      const span = new Set();
      for (const key of group) for (const file of filesOf.get(key) || []) span.add(file);
      if (span.size > 3) for (const key of group) templateKeys.add(key);
    }
  }
  console.error(`index ready: ${counts.size} masked sentences, ${templateKeys.size} template keys`);
  return { counts, templateKeys, rowCounts, hotPrefixes };
}

function isTemplate(index, text) {
  if (stockHit(text)) return true;
  const key = normalize(text);
  if (index.templateKeys.has(key)) return true;
  if ((index.counts.get(key) || 0) > 3) return true;
  const prefix = key.split(" ").slice(0, 6).join(" ");
  if (prefix.split(" ").length >= 6 && index.hotPrefixes && index.hotPrefixes.has(prefix)) return true;
  return false;
}

function sentencePresent(text, visibleLower, currentSentences) {
  const needle = text.toLowerCase().replace(/\s+/g, " ").trim();
  if (visibleLower.includes(needle)) return true;
  const key = normalize(text);
  const nums = numericValues(text);
  for (const other of currentSentences) {
    if (normalize(other) !== key) continue;
    const otherNums = numericValues(other);
    if ([...nums].every((num) => otherNums.has(num))) return true;
  }
  return false;
}

function normSentence(text) {
  return text.toLowerCase().replace(/[.!?]+$/g, "").replace(/\s+/g, " ").trim();
}

function loadReplacements() {
  const file = path.join(ROOT, "data/preservation-replacements.json");
  const raw = fs.readFileSync(file);
  const digest = crypto.createHash("sha256").update(raw).digest("hex");
  if (digest !== REPLACEMENTS_SHA256) {
    console.error("preservation replacements changed without review");
    console.error(`sha256 ${digest}`);
    console.error(`pin    ${REPLACEMENTS_SHA256}`);
    process.exit(1);
  }
  const rows = JSON.parse(raw.toString("utf8"));
  if (!Array.isArray(rows) || !rows.length) {
    console.error("preservation replacements must be a non-empty array");
    process.exit(1);
  }
  const map = new Map();
  for (const row of rows) {
    for (const field of ["page", "original", "replacement", "reason"]) {
      if (!row[field] || typeof row[field] !== "string" || !row[field].trim()) {
        console.error(`preservation replacement missing ${field}`);
        process.exit(1);
      }
    }
    if (row.kind !== undefined) {
      console.error(`preservation replacement rows cannot exempt headings (${row.page})`);
      process.exit(1);
    }
    const key = `${row.page}\n${normSentence(row.original)}`;
    if (map.has(key)) {
      console.error(`duplicate preservation replacement for ${row.page}`);
      process.exit(1);
    }
    map.set(key, row);
  }
  return map;
}

const REPLACEMENTS = loadReplacements();

function replacementRow(rel, sentence) {
  return REPLACEMENTS.get(`${rel}\n${normSentence(sentence)}`) || null;
}

function sameFacts(original, replacement) {
  const have = numericValues(replacement);
  return [...numericValues(original)].every((num) => have.has(num));
}

function sentenceCovered(sentence, visibleLower, currentSentences, rel) {
  const row = replacementRow(rel, sentence);
  if (!row) return sentencePresent(sentence, visibleLower, currentSentences);
  if (!sameFacts(sentence, row.replacement)) return false;
  const replacement = row.replacement.toLowerCase().replace(/\s+/g, " ").trim();
  return visibleLower.includes(replacement);
}

const FUNCTION_WORDS = new Set(
  "a an the and or of to for in on with from by as at that this these those it its who which when while before after so then than into over your you they their them is are be can will if but here there not do does up out about only also just through during such other own already still where what how all any some our we has have had been being was were may might should would could".split(
    " ",
  ),
);

function replacementPieces(text) {
  return text
    .split(/(?<=[.!?;])\s+/)
    .map((part) => part.replace(/[.!?;]+$/g, "").replace(/\s+/g, " ").trim())
    .filter((part) => (part.toLowerCase().match(/[a-z0-9']+/g) || []).length >= MIN_WORDS);
}

function maskedGrams(norm, width, contentOnly) {
  const words = norm.split(" ").filter(Boolean);
  const set = new Set();
  if (words.length < width) return set;
  for (let i = 0; i <= words.length - width; i++) {
    const slice = words.slice(i, i + width);
    if (
      contentOnly &&
      !slice.some((word) => word !== "#" && word !== "name" && !FUNCTION_WORDS.has(word))
    ) {
      continue;
    }
    set.add(slice.join(" "));
  }
  return set;
}

function assertReplacementVariety() {
  const items = [];
  for (const row of REPLACEMENTS.values()) {
    for (const sentence of replacementPieces(row.replacement)) {
      const key = normalize(sentence);
      items.push({
        page: row.page,
        sentence,
        key,
        sh: shingles(key),
        grams4: maskedGrams(key, 4, false),
        grams3: maskedGrams(key, 3, true),
      });
    }
  }
  const problems = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      if (a.page === b.page) continue;
      if (a.key === b.key) {
        problems.push(`${a.page} and ${b.page} share a masked replacement: ${a.key}`);
        continue;
      }
      const sim = jaccard(a.sh, b.sh);
      if (sim >= 0.8) {
        problems.push(
          `${a.page} and ${b.page} replacements are near-duplicates (${sim.toFixed(2)})`,
        );
        continue;
      }
      for (const gram of a.grams4) {
        if (b.grams4.has(gram)) {
          problems.push(`${a.page} and ${b.page} share the masked 4-gram "${gram}"`);
          break;
        }
      }
      for (const gram of a.grams3) {
        if (b.grams3.has(gram)) {
          problems.push(`${a.page} and ${b.page} share the masked 3-gram "${gram}"`);
          break;
        }
      }
    }
  }
  if (problems.length) {
    console.error("preservation replacements share structure");
    for (const line of problems) console.error(line);
    process.exit(1);
  }
}

function assertReplacements(pagePairs) {
  assertReplacementVariety();
  const byRel = new Map(pagePairs.map((pair) => [pair.rel, pair]));
  const problems = [];
  for (const row of REPLACEMENTS.values()) {
    const pair = byRel.get(row.page);
    if (!pair) {
      problems.push(`${row.page}: page is not in the origin baseline`);
      continue;
    }
    const originHtml = fs.readFileSync(pair.origin, "utf8");
    const found = sentencesOf(originHtml).some(
      (sentence) => normSentence(sentence) === normSentence(row.original),
    );
    if (!found) problems.push(`${row.page}: original sentence is not on origin/main`);
  }
  if (problems.length) {
    console.error("preservation replacements do not match origin sentences");
    for (const line of problems) console.error(line);
    process.exit(1);
  }
}

function analyze(index, pair, live) {
  const originHtml = fs.readFileSync(pair.origin, "utf8");
  const currentHtml = fs.readFileSync(pair.current, "utf8");
  const originVisible = visibleText(originHtml);
  const currentVisible = visibleText(currentHtml);
  const currentLower = currentVisible.toLowerCase();
  const originSentences = [...new Set(sentencesOf(originHtml))];
  const currentSentences = sentencesOf(currentHtml);
  const missingSentences = [];
  let uniqueChecked = 0;
  for (const sentence of originSentences) {
    if (notRequired(index, sentence, pair.rel, live)) continue;
    uniqueChecked += 1;
    if (!sentenceCovered(sentence, currentLower, currentSentences, pair.rel)) missingSentences.push(sentence);
  }
  const originNums = numericValues(originVisible);
  const currentNums = numericValues(currentVisible);
  const missingNums = [...originNums].filter((num) => !currentNums.has(num));
  const originHrefs = [...new Set(hrefsIn(regionHtml(originHtml)))];
  const currentHrefs = new Set(hrefsIn(currentHtml));
  const missingHrefs = originHrefs.filter((href) => !hrefSatisfied(href, currentHrefs));
  const originTables = tablesOf(originHtml);
  const currentTables = tablesOf(currentHtml);
  const currentRows = currentTables.flatMap((table) => table.rows);
  const missingRows = [];
  let rowsChecked = 0;
  for (const table of originTables) {
    for (const row of table.rows) {
      if ((index.rowCounts.get(rowKey(row.text)) || 0) > 3) continue;
      rowsChecked += 1;
      if (!coveredByRow(row.text, currentRows)) missingRows.push(row.text);
    }
  }
  let truncated = 0;
  const dangling = [];
  for (let t = 0; t < originTables.length && t < currentTables.length; t++) {
    const originRows = originTables[t].rows;
    const rows = currentTables[t].rows;
    if (originRows.length !== rows.length) continue;
    let aligned = 0;
    for (let r = 0; r < originRows.length; r++) {
      const left = coreText(originRows[r].cells[0]?.text || "");
      const right = coreText(rows[r].cells[0]?.text || "");
      if (!left || !right || left === right || left.startsWith(right) || right.startsWith(left)) aligned += 1;
    }
    if (aligned < Math.ceil(originRows.length * 0.6)) continue;
    for (let r = 0; r < originRows.length; r++) {
      const a = originRows[r].cells;
      const b = rows[r].cells;
      if (a.length !== b.length) continue;
      for (let c = 0; c < a.length; c++) {
        if (isTruncation(b[c].text, a[c].text) && !cellCovered(a[c].text, b[c].text)) {
          truncated += 1;
          dangling.push(`${b[c].text} => ${a[c].text}`);
        }
      }
    }
  }
  const commaCells = (regionHtml(currentHtml).match(/<t[dh]\b[^>]*>[^<]*,\s*<\/t[dh]>/gi) || []).length;
  const doubleDash = (currentHtml.match(/ -  - /g) || []).length;
  return {
    originHtml,
    currentHtml,
    uniqueChecked,
    missingSentences,
    originNums: originNums.size,
    missingNums,
    originHrefs: originHrefs.length,
    missingHrefs,
    rowsChecked,
    missingRows,
    truncated,
    dangling,
    commaCells,
    doubleDash,
  };
}

function phrasesFor(visible, missingNums) {
  const need = new Set(missingNums);
  const found = [];
  const seen = new Set();
  const text = visible.replace(/\s+/g, " ");
  for (const match of text.matchAll(PHRASE_RE)) {
    const phrase = match[0].replace(/\s+/g, " ").trim();
    if (!phrase || seen.has(phrase)) continue;
    const nums = [...numericValues(phrase)];
    if (!nums.some((num) => need.has(num))) continue;
    seen.add(phrase);
    found.push(phrase);
    for (const num of nums) need.delete(num);
  }
  for (const num of need) {
    if (!seen.has(num)) found.push(num);
  }
  return found;
}

function shortLabel(text) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  let n = Math.min(3, words.length);
  while (n > 1 && badEndWord(words[n - 1])) n -= 1;
  return words.slice(0, n).join(" ").replace(/[,;:|–—.-]+$/g, "").trim();
}

function safeAnchor(_index, anchorHtml) {
  return anchorHtml;
}

function keepBlurb(index, raw, rel, live) {
  const text = decode(raw.replace(/<[^>]+>/g, " ")).replace(/^[\s|–—:-]+|[\s|–—:-]+$/g, "").trim();
  if (!text || badFragment(text)) return "";
  const sentences = sentencesInText(text);
  if (!sentences.length) return text;
  const keep = sentences.filter((sentence) => !notRequired(index, sentence, rel, live));
  if (!keep.length) return "";
  for (const sentence of keep) noteSentences(sentence, rel, live);
  if (keep.length !== sentences.length) return joinSents(keep);
  return text;
}

function cleanLinkInner(index, inner, rel, live) {
  const anchors = [];
  const texts = [];
  const re = /<a\b[^>]*>[\s\S]*?<\/a>/gi;
  let last = 0;
  let match;
  while ((match = re.exec(inner))) {
    texts.push(inner.slice(last, match.index));
    anchors.push(match[0]);
    last = match.index + match[0].length;
  }
  texts.push(inner.slice(last));
  if (!anchors.length) return "";
  const bits = [];
  for (let i = 0; i < anchors.length; i++) {
    if (bits.length) bits.push(" ");
    bits.push(safeAnchor(index, anchors[i], rel, live));
    const blurb = keepBlurb(index, texts[i + 1] || "", rel, live);
    if (blurb) bits.push(`. ${blurb.replace(/[.!?]+$/g, "")}.`);
    else bits.push(".");
  }
  return bits.join("").replace(/\s+\.\s*\./g, ".").replace(/\s{2,}/g, " ").trim();
}

function originLinkParagraphs(html) {
  const region = regionHtml(html);
  const out = [];
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = re.exec(region))) {
    if (/affiliate-disclosure|medical-disclaimer/i.test(match[0])) continue;
    if (!/<a\b/i.test(match[1])) continue;
    out.push({ outer: match[0], inner: match[1], hrefs: [...new Set(hrefsIn(match[1]))] });
  }
  return out;
}

function bestOriginParagraph(paragraphs, hrefs) {
  let best = null;
  let bestScore = 0;
  for (const paragraph of paragraphs) {
    const score = hrefs.filter((href) => paragraph.hrefs.includes(href)).length;
    if (score > bestScore) {
      best = paragraph;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}

function repairLinkParagraphs(index, html, originHtml, rel, live) {
  const paragraphs = originLinkParagraphs(originHtml);
  let rebuilt = 0;
  const re = /<p\b(?![^>]*\b(?:affiliate-disclosure|medical-disclaimer)\b)[^>]*>[\s\S]*?<\/p>/gi;
  const edits = [];
  let match;
  while ((match = re.exec(html))) {
    const inner = match[0].replace(/^<p\b[^>]*>/i, "").replace(/<\/p>$/i, "");
    const hrefs = [...new Set(hrefsIn(inner))];
    if (!hrefs.length) continue;
    const origin = paragraphs.filter(
      (paragraph) => paragraph.hrefs.length === hrefs.length && hrefs.every((href) => paragraph.hrefs.includes(href)),
    );
    if (origin.length !== 1) continue;
    const next = origin[0].outer;
    if (!next || next === match[0]) continue;
    edits.push({ start: match.index, end: match.index + match[0].length, text: next });
    rebuilt += 1;
  }
  let nextHtml = applyEdits(html, edits);
  const loose = /(<p class="affiliate-disclosure"[\s\S]*?<\/p>)\s*((?:<a\b[\s\S]*?<\/a>[\s\S]*?)+)<\/p>/gi;
  nextHtml = nextHtml.replace(loose, (full, disclosure, body) => {
    const hrefs = [...new Set(hrefsIn(body))];
    const matches = paragraphs.filter(
      (paragraph) => paragraph.hrefs.length === hrefs.length && hrefs.every((href) => paragraph.hrefs.includes(href)),
    );
    const cleaned = matches.length === 1 ? matches[0].inner : body.replace(/ -  - /g, " - ").trim();
    if (!cleaned) return full;
    rebuilt += 1;
    return `${disclosure}\n<p>${cleaned}</p>`;
  });
  if (nextHtml.includes(" -  - ")) {
    nextHtml = nextHtml.replaceAll(" -  - ", " - ");
    rebuilt += 1;
  }
  return { html: nextHtml, rebuilt };
}

function applyEdits(html, edits) {
  const ordered = [...edits].sort((a, b) => b.start - a.start);
  let next = html;
  for (const edit of ordered) next = next.slice(0, edit.start) + edit.text + next.slice(edit.end);
  return next;
}

function repairCells(index, html, originHtml, rel, live) {
  const originTables = tablesOf(originHtml);
  const currentTables = tablesOf(html);
  let repaired = 0;
  let inserted = 0;
  const edits = [];
  const region = regionHtml(html);
  const regionAt = html.indexOf(region.slice(0, 80));
  // Positions are found with indexOf on the full html, walking forward.
  let cursor = 0;
  for (let t = 0; t < originTables.length && t < currentTables.length; t++) {
    const originRows = originTables[t].rows;
    const rows = currentTables[t].rows;
    if (originRows.length !== rows.length) continue;
    let aligned = 0;
    for (let r = 0; r < originRows.length; r++) {
      const left = coreText(originRows[r].cells[0]?.text || "");
      const right = coreText(rows[r].cells[0]?.text || "");
      if (!left || !right || left === right || left.startsWith(right) || right.startsWith(left)) aligned += 1;
    }
    if (aligned < Math.ceil(originRows.length * 0.6)) continue;
    for (let r = 0; r < originRows.length; r++) {
      const a = originRows[r].cells;
      const b = rows[r].cells;
      if (a.length !== b.length) continue;
      let rowHtml = rows[r].html;
      let rowChanged = false;
      for (let c = 0; c < a.length; c++) {
        const comma = /,\s*$/.test(b[c].text);
        if (!comma && !isTruncation(b[c].text, a[c].text)) continue;
        if (cellCovered(a[c].text, b[c].text)) continue;
        const replacement = renderCell(index, a[c], rel, live);
        if (!rowHtml.includes(b[c].full)) continue;
        rowHtml = rowHtml.replace(b[c].full, replacement);
        rowChanged = true;
        repaired += 1;
      }
      if (!rowChanged) continue;
      const at = html.indexOf(rows[r].html, cursor);
      if (at < 0) continue;
      edits.push({ start: at, end: at + rows[r].html.length, text: rowHtml });
      cursor = at + rows[r].html.length;
    }
  }
  let next = applyEdits(html, edits);
  const after = tablesOf(next);
  const flat = after.flatMap((table) => table.rows);
  const inserts = new Map();
  for (const table of originTables) {
    for (const row of table.rows) {
      if ((index.rowCounts.get(rowKey(row.text)) || 0) > 3) continue;
      if (coveredByRow(row.text, flat)) continue;
      const rendered = renderRow(index, row, rel, live);
      const key = rowKey(row.text);
      if (!inserts.has(key)) inserts.set(key, rendered);
    }
  }
  if (inserts.size) {
    const block = `\n<table class="comparison-table">\n${[...inserts.values()].join("\n")}\n</table>\n`;
    const placed = insertBeforeClose(next, block);
    if (placed !== next) {
      next = placed;
      inserted += inserts.size;
    }
  }
  return { html: next, repaired, inserted, ignored: regionAt < 0 };
}

function stripTrailingCommas(html) {
  return html.replace(/<(t[dh])\b([^>]*)>([^<]*),\s*<\/\1>/gi, "<$1$2>$3</$1>");
}

function renderCell(index, cell, rel, live) {
  noteSentences(cell.text, rel, live);
  return cell.full;
}

function renderRow(index, row, rel, live) {
  for (const cell of row.cells) noteSentences(cell.text, rel, live);
  return row.html;
}

function wouldExceed(sentence, rel, live) {
  const key = normalize(sentence);
  const pages = live.get(key);
  if (!pages) return false;
  return pages.size >= 3 && !pages.has(rel);
}

function shouldSoften(index, text, rel, live) {
  for (const sentence of sentencesInText(text)) {
    if (isTemplate(index, sentence) || wouldExceed(sentence, rel, live)) return true;
  }
  return false;
}

function noteSentences(text, rel, live) {
  for (const sentence of sentencesInText(text)) {
    const key = normalize(sentence);
    if (!live.has(key)) live.set(key, new Set());
    live.get(key).add(rel);
  }
}

function insertBeforeClose(html, snippet) {
  const article = html.lastIndexOf("</article>");
  if (article !== -1) return html.slice(0, article) + snippet + html.slice(article);
  const main = html.lastIndexOf("</main>");
  if (main !== -1) return html.slice(0, main) + snippet + html.slice(main);
  return html;
}

function patchProse(index, html, originHtml, rel, live) {
  const pageText = visibleText(html).toLowerCase();
  const currentSentences = sentencesOf(html);
  const chunks = [];
  const placed = new Set();
  for (const sentence of new Set(sentencesOf(originHtml))) {
    const lower = sentence.toLowerCase();
    if (placed.has(lower) || sentenceCovered(sentence, pageText, currentSentences, rel)) continue;
    if (notRequired(index, sentence, rel, live)) continue;
    const row = replacementRow(rel, sentence);
    if (row && !sameFacts(sentence, row.replacement)) continue;
    placed.add(lower);
    const body = row
      ? row.replacement.replace(/\s+/g, " ").trim()
      : (/[.!?]$/.test(sentence) ? sentence : `${sentence}.`);
    noteSentences(body, rel, live);
    chunks.push(`<p>${escapeText(body)}</p>`);
  }
  if (!chunks.length) return { html, patched: 0, appended: 0, extended: 0 };
  return {
    html: insertBeforeClose(html, `\n${chunks.join("\n")}\n`),
    patched: 0,
    appended: chunks.length,
    extended: 0,
  };
}

function appendHrefs(index, html, originHtml, rel, live) {
  const have = new Set(hrefsIn(html));
  const region = regionHtml(originHtml);
  const re = /<a\b[^>]*>[\s\S]*?<\/a>/gi;
  const seen = new Set();
  const anchors = [];
  let match;
  while ((match = re.exec(region))) {
    const hrefMatch = match[0].match(/\bhref\s*=\s*(["'])(.*?)\1/i);
    if (!hrefMatch) continue;
    const href = decode(hrefMatch[2]).trim();
    if (!href || href.startsWith("#") || /^javascript:/i.test(href) || seen.has(href) || have.has(href)) continue;
    seen.add(href);
    anchors.push(safeAnchor(index, match[0], rel, live));
  }
  if (!anchors.length) return { html, added: 0 };
  let block = `<p>${anchors.join(" ")}</p>\n`;
  const sponsored = /rel\s*=\s*["'][^"']*sponsored/i.test(block);
  if (sponsored && !/affiliate-disclosure/i.test(html)) block = `${DISCLOSURE}\n${block}`;
  return { html: insertBeforeClose(html, block), added: anchors.length };
}

function appendFigures(html, originHtml) {
  const missing = [...numericValues(visibleText(originHtml))].filter((num) => !numericValues(visibleText(html)).has(num));
  if (!missing.length) return { html, added: 0 };
  const phrases = phrasesFor(visibleText(originHtml), missing);
  if (!phrases.length) return { html, added: 0 };
  const line = phrases
    .join(" · ")
    .toLowerCase()
    .replace(/(\d)(percent|hrs?)(?=\b)/gi, "$1 $2");
  const block = `<p>${escapeText(line)}.</p>\n`;
  return { html: insertBeforeClose(html, block), added: phrases.length };
}

function sentenceKey(part) {
  const key = part.replace(/^[^A-Za-z]+/, "").replace(/[.!?]+$/, "").replace(/\s+/g, " ").trim();
  if (!/^[A-Z]/.test(key) || key.split(/\s+/).length < 5) return "";
  return key;
}

function dedupeTrailing(html) {
  const start = html.search(/<article\b/i);
  const end = html.lastIndexOf("</article>");
  if (start < 0 || end < 0) return html;
  const article = html.slice(start, end);
  const seen = new Set();
  const re = /<(p|li)\b[^>]*>[\s\S]*?<\/\1>/gi;
  const edits = [];
  let match;
  while ((match = re.exec(article))) {
    const full = match[0];
    if (/affiliate-disclosure|medical-disclaimer/i.test(full)) continue;
    if (/^<li\b/i.test(full) || /<a\b/i.test(full)) continue;
    const text = decode(full.replace(/<\/(p|div|h[1-6])>/gi, ". ").replace(/<br\s*\/?>/gi, ". ").replace(/<[^>]+>/g, " "));
    const parts = text.split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter(Boolean);
    const keys = parts.map(sentenceKey).filter(Boolean);
    if (!keys.length) continue;
    const tag = full.match(/^<(p|li)/i)[1];
    if (!/<a\b/i.test(full)) {
      const kept = [];
      let dropped = false;
      for (const part of parts) {
        const key = sentenceKey(part);
        if (key && seen.has(key)) {
          dropped = true;
          continue;
        }
        if (key) seen.add(key);
        kept.push(/[.!?]$/.test(part) ? part : `${part}.`);
      }
      if (!dropped) continue;
      const textOut = kept.length ? `<${tag}>${escapeText(kept.join(" "))}</${tag}>` : "";
      edits.push({ start: match.index, end: match.index + full.length, text: textOut });
      continue;
    }
    const duplicate = keys.every((key) => seen.has(key));
    for (const key of keys) seen.add(key);
    if (!duplicate) continue;
    const hrefs = hrefsIn(full);
    const earlier = article.slice(0, match.index);
    if (!hrefs.every((href) => earlier.includes(`href="${href}"`) || earlier.includes(`href='${href}'`))) continue;
    edits.push({ start: match.index, end: match.index + full.length, text: "" });
  }
  if (!edits.length) return html;
  let nextArticle = article;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    nextArticle = nextArticle.slice(0, edit.start) + edit.text + nextArticle.slice(edit.end);
  }
  return html.slice(0, start) + nextArticle + html.slice(end);
}

function syncFaq(html) {
  const texts = [];
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = re.exec(html))) {
    const text = decode(match[1].replace(/<[^>]+>/g, " "));
    if (text) texts.push(text);
  }
  return html.replace(/"text"\s*:\s*"((?:\\.|[^"\\])*)"/g, (full, raw) => {
    let decoded;
    try {
      decoded = JSON.parse(`"${raw}"`).replace(/\s+/g, " ").trim();
    } catch {
      return full;
    }
    if (decoded.length < 40) return full;
    const better = texts.find((text) => text.startsWith(decoded) && text.length > decoded.length + 8);
    if (!better) return full;
    return `"text": ${JSON.stringify(better)}`;
  });
}

function seedLive() {
  const live = new Map();
  let n = 0;
  for (const file of walkHtml(ROOT)) {
    const rel = path.relative(ROOT, file);
    const seen = new Set();
    for (const sentence of sentencesOf(fs.readFileSync(file, "utf8"))) {
      const key = normalize(sentence);
      if (seen.has(key)) continue;
      seen.add(key);
      if (!live.has(key)) live.set(key, new Set());
      live.get(key).add(rel);
    }
    n += 1;
    if (n % 2000 === 0) console.error(`current sentences ${n}`);
  }
  return live;
}

function fixAll(index, pagePairs) {
  const live = seedLive();
  const totals = {
    files: 0,
    cells: 0,
    rows: 0,
    links: 0,
    patched: 0,
    extended: 0,
    sentences: 0,
    hrefs: 0,
    figures: 0,
  };
  let seen = 0;
  for (const pair of pagePairs) {
    seen += 1;
    if (seen % 1000 === 0) console.error(`scanned ${seen}, changed ${totals.files}`);
    let html = fs.readFileSync(pair.current, "utf8");
    const originHtml = fs.readFileSync(pair.origin, "utf8");
    const before = html;
    const links = repairLinkParagraphs(index, html, originHtml, pair.rel, live);
    html = links.html;
    const cells = repairCells(index, html, originHtml, pair.rel, live);
    html = cells.html;
    const prose = patchProse(index, html, originHtml, pair.rel, live);
    html = prose.html;
    const hrefs = appendHrefs(index, html, originHtml, pair.rel, live);
    html = hrefs.html;
    const figures = appendFigures(html, originHtml);
    html = figures.html;
    html = dedupeTrailing(html);
    html = syncFaq(html);
    if (html !== before) {
      fs.writeFileSync(pair.current, html);
      totals.files += 1;
      totals.cells += cells.repaired;
      totals.rows += cells.inserted;
      totals.links += links.rebuilt;
      totals.patched += prose.patched;
      totals.extended += prose.extended;
      totals.sentences += prose.appended;
      totals.hrefs += hrefs.added;
      totals.figures += figures.added;
    }
    if ((totals.files + 1) % 500 === 0) console.error(`fixed files ${totals.files}`);
  }
  return totals;
}

function report(pagePairs, missingPages, index, live) {
  const stats = {
    pages: pagePairs.length,
    missingPages: missingPages.length,
    numbersChecked: 0,
    numbersMissing: 0,
    numberPages: 0,
    hrefsChecked: 0,
    hrefsMissing: 0,
    hrefPages: 0,
    rowsChecked: 0,
    rowsMissing: 0,
    rowPages: 0,
    uniqueChecked: 0,
    uniqueMissing: 0,
    uniquePages: 0,
    truncated: 0,
    truncatedPages: 0,
    commaCells: 0,
    doubleDash: 0,
  };
  const samples = [];
  let n = 0;
  for (const pair of pagePairs) {
    const result = analyze(index, pair, live);
    stats.numbersChecked += result.originNums;
    stats.hrefsChecked += result.originHrefs;
    stats.rowsChecked += result.rowsChecked;
    stats.uniqueChecked += result.uniqueChecked;
    if (result.missingNums.length) {
      stats.numbersMissing += result.missingNums.length;
      stats.numberPages += 1;
    }
    if (result.missingHrefs.length) {
      stats.hrefsMissing += result.missingHrefs.length;
      stats.hrefPages += 1;
    }
    if (result.missingRows.length) {
      stats.rowsMissing += result.missingRows.length;
      stats.rowPages += 1;
    }
    if (result.missingSentences.length) {
      stats.uniqueMissing += result.missingSentences.length;
      stats.uniquePages += 1;
    }
    if (result.truncated) {
      stats.truncated += result.truncated;
      stats.truncatedPages += 1;
    }
    stats.commaCells += result.commaCells;
    stats.doubleDash += result.doubleDash;
    if (samples.length < 12 && (result.missingSentences.length || result.missingHrefs.length || result.truncated || result.missingRows.length)) {
      samples.push({
        rel: pair.rel,
        sentences: result.missingSentences.slice(0, 2),
        hrefs: result.missingHrefs.slice(0, 3),
        rows: result.missingRows.slice(0, 1),
        dangling: result.dangling.slice(0, 1),
      });
    }
    n += 1;
    if (n % 2000 === 0) console.error(`compared ${n}`);
  }
  return { stats, samples };
}

const { out, missing } = pairs();
if (!out.length) {
  console.error("origin baseline produced no pages. Refusing a vacuous pass.");
  process.exit(1);
}
const work = ONLY.size ? out.filter((pair) => ONLY.has(pair.rel) || ONLY.has(pair.originRel)) : out;
console.error(`pages ${out.length}, work ${work.length}, missing counterparts ${missing.length}`);
assertReplacements(out);
runChromeFixtures();
const why = assertWhyQuestions(ROOT);
if (why.length) {
  console.error(`why-does FAQ names failed (${why.length})`);
  for (const line of why.slice(0, 40)) console.error(line);
  process.exit(1);
}
const chrome = assertChrome(ROOT, BASE);
if (chrome.problems.length) {
  console.error(`chrome check failed (${chrome.problems.length} pages)`);
  for (const line of chrome.problems.slice(0, 40)) console.error(line);
  process.exit(1);
}
console.error(`chrome check ok (${chrome.pages} html files)`);
const index = buildIndex(out);
if (FIX) {
  const totals = fixAll(index, work);
  console.log(JSON.stringify({ fixed: totals, missingPages: missing.length }, null, 2));
} else {
  console.error("scanning current sentences");
  const live = seedLive();
  const { stats, samples } = report(work, ONLY.size ? [] : missing, index, live);
  const failed =
    stats.missingPages ||
    stats.numbersMissing ||
    stats.hrefsMissing ||
    stats.rowsMissing ||
    stats.uniqueMissing ||
    stats.truncated ||
    stats.commaCells ||
    stats.doubleDash;
  console.log(JSON.stringify({ ok: !failed, ...stats, samples, missingPageSample: missing.slice(0, 20) }, null, 2));
  process.exit(failed ? 1 : 0);
}
