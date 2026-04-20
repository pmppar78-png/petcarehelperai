#!/usr/bin/env node
/**
 * Master remediation pass 1 - April 2026
 * Targets identified fingerprints and orphan thin sections across the site.
 *
 * Safe: edits within existing <h2>...</h2>/<h3>...</h3> + <p>...</p> pairs.
 * Never removes pages, never touches header/nav/layout.
 */

const fs = require('fs');
const path = require('path');

const {
  hash,
  titleCase,
  disclaimerBlockForPage,
  financialPlanningTimeline,
  costComparisonAcquisition,
  hiddenCosts,
  lifetimeCostProjection,
  costSavingStrategies,
  budgetConsciousOwners,
  reducingRecurringCosts
} = require('./lib-variants.cjs');

const {
  transitioningDiet,
  weightManagement,
  seniorCareNotes,
  highEnergyEnrichment,
  socialEnrichment,
  longTermEnrichmentPlanning,
  buildingVetFund,
  preventiveHealthScreening,
  longTermHealthOutcomes,
  healthCostPredictability,
  specialistCareConsiderations,
  activeOwners,
  trainingResources,
  smallLivingSpaces,
  climateControl,
  isBreedRightForYou,
  backgroundShapesCare,
  keepCharacteristicsInMind,
  detailsMatterPlanning,
  foundationNutritionExercise
} = require('./lib-variants-2.cjs');

const {
  introFineTuneRecommendations,
  introCheckInWithVet,
  GENERIC_CLOSERS
} = require('./lib-intros.cjs');

const ROOT = '/opt/build/repo';

const stats = {
  filesScanned: 0,
  filesModified: 0,
  orphanFixes: 0,
  disclaimerDiversified: 0,
  introsDiversified: 0,
  closersReplaced: 0,
  errors: 0
};

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

function pageTypeFromPath(p) {
  const rel = path.relative(ROOT, p);
  const parts = rel.split(path.sep);
  if (parts[0] === 'commercial' && parts.length >= 4) {
    const base = parts[3].replace(/\.html$/, '');
    return { kind: 'commercial', species: parts[1], breed: parts[2], pageType: base };
  }
  if (parts[0] === 'breeds' && parts.length >= 3) {
    const base = parts[parts.length - 1].replace(/\.html$/, '');
    return { kind: 'breeds', species: parts[1], breed: base };
  }
  if (parts[0] === 'guides' && parts.length === 2) {
    return { kind: 'guide', slug: parts[1].replace(/\.html$/, '') };
  }
  if (parts[0] === 'locations' && parts.length === 2) {
    return { kind: 'location', slug: parts[1].replace(/\.html$/, '') };
  }
  return { kind: 'other' };
}

// --- Orphan expanders ---

// Replace the body paragraph immediately following an H2/H3 heading whose title matches `titlePattern`
// with expanded `html`. Preserves existing h2/h3 markup.
function expandOrphanSection(html, headingLevelList, titlePattern, newBody) {
  const levels = headingLevelList || ['h2', 'h3'];
  let modified = false;
  let out = html;
  for (const lvl of levels) {
    // Match: <hN> ... title... </hN>\s*<p>...</p>\s*(optional more <p>...</p> = skip if already substantial)
    const re = new RegExp(`(<${lvl}[^>]*>\\s*)(${titlePattern})(\\s*</${lvl}>)\\s*(<p[^>]*>)([^<]{0,500})(</p>)`, 'g');
    out = out.replace(re, (m, openH, title, closeH, openP, innerText, closeP) => {
      // Only replace if body is thin (<320 chars of text / ≤1 sentence-ish)
      if (innerText && innerText.trim().length > 320) return m;
      modified = true;
      return `${openH}${title}${closeH}\n      ${newBody}`;
    });
  }
  return { html: out, modified };
}

function processCommercialCostToOwn(html, breed, species) {
  const seed = hash(breed, species, 'cost-to-own');
  let modified = false;
  let out = html;

  // Financial Planning Timeline for {Breed}
  {
    const res = expandOrphanSection(out, ['h2'],
      `Financial Planning Timeline for [^<]+`,
      financialPlanningTimeline(breed, species, seed));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }
  // {Breed} Cost Comparison by Acquisition Source
  {
    const res = expandOrphanSection(out, ['h2'],
      `[^<]+Cost Comparison by Acquisition Source`,
      costComparisonAcquisition(breed, species, seed + 1));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }
  // Hidden Costs Most {Breed} Owners Overlook
  {
    const res = expandOrphanSection(out, ['h2'],
      `Hidden Costs Most [^<]+Owners Overlook`,
      hiddenCosts(breed, species, seed + 2));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }
  // Lifetime Cost Projection for {Breed}
  {
    const res = expandOrphanSection(out, ['h2'],
      `Lifetime Cost Projection for [^<]+`,
      lifetimeCostProjection(breed, species, seed + 3));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }
  // Cost-Saving Strategies for {Breed} Care
  {
    const res = expandOrphanSection(out, ['h2'],
      `Cost-Saving Strategies for [^<]+Care`,
      costSavingStrategies(breed, species, seed + 4));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }
  // Best for Budget-Conscious {Breed} Owners (h3)
  {
    const res = expandOrphanSection(out, ['h3'],
      `Best for Budget-Conscious [^<]+Owners`,
      budgetConsciousOwners(breed, species, seed + 5));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }
  // Best for Reducing Recurring Costs (h3)
  {
    const res = expandOrphanSection(out, ['h3'],
      `Best for Reducing Recurring Costs`,
      reducingRecurringCosts(breed, species, seed + 6));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }

  return { html: out, modified };
}

function processCommercialBestFood(html, breed, species) {
  const seed = hash(breed, species, 'best-food');
  let modified = false;
  let out = html;

  {
    const res = expandOrphanSection(out, ['h3'],
      `Best for Transitioning [^<]+Diet`,
      transitioningDiet(breed, species, seed));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }
  {
    const res = expandOrphanSection(out, ['h3'],
      `Best for Weight Management`,
      weightManagement(breed, species, seed + 1));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }

  return { html: out, modified };
}

function processCommercialBestInsurance(html, breed, species) {
  const seed = hash(breed, species, 'best-insurance');
  let modified = false;
  let out = html;

  {
    const res = expandOrphanSection(out, ['h3'],
      `Senior Nutrition Needs`,
      seniorCareNotes(breed, species, seed));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }

  return { html: out, modified };
}

function processCommercialBestEnrichment(html, breed, species) {
  const seed = hash(breed, species, 'best-enrichment');
  let modified = false;
  let out = html;

  {
    const res = expandOrphanSection(out, ['h3'],
      `Best for High-Energy [^<]+`,
      highEnergyEnrichment(breed, species, seed));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }
  {
    const res = expandOrphanSection(out, ['h3'],
      `Best for Social [^<]+`,
      socialEnrichment(breed, species, seed + 1));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }
  {
    const res = expandOrphanSection(out, ['h3'],
      `Best for Long-Term Enrichment Planning`,
      longTermEnrichmentPlanning(breed, species, seed + 2));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }

  return { html: out, modified };
}

function processCommercialHealthCosts(html, breed, species) {
  const seed = hash(breed, species, 'health-costs');
  let modified = false;
  let out = html;

  {
    const res = expandOrphanSection(out, ['h2'],
      `Building a Vet Fund`,
      buildingVetFund(breed, species, seed));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }
  {
    const res = expandOrphanSection(out, ['h3'],
      `Best for Preventive Health Screening`,
      preventiveHealthScreening(breed, species, seed + 1));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }
  {
    const res = expandOrphanSection(out, ['h3'],
      `Best for Long-Term Health Outcomes`,
      longTermHealthOutcomes(breed, species, seed + 2));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }
  {
    const res = expandOrphanSection(out, ['h3'],
      `Best for Health Cost Predictability`,
      healthCostPredictability(breed, species, seed + 3));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }
  {
    const res = expandOrphanSection(out, ['h2'],
      `Specialist Care Considerations for [^<]+`,
      specialistCareConsiderations(breed, species, seed + 4));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }
  {
    const res = expandOrphanSection(out, ['h3'],
      `Senior Nutrition Needs`,
      seniorCareNotes(breed, species, seed + 5));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }

  return { html: out, modified };
}

function processCommercialFirstTimeOwners(html, breed, species) {
  const seed = hash(breed, species, 'first-time-owners');
  let modified = false;
  let out = html;

  {
    const res = expandOrphanSection(out, ['h3'],
      `Best for Active Owners`,
      activeOwners(breed, species, seed));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }
  {
    const res = expandOrphanSection(out, ['h3'],
      `Best for Training Resources`,
      trainingResources(breed, species, seed + 1));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }

  return { html: out, modified };
}

function processCommercialBestHabitatSize(html, breed, species) {
  const seed = hash(breed, species, 'best-habitat-size');
  let modified = false;
  let out = html;

  {
    const res = expandOrphanSection(out, ['h3'],
      `Best for Small Living Spaces`,
      smallLivingSpaces(breed, species, seed));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }
  {
    const res = expandOrphanSection(out, ['h3'],
      `Best for Climate Control`,
      climateControl(breed, species, seed + 1));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }

  return { html: out, modified };
}

function processBreedsPage(html, breed, species) {
  const seed = hash(breed, species, 'breed-page');
  let modified = false;
  let out = html;

  {
    const res = expandOrphanSection(out, ['h2'],
      `Is [^<]+ Right for Your (Aquarium|Home|Household|Habitat|Vivarium|Aviary|Enclosure)\\??`,
      isBreedRightForYou(breed, species, seed));
    if (res.modified) { out = res.html; modified = true; stats.orphanFixes++; }
  }

  return { html: out, modified };
}

// --- Disclaimer diversification ---

const LEGACY_DISCLAIMER_REGEX = /<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:8px;margin:30px 0;font-size:0\.9rem;">\s*<strong>Disclaimer:<\/strong> For informational purposes\. Actual costs depend on your location and your pet's needs\. Partner links may appear; editorial recommendations are independent\.<\/div>/;

function diversifyDisclaimer(html, breed, species, pageType) {
  if (!LEGACY_DISCLAIMER_REGEX.test(html)) return { html, modified: false };
  const newBlock = disclaimerBlockForPage(breed || 'generic', pageType || 'default');
  const out = html.replace(LEGACY_DISCLAIMER_REGEX, newBlock);
  return { html: out, modified: out !== html };
}

// --- Intro/Closer fingerprint replacements ---

function replaceGenericClosers(html, breed) {
  const breedTitle = titleCase(breed);
  let out = html;
  let changed = false;

  // "It is easy to treat this corner of {breed} care as optional, the animals that thrive usually prove otherwise."
  const optRe = new RegExp(`It is easy to treat this corner of [^.]+ care as optional, the animals that thrive usually prove otherwise\\.\\s*`, 'g');
  if (optRe.test(out)) {
    const seed = hash(breed, 'optional-trap');
    out = out.replace(optRe, GENERIC_CLOSERS.optionalTrap(breedTitle, seed) + ' ');
    changed = true;
    stats.closersReplaced++;
  }

  // "A {breed} responds quickly when their routine matches their temperament, habitat, and age rather than a template."
  const respRe = new RegExp(`A [A-Z][A-Za-z ]+ responds quickly when their routine matches their temperament, habitat, and age rather than a template\\.\\s*`, 'g');
  if (respRe.test(out)) {
    const seed = hash(breed, 'routine-matches');
    out = out.replace(respRe, GENERIC_CLOSERS.respondsWhenRoutineMatches(breedTitle, seed) + ' ');
    changed = true;
    stats.closersReplaced++;
  }

  // "Understanding a {X} as a {X}, not just as \"a pet,\" changes the quality of every decision that follows."
  const undRe = /Understanding a ([^,]+) as a \1, not just as "a pet," changes the quality of every decision that follows\.\s*/g;
  if (undRe.test(out)) {
    const seed = hash(breed, 'understanding-as');
    out = out.replace(undRe, GENERIC_CLOSERS.understandingAsNotJustAPet(breedTitle, seed) + ' ');
    changed = true;
    stats.closersReplaced++;
  }

  // "Each {Breed} is its own case, so a short conversation with a veterinarian is the natural finishing step for any feeding plan."
  const eachCaseRe = /Each [A-Z][A-Za-z -]+ is its own case, so a short conversation with a veterinarian is the natural finishing step for any feeding plan\.\s*/g;
  if (eachCaseRe.test(out)) {
    const seed = hash(breed, 'each-case');
    const replacements = [
      `Every ${breedTitle} arrives with a slightly different starting profile, so a focused vet conversation is the right way to finalise a plan that actually fits.`,
      `No two ${breedTitle}s share the exact same baseline; a short call with the veterinarian turns a generic plan into a workable one.`,
      `Treat any ${breedTitle} care plan as a draft until your vet has reviewed it against the animal's current weight, age, and health history.`,
      `The last step in any ${breedTitle} plan is a conversation with the vet who knows the animal — they translate ranges into specifics.`,
      `Bring the outline to your veterinarian for a final pass; each ${breedTitle} ends up with a plan tailored to its specific history.`,
      `A short veterinary review is the practical way to close out any ${breedTitle} plan and confirm nothing on this page conflicts with current treatment.`,
      `Your veterinarian owns the final layer of any ${breedTitle} plan — the layer where generic guidance meets the specific animal in front of them.`,
      `Finish by confirming the plan with the ${breedTitle}'s regular vet; that extra step accounts for ongoing treatments and individual sensitivities.`
    ];
    out = out.replace(eachCaseRe, replacements[seed % replacements.length] + ' ');
    changed = true;
    stats.closersReplaced++;
  }

  return { html: out, modified: changed };
}

function replaceIntroVet(html, breed, pageType) {
  let out = html;
  let changed = false;
  const seed = hash(breed, pageType, 'intro');

  // "Work with your veterinarian to fine-tune these recommendations based on your {breed}'s weight, activity level..."
  const fineTuneRe = /Work with your veterinarian to fine-tune these recommendations based on your [^']+'s weight, activity level[^.]*\.\s*/g;
  if (fineTuneRe.test(out)) {
    out = out.replace(fineTuneRe, introFineTuneRecommendations(breed, '', seed) + ' ');
    changed = true;
    stats.introsDiversified++;
  }

  // "Before making significant diet changes, check in with your veterinarian..."
  const dietChangesRe = /Before making significant diet changes, check in with your veterinarian[^.]*\.\s*/g;
  if (dietChangesRe.test(out)) {
    out = out.replace(dietChangesRe, introCheckInWithVet(breed, '', seed + 1) + ' ');
    changed = true;
    stats.introsDiversified++;
  }

  return { html: out, modified: changed };
}

// --- Main loop ---

function processFile(filePath) {
  const info = pageTypeFromPath(filePath);
  let html;
  try {
    html = fs.readFileSync(filePath, 'utf8');
  } catch { stats.errors++; return; }
  let modified = false;
  const origLen = html.length;

  if (info.kind === 'commercial') {
    const { species, breed, pageType } = info;
    if (pageType === 'cost-to-own') {
      const r = processCommercialCostToOwn(html, breed, species);
      if (r.modified) { html = r.html; modified = true; }
    } else if (pageType === 'best-food') {
      const r = processCommercialBestFood(html, breed, species);
      if (r.modified) { html = r.html; modified = true; }
    } else if (pageType === 'best-insurance') {
      const r = processCommercialBestInsurance(html, breed, species);
      if (r.modified) { html = r.html; modified = true; }
    } else if (pageType === 'best-enrichment') {
      const r = processCommercialBestEnrichment(html, breed, species);
      if (r.modified) { html = r.html; modified = true; }
    } else if (pageType === 'health-costs') {
      const r = processCommercialHealthCosts(html, breed, species);
      if (r.modified) { html = r.html; modified = true; }
    } else if (pageType === 'first-time-owners') {
      const r = processCommercialFirstTimeOwners(html, breed, species);
      if (r.modified) { html = r.html; modified = true; }
    } else if (pageType === 'best-habitat-size') {
      const r = processCommercialBestHabitatSize(html, breed, species);
      if (r.modified) { html = r.html; modified = true; }
    }

    // Disclaimer diversification (for pageTypes with the legacy boilerplate)
    {
      const r = diversifyDisclaimer(html, breed, species, pageType);
      if (r.modified) { html = r.html; modified = true; stats.disclaimerDiversified++; }
    }

    // Closer and intro fingerprint replacements
    {
      const r = replaceGenericClosers(html, breed);
      if (r.modified) { html = r.html; modified = true; }
    }
    {
      const r = replaceIntroVet(html, breed, pageType);
      if (r.modified) { html = r.html; modified = true; }
    }
  } else if (info.kind === 'breeds') {
    const { breed, species } = info;
    const r = processBreedsPage(html, breed, species);
    if (r.modified) { html = r.html; modified = true; }
    const r2 = replaceGenericClosers(html, breed);
    if (r2.modified) { html = r2.html; modified = true; }
  } else if (info.kind === 'guide' || info.kind === 'location') {
    // Reserved for pass 2
  }

  stats.filesScanned++;
  if (modified) {
    try {
      fs.writeFileSync(filePath, html);
      stats.filesModified++;
    } catch { stats.errors++; }
  }
}

function main() {
  const files = walk(ROOT);
  console.log(`Scanning ${files.length} HTML files...`);
  let count = 0;
  for (const f of files) {
    processFile(f);
    count++;
    if (count % 1500 === 0) {
      console.log(`  ... processed ${count} files, modified ${stats.filesModified}`);
    }
  }

  console.log('\n=== PASS 1 COMPLETE ===');
  console.log(JSON.stringify(stats, null, 2));
  fs.writeFileSync(path.join(ROOT, 'data', 'remediation-pass-1.json'), JSON.stringify(stats, null, 2));
}

main();
