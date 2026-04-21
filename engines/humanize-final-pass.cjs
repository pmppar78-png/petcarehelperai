#!/usr/bin/env node
/**
 * Final humanization layer: rotate predictable filler/closer phrases across the commercial
 * and guide pages. Deterministic by slug hash so each page consistently picks one variant.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

function hashIndex(key, modulo) {
  const h = crypto.createHash('md5').update(key).digest('hex');
  return parseInt(h.slice(0, 8), 16) % modulo;
}

// Each rule is { find: exact string, variants: [string...] }.
// Variants keep the first slot equal to the original so some pages remain unchanged
// and the rotated set reads as natural variation.
const RULES = [
  {
    find: 'The broader the pet advice, the less it applies',
    variants: [
      'The broader the pet advice, the less it applies',
      'Generic advice is a starting point; specificity is where usefulness appears',
      'The more universally a recommendation is worded, the less it tends to apply',
      'General guidance orients; specific observation makes the call',
      'Broad rules set the shape; the individual animal sets the details',
      'Wide-net advice is a sketch; the animal in front of you is the picture',
    ],
  },
  {
    find: 'A clear picture of this side',
    variants: [
      'A clear picture of this side',
      'A grounded sense of this part',
      'A realistic read on this corner',
      'A sharper view of this part',
      'A settled understanding of this angle',
      'A confident read of this side',
    ],
  },
  {
    find: 'Owners who bother to understand',
    variants: [
      'Owners who bother to understand',
      'Owners who take the time to learn',
      'The owners who sit with',
      'People who actually study',
      'Anyone willing to learn',
      'Households that bother to read up on',
    ],
  },
  {
    find: 'Smart claim practices help',
    variants: [
      'Smart claim practices help',
      'A bit of claim hygiene helps',
      'A disciplined approach to claims helps',
      'Well-organised claim submissions help',
      'Good record-keeping on claims helps',
      'A small amount of claim-admin discipline helps',
    ],
  },
  {
    find: 'The operational value of these details',
    variants: [
      'The operational value of these details',
      'The practical payoff of these specifics',
      'The usefulness of these details on the ground',
      'The day-to-day value of these specifics',
      'Why these details matter in practice',
      'What you actually gain from these details',
    ],
  },
  {
    find: 'Upfront effort to understand how their dog actually operates usually pays dividends in fewer vet emergencies.',
    variants: [
      'Upfront effort to understand how their dog actually operates usually pays dividends in fewer vet emergencies.',
      'Time spent early on learning how this specific dog operates tends to spare emergency-room visits later.',
      'The weeks you spend learning your dog\u2019s patterns tend to earn themselves back in fewer urgent trips.',
      'Energy spent understanding a dog\u2019s normal usually shows up as fewer abnormal days.',
      'Effort put in early \u2014 reading the patterns, noting the outliers \u2014 usually returns as calmer care later.',
      'The unglamorous first-year work of knowing one dog well tends to shrink the emergency bills that follow.',
    ],
  },
  {
    find: 'Expect some trial and error',
    variants: [
      'Expect some trial and error',
      'Plan on a period of trial and error',
      'Some iteration is normal',
      'A little back and forth is expected',
      'Give it a few rounds before judging',
      'Count on a short adjustment period',
    ],
  },
  {
    find: 'Planning with these specific traits in focus produces a care programme calibrated to the animal in your home, not to a breed average that may not describe it well.',
    variants: [
      'Planning with these specific traits in focus produces a care programme calibrated to the animal in your home, not to a breed average that may not describe it well.',
      'Care planned around the specific animal \u2014 not the breed average \u2014 fits better and tends to last longer.',
      'A plan built around this particular animal, not the breed statistics, holds up better over time.',
      'The care programme that works is the one calibrated to the individual, not the mean.',
      'Fit the plan to the animal you live with; the breed average is only a starting sketch.',
      'Specific traits beat breed averages when you are designing real-world care.',
    ],
  },
  {
    find: 'Plans that ignore these specifics early tend to absorb them as surprise costs over time; plans that include them from the start run smoothly',
    variants: [
      'Plans that ignore these specifics early tend to absorb them as surprise costs over time; plans that include them from the start run smoothly',
      'Skipping these details early usually reappears as bill-shock later; including them up front keeps things calm',
      'What you leave out of a plan quietly becomes the surprise in next year\u2019s budget',
      'Unplanned specifics become tomorrow\u2019s unexpected costs; built-in from the start, they barely register',
      'The specifics you ignore in month one are the ones that inflate your year-three budget',
      'Plans that account for these details up front tend to run without nasty surprises',
    ],
  },
  {
    find: 'With the groundwork complete, the specifics of daily care — nutrition, activity, preventive medicine, enrichment — fall out of the framework naturally',
    variants: [
      'With the groundwork complete, the specifics of daily care — nutrition, activity, preventive medicine, enrichment — fall out of the framework naturally',
      'Once the basics are sorted, the rest of the care programme falls into place with less thought',
      'Set up the fundamentals and the day-to-day pieces \u2014 food, exercise, vet visits, enrichment \u2014 tend to follow on their own',
      'When the foundation is sound, nutrition and activity and everything else line up without being engineered',
      'The first layer done well lets the daily pieces \u2014 food, movement, prevention, enrichment \u2014 fall out naturally',
      'Get the groundwork right and the rest of the routine stops needing separate design',
    ],
  },
  {
    find: 'Build literacy here and the rest of cat ownership becomes measurably less stressful. Any care plan for a cat improves when it reflects the quirks of the specific animal, not a generic profile.',
    variants: [
      'Build literacy here and the rest of cat ownership becomes measurably less stressful. Any care plan for a cat improves when it reflects the quirks of the specific animal, not a generic profile.',
      'Learn this side of cats well and the rest of ownership stops feeling like a guessing game.',
      'Get fluent on this and the rest of cat-keeping flattens out.',
      'A reasonable grasp of this territory makes every other decision easier \u2014 and specific quirks matter more than any generic profile.',
      'Once this part clicks, the rest of cat ownership runs calmer. Each cat reshapes the plan in its own way.',
      'Time spent understanding this corner of feline care pays off in every other corner; any plan gets better when built around this cat rather than cats in general.',
    ],
  },
  {
    find: 'If your cat shows sudden severe symptoms such as difficulty breathing, collapse, uncontrolled bleeding, or seizures, seek emergency veterinary care immediately. Do not wait to see if symptoms improve on their own.',
    variants: [
      'If your cat shows sudden severe symptoms such as difficulty breathing, collapse, uncontrolled bleeding, or seizures, seek emergency veterinary care immediately. Do not wait to see if symptoms improve on their own.',
      'Go to an emergency clinic now for any of: laboured or open-mouthed breathing, collapse, seizures, uncontrolled bleeding, or sudden inability to use the hind legs. These do not improve with waiting.',
      'Signs that justify immediate emergency care include open-mouthed breathing, seizures, heavy bleeding that will not stop with pressure, collapse, or acute hind-limb paralysis. Treat any one of these as a now-not-later situation.',
      'Call or drive to an ER the moment you see: laboured breathing, seizures, uncontrolled bleeding, collapse, or sudden paralysis. Waiting is the wrong move here.',
      'If you see laboured breathing, seizures, collapse, uncontrolled bleeding, or sudden rear-limb paralysis, go straight to an emergency clinic. Observation is not a safe plan with these signs.',
      'Emergency-now signs include open-mouth breathing, seizures, collapse, uncontrolled bleeding, and sudden loss of rear-limb function. Do not wait these out.',
    ],
  },
  {
    find: 'If your dog shows sudden severe symptoms such as difficulty breathing, collapse, uncontrolled bleeding, or seizures, seek emergency veterinary care immediately. Do not wait to see if symptoms improve on their own.',
    variants: [
      'If your dog shows sudden severe symptoms such as difficulty breathing, collapse, uncontrolled bleeding, or seizures, seek emergency veterinary care immediately. Do not wait to see if symptoms improve on their own.',
      'Drive to an emergency clinic immediately for: sudden laboured breathing, a distended and painful belly, collapse, uncontrolled bleeding, seizures, or suspected toxin ingestion. These scenarios do not wait well.',
      'Emergency-now signs include laboured breathing, a bloated or rigid abdomen, collapse, uncontrolled bleeding, seizures, and known toxin exposure. Head in rather than observe.',
      'Same-day, same-hour emergencies: laboured breathing, a distended belly, collapse, seizures, heavy bleeding, and any suspected poisoning. Watching them is not the right plan.',
      'Any of the following should prompt an immediate ER trip: open-mouth breathing, a painful swollen belly, collapse, uncontrolled bleeding, seizures, or suspected ingestion of a toxin. Observation here costs lives.',
      'Call an emergency hospital if you see laboured breathing, a hard or swollen belly, collapse, seizures, uncontrolled bleeding, or evidence of poisoning. These do not get safer by waiting.',
    ],
  },
  {
    find: 'As a dog owner, noticing changes in your pet\'s behavior or health is the first step to getting them the help they need.',
    variants: [
      'As a dog owner, noticing changes in your pet\'s behavior or health is the first step to getting them the help they need.',
      'The dog who seems "a bit off" today is giving you the earliest possible warning \u2014 and the version of you that notices early is the version that saves money and suffering later.',
      'Small behavioural or physical changes almost always land first; the owners who catch them are the ones whose dogs do well.',
      'Knowing what normal looks like for your specific dog is what makes abnormal visible \u2014 and action early beats intervention late, almost every time.',
      'The first clue is usually subtle, and it is usually behavioural. Owners who learn the baseline pick it up days before a vet would.',
      'The easiest catches are the early ones \u2014 a shift in energy, appetite, or posture noticed before anything dramatic happens.',
    ],
  },
  {
    find: 'As a cat owner, noticing changes in your pet\'s behavior or health is the first step to getting them the help they need.',
    variants: [
      'As a cat owner, noticing changes in your pet\'s behavior or health is the first step to getting them the help they need.',
      'Cats hide illness well and compensate longer than most species \u2014 which is why a small change in routine often means more than it looks.',
      'A subtle shift in a cat\u2019s behaviour is often the first and only early warning. Catching it depends entirely on knowing their baseline.',
      'The earliest cue in feline illness is usually behavioural, not physical. Owners who notice small changes in grooming, eating, or hiding are the ones who catch things in time.',
      'Cats under-report pain and illness by design. Behaviour is where the early information lives.',
      'Early changes in a cat are small and easy to explain away. The owners who don\'t explain them away are the ones whose cats do best.',
    ],
  },
];

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile() && entry.name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

function main() {
  const dirs = [
    path.join(ROOT, 'commercial'),
    path.join(ROOT, 'guides'),
    path.join(ROOT, 'breeds'),
  ].filter(d => fs.existsSync(d));

  let scanned = 0;
  let changed = 0;
  const perRule = RULES.map(r => ({ find: r.find.slice(0, 48), hits: 0 }));

  for (const dir of dirs) {
    const files = walk(dir);
    for (const file of files) {
      scanned++;
      let html = fs.readFileSync(file, 'utf8');
      const original = html;
      const key = path.relative(ROOT, file);

      RULES.forEach((rule, i) => {
        if (!html.includes(rule.find)) return;
        const idx = hashIndex(key + rule.find, rule.variants.length);
        const replacement = rule.variants[idx];
        if (replacement === rule.find) return;
        html = html.split(rule.find).join(replacement);
        perRule[i].hits++;
      });

      if (html !== original) {
        fs.writeFileSync(file, html);
        changed++;
      }
    }
  }

  console.log(JSON.stringify({ scanned, changed, perRule }, null, 2));
}

main();
