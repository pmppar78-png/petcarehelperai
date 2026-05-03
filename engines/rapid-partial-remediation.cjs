#!/usr/bin/env node
/*
 * Rapid partial remediation for the highest-impact commercial-page issues:
 * species-mismatched dog/crate language and a repeated training paragraph.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COMMERCIAL = path.join(ROOT, 'commercial');

const species = {
  cats: {
    first: 'first cat',
    habitatList: 'litter boxes, scratchers, resting areas, and living space',
    habitatTitle: 'Indoor Space & Setup Measurements',
    habitatShort: 'litter setup + room for enrichment',
    setupNoun: 'litter and resting setup',
    trainingParagraph: 'First-time cat owners usually benefit from a short behavior consult or reputable feline training course rather than trial-and-error alone. The useful feedback is practical: reading body language, timing rewards, planning scratching outlets, and setting up introductions without forcing social contact. The cost is typically modest compared with repairing stress-related behavior later.',
    trainingFollowup: 'Handling and routine work fade when they stop at the basics; owners get better results when they keep reinforcing calm handling, carrier comfort, and predictable daily cues.',
    habitatDefault: 'Cats do best when the primary indoor environment is predictable: litter access, scratching surfaces, resting areas, vertical options, and escape-free windows matter more than raw square footage. Outdoor exposure should be handled cautiously and only with secure containment.',
  },
  birds: {
    first: 'first bird',
    habitatList: 'cages, perches, supervised out-of-cage space, and enrichment',
    habitatTitle: 'Cage & Room Setup Measurements',
    habitatShort: 'cage + room for enrichment',
    setupNoun: 'cage setup',
    trainingParagraph: 'First-time bird owners usually benefit from avian behavior guidance rather than self-directed training alone. The useful feedback is practical: safe handling, step-up practice, reading stress signals, managing vocalization, and building trust without flooding the bird. A short consult or reputable avian training course often prevents the mistakes that become expensive later.',
    trainingFollowup: 'Training that stops at one or two handling cues fades; short follow-up sessions help the bird retain trust, recall, and cooperative-care skills.',
    habitatDefault: 'Birds do best when the cage setup is stable and daily enrichment is planned around safe flight, perching, light exposure, and supervised out-of-cage time. Outdoor exposure should be treated cautiously because escape risk, predators, heat, and fumes can become serious quickly.',
  },
  fish: {
    first: 'first aquarium species',
    habitatList: 'tank volume, filtration, aquascaping, and maintenance access',
    habitatTitle: 'Tank & Setup Measurements',
    habitatShort: 'tank + room for equipment',
    setupNoun: 'tank setup',
    trainingParagraph: 'First-time aquarium keepers usually benefit more from a tank-planning checklist than from generic pet training advice. The useful feedback is practical: cycling the tank, matching filtration to bioload, testing water before adding livestock, and planning stocking order so avoidable stress does not become a health problem.',
    trainingFollowup: 'Aquarium routines only hold when they are repeated: water testing, partial changes, equipment checks, and feeding logs matter more than one-time setup effort.',
    habitatDefault: 'Fish habitat planning is about water volume, filtration, stocking density, cover, and stable parameters rather than indoor-versus-outdoor access. A controlled tank with tested water and compatible tankmates is the safe default for this species.',
  },
  'marine-fish': {
    first: 'first saltwater aquarium species',
    habitatList: 'tank volume, filtration, reef-safe layout, and maintenance access',
    habitatTitle: 'Saltwater Tank & Setup Measurements',
    habitatShort: 'tank + room for equipment',
    setupNoun: 'saltwater tank setup',
    trainingParagraph: 'First-time saltwater keepers usually benefit more from a tank-planning checklist than from generic pet training advice. The useful feedback is practical: cycling, salinity stability, filtration capacity, quarantine planning, and stocking order so avoidable stress does not become a health problem.',
    trainingFollowup: 'Saltwater routines only hold when they are repeated: water testing, partial changes, salinity checks, equipment inspection, and feeding logs matter more than one-time setup effort.',
    habitatDefault: 'Saltwater habitat planning is about tank volume, salinity stability, filtration, flow, reef-safe layout, and compatible stocking rather than indoor-versus-outdoor access. A controlled aquarium with tested water is the safe default for this species.',
  },
  reptiles: {
    first: 'first reptile',
    habitatList: 'enclosure size, heat gradients, hides, substrate, and lighting',
    habitatTitle: 'Enclosure & Setup Measurements',
    habitatShort: 'enclosure + room for enrichment',
    setupNoun: 'enclosure setup',
    trainingParagraph: 'First-time reptile owners usually benefit from a husbandry review rather than generic training advice. The useful feedback is practical: temperature gradients, UVB placement, humidity, hides, feeding cadence, and safe handling. A reptile-savvy veterinarian or experienced keeper can catch setup mistakes before they become medical problems.',
    trainingFollowup: 'Handling routines fade when they stop at the basics; short follow-up sessions help maintain calm handling, enclosure checks, and cooperative care.',
    habitatDefault: "Reptile habitat planning is about enclosure security, heat gradients, UVB exposure, humidity, hides, and safe handling. Outdoor exposure is optional and species-dependent; the primary enclosure should be able to meet the animal's needs without relying on weather.",
  },
  amphibians: {
    first: 'first amphibian',
    habitatList: 'habitat size, humidity, substrate, water quality, and hides',
    habitatTitle: 'Habitat & Setup Measurements',
    habitatShort: 'habitat + room for equipment',
    setupNoun: 'habitat setup',
    trainingParagraph: 'First-time amphibian keepers usually benefit from a husbandry review rather than generic training advice. The useful feedback is practical: humidity, water quality, substrate, hides, temperature stability, and low-stress maintenance. An exotic veterinarian or experienced keeper can catch setup mistakes before they become medical problems.',
    trainingFollowup: 'Care routines only hold when they are repeated: water checks, humidity checks, feeding logs, and low-stress handling matter more than one-time setup effort.',
    habitatDefault: 'Amphibian habitat planning is about humidity, water quality, substrate safety, hides, and stable temperatures. Outdoor exposure is rarely useful for routine care because contamination, dehydration, overheating, and escape risk can escalate quickly.',
  },
  'small-animals': {
    first: 'first small pet',
    habitatList: 'cages or enclosures, bedding, exercise space, and enrichment',
    habitatTitle: 'Cage, Enclosure & Space Measurements',
    habitatShort: 'cage or enclosure + room for enrichment',
    setupNoun: 'cage or enclosure setup',
    trainingParagraph: 'First-time small-pet owners usually benefit from species-specific handling guidance rather than generic dog training advice. The useful feedback is practical: safe handling, enclosure setup, litter or substrate management where relevant, enrichment rotation, and recognizing stress signals before they become health concerns.',
    trainingFollowup: 'Handling routines fade when they stop at the basics; short follow-up sessions help maintain trust, carrier comfort, and cooperative care.',
    habitatDefault: 'Small-pet habitat planning is about enclosure size, bedding or substrate, ventilation, safe exercise space, and enrichment rotation. Outdoor access should be limited to secure, supervised conditions that match the species and weather.',
  },
};

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function applyCommon(html, cfg) {
  return html
    .replace(/realistic first dog/g, `realistic ${cfg.first}`)
    .replace(/crates, beds, and living space/g, cfg.habitatList)
    .replace(/Crate, Bed &amp; Floorspace Numbers/g, cfg.habitatTitle)
    .replace(/Crate &amp; Space Size/g, cfg.habitatTitle)
    .replace(/Crate & Space Size/g, cfg.habitatTitle)
    .replace(/crate \+ room for enrichment/g, cfg.habitatShort)
    .replace(/properly sized crate/g, `properly sized ${cfg.setupNoun}`)
    .replace(/Set up the crate/g, `Set up the ${cfg.setupNoun}`)
    .replace(/Crate and setup/g, `${cap(cfg.setupNoun)} and supplies`)
    .replace(/Crate maintenance/g, `${cap(cfg.setupNoun)} maintenance`)
    .replace(/puppies carry/g, cfg.first.includes('cat') ? 'kittens carry' : 'juvenile animals carry')
    .replace(/puppy or kitten year/g, cfg.first.includes('cat') ? 'kitten year' : 'juvenile year')
    .replace(/social exposure to other dogs/g, 'controlled exposure to normal household situations')
    .replace(/basic obedience/g, 'basic handling routines')
    .replace(/dog walker or exercise companion/g, 'backup care provider')
    .replace(/outdoor exercise/g, 'structured activity')
    .replace(/outdoor access/g, 'appropriate enrichment')
    .replace(/daily outdoor exercise/g, 'daily species-appropriate enrichment')
    .replace(/appropriate enrichment and appropriate enrichment/g, 'stable conditions and species-appropriate enrichment');
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function replaceTrainingParagraph(html, cfg) {
  html = html.replace(
    /<p>First-time [^<]+ owners usually benefit from a structured training class rather than self-directed training\. A six-to-eight-week group obedience class, led by a qualified trainer, delivers three things that online resources rarely match:[\s\S]*?The cost is typically \$150[\u2013-]\$350, and the return is reflected in every subsequent year of handling\.<\/p>/g,
    `<p>${cfg.trainingParagraph}</p>`
  );
  html = html.replace(
    /<p>Initial training benefits from a structured follow-up class; without one, skill retention drops noticeably\. Training that stops at basic (?:obedience|handling routines) fades; training that includes at least one follow-up builds lasting handler skill\.<\/p>/g,
    `<p>${cfg.trainingFollowup}</p>`
  );
  return html;
}

function replaceOutdoorHabitatParagraph(html, cfg) {
  return html.replace(
    /<p>The indoor versus outdoor question for [^<]+? depends on climate, safety, and this [^<]+? specific environmental tolerances\.[\s\S]*?provides the best balance of safety and stimulation\.<\/p>/g,
    `<p>${cfg.habitatDefault}</p>`
  );
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function varySectionOrder(html, rel) {
  const h = hashStr(rel);
  if (rel.endsWith('/first-time-owners.html') && h % 3 === 0) {
    const card = html.match(/\n\s*<div class="breed-stats-card">\s*[\s\S]*?<h2>(?:Day-One Essentials|Starter Essentials|The Realistic Starter Kit|What You Actually Need From Day One|First-Week Essentials|The Honest Starter List)<\/h2>[\s\S]*?<\/div>\s*\n/);
    if (card && /<h2>(?:Week-One Checklist|First-Time Owner Checklist|A Practical First-Month Checklist|The Getting-Ready Checklist|First-Time Owner Readiness Checklist|What to Have Sorted Before Pickup Day)<\/h2>/.test(html)) {
      html = html.replace(card[0], '\n');
      html = html.replace(/(\n\s*<h2>(?:Week-One Checklist|First-Time Owner Checklist|A Practical First-Month Checklist|The Getting-Ready Checklist|First-Time Owner Readiness Checklist|What to Have Sorted Before Pickup Day)<\/h2>)/, `${card[0]}$1`);
    }
  }

  if (rel.endsWith('/best-habitat-size.html') && h % 3 === 1) {
    const card = html.match(/\n\s*<div class="breed-stats-card">\s*[\s\S]*?<h2>Top [^<]+ Options<\/h2>[\s\S]*?<\/div>\s*\n/);
    const setupHeading = /(\n\s*<h2>Setup Tips<\/h2>)/;
    if (card && setupHeading.test(html)) {
      html = html.replace(card[0], '\n');
      html = html.replace(setupHeading, `${card[0]}$1`);
    }
  }

  return html;
}

const stats = {
  scanned: 0,
  changed: 0,
  bySpecies: {},
};

for (const [sp, cfg] of Object.entries(species)) {
  const files = walk(path.join(COMMERCIAL, sp));
  for (const file of files) {
    stats.scanned += 1;
    let html = fs.readFileSync(file, 'utf8');
    const original = html;
    html = applyCommon(html, cfg);
    html = replaceTrainingParagraph(html, cfg);
    html = replaceOutdoorHabitatParagraph(html, cfg);
    html = varySectionOrder(html, path.relative(ROOT, file).replace(/\\/g, '/'));
    if (html !== original) {
      fs.writeFileSync(file, html);
      stats.changed += 1;
      stats.bySpecies[sp] = (stats.bySpecies[sp] || 0) + 1;
    }
  }
}

console.log(JSON.stringify(stats, null, 2));
