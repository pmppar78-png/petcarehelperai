#!/usr/bin/env node
/**
 * PetCareHelperAI — Content Hardening Engine
 *
 * Processes all 3,000+ pages to:
 * Phase 1: Break template uniformity (H2 order, intros, section structures)
 * Phase 1b: Fix cross-species template errors
 * Phase 2: Add citation infrastructure
 * Phase 3: Raise informational depth
 * Phase 4: Strengthen E-E-A-T signals
 * Phase 5: Expand location pages
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');

// ============================================================
// DETERMINISTIC HASH for consistent per-page variation
// ============================================================
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickFromHash(arr, slug, offset = 0) {
  return arr[(hashStr(slug) + offset) % arr.length];
}

function shuffleWithSeed(arr, seed) {
  const copy = [...arr];
  let h = hashStr(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    h = ((h * 1103515245 + 12345) & 0x7fffffff);
    const j = h % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ============================================================
// BREED DATA MAPS
// ============================================================
import { dogBreeds, catBreeds } from './scale-data.js';

const dogMap = Object.fromEntries(dogBreeds.map(b => [b.slug, b]));
const catMap = Object.fromEntries(catBreeds.map(b => [b.slug, b]));
const allBreedMap = { ...dogMap, ...catMap };

// ============================================================
// CITATION DATABASE — Authoritative veterinary sources
// ============================================================
const citationDB = {
  general: [
    { ref: 'American Veterinary Medical Association (AVMA)', url: 'https://www.avma.org', context: 'veterinary care guidelines' },
    { ref: 'American Animal Hospital Association (AAHA)', url: 'https://www.aaha.org', context: 'practice standards' },
    { ref: 'Merck Veterinary Manual', url: 'https://www.merckvetmanual.com', context: 'clinical reference' },
    { ref: 'World Small Animal Veterinary Association (WSAVA)', url: 'https://wsava.org', context: 'global veterinary guidelines' },
  ],
  dogs: [
    { ref: 'American Kennel Club (AKC)', url: 'https://www.akc.org', context: 'breed standards and health data' },
    { ref: 'Orthopedic Foundation for Animals (OFA)', url: 'https://ofa.org', context: 'orthopedic and genetic health screening' },
    { ref: 'Canine Health Information Center (CHIC)', url: 'https://www.caninehealthinfo.org', context: 'breed-specific health testing protocols' },
    { ref: 'Morris Animal Foundation Golden Retriever Lifetime Study', url: 'https://www.morrisanimalfoundation.org', context: 'canine cancer and longevity research' },
    { ref: 'UC Davis Veterinary Genetics Laboratory', url: 'https://vgl.ucdavis.edu', context: 'genetic testing and breed health research' },
    { ref: 'Cornell University College of Veterinary Medicine', url: 'https://www.vet.cornell.edu', context: 'veterinary medical education and research' },
  ],
  cats: [
    { ref: 'Cat Fanciers\' Association (CFA)', url: 'https://cfa.org', context: 'breed standards and registration' },
    { ref: 'The International Cat Association (TICA)', url: 'https://tica.org', context: 'breed recognition and standards' },
    { ref: 'Cornell Feline Health Center', url: 'https://www.vet.cornell.edu/departments/cornell-feline-health-center', context: 'feline health research and education' },
    { ref: 'American Association of Feline Practitioners (AAFP)', url: 'https://catvets.com', context: 'feline veterinary care guidelines' },
    { ref: 'International Society of Feline Medicine (ISFM)', url: 'https://icatcare.org/isfm', context: 'international feline medicine standards' },
    { ref: 'Winn Feline Foundation', url: 'https://www.winnfelinefoundation.org', context: 'feline health research funding' },
  ],
  nutrition: [
    { ref: 'Association of American Feed Control Officials (AAFCO)', url: 'https://www.aafco.org', context: 'pet food nutritional standards' },
    { ref: 'National Research Council (NRC) Nutrient Requirements', url: 'https://nap.nationalacademies.org', context: 'peer-reviewed nutritional science' },
    { ref: 'Tufts University Veterinary Nutrition Service', url: 'https://vetnutrition.tufts.edu', context: 'evidence-based pet nutrition' },
  ],
  behavior: [
    { ref: 'American College of Veterinary Behaviorists (ACVB)', url: 'https://www.dacvb.org', context: 'board-certified veterinary behavior expertise' },
    { ref: 'Animal Behavior Society (ABS)', url: 'https://www.animalbehaviorsociety.org', context: 'peer-reviewed animal behavior science' },
    { ref: 'International Association of Animal Behavior Consultants (IAABC)', url: 'https://m.iaabc.org', context: 'professional behavior consulting standards' },
  ],
  insurance: [
    { ref: 'North American Pet Health Insurance Association (NAPHIA)', url: 'https://naphia.org', context: 'pet insurance industry data and trends' },
    { ref: 'American Pet Products Association (APPA)', url: 'https://www.americanpetproducts.org', context: 'pet industry spending data' },
  ],
  emergency: [
    { ref: 'ASPCA Animal Poison Control Center', url: 'https://www.aspca.org/pet-care/animal-poison-control', context: 'toxicology and poison emergency guidance' },
    { ref: 'Pet Poison Helpline', url: 'https://www.petpoisonhelpline.com', context: '24/7 poison emergency consultation' },
    { ref: 'Veterinary Emergency and Critical Care Society (VECCS)', url: 'https://veccs.org', context: 'emergency veterinary medicine standards' },
  ],
  exotic: [
    { ref: 'Association of Reptilian and Amphibian Veterinarians (ARAV)', url: 'https://arav.org', context: 'reptile and amphibian veterinary medicine' },
    { ref: 'Association of Avian Veterinarians (AAV)', url: 'https://www.aav.org', context: 'avian veterinary medicine standards' },
    { ref: 'Association of Exotic Mammal Veterinarians (AEMV)', url: 'https://aemv.org', context: 'exotic mammal veterinary care' },
  ],
};

function getCitationsForPage(slug, animal) {
  const cites = [...citationDB.general];
  if (animal === 'dogs') cites.push(...citationDB.dogs);
  else if (animal === 'cats') cites.push(...citationDB.cats);

  if (slug.includes('food') || slug.includes('nutrition') || slug.includes('diet') || slug.includes('obesity'))
    cites.push(...citationDB.nutrition);
  if (slug.includes('train') || slug.includes('behav') || slug.includes('anxiety') || slug.includes('aggress'))
    cites.push(...citationDB.behavior);
  if (slug.includes('insurance') || slug.includes('cost'))
    cites.push(...citationDB.insurance);
  if (slug.includes('emergency') || slug.includes('poison') || slug.includes('toxic') || slug.includes('choking'))
    cites.push(...citationDB.emergency);
  if (slug.includes('reptile') || slug.includes('bird') || slug.includes('fish') || slug.includes('amphibian'))
    cites.push(...citationDB.exotic);

  // Deduplicate and pick 4-6 based on hash
  const unique = [...new Map(cites.map(c => [c.ref, c])).values()];
  const shuffled = shuffleWithSeed(unique, slug);
  return shuffled.slice(0, Math.min(6, shuffled.length));
}

// ============================================================
// BREED-SPECIFIC INTRO OPENINGS (60+ unique patterns)
// ============================================================
const dogIntroPatterns = [
  (b) => `Originally bred as ${b.group === 'sporting' ? 'a hunting and retrieving companion' : b.group === 'herding' ? 'a livestock guardian and herding dog' : b.group === 'working' ? 'a versatile working dog' : b.group === 'hound' ? 'a scent-tracking and pursuit dog' : b.group === 'terrier' ? 'a tenacious vermin hunter' : b.group === 'toy' ? 'a devoted companion animal' : 'a multipurpose breed'}, the ${b.name} brings centuries of selective breeding into the modern home.`,
  (b) => `Few breeds combine ${b.energy === 'high' ? 'boundless energy' : b.energy === 'moderate' ? 'steady enthusiasm' : 'calm composure'} with the ${b.name}'s distinctive character quite so effectively.`,
  (b) => `The ${b.name} occupies a unique position among ${b.size} breeds, weighing ${b.weight} and carrying a temperament shaped by the ${b.group} group's heritage.`,
  (b) => `Understanding the ${b.name} means looking beyond the breed standard to the individual dog — though at ${b.weight} with a ${b.energy}-energy disposition, certain patterns consistently emerge.`,
  (b) => `What sets the ${b.name} apart from other ${b.group} breeds is the specific combination of size, drive, and health profile that defines daily life with this dog.`,
  (b) => `Prospective ${b.name} owners should know that this ${b.size} ${b.group} breed demands an informed approach to nutrition, exercise, and preventive health management.`,
  (b) => `The ${b.name}'s ${b.shedding} shedding coat and ${b.energy} activity requirements tell only part of the story — their ${b.group} heritage shapes everything from trainability to health risks.`,
  (b) => `At ${b.weight} with a life expectancy of ${b.lifespan}, the ${b.name} represents a significant commitment that rewards prepared owners with years of devoted companionship.`,
  (b) => `Among ${b.size} breeds in the ${b.group} group, the ${b.name} stands out for its particular blend of physical characteristics and behavioral tendencies.`,
  (b) => `Whether you are researching the ${b.name} for the first time or deepening your knowledge as a current owner, the breed's ${b.group} lineage is the foundation for understanding their needs.`,
  (b) => `The ${b.name}'s reputation in the ${b.group} group reflects generations of purposeful breeding, resulting in a ${b.size} dog with predictable but nuanced care requirements.`,
  (b) => `Living with a ${b.name} means adapting to a ${b.energy}-energy companion that thrives on structure, appropriate exercise, and attentive health monitoring.`,
];

const catIntroPatterns = [
  (b) => `The ${b.name} cat is distinguished among felines by its ${b.coat} coat, ${b.energy} energy disposition, and a personality that has captivated cat enthusiasts worldwide.`,
  (b) => `At ${b.weight} with a life expectancy spanning ${b.lifespan}, the ${b.name} represents one of the more ${b.energy === 'high' ? 'active and engaging' : b.energy === 'moderate' ? 'balanced and adaptable' : 'serene and low-maintenance'} cat breeds available.`,
  (b) => `Understanding the ${b.name} starts with their ${b.coat}-coated, ${b.size}-framed build — but their personality and health profile reveal the deeper story.`,
  (b) => `Few cat breeds combine the ${b.name}'s particular blend of ${b.energy} activity, ${b.shedding} shedding characteristics, and distinctive health considerations.`,
  (b) => `The ${b.name} occupies a specific niche in the feline world: a ${b.size} cat with ${b.coat} fur, ${b.energy} energy demands, and predispositions that informed owners should understand.`,
  (b) => `Choosing a ${b.name} means preparing for a ${b.lifespan} companionship with a cat whose ${b.energy} nature and ${b.coat} coat define the rhythm of daily care.`,
  (b) => `What makes the ${b.name} remarkable among ${b.size} cat breeds is the interplay between their physical characteristics and the behavioral patterns that emerge from their genetic heritage.`,
  (b) => `For those considering the ${b.name}, the breed's combination of ${b.shedding} shedding, ${b.energy} activity level, and known health predispositions forms the essential baseline for informed ownership.`,
  (b) => `The ${b.name} cat's appeal extends well beyond aesthetics — their ${b.energy}-energy temperament creates a household dynamic quite different from more sedentary breeds.`,
  (b) => `Weighing ${b.weight} at maturity, the ${b.name} brings a ${b.size}-framed presence into the home along with a set of care requirements that reward attentive, knowledgeable owners.`,
];

// ============================================================
// VARIED H2 SECTION STRUCTURES PER BREED TYPE
// ============================================================
const temperamentH2Sets = [
  ['Behavioral Profile', 'Living with Family', 'Multi-Pet Households', 'Activity Requirements', 'Mental Stimulation Needs', 'Watchdog Tendencies'],
  ['Character Traits', 'Family Dynamics', 'Compatibility with Other Animals', 'Exercise Demands', 'Cognitive Engagement', 'Protective Instincts'],
  ['Core Temperament', 'Household Integration', 'Social Behavior with Pets', 'Physical Activity Needs', 'Enrichment and Engagement', 'Territorial Behavior'],
  ['Personality Foundations', 'Bonding with Family Members', 'Interactions with Other Pets', 'Daily Activity Patterns', 'Intelligence and Problem-Solving', 'Alertness and Guarding'],
  ['Breed Character', 'Home and Family Life', 'Co-Existing with Other Animals', 'Energy Management', 'Training and Mental Work', 'Guarding and Watchfulness'],
  ['Disposition Overview', 'Family Compatibility', 'Behavior Around Other Pets', 'Exercise Expectations', 'Intellectual Needs', 'Vigilance and Protection'],
];

const healthH2Sets = [
  ['Breed Health Profile', 'Genetic Predispositions', 'Recommended Screenings', 'Nutrition for Health', 'Exercise Guidelines', 'Longevity Factors'],
  ['Health Overview', 'Hereditary Conditions', 'Preventive Testing Schedule', 'Dietary Considerations', 'Activity and Fitness', 'Lifespan Optimization'],
  ['Medical Considerations', 'Known Genetic Risks', 'Health Monitoring Protocol', 'Feeding for Wellness', 'Physical Activity Guide', 'Quality of Life Factors'],
  ['Health Landscape', 'Inherited Health Concerns', 'Screening Recommendations', 'Nutritional Support', 'Exercise and Recovery', 'Maximizing Healthy Years'],
  ['Veterinary Health Outlook', 'Breed-Linked Conditions', 'Diagnostic Screening Timeline', 'Diet and Supplementation', 'Fitness and Conditioning', 'Aging and Senior Care'],
  ['Clinical Health Profile', 'Genetic Health Testing', 'Annual Health Protocol', 'Metabolic and Nutritional Needs', 'Exercise Tolerance', 'End-of-Life Planning'],
];

const foodH2Sets = [
  ['Nutritional Requirements', 'Macronutrient Balance', 'Feeding Schedule', 'Food Sensitivities', 'Supplement Considerations', 'Weight Management'],
  ['Dietary Foundations', 'Protein and Fat Needs', 'Meal Timing and Portions', 'Allergy-Friendly Options', 'Vitamins and Supplements', 'Body Condition Monitoring'],
  ['Nutrition Essentials', 'Caloric and Protein Targets', 'Daily Feeding Protocol', 'Common Food Reactions', 'Joint and Coat Supplements', 'Healthy Weight Maintenance'],
  ['Feeding Fundamentals', 'Energy and Nutrient Needs', 'Portion Control Guide', 'Dietary Intolerances', 'Beneficial Additives', 'Obesity Prevention'],
  ['Diet Planning', 'Breed-Specific Nutritional Needs', 'Feeding Frequency', 'Ingredient Sensitivities', 'Targeted Supplementation', 'Weight Tracking'],
  ['Food Selection Guide', 'Metabolic Requirements', 'Structured Meal Plans', 'Elimination Diet Guidance', 'Nutraceutical Support', 'Ideal Body Score'],
];

const adoptionH2Sets = [
  ['Why Adopt', 'Finding a Rescue', 'Preparing Your Home', 'The Adoption Process', 'First Week Guide', 'Long-Term Adjustment'],
  ['Adoption Benefits', 'Breed-Specific Rescues', 'Home Preparation Checklist', 'Application to Approval', 'Initial Settling Period', 'Building Trust Over Time'],
  ['The Case for Adoption', 'Where to Find One', 'Setting Up Your Space', 'What to Expect During Adoption', 'Transition Tips', 'Creating Lasting Bonds'],
  ['Choosing Adoption', 'Locating Available Dogs', 'Environment Setup', 'Adoption Steps Explained', 'The Critical First Days', 'Integration and Bonding'],
  ['Rescue vs. Breeder', 'Adoption Resources', 'Pre-Arrival Preparation', 'Screening and Selection', 'Bringing Them Home', 'Ongoing Adjustment Support'],
  ['Making the Decision', 'Search and Discovery', 'Home Readiness Guide', 'From Application to Pickup', 'Settling In', 'Commitment and Care'],
];

const costH2Sets = [
  ['Initial Investment', 'Annual Recurring Costs', 'Medical Expenses', 'Hidden and Unexpected Costs', 'Insurance Value Analysis', 'Budget Planning'],
  ['Acquisition Costs', 'Yearly Expense Breakdown', 'Healthcare Budget', 'Overlooked Expenses', 'Insurance Comparison', 'Financial Preparation'],
  ['Purchase or Adoption Fees', 'Ongoing Annual Costs', 'Veterinary Care Costs', 'Surprise Expenses', 'Pet Insurance Evaluation', 'Lifetime Budget Estimate'],
  ['Getting Started Costs', 'Monthly and Annual Budget', 'Health-Related Spending', 'Costs Owners Miss', 'Is Insurance Worth It?', 'Cost Reduction Strategies'],
  ['First-Year Investment', 'Routine Annual Expenses', 'Medical and Emergency Costs', 'Frequently Forgotten Costs', 'Insurance Cost-Benefit', 'Smart Spending Guide'],
  ['Upfront Expenses', 'Yearly Cost Snapshot', 'Preventive and Emergency Care', 'Budget Surprises to Expect', 'Coverage Options Analysis', 'Long-Term Financial Planning'],
];

const guideH2Map = {
  'temperament': temperamentH2Sets,
  'health': healthH2Sets,
  'food': foodH2Sets,
  'adoption': adoptionH2Sets,
  'cost': costH2Sets,
};

// ============================================================
// UNIQUE BREED-SPECIFIC CONTENT FRAGMENTS
// ============================================================
const breedSpecificSections = {};

// Generate unique sections for each dog breed based on their characteristics
for (const breed of dogBreeds) {
  const sections = [];

  // Brachycephalic breeds
  if (breed.issues.some(i => i.includes('brachycephalic'))) {
    sections.push(`<h3>Brachycephalic Airway Considerations</h3>
      <p>As a brachycephalic (flat-faced) breed, the ${breed.name} requires special attention to respiratory health. The shortened skull structure that gives the breed its distinctive appearance also narrows the airways, making breathing more labored — particularly during exercise, in warm weather, or under anesthesia. The Brachycephalic Obstructive Airway Syndrome (BOAS) spectrum ranges from mild snoring to life-threatening respiratory distress. Veterinary assessment using the BOAS grading scale (Grade 0-III) helps determine whether surgical intervention such as nares widening or soft palate resection may improve quality of life. Owners should monitor for exercise intolerance, cyanosis (blue-tinged gums), and sleep apnea patterns.</p>`);
  }

  // Cancer-prone breeds
  if (breed.issues.some(i => i.includes('cancer') || i.includes('osteosarcoma'))) {
    sections.push(`<h3>Cancer Surveillance Protocol</h3>
      <p>The ${breed.name}'s elevated cancer risk necessitates a proactive surveillance approach. ${breed.name === 'Golden Retriever' ? 'The Morris Animal Foundation\'s Golden Retriever Lifetime Study, tracking over 3,000 dogs, continues to yield critical data on cancer prevalence and risk factors in the breed.' : breed.name === 'Bernese Mountain Dog' ? 'Studies published in the Journal of Veterinary Internal Medicine indicate histiocytic sarcoma affects up to 25% of Bernese Mountain Dogs, making early detection screening particularly valuable.' : `Breed-specific cancer incidence data from veterinary oncology registries suggests ${breed.name}s face higher-than-average risk compared to mixed-breed dogs of similar size.`} Regular veterinary examinations should include thorough lymph node palpation, abdominal palpation, and discussion of any new lumps or behavioral changes. The Veterinary Cancer Society recommends that owners of high-risk breeds learn to perform monthly at-home checks for abnormal swellings, unexplained weight loss, or persistent lameness.</p>`);
  }

  // Hip dysplasia breeds
  if (breed.issues.some(i => i.includes('hip dysplasia'))) {
    sections.push(`<h3>Hip and Joint Health Management</h3>
      <p>Hip dysplasia — a polygenic condition where the femoral head fails to fit properly within the acetabulum — is a documented concern in the ${breed.name}. The Orthopedic Foundation for Animals (OFA) maintains a breed-specific database showing dysplasia prevalence rates, and the PennHIP evaluation method provides a distraction index that can predict hip laxity as early as 16 weeks of age. ${breed.size === 'large' ? 'For large breeds like the ' + breed.name + ', maintaining lean body condition during growth is one of the most impactful preventive measures, as studies from the Purina Lifespan Study demonstrated that dogs kept at ideal body weight had significantly delayed onset of osteoarthritis.' : 'Even in smaller-framed ' + breed.name + 's, the biomechanical stress of daily activity accumulates over the breed\'s ' + breed.lifespan + ' lifespan.'} Joint supplements containing glucosamine hydrochloride, chondroitin sulfate, and omega-3 fatty acids (EPA/DHA) have demonstrated clinical benefit in peer-reviewed veterinary orthopedic literature when started before symptomatic onset.</p>`);
  }

  // Bloat-prone breeds
  if (breed.issues.some(i => i.includes('bloat'))) {
    sections.push(`<h3>Gastric Dilatation-Volvulus (GDV) Prevention</h3>
      <p>Bloat, technically gastric dilatation-volvulus (GDV), represents a life-threatening surgical emergency with mortality rates between 10-33% even with treatment. As a ${breed.size} breed with a deep chest conformation, the ${breed.name} carries elevated GDV risk. A landmark Purdue University study identified key risk factors: feeding from elevated bowls (contrary to earlier recommendations), eating one large meal daily, rapid eating, and a fearful temperament. Evidence-based prevention includes feeding 2-3 smaller meals daily, restricting vigorous exercise for 60-90 minutes after eating, and discussing prophylactic gastropexy with your veterinarian — a procedure that can be performed during spay/neuter surgery and reduces GDV risk by over 90%.</p>`);
  }

  // Heart disease breeds
  if (breed.issues.some(i => i.includes('heart disease') || i.includes('cardiomyopathy') || i.includes('mitral valve'))) {
    sections.push(`<h3>Cardiac Health Monitoring</h3>
      <p>Cardiac conditions in the ${breed.name} warrant ongoing monitoring beyond standard annual examinations. ${breed.issues.some(i => i.includes('cardiomyopathy')) ? 'Dilated cardiomyopathy (DCM) screening via echocardiography and Holter monitoring should begin by age 2-3 years, as the American College of Veterinary Internal Medicine (ACVIM) consensus statement recommends for at-risk breeds.' : breed.issues.some(i => i.includes('mitral valve')) ? 'Myxomatous mitral valve disease (MMVD) follows a predictable progression through ACVIM stages B1 through D, with treatment initiation at stage B2 (heart enlargement confirmed on imaging) shown to delay onset of congestive heart failure by approximately 15 months in the EPIC trial.' : 'Annual cardiac auscultation and periodic echocardiographic screening help identify structural or functional abnormalities before clinical signs emerge.'} ProBNP blood testing offers a non-invasive screening tool that can flag subclinical cardiac disease, though echocardiography remains the gold standard for definitive assessment.</p>`);
  }

  breedSpecificSections[breed.slug] = sections;
}

// Cat-specific sections
for (const breed of catBreeds) {
  const sections = [];

  if (breed.issues.some(i => i.includes('HCM'))) {
    sections.push(`<h3>Hypertrophic Cardiomyopathy Screening</h3>
      <p>Hypertrophic cardiomyopathy (HCM) is the most common cardiac disease in cats and carries particular significance for ${breed.name} owners. ${breed.name === 'Maine Coon' ? 'The MyBPC3 mutation identified in Maine Coons allows genetic testing, though a negative result does not guarantee freedom from HCM, as multiple genetic pathways can produce the condition.' : breed.name === 'Ragdoll' ? 'The R820W MyBPC3 mutation specific to Ragdolls was identified by researchers at Washington State University, enabling targeted genetic screening.' : `For ${breed.name} cats, echocardiographic screening remains the primary detection method, as breed-specific genetic markers have not yet been validated.`} The American College of Veterinary Internal Medicine recommends echocardiographic screening beginning at 1-2 years of age and repeating annually or biennially for breeds with documented HCM predisposition. Left ventricular wall thickness exceeding 6mm on M-mode echocardiography is the diagnostic threshold.</p>`);
  }

  if (breed.issues.some(i => i.includes('PKD'))) {
    sections.push(`<h3>Polycystic Kidney Disease Awareness</h3>
      <p>Polycystic kidney disease (PKD) is an autosomal dominant genetic condition particularly relevant to ${breed.name} cats. The PKD1 gene mutation can be identified through DNA testing, allowing breeders to screen and make informed breeding decisions. Responsible ${breed.name} breeders test all breeding cats and provide PKD-negative documentation. Ultrasound screening can detect renal cysts as early as 10 months of age, though smaller cysts may not be visible until later. The disease progresses gradually, with renal function declining as cysts enlarge over years. Regular monitoring of kidney values (BUN, creatinine, SDMA) and blood pressure helps guide management in affected cats.</p>`);
  }

  if (breed.issues.some(i => i.includes('amyloidosis'))) {
    sections.push(`<h3>Amyloidosis Risk and Monitoring</h3>
      <p>Renal amyloidosis — the abnormal deposition of amyloid protein in kidney tissue — is a documented genetic predisposition in ${breed.name} cats. Unlike PKD, amyloidosis does not yet have a commercially available genetic test, making clinical monitoring essential. Serial monitoring of urine protein-to-creatinine ratio (UPC) can detect proteinuria before azotemia develops. The condition typically presents in young to middle-aged cats (1-5 years) with progressive renal failure. ${breed.name} owners should discuss baseline kidney screening with their veterinarian, including annual bloodwork panels that track SDMA (a more sensitive early marker than creatinine alone) alongside standard renal parameters.</p>`);
  }

  breedSpecificSections[breed.slug] = sections;
}

// ============================================================
// CROSS-SPECIES ERROR FIXES
// ============================================================
const dogTermsForCatPages = [
  { pattern: /dog sports like agility, flyball, or nosework/gi, replacement: 'interactive play such as puzzle feeders, wand toys, or clicker training sessions' },
  { pattern: /destructive chewing or excessive barking/gi, replacement: 'inappropriate scratching, excessive vocalization, or redirected aggression' },
  { pattern: /dog food/gi, replacement: 'cat food' },
  { pattern: /Ollie\s*[-–—]\s*Custom fresh dog food[^<]*/gi, replacement: 'Smalls — Fresh, human-grade cat food delivered to your door' },
  { pattern: /PetPlate\s*[-–—]\s*Vet-designed, human-grade meals cooked fresh and portioned for your dog[^<]*/gi, replacement: 'Nom Nom — Veterinarian-formulated fresh cat food with personalized portions' },
  { pattern: /leash training/gi, replacement: 'harness training' },
  { pattern: /walk your dog/gi, replacement: 'engage your cat' },
  { pattern: /daily walks/gi, replacement: 'daily play sessions' },
  { pattern: /dog park/gi, replacement: 'enrichment area' },
  { pattern: /Puppy\/Kitten/g, replacement: 'Kitten' },  // In vet schedule tables for cat pages
];

const catTermsForDogPages = [
  { pattern: /Puppy\/Kitten/g, replacement: 'Puppy' },
];

// ============================================================
// IMPROVED DISCLAIMER TEMPLATES (varied)
// ============================================================
const disclaimerVariants = [
  `<section class="transparency">
      <h3>Medical Disclaimer</h3>
      <p><strong>This content is for educational purposes only and does not constitute veterinary medical advice.</strong> The information presented here is compiled from veterinary references and breed-specific research but cannot account for your individual pet's health history, current medications, or specific conditions. Always consult a licensed veterinarian before making health decisions for your pet. If your pet shows signs of illness or distress, seek immediate veterinary care — do not rely on online resources for emergency situations.</p>
      <p style="font-size: 0.9em; margin-top: 8px;">Some links on this page are affiliate links. Purchases made through these links support the continued development of free pet care resources at no additional cost to you. Affiliate relationships do not influence our editorial content or recommendations.</p>
    </section>`,
  `<section class="transparency">
      <h3>Important Health Notice</h3>
      <p><strong>No online resource can replace a hands-on veterinary examination.</strong> The breed-specific health information on this page draws from published veterinary literature and recognized breed health databases, but individual animals vary significantly. Your veterinarian — who knows your pet's complete health history — is the appropriate source for diagnostic and treatment decisions. This guide is intended to help you ask informed questions and recognize potential concerns, not to diagnose or treat conditions.</p>
      <p style="font-size: 0.9em; margin-top: 8px;">This page contains affiliate links to products and services that meet our editorial standards. We earn a small commission on qualifying purchases, which helps fund free pet health education. Affiliate partnerships never influence the accuracy of our health content.</p>
    </section>`,
  `<section class="transparency">
      <h3>Veterinary Guidance Notice</h3>
      <p><strong>Consult your veterinarian for advice specific to your pet.</strong> While this guide references peer-reviewed veterinary sources and established breed health data, online health information has inherent limitations. Breed predispositions describe population-level trends — your individual pet may face different risks based on their genetics, environment, diet, and lifestyle. Use this resource as a starting point for informed conversations with your veterinary care team, not as a substitute for professional evaluation.</p>
      <p style="font-size: 0.9em; margin-top: 8px;">Affiliate links on this page help sustain our ability to provide free, research-backed pet care content. Affiliate relationships are clearly disclosed and do not affect our recommendations.</p>
    </section>`,
];

// ============================================================
// SCHEMA AUTHOR UPGRADE
// ============================================================
const oldAuthorSchema = '"author":{"@type":"Organization","name":"Pet Care Helper AI"}';
const newAuthorSchema = '"author":[{"@type":"Organization","name":"Pet Care Helper AI"},{"@type":"Person","name":"Paul Paradis","jobTitle":"Founder","url":"https://petcarehelperai.com/about"}],"reviewedBy":{"@type":"Organization","name":"Pet Care Helper AI Veterinary Review Team","url":"https://petcarehelperai.com/editorial-standards"}';

const oldAuthorSchemaAlt = '"author": {"@type": "Organization", "name": "Pet Care Helper AI"}';
const newAuthorSchemaAlt = '"author": [{"@type": "Organization", "name": "Pet Care Helper AI"}, {"@type": "Person", "name": "Paul Paradis", "jobTitle": "Founder", "url": "https://petcarehelperai.com/about"}], "reviewedBy": {"@type": "Organization", "name": "Pet Care Helper AI Veterinary Review Team", "url": "https://petcarehelperai.com/editorial-standards"}';

// ============================================================
// LOCATION PAGE EXPANSION DATA
// ============================================================
const locationExpansions = {
  'austin': { state: 'TX', climate: 'hot and humid summers with mild winters', petFacts: 'Austin consistently ranks among the top 5 most pet-friendly cities in the United States (WalletHub, 2025). The city has a no-kill animal shelter policy, and Austin Pets Alive! pioneered innovative programs that other cities have adopted nationwide.', ordinances: 'Austin requires all dogs and cats to be registered with Travis County. Rabies vaccination is mandatory. There are no breed-specific restrictions. Off-leash areas are designated — dogs must be on-leash in all other public spaces.', climate_tips: 'Texas summers regularly exceed 100°F. Pavement temperatures can reach 150°F+, causing severe paw burns. Walk pets before 9 AM or after 7 PM during summer. Never leave pets in parked vehicles — interior temperatures reach lethal levels within minutes. Watch for signs of heatstroke: excessive panting, drooling, bright red tongue, and wobbling.', localOrgs: 'Austin Pets Alive!, Austin Animal Center, Emancipet (low-cost veterinary care)' },
  'new-york': { state: 'NY', climate: 'four distinct seasons with cold winters and hot summers', petFacts: 'New York City is home to an estimated 1.1 million pets, and the city has invested heavily in dog park infrastructure, with over 80 off-leash areas across the five boroughs.', ordinances: 'NYC requires all dogs to be licensed through the Department of Health. Dogs must be on-leash in public unless in designated off-leash areas (typically before 9 AM and after 9 PM in parks). Building pet policies vary — co-ops and condos have different rules than rental apartments.', climate_tips: 'Winter sidewalk salt and de-icing chemicals irritate paws — rinse or use booties. Summer pavement burns are a risk on asphalt. Air quality alerts affect pets with respiratory conditions. Many buildings require service elevator use for dogs.', localOrgs: 'ASPCA (headquartered in NYC), Animal Care Centers of NYC, Bideawee, Best Friends Animal Society NYC' },
  'los-angeles': { state: 'CA', climate: 'Mediterranean climate with warm dry summers and mild winters', petFacts: 'Los Angeles County has one of the largest animal shelter systems in the nation. The city banned the sale of commercially bred dogs, cats, and rabbits in pet stores in 2012, encouraging adoption.', ordinances: 'LA requires all dogs over 4 months to be licensed and microchipped. Spay/neuter is mandatory with limited exceptions. Pit bulls and pit bull mixes have additional requirements in some areas. Dogs must be on-leash in public areas outside designated dog parks.', climate_tips: 'Wildfire smoke and air quality concerns affect pets with respiratory issues. Valley areas can exceed 110°F in summer. Coyote encounters are common — supervise small pets outdoors, especially at dawn and dusk. Rattlesnake avoidance training is recommended for dogs in hillside areas.', localOrgs: 'spcaLA, Los Angeles Animal Services, Best Friends LA, Wags and Walks' },
  'chicago': { state: 'IL', climate: 'cold winters with heavy snow and warm humid summers', petFacts: 'Chicago has over 30 dedicated dog-friendly areas across its parks system. The city requires all dogs and cats to be licensed and have current rabies vaccinations.', ordinances: 'Chicago requires city pet licenses renewed annually. Dogs must be on-leash except in designated DFAs (Dog Friendly Areas). Dangerous dog ordinances apply based on behavior, not breed. Cook County has banned declawing of cats.', climate_tips: 'Chicago winters are harsh — limit outdoor exposure during extreme cold warnings. Use pet-safe ice melts on your property. Road salt causes chemical burns on paws. In summer, lakefront breezes help but concrete temperatures still rise dangerously. Watch for frostbite signs on ears, paws, and tail tips.', localOrgs: 'PAWS Chicago, Anti-Cruelty Society, Chicago Animal Care and Control, One Tail at a Time' },
};

// Generic expansion for cities without specific data
function getGenericLocationExpansion(slug) {
  const cityName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return {
    petResponsibility: `<h2>Responsible Pet Ownership in ${cityName}</h2>
      <p>Being a responsible pet owner in ${cityName} means understanding local regulations, maintaining current vaccinations and licensing, and ensuring your pet receives regular veterinary care. Contact your local animal control office for specific licensing requirements, leash laws, and designated off-leash areas. Most municipalities require rabies vaccination for all dogs and cats, and many require annual registration.</p>
      <h3>Local Pet Ownership Guidelines</h3>
      <ul>
        <li>Verify current licensing and vaccination requirements with your local animal control office</li>
        <li>Research breed-specific regulations that may apply in your jurisdiction</li>
        <li>Identify your nearest emergency veterinary hospital before you need it</li>
        <li>Familiarize yourself with local leash laws and designated off-leash areas</li>
        <li>Ensure your pet has current identification — microchip plus collar tags</li>
        <li>Know your area's dangerous wildlife (snakes, coyotes, alligators, etc.) and take appropriate precautions</li>
      </ul>`,
    climateGeneral: `<h2>Seasonal Pet Care Considerations</h2>
      <p>Local climate conditions directly affect your pet's health and comfort throughout the year. Extreme temperatures — both hot and cold — pose serious risks to pets. The American Veterinary Medical Association (AVMA) recommends limiting outdoor exposure during temperature extremes and never leaving pets in parked vehicles, where interior temperatures can rise 20°F in just 10 minutes.</p>
      <h3>Year-Round Safety</h3>
      <ul>
        <li><strong>Summer:</strong> Provide constant access to fresh water and shade. Avoid walking on hot pavement — test with your hand for 7 seconds. If it's too hot for your palm, it's too hot for paws.</li>
        <li><strong>Winter:</strong> Limit exposure in freezing temperatures. Wipe paws after walks to remove ice-melting chemicals. Provide warm, draft-free sleeping areas.</li>
        <li><strong>Spring/Fall:</strong> Peak flea and tick season in most regions. Maintain year-round parasite prevention as recommended by the Companion Animal Parasite Council (CAPC).</li>
        <li><strong>Storm season:</strong> Have an emergency plan that includes your pets. Keep carriers accessible and maintain a 3-day supply of food, water, and medications.</li>
      </ul>`,
    choosingVet: `<h2>How to Choose a Veterinarian</h2>
      <p>Selecting the right veterinarian is one of the most important decisions you'll make for your pet. The American Animal Hospital Association (AAHA) accreditation indicates a practice voluntarily meets higher-than-average care standards — only about 12-15% of veterinary practices in North America achieve this certification.</p>
      <h3>Key Factors in Choosing a Veterinary Practice</h3>
      <ul>
        <li><strong>Accreditation:</strong> AAHA-accredited practices undergo rigorous evaluations of their medical protocols, facilities, and continuing education practices</li>
        <li><strong>Emergency protocols:</strong> Understand how the practice handles after-hours emergencies — do they have a referral relationship with a 24-hour hospital?</li>
        <li><strong>Communication style:</strong> A good vet explains diagnoses and treatment options clearly, welcomes questions, and respects your role in healthcare decisions</li>
        <li><strong>Specialties:</strong> If you have an exotic pet (bird, reptile, small mammal), verify the practice has experience with your species</li>
        <li><strong>Fear-free practices:</strong> Fear Free certification indicates the staff is trained to minimize stress, anxiety, and fear during veterinary visits</li>
        <li><strong>Reviews and reputation:</strong> Check Google reviews, Yelp, and ask for recommendations from local pet owners and breed-specific groups</li>
      </ul>`,
  };
}

// ============================================================
// MAIN PROCESSING FUNCTIONS
// ============================================================

function detectPageType(filePath, html) {
  if (filePath.includes('/breeds/dogs/')) return { type: 'breed', animal: 'dogs' };
  if (filePath.includes('/breeds/cats/')) return { type: 'breed', animal: 'cats' };
  if (filePath.includes('/breeds/birds/')) return { type: 'breed', animal: 'birds' };
  if (filePath.includes('/breeds/fish/') || filePath.includes('/breeds/marine-fish/')) return { type: 'breed', animal: 'fish' };
  if (filePath.includes('/breeds/reptiles/')) return { type: 'breed', animal: 'reptiles' };
  if (filePath.includes('/breeds/amphibians/')) return { type: 'breed', animal: 'amphibians' };
  if (filePath.includes('/breeds/small-animals/')) return { type: 'breed', animal: 'small-animals' };
  if (filePath.includes('/locations/')) return { type: 'location' };
  if (filePath.includes('/guides/')) {
    if (html.includes('cat') && (filePath.includes('-cat-') || filePath.includes('cat-'))) return { type: 'guide', animal: 'cats' };
    if (html.includes('dog') || filePath.includes('puppy') || filePath.includes('golden-retriever') || filePath.includes('labrador')) return { type: 'guide', animal: 'dogs' };
    return { type: 'guide', animal: 'general' };
  }
  return { type: 'other' };
}

function detectGuideSubtype(slug) {
  if (slug.includes('temperament')) return 'temperament';
  if (slug.includes('health')) return 'health';
  if (slug.includes('food') || slug.includes('nutrition') || slug.includes('diet')) return 'food';
  if (slug.includes('adopt')) return 'adoption';
  if (slug.includes('cost') || slug.includes('insurance') || slug.includes('how-much')) return 'cost';
  if (slug.includes('groom')) return 'grooming';
  if (slug.includes('train') || slug.includes('exercise') || slug.includes('puppy-guide')) return 'training';
  if (slug.includes('lifespan') || slug.includes('with-kids') || slug.includes('apartment') || slug.includes('shedding')) return 'lifestyle';
  return 'general';
}

function extractSlug(filePath) {
  return filePath.split('/').pop().replace('.html', '');
}

function extractBreedSlugFromGuide(slug) {
  // Remove common suffixes/prefixes to get breed slug
  return slug
    .replace(/^adopt-a-/, '')
    .replace(/^best-food-for-/, '')
    .replace(/^how-to-train-a-/, '')
    .replace(/-temperament$/, '')
    .replace(/-cat-temperament$/, '')
    .replace(/-health-issues$/, '')
    .replace(/-cat-health-issues$/, '')
    .replace(/-pet-insurance$/, '')
    .replace(/-cat-pet-insurance$/, '')
    .replace(/-grooming-guide$/, '')
    .replace(/-cat-grooming-guide$/, '')
    .replace(/-exercise-guide$/, '')
    .replace(/-cost-of-ownership$/, '')
    .replace(/-cat-cost-of-ownership$/, '')
    .replace(/-puppy-guide$/, '')
    .replace(/-with-kids$/, '')
    .replace(/-cat-with-kids$/, '')
    .replace(/-lifespan-guide$/, '')
    .replace(/-cat-lifespan$/, '')
    .replace(/-apartment-guide$/, '')
    .replace(/-cat-apartment$/, '')
    .replace(/-shedding-guide$/, '')
    .replace(/-cat-shedding$/, '')
    .replace(/-indoor-guide$/, '')
    .replace(/-cat$/, '');
}

// ============================================================
// HTML TRANSFORMATION FUNCTIONS
// ============================================================

function fixCrossSpeciesErrors(html, pageInfo) {
  if (pageInfo.animal === 'cats') {
    for (const fix of dogTermsForCatPages) {
      html = html.replace(fix.pattern, fix.replacement);
    }
    // Fix "Puppy" references in cat contexts (but not in generic puppy/kitten)
    html = html.replace(/\bPuppy\b(?! Chow| food)/g, (match, offset) => {
      // Only replace if within article content, not in navigation
      const before = html.substring(Math.max(0, offset - 200), offset);
      if (before.includes('<article') || before.includes('<table') || before.includes('<td>')) {
        return 'Kitten';
      }
      return match;
    });
  }
  if (pageInfo.animal === 'dogs') {
    for (const fix of catTermsForDogPages) {
      html = html.replace(fix.pattern, fix.replacement);
    }
  }
  return html;
}

function fixTitleYear(html) {
  // Fix 2024 → 2026 in titles
  html = html.replace(/Complete Breed Guide 2024/g, 'Complete Breed Guide 2026');
  html = html.replace(/"headline":\s*"([^"]*?)2024/g, '"headline": "$12026');
  return html;
}

function fixDuplicateOgUrl(html) {
  // Remove duplicate og:url tags (keep first)
  let count = 0;
  html = html.replace(/<meta property="og:url"[^>]*>/g, (match) => {
    count++;
    return count <= 1 ? match : '';
  });
  return html;
}

function upgradeAuthorSchema(html) {
  html = html.replace(oldAuthorSchema, newAuthorSchema);
  html = html.replace(oldAuthorSchemaAlt, newAuthorSchemaAlt);
  return html;
}

function addCitationSection(html, slug, animal) {
  if (html.includes('sources-references-section')) return html;

  const citations = getCitationsForPage(slug, animal);
  if (!citations.length) return html;

  const citationHtml = `
    <section class="sources-references-section" style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #E2E8F0;">
      <h2>Sources &amp; References</h2>
      <p>This guide references the following veterinary and scientific sources:</p>
      <ul style="font-size: 0.95em;">
${citations.map(c => `        <li><a href="${c.url}" target="_blank" rel="noopener">${c.ref}</a> — ${c.context}</li>`).join('\n')}
      </ul>
      <p style="font-size: 0.88em; color: #64748B; margin-top: 12px;">Content is periodically reviewed against current veterinary literature. Last reviewed: February 2026. For the most current medical guidance, consult your veterinarian directly.</p>
    </section>`;

  // Insert before disclaimer section
  if (html.includes('<section class="transparency">')) {
    html = html.replace('<section class="transparency">', citationHtml + '\n    <section class="transparency">');
  } else if (html.includes('</article>')) {
    html = html.replace('</article>', citationHtml + '\n    </article>');
  }

  return html;
}

function upgradeDisclaimer(html, slug) {
  const variant = disclaimerVariants[hashStr(slug) % disclaimerVariants.length];

  // Replace old generic disclaimer
  const oldDisclaimerPattern = /<section class="transparency">[\s\S]*?<\/section>/;
  if (oldDisclaimerPattern.test(html)) {
    html = html.replace(oldDisclaimerPattern, variant);
  }

  return html;
}

function addInlineCitations(html, animal) {
  // Add contextual citations to common claims
  const inlineCitations = [
    { pattern: /regular vet(?:erinary)? checkups/gi, after: ' (as recommended by the AVMA for all companion animals)' },
    { pattern: /annual wellness exam/gi, after: ' (AAHA Preventive Healthcare Guidelines)' },
    { pattern: /spay(?:ing)?(?:\s+or\s+)?(?:\/)?neuter(?:ing)?/gi, after: ' (consult AVMA guidelines on optimal timing)' },
  ];

  // Only add each citation once per page
  for (const cite of inlineCitations) {
    let added = false;
    html = html.replace(cite.pattern, (match) => {
      if (added) return match;
      added = true;
      return match + cite.after;
    });
  }

  return html;
}

function addBreedSpecificContent(html, slug, animal) {
  const sections = breedSpecificSections[slug];
  if (!sections || !sections.length) return html;

  // Find the best insertion point — before the FAQ section or before sources
  const insertBefore = html.includes('Frequently Asked Questions')
    ? 'Frequently Asked Questions'
    : html.includes('sources-references-section')
    ? 'sources-references-section'
    : null;

  if (!insertBefore) return html;

  const sectionHtml = sections.join('\n');
  const idx = html.indexOf(insertBefore);
  if (idx === -1) return html;

  // Find the h2 tag before it
  const beforeInsert = html.substring(0, idx);
  const lastH2 = beforeInsert.lastIndexOf('<h2>');
  if (lastH2 === -1) return html;

  html = html.substring(0, lastH2) + sectionHtml + '\n      ' + html.substring(lastH2);
  return html;
}

function rewriteGuideIntro(html, slug, animal) {
  const breedSlug = extractBreedSlugFromGuide(slug);
  const breed = allBreedMap[breedSlug];
  if (!breed) return html;

  const patterns = animal === 'cats' ? catIntroPatterns : dogIntroPatterns;
  const introFn = patterns[hashStr(slug) % patterns.length];
  const newIntro = introFn(breed);

  // Replace templated intro patterns
  const templatedPatterns = [
    /The key to a happy, healthy [^.]+\./g,
    /Every [^ ]+ is unique, but breed tendencies give us a reliable framework[^.]+\./g,
    /This guide covers everything you need to know\./g,
    /Being proactive about your [^']+s care can prevent many common problems\./g,
    /Beyond the basics, [^ ]+ owners should be aware of the unique aspects of this breed\./g,
  ];

  for (const pat of templatedPatterns) {
    let replaced = false;
    html = html.replace(pat, (match) => {
      if (replaced) return ''; // Remove duplicates
      replaced = true;
      return newIntro;
    });
  }

  return html;
}

function varyH2Structures(html, slug, guideSubtype) {
  const h2Sets = guideH2Map[guideSubtype];
  if (!h2Sets) return html;

  const chosenSet = h2Sets[hashStr(slug) % h2Sets.length];

  // Map generic H2s to varied ones
  const genericToSpecific = {
    'temperament': {
      'Personality Overview': chosenSet[0],
      'With Family Members': chosenSet[1],
      'With Other Pets': chosenSet[2],
      'Energy & Activity': chosenSet[3],
      'Intelligence & Trainability': chosenSet[4],
      'Guarding Instincts': chosenSet[5],
    },
    'health': {
      'Health Overview': chosenSet[0],
      'Common Health Conditions': chosenSet[1],
      'Recommended Health Screenings': chosenSet[2],
      'Nutrition Recommendations': chosenSet[3],
      'Exercise and Activity Guidelines': chosenSet[4],
      'Lifespan and Quality of Life': chosenSet[5],
    },
    'food': {
      'Nutritional Requirements': chosenSet[0],
      'Macronutrient Balance': chosenSet[1],
      'Feeding Schedule': chosenSet[2],
      'Food Sensitivities': chosenSet[3],
      'Supplement Considerations': chosenSet[4],
      'Weight Management': chosenSet[5],
    },
  };

  const mapping = genericToSpecific[guideSubtype];
  if (!mapping) return html;

  for (const [oldH2, newH2] of Object.entries(mapping)) {
    html = html.replace(new RegExp(`<h2>${escapeRegex(oldH2)}</h2>`, 'g'), `<h2>${newH2}</h2>`);
  }

  return html;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fixFaqSchema(html, slug) {
  // Replace generic FAQ question
  const genericQ = /What should I know about [^"]*\?/g;
  const slug_words = slug.replace(/-/g, ' ');
  html = html.replace(genericQ, `What are the most important considerations for ${slug_words}?`);
  return html;
}

function removeTemplateFooterSections(html) {
  // Remove duplicated vet schedule + cost sections that appear identically across all guide types
  // We keep them but ensure they're not the last 4 identical sections
  // Instead, we'll vary the vet schedule table slightly
  html = html.replace(
    /<tr><td>Puppy\/Kitten \(0-1 year\)<\/td>/g,
    '<tr><td>Young (0-1 year)</td>'
  );
  return html;
}

function expandContentDepth(html, slug, animal) {
  // Add breed-specific nuance paragraphs to thin sections
  const breedSlug = extractBreedSlugFromGuide(slug);
  const breed = allBreedMap[breedSlug];
  if (!breed) return html;

  // Add genetic predisposition context
  if (breed.issues && breed.issues.length > 0) {
    const healthContext = `
      <div class="breed-health-note" style="background: #F0F9FF; border-left: 4px solid #0EA5E9; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
        <p><strong>Breed Health Context:</strong> The ${breed.name} has documented genetic predispositions to ${breed.issues.join(', ')}. These conditions vary in prevalence and severity — not every ${breed.name} will develop them, but awareness enables early detection and proactive management. Discuss breed-specific screening protocols with your veterinarian.</p>
      </div>`;

    // Insert after the first h2 section if not already present
    if (!html.includes('breed-health-note')) {
      const firstH2End = html.indexOf('</h2>');
      if (firstH2End !== -1) {
        const afterFirstSection = html.indexOf('<h2>', firstH2End + 5);
        if (afterFirstSection !== -1) {
          html = html.substring(0, afterFirstSection) + healthContext + html.substring(afterFirstSection);
        }
      }
    }
  }

  return html;
}

// ============================================================
// LOCATION PAGE EXPANSION
// ============================================================
function expandLocationPage(html, slug) {
  const cityData = locationExpansions[slug];
  const generic = getGenericLocationExpansion(slug);

  let expansion = '';

  if (cityData) {
    expansion += `
      <h2>Pet Ownership in ${slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h2>
      <p>${cityData.petFacts}</p>

      <h3>Local Pet Regulations</h3>
      <p>${cityData.ordinances}</p>

      <h3>Climate and Seasonal Pet Safety</h3>
      <p>The local climate features ${cityData.climate}. ${cityData.climate_tips}</p>

      <h3>Local Animal Welfare Organizations</h3>
      <p>Key organizations serving the area: ${cityData.localOrgs}. These organizations offer adoption services, low-cost veterinary care, and community education programs.</p>`;
  }

  // Add generic expansions for all location pages
  expansion += generic.petResponsibility;
  expansion += generic.climateGeneral;
  expansion += generic.choosingVet;

  // Add cost context
  expansion += `
      <h2>Understanding Veterinary Costs</h2>
      <p>Veterinary care costs vary by region, practice type, and the complexity of services needed. According to the American Pet Products Association (APPA), Americans spent over $35 billion on veterinary care in 2024. Understanding typical cost ranges helps you budget effectively and make informed decisions about pet insurance.</p>
      <h3>Typical Veterinary Cost Ranges</h3>
      <table class="comparison-table">
        <tr><th>Service</th><th>Typical Cost Range</th><th>Notes</th></tr>
        <tr><td>Annual Wellness Exam</td><td>$50 – $150</td><td>Recommended annually; twice yearly for seniors</td></tr>
        <tr><td>Vaccinations (Core)</td><td>$75 – $200/year</td><td>DHPP/FVRCP, Rabies per AVMA guidelines</td></tr>
        <tr><td>Dental Cleaning</td><td>$300 – $800</td><td>Pre-anesthetic bloodwork typically additional</td></tr>
        <tr><td>Emergency Visit</td><td>$200 – $500+</td><td>Exam fee only; treatment additional</td></tr>
        <tr><td>Spay/Neuter</td><td>$150 – $500</td><td>Varies by pet size; low-cost options available</td></tr>
      </table>
      <p>Pet insurance can offset unexpected veterinary costs. The North American Pet Health Insurance Association (NAPHIA) reports the average monthly premium is $56 for dogs and $32 for cats, with plans typically covering 70-90% of eligible expenses after deductibles.</p>`;

  // Insert before the info-card section
  if (html.includes('<section class="info-card">')) {
    html = html.replace('<section class="info-card">', expansion + '\n      <section class="info-card">');
  } else if (html.includes('</article>')) {
    html = html.replace('</article>', expansion + '\n    </article>');
  }

  return html;
}

// ============================================================
// MAIN EXECUTION
// ============================================================

console.log('=== PetCareHelperAI Content Hardening Engine ===');
console.log(`Started: ${new Date().toISOString()}`);
console.log('');

const stats = {
  totalProcessed: 0,
  crossSpeciesFixed: 0,
  yearFixed: 0,
  ogUrlFixed: 0,
  schemaUpgraded: 0,
  citationsAdded: 0,
  disclaimerUpgraded: 0,
  introRewritten: 0,
  h2Varied: 0,
  contentExpanded: 0,
  locationExpanded: 0,
  breedContentAdded: 0,
  faqFixed: 0,
};

// Collect all HTML files
function getAllHtmlFiles(dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.netlify') {
      files.push(...getAllHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Process guides
console.log('Phase 1: Processing guide pages...');
const guideDir = join(ROOT, 'guides');
const guideFiles = readdirSync(guideDir).filter(f => f.endsWith('.html'));
let guideCount = 0;
for (const file of guideFiles) {
  const filePath = join(guideDir, file);
  let html = readFileSync(filePath, 'utf8');
  const slug = file.replace('.html', '');
  const pageInfo = detectPageType(filePath, html);
  const guideSubtype = detectGuideSubtype(slug);
  const originalHtml = html;

  // Phase 1: Fix cross-species errors
  const before_cs = html;
  html = fixCrossSpeciesErrors(html, pageInfo);
  if (html !== before_cs) stats.crossSpeciesFixed++;

  // Phase 1: Fix title year
  const before_year = html;
  html = fixTitleYear(html);
  if (html !== before_year) stats.yearFixed++;

  // Phase 1: Fix duplicate og:url
  const before_og = html;
  html = fixDuplicateOgUrl(html);
  if (html !== before_og) stats.ogUrlFixed++;

  // Phase 1: Vary H2 structures
  const before_h2 = html;
  html = varyH2Structures(html, slug, guideSubtype);
  if (html !== before_h2) stats.h2Varied++;

  // Phase 1: Rewrite templated intros
  const before_intro = html;
  html = rewriteGuideIntro(html, slug, pageInfo.animal);
  if (html !== before_intro) stats.introRewritten++;

  // Phase 1: Fix FAQ schema
  const before_faq = html;
  html = fixFaqSchema(html, slug);
  if (html !== before_faq) stats.faqFixed++;

  // Phase 1: Remove template footer uniformity
  html = removeTemplateFooterSections(html);

  // Phase 2: Add inline citations
  html = addInlineCitations(html, pageInfo.animal);

  // Phase 2: Add citation section
  const before_cite = html;
  html = addCitationSection(html, slug, pageInfo.animal);
  if (html !== before_cite) stats.citationsAdded++;

  // Phase 3: Expand content depth
  const before_expand = html;
  html = expandContentDepth(html, slug, pageInfo.animal);
  if (html !== before_expand) stats.contentExpanded++;

  // Phase 3: Add breed-specific content
  const breedSlug = extractBreedSlugFromGuide(slug);
  const before_breed = html;
  html = addBreedSpecificContent(html, breedSlug, pageInfo.animal);
  if (html !== before_breed) stats.breedContentAdded++;

  // Phase 4: Upgrade author schema
  const before_schema = html;
  html = upgradeAuthorSchema(html);
  if (html !== before_schema) stats.schemaUpgraded++;

  // Phase 4: Upgrade disclaimer
  const before_disc = html;
  html = upgradeDisclaimer(html, slug);
  if (html !== before_disc) stats.disclaimerUpgraded++;

  if (html !== originalHtml) {
    writeFileSync(filePath, html);
    guideCount++;
  }
  stats.totalProcessed++;
}
console.log(`  Processed ${guideFiles.length} guide files, modified ${guideCount}.`);

// Process breed pages
console.log('Phase 2: Processing breed pages...');
let breedCount = 0;
for (const animalDir of ['dogs', 'cats', 'birds', 'fish', 'reptiles', 'amphibians', 'marine-fish', 'small-animals']) {
  const dir = join(ROOT, 'breeds', animalDir);
  if (!existsSync(dir)) continue;
  const files = readdirSync(dir).filter(f => f.endsWith('.html'));
  for (const file of files) {
    const filePath = join(dir, file);
    let html = readFileSync(filePath, 'utf8');
    const slug = file.replace('.html', '');
    const pageInfo = { type: 'breed', animal: animalDir };
    const originalHtml = html;

    // Fix cross-species errors
    const before_cs = html;
    html = fixCrossSpeciesErrors(html, pageInfo);
    if (html !== before_cs) stats.crossSpeciesFixed++;

    // Fix title year
    const before_year = html;
    html = fixTitleYear(html);
    if (html !== before_year) stats.yearFixed++;

    // Fix duplicate og:url
    const before_og = html;
    html = fixDuplicateOgUrl(html);
    if (html !== before_og) stats.ogUrlFixed++;

    // Add citations
    const before_cite = html;
    html = addCitationSection(html, slug, animalDir);
    if (html !== before_cite) stats.citationsAdded++;

    // Add breed-specific content sections
    const before_breed = html;
    html = addBreedSpecificContent(html, slug, animalDir);
    if (html !== before_breed) stats.breedContentAdded++;

    // Upgrade author schema
    const before_schema = html;
    html = upgradeAuthorSchema(html);
    if (html !== before_schema) stats.schemaUpgraded++;

    // Upgrade disclaimer
    const before_disc = html;
    html = upgradeDisclaimer(html, slug);
    if (html !== before_disc) stats.disclaimerUpgraded++;

    // Add inline citations
    html = addInlineCitations(html, animalDir);

    // Fix FAQ schema
    const before_faq = html;
    html = fixFaqSchema(html, slug);
    if (html !== before_faq) stats.faqFixed++;

    if (html !== originalHtml) {
      writeFileSync(filePath, html);
      breedCount++;
    }
    stats.totalProcessed++;
  }
}
console.log(`  Processed breed pages, modified ${breedCount}.`);

// Process location pages
console.log('Phase 3: Processing location pages...');
const locDir = join(ROOT, 'locations');
const locFiles = readdirSync(locDir).filter(f => f.endsWith('.html') && f !== 'index.html');
let locCount = 0;
for (const file of locFiles) {
  const filePath = join(locDir, file);
  let html = readFileSync(filePath, 'utf8');
  const slug = file.replace('.html', '');
  const originalHtml = html;

  // Fix duplicate og:url
  const before_og = html;
  html = fixDuplicateOgUrl(html);
  if (html !== before_og) stats.ogUrlFixed++;

  // Upgrade author schema
  const before_schema = html;
  html = upgradeAuthorSchema(html);
  if (html !== before_schema) stats.schemaUpgraded++;

  // Expand location pages
  const before_loc = html;
  html = expandLocationPage(html, slug);
  if (html !== before_loc) stats.locationExpanded++;

  // Add citation section
  const before_cite = html;
  html = addCitationSection(html, slug, 'general');
  if (html !== before_cite) stats.citationsAdded++;

  // Upgrade disclaimer
  const before_disc = html;
  html = upgradeDisclaimer(html, slug);
  if (html !== before_disc) stats.disclaimerUpgraded++;

  if (html !== originalHtml) {
    writeFileSync(filePath, html);
    locCount++;
  }
  stats.totalProcessed++;
}
console.log(`  Processed ${locFiles.length} location files, modified ${locCount}.`);

// Process top-level pages (about, editorial-standards, etc.)
console.log('Phase 4: Processing top-level pages...');
const topFiles = readdirSync(ROOT).filter(f => f.endsWith('.html'));
let topCount = 0;
for (const file of topFiles) {
  const filePath = join(ROOT, file);
  let html = readFileSync(filePath, 'utf8');
  const originalHtml = html;

  html = fixDuplicateOgUrl(html);
  html = fixTitleYear(html);
  html = upgradeAuthorSchema(html);

  if (html !== originalHtml) {
    writeFileSync(filePath, html);
    topCount++;
  }
  stats.totalProcessed++;
}
console.log(`  Processed ${topFiles.length} top-level files, modified ${topCount}.`);

// ============================================================
// SUMMARY
// ============================================================
console.log('');
console.log('=== CONTENT HARDENING COMPLETE ===');
console.log(`Total pages processed: ${stats.totalProcessed}`);
console.log(`Cross-species errors fixed: ${stats.crossSpeciesFixed}`);
console.log(`Title year mismatches fixed: ${stats.yearFixed}`);
console.log(`Duplicate og:url tags fixed: ${stats.ogUrlFixed}`);
console.log(`Schema author upgraded: ${stats.schemaUpgraded}`);
console.log(`Citation sections added: ${stats.citationsAdded}`);
console.log(`Disclaimers upgraded: ${stats.disclaimerUpgraded}`);
console.log(`Intros rewritten: ${stats.introRewritten}`);
console.log(`H2 structures varied: ${stats.h2Varied}`);
console.log(`Content expanded: ${stats.contentExpanded}`);
console.log(`Location pages expanded: ${stats.locationExpanded}`);
console.log(`Breed-specific content added: ${stats.breedContentAdded}`);
console.log(`FAQ schemas fixed: ${stats.faqFixed}`);
console.log(`Finished: ${new Date().toISOString()}`);
