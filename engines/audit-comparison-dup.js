#!/usr/bin/env node
/**
 * audit-comparison-dup.js
 *
 * PART A: Audits all vs-*.html comparison pages for depth metrics.
 * PART B: Runs a Jaccard trigram similarity scan across same-type commercial pages.
 *
 * Output: /opt/build/repo/data/comparison-dup-audit.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMERCIAL_DIR = path.resolve(__dirname, '..', 'commercial');
const OUTPUT_FILE = path.resolve(__dirname, '..', 'data', 'comparison-dup-audit.json');

// ─── Helpers ────────────────────────────────────────────────────────────────

function stripHtml(html) {
  // Remove script/style blocks entirely
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&mdash;/g, '-')
    .replace(/&ndash;/g, '-')
    .replace(/&rsaquo;/g, '>')
    .replace(/&bull;/g, ' ')
    .replace(/&rarr;/g, '->')
    .replace(/&larr;/g, '<-')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '(c)');
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function wordCount(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

function getWordTrigrams(text) {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const trigrams = new Set();
  for (let i = 0; i < words.length - 2; i++) {
    trigrams.add(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]);
  }
  return trigrams;
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  // Iterate over the smaller set for efficiency
  const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
  for (const item of smaller) {
    if (larger.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function findHtmlFilesRecursive(dir, pattern) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findHtmlFilesRecursive(fullPath, pattern));
    } else if (entry.isFile() && pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── PART A: Comparison Page Depth ──────────────────────────────────────────

function auditComparisonPages() {
  console.log('=== PART A: Comparison Page Depth Audit ===');
  const vsFiles = findHtmlFilesRecursive(COMMERCIAL_DIR, /^vs-.*\.html$/);
  console.log(`Found ${vsFiles.length} vs-*.html files`);

  let totalWordCount = 0;
  let withComparisonTable = 0;
  let withThreePlusFactors = 0;
  let withWhoShouldChoose = 0;

  for (const filePath of vsFiles) {
    const html = fs.readFileSync(filePath, 'utf-8');
    const text = stripHtml(html);
    totalWordCount += wordCount(text);

    // Check for comparison table: look for a table that has two entity column headers
    // The pattern is: <table class="comparison-table"> with <th> headers like Factor, Entity1, Entity2
    const comparisonTableRegex = /<table[^>]*class="comparison-table"[^>]*>[\s\S]*?<tr>\s*<th>Factor<\/th>\s*<th>[^<]+<\/th>\s*<th>[^<]+<\/th>\s*<\/tr>([\s\S]*?)<\/table>/i;
    const tableMatch = html.match(comparisonTableRegex);

    if (tableMatch) {
      withComparisonTable++;

      // Count decision factor rows (non-header <tr> rows in the comparison table)
      const tableBody = tableMatch[1];
      const rowMatches = tableBody.match(/<tr>/gi);
      const factorCount = rowMatches ? rowMatches.length : 0;

      if (factorCount >= 3) {
        withThreePlusFactors++;
      }
    }

    // Check for "who should choose" section
    // Patterns: "Who should choose", "Which is right for you", "Which Should You Choose", "Choose X If..."
    const whoShouldChooseRegex = /who\s+should\s+choose|which\s+is\s+right\s+for\s+you|which\s+should\s+you\s+choose|<h2>\s*Choose\s+[^<]+\s+If/i;
    if (whoShouldChooseRegex.test(html)) {
      withWhoShouldChoose++;
    }
  }

  const total = vsFiles.length;
  const avgWordCount = total > 0 ? Math.round(totalWordCount / total) : 0;
  const pctWithComparisonTable = total > 0 ? Math.round((withComparisonTable / total) * 1000) / 10 : 0;
  const pctWithThreePlusFactors = total > 0 ? Math.round((withThreePlusFactors / total) * 1000) / 10 : 0;
  const pctWithWhoShouldChoose = total > 0 ? Math.round((withWhoShouldChoose / total) * 1000) / 10 : 0;

  const result = {
    total,
    avg_word_count: avgWordCount,
    pct_with_comparison_table: pctWithComparisonTable,
    pct_with_3plus_factors: pctWithThreePlusFactors,
    pct_with_who_should_choose: pctWithWhoShouldChoose
  };

  console.log(`  Total vs pages: ${total}`);
  console.log(`  Avg word count: ${avgWordCount}`);
  console.log(`  % with comparison table: ${pctWithComparisonTable}%`);
  console.log(`  % with 3+ decision factors: ${pctWithThreePlusFactors}%`);
  console.log(`  % with who-should-choose section: ${pctWithWhoShouldChoose}%`);

  return result;
}

// ─── PART B: Duplication Similarity ─────────────────────────────────────────

function auditDuplication() {
  console.log('\n=== PART B: Duplication Similarity Scan ===');

  // Collect all non-vs HTML files, grouped by page type
  const allFiles = findHtmlFilesRecursive(COMMERCIAL_DIR, /^(?!vs-).*\.html$/);
  const byType = {};

  for (const filePath of allFiles) {
    const basename = path.basename(filePath, '.html');
    if (!byType[basename]) {
      byType[basename] = [];
    }
    byType[basename].push(filePath);
  }

  console.log(`Found ${Object.keys(byType).length} page types: ${Object.keys(byType).join(', ')}`);

  const SAMPLE_SIZE = 20;
  const duplicationByType = {};

  for (const [pageType, files] of Object.entries(byType)) {
    console.log(`\nProcessing type: ${pageType} (${files.length} pages)`);

    // Sample up to 20 random pages
    const sampled = files.length <= SAMPLE_SIZE ? files : shuffleArray(files).slice(0, SAMPLE_SIZE);
    const actualSampleSize = sampled.length;

    console.log(`  Sampled ${actualSampleSize} pages`);

    // Extract trigrams for each sampled page
    const trigramSets = [];
    for (const fp of sampled) {
      const html = fs.readFileSync(fp, 'utf-8');
      const text = stripHtml(html);
      trigramSets.push({
        file: path.relative(COMMERCIAL_DIR, fp),
        trigrams: getWordTrigrams(text)
      });
    }

    // Compare all pairs
    let highestSim = 0;
    let highestPair = ['', ''];
    let totalSim = 0;
    let pairCount = 0;

    for (let i = 0; i < trigramSets.length; i++) {
      for (let j = i + 1; j < trigramSets.length; j++) {
        const sim = jaccardSimilarity(trigramSets[i].trigrams, trigramSets[j].trigrams);
        totalSim += sim;
        pairCount++;

        if (sim > highestSim) {
          highestSim = sim;
          highestPair = [trigramSets[i].file, trigramSets[j].file];
        }
      }
    }

    const avgSim = pairCount > 0 ? totalSim / pairCount : 0;

    duplicationByType[pageType] = {
      sample_size: actualSampleSize,
      highest_similarity_pct: Math.round(highestSim * 1000) / 10,
      avg_similarity_pct: Math.round(avgSim * 1000) / 10,
      highest_pair: highestPair
    };

    console.log(`  Highest similarity: ${(highestSim * 100).toFixed(1)}% between ${highestPair[0]} and ${highestPair[1]}`);
    console.log(`  Average similarity: ${(avgSim * 100).toFixed(1)}%`);
  }

  return { by_type: duplicationByType };
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log('Starting Comparison & Duplication Audit...\n');

  const comparisonPages = auditComparisonPages();
  const duplication = auditDuplication();

  const output = {
    comparison_pages: comparisonPages,
    duplication: duplication
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nResults written to ${OUTPUT_FILE}`);
}

main();
