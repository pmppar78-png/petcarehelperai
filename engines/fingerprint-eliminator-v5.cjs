#!/usr/bin/env node
/**
 * fingerprint-eliminator-v5.cjs — broader catches for "a/an" variants and
 * remaining template variants.
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
    id: 'first-year-costs-an',
    regex: /First-year costs for an ([A-Za-z][A-Za-z0-9 '\u2019\-]{1,60}?) run higher than ongoing annual costs because everything is new\. Factor in the purchase or adoption fee, initial veterinary workup, core supplies, and the inevitable replacement of items damaged during the adjustment period\.?/g,
    variants: [
      (T) => `Expect year one with an ${T} to cost meaningfully more than the steady-state years that follow. The one-time items include the purchase or adoption fee, the intake vet visit, starter supplies, and a predictable amount of chewed, scratched, or broken household objects during the settling-in period.`,
      (T) => `The first twelve months of owning an ${T} are almost always the most expensive. Acquisition fees, initial diagnostics, core gear, and replacement costs for things the animal destroys while learning the house all stack up before the ongoing annual number stabilizes.`,
      (T) => `Year one with an ${T} tends to run well above the later-year average. Factor in the adoption or purchase cost, a full new-pet workup at the vet, the starter kit of equipment, and the inevitable replacements for items damaged while the animal acclimates.`,
      (T) => `Initial outlays for an ${T} compress into the first year: acquisition, a comprehensive intake exam, core supplies, and the quietly sizeable replacement costs that come with an untrained animal living in your home. Later years look cheaper by comparison.`,
      (T) => `An ${T}'s first year on your budget typically spikes because nothing is in place yet, adoption fees, an initial vet workup, starter supplies, and a steady trickle of damaged household items during the adjustment period all hit in the same twelve months.`,
      (T) => `Budgeting for an ${T} should separate one-time setup costs from ongoing annual costs. Year one carries the acquisition fee, full intake exam, new-pet gear, and a realistic line item for replacement of items the animal wrecks while adjusting.`,
      (T) => `Plan for year one with an ${T} to come in materially higher than later years. The one-time pressure comes from the adoption or purchase cost, the first vet visit, core supplies, and normal breakage while the animal learns the household rules.`,
      (T) => `The first-year line item for an ${T} is inflated for predictable reasons: the animal itself, a thorough intake workup, the initial round of supplies, and a tolerance budget for items destroyed during the settling-in phase.`,
      (T) => `Expect year one with an ${T} to be front-loaded, acquisition fees, initial veterinary diagnostics, a complete set of starter supplies, and a realistic allowance for replacement items during the animal's first months at home.`,
      (T) => `When projecting what an ${T} will actually cost, keep year one in its own column. It carries the acquisition cost, the new-pet vet visit, all of the first-time supplies, and a buffer for the items that will not survive the adjustment period.`,
      (T) => `Setup year for an ${T} always costs more than the years that follow. The one-time pressure points are acquisition, initial vet work, starter supplies, and ordinary household replacement costs as the animal adapts.`,
      (T) => `A first-year budget for an ${T} is front-heavy: adoption or purchase fee, a full intake exam, core gear, and realistic allowances for furniture, shoes, or equipment damaged while the animal learns the house.`,
    ],
  },
  {
    id: 'first-year-highest',
    regex: /First-year costs are the highest, followed by relatively stable annual maintenance through the adult years, with a gradual increase as your ([A-Za-z][A-Za-z0-9 '\u2019\-]{1,60}?) enters the senior phase\. Having a realistic lifetime cost estimate helps you make an informed decision before bringing one home\.?/g,
    variants: [
      (T) => `Year one tends to peak, adult years settle into a relatively flat annual cost, and senior years for a ${T} usually drift upward again as age-related care needs appear. A realistic lifetime projection matters more than any single year's number.`,
      (T) => `A typical ${T} cost curve is high in year one, flat through the middle years, and gently rising in the senior phase as health care needs scale up. Lifetime math is what separates informed purchase decisions from impulsive ones.`,
      (T) => `Expect a ${T}'s cost pattern to follow a predictable arc: elevated during the first year, stable through adulthood, and trending upward again in the senior years. Running the full-lifetime estimate before acquiring the animal is the useful exercise.`,
      (T) => `The shape of ${T} ownership costs is familiar: year one is highest, the adult years stabilize, and the senior phase reintroduces elevated spending driven by age-linked care. Plan on the lifetime total, not the headline year-one figure.`,
      (T) => `${T} cost trajectories are consistent across households: a spike in year one, a plateau through the middle, and a gradual climb as the pet enters senior years. Use the full-lifetime number as your decision input.`,
      (T) => `${T} ownership costs peak during year one, level off across the adult years, and begin climbing again as the animal ages into the senior stage. That long arc, not year one alone, is what should inform the decision to get one.`,
      (T) => `Expect higher totals during your ${T}'s first year, a relatively flat adult period, and a slow upward drift in senior-year spending. Lifetime projections are the honest number to work with.`,
      (T) => `A ${T}'s cost pattern is front-loaded in year one, then flat, then rising again in the senior years. Any serious cost-of-ownership discussion needs the full-lifetime total on the table.`,
    ],
  },
  {
    id: 'peer-reviewed-transparency-v2',
    regex: /Peer-reviewed sources and breed health databases back the claims on this page, yet online information has irreducible limits\. Predispositions describe population-level trends, while your own pet's risk is shaped by unique genetics, environment, diet, and lifestyle\. The appropriate use of this resource is as a starting point before a veterinary conversation\.?/g,
    variants: [
      () => `Claims on this page are grounded in peer-reviewed research and breed health data, though online content has built-in limits. Breed predispositions capture population averages; your specific pet's risk is shaped by its own genetics, environment, diet, and daily life. Use this page to prepare, not to replace, your veterinary conversation.`,
      () => `References here draw from peer-reviewed veterinary literature and breed health databases, yet online text cannot substitute for hands-on exam. Predispositions are population-level; your individual pet's actual risk reflects its unique genes, environment, diet, and routine. Treat this material as pre-reading for a vet visit.`,
      () => `What follows is informed by peer-reviewed sources and established breed health data, but any online guide runs into the same limits, general population trends do not predict individual outcomes. Your pet's specific risk profile is shaped by genetics, environment, diet, and lifestyle, which means this page is preparation for a veterinary conversation, not a substitute for one.`,
    ],
  },
];

const SKIP_DIRS = ['node_modules', '.netlify', 'engines', 'data', 'audit', 'test-results', '.git'];

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
  for (const r of ['fish.html','dogs.html','cats.html','birds.html','amphibians.html','reptiles.html','small-animals.html','marine-fish.html']) {
    const p = path.join(ROOT, r);
    if (fs.existsSync(p)) files.push(p);
  }

  const stats = { filesChanged: 0, hits: {} };
  for (const f of files) processFile(f, stats);
  console.log(JSON.stringify({
    filesScanned: files.length,
    filesChanged: stats.filesChanged,
    hits: stats.hits,
  }, null, 2));
}

main();
