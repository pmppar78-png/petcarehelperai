#!/usr/bin/env node
/**
 * PetCareHelperAI — Template Pattern Elimination (Third Pass)
 *
 * Removes remaining generic template phrases that create detectable patterns
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Varied replacements for common template phrases
const templateReplacements = {
  'This guide covers everything you need to know.': [
    'Here\'s what the evidence and breed data show.',
    'Below, we break down the practical details.',
    'The following sections address key owner concerns.',
    'We\'ve organized the most relevant information below.',
    'Read on for the specifics that matter most.',
    'What follows is a practical breakdown of the key factors.',
    'The details below reflect current veterinary knowledge and breed data.',
    'Let\'s examine the important details.',
    'Here\'s a comprehensive look at what you need to consider.',
    'We cover the essential details in the sections that follow.',
    'The practical information below will help guide your decisions.',
    'Below you\'ll find the key information organized by topic.',
  ],
  'Every .+ is unique, but breed tendencies give us a reliable framework for understanding their needs.': null, // regex pattern, handled separately
};

const templateRegexPatterns = [
  {
    pattern: /This guide covers everything you need to know\./g,
    replacements: [
      'Here\'s what the evidence and breed data show.',
      'Below, we break down the practical details.',
      'The following sections address key owner concerns.',
      'We\'ve organized the most relevant information below.',
      'Read on for the specifics that matter most.',
      'What follows is a practical breakdown of the key factors.',
      'The details below reflect current veterinary knowledge and breed data.',
      'Let\'s examine the important details.',
      'Here\'s a comprehensive look at what you need to consider.',
      'We cover the essential details in the sections that follow.',
      'The practical information below will help guide your decisions.',
      'Below you\'ll find the key information organized by topic.',
    ]
  },
  {
    pattern: /Every [A-Z][a-z]+ [A-Za-z' ]* is unique, but breed tendencies give us a reliable framework for understanding their needs\./g,
    replacements: [
      'Individual variation exists within every breed, but documented breed traits provide a solid foundation for care planning.',
      'While each animal has its own personality, breed-level data helps establish realistic expectations.',
      'Breed characteristics offer a useful starting point, though every pet develops its own individual quirks.',
      'Understanding breed tendencies equips you to anticipate needs, even as individual personalities vary.',
    ]
  },
  {
    pattern: /Understanding breed-specific needs helps you provide the best possible care\./g,
    replacements: [
      'Breed-informed care makes a measurable difference in long-term health outcomes.',
      'Knowledge of breed-specific characteristics directly translates to better day-to-day care.',
      'Tailoring your approach to breed-specific needs is one of the most impactful things an owner can do.',
      'Care that accounts for breed predispositions leads to earlier detection and better prevention.',
    ]
  },
  {
    pattern: /With proper care and attention to their breed-specific needs, your [A-Z][a-z]+ [A-Za-z' ]* can live a long, healthy, and happy life of [0-9-]+ yrs\./g,
    replacements: [
      'Attentive, breed-informed care is the strongest predictor of a fulfilling lifespan for your companion.',
      'Proactive health management based on breed knowledge significantly contributes to quality of life and longevity.',
      'Owners who understand breed-specific risks and act on them give their pets the best chance at a full, healthy life.',
    ]
  },
  {
    pattern: /Establishing a consistent daily routine helps your [A-Z][a-z]+ [A-Za-z' ]* feel secure and reduces stress-related behavioral problems\./g,
    replacements: [
      'Consistent daily structure — including predictable meal times, exercise, and rest periods — reduces anxiety and supports behavioral stability.',
      'A stable daily routine serves as the foundation for behavioral wellness, reducing reactivity and stress responses.',
      'Routine and predictability are powerful tools for managing stress and preventing behavioral issues.',
    ]
  },
  {
    pattern: /Regular veterinary checkups — at least annually for adults and twice yearly for seniors — are essential for catching breed-specific health concerns early\./g,
    replacements: [
      'Preventive veterinary care, following AAHA guidelines of annual exams for adults and biannual exams for seniors, enables earlier detection of breed-related conditions.',
      'Routine veterinary screenings catch many breed-related conditions at stages where intervention is most effective.',
      'A proactive veterinary schedule — tailored to life stage and breed risks — is the most cost-effective approach to managing breed-linked health issues.',
    ]
  },
];

// Process all guide files
console.log('=== Template Pattern Elimination (Third Pass) ===');

const guideDir = join(ROOT, 'guides');
const guideFiles = readdirSync(guideDir).filter(f => f.endsWith('.html'));
let fixedCount = 0;

for (const file of guideFiles) {
  const filePath = join(guideDir, file);
  let html = readFileSync(filePath, 'utf8');
  const slug = file.replace('.html', '');
  const original = html;
  const h = hashStr(slug);

  for (const tp of templateRegexPatterns) {
    let matchIndex = 0;
    html = html.replace(tp.pattern, () => {
      const replacement = tp.replacements[(h + matchIndex) % tp.replacements.length];
      matchIndex++;
      return replacement;
    });
  }

  if (html !== original) {
    writeFileSync(filePath, html);
    fixedCount++;
  }
}

// Also fix breed pages
for (const animalDir of ['dogs', 'cats', 'birds', 'fish', 'reptiles', 'amphibians', 'marine-fish', 'small-animals']) {
  const dir = join(ROOT, 'breeds', animalDir);
  if (!existsSync(dir)) continue;
  const files = readdirSync(dir).filter(f => f.endsWith('.html'));
  for (const file of files) {
    const filePath = join(dir, file);
    let html = readFileSync(filePath, 'utf8');
    const slug = file.replace('.html', '');
    const original = html;
    const h = hashStr(slug);

    for (const tp of templateRegexPatterns) {
      let matchIndex = 0;
      html = html.replace(tp.pattern, () => {
        const replacement = tp.replacements[(h + matchIndex) % tp.replacements.length];
        matchIndex++;
        return replacement;
      });
    }

    if (html !== original) {
      writeFileSync(filePath, html);
      fixedCount++;
    }
  }
}

console.log(`Fixed ${fixedCount} files`);
console.log('=== Done ===');
