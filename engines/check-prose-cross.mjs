#!/usr/bin/env node
/**
 * Fails if the same sentence longer than 12 words appears on more than
 * three breed or species profiles. Shared site chrome, quick-fact tables,
 * affiliate blocks, and decision-guide lists are not profile prose.
 *
 * Usage: node engines/check-prose-cross.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function profiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) profiles(full, out);
    else if (entry.name.endsWith(".html") && !entry.name.includes("-breeds")) out.push(full);
  }
  return out;
}

function articleText(html) {
  const match = html.match(/<article[\s\S]*?<\/article>/i);
  if (!match) return "";
  let article = match[0];
  article = article.replace(/<table[\s\S]*?<\/table>/gi, " ");
  article = article.replace(/<div class="affiliate-callout"[\s\S]*?<\/div>/gi, " ");
  const commercial = article.indexOf("commercial-links-section");
  if (commercial >= 0) article = article.slice(0, commercial);
  article = article.replace(/<(p|li|h1|h2|h3|h4|div|tr|section|a)(\s[^>]*)?>/gi, ". ");
  article = article.replace(/<br\s*\/?>/gi, ". ");
  return article
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;|&ldquo;|&rdquo;|&quot;/g, "'")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ");
}

function sentenceKey(part) {
  return part.trim().replace(/^[^A-Za-z]+/, "").replace(/[.!?]+$/, "").replace(/\s+/g, " ").trim();
}

function sentences(text) {
  const kept = [];
  for (const part of text.split(/(?<=[.!?])\s+/)) {
    const key = sentenceKey(part);
    if (!/^[A-Z]/.test(key)) continue;
    const words = key.split(/\s+/).filter(Boolean);
    if (words.length <= 12) continue;
    kept.push(key);
  }
  return kept;
}

const seen = new Map();
const files = profiles(path.join(ROOT, "breeds"));
for (const file of files) {
  const unique = new Set(sentences(articleText(fs.readFileSync(file, "utf8"))));
  for (const sentence of unique) {
    if (!seen.has(sentence)) seen.set(sentence, []);
    seen.get(sentence).push(path.relative(ROOT, file));
  }
}

const failures = [...seen.entries()].filter(([, list]) => list.length > 3);

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "engines") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

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
console.log(`cross-page prose check ok (${files.length} profiles, stock phrases clear)`);
