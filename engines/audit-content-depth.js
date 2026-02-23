#!/usr/bin/env node
/**
 * audit-content-depth.js
 * Scans ALL commercial pages and produces:
 *   audit/content-depth.csv        — one row per page
 *   audit/content-depth-summary.json — aggregate stats
 *   audit/content-depth-report.md   — human-readable report
 *
 * Metrics per page:
 *   word_count, unique_word_count, shingle_similarity (5-gram Jaccard
 *   vs rolling sample per page_type), best_for_section_count, page_type, entity
 *
 * Thresholds (PASS / FAIL):
 *   - Non-comparison pages: >= 1200 words
 *   - Comparison pages:     >= 1500 words
 *   - Median similarity per page_type <= 55 %
 *   - No page_type may have > 20 % of pages above 70 % similarity
 *   - >= 3 "best for" sections on 90 %+ of pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..');
const COMM_DIR   = path.join(ROOT, 'commercial');
const AUDIT_DIR  = path.join(ROOT, 'audit');
const LOG_FILE   = path.join(AUDIT_DIR, 'progress.log');

if (!fs.existsSync(AUDIT_DIR)) fs.mkdirSync(AUDIT_DIR, { recursive: true });

// ── Helpers ─────────────────────────────────────────────────────────

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function findHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findHtmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) results.push(full);
  }
  return results;
}

/** Strip header, nav, footer, script, style, breadcrumb → visible main text */
function extractMainText(html) {
  let t = html;
  // Remove everything before <main>
  t = t.replace(/[\s\S]*?<main[^>]*>/i, '');
  // Remove everything after </main>
  t = t.replace(/<\/main>[\s\S]*/i, '');
  // Remove breadcrumb
  t = t.replace(/<div class="breadcrumb">[\s\S]*?<\/div>/gi, '');
  // Remove nav
  t = t.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  // Remove script and style blocks
  t = t.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  t = t.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  // Remove JSON-LD
  t = t.replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, ' ');
  // Strip all tags
  t = t.replace(/<[^>]+>/g, ' ');
  // Decode entities
  t = t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
       .replace(/&bull;/g, ' ').replace(/&mdash;/g, ' ').replace(/&rsaquo;/g, ' ')
       .replace(/&larr;/g, ' ').replace(/&rarr;/g, ' ')
       .replace(/&#\d+;/g, ' ').replace(/&\w+;/g, ' ');
  return t;
}

function getWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0);
}

function getShingles(words, n) {
  const shingles = new Set();
  for (let i = 0; i <= words.length - n; i++) {
    shingles.add(words.slice(i, i + n).join(' ').toLowerCase());
  }
  return shingles;
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  const smaller = setA.size <= setB.size ? setA : setB;
  const larger  = setA.size <= setB.size ? setB : setA;
  for (const item of smaller) {
    if (larger.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function categorize(filePath) {
  const base = path.basename(filePath, '.html');
  if (base.startsWith('vs-')) return 'comparison';
  const types = ['best-food','best-insurance','cost-to-own','health-costs',
                 'first-time-owners','best-habitat-size','best-enrichment'];
  return types.includes(base) ? base : 'other';
}

function entitySlug(filePath) {
  const rel = path.relative(COMM_DIR, filePath);
  const parts = rel.split(path.sep);
  return parts.length >= 2 ? parts[1] : 'unknown';
}

function speciesGroup(filePath) {
  const rel = path.relative(COMM_DIR, filePath);
  return rel.split(path.sep)[0] || 'unknown';
}

function countBestForSections(html) {
  // Count h2/h3 elements whose text contains "best for" or "best overall" or "best budget" etc.
  const headings = html.match(/<h[23][^>]*>[\s\S]*?<\/h[23]>/gi) || [];
  let count = 0;
  for (const h of headings) {
    const text = h.replace(/<[^>]+>/g, '').toLowerCase();
    if (text.includes('best for') || text.includes('best overall') ||
        text.includes('best budget') || text.includes('best premium') ||
        text.includes('best by category') || text.includes('best value') ||
        text.includes('ideal for') || text.includes('recommended for') ||
        text.includes('top pick')) {
      count++;
    }
  }
  // Also count list items with "Best ..." pattern
  const bestItems = html.match(/<li[^>]*>\s*<strong>\s*Best\s/gi) || [];
  count += bestItems.length;
  return count;
}

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function avg(arr) {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

// ── Main ────────────────────────────────────────────────────────────

log('Starting content-depth audit...');
const allFiles = findHtmlFiles(COMM_DIR);
log(`Found ${allFiles.length} commercial HTML files.`);

const BATCH = 100;
const rows = []; // CSV rows
const rollingSamples = {}; // page_type -> array of shingle sets (max 10)

for (let i = 0; i < allFiles.length; i += BATCH) {
  const batch = allFiles.slice(i, i + BATCH);
  for (const filePath of batch) {
    const html = fs.readFileSync(filePath, 'utf-8');
    const mainText = extractMainText(html);
    const words = getWords(mainText);
    const wordCount = words.length;
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const uniqueWordCount = uniqueWords.size;
    const pageType = categorize(filePath);
    const entity = entitySlug(filePath);
    const group = speciesGroup(filePath);
    const bestForCount = countBestForSections(html);

    // Shingle similarity
    const shingles = getShingles(words, 5);
    if (!rollingSamples[pageType]) rollingSamples[pageType] = [];
    const sample = rollingSamples[pageType];
    let simScore = 0;
    if (sample.length > 0) {
      let totalSim = 0;
      for (const s of sample) totalSim += jaccardSimilarity(shingles, s);
      simScore = totalSim / sample.length;
    }
    // Maintain rolling sample of 10
    sample.push(shingles);
    if (sample.length > 10) sample.shift();

    const relPath = path.relative(ROOT, filePath);
    rows.push({
      species_group: group,
      entity_slug: entity,
      page_type: pageType,
      file_path: relPath,
      word_count: wordCount,
      unique_word_count: uniqueWordCount,
      similarity_score: Math.round(simScore * 10000) / 100, // percentage
      best_for_sections: bestForCount,
    });
  }
  log(`Processed ${Math.min(i + BATCH, allFiles.length)} / ${allFiles.length} pages`);
}

// ── Compute aggregates ──────────────────────────────────────────────

const byType = {};
for (const r of rows) {
  if (!byType[r.page_type]) byType[r.page_type] = [];
  byType[r.page_type].push(r);
}

const allWC = rows.map(r => r.word_count);
const allSim = rows.map(r => r.similarity_score);

const typeSummaries = {};
let overallPass = true;
const failReasons = [];

for (const [type, typeRows] of Object.entries(byType)) {
  const wcs = typeRows.map(r => r.word_count);
  const sims = typeRows.map(r => r.similarity_score);
  const bestFors = typeRows.map(r => r.best_for_sections);
  const isComparison = type === 'comparison';
  const minThreshold = isComparison ? 1500 : 1200;

  const passingWordCount = wcs.filter(w => w >= minThreshold).length;
  const pctPassing = (passingWordCount / wcs.length) * 100;

  const medianSim = median(sims);
  const above70 = sims.filter(s => s > 70).length;
  const pctAbove70 = (above70 / sims.length) * 100;

  const pagesWithBestFor3 = bestFors.filter(b => b >= 3).length;
  const pctBestFor = (pagesWithBestFor3 / bestFors.length) * 100;

  let typePass = true;
  const typeFailReasons = [];

  if (pctPassing < 100) {
    typePass = false;
    typeFailReasons.push(`${(100 - pctPassing).toFixed(1)}% pages below ${minThreshold} word threshold`);
  }
  if (medianSim > 55) {
    typePass = false;
    typeFailReasons.push(`Median similarity ${medianSim.toFixed(1)}% > 55%`);
  }
  if (pctAbove70 > 20) {
    typePass = false;
    typeFailReasons.push(`${pctAbove70.toFixed(1)}% pages above 70% similarity (max 20%)`);
  }
  if (pctBestFor < 90 && type !== 'comparison') {
    typePass = false;
    typeFailReasons.push(`Only ${pctBestFor.toFixed(1)}% pages have >=3 best-for sections (need 90%)`);
  }

  if (!typePass) {
    overallPass = false;
    failReasons.push(`${type}: ${typeFailReasons.join('; ')}`);
  }

  typeSummaries[type] = {
    count: typeRows.length,
    word_count: {
      min: Math.min(...wcs),
      max: Math.max(...wcs),
      avg: Math.round(avg(wcs)),
      median: Math.round(median(wcs)),
    },
    unique_word_count: {
      avg: Math.round(avg(typeRows.map(r => r.unique_word_count))),
    },
    similarity: {
      min: Math.round(Math.min(...sims) * 100) / 100,
      max: Math.round(Math.max(...sims) * 100) / 100,
      avg: Math.round(avg(sims) * 100) / 100,
      median: Math.round(medianSim * 100) / 100,
      pct_above_70: Math.round(pctAbove70 * 100) / 100,
    },
    best_for_sections: {
      avg: Math.round(avg(bestFors) * 100) / 100,
      pct_with_3_plus: Math.round(pctBestFor * 100) / 100,
    },
    threshold: isComparison ? 1500 : 1200,
    pct_meeting_threshold: Math.round(pctPassing * 100) / 100,
    pass: typePass,
    fail_reasons: typeFailReasons,
  };
}

// ── Write CSV ───────────────────────────────────────────────────────

const csvHeader = 'species_group,entity_slug,page_type,file_path,word_count,unique_word_count,similarity_score,best_for_sections';
const csvLines = rows.map(r =>
  `${r.species_group},${r.entity_slug},${r.page_type},${r.file_path},${r.word_count},${r.unique_word_count},${r.similarity_score},${r.best_for_sections}`
);
fs.writeFileSync(path.join(AUDIT_DIR, 'content-depth.csv'),
  csvHeader + '\n' + csvLines.join('\n'), 'utf-8');
log('Wrote audit/content-depth.csv');

// ── Write JSON summary ──────────────────────────────────────────────

const summary = {
  generated: new Date().toISOString(),
  total_pages: rows.length,
  overall_pass: overallPass,
  overall_fail_reasons: failReasons,
  word_count_global: {
    min: Math.min(...allWC),
    max: Math.max(...allWC),
    avg: Math.round(avg(allWC)),
    median: Math.round(median(allWC)),
  },
  similarity_global: {
    avg: Math.round(avg(allSim) * 100) / 100,
    median: Math.round(median(allSim) * 100) / 100,
  },
  by_page_type: typeSummaries,
};
fs.writeFileSync(path.join(AUDIT_DIR, 'content-depth-summary.json'),
  JSON.stringify(summary, null, 2), 'utf-8');
log('Wrote audit/content-depth-summary.json');

// ── Write MD report ─────────────────────────────────────────────────

// Pick 20 random example pages
const shuffled = [...rows].sort(() => Math.random() - 0.5);
const examples = shuffled.slice(0, 20);

let md = `# Content Depth Audit Report\n\n`;
md += `**Generated:** ${new Date().toISOString()}\n\n`;
md += `## Overall Result: ${overallPass ? 'PASS ✅' : 'FAIL ❌'}\n\n`;
md += `**Total pages scanned:** ${rows.length}\n\n`;

if (!overallPass) {
  md += `### Failure Reasons\n`;
  for (const r of failReasons) md += `- ${r}\n`;
  md += `\n`;
}

md += `## Global Word Count Stats\n\n`;
md += `| Metric | Value |\n|--------|-------|\n`;
md += `| Min | ${summary.word_count_global.min} |\n`;
md += `| Max | ${summary.word_count_global.max} |\n`;
md += `| Average | ${summary.word_count_global.avg} |\n`;
md += `| Median | ${summary.word_count_global.median} |\n\n`;

md += `## Stats by Page Type\n\n`;
md += `| Page Type | Count | Min WC | Avg WC | Median WC | Max WC | Threshold | % Meeting | Med Sim | % >70% Sim | Avg Best-For | PASS |\n`;
md += `|-----------|-------|--------|--------|-----------|--------|-----------|-----------|---------|------------|--------------|------|\n`;
for (const [type, s] of Object.entries(typeSummaries)) {
  md += `| ${type} | ${s.count} | ${s.word_count.min} | ${s.word_count.avg} | ${s.word_count.median} | ${s.word_count.max} | ${s.threshold} | ${s.pct_meeting_threshold}% | ${s.similarity.median}% | ${s.similarity.pct_above_70}% | ${s.best_for_sections.avg} | ${s.pass ? 'PASS' : 'FAIL'} |\n`;
}

md += `\n## 20 Example Pages\n\n`;
md += `| # | File | Page Type | Word Count | Unique Words | Similarity | Best-For Sections |\n`;
md += `|---|------|-----------|------------|--------------|------------|-------------------|\n`;
examples.forEach((e, i) => {
  md += `| ${i + 1} | ${e.file_path} | ${e.page_type} | ${e.word_count} | ${e.unique_word_count} | ${e.similarity_score}% | ${e.best_for_sections} |\n`;
});

md += `\n## Conclusion\n\n`;
if (overallPass) {
  md += `All thresholds met. Content depth is sufficient across all page types.\n`;
} else {
  md += `Content depth audit **FAILED**. The following issues must be addressed:\n\n`;
  for (const r of failReasons) md += `- ${r}\n`;
  md += `\nPhase B content expansion is required.\n`;
}

fs.writeFileSync(path.join(AUDIT_DIR, 'content-depth-report.md'), md, 'utf-8');
log('Wrote audit/content-depth-report.md');
log(`Audit complete. Result: ${overallPass ? 'PASS' : 'FAIL'}`);
log(`Total pages: ${rows.length}, Avg WC: ${summary.word_count_global.avg}, Median WC: ${summary.word_count_global.median}`);
