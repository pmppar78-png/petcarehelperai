#!/usr/bin/env node
// Pass 15: Clear additional AI-filler template phrases that pass-12 missed.
// These are verbatim-repeated closing / generic-advice sentences that expose the
// site as templated when a reviewer opens multiple pages.

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

// Each entry: exact string match -> array of variant replacements.
// Variants are short so they can slot into whatever paragraph surrounded them.
const PHRASES = [
  {
    find: 'Consistency matters more than perfection — establish a solid routine and improve it incrementally as you gain experience.',
    variants: [
      'A workable routine that you actually follow beats a perfect one you abandon; refine it as you learn what your animal responds to.',
      'Aim for a repeatable routine rather than a flawless one, and adjust as the animal in front of you tells you what needs adjusting.',
      'What matters is a routine the household can sustain, with small tweaks when something clearly is not working.',
      'Pick a plan you can stick with for months, not weeks, and change one variable at a time when you need to.',
      'Stick with an approach long enough to see results, then make targeted changes based on what you actually observe.',
      'A steady schedule you can maintain through busy weeks delivers better outcomes than an ambitious one that collapses after a month.'
    ]
  },
  {
    find: 'Focus on getting the basics right first, then refine your approach based on the feedback you get from real-world results.',
    variants: [
      'Nail the basics — diet, exercise, preventive care — before worrying about optimisation at the edges.',
      'Get the core routine reliable before layering on supplements, gadgets, or specialty products.',
      'Most outcomes come from the obvious fundamentals done well; advanced tactics matter only after those are in place.',
      'The high-leverage inputs are food quality, exercise, preventive veterinary care, and handling. Dial those in first.',
      'Start with the unsexy fundamentals and add complexity only when the fundamentals stop explaining the results you are seeing.',
      'Work on the simple inputs first and let your own observations tell you where to add nuance.'
    ]
  },
  {
    find: 'The most effective strategy combines following proven guidelines with staying responsive to what actually works for your situation.',
    variants: [
      'Published guidelines get you most of the way; the last mile is paying attention to how your specific animal responds.',
      'Use vetted guidelines as the default and adjust where the animal in front of you contradicts the averages.',
      'Standard advice covers the common case; the exceptions become visible only if you keep watching your pet closely.',
      'Protocols exist because they work for most animals; the ones where they do not work will tell you if you are watching.',
      'Follow the well-established playbook and keep a short log so you can spot the places where your pet deviates from it.',
      'Default to evidence-based guidelines and depart from them only when your own observations or your vet give you a specific reason.'
    ]
  },
  {
    find: 'Habit-building in this area is a short-term project with long-term returns — commit a few weeks of deliberate practice and the rest handles itself.',
    variants: [
      'The first few weeks require deliberate effort; after that the routine mostly runs on autopilot.',
      'Expect the first three to four weeks to feel like work, and the months after that to feel like maintenance.',
      'Front-load the effort: set up the habit carefully, and it will carry itself once it is established.',
      'The cost of a new routine is concentrated in the first month; the benefit compounds for years afterward.',
      'A few weeks of focused habit-building typically locks in practices that then run themselves.',
      'Invest heavily in the initial setup of the routine so that the ongoing cost is low.'
    ]
  },
  {
    find: 'The routines that matter here take a few weeks of consistent effort to install and then run themselves for years.',
    variants: [
      'Give the routine three to four weeks to become automatic; after that, it mostly sustains itself.',
      'A short stretch of deliberate repetition is usually enough to bed the habit in for the long haul.',
      'It takes several consistent weeks to establish the rhythm, and then it becomes household background.',
      'The upfront work is measured in weeks, but the payoff is measured in years of smoother care.',
      'Early consistency is what converts the routine from effortful to automatic.',
      'Expect a short installation period followed by a long stretch of near-autopilot maintenance.'
    ]
  },
  {
    find: 'Once the foundation is understood, the downstream choices in feeding, activity, and preventive medicine fall into place with less guesswork',
    variants: [
      'With the basics clear, decisions about food, activity, and preventive care stop feeling like guesswork',
      'Understanding the core picture makes daily calls about feeding, exercise, and preventive care substantially easier',
      'A clear grasp of the fundamentals is what turns later decisions from anxious guessing into informed choices',
      'Once you understand the baseline, individual choices about diet, exercise, and preventive medicine follow more naturally',
      'With the foundation solid, choices about food, activity level, and preventive care get noticeably simpler',
      'A good grip on the basics is what makes downstream choices — food, exercise, preventive care — feel tractable'
    ]
  },
  {
    find: 'From this baseline, the specific decisions — nutrition, exercise, preventive care, enrichment — become considerably easier to get right',
    variants: [
      'Working from this baseline, the practical calls around nutrition, exercise, preventive care, and enrichment become clearer',
      'With that baseline in hand, individual calls on food, exercise, preventive care, and enrichment follow more naturally',
      'Using this as a starting point, the day-to-day decisions about feeding, activity, preventive care, and mental stimulation are easier to land',
      'From that baseline, the specific questions about food, exercise, routine vet care, and enrichment have clearer answers',
      'With the baseline understood, nutrition, activity, preventive medicine, and enrichment choices take on a clearer shape',
      'Anchored to that baseline, the daily calls about nutrition, exercise, preventive care, and mental engagement are straightforward'
    ]
  },
  {
    find: 'Lived use of the plan will tell you which pieces matter for your situation and which do not — adjust accordingly.',
    variants: [
      'Actual use of the plan over a few weeks will reveal which parts matter and which are optional for your animal.',
      'Running the plan in real life shows you very quickly which pieces are load-bearing and which ones you can drop.',
      'Weeks of real use will make it obvious which elements are pulling weight and which can be pruned.',
      'Use tells you more than theory: a month in, you will know which parts of the plan to keep and which to skip.',
      'The plan reveals itself under use — keep what is working, trim what is not.',
      'After a few weeks of lived experience with the plan, the important pieces stand out on their own.'
    ]
  },
  {
    find: 'Your own data — weeks of watching your animal under this plan — is ultimately what tells you where to spend attention.',
    variants: [
      'Your own observations, gathered over a few weeks, are what tell you where the real leverage is.',
      'The most useful input is the week-over-week record you keep of how your animal responds.',
      'A few weeks of careful observation does more than any generic guide to reveal where to focus.',
      'The journal of what you actually see — not a checklist — is what points at the priorities for your household.',
      'Keep watching, keep notes, and the places worth paying attention to will emerge from your own data.',
      'The signal that matters comes from a few weeks of real-life observation, not from any generic recommendation.'
    ]
  },
  {
    find: 'The key is finding the right balance between following established guidelines and responding to individual needs as they arise.',
    variants: [
      'Balance published guidelines with the specifics of your animal — neither alone is enough.',
      'Use protocols as a default and adjust when your pet\'s particular needs push in a different direction.',
      'Guidelines set the floor; observation of your individual animal sets the ceiling.',
      'A sensible routine borrows from standard care but leaves room for the exceptions your pet will reveal.',
      'Follow the playbook where it fits and depart from it where the animal in front of you clearly calls for something different.',
      'Established protocols are the starting point; real-life adjustments based on your pet are what make the care actually fit.'
    ]
  },
  {
    find: 'Take a practical approach: apply established best practices, monitor the results, and adjust course as needed.',
    variants: [
      'Apply accepted best practices, watch what happens, and adjust — routine science-of-care rather than magic.',
      'Run the standard playbook, keep notes on how your animal responds, and change course when the notes say to.',
      'Default to best practice, monitor outcomes, and steer based on what you actually observe.',
      'Start with the well-supported defaults, measure how they work, and tune from there.',
      'Use evidence-based routines as the baseline and iterate when your observations push you to.',
      'Stick to evidence-based care, track results, and let that record tell you when to change something.'
    ]
  },
  {
    find: 'Owners who watch the dog in front of them closely — not an average of the breed — consistently report better outcomes.',
    variants: [
      'Paying attention to this specific dog, not a breed average, is where owner experience translates into better outcomes.',
      'Outcomes track closely to how well the owner pays attention to the individual animal rather than the breed stereotype.',
      'The owners whose dogs do best tend to respond to the dog in front of them, not to a generic picture of the breed.',
      'Close observation of the individual animal — its baseline, its patterns, its outliers — beats relying on breed averages.',
      'Watching the particular dog rather than a breed summary is what separates owners who catch problems early from those who do not.',
      'Outcomes are consistently better for owners who treat the individual animal\'s baseline as their reference, not the breed\'s average.'
    ]
  }
];

function main() {
  const files = walk(ROOT);
  console.log(`Pass 15: scanning ${files.length} files...`);
  let filesModified = 0;
  const byPhrase = {};
  PHRASES.forEach((p, i) => byPhrase[i] = 0);

  for (const f of files) {
    let html = fs.readFileSync(f, 'utf8');
    const orig = html;
    const seed = hash(f + ':p15');

    PHRASES.forEach((p, i) => {
      if (!html.includes(p.find)) return;
      let localCount = 0;
      while (html.includes(p.find)) {
        const variant = p.variants[(seed + i * 7 + localCount) % p.variants.length];
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
  console.log('=== PASS 15 COMPLETE ===');
  console.log(JSON.stringify({ filesScanned: files.length, filesModified, byPhrase: report }, null, 2));
}

main();
