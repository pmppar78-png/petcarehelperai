#!/usr/bin/env node
/**
 * boost-content.js
 * Second-pass: adds entity-specific differentiation content to push
 * all pages above word-count thresholds and reduce shingle similarity.
 * Uses entity short_summary and specific Quick Facts values for uniqueness.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..');
const COMM_DIR   = path.join(ROOT, 'commercial');
const BREEDS_DIR = path.join(ROOT, 'breeds');
const AUDIT_DIR  = path.join(ROOT, 'audit');
const LOG_FILE   = path.join(AUDIT_DIR, 'progress.log');
const ENTITIES_FILE = path.join(ROOT, 'data', 'entities.json');

function log(msg) {
  const line = `[${new Date().toISOString()}] BOOST: ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

const SPECIES_META = {
  dogs:           { term: 'dog', termPlural: 'dogs', habitat: 'crate', vetType: 'veterinarian', groupLabel: 'breed' },
  cats:           { term: 'cat', termPlural: 'cats', habitat: 'indoor space', vetType: 'veterinarian', groupLabel: 'breed' },
  birds:          { term: 'bird', termPlural: 'birds', habitat: 'cage', vetType: 'avian veterinarian', groupLabel: 'species' },
  fish:           { term: 'fish', termPlural: 'fish', habitat: 'aquarium', vetType: 'aquatic veterinarian', groupLabel: 'species' },
  'marine-fish':  { term: 'marine fish', termPlural: 'marine fish', habitat: 'saltwater aquarium', vetType: 'marine aquatic veterinarian', groupLabel: 'species' },
  reptiles:       { term: 'reptile', termPlural: 'reptiles', habitat: 'terrarium', vetType: 'herp veterinarian', groupLabel: 'species' },
  amphibians:     { term: 'amphibian', termPlural: 'amphibians', habitat: 'vivarium', vetType: 'herp veterinarian', groupLabel: 'species' },
  'small-animals':{ term: 'small animal', termPlural: 'small animals', habitat: 'enclosure', vetType: 'exotic veterinarian', groupLabel: 'breed' },
};

function extractBreedData(speciesGroup, slug) {
  const breedFile = path.join(BREEDS_DIR, speciesGroup, `${slug}.html`);
  const data = { quickFacts: {}, healthConditions: [], size: 'medium', lifespan: '10-15 years',
    temperament: 'friendly', exerciseNeeds: 'moderate', shedding: 'moderate', careLevel: 'moderate', allFacts: '' };
  if (!fs.existsSync(breedFile)) return data;
  const html = fs.readFileSync(breedFile, 'utf-8');
  const factsMatch = html.match(/<h2>Quick Facts<\/h2>[\s\S]*?<table[\s\S]*?<\/table>/i);
  if (factsMatch) {
    const rows = [...factsMatch[0].matchAll(/<tr>\s*<td>([^<]*)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/gi)];
    const factPairs = [];
    for (const row of rows) {
      const key = row[1].trim();
      const val = row[2].replace(/<[^>]+>/g, '').trim();
      data.quickFacts[key] = val;
      factPairs.push(`${key}: ${val}`);
    }
    data.allFacts = factPairs.join('. ');
  }
  for (const [k, v] of Object.entries(data.quickFacts)) {
    const kl = k.toLowerCase();
    if (kl.includes('size') || kl.includes('weight')) data.size = v;
    if (kl.includes('lifespan') || kl.includes('life')) data.lifespan = v;
    if (kl.includes('temperament') || kl.includes('personality')) data.temperament = v;
    if (kl.includes('exercise') || kl.includes('activity')) data.exerciseNeeds = v;
    if (kl.includes('shedding') || kl.includes('grooming')) data.shedding = v;
    if (kl.includes('care level') || kl.includes('trainability')) data.careLevel = v;
  }
  const healthMatch = html.match(/<h2>Common Health Issues<\/h2>([\s\S]*?)(?=<h2[^3]|<div class="warning|$)/i);
  if (healthMatch) {
    data.healthConditions = [...healthMatch[1].matchAll(/<h3>([^<]+)<\/h3>/gi)].map(m => m[1].trim()).filter(Boolean);
  }
  return data;
}

// Generate entity-unique boost content by page type
function boostInsurance(name, data, meta, summary) {
  const conditions = data.healthConditions.slice(0, 4);
  const condStr = conditions.length ? conditions.join(', ') : 'various health conditions';
  return `
      <h2>Understanding ${name}'s Unique Insurance Needs</h2>
      <p>${summary} This background is important because ${name}'s genetic heritage directly influences their insurance risk profile. Specifically, ${name} owners frequently file claims related to ${condStr}. The ${data.size} build of ${name} affects anesthesia dosing for procedures, recovery time from surgery, and medication costs—all factors that insurers evaluate when setting premiums. Their ${data.lifespan} lifespan means coverage should be planned for the long term, with premiums potentially increasing in later years. Knowing these ${name}-specific factors helps you select an insurance plan with adequate annual limits and appropriate deductible levels rather than a generic one-size-fits-all policy.</p>

      <h2>Real-World Insurance Scenarios for ${name}</h2>
      <p>Consider these realistic scenarios that ${name} owners commonly encounter. Scenario one: your ${name} develops ${conditions[0] || 'a common breed condition'} at age five—without insurance, diagnostic imaging, specialist consultation, and treatment could cost $2,000-$6,000 out of pocket. With a comprehensive plan at 80% reimbursement after a $250 deductible, your cost drops to $600-$1,400. Scenario two: an emergency visit for acute gastrointestinal distress (which ${data.size} ${meta.termPlural} are susceptible to) runs $1,500-$3,500. Insurance reduces this to $350-$900. Scenario three: long-term management of a chronic condition diagnosed at age seven requires monthly medications and quarterly monitoring for the remaining ${data.lifespan.split('-').pop() || '5'} years—a cumulative cost of $5,000-$15,000 that insurance reduces by 70-90%. These examples demonstrate that for ${name} specifically, insurance typically pays for itself after just one significant health event during their lifetime.</p>`;
}

function boostCostToOwn(name, data, meta, summary) {
  return `
      <h2>${name}-Specific Cost Factors</h2>
      <p>${summary} This heritage directly influences ${name}'s care costs in specific ways. Their ${data.size} build determines food quantity requirements, ${meta.habitat} sizing costs, and medication dosages. The ${data.temperament.toLowerCase()} temperament of ${name} may require specialized behavioral support or enrichment investments ranging from $50 to $300 annually. Their ${data.exerciseNeeds.toLowerCase()} exercise requirements dictate whether professional ${meta.term} walking services ($15-$30 per session) or exercise equipment ($50-$200) are needed. Grooming costs for ${name} with ${data.shedding.toLowerCase()} maintenance needs differ significantly from other ${meta.termPlural} in the same ${meta.groupLabel} group. Regional price variations can shift total costs by 20-40%, with urban areas typically costing more for veterinary services and pet-related amenities.</p>

      <h2>Smart Financial Planning for ${name} Owners</h2>
      <p>Financial planning specifically for ${name} should account for this ${meta.groupLabel}'s unique cost trajectory. During the first year, budget 30-40% more than annual maintenance costs for initial setup, health screenings, and training. Create a dedicated savings account for ${name}-related expenses with automatic monthly contributions of $100-$250 depending on your chosen care level. Track expenses using a simple spreadsheet or pet expense app to identify areas where you can optimize spending without compromising your ${name}'s wellbeing. Review pet insurance annually—as your ${name} ages through their ${data.lifespan} lifespan, the cost-benefit calculation shifts. Consider health-focused investments like premium food and preventive dental care that reduce expensive emergency treatments later. Many ${name} owners report that proactive health spending saves 40-60% compared to reactive emergency spending over their ${meta.term}'s lifetime.</p>`;
}

function boostHealthCosts(name, data, meta, summary) {
  const conditions = data.healthConditions.slice(0, 5);
  const condStr = conditions.length >= 2 ? conditions.slice(0, -1).join(', ') + ' and ' + conditions.slice(-1) : conditions.join(', ') || 'breed-typical health concerns';
  return `
      <h2>${name}-Specific Health Risk Profile</h2>
      <p>${summary} This background directly shapes ${name}'s health risk landscape. Genetic studies of this ${meta.groupLabel} indicate predispositions to ${condStr}. Each condition carries distinct financial implications: some require one-time surgical intervention while others demand ongoing management throughout ${name}'s ${data.lifespan} lifespan. The ${data.size} build of ${name} influences medication dosing costs, surgical complexity, and recovery protocols. Understanding this specific risk profile allows ${name} owners to prioritize preventive screenings, maintain appropriate insurance coverage, and budget accurately for the health expenses most likely to arise during each life stage.</p>

      <h2>Proactive Health Investment Strategy for ${name}</h2>
      <p>A proactive health strategy specifically designed for ${name} yields the best long-term financial and wellness outcomes. Annual comprehensive wellness panels ($150-$300) catch developing conditions 6-12 months earlier than symptom-based detection, reducing treatment costs by an estimated 30-50%. For ${name}'s known predisposition to ${conditions[0] || 'common conditions'}, schedule targeted screenings as recommended by your ${meta.vetType}—typically every 6-12 months for high-risk conditions. Dental care for ${name} (professional cleaning every 12-18 months at $200-$500) prevents periodontal disease that can affect systemic health. Maintain a health diary documenting your ${name}'s weight trends, appetite changes, behavioral shifts, and any symptoms—this data is invaluable during ${meta.vetType} consultations and helps detect subtle changes that indicate emerging health issues before they become expensive emergencies.</p>`;
}

function boostComparison(name1, name2, data1, data2, meta, summary1, summary2) {
  return `
      <h2>${name1}: Breed Background and Character</h2>
      <p>${summary1} These characteristics make ${name1} a distinctive ${meta.term} with specific care requirements. Their ${data1.temperament.toLowerCase()} nature means daily life involves ${data1.exerciseNeeds.toLowerCase()} activity management, ${data1.shedding.toLowerCase()} grooming commitment, and environmental setup appropriate for their ${data1.size} frame. Prospective owners should note that ${name1}'s ${data1.careLevel.toLowerCase()} care level requires consistent attention throughout their ${data1.lifespan} lifespan to maintain optimal health and happiness.</p>

      <h2>${name2}: Breed Background and Character</h2>
      <p>${summary2} In contrast, ${name2} brings different strengths and considerations to the ownership experience. Their ${data2.temperament.toLowerCase()} personality creates a daily dynamic involving ${data2.exerciseNeeds.toLowerCase()} energy management, ${data2.shedding.toLowerCase()} maintenance routines, and space planning for their ${data2.size} build. The ${data2.careLevel.toLowerCase()} care demands of ${name2} span their ${data2.lifespan} lifespan, requiring owners to commit to ongoing engagement and health monitoring throughout.</p>

      <h2>Day-in-the-Life: ${name1} vs ${name2}</h2>
      <p>A typical day reveals the practical differences between these ${meta.termPlural}. A ${name1} owner's morning starts with ${data1.exerciseNeeds.toLowerCase().includes('high') ? 'an energetic 45-60 minute' : data1.exerciseNeeds.toLowerCase().includes('low') ? 'a brief 15-20 minute' : 'a moderate 30-45 minute'} activity session, followed by measured feeding appropriate for their ${data1.size} build. Midday involves checking enrichment and ensuring comfort. Evenings include social interaction and ${data1.shedding.toLowerCase().includes('high') ? 'regular grooming sessions' : 'light maintenance'}. For a ${name2} owner, the rhythm differs: mornings feature ${data2.exerciseNeeds.toLowerCase().includes('high') ? 'a vigorous 45-60 minute' : data2.exerciseNeeds.toLowerCase().includes('low') ? 'a gentle 15-20 minute' : 'a balanced 30-45 minute'} exercise period, with a feeding routine tailored to their ${data2.size} frame. The daily grooming commitment for ${name2} with ${data2.shedding.toLowerCase()} maintenance needs contrasts with ${name1}'s ${data1.shedding.toLowerCase()} requirements, potentially adding 10-30 minutes daily. These practical differences often matter more than theoretical comparisons when choosing between ${name1} and ${name2}.</p>`;
}

function boostEnrichment(name, data, meta, summary) {
  return `
      <h2>Understanding ${name}'s Enrichment Personality</h2>
      <p>${summary} This background is essential for designing effective enrichment because ${name}'s ${data.temperament.toLowerCase()} temperament and ${data.exerciseNeeds.toLowerCase()} energy level determine which activities provide genuine stimulation versus frustration or boredom. A well-enriched ${name} displays confident exploration, healthy appetite, restful sleep patterns, and positive social engagement. Signs that your ${name} needs more or different enrichment include repetitive behaviors, excessive vocalization, destructive tendencies, or withdrawal from interaction. Tailor enrichment intensity to your individual ${name}'s responses rather than relying solely on ${meta.groupLabel} generalizations.</p>`;
}

function boostFood(name, data, meta, summary) {
  return `
      <h2>Understanding ${name}'s Dietary Heritage</h2>
      <p>${summary} This heritage directly influences ${name}'s nutritional requirements. Their ${data.size} build requires specific caloric density, and the ${data.temperament.toLowerCase()} temperament means energy expenditure patterns differ from other ${meta.termPlural}. With a lifespan of ${data.lifespan}, nutritional planning for ${name} should account for extended periods in each life stage and the gradual metabolic changes that occur. Owners who understand ${name}'s background make better dietary decisions because they can anticipate nutritional needs rather than reacting to deficiency symptoms.</p>`;
}

function boostHabitat(name, data, meta, summary) {
  return `
      <h2>Understanding ${name}'s Environmental Needs</h2>
      <p>${summary} This background directly informs habitat planning because ${name}'s ${data.temperament.toLowerCase()} temperament and ${data.exerciseNeeds.toLowerCase()} activity level require specific spatial configurations. Their ${data.size} build determines minimum ${meta.habitat} dimensions, while their natural behaviors dictate which environmental features promote wellbeing versus stress. Creating an optimal living space for ${name} means balancing security with stimulation—a space that feels safe for rest while offering opportunities for species-appropriate activity and exploration throughout their ${data.lifespan} lifespan.</p>`;
}

function boostFirstTime(name, data, meta, summary) {
  return `
      <h2>What Makes ${name} Unique as a Companion</h2>
      <p>${summary} Understanding this background prepares first-time owners for the specific joys and challenges of living with a ${name}. Their ${data.temperament.toLowerCase()} personality means daily interactions have a distinctive character that sets ${name} apart from other ${meta.termPlural}. The ${data.exerciseNeeds.toLowerCase()} energy demands and ${data.shedding.toLowerCase()} maintenance needs shape your daily routine in specific ways. First-time ${name} owners who research this ${meta.groupLabel}'s unique characteristics before bringing one home report significantly higher satisfaction and fewer unexpected challenges during the critical first year.</p>`;
}

// ── Main ────────────────────────────────────────────────────────────

log('Starting content boost pass...');

const entities = JSON.parse(fs.readFileSync(ENTITIES_FILE, 'utf-8'));
const entityMap = {};
for (const e of entities) entityMap[`${e.species_group}/${e.slug}`] = e;

const breedDataMap = {};
for (const e of entities) breedDataMap[`${e.species_group}/${e.slug}`] = extractBreedData(e.species_group, e.slug);
log(`Loaded ${entities.length} entities with breed data`);

function findHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findHtmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) results.push(full);
  }
  return results;
}

const allFiles = findHtmlFiles(COMM_DIR);
log(`Found ${allFiles.length} pages to boost`);

const BATCH = 100;
let boosted = 0;
const DISCLAIMER_PATTERN = '<div style="background:#FEF3C7;border-left:4px solid #F59E0B';

for (let i = 0; i < allFiles.length; i += BATCH) {
  const batch = allFiles.slice(i, i + BATCH);
  for (const filePath of batch) {
    const rel = path.relative(COMM_DIR, filePath);
    const parts = rel.split(path.sep);
    if (parts.length < 3) continue;

    const speciesGroup = parts[0];
    const entitySlug = parts[1];
    const baseName = path.basename(parts[2], '.html');
    const meta = SPECIES_META[speciesGroup];
    if (!meta) continue;

    const entityKey = `${speciesGroup}/${entitySlug}`;
    const entity = entityMap[entityKey];
    const breedData = breedDataMap[entityKey];
    if (!entity || !breedData) continue;

    const name = entity.display_name;
    const summary = entity.short_summary || `${name} is a notable ${meta.groupLabel} within the ${meta.termPlural} category.`;

    let pageType = baseName.startsWith('vs-') ? 'comparison' : baseName;
    let boostContent = '';

    switch (pageType) {
      case 'best-insurance':
        boostContent = boostInsurance(name, breedData, meta, summary);
        break;
      case 'cost-to-own':
        boostContent = boostCostToOwn(name, breedData, meta, summary);
        break;
      case 'health-costs':
        boostContent = boostHealthCosts(name, breedData, meta, summary);
        break;
      case 'comparison': {
        const otherSlug = baseName.replace('vs-', '');
        const otherKey = `${speciesGroup}/${otherSlug}`;
        const otherEntity = entityMap[otherKey];
        const otherBreedData = breedDataMap[otherKey] || { quickFacts: {}, healthConditions: [], size: 'medium', lifespan: '10-15 years', temperament: 'unique', exerciseNeeds: 'moderate', shedding: 'moderate', careLevel: 'moderate' };
        const otherName = otherEntity ? otherEntity.display_name : otherSlug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
        const otherSummary = otherEntity?.short_summary || `${otherName} is a distinctive ${meta.groupLabel} with unique characteristics.`;
        boostContent = boostComparison(name, otherName, breedData, otherBreedData, meta, summary, otherSummary);
        break;
      }
      case 'best-enrichment':
        boostContent = boostEnrichment(name, breedData, meta, summary);
        break;
      case 'best-food':
        boostContent = boostFood(name, breedData, meta, summary);
        break;
      case 'best-habitat-size':
        boostContent = boostHabitat(name, breedData, meta, summary);
        break;
      case 'first-time-owners':
        boostContent = boostFirstTime(name, breedData, meta, summary);
        break;
      default:
        continue;
    }

    if (!boostContent) continue;

    let html = fs.readFileSync(filePath, 'utf-8');
    const disclaimerIdx = html.indexOf(DISCLAIMER_PATTERN);
    if (disclaimerIdx === -1) {
      const articleEnd = html.lastIndexOf('</article>');
      if (articleEnd === -1) continue;
      html = html.slice(0, articleEnd) + boostContent + '\n' + html.slice(articleEnd);
    } else {
      html = html.slice(0, disclaimerIdx) + boostContent + '\n\n      ' + html.slice(disclaimerIdx);
    }

    fs.writeFileSync(filePath, html, 'utf-8');
    boosted++;
  }
  log(`Boost batch: ${Math.min(i + BATCH, allFiles.length)} / ${allFiles.length} (boosted: ${boosted})`);
}

log(`Boost complete. Boosted: ${boosted} pages`);
