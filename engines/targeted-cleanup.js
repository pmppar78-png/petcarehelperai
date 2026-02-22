#!/usr/bin/env node
/**
 * PetCareHelperAI — Targeted Final Cleanup (Fifth Pass)
 * Handles St. Bernard (period in name) and generic topic guide pages
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

const patterns = [
  {
    // Ultra permissive: match anything before "is unique, but breed tendencies"
    pattern: /Every .+? is unique, but breed tendencies give us a reliable framework for understanding their needs\./g,
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
    pattern: /Beyond the basics, .+? owners should be aware of the unique aspects of this breed\./g,
    replacements: [
      'Several breed-specific considerations deserve attention beyond routine care protocols.',
      'Informed ownership goes deeper than the basic care checklist for any breed.',
      'The details that distinguish this breed from similar breeds matter for long-term health and wellbeing.',
    ]
  },
  {
    pattern: /With proper care and attention to their breed-specific needs, your .+? can live a long, healthy, and happy life of [0-9-]+ yrs\./g,
    replacements: [
      'Attentive, breed-informed care is the strongest predictor of a fulfilling lifespan.',
      'Proactive health management based on breed knowledge significantly contributes to quality of life and longevity.',
      'Owners who understand breed-specific risks and act on them give their pets the best chance at a full, healthy life.',
    ]
  },
  {
    pattern: /Establishing a consistent daily routine helps your .+? feel secure and reduces stress-related behavioral problems\./g,
    replacements: [
      'Consistent daily structure — including predictable meal times, exercise, and rest periods — reduces anxiety and supports behavioral stability.',
      'A stable daily routine serves as the foundation for behavioral wellness, reducing reactivity and stress responses.',
      'Routine and predictability are powerful tools for managing stress and preventing behavioral issues.',
    ]
  },
  {
    pattern: /Being proactive about your .+?'s care can prevent many common problems\./g,
    replacements: [
      'A proactive approach to breed-specific care prevents many issues before they become serious.',
      'Prevention-focused care tailored to breed characteristics reduces both health risks and long-term costs.',
      'Anticipating breed-related needs before problems arise is the hallmark of informed pet ownership.',
    ]
  },
  {
    // For non-breed topic guides
    pattern: /This guide covers everything you need to know\./g,
    replacements: [
      'The following sections provide practical, evidence-based guidance.',
      'Below, we cover the key information you need.',
      'Here\'s what current veterinary guidance recommends.',
      'The information below draws on established veterinary and care standards.',
    ]
  },
];

console.log('=== Targeted Final Cleanup (Fifth Pass) ===');
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

      for (const tp of patterns) {
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

console.log(`Fixed ${fixedCount} files`);
console.log('=== Done ===');
