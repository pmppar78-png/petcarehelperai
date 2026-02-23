#!/usr/bin/env node
/**
 * audit-sections.js
 * ------------------
 * Recursively audits ALL .html files under /opt/build/repo/commercial/
 * and checks for key section completeness across every commercial page.
 *
 * Outputs JSON to /opt/build/repo/data/section-audit.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMERCIAL_DIR = path.join(__dirname, '..', 'commercial');
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'section-audit.json');

// ---------------------------------------------------------------------------
// 1. Recursively find all .html files
// ---------------------------------------------------------------------------
function findHtmlFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// 2. Page-type helpers
// ---------------------------------------------------------------------------

// Determine the page "slug" (last path segment without .html)
function pageSlug(filePath) {
  return path.basename(filePath, '.html');
}

// Pages that *should* have cost tables with $ amounts
const COST_PAGE_SLUGS = new Set([
  'cost-to-own',
  'health-costs',
  'best-food',
  'best-habitat-size'
]);

function shouldHaveCostTable(filePath) {
  return COST_PAGE_SLUGS.has(pageSlug(filePath));
}

// ---------------------------------------------------------------------------
// 3. Section-detection functions (work on raw HTML string)
// ---------------------------------------------------------------------------

/**
 * Top Picks table: has `comparison-table` class AND a <th> with
 * "Provider" (or similar like "#" column next to Provider).
 */
function hasTopPicksTable(html) {
  // Must have comparison-table AND a Provider header
  if (!html.includes('comparison-table')) return false;
  // Look for <th>Provider</th> or <th> that says Provider
  return /<th[^>]*>\s*Provider\s*<\/th>/i.test(html);
}

/**
 * Buyer Guidance section: heading containing one of the known guidance phrases.
 */
const BUYER_GUIDANCE_PATTERNS = [
  /What to Look For/i,
  /Feeding Guidelines/i,
  /Coverage Options/i,
  /Size Recommendations/i,
  /Quick Assessment/i,
  /How to Choose/i,
  /What to Look For in/i,
  /Types of Toys/i,
  /Types of Enrichment/i,
  /Essential Equipment/i,
  /Enclosure Size Recommendations/i,
  /Enrichment Schedule/i,
  /Coverage Types Explained/i,
  /Choose .+ If\.\.\./i,           // "Choose X If..." in vs pages
  /Pros for First-Time Owners/i,
  /Challenges to Consider/i,
  /First-Time Owner Checklist/i,
  /Prevention Tips/i,
  /Side-by-Side Comparison/i,
  /Ways to Save/i,
  /Startup Cost Breakdown/i,
  /Ongoing Monthly Expenses/i,
];

function hasBuyerGuidance(html) {
  // Check for any <h2> or <h3> containing a guidance phrase
  for (const pat of BUYER_GUIDANCE_PATTERNS) {
    if (pat.test(html)) return true;
  }
  return false;
}

/**
 * "Best for" subcategory sections.
 * Count occurrences of:
 *   - <li><strong>Best  (in lists)
 *   - <h2>Best  or <h3>Best  (as headings)
 *   - "Best Food by Category" sections with Best items inside
 */
function countBestForSections(html) {
  let count = 0;

  // Pattern 1: <li><strong>Best ... (list items)
  const liMatches = html.match(/<li><strong>Best\s/gi);
  if (liMatches) count += liMatches.length;

  // Pattern 2: <h2>Best  or <h3>Best  (headings)
  const hMatches = html.match(/<h[23][^>]*>Best\s/gi);
  if (hMatches) count += hMatches.length;

  return count;
}

/**
 * Disclaimer block: contains "Disclaimer:" text.
 */
function hasDisclaimer(html) {
  return html.includes('Disclaimer:');
}

/**
 * FAQ JSON-LD schema: contains "@type":"FAQPage" (with or without spaces).
 */
function hasFaqSchema(html) {
  return /"@type"\s*:\s*"FAQPage"/i.test(html);
}

/**
 * Count FAQ questions in the JSON-LD schema.
 */
function countFaqQuestions(html) {
  const matches = html.match(/"@type"\s*:\s*"Question"/gi);
  return matches ? matches.length : 0;
}

/**
 * Cost tables: tables containing $ amounts.
 * Only relevant for pages that should have them.
 */
function hasCostTable(html) {
  // Look for a table that includes $ inside <td> elements
  // Simple heuristic: has comparison-table AND $ sign within it
  if (!html.includes('comparison-table')) return false;
  return /\$\d/.test(html);
}

/**
 * Internal linking cluster: "Related ... Pages" section with multiple links.
 */
function hasInternalLinkingCluster(html) {
  // Pattern: heading like "Related X Pages" followed by links
  if (/Related\s+.+?\s+Pages/i.test(html)) {
    // Count links inside the related pages section
    // Find the section: from "Related ... Pages" to end of the enclosing div
    const relMatch = html.match(/Related\s+.+?\s+Pages[\s\S]{0,2000}?<\/div>/i);
    if (relMatch) {
      const section = relMatch[0];
      const linkCount = (section.match(/<a\s/gi) || []).length;
      return linkCount >= 2; // at least 2 links
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// 4. Main audit logic
// ---------------------------------------------------------------------------
function auditFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const slug = pageSlug(filePath);
  const relativePath = path.relative(COMMERCIAL_DIR, filePath);

  const topPicks = hasTopPicksTable(html);
  const buyerGuidance = hasBuyerGuidance(html);
  const bestForCount = countBestForSections(html);
  const disclaimer = hasDisclaimer(html);
  const faqSchema = hasFaqSchema(html);
  const faqCount = countFaqQuestions(html);
  const costPageApplicable = shouldHaveCostTable(filePath);
  const costTable = costPageApplicable ? hasCostTable(html) : null;
  const internalLinks = hasInternalLinkingCluster(html);

  const missing = [];
  if (!topPicks)                   missing.push('top_picks_table');
  if (!buyerGuidance)              missing.push('buyer_guidance');
  if (bestForCount < 3)            missing.push(`best_for_sections (found ${bestForCount}, need 3+)`);
  if (!disclaimer)                 missing.push('disclaimer');
  if (!faqSchema)                  missing.push('faq_schema');
  if (faqCount < 5)                missing.push(`faq_5plus_questions (found ${faqCount})`);
  if (costPageApplicable && !costTable) missing.push('cost_table');
  if (!internalLinks)              missing.push('internal_links');

  return {
    file: relativePath,
    slug,
    topPicks,
    buyerGuidance,
    bestForCount,
    has3PlusBestFor: bestForCount >= 3,
    disclaimer,
    faqSchema,
    faqCount,
    costPageApplicable,
    costTable,
    internalLinks,
    missing
  };
}

function run() {
  console.log('Scanning', COMMERCIAL_DIR, '...');
  const files = findHtmlFiles(COMMERCIAL_DIR);
  console.log(`Found ${files.length} HTML files.`);

  const results = files.map(auditFile);

  // --- Aggregate stats ---
  const total = results.length;
  const withTopPicks        = results.filter(r => r.topPicks).length;
  const withBuyerGuidance   = results.filter(r => r.buyerGuidance).length;
  const with3PlusBestFor    = results.filter(r => r.has3PlusBestFor).length;
  const withDisclaimer      = results.filter(r => r.disclaimer).length;
  const withFaqSchema       = results.filter(r => r.faqSchema).length;
  const with5PlusFaq        = results.filter(r => r.faqCount >= 5).length;
  const costApplicable      = results.filter(r => r.costPageApplicable);
  const withCostTable       = costApplicable.filter(r => r.costTable).length;
  const withInternalLinks   = results.filter(r => r.internalLinks).length;

  const pct = (n, d) => d === 0 ? 'N/A' : `${((n / d) * 100).toFixed(1)}%`;

  // Pages missing key sections (only list pages that have at least one missing item)
  const pagesMissingSections = results
    .filter(r => r.missing.length > 0)
    .map(r => ({ file: r.file, missing: r.missing }));

  // Breakdown by page type (slug)
  const slugCounts = {};
  for (const r of results) {
    if (!slugCounts[r.slug]) {
      slugCounts[r.slug] = { total: 0, topPicks: 0, buyerGuidance: 0, bestFor3: 0, disclaimer: 0, faqSchema: 0, faq5: 0, internalLinks: 0 };
    }
    const s = slugCounts[r.slug];
    s.total++;
    if (r.topPicks) s.topPicks++;
    if (r.buyerGuidance) s.buyerGuidance++;
    if (r.has3PlusBestFor) s.bestFor3++;
    if (r.disclaimer) s.disclaimer++;
    if (r.faqSchema) s.faqSchema++;
    if (r.faqCount >= 5) s.faq5++;
    if (r.internalLinks) s.internalLinks++;
  }

  // Breakdown by animal category
  const categoryCounts = {};
  for (const r of results) {
    const cat = r.file.split(path.sep)[0]; // e.g. "cats", "dogs"
    if (!categoryCounts[cat]) {
      categoryCounts[cat] = { total: 0, topPicks: 0, buyerGuidance: 0, bestFor3: 0, disclaimer: 0, faqSchema: 0, faq5: 0, internalLinks: 0 };
    }
    const c = categoryCounts[cat];
    c.total++;
    if (r.topPicks) c.topPicks++;
    if (r.buyerGuidance) c.buyerGuidance++;
    if (r.has3PlusBestFor) c.bestFor3++;
    if (r.disclaimer) c.disclaimer++;
    if (r.faqSchema) c.faqSchema++;
    if (r.faqCount >= 5) c.faq5++;
    if (r.internalLinks) c.internalLinks++;
  }

  const output = {
    generated_at: new Date().toISOString(),
    total_pages: total,
    pct_with_top_picks_table: pct(withTopPicks, total),
    pct_with_buyer_guidance: pct(withBuyerGuidance, total),
    pct_with_3plus_best_for_sections: pct(with3PlusBestFor, total),
    pct_with_disclaimer: pct(withDisclaimer, total),
    pct_with_faq_schema: pct(withFaqSchema, total),
    pct_with_5plus_faq_questions: pct(with5PlusFaq, total),
    pct_with_cost_tables: `${pct(withCostTable, costApplicable.length)} (${withCostTable}/${costApplicable.length} applicable pages)`,
    pct_with_internal_links: pct(withInternalLinks, total),

    counts: {
      top_picks_table: withTopPicks,
      buyer_guidance: withBuyerGuidance,
      best_for_3plus: with3PlusBestFor,
      disclaimer: withDisclaimer,
      faq_schema: withFaqSchema,
      faq_5plus_questions: with5PlusFaq,
      cost_tables_present: withCostTable,
      cost_tables_applicable: costApplicable.length,
      internal_links: withInternalLinks
    },

    breakdown_by_page_type: slugCounts,
    breakdown_by_category: categoryCounts,

    pages_missing_sections_count: pagesMissingSections.length,
    pages_missing_sections_sample: pagesMissingSections.slice(0, 50),
    // Full list only if reasonable size, otherwise note it
    ...(pagesMissingSections.length <= 500
      ? { pages_missing_sections_full: pagesMissingSections }
      : { pages_missing_sections_note: `${pagesMissingSections.length} pages have missing sections. Showing first 50 in sample above. Full list omitted for file size.` }
    )
  };

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\nAudit complete. Results written to ${OUTPUT_FILE}`);

  // Print summary to console
  console.log('\n===== SECTION AUDIT SUMMARY =====');
  console.log(`Total pages scanned:          ${total}`);
  console.log(`Top Picks table:              ${withTopPicks}/${total} (${pct(withTopPicks, total)})`);
  console.log(`Buyer Guidance:               ${withBuyerGuidance}/${total} (${pct(withBuyerGuidance, total)})`);
  console.log(`3+ "Best for" sections:       ${with3PlusBestFor}/${total} (${pct(with3PlusBestFor, total)})`);
  console.log(`Disclaimer:                   ${withDisclaimer}/${total} (${pct(withDisclaimer, total)})`);
  console.log(`FAQ Schema:                   ${withFaqSchema}/${total} (${pct(withFaqSchema, total)})`);
  console.log(`5+ FAQ questions:             ${with5PlusFaq}/${total} (${pct(with5PlusFaq, total)})`);
  console.log(`Cost tables (applicable):     ${withCostTable}/${costApplicable.length} (${pct(withCostTable, costApplicable.length)})`);
  console.log(`Internal linking cluster:     ${withInternalLinks}/${total} (${pct(withInternalLinks, total)})`);
  console.log(`Pages with missing sections:  ${pagesMissingSections.length}/${total}`);
  console.log('=================================\n');

  // Print per-type breakdown
  console.log('--- Breakdown by Page Type ---');
  for (const [slug, s] of Object.entries(slugCounts).sort((a, b) => b[1].total - a[1].total)) {
    console.log(`  ${slug} (${s.total} pages): topPicks=${s.topPicks} buyerGuidance=${s.buyerGuidance} bestFor3+=${s.bestFor3} disclaimer=${s.disclaimer} faq=${s.faqSchema} faq5+=${s.faq5} links=${s.internalLinks}`);
  }

  console.log('\n--- Breakdown by Category ---');
  for (const [cat, c] of Object.entries(categoryCounts).sort((a, b) => b[1].total - a[1].total)) {
    console.log(`  ${cat} (${c.total} pages): topPicks=${c.topPicks} buyerGuidance=${c.buyerGuidance} bestFor3+=${c.bestFor3} disclaimer=${c.disclaimer} faq=${c.faqSchema} faq5+=${c.faq5} links=${c.internalLinks}`);
  }
}

run();
