#!/usr/bin/env node
/**
 * fingerprint-eliminator-v9.cjs — handles first-year-costs template where
 * breed names contain parentheses, ampersands, or numeric entities that
 * the v4/v5 character-class regex did not match.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

function hashPick(filePath, patternId, poolSize) {
  const h = crypto.createHash('sha1').update(filePath + '|' + patternId).digest();
  return h.readUInt32BE(0) % poolSize;
}

const RULES = [
  {
    id: 'first-year-costs-flex',
    regex: /First-year costs for an? ([^<]{1,120}?) run higher than ongoing annual costs because everything is new\. Factor in the purchase or adoption fee, initial veterinary workup, core supplies, and the inevitable replacement of items damaged during the adjustment period\.?/g,
    variants: [
      (T) => `Expect year one with a ${T} to cost meaningfully more than the steady-state years that follow. The one-time items include the purchase or adoption fee, the intake vet visit, starter supplies, and a predictable amount of chewed, scratched, or broken household objects during the settling-in period.`,
      (T) => `The first twelve months of owning a ${T} are almost always the most expensive. Acquisition fees, initial diagnostics, core gear, and replacement costs for things the animal destroys while learning the house all stack up before the ongoing annual number stabilizes.`,
      (T) => `Year one with a ${T} tends to run well above the later-year average. Factor in the adoption or purchase cost, a full new-pet workup at the vet, the starter kit of equipment, and the inevitable replacements for items damaged while the animal acclimates.`,
      (T) => `Initial outlays for a ${T} compress into the first year: acquisition, a comprehensive intake exam, core supplies, and the quietly sizeable replacement costs that come with an untrained animal living in your home. Later years look cheaper by comparison.`,
      (T) => `A ${T}'s first year on your budget typically spikes because nothing is in place yet: adoption fees, an initial vet workup, starter supplies, and a steady trickle of damaged household items during the adjustment period all hit in the same twelve months.`,
      (T) => `Budgeting for a ${T} should separate one-time setup costs from ongoing annual costs. Year one carries the acquisition fee, full intake exam, new-pet gear, and a realistic line item for replacement of items the animal wrecks while adjusting.`,
      (T) => `Plan for year one with a ${T} to come in materially higher than later years. The one-time pressure comes from the adoption or purchase cost, the first vet visit, core supplies, and normal breakage while the animal learns the household rules.`,
      (T) => `The first-year line item for a ${T} is inflated for predictable reasons: the animal itself, a thorough intake workup, the initial round of supplies, and a tolerance budget for items destroyed during the settling-in phase.`,
      (T) => `Expect year one with a ${T} to be front-loaded: acquisition fees, initial veterinary diagnostics, a complete set of starter supplies, and a realistic allowance for replacement items during the animal's first months at home.`,
      (T) => `When projecting what a ${T} will actually cost, keep year one in its own column. It carries the acquisition cost, the new-pet vet visit, all of the first-time supplies, and a buffer for the items that will not survive the adjustment period.`,
      (T) => `Setup year for a ${T} always costs more than the years that follow. The one-time pressure points are acquisition, initial vet work, starter supplies, and ordinary household replacement costs as the animal adapts.`,
      (T) => `A first-year budget for a ${T} is front-heavy: adoption or purchase fee, a full intake exam, core gear, and realistic allowances for furniture, shoes, or equipment damaged while the animal learns the house.`,
    ],
  },
];

const SKIP_DIRS = ['node_modules', '.netlify', '.git'];

function listHtml(dir) {
  const out = [];
  (function walk(d) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (SKIP_DIRS.includes(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && p.endsWith('.html')) out.push(p);
    }
  })(dir);
  return out;
}

function processFile(filePath, stats) {
  let content;
  try { content = fs.readFileSync(filePath, 'utf8'); } catch { return; }
  const original = content;
  const rel = path.relative(ROOT, filePath);

  for (const rule of RULES) {
    rule.regex.lastIndex = 0;
    if (!rule.regex.test(content)) continue;
    rule.regex.lastIndex = 0;
    content = content.replace(rule.regex, function () {
      const args = Array.from(arguments);
      const captures = [];
      for (let i = 1; i < args.length - 1; i++) {
        if (typeof args[i] === 'string') captures.push(args[i].trim());
      }
      const idx = hashPick(rel, rule.id, rule.variants.length);
      const replacement = rule.variants[idx](...captures);
      stats.hits[rule.id] = (stats.hits[rule.id] || 0) + 1;
      return replacement;
    });
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    stats.filesChanged += 1;
  }
}

function main() {
  const targets = [
    path.join(ROOT, 'commercial'),
    path.join(ROOT, 'guides'),
    path.join(ROOT, 'breeds'),
    path.join(ROOT, 'locations'),
  ];
  const files = [];
  for (const t of targets) files.push(...listHtml(t));

  const stats = { filesChanged: 0, hits: {} };
  for (const f of files) processFile(f, stats);
  console.log(JSON.stringify({
    filesScanned: files.length,
    filesChanged: stats.filesChanged,
    hits: stats.hits,
  }, null, 2));
}

main();
