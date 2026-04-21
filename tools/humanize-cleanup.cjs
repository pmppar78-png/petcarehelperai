#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const SCAN_DIRS = [
  path.join(ROOT, 'guides'),
  path.join(ROOT, 'locations'),
  path.join(ROOT, 'breeds'),
  path.join(ROOT, 'breeds/dogs'),
  path.join(ROOT, 'breeds/cats'),
  path.join(ROOT, 'breeds/birds'),
  path.join(ROOT, 'breeds/fish'),
  path.join(ROOT, 'breeds/marine-fish'),
  path.join(ROOT, 'breeds/reptiles'),
  path.join(ROOT, 'breeds/amphibians'),
  path.join(ROOT, 'breeds/small-animals'),
  path.join(ROOT, 'commercial/dogs'),
  path.join(ROOT, 'commercial/cats'),
  path.join(ROOT, 'commercial/birds'),
  path.join(ROOT, 'commercial/fish'),
  path.join(ROOT, 'commercial/marine-fish'),
  path.join(ROOT, 'commercial/reptiles'),
  path.join(ROOT, 'commercial/amphibians'),
  path.join(ROOT, 'commercial/small-animals'),
  ROOT,
];

// Whole-paragraph replacements eliminate repeated filler sentences that appear
// across thousands of generated pages. Each entry handles one of the four
// species-variant templates produced by the generator.
const PARAGRAPH_REPLACEMENTS = [
  // "Owners who bother to understand the their {pet} ..." (four species variants)
  {
    find: /Owners who bother to understand the their pet's natural tendencies usually build deeper trust with the animal too\./g,
    replace: "Owners who take time to learn their pet's actual tendencies — not some generic breed summary — tend to build deeper trust with the animal.",
  },
  {
    find: /Owners who bother to understand the their dog's natural tendencies usually build deeper trust with the animal too\./g,
    replace: "Owners who take time to learn their dog's actual tendencies — not a generic breed summary — tend to build deeper trust and avoid avoidable conflict.",
  },
  {
    find: /Owners who bother to understand the their cat's natural tendencies usually build deeper trust with the animal too\./g,
    replace: "Owners who take time to read their cat's actual cues — not a generic breed summary — tend to build a much more honest, two-way relationship.",
  },
  {
    find: /Owners who bother to understand the their bird's natural tendencies usually build deeper trust with the animal too\./g,
    replace: "Owners who take time to learn their bird's real signals — not a textbook description — tend to build noticeably more trust with the animal.",
  },
  // "bother to understand the their pet"-style shorter variants
  {
    find: /bother to understand the their pet's natural tendencies/g,
    replace: "take time to learn their pet's real tendencies",
  },
  {
    find: /bother to understand the their dog's natural tendencies/g,
    replace: "take time to learn their dog's real tendencies",
  },
  {
    find: /bother to understand the their cat's natural tendencies/g,
    replace: "take time to read their cat's real cues",
  },
  {
    find: /bother to understand the their bird's natural tendencies/g,
    replace: "take time to learn their bird's real signals",
  },
  {
    find: /bother to understand the their pet/g,
    replace: "take time to learn their pet",
  },
  // "A little curiosity about how the their X is wired ..." (species variants)
  {
    find: /A little curiosity about how the their pet is wired goes a long way toward preventing avoidable missteps\./g,
    replace: "A little curiosity about how your specific pet is actually wired goes a long way toward preventing avoidable missteps.",
  },
  {
    find: /A little curiosity about how the their dog is wired goes a long way toward preventing avoidable missteps\./g,
    replace: "A little curiosity about how your specific dog is actually wired goes a long way toward preventing avoidable missteps.",
  },
  {
    find: /A little curiosity about how the their cat is wired goes a long way toward preventing avoidable missteps\./g,
    replace: "A little curiosity about how your specific cat is actually wired goes a long way toward preventing avoidable missteps.",
  },
  {
    find: /A little curiosity about how the their bird is wired goes a long way toward preventing avoidable missteps\./g,
    replace: "A little curiosity about how your specific bird is actually wired goes a long way toward preventing avoidable missteps.",
  },
  // "Owners who study the their X closely ..." sentence
  {
    find: /Owners who study the their pet closely, not in the abstract but the pet in front of them, report better outcomes across the board\./g,
    replace: "Owners who watch the animal in front of them closely — not an average of the breed — consistently report better outcomes.",
  },
  {
    find: /Owners who study the their dog closely, not in the abstract but the pet in front of them, report better outcomes across the board\./g,
    replace: "Owners who watch the dog in front of them closely — not an average of the breed — consistently report better outcomes.",
  },
  {
    find: /Owners who study the their cat closely, not in the abstract but the pet in front of them, report better outcomes across the board\./g,
    replace: "Owners who watch the cat in front of them closely — not a breed-wide average — consistently report better outcomes.",
  },
  {
    find: /Owners who study the their bird closely, not in the abstract but the pet in front of them, report better outcomes across the board\./g,
    replace: "Owners who watch the bird in front of them closely — not a breed average — consistently report better outcomes.",
  },
  {
    find: /study the their pet closely, not in the abstract but the pet in front of them, report better outcomes across the board\./g,
    replace: "watch the animal in front of them closely — not a breed average — consistently report better outcomes.",
  },
  // "Owners who think of the their pet as a particular species rather than a generic pet ..."
  {
    find: /Owners who think of the their pet as a particular species rather than a generic pet tend to make better calls on everything that follows\./g,
    replace: "Owners who treat the pet as its own specific animal — rather than an abstract category — tend to make better calls on everything that follows.",
  },
  {
    find: /Owners who think of the their pet as a particular species rather than a generic pet/g,
    replace: "Owners who treat the pet as its own specific animal rather than a generic category",
  },
  // "Relating to the their X as its own species rather than as a placeholder pet ..."
  {
    find: /Relating to the their pet as its own species rather than as a placeholder pet changes the quality of every subsequent decision\./g,
    replace: "Treating the pet as a specific animal — with its own quirks — rather than a stand-in for the category noticeably changes the quality of every subsequent decision.",
  },
  {
    find: /Relating to the their dog as its own species rather than as a placeholder pet changes the quality of every subsequent decision\./g,
    replace: "Treating the dog as a specific animal — with its own quirks — rather than a stand-in for the breed noticeably changes the quality of every subsequent decision.",
  },
  {
    find: /Relating to the their cat as its own species rather than as a placeholder pet changes the quality of every subsequent decision\./g,
    replace: "Treating the cat as a specific animal — with its own quirks — rather than a stand-in for the breed noticeably changes the quality of every subsequent decision.",
  },
  {
    find: /Relating to the their pet as its own species rather than as a placeholder/g,
    replace: "Treating the pet as a specific animal rather than a stand-in for the category",
  },
  // "Treating the their pet as its own animal, not a generic pet, ..."
  {
    find: /Treating the their pet as its own animal, not a generic pet, tends to improve every subsequent decision\./g,
    replace: "Treating the pet as its own animal — not a stand-in for the category — tends to improve every decision that follows.",
  },
  // "study the their X" (short bigram catch-alls)
  {
    find: /study the their cat/g,
    replace: "observe the cat",
  },
  {
    find: /study the their dog/g,
    replace: "observe the dog",
  },
  {
    find: /study the their bird/g,
    replace: "observe the bird",
  },
  {
    find: /study the their pet/g,
    replace: "observe the pet",
  },
  // Partial fragment that sometimes appears after a comma.
  {
    find: /not a generic pet, tends to improve every subsequent decision\./g,
    replace: "not a stand-in for the category, tends to improve every decision that follows.",
  },
];

// Final cleanup for any remaining stray "the their" that slipped through —
// runs AFTER all specific paragraph replacements above.
const FALLBACK_REPLACEMENTS = [
  // Double-article bigrams: "the your dog" → "your dog", "a their cat" → "their cat".
  // Limited to pet-noun targets so we don't touch unrelated prose.
  { find: /\b(?:the|an?) your (dog|cat|pet|bird|fish|reptile|amphibian|puppy|kitten|breed|animal)\b/gi, replace: 'your $1' },
  { find: /\b(?:the|an?) their (dog|cat|pet|bird|fish|reptile|amphibian|puppy|kitten|breed|animal)\b/gi, replace: 'their $1' },
  { find: /\bthe their\b/g, replace: 'their' },
  { find: /\bthe your\b(?= [a-z])/g, replace: 'your' },
  // Sentence-initial double articles like "A your dog ..." → "Your dog ..."
  { find: /([.!?]\s+)A your\b/g, replace: '$1Your' },
  { find: /(>\s*)A your\b/g, replace: '$1Your' },
  { find: /\bA your\b/g, replace: 'Your' },
  { find: /\ba your\b/g, replace: 'your' },
  { find: /\bA their\b/g, replace: 'Their' },
  { find: /\ba their\b/g, replace: 'their' },
  // Stitched colons on symptom pages: "Options may include: <filler sentence>" → "Options may include:"
  { find: /(Options may include): [A-Z][^<]*?(<\/p>)/g, replace: '$1:$2' },
  { find: /(Common feeding errors that [A-Za-z ]+ owners make include): [A-Z][^<]*?(<\/p>)/g, replace: '$1:$2' },
  { find: /(Signs to watch for include): [A-Z][^<]*?(<\/p>)/g, replace: '$1:$2' },
  { find: /(Common causes include): [A-Z][^<]*?(<\/p>)/g, replace: '$1:$2' },
];

function listHtmlFiles() {
  const files = [];
  for (const dir of SCAN_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const stat = fs.statSync(dir);
    if (!stat.isDirectory()) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith('.html')) continue;
      files.push(path.join(dir, entry.name));
    }
  }
  return Array.from(new Set(files));
}

function processFile(filepath) {
  const original = fs.readFileSync(filepath, 'utf8');
  let current = original;
  let changes = 0;
  for (const rule of PARAGRAPH_REPLACEMENTS) {
    const before = current;
    current = current.replace(rule.find, rule.replace);
    if (before !== current) changes++;
  }
  for (const rule of FALLBACK_REPLACEMENTS) {
    const before = current;
    current = current.replace(rule.find, rule.replace);
    if (before !== current) changes++;
  }
  if (current !== original) {
    fs.writeFileSync(filepath, current);
    return changes;
  }
  return 0;
}

function main() {
  const files = listHtmlFiles();
  let touched = 0;
  let totalChanges = 0;
  for (const f of files) {
    const changes = processFile(f);
    if (changes > 0) {
      touched++;
      totalChanges += changes;
    }
  }
  console.log(`Scanned ${files.length} files. Rewrote ${touched} files with ${totalChanges} rule matches.`);
}

main();
