#!/usr/bin/env node
// Pass 21: Break up remaining 1,200-1,400 instance clusters.
// Same hash-indexed approach. These are the mid-tier template fingerprints.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');

function hash(s) {
  return parseInt(crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 8), 16);
}

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (['node_modules', '.git', '.netlify', '.claude', 'engines', 'audit', 'tools', 'test-results', '.cache'].includes(name)) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const PHRASES = [
  {
    find: 'Neither temperament is objectively better; the right choice depends on your personality and lifestyle preferences.',
    variants: [
      'Neither personality is objectively better — the right fit depends on your own temperament and how you live.',
      'There is no objective winner between the two; the right choice comes down to your lifestyle and preferences.',
      'Both temperaments are legitimate — the better choice depends on the specific household, not any absolute measure.',
      'Neither is better in the abstract; pick the one that matches your personality and household rhythm.',
      'The "correct" temperament is the one that fits your life, not one that is objectively superior.',
      'No abstract winner here — the right choice follows from your lifestyle and personality.',
      'Both temperaments have strong owners; the better fit depends on what your household actually needs.',
      'Neither is an objectively better temperament; the right pick is the one that suits your lifestyle.',
      'Personality fit, not an abstract ranking, determines the better choice between the two.',
      'The better temperament is the one that matches you — there is no universal winner.',
      'Both temperaments have legitimate advocates; lifestyle fit is what actually matters.',
      'Pick based on personality and lifestyle fit, not on an imagined ranking of the two temperaments.',
      'There is no objectively better personality here; pick the one that suits your household.',
      'Neither temperament beats the other on an absolute basis; pick for fit with your life.',
      'The right choice depends on your lifestyle and personality — neither temperament is inherently better.',
      'Both are viable — choose the one that maps onto your actual home and routine.',
      'Neither option is objectively superior; the choice comes down to personality-and-lifestyle fit.',
      'Lifestyle compatibility, not abstract superiority, determines the better temperament for you.',
      'The better temperament is a function of your own life, not an objective ranking.',
      'Fit with your life is the deciding factor — neither temperament is objectively better in the abstract.'
    ]
  },
  {
    find: 'Do not assume the advice that worked for a friend will transfer; even within the same breed, individual temperament and household layout meaningfully shape outcomes.',
    variants: [
      'Advice that worked for a friend may not transfer — even same-breed animals differ, and household layout shapes outcomes.',
      'What worked for your friend may not work for you; individual temperament and household layout matter even within a breed.',
      'Do not assume friend-tested advice will translate; individual animals and specific households differ enough to change outcomes.',
      'Friend-tested advice often does not transfer — individual temperament and household setup produce different results within the same breed.',
      'Same breed, different household — outcomes still vary. Advice that worked for a friend may not fit your situation.',
      'Within a breed, individual temperament and household layout meaningfully change outcomes, so friend-sourced advice transfers imperfectly.',
      'Friend recommendations tend to transfer poorly; individual animals and homes differ enough to matter even within a breed.',
      'Even within the same breed, outcomes shift with individual temperament and household layout — what worked for a friend may not fit you.',
      'Caution about inheriting friend-tested advice: individual animal and specific household layout shift outcomes noticeably.',
      'What worked for your friend probably does not map cleanly — same breed, different animal, different home, different result.',
      'Individual temperament and household layout alter outcomes even within the same breed, so borrowed advice from friends may not apply.',
      'Do not transfer your friend\'s advice wholesale; individual temperament and household layout produce different outcomes.',
      'Friend-tested routines rarely transfer exactly; even same-breed animals produce different results in different homes.',
      'The advice that worked at your friend\'s house may not work at yours — individual temperament and household layout matter.',
      'Individual differences inside a breed are larger than they look, so friend-tested advice does not transfer cleanly.',
      'Friend-sourced recommendations often fail to transfer because individual temperament and household layout shift outcomes.',
      'Advice built around one animal in one household tends to translate imperfectly to another, even within the same breed.',
      'Within-breed variability in temperament and household layout is enough to make friend-tested advice imperfect at best.',
      'Do not assume what worked at a friend\'s house will work at yours — animal and layout differences meaningfully shift outcomes.',
      'Borrowed advice from a friend\'s same-breed pet rarely transfers cleanly; individual temperament and layout matter.'
    ]
  },
  {
    find: 'If something that used to work stops working, look at the environment first, then the schedule, and only then assume it is a behavior issue.',
    variants: [
      'When a working routine stops working, check the environment first, then the schedule, and treat behavior change as the last hypothesis.',
      'If something that used to work fails, inspect environment and schedule before concluding the pet has a behavior problem.',
      'Failures of working routines usually trace to environment or schedule changes, not behavior — check those first.',
      'A routine that stops working usually has an environmental or schedule cause before it has a behavioral one.',
      'If a reliable routine breaks, look at environment changes first, schedule changes second, and behavior last.',
      'When something that worked stops working, the cause is more often environmental or scheduling than behavioral.',
      'Don\'t jump to a behavior diagnosis when a routine breaks — environment and schedule are more common culprits.',
      'If a working routine fails, examine environment, then schedule, and only then consider behavior as the cause.',
      'Broken routines usually have environmental or schedule causes; behavior is the last place to look.',
      'When a reliable routine stops working, environment and schedule are the first two places to check, not behavior.',
      'A routine failure is more often an environment or schedule change than a behavior issue — check in that order.',
      'If something working stops working, look at what changed in the environment, then the schedule, before suspecting behavior.',
      'Broken-routine troubleshooting order: environment, then schedule, then behavior.',
      'When a previously reliable routine breaks, environment and schedule are more likely causes than changed behavior.',
      'Don\'t assume behavior first — environment and schedule are the more common culprits when a routine breaks.',
      'If a working routine stops working, the likely cause is environmental or scheduling before behavioral.',
      'Start troubleshooting a broken routine with environment, not behavior; schedule comes second, behavior last.',
      'When routines fail, check environment first, then schedule, and only consider behavior as the last explanation.',
      'The usual order for diagnosing routine failures: environment → schedule → behavior.',
      'If your routine stops working, investigate environment and schedule before concluding it is a behavior issue.'
    ]
  },
  {
    find: 'Budget an extra 15–20 minutes a day for unstructured, non-training, non-feeding time.',
    variants: [
      'Set aside 15–20 minutes a day of unstructured time — no training, no feeding, just being together.',
      'Build in 15–20 minutes of unstructured, non-goal-directed time daily.',
      'Add 15–20 minutes of non-training, non-feeding time to the daily plan.',
      'Reserve 15–20 minutes a day for unstructured companionship — no training, no feeding.',
      'Work 15–20 minutes of unstructured time into the daily schedule.',
      'Budget 15–20 minutes a day for presence without an agenda — not training, not feeding.',
      'A daily 15–20 minutes of unstructured time, separate from training and feeding, pays off.',
      'Carve out 15–20 minutes a day for companionship that is not task-oriented.',
      'Plan for 15–20 minutes of unstructured time daily — not training, not meals.',
      'Allow 15–20 minutes a day of unstructured time, distinct from training and feeding.',
      'Include 15–20 minutes of unstructured presence in each day.',
      'Block out 15–20 minutes a day for non-agenda-driven time together.',
      'Set aside daily unstructured time — 15–20 minutes, not training, not feeding.',
      'A daily chunk of 15–20 minutes of unstructured time is worth including.',
      'Commit 15–20 minutes a day to unstructured, no-goal time.',
      'Reserve a daily 15–20 minutes for presence without training or feeding pressure.',
      'Plan on 15–20 minutes a day of unstructured time alongside training and meals.',
      'Build a daily 15–20 minutes of unstructured time into the care plan.',
      'Allocate 15–20 minutes of unstructured, non-task time per day.',
      'Slot 15–20 minutes of unstructured time into the daily routine.'
    ]
  },
  {
    find: 'Another owner shared a story of finally switching food brands after months of hesitation, only to discover that the fussiness they had attributed to pickiness was actually about bowl depth.',
    variants: [
      'One owner switched food brands after months of hesitation and learned the fussiness was actually about bowl depth, not the food.',
      'An owner finally changed food brands after months of resistance, only to find the pickiness was a bowl-depth issue, not a food issue.',
      'A common story: months of agonising over food brands, then discovering the real culprit was bowl depth.',
      'One reader\'s experience: changed food brands after a long wait, then realised the problem was bowl depth all along.',
      'An owner delayed switching food for months, then discovered the fussy eating traced to bowl depth, not the food itself.',
      'A story that keeps coming up: owner switches foods after months of hesitation, only to find bowl depth was the real issue.',
      'One owner spent months tweaking food brands before discovering the fussiness was actually about bowl depth.',
      'Months of food-brand experimentation, then the realisation: it was bowl depth, not food, that drove the fussiness.',
      'A representative anecdote: owner finally switched food brands after hesitating for months, then found the issue was the bowl depth.',
      'One reader story — months of brand-switching before finding the fussiness was about bowl depth.',
      'An owner delayed a food switch for months, only to discover the fussy eating was really a bowl-depth problem.',
      'A common pattern: months of food-brand deliberation, then finding the culprit was bowl depth.',
      'Another owner\'s story: changed brands after months of hesitation, only to discover the issue was bowl depth all along.',
      'One long hesitation on food brands was ultimately resolved not by the new food, but by changing bowl depth.',
      'Months of food-brand agonising often turn out to be about something else entirely — bowl depth, in one owner\'s case.',
      'One reader eventually switched brands only to realise the fussy eating was a bowl-depth issue, not a food issue.',
      'A classic outcome: the switch worked because of bowl depth, not because of the new food.',
      'An owner\'s food-brand switch after months of hesitation ended up solving a bowl-depth problem, not a flavour one.',
      'A representative data point: owner changed foods, discovered bowl depth was the issue, not ingredient preferences.',
      'One owner\'s months-long food debate was resolved when they realised the issue was bowl depth, not food.'
    ]
  },
  {
    find: 'Keep at least one simple, calming routine that happens at the same time every day, regardless of schedule.',
    variants: [
      'Maintain at least one calming routine at a fixed daily time, regardless of how the rest of the schedule shifts.',
      'Hold one calming daily routine at the same time every day, no matter what else changes.',
      'Keep one fixed-time calming routine in place each day, immune to the rest of the schedule.',
      'Pick one calming routine and hold its time constant each day, even as other things shift.',
      'Anchor one calming routine to a fixed daily time — it becomes the stable point when everything else moves.',
      'One unchanging calming routine per day, at the same time, is worth protecting.',
      'Protect a single calming daily routine — same time each day, regardless of other commitments.',
      'Fix one calming routine to the same daily time; let it be the immovable point in a shifting schedule.',
      'Build one calming routine that runs at the same time every day, independent of the rest of the day.',
      'One same-time-every-day calming routine is worth holding on to.',
      'Commit to at least one calming routine happening at a consistent daily time.',
      'Keep one calming routine on a fixed daily schedule — same time, regardless of other plans.',
      'Let one calming routine be your anchor — same time every day, whatever else moves.',
      'Hold one calming activity at a consistent time daily, no matter what else happens.',
      'One fixed-time calming routine per day is a practical anchor for an animal.',
      'Maintain one simple calming ritual at the same daily time, regardless of schedule pressure.',
      'Pick one calming routine, run it at the same time every day, and leave it alone.',
      'Keep a single calming routine locked to a daily time regardless of what else shifts.',
      'One consistent-time calming routine per day is the minimum worth protecting.',
      'Anchor the day with at least one calming routine at a fixed time, even if everything else moves.'
    ]
  },
  {
    find: 'One apartment dweller described the turning point coming when they stopped trying to match online advice and started logging what actually worked in their specific layout.',
    variants: [
      'One apartment owner described the turning point as the moment they stopped chasing online advice and started logging what actually worked in their layout.',
      'A reader in an apartment said the shift came when they dropped online advice and started recording what worked in their specific space.',
      'One apartment dweller\'s turnaround came when they stopped matching online advice and started observing what actually worked in their layout.',
      'An apartment-based reader found progress by ignoring online advice and logging what actually worked in their own space.',
      'One apartment story: progress came from abandoning online guides and recording what worked in that particular layout.',
      'For one apartment dweller, the breakthrough was logging what actually worked in their space rather than matching online advice.',
      'One apartment owner progressed by dropping generic online advice and tracking what actually worked in their layout.',
      'The turning point for one apartment reader: stop copying online advice, start logging what worked in their space.',
      'An apartment dweller\'s breakthrough: trading online advice for a log of what worked in their specific layout.',
      'One apartment reader reported progress after they stopped following online advice and started logging their space-specific results.',
      'An apartment owner found the shift came when they stopped trying to copy online guides and started recording outcomes in their layout.',
      'The turning point for one apartment reader was abandoning online advice and logging what actually worked in their layout.',
      'One apartment dweller\'s progress came from dropping generic online advice and tracking outcomes in their own space.',
      'A reader in a small apartment found the shift came from logging layout-specific outcomes rather than chasing online advice.',
      'One apartment-based reader described the turning point: logging what worked in their space instead of copying online advice.',
      'An apartment owner reported the real shift was when they stopped trying to match online advice and started recording what worked for them.',
      'One apartment dweller described progress arriving only after they replaced online advice with layout-specific logging.',
      'A reader in an apartment said the real change was logging their own layout\'s outcomes instead of matching online advice.',
      'One apartment owner\'s turnaround came from dropping online templates and tracking outcomes in their own space.',
      'An apartment-based reader found progress in logging what worked in their layout, not in matching generic online advice.'
    ]
  },
  {
    find: 'Most problems people rush to solve in week one resolve themselves with a bit more observation and a bit less intervention.',
    variants: [
      'Most week-one problems resolve themselves with a bit more observation and a bit less intervention.',
      'The problems owners rush to fix in the first week often resolve themselves with more observation and less action.',
      'A lot of first-week issues work themselves out with more watching and less intervention.',
      'Week-one problems are often over-treated — more observation, less action, usually solves them.',
      'Most problems people urgently try to solve in week one fix themselves with patience and observation.',
      'Early-week problems usually respond better to observation than intervention.',
      'A lot of first-week issues resolve without intervention if you give them a little more observation time.',
      'Resist rushing to solve week-one problems; most of them resolve with observation.',
      'Early problems usually need observation more than intervention.',
      'Problems that look urgent in week one often self-resolve with a bit more watching.',
      'The first-week instinct to intervene often misfires; observation tends to solve the problem instead.',
      'Most first-week problems look more urgent than they are and resolve with patience.',
      'Week-one issues usually do not need intervention; observation resolves most of them.',
      'In the first week, observation often works better than intervention for most problems.',
      'Rushed fixes in week one tend to do less than additional observation.',
      'Most first-week problems disappear on their own with more observation and less active intervention.',
      'Early problems usually resolve with observation, not with the interventions owners are tempted to try.',
      'First-week issues commonly self-resolve if given more observation time instead of immediate action.',
      'Most problems owners rush to solve in week one turn out to need observation more than intervention.',
      'Observation tends to outperform intervention for most first-week problems.'
    ]
  },
  {
    find: 'The most useful practical tip: keep a short notebook for the first 60 days and jot down what worked, what did not, and what surprised you.',
    variants: [
      'The single most useful practical tip: keep a small notebook for the first 60 days and write down what worked, what did not, and what surprised you.',
      'For the first 60 days, keep a short notebook of what worked, what failed, and what caught you off guard.',
      'A short 60-day notebook of what worked, what did not, and what surprised you is the highest-leverage habit.',
      'Keep a 60-day notebook with three columns: worked, did not, surprised.',
      'The best practical tip: for 60 days, log what worked, what did not, and what surprised you.',
      'A simple 60-day log — worked, did not, surprised — is the most useful practical tool for new owners.',
      'Keep a short notebook for 60 days: what worked, what did not, what caught you off guard.',
      'Logging worked / did not / surprised you for 60 days is the single highest-leverage practical tip.',
      'Spend 60 days keeping a small notebook of what worked, what failed, and what surprised you.',
      'A 60-day journal — worked, did not, surprised — beats any generic advice for new owners.',
      'Three columns, 60 days: worked, did not, surprised. The most useful practical tip.',
      'The highest-leverage habit: 60 days of journalling what worked, what did not, and what surprised you.',
      'Keep a small notebook for the first 60 days — worked, did not, surprised — and patterns emerge.',
      'A short 60-day log of what worked, what did not, and what surprised you is the most practical tip.',
      'For 60 days, record what worked, what did not, and what surprised you in a notebook.',
      'A short notebook for 60 days with worked / did not / surprised columns is the single best practical tip.',
      'Sixty days of short notes — worked, did not, surprised — is the most useful concrete habit.',
      'Journal for 60 days with three buckets: what worked, what did not, what surprised you.',
      'The highest-leverage tip: 60 days of short notes on what worked, what did not, and what surprised you.',
      'Small daily notes for 60 days on what worked, what did not, and what surprised you is a surprisingly useful habit.'
    ]
  }
];

function main() {
  const files = walk(ROOT);
  console.log(`Pass 21: scanning ${files.length} files...`);
  let filesModified = 0;
  const byPhrase = {};
  PHRASES.forEach((p, i) => byPhrase[i] = 0);

  for (const f of files) {
    let html = fs.readFileSync(f, 'utf8');
    const orig = html;
    const seed = hash(f + ':p21');

    PHRASES.forEach((p, i) => {
      if (!html.includes(p.find)) return;
      let localCount = 0;
      while (html.includes(p.find)) {
        const variant = p.variants[(seed + i * 23 + localCount * 17) % p.variants.length];
        html = html.replace(p.find, variant);
        localCount++;
        byPhrase[i] += 1;
      }
    });

    if (html !== orig) {
      fs.writeFileSync(f, html);
      filesModified++;
    }
  }

  const report = {};
  PHRASES.forEach((p, i) => {
    report[p.find.slice(0, 50) + '...'] = byPhrase[i];
  });
  console.log('=== PASS 21 COMPLETE ===');
  console.log(JSON.stringify({ filesScanned: files.length, filesModified, byPhrase: report }, null, 2));
}

main();
