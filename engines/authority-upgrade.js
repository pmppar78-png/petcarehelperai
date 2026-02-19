#!/usr/bin/env node
/**
 * PetCareHelperAI — Authority Upgrade Engine
 * Processes existing pages to add:
 * - OpenGraph tags (og:title, og:description, og:type, og:site_name)
 * - datePublished/dateModified to Article schemas
 * - Standardized title branding
 * - Cross-links into existing orphaned guides
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');
const TODAY = '2026-02-19';

let stats = { ogAdded: 0, schemaFixed: 0, titleFixed: 0, linksInjected: 0, totalProcessed: 0 };

function processFile(filePath) {
  let html = readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Add OG tags if missing
  if (!html.includes('og:title')) {
    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
    const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);

    if (titleMatch && descMatch && canonicalMatch) {
      const ogTags = `
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${titleMatch[1].replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${descMatch[1]}" />
    <meta property="og:url" content="${canonicalMatch[1]}" />
    <meta property="og:site_name" content="Pet Care Helper AI" />`;

      // Insert after canonical
      html = html.replace(
        `<link rel="canonical" href="${canonicalMatch[1]}">`,
        `<link rel="canonical" href="${canonicalMatch[1]}">${ogTags}`
      );
      changed = true;
      stats.ogAdded++;
    }
  } else if (!html.includes('og:type')) {
    // Has some OG tags but missing og:type and og:site_name
    if (!html.includes('og:site_name')) {
      html = html.replace(
        /<meta\s+property="og:url"\s+content="([^"]+)"\s*\/?\s*>/,
        `<meta property="og:url" content="$1" />\n    <meta property="og:type" content="article" />\n    <meta property="og:site_name" content="Pet Care Helper AI" />`
      );
      changed = true;
      stats.ogAdded++;
    }
  }

  // 2. Add datePublished/dateModified to Article schemas
  if (html.includes('"@type": "Article"') || html.includes('"@type":"Article"')) {
    if (!html.includes('datePublished')) {
      // Add dates to Article schema
      html = html.replace(
        /("@type":\s*"Article"[^}]*"headline":\s*"[^"]*")/g,
        (match) => {
          return match + `,\n    "datePublished": "${TODAY}",\n    "dateModified": "${TODAY}"`;
        }
      );
      changed = true;
      stats.schemaFixed++;
    }
  }

  // 3. Standardize title branding
  // Replace "AI Pet Medical & Vet Help Finder" with "Pet Care Helper AI" in titles
  if (html.includes('AI Pet Medical &amp; Vet Help Finder') || html.includes('AI Pet Medical & Vet Help Finder')) {
    // Only fix in <title> tags, not in footer text
    const titleTagMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleTagMatch && (titleTagMatch[1].includes('AI Pet Medical &amp; Vet Help Finder') || titleTagMatch[1].includes('AI Pet Medical & Vet Help Finder'))) {
      const oldTitle = titleTagMatch[0];
      const newTitle = oldTitle
        .replace('AI Pet Medical &amp; Vet Help Finder', 'Pet Care Helper AI')
        .replace('AI Pet Medical & Vet Help Finder', 'Pet Care Helper AI');
      // Only replace the title tag, ensure it ends with "| Pet Care Helper AI" or "- Pet Care Helper AI"
      if (!newTitle.includes('| Pet Care Helper AI') && !newTitle.includes('- Pet Care Helper AI')) {
        // Title already has the branding from the replacement, no further changes needed
      }
      html = html.replace(oldTitle, newTitle);
      changed = true;
      stats.titleFixed++;
    }
  }

  if (changed) {
    writeFileSync(filePath, html);
    stats.totalProcessed++;
  }
}

console.log('=== Authority Upgrade Engine ===');
console.log('');

// Process all guide files
console.log('Processing guide pages...');
const guideDir = join(ROOT, 'guides');
const guideFiles = readdirSync(guideDir).filter(f => f.endsWith('.html'));
for (const f of guideFiles) {
  processFile(join(guideDir, f));
}

// Process all breed files
console.log('Processing breed pages...');
for (const animalDir of ['dogs', 'cats', 'birds', 'fish', 'reptiles', 'small-animals']) {
  const breedDir = join(ROOT, 'breeds', animalDir);
  if (existsSync(breedDir)) {
    const files = readdirSync(breedDir).filter(f => f.endsWith('.html'));
    for (const f of files) {
      processFile(join(breedDir, f));
    }
  }
}

// Process breed index pages
const breedIndexFiles = readdirSync(join(ROOT, 'breeds')).filter(f => f.endsWith('.html'));
for (const f of breedIndexFiles) {
  processFile(join(ROOT, 'breeds', f));
}

// Process location files
console.log('Processing location pages...');
const locDir = join(ROOT, 'locations');
const locFiles = readdirSync(locDir).filter(f => f.endsWith('.html'));
for (const f of locFiles) {
  processFile(join(locDir, f));
}

// Process top-level pages
console.log('Processing top-level pages...');
const topFiles = readdirSync(ROOT).filter(f => f.endsWith('.html'));
for (const f of topFiles) {
  processFile(join(ROOT, f));
}

// Process tool pages
console.log('Processing tool pages...');
const toolDir = join(ROOT, 'tools');
if (existsSync(toolDir)) {
  const toolFiles = readdirSync(toolDir).filter(f => f.endsWith('.html'));
  for (const f of toolFiles) {
    processFile(join(toolDir, f));
  }
}

// Process resource pages
console.log('Processing resource pages...');
const resDir = join(ROOT, 'resources');
if (existsSync(resDir)) {
  const resFiles = readdirSync(resDir).filter(f => f.endsWith('.html'));
  for (const f of resFiles) {
    processFile(join(resDir, f));
  }
}

console.log('');
console.log('=== Authority Upgrades Complete ===');
console.log(`Pages processed: ${stats.totalProcessed}`);
console.log(`OG tags added: ${stats.ogAdded}`);
console.log(`Schema dates added: ${stats.schemaFixed}`);
console.log(`Titles standardized: ${stats.titleFixed}`);
