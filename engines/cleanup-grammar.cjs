#!/usr/bin/env node
// Fix "a + vowel-sound" grammar errors from templated breed names.
// Also fixes "a Abyssinian", "a Akita", etc. Conservative whole-word replacements.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = [
  'guides', 'locations',
  'commercial/dogs', 'commercial/cats', 'commercial/birds',
  'commercial/fish', 'commercial/reptiles', 'commercial/amphibians',
  'commercial/marine-fish', 'commercial/small-animals',
  'breeds/dogs', 'breeds/cats', 'breeds/birds',
  'breeds/fish', 'breeds/reptiles', 'breeds/amphibians',
  'breeds/marine-fish', 'breeds/small-animals',
];

// Breed/proper-noun starters whose first letter produces a vowel sound.
// Keep list tight — only breeds we know exist on the site.
const VOWEL_TOKENS = [
  'Abyssinian', 'Airedale', 'Akita', 'Alaskan', 'American', 'Anatolian',
  'Andalusian', 'Angora', 'Arabian', 'Argentino', 'Aussiedoodle', 'Australian',
  'Austrian', 'Egyptian', 'English', 'Entlebucher', 'Eskimo', 'Estrela',
  'Eurasier', 'European', 'Exotic', 'Irish', 'Italian', 'Icelandic', 'Indian',
  'Ocicat', 'Old English', 'Oriental', 'Otterhound', 'Oriental Shorthair',
  'Old', 'Ori-Pei', 'Ibizan', 'Anatolian Shepherd',
  // Hours / 8/18 patterns we may encounter — skip, only words.
];

// Additional case-sensitive compound first-words seen in content (lower risk).
const VOWEL_COMMON = [
  'annual', 'active', 'adult', 'adolescent', 'aging', 'elderly', 'eager',
  'energetic', 'enthusiastic', 'important', 'indoor', 'outdoor',
  'obedient', 'older', 'orange', 'extra', 'eight', 'eleven', 'experienced',
  'ideal',
];

let totalFiles = 0, totalReplacements = 0;

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build a single regex that matches " a <Token>" or "(A) <Token>" at word boundaries,
// but *not* when "a" is part of another word.
const tokenAlts = VOWEL_TOKENS.map(escapeRegex).join('|');
const commonAlts = VOWEL_COMMON.map(escapeRegex).join('|');

// \\b a(\\s+)(Token) → \\ban\\1\\2 (preserves original capitalization of the rest)
const tokenRe = new RegExp(`\\b([Aa])(\\s+)(${tokenAlts}|${commonAlts})\\b`, 'g');

function walkHtml(dir, cb) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkHtml(full, cb);
    else if (e.isFile() && e.name.endsWith('.html')) cb(full);
  }
}

for (const target of TARGETS) {
  walkHtml(path.join(ROOT, target), (file) => {
    let text = fs.readFileSync(file, 'utf8');
    let count = 0;
    const out = text.replace(tokenRe, (m, article, space, token) => {
      // Preserve leading case: "A " → "An ", "a " → "an "
      count++;
      const repl = article === 'A' ? 'An' : 'an';
      return `${repl}${space}${token}`;
    });
    if (count > 0) {
      fs.writeFileSync(file, out);
      totalFiles++;
      totalReplacements += count;
    }
  });
}

console.log(`grammar fix: ${totalReplacements} replacements across ${totalFiles} files`);
