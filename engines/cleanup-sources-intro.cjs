#!/usr/bin/env node
// Diversify / strip the Sources & References intro paragraph, which is currently
// nearly identical across 1700+ pages. Also kills remaining repeated filler
// ("Owners who take the time to research this aspect typically report better
// outcomes and fewer surprises.", etc.) and removes the duplicated footer
// transparency boilerplate that contradicts itself.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = ['guides', 'locations', 'commercial/dogs', 'commercial/cats', 'commercial/birds', 'commercial/fish', 'commercial/reptiles', 'commercial/amphibians', 'commercial/marine-fish', 'commercial/small-animals'];

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Collapse filler sentences that still leak through.
const SIMPLE = [
  [/Your veterinarian and experienced (?:pet|cat|dog|small animal|bird|fish|reptile|amphibian|marine fish) owners can offer perspective tailored to your situation\.\s*/g, ''],
  [/Owners who take the time to research this aspect typically report better outcomes and fewer surprises\.\s*/g, ''],
  [/What works for one (?:pet|cat|dog|small animal|bird|fish|reptile|amphibian) may not work for another, so use this as a framework rather than a rigid prescription\.\s*/g, ''],
  [/Adapt these suggestions to your pet\u2019s age, health, and temperament\.\s*/g, ''],
  [/Approach this with patience and a willingness to adapt as you learn what works best in your specific situation\.\s*/g, ''],
  [/These principles serve as reliable starting points, but the most effective approach emerges from direct observation and gradual refinement\.\s*/g, ''],
  [/The more you tailor your approach to your pet's individual characteristics, the more responsive and healthy they tend to be\.\s*/g, ''],
  [/Paying attention to the details specific to your pet \u2014 rather than following generic advice \u2014 leads to better outcomes across the board\.\s*/g, ''],
  [/With this foundation in place, you can make more targeted decisions about nutrition, exercise, preventive care, and enrichment that align with your pet's actual requirements\.\s*/g, ''],
  [/Understanding this aspect of dog care helps you make informed decisions that directly affect your dog's wellbeing\.\s*Every dog is different, so observe how yours responds and adjust your approach based on what works\.\s*/g, ''],
  [/This area of (?:pet|dog|cat|small animal|bird|fish|reptile|amphibian) ownership often gets overlooked, but it plays a meaningful role in long-term health and happiness\.\s*/g, ''],
  [/These guidelines work well as a starting point, but your veterinarian can tailor recommendations to your (?:dog|cat|pet)'s specific health profile and lifestyle\.\s*/g, ''],
  [/Our editorial team cross-references this material with peer-reviewed veterinary sources on a regular basis\.\s*/g, ''],
  [/We update this content as veterinary best practices evolve, using peer-reviewed sources and professional guidelines\.\s*/g, ''],
];

// Replace sources-section <p> intros with a short, rotated variant.
const SOURCES_INTROS = [
  'Sources used for fact-checking on this page:',
  'Primary references consulted for this page:',
  'References the editorial team cross-checked while writing this page:',
  'Reference list for the claims on this page:',
];

let touched = 0;

function walk(d) {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.html')) {
      let t = fs.readFileSync(full, 'utf8');
      const orig = t;

      for (const [re, repl] of SIMPLE) t = t.replace(re, repl);

      // Replace the intro paragraph in the sources section.
      t = t.replace(
        /(<h2>Sources &amp; References<\/h2>\s*)<p>[^<]*<\/p>/g,
        (m, h) => {
          const intro = SOURCES_INTROS[hashStr(full) % SOURCES_INTROS.length];
          return `${h}<p>${intro}</p>`;
        }
      );

      // Also catch rarer variants missing entity encoding.
      t = t.replace(
        /(<h2>Sources & References<\/h2>\s*)<p>[^<]*<\/p>/g,
        (m, h) => {
          const intro = SOURCES_INTROS[hashStr(full) % SOURCES_INTROS.length];
          return `${h}<p>${intro}</p>`;
        }
      );

      // Strip empty <p></p> and collapse blank lines again.
      t = t.replace(/<p>\s*<\/p>\s*/g, '');
      t = t.replace(/\n{3,}/g, '\n\n');

      if (t !== orig) {
        fs.writeFileSync(full, t);
        touched++;
      }
    }
  }
}
for (const tgt of TARGETS) walk(path.join(ROOT, tgt));
console.log('sources-intro + residual filler cleanup:', touched, 'files');
