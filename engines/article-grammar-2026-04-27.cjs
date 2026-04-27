#!/usr/bin/env node
/*
 * Article-grammar pass: fixes "Is a {Vowel-starting breed}" -> "Is an ..."
 * across titles, OG titles, and visible H1 patterns. Small fix, but a real
 * quality signal: native-English readers (and Google) treat "Is a Ocicat"
 * as a tell that the page was machine-generated without proofreading.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COMMERCIAL_DIR = path.join(ROOT, 'commercial');

// Two scoped fixes:
//  1. "Is a {VowelBreed}" -> "Is an ..." (titles, OG titles, H1s)
//  2. "for a {Capital-Vowel-Breed}" -> "for an ..." inside the inserted
//     indexing-quality sections, where the breed name is interpolated
//     after "for a". We deliberately require an uppercase vowel after
//     "for a " so we do not touch generic prose like "for a young cat".
const PATTERNS = [
  { find: /\bIs a (?=[AEIOUaeiou])/g, replace: 'Is an ' },
  { find: /\bfor a (?=[AEIOU])/g, replace: 'for an ' },
];

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

let changed = 0;
const files = walk(COMMERCIAL_DIR);
for (const f of files) {
  const before = fs.readFileSync(f, 'utf8');
  let after = before;
  for (const p of PATTERNS) after = after.replace(p.find, p.replace);
  if (after !== before) {
    fs.writeFileSync(f, after);
    changed += 1;
  }
}
console.log(`Article grammar fix: ${changed} of ${files.length} commercial files updated.`);
