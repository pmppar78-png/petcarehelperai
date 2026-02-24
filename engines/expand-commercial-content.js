#!/usr/bin/env node
/**
 * expand-commercial-content.js
 * Phase B: Expand all commercial pages with entity-specific, differentiated content.
 *
 * 1. Extracts Quick Facts + health conditions from breed pages
 * 2. Generates page-type-specific expanded sections per entity
 * 3. Injects new content before the disclaimer div
 * 4. Processes in batches of 100, logs progress
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

if (!fs.existsSync(AUDIT_DIR)) fs.mkdirSync(AUDIT_DIR, { recursive: true });

function log(msg) {
  const line = `[${new Date().toISOString()}] EXPAND: ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

// ── Deterministic variant selector ───────────────────────────────────
// Simple hash of a string to pick among N template variants reproducibly
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function pickVariant(name, pool) {
  return pool[hashStr(name) % pool.length];
}
// Category classifiers for conditional content
function sizeCategory(sizeStr) {
  const s = (sizeStr || '').toLowerCase();
  if (/tiny|teacup|very small|under 5|1-5/.test(s)) return 'tiny';
  if (/small|miniature|toy|5-15|10-20|under 20/.test(s)) return 'small';
  if (/large|big|70|80|90|100|over 50/.test(s)) return 'large';
  if (/giant|extra.?large|over 100|100\+|xl/.test(s)) return 'giant';
  return 'medium';
}
function exerciseCategory(exStr) {
  const e = (exStr || '').toLowerCase();
  if (/very high|intense|extreme|90\+/.test(e)) return 'very-high';
  if (/high|active|energetic|60/.test(e)) return 'high';
  if (/low|minimal|sedentary|calm/.test(e)) return 'low';
  return 'moderate';
}
function careLevelCategory(clStr) {
  const c = (clStr || '').toLowerCase();
  if (/very high|expert|advanced|difficult/.test(c)) return 'expert';
  if (/high|experienced|demanding/.test(c)) return 'high';
  if (/low|easy|beginner|simple/.test(c)) return 'low';
  return 'moderate';
}

// ── Species-group terminology ───────────────────────────────────────

const SPECIES_META = {
  dogs:           { term: 'dog', termPlural: 'dogs', habitat: 'crate', vetType: 'veterinarian', careItem: 'collar and leash', exercise: 'walks and play', groupLabel: 'breed' },
  cats:           { term: 'cat', termPlural: 'cats', habitat: 'indoor space', vetType: 'veterinarian', careItem: 'litter box', exercise: 'play sessions', groupLabel: 'breed' },
  birds:          { term: 'bird', termPlural: 'birds', habitat: 'cage', vetType: 'avian veterinarian', careItem: 'perches and toys', exercise: 'flight time and interaction', groupLabel: 'species' },
  fish:           { term: 'fish', termPlural: 'fish', habitat: 'aquarium', vetType: 'aquatic veterinarian', careItem: 'filter and heater', exercise: 'swimming space', groupLabel: 'species' },
  'marine-fish':  { term: 'marine fish', termPlural: 'marine fish', habitat: 'saltwater aquarium', vetType: 'marine aquatic veterinarian', careItem: 'protein skimmer and live rock', exercise: 'swimming space', groupLabel: 'species' },
  reptiles:       { term: 'reptile', termPlural: 'reptiles', habitat: 'terrarium', vetType: 'herp veterinarian', careItem: 'heat lamp and UVB light', exercise: 'exploration time', groupLabel: 'species' },
  amphibians:     { term: 'amphibian', termPlural: 'amphibians', habitat: 'vivarium', vetType: 'herp veterinarian', careItem: 'misting system', exercise: 'habitat enrichment', groupLabel: 'species' },
  'small-animals':{ term: 'small animal', termPlural: 'small animals', habitat: 'enclosure', vetType: 'exotic veterinarian', careItem: 'bedding and hideout', exercise: 'supervised play', groupLabel: 'breed' },
};

// ── Breed data extraction ───────────────────────────────────────────

function extractBreedData(speciesGroup, slug) {
  const breedFile = path.join(BREEDS_DIR, speciesGroup, `${slug}.html`);
  const data = {
    quickFacts: {},
    healthConditions: [],
    costItems: [],
    size: 'medium',
    lifespan: '10-15 years',
    temperament: 'friendly',
    exerciseNeeds: 'moderate',
    shedding: 'moderate',
    careLevel: 'moderate',
  };

  if (!fs.existsSync(breedFile)) return data;

  const html = fs.readFileSync(breedFile, 'utf-8');

  // Extract Quick Facts table
  const factsMatch = html.match(/<h2>Quick Facts<\/h2>[\s\S]*?<table[\s\S]*?<\/table>/i);
  if (factsMatch) {
    const rows = [...factsMatch[0].matchAll(/<tr>\s*<td>([^<]*)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/gi)];
    for (const row of rows) {
      const key = row[1].trim();
      const val = row[2].replace(/<[^>]+>/g, '').trim();
      data.quickFacts[key] = val;
    }
  }

  // Map common fields
  for (const [k, v] of Object.entries(data.quickFacts)) {
    const kl = k.toLowerCase();
    if (kl.includes('size') || kl.includes('weight')) data.size = v;
    if (kl.includes('lifespan') || kl.includes('life span') || kl.includes('life expectancy')) data.lifespan = v;
    if (kl.includes('temperament') || kl.includes('personality')) data.temperament = v;
    if (kl.includes('exercise') || kl.includes('activity')) data.exerciseNeeds = v;
    if (kl.includes('shedding') || kl.includes('grooming')) data.shedding = v;
    if (kl.includes('care level') || kl.includes('trainability') || kl.includes('difficulty')) data.careLevel = v;
  }

  // Extract health conditions (h3 headings under "Common Health Issues")
  const healthMatch = html.match(/<h2>Common Health Issues<\/h2>([\s\S]*?)(?=<h2[^3]|<div class="warning|$)/i);
  if (healthMatch) {
    const h3s = [...healthMatch[1].matchAll(/<h3>([^<]+)<\/h3>/gi)];
    data.healthConditions = h3s.map(m => m[1].trim()).filter(c => c.length > 0);
  }

  // Extract cost items
  const costMatch = html.match(/<h2>Cost of Ownership<\/h2>([\s\S]*?)(?=<h2|<div class="affiliate|$)/i);
  if (costMatch) {
    const costRows = [...costMatch[1].matchAll(/<tr>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>\s*<\/tr>/gi)];
    data.costItems = costRows.map(r => ({ category: r[1].trim(), amount: r[2].trim() }));
  }

  return data;
}

// ── Content generators by page type ─────────────────────────────────

function generateFoodContent(name, data, meta) {
  const conditions = data.healthConditions.length > 0 ? data.healthConditions.slice(0, 3).join(', ') : 'common species-related conditions';
  const traits = data.temperament.split(',').map(t => t.trim());
  const primaryTrait = traits[0] || 'active';
  const sz = sizeCategory(data.size);
  const ex = exerciseCategory(data.exerciseNeeds);

  // Variation pools for nutritional profile intro
  const nutritionIntros = [
    `The ${name} has specific dietary requirements shaped by its ${data.size} build and ${primaryTrait.toLowerCase()} temperament. With a typical lifespan of ${data.lifespan}, long-term nutritional planning is essential to maximize quality of life.`,
    `Nutrition for ${name} must account for this ${meta.groupLabel}'s ${data.size} frame and naturally ${primaryTrait.toLowerCase()} disposition. Across a lifespan of ${data.lifespan}, dietary consistency directly influences vitality and longevity.`,
    `Every ${name} has nutritional demands driven by its ${data.size} build, ${primaryTrait.toLowerCase()} energy, and expected ${data.lifespan} lifespan. Getting the diet right from the start pays dividends in health and quality of life.`,
    `Dietary planning for ${name} starts with understanding this ${meta.groupLabel}'s ${data.size} physique and ${primaryTrait.toLowerCase()} character. Over a ${data.lifespan} lifespan, the right nutrition foundation prevents many common health issues.`,
  ];

  // Size-conditional calorie guidance
  const calorieGuidance = {
    tiny: `As a tiny ${meta.term}, ${name} has a fast metabolism requiring calorie-dense food in small, frequent portions. Hypoglycemia is a real risk, so never skip meals.`,
    small: `${name}'s compact build means calorie needs are lower in absolute terms but higher per pound of body weight than larger ${meta.termPlural}. Choose nutrient-dense formulas designed for small ${meta.termPlural}.`,
    medium: `${name} ${meta.termPlural} with ${data.exerciseNeeds.toLowerCase()} exercise demands need a caloric intake carefully calibrated to prevent both underweight and overweight conditions.`,
    large: `Larger ${meta.termPlural} like ${name} need controlled calorie intake to support their frame without excess weight that stresses joints. Slow-growth formulas help prevent developmental skeletal issues.`,
    giant: `Giant ${meta.termPlural} like ${name} require specially formulated diets that support massive bone and joint structures. Controlled growth rates are critical—excess calories during development cause lasting orthopedic damage.`,
  };

  // Exercise-conditional protein guidance
  const proteinGuidance = {
    'very-high': `With very high activity demands, ${name} needs protein levels of 30-40% to support muscle recovery and sustained stamina. Performance or working-${meta.term} formulas are often the best fit.`,
    high: `A diet rich in animal-based proteins at 28-35% of total calories fuels ${name}'s active lifestyle, with fat content elevated slightly to sustain energy through longer activity sessions.`,
    moderate: `A diet rich in animal-based proteins should make up 25-35% of total calories for this ${meta.groupLabel}, with fat content adjusted for activity level.`,
    low: `${name}'s lower activity level means protein at 22-28% of calories is sufficient. Avoid over-rich formulas that can cause weight gain in less active ${meta.termPlural}.`,
  };

  // Variant sensitivity paragraphs
  const sensitivityVariants = [
    `${name} ${meta.termPlural} can be susceptible to dietary sensitivities, particularly given their predisposition to ${conditions}. Signs of food sensitivity include digestive upset, skin irritation, excessive scratching, and changes in stool quality. For ${name} with suspected food allergies, a veterinarian-guided elimination diet can identify trigger ingredients. Limited-ingredient diets (LIDs) that use novel proteins such as venison, duck, or lamb combined with single carbohydrate sources are often effective. Avoid common allergens including wheat, corn, and soy unless your ${name} tolerates them well. Probiotics and digestive enzyme supplements can also support gut health in sensitive ${name} ${meta.termPlural}.`,
    `Given ${name}'s predisposition to ${conditions}, monitoring for dietary sensitivities is important. Watch for persistent itching, ear infections, loose stools, or vomiting after meals. If sensitivity is suspected, work with your ${meta.vetType} on a strict elimination diet over 8-12 weeks to pinpoint the offending ingredient. Hydrolyzed protein diets break proteins into fragments too small to trigger immune responses and can be an effective diagnostic and management tool. Once triggers are identified, maintaining an avoidance diet is straightforward with the wide range of limited-ingredient options now available for ${meta.termPlural}.`,
    `Dietary sensitivities affect a notable proportion of ${meta.termPlural}, and ${name} is no exception given the ${meta.groupLabel}'s association with ${conditions}. The most reliable symptoms to watch include chronic ear inflammation, paw licking, intermittent diarrhea, and flatulence. Novel protein sources—rabbit, kangaroo, or insect-based formulas—offer alternatives when common proteins trigger reactions. Grain-free diets are not automatically better; many ${name} ${meta.termPlural} tolerate grains well. Focus on identifying specific triggers through controlled elimination rather than blanket ingredient avoidance.`,
  ];

  // Variant expert tips paragraphs
  const expertTipsVariants = [
    `Experienced ${name} owners and ${meta.groupLabel} specialists recommend several feeding best practices. First, establish a consistent feeding schedule; ${name} ${meta.termPlural} thrive on routine and predictable mealtimes support healthy digestion. Second, rotate between two or three high-quality food brands quarterly to provide nutritional variety and reduce the risk of developing sensitivities to specific proteins. Third, supplement with species-appropriate fresh foods where safe: small amounts of cooked lean meat, safe vegetables, and occasional fruits provide additional micronutrients. Fourth, invest in ${sz === 'large' || sz === 'giant' ? 'elevated' : 'appropriately sized'} feeding stations or slow-feeder bowls to improve eating posture and reduce gulping. Finally, track your ${name}'s dietary intake and any reactions in a simple log to share with your ${meta.vetType} during wellness visits.`,
    `Long-time ${name} owners consistently recommend these practices for optimal nutrition. Stick to a fixed feeding schedule—same times daily—because digestive regularity improves nutrient absorption. Introduce any new food gradually over 7-10 days by mixing increasing proportions with the current diet. Avoid feeding table scraps, which disrupt balanced nutrition and can introduce harmful ingredients. Store dry food in an airtight container away from heat and humidity to preserve nutrient integrity. Weigh food portions with a kitchen scale rather than using a scoop, as volume-based measuring can vary by 20% or more. Keep a monthly weight log and share trends with your ${meta.vetType} at each visit.`,
    `Veteran ${name} caregivers emphasize practical feeding wisdom for this ${meta.groupLabel}. Meal timing matters: feed ${ex === 'high' || ex === 'very-high' ? 'at least one hour before and after vigorous activity to prevent bloat and digestive distress' : 'at consistent times to establish reliable digestive rhythms'}. Choose foods with named animal protein as the first ingredient rather than generic "meat meal." Supplement omega-3 fatty acids through fish oil or dedicated supplements to support skin, coat, and joint health. Use treat calories strategically during training rather than as random rewards. For ${meta.termPlural} prone to ${conditions}, consider a veterinary nutritionist consultation to create a tailored feeding protocol specific to your ${name}'s health profile.`,
  ];

  return `
      <h2>${name} Nutritional Profile</h2>
      <p>${pickVariant(name, nutritionIntros)} ${calorieGuidance[sz] || calorieGuidance.medium} ${proteinGuidance[ex] || proteinGuidance.moderate} Omega-3 and omega-6 fatty acids are particularly beneficial for ${name} to maintain coat health and joint function.</p>

      <h2>Life-Stage Feeding Guide for ${name}</h2>
      <p>Feeding requirements change significantly through the life stages of a ${name}. Young ${meta.termPlural} require nutrient-dense food with higher protein and fat ratios to support rapid growth and development. For ${name} specifically, the juvenile phase demands approximately ${sz === 'large' || sz === 'giant' ? '20-40' : '25-50'}% more calories per pound of body weight than adult maintenance. As your ${name} transitions to adulthood, gradually shift to a maintenance formula over 7-10 days to avoid digestive upset. Senior ${name} ${meta.termPlural} (typically in the last third of their ${data.lifespan} lifespan) benefit from reduced-calorie formulas with added joint support supplements like glucosamine and chondroitin. Always ensure fresh, clean water is available alongside meals.</p>

      <h3>Best for Growing ${name}</h3>
      <p>${sz === 'large' || sz === 'giant' ? `Large-breed growth formulas with controlled calcium (0.8-1.2%) and phosphorus levels are critical for ${name} to prevent developmental orthopedic disease. Avoid overfeeding during growth spurts.` : `Look for growth-specific formulas that provide the calcium-to-phosphorus ratio appropriate for ${name}. Controlled growth prevents developmental issues common in this ${meta.groupLabel}.`}</p>

      <h3>Best for Adult ${name}</h3>
      <p>Maintenance formulas for ${name} should reflect their ${data.exerciseNeeds.toLowerCase()} activity level with complete and balanced nutrition meeting AAFCO standards for adult ${meta.termPlural}.</p>

      <h3>Best for Senior ${name}</h3>
      <p>Older ${name} ${meta.termPlural} benefit from foods with enhanced antioxidant profiles, L-carnitine for lean muscle maintenance, and reduced sodium to support cardiovascular health.${sz === 'large' || sz === 'giant' ? ' Joint-support ingredients like green-lipped mussel extract and MSM become especially important for larger frames carrying more weight.' : ''}</p>

      <h2>Common Dietary Sensitivities in ${name}</h2>
      <p>${pickVariant(name + 'sensitivity', sensitivityVariants)}</p>

      <h2>Ideal Portion Control for ${name}</h2>
      <p>Proper portion sizing for ${name} depends on weight, age, metabolic rate, and activity level. As a ${data.size} ${meta.term}, ${name} requires carefully measured meals rather than free-feeding to prevent obesity. Use the food manufacturer's guidelines as a starting point, then adjust based on your ${name}'s body condition score. A healthy ${name} should have a visible waist when viewed from above and ribs that are easily felt but not prominently visible. Divide daily portions into ${sz === 'tiny' || sz === 'small' ? 'three to four meals for adults and four to five meals for young' : 'two meals for adults and three to four meals for young'} ${name} ${meta.termPlural}. Monitor weight monthly and adjust portions by 10-15% if weight trends outside the ideal range. Treats should never exceed 10% of daily caloric intake.</p>

      <h3>Best for Weight Management</h3>
      <p>If your ${name} needs to lose or maintain weight, choose a formula with L-carnitine and higher fiber content. These help ${name} feel satisfied while consuming fewer calories, which is especially important given their ${data.exerciseNeeds.toLowerCase()} activity level.</p>

      <h2>Signs Your ${name} Is Thriving on Their Diet</h2>
      <p>A well-nourished ${name} displays consistent energy throughout the day that matches their ${primaryTrait.toLowerCase()} nature. The coat should be glossy and smooth without excessive dryness, flaking, or dullness. Healthy digestion is indicated by firm, well-formed stools one to two times daily. Dental health remains strong with minimal tartar buildup when diet supports oral care. Eyes should be bright and clear, and your ${name} should maintain a stable, appropriate weight for their frame. Changes in any of these indicators may signal that a dietary adjustment is needed. Regular ${meta.vetType} check-ups help confirm that your ${name}'s nutritional plan is working optimally.</p>

      <h2>Expert Feeding Tips for ${name} Owners</h2>
      <p>${pickVariant(name + 'tips', expertTipsVariants)}</p>

      <h2>Understanding ${name}'s Dietary Heritage</h2>
      <p>${pickVariant(name + 'heritage', [
        `The ${name}'s evolutionary background directly influences modern dietary needs. As a ${data.size} ${meta.term} with ${primaryTrait.toLowerCase()} character traits, ${name} has metabolic patterns shaped by generations of selective development. Their ${data.exerciseNeeds.toLowerCase()} energy expenditure demands a diet calibrated to these activity rhythms. Owners who understand ${name}'s heritage make better nutritional choices because they anticipate requirements rather than reacting to deficiency symptoms. The connection between ${name}'s ${data.temperament.toLowerCase()} personality and dietary preference is well documented—${meta.termPlural} with higher energy temperaments tend to self-regulate intake more effectively, while calmer ${meta.termPlural} may overeat if portions are uncontrolled.`,
        `Understanding the heritage of ${name} provides valuable context for dietary planning. This ${meta.groupLabel}'s ${data.size} build reflects generations of development that created specific metabolic demands. With a natural ${primaryTrait.toLowerCase()} disposition and ${data.exerciseNeeds.toLowerCase()} activity pattern, ${name} converts calories to energy in characteristic ways that differ from other ${meta.termPlural}. Their ${data.lifespan} lifespan means nutritional planning should account for extended periods in each life stage and the gradual metabolic shifts that occur with aging. Owners who research ${name}'s background gain insights that translate directly into better feeding decisions throughout every stage of their ${meta.term}'s life.`,
        `Every ${name} carries nutritional requirements rooted in this ${meta.groupLabel}'s developmental history. Their ${data.size} frame and ${primaryTrait.toLowerCase()} temperament create a unique metabolic profile that standard feeding charts cannot fully capture. The ${data.exerciseNeeds.toLowerCase()} activity demand means calorie utilization follows patterns specific to this ${meta.groupLabel}. Over ${name}'s ${data.lifespan} lifespan, these heritage-driven needs shift—juvenile ${name} ${meta.termPlural} have significantly different requirements from seniors. Knowledge of these patterns helps owners transition between life-stage diets proactively rather than waiting for signs of nutritional mismatch.`,
      ])}</p>

      <h3>Best for Transitioning ${name}'s Diet</h3>
      <p>When switching foods for ${name}, always transition gradually over 7-10 days by mixing increasing proportions of the new food with the current diet. This approach prevents digestive upset and allows you to monitor your ${name} for any adverse reactions to new ingredients, which is particularly important given this ${meta.groupLabel}'s sensitivities.</p>`;
}

function generateInsuranceContent(name, data, meta) {
  const conditions = data.healthConditions.length > 0 ? data.healthConditions : ['respiratory issues', 'joint problems', 'dental disease'];
  const topConditions = conditions.slice(0, 4);
  const sz = sizeCategory(data.size);

  // Variant intro paragraphs
  const whyInsureIntros = [
    `Pet insurance for ${name} is a strategic financial decision given this ${meta.groupLabel}'s specific health profile. ${name} ${meta.termPlural} are predisposed to conditions including ${topConditions.join(', ')}, which can result in significant veterinary costs over their ${data.lifespan} lifespan.`,
    `Insuring your ${name} protects against the financial impact of this ${meta.groupLabel}'s known health vulnerabilities. With predispositions to ${topConditions.join(', ')}, unexpected veterinary bills can strain any household budget across the ${data.lifespan} expected lifespan.`,
    `The case for insuring ${name} is straightforward: this ${meta.groupLabel} carries genetic predispositions to ${topConditions.join(', ')}, and treatment costs accumulate quickly over a ${data.lifespan} lifespan. Insurance converts unpredictable expenses into planned monthly costs.`,
    `Financial protection through insurance makes particular sense for ${name} given the ${meta.groupLabel}'s susceptibility to ${topConditions.join(', ')}. Over ${data.lifespan}, even one major health episode can exceed what most owners have budgeted for veterinary care.`,
  ];

  // Size-conditional premium estimates
  const premiumEstimates = {
    tiny: `$20-$45 per month for a ${name}`,
    small: `$25-$55 per month for a ${name}`,
    medium: `$30-$70 per month for a ${name}`,
    large: `$45-$90 per month for a ${name}`,
    giant: `$55-$110 per month for a ${name}`,
  };

  // Variant cost-benefit paragraphs
  const costBenefitVariants = [
    `A realistic cost-benefit analysis for ${name} insurance considers both the probability and cost of ${meta.groupLabel}-specific conditions. Over a ${data.lifespan} lifespan, the average ${name} will incur $15,000-$45,000 in veterinary costs. Insurance premiums over the same period typically total $5,000-$12,000, with the plan covering 70-90% of eligible expenses. For ${name} specifically, the break-even point often arrives after just one major health event, which veterinary statistics suggest occurs in over 60% of ${meta.termPlural} of this ${meta.groupLabel}. The peace of mind alone is significant: insured ${name} owners are more likely to pursue recommended treatments rather than making difficult decisions based purely on cost.`,
    `To evaluate insurance value for ${name}, compare expected veterinary costs ($15,000-$45,000 over ${data.lifespan}) against total premium outlay ($5,000-$12,000 for comprehensive coverage). The math favors insurance when even one major claim occurs—and for ${name}, the likelihood of a significant health event exceeds 60% based on ${meta.groupLabel} veterinary data. Beyond financials, insured owners consistently report less decision stress when their ${meta.vetType} recommends diagnostics or treatments. This psychological benefit translates to better health outcomes because owners pursue recommended care rather than deferring due to cost concerns.`,
    `Running the numbers on ${name} insurance: lifetime veterinary costs for this ${meta.groupLabel} typically reach $15,000-$45,000, while comprehensive insurance premiums total $5,000-$12,000 over the same period. At 80% reimbursement, a single $3,000 emergency claim returns most of one year's premium investment. For ${name} with predispositions to ${topConditions.slice(0, 2).join(' and ')}, the probability of needing significant veterinary intervention makes insurance a statistically sound investment rather than a gamble.`,
  ];

  // Variant plan selection paragraphs
  const planSelectionVariants = [
    `When comparing plans for ${name}, evaluate five key factors: annual deductible (lower is better but increases premiums), reimbursement percentage (80-90% is standard), annual maximum benefit (unlimited is ideal for ${meta.groupLabel}-specific conditions), coverage inclusions (ensure hereditary conditions are covered), and customer claim processing time. For ${name} owners, prioritize plans that cover bilateral conditions (affecting both sides of the body) and alternative therapies like acupuncture or physiotherapy. Read policy exclusions carefully, paying special attention to ${meta.groupLabel}-specific hereditary condition exclusions.`,
    `Selecting the optimal plan for ${name} requires comparing deductible structures, reimbursement rates, and coverage scope. Annual deductibles of $200-$500 balance premium affordability against out-of-pocket costs at claim time. Reimbursement at 80-90% is standard; 70% plans save on premiums but leave more exposure during expensive treatments. For ${name}, ensure the policy explicitly covers hereditary and congenital conditions—some budget plans exclude these, which is a critical gap for this ${meta.groupLabel}. Unlimited annual maximums provide the strongest safety net, especially as ${name} ages and chronic conditions require sustained treatment.`,
    `Comparing insurance options for ${name} comes down to matching coverage depth with your risk tolerance. Accident-only plans are cheapest but leave illness uncovered—a poor choice for ${name} given this ${meta.groupLabel}'s health predispositions. Accident-and-illness plans with 80% reimbursement and $250-$500 deductibles represent the best value for most ${name} owners. Wellness add-ons cover routine care (exams, vaccinations, dental cleanings) but may not be cost-effective depending on usage. The most important exclusions to check: hereditary conditions, bilateral conditions, and breed-specific condition exclusions that could leave ${name}'s most likely claims uncovered.`,
  ];

  return `
      <h2>Why ${name} Owners Should Consider Insurance</h2>
      <p>${pickVariant(name, whyInsureIntros)} Emergency surgeries can cost $2,000-$7,000, while chronic condition management may run $200-$500 monthly. Insurance transforms these unpredictable large expenses into manageable monthly premiums, typically ${premiumEstimates[sz] || premiumEstimates.medium}. The earlier you enroll your ${name}, the fewer pre-existing condition exclusions you'll face.</p>

      <h3>Best for Comprehensive Coverage</h3>
      <p>Comprehensive accident-and-illness plans provide the broadest protection for ${name}. Look for policies covering hereditary and congenital conditions, which are critical for this ${meta.groupLabel}.</p>

      <h2>Common Health Claims for ${name}</h2>
      <p>Understanding the most frequent insurance claims for ${name} helps you evaluate coverage options. Based on veterinary data for this ${meta.groupLabel}, the most common claims include treatment for ${topConditions[0] || 'digestive issues'}, which typically costs $500-$2,500 per episode. ${topConditions[1] ? `${topConditions[1]} claims average $1,000-$4,000 for diagnosis and treatment.` : 'Diagnostic imaging and lab work claims average $300-$800 per visit.'} Routine dental procedures for ${name} run $300-$800, while dental extractions can exceed $1,500. Skin conditions and allergies, common in many ${meta.termPlural}, generate recurring claims of $200-$600 per flare-up. Age-related conditions in senior ${name} ${meta.termPlural} often involve ongoing medications costing $50-$200 monthly, making the lifetime value of insurance particularly strong for this ${meta.groupLabel}.</p>

      <h3>Best for ${name} Puppies and Young ${meta.termPlural}</h3>
      <p>Enrolling your ${name} early locks in coverage before pre-existing conditions develop. Many insurers offer lower premiums for younger ${meta.termPlural}, making early enrollment the best value.</p>

      <h2>Coverage Considerations by Life Stage</h2>
      <p>Your ${name}'s insurance needs evolve throughout their ${data.lifespan} lifespan. During the first year, accident coverage is paramount as young ${name} ${meta.termPlural} explore their environment and encounter hazards. In the adult years, a comprehensive accident-and-illness plan protects against the onset of ${meta.groupLabel}-specific conditions including ${topConditions.slice(0, 2).join(' and ')}. For senior ${name} ${meta.termPlural}, ensure your policy covers chronic condition management and does not cap coverage at an age threshold.${sz === 'large' || sz === 'giant' ? ` Larger ${meta.termPlural} like ${name} tend to age faster with earlier onset of joint and mobility issues, making senior coverage even more critical.` : ''} Some insurers reduce benefits or increase premiums significantly for older ${meta.termPlural}, so comparing lifetime policies early can save thousands over your ${name}'s life.</p>

      <h3>Best for Senior ${name}</h3>
      <p>Policies with no upper age limits and unlimited annual benefits provide the most protection for aging ${name} ${meta.termPlural}. Look for plans that include prescription drug coverage and specialist referrals.</p>

      <h2>Cost-Benefit Analysis for ${name}</h2>
      <p>${pickVariant(name + 'costbenefit', costBenefitVariants)}</p>

      <h2>Pre-existing Condition Awareness for ${name}</h2>
      <p>Understanding pre-existing condition policies is crucial for ${name} owners. Most insurers exclude conditions diagnosed or showing symptoms before enrollment. For ${name}, this is particularly important because some ${meta.groupLabel}-specific conditions like ${topConditions[0] || 'joint issues'} can present subtle early signs. During the waiting period (typically 14 days for illness, 48 hours for accidents), no claims can be filed. Some insurers will cover curable pre-existing conditions after a symptom-free period of 12-18 months. To maximize your ${name}'s coverage, enroll as early as possible, ideally within the first few months of bringing your ${name} home, and maintain continuous coverage without lapses.</p>

      <h2>Choosing the Right Insurance Plan for ${name}</h2>
      <p>${pickVariant(name + 'planselect', planSelectionVariants)} A slightly higher premium for comprehensive coverage almost always outweighs the savings of a bare-bones plan given the ${name}'s health risk profile.</p>

      <h2>Filing Claims and Maximizing Benefits for ${name}</h2>
      <p>${pickVariant(name + 'claims', [
        `Efficient claim management maximizes your ${name} insurance investment. Document every ${meta.vetType} visit with detailed notes and itemized invoices from the first appointment. Most insurers now accept claims via mobile app with photo uploads of receipts, with processing times of 5-14 business days. For ${name}, keep a dedicated health folder with vaccination records, diagnostic results, and treatment histories—this speeds claim review and prevents delays from missing documentation. When ${name} receives treatment for conditions like ${topConditions[0] || 'common health issues'}, submit the claim within 24-48 hours while details are fresh. Track your annual deductible progress so you know exactly when reimbursements begin, and schedule elective procedures strategically after the deductible is met to maximize the policy year value.`,
        `Maximizing insurance value for ${name} requires proactive claim management. Maintain organized health records including all ${meta.vetType} notes, lab results, and imaging reports. When ${name} needs care for ${topConditions[0] || 'health concerns'} or other ${meta.groupLabel}-specific conditions, confirm coverage with your insurer before treatment when possible. Submit claims promptly with complete documentation to avoid processing delays. Track which providers are in-network versus out-of-network, as reimbursement rates may differ. For recurring treatments common in ${name} ${meta.termPlural}, some insurers offer streamlined repeat-claim processing. Understanding your policy's coordination of benefits clause helps if ${name} has coverage through multiple sources or wellness add-ons.`,
        `Smart claim practices help ${name} owners recover maximum value from their insurance investment. Start by registering your ${meta.vetType} practice with your insurer to enable direct billing where available. Photograph all receipts and treatment summaries immediately after each visit for ${name}. For conditions like ${topConditions[0] || 'breed-related health concerns'}, keep a symptom diary noting dates, severity, and treatments—this documentation strengthens claims and prevents classification disputes. Review your explanation of benefits after each claim to verify correct processing. If a claim for ${name} is denied, most insurers offer an appeals process; denials related to ${meta.groupLabel}-specific conditions are worth appealing with supporting veterinary documentation.`,
      ])}</p>

      <h2>When to Upgrade or Switch ${name} Insurance</h2>
      <p>${pickVariant(name + 'switch', [
        `Insurance needs for ${name} evolve across their ${data.lifespan} lifespan, and periodic policy reviews ensure coverage keeps pace. Review your ${name}'s policy annually during renewal, comparing current premiums, deductibles, and coverage limits against competing options. Key triggers for policy changes include: diagnosis of a new chronic condition (verify the current policy covers ongoing treatment), significant premium increases exceeding 15-20% year-over-year, changes in your financial situation affecting deductible tolerance, or your ${meta.vetType} recommending specialist care not covered by your current plan. When switching insurers, be aware that conditions diagnosed under the previous policy may be classified as pre-existing by the new provider. For ${name} with established health histories involving ${topConditions[0] || 'breed-typical conditions'}, maintaining continuous coverage with a single insurer often provides the strongest protection against coverage gaps.`,
        `Regularly reassessing insurance coverage for ${name} prevents both over-insurance (wasting money on unnecessary add-ons) and under-insurance (discovering gaps during an emergency). Evaluate your policy at each annual renewal: has your ${name}'s health status changed? Have new ${meta.groupLabel}-specific treatment options become available? Has the insurer modified its coverage terms? As ${name} ages into the senior portion of their ${data.lifespan} lifespan, consider upgrading to policies with higher annual maximums and lower deductibles to accommodate increasing claim frequency. If your ${name} has remained healthy, you may benefit from adjusting to a higher deductible to reduce premiums—but only if you maintain adequate emergency savings. Never let ${name}'s coverage lapse, even briefly, as reinstatement may trigger new waiting periods and pre-existing condition reviews.`,
      ])}</p>`;
}

function generateCostContent(name, data, meta) {
  const costStr = data.costItems.length > 0
    ? data.costItems.slice(0, 3).map(c => `${c.category}: ${c.amount}`).join(', ')
    : 'food, veterinary care, and supplies';
  const sz = sizeCategory(data.size);

  // Size-conditional cost ranges
  const firstYearRange = {
    tiny: '$1,200 to $3,000', small: '$1,300 to $3,500', medium: '$1,500 to $4,000',
    large: '$1,800 to $4,500', giant: '$2,200 to $5,500',
  };
  const annualFoodRange = {
    tiny: '$150-$400', small: '$200-$500', medium: '$300-$800',
    large: '$500-$1,200', giant: '$700-$1,500',
  };
  const annualTotalRange = {
    tiny: '$800-$2,200', small: '$900-$2,600', medium: '$1,100-$3,300',
    large: '$1,500-$4,000', giant: '$2,000-$5,000',
  };
  const emergencyFundRange = {
    tiny: '$1,000-$2,000', small: '$1,000-$2,500', medium: '$1,500-$3,000',
    large: '$2,000-$4,000', giant: '$2,500-$5,000',
  };
  const lifetimeRange = {
    tiny: '$10,000 to $35,000', small: '$12,000 to $40,000', medium: '$15,000 to $50,000',
    large: '$20,000 to $60,000', giant: '$25,000 to $75,000',
  };

  // Variant intro paragraphs
  const firstYearIntros = [
    `The first year of ${name} ownership involves significant upfront investment beyond the acquisition cost. Initial setup for a ${name} includes a quality ${meta.habitat} ($50-$300 depending on size and type), ${meta.careItem} ($30-$150), food and water dishes ($15-$40), and initial supply of species-appropriate food ($40-$100).`,
    `Bringing home a ${name} requires upfront spending that many new owners underestimate. Beyond the acquisition cost, you'll need a suitable ${meta.habitat} ($50-$300), ${meta.careItem} ($30-$150), feeding supplies ($15-$40), and an initial food supply ($40-$100).`,
    `Year one with a ${name} carries the highest costs due to one-time setup expenses. Budget for a properly sized ${meta.habitat} ($50-$300), essential ${meta.careItem} ($30-$150), food and water provisions ($15-$40), and a quality initial food supply ($40-$100).`,
    `The financial reality of your first year with ${name} starts with setup costs that you'll largely not repeat. Essential investments include an appropriate ${meta.habitat} ($50-$300), ${meta.careItem} ($30-$150), and feeding essentials ($55-$140 combined).`,
  ];

  // Variant hidden cost paragraphs
  const hiddenCostVariants = [
    `Beyond obvious expenses, ${name} ownership includes frequently overlooked costs. Pet deposits or monthly pet rent for renters can add $25-$75 monthly. Travel boarding or pet-sitting during vacations runs $25-$75 per day for ${meta.termPlural} of this size. Emergency veterinary care (which statistics show over 50% of ${meta.termPlural} need at some point) can cost $1,000-$5,000+ per incident. Behavioral training beyond basics may run $50-$150 per session. Replacement of ${meta.habitat} components and wear items adds up over time. Home modifications for ${name} safety can cost $100-$500 initially.`,
    `Several recurring expenses catch ${name} owners off guard. Housing-related costs (pet deposits, monthly pet rent, or increased homeowner insurance) add $25-$100 monthly for many households. Travel creates a secondary cost center: boarding runs $25-$75 daily, and flight-friendly carriers or health certificates add $50-$300 per trip. Cleaning supplies, odor management products, and household wear from ${name} ownership total $100-$400 annually. Seasonal costs like flea/tick prevention, weather-appropriate gear, and holiday boarding during peak pricing create periodic budget spikes.`,
    `The costs that surprise most ${name} owners fall outside the standard care budget. Rental housing restrictions mean pet deposits ($200-$500 one-time) and pet rent ($25-$75 monthly). Emergency care events—statistically likely at least once over ${data.lifespan}—can cost $1,000-$5,000+. Replacement costs for ${meta.habitat} components, bedding, and worn supplies average $150-$400 annually. If your ${name} develops behavioral challenges, professional intervention runs $50-$150 per session. Home damage from even well-behaved ${meta.termPlural} (scratched floors, stained carpets, chewed items) adds up silently over years.`,
  ];

  // Variant cost-saving paragraphs
  const costSavingVariants = [
    `Strategic spending reduces ${name} ownership costs without compromising care quality. Buy food in bulk through subscription services for 10-35% savings. Maintain a consistent preventive care schedule to catch health issues early when treatment is less expensive. Learn basic grooming tasks appropriate for ${name}'s ${data.shedding.toLowerCase()} maintenance needs to reduce professional grooming visits. Compare pet insurance quotes annually and switch if a better value option becomes available. Join ${meta.groupLabel}-specific owner communities to find recommendations for affordable ${meta.vetType} services.`,
    `Smart budgeting for ${name} starts with targeting the largest expense categories. Autoship food subscriptions save 5-35% compared to retail pricing for the same brands. Preventive veterinary wellness plans ($25-$50 monthly) often cost less than paying for individual annual services. DIY grooming for routine maintenance between professional visits can cut grooming costs by 40-60%. Generic medications (with ${meta.vetType} approval) can replace brand-name prescriptions at 30-70% savings. Buying supplies during annual sales events and stocking up on non-perishable items provides significant cumulative savings.`,
    `Reducing ${name} ownership costs requires strategic choices, not cutting corners on care. The single highest-impact strategy is preventive health maintenance—every $1 spent on prevention saves an estimated $3-$5 in treatment costs. Food is the largest recurring expense; buy the best quality you can afford from warehouse clubs or subscription services rather than premium retail channels. Invest in durable, high-quality ${meta.habitat} components upfront rather than replacing cheap alternatives repeatedly. Tax deductions for service animals (if applicable), pet-related home office deductions, and medical expense deductions can offset some costs. Track all expenses to identify your highest-impact savings opportunities.`,
  ];

  return `
      <h2>First-Year Cost Breakdown for ${name}</h2>
      <p>${pickVariant(name, firstYearIntros)} First-year veterinary costs for ${name} include the initial health examination ($50-$150), vaccination series or wellness checks ($100-$300), spay/neuter or initial procedures if applicable ($200-$600), and microchipping ($40-$60). Training or behavioral guidance for a new ${name} may add $100-$400. Total first-year costs for ${name} typically range from ${firstYearRange[sz] || firstYearRange.medium}, depending on acquisition source and care choices.</p>

      <h3>Best for Budget-Conscious ${name} Owners</h3>
      <p>Prioritize essential veterinary care and quality nutrition. Many ${meta.vetType} offices offer wellness packages for new ${meta.termPlural} that bundle services at a 15-25% discount compared to individual appointments.</p>

      <h2>Recurring Annual Expenses for ${name}</h2>
      <p>After the initial setup, annual ${name} care costs stabilize into predictable categories. Food for a ${data.size} ${meta.term} runs ${annualFoodRange[sz] || annualFoodRange.medium} annually depending on diet quality. Routine ${meta.vetType} visits with standard wellness screenings cost $200-$500 per year. ${meta.habitat.charAt(0).toUpperCase() + meta.habitat.slice(1)} maintenance and replacement supplies average $100-$300 annually. Grooming needs for ${name}, given their ${data.shedding.toLowerCase()} shedding/maintenance profile, run $0-$600 per year depending on professional grooming frequency. Insurance premiums add $360-$840 annually. Toys, treats, and enrichment items for a ${name} with ${data.exerciseNeeds.toLowerCase()} activity needs average $100-$300 per year. Total recurring annual cost for ${name}: ${annualTotalRange[sz] || annualTotalRange.medium}.</p>

      <h3>Best for Reducing Recurring Costs</h3>
      <p>Autoship programs from retailers like Chewy save 5-35% on recurring food and supply purchases for ${name}. Buying in bulk and maintaining preventive health care avoids costly emergency interventions.</p>

      <h2>Hidden Costs Most ${name} Owners Overlook</h2>
      <p>${pickVariant(name + 'hidden', hiddenCostVariants)} ${name} owners should maintain an emergency fund of ${emergencyFundRange[sz] || emergencyFundRange.medium} specifically for unexpected ${meta.term} expenses.</p>

      <h2>Cost-Saving Strategies for ${name} Care</h2>
      <p>${pickVariant(name + 'saving', costSavingVariants)} Consider a pet health savings account for predictable expenses, and use insurance for unpredictable major incidents. Many ${meta.vetType} offices offer payment plans or accept pet-specific credit lines for larger procedures.</p>

      <h3>Best for Value-Conscious Owners</h3>
      <p>Combining preventive care, subscription savings, and appropriate insurance creates the optimal cost-management strategy for ${name} ownership without sacrificing health outcomes.</p>

      <h2>Emergency Fund Recommendations for ${name}</h2>
      <p>Given ${name}'s predisposition to specific health conditions and typical veterinary costs for this ${meta.groupLabel}, financial preparedness is essential. Industry data shows that one in three ${meta.termPlural} requires unexpected emergency veterinary care each year. For ${name}, common emergencies relate to their ${meta.groupLabel}-specific health risks and can cost $800-$5,000+. The recommended emergency fund for a ${name} is ${emergencyFundRange[sz] || emergencyFundRange.medium}, ideally in a dedicated savings account. Building this fund gradually ($50-$100 per month) makes it manageable. This fund supplements insurance by covering deductibles, non-covered treatments, and situations requiring immediate payment before insurance reimbursement arrives.</p>

      <h2>Lifetime Cost Projection for ${name}</h2>
      <p>Understanding the total financial commitment helps prospective ${name} owners make informed decisions. Over a typical ${data.lifespan} lifespan, total ${name} ownership costs break down approximately as follows: acquisition ($300-$3,000+), first-year setup and care (${firstYearRange[sz] || firstYearRange.medium}), annual recurring costs multiplied by remaining years (${annualTotalRange[sz] || annualTotalRange.medium} per year), and end-of-life care ($500-$2,000). The total lifetime cost of owning a ${name} ranges from approximately ${lifetimeRange[sz] || lifetimeRange.medium}+, with significant variation based on health events and care choices. This investment yields immeasurable companionship and joy, but prospective owners should ensure they can sustain these costs comfortably throughout the ${name}'s entire life.</p>

      <h2>Financial Planning Timeline for ${name}</h2>
      <p>${pickVariant(name + 'finplan', [
        `A structured financial plan for ${name} ownership turns large, unpredictable expenses into manageable monthly allocations. Before bringing your ${name} home, budget the initial acquisition and setup costs (${firstYearRange[sz] || firstYearRange.medium}). During the first year, establish automatic monthly transfers of $${sz === 'tiny' || sz === 'small' ? '100-200' : sz === 'large' || sz === 'giant' ? '200-400' : '150-300'} to a dedicated ${meta.term} care account covering food, supplies, and routine ${meta.vetType} care. By month six, aim to have your emergency fund of ${emergencyFundRange[sz] || emergencyFundRange.medium} fully established. Annually, review and adjust your ${name} care budget based on actual spending patterns and any health developments. As your ${name} enters the senior phase of their ${data.lifespan} lifespan, increase the monthly allocation by 30-50% to accommodate rising health care costs. This disciplined approach ensures ${name} receives consistent quality care without financial stress on the household.`,
        `Planning finances for ${name} ownership begins well before the ${meta.term} arrives. Map out acquisition costs, first-year expenses (${firstYearRange[sz] || firstYearRange.medium}), and ongoing annual costs (${annualTotalRange[sz] || annualTotalRange.medium}) across a timeline matched to ${name}'s ${data.lifespan} expected lifespan. Set aside a monthly ${meta.term} care budget that covers predictable expenses while building the emergency reserve of ${emergencyFundRange[sz] || emergencyFundRange.medium}. Many ${name} owners find that pet-specific savings accounts or budgeting apps help track spending by category—food, ${meta.vetType} care, supplies, grooming, and enrichment. Review insurance options in the context of your overall financial plan: the premium-versus-risk calculation differs based on your savings capacity and risk tolerance. As your ${name} ages, shift budget emphasis from supplies and enrichment toward health monitoring and medication costs.`,
        `Long-term financial readiness for ${name} ownership requires year-by-year planning. Year one focuses on setup and initial health costs totaling ${firstYearRange[sz] || firstYearRange.medium}. Years two through the midpoint of ${name}'s ${data.lifespan} lifespan involve steady annual costs of ${annualTotalRange[sz] || annualTotalRange.medium} for routine care, food, and supplies. The latter half of ${name}'s life typically sees costs increase 40-60% as age-related conditions like those common in this ${meta.groupLabel} require more intensive management. Build your financial plan with these phases in mind. A good rule: if you can comfortably allocate $${sz === 'tiny' || sz === 'small' ? '150-250' : sz === 'large' || sz === 'giant' ? '300-500' : '200-350'} monthly for ${name}'s care without impacting household essentials, you are financially prepared for ownership of this ${meta.groupLabel}.`,
      ])}</p>

      <h2>${name} Cost Comparison by Acquisition Source</h2>
      <p>Where you acquire your ${name} significantly impacts both initial costs and long-term expenses. Reputable breeders or specialty sources typically charge $500-$3,000+ for ${name} but often include initial health screening, documentation, and health guarantees that reduce early veterinary surprises. Rescue and adoption sources charge $50-$500, offering substantial savings on acquisition but potentially unknown health histories that increase early diagnostic costs. Regardless of source, budget for an immediate comprehensive ${meta.vetType} examination ($75-$200) to establish your ${name}'s baseline health profile. For ${name} specifically, ${meta.groupLabel}-specific health testing appropriate for their predispositions adds $100-$400 but provides critical information for long-term financial planning. The total cost difference between sources often narrows within the first year when all initial care expenses are accounted for, but the predictability of health outcomes may differ.</p>`;
}

function generateHealthContent(name, data, meta) {
  const conditions = data.healthConditions.length > 0 ? data.healthConditions : ['dental disease', 'obesity', 'joint issues'];
  const topConditions = conditions.slice(0, 5);
  const sz = sizeCategory(data.size);
  const condCount = data.healthConditions.length;

  // Variant intro paragraphs
  const healthIntros = [
    `${name} ${meta.termPlural} have a specific health profile shaped by genetics and physical characteristics. The most commonly diagnosed conditions in ${name} include ${topConditions.join(', ')}. Early detection through regular ${meta.vetType} screenings dramatically improves treatment outcomes and reduces long-term costs.`,
    `The health landscape for ${name} is defined by a combination of genetic predispositions and environmental factors. Key conditions to monitor include ${topConditions.join(', ')}. Proactive health management through routine ${meta.vetType} screenings significantly reduces both the severity and cost of these conditions.`,
    `Understanding ${name}'s health profile starts with recognizing this ${meta.groupLabel}'s most common medical challenges: ${topConditions.join(', ')}. Genetics play a major role, but early intervention through regular ${meta.vetType} examinations can mitigate the impact of most conditions.`,
    `Health-conscious ${name} owners should be aware that this ${meta.groupLabel} has documented predispositions to ${topConditions.join(', ')}. Regular ${meta.vetType} monitoring is the most effective strategy for catching these conditions early, when treatment is most successful and least costly.`,
  ];

  // Conditional health complexity notes based on number of known conditions
  const complexityNote = condCount >= 4
    ? `With ${condCount} documented health predispositions, ${name} has a more complex health profile than many ${meta.termPlural}. This makes comprehensive health screening especially valuable.`
    : condCount >= 2
    ? `${name}'s health predispositions are manageable with consistent preventive care and awareness of early warning signs.`
    : `${name} has a relatively straightforward health profile, though routine screening remains important for early detection of any emerging conditions.`;

  // Variant chronic condition management paragraphs
  const chronicVariants = [
    `Long-term management of chronic health conditions in ${name} requires consistent veterinary partnership and owner commitment. Common chronic conditions in this ${meta.groupLabel} include ${topConditions.slice(0, 3).join(', ')}, each requiring ongoing monitoring and treatment adjustments. Monthly medication costs for chronic conditions in ${name} range from $30-$200 depending on the condition and treatment protocol. Regular follow-up appointments every 3-6 months ($75-$200 each) track condition progression and treatment efficacy. Home monitoring between visits includes tracking symptoms, documenting changes, and maintaining medication schedules. Many ${name} owners find that a health journal or digital tracking app helps communicate patterns to their ${meta.vetType} effectively, leading to better-adjusted treatment plans and improved long-term health outcomes.`,
    `When ${name} develops a chronic condition—whether ${topConditions.slice(0, 2).join(', ')}, or another ongoing issue—management becomes a partnership between owner and ${meta.vetType}. Expect monthly medication costs of $30-$200, with quarterly or semi-annual monitoring visits ($75-$200 each) to track disease progression and adjust treatment. The most successful chronic condition management plans for ${name} incorporate structured home monitoring: daily symptom logs, weekly weight checks, and photo documentation of any physical changes. Digital health tracking apps designed for ${meta.termPlural} can automatically flag concerning trends and generate reports for ${meta.vetType} review. Consistency in medication timing, dietary management, and exercise modification makes the difference between stable management and crisis episodes.`,
    `Chronic conditions in ${name}—including ${topConditions.slice(0, 3).join(', ')}—require a long-term management mindset rather than a cure-and-forget approach. Budget $30-$200 monthly for medications and $75-$200 per follow-up visit every 3-6 months. Work with your ${meta.vetType} to establish clear benchmarks: what stable looks like, what warrants a phone call, and what requires emergency attention. Many ${name} owners underestimate the importance of environmental management alongside medication—temperature regulation, activity modification, and stress reduction all influence chronic condition outcomes. Building a routine that accommodates your ${name}'s health needs becomes second nature within a few months and significantly improves quality of life.`,
  ];

  // Size-conditional emergency cost ranges
  const emergencyCostNote = sz === 'large' || sz === 'giant'
    ? `For ${name} at their larger size, emergency procedures tend toward the higher end of cost ranges due to increased anesthesia, medication dosing, and surgical complexity.`
    : sz === 'tiny' || sz === 'small'
    ? `Smaller ${meta.termPlural} like ${name} may face lower surgical costs but are more vulnerable to rapid deterioration, making speed of emergency response even more critical.`
    : `For ${name} at a ${data.size} build, emergency costs typically fall within standard ranges for this ${meta.groupLabel}.`;

  return `
      <h2>Common Health Conditions in ${name}</h2>
      <p>${pickVariant(name, healthIntros)} ${complexityNote} ${name} owners should schedule wellness examinations at least annually for adults and semi-annually for seniors. Breed-specific health registries and DNA testing can identify genetic predispositions before symptoms appear, enabling proactive management.</p>

      <h3>Best for Preventive Health Screening</h3>
      <p>Annual comprehensive wellness panels including bloodwork, urinalysis, and species-appropriate imaging give ${name} owners the best early warning system for developing conditions.</p>

      <h2>Preventive Care Investment for ${name}</h2>
      <p>Investing in preventive care for ${name} is significantly more cost-effective than treating advanced conditions. Core preventive services include annual wellness examinations ($50-$150), species-appropriate vaccination protocols ($75-$200 annually), dental cleaning and oral health maintenance ($200-$500 annually), and parasite prevention ($100-$300 annually). For ${name} specifically, preventive screening for ${topConditions[0] || 'common conditions'} costs $100-$300 but can save $2,000-$8,000 in emergency treatment costs. Nutritional counseling tailored to ${name}'s ${data.size} build and ${data.exerciseNeeds.toLowerCase()} activity requirements helps prevent obesity-related complications. Preventive care typically costs $500-$1,200 annually but reduces lifetime veterinary expenses by 30-50% compared to reactive-only care approaches.</p>

      <h3>Best for Long-Term Health Outcomes</h3>
      <p>Combining regular ${meta.vetType} visits, appropriate nutrition, and breed-specific screening protocols gives ${name} the strongest foundation for a healthy life spanning their full ${data.lifespan} potential.</p>

      <h2>Emergency Veterinary Cost Ranges for ${name}</h2>
      <p>Emergency care costs for ${name} vary significantly by condition severity and geographic location. Common emergency scenarios include acute illness episodes ($500-$2,500), trauma or injury ($1,000-$5,000), surgical emergencies ($2,000-$7,000), and intensive hospitalization ($1,000-$3,000 per day). For ${name} specifically, emergencies related to ${topConditions[0] || 'their common health conditions'} represent the most frequent emergency presentations. ${emergencyCostNote} After-hours and weekend emergency clinics typically charge 25-50% more than regular-hours visits. Having a relationship with a 24-hour emergency veterinary facility before a crisis occurs ensures faster response when your ${name} needs urgent care.</p>

      <h2>Age-Related Health Cost Timeline for ${name}</h2>
      <p>Health-related expenses for ${name} follow a predictable pattern across their ${data.lifespan} lifespan. Years one through two incur higher costs for initial health setup including vaccinations, spay/neuter considerations, and baseline health screening. Adult maintenance years feature relatively stable costs of $500-$1,500 annually for routine care. Starting around the midpoint of the ${data.lifespan} lifespan, ${name} ${meta.termPlural} begin requiring more frequent monitoring as age-related conditions emerge. The final quarter of lifespan typically sees a 2-3x increase in veterinary costs as chronic conditions require ongoing management. For ${name}, conditions like ${topConditions.slice(0, 2).join(' and ')} often intensify in senior years, requiring medication adjustments, specialist consultations, and more frequent ${meta.vetType} visits.</p>

      <h3>Best for Senior ${name} Health Management</h3>
      <p>Semi-annual wellness visits with comprehensive senior panels, combined with at-home health monitoring, provide the most cost-effective approach to managing aging-related conditions in ${name}.</p>

      <h2>Specialist Care Considerations for ${name}</h2>
      <p>Certain ${name} health conditions require specialist veterinary care beyond general practice capabilities. ${topConditions[0] ? `For ${topConditions[0]}, veterinary specialists charge $200-$500 for initial consultation plus $500-$5,000 for advanced diagnostics and treatment.` : 'Specialist consultations for breed-specific conditions typically range from $200-$500 for initial assessment.'} Orthopedic specialists, dermatologists, cardiologists, and internal medicine specialists all see ${name} patients for ${meta.groupLabel}-specific conditions. Referral to a specialist typically occurs when a condition doesn't respond to standard treatment or requires advanced diagnostics. Travel to specialist facilities may add additional costs for ${name} owners in rural areas. Maintaining a specialist referral from your primary ${meta.vetType} often streamlines appointment scheduling and insurance claim processing.</p>

      <h2>Managing Chronic Conditions in ${name}</h2>
      <p>${pickVariant(name + 'chronic', chronicVariants)}</p>

      <h2>Wellness Monitoring and Early Detection for ${name}</h2>
      <p>${pickVariant(name + 'wellness', [
        `Proactive wellness monitoring for ${name} catches health issues at their most treatable and least expensive stage. Establish baseline health metrics during your ${name}'s first comprehensive examination: weight, body condition score, bloodwork panels, and any species-appropriate screening tests for this ${meta.groupLabel}. At home, conduct weekly health checks noting changes in appetite, energy level, mobility, coat condition, and elimination patterns. For ${name} with predispositions to ${topConditions[0] || 'common conditions'}, ask your ${meta.vetType} about targeted early-detection protocols—these often cost $100-$300 per screening but can identify problems months before symptoms appear. A health journal documenting your ${name}'s normal behaviors and measurements provides invaluable comparison data when something changes. Digital pet health apps can track trends and alert you to gradual shifts that might otherwise go unnoticed across ${name}'s ${data.lifespan} lifespan.`,
        `Early detection dramatically reduces treatment costs for ${name}. Conditions like ${topConditions[0] || 'those common in this ' + meta.groupLabel} caught early may cost $300-$1,000 to manage versus $3,000-$8,000+ once advanced. Build a monitoring routine: weigh your ${name} monthly, check eyes, ears, teeth, and skin weekly, and note any changes in behavior or eating patterns. Schedule blood panels and wellness screenings at least annually for adult ${name} ${meta.termPlural} and semi-annually once they enter the senior portion of their ${data.lifespan} lifespan. Discuss ${meta.groupLabel}-specific genetic testing with your ${meta.vetType}—DNA tests ($100-$300) can identify predispositions before symptoms manifest, enabling preventive strategies that reduce lifetime health costs. Keep all health records organized and accessible so any ${meta.vetType} can quickly review your ${name}'s history.`,
        `Systematic health tracking for ${name} transforms reactive veterinary visits into proactive health management. Create a baseline profile during your ${name}'s initial ${meta.vetType} evaluation including weight, vital ranges, and species-appropriate lab values. Monthly home assessments should cover physical condition, behavioral changes, and eating or elimination pattern shifts. For ${name} ${meta.termPlural} predisposed to ${topConditions.slice(0, 2).join(' and ')}, your ${meta.vetType} may recommend condition-specific screening intervals more frequent than annual visits. The cost of a comprehensive wellness panel ($150-$400) is a fraction of emergency diagnostic workups ($500-$2,000+). Trends in your ${name}'s health data over months and years reveal gradual changes that single-point measurements miss entirely—making consistent tracking one of the most cost-effective health investments for this ${meta.groupLabel}.`,
      ])}</p>

      <h3>Best for Health Cost Predictability</h3>
      <p>Combining comprehensive pet insurance with a dedicated health savings fund gives ${name} owners the strongest protection against unexpected veterinary expenses. Preventive care investments of $500-$1,200 annually consistently reduce lifetime emergency and specialist costs by 30-50% for this ${meta.groupLabel}.</p>`;
}

function generateFirstTimeContent(name, data, meta) {
  const traits = data.temperament.split(',').map(t => t.trim());
  const sz = sizeCategory(data.size);
  const ex = exerciseCategory(data.exerciseNeeds);
  const cl = careLevelCategory(data.careLevel);

  // Variant lifestyle assessment intros
  const lifestyleIntros = [
    `Before committing to a ${name}, honestly evaluate whether your lifestyle can accommodate this ${meta.groupLabel}'s specific needs. ${name} ${meta.termPlural} are known for their ${traits.slice(0, 3).join(', ').toLowerCase()} nature, which means they thrive with owners who can provide ${data.exerciseNeeds.toLowerCase()} exercise and consistent engagement.`,
    `Choosing a ${name} is a decision that should be driven by lifestyle compatibility, not just affection for the ${meta.groupLabel}. With their ${traits.slice(0, 3).join(', ').toLowerCase()} temperament and ${data.exerciseNeeds.toLowerCase()} energy demands, ${name} ${meta.termPlural} need owners who can genuinely match their daily requirements.`,
    `The most important question before getting a ${name} isn't whether you want one—it's whether your daily life realistically supports one. This ${meta.groupLabel}'s ${traits.slice(0, 2).join(' and ').toLowerCase()} personality thrives with ${data.exerciseNeeds.toLowerCase()} engagement and structured routines.`,
    `A ${name} will shape your daily routine for the next ${data.lifespan}, so realistic self-assessment matters more than enthusiasm. This ${meta.groupLabel} brings ${traits.slice(0, 2).join(' and ').toLowerCase()} energy that requires ${data.exerciseNeeds.toLowerCase()} daily commitment from their owner.`,
  ];

  // Care level conditional recommendation
  const careLevelAdvice = {
    low: `${name} is considered a lower-maintenance ${meta.groupLabel}, making it a reasonable choice for first-time ${meta.term} owners who are committed to basic care routines.`,
    moderate: `${name} has moderate care demands that suit owners with some preparation and willingness to learn. First-time owners who do their research can succeed with this ${meta.groupLabel}.`,
    high: `${name} has demanding care requirements that may challenge first-time owners. Consider whether you have the time, patience, and resources for this ${meta.groupLabel}'s higher-than-average needs.`,
    expert: `${name} is considered an advanced-level ${meta.groupLabel} that experienced ${meta.term} owners are best equipped to handle. First-time owners should seriously evaluate whether they can meet this ${meta.groupLabel}'s expert-level care demands.`,
  };

  // Variant mistakes paragraphs
  const mistakesVariants = [
    `First-time ${name} owners frequently make avoidable errors that impact their ${meta.term}'s wellbeing. The most common mistake is inadequate research: understanding ${name}'s ${data.exerciseNeeds.toLowerCase()} exercise needs, ${data.shedding.toLowerCase()} grooming requirements, and health predispositions before acquisition prevents mismatched expectations. Overfeeding is another frequent issue; ${name} ${meta.termPlural} at ${data.size} require carefully measured portions, not free-feeding. Skipping early socialization limits your ${name}'s comfort in varied environments. Inconsistent rules and boundaries confuse ${meta.termPlural} with ${traits[0] ? traits[0].toLowerCase() : 'intelligent'} temperaments. Neglecting dental care leads to preventable health issues.`,
    `New ${name} owners commonly stumble in predictable ways. The biggest error is underestimating time commitment—${ex === 'high' || ex === 'very-high' ? 'this high-energy ' + meta.groupLabel + ' needs daily exercise that cannot be skipped' : 'even with ' + data.exerciseNeeds.toLowerCase() + ' needs, daily interaction is non-negotiable'}. Many new owners also buy equipment before researching what ${name} actually needs, wasting money on wrong-sized ${meta.habitat} setups or inappropriate accessories. Another critical mistake is delayed veterinary establishment: your ${name} should see a ${meta.vetType} within the first week, not the first month. Inconsistent boundaries during the initial weeks create behavioral problems that become exponentially harder to correct later.`,
    `The mistakes that derail new ${name} ownership are almost always preventable with preparation. Mistake one: choosing ${name} based on appearance rather than lifestyle fit—this ${meta.groupLabel}'s ${data.exerciseNeeds.toLowerCase()} energy and ${data.careLevel.toLowerCase()} care demands must match your reality. Mistake two: the "figure it out as we go" approach to nutrition and healthcare, which leads to reactive spending instead of planned budgeting. Mistake three: socializing too aggressively or not at all—${name}'s ${traits[0] ? traits[0].toLowerCase() : 'natural'} temperament requires gradual, positive exposure to new experiences. Mistake four: comparing your ${name}'s progress to other ${meta.termPlural} online, which creates unrealistic expectations and unnecessary anxiety.`,
  ];

  // Variant care team paragraphs
  const careTeamVariants = [
    `A strong support network makes ${name} ownership more manageable and rewarding. Your primary ${meta.vetType} should have experience with this ${meta.groupLabel} and offer both wellness and emergency guidance. If your area has ${meta.groupLabel}-specific specialists, establish a referral relationship early. A professional groomer experienced with ${name}'s coat and maintenance requirements saves time and ensures proper care. A qualified trainer or behaviorist who understands ${name}'s ${data.careLevel.toLowerCase()} trainability provides invaluable early guidance. Connect with other ${name} owners through local meetup groups, online forums, and ${meta.groupLabel}-specific communities for practical advice and emotional support. Finally, identify reliable pet sitters or boarding facilities that can accommodate ${name}'s specific needs for times when you're unavailable.`,
    `Building your ${name} care team before you need it prevents crisis-mode decision-making. Start with a ${meta.vetType} who has documented experience with this ${meta.groupLabel}—ask specifically about their caseload of similar ${meta.termPlural}. For grooming, find a professional who knows ${name}'s specific maintenance profile rather than a general groomer learning on the job. ${cl === 'high' || cl === 'expert' ? `Given ${name}'s demanding care level, a professional trainer or behaviorist is strongly recommended rather than optional.` : `A trainer familiar with ${meta.termPlural} of this ${meta.groupLabel} accelerates the early learning curve.`} Identify backup care providers (pet sitters, boarding facilities, trusted friends) for emergencies and travel. Online communities specific to ${name} owners are invaluable for real-world advice that supplements professional guidance.`,
    `No ${name} owner succeeds alone. Assemble your support team early: a primary ${meta.vetType} who knows this ${meta.groupLabel} inside and out, an emergency veterinary contact for after-hours crises, and a grooming professional who understands ${name}'s specific needs. ${ex === 'high' || ex === 'very-high' ? `For an active ${meta.groupLabel} like ${name}, a dog walker or exercise companion for days when you cannot meet their full activity needs is worth the investment.` : `Even with ${data.exerciseNeeds.toLowerCase()} exercise needs, having a backup person who can step in for daily care during illness or travel is essential.`} Pet sitter relationships take time to build—trial runs before actual need reveal compatibility issues. Fellow ${name} owners, both local and online, become your most practical resource for ${meta.groupLabel}-specific questions that professionals may not prioritize.`,
  ];

  return `
      <h2>Is ${name} Right for You? A Lifestyle Assessment</h2>
      <p>${pickVariant(name, lifestyleIntros)} Consider your living space: ${name} requires appropriate ${meta.habitat} setup and enough room for comfortable daily activity. Work schedules matter significantly; ${name} ${meta.termPlural} generally need at least ${ex === 'high' || ex === 'very-high' ? '60-90' : ex === 'low' ? '15-30' : '20-45'} minutes of dedicated interaction daily. ${careLevelAdvice[cl] || careLevelAdvice.moderate} The ${data.lifespan} lifespan commitment means your ${name} will be part of your life through significant life changes.</p>

      <h3>Best for Active Owners</h3>
      <p>${name} ${meta.termPlural} with ${data.exerciseNeeds.toLowerCase()} activity needs pair best with owners who enjoy regular activity and can incorporate ${meta.exercise} into their daily routine.</p>

      <h2>Your First 30 Days with a ${name}</h2>
      <p>The first month with your new ${name} sets the foundation for a successful long-term relationship. Days one through three should focus on decompression: provide a quiet, secure space with their ${meta.habitat}, food, water, and minimal stimulation. During days four through seven, gradually introduce your ${name} to different areas of your home while maintaining their safe base. Schedule your initial ${meta.vetType} visit within the first week to establish baseline health records. Days eight through fourteen are ideal for beginning basic routine establishment including consistent feeding times, exercise schedules, and house rules. During weeks three and four, begin gentle socialization by introducing your ${name} to new people, sounds, and environments at a pace they're comfortable with. Track their eating, elimination, and behavioral patterns to establish what's normal for your individual ${name}.</p>

      <h3>Best for First-Week Essentials</h3>
      <p>Having your ${name}'s ${meta.habitat}, food, ${meta.careItem}, and initial ${meta.vetType} appointment arranged before bringing them home eliminates stressful last-minute shopping during the critical adjustment period.</p>

      <h2>Essential Supplies Checklist for ${name}</h2>
      <p>Preparing your home for a ${name} requires species-specific supplies. Essential items include: a properly sized ${meta.habitat} appropriate for ${data.size} ${meta.termPlural} ($50-$300), species-appropriate food and feeding supplies ($60-$120), ${meta.careItem} ($30-$150), a safe and comfortable resting area ($30-$100), identification tags or microchip registration ($20-$60), basic grooming supplies suited to ${name}'s ${data.shedding.toLowerCase()} maintenance needs ($20-$80), species-appropriate toys and enrichment items for their ${traits[0] ? traits[0].toLowerCase() : 'curious'} personality ($30-$80), waste management supplies ($20-$40 monthly), and a first-aid kit with species-appropriate supplies ($30-$50). Total initial supply cost for ${name}: $290-$980. Prioritize quality on items that affect health and safety; economize on accessories that can be upgraded later.</p>

      <h2>Training Milestones for ${name}</h2>
      <p>Successful training for ${name} respects this ${meta.groupLabel}'s ${data.careLevel.toLowerCase()} trainability profile and natural ${traits[0] ? traits[0].toLowerCase() : 'independent'} tendencies. Weeks one through four: focus on establishing trust and learning your ${name}'s communication signals. Months one through three: introduce basic commands or behavioral expectations using positive reinforcement techniques. Months three through six: expand on foundations with more complex behaviors and begin addressing any ${meta.groupLabel}-specific behavioral tendencies. Months six through twelve: reinforce all learned behaviors in increasingly distracting environments. ${cl === 'low' ? `${name}'s straightforward trainability means most owners can handle basic training independently with good resources.` : cl === 'high' || cl === 'expert' ? `Given ${name}'s more demanding training profile, professional guidance from an experienced trainer is highly recommended, especially during the first six months.` : `${name} owners should expect the training journey to require patience given this ${meta.groupLabel}'s ${data.careLevel.toLowerCase()} learning profile.`} Short, positive sessions of 5-15 minutes work better than lengthy drills.</p>

      <h3>Best for Training Resources</h3>
      <p>Professional trainers experienced with ${meta.termPlural} of this ${meta.groupLabel} provide the most effective guidance for ${name}. Group classes also offer valuable socialization opportunities during the critical developmental window.</p>

      <h2>Common Mistakes New ${name} Owners Make</h2>
      <p>${pickVariant(name + 'mistakes', mistakesVariants)} Underestimating costs results in difficult decisions when ${meta.vetType} bills arrive. Finally, many new owners don't establish a ${meta.vetType} relationship early enough, missing critical early health screening windows.</p>

      <h2>Building a Care Team for Your ${name}</h2>
      <p>${pickVariant(name + 'careteam', careTeamVariants)} Building this team proactively means every aspect of your ${name}'s care is covered.</p>`;
}

function generateHabitatContent(name, data, meta) {
  const sz = sizeCategory(data.size);
  const ex = exerciseCategory(data.exerciseNeeds);

  // Variant space requirement intros
  const spaceIntros = [
    `Proper space allocation for ${name} directly impacts their physical health and behavioral wellbeing. As a ${data.size} ${meta.term}, ${name} needs a living environment that accommodates both resting and active periods.`,
    `The space you provide for ${name} is one of the most impactful decisions you'll make as an owner. This ${data.size} ${meta.term} requires clearly defined zones for rest, activity, and daily routines.`,
    `Getting the habitat right for ${name} prevents a cascade of behavioral and health problems. A ${data.size} ${meta.term} with ${data.exerciseNeeds.toLowerCase()} energy needs specific spatial planning to thrive.`,
    `Space matters more than most new ${name} owners realize. This ${data.size} ${meta.groupLabel} needs an environment designed around their natural activity patterns and physical dimensions.`,
  ];

  // Size-conditional habitat sizing guidance
  const habitatSizeAdvice = {
    tiny: `For tiny ${meta.termPlural} like ${name}, the ${meta.habitat} should be cozy but not cramped—approximately 1.5 times body length is ideal. Over-large spaces can feel insecure for very small ${meta.termPlural}.`,
    small: `Small ${meta.termPlural} like ${name} need a ${meta.habitat} approximately 1.5 to 2 times their body length. The compact size makes it tempting to choose something too small—resist this urge, as even small ${meta.termPlural} need room to move comfortably.`,
    medium: `The ${meta.habitat} should be approximately 1.5 to 2 times your ${name}'s body length in the primary dimension. For ${data.size} ${meta.termPlural} like ${name}, this typically translates to specific size categories recommended by ${meta.groupLabel} experts.`,
    large: `Larger ${meta.termPlural} like ${name} need proportionally larger ${meta.habitat} setups, which significantly impacts both cost and space requirements in your home. Plan for a ${meta.habitat} at least 2 times body length, with reinforced construction for durability.`,
    giant: `Giant ${meta.termPlural} like ${name} require substantial ${meta.habitat} space that many homes struggle to accommodate. The ${meta.habitat} must be extra-large with heavy-duty construction. Measure your available space carefully before purchasing.`,
  };

  // Variant safety-proofing paragraphs
  const safetyVariants = [
    `Making your home safe for ${name} requires addressing hazards specific to this ${meta.groupLabel}. Secure or remove toxic plants common in households, including lilies, philodendrons, and poinsettias. Store cleaning chemicals, medications, and small ingestible objects out of reach. Cover or redirect electrical cords that a curious ${name} might investigate. Install appropriate barriers to prevent access to dangerous areas like balconies, pools, or garages. For ${name} at ${data.size} size, check for gaps or spaces where they could become trapped or escape. Secure window screens and ensure any fans or heating elements are protected.`,
    `Safety-proofing for ${name} is an ongoing process, not a one-time task. Start with the critical hazards: toxic household plants (over 700 common plants are toxic to ${meta.termPlural}), accessible medications (even a single dropped pill can be dangerous), and unsecured cleaning chemicals. For a ${data.size} ${meta.term} like ${name}, pay special attention to ${sz === 'small' || sz === 'tiny' ? 'small spaces where they could hide or become trapped, gaps behind appliances, and reclining furniture mechanisms' : 'items at their height level that could be pulled down, heavy objects that could fall, and access to countertops or high shelves'}. Electrical cords should be covered or routed out of reach. Recheck safety measures every season as household items shift and new hazards emerge.`,
    `A systematic approach to ${name}-proofing your home addresses hazards by room. In the kitchen: secure trash cans, block access to stovetops, and store toxic foods (chocolate, grapes, xylitol) in closed cabinets. In bathrooms: close toilet lids, secure medications in latched cabinets, and keep cleaning supplies locked away. In living areas: secure electrical cords, remove or elevate fragile items within ${name}'s reach, and check houseplants against toxic species lists. In garages and utility rooms: lock away antifreeze (fatally attractive to many ${meta.termPlural}), tools, and chemicals. For ${name} at ${data.size} size, the specific hazard profile ${sz === 'large' || sz === 'giant' ? 'includes counter-surfing, door-bolting, and knocking over heavy items' : sz === 'tiny' || sz === 'small' ? 'includes getting underfoot, squeezing into tight spaces, and choking on small objects' : 'includes a mix of reach-related and curiosity-driven risks'}.`,
  ];

  return `
      <h2>${name} Space Requirements</h2>
      <p>${pickVariant(name, spaceIntros)} The primary ${meta.habitat} should provide enough room for your ${name} to stand up fully, turn around comfortably, and stretch out completely when resting. For ${name} specifically, given their ${data.exerciseNeeds.toLowerCase()} activity level, additional exercise space beyond the ${meta.habitat} is essential. Indoor ${meta.termPlural} of this ${meta.groupLabel} benefit from designated play areas that are safe and enriching. The total living space should allow for separate zones for eating, resting, elimination (if applicable), and activity. Temperature regulation in your ${name}'s space is critical—maintain species-appropriate temperature and humidity levels year-round.</p>

      <h3>Best for Small Living Spaces</h3>
      <p>${sz === 'large' || sz === 'giant' ? `Larger ${meta.termPlural} like ${name} in small spaces require creative solutions: wall-mounted storage to free floor space, outdoor exercise to compensate for limited indoor room, and multi-use furniture that serves both human and ${meta.term} needs.` : `If space is limited, maximize vertical elements and rotation-based enrichment to keep your ${name} stimulated. Multi-functional furniture and collapsible exercise equipment can make smaller spaces work effectively for this ${meta.groupLabel}.`}</p>

      <h2>Choosing the Right ${meta.habitat.charAt(0).toUpperCase() + meta.habitat.slice(1)} Size for ${name}</h2>
      <p>Selecting the correct ${meta.habitat} for ${name} requires attention to this ${meta.groupLabel}'s specific physical dimensions and behavioral needs. ${habitatSizeAdvice[sz] || habitatSizeAdvice.medium} Avoid the common mistake of choosing a ${meta.habitat} that's too small for short-term savings—an undersized environment leads to stress, behavioral issues, and potential health problems. Material quality matters: invest in a durable ${meta.habitat} that will last throughout your ${name}'s ${data.lifespan} lifespan rather than replacing cheaper options repeatedly.</p>

      <h3>Best for Growing ${name}</h3>
      <p>Adjustable or expandable ${meta.habitat} options accommodate ${name}'s growth from juvenile to adult size, saving money while ensuring appropriate space at every life stage.</p>

      <h2>Indoor vs Outdoor Considerations for ${name}</h2>
      <p>The indoor versus outdoor question for ${name} depends on climate, safety, and this ${meta.groupLabel}'s specific environmental tolerances. ${name} ${meta.termPlural} with ${data.temperament.toLowerCase()} traits generally ${ex === 'high' || ex === 'very-high' ? 'benefit from outdoor access for exercise and mental stimulation' : 'thrive primarily indoors with supplemental outdoor exposure'}. Indoor environments offer climate control, protection from predators and hazards, and closer monitoring of health. If providing outdoor time for your ${name}, ensure the space is fully secured with species-appropriate fencing or enclosure, free from toxic plants or chemicals, and supervised at all times. Extreme weather conditions require bringing your ${name} indoors regardless of normal routine. Many ${name} owners find that a combination approach—primary indoor housing with supervised outdoor enrichment—provides the best balance of safety and stimulation.</p>

      <h2>Climate and Environment Factors for ${name}</h2>
      <p>Environmental conditions significantly affect ${name}'s health and comfort. This ${meta.groupLabel} has specific temperature and humidity tolerances that must be maintained in their living space. ${name} ${meta.termPlural} generally prefer temperatures in the species-appropriate comfort zone, and extremes in either direction can cause stress or health emergencies. Humidity levels should be monitored and maintained within acceptable ranges using humidifiers or dehumidifiers as needed. Air quality matters: ensure adequate ventilation in your ${name}'s space without creating drafts. Lighting should follow natural day-night cycles to support healthy circadian rhythms. If your geographic region experiences extreme seasons, plan seasonal adjustments to your ${name}'s ${meta.habitat} setup including heating, cooling, and humidity management.</p>

      <h3>Best for Climate Control</h3>
      <p>Thermostatic heating and cooling systems specifically designed for ${meta.termPlural} ensure your ${name}'s environment stays within the optimal range regardless of external weather conditions.</p>

      <h2>Multi-Pet Household Setup for ${name}</h2>
      <p>If introducing ${name} into a home with existing ${meta.termPlural} or other animals, careful space planning prevents territorial conflicts and stress. Each animal should have their own ${meta.habitat}, feeding station, and resting area. For ${name} with their ${data.temperament.toLowerCase()} temperament, introduction should be gradual over days to weeks, starting with scent exchange before visual or physical contact. Shared common areas should have multiple exit points so no animal feels trapped. Resource guarding is common during transitions; provide duplicate resources (food bowls, water sources, enrichment items) in separate locations. Monitor interactions closely during the first several weeks, and be prepared to separate ${meta.termPlural} if signs of aggression or excessive stress appear.</p>

      <h2>Safety-Proofing Your Home for ${name}</h2>
      <p>${pickVariant(name + 'safety', safetyVariants)} Regular safety audits of your ${name}'s environment every few months catch new hazards as household items and arrangements change over time.</p>

      <h2>Seasonal Habitat Adjustments for ${name}</h2>
      <p>${pickVariant(name + 'seasonal', [
        `${name}'s ${meta.habitat} setup requires seasonal modifications to maintain optimal comfort and safety year-round. During warm months, ensure adequate ventilation and cooling for your ${data.size} ${meta.term}—${meta.termPlural} of this ${meta.groupLabel} can be sensitive to heat stress. Provide shaded rest areas and consider cooling accessories appropriate for ${name}'s size. Cold weather demands insulated resting spots, draft elimination around the ${meta.habitat}, and potentially supplemental heating rated safe for ${meta.termPlural}. Spring and autumn transitions often bring allergens and temperature fluctuations; monitor your ${name}'s comfort during these periods and adjust bedding and environmental controls accordingly. Humidity management is equally important—excessively dry or damp conditions can affect respiratory health and coat condition in ${name} ${meta.termPlural} across their ${data.lifespan} lifespan.`,
        `Adapting your ${name}'s living environment to seasonal changes protects both health and comfort. Summer adjustments for a ${data.size} ${meta.term}: increase water availability, add cooling surfaces, ensure the ${meta.habitat} has adequate airflow, and never expose your ${name} to direct sun in enclosed spaces. Winter modifications: add thermal bedding layers, seal drafts around the ${meta.habitat}, and maintain consistent indoor temperatures. Seasonal parasite prevention affects habitat management too—flea and tick seasons may require more frequent cleaning of your ${name}'s ${meta.habitat} and resting areas. For ${name} with ${data.exerciseNeeds.toLowerCase()} exercise needs, adjust indoor enrichment to compensate when weather limits outdoor activities. Track how your ${name} responds to seasonal shifts and maintain a seasonal setup checklist for efficient transitions.`,
        `Your ${name}'s habitat needs shift with the seasons. In warmer months, a ${data.size} ${meta.term} needs cooling options: frozen treats, cooling mats, and increased air circulation around the ${meta.habitat}. Never leave ${name} in unventilated spaces during heat. Winter preparation includes draft-proofing the ${meta.habitat}, adding extra bedding for warmth, and ensuring heating elements are pet-safe and thermostatically controlled. Transitional seasons require attention to indoor air quality—spring allergens and autumn mold can affect ${name}'s respiratory health. Adjust ${meta.exercise} routines seasonally, bringing more enrichment indoors when outdoor conditions are unfavorable for this ${meta.groupLabel}. These seasonal adjustments, while modest in effort, make a measurable difference in your ${name}'s comfort and health across their ${data.lifespan} lifespan.`,
      ])}</p>`;
}

function generateEnrichmentContent(name, data, meta) {
  const traits = data.temperament.split(',').map(t => t.trim());
  const primaryTrait = traits[0] || 'curious';
  const ex = exerciseCategory(data.exerciseNeeds);
  const cl = careLevelCategory(data.careLevel);

  // Variant energy profile intros
  const energyIntros = [
    `Understanding ${name}'s energy profile is the foundation for effective enrichment planning. With ${data.exerciseNeeds.toLowerCase()} activity requirements and a ${primaryTrait.toLowerCase()} temperament, ${name} ${meta.termPlural} need a specific balance of physical and mental stimulation.`,
    `Effective enrichment for ${name} starts with an honest assessment of this ${meta.groupLabel}'s energy output. A ${primaryTrait.toLowerCase()} ${meta.term} with ${data.exerciseNeeds.toLowerCase()} exercise demands needs daily enrichment that addresses both physical drive and cognitive needs.`,
    `${name}'s ${primaryTrait.toLowerCase()} personality combined with ${data.exerciseNeeds.toLowerCase()} energy levels creates a specific enrichment profile that must be actively managed. Ignoring either the physical or mental component leads to behavioral problems.`,
    `The enrichment equation for ${name} balances two variables: a ${primaryTrait.toLowerCase()} temperament that craves engagement and ${data.exerciseNeeds.toLowerCase()} physical energy that needs a constructive outlet. Getting this balance right is the key to a well-adjusted ${meta.term}.`,
  ];

  // Exercise-conditional duration guidance
  const exerciseDuration = {
    'very-high': '90-120 minutes of species-appropriate physical activity split across at least three sessions',
    high: '60-90 minutes of species-appropriate physical activity divided into at least two sessions',
    moderate: '30-60 minutes of species-appropriate physical activity divided into at least two sessions',
    low: '15-30 minutes of gentle, species-appropriate physical activity in one or two short sessions',
  };

  // Variant DIY enrichment paragraphs
  const diyVariants = [
    `Creative homemade enrichment for ${name} is cost-effective and easily customizable. Food-based DIY ideas include frozen treat puzzles (freeze species-appropriate treats in water or broth), scatter feeding on a snuffle mat or towel, and cardboard box foraging stations with hidden food rewards. Activity-based DIY enrichment includes obstacle courses built from household items, sensory exploration stations using different safe textures and surfaces, and hide-and-seek games that leverage ${name}'s natural ${primaryTrait.toLowerCase()} instincts.`,
    `DIY enrichment for ${name} taps into natural behaviors without expensive commercial products. Transform mealtime into a mental workout by hiding food portions around a safe area for foraging practice. Create textured exploration stations using different fabrics, surfaces, and materials for sensory stimulation. Build simple agility obstacles from household items: cushion tunnels, blanket tents, and cardboard mazes scaled for ${name}'s ${data.size} frame. ${cl === 'high' || cl === 'expert' ? `For an intelligent ${meta.groupLabel} like ${name}, increase DIY puzzle complexity over time—start with single-step challenges and progress to multi-step sequences.` : `Keep DIY puzzles at an achievable difficulty level; ${name} should succeed at least 70% of the time to stay motivated.`}`,
    `The best DIY enrichment for ${name} costs almost nothing but delivers high-value stimulation. Repurpose muffin tins as puzzle feeders by covering compartments with tennis balls or safe lids. Create scent trails using diluted food extract for tracking games that engage ${name}'s natural detection abilities. Fashion tug and retrieval toys from braided fleece strips or old towels. ${ex === 'high' || ex === 'very-high' ? `For ${name}'s high energy levels, DIY obstacle courses with progressively increasing challenges burn physical energy while building confidence and coordination.` : `Calmer enrichment like sensory exploration boxes, gentle puzzle feeders, and supervised texture-play suits ${name}'s ${data.exerciseNeeds.toLowerCase()} activity profile.`}`,
  ];

  // Variant weekly schedule paragraphs
  const scheduleVariants = [
    `Structuring enrichment into a weekly schedule ensures consistent stimulation for your ${name} while preventing caregiver burnout. A sample weekly plan: Monday and Thursday focus on physical exercise with extended ${meta.exercise} sessions. Tuesday and Friday prioritize mental enrichment using puzzle feeders and training sessions. Wednesday and Saturday emphasize social enrichment with interactive play and socialization opportunities. Sunday provides a lighter enrichment day with sensory exploration and relaxed bonding time.`,
    `A structured enrichment calendar prevents both over-stimulation and boredom for ${name}. ${ex === 'high' || ex === 'very-high' ? 'High-energy days (Monday, Wednesday, Friday) should feature vigorous physical activity as the centerpiece, with lighter mental enrichment as a cooldown. Lower-intensity days (Tuesday, Thursday) shift focus to puzzle feeders, training sessions, and cognitive challenges. Weekends offer flexibility for longer outings, social experiences, or catching up on enrichment types that fell short during the week.' : 'Alternate between physical and mental enrichment as the daily focus: physical on Monday, Wednesday, and Friday; cognitive on Tuesday and Thursday; social on Saturday; and a lighter rest-and-explore day on Sunday. This rotation ensures every enrichment category gets regular attention without overwhelming either you or your ' + name + '.'}`,
    `Weekly enrichment planning for ${name} should be consistent but flexible. The framework: designate two days primarily for physical enrichment (${meta.exercise} and active play), two days for cognitive challenges (puzzle feeders, training, and problem-solving), one day for social enrichment (interaction with people or compatible ${meta.termPlural}), and two lighter days that mix gentle activity with rest. ${cl === 'high' || cl === 'expert' ? `Intelligent ${meta.termPlural} like ${name} may need daily cognitive engagement rather than alternating days—even brief 10-minute training or puzzle sessions on "off" days prevent boredom-driven behaviors.` : `For ${name}, maintaining this routine provides the predictability that supports behavioral stability while ensuring all enrichment dimensions are covered.`}`,
  ];

  return `
      <h2>${name} Energy Profile and Enrichment Needs</h2>
      <p>${pickVariant(name, energyIntros)} Under-enriched ${name} ${meta.termPlural} often develop behavioral issues including destructive tendencies, excessive vocalization, repetitive behaviors, and withdrawal. Over-stimulated ${name} ${meta.termPlural} may become anxious or hyperactive. The goal is matching enrichment intensity and variety to your individual ${name}'s needs, which may vary from ${meta.groupLabel} averages based on age, health status, and personality. As a ${data.size} ${meta.term}, ${name} requires enrichment items and activities appropriately scaled to their physical capabilities.</p>

      <h3>Best for High-Energy ${name}</h3>
      <p>Interactive toys that combine physical activity with problem-solving provide the most efficient enrichment for energetic ${name} ${meta.termPlural}, tiring both body and mind simultaneously.</p>

      <h2>Mental Stimulation Activities for ${name}</h2>
      <p>Cognitive enrichment is essential for ${name}, especially given their ${data.careLevel.toLowerCase()} intelligence level. Puzzle feeders force ${name} to work for their food, engaging natural foraging instincts and extending mealtime from minutes to 20-30 minutes of focused mental activity. Scent-based games using hidden treats tap into natural detection abilities. Training new commands or tricks provides structured mental challenges; even 5-minute daily training sessions significantly impact cognitive health. Rotate enrichment items on a three to four-day cycle to maintain novelty without overwhelming your ${name}. For this ${meta.groupLabel}, species-appropriate puzzle difficulty should be gradually increased as your ${name} masters each level. Avoid frustration by ensuring your ${name} can succeed at least 70% of the time during mental enrichment activities.</p>

      <h3>Best for Mental Enrichment</h3>
      <p>Multi-stage puzzle toys and treat-dispensing toys designed for ${meta.termPlural} of ${name}'s size and intelligence level provide the most engaging cognitive challenges while rewarding effort appropriately.</p>

      <h2>Physical Exercise Recommendations for ${name}</h2>
      <p>Physical activity for ${name} should reflect their ${data.exerciseNeeds.toLowerCase()} exercise needs and ${data.size} build. Daily exercise should include ${exerciseDuration[ex] || exerciseDuration.moderate}. For ${name}, effective exercise includes ${meta.exercise} and structured play that elevates heart rate without causing overexertion. Watch for signs of fatigue: heavy breathing, slowing down, reluctance to continue, or lying down during activity. ${name} ${meta.termPlural} with ${data.temperament.toLowerCase()} traits often enjoy varied exercise routines over repetitive ones. Adjust exercise intensity based on weather conditions, age, and health status. Young ${name} ${meta.termPlural} need shorter, more frequent exercise bouts, while adults can handle longer sustained sessions. Senior ${name} benefit from gentle, low-impact activities that maintain mobility without stressing aging joints.</p>

      <h2>Social Enrichment for ${name}</h2>
      <p>Social needs are a critical but often overlooked enrichment category for ${name}. This ${meta.groupLabel}'s ${data.temperament.toLowerCase()} personality means they ${traits[0] && traits[0].toLowerCase().includes('social') ? 'crave regular social interaction' : 'benefit from appropriately structured social experiences'}. Daily interactive time with their primary caregiver is non-negotiable: plan at least 15-30 minutes of focused one-on-one engagement beyond routine care tasks. For ${name} ${meta.termPlural} that enjoy company of their own kind, supervised playdates or group activities can provide valuable peer interaction. However, respect your individual ${name}'s social preferences; forcing interaction causes stress rather than enrichment. If your ${name} is home alone during work hours, consider enrichment strategies like background audio, window perches, or automated interactive toys to provide stimulation.</p>

      <h3>Best for Social ${name}</h3>
      <p>Regular supervised interaction opportunities with compatible ${meta.termPlural} and people satisfy ${name}'s social needs while building confidence and reducing anxiety-related behavioral issues.</p>

      <h2>DIY Enrichment Ideas for ${name}</h2>
      <p>${pickVariant(name + 'diy', diyVariants)} Ensure all DIY items are made from non-toxic, species-safe materials with no small parts that ${name} could ingest. Replace DIY enrichment items when they show wear. Document which DIY activities your ${name} enjoys most for future reference.</p>

      <h2>Weekly Enrichment Schedule for ${name}</h2>
      <p>${pickVariant(name + 'schedule', scheduleVariants)} Within each day, distribute enrichment across morning and evening sessions rather than concentrating all stimulation in one period. Track your ${name}'s engagement and behavioral indicators to optimize the schedule over time for your individual ${meta.term}'s needs and preferences.</p>

      <h2>Signs of Enrichment Success and Adjustment for ${name}</h2>
      <p>${pickVariant(name + 'signs', [
        `Recognizing whether your ${name}'s enrichment program is working helps you refine the approach over time. A well-enriched ${name} demonstrates calm, relaxed behavior between activity periods—no pacing, excessive vocalization, or repetitive movements. Sleep quality improves with proper enrichment; ${name} ${meta.termPlural} should settle easily and rest deeply. Appetite remains consistent and healthy, and your ${name} shows eager anticipation when enrichment time arrives. If your ${name} loses interest in previously enjoyed activities, rotate new items in or increase difficulty. ${data.exerciseNeeds.toLowerCase() === 'high' || data.exerciseNeeds.toLowerCase() === 'very high' ? `High-energy ${meta.termPlural} like ${name} may need enrichment intensity increased periodically as their fitness and confidence grow.` : `For ${name} with ${data.exerciseNeeds.toLowerCase()} activity needs, moderate-intensity enrichment maintains engagement without overstimulation.`} Behavioral regression—destructive behavior, withdrawal, or appetite changes—signals that the enrichment plan needs adjustment.`,
        `Evaluating enrichment effectiveness for ${name} requires observing specific behavioral markers. Positive indicators include: ${name} engages willingly with offered activities, shows appropriate rest-activity cycles matching their ${data.exerciseNeeds.toLowerCase()} energy profile, demonstrates curiosity toward novel items, and maintains healthy body weight. A ${data.size} ${meta.term} with effective enrichment will show reduced stress behaviors and improved response to routine care tasks. Negative indicators—ignoring enrichment items, increased destructive behavior, excessive sleeping, or heightened reactivity—suggest the program needs modification. Adjust by varying activity types, changing the difficulty level, or altering the schedule. Revisit the enrichment plan quarterly and after any major life changes such as household moves, new family members, or health status changes throughout ${name}'s ${data.lifespan} lifespan.`,
        `Measuring enrichment success in ${name} goes beyond simply observing play behavior. Look at the complete behavioral picture: a properly enriched ${name} with ${data.temperament.toLowerCase()} traits will show balanced energy—active during engagement periods and genuinely relaxed during rest. Digestive health often improves with proper enrichment because reduced stress supports gut function. Social behavior should be stable or improving, with your ${name} showing confidence rather than anxiety in routine situations. For this ${meta.groupLabel}, enrichment adequacy also affects coat condition and general vitality. If you notice persistent behavioral concerns despite consistent enrichment, consult your ${meta.vetType} to rule out underlying health issues before assuming the enrichment plan is at fault—pain, sensory changes, and metabolic conditions can mimic enrichment deficiency.`,
      ])}</p>

      <h3>Best for Long-Term Enrichment Planning</h3>
      <p>As ${name} ages through their ${data.lifespan} lifespan, enrichment needs shift from high-intensity physical challenges toward gentler cognitive stimulation and comfort-based activities. Plan for this transition by gradually introducing lower-impact enrichment options alongside current favorites, ensuring your ${name} always has engaging activities appropriate to their current physical and mental capabilities.</p>`;
}

function generateComparisonContent(name1, name2, data1, data2, meta) {
  const traits1 = data1.temperament.split(',').map(t => t.trim()).slice(0, 3);
  const traits2 = data2.temperament.split(',').map(t => t.trim()).slice(0, 3);
  const conditions1 = data1.healthConditions.length > 0 ? data1.healthConditions.slice(0, 3) : ['breed-specific conditions'];
  const conditions2 = data2.healthConditions.length > 0 ? data2.healthConditions.slice(0, 3) : ['breed-specific conditions'];
  const sz1 = sizeCategory(data1.size);
  const sz2 = sizeCategory(data2.size);
  const ex1 = exerciseCategory(data1.exerciseNeeds);
  const ex2 = exerciseCategory(data2.exerciseNeeds);
  const comboKey = name1 + name2;

  // Variant temperament comparison intros
  const temperamentIntros = [
    `The temperament contrast between ${name1} and ${name2} is one of the most significant factors in choosing between these ${meta.termPlural}. ${name1} is characterized by a ${traits1.join(', ').toLowerCase()} personality, while ${name2} tends toward ${traits2.join(', ').toLowerCase()} traits.`,
    `Personality is where ${name1} and ${name2} diverge most clearly. ${name1} brings a ${traits1.join(', ').toLowerCase()} energy to the household, compared to ${name2}'s ${traits2.join(', ').toLowerCase()} disposition. These differences shape every daily interaction.`,
    `Understanding how ${name1} and ${name2} differ in temperament is essential for making the right choice. ${name1}'s ${traits1.join(', ').toLowerCase()} character creates a fundamentally different ownership experience than ${name2}'s ${traits2.join(', ').toLowerCase()} nature.`,
  ];

  // Size-aware cost comparison
  const sizeDiffers = sz1 !== sz2;
  const costComparisonNote = sizeDiffers
    ? `The size difference between ${name1} (${data1.size}) and ${name2} (${data2.size}) significantly impacts costs across food, supplies, and veterinary care. Larger ${meta.termPlural} generally cost 30-60% more in recurring expenses due to higher food consumption, larger equipment needs, and higher medication dosages.`
    : `Both ${name1} and ${name2} are similarly sized at ${data1.size}, so recurring costs for food and supplies are comparable between the two ${meta.groupLabel}s. The primary cost differentials come from health profiles and grooming requirements.`;

  // Variant final recommendation paragraphs
  const finalRecVariants = [
    `The decision between ${name1} and ${name2} ultimately depends on matching ${meta.term} characteristics with your family's specific situation. Choose ${name1} if your lifestyle accommodates their ${data1.exerciseNeeds.toLowerCase()} activity needs, ${data1.shedding.toLowerCase()} grooming requirements, and you're prepared for their ${traits1[0] ? traits1[0].toLowerCase() : 'unique'} temperament. Choose ${name2} if you prefer their ${data2.exerciseNeeds.toLowerCase()} energy level, can manage ${data2.shedding.toLowerCase()} maintenance, and appreciate their ${traits2[0] ? traits2[0].toLowerCase() : 'distinctive'} personality.`,
    `Choosing between ${name1} and ${name2} requires weighing daily lifestyle impact over emotional preference. ${ex1 !== ex2 ? `The exercise gap is significant: ${name1} demands ${data1.exerciseNeeds.toLowerCase()} activity versus ${name2}'s ${data2.exerciseNeeds.toLowerCase()} needs—this alone dictates different daily routines.` : `With similar ${data1.exerciseNeeds.toLowerCase()} exercise needs, the choice pivots on temperament preference and grooming tolerance.`} ${name1}'s ${traits1[0] ? traits1[0].toLowerCase() : 'distinctive'} personality will define your household's dynamic differently than ${name2}'s ${traits2[0] ? traits2[0].toLowerCase() : 'unique'} character. Neither is objectively superior—the better ${meta.term} is the one whose needs you can consistently meet.`,
    `The right choice between ${name1} and ${name2} depends on honest self-assessment rather than breed reputation. Consider your daily schedule (${name1}: ${data1.exerciseNeeds.toLowerCase()} engagement vs ${name2}: ${data2.exerciseNeeds.toLowerCase()}), grooming tolerance (${data1.shedding.toLowerCase()} vs ${data2.shedding.toLowerCase()}), and personality preference (${traits1[0] ? traits1[0].toLowerCase() : 'engaged'} vs ${traits2[0] ? traits2[0].toLowerCase() : 'distinctive'}). If possible, spend time with both ${meta.groupLabel}s before deciding—firsthand experience often reveals preferences that research alone cannot.`,
  ];

  return `
      <h2>Temperament and Personality Differences</h2>
      <p>${pickVariant(comboKey, temperamentIntros)} In daily life, this means ${name1} owners typically experience a ${meta.term} that ${traits1[0] ? `leans toward ${traits1[0].toLowerCase()} behavior` : 'has a distinctive temperament'}, while ${name2} owners find their ${meta.term} ${traits2[0] ? `more inclined toward ${traits2[0].toLowerCase()} tendencies` : 'has its own unique character'}. Neither temperament is objectively better; the right choice depends on your personality and lifestyle preferences.</p>

      <h3>Best for Families with Children</h3>
      <p>Evaluate each ${meta.groupLabel}'s interaction style with children. ${name1}'s ${traits1[0] ? traits1[0].toLowerCase() : 'general'} nature and ${name2}'s ${traits2[0] ? traits2[0].toLowerCase() : 'unique'} temperament each present different dynamics with younger family members.</p>

      <h2>Health and Lifespan Comparison</h2>
      <p>${name1} has a typical lifespan of ${data1.lifespan}, while ${name2} lives approximately ${data2.lifespan}. Health profiles differ significantly between these ${meta.termPlural}. ${name1} is predisposed to ${conditions1.join(', ')}, with associated veterinary costs for monitoring and treatment. ${name2} faces its own health challenges including ${conditions2.join(', ')}. ${conditions1.length !== conditions2.length ? `${name1} has ${conditions1.length} documented predispositions compared to ${conditions2.length} for ${name2}, though condition count alone doesn't determine overall health burden—severity and treatability matter more.` : 'Both share a similar number of documented health predispositions, though the specific conditions and their management requirements differ.'} Insurance considerations differ between the two ${meta.termPlural} based on these risk profiles. Prospective owners should discuss ${meta.groupLabel}-specific health screening with a ${meta.vetType} before making their decision.</p>

      <h3>Best for Low-Maintenance Health</h3>
      <p>Compare the number, severity, and manageability of each ${meta.groupLabel}'s common health conditions. Fewer hereditary predispositions generally correlate with lower lifetime veterinary costs.</p>

      <h2>Exercise and Activity Level Differences</h2>
      <p>Activity requirements differ ${ex1 === ex2 ? 'minimally' : 'notably'} between ${name1} and ${name2}. ${name1} requires ${data1.exerciseNeeds.toLowerCase()} levels of exercise and engagement, while ${name2} needs ${data2.exerciseNeeds.toLowerCase()} activity. ${ex1 !== ex2 ? `This difference has major practical implications for daily routines.` : `Similar activity levels mean the daily time commitment is comparable, letting other factors drive the decision.`} ${name1} owners should plan for ${ex1 === 'high' || ex1 === 'very-high' ? '60-90 minutes' : ex1 === 'low' ? '15-30 minutes' : '30-60 minutes'} of daily activity, compared to ${ex2 === 'high' || ex2 === 'very-high' ? '60-90 minutes' : ex2 === 'low' ? '15-30 minutes' : '30-60 minutes'} for ${name2}. Under-exercised ${meta.termPlural} of either ${meta.groupLabel} develop behavioral issues, but the consequences and management strategies differ.</p>

      <h2>Grooming and Maintenance Comparison</h2>
      <p>Daily and periodic maintenance requirements differ between ${name1} and ${name2}. ${name1} has ${data1.shedding.toLowerCase()} grooming needs, while ${name2} requires ${data2.shedding.toLowerCase()} maintenance. Professional grooming costs reflect these differences: ${name1} owners typically spend $${data1.shedding.toLowerCase().includes('high') ? '400-$800' : data1.shedding.toLowerCase().includes('low') ? '0-$200' : '200-$400'} annually on grooming, compared to $${data2.shedding.toLowerCase().includes('high') ? '400-$800' : data2.shedding.toLowerCase().includes('low') ? '0-$200' : '200-$400'} for ${name2}. Beyond professional grooming, at-home maintenance includes regular brushing, bathing, nail care, and dental hygiene. The time commitment for daily grooming and general habitat maintenance is an important lifestyle consideration. Factor grooming costs and time into your total ownership commitment when deciding between these ${meta.termPlural}.</p>

      <h3>Best for Low-Maintenance Owners</h3>
      <p>Compare both the cost and time commitment of grooming each ${meta.groupLabel}. Lower grooming needs translate to both financial savings and more flexible daily schedules.</p>

      <h2>Cost of Ownership Comparison</h2>
      <p>Total ownership costs for ${name1} versus ${name2} differ across several categories. ${costComparisonNote} Key cost differentials include: food costs scale with size (${data1.size} vs ${data2.size}), grooming costs reflect maintenance requirements (${data1.shedding.toLowerCase()} vs ${data2.shedding.toLowerCase()}), and veterinary costs correlate with ${meta.groupLabel}-specific health risks. Insurance premiums also differ based on each ${meta.groupLabel}'s risk profile. Over a complete lifespan, ${name1}'s ${data1.lifespan} expected life and ${name2}'s ${data2.lifespan} expected life mean different total cost horizons—the longer-lived ${meta.term} accumulates more total costs but potentially offers more years of companionship.</p>

      <h2>Which Is Right for Your Family?</h2>
      <p>${pickVariant(comboKey + 'rec', finalRecVariants)} Consult with a ${meta.vetType} about any family-specific concerns such as allergies, living arrangements, or compatibility with existing ${meta.termPlural}. Both ${name1} and ${name2} make wonderful companions for the right owner; the key is honest self-assessment about which ${meta.groupLabel}'s needs you can best fulfill throughout their entire lifespan.</p>

      <h3>Best for First-Time Owners</h3>
      <p>Compare each ${meta.groupLabel}'s care level and trainability. ${name1} rates as ${data1.careLevel.toLowerCase()} while ${name2} is ${data2.careLevel.toLowerCase()}—choose the one whose demands better match your experience level.</p>

      <h2>Feeding and Nutrition Comparison</h2>
      <p>${pickVariant(comboKey + 'feeding', [
        `Dietary requirements differ between ${name1} and ${name2} based on their distinct physical builds and metabolic profiles. ${name1} at ${data1.size} needs caloric intake calibrated to their ${data1.exerciseNeeds.toLowerCase()} activity level, while ${name2} at ${data2.size} requires nutrition matched to their ${data2.exerciseNeeds.toLowerCase()} energy output. ${sz1 !== sz2 ? `The size difference means food costs diverge significantly: smaller ${meta.termPlural} consume less volume but may need calorie-dense formulas, while larger ${meta.termPlural} require bulk quantities of controlled-calorie food.` : `Similar sizing means food costs are comparable, but ingredient requirements may differ based on each ${meta.groupLabel}'s health predispositions.`} ${name1}'s predisposition to ${conditions1[0] || 'health concerns'} may require specialized dietary formulations, while ${name2} may benefit from diets supporting ${conditions2[0] || 'their specific health profile'}. Both ${meta.termPlural} benefit from high-quality, species-appropriate nutrition, but the specific formula, portion size, and feeding schedule will differ.`,
        `Nutrition planning for ${name1} versus ${name2} involves different considerations. ${name1} (${data1.size}, ${data1.exerciseNeeds.toLowerCase()} activity) has different caloric and macronutrient needs than ${name2} (${data2.size}, ${data2.exerciseNeeds.toLowerCase()} activity). Monthly food budgets reflect these differences: expect to spend more on ${sz1 === 'large' || sz1 === 'giant' ? name1 : sz2 === 'large' || sz2 === 'giant' ? name2 : 'the larger ' + meta.term} due to volume requirements. Health-condition-specific dietary needs also differ—${name1}'s associations with ${conditions1[0] || 'species conditions'} may warrant targeted nutrition, while ${name2}'s predisposition to ${conditions2[0] || 'its own health concerns'} calls for different dietary strategies. Prospective owners should factor these recurring nutritional costs and complexity into their comparison of the two ${meta.termPlural}.`,
        `Comparing the feeding needs of ${name1} and ${name2} reveals practical lifestyle differences. ${name1}'s ${data1.size} frame and ${data1.exerciseNeeds.toLowerCase()} energy demands require specific caloric targeting, while ${name2}'s ${data2.size} build and ${data2.exerciseNeeds.toLowerCase()} activity level call for different nutritional proportions. Feeding frequency, portion control challenges, and diet sensitivity patterns vary between these ${meta.termPlural}. ${name1}'s health profile (${conditions1.slice(0, 2).join(', ') || 'breed-typical concerns'}) may necessitate prescription or limited-ingredient diets, while ${name2}'s predispositions (${conditions2.slice(0, 2).join(', ') || 'species-typical conditions'}) have their own dietary implications. The lifetime food cost differential between these two ${meta.termPlural} can reach thousands of dollars depending on diet quality and health-driven modifications.`,
      ])}</p>

      <h2>Living Space and Habitat Requirements</h2>
      <p>${pickVariant(comboKey + 'habitat', [
        `Space requirements for ${name1} versus ${name2} directly impact where and how you live. ${name1} at ${data1.size} needs a ${meta.habitat} appropriately scaled to their dimensions and ${data1.exerciseNeeds.toLowerCase()} activity pattern, while ${name2} at ${data2.size} requires ${meta.habitat} sizing matched to their own build and ${data2.exerciseNeeds.toLowerCase()} energy level. ${sz1 !== sz2 ? `The size difference between these ${meta.termPlural} means distinctly different space commitments—consider your current living situation carefully.` : `Similar sizing means comparable space needs, so the decision comes down to behavioral and temperament differences in how each uses their environment.`} ${name1}'s ${data1.temperament.toLowerCase()} temperament influences how they interact with their living space, while ${name2}'s ${data2.temperament.toLowerCase()} nature creates different environmental needs. Both ${meta.termPlural} benefit from enrichment beyond their primary ${meta.habitat}, but the type and scale of enrichment space differs. Apartment dwellers, suburban homeowners, and rural residents will find different compatibility profiles between ${name1} and ${name2}.`,
        `Habitat compatibility is a practical differentiator between ${name1} and ${name2}. ${name1} requires ${meta.habitat} space suited to a ${data1.size} ${meta.term} with ${data1.exerciseNeeds.toLowerCase()} exercise demands and a ${data1.temperament.toLowerCase()} disposition. ${name2} needs space accommodating their ${data2.size} build, ${data2.exerciseNeeds.toLowerCase()} activity needs, and ${data2.temperament.toLowerCase()} behavioral style. Beyond the primary ${meta.habitat}, consider exercise space: ${ex1 === 'high' || ex1 === 'very-high' ? `${name1} needs substantial active space` : `${name1} can thrive with modest activity areas`}, while ${ex2 === 'high' || ex2 === 'very-high' ? `${name2} demands significant room for exercise` : `${name2} adapts well to moderate activity space`}. Noise levels, destructive potential, and territorial behavior patterns also differ between these two ${meta.groupLabel}s and should factor into your housing assessment.`,
        `Evaluating living space compatibility requires comparing ${name1} and ${name2} across multiple environmental dimensions. ${name1} (${data1.size}, ${data1.temperament.toLowerCase()}) occupies space differently than ${name2} (${data2.size}, ${data2.temperament.toLowerCase()}). Daily activity patterns influence space usage—${name1}'s ${data1.exerciseNeeds.toLowerCase()} energy creates one footprint, while ${name2}'s ${data2.exerciseNeeds.toLowerCase()} activity level creates another. ${meta.habitat.charAt(0).toUpperCase() + meta.habitat.slice(1)} equipment costs reflect size differences: ${sz1 === 'large' || sz1 === 'giant' ? `larger setups for ${name1}` : `standard sizing for ${name1}`} versus ${sz2 === 'large' || sz2 === 'giant' ? `larger equipment for ${name2}` : `standard equipment for ${name2}`}. Consider how each ${meta.term}'s space needs evolve from juvenile through senior stages over their respective ${data1.lifespan} and ${data2.lifespan} lifespans. The best match is the ${meta.term} whose environmental needs align with the space you can realistically provide long-term.`,
      ])}</p>

      <h2>Insurance and Health Coverage Comparison</h2>
      <p>${pickVariant(comboKey + 'insurance', [
        `Insurance planning differs substantially between ${name1} and ${name2} due to their distinct health risk profiles. ${name1}'s predispositions to ${conditions1.slice(0, 2).join(' and ') || 'breed-typical conditions'} create a different insurance calculus than ${name2}'s susceptibility to ${conditions2.slice(0, 2).join(' and ') || 'species-typical conditions'}. Premium estimates reflect these differences: insurers price policies based on ${meta.groupLabel}-specific claim histories, and ${sizeDiffers ? 'the size difference further affects pricing since larger ' + meta.termPlural + ' typically have higher claim amounts' : 'similar sizing means premium differences come primarily from condition prevalence data'}. For ${name1} with a ${data1.lifespan} lifespan versus ${name2} at ${data2.lifespan}, the total premium investment and expected claim value differ proportionally. Prospective owners should obtain insurance quotes for both ${meta.termPlural} before making their decision, as the annual premium difference can reach $200-$600 and compound significantly over each ${meta.term}'s lifetime. Both ${name1} and ${name2} benefit from early enrollment to avoid pre-existing condition exclusions.`,
        `Comparing insurance value between ${name1} and ${name2} requires analyzing each ${meta.groupLabel}'s lifetime health cost trajectory. ${name1} faces health risks from ${conditions1.slice(0, 2).join(' and ') || 'common conditions'} that generate specific claim patterns, while ${name2}'s ${conditions2.slice(0, 2).join(' and ') || 'health profile'} drives different insurance utilization. Over ${name1}'s ${data1.lifespan} lifespan, expected veterinary costs may differ significantly from ${name2}'s ${data2.lifespan} cost horizon. ${sizeDiffers ? `Size-driven cost differences (${data1.size} versus ${data2.size}) affect medication dosing, surgical complexity, and equipment costs—all factors that influence insurance claim amounts.` : `With comparable sizing, cost differences between ${name1} and ${name2} come primarily from condition-specific treatment expenses.`} The insurance decision should factor into your overall ${meta.term} choice: a ${meta.groupLabel} with higher insurance costs may still be the better financial choice if other ownership costs are lower.`,
        `Health coverage requirements diverge between ${name1} and ${name2} based on their genetic health profiles. ${name1} is predisposed to ${conditions1.slice(0, 2).join(' and ') || 'species-specific conditions'}, making coverage for hereditary conditions essential. ${name2}'s risk factors (${conditions2.slice(0, 2).join(' and ') || 'breed-typical concerns'}) require different policy features. Wellness coverage value also differs: ${ex1 !== ex2 ? `${name1}'s ${data1.exerciseNeeds.toLowerCase()} activity level versus ${name2}'s ${data2.exerciseNeeds.toLowerCase()} demands mean different injury risk profiles` : 'similar activity levels mean comparable injury risks, but condition-specific coverage remains the key differentiator'}. Compare lifetime insurance costs carefully—the difference between insuring ${name1} versus ${name2} over their respective lifespans of ${data1.lifespan} and ${data2.lifespan} can total thousands of dollars. This ongoing cost difference is a material factor in the total ownership comparison.`,
      ])}</p>

      <h2>Long-Term Commitment Assessment</h2>
      <p>${pickVariant(comboKey + 'longterm', [
        `Choosing between ${name1} and ${name2} is a commitment spanning ${data1.lifespan} or ${data2.lifespan} respectively. Beyond the daily care differences already outlined, consider how each ${meta.term} fits your life trajectory. ${name1}'s ${data1.temperament.toLowerCase()} temperament and ${data1.exerciseNeeds.toLowerCase()} activity needs must remain compatible with your lifestyle through potential moves, career changes, and family growth. ${name2}'s ${data2.temperament.toLowerCase()} character and ${data2.exerciseNeeds.toLowerCase()} demands create a different long-term compatibility profile. Care complexity evolves with age: ${name1}'s health predispositions (${conditions1[0] || 'breed concerns'}) and ${name2}'s risks (${conditions2[0] || 'species conditions'}) may require increasing management in later years. The ${meta.term} whose senior-care requirements you can most realistically commit to should weigh heavily in your decision. Both ${name1} and ${name2} deserve owners who can provide consistent care from adoption through their final days.`,
        `The long-term view reveals important differences between ${name1} and ${name2}. A ${data1.lifespan} commitment to ${name1} versus ${data2.lifespan} with ${name2} means different duration but also different intensity curves. ${name1} (${data1.size}, ${data1.careLevel.toLowerCase()} care demands) and ${name2} (${data2.size}, ${data2.careLevel.toLowerCase()} care demands) each require sustained dedication but in different ways. Consider your housing stability, travel frequency, work schedule flexibility, and support network when evaluating each ${meta.term}. ${name1}'s ${data1.exerciseNeeds.toLowerCase()} exercise requirements must be met consistently, just as ${name2}'s ${data2.exerciseNeeds.toLowerCase()} activity needs cannot be neglected. The most successful ${meta.term} owners are those who honestly assess their capacity to meet these demands not just today, but five, ten, and fifteen years from now.`,
        `Evaluating ${name1} versus ${name2} as a long-term commitment means projecting your lifestyle compatibility across each ${meta.term}'s full lifespan. ${name1}'s ${data1.lifespan} expected life will include a vibrant youth, stable adulthood, and eventual senior phase with increasing health needs related to ${conditions1[0] || 'breed-typical conditions'}. ${name2}'s ${data2.lifespan} trajectory follows a similar arc but with different condition profiles (${conditions2[0] || 'species-specific concerns'}) and different care demands (${data2.careLevel.toLowerCase()} versus ${data1.careLevel.toLowerCase()}). Financial sustainability matters: can you maintain quality care for either ${meta.term} through economic uncertainty? Emotional readiness is equally important—each ${meta.groupLabel} bonds differently based on their temperament, and the relationship with your ${name1} or ${name2} will become a central part of your daily life.`,
      ])}</p>

      <h3>Best for Making the Final Decision</h3>
      <p>If still undecided between ${name1} and ${name2}, spend time with both ${meta.termPlural} if possible. Visit breeders, rescue organizations, or owners of each ${meta.groupLabel} to observe real-world behavior and care routines. The ${meta.term} that naturally fits your energy, schedule, and living situation will reveal itself through direct experience rather than comparison charts alone. Both ${name1} and ${name2} are excellent ${meta.termPlural} when matched with the right owner and environment.</p>`;
}

// ── Main processing ─────────────────────────────────────────────────

log('Starting content expansion...');

// Load entities
const entities = JSON.parse(fs.readFileSync(ENTITIES_FILE, 'utf-8'));
const entityMap = {};
for (const e of entities) {
  entityMap[`${e.species_group}/${e.slug}`] = e;
}
log(`Loaded ${entities.length} entities`);

// Pre-load breed data for all entities
const breedDataMap = {};
for (const e of entities) {
  const key = `${e.species_group}/${e.slug}`;
  breedDataMap[key] = extractBreedData(e.species_group, e.slug);
}
log(`Extracted breed data for ${Object.keys(breedDataMap).length} entities`);

// Find all commercial HTML files
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
log(`Found ${allFiles.length} commercial pages to expand`);

const BATCH = 100;
let processed = 0;
let skipped = 0;
let expanded = 0;

const DISCLAIMER_PATTERN = '<div style="background:#FEF3C7;border-left:4px solid #F59E0B';

for (let i = 0; i < allFiles.length; i += BATCH) {
  const batch = allFiles.slice(i, i + BATCH);

  for (const filePath of batch) {
    processed++;
    const rel = path.relative(COMM_DIR, filePath);
    const parts = rel.split(path.sep);
    // parts: [species_group, entity_slug, page_file.html]
    if (parts.length < 3) { skipped++; continue; }

    const speciesGroup = parts[0];
    const entitySlug = parts[1];
    const pageFile = parts[2];
    const meta = SPECIES_META[speciesGroup];
    if (!meta) { skipped++; continue; }

    const entityKey = `${speciesGroup}/${entitySlug}`;
    const entity = entityMap[entityKey];
    const breedData = breedDataMap[entityKey];
    if (!entity || !breedData) { skipped++; continue; }

    const displayName = entity.display_name;

    // Determine page type
    const baseName = path.basename(pageFile, '.html');
    let pageType;
    if (baseName.startsWith('vs-')) pageType = 'comparison';
    else pageType = baseName;

    // Generate content based on page type
    let newContent = '';
    try {
      switch (pageType) {
        case 'best-food':
          newContent = generateFoodContent(displayName, breedData, meta);
          break;
        case 'best-insurance':
          newContent = generateInsuranceContent(displayName, breedData, meta);
          break;
        case 'cost-to-own':
          newContent = generateCostContent(displayName, breedData, meta);
          break;
        case 'health-costs':
          newContent = generateHealthContent(displayName, breedData, meta);
          break;
        case 'first-time-owners':
          newContent = generateFirstTimeContent(displayName, breedData, meta);
          break;
        case 'best-habitat-size':
          newContent = generateHabitatContent(displayName, breedData, meta);
          break;
        case 'best-enrichment':
          newContent = generateEnrichmentContent(displayName, breedData, meta);
          break;
        case 'comparison': {
          // Extract second entity slug from vs-{slug}.html
          const otherSlug = baseName.replace('vs-', '');
          const otherKey = `${speciesGroup}/${otherSlug}`;
          const otherEntity = entityMap[otherKey];
          const otherBreedData = breedDataMap[otherKey];
          if (otherEntity && otherBreedData) {
            newContent = generateComparisonContent(
              displayName, otherEntity.display_name,
              breedData, otherBreedData, meta
            );
          } else {
            // Fallback: use basic comparison with generic data
            const fallbackData = {
              quickFacts: {},
              healthConditions: ['species-related conditions'],
              costItems: [],
              size: 'medium',
              lifespan: '10-15 years',
              temperament: 'unique, distinctive',
              exerciseNeeds: 'moderate',
              shedding: 'moderate',
              careLevel: 'moderate',
            };
            const otherName = otherSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            newContent = generateComparisonContent(
              displayName, otherName,
              breedData, fallbackData, meta
            );
          }
          break;
        }
        default:
          skipped++;
          continue;
      }
    } catch (err) {
      log(`Error generating content for ${rel}: ${err.message}`);
      skipped++;
      continue;
    }

    if (!newContent) { skipped++; continue; }

    // Inject content into HTML before disclaimer
    let html = fs.readFileSync(filePath, 'utf-8');
    const disclaimerIdx = html.indexOf(DISCLAIMER_PATTERN);
    if (disclaimerIdx === -1) {
      // Fallback: inject before </article>
      const articleEnd = html.lastIndexOf('</article>');
      if (articleEnd === -1) { skipped++; continue; }
      html = html.slice(0, articleEnd) + newContent + '\n' + html.slice(articleEnd);
    } else {
      html = html.slice(0, disclaimerIdx) + newContent + '\n\n      ' + html.slice(disclaimerIdx);
    }

    fs.writeFileSync(filePath, html, 'utf-8');
    expanded++;
  }

  log(`Batch complete: ${Math.min(i + BATCH, allFiles.length)} / ${allFiles.length} (expanded: ${expanded}, skipped: ${skipped})`);
}

log(`Expansion complete. Total: ${processed}, Expanded: ${expanded}, Skipped: ${skipped}`);
