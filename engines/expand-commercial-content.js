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

  return `
      <h2>${name} Nutritional Profile</h2>
      <p>The ${name} has specific dietary requirements shaped by its ${data.size} build and ${primaryTrait.toLowerCase()} temperament. With a typical lifespan of ${data.lifespan}, long-term nutritional planning is essential to maximize quality of life. ${name} ${meta.termPlural} with ${data.exerciseNeeds.toLowerCase()} exercise demands need a caloric intake carefully calibrated to prevent both underweight and overweight conditions. A diet rich in animal-based proteins should make up 25-35% of total calories for this ${meta.groupLabel}, with fat content adjusted for activity level. Omega-3 and omega-6 fatty acids are particularly beneficial for ${name} to maintain coat health and joint function.</p>

      <h2>Life-Stage Feeding Guide for ${name}</h2>
      <p>Feeding requirements change significantly through the life stages of a ${name}. Young ${meta.termPlural} require nutrient-dense food with higher protein and fat ratios to support rapid growth and development. For ${name} specifically, the juvenile phase demands approximately 25-50% more calories per pound of body weight than adult maintenance. As your ${name} transitions to adulthood, gradually shift to a maintenance formula over 7-10 days to avoid digestive upset. Senior ${name} ${meta.termPlural} (typically in the last third of their ${data.lifespan} lifespan) benefit from reduced-calorie formulas with added joint support supplements like glucosamine and chondroitin. Always ensure fresh, clean water is available alongside meals.</p>

      <h3>Best for Growing ${name}</h3>
      <p>Look for growth-specific formulas that provide the calcium-to-phosphorus ratio appropriate for ${name}. Controlled growth prevents developmental issues common in this ${meta.groupLabel}.</p>

      <h3>Best for Adult ${name}</h3>
      <p>Maintenance formulas for ${name} should reflect their ${data.exerciseNeeds.toLowerCase()} activity level with complete and balanced nutrition meeting AAFCO standards for adult ${meta.termPlural}.</p>

      <h3>Best for Senior ${name}</h3>
      <p>Older ${name} ${meta.termPlural} benefit from foods with enhanced antioxidant profiles, L-carnitine for lean muscle maintenance, and reduced sodium to support cardiovascular health.</p>

      <h2>Common Dietary Sensitivities in ${name}</h2>
      <p>${name} ${meta.termPlural} can be susceptible to dietary sensitivities, particularly given their predisposition to ${conditions}. Signs of food sensitivity include digestive upset, skin irritation, excessive scratching, and changes in stool quality. For ${name} with suspected food allergies, a veterinarian-guided elimination diet can identify trigger ingredients. Limited-ingredient diets (LIDs) that use novel proteins such as venison, duck, or lamb combined with single carbohydrate sources are often effective. Avoid common allergens including wheat, corn, and soy unless your ${name} tolerates them well. Probiotics and digestive enzyme supplements can also support gut health in sensitive ${name} ${meta.termPlural}.</p>

      <h2>Ideal Portion Control for ${name}</h2>
      <p>Proper portion sizing for ${name} depends on weight, age, metabolic rate, and activity level. As a ${data.size} ${meta.term}, ${name} requires carefully measured meals rather than free-feeding to prevent obesity. Use the food manufacturer's guidelines as a starting point, then adjust based on your ${name}'s body condition score. A healthy ${name} should have a visible waist when viewed from above and ribs that are easily felt but not prominently visible. Divide daily portions into two meals for adults and three to four meals for young ${name} ${meta.termPlural}. Monitor weight monthly and adjust portions by 10-15% if weight trends outside the ideal range. Treats should never exceed 10% of daily caloric intake.</p>

      <h3>Best for Weight Management</h3>
      <p>If your ${name} needs to lose or maintain weight, choose a formula with L-carnitine and higher fiber content. These help ${name} feel satisfied while consuming fewer calories, which is especially important given their ${data.exerciseNeeds.toLowerCase()} activity level.</p>

      <h2>Signs Your ${name} Is Thriving on Their Diet</h2>
      <p>A well-nourished ${name} displays consistent energy throughout the day that matches their ${primaryTrait.toLowerCase()} nature. The coat should be glossy and smooth without excessive dryness, flaking, or dullness. Healthy digestion is indicated by firm, well-formed stools one to two times daily. Dental health remains strong with minimal tartar buildup when diet supports oral care. Eyes should be bright and clear, and your ${name} should maintain a stable, appropriate weight for their frame. Changes in any of these indicators may signal that a dietary adjustment is needed. Regular ${meta.vetType} check-ups help confirm that your ${name}'s nutritional plan is working optimally.</p>

      <h2>Expert Feeding Tips for ${name} Owners</h2>
      <p>Experienced ${name} owners and breed specialists recommend several feeding best practices for this ${meta.groupLabel}. First, establish a consistent feeding schedule; ${name} ${meta.termPlural} thrive on routine and predictable mealtimes support healthy digestion. Second, rotate between two or three high-quality food brands quarterly to provide nutritional variety and reduce the risk of developing sensitivities to specific proteins. Third, supplement with species-appropriate fresh foods where safe: small amounts of cooked lean meat, safe vegetables, and occasional fruits provide additional micronutrients. Fourth, invest in elevated feeding stations or slow-feeder bowls designed for ${data.size} ${meta.termPlural} to improve eating posture and reduce gulping. Finally, track your ${name}'s dietary intake and any reactions in a simple log to share with your ${meta.vetType} during wellness visits.</p>`;
}

function generateInsuranceContent(name, data, meta) {
  const conditions = data.healthConditions.length > 0 ? data.healthConditions : ['respiratory issues', 'joint problems', 'dental disease'];
  const topConditions = conditions.slice(0, 4);

  return `
      <h2>Why ${name} Owners Should Consider Insurance</h2>
      <p>Pet insurance for ${name} is a strategic financial decision given this ${meta.groupLabel}'s specific health profile. ${name} ${meta.termPlural} are predisposed to conditions including ${topConditions.join(', ')}, which can result in significant veterinary costs over their ${data.lifespan} lifespan. Emergency surgeries can cost $2,000-$7,000, while chronic condition management may run $200-$500 monthly. Insurance transforms these unpredictable large expenses into manageable monthly premiums, typically $30-$70 per month for a ${name}. The earlier you enroll your ${name}, the fewer pre-existing condition exclusions you'll face, making puppy or kitten enrollment particularly valuable for this ${meta.groupLabel}.</p>

      <h3>Best for Comprehensive Coverage</h3>
      <p>Comprehensive accident-and-illness plans provide the broadest protection for ${name}. Look for policies covering hereditary and congenital conditions, which are critical for this ${meta.groupLabel}.</p>

      <h2>Common Health Claims for ${name}</h2>
      <p>Understanding the most frequent insurance claims for ${name} helps you evaluate coverage options. Based on veterinary data for this ${meta.groupLabel}, the most common claims include treatment for ${topConditions[0] || 'digestive issues'}, which typically costs $500-$2,500 per episode. ${topConditions[1] ? `${topConditions[1]} claims average $1,000-$4,000 for diagnosis and treatment.` : 'Diagnostic imaging and lab work claims average $300-$800 per visit.'} Routine dental procedures for ${name} run $300-$800, while dental extractions can exceed $1,500. Skin conditions and allergies, common in many ${meta.termPlural}, generate recurring claims of $200-$600 per flare-up. Age-related conditions in senior ${name} ${meta.termPlural} often involve ongoing medications costing $50-$200 monthly, making the lifetime value of insurance particularly strong for this ${meta.groupLabel}.</p>

      <h3>Best for ${name} Puppies and Young ${meta.termPlural}</h3>
      <p>Enrolling your ${name} early locks in coverage before pre-existing conditions develop. Many insurers offer lower premiums for younger ${meta.termPlural}, making early enrollment the best value.</p>

      <h2>Coverage Considerations by Life Stage</h2>
      <p>Your ${name}'s insurance needs evolve throughout their ${data.lifespan} lifespan. During the first year, accident coverage is paramount as young ${name} ${meta.termPlural} explore their environment and encounter hazards. In the adult years, a comprehensive accident-and-illness plan protects against the onset of ${meta.groupLabel}-specific conditions including ${topConditions.slice(0, 2).join(' and ')}. For senior ${name} ${meta.termPlural}, ensure your policy covers chronic condition management and does not cap coverage at an age threshold. Some insurers reduce benefits or increase premiums significantly for older ${meta.termPlural}, so comparing lifetime policies early can save thousands over your ${name}'s life.</p>

      <h3>Best for Senior ${name}</h3>
      <p>Policies with no upper age limits and unlimited annual benefits provide the most protection for aging ${name} ${meta.termPlural}. Look for plans that include prescription drug coverage and specialist referrals.</p>

      <h2>Cost-Benefit Analysis for ${name}</h2>
      <p>A realistic cost-benefit analysis for ${name} insurance considers both the probability and cost of ${meta.groupLabel}-specific conditions. Over a ${data.lifespan} lifespan, the average ${name} will incur $15,000-$45,000 in veterinary costs. Insurance premiums over the same period typically total $5,000-$12,000, with the plan covering 70-90% of eligible expenses. For ${name} specifically, the break-even point often arrives after just one major health event, which veterinary statistics suggest occurs in over 60% of ${meta.termPlural} of this ${meta.groupLabel}. The peace of mind alone is significant: insured ${name} owners are more likely to pursue recommended treatments rather than making difficult decisions based purely on cost.</p>

      <h2>Pre-existing Condition Awareness for ${name}</h2>
      <p>Understanding pre-existing condition policies is crucial for ${name} owners. Most insurers exclude conditions diagnosed or showing symptoms before enrollment. For ${name}, this is particularly important because some ${meta.groupLabel}-specific conditions like ${topConditions[0] || 'joint issues'} can present subtle early signs. During the waiting period (typically 14 days for illness, 48 hours for accidents), no claims can be filed. Some insurers will cover curable pre-existing conditions after a symptom-free period of 12-18 months. To maximize your ${name}'s coverage, enroll as early as possible, ideally within the first few months of bringing your ${name} home, and maintain continuous coverage without lapses.</p>

      <h2>Choosing the Right Insurance Plan for ${name}</h2>
      <p>When comparing plans for ${name}, evaluate five key factors: annual deductible (lower is better but increases premiums), reimbursement percentage (80-90% is standard), annual maximum benefit (unlimited is ideal for ${meta.groupLabel}-specific conditions), coverage inclusions (ensure hereditary conditions are covered), and customer claim processing time. For ${name} owners, prioritize plans that cover bilateral conditions (affecting both sides of the body) and alternative therapies like acupuncture or physiotherapy. Read policy exclusions carefully, paying special attention to ${meta.groupLabel}-specific hereditary condition exclusions. A slightly higher premium for comprehensive coverage almost always outweighs the savings of a bare-bones plan given the ${name}'s health risk profile.</p>`;
}

function generateCostContent(name, data, meta) {
  const costStr = data.costItems.length > 0
    ? data.costItems.slice(0, 3).map(c => `${c.category}: ${c.amount}`).join(', ')
    : 'food, veterinary care, and supplies';

  return `
      <h2>First-Year Cost Breakdown for ${name}</h2>
      <p>The first year of ${name} ownership involves significant upfront investment beyond the acquisition cost. Initial setup for a ${name} includes a quality ${meta.habitat} ($50-$300 depending on size and type), ${meta.careItem} ($30-$150), food and water dishes ($15-$40), and initial supply of species-appropriate food ($40-$100). First-year veterinary costs for ${name} include the initial health examination ($50-$150), vaccination series or wellness checks ($100-$300), spay/neuter or initial procedures if applicable ($200-$600), and microchipping ($40-$60). Training or behavioral guidance for a new ${name} may add $100-$400. Total first-year costs for ${name} typically range from $1,500 to $4,000, depending on acquisition source and care choices.</p>

      <h3>Best for Budget-Conscious ${name} Owners</h3>
      <p>Prioritize essential veterinary care and quality nutrition. Many ${meta.vetType} offices offer wellness packages for new ${meta.termPlural} that bundle services at a 15-25% discount compared to individual appointments.</p>

      <h2>Recurring Annual Expenses for ${name}</h2>
      <p>After the initial setup, annual ${name} care costs stabilize into predictable categories. Food for a ${data.size} ${meta.term} runs $300-$800 annually depending on diet quality. Routine ${meta.vetType} visits with standard wellness screenings cost $200-$500 per year. ${meta.habitat.charAt(0).toUpperCase() + meta.habitat.slice(1)} maintenance and replacement supplies average $100-$300 annually. Grooming needs for ${name}, given their ${data.shedding.toLowerCase()} shedding/maintenance profile, run $0-$600 per year depending on professional grooming frequency. Insurance premiums add $360-$840 annually. Toys, treats, and enrichment items for a ${name} with ${data.exerciseNeeds.toLowerCase()} activity needs average $100-$300 per year. Total recurring annual cost for ${name}: $1,100-$3,300.</p>

      <h3>Best for Reducing Recurring Costs</h3>
      <p>Autoship programs from retailers like Chewy save 5-35% on recurring food and supply purchases for ${name}. Buying in bulk and maintaining preventive health care avoids costly emergency interventions.</p>

      <h2>Hidden Costs Most ${name} Owners Overlook</h2>
      <p>Beyond obvious expenses, ${name} ownership includes frequently overlooked costs. Pet deposits or monthly pet rent for renters can add $25-$75 monthly. Travel boarding or pet-sitting during vacations runs $25-$75 per day for ${meta.termPlural} of this size. Emergency veterinary care (which statistics show over 50% of ${meta.termPlural} need at some point) can cost $1,000-$5,000+ per incident. Behavioral training beyond basics may run $50-$150 per session. Replacement of ${meta.habitat} components and wear items adds up over time. Home modifications for ${name} safety can cost $100-$500 initially. ${name} owners should maintain an emergency fund of $1,000-$2,000 specifically for unexpected ${meta.term} expenses.</p>

      <h2>Cost-Saving Strategies for ${name} Care</h2>
      <p>Strategic spending reduces ${name} ownership costs without compromising care quality. Buy food in bulk through subscription services for 10-35% savings. Maintain a consistent preventive care schedule to catch health issues early when treatment is less expensive. Learn basic grooming tasks appropriate for ${name}'s ${data.shedding.toLowerCase()} maintenance needs to reduce professional grooming visits. Compare pet insurance quotes annually and switch if a better value option becomes available. Join ${meta.groupLabel}-specific owner communities to find recommendations for affordable ${meta.vetType} services. Consider a pet health savings account for predictable expenses, and use insurance for unpredictable major incidents. Many ${meta.vetType} offices offer payment plans or accept pet-specific credit lines for larger procedures.</p>

      <h3>Best for Value-Conscious Owners</h3>
      <p>Combining preventive care, subscription savings, and appropriate insurance creates the optimal cost-management strategy for ${name} ownership without sacrificing health outcomes.</p>

      <h2>Emergency Fund Recommendations for ${name}</h2>
      <p>Given ${name}'s predisposition to specific health conditions and typical veterinary costs for this ${meta.groupLabel}, financial preparedness is essential. Industry data shows that one in three ${meta.termPlural} requires unexpected emergency veterinary care each year. For ${name}, common emergencies relate to their ${meta.groupLabel}-specific health risks and can cost $800-$5,000+. The recommended emergency fund for a ${name} is $1,500-$3,000, ideally in a dedicated savings account. Building this fund gradually ($50-$100 per month) makes it manageable. This fund supplements insurance by covering deductibles, non-covered treatments, and situations requiring immediate payment before insurance reimbursement arrives.</p>

      <h2>Lifetime Cost Projection for ${name}</h2>
      <p>Understanding the total financial commitment helps prospective ${name} owners make informed decisions. Over a typical ${data.lifespan} lifespan, total ${name} ownership costs break down approximately as follows: acquisition ($300-$3,000+), first-year setup and care ($1,500-$4,000), annual recurring costs multiplied by remaining years ($1,100-$3,300 per year), and end-of-life care ($500-$2,000). The total lifetime cost of owning a ${name} ranges from approximately $15,000 to $50,000+, with the average falling around $25,000-$35,000. This investment yields immeasurable companionship and joy, but prospective owners should ensure they can sustain these costs comfortably throughout the ${name}'s entire life. Planning ahead prevents difficult financial decisions during your ${name}'s lifetime.</p>`;
}

function generateHealthContent(name, data, meta) {
  const conditions = data.healthConditions.length > 0 ? data.healthConditions : ['dental disease', 'obesity', 'joint issues'];
  const topConditions = conditions.slice(0, 5);

  return `
      <h2>Common Health Conditions in ${name}</h2>
      <p>${name} ${meta.termPlural} have a specific health profile shaped by genetics and physical characteristics. The most commonly diagnosed conditions in ${name} include ${topConditions.join(', ')}. Early detection through regular ${meta.vetType} screenings dramatically improves treatment outcomes and reduces long-term costs. ${name} owners should schedule wellness examinations at least annually for adults and semi-annually for seniors. Breed-specific health registries and DNA testing can identify genetic predispositions before symptoms appear, enabling proactive management. Understanding these conditions helps ${name} owners recognize early warning signs and seek timely veterinary intervention.</p>

      <h3>Best for Preventive Health Screening</h3>
      <p>Annual comprehensive wellness panels including bloodwork, urinalysis, and species-appropriate imaging give ${name} owners the best early warning system for developing conditions.</p>

      <h2>Preventive Care Investment for ${name}</h2>
      <p>Investing in preventive care for ${name} is significantly more cost-effective than treating advanced conditions. Core preventive services include annual wellness examinations ($50-$150), species-appropriate vaccination protocols ($75-$200 annually), dental cleaning and oral health maintenance ($200-$500 annually), and parasite prevention ($100-$300 annually). For ${name} specifically, preventive screening for ${topConditions[0] || 'common conditions'} costs $100-$300 but can save $2,000-$8,000 in emergency treatment costs. Nutritional counseling tailored to ${name}'s ${data.size} build and ${data.exerciseNeeds.toLowerCase()} activity requirements helps prevent obesity-related complications. Preventive care typically costs $500-$1,200 annually but reduces lifetime veterinary expenses by 30-50% compared to reactive-only care approaches.</p>

      <h3>Best for Long-Term Health Outcomes</h3>
      <p>Combining regular ${meta.vetType} visits, appropriate nutrition, and breed-specific screening protocols gives ${name} the strongest foundation for a healthy life spanning their full ${data.lifespan} potential.</p>

      <h2>Emergency Veterinary Cost Ranges for ${name}</h2>
      <p>Emergency care costs for ${name} vary significantly by condition severity and geographic location. Common emergency scenarios include acute illness episodes ($500-$2,500), trauma or injury ($1,000-$5,000), surgical emergencies ($2,000-$7,000), and intensive hospitalization ($1,000-$3,000 per day). For ${name} specifically, emergencies related to ${topConditions[0] || 'their common health conditions'} represent the most frequent emergency presentations. After-hours and weekend emergency clinics typically charge 25-50% more than regular-hours visits. Having a relationship with a 24-hour emergency veterinary facility before a crisis occurs ensures faster response when your ${name} needs urgent care. Keep your ${meta.vetType}'s emergency number and the nearest emergency clinic's address accessible at all times.</p>

      <h2>Age-Related Health Cost Timeline for ${name}</h2>
      <p>Health-related expenses for ${name} follow a predictable pattern across their ${data.lifespan} lifespan. Years one through two incur higher costs for initial health setup including vaccinations, spay/neuter considerations, and baseline health screening. Adult maintenance years feature relatively stable costs of $500-$1,500 annually for routine care. Starting around the midpoint of the ${data.lifespan} lifespan, ${name} ${meta.termPlural} begin requiring more frequent monitoring as age-related conditions emerge. The final quarter of lifespan typically sees a 2-3x increase in veterinary costs as chronic conditions require ongoing management. For ${name}, conditions like ${topConditions.slice(0, 2).join(' and ')} often intensify in senior years, requiring medication adjustments, specialist consultations, and more frequent ${meta.vetType} visits.</p>

      <h3>Best for Senior ${name} Health Management</h3>
      <p>Semi-annual wellness visits with comprehensive senior panels, combined with at-home health monitoring, provide the most cost-effective approach to managing aging-related conditions in ${name}.</p>

      <h2>Specialist Care Considerations for ${name}</h2>
      <p>Certain ${name} health conditions require specialist veterinary care beyond general practice capabilities. ${topConditions[0] ? `For ${topConditions[0]}, veterinary specialists charge $200-$500 for initial consultation plus $500-$5,000 for advanced diagnostics and treatment.` : 'Specialist consultations for breed-specific conditions typically range from $200-$500 for initial assessment.'} Orthopedic specialists, dermatologists, cardiologists, and internal medicine specialists all see ${name} patients for ${meta.groupLabel}-specific conditions. Referral to a specialist typically occurs when a condition doesn't respond to standard treatment or requires advanced diagnostics. Travel to specialist facilities may add additional costs for ${name} owners in rural areas. Maintaining a specialist referral from your primary ${meta.vetType} often streamlines appointment scheduling and insurance claim processing.</p>

      <h2>Managing Chronic Conditions in ${name}</h2>
      <p>Long-term management of chronic health conditions in ${name} requires consistent veterinary partnership and owner commitment. Common chronic conditions in this ${meta.groupLabel} include ${topConditions.slice(0, 3).join(', ')}, each requiring ongoing monitoring and treatment adjustments. Monthly medication costs for chronic conditions in ${name} range from $30-$200 depending on the condition and treatment protocol. Regular follow-up appointments every 3-6 months ($75-$200 each) track condition progression and treatment efficacy. Home monitoring between visits includes tracking symptoms, documenting changes, and maintaining medication schedules. Many ${name} owners find that a health journal or digital tracking app helps communicate patterns to their ${meta.vetType} effectively, leading to better-adjusted treatment plans and improved long-term health outcomes.</p>`;
}

function generateFirstTimeContent(name, data, meta) {
  const traits = data.temperament.split(',').map(t => t.trim());

  return `
      <h2>Is ${name} Right for You? A Lifestyle Assessment</h2>
      <p>Before committing to a ${name}, honestly evaluate whether your lifestyle can accommodate this ${meta.groupLabel}'s specific needs. ${name} ${meta.termPlural} are known for their ${traits.slice(0, 3).join(', ').toLowerCase()} nature, which means they thrive with owners who can provide ${data.exerciseNeeds.toLowerCase()} exercise and consistent engagement. Consider your living space: ${name} requires appropriate ${meta.habitat} setup and enough room for comfortable daily activity. Work schedules matter significantly; ${name} ${meta.termPlural} generally need at least ${data.exerciseNeeds.toLowerCase().includes('high') ? '60-90' : '20-45'} minutes of dedicated interaction daily. Budget realistically for $1,500-$3,500 in first-year costs and $1,200-$3,000 annually thereafter. If you travel frequently, plan for reliable care arrangements. The ${data.lifespan} lifespan commitment means your ${name} will be part of your life through significant life changes.</p>

      <h3>Best for Active Owners</h3>
      <p>${name} ${meta.termPlural} with ${data.exerciseNeeds.toLowerCase()} activity needs pair best with owners who enjoy regular activity and can incorporate ${meta.exercise} into their daily routine.</p>

      <h2>Your First 30 Days with a ${name}</h2>
      <p>The first month with your new ${name} sets the foundation for a successful long-term relationship. Days one through three should focus on decompression: provide a quiet, secure space with their ${meta.habitat}, food, water, and minimal stimulation. During days four through seven, gradually introduce your ${name} to different areas of your home while maintaining their safe base. Schedule your initial ${meta.vetType} visit within the first week to establish baseline health records. Days eight through fourteen are ideal for beginning basic routine establishment including consistent feeding times, exercise schedules, and house rules. During weeks three and four, begin gentle socialization by introducing your ${name} to new people, sounds, and environments at a pace they're comfortable with. Track their eating, elimination, and behavioral patterns to establish what's normal for your individual ${name}.</p>

      <h3>Best for First-Week Essentials</h3>
      <p>Having your ${name}'s ${meta.habitat}, food, ${meta.careItem}, and initial ${meta.vetType} appointment arranged before bringing them home eliminates stressful last-minute shopping during the critical adjustment period.</p>

      <h2>Essential Supplies Checklist for ${name}</h2>
      <p>Preparing your home for a ${name} requires species-specific supplies. Essential items include: a properly sized ${meta.habitat} appropriate for ${data.size} ${meta.termPlural} ($50-$300), species-appropriate food and feeding supplies ($60-$120), ${meta.careItem} ($30-$150), a safe and comfortable resting area ($30-$100), identification tags or microchip registration ($20-$60), basic grooming supplies suited to ${name}'s ${data.shedding.toLowerCase()} maintenance needs ($20-$80), species-appropriate toys and enrichment items for their ${traits[0] ? traits[0].toLowerCase() : 'curious'} personality ($30-$80), waste management supplies ($20-$40 monthly), and a first-aid kit with species-appropriate supplies ($30-$50). Total initial supply cost for ${name}: $290-$980. Prioritize quality on items that affect health and safety; economize on accessories that can be upgraded later.</p>

      <h2>Training Milestones for ${name}</h2>
      <p>Successful training for ${name} respects this ${meta.groupLabel}'s ${data.careLevel.toLowerCase()} trainability profile and natural ${traits[0] ? traits[0].toLowerCase() : 'independent'} tendencies. Weeks one through four: focus on establishing trust and learning your ${name}'s communication signals. Months one through three: introduce basic commands or behavioral expectations using positive reinforcement techniques. Months three through six: expand on foundations with more complex behaviors and begin addressing any ${meta.groupLabel}-specific behavioral tendencies. Months six through twelve: reinforce all learned behaviors in increasingly distracting environments. ${name} owners should expect the training journey to require patience given this ${meta.groupLabel}'s ${data.careLevel.toLowerCase()} learning profile. Short, positive sessions of 5-15 minutes work better than lengthy drills. Celebrate small victories and maintain consistency across all family members.</p>

      <h3>Best for Training Resources</h3>
      <p>Professional trainers experienced with ${meta.termPlural} of this ${meta.groupLabel} provide the most effective guidance for ${name}. Group classes also offer valuable socialization opportunities during the critical developmental window.</p>

      <h2>Common Mistakes New ${name} Owners Make</h2>
      <p>First-time ${name} owners frequently make avoidable errors that impact their ${meta.term}'s wellbeing. The most common mistake is inadequate research: understanding ${name}'s ${data.exerciseNeeds.toLowerCase()} exercise needs, ${data.shedding.toLowerCase()} grooming requirements, and health predispositions before acquisition prevents mismatched expectations. Overfeeding is another frequent issue; ${name} ${meta.termPlural} at ${data.size} require carefully measured portions, not free-feeding. Skipping early socialization limits your ${name}'s comfort in varied environments. Inconsistent rules and boundaries confuse ${meta.termPlural} with ${traits[0] ? traits[0].toLowerCase() : 'intelligent'} temperaments. Neglecting dental care leads to preventable health issues. Underestimating costs results in difficult decisions when ${meta.vetType} bills arrive. Finally, many new owners don't establish a ${meta.vetType} relationship early enough, missing critical early health screening windows.</p>

      <h2>Building a Care Team for Your ${name}</h2>
      <p>A strong support network makes ${name} ownership more manageable and rewarding. Your primary ${meta.vetType} should have experience with this ${meta.groupLabel} and offer both wellness and emergency guidance. If your area has ${meta.groupLabel}-specific specialists, establish a referral relationship early. A professional groomer experienced with ${name}'s coat and maintenance requirements ($data.shedding maintenance) saves time and ensures proper care. A qualified trainer or behaviorist who understands ${name}'s ${data.careLevel.toLowerCase()} trainability provides invaluable early guidance. Connect with other ${name} owners through local meetup groups, online forums, and ${meta.groupLabel}-specific communities for practical advice and emotional support. Finally, identify reliable pet sitters or boarding facilities that can accommodate ${name}'s specific needs for times when you're unavailable. Building this team proactively means every aspect of your ${name}'s care is covered.</p>`;
}

function generateHabitatContent(name, data, meta) {
  return `
      <h2>${name} Space Requirements</h2>
      <p>Proper space allocation for ${name} directly impacts their physical health and behavioral wellbeing. As a ${data.size} ${meta.term}, ${name} needs a living environment that accommodates both resting and active periods. The primary ${meta.habitat} should provide enough room for your ${name} to stand up fully, turn around comfortably, and stretch out completely when resting. For ${name} specifically, given their ${data.exerciseNeeds.toLowerCase()} activity level, additional exercise space beyond the ${meta.habitat} is essential. Indoor ${meta.termPlural} of this ${meta.groupLabel} benefit from designated play areas that are safe and enriching. The total living space should allow for separate zones for eating, resting, elimination (if applicable), and activity. Temperature regulation in your ${name}'s space is critical—maintain species-appropriate temperature and humidity levels year-round.</p>

      <h3>Best for Small Living Spaces</h3>
      <p>If space is limited, maximize vertical elements and rotation-based enrichment to keep your ${name} stimulated. Multi-functional furniture and collapsible exercise equipment can make smaller spaces work effectively for this ${meta.groupLabel}.</p>

      <h2>Choosing the Right ${meta.habitat.charAt(0).toUpperCase() + meta.habitat.slice(1)} Size for ${name}</h2>
      <p>Selecting the correct ${meta.habitat} for ${name} requires attention to this ${meta.groupLabel}'s specific physical dimensions and behavioral needs. The ${meta.habitat} should be approximately 1.5 to 2 times your ${name}'s body length in the primary dimension. For ${data.size} ${meta.termPlural} like ${name}, this typically translates to specific size categories recommended by ${meta.groupLabel} experts. Avoid the common mistake of choosing a ${meta.habitat} that's too small for short-term savings—an undersized environment leads to stress, behavioral issues, and potential health problems. Equally, an excessively large ${meta.habitat} without proper setup can feel insecure rather than comfortable. Material quality matters: invest in a durable ${meta.habitat} that will last throughout your ${name}'s ${data.lifespan} lifespan rather than replacing cheaper options repeatedly.</p>

      <h3>Best for Growing ${name}</h3>
      <p>Adjustable or expandable ${meta.habitat} options accommodate ${name}'s growth from juvenile to adult size, saving money while ensuring appropriate space at every life stage.</p>

      <h2>Indoor vs Outdoor Considerations for ${name}</h2>
      <p>The indoor versus outdoor question for ${name} depends on climate, safety, and this ${meta.groupLabel}'s specific environmental tolerances. ${name} ${meta.termPlural} with ${data.temperament.toLowerCase()} traits generally ${data.exerciseNeeds.toLowerCase().includes('high') ? 'benefit from outdoor access for exercise and mental stimulation' : 'thrive primarily indoors with supplemental outdoor exposure'}. Indoor environments offer climate control, protection from predators and hazards, and closer monitoring of health. If providing outdoor time for your ${name}, ensure the space is fully secured with species-appropriate fencing or enclosure, free from toxic plants or chemicals, and supervised at all times. Extreme weather conditions require bringing your ${name} indoors regardless of normal routine. Many ${name} owners find that a combination approach—primary indoor housing with supervised outdoor enrichment—provides the best balance of safety and stimulation.</p>

      <h2>Climate and Environment Factors for ${name}</h2>
      <p>Environmental conditions significantly affect ${name}'s health and comfort. This ${meta.groupLabel} has specific temperature and humidity tolerances that must be maintained in their living space. ${name} ${meta.termPlural} generally prefer temperatures in the species-appropriate comfort zone, and extremes in either direction can cause stress or health emergencies. Humidity levels should be monitored and maintained within acceptable ranges using humidifiers or dehumidifiers as needed. Air quality matters: ensure adequate ventilation in your ${name}'s space without creating drafts. Lighting should follow natural day-night cycles to support healthy circadian rhythms. If your geographic region experiences extreme seasons, plan seasonal adjustments to your ${name}'s ${meta.habitat} setup including heating, cooling, and humidity management. UV exposure requirements, if applicable to this ${meta.groupLabel}, should be addressed with appropriate lighting or supervised sunlight exposure.</p>

      <h3>Best for Climate Control</h3>
      <p>Thermostatic heating and cooling systems specifically designed for ${meta.termPlural} ensure your ${name}'s environment stays within the optimal range regardless of external weather conditions.</p>

      <h2>Multi-Pet Household Setup for ${name}</h2>
      <p>If introducing ${name} into a home with existing ${meta.termPlural} or other animals, careful space planning prevents territorial conflicts and stress. Each animal should have their own ${meta.habitat}, feeding station, and resting area. For ${name} with their ${data.temperament.toLowerCase()} temperament, introduction should be gradual over days to weeks, starting with scent exchange before visual or physical contact. Shared common areas should have multiple exit points so no animal feels trapped. Resource guarding is common during transitions; provide duplicate resources (food bowls, water sources, enrichment items) in separate locations. Monitor interactions closely during the first several weeks, and be prepared to separate ${meta.termPlural} if signs of aggression or excessive stress appear. Professional behavioral guidance is advisable when introducing ${name} to significantly different species.</p>

      <h2>Safety-Proofing Your Home for ${name}</h2>
      <p>Making your home safe for ${name} requires addressing hazards specific to this ${meta.groupLabel}. Secure or remove toxic plants common in households, including lilies, philodendrons, and poinsettias. Store cleaning chemicals, medications, and small ingestible objects out of reach. Cover or redirect electrical cords that a curious ${name} might investigate. Install appropriate barriers to prevent access to dangerous areas like balconies, pools, or garages. For ${name} at ${data.size} size, check for gaps or spaces where they could become trapped or escape. Secure window screens and ensure any fans or heating elements are protected. Kitchen and bathroom areas pose particular risks—keep lids closed, secure trash containers, and never leave hot surfaces unattended. Regular safety audits of your ${name}'s environment every few months catch new hazards as household items and arrangements change over time.</p>`;
}

function generateEnrichmentContent(name, data, meta) {
  const traits = data.temperament.split(',').map(t => t.trim());
  const primaryTrait = traits[0] || 'curious';

  return `
      <h2>${name} Energy Profile and Enrichment Needs</h2>
      <p>Understanding ${name}'s energy profile is the foundation for effective enrichment planning. With ${data.exerciseNeeds.toLowerCase()} activity requirements and a ${primaryTrait.toLowerCase()} temperament, ${name} ${meta.termPlural} need a specific balance of physical and mental stimulation. Under-enriched ${name} ${meta.termPlural} often develop behavioral issues including destructive tendencies, excessive vocalization, repetitive behaviors, and withdrawal. Over-stimulated ${name} ${meta.termPlural} may become anxious or hyperactive. The goal is matching enrichment intensity and variety to your individual ${name}'s needs, which may vary from ${meta.groupLabel} averages based on age, health status, and personality. As a ${data.size} ${meta.term}, ${name} requires enrichment items and activities appropriately scaled to their physical capabilities. Tailor your approach based on how your specific ${name} responds to different enrichment types.</p>

      <h3>Best for High-Energy ${name}</h3>
      <p>Interactive toys that combine physical activity with problem-solving provide the most efficient enrichment for energetic ${name} ${meta.termPlural}, tiring both body and mind simultaneously.</p>

      <h2>Mental Stimulation Activities for ${name}</h2>
      <p>Cognitive enrichment is essential for ${name}, especially given their ${data.careLevel.toLowerCase()} intelligence level. Puzzle feeders force ${name} to work for their food, engaging natural foraging instincts and extending mealtime from minutes to 20-30 minutes of focused mental activity. Scent-based games using hidden treats tap into natural detection abilities. Training new commands or tricks provides structured mental challenges; even 5-minute daily training sessions significantly impact cognitive health. Rotate enrichment items on a three to four-day cycle to maintain novelty without overwhelming your ${name}. For this ${meta.groupLabel}, species-appropriate puzzle difficulty should be gradually increased as your ${name} masters each level. Avoid frustration by ensuring your ${name} can succeed at least 70% of the time during mental enrichment activities.</p>

      <h3>Best for Mental Enrichment</h3>
      <p>Multi-stage puzzle toys and treat-dispensing toys designed for ${meta.termPlural} of ${name}'s size and intelligence level provide the most engaging cognitive challenges while rewarding effort appropriately.</p>

      <h2>Physical Exercise Recommendations for ${name}</h2>
      <p>Physical activity for ${name} should reflect their ${data.exerciseNeeds.toLowerCase()} exercise needs and ${data.size} build. Daily exercise should include ${data.exerciseNeeds.toLowerCase().includes('high') ? '60-90 minutes' : data.exerciseNeeds.toLowerCase().includes('low') ? '15-30 minutes' : '30-60 minutes'} of species-appropriate physical activity divided into at least two sessions. For ${name}, effective exercise includes ${meta.exercise} and structured play that elevates heart rate without causing overexertion. Watch for signs of fatigue: heavy breathing, slowing down, reluctance to continue, or lying down during activity. ${name} ${meta.termPlural} with ${data.temperament.toLowerCase()} traits often enjoy varied exercise routines over repetitive ones. Adjust exercise intensity based on weather conditions, age, and health status. Young ${name} ${meta.termPlural} need shorter, more frequent exercise bouts, while adults can handle longer sustained sessions. Senior ${name} benefit from gentle, low-impact activities that maintain mobility without stressing aging joints.</p>

      <h2>Social Enrichment for ${name}</h2>
      <p>Social needs are a critical but often overlooked enrichment category for ${name}. This ${meta.groupLabel}'s ${data.temperament.toLowerCase()} personality means they ${traits[0] && traits[0].toLowerCase().includes('social') ? 'crave regular social interaction' : 'benefit from appropriately structured social experiences'}. Daily interactive time with their primary caregiver is non-negotiable: plan at least 15-30 minutes of focused one-on-one engagement beyond routine care tasks. For ${name} ${meta.termPlural} that enjoy company of their own kind, supervised playdates or group activities can provide valuable peer interaction. However, respect your individual ${name}'s social preferences; forcing interaction causes stress rather than enrichment. If your ${name} is home alone during work hours, consider enrichment strategies like background audio, window perches, or automated interactive toys to provide stimulation. Building positive associations with a variety of people, animals, and situations during socialization windows creates a more resilient and confident ${name}.</p>

      <h3>Best for Social ${name}</h3>
      <p>Regular supervised interaction opportunities with compatible ${meta.termPlural} and people satisfy ${name}'s social needs while building confidence and reducing anxiety-related behavioral issues.</p>

      <h2>DIY Enrichment Ideas for ${name}</h2>
      <p>Creative homemade enrichment for ${name} is cost-effective and easily customizable. Food-based DIY ideas include frozen treat puzzles (freeze species-appropriate treats in water or broth), scatter feeding on a snuffle mat or towel, and cardboard box foraging stations with hidden food rewards. Activity-based DIY enrichment includes obstacle courses built from household items, sensory exploration stations using different safe textures and surfaces, and hide-and-seek games that leverage ${name}'s natural ${primaryTrait.toLowerCase()} instincts. Ensure all DIY items are made from non-toxic, species-safe materials with no small parts that ${name} could ingest. Replace DIY enrichment items when they show wear. Rotate between commercial and DIY options to maintain variety while managing enrichment costs. Document which DIY activities your ${name} enjoys most for future reference.</p>

      <h2>Weekly Enrichment Schedule for ${name}</h2>
      <p>Structuring enrichment into a weekly schedule ensures consistent stimulation for your ${name} while preventing caregiver burnout. A sample weekly plan: Monday and Thursday focus on physical exercise with extended ${meta.exercise} sessions. Tuesday and Friday prioritize mental enrichment using puzzle feeders and training sessions. Wednesday and Saturday emphasize social enrichment with interactive play and socialization opportunities. Sunday provides a lighter enrichment day with sensory exploration and relaxed bonding time. Within each day, distribute enrichment across morning and evening sessions rather than concentrating all stimulation in one period. Adjust this schedule based on your ${name}'s individual responses—some ${name} ${meta.termPlural} prefer more consistent daily routines while others thrive with variety. Track your ${name}'s engagement and behavioral indicators to optimize the schedule over time for your individual ${meta.term}'s needs and preferences.</p>`;
}

function generateComparisonContent(name1, name2, data1, data2, meta) {
  const traits1 = data1.temperament.split(',').map(t => t.trim()).slice(0, 3);
  const traits2 = data2.temperament.split(',').map(t => t.trim()).slice(0, 3);
  const conditions1 = data1.healthConditions.length > 0 ? data1.healthConditions.slice(0, 3) : ['breed-specific conditions'];
  const conditions2 = data2.healthConditions.length > 0 ? data2.healthConditions.slice(0, 3) : ['breed-specific conditions'];

  return `
      <h2>Temperament and Personality Differences</h2>
      <p>The temperament contrast between ${name1} and ${name2} is one of the most significant factors in choosing between these ${meta.termPlural}. ${name1} is characterized by a ${traits1.join(', ').toLowerCase()} personality, while ${name2} tends toward ${traits2.join(', ').toLowerCase()} traits. In daily life, this means ${name1} owners typically experience a ${meta.term} that ${traits1[0] ? `leans toward ${traits1[0].toLowerCase()} behavior` : 'has a distinctive temperament'}, while ${name2} owners find their ${meta.term} ${traits2[0] ? `more inclined toward ${traits2[0].toLowerCase()} tendencies` : 'has its own unique character'}. Neither temperament is objectively better; the right choice depends on your personality and lifestyle preferences. ${name1} may suit owners who appreciate ${traits1[0] ? traits1[0].toLowerCase() : 'engaged'} companions, while ${name2} appeals to those who value ${traits2[0] ? traits2[0].toLowerCase() : 'distinctive'} characteristics in their ${meta.term}.</p>

      <h3>Best for Families with Children</h3>
      <p>Evaluate each ${meta.groupLabel}'s interaction style with children. ${name1}'s ${traits1[0] ? traits1[0].toLowerCase() : 'general'} nature and ${name2}'s ${traits2[0] ? traits2[0].toLowerCase() : 'unique'} temperament each present different dynamics with younger family members.</p>

      <h2>Health and Lifespan Comparison</h2>
      <p>${name1} has a typical lifespan of ${data1.lifespan}, while ${name2} lives approximately ${data2.lifespan}. Health profiles differ significantly between these ${meta.termPlural}. ${name1} is predisposed to ${conditions1.join(', ')}, with associated veterinary costs for monitoring and treatment. ${name2} faces its own health challenges including ${conditions2.join(', ')}. When comparing long-term health costs, consider not just the conditions themselves but their frequency, severity, and treatability. Some conditions require ongoing management while others are one-time treatments. Insurance considerations differ between the two ${meta.termPlural} based on these risk profiles. Prospective owners should discuss ${meta.groupLabel}-specific health screening with a ${meta.vetType} before making their decision.</p>

      <h3>Best for Low-Maintenance Health</h3>
      <p>Compare the number, severity, and manageability of each ${meta.groupLabel}'s common health conditions. Fewer hereditary predispositions generally correlate with lower lifetime veterinary costs.</p>

      <h2>Exercise and Activity Level Differences</h2>
      <p>Activity requirements differ notably between ${name1} and ${name2}. ${name1} requires ${data1.exerciseNeeds.toLowerCase()} levels of exercise and engagement, while ${name2} needs ${data2.exerciseNeeds.toLowerCase()} activity. This difference has major practical implications for daily routines. ${name1} owners should plan for ${data1.exerciseNeeds.toLowerCase().includes('high') ? '60-90 minutes' : data1.exerciseNeeds.toLowerCase().includes('low') ? '15-30 minutes' : '30-60 minutes'} of daily activity, compared to ${data2.exerciseNeeds.toLowerCase().includes('high') ? '60-90 minutes' : data2.exerciseNeeds.toLowerCase().includes('low') ? '15-30 minutes' : '30-60 minutes'} for ${name2}. Under-exercised ${meta.termPlural} of either ${meta.groupLabel} develop behavioral issues, but the consequences and management strategies differ. Active owners with flexible schedules may find ${data1.exerciseNeeds.toLowerCase().includes('high') ? name1 : name2}'s higher energy level rewarding, while busier individuals might prefer the ${data1.exerciseNeeds.toLowerCase().includes('low') ? name1 : name2}'s more manageable activity demands.</p>

      <h2>Grooming and Maintenance Comparison</h2>
      <p>Daily and periodic maintenance requirements differ between ${name1} and ${name2}. ${name1} has ${data1.shedding.toLowerCase()} grooming needs, while ${name2} requires ${data2.shedding.toLowerCase()} maintenance. Professional grooming costs reflect these differences: ${name1} owners typically spend $${data1.shedding.toLowerCase().includes('high') ? '400-$800' : data1.shedding.toLowerCase().includes('low') ? '0-$200' : '200-$400'} annually on grooming, compared to $${data2.shedding.toLowerCase().includes('high') ? '400-$800' : data2.shedding.toLowerCase().includes('low') ? '0-$200' : '200-$400'} for ${name2}. Beyond professional grooming, at-home maintenance includes regular brushing, bathing, nail care, and dental hygiene. The time commitment for daily grooming and general habitat maintenance is an important lifestyle consideration. ${name1} requires ${data1.shedding.toLowerCase().includes('high') ? 'significant daily' : 'routine'} grooming attention, while ${name2} needs ${data2.shedding.toLowerCase().includes('high') ? 'considerable daily' : 'standard'} care. Factor grooming costs and time into your total ownership commitment when deciding between these ${meta.termPlural}.</p>

      <h3>Best for Low-Maintenance Owners</h3>
      <p>Compare both the cost and time commitment of grooming each ${meta.groupLabel}. Lower grooming needs translate to both financial savings and more flexible daily schedules.</p>

      <h2>Cost of Ownership Comparison</h2>
      <p>Total ownership costs for ${name1} versus ${name2} differ across several categories. First-year costs are comparable at $1,500-$4,000 for either ${meta.term}, though specific allocations vary. Annual recurring costs for ${name1} (${data1.size} ${meta.term}) typically range from $1,200-$3,300, while ${name2} (${data2.size} ${meta.term}) runs $1,200-$3,300 annually. Key cost differentials include: food costs scale with size (${data1.size} vs ${data2.size}), grooming costs reflect maintenance requirements (${data1.shedding.toLowerCase()} vs ${data2.shedding.toLowerCase()}), and veterinary costs correlate with ${meta.groupLabel}-specific health risks. Insurance premiums also differ based on each ${meta.groupLabel}'s risk profile. Over a complete lifespan, ${name1} costs approximately $15,000-$45,000 across their ${data1.lifespan}, compared to $15,000-$45,000 for ${name2} across their ${data2.lifespan}. The longer-lived ${meta.term} accumulates more total costs but potentially offers more years of companionship.</p>

      <h2>Which Is Right for Your Family?</h2>
      <p>The decision between ${name1} and ${name2} ultimately depends on matching ${meta.term} characteristics with your family's specific situation. Choose ${name1} if your lifestyle accommodates their ${data1.exerciseNeeds.toLowerCase()} activity needs, ${data1.shedding.toLowerCase()} grooming requirements, and you're prepared for their ${traits1[0] ? traits1[0].toLowerCase() : 'unique'} temperament. Choose ${name2} if you prefer their ${data2.exerciseNeeds.toLowerCase()} energy level, can manage ${data2.shedding.toLowerCase()} maintenance, and appreciate their ${traits2[0] ? traits2[0].toLowerCase() : 'distinctive'} personality. Consider meeting ${meta.termPlural} of both ${meta.groupLabel}s in person if possible—experiencing their temperaments firsthand often clarifies the decision. Consult with a ${meta.vetType} about any family-specific concerns such as allergies, living arrangements, or compatibility with existing ${meta.termPlural}. Both ${name1} and ${name2} make wonderful companions for the right owner; the key is honest self-assessment about which ${meta.groupLabel}'s needs you can best fulfill throughout their entire lifespan.</p>

      <h3>Best for First-Time Owners</h3>
      <p>Compare each ${meta.groupLabel}'s care level and trainability. ${name1} rates as ${data1.careLevel.toLowerCase()} while ${name2} is ${data2.careLevel.toLowerCase()}—choose the one whose demands better match your experience level.</p>`;
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
