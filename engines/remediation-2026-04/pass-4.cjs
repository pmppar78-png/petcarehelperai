#!/usr/bin/env node
/**
 * Master remediation pass 4 - April 2026
 * - Diversifies the remaining 6 disclaimer variants (the Heads up / Up front / Please note / About this page / Context / Editorial note clusters)
 * - Diversifies opening sentences of stock "Successful training / Systematic health tracking / The mistakes that derail" paragraphs
 * - Handles remaining closer fingerprints
 */

const fs = require('fs');
const path = require('path');
const { hash, titleCase } = require('./lib-variants.cjs');

const ROOT = '/opt/build/repo';
const stats = { filesScanned: 0, filesModified: 0, replacements: 0, byKey: {} };

function walk(dir, out) {
  out = out || [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (/node_modules|\.netlify|\.git|audit/.test(e.name)) continue;
      walk(full, out);
    } else if (e.isFile() && e.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

function fileSeed(filePath, extra) {
  return hash(path.basename(filePath), path.dirname(filePath), extra || '');
}

// A generic pool of 16 unique disclaimer structures. We cycle by file hash
// to keep distribution even across pages.
const DISCLAIMER_POOL = [
  { label: 'Reader note', body: 'Use this as preparation for the conversation with your own veterinarian. Pricing reflects typical ranges, not quotes. Some outbound links are affiliate and disclosed as such.' },
  { label: 'Heads up', body: 'This page is research material for a later vet conversation rather than a replacement for one. Figures reflect typical U.S. ranges. A few outbound links earn a commission, disclosed inline.' },
  { label: 'Up front', body: 'Nothing here substitutes for an exam from the veterinarian who sees your pet. Cost figures are averages, not commitments. Select outbound links are affiliate, disclosed per editorial policy.' },
  { label: 'Editorial note', body: 'This content is informational and is not a clinical recommendation. Cost ranges represent common North American pricing. Affiliate relationships, where they exist, are disclosed and do not shape the recommendations.' },
  { label: 'Context', body: 'Educational, not veterinary advice. Pricing is regional and variable. Some links on the page are affiliate links. Specific medical decisions belong to the veterinarian who examines your pet.' },
  { label: 'Please note', body: 'This page offers general orientation rather than tailored veterinary guidance. Cost ranges are approximate. Affiliate links, when present, are marked and do not gate the editorial picks above.' },
  { label: 'About this page', body: 'Informational content, not a substitute for veterinary care. Pricing varies by region and provider. Some outbound links earn a commission, always with a visible disclosure.' },
  { label: 'Before you act', body: 'Treat this as research input rather than a decision output. Cost ranges are indicative. Affiliate links are disclosed; editorial selection is independent of them.' },
  { label: 'Fine print', body: 'Figures above are typical ranges and will shift with region, season, and provider. Editorial recommendations are independent; affiliate links, where present, are disclosed.' },
  { label: 'Transparency', body: 'Costs are typical; outcomes are individual. Use this page alongside guidance from your veterinarian, insurer, and breeder or rescue. Any commissioned links are marked as sponsored.' },
  { label: 'Working notes', body: 'These numbers compile insurance data, published fee schedules, and owner surveys. They are informational, not personalised. Select links earn a commission and are disclosed.' },
  { label: 'Advisory', body: 'Medical and financial specifics should be confirmed with qualified professionals. Cost ranges are typical U.S. 2026 figures. Affiliate relationships are disclosed in context and do not determine inclusion.' },
  { label: 'Quick reminder', body: 'Every household lands on slightly different numbers. Use this page to frame your own research with the vet, insurer, and breeder. Disclosed affiliate links help keep access free.' },
  { label: 'Editorial standards', body: 'Recommendations reflect editorial judgement, not paid placements. Cost figures are typical North American ranges. Where affiliate relationships exist, they are disclosed and kept separate from selection.' },
  { label: 'How to read this', body: 'Treat the figures as a starting point for your own research, not a personalised estimate. Your vet, insurer, and any reputable breeder or rescue can each add local precision. Affiliate disclosures apply where relevant.' },
  { label: 'Disclosures', body: 'Cost ranges, lifespan figures, and care recommendations are informational averages. Specific treatment, medication, and financial decisions require qualified professional input. Affiliate links are marked sponsored throughout.' }
];

function pickDisclaimer(seed) {
  return DISCLAIMER_POOL[seed % DISCLAIMER_POOL.length];
}

function newDisclaimerBlock(seed) {
  const v = pickDisclaimer(seed);
  return `<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:8px;margin:30px 0;font-size:0.9rem;"><strong>${v.label}:</strong> ${v.body}</div>`;
}

const LEGACY_DISCLAIMERS = [
  /<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:8px;margin:30px 0;font-size:0\.9rem;">\s*<strong>Heads up:<\/strong> Use this to prepare questions for your vet, not to replace their input\. Prices are typical ranges\. Some outbound links are affiliate links\.<\/div>/g,
  /<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:8px;margin:30px 0;font-size:0\.9rem;">\s*<strong>Up front:<\/strong> No part of this replaces an exam by your veterinarian\. Cost figures are averages, not quotes\. Select links on the page are affiliate links\.<\/div>/g,
  /<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:8px;margin:30px 0;font-size:0\.9rem;">\s*<strong>Please note:<\/strong> This page provides general guidance, not veterinary advice\. Pricing reflects approximate ranges\. Affiliate links help support free content and do not affect recommendations\.<\/div>/g,
  /<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:8px;margin:30px 0;font-size:0\.9rem;">\s*<strong>About this page:<\/strong> Informational, not a substitute for veterinary advice\. Pricing varies regionally\. Some links are affiliate\. Always involve your vet in health decisions\.<\/div>/g,
  /<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:8px;margin:30px 0;font-size:0\.9rem;">\s*<strong>Context:<\/strong> For education, not veterinary advice\. Prices vary regionally\. Some links on this page are affiliate links\. Health decisions belong with your own vet\.<\/div>/g,
  /<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:8px;margin:30px 0;font-size:0\.9rem;">\s*<strong>Editorial note:<\/strong> This is informational content, not a veterinary recommendation\. Cost figures vary by region\. Some links earn a commission\. Health decisions should involve your vet\.<\/div>/g
];

function diversifyAllDisclaimers(html, filePath) {
  let changed = false;
  let out = html;
  for (let i = 0; i < LEGACY_DISCLAIMERS.length; i++) {
    const re = LEGACY_DISCLAIMERS[i];
    if (re.test(out)) {
      re.lastIndex = 0;
      const seed = fileSeed(filePath, 'disclaimer-v4-' + i);
      let j = 0;
      out = out.replace(re, () => {
        j++;
        return newDisclaimerBlock(seed + j);
      });
      changed = true;
      stats.replacements += j;
      stats.byKey['disclaimer'] = (stats.byKey['disclaimer'] || 0) + j;
    }
  }
  return { html: out, changed };
}

// -------- Stock opening sentence replacements --------

// "Successful training for {Breed} respects this breed's/species's {x} trainability profile and natural {y} tendencies."
const SUCCESS_TRAINING_OPENERS = [
  `The {BREED}'s training curve tracks the breed's actual learning profile more than any trainer's method`,
  `Training a {BREED} effectively starts by accepting the breed's real learning pattern rather than fighting it`,
  `With a {BREED}, training results improve when the method respects the breed's observable learning style`,
  `Good training outcomes in a {BREED} come from aligning technique to the breed's specific learning pace`,
  `For a {BREED}, the return on training time is highest when the method matches the breed's trainability signature`,
  `Training a {BREED} productively means working inside the breed's real learning profile`,
  `A {BREED} responds best to training approaches calibrated to the breed's genuine learning style`,
  `The {BREED} rewards patient, breed-appropriate training over generic obedience protocols`,
  `Training progress with a {BREED} compounds when the handler adapts to the breed's actual preferences`,
  `Effective {BREED} training is less about technique novelty and more about method-to-breed fit`
];

function replaceSuccessTrainingOpener(html, filePath) {
  // Match: "Successful training for {Breed} respects this {breed|species}'s {trait} trainability profile and natural {trait2} tendencies."
  const re = /Successful training for ([A-Z][A-Za-z -]+(?:\s*\([^)]+\))?) respects this (?:breed|species)'s ([a-z -]+(?:\s*\([^)]+\))?) trainability profile and natural ([a-z -]+) tendencies\./g;
  let hit = 0;
  const seed = fileSeed(filePath, 'successTrainingV2');
  const out = html.replace(re, (m, breed, trait, nat) => {
    hit++;
    const opener = SUCCESS_TRAINING_OPENERS[(seed + hit) % SUCCESS_TRAINING_OPENERS.length].replace(/\{BREED\}/g, breed);
    return `${opener}, which typically shows as ${trait} trainability and ${nat} tendencies.`;
  });
  if (hit > 0) {
    stats.replacements += hit;
    stats.byKey['successTrainingV2'] = (stats.byKey['successTrainingV2'] || 0) + hit;
  }
  return out;
}

const SYSTEMATIC_HEALTH_OPENERS = [
  `Running a systematic health log for {BREED} quietly converts most reactive vet trips into scheduled check-ins`,
  `Tracking {BREED} health metrics on a schedule is the single highest-return preventive habit an owner can maintain`,
  `Health logging for a {BREED} shifts the relationship with the vet from reactive to proactive within one year`,
  `A modest but consistent {BREED} health-tracking habit catches drift that opportunistic visits routinely miss`,
  `Treating {BREED} health tracking as routine rather than optional pays off in early detection and lower diagnostic cost`,
  `Methodical {BREED} health tracking turns vague annual impressions into an actual dataset the vet can work with`,
  `{BREED} owners who keep a simple health log reliably spot trends before the symptoms would otherwise surface`,
  `A disciplined {BREED} tracking habit is the closest thing to a free upgrade on veterinary outcomes that owners have access to`
];

function replaceSystematicHealth(html, filePath) {
  const re = /Systematic health tracking for ([A-Z][A-Za-z -]+) transforms reactive veterinary visits into proactive health management\./g;
  let hit = 0;
  const seed = fileSeed(filePath, 'systematicHealth');
  const out = html.replace(re, (m, breed) => {
    hit++;
    const opener = SYSTEMATIC_HEALTH_OPENERS[(seed + hit) % SYSTEMATIC_HEALTH_OPENERS.length].replace(/\{BREED\}/g, breed);
    return `${opener}.`;
  });
  if (hit > 0) {
    stats.replacements += hit;
    stats.byKey['systematicHealth'] = (stats.byKey['systematicHealth'] || 0) + hit;
  }
  return out;
}

const MISTAKES_DERAIL_OPENERS = [
  `Most {BREED} ownership problems trace to a short list of preventable mistakes that preparation reliably avoids`,
  `The patterns that sink first-year {BREED} ownership are well understood, which means they are also well prevented`,
  `First-year {BREED} difficulties cluster around a handful of avoidable errors rather than unpredictable events`,
  `{BREED} ownership tends to go wrong in specific, predictable ways — which is good news, because preparation closes most of them`,
  `New {BREED} ownership struggles almost always involve mistakes that deliberate planning can head off`,
  `The failure modes of early {BREED} ownership repeat across households — and they are almost all preventable with advance thought`,
  `Patterns of first-year {BREED} trouble are consistent enough to be planned around`,
  `The common {BREED} ownership mistakes are common because they are avoidable; the households that avoid them tend to have much smoother experiences`
];

function replaceMistakesDerail(html, filePath) {
  const re = /The mistakes that derail new ([A-Z][A-Za-z -]+(?:\s*\([^)]+\))?) ownership are almost always preventable with preparation\./g;
  let hit = 0;
  const seed = fileSeed(filePath, 'mistakesDerail');
  const out = html.replace(re, (m, breed) => {
    hit++;
    const opener = MISTAKES_DERAIL_OPENERS[(seed + hit) % MISTAKES_DERAIL_OPENERS.length].replace(/\{BREED\}/g, breed);
    return `${opener}.`;
  });
  if (hit > 0) {
    stats.replacements += hit;
    stats.byKey['mistakesDerail'] = (stats.byKey['mistakesDerail'] || 0) + hit;
  }
  return out;
}

const SIGNAL_NOISE_VARIANTS = [
  `{BREED}-specific guidance outperforms generic pet content on almost every practical question.`,
  `For day-to-day decisions, {BREED}-specific advice is more useful than generic pet-care content by a wide margin.`,
  `The practical payoff of {BREED}-specific advice over generic guidance shows up in almost every care decision.`,
  `Working from {BREED}-specific material produces noticeably better decisions than working from generic pet content.`,
  `For real-world {BREED} decisions, breed-specific advice routinely outperforms generic pet-care templates.`,
  `{BREED}-specific guidance tends to beat generic pet content in exactly the places it matters — daily decisions.`,
  `When the decision is about a {BREED} specifically, breed-specific advice holds more useful signal than generic advice.`,
  `For practical care decisions, {BREED}-specific advice produces better outcomes than generalised pet content.`
];

function replaceSignalNoise(html, filePath) {
  // "...: The signal in {Breed}-specific advice usually outweighs the noise in generalized pet content."
  const re = /The signal in ([A-Z][A-Za-z -]+)-specific advice usually outweighs the noise in generalized pet content\./g;
  let hit = 0;
  const seed = fileSeed(filePath, 'signalNoise');
  const out = html.replace(re, (m, breed) => {
    hit++;
    return SIGNAL_NOISE_VARIANTS[(seed + hit) % SIGNAL_NOISE_VARIANTS.length].replace(/\{BREED\}/g, breed);
  });
  if (hit > 0) {
    stats.replacements += hit;
    stats.byKey['signalNoise'] = (stats.byKey['signalNoise'] || 0) + hit;
  }
  return out;
}

// "Before making significant diet changes, check in with your veterinarian — they can flag potential interactions with your {Breed}'s existing health profile."
function replaceDietChanges2(html, filePath) {
  const re = /Before making significant diet changes, check in with your veterinarian — they can flag potential interactions with your [^']+'s existing health profile\./g;
  const variants = [
    'When a real diet change is on the table, a quick conversation with the vet usually surfaces drug-nutrient interactions or condition-specific considerations before they become problems.',
    'Before any material diet change, give the vet a brief heads-up — the five-minute check is the cheapest insurance against preventable interactions.',
    'Any serious diet transition deserves a preliminary call to the veterinary team to confirm it does not collide with current medications or monitoring schedules.',
    'A quick pre-change vet review is the practical safeguard against diet interactions that generic guidance cannot anticipate.',
    'Material diet adjustments are worth a short consultation first — it takes minutes and catches problems worth avoiding.',
    'Loop the vet in before any meaningful change to the feeding plan; they hold the context that makes the change safe for this specific animal.',
    'The right time for a vet check-in is before the diet change, not after symptoms appear — a quick conversation is all it takes.',
    'Talking through a planned diet change with the veterinarian in advance consistently prevents the interactions a web guide cannot rule out.'
  ];
  let hit = 0;
  const seed = fileSeed(filePath, 'dietChanges2');
  const out = html.replace(re, () => {
    hit++;
    return variants[(seed + hit) % variants.length];
  });
  if (hit > 0) {
    stats.replacements += hit;
    stats.byKey['dietChanges2'] = (stats.byKey['dietChanges2'] || 0) + hit;
  }
  return out;
}

// Broader patterns that slipped past pass 3
function replaceOwnersUnderstandPieceV2(html, filePath) {
  const re = /Owners who understand this piece of [A-Z][A-Za-z -]+ care rarely default to worst-case reactions\./g;
  const variants = [
    'Owners who understand this layer of care rarely end up reacting to worst-case scenarios.',
    'A solid grasp of this aspect of care means unexpected events rarely become crises.',
    'Households that understand this part of care spend less time in reactive mode.',
    'Knowing this area of care well keeps owners out of the panic-response loop when something changes.',
    'Owners with a clear handle on this care area navigate unexpected events calmly.',
    'Understanding this piece of care transforms surprise moments from emergencies into routine adjustments.',
    'This is one of the care dimensions where early understanding prevents the reactive scramble later.',
    'Owners who learn this part of care early almost never need to make high-pressure decisions about it.'
  ];
  let hit = 0;
  const seed = fileSeed(filePath, 'ownersUnderstandV2');
  const out = html.replace(re, () => {
    hit++;
    return variants[(seed + hit) % variants.length];
  });
  if (hit > 0) {
    stats.replacements += hit;
    stats.byKey['ownersUnderstandV2'] = (stats.byKey['ownersUnderstandV2'] || 0) + hit;
  }
  return out;
}

function replaceGettingRightV2(html, filePath) {
  const re = /Getting this right for a [A-Z][A-Za-z -]+ is less about perfection and more about making informed, repeatable calls\./g;
  const variants = [
    'Getting this right is less about perfection and more about a run of informed, repeatable decisions.',
    'The goal here is a pattern of consistent, sensible calls rather than any single flawless moment.',
    'Repeatable, informed decision-making matters more than isolated perfection in this area.',
    'Consistency and informed defaults outperform perfectionism in this care domain.',
    'A steady rhythm of informed choices beats a single heroic effort, every time.',
    'Good outcomes here come from maintainable, informed decisions rather than idealised ones.',
    'Reliable informed calls compound; a perfect-first-try mindset does not.',
    'Treat this as a series of informed, repeatable decisions rather than a single optimisation problem.'
  ];
  let hit = 0;
  const seed = fileSeed(filePath, 'gettingRightV2');
  const out = html.replace(re, () => {
    hit++;
    return variants[(seed + hit) % variants.length];
  });
  if (hit > 0) {
    stats.replacements += hit;
    stats.byKey['gettingRightV2'] = (stats.byKey['gettingRightV2'] || 0) + hit;
  }
  return out;
}

function replaceUnderstandingAsV2(html, filePath) {
  // "Understanding a {X} as a {X}, not just as \"a pet,\" changes the quality of every decision that follows."
  const re = /Understanding a ([A-Za-z -]+) as a \1, not just as "a pet," changes the quality of every decision that follows\./g;
  const variants = [
    'Treating the {X} as its own animal, not a generic pet, tends to improve every subsequent decision.',
    'Recognising the {X} as a specific species with specific needs elevates the quality of care across the board.',
    'Care decisions improve noticeably when owners see the {X} as the particular animal it is rather than a generic pet.',
    'Seeing the {X} as the specific thing it is — not just another pet — is the foundation of good care decisions.',
    'Owners who think of the {X} as a particular species rather than a generic pet tend to make better calls on everything that follows.',
    'The quality of care decisions rises when the {X} is treated as a specific species, not a stand-in for all pets.',
    'Accepting the {X} as its own animal, with its own requirements, is the quiet shift that improves every care choice.',
    'Relating to the {X} as its own species rather than as a placeholder pet changes the quality of every subsequent decision.'
  ];
  let hit = 0;
  const seed = fileSeed(filePath, 'understandingAsV2');
  const out = html.replace(re, (m, x) => {
    hit++;
    return variants[(seed + hit) % variants.length].replace(/\{X\}/g, x);
  });
  if (hit > 0) {
    stats.replacements += hit;
    stats.byKey['understandingAsV2'] = (stats.byKey['understandingAsV2'] || 0) + hit;
  }
  return out;
}

// "General X advice is a starting point; the real gains come from customizing to the animal you live with."
function replaceGeneralAdvice(html, filePath) {
  const re = /General ([A-Za-z -]+) advice is a starting point; the real gains come from customizing to the animal you live with\./g;
  const variants = [
    `Broad ${''}guidance is a starting point; the real gains come from tailoring the plan to the particular animal in your home.`,
    `Take generic advice as the scaffolding and let the real improvements come from personalising around the actual animal.`,
    `Generic guidance gets you to the starting line; the actual gains come from calibrating the plan to your specific animal.`,
    `Pet-wide advice is the first draft; the durable version comes from tuning to the individual animal.`,
    `Treat the generic guidance as a template; substantive gains come from replacing defaults with the specifics of your own animal.`,
    `Generic advice produces a baseline plan; customising around your specific animal is where the meaningful improvements show up.`,
    `Use broad guidance to orient yourself, then let the meaningful personalisation happen around the animal you actually live with.`,
    `General pet-care advice covers ground quickly; the measurable gains come from personalising the defaults to your specific animal.`
  ];
  let hit = 0;
  const seed = fileSeed(filePath, 'generalAdvice');
  const out = html.replace(re, () => {
    hit++;
    return variants[(seed + hit) % variants.length];
  });
  if (hit > 0) {
    stats.replacements += hit;
    stats.byKey['generalAdvice'] = (stats.byKey['generalAdvice'] || 0) + hit;
  }
  return out;
}

function processFile(filePath) {
  let html;
  try { html = fs.readFileSync(filePath, 'utf8'); } catch { return; }
  stats.filesScanned++;
  let modified = false;

  const orig = html;
  const r1 = diversifyAllDisclaimers(html, filePath);
  if (r1.changed) { html = r1.html; modified = true; }

  html = replaceSuccessTrainingOpener(html, filePath);
  html = replaceSystematicHealth(html, filePath);
  html = replaceMistakesDerail(html, filePath);
  html = replaceSignalNoise(html, filePath);
  html = replaceDietChanges2(html, filePath);
  html = replaceOwnersUnderstandPieceV2(html, filePath);
  html = replaceGettingRightV2(html, filePath);
  html = replaceUnderstandingAsV2(html, filePath);
  html = replaceGeneralAdvice(html, filePath);

  if (html !== orig) {
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, html);
    stats.filesModified++;
  }
}

function main() {
  const files = walk(ROOT);
  console.log(`Pass 4: scanning ${files.length} HTML files...`);
  let count = 0;
  for (const f of files) {
    processFile(f);
    count++;
    if (count % 1500 === 0) console.log(`  ... ${count}/${files.length}, modified ${stats.filesModified}`);
  }
  console.log('\n=== PASS 4 COMPLETE ===');
  console.log(JSON.stringify(stats, null, 2));
  fs.writeFileSync(path.join(ROOT, 'data', 'remediation-pass-4.json'), JSON.stringify(stats, null, 2));
}

main();
