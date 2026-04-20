#!/usr/bin/env node
// Diversify the injected "Focus first on the fundamentals..." FAQ answer across guides.
// Picks one of several varied answers per file based on deterministic hash.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = ['guides', 'locations', 'commercial/dogs', 'commercial/cats', 'commercial/birds', 'commercial/fish', 'commercial/reptiles', 'commercial/amphibians', 'commercial/marine-fish', 'commercial/small-animals'];

const ANSWERS = [
  'Priorities depend on what you\u2019re trying to solve: diet and preventive vet care matter first, then environment, exercise, and socialization. Read through the sections that apply to your situation rather than trying to tick every box.',
  'The two factors owners most commonly underestimate are routine diagnostics and the value of a consistent daily rhythm. Both are cheaper to maintain than to fix after something goes wrong.',
  'Start with the basics you can control \u2014 food, vet schedule, environmental setup \u2014 then layer in the breed- or species-specific details above. A veterinarian who knows your animal will help you weight what applies.',
  'Most of the meaningful decisions come down to three things: picking food that matches life stage, keeping preventive care on schedule, and adjusting routine as the animal ages. The sections above go deeper on each.',
  'Give weight to what\u2019s modifiable: diet, exercise, routine, and early screening. Genetics and temperament are fixed, but how you manage them isn\u2019t.',
  'Ask your vet which of the risks listed above actually apply to your individual animal. A lot of blanket advice doesn\u2019t hold once you factor in age, weight, and health history.',
  'Think in seasons: what does this pet need this month, and what needs to change as they age? The sections above cover the adult case; kitten/puppy and senior needs differ materially.',
  'Food, routine, and preventive vet visits are the three levers that move outcomes the most. The rest of the page goes into where individual variation matters.',
];

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const OLD = `<p>Focus first on the fundamentals: species-appropriate diet, a predictable daily routine, routine preventive vet care, and environmental setup that matches the animal\u2019s natural behavior. Specific details vary by individual \u2014 the sections above cover the variations worth knowing about before you make decisions.</p>`;

let files = 0;

function walk(d) {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.html')) {
      let t = fs.readFileSync(full, 'utf8');
      if (t.includes(OLD)) {
        const h = hashStr(full);
        const answer = ANSWERS[h % ANSWERS.length];
        t = t.replace(OLD, `<p>${answer}</p>`);
        fs.writeFileSync(full, t);
        files++;
      }
    }
  }
}
for (const tgt of TARGETS) walk(path.join(ROOT, tgt));
console.log('faq diversification:', files, 'files');
