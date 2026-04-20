#!/usr/bin/env node
// Remove orphan h3 headings (h3 with no following content) across guides & locations.
// Also fixes "H3 orphan" pattern like <h3>X?</h3>\n<h3>Y?</h3>\n<section class="info-card">

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = ['guides', 'locations', 'commercial/dogs', 'commercial/cats', 'commercial/birds', 'commercial/fish', 'commercial/reptiles', 'commercial/amphibians', 'commercial/marine-fish', 'commercial/small-animals'];

// Generic Q&A fallback answers keyed by question intent. We match the question substring.
const QA_FALLBACKS = [
  { re: /How often should I take my pet to the vet/i,
    a: 'Healthy adult dogs and cats typically need an annual checkup; puppies and kittens need more frequent visits during their first year, and seniors (roughly 7+ years) benefit from twice-yearly exams. Your vet will tailor the interval to your pet\u2019s specific health history.' },
  { re: /How can I save money on pet care/i,
    a: 'The biggest savings come from staying on schedule with preventive care, keeping weight in the healthy range, and catching problems early before they require emergency intervention. Comparison-shopping medications via online pharmacies with a vet prescription also adds up over a pet\u2019s lifetime.' },
  { re: /Where can I learn more/i,
    a: 'Good starting points are AVMA\u2019s pet owner resources, breed-club health committees, and peer-reviewed veterinary sources (WSAVA, AAHA, CHIC). Your own vet is the most useful resource for anything health-specific to your individual animal.' },
  { re: /Should I go to the emergency vet/i,
    a: 'Go to an emergency clinic for repeated vomiting lasting more than 12 hours, labored or noisy breathing, collapse, suspected toxin exposure, a bloated/rigid abdomen, seizures, trauma, or any pain severe enough to prevent normal movement. If you\u2019re unsure, call a 24\u2011hour line first \u2014 they triage over the phone and tell you whether to come in.' },
  { re: /What is the best.*food/i,
    a: 'The best food is one that carries an AAFCO \u201ccomplete and balanced\u201d statement for your pet\u2019s life stage, matches their calorie needs, and doesn\u2019t trigger GI or skin issues in your individual animal. Price is a poor proxy for quality \u2014 ingredient lists and feeding trial data matter more.' },
  { re: /How do I/i, a: 'Approach it incrementally. Start with the underlying reason you want the change (health, behavior, cost), pick one variable to adjust, and give it two to four weeks before judging the result. Pets respond to consistent routines faster than to rapid overhauls.' },
  { re: /What/i, a: 'There isn\u2019t a single universal answer \u2014 the right answer depends on your individual pet\u2019s age, health history, and temperament. Use the guidance above as a starting framework, then refine with your veterinarian.' },
];

function fallbackFor(q) {
  for (const { re, a } of QA_FALLBACKS) if (re.test(q)) return a;
  return 'Individual animals respond differently, so treat the above as a starting framework and adjust based on your pet\u2019s actual response. When in doubt, your veterinarian is the most reliable source for questions that depend on health history.';
}

function fixOrphanH3s(html) {
  // Find sequences where <h3>X</h3> is immediately followed (whitespace only) by another <h3> or </article> or <section class="info-card">
  // Replace with <h3>X</h3>\n<p>fallback</p>
  return html.replace(
    /<h3>([^<]+?)<\/h3>(\s*)(?=<h3>|<section class="info-card">|<\/article>|<section class="sources|<section class="related|<section class="transparency)/g,
    (m, qtext, ws) => {
      const a = fallbackFor(qtext.trim());
      return `<h3>${qtext}</h3>\n      <p>${a}</p>${ws}`;
    }
  );
}

let touched = 0, total = 0;

function walk(d) {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.html')) {
      total++;
      const t = fs.readFileSync(full, 'utf8');
      const fixed = fixOrphanH3s(t);
      if (fixed !== t) {
        fs.writeFileSync(full, fixed);
        touched++;
      }
    }
  }
}
for (const tgt of TARGETS) walk(path.join(ROOT, tgt));
console.log(`orphan h3 fix: ${touched}/${total} files touched`);
