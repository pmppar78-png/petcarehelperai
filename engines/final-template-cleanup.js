#!/usr/bin/env node
/**
 * PetCareHelperAI — Final Template Cleanup (Fourth Pass)
 *
 * Catches remaining template patterns missed by character-class restrictions
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

const templatePatterns = [
  {
    // Very permissive — matches any breed name including St., Shar-Pei, etc.
    pattern: /Every [^.]{3,60} is unique, but breed tendencies give us a reliable framework for understanding their needs\./g,
    replacements: [
      'Individual variation exists within every breed, but documented breed traits provide a solid foundation for care planning.',
      'While each animal has its own personality, breed-level data helps establish realistic expectations.',
      'Breed characteristics offer a useful starting point, though every pet develops its own individual quirks.',
      'Understanding breed tendencies equips you to anticipate needs, even as individual personalities vary.',
      'No two animals are identical, but breed-level health and temperament data provides actionable guidance for owners.',
      'Breed data gives us statistical probabilities, not certainties — but those probabilities shape smart care decisions.',
    ]
  },
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
    pattern: /With proper care and attention to their breed-specific needs, your [^.]{3,60} can live a long, healthy, and happy life of [0-9-]+ yrs\./g,
    replacements: [
      'Attentive, breed-informed care is the strongest predictor of a fulfilling lifespan.',
      'Proactive health management based on breed knowledge significantly contributes to quality of life and longevity.',
      'Owners who understand breed-specific risks and act on them give their pets the best chance at a full, healthy life.',
      'Investing in preventive care tailored to breed predispositions pays dividends across your pet\'s lifetime.',
    ]
  },
  {
    pattern: /Establishing a consistent daily routine helps your [^.]{3,60} feel secure and reduces stress-related behavioral problems\./g,
    replacements: [
      'Consistent daily structure — including predictable meal times, exercise, and rest periods — reduces anxiety and supports behavioral stability.',
      'A stable daily routine serves as the foundation for behavioral wellness, reducing reactivity and stress responses.',
      'Routine and predictability are powerful tools for managing stress and preventing behavioral issues.',
    ]
  },
  {
    pattern: /Regular veterinary checkups — at least annually for adults and twice yearly for seniors — are essential for catching breed-specific health concerns early\./g,
    replacements: [
      'Preventive veterinary care following AAHA guidelines enables earlier detection of breed-related conditions.',
      'Routine veterinary screenings catch many breed-related conditions at stages where intervention is most effective.',
      'A proactive veterinary schedule tailored to life stage and breed risks is the most cost-effective approach to managing breed-linked health issues.',
    ]
  },
  {
    pattern: /Being proactive about your [^']{3,60}'s care can prevent many common problems\./g,
    replacements: [
      'A proactive approach to breed-specific care prevents many issues before they become serious.',
      'Prevention-focused care tailored to breed characteristics reduces both health risks and long-term costs.',
      'Anticipating breed-related needs before problems arise is the hallmark of informed pet ownership.',
    ]
  },
  {
    pattern: /Beyond the basics, [^.]{3,60} owners should be aware of the unique aspects of this breed\./g,
    replacements: [
      'Several breed-specific considerations deserve attention beyond routine care protocols.',
      'Informed ownership goes deeper than the basic care checklist for any breed.',
      'The details that distinguish this breed from similar breeds matter for long-term health and wellbeing.',
    ]
  },
];

// Process all HTML files in guides and breeds
console.log('=== Final Template Cleanup (Fourth Pass) ===');
let fixedCount = 0;

function processDir(dir) {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.git', '.netlify'].includes(entry.name)) {
      processDir(fullPath);
    } else if (entry.name.endsWith('.html')) {
      let html = readFileSync(fullPath, 'utf8');
      const slug = entry.name.replace('.html', '');
      const original = html;
      const h = hashStr(slug);

      for (const tp of templatePatterns) {
        let matchIndex = 0;
        html = html.replace(tp.pattern, () => {
          const replacement = tp.replacements[(h + matchIndex) % tp.replacements.length];
          matchIndex++;
          return replacement;
        });
      }

      if (html !== original) {
        writeFileSync(fullPath, html);
        fixedCount++;
      }
    }
  }
}

processDir(join(ROOT, 'guides'));
processDir(join(ROOT, 'breeds'));
processDir(join(ROOT, 'locations'));

console.log(`Fixed ${fixedCount} files`);
console.log('=== Done ===');
