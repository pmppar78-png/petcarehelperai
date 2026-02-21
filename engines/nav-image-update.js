#!/usr/bin/env node
/**
 * PetCareHelperAI — Navigation & Breed Image Update Engine
 *
 * 1. Updates navigation across ALL existing pages to include Amphibians, Marine Fish, Small Animals
 * 2. Replaces emoji placeholders on breed pages with Unsplash hero images
 * 3. Adds footer nav links for new categories
 *
 * Usage: node engines/nav-image-update.js
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE_DIR = join(__dirname, '..');

// ============================================================
// CONFIGURATION
// ============================================================

const BATCH_SIZE = 50;

const OLD_SUBTITLE = 'Dogs &bull; Cats &bull; Birds &bull; Reptiles &bull; Fish';
const NEW_SUBTITLE = 'Dogs &bull; Cats &bull; Birds &bull; Reptiles &bull; Amphibians &bull; Fish';

// Also handle the small-animals variant subtitle
const OLD_SUBTITLE_SMALL = 'Dogs &bull; Cats &bull; Birds &bull; Reptiles &bull; Fish &bull; Small Pets';
const NEW_SUBTITLE_SMALL = 'Dogs &bull; Cats &bull; Birds &bull; Reptiles &bull; Amphibians &bull; Fish';

// New nav menu items to insert (the full replacement list)
const NEW_NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/chat', label: 'AI Pet Help' },
  { href: '/dogs', label: 'Dogs' },
  { href: '/cats', label: 'Cats' },
  { href: '/birds', label: 'Birds' },
  { href: '/reptiles', label: 'Reptiles' },
  { href: '/amphibians', label: 'Amphibians' },
  { href: '/fish', label: 'Fish' },
  { href: '/marine-fish', label: 'Marine Fish' },
  { href: '/small-animals', label: 'Small Animals' },
  { href: '/guides', label: 'Guides' },
];

// Category suffix mapping for Unsplash search terms
const CATEGORY_SUFFIX_MAP = {
  dogs: 'dog',
  cats: 'cat',
  birds: 'bird',
  reptiles: 'reptile',
  fish: 'aquarium',
  'small-animals': 'pet',
};

// ============================================================
// UTILITY: Collect HTML files from directories
// ============================================================

function collectHtmlFiles(dir) {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir)
      .filter(f => f.endsWith('.html'))
      .map(f => join(dir, f));
  } catch {
    return [];
  }
}

function collectHtmlFilesRecursive(dir) {
  if (!existsSync(dir)) return [];
  const results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectHtmlFilesRecursive(fullPath));
      } else if (entry.name.endsWith('.html')) {
        results.push(fullPath);
      }
    }
  } catch {
    // skip unreadable dirs
  }
  return results;
}

// ============================================================
// STEP 1: Build the full file list
// ============================================================

function gatherAllFiles() {
  const files = new Set();

  // Root-level HTML files
  const rootFiles = collectHtmlFiles(BASE_DIR);
  rootFiles.forEach(f => files.add(f));
  console.log(`  Root level: ${rootFiles.length} files`);

  // breeds/**/*.html (recursive — includes breeds/*.html and breeds/dogs/*.html etc.)
  const breedFiles = collectHtmlFilesRecursive(join(BASE_DIR, 'breeds'));
  breedFiles.forEach(f => files.add(f));
  console.log(`  Breeds (recursive): ${breedFiles.length} files`);

  // guides/*.html (first 100 only for performance)
  const guideFiles = collectHtmlFiles(join(BASE_DIR, 'guides')).slice(0, 100);
  guideFiles.forEach(f => files.add(f));
  console.log(`  Guides (capped at 100): ${guideFiles.length} files`);

  // locations/*.html (first 50 only)
  const locationFiles = collectHtmlFiles(join(BASE_DIR, 'locations')).slice(0, 50);
  locationFiles.forEach(f => files.add(f));
  console.log(`  Locations (capped at 50): ${locationFiles.length} files`);

  // tools/*.html
  const toolFiles = collectHtmlFiles(join(BASE_DIR, 'tools'));
  toolFiles.forEach(f => files.add(f));
  console.log(`  Tools: ${toolFiles.length} files`);

  return Array.from(files);
}

// ============================================================
// STEP 2: Navigation update logic
// ============================================================

/**
 * Determine which nav link should be marked active based on file path.
 * Returns the href that should get class="nav-link active", or null.
 */
function detectActiveLink(filePath) {
  const rel = filePath.replace(BASE_DIR, '').replace(/\\/g, '/');

  // Root pages
  if (rel === '/index.html') return '/';
  if (rel === '/chat.html') return '/chat';
  if (rel === '/dogs.html' || rel.startsWith('/breeds/dogs/') || rel === '/breeds/dog-breeds.html') return '/dogs';
  if (rel === '/cats.html' || rel.startsWith('/breeds/cats/') || rel === '/breeds/cat-breeds.html') return '/cats';
  if (rel === '/birds.html' || rel.startsWith('/breeds/birds/') || rel === '/breeds/bird-breeds.html') return '/birds';
  if (rel === '/reptiles.html' || rel.startsWith('/breeds/reptiles/') || rel === '/breeds/reptile-breeds.html') return '/reptiles';
  if (rel === '/fish.html' || rel.startsWith('/breeds/fish/') || rel === '/breeds/fish-breeds.html') return '/fish';
  if (rel === '/small-animals.html' || rel.startsWith('/breeds/small-animals/') || rel === '/breeds/small-animal-breeds.html') return '/small-animals';
  if (rel === '/guides.html' || rel.startsWith('/guides/')) return '/guides';

  // Amphibians / Marine Fish (future pages)
  if (rel.startsWith('/amphibians')) return '/amphibians';
  if (rel.startsWith('/marine-fish')) return '/marine-fish';

  return null;
}

/**
 * Build the new <ul class="nav-menu"> block with the correct active link.
 */
function buildNavMenuHtml(activeHref) {
  const lines = ['<ul class="nav-menu">'];
  for (const item of NEW_NAV_ITEMS) {
    const cls = (activeHref && item.href === activeHref) ? 'nav-link active' : 'nav-link';
    lines.push(`        <li><a href="${item.href}" class="${cls}">${item.label}</a></li>`);
  }
  lines.push('      </ul>');
  return lines.join('\n');
}

/**
 * Replace the old simple nav-menu <ul> block with the new one.
 * Matches the pattern:
 *   <ul class="nav-menu">
 *     <li>...</li>  (multiple)
 *   </ul>
 * Only matches the simple flat nav (not the dropdown variant on index.html).
 */
function replaceNavMenu(html, filePath) {
  // Pattern: <ul class="nav-menu"> followed by simple <li> items and </ul>
  // We need to match only the simple nav pattern (no nested <ul> inside)
  const navMenuRegex = /<ul class="nav-menu">\s*\n([\s]*<li><a href="[^"]*" class="nav-link[^"]*">[^<]*<\/a><\/li>\s*\n)+[\s]*<\/ul>/g;

  const activeHref = detectActiveLink(filePath);
  const newNav = buildNavMenuHtml(activeHref);

  const replaced = html.replace(navMenuRegex, newNav);
  return replaced;
}

/**
 * Update subtitle text in header.
 */
function replaceSubtitle(html) {
  // Replace the small-animals variant first (more specific)
  let updated = html.replace(OLD_SUBTITLE_SMALL, NEW_SUBTITLE);
  // Then replace the standard variant
  updated = updated.replace(OLD_SUBTITLE, NEW_SUBTITLE);
  return updated;
}

// ============================================================
// STEP 3: Footer nav update logic
// ============================================================

/**
 * Add Amphibians and Marine Fish links before the Resources link in the footer nav.
 * Pattern: <a href="/resources">Resources</a>
 * This is for the inline footer-nav pattern (not the grid footer on index.html).
 */
function updateFooterNav(html) {
  // Only apply to the inline footer-nav pattern
  const footerResourcePattern = '<a href="/resources">Resources</a>';

  if (!html.includes(footerResourcePattern)) return html;
  if (html.includes('<a href="/amphibians">Amphibians</a>')) return html; // already updated

  const replacement =
    '<a href="/amphibians">Amphibians</a> &middot;\n      <a href="/marine-fish">Marine Fish</a> &middot;\n      <a href="/resources">Resources</a>';

  return html.replace(footerResourcePattern, replacement);
}

// ============================================================
// STEP 4: Breed image replacement logic
// ============================================================

const EMOJI_PLACEHOLDER = '<div class="breed-image-placeholder" aria-hidden="true">&#x1f43e;</div>';

/**
 * Extract the species category from the file path.
 * e.g., /opt/build/repo/breeds/dogs/golden-retriever.html → "dogs"
 */
function getCategoryFromPath(filePath) {
  const rel = filePath.replace(BASE_DIR, '').replace(/\\/g, '/');
  // Pattern: /breeds/{category}/{slug}.html
  const match = rel.match(/\/breeds\/([^/]+)\/[^/]+\.html$/);
  return match ? match[1] : null;
}

/**
 * Extract the slug from the filename.
 * e.g., golden-retriever.html → "golden-retriever"
 */
function getSlugFromPath(filePath) {
  const filename = filePath.split('/').pop().replace('.html', '');
  return filename;
}

/**
 * Extract text from the first <h1> tag.
 */
function extractH1(html) {
  const match = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
  if (!match) return '';
  // Strip any HTML tags inside h1
  return match[1].replace(/<[^>]+>/g, '').trim();
}

/**
 * Build the Unsplash search term from slug and category.
 */
function buildSearchTerm(slug, category) {
  const slugWords = slug.replace(/-/g, '+');
  const suffix = CATEGORY_SUFFIX_MAP[category] || 'pet';
  return `${slugWords}+${suffix}`;
}

/**
 * Build the replacement image HTML.
 */
function buildImageHtml(searchTerm, altText) {
  return `<div class="breed-image-container" style="text-align:center;margin:20px 0;">
  <img src="https://source.unsplash.com/featured/800x600/?${searchTerm}"
       alt="${altText} - care guide photo"
       class="breed-hero-image"
       loading="lazy"
       width="800" height="600"
       style="max-width:100%;height:auto;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
</div>`;
}

/**
 * Replace emoji placeholder with Unsplash image on breed pages.
 */
function replaceBreedImage(html, filePath) {
  if (!html.includes(EMOJI_PLACEHOLDER)) return html;

  const category = getCategoryFromPath(filePath);
  if (!category) return html; // Not a breed sub-page

  const slug = getSlugFromPath(filePath);
  const h1Text = extractH1(html);
  const searchTerm = buildSearchTerm(slug, category);
  const altText = h1Text || slug.replace(/-/g, ' ');

  const imageHtml = buildImageHtml(searchTerm, altText);
  return html.replace(EMOJI_PLACEHOLDER, imageHtml);
}

// ============================================================
// STEP 5: Process all files
// ============================================================

function shouldSkip(html) {
  // Skip files that already have the updated nav (contain /amphibians in nav-menu)
  // Check for the amphibians nav link specifically within a nav-menu context
  if (html.includes('<a href="/amphibians" class="nav-link">Amphibians</a>')) {
    return true;
  }
  return false;
}

function processFile(filePath) {
  let html;
  try {
    html = readFileSync(filePath, 'utf8');
  } catch (err) {
    console.warn(`  WARN: Could not read ${filePath}: ${err.message}`);
    return { updated: false, skipped: false };
  }

  if (shouldSkip(html)) {
    return { updated: false, skipped: true };
  }

  let modified = html;

  // 1. Update subtitle
  modified = replaceSubtitle(modified);

  // 2. Replace nav menu (simple flat nav only)
  modified = replaceNavMenu(modified, filePath);

  // 3. Update footer nav
  modified = updateFooterNav(modified);

  // 4. Replace breed image placeholder (only for breeds/*/*.html)
  modified = replaceBreedImage(modified, filePath);

  if (modified !== html) {
    writeFileSync(filePath, modified, 'utf8');
    return { updated: true, skipped: false };
  }

  return { updated: false, skipped: false };
}

function processBatch(files, batchIndex, batchSize) {
  const start = batchIndex * batchSize;
  const end = Math.min(start + batchSize, files.length);
  const batch = files.slice(start, end);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const filePath of batch) {
    try {
      const result = processFile(filePath);
      if (result.updated) updated++;
      if (result.skipped) skipped++;
    } catch (err) {
      console.warn(`  ERROR processing ${filePath}: ${err.message}`);
      errors++;
    }
  }

  return { updated, skipped, errors, processed: batch.length };
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log('=== PetCareHelperAI Nav & Image Update Engine ===');
  console.log(`Base directory: ${BASE_DIR}`);
  console.log('');

  // Gather files
  console.log('Gathering HTML files...');
  const allFiles = gatherAllFiles();
  console.log(`Total files to process: ${allFiles.length}`);
  console.log('');

  // Process in batches
  const totalBatches = Math.ceil(allFiles.length / BATCH_SIZE);
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (let i = 0; i < totalBatches; i++) {
    const { updated, skipped, errors, processed } = processBatch(allFiles, i, BATCH_SIZE);
    totalUpdated += updated;
    totalSkipped += skipped;
    totalErrors += errors;

    const startIdx = i * BATCH_SIZE + 1;
    const endIdx = Math.min((i + 1) * BATCH_SIZE, allFiles.length);
    console.log(`  Batch ${i + 1}/${totalBatches} (files ${startIdx}-${endIdx}): ${updated} updated, ${skipped} skipped, ${errors} errors`);
  }

  console.log('');
  console.log('=== Summary ===');
  console.log(`  Total files scanned: ${allFiles.length}`);
  console.log(`  Files updated: ${totalUpdated}`);
  console.log(`  Files skipped (already updated): ${totalSkipped}`);
  console.log(`  Errors: ${totalErrors}`);
  console.log('');
  console.log('Nav & image update complete.');
}

main();
