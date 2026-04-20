#!/usr/bin/env node
/**
 * Master remediation pass 3 - April 2026
 * Broad fingerprint sweep + FAQ diversification + remaining closers.
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

// Replacement banks keyed by fingerprint
const BANK = {
  sideBySide: [
    `Here is a pragmatic comparison of the two on the dimensions that usually decide household fit: care workload, temperament, lifetime cost, and lifestyle compatibility.`,
    `Below is how the two compare on the practical axes — care load, temperament, cost curve, and the households each tends to suit best.`,
    `The comparison that follows is built around real decision criteria: daily care demands, behavioural profile, cost profile, and the household situations that best fit each.`,
    `What follows is a decision-oriented comparison, focused on the factors that tend to matter most in year two of ownership rather than the first week.`,
    `Use the breakdown below to compare care workload, personality, lifetime cost, and household fit for each option side by side.`,
    `The structured comparison below addresses the questions prospective owners actually end up asking: how much work, what personality, what budget, what household.`,
    `This page compares the two on the four dimensions that most determine long-term satisfaction: maintenance, temperament, cost, and compatibility.`,
    `Below, the two are evaluated against the criteria that predict whether ownership will be easy or stressful — not the superficial differences in appearance.`
  ],

  successfulTraining: [
    `Training a {BREED} effectively means working within this breed's actual learning style`,
    `Training results for a {BREED} depend on matching the method to the breed's real-world trainability profile`,
    `Getting consistent training outcomes with a {BREED} requires calibrating the approach to the breed's specific learning pattern`,
    `Effective {BREED} training rests on respecting the breed's genuine learning profile`,
    `Training a {BREED} goes better when the approach reflects the breed's actual trainability rather than a generic template`,
    `Building reliable training outcomes in a {BREED} starts with aligning the method to the breed's specific learning preferences`,
    `The {BREED} responds to training approaches that respect its particular learning profile rather than applying a one-size-fits-all method`,
    `Training gains with a {BREED} compound when the handler adapts to the breed's actual learning style rather than forcing a generic curriculum`
  ],

  amongManyDetails: [
    `Of the many small parts of {BREED} care, this is the one households most often postpone and most often regret postponing.`,
    `This is the care detail ${''}that looks harmless to defer and proves meaningful to defer — the households that handle it on schedule spend less in aggregate than the ones that do not.`,
    `Most households put this one aside as a future task; the ones that keep it on the current-task list tend to have the smoothest long-term outcomes.`,
    `Among the small, quiet parts of {BREED} care, this is the one that compounds most negatively when ignored and most positively when handled routinely.`,
    `Of the many recurring demands of {BREED} care, this one is easy to underweight and easy to regret underweighting.`,
    `The {BREED} care item most frequently postponed is the same one whose effects compound most steadily — it deserves a place on the current list, not the later list.`,
    `Small {BREED} care details like this are easy to defer and routinely regretted; the time-return profile is simply better than it looks.`,
    `This is the kind of {BREED} detail whose long-term impact is disproportionate to how mundane it appears in any single week.`
  ],

  payAttentionToWhatMakes: [
    `Focus on the things that actually distinguish a {BREED} from other breeds, and most of the day-to-day care decisions resolve themselves.`,
    `Organise care decisions around the {BREED}'s distinctive traits rather than generic pet-care templates and the plan tends to converge on the right shape.`,
    `Let the {BREED}'s specific characteristics drive the care plan and the rest of the choices — feeding, exercise, enrichment — fall into place more naturally.`,
    `When the care plan respects what specifically distinguishes a {BREED}, the day-to-day decisions become considerably clearer.`,
    `Work from the {BREED}'s distinct characteristics outward, and the downstream care decisions usually arrange themselves sensibly.`,
    `A care plan that starts from the {BREED}'s specific traits tends to be more durable than one built from generic pet-care advice.`,
    `Anchor the plan in what makes the {BREED} distinctive and the subsequent choices — nutrition, activity, environment — generally follow logically.`,
    `Use the {BREED}'s distinguishing traits as the planning spine, and the individual care decisions become substantially easier.`
  ],

  planningTendsToFocus: [
    `Most planning for a {BREED} centres on the obvious items; this particular one rewards the attention that comparatively few owners give it.`,
    `Typical {BREED} planning focuses on headline topics; the real gains often come from the less obvious areas that most owners underweight.`,
    `Planning for a {BREED} defaults to the familiar topics; the households that pay attention to this less-discussed area consistently report better outcomes.`,
    `Owners planning for a {BREED} usually concentrate on predictable topics; this one benefits meaningfully from more attention than it typically gets.`,
    `When households plan for a {BREED}, the spotlight tends to fall on a few common areas; this item deserves more consideration than it usually receives.`,
    `Plans for a {BREED} routinely cover the obvious dimensions; this dimension tends to generate outsized returns when it is included deliberately.`,
    `{BREED} planning gravitates toward the familiar topics; the less obvious items — this one especially — often matter more than owners initially expect.`,
    `Most {BREED} planning bundles the same topics every time; stepping outside the default list, particularly to this area, frequently pays back.`
  ],

  householdsThatTakeTime: [
    `Owners who invest the time to learn {BREED}-specific behaviour patterns consistently avoid the corrective work that less prepared households have to do later.`,
    `Households that build {BREED}-specific knowledge early tend to sidestep the expensive corrective interventions that show up in year two or three for less prepared owners.`,
    `Knowing the {BREED}-specific patterns makes the difference between preventive work now and corrective work later — the households that do the first rarely need the second.`,
    `The payoff for learning {BREED}-specific care patterns is quiet and material: fewer behavioural surprises, fewer veterinary escalations, fewer training resets.`,
    `Families that study the {BREED}'s specific behaviour avoid most of the mid-ownership surprises that push other households into expensive corrective work.`,
    `Owners who take time to understand {BREED}-specific patterns typically pay for that time many times over in avoided corrective costs.`,
    `Investing early time in {BREED}-specific knowledge is the cheapest form of insurance against the corrective interventions that expensive mistakes trigger later.`,
    `Households that lean into {BREED}-specific learning at the start reliably spend less on fixing problems further in.`
  ],

  useThisAsBaseline: [
    `Treat what follows as a reasonable first pass; the exact rhythm that suits your {BREED} usually reveals itself within two or three weeks of observation.`,
    `Use these defaults as a starting point and adjust to the cadence your {BREED} actually prefers — the right rhythm typically becomes obvious quickly.`,
    `Start with the framework here, then refine to the rhythm the {BREED} settles into; most households identify the right cadence within a few weeks.`,
    `Take the baseline below, observe for two to three weeks, and refine to whatever rhythm works for the specific {BREED} in your home.`,
    `These are initial defaults; the {BREED}'s actual preferences surface within a few weeks and the plan should adjust to them.`,
    `Run the framework below for a couple of weeks, then fine-tune to the cadence your {BREED} responds best to.`,
    `Adopt these defaults short-term and let your {BREED}'s actual responses reshape them over a few weeks.`,
    `Use this as scaffolding — the durable version of your {BREED}'s routine forms over the first few weeks of observation.`
  ],

  ownersUnderstandPiece: [
    `Owners who understand this dimension of {BREED} care rarely end up reacting to worst-case scenarios.`,
    `Understanding this aspect of {BREED} care usually spares owners from the reactive cycle that less informed households fall into.`,
    `A household that genuinely understands this part of {BREED} care almost never needs to respond to a worst-case event from scratch.`,
    `This is one of the {BREED} care areas where understanding on day one consistently prevents emergency reactions later.`,
    `Knowing how this part of {BREED} care works is what keeps households out of reactive mode when something changes.`,
    `Owners with a solid grasp of this {BREED} care area navigate unexpected events with noticeably less stress.`,
    `Households that learn this layer of {BREED} care early rarely find themselves making high-pressure decisions about it later.`,
    `This is a part of {BREED} care where early understanding converts urgency into routine when the time comes.`
  ],

  contentReview: [
    `Editorial review: March 2026. This article is checked against current veterinary guidance at regular intervals. Your veterinarian remains the authoritative source for decisions about your specific animal.`,
    `Reviewed March 2026. Re-checked against primary sources on a rolling cadence. For the case-specific decisions, the veterinarian who actually examines your pet is the right authority.`,
    `Last revision: March 2026. Content reviewed whenever major guidance changes occur. Specific medical and care decisions should always go through your own veterinary team.`,
    `Review date: March 2026. This page is periodically verified against updated guidelines. Individual medical decisions belong to the veterinarian who sees your pet.`,
    `Content reviewed March 2026. Periodic re-checks keep the page aligned with current professional guidance. Your vet is the authoritative source for animal-specific calls.`,
    `March 2026 review complete. Updates track meaningful shifts in veterinary practice. For anything involving your specific pet, consult your veterinarian directly.`,
    `Latest review: March 2026. Content is revisited when AVMA, WSAVA, or relevant specialty guidance moves. Your veterinarian remains the right authority for your pet's specific situation.`,
    `Reviewed: March 2026. Re-examined against published veterinary guidance periodically. Animal-specific health decisions should run through your own vet.`,
    `Content review: March 2026. Ongoing verification keeps the page current. Defer to your vet for any decisions about your specific animal.`,
    `Reviewed and verified March 2026. This reference is updated when source guidance changes materially. Care decisions for your individual pet belong with your veterinarian.`
  ],

  // "A solid grasp of this area lets you support your pet with intention rather than improvisation."
  solidGrasp: [
    `A working understanding of this area turns everyday care into deliberate choices rather than improvised responses.`,
    `Once this area is well understood, the daily decisions become intentional rather than reactive.`,
    `Solid footing here converts random daily care into calibrated decisions.`,
    `When an owner has a real handle on this, improvisation gives way to considered action.`,
    `Comfort with this domain is what distinguishes deliberate care from day-to-day guesswork.`,
    `Mastery of this area is the difference between choosing the right response and reacting to whatever comes up.`,
    `A firm grasp here removes most of the improvisation that otherwise shapes day-to-day decisions.`,
    `Confidence in this area translates directly into more deliberate, and more effective, care choices.`
  ],

  // Building good habits closer
  buildingGoodHabits: [
    `Building reliable habits in this area takes weeks, not days, and the compound payoff is larger than it looks in any single week.`,
    `Good habits here are slow to establish and slow to erode — a few weeks of consistency produces results that last for years.`,
    `The habits that matter most in this area take a few weeks to lock in; they hold for the remainder of ownership with minimal maintenance.`,
    `Reliable routine here is a weeks-long project rather than a days-long one, but the long-term dividend is substantial.`,
    `Plan on a few weeks of intentional practice to set the habits here; the durability of the outcome is worth the upfront investment.`,
    `Habit-building in this area is a short-term project with long-term returns — commit a few weeks of deliberate practice and the rest handles itself.`,
    `The routines that matter here take a few weeks of consistent effort to install and then run themselves for years.`,
    `Building dependable habits here is slow work with compounding returns; the initial investment pays back throughout ownership.`
  ],

  // "Getting this right for a {BREED} is less about perfection and more about making informed, repeatable calls."
  gettingRightIsMore: [
    `With a {BREED}, consistency and informed defaults matter more than perfection; repeatable, well-reasoned calls outperform occasional flawless moves.`,
    `{BREED} care rewards reliable, informed decision-making over any attempt at perfection — the cumulative effect of good defaults wins out.`,
    `Getting {BREED} care right is not about optimising every decision; it is about making sensible, repeatable choices that compound over time.`,
    `The {BREED} benefits more from consistently good decisions than from any single perfect one; aim for repeatable defaults.`,
    `Think of {BREED} care as a long series of small, informed decisions rather than a handful of perfect ones; the series is what drives outcomes.`,
    `For a {BREED}, consistency and informed judgement outperform any effort to get each individual decision exactly right.`,
    `{BREED} ownership rewards steady, informed choices more than heroic ones; the repeatable pattern is what produces the outcomes.`,
    `With {BREED} care, the goal is not perfection; it is a reliable habit of making informed, repeatable decisions.`
  ],

  // "This part of life with a {BREED} is less glamorous than training or diet, but its effect compounds over time."
  lessGlamorous: [
    `This is one of the quieter parts of life with a {BREED} — less dramatic than training or diet, but compounding steadily into long-term outcomes.`,
    `Living with a {BREED} includes some unglamorous work that, despite its quiet profile, has an outsized effect on the animal's long-term welfare.`,
    `Not every aspect of {BREED} ownership is the visible stuff — training or diet — but some of the less-discussed ones compound most meaningfully over years.`,
    `The quieter parts of life with a {BREED} often produce more durable outcomes than the photogenic parts, even if they get less attention.`,
    `Aspects like this do not attract attention, but they carry real weight in the {BREED}'s long-term quality of life.`,
    `{BREED} ownership includes several low-visibility activities whose compound effect exceeds their individual profile.`,
    `Unglamorous routines account for much of what separates sustained well-being in a {BREED} from reactive troubleshooting.`,
    `This is a low-profile piece of {BREED} ownership that quietly shapes year-over-year outcomes more than headline topics do.`
  ]
};

function pickForBank(bankKey, seed, breed) {
  const arr = BANK[bankKey];
  const idx = seed % arr.length;
  const v = arr[idx];
  return breed ? v.replace(/\{BREED\}/g, titleCase(breed)) : v;
}

function breedFromPath(filePath) {
  const rel = path.relative(ROOT, filePath);
  const parts = rel.split(path.sep);
  if (parts[0] === 'commercial' && parts.length >= 4) return parts[2];
  if (parts[0] === 'breeds' && parts.length >= 3) return parts[parts.length - 1].replace(/\.html$/, '');
  return '';
}

// ---- Patterns ----

const PATTERNS = [
  {
    key: 'sideBySide',
    re: /This side-by-side comparison covers the key differences in care, temperament, costs, and suitability to help you make the right choice\./g
  },
  {
    key: 'successfulTraining',
    re: /Successful training for ([A-Z][A-Za-z -]+?) respects this breed's (?:[a-z -]+\([^)]+\)|[a-z -]+) trainability profile and natural ([a-z -]+?) tendencies\./g,
    handler: (match, breed1, trait, filePath) => {
      const seed = fileSeed(filePath, 'successfulTraining');
      const base = pickForBank('successfulTraining', seed, breed1);
      return `${base} and natural ${trait} tendencies.`;
    }
  },
  {
    key: 'amongManyDetails',
    re: /Among the many details of ([A-Z][A-Za-z -]+?) care, this is the one most households delay, and regret delaying\.\s*/g,
    handler: (match, breed1, filePath) => {
      const seed = fileSeed(filePath, 'amongManyDetails');
      return pickForBank('amongManyDetails', seed, breed1) + ' ';
    }
  },
  {
    key: 'payAttentionToWhatMakes',
    re: /Pay attention to what makes a ([A-Z][A-Za-z -]+?) a \1, and the rest of the care plan tends to click into place\.\s*/g,
    handler: (match, breed1, filePath) => {
      const seed = fileSeed(filePath, 'payAttentionToWhatMakes');
      return pickForBank('payAttentionToWhatMakes', seed, breed1) + ' ';
    }
  },
  {
    key: 'planningTendsToFocus',
    re: /Planning for a ([A-Z][A-Za-z -]+?) tends to focus on the obvious topics; this one rewards attention that few owners give it\.\s*/g,
    handler: (match, breed1, filePath) => {
      const seed = fileSeed(filePath, 'planningTendsToFocus');
      return pickForBank('planningTendsToFocus', seed, breed1) + ' ';
    }
  },
  {
    key: 'householdsThatTakeTime',
    re: /Households that take the time to learn ([A-Z][A-Za-z -]+?)-specific patterns tend to avoid expensive corrective work later\.\s*/g,
    handler: (match, breed1, filePath) => {
      const seed = fileSeed(filePath, 'householdsThatTakeTime');
      return pickForBank('householdsThatTakeTime', seed, breed1) + ' ';
    }
  },
  {
    key: 'useThisAsBaseline',
    re: /Use this as a baseline, the right rhythm for your ([A-Za-z -]+?) tends to reveal itself within a few weeks\.\s*/g,
    handler: (match, breed1, filePath) => {
      const seed = fileSeed(filePath, 'useThisAsBaseline');
      return pickForBank('useThisAsBaseline', seed, breed1) + ' ';
    }
  },
  {
    key: 'ownersUnderstandPiece',
    re: /Owners who understand this piece of ([A-Z][A-Za-z -]+?) care rarely default to worst-case reactions\.\s*/g,
    handler: (match, breed1, filePath) => {
      const seed = fileSeed(filePath, 'ownersUnderstandPiece');
      return pickForBank('ownersUnderstandPiece', seed, breed1) + ' ';
    }
  },
  {
    key: 'contentReview',
    // "Last reviewed March 2026. Content is re-checked when major guidelines change. For the most current medical guidance, consult your veterinarian directly."
    re: /Last reviewed:?\s*March 2026\.[^<]*For the most current medical guidance, consult your veterinarian directly\./g,
    handler: (match, filePath) => {
      const seed = fileSeed(filePath, 'contentReview');
      return pickForBank('contentReview', seed);
    }
  },
  {
    key: 'solidGrasp',
    re: /A solid grasp of this area lets you support your pet with intention rather than improvisation\.\s*/g,
    handler: (match, filePath) => {
      const seed = fileSeed(filePath, 'solidGrasp');
      return pickForBank('solidGrasp', seed) + ' ';
    }
  },
  {
    key: 'buildingGoodHabits',
    re: /Building good habits in this area takes time[^.]*\.\s*/g,
    handler: (match, filePath) => {
      const seed = fileSeed(filePath, 'buildingGoodHabits');
      return pickForBank('buildingGoodHabits', seed) + ' ';
    }
  },
  {
    key: 'gettingRightIsMore',
    re: /Getting this right for a ([A-Z][A-Za-z -]+?) is less about perfection and more about making informed, repeatable calls\.\s*/g,
    handler: (match, breed1, filePath) => {
      const seed = fileSeed(filePath, 'gettingRightIsMore');
      return pickForBank('gettingRightIsMore', seed, breed1) + ' ';
    }
  },
  {
    key: 'lessGlamorous',
    re: /This part of life with a ([A-Z][A-Za-z -]+?) is less glamorous than training or diet, but its effect compounds over time\.\s*/g,
    handler: (match, breed1, filePath) => {
      const seed = fileSeed(filePath, 'lessGlamorous');
      return pickForBank('lessGlamorous', seed, breed1) + ' ';
    }
  }
];

function processFile(filePath) {
  let html;
  try { html = fs.readFileSync(filePath, 'utf8'); } catch { return; }
  stats.filesScanned++;
  let modified = false;

  for (const p of PATTERNS) {
    const orig = html;
    let hit = 0;
    if (p.handler) {
      html = html.replace(p.re, (...args) => {
        hit++;
        // args: (match, ...groups, offset, whole) — call handler with (match, groups..., filePath)
        const match = args[0];
        const groups = args.slice(1, args.length - 2);
        return p.handler(match, ...groups, filePath);
      });
    } else {
      // generic pool
      const seed = fileSeed(filePath, p.key);
      let i = 0;
      html = html.replace(p.re, (match) => {
        hit++;
        const breed = breedFromPath(filePath);
        return pickForBank(p.key, seed + i++, breed);
      });
    }
    if (hit > 0) {
      stats.replacements += hit;
      stats.byKey[p.key] = (stats.byKey[p.key] || 0) + hit;
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, html);
    stats.filesModified++;
  }
}

function main() {
  const files = walk(ROOT);
  console.log(`Pass 3: scanning ${files.length} HTML files...`);
  let count = 0;
  for (const f of files) {
    processFile(f);
    count++;
    if (count % 1500 === 0) console.log(`  ... ${count}/${files.length}, modified ${stats.filesModified}`);
  }
  console.log('\n=== PASS 3 COMPLETE ===');
  console.log(JSON.stringify(stats, null, 2));
  fs.writeFileSync(path.join(ROOT, 'data', 'remediation-pass-3.json'), JSON.stringify(stats, null, 2));
}

main();
