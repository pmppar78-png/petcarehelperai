import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, basename } from 'path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');

/**
 * Recursively collect all .html files under a directory.
 */
function collectHtmlFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath, { throwIfNoEntry: false });
    if (!stat) continue;
    if (stat.isDirectory()) {
      results.push(...collectHtmlFiles(fullPath));
    } else if (entry.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Extract the text content of the first <title> tag from an HTML string.
 */
function extractTitle(html) {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/is);
  if (!match) return null;
  // Decode common HTML entities
  return match[1]
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Clean the title by removing common suffixes like "- Pet Care Helper AI" or "| Pet Care Helper AI".
 */
function cleanTitle(rawTitle) {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/\s*[-|]\s*Pet Care Helper AI$/i, '')
    .trim();
}

/**
 * Derive the category from a file path relative to ROOT.
 */
function deriveCategory(filePath) {
  const rel = filePath.slice(ROOT.length + 1); // e.g. "breeds/dogs/french-bulldog.html"
  const parts = rel.split('/');

  // breeds/<category>/file.html
  if (parts[0] === 'breeds' && parts.length >= 3) {
    return parts[1]; // dogs, cats, birds, fish, reptiles, small-animals
  }

  // breeds/dog-breeds.html (index pages inside breeds/)
  if (parts[0] === 'breeds' && parts.length === 2) {
    // Derive category from filename: dog-breeds -> dogs, cat-breeds -> cats, etc.
    const slug = parts[1].replace('.html', '');
    if (slug.includes('dog')) return 'dogs';
    if (slug.includes('cat')) return 'cats';
    if (slug.includes('bird')) return 'birds';
    if (slug.includes('fish')) return 'fish';
    if (slug.includes('reptile')) return 'reptiles';
    if (slug.includes('small-animal')) return 'small-animals';
    return 'breeds';
  }

  // guides/
  if (parts[0] === 'guides') {
    return 'guides';
  }

  // Root-level category pages: dogs.html -> dogs, cats.html -> cats
  const rootSlug = parts[0].replace('.html', '');
  const categoryMap = {
    dogs: 'dogs',
    cats: 'cats',
    birds: 'birds',
    fish: 'fish',
    reptiles: 'reptiles',
    'small-animals': 'small-animals',
    guides: 'guides',
  };
  return categoryMap[rootSlug] || rootSlug;
}

/**
 * Build the URL path from the file path (relative to ROOT, without .html).
 */
function buildUrlPath(filePath) {
  const rel = filePath.slice(ROOT.length + 1); // e.g. "breeds/dogs/french-bulldog.html"
  const withoutExt = rel.replace(/\.html$/, '');
  return '/' + withoutExt;
}

/**
 * Build search keywords from the slug and category.
 */
function buildKeywords(filePath, category) {
  const slug = basename(filePath, '.html');
  const words = slug.replace(/-/g, ' ').toLowerCase();
  // Add the category as additional keyword context
  const cat = category.replace(/-/g, ' ').toLowerCase();
  return words + ' ' + cat;
}

// ----- Main -----

const index = [];

// 1. Scan all HTML files in breeds/ recursively
const breedFiles = collectHtmlFiles(join(ROOT, 'breeds'));

// 2. Scan all HTML files in guides/
const guideFiles = collectHtmlFiles(join(ROOT, 'guides'));

// 3. Root-level category pages
const rootCategoryPages = [
  'dogs.html',
  'cats.html',
  'birds.html',
  'fish.html',
  'reptiles.html',
  'small-animals.html',
  'guides.html',
].map(f => join(ROOT, f));

const allFiles = [...breedFiles, ...guideFiles, ...rootCategoryPages];

for (const filePath of allFiles) {
  let html;
  try {
    html = readFileSync(filePath, 'utf-8');
  } catch {
    continue; // skip files that can't be read
  }

  const rawTitle = extractTitle(html);
  if (!rawTitle) continue;

  const title = cleanTitle(rawTitle);
  const urlPath = buildUrlPath(filePath);
  const category = deriveCategory(filePath);
  const keywords = buildKeywords(filePath, category);

  index.push({
    t: title,
    u: urlPath,
    c: category,
    k: keywords,
  });
}

// Sort by category then title for deterministic output
index.sort((a, b) => a.c.localeCompare(b.c) || a.t.localeCompare(b.t));

const outPath = join(ROOT, 'search-index.json');
writeFileSync(outPath, JSON.stringify(index, null, 2), 'utf-8');

console.log(`Search index written to ${outPath}`);
console.log(`Total entries: ${index.length}`);
