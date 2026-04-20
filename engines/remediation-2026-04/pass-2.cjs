#!/usr/bin/env node
/**
 * Master remediation pass 2 - April 2026
 * Replaces remaining high-count fingerprint phrases across all templates.
 * Focus: mid-body stock sentences that survived pass 1.
 */

const fs = require('fs');
const path = require('path');
const { hash, titleCase } = require('./lib-variants.cjs');

const ROOT = '/opt/build/repo';
const stats = { filesScanned: 0, filesModified: 0, replacements: 0 };

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

// ---------- Replacement banks ----------

const BANK = {
  // "Work with your veterinarian to fine-tune these recommendations based on your {X}'s weight, activity level, and any health considerations."
  fineTune: [
    `Align the recommendations below with your animal's actual weight trajectory, current activity patterns, and any medications the veterinary team is already managing.`,
    `Refine the default ranges using your pet's observed feeding response, body condition score, and the vet's notes on any ongoing conditions.`,
    `Adapt the framework below to the specific animal — weight targets, activity rhythm, and active treatments all inform the personalised values.`,
    `Use the defaults here as a scaffold and let your veterinary team replace the placeholder values with ones calibrated to your pet's specific health profile.`,
    `Adjust these ranges alongside your vet using concrete inputs: current body condition, exercise tolerance, known sensitivities, and current medication schedule.`,
    `Bring these numbers to the vet as a starting point; the personalisation that actually matters comes from matching them to the individual animal.`,
    `Let the veterinary team overlay their records onto this framework — weight trend, wellness findings, and medication list all refine the defaults.`,
    `Tune the values here against the animal's real-world data points: weight over the last six months, typical exercise intensity, and any current treatment plan.`
  ],

  // "Before making significant diet changes, check in with your veterinarian — they can flag potential interactions with your {X}'s existing health profile."
  dietChanges: [
    `Any meaningful diet adjustment deserves a quick veterinary review first; interactions with existing medications and chronic-condition protocols are not always obvious from a web guide.`,
    `Flag planned diet changes to the vet before starting — the five-minute conversation routinely catches interactions a general guide cannot anticipate.`,
    `Material diet transitions benefit from a pre-change vet conversation, particularly when medications or diagnostic monitoring is already in place.`,
    `Loop the veterinary team into any significant diet transition before it begins; the review takes minutes and prevents interactions that are hard to unwind later.`,
    `Give the vet a heads-up before altering the diet in any substantive way — the notice lets them flag drug-nutrient interactions or testing windows proactively.`,
    `When the diet change is non-trivial, a brief vet consult first is far cheaper than a reactive workup after the fact.`,
    `A short call to the veterinary practice before a diet overhaul is the simplest safeguard against interactions with current treatment.`,
    `Share planned diet changes with the vet before implementation — they see interactions that generic advice cannot account for.`
  ],

  // "...owners usually see better long-term health when maintenance cadence and stocking decisions are tailored to this species"
  tailoredCadence: [
    `long-term welfare responds more to maintenance rhythm and species-appropriate stocking than to any single product choice`,
    `consistent husbandry cadence and thoughtful stocking decisions produce better outcomes than periodic equipment upgrades`,
    `the species does best when maintenance intervals match its biology rather than a fixed calendar`,
    `outcomes over months and years track the quality of sustained husbandry more than the quality of any individual piece of gear`,
    `stable routines, appropriate stocking, and regular checkpoints drive welfare more than product choice`,
    `a species-aware maintenance rhythm outperforms intermittent effort, even when the intermittent effort is well-executed`,
    `welfare compounds from steady care calibrated to the species, not from periodic high-intensity interventions`,
    `the long-term baseline comes from maintenance cadence and stocking judgement calibrated to this species specifically`
  ],

  // "care quality depends on stable water chemistry, measured feeding, and disciplined quarantine habits"
  aquaticCareQuality: [
    `baseline welfare rests on three habits: stable chemistry, measured feeding, and disciplined quarantine of new arrivals`,
    `stable water parameters, appropriately measured feeding, and a consistent quarantine protocol carry most of the welfare signal`,
    `the three variables that move outcomes most are water stability, feeding discipline, and careful handling of new stock`,
    `care quality tracks three controllable habits — parameter stability, feeding discipline, and quarantine protocol — more than anything else`,
    `consistent chemistry, controlled feeding, and deliberate quarantine sit at the centre of sustained aquatic welfare`,
    `three disciplines determine outcomes: keeping parameters stable, measuring feed portions, and quarantining new livestock thoroughly`,
    `sustained welfare comes from parameter discipline, measured nutrition, and proper quarantine — not from ad-hoc intervention`,
    `stable water chemistry, deliberate feeding, and a disciplined quarantine habit are the tripod that supports everything else`
  ],

  // "This background shapes everything from food selection to exercise planning — owners who account for these breed-specific traits tend to see better health outcomes over the long term."
  backgroundShapesFood: [
    `The breed's history informs food choice, exercise cadence, and environmental setup in ways that generic pet advice cannot approximate, and owners who plan around it report steadier long-term outcomes.`,
    `Understanding how the breed was selected over generations guides nutrition and exercise decisions that a one-size-fits-all plan would miss.`,
    `Owners who align food, activity, and environment to the breed's developmental history consistently produce better long-term health than those who default to generic templates.`,
    `The breed's background points to specific nutritional and activity patterns; owners who honour them rather than ignoring them see measurable health benefits.`,
    `Food selection and exercise planning both benefit from referencing the breed's origin story — the resulting calibration is more accurate than a generic plan.`,
    `Breed origin shapes several practical defaults: calorie density, exercise tolerance, environmental preferences. Plans that respect these origins outperform plans that ignore them.`,
    `Because the breed was shaped by specific selection pressures, the optimal care plan inherits those pressures as nutrition, activity, and enrichment defaults.`,
    `Applying breed history to daily decisions — what to feed, how much to exercise, how to structure enrichment — consistently improves long-term health trajectories.`
  ],

  // "Keeping these characteristics in mind as you plan your {X}'s care ensures that your approach matches their actual needs rather than generic guidelines that may not apply."
  keepInMind: [
    `Planning with these specific traits in focus produces a care programme calibrated to the animal in your home, not to a breed average that may not describe it well.`,
    `Ground the care plan in the animal's observable traits rather than a breed summary; the personalisation is what drives the difference in outcomes.`,
    `Use these trait patterns as inputs to the plan, but trust the specific animal's behaviour as the final arbiter on what it actually needs.`,
    `A plan anchored in these traits is more reliable than a plan anchored in generic pet-care templates, because it reflects the animal's evolved requirements.`,
    `Let the breed's documented traits inform the structure and the individual animal's behaviour inform the fine adjustments — that combination outperforms either in isolation.`,
    `Translate these traits into specific daily choices rather than treating them as background reading, and the care plan becomes materially more effective.`,
    `The traits above are only useful to the extent they shape actual decisions; the households that convert them into specific care defaults benefit most.`,
    `A care programme built around these traits routinely outperforms a generic template because the inputs are already closer to the animal's real requirements.`
  ],

  // "These details matter because they directly influence the daily care routine, cost expectations, and long-term health planning that every responsible dog owner should prepare for."
  detailsMatter: [
    `Each of these data points feeds directly into the daily schedule, the monthly budget, and the long-range health plan that a well-prepared owner assembles.`,
    `The practical value of these specifics is that they turn into concrete defaults — feeding portions, exercise windows, vet-visit cadence, and budget reserves.`,
    `These attributes are not trivia; they shape the real decisions an owner makes every day, every month, and every year of ownership.`,
    `Knowing the particulars translates into a more accurate routine, a more realistic budget, and a health plan that anticipates what this breed actually tends to need.`,
    `Owners who use these specifics to calibrate their care programme — not as background reading but as operational defaults — report fewer surprises over the long term.`,
    `Treat these facts as planning inputs: they tune the day-to-day routine, the financial projection, and the long-term health protocol to the specific animal.`,
    `Every one of these specifics maps onto a practical choice an owner will make repeatedly over the animal's lifespan.`,
    `The operational value of these details is that they replace generic defaults with breed-specific ones, which is where better outcomes originate.`
  ],

  // "This side-by-side comparison covers the key differences in care, temperament, costs, and suitability for different households."
  sideBySide: [
    `The comparison below maps out how the two differ across the dimensions that determine household fit — care load, temperament, cost profile, and lifestyle compatibility.`,
    `Below is a structured look at how these two compare on daily care, behaviour, cost, and household-fit — the dimensions that matter after the decision is made.`,
    `Use the breakdown that follows to understand where the two diverge on the practical axes: maintenance, personality, cost, and suitability by household type.`,
    `What follows is a pragmatic comparison — not a beauty contest — focused on the axes that actually shape day-to-day ownership.`,
    `The comparison below is organised by the decisions a prospective owner needs to make: what does daily care look like, what does the animal act like, what does it cost, and which household fits best.`,
    `Walk through the comparison below with the question in mind: which of these dimensions matters most to my household? That usually determines the right answer.`,
    `Below, the two are compared on the axes that determine long-term satisfaction rather than short-term preference — care, temperament, cost, and context.`,
    `A practical comparison of care requirements, personality, cost trajectory, and household compatibility follows.`
  ],

  // "With this foundation in place, you can make more targeted decisions about nutrition, exercise, preventive care, and enrichment"
  withFoundation: [
    `From this baseline, the specific decisions — nutrition, exercise, preventive care, enrichment — become considerably easier to get right`,
    `With the groundwork set, day-to-day calls on nutrition, exercise, and preventive care align more naturally with the animal's actual needs`,
    `Once the foundation is understood, the downstream choices in feeding, activity, and preventive medicine fall into place with less guesswork`,
    `Having this context in place makes the nutrition, exercise, and enrichment decisions that follow substantially more targeted`,
    `The practical payoff of this foundation is in the decisions it simplifies — food, activity, preventive medicine, and enrichment all become easier to calibrate`,
    `A clear baseline here removes most of the uncertainty from the specific nutrition, exercise, and preventive-care calls an owner needs to make`,
    `With the groundwork complete, the specifics of daily care — nutrition, activity, preventive medicine, enrichment — fall out of the framework naturally`,
    `This foundation turns subsequent decisions from guesswork into calibration, which is where better outcomes usually come from`
  ],

  // "Factoring in these specifics from the start means fewer surprises down the road and a care plan that evolves naturally"
  factoringSpecifics: [
    `Building these specifics into the plan on day one dramatically reduces the frequency of mid-stream surprises and produces a care approach that ages well`,
    `When the plan accounts for these specifics from the outset, it evolves gracefully and rarely needs the disruptive overhauls that come from ignoring them early`,
    `Getting these specifics into the plan at the start is far cheaper than discovering them reactively and rebuilding the plan around them later`,
    `Plans that ignore these specifics early tend to absorb them as surprise costs over time; plans that include them from the start run smoothly`,
    `A plan that starts with these specifics avoids most of the corrective rewrites that otherwise accumulate in years two and three of ownership`,
    `Incorporating these specifics up front makes the care plan noticeably more resilient to the usual surprises of ownership`,
    `Accounting for these specifics from day one saves the corrective rework that shows up when they are discovered later`,
    `Early integration of these specifics produces a plan that ages with the animal rather than one that requires repeated emergency adjustments`
  ]
};

function replaceBank(html, regex, bankKey, filePath) {
  const bank = BANK[bankKey];
  let count = 0;
  const seedBase = fileSeed(filePath, bankKey);
  const out = html.replace(regex, (match) => {
    count++;
    const v = bank[(seedBase + count) % bank.length];
    return v;
  });
  return { html: out, count };
}

// Patterns — each crafted narrowly to avoid false positives
const PATTERNS = [
  {
    name: 'fineTune',
    re: /Work with your veterinarian to fine-tune these recommendations based on your [^']+'s weight, activity level, and any health considerations\./g,
  },
  {
    name: 'dietChanges',
    re: /Before making significant diet changes, check in with your veterinarian — they can flag potential interactions with your [^']+'s existing health profile\./g,
  },
  {
    name: 'tailoredCadence',
    re: /owners usually see better long-term health when maintenance cadence and stocking decisions are tailored to this species/g,
  },
  {
    name: 'aquaticCareQuality',
    re: /care quality depends on stable water chemistry, measured feeding, and disciplined quarantine habits/g,
  },
  {
    name: 'backgroundShapesFood',
    re: /This background shapes everything from food selection to exercise planning — owners who account for these breed-specific traits tend to see better health outcomes over the long term\./g,
  },
  {
    name: 'keepInMind',
    re: /Keeping these characteristics in mind as you plan your [^']+'s care ensures that your approach matches their actual needs rather than generic guidelines that may not apply\./g,
  },
  {
    name: 'detailsMatter',
    re: /These details matter because they directly influence the daily care routine, cost expectations, and long-term health planning that every responsible [^.]+ owner should prepare for\./g,
  },
  {
    name: 'sideBySide',
    re: /This side-by-side comparison covers the key differences in care, temperament, costs, and suitability for different households\./g,
  },
  {
    name: 'withFoundation',
    re: /With this foundation in place, you can make more targeted decisions about nutrition, exercise, preventive care, and enrichment[^.]*\./g,
  },
  {
    name: 'factoringSpecifics',
    re: /Factoring in these specifics from the start means fewer surprises down the road and a care plan that evolves naturally[^.]*\./g,
  }
];

function processFile(filePath) {
  let html;
  try { html = fs.readFileSync(filePath, 'utf8'); } catch { return; }
  stats.filesScanned++;
  let modified = false;
  for (const p of PATTERNS) {
    const r = replaceBank(html, p.re, p.name, filePath);
    if (r.count > 0) {
      html = r.html;
      modified = true;
      stats.replacements += r.count;
    }
  }
  if (modified) {
    fs.writeFileSync(filePath, html);
    stats.filesModified++;
  }
}

function main() {
  const files = walk(ROOT);
  console.log(`Pass 2: scanning ${files.length} HTML files...`);
  let count = 0;
  for (const f of files) {
    processFile(f);
    count++;
    if (count % 1500 === 0) console.log(`  ... ${count}/${files.length}, modified ${stats.filesModified}`);
  }
  console.log('\n=== PASS 2 COMPLETE ===');
  console.log(JSON.stringify(stats, null, 2));
  fs.writeFileSync(path.join(ROOT, 'data', 'remediation-pass-2.json'), JSON.stringify(stats, null, 2));
}

main();
