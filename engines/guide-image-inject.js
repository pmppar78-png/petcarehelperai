#!/usr/bin/env node
/**
 * PetCareHelperAI — Guide Image Injection Engine
 *
 * Adds breed-specific hero images to guide pages that reference specific animals.
 * Reads image URLs from existing breed pages and injects them into matching guides.
 *
 * Usage: node engines/guide-image-inject.js
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE_DIR = join(__dirname, '..');

// ============================================================
// STEP 1: Build breed image map from existing breed pages
// ============================================================

function buildBreedImageMap() {
  const categories = ['dogs', 'cats', 'fish', 'marine-fish', 'reptiles', 'birds', 'small-animals', 'amphibians'];
  const imageMap = {}; // slug → { imageUrl, breedName, category }

  for (const cat of categories) {
    const dir = join(BASE_DIR, 'breeds', cat);
    if (!existsSync(dir)) continue;

    const files = readdirSync(dir).filter(f => f.endsWith('.html'));
    for (const file of files) {
      const slug = file.replace('.html', '');
      const filePath = join(dir, file);

      try {
        const html = readFileSync(filePath, 'utf8');

        // Extract image URL from breed-hero-image
        const imgMatch = html.match(/<img\s+src="([^"]+)"[^>]*class="breed-hero-image"/);
        if (!imgMatch) continue;

        const imageUrl = imgMatch[1];

        // Skip if it's a category fallback image
        if (imageUrl.includes('YellowLabradorLooking_new') ||
            imageUrl.includes('Cat03.jpg') ||
            imageUrl.includes('Neon_tetra_inn_aquarium') ||
            imageUrl.includes('Budgerigars_in_Aviary') ||
            imageUrl.includes('Cavia_porcellus-short_haired_tabby')) {
          continue;
        }

        // Extract breed name from h1
        const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
        const breedName = h1Match
          ? h1Match[1].replace(/<[^>]+>/g, '').replace(/:\s*Complete.*$/i, '').trim()
          : slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        imageMap[slug] = { imageUrl, breedName, category: cat };
      } catch {
        // Skip unreadable files
      }
    }
  }

  return imageMap;
}

// ============================================================
// STEP 2: Map guide filenames to breed slugs
// ============================================================

function matchGuideToBreed(guideSlug, imageMap) {
  const allSlugs = Object.keys(imageMap).sort((a, b) => b.length - a.length); // Longest first

  // First pass: direct match
  for (const breedSlug of allSlugs) {
    if (guideSlug.includes(breedSlug)) {
      const idx = guideSlug.indexOf(breedSlug);
      const before = idx === 0 ? '' : guideSlug[idx - 1];
      const after = idx + breedSlug.length >= guideSlug.length ? '' : guideSlug[idx + breedSlug.length];

      if ((before === '' || before === '-') && (after === '' || after === '-')) {
        return breedSlug;
      }
    }
  }

  // Second pass: handle plural forms (e.g., "labrador-retrievers" → "labrador-retriever")
  // Strip common plural suffixes from guide slug segments and retry
  const depluralized = guideSlug
    .replace(/([a-z])s-/g, '$1-')   // e.g., "retrievers-" → "retriever-"
    .replace(/([a-z])s$/g, '$1')    // trailing plural
    .replace(/([a-z])es-/g, '$1-')  // e.g., "frises-" → "frise-"
    .replace(/([a-z])es$/g, '$1');  // trailing -es plural

  if (depluralized !== guideSlug) {
    for (const breedSlug of allSlugs) {
      if (depluralized.includes(breedSlug)) {
        const idx = depluralized.indexOf(breedSlug);
        const before = idx === 0 ? '' : depluralized[idx - 1];
        const after = idx + breedSlug.length >= depluralized.length ? '' : depluralized[idx + breedSlug.length];

        if ((before === '' || before === '-') && (after === '' || after === '-')) {
          return breedSlug;
        }
      }
    }
  }

  // Third pass: special known aliases
  const aliases = {
    'husky': 'siberian-husky',
    'labrador': 'labrador-retriever',
    'lab': 'labrador-retriever',
    'golden': 'golden-retriever',
    'pit-bull': 'american-pit-bull-terrier',
    'pitbull': 'american-pit-bull-terrier',
    'german-shepherd-dog': 'german-shepherd',
    'english-mastiff': 'mastiff',
    'miniature-american-shepherd': 'australian-shepherd',
    'budgie': 'budgerigar',
    'corgi': 'pembroke-welsh-corgi',
    'doberman': 'doberman-pinscher',
    'guinea-pig': 'american-guinea-pig',
    'hamster': 'syrian-hamster',
    'scorpion': 'emperor-scorpion',
    'shrimp-keeping': 'cherry-shrimp',
    'tortoise-care': 'russian-tortoise',
    'turtle-care': 'red-eared-slider',
    'rabbit-care': 'holland-lop',
  };

  for (const [alias, breedSlug] of Object.entries(aliases)) {
    if (guideSlug.includes(alias) && imageMap[breedSlug]) {
      const idx = guideSlug.indexOf(alias);
      const before = idx === 0 ? '' : guideSlug[idx - 1];
      const after = idx + alias.length >= guideSlug.length ? '' : guideSlug[idx + alias.length];

      if ((before === '' || before === '-') && (after === '' || after === '-')) {
        return breedSlug;
      }
    }
  }

  return null;
}

// ============================================================
// STEP 3: Inject image into guide HTML
// ============================================================

function injectImageIntoGuide(html, imageUrl, breedName) {
  // Don't inject if guide already has a breed-hero-image
  if (html.includes('breed-hero-image') || html.includes('guide-hero-image')) {
    return null;
  }

  // Don't inject if there's already an <img> tag in the article
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
  if (articleMatch && articleMatch[1].includes('<img ')) {
    return null;
  }

  const escapedBreed = breedName.replace(/"/g, '&quot;').replace(/&(?!amp;|quot;|lt;|gt;|#)/g, '&amp;');
  const imageTag = `\n      <div class="breed-image-container" style="text-align:center;margin:20px 0;">
<img src="${imageUrl}"
     alt="${escapedBreed} - professional photograph"
     class="guide-hero-image breed-hero-image"
     loading="lazy"
     width="800" height="600"
     style="max-width:100%;height:auto;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1);aspect-ratio:4/3;object-fit:cover;">
</div>`;

  // Strategy: Insert after the first <p> following <h1>, before the first <h2>
  // Pattern: </h1> ... <p>...</p> [INSERT HERE] ... <h2>
  const h1CloseIdx = html.indexOf('</h1>');
  if (h1CloseIdx === -1) return null;

  // Find the first <h2> after h1
  const h2Idx = html.indexOf('<h2>', h1CloseIdx);
  if (h2Idx === -1) return null;

  // Find the last </p> before the first <h2>
  const between = html.substring(h1CloseIdx, h2Idx);
  const lastPIdx = between.lastIndexOf('</p>');

  if (lastPIdx !== -1) {
    const insertPos = h1CloseIdx + lastPIdx + 4; // After </p>
    return html.substring(0, insertPos) + imageTag + html.substring(insertPos);
  }

  // Fallback: insert right before <h2>
  return html.substring(0, h2Idx) + imageTag + '\n      ' + html.substring(h2Idx);
}

// ============================================================
// STEP 4: Update og:image meta tags
// ============================================================

function updateGuideOgImage(html, imageUrl) {
  // Replace generic logo og:image with breed-specific image
  if (html.includes('og:image')) {
    return html.replace(
      /<meta property="og:image" content="[^"]*"\s*\/?>/,
      `<meta property="og:image" content="${imageUrl}" />`
    );
  }
  // Add og:image if missing
  if (html.includes('og:site_name')) {
    return html.replace(
      /(<meta property="og:site_name" content="[^"]*"\s*\/?>)/,
      `$1\n  <meta property="og:image" content="${imageUrl}" />`
    );
  }
  return html;
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log('=== Guide Image Injection Engine ===');
  console.log('');

  // Step 1: Build image map from breed pages
  console.log('Step 1: Building breed image map...');
  const imageMap = buildBreedImageMap();
  console.log(`  Found ${Object.keys(imageMap).length} breeds with images`);

  // Step 2: Collect guide files
  console.log('Step 2: Collecting guide files...');
  const guidesDir = join(BASE_DIR, 'guides');
  if (!existsSync(guidesDir)) {
    console.log('  No guides directory found.');
    return;
  }

  const guideFiles = readdirSync(guidesDir).filter(f => f.endsWith('.html'));
  console.log(`  Found ${guideFiles.length} guide files`);

  // Step 3: Process guides
  console.log('Step 3: Injecting breed images into guides...');
  let matched = 0;
  let injected = 0;
  let alreadyHasImage = 0;
  let noMatch = 0;
  let errors = 0;

  for (const file of guideFiles) {
    const guideSlug = file.replace('.html', '');
    const breedSlug = matchGuideToBreed(guideSlug, imageMap);

    if (!breedSlug) {
      noMatch++;
      continue;
    }

    matched++;
    const breed = imageMap[breedSlug];
    const filePath = join(guidesDir, file);

    try {
      let html = readFileSync(filePath, 'utf8');

      // Inject image
      const modified = injectImageIntoGuide(html, breed.imageUrl, breed.breedName);
      if (modified === null) {
        alreadyHasImage++;
        continue;
      }

      // Update og:image
      const final = updateGuideOgImage(modified, breed.imageUrl);

      writeFileSync(filePath, final, 'utf8');
      injected++;
    } catch (err) {
      errors++;
    }
  }

  console.log('');
  console.log('=== Results ===');
  console.log(`  Total guides: ${guideFiles.length}`);
  console.log(`  Matched to breed: ${matched}`);
  console.log(`  Images injected: ${injected}`);
  console.log(`  Already had image: ${alreadyHasImage}`);
  console.log(`  No breed match: ${noMatch}`);
  console.log(`  Errors: ${errors}`);
  console.log('');
  console.log('Guide image injection complete.');
}

main();
