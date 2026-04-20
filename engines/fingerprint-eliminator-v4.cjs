#!/usr/bin/env node
/**
 * fingerprint-eliminator-v4.cjs
 *
 * Additional phrases surfaced by hostile reviewer + wider variant pools.
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
    id: 'guidelines-start-vet-tailor',
    regex: /These guidelines work well as a starting point, but your veterinarian can tailor recommendations to your ([A-Za-z][A-Za-z0-9 '\u2019\-]{1,60}?)'s specific health profile and lifestyle\.?/g,
    variants: [
      (T) => `Take this as a general baseline, your vet can narrow it down to what suits your ${T}'s actual health picture and daily habits.`,
      (T) => `Use this as orientation; your veterinarian can sharpen the specifics based on what they see in your ${T}.`,
      (T) => `This is a reasonable default, the final plan for a ${T} should come from a veterinarian with the full chart in front of them.`,
      (T) => `Treat these as opening assumptions; the refinement for your particular ${T} happens in the exam room.`,
      (T) => `General guidance like this gives you the right vocabulary for the vet visit where the real personalization happens for your ${T}.`,
      (T) => `Think of these as the first pass, a veterinarian familiar with your ${T}'s lifestyle will correct what actually needs correcting.`,
      (T) => `These starting-point recommendations are deliberately broad, a vet who has examined your ${T} can calibrate them properly.`,
      (T) => `What you read here is the template, not the answer, an in-person vet visit is where your ${T}'s plan gets personalized.`,
      (T) => `This is the right shape of plan for most ${T} cases; the exact numbers belong in a conversation with your veterinarian.`,
      (T) => `Use this as preparatory reading, your vet's adjustments for your individual ${T} are what actually matter.`,
      (T) => `The usable version of this plan is the one your veterinarian writes after examining your ${T} in person.`,
      (T) => `Consider this scaffolding; final recommendations for your ${T} depend on a vet's read of weight, age, and baseline health.`,
      (T) => `Reading this is step one, booking a routine vet visit to tune it to your ${T}'s lifestyle is step two.`,
      (T) => `Published guidance can describe a ${T} in general, only your veterinarian can translate that to the specific animal in your home.`,
      (T) => `A veterinarian who knows your ${T} will treat recommendations like these as a starting budget and adjust each line as needed.`,
    ],
  },
  {
    id: 'first-year-costs-higher',
    regex: /First-year costs for a ([A-Za-z][A-Za-z0-9 '\u2019\-]{1,60}?) run higher than ongoing annual costs because everything is new\. Factor in the purchase or adoption fee, initial veterinary workup, core supplies, and the inevitable replacement of items damaged during the adjustment period\.?/g,
    variants: [
      (T) => `Expect year one with a ${T} to cost meaningfully more than the steady-state years that follow. The one-time items include the purchase or adoption fee, the intake vet visit, starter supplies, and a predictable amount of chewed, scratched, or broken household objects during the settling-in period.`,
      (T) => `The first twelve months of owning a ${T} are almost always the most expensive. Acquisition fees, initial diagnostics, core gear, and replacement costs for things the animal destroys while learning the house all stack up before the ongoing annual number stabilizes.`,
      (T) => `Year one with a ${T} tends to run well above the later-year average. Factor in the adoption or purchase cost, a full new-pet workup at the vet, the starter kit of equipment, and the inevitable replacements for items damaged while the animal acclimates.`,
      (T) => `Initial outlays for a ${T} compress into the first year: acquisition, a comprehensive intake exam, core supplies, and the quietly sizeable replacement costs that come with an untrained animal living in your home. Later years look cheaper by comparison.`,
      (T) => `A ${T}'s first year on your budget typically spikes because nothing is in place yet, adoption fees, an initial vet workup, starter supplies, and a steady trickle of damaged household items during the adjustment period all hit in the same twelve months.`,
      (T) => `Budgeting for a ${T} should separate one-time setup costs from ongoing annual costs. Year one carries the acquisition fee, full intake exam, new-pet gear, and a realistic line item for replacement of items the animal wrecks while adjusting.`,
      (T) => `Plan for year one with a ${T} to come in materially higher than later years. The one-time pressure comes from the adoption or purchase cost, the first vet visit, core supplies, and normal breakage while the animal learns the household rules.`,
      (T) => `The first-year line item for a ${T} is inflated for predictable reasons: the animal itself, a thorough intake workup, the initial round of supplies, and a tolerance budget for items destroyed during the settling-in phase.`,
      (T) => `Expect year one with a ${T} to be front-loaded, acquisition fees, initial veterinary diagnostics, a complete set of starter supplies, and a realistic allowance for replacement items during the animal's first months at home.`,
      (T) => `When projecting what a ${T} will actually cost, keep year one in its own column. It carries the acquisition cost, the new-pet vet visit, all of the first-time supplies, and a buffer for the items that will not survive the adjustment period.`,
      (T) => `Setup year for a ${T} always costs more than the years that follow. The one-time pressure points are acquisition, initial vet work, starter supplies, and ordinary household replacement costs as the animal adapts.`,
      (T) => `A first-year budget for a ${T} is front-heavy: adoption or purchase fee, a full intake exam, core gear, and realistic allowances for furniture, shoes, or equipment damaged while the animal learns the house.`,
    ],
  },
  {
    id: 'surprise-costs',
    regex: /The costs that surprise most ([A-Za-z][A-Za-z0-9 '\u2019\-]{1,60}?) owners fall outside the standard care budget\. Pet deposits and monthly pet rent for renters\. Boarding or pet-sitting when you travel\. Emergency vet visits\s*[\u2014\u2013\-]\s*statistically likely at least once over a pet's lifetime\. Professional behavior training if issues arise\. Replacement of worn supplies and damaged household items\. These add up quietly over the years, so factor them into your planning\.?/g,
    variants: [
      (T) => `The costs that catch ${T} owners off guard sit outside the usual care budget. Landlord pet deposits and monthly pet rent for renters. Boarding or professional pet-sitting for every trip. Emergency vet bills, which are statistically near-certain at least once in a pet's life. Behavior training when issues surface. Ongoing replacement of worn supplies and damaged household items. None of these show up in the headline cost of ownership; all of them accumulate.`,
      (T) => `What most ${T} owners budget poorly for is everything the standard care line items leave out: landlord deposits and monthly pet rent, boarding or pet-sitting when travel happens, emergency vet visits that tend to hit once per lifetime, behavior training for the problems you did not predict, and the steady turnover of chewed gear and household casualties. Build a cushion for these specifically.`,
      (T) => `The line items that blindside ${T} owners are the ones outside the standard care budget. Pet deposits and monthly pet rent for renters can be several hundred dollars a year on their own. Boarding or pet-sitting for any trip. At least one emergency vet visit in most pets' lifetimes. Behavior training when household issues appear. Replacement of supplies and items the animal damages. Budget them explicitly.`,
      (T) => `Among ${T} owners, the most common budget surprise is the category that sits outside the obvious care costs. Pet deposits for rentals. Ongoing pet rent. Boarding during any travel. Emergency vet visits, which a majority of pets will require at some point. Behavior training if problems surface. Replacement of damaged household items. The headline cost of ownership almost never includes them.`,
      (T) => `Typical "cost of ownership" figures for a ${T} miss several real expenses. Renters face pet deposits plus monthly pet rent. Travel triggers boarding or sitter fees. Emergency vet care becomes near-certain over a pet's lifetime. Behavior training may be required for specific issues. Household items get damaged and need replacing. These items compound quietly.`,
      (T) => `Most ${T} cost surprises come from outside the standard care list. Rental pet deposits and monthly pet rent. Boarding or pet-sitting every time you travel. Emergency vet visits that, statistically, happen at least once. Professional behavior training if behavioral issues arise. Ongoing replacement of worn or damaged supplies. These add up on their own schedule.`,
      (T) => `Budget shocks for ${T} owners tend to come from what sits outside the usual care column. Pet deposits and pet rent for renters. Boarding or sitters whenever you leave town. Emergency vet bills, statistically likely at some point. Behavior training when problems emerge. Replacement of worn supplies and damaged items. Factor them in early, not after they land.`,
      (T) => `The hidden layer of ${T} ownership cost has five main parts: rental pet deposits and monthly pet rent, boarding or professional pet-sitting when you travel, at least one emergency vet visit over the animal's lifetime, behavior training if issues surface, and a steady replacement line for gear and household items. Plan for all five.`,
      (T) => `${T} owners most often miscalculate on costs that never appear in a basic care summary. Rental deposits and monthly pet rent. Boarding or sitter fees. Emergency vet visits (likely at least once in most pets' lifetimes). Behavior training for problems that emerge. Replacement of damaged gear and household items. Put each on your planning spreadsheet.`,
      (T) => `Most ${T} budget misses happen outside the obvious care totals. Pet deposits and monthly pet rent for renters. Boarding or pet-sitting during travel. Emergency vet visits that land on most pets at least once. Behavior training when issues arise. Replacement of worn equipment and household items. Each is modest alone; collectively they move the year-end number.`,
      (T) => `A ${T}'s quietly unbudgeted costs are the ones that live outside standard care: rental pet deposits, monthly pet rent, boarding, pet-sitters, emergency vet visits, behavior training, and the replacement pipeline for chewed, scratched, or damaged items. Modeling year-five totals without them produces misleading answers.`,
      (T) => `For ${T} owners, the surprise costs cluster in a predictable set of categories: rental-related pet fees, travel-triggered boarding or sitters, emergency vet visits that most pets need at least once, remedial behavior training, and steady replacement of damaged supplies and household items. Add a line for each before committing to a pet budget.`,
    ],
  },
  {
    id: 'nutrition-biggest-factors',
    regex: /Nutrition is one of the biggest factors in your ([A-Za-z][A-Za-z0-9 '\u2019\-]{1,60}?)'s long-term health\. This guide breaks down the key considerations\s*[\u2014\u2013\-]\s*from protein sources to life-stage needs\s*[\u2014\u2013\-]\s*so you can choose wisely rather than just grabbing whatever is on sale\.?/g,
    variants: [
      (T) => `Diet is one of the highest-leverage decisions you make for a ${T}. This page covers what actually matters, protein quality, life-stage fit, a few specific considerations, so the choice is deliberate rather than whatever happens to be marked down at the store.`,
      (T) => `What a ${T} eats shapes health outcomes more than most owners appreciate. The sections below cover protein sources, life-stage requirements, and common pitfalls, enough to make food selection a considered decision instead of a sale-driven one.`,
      (T) => `Diet drives a meaningful share of a ${T}'s long-term health. This guide walks through the considerations that actually move the needle, protein sources, life-stage formulation, and specific nutritional details, so shopping happens on information rather than price alone.`,
      (T) => `Food quality is one of the most consequential choices in owning a ${T}. The sections here cover what to actually look for on a label, from protein sources to life-stage-appropriate formulation, so the decision reflects your pet rather than what the store is pushing.`,
      (T) => `Nutrition does a lot of the heavy lifting in keeping a ${T} healthy long-term. This page unpacks what matters when choosing food, protein type and quality, life-stage fit, a handful of nutritional specifics, so the choice is intentional.`,
      (T) => `A ${T}'s long-term health is downstream of diet more than most other factors. This guide works through the practical decisions, protein sources, life-stage requirements, formulation details, to let you pick deliberately rather than default to whatever's cheapest.`,
      (T) => `Feeding a ${T} well pays compounding dividends. Below, the main decision criteria: protein quality, life-stage alignment, and the handful of nutritional details that actually matter, so food selection is a considered call.`,
      (T) => `What ends up in a ${T}'s bowl matters more than almost any other daily choice. The guide below covers the relevant factors, protein sources, life-stage needs, and a few specifics, so shopping is deliberate rather than reactive.`,
    ],
  },
  {
    id: 'nutritional-profile-breakdown',
    regex: /Dietary planning for ([A-Za-z][A-Za-z0-9 '\u2019\-]{1,60}?) starts with understanding this breed's ([^<]+) physique and ([^<]+) character\.?/g,
    variants: [
      (T, P1, P2) => `Any realistic feeding plan for a ${T} has to start with how this breed is actually built (${P1}) and how it typically behaves (${P2}).`,
      (T, P1, P2) => `Feeding a ${T} well begins with respecting the breed's ${P1} frame and ${P2} temperament, both of which shape what the diet needs to support.`,
      (T, P1, P2) => `Start any diet conversation about a ${T} from the physical baseline (${P1}) and behavioral baseline (${P2}); nutrition choices flow from there.`,
      (T, P1, P2) => `A useful diet plan for a ${T} works backward from the breed's ${P1} build and ${P2} personality, both drive caloric needs and ingredient priorities.`,
      (T, P1, P2) => `Understanding the ${T} as a ${P1}-framed, ${P2} breed is the right starting point for any feeding decision, size and temperament do most of the work in setting nutritional targets.`,
      (T, P1, P2) => `Good ${T} nutrition planning opens with the structural facts: a ${P1} body and a ${P2} disposition both influence what the food has to provide.`,
      (T, P1, P2) => `Feeding planning for a ${T} rests on two easy-to-observe inputs, the ${P1} build and the ${P2} behavioral profile, both translate directly into calorie and macronutrient choices.`,
      (T, P1, P2) => `Begin any ${T} feeding conversation with the basics of the breed: a ${P1} physique and a ${P2} character. Those two facts shape almost every diet decision that follows.`,
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
      // args[0] = match, args[1..n] = captures, args[last] = string
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
  let i = 0;
  for (const f of files) {
    processFile(f, stats);
    if (++i % 2000 === 0) process.stderr.write(`processed ${i}/${files.length}\n`);
  }

  console.log(JSON.stringify({
    filesScanned: files.length,
    filesChanged: stats.filesChanged,
    hits: stats.hits,
  }, null, 2));
}

main();
