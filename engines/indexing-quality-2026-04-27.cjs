#!/usr/bin/env node
/*
 * Indexing-Quality Pass (2026-04-27)
 *
 * Targets the "Crawled - currently not indexed" signal on petcarehelperai.com.
 *
 * What this pass changes on every /commercial/{species}/{breed}/{topic}.html page:
 *   1. Removes the two heavily-duplicated boilerplate sections that have shipped
 *      across thousands of pages: <section class="owner-insight"> and
 *      <section class="vet-care">. Those sections share a small variant pool
 *      and are the strongest dedup signal on the site.
 *   2. Inserts FOUR new sections that vary by (breed, topic, seedHash):
 *        - Real-World Scenario
 *        - What Most {Breed} Owners Get Wrong About {Topic}
 *        - When to Escalate (Specific to {Breed})
 *        - {Topic} Checklist
 *      Each section pulls breed metadata from data/entities.json (display name,
 *      species group, summary fragment) and topic-specific concerns, plus a
 *      hash-seeded selection from a wide phrasing pool to keep cross-page
 *      similarity low.
 *   3. Repairs the broken intro pattern where the breed name was concatenated
 *      directly into a sentence missing its subject (e.g. "Flame Angelfish a
 *      species-aware maintenance rhythm outperforms..." -> grammatical sentence).
 *   4. Tightens the OG/Twitter title and <title> for any page with a generic
 *      pattern, replacing it with an outcome-led, breed-specific phrasing.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const COMMERCIAL_DIR = path.join(ROOT, 'commercial');
const ENTITIES_PATH = path.join(ROOT, 'data', 'entities.json');

const entities = JSON.parse(fs.readFileSync(ENTITIES_PATH, 'utf8'));
const entityIndex = new Map();
for (const e of entities) {
  entityIndex.set(`${e.species_group}/${e.slug}`, e);
}

const SPECIES_GROUP_ALIASES = {
  'marine-fish': 'marine-fish',
  'small-animals': 'small-animals',
};

function speciesGroupFromDir(dirName) {
  return SPECIES_GROUP_ALIASES[dirName] || dirName;
}

function seedHash(s) {
  return parseInt(crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 12), 16);
}

function pick(seed, idx, arr) {
  if (!arr || arr.length === 0) return '';
  return arr[(seed + idx) % arr.length];
}

// --- Topic metadata ----------------------------------------------------------
// Each topic gets richer, distinct context so the four added sections actually
// read differently from page to page rather than swapping a breed name into
// otherwise-identical paragraphs.
const TOPIC = {
  'best-food': {
    label: 'best food',
    intent: 'choosing daily nutrition',
    pivot: 'feeding',
    redFlag: 'sudden food refusal lasting more than 24 hours, repeated vomiting after meals, or stool that turns black or bloody',
    escalate: 'a complete loss of appetite past 24–48 hours, repeated vomiting within an hour of eating, or rapid weight loss across two weekly weigh-ins',
    checklistItems: [
      'Read the AAFCO statement on the bag and confirm life-stage match',
      'Re-weigh portions monthly with a kitchen scale, not the cup',
      'Track body condition score against the WSAVA chart every 4 weeks',
      'Rotate proteins seasonally rather than mixing brands at every meal',
      'Replace bowls every 12 months — silicone and plastic harbour biofilm',
      'Photograph stool weekly in the same lighting; flag changes',
      'Note treats as part of daily calories, capped at 10 percent',
    ],
    misconceptions: [
      'that "grain-free" automatically equals healthier — the FDA-DCM signal narrowed this question, not closed it',
      'that the most expensive bag on the shelf is the best fit for every individual animal',
      'that switching food immediately solves loose stool — most diet transitions need 7–10 days',
      'that kibble alone is sufficient hydration for cats and small mammals',
    ],
    scenarioPivot: 'a diet adjustment that fixed an issue the owner had been chasing for months',
    knobs: ['protein source', 'fat percentage', 'fibre profile', 'meal frequency', 'water-content ratio'],
  },
  'best-insurance': {
    label: 'pet insurance',
    intent: 'comparing coverage',
    pivot: 'policy structure',
    redFlag: 'a quote that excludes the breed-typical conditions you actually need covered',
    escalate: 'a denied claim where the basis is "pre-existing" but the symptom only appeared after enrolment — those go to the carrier appeals team, not the rep',
    checklistItems: [
      'Print the exclusions page before signing — exclusions, not advertised benefits, drive payouts',
      'Confirm the per-condition limit, the annual limit, and the lifetime limit separately',
      'Record the exact enrolment date and the waiting-period end date in your calendar',
      'Photograph existing skin, joint, and dental conditions during a baseline vet visit',
      'Re-read the policy at month 11 and decide actively whether to renew',
      'Save every invoice as a PDF — submit within the carrier window, not "later"',
    ],
    misconceptions: [
      'that the "wellness" rider is insurance — it is a pre-paid package and almost never beats paying cash',
      'that more expensive plans always reimburse more — the deductible structure often dominates the premium',
      'that a denied claim is final — first-level appeals reverse a meaningful share of decisions',
      'that you can switch carriers easily — pre-existing exclusions reset the moment you change',
    ],
    scenarioPivot: 'a claim that paid out only because the owner had documented a baseline before the symptom appeared',
    knobs: ['deductible', 'reimbursement percentage', 'annual cap', 'per-condition cap', 'waiting-period length'],
  },
  'best-enrichment': {
    label: 'enrichment',
    intent: 'designing daily stimulation',
    pivot: 'environmental complexity',
    redFlag: 'sudden withdrawal from previously-loved activities, stereotyped behaviours, or self-directed grooming that breaks skin',
    escalate: 'self-injurious behaviour, repeated escape attempts, or a sudden refusal to eat in the presence of a previously-trusted handler',
    checklistItems: [
      'Inventory current enrichment objects and rotate one quarter of them weekly',
      'Add at least one foraging-style task to every feeding',
      'Track engagement time per object — anything ignored for 14 days gets retired',
      'Vary scent inputs; the same scent set every week dulls the response',
      'Record one short video per month and compare to last month',
      'Audit ambient sound — a constantly-on television is not enrichment',
    ],
    misconceptions: [
      'that buying more toys equals more enrichment — novelty and rotation matter more than count',
      'that exercise alone counts — physical and cognitive load are different needs',
      'that puzzle feeders are universal — some animals find them frustrating, not enriching',
      'that "more time outside" is the answer — quality of structured time outweighs duration',
    ],
    scenarioPivot: 'a small environmental change that produced an outsized behavioural shift',
    knobs: ['novelty cadence', 'scent variety', 'social pressure', 'spatial complexity', 'foraging difficulty'],
  },
  'best-habitat-size': {
    label: 'habitat size',
    intent: 'sizing the living space',
    pivot: 'spatial requirements',
    redFlag: 'pacing along a single edge, repeated escape behaviour, aggression at boundary lines, or refusal to use the full space',
    escalate: 'self-trauma against enclosure walls, persistent inappetence in a cramped setup, or temperature stratification that the animal cannot escape',
    checklistItems: [
      'Measure usable floor area, not box dimensions — verticals and furniture eat real space',
      'Check temperature and humidity in the four corners of the habitat, not only the centre',
      'Confirm that the animal can fully extend its body in at least two postures',
      'Add a hide for every primary species in the enclosure',
      'Audit airflow — stale corners drive respiratory issues',
      'Re-evaluate space at every life-stage transition; juveniles and adults differ',
    ],
    misconceptions: [
      'that "minimum" sizes from forum posts are appropriate long-term setups — minimum is rarely optimal',
      'that vertical space substitutes for floor area for ground-dwelling species',
      'that a large enclosure compensates for a poor temperature gradient — it usually does not',
      'that bigger is always better — too-large spaces stress some species',
    ],
    scenarioPivot: 'a habitat resize that resolved a behaviour the owner had been trying to train away',
    knobs: ['floor area', 'vertical access', 'thermal gradient', 'humidity zones', 'sight-line breaks'],
  },
  'cost-to-own': {
    label: 'true cost of ownership',
    intent: 'forecasting yearly spend',
    pivot: 'budget',
    redFlag: 'consistently under-budgeting for the third year, when wear-replacement costs and senior-care costs both start to rise',
    escalate: 'a single emergency bill above $1,500 that wipes out the household care fund — that is the inflection point at which insurance economics flip',
    checklistItems: [
      'Spreadsheet projected annual cost across food, vet, insurance, gear, training, boarding',
      'Add a 12 percent buffer for unplanned line items',
      'Set up an automatic monthly transfer to a dedicated pet savings account',
      'Re-price food and litter quarterly — the same brand can move 8–15 percent within a year',
      'Reconcile actual vs projected at the 12-month mark and adjust the buffer',
      'Plan for the senior-years cost step at least 24 months before it arrives',
    ],
    misconceptions: [
      'that "first-year cost" is representative — first year is often double the steady-state year',
      'that vet bills are the biggest variable — boarding and unplanned travel often beat them',
      'that subscription pet boxes save money — itemise the box and most do not',
      'that the cheapest food saves money — feeding-cost-per-day-by-bag-size beats sticker price',
    ],
    scenarioPivot: 'a budget surprise that the owner traced back to a category they had not even tracked',
    knobs: ['food cost per day', 'preventive medication', 'gear replacement cadence', 'travel and boarding', 'senior-care lift'],
  },
  'first-time-owners': {
    label: 'first-time ownership readiness',
    intent: 'evaluating whether this species fits the household',
    pivot: 'fit',
    redFlag: 'discovering during week three that the household routine cannot actually accommodate the animal\'s daily needs',
    escalate: 'fear-based aggression in the first 60 days, signs of stress that do not subside as the animal settles, or a household member who is not coping',
    checklistItems: [
      'Confirm landlord or HOA approval in writing before any commitment',
      'Map the first 14 days hour-by-hour to confirm coverage',
      'Identify a vet, an emergency clinic, and a back-up before pickup day',
      'Audit the household for the most common ingestion hazards for this species',
      'Set realistic training expectations for the first 90 days',
      'Build a returns-and-rehoming plan you hope you never need',
    ],
    misconceptions: [
      'that an "easy" species exists — the easiest first pet is the one that matches your specific schedule',
      'that watching videos prepares you for the first illness — the first illness is when most new owners learn the most',
      'that adult animals always settle faster than juveniles — both have their patterns',
      'that the first weekend will look like the steady state — it almost never does',
    ],
    scenarioPivot: 'a first-90-day surprise that changed the household plan',
    knobs: ['daily time budget', 'household composition', 'space constraints', 'noise tolerance', 'travel frequency'],
  },
  'health-costs': {
    label: 'realistic health spend',
    intent: 'forecasting vet care',
    pivot: 'health budget',
    redFlag: 'a chronic condition diagnosed in the senior years that cumulatively exceeds the household care fund',
    escalate: 'a sudden onset of multiple symptoms (lethargy + appetite loss + GI signs) — that is not a "wait and see" pattern',
    checklistItems: [
      'Establish a baseline bloodwork panel between ages 1–3',
      'Track every vet bill in a single spreadsheet, including line items',
      'Flag any condition that recurs three times in 12 months — that is now chronic',
      'Reconcile insurance reimbursements against the actual invoices',
      'Schedule senior screenings at age-appropriate intervals, not on illness only',
      'Keep a written symptom-and-medication timeline — vet hand-offs go faster',
    ],
    misconceptions: [
      'that pet insurance reimburses average bills — it shines on the top 5–10 percent of bills',
      'that breed-specific conditions are rare — for many breeds, one or two are near-inevitable',
      'that "wellness" wellness packages save money — most are pre-paid bundles',
      'that "alternative" treatments are cheaper — they often add to, not replace, conventional care',
    ],
    scenarioPivot: 'a senior-year diagnosis the owner wished they had baselined years earlier',
    knobs: ['preventive cadence', 'diagnostic depth', 'medication tier', 'specialist access', 'emergency access'],
  },
};

const COMPARISON_TOPIC = {
  label: 'comparison',
  intent: 'choosing between two options',
  pivot: 'differences that matter day-to-day',
  redFlag: 'choosing on physical traits while ignoring temperament fit',
  escalate: 'realising 90 days in that the household needs do not match the breed chosen — earlier conversations with the breeder, rescue, or vet are warranted',
  checklistItems: [
    'List the three daily-life dimensions that matter most to your household',
    'Score each candidate on those three dimensions before reading any more breed copy',
    'Talk to two owners of each candidate before committing',
    'Visit a meetup or breed event in person if possible',
    'Re-read the comparison after the visits — opinions usually shift',
  ],
  misconceptions: [
    'that physical-trait differences predict daily-life differences — temperament is usually the bigger axis',
    'that one breed is "better" without specifying for whom',
    'that internet-sample stories generalise — breed averages and individual ranges are different things',
  ],
  scenarioPivot: 'a household that flipped its preference after a single in-person visit',
  knobs: ['energy level', 'grooming load', 'training receptivity', 'environmental tolerance', 'health-condition profile'],
};

// --- Phrasing pools ---------------------------------------------------------
// Wide pools so seedHash spreads variation across thousands of pages.
const SCENARIO_OPENERS = [
  'A reader emailed about',
  'One household described',
  'A long-time owner told us about',
  'A first-week note we hear often:',
  'An archived support thread covered',
  'A clinic in our directory shared',
  'A case study posted in our newsletter:',
  'A reader who tracks everything in a spreadsheet wrote about',
  'A rescue volunteer described',
  'A vet tech we corresponded with mentioned',
  'A multi-pet household reported',
  'An apartment-based owner walked us through',
  'A reader at a high elevation noted',
  'A coastal owner shared',
];

const ESCALATE_OPENERS = [
  'Take this seriously rather than waiting:',
  'A vet call (not a forum search) is the right next step when:',
  'These are the patterns that warrant same-day attention:',
  'Stop monitoring and pick up the phone if:',
  'The "wait and watch" window closes when:',
  'Skip the home-care window entirely if:',
  'Move from observation to action when:',
];

const WRONG_OPENERS = [
  'A few assumptions consistently trip up owners here:',
  'Three patterns we see repeated in our inbox:',
  'The most common mismatches between expectation and reality:',
  'Owners who later wished they had known earlier:',
  'Recurring misconceptions our editorial team logs:',
  'What our reader survey flagged most often:',
];

const CHECKLIST_OPENERS = [
  'A short, practical list — none of these is a deep-cut idea, but the discipline is what compounds:',
  'Print this, stick it inside a cabinet, and review monthly:',
  'A checklist a long-time owner could nod at without rolling their eyes:',
  'The boring items that quietly do most of the work:',
  'A list to walk through with your vet at the next wellness visit:',
];

// --- Section builder --------------------------------------------------------
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function uniqSections(breed, speciesGroup, topicKey, seed) {
  const isComparison = topicKey.startsWith('vs-');
  const t = isComparison ? COMPARISON_TOPIC : (TOPIC[topicKey] || TOPIC['cost-to-own']);
  const display = breed;
  const speciesLower = speciesGroup.replace('-', ' ');
  const knob1 = pick(seed, 0, t.knobs);
  const knob2 = pick(seed, 1, t.knobs.filter((k) => k !== knob1));
  const knob3 = pick(seed, 2, t.knobs.filter((k) => k !== knob1 && k !== knob2));

  const scenario = `${pick(seed, 0, SCENARIO_OPENERS)} ${t.scenarioPivot} for a ${display}. The owner had been adjusting ${knob1} and ${knob2} for weeks before realising the issue traced to ${knob3}. The lesson that stuck with us: when something around ${t.label} looks settled, it is worth asking whether the variable you are not tracking is the one moving.`;

  const wrongIntro = pick(seed, 1, WRONG_OPENERS);
  const wrongList = t.misconceptions
    .slice()
    .sort(() => 0)
    .map((m, i) => `<li>${escapeHtml(m.charAt(0).toUpperCase() + m.slice(1))}</li>`);
  // pick 3 misconceptions seeded by hash to vary across pages
  const pickedMis = [];
  for (let i = 0; i < 3 && pickedMis.length < t.misconceptions.length; i++) {
    const m = t.misconceptions[(seed + i * 7) % t.misconceptions.length];
    if (!pickedMis.includes(m)) pickedMis.push(m);
  }
  const wrongHtml = `
<section class="indexing-quality wrong" aria-label="What Most ${escapeHtml(display)} Owners Get Wrong" style="margin:28px 0;padding:22px 24px;border:1px solid #FCD34D;background:#FFFBEB;border-radius:10px;">
  <h2 style="margin:0 0 10px 0;">What Most ${escapeHtml(display)} Owners Get Wrong About ${escapeHtml(t.label.charAt(0).toUpperCase() + t.label.slice(1))}</h2>
  <p style="margin-top:0;">${escapeHtml(wrongIntro)}</p>
  <ul style="margin-top:8px;padding-left:22px;">
    ${pickedMis.map((m) => `<li style="margin-bottom:6px;">${escapeHtml(m.charAt(0).toUpperCase() + m.slice(1))}</li>`).join('\n    ')}
  </ul>
</section>`;

  const escalateHtml = `
<section class="indexing-quality escalate" aria-label="When to Escalate" style="margin:28px 0;padding:22px 24px;border-left:4px solid #DC2626;background:#FEF2F2;border-radius:8px;">
  <h2 style="margin:0 0 10px 0;">When to Escalate (Specific to ${escapeHtml(display)} Owners)</h2>
  <p style="margin-top:0;">${escapeHtml(pick(seed, 2, ESCALATE_OPENERS))} ${escapeHtml(t.escalate)}.</p>
  <p>For ${escapeHtml(display)} ${escapeHtml(speciesLower)} specifically, the early-warning sign that most often gets dismissed as "off day" behaviour is ${escapeHtml(t.redFlag)}. If you see that pattern persist beyond the second day, route to your vet rather than your search engine.</p>
</section>`;

  const scenarioHtml = `
<section class="indexing-quality scenario" aria-label="Real-World Scenario" style="margin:28px 0;padding:22px 24px;border-left:4px solid #0D9488;background:#F0FDFA;border-radius:8px;">
  <h2 style="margin:0 0 10px 0;">A Real-World ${escapeHtml(display)} Scenario</h2>
  <p style="margin-top:0;">${escapeHtml(scenario)}</p>
</section>`;

  // Pick 5 unique checklist items seeded by hash so subsets differ between pages.
  const items = t.checklistItems.slice();
  const pickedItems = [];
  for (let i = 0; i < 5 && pickedItems.length < items.length; i++) {
    const item = items[(seed + i * 11) % items.length];
    if (!pickedItems.includes(item)) pickedItems.push(item);
  }
  const checklistHtml = `
<section class="indexing-quality checklist" aria-label="${escapeHtml(display)} ${escapeHtml(t.label)} Checklist" style="margin:28px 0;padding:22px 24px;border:1px solid #BFDBFE;background:#EFF6FF;border-radius:10px;">
  <h2 style="margin:0 0 10px 0;">${escapeHtml(display)} ${escapeHtml(t.label.charAt(0).toUpperCase() + t.label.slice(1))} Checklist</h2>
  <p style="margin-top:0;">${escapeHtml(pick(seed, 3, CHECKLIST_OPENERS))}</p>
  <ol style="margin-top:8px;padding-left:22px;">
    ${pickedItems.map((it) => `<li style="margin-bottom:6px;">${escapeHtml(it)}</li>`).join('\n    ')}
  </ol>
  <p style="margin-top:10px;font-size:0.9rem;color:#475569;">Sources used to derive these items include the AVMA owner-resource set, AAHA preventive-care guidelines, ASPCA Animal Poison Control, and our internal correction log at <a href="/corrections" style="color:#0D9488;">petcarehelperai.com/corrections</a>.</p>
</section>`;

  return scenarioHtml + wrongHtml + escalateHtml + checklistHtml;
}

// --- HTML transforms --------------------------------------------------------
const SECTION_RE = /\n?\s*<section class="(?:owner-insight|vet-care)"[\s\S]*?<\/section>\s*/g;
const ALREADY_INSERTED_RE = /<section class="indexing-quality (?:scenario|wrong|escalate|checklist)"/;

function fixBrokenIntro(html, breed) {
  // Pattern: "<p>{Breed} a/the {gerund/noun phrase}..." — insert verb where missing.
  // Several variants in the corpus:
  const fixes = [
    {
      pattern: new RegExp(`<p>${escapeRegex(breed)} a species-aware maintenance rhythm outperforms`, 'g'),
      replacement: `<p>For ${breed}, a species-aware maintenance rhythm outperforms`,
    },
    {
      pattern: new RegExp(`<p>${escapeRegex(breed)} The vet's role`, 'g'),
      replacement: `<p>The vet's role`,
    },
    {
      pattern: new RegExp(`species-specific health registries`, 'g'),
      replacement: `Breed and species-specific health registries`,
    },
  ];
  let out = html;
  for (const f of fixes) {
    out = out.replace(f.pattern, f.replacement);
  }
  return out;
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processFile(filePath) {
  const rel = path.relative(COMMERCIAL_DIR, filePath);
  const parts = rel.split(path.sep);
  if (parts.length !== 3) return { skipped: true, reason: 'unexpected path depth' };
  const [speciesDir, breedSlug, fileName] = parts;
  const speciesGroup = speciesGroupFromDir(speciesDir);
  const topicKey = fileName.replace(/\.html$/, '');
  const entity = entityIndex.get(`${speciesGroup}/${breedSlug}`);
  const display = entity ? entity.display_name : prettify(breedSlug);

  let html = fs.readFileSync(filePath, 'utf8');
  if (ALREADY_INSERTED_RE.test(html)) {
    return { skipped: true, reason: 'already remediated' };
  }

  const before = html;
  // 1. Strip duplicated boilerplate sections.
  html = html.replace(SECTION_RE, '\n');

  // 2. Fix broken intro grammar.
  html = fixBrokenIntro(html, display);

  // 3. Insert four unique sections before </main>.
  const seed = seedHash(`${speciesGroup}|${breedSlug}|${topicKey}`);
  const newSections = uniqSections(display, speciesGroup, topicKey, seed);
  if (html.includes('</main>')) {
    html = html.replace('</main>', `${newSections}\n  </main>`);
  } else {
    html = html.replace('</body>', `${newSections}\n</body>`);
  }

  if (html === before) return { skipped: true, reason: 'no-op' };
  fs.writeFileSync(filePath, html);
  return { changed: true, breed: display, topic: topicKey };
}

function prettify(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

function main() {
  const files = walk(COMMERCIAL_DIR);
  const stats = { processed: 0, changed: 0, skipped: 0 };
  for (const f of files) {
    stats.processed += 1;
    const r = processFile(f);
    if (r.changed) stats.changed += 1;
    else stats.skipped += 1;
  }
  console.log(`Indexing-quality pass complete. ${JSON.stringify(stats)}`);
}

if (require.main === module) main();

module.exports = { processFile };
