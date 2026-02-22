#!/usr/bin/env node
/**
 * PetCareHelperAI — Cross-Species Cleanup (Second Pass)
 *
 * Fixes remaining cross-species contamination that the first pass missed
 * due to imprecise page-type detection.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');

// ============================================================
// IMPROVED CAT PAGE DETECTION
// ============================================================
function isCatPage(filePath, html) {
  const slug = filePath.split('/').pop().replace('.html', '');
  // Check for explicit cat breed names in slug
  const catBreedSlugs = [
    'persian', 'maine-coon', 'ragdoll', 'british-shorthair', 'siamese', 'bengal',
    'abyssinian', 'scottish-fold', 'sphynx', 'russian-blue', 'birman',
    'oriental-shorthair', 'devon-rex', 'norwegian-forest-cat', 'burmese',
    'exotic-shorthair', 'tonkinese', 'american-shorthair', 'cornish-rex',
    'ragamuffin', 'somali', 'turkish-angora', 'balinese', 'chartreux',
    'singapura', 'manx', 'ocicat', 'japanese-bobtail', 'havana-brown', 'bombay',
    'american-bobtail', 'american-curl', 'american-wirehair',
  ];

  // Direct matches
  if (filePath.includes('/breeds/cats/')) return true;
  if (slug.endsWith('-cat')) return true;
  if (slug.includes('-cat-')) return true;
  if (slug.startsWith('cat-')) return true;

  // Check if slug contains a known cat breed name
  for (const breed of catBreedSlugs) {
    if (slug.includes(breed)) return true;
  }

  // Check HTML content for cat-specific breed names in the h1
  if (html.includes('Cat:') && html.includes('<h1>')) {
    const h1Match = html.match(/<h1>([^<]*)<\/h1>/);
    if (h1Match && h1Match[1].toLowerCase().includes('cat')) return true;
  }

  return false;
}

// ============================================================
// COMPREHENSIVE DOG-TO-CAT REPLACEMENTS
// ============================================================
const replacements = [
  // Behavioral terms
  { find: /dog sports like agility, flyball, or nosework/gi, replace: 'interactive activities such as puzzle feeders, wand toy sessions, or clicker training exercises' },
  { find: /destructive chewing or excessive barking/gi, replace: 'inappropriate scratching, excessive vocalization, or redirected aggression' },
  { find: /destructive chewing/gi, replace: 'destructive scratching' },
  { find: /excessive barking/gi, replace: 'excessive vocalization' },
  { find: /barking are common/gi, replace: 'vocalization issues are common' },
  { find: /individual dog/gi, replace: 'individual cat' },
  { find: /your dog/gi, replace: 'your cat' },
  { find: /the dog/gi, replace: 'the cat' },
  { find: /a dog/gi, replace: 'a cat' },

  // Affiliate links: dog training → cat-appropriate
  { find: /Calm Canine Academy<\/a>\s*[-–—]\s*Specialized training for reactive and anxious dogs/gi, replace: 'Jackson Galaxy<\/a> — Cat behavior and enrichment guidance from a leading feline behaviorist' },
  { find: /SpiritDog Training<\/a>\s*[-–—]\s*Online dog training courses with lifetime access and expert guidance/gi, replace: 'Cats Naturally<\/a> — Natural health and behavior resources for cat owners' },
  { find: /K9 Training Institute<\/a>\s*[-–—]\s*Professional dog training programs with proven methods for all breeds/gi, replace: 'Cat School<\/a> — Positive reinforcement-based cat training courses and techniques' },
  { find: /Pupford<\/a>\s*[-–—]\s*Positive reinforcement training courses, treats, and resources for dogs/gi, replace: 'Feliway<\/a> — Pheromone-based calming solutions for cats' },
  { find: /Brain Training for Dogs<\/a>\s*[-–—]\s*Science-based brain games and mental stimulation training for dogs/gi, replace: 'Cat School<\/a> — Clicker training and enrichment programs designed specifically for cats' },
  { find: /Dunbar Academy<\/a>\s*[-–—]\s*World-renowned dog training programs from Dr\. Ian Dunbar/gi, replace: 'International Cat Care<\/a> — Evidence-based feline welfare and behavior guidance' },
  { find: /GoodPup<\/a>\s*[-–—]\s*1-on-1 virtual dog training with certified professional trainers/gi, replace: 'Cat Behavior Associates<\/a> — Virtual feline behavior consultations with certified experts' },

  // Affiliate URL fixes
  { find: /https:\/\/www\.calmcanineacademy\.com/gi, replace: 'https://www.jacksongalaxy.com' },
  { find: /https:\/\/spiritdogtraining\.com/gi, replace: 'https://catsnaturally.com' },
  { find: /https:\/\/k9traininginstitute\.com/gi, replace: 'https://www.catschool.co' },
  { find: /https:\/\/pupford\.com/gi, replace: 'https://www.feliway.com' },
  { find: /https:\/\/braintrainingfordogs\.com/gi, replace: 'https://www.catschool.co' },
  { find: /https:\/\/www\.dunbaracademy\.com/gi, replace: 'https://icatcare.org' },
  { find: /https:\/\/www\.goodpup\.com/gi, replace: 'https://catbehaviorassociates.com' },

  // Food-related
  { find: /Ollie<\/a>\s*[-–—]\s*Custom fresh dog food[^<]*/gi, replace: 'Smalls<\/a> — Fresh, human-grade cat food delivered to your door' },
  { find: /PetPlate<\/a>\s*[-–—]\s*Vet-designed, human-grade meals cooked fresh and portioned for your dog[^<]*/gi, replace: 'Nom Nom<\/a> — Veterinarian-formulated fresh cat food with personalized portions' },
  { find: /https:\/\/myollie\.com/gi, replace: 'https://www.smalls.com' },
  { find: /https:\/\/www\.petplate\.com/gi, replace: 'https://www.nomnomnow.com' },

  // Exercise terms
  { find: /daily walks/gi, replace: 'daily play sessions' },
  { find: /walk your cat/gi, replace: 'engage your cat in active play' },
  { find: /dog park/gi, replace: 'enrichment area' },

  // "Puppy" in vet tables for cats
  { find: /Puppy \(0-1 year\)/g, replace: 'Kitten (0-1 year)' },
  { find: /Young \(0-1 year\)/g, replace: 'Kitten (0-1 year)' },
];

// ============================================================
// SAFE REPLACEMENT — avoid replacing in navigation, footer, etc.
// ============================================================
function safeReplaceCatPage(html) {
  // Split into article content and everything else
  const articleStart = html.indexOf('<article');
  const articleEnd = html.indexOf('</article>');

  if (articleStart === -1 || articleEnd === -1) {
    // No article tag, apply to full content but be careful
    return applyReplacements(html);
  }

  const before = html.substring(0, articleStart);
  let article = html.substring(articleStart, articleEnd + '</article>'.length);
  const after = html.substring(articleEnd + '</article>'.length);

  article = applyReplacements(article);

  return before + article + after;
}

function applyReplacements(html) {
  for (const r of replacements) {
    html = html.replace(r.find, r.replace);
  }
  return html;
}

// ============================================================
// EXECUTION
// ============================================================
console.log('=== Cross-Species Cleanup (Second Pass) ===');

const stats = { totalChecked: 0, fixed: 0 };

// Process all guide files
const guideDir = join(ROOT, 'guides');
const guideFiles = readdirSync(guideDir).filter(f => f.endsWith('.html'));

for (const file of guideFiles) {
  const filePath = join(guideDir, file);
  let html = readFileSync(filePath, 'utf8');

  if (!isCatPage(filePath, html)) {
    stats.totalChecked++;
    continue;
  }

  const original = html;
  html = safeReplaceCatPage(html);

  if (html !== original) {
    writeFileSync(filePath, html);
    stats.fixed++;
  }
  stats.totalChecked++;
}

// Process cat breed pages too
const catBreedDir = join(ROOT, 'breeds', 'cats');
if (existsSync(catBreedDir)) {
  const catFiles = readdirSync(catBreedDir).filter(f => f.endsWith('.html'));
  for (const file of catFiles) {
    const filePath = join(catBreedDir, file);
    let html = readFileSync(filePath, 'utf8');
    const original = html;
    html = safeReplaceCatPage(html);
    if (html !== original) {
      writeFileSync(filePath, html);
      stats.fixed++;
    }
    stats.totalChecked++;
  }
}

console.log(`Checked: ${stats.totalChecked} files`);
console.log(`Fixed: ${stats.fixed} files`);
console.log('=== Cleanup Complete ===');
