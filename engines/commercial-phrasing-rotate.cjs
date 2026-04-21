#!/usr/bin/env node
/**
 * Rotate repeated commercial phrasing across insurance/cost/health-cost/first-time-owners pages.
 * Deterministic by slug hash so each page picks one variant consistently.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const COMMERCIAL = path.join(ROOT, 'commercial');

function hashIndex(key, modulo) {
  const h = crypto.createHash('md5').update(key).digest('hex');
  return parseInt(h.slice(0, 8), 16) % modulo;
}

// ---------- Insurance page rotations ----------
const INSURANCE_HEADINGS = [
  'What to Look For in Pet Insurance',
  'How to Compare Pet Insurance Plans',
  'Reading a Pet Insurance Quote Carefully',
  'Questions Worth Asking Before You Buy',
  'What Actually Differentiates Pet Insurance Plans',
  'Before You Sign the Policy',
];

const INSURANCE_BULLETS_SETS = [
  // set 0
  [
    '<li><strong>Coverage breadth:</strong> Accidents, illnesses, hereditary conditions, and emergency care.</li>',
    '<li><strong>Reimbursement rate:</strong> Most plans offer 70-90% reimbursement after deductible.</li>',
    '<li><strong>Annual limits:</strong> Choose unlimited or high annual limits for comprehensive protection.</li>',
    '<li><strong>Deductible options:</strong> Lower deductibles mean higher premiums but less out-of-pocket per incident.</li>',
    '<li><strong>Waiting periods:</strong> Understand how long before coverage begins for different conditions.</li>',
  ],
  // set 1
  [
    '<li><strong>What is actually covered:</strong> accidents versus illness versus hereditary and congenital conditions \u2014 the cheapest plans drop the last bucket quietly.</li>',
    '<li><strong>Payout percentage:</strong> 80%, 90%, or 100% of the vet bill after your deductible is met. The gap between 80% and 90% matters on a $6,000 TPLO surgery.</li>',
    '<li><strong>Annual maximum:</strong> unlimited is easiest to reason about; capped plans at $10,000 can be hit in a single cancer treatment year.</li>',
    '<li><strong>Deductible shape:</strong> annual versus per-condition deductibles behave very differently over a multi-year chronic illness.</li>',
    '<li><strong>Waiting windows:</strong> 14 days for illness and 6 months for cruciate injuries is common. Read this line before anything else.</li>',
  ],
  // set 2
  [
    '<li><strong>Scope of what is insured:</strong> look for plans that name hereditary, congenital, behavioural, and dental illness explicitly in the covered list.</li>',
    '<li><strong>Reimbursement percentage:</strong> commonly 70%, 80%, or 90%. Higher percentages cost more up front but cushion big years.</li>',
    '<li><strong>Per-year payout ceiling:</strong> plans range from $5,000 per year to truly unlimited. For a breed prone to surgery, unlimited is usually worth the premium.</li>',
    '<li><strong>Deductible mechanics:</strong> annual deductibles reset each policy year; per-incident deductibles apply separately to every new condition.</li>',
    '<li><strong>Waiting periods and retroactive clauses:</strong> most plans exclude anything diagnosed or treated in the 14 days after signup and the 6 months for orthopaedic issues.</li>',
  ],
  // set 3
  [
    '<li><strong>Condition coverage:</strong> check explicit language on hip dysplasia, cruciate injuries, cancer, dental illness, and behavioural therapy \u2014 silence in the policy usually means exclusion.</li>',
    '<li><strong>Payout rate:</strong> the reimbursement percentage after you meet your deductible. Compare 70/80/90% quotes on the same scenario, not on marketing pages.</li>',
    '<li><strong>Coverage ceiling:</strong> annual maximums below $10,000 will feel tight in a bad orthopaedic or oncology year.</li>',
    '<li><strong>Deductible design:</strong> lower deductibles raise the monthly premium; higher deductibles lower it and push more of small claims onto you.</li>',
    '<li><strong>Time gates:</strong> pre-existing exclusions, cruciate waiting periods, and enrolment-date requirements decide whether your first claim is paid.</li>',
  ],
  // set 4
  [
    '<li><strong>What the plan actually pays for:</strong> verify that hereditary, chronic, hidden-developmental, and emergency conditions are all in scope, not just accidents.</li>',
    '<li><strong>How the reimbursement maths works:</strong> most plans pay 70\u201390% of the vet bill after the annual deductible. Run the number against a $4,000 surgery before signing.</li>',
    '<li><strong>Annual coverage cap:</strong> a $5,000 cap disappears quickly on a cancer diagnosis; unlimited or $15,000+ is a more durable floor.</li>',
    '<li><strong>Deductible approach:</strong> annual (one per policy year) versus per-condition (one per new illness) change your total cost profile drastically on a chronic case.</li>',
    '<li><strong>Waiting periods:</strong> the clock between policy start and coverage start \u2014 typically 14 days for illness, up to 6 months for ligament injuries and hip dysplasia.</li>',
  ],
];

const INSURANCE_PREMIUM_HEADINGS = [
  'Estimated Monthly Premiums',
  'Typical Monthly Pricing',
  'What Plans Usually Cost Per Month',
  'Indicative Monthly Costs',
  'Monthly Price Bands',
];

const COVERAGE_TYPES_HEADINGS = [
  'Coverage Types Explained',
  'How the Three Plan Types Differ',
  'Plan Tiers at a Glance',
  'Accident, Illness, and Wellness \u2014 What Each One Covers',
  'The Three Coverage Tiers',
];

const COVERAGE_TYPES_BULLETS_SETS = [
  [
    '<li><strong>Accident-only plans:</strong> Cover injuries from accidents like broken bones, lacerations, and ingestion of foreign objects.</li>',
    '<li><strong>Comprehensive plans:</strong> Cover both accidents and illnesses including cancer, infections, and chronic conditions.</li>',
    '<li><strong>Wellness plans:</strong> Add-on coverage for routine care like vaccinations, dental cleanings, and annual checkups.</li>',
  ],
  [
    '<li><strong>Accident-only:</strong> covers the trauma cases \u2014 torn ligaments, lacerations, foreign-body swallowing, fractures from falls. Cheapest tier; no cancer, no chronic disease.</li>',
    '<li><strong>Accident and illness (comprehensive):</strong> adds diagnostic workups, cancer, infections, hereditary disease, and long-term conditions. The tier most households actually want.</li>',
    '<li><strong>Wellness riders:</strong> optional bolt-ons that reimburse predictable spending \u2014 vaccines, annual exam, dental cleaning, heartworm prevention. Financially closer to a savings account than true insurance.</li>',
  ],
  [
    '<li><strong>Accident plans:</strong> designed for the emergency visit \u2014 hit-by-car, cut pad, swallowed toy. They do not help with illness diagnosis or management.</li>',
    '<li><strong>Comprehensive plans:</strong> the standard offer \u2014 covers accidents plus illness, cancer, hereditary conditions, and often behavioural therapy.</li>',
    '<li><strong>Wellness add-ons:</strong> separate routine-care budgets for vaccines, annual wellness exams, and dental cleanings. Useful for new-pet households; usually a wash for established ones.</li>',
  ],
  [
    '<li><strong>Accident-only coverage:</strong> the narrowest tier; it activates on trauma only. Works for young, healthy dogs where the main risk is a broken leg or a swallowed sock.</li>',
    '<li><strong>Accident-plus-illness coverage:</strong> the mainstream tier \u2014 covers most diagnostic workups, infections, cancer, and chronic disease. The one most owners end up buying.</li>',
    '<li><strong>Routine-care add-on:</strong> a wellness rider that reimburses planned-for spending. Rarely worth the extra premium beyond a puppy or kitten year.</li>',
  ],
  [
    '<li><strong>Accidents only:</strong> a cheap emergency-room policy \u2014 you pay monthly against the chance of a one-day catastrophe.</li>',
    '<li><strong>Full medical (accident + illness):</strong> the version most people think of as pet insurance \u2014 covers investigation and treatment for almost any new illness.</li>',
    '<li><strong>Wellness rider:</strong> covers the predictable line items \u2014 vaccines, heartworm prevention, dental cleaning. Useful when budgeting rather than when hedging risk.</li>',
  ],
];

// ---------- Cost-to-own page rotations ----------
const COST_TO_OWN_HEADINGS = [
  ['<h2>Cost Summary at a Glance</h2>', [
    '<h2>Cost Summary at a Glance</h2>',
    '<h2>The Cost Picture in One View</h2>',
    '<h2>Quick Cost Overview</h2>',
    '<h2>Budget Snapshot</h2>',
    '<h2>At-a-Glance Cost Profile</h2>',
    '<h2>Cost Overview Before the Details</h2>',
  ]],
  ['<h2>Startup Cost Breakdown</h2>', [
    '<h2>Startup Cost Breakdown</h2>',
    '<h2>Upfront Setup Costs</h2>',
    '<h2>Initial Acquisition and Setup Spend</h2>',
    '<h2>Day-One Cost Breakdown</h2>',
    '<h2>The Getting-Started Spending</h2>',
    '<h2>One-Time Setup Costs</h2>',
  ]],
  ['<h2>Ongoing Monthly Expenses</h2>', [
    '<h2>Ongoing Monthly Expenses</h2>',
    '<h2>Recurring Monthly Spending</h2>',
    '<h2>What the Monthly Bill Looks Like</h2>',
    '<h2>Month-over-Month Costs</h2>',
    '<h2>Typical Monthly Outgoings</h2>',
    '<h2>The Monthly Cost Line</h2>',
  ]],
  ['<h2>Ways to Save</h2>', [
    '<h2>Ways to Save</h2>',
    '<h2>Where the Savings Actually Sit</h2>',
    '<h2>Cost Levers Worth Pulling</h2>',
    '<h2>Realistic Places to Cut</h2>',
    '<h2>Spending You Can Trim Without Compromising Care</h2>',
    '<h2>Practical Savings</h2>',
  ]],
];

// ---------- First-time owners rotations ----------
const FTO_HEADINGS = [
  ['<h2>Quick Assessment</h2>', [
    '<h2>Quick Assessment</h2>',
    '<h2>A Fast Read on Fit</h2>',
    '<h2>A Quick Self-Check</h2>',
    '<h2>Short Assessment: Is This the Right Match?</h2>',
    '<h2>The Quick Fit Test</h2>',
    '<h2>Honest First Read</h2>',
  ]],
  ['<h2>Starter Essentials</h2>', [
    '<h2>Starter Essentials</h2>',
    '<h2>Day-One Essentials</h2>',
    '<h2>The Realistic Starter Kit</h2>',
    '<h2>What You Actually Need From Day One</h2>',
    '<h2>First-Week Essentials</h2>',
    '<h2>The Honest Starter List</h2>',
  ]],
  ['<h2>Pros for First-Time Owners</h2>', [
    '<h2>Pros for First-Time Owners</h2>',
    '<h2>Why This Choice Works for Newer Owners</h2>',
    '<h2>What Makes This an Approachable First Pet</h2>',
    '<h2>The Case in Favour</h2>',
    '<h2>Where First-Time Owners Tend to Do Well</h2>',
    '<h2>Strengths for Newer Owners</h2>',
  ]],
  ['<h2>Challenges to Consider</h2>', [
    '<h2>Challenges to Consider</h2>',
    '<h2>The Honest Downsides</h2>',
    '<h2>What Tends to Trip Up New Owners</h2>',
    '<h2>The Harder Parts Worth Knowing About</h2>',
    '<h2>Where Newer Owners Usually Struggle</h2>',
    '<h2>The Unglamorous Bits</h2>',
  ]],
  ['<h2>First-Time Owner Checklist</h2>', [
    '<h2>First-Time Owner Checklist</h2>',
    '<h2>A Practical First-Month Checklist</h2>',
    '<h2>The Getting-Ready Checklist</h2>',
    '<h2>First-Time Owner Readiness Checklist</h2>',
    '<h2>Week-One Checklist</h2>',
    '<h2>What to Have Sorted Before Pickup Day</h2>',
  ]],
];

// ---------- Health-costs rotations ----------
const HC_HEADINGS = [
  ['<h2>Protect Against Unexpected Costs</h2>', [
    '<h2>Protect Against Unexpected Costs</h2>',
    '<h2>Cushioning Against the Big Surprises</h2>',
    '<h2>How to Absorb a Bad Year</h2>',
    '<h2>Financial Protection From the Outlier Years</h2>',
    '<h2>Hedging Against the Expensive Weeks</h2>',
    '<h2>Handling the Unbudgeted Bills</h2>',
  ]],
  ['<h2>Prevention Tips</h2>', [
    '<h2>Prevention Tips</h2>',
    '<h2>Where Prevention Actually Pays</h2>',
    '<h2>Preventive Moves Worth Making</h2>',
    '<h2>Realistic Prevention</h2>',
    '<h2>Prevention That Actually Moves the Needle</h2>',
    '<h2>The Preventive Levers</h2>',
  ]],
  ['<h2>Building a Vet Fund</h2>', [
    '<h2>Building a Vet Fund</h2>',
    '<h2>A Simple Vet-Care Savings Plan</h2>',
    '<h2>Setting Up a Vet Emergency Fund</h2>',
    '<h2>A Practical Approach to Saving for Care</h2>',
    '<h2>The Vet-Care Savings Habit</h2>',
    '<h2>Building Up a Dedicated Care Fund</h2>',
  ]],
];

// ---------- Generic templated closer phrase rotations ----------
const GENERIC_REPLACEMENTS = [
  // Very common filler from the original templated copy.
  {
    find: 'Consistent effort here does more for lifetime outcomes than bursts of effort when a specific problem arises.',
    variants: [
      'Small, steady habits compound more than a single well-meant intervention.',
      'Day-to-day consistency will shape outcomes more than any one heroic push.',
      'Quiet, consistent attention beats bursts of effort every time on this one.',
      'The reliable middle of the bell curve \u2014 steady routines \u2014 is where lifetime outcomes actually come from.',
      'Consistency outperforms intensity here by a wide margin.',
    ],
  },
  {
    find: 'Use broad guidance to orient yourself, then let the meaningful personalisation happen around the animal you actually live with.',
    variants: [
      'General guidance is a useful start, but the details that matter emerge from the specific animal in front of you.',
      'Start from the generic framework, then let the individual animal reshape it \u2014 that is where the real decisions sit.',
      'National averages orient; the animal in your home refines.',
      'Broad rules are the outline; the animal you actually live with supplies the specifics.',
      'Treat generic advice as a floor, not a ceiling, and let the individual animal raise it.',
    ],
  },
  {
    find: 'Owners who bother to understand the',
    // keep rest unchanged; replace entire common sentence via regex later
    variants: null,
  },
];

function rotateHeading(html, oldText, newVariants, key) {
  if (!html.includes(oldText)) return html;
  const idx = hashIndex(key + oldText, newVariants.length);
  return html.replace(oldText, newVariants[idx]);
}

function rotateBulletBlock(html, firstBullet, allSets, key, blockKey) {
  if (!html.includes(firstBullet)) return html;
  const setIdx = hashIndex(key + blockKey, allSets.length);
  const oldSet = allSets[0];
  const newSet = allSets[setIdx];
  const oldBlock = oldSet.join('\n        ');
  const newBlock = newSet.join('\n        ');
  if (!html.includes(oldBlock)) return html;
  return html.replace(oldBlock, newBlock);
}

function processInsurancePage(file, key, html) {
  html = rotateHeading(html, '<h2>What to Look For in Pet Insurance</h2>',
    INSURANCE_HEADINGS.map(t => `<h2>${t}</h2>`), key);
  html = rotateHeading(html, '<h2>Estimated Monthly Premiums</h2>',
    INSURANCE_PREMIUM_HEADINGS.map(t => `<h2>${t}</h2>`), key);
  html = rotateHeading(html, '<h2>Coverage Types Explained</h2>',
    COVERAGE_TYPES_HEADINGS.map(t => `<h2>${t}</h2>`), key);

  html = rotateBulletBlock(html,
    INSURANCE_BULLETS_SETS[0][0],
    INSURANCE_BULLETS_SETS, key, 'insurance-bullets');
  html = rotateBulletBlock(html,
    COVERAGE_TYPES_BULLETS_SETS[0][0],
    COVERAGE_TYPES_BULLETS_SETS, key, 'coverage-bullets');

  return html;
}

function processHeadingsOnly(html, headingGroups, key) {
  for (const [target, variants] of headingGroups) {
    if (!variants) continue;
    if (!html.includes(target)) continue;
    const idx = hashIndex(key + target, variants.length);
    html = html.split(target).join(variants[idx]);
  }
  return html;
}

function processGeneric(html, key) {
  for (const rule of GENERIC_REPLACEMENTS) {
    if (!rule.variants) continue;
    if (!html.includes(rule.find)) continue;
    const idx = hashIndex(key + rule.find, rule.variants.length);
    html = html.split(rule.find).join(rule.variants[idx]);
  }
  return html;
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile() && entry.name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

function main() {
  const files = walk(COMMERCIAL);
  let changed = 0;
  const byType = { insurance: 0, 'cost-to-own': 0, 'first-time-owners': 0, 'health-costs': 0, generic: 0 };

  for (const file of files) {
    const key = path.relative(COMMERCIAL, file);
    let html = fs.readFileSync(file, 'utf8');
    const original = html;

    const base = path.basename(file);
    if (base === 'best-insurance.html') {
      html = processInsurancePage(file, key, html);
      if (html !== original) byType.insurance++;
    } else if (base === 'cost-to-own.html') {
      html = processHeadingsOnly(html, COST_TO_OWN_HEADINGS, key);
      if (html !== original) byType['cost-to-own']++;
    } else if (base === 'first-time-owners.html') {
      html = processHeadingsOnly(html, FTO_HEADINGS, key);
      if (html !== original) byType['first-time-owners']++;
    } else if (base === 'health-costs.html') {
      html = processHeadingsOnly(html, HC_HEADINGS, key);
      if (html !== original) byType['health-costs']++;
    }

    html = processGeneric(html, key);

    if (html !== original) {
      fs.writeFileSync(file, html);
      changed++;
      if (!base.startsWith('best-insurance') && !base.startsWith('cost-to-own') &&
          !base.startsWith('first-time-owners') && !base.startsWith('health-costs')) {
        byType.generic++;
      }
    }
  }

  console.log(JSON.stringify({ changed, byType, scanned: files.length }, null, 2));
}

main();
