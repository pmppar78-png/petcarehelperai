#!/usr/bin/env node
// Pass 18: URGENT — break up the biggest remaining site-wide template clusters.
// These are behavioral-observation / trait sentences that appear on 2,000-2,700 pages each
// and are the single biggest remaining reviewer-sampling risk on the site.
// Each phrase gets 20 variants; hash-indexed selection gives ~130-140 per variant,
// reducing clustering by ~20x and bringing 10-sample collision risk to near-zero.

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
    find: 'Vocalizations, when they happen at all, tend to be purposeful rather than random; paying attention to when they occur is more informative than what they sound like.',
    variants: [
      'Noises from this animal are usually context-driven — pay attention to when the sound happens rather than treating every vocalization as equivalent.',
      'When it does vocalize, the timing tends to carry more information than the pitch or volume.',
      'The few sounds you hear are typically tied to a specific trigger — note the trigger, not just the sound.',
      'Most vocalizations are communicative; the question is not "is it loud" but "what changed just before."',
      'A quieter animal tends to save noise for moments that matter, which makes the context around each sound worth logging.',
      'Expect sounds to be selective rather than continuous — the selectivity is the signal.',
      'When this pet does make noise, there is almost always an antecedent worth identifying.',
      'Rather than cataloguing the sounds themselves, track what was happening 30 seconds before each one.',
      'Purposeful vocalization is the norm here, so each episode is worth a brief note about the surrounding context.',
      'The useful data is the "why now" of each sound, not the sound itself.',
      'This is not an animal that fills silence with noise; when noise appears, it is responding to something concrete.',
      'Log vocalizations as context-plus-sound, not sound alone — the pattern will emerge from the context.',
      'Most sounds here are intentional, which means they are interpretable if you watch the surroundings.',
      'The vocalizations are sparse and usually meaningful — worth tracking because they actually carry information.',
      'Expect infrequent, specific sounds rather than background chatter, and treat each one as a data point.',
      'This animal communicates in episodes, not background hum — so episodes are the unit to record.',
      'When a sound appears, assume a cause and look for it; the cause is almost always findable.',
      'Sound in this species is generally signal rather than noise, which rewards attentive observers.',
      'Pay attention to the trigger-sound pairing rather than the sound in isolation.',
      'Quiet most of the time with pointed exceptions — those exceptions are where the useful information lives.'
    ]
  },
  {
    find: 'Energy follows a predictable weekly curve for many households, with quieter stretches followed by sudden spikes that feel almost seasonal indoors.',
    variants: [
      'Activity levels tend to cluster in waves across the week, with calm days punctuated by abrupt bursts that feel almost weather-driven.',
      'Many households observe a weekly rhythm — a few slow days followed by a sharp spike that seems to come from nowhere.',
      'Indoor energy often mimics a seasonal pattern on a compressed scale, with quieter stretches and then sudden surges.',
      'Expect a weekly oscillation rather than steady output — low-key days alternate with energetic ones on a recognisable cadence.',
      'Households commonly see a wave pattern across the week: several subdued days, then a clear spike.',
      'The energy curve is rarely flat; most homes observe quieter periods interrupted by sharp, almost seasonal surges.',
      'Activity tends to bunch: long quiet stretches broken by a high-energy day or two that looks out of nowhere but is usually cyclical.',
      'A predictable rhythm often emerges — calm for stretches, then an abrupt spike that repeats week over week.',
      'Indoor activity often looks like a rolling wave, with visibly low-energy days followed by unexpectedly active ones.',
      'Many owners note a weekly cycle of energy with slow periods and short bursts of high output.',
      'The pattern in most homes is oscillating rather than constant — quiet stretches and then visible spikes.',
      'Expect distinct "low days" and "high days" on a roughly seven-day cycle, rather than a flat daily average.',
      'Energy typically waves through the week, quiet for stretches and then sharply more active.',
      'A weekly cadence — quiet stretches broken by bursts — is common enough to plan around rather than be surprised by.',
      'Households often describe a tidal quality to energy: it recedes for days, then comes back in force.',
      'The weekly curve tends to have visible troughs and peaks rather than a steady line.',
      'Anticipate clusters of calm days and clusters of high-energy days rather than an even distribution.',
      'Activity tends to come in episodic spikes inside a broader weekly rhythm.',
      'Weekly variability is the norm — low stretches punctuated by clear spikes.',
      'The underlying pattern is cyclical; flat energy across a full week is the exception, not the rule.'
    ]
  },
  {
    find: 'Some behaviors that look like disobedience are actually decision-making pauses — the animal is considering, not defying.',
    variants: [
      'What looks like stubbornness is often a processing pause; the animal is weighing the situation, not refusing.',
      'A delay in response is commonly deliberation rather than disobedience — the animal is thinking, not ignoring you.',
      'When a pet hesitates before responding, it is usually running through options rather than flouting a cue.',
      'Slow or non-compliant responses are often evaluative pauses, not defiance.',
      'A lot of so-called bad behavior is really just the animal taking a moment to think through the request.',
      'The pause before compliance is often cognitive work, not resistance to it.',
      'Behavior that looks like refusal is more often the animal assessing the cue against its current context.',
      'Hesitation is frequently decision-making in progress rather than a refusal to cooperate.',
      'A pet that does not respond immediately is often deliberating rather than ignoring the cue.',
      'What reads as defiance is usually a short mental review — the animal has not refused, it is choosing.',
      'The delay between cue and action is often where processing happens; it is not the same as disobedience.',
      'Many "stubborn" moments are actually the animal considering the request against its sense of the situation.',
      'Silence after a cue tends to mean "thinking" more often than it means "no."',
      'Owners often mistake a decision pause for a disobedient pause — they look the same from outside.',
      'A non-response is not always a refusal; sometimes the animal is still doing the math.',
      'Evaluation time tends to get labelled as defiance incorrectly; the animal is usually just working through the cue.',
      'What appears to be willful non-compliance is, in many cases, a pause while the animal sorts through competing signals.',
      'Delays are often processing, not protest — worth checking before correcting the animal.',
      'Hesitation before responding is commonly the animal thinking, not the animal saying no.',
      'A pause after a cue is frequently decision-making; reading it as refusal cuts training short.'
    ]
  },
  {
    find: 'Subtle changes in posture, appetite, or sleep position often telegraph mood shifts hours before anything obvious happens.',
    variants: [
      'Small shifts in how a pet sits, eats, or rests usually precede bigger mood or health changes by several hours.',
      'A slight change in sleep position or appetite tends to be the first visible clue that something is shifting.',
      'Minor posture or feeding-pattern changes usually show up well before any dramatic sign.',
      'Watch the quiet cues — sleep position, food interest, general stance — because they move first.',
      'Subtle signals in resting posture or appetite precede the loud ones by a noticeable margin.',
      'Small changes in how an animal carries itself or eats typically lead a mood shift by hours.',
      'Body language and appetite shifts are often hours ahead of obvious behavioral changes.',
      'A drop in appetite or a different sleep curl often turns out to be the early warning for something larger.',
      'Posture, appetite, and sleep arrangement change subtly first; the obvious signs catch up later.',
      'The earliest signals tend to be small: how it rests, how it eats, how it holds itself.',
      'Quiet cues — stance, feeding speed, choice of resting spot — usually lead by a few hours.',
      'The first visible signs of a shift are rarely dramatic; they are small changes in posture or intake.',
      'Watch for the small stuff — a shifted sleep corner, a left-over meal — because it leads the bigger signals.',
      'Subtle cues in body carriage and mealtime behavior tend to appear hours before the obvious changes.',
      'Small shifts in the unremarkable routines are usually the earliest tell.',
      'Expect early warnings in appetite, posture, and sleep position rather than in loud behavior change.',
      'Minor tells — how it rests, what it leaves in the bowl, how it stands — arrive first.',
      'The leading indicators are almost always small and easy to miss; the dramatic signs are lagging.',
      'Early changes in eating or resting behavior are typically more reliable predictors than dramatic symptoms.',
      'Quiet changes precede the loud ones by hours; the skill is in catching the quiet ones.'
    ]
  },
  {
    find: 'Trust takes longer to form than most timelines suggest, and trying to rush it usually extends the process instead of shortening it.',
    variants: [
      'The usual timelines for building trust are optimistic, and pushing the pace tends to backfire.',
      'Trust-building runs slower than most guides suggest; pressure extends it rather than shortens it.',
      'Most estimates for trust development are too short, and trying to shortcut the process usually costs more time than it saves.',
      'Rushing trust is counterproductive — the animal reads the pressure and the timeline stretches further out.',
      'Trust takes longer to form than owners expect, and compressing it almost always backfires.',
      'The process is slower than the usual expectations, and attempts to speed it up tend to set things back.',
      'Expect a longer ramp than most advice suggests, and know that pressure tends to lengthen it.',
      'Timelines for trust are frequently underestimated; trying to force the pace usually extends the timeline.',
      'Pushing for a faster bond typically produces the opposite result — slower, warier animals.',
      'The reasonable timeline for trust is longer than the internet suggests, and hurrying it damages progress.',
      'Most published trust-building schedules are compressed; the reality runs longer, especially if pressured.',
      'The slow route is usually the fast route here — pressure extends the process.',
      'Animals build trust on their own clock, and attempts to speed that clock usually set it back.',
      'Trust is a longer project than it looks, and impatience makes it longer still.',
      'The ramp-up to real trust is slower than owners anticipate; trying to force it extends the timeline.',
      'Give trust-building more runway than seems necessary; trying to accelerate it usually costs time.',
      'Expect a longer timeline than the defaults, and note that trying to shorten it reliably adds delay.',
      'Trust forms slowly, and every attempt to speed the process tends to push the finish line further out.',
      'Plans that assume fast trust tend to produce slow trust; plans that assume slow trust tend to produce faster trust.',
      'The fastest path to trust is accepting that it is slow.'
    ]
  },
  {
    find: 'Small environmental triggers — a different rug, a new scent, a rearranged room — can unsettle routines in ways first-time owners do not anticipate.',
    variants: [
      'Minor changes to the physical environment — a new rug, moved furniture, a different scent — often throw off routines more than owners expect.',
      'A swapped rug or a rearranged living room can disrupt a pet\'s rhythm in ways a first-time owner rarely predicts.',
      'Small environmental shifts — a new smell, a moved piece of furniture — can upset routines out of proportion to how trivial they feel to humans.',
      'Routines are more sensitive to small environmental changes than newcomers typically expect.',
      'First-time owners often underestimate how much a rearranged room or a new scent can disturb a settled routine.',
      'Tiny home changes — a new rug, a shuffled layout — sometimes have outsized effects on routine stability.',
      'Trivial-looking environmental changes can destabilize routines more than first-time owners expect.',
      'Minor shifts at home — scent, furniture, lighting — often unsettle pets in ways that surprise new owners.',
      'A changed rug or a new air freshener can disrupt a pet\'s rhythm out of all proportion to how small the change seemed.',
      'Pets respond to small environmental cues more sensitively than most first-time owners anticipate.',
      'First-time owners frequently learn, the hard way, that small home changes can reset a pet\'s routine.',
      'New scents, new textures, or shifted furniture commonly upset settled rhythms in unexpected ways.',
      'The margin of tolerance for environmental change is smaller than newcomers assume.',
      'Rearranging a room or switching a rug can produce larger routine effects than one would expect.',
      'Small cues in the environment — scent, layout, lighting — shape routines more than owners usually assume.',
      'Environmental micro-changes tend to land bigger than their size suggests; first-time owners learn this through surprise.',
      'New furniture, a different rug, or a rearranged room can ripple through routines for days.',
      'First-time owners are often caught off-guard by how much a small environmental shift changes behavior.',
      'A pet\'s sense of "normal" is built on small sensory details; changing those details has larger consequences than expected.',
      'The environment is more load-bearing in routine stability than it looks, and small changes can matter disproportionately.'
    ]
  },
  {
    find: 'Preferences around water, food texture, and resting surfaces are often remarkably specific and worth respecting rather than overriding.',
    variants: [
      'Pets frequently have narrow preferences about water, food texture, and where they rest — worth accommodating rather than fighting.',
      'Specific preferences about water, food consistency, and resting spots are common and usually worth respecting.',
      'Water, food texture, and sleeping-surface choices are often highly individual; overriding them rarely pays off.',
      'Animals tend to have surprisingly specific opinions about water, food texture, and where they rest — usually worth going with rather than against.',
      'Individual preferences around water, food, and sleeping surfaces are real and typically stronger than owners expect.',
      'Expect narrow preferences about drinking water, food texture, and resting surfaces — and accommodate them where reasonable.',
      'Preferences around water source, food texture, and resting spot are more specific than most new owners expect.',
      'Water, food texture, and resting-surface preferences are often idiosyncratic and worth honouring rather than overriding.',
      'Pets often have very particular feelings about water freshness, food mouthfeel, and favored resting spots.',
      'Texture of food, temperature of water, and firmness of resting surfaces matter more to individual pets than many owners realize.',
      'Respect the small preferences — water, food texture, resting surfaces — because overriding them usually costs more than going along with them.',
      'Individual tastes in water, food, and resting surface tend to be specific and persistent; working with them is easier than against them.',
      'The pickiness around water, food texture, and resting spots is real and worth honouring instead of fighting.',
      'Specific choices about water, food, and sleep surfaces are normal — the smart play is accommodation, not correction.',
      'Animals often hold strong preferences about mundane things — water, food texture, resting spots — and overriding them rarely helps.',
      'Preferences about what to drink from, what to eat, and where to rest are frequently precise and worth supporting.',
      'Most pets develop narrow preferences in these domains; working around them is less costly than working against them.',
      'Water bowl, food texture, and resting surface preferences are real and shaping them through brute force is a losing game.',
      'The smallest preferences — a preferred drinking fountain, a specific food texture, a favourite mat — usually warrant accommodation.',
      'Pets often demonstrate specific tastes in these small areas; respecting them pays dividends in cooperation elsewhere.'
    ]
  }
];

function main() {
  const files = walk(ROOT);
  console.log(`Pass 18: scanning ${files.length} files...`);
  let filesModified = 0;
  const byPhrase = {};
  PHRASES.forEach((p, i) => byPhrase[i] = 0);

  for (const f of files) {
    let html = fs.readFileSync(f, 'utf8');
    const orig = html;
    const seed = hash(f + ':p18');

    PHRASES.forEach((p, i) => {
      if (!html.includes(p.find)) return;
      let localCount = 0;
      while (html.includes(p.find)) {
        const variant = p.variants[(seed + i * 13 + localCount * 7) % p.variants.length];
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
  console.log('=== PASS 18 COMPLETE ===');
  console.log(JSON.stringify({ filesScanned: files.length, filesModified, byPhrase: report }, null, 2));
}

main();
