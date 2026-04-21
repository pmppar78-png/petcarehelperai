#!/usr/bin/env node
// Pass 16: Final residual template-phrase cleanup.
// Targets the locations-page "Translate these traits..." phrase and re-diversifies
// any pass-15 variants that ended up clustering on 15+ pages.

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
    find: 'Translate these traits into specific daily choices rather than treating them as background reading',
    variants: [
      'Turn these traits into concrete daily decisions — about diet, walks, play, and rest — rather than leaving them as background knowledge',
      'Let the traits shape specific habits and schedules; reading about them without acting on them is the common failure mode',
      'Translate what you know about the breed into the actual choices you make each morning and evening',
      'Use the traits as a working specification for daily care, not as trivia that sits unused',
      'Move these characteristics from background reading into the specific routines you keep with your pet',
      'Convert the general traits into the narrow set of decisions you make each day — food, exercise, rest, social contact'
    ]
  },
  {
    find: 'routine science-of-care rather than magic',
    variants: [
      'the steady application of standard care, not a trick',
      'deliberate daily practice, not a single breakthrough',
      'the ordinary application of known-good methods',
      'consistent execution of care basics',
      'the patient repetition of well-understood practices',
      'steady attention over time rather than a silver bullet'
    ]
  },
  {
    find: 'evidence-based routines as the baseline',
    variants: [
      'evidence-based care as the default',
      'well-established protocols as the starting point',
      'standard-of-care routines as the foundation',
      'accepted veterinary guidelines as the base layer',
      'vetted best practices as the starting default',
      'established care standards as the floor'
    ]
  }
];

function main() {
  const files = walk(ROOT);
  console.log(`Pass 16: scanning ${files.length} files...`);
  let filesModified = 0;
  const byPhrase = {};
  PHRASES.forEach((p, i) => byPhrase[i] = 0);

  for (const f of files) {
    let html = fs.readFileSync(f, 'utf8');
    const orig = html;
    const seed = hash(f + ':p16');

    PHRASES.forEach((p, i) => {
      if (!html.includes(p.find)) return;
      let localCount = 0;
      while (html.includes(p.find)) {
        const variant = p.variants[(seed + i * 11 + localCount * 3) % p.variants.length];
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
  console.log('=== PASS 16 COMPLETE ===');
  console.log(JSON.stringify({ filesScanned: files.length, filesModified, byPhrase: report }, null, 2));
}

main();
