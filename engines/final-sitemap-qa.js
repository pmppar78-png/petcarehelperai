#!/usr/bin/env node
/**
 * final-sitemap-qa.js -- PetCareHelperAI Final Sitemap, Search Index, QA, Redirects & RSS Engine
 *
 * Tasks:
 *   1. Regenerate sitemap.xml from all HTML files
 *   2. Regenerate search-index.json
 *   3. Run QA checks and report
 *   4. Update netlify.toml with new redirect rules
 *   5. Update RSS feeds for new categories
 *
 * Run: node engines/final-sitemap-qa.js
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname, basename, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE_DIR = join(__dirname, '..');
const TODAY = '2026-02-21';
const SITE = 'https://petcarehelperai.com';
const EXCLUDE_DIRS = new Set(['node_modules', '.git', '.netlify', 'engines']);
const PUB_DATE = new Date(TODAY + 'T00:00:00Z').toUTCString();

// Category hubs at root level that get priority 1.0
const CATEGORY_HUBS = new Set([
  'dogs', 'cats', 'birds', 'reptiles', 'amphibians', 'fish',
  'marine-fish', 'small-animals', 'guides', 'chat'
]);

// Utility pages that get priority 0.5
const UTILITY_PAGES = new Set([
  'about', 'contact', 'faq', 'privacy-policy', 'terms-of-service',
  'medical-disclaimer', 'editorial-standards', 'partners', 'press-kit',
  'resources', 'affiliates'
]);

// ============================================================
// UTILITY HELPERS
// ============================================================

function collectHtmlFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      results.push(...collectHtmlFiles(fullPath));
    } else if (entry.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return '';
  return m[1]
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function cleanTitle(rawTitle) {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/\s*[-|]\s*Pet Care Helper AI$/i, '')
    .trim();
}

function extractMetaDesc(html) {
  const m = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i);
  if (m) return m[1].trim();
  const m2 = html.match(/<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["']\s*\/?>/i);
  return m2 ? m2[1].trim() : '';
}

function extractCanonical(html) {
  const m = html.match(/<link\s+rel=["']canonical["']\s+href=["']([\s\S]*?)["']\s*\/?>/i);
  return m ? m[1].trim() : '';
}

function hasJsonLd(html) {
  return /<script\s+type=["']application\/ld\+json["']/i.test(html);
}

function extractArticleContent(html) {
  // Try <article>, <main>, then fall back to <body>
  let m = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (!m) m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (!m) m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!m) return '';
  return m[1]
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Given a file path, compute the URL path relative to site root.
 * E.g. /opt/build/repo/breeds/dogs/labrador.html -> /breeds/dogs/labrador
 *      /opt/build/repo/index.html -> /
 */
function fileToUrlPath(filePath) {
  const rel = relative(BASE_DIR, filePath); // e.g. "breeds/dogs/labrador.html"
  const withoutExt = rel.replace(/\.html$/, '');
  if (withoutExt === 'index') return '/';
  // Sub-directory index files: tools/index -> /tools
  if (withoutExt.endsWith('/index')) {
    return '/' + withoutExt.replace(/\/index$/, '');
  }
  return '/' + withoutExt;
}

/**
 * Determine the category of a page from its relative path.
 */
function categorize(filePath) {
  const rel = relative(BASE_DIR, filePath);
  const parts = rel.split('/');

  if (parts[0] === 'breeds' && parts.length >= 3) return 'breed-pages';
  if (parts[0] === 'breeds' && parts.length === 2) return 'breed-hubs';
  if (parts[0] === 'guides') return 'guides';
  if (parts[0] === 'locations') return 'locations';
  if (parts[0] === 'tools') return 'tools';
  if (parts[0] === 'embed') return 'embed';
  if (parts[0] === 'resources') return 'resources';
  if (parts[0] === 'feeds') return 'feeds';
  return 'root';
}

/**
 * Determine the breed sub-category for a breed page.
 */
function breedSubCategory(filePath) {
  const rel = relative(BASE_DIR, filePath);
  const parts = rel.split('/');
  if (parts[0] === 'breeds' && parts.length >= 3) return parts[1];
  return '';
}

/**
 * Determine the sitemap priority for a page.
 */
function determinePriority(urlPath) {
  // Home page
  if (urlPath === '/') return 1.0;

  // 404 page -- excluded, but just in case
  if (urlPath === '/404') return 0.0;

  const slug = urlPath.replace(/^\//, '');

  // Category hubs at root
  if (CATEGORY_HUBS.has(slug)) return 1.0;

  // Breed list hubs (/breeds/*-breeds)
  if (/^breeds\/[a-z]+-breeds$/.test(slug) || /^breeds\/[a-z]+-[a-z]+-breeds$/.test(slug)) return 0.8;

  // Individual breed/species pages
  if (slug.startsWith('breeds/') && slug.split('/').length === 3) return 0.7;

  // Guide pages
  if (slug.startsWith('guides/')) return 0.7;

  // Location pages
  if (slug.startsWith('locations/')) return 0.6;

  // Tool pages
  if (slug.startsWith('tools/')) return 0.6;

  // Utility pages
  const rootSlug = slug.split('/')[0];
  if (UTILITY_PAGES.has(rootSlug)) return 0.5;

  return 0.4;
}

/**
 * Derive search category from file path.
 */
function deriveSearchCategory(filePath) {
  const rel = relative(BASE_DIR, filePath);
  const parts = rel.split('/');

  if (parts[0] === 'breeds' && parts.length >= 3) {
    return parts[1]; // dogs, cats, birds, fish, reptiles, small-animals
  }
  if (parts[0] === 'breeds' && parts.length === 2) {
    const slug = parts[1].replace('.html', '');
    if (slug.includes('dog')) return 'dogs';
    if (slug.includes('cat')) return 'cats';
    if (slug.includes('bird')) return 'birds';
    if (slug.includes('fish')) return 'fish';
    if (slug.includes('reptile')) return 'reptiles';
    if (slug.includes('small-animal')) return 'small-animals';
    if (slug.includes('amphibian')) return 'amphibians';
    if (slug.includes('marine')) return 'marine-fish';
    return 'breeds';
  }
  if (parts[0] === 'guides') return 'guides';
  if (parts[0] === 'locations') return 'locations';
  if (parts[0] === 'tools') return 'tools';

  const rootSlug = parts[0].replace('.html', '');
  return rootSlug;
}

// ============================================================
// PHASE 1: REGENERATE SITEMAP
// ============================================================

function regenerateSitemap() {
  console.log('\n========================================');
  console.log('PHASE 1: Regenerating sitemap.xml');
  console.log('========================================\n');

  const allFiles = collectHtmlFiles(BASE_DIR);
  console.log(`Found ${allFiles.length} total HTML files`);

  // Filter out excluded pages
  const sitemapFiles = allFiles.filter(f => {
    const rel = relative(BASE_DIR, f);
    // Exclude embed pages
    if (rel.startsWith('embed/') || rel.startsWith('embed\\')) return false;
    // Exclude 404
    if (rel === '404.html') return false;
    // Exclude styles helper page
    if (rel === 'styles.css.html') return false;
    // Exclude feeds directory HTML
    if (rel.startsWith('feeds/') || rel.startsWith('feeds\\')) return false;
    return true;
  });

  console.log(`Including ${sitemapFiles.length} pages in sitemap (excluded embed/*, 404, feeds/*)`);

  // Build URL entries
  const entries = [];
  for (const filePath of sitemapFiles) {
    const urlPath = fileToUrlPath(filePath);
    const priority = determinePriority(urlPath);
    const fullUrl = urlPath === '/' ? SITE + '/' : SITE + urlPath;

    entries.push({
      loc: fullUrl,
      lastmod: TODAY,
      changefreq: 'weekly',
      priority: priority.toFixed(1),
      urlPath
    });
  }

  // Sort: highest priority first, then alphabetically
  entries.sort((a, b) => {
    const pd = parseFloat(b.priority) - parseFloat(a.priority);
    if (pd !== 0) return pd;
    return a.loc.localeCompare(b.loc);
  });

  // Build XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const entry of entries) {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(entry.loc)}</loc>\n`;
    xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    xml += `    <priority>${entry.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';

  const sitemapPath = join(BASE_DIR, 'sitemap.xml');
  writeFileSync(sitemapPath, xml, 'utf-8');
  console.log(`Sitemap written to ${sitemapPath}`);
  console.log(`Total URLs in sitemap: ${entries.length}`);

  // Priority breakdown
  const priorityCounts = {};
  for (const e of entries) {
    priorityCounts[e.priority] = (priorityCounts[e.priority] || 0) + 1;
  }
  console.log('\nPriority breakdown:');
  for (const [p, c] of Object.entries(priorityCounts).sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))) {
    console.log(`  Priority ${p}: ${c} URLs`);
  }

  return allFiles;
}

// ============================================================
// PHASE 2: UPDATE SEARCH INDEX
// ============================================================

function updateSearchIndex() {
  console.log('\n========================================');
  console.log('PHASE 2: Regenerating search-index.json');
  console.log('========================================\n');

  const index = [];

  // Collect breed pages
  const breedDir = join(BASE_DIR, 'breeds');
  const breedFiles = existsSync(breedDir) ? collectHtmlFiles(breedDir) : [];

  // Collect guide pages
  const guidesDir = join(BASE_DIR, 'guides');
  const guideFiles = existsSync(guidesDir) ? collectHtmlFiles(guidesDir) : [];

  // Collect location pages
  const locationsDir = join(BASE_DIR, 'locations');
  const locationFiles = existsSync(locationsDir) ? collectHtmlFiles(locationsDir) : [];

  // Collect tool pages
  const toolsDir = join(BASE_DIR, 'tools');
  const toolFiles = existsSync(toolsDir) ? collectHtmlFiles(toolsDir) : [];

  // Root category pages
  const rootCategoryFiles = [
    'dogs.html', 'cats.html', 'birds.html', 'fish.html',
    'reptiles.html', 'small-animals.html', 'guides.html',
    'amphibians.html', 'marine-fish.html', 'chat.html'
  ]
    .map(f => join(BASE_DIR, f))
    .filter(f => existsSync(f));

  const allSearchFiles = [
    ...breedFiles, ...guideFiles, ...locationFiles, ...toolFiles, ...rootCategoryFiles
  ];

  console.log(`Scanning ${allSearchFiles.length} files for search index...`);

  for (const filePath of allSearchFiles) {
    let html;
    try {
      html = readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }

    const rawTitle = extractTitle(html);
    if (!rawTitle) continue;

    const title = cleanTitle(rawTitle);
    const urlPath = fileToUrlPath(filePath);
    const category = deriveSearchCategory(filePath);
    const slug = basename(filePath, '.html');
    const keywords = slug.replace(/-/g, ' ').toLowerCase() + ' ' + category.replace(/-/g, ' ').toLowerCase();

    index.push({
      title,
      url: urlPath,
      category,
      keywords
    });
  }

  // Sort by category then title
  index.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));

  const outPath = join(BASE_DIR, 'search-index.json');
  writeFileSync(outPath, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`Search index written to ${outPath}`);
  console.log(`Total search entries: ${index.length}`);

  // Category breakdown
  const catCounts = {};
  for (const entry of index) {
    catCounts[entry.category] = (catCounts[entry.category] || 0) + 1;
  }
  console.log('\nSearch index category breakdown:');
  for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count} entries`);
  }
}

// ============================================================
// PHASE 3: QA CHECKS
// ============================================================

function runQAChecks() {
  console.log('\n========================================');
  console.log('PHASE 3: Running QA Checks');
  console.log('========================================\n');

  const allFiles = collectHtmlFiles(BASE_DIR);

  // Categorize pages
  const categories = {};
  const issues = {
    missingTitle: [],
    missingDescription: [],
    missingCanonical: [],
    missingJsonLd: [],
    shortContent: []
  };

  let totalPages = 0;

  for (const filePath of allFiles) {
    const rel = relative(BASE_DIR, filePath);
    let html;
    try {
      html = readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }

    totalPages++;

    // Categorize
    const cat = categorize(filePath);
    let subCat = '';
    if (cat === 'breed-pages') {
      subCat = breedSubCategory(filePath);
    }
    const displayCat = subCat ? `breeds/${subCat}` : cat;
    categories[displayCat] = (categories[displayCat] || 0) + 1;

    // Check for title
    const title = extractTitle(html);
    if (!title) {
      issues.missingTitle.push(rel);
    }

    // Check for meta description
    const desc = extractMetaDesc(html);
    if (!desc) {
      issues.missingDescription.push(rel);
    }

    // Check for canonical URL
    const canonical = extractCanonical(html);
    if (!canonical) {
      issues.missingCanonical.push(rel);
    }

    // Check for JSON-LD schema
    if (!hasJsonLd(html)) {
      issues.missingJsonLd.push(rel);
    }

    // Check for short content in main article
    const articleText = extractArticleContent(html);
    if (articleText.length < 500) {
      issues.shortContent.push({ file: rel, length: articleText.length });
    }
  }

  // Report
  console.log(`Total HTML pages scanned: ${totalPages}`);
  console.log('\n--- Category Breakdown ---');
  const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedCats) {
    console.log(`  ${cat}: ${count} pages`);
  }

  console.log('\n--- Missing <title> Tags ---');
  if (issues.missingTitle.length === 0) {
    console.log('  None -- all pages have <title> tags');
  } else {
    console.log(`  ${issues.missingTitle.length} pages missing <title>:`);
    for (const f of issues.missingTitle.slice(0, 20)) {
      console.log(`    - ${f}`);
    }
    if (issues.missingTitle.length > 20) {
      console.log(`    ... and ${issues.missingTitle.length - 20} more`);
    }
  }

  console.log('\n--- Missing <meta name="description"> ---');
  if (issues.missingDescription.length === 0) {
    console.log('  None -- all pages have meta descriptions');
  } else {
    console.log(`  ${issues.missingDescription.length} pages missing meta description:`);
    for (const f of issues.missingDescription.slice(0, 20)) {
      console.log(`    - ${f}`);
    }
    if (issues.missingDescription.length > 20) {
      console.log(`    ... and ${issues.missingDescription.length - 20} more`);
    }
  }

  console.log('\n--- Missing Canonical URLs ---');
  if (issues.missingCanonical.length === 0) {
    console.log('  None -- all pages have canonical URLs');
  } else {
    console.log(`  ${issues.missingCanonical.length} pages missing canonical URL:`);
    for (const f of issues.missingCanonical.slice(0, 20)) {
      console.log(`    - ${f}`);
    }
    if (issues.missingCanonical.length > 20) {
      console.log(`    ... and ${issues.missingCanonical.length - 20} more`);
    }
  }

  console.log('\n--- Missing JSON-LD Schema ---');
  if (issues.missingJsonLd.length === 0) {
    console.log('  None -- all pages have JSON-LD schema');
  } else {
    console.log(`  ${issues.missingJsonLd.length} pages missing JSON-LD schema:`);
    for (const f of issues.missingJsonLd.slice(0, 20)) {
      console.log(`    - ${f}`);
    }
    if (issues.missingJsonLd.length > 20) {
      console.log(`    ... and ${issues.missingJsonLd.length - 20} more`);
    }
  }

  console.log('\n--- Pages with Short Content (<500 characters in article) ---');
  if (issues.shortContent.length === 0) {
    console.log('  None -- all pages have sufficient content');
  } else {
    console.log(`  ${issues.shortContent.length} pages with short content:`);
    for (const item of issues.shortContent.slice(0, 20)) {
      console.log(`    - ${item.file} (${item.length} chars)`);
    }
    if (issues.shortContent.length > 20) {
      console.log(`    ... and ${issues.shortContent.length - 20} more`);
    }
  }

  console.log('\n--- QA Summary ---');
  console.log(`  Total pages: ${totalPages}`);
  console.log(`  Missing title: ${issues.missingTitle.length}`);
  console.log(`  Missing description: ${issues.missingDescription.length}`);
  console.log(`  Missing canonical: ${issues.missingCanonical.length}`);
  console.log(`  Missing JSON-LD: ${issues.missingJsonLd.length}`);
  console.log(`  Short content: ${issues.shortContent.length}`);

  return { totalPages, categories, issues };
}

// ============================================================
// PHASE 4: UPDATE NETLIFY.TOML
// ============================================================

function updateNetlifyToml() {
  console.log('\n========================================');
  console.log('PHASE 4: Updating netlify.toml');
  console.log('========================================\n');

  const tomlPath = join(BASE_DIR, 'netlify.toml');
  let toml = readFileSync(tomlPath, 'utf-8');

  const newRedirects = [
    {
      from: '/breeds/amphibians/*.html',
      to: '/breeds/amphibians/:splat',
      check: '/breeds/amphibians/*.html'
    },
    {
      from: '/breeds/marine-fish/*.html',
      to: '/breeds/marine-fish/:splat',
      check: '/breeds/marine-fish/*.html'
    }
  ];

  let added = 0;

  for (const redirect of newRedirects) {
    if (toml.includes(redirect.check)) {
      console.log(`  Redirect already exists: ${redirect.from} -> skipping`);
      continue;
    }

    // Insert before the generic /breeds/*.html redirect
    const genericBreedRedirect = '[[redirects]]\n  from = "/breeds/*.html"';
    const newBlock = [
      '[[redirects]]',
      `  from = "${redirect.from}"`,
      `  to = "${redirect.to}"`,
      '  status = 301',
      '  force = true',
      ''
    ].join('\n');

    if (toml.includes(genericBreedRedirect)) {
      toml = toml.replace(genericBreedRedirect, newBlock + '\n' + genericBreedRedirect);
      console.log(`  Added redirect: ${redirect.from} -> ${redirect.to}`);
      added++;
    } else {
      // Append before the catch-all /*.html redirect
      const catchAll = '# Catch-all for root-level .html pages';
      if (toml.includes(catchAll)) {
        toml = toml.replace(catchAll, newBlock + '\n' + catchAll);
        console.log(`  Added redirect: ${redirect.from} -> ${redirect.to}`);
        added++;
      } else {
        // Just append at the end of redirects section
        toml += '\n' + newBlock;
        console.log(`  Appended redirect: ${redirect.from} -> ${redirect.to}`);
        added++;
      }
    }
  }

  writeFileSync(tomlPath, toml, 'utf-8');
  console.log(`\nNetlify.toml updated: ${added} new redirect(s) added`);
}

// ============================================================
// PHASE 5: UPDATE RSS FEEDS
// ============================================================

function buildRssItem(title, link, description) {
  return [
    '    <item>',
    `      <title>${escapeXml(title)}</title>`,
    `      <link>${link}</link>`,
    `      <description>${escapeXml(description)}</description>`,
    `      <pubDate>${PUB_DATE}</pubDate>`,
    `      <guid isPermaLink="true">${link}</guid>`,
    '    </item>'
  ].join('\n');
}

function buildCategoryFeed(categoryName, categoryLabel, selfHref, items) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
  xml += '  <channel>\n';
  xml += `    <title>Pet Care Helper AI - ${categoryLabel} Care Guides</title>\n`;
  xml += `    <link>${SITE}</link>\n`;
  xml += `    <description>Comprehensive pet care guides covering health, nutrition, training, and wellness for dogs, cats, birds, fish, reptiles, and small animals.</description>\n`;
  xml += '    <language>en-us</language>\n';
  xml += `    <lastBuildDate>${PUB_DATE}</lastBuildDate>\n`;
  xml += `    <atom:link href="${SITE}/feeds/${selfHref}" rel="self" type="application/rss+xml"/>\n`;

  for (const item of items) {
    xml += item + '\n';
  }

  xml += '\n  </channel>\n';
  xml += '</rss>';
  return xml;
}

function updateRssFeeds() {
  console.log('\n========================================');
  console.log('PHASE 5: Updating RSS Feeds');
  console.log('========================================\n');

  const feedsDir = join(BASE_DIR, 'feeds');
  if (!existsSync(feedsDir)) {
    mkdirSync(feedsDir, { recursive: true });
  }

  // Collect breed pages per category for new feeds
  const breedCategories = {
    birds: { label: 'Bird', file: 'birds.xml', dir: join(BASE_DIR, 'breeds', 'birds') },
    fish: { label: 'Fish', file: 'fish.xml', dir: join(BASE_DIR, 'breeds', 'fish') },
    reptiles: { label: 'Reptile', file: 'reptiles.xml', dir: join(BASE_DIR, 'breeds', 'reptiles') },
    'small-animals': { label: 'Small Animal', file: 'small-animals.xml', dir: join(BASE_DIR, 'breeds', 'small-animals') },
    amphibians: { label: 'Amphibian', file: 'amphibians.xml', dir: join(BASE_DIR, 'breeds', 'amphibians') },
    'marine-fish': { label: 'Marine Fish', file: 'marine-fish.xml', dir: join(BASE_DIR, 'breeds', 'marine-fish') }
  };

  // Also collect guide pages per category for the main feed
  const guidesDir = join(BASE_DIR, 'guides');
  const guideFiles = existsSync(guidesDir) ? collectHtmlFiles(guidesDir) : [];

  // Build new items for main feed from categories not already in it
  const mainFeedPath = join(BASE_DIR, 'feed.xml');
  let mainFeedContent = existsSync(mainFeedPath) ? readFileSync(mainFeedPath, 'utf-8') : '';

  let mainFeedNewItems = [];

  // Process each breed category
  for (const [catKey, catInfo] of Object.entries(breedCategories)) {
    if (!existsSync(catInfo.dir)) {
      console.log(`  No breed directory for ${catKey}, skipping feed creation`);
      continue;
    }

    const htmlFiles = collectHtmlFiles(catInfo.dir);
    if (htmlFiles.length === 0) {
      console.log(`  No HTML files in ${catKey}, skipping`);
      continue;
    }

    const items = [];

    for (const filePath of htmlFiles) {
      let html;
      try {
        html = readFileSync(filePath, 'utf-8');
      } catch {
        continue;
      }
      const title = cleanTitle(extractTitle(html));
      if (!title) continue;

      const urlPath = fileToUrlPath(filePath);
      const fullUrl = SITE + urlPath;
      const desc = extractMetaDesc(html) || `Complete ${catInfo.label} care guide for ${title}.`;

      items.push(buildRssItem(title, fullUrl, desc));

      // Check if this item exists in main feed
      if (mainFeedContent && !mainFeedContent.includes(fullUrl)) {
        mainFeedNewItems.push(buildRssItem(title, fullUrl, desc));
      }
    }

    // Write category feed
    const feedPath = join(feedsDir, catInfo.file);
    const feedExists = existsSync(feedPath);

    if (!feedExists) {
      const feedXml = buildCategoryFeed(catKey, catInfo.label, catInfo.file, items);
      writeFileSync(feedPath, feedXml, 'utf-8');
      console.log(`  Created new category feed: feeds/${catInfo.file} (${items.length} items)`);
    } else {
      // Update existing feed: read and add any missing items
      let existingFeed = readFileSync(feedPath, 'utf-8');
      let addedToCategory = 0;

      for (const item of items) {
        // Extract the guid URL from this item
        const guidMatch = item.match(/<guid[^>]*>(.*?)<\/guid>/);
        if (guidMatch && !existingFeed.includes(guidMatch[1])) {
          // Insert before closing </channel>
          existingFeed = existingFeed.replace('  </channel>', item + '\n  </channel>');
          addedToCategory++;
        }
      }

      if (addedToCategory > 0) {
        // Update lastBuildDate
        existingFeed = existingFeed.replace(
          /<lastBuildDate>.*?<\/lastBuildDate>/,
          `<lastBuildDate>${PUB_DATE}</lastBuildDate>`
        );
        writeFileSync(feedPath, existingFeed, 'utf-8');
        console.log(`  Updated feeds/${catInfo.file}: added ${addedToCategory} new items`);
      } else {
        console.log(`  feeds/${catInfo.file} is up to date`);
      }
    }
  }

  // Also include location and tool pages as new items for the main feed
  const locationsDir = join(BASE_DIR, 'locations');
  if (existsSync(locationsDir)) {
    const locFiles = collectHtmlFiles(locationsDir);
    for (const filePath of locFiles.slice(0, 50)) { // Limit to avoid huge feed
      let html;
      try {
        html = readFileSync(filePath, 'utf-8');
      } catch {
        continue;
      }
      const title = cleanTitle(extractTitle(html));
      if (!title) continue;
      const urlPath = fileToUrlPath(filePath);
      const fullUrl = SITE + urlPath;
      const desc = extractMetaDesc(html) || `Pet care resources in ${title}.`;

      if (mainFeedContent && !mainFeedContent.includes(fullUrl)) {
        mainFeedNewItems.push(buildRssItem(title, fullUrl, desc));
      }
    }
  }

  // Update main feed.xml with new items
  if (mainFeedContent && mainFeedNewItems.length > 0) {
    // Limit to 100 new items to keep feed manageable
    const itemsToAdd = mainFeedNewItems.slice(0, 100);
    let updatedFeed = mainFeedContent;

    for (const item of itemsToAdd) {
      updatedFeed = updatedFeed.replace(
        '\n  </channel>',
        '\n' + item + '\n  </channel>'
      );
    }

    // Update lastBuildDate
    updatedFeed = updatedFeed.replace(
      /<lastBuildDate>.*?<\/lastBuildDate>/,
      `<lastBuildDate>${PUB_DATE}</lastBuildDate>`
    );

    writeFileSync(mainFeedPath, updatedFeed, 'utf-8');
    console.log(`\n  Updated main feed.xml: added ${itemsToAdd.length} new items`);
  } else if (!mainFeedContent) {
    console.log('  No main feed.xml found, skipping main feed update');
  } else {
    console.log('\n  Main feed.xml is up to date (no new items to add)');
  }

  // Create location feed if it doesn't exist
  const locationsFeedPath = join(feedsDir, 'locations.xml');
  if (!existsSync(locationsFeedPath) && existsSync(locationsDir)) {
    const locFiles = collectHtmlFiles(locationsDir);
    const locItems = [];
    for (const filePath of locFiles) {
      let html;
      try {
        html = readFileSync(filePath, 'utf-8');
      } catch {
        continue;
      }
      const title = cleanTitle(extractTitle(html));
      if (!title) continue;
      const urlPath = fileToUrlPath(filePath);
      const fullUrl = SITE + urlPath;
      const desc = extractMetaDesc(html) || `Pet care resources in ${title}.`;
      locItems.push(buildRssItem(title, fullUrl, desc));
    }
    if (locItems.length > 0) {
      const feedXml = buildCategoryFeed('locations', 'Location', 'locations.xml', locItems);
      writeFileSync(locationsFeedPath, feedXml, 'utf-8');
      console.log(`  Created new feed: feeds/locations.xml (${locItems.length} items)`);
    }
  }

  // Create tools feed if it doesn't exist
  const toolsFeedPath = join(feedsDir, 'tools.xml');
  if (!existsSync(toolsFeedPath)) {
    const toolsDir = join(BASE_DIR, 'tools');
    if (existsSync(toolsDir)) {
      const toolFiles = collectHtmlFiles(toolsDir);
      const toolItems = [];
      for (const filePath of toolFiles) {
        let html;
        try {
          html = readFileSync(filePath, 'utf-8');
        } catch {
          continue;
        }
        const title = cleanTitle(extractTitle(html));
        if (!title) continue;
        const urlPath = fileToUrlPath(filePath);
        const fullUrl = SITE + urlPath;
        const desc = extractMetaDesc(html) || `${title} tool for pet owners.`;
        toolItems.push(buildRssItem(title, fullUrl, desc));
      }
      if (toolItems.length > 0) {
        const feedXml = buildCategoryFeed('tools', 'Tool', 'tools.xml', toolItems);
        writeFileSync(toolsFeedPath, feedXml, 'utf-8');
        console.log(`  Created new feed: feeds/tools.xml (${toolItems.length} items)`);
      }
    }
  }
}

// ============================================================
// MAIN
// ============================================================

console.log('==============================================');
console.log('PetCareHelperAI Final Sitemap & QA Engine');
console.log(`Date: ${TODAY}`);
console.log(`Base directory: ${BASE_DIR}`);
console.log('==============================================');

// Phase 1: Sitemap
regenerateSitemap();

// Phase 2: Search Index
updateSearchIndex();

// Phase 3: QA Checks
const qa = runQAChecks();

// Phase 4: Netlify Redirects
updateNetlifyToml();

// Phase 5: RSS Feeds
updateRssFeeds();

console.log('\n==============================================');
console.log('All phases complete!');
console.log('==============================================');
