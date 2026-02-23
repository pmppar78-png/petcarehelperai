#!/usr/bin/env node
/**
 * audit-word-counts.js
 * Recursively scans all .html files under /opt/build/repo/commercial/,
 * strips HTML tags, counts words, categorizes pages by type, and
 * outputs a comprehensive JSON report to /opt/build/repo/data/word-count-audit.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMERCIAL_DIR = path.resolve(__dirname, '..', 'commercial');
const OUTPUT_FILE = path.resolve(__dirname, '..', 'data', 'word-count-audit.json');

// ── Helpers ──────────────────────────────────────────────────────────

function findHtmlFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

function stripHtmlAndCountWords(html) {
  // Remove script and style blocks entirely
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&bull;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/&\w+;/g, ' ');
  // Split by whitespace and filter empty strings
  const words = text.split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

function categorizeFile(filePath) {
  const basename = path.basename(filePath, '.html');
  if (basename.startsWith('vs-')) return 'vs';
  const knownTypes = [
    'best-food',
    'best-insurance',
    'cost-to-own',
    'health-costs',
    'first-time-owners',
    'best-habitat-size',
    'best-enrichment',
  ];
  if (knownTypes.includes(basename)) return basename;
  // Fallback
  return 'other';
}

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function avg(arr) {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

// ── Main ─────────────────────────────────────────────────────────────

console.log(`Scanning ${COMMERCIAL_DIR} for .html files...`);
const files = findHtmlFiles(COMMERCIAL_DIR);
console.log(`Found ${files.length} HTML files.`);

const pageData = []; // { file, wordCount, type }
const byType = {};   // type -> [ wordCount, ... ]

for (const filePath of files) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const wc = stripHtmlAndCountWords(html);
  const type = categorizeFile(filePath);
  const relPath = path.relative(path.resolve(__dirname, '..'), filePath);

  pageData.push({ file: relPath, wordCount: wc, type });

  if (!byType[type]) byType[type] = [];
  byType[type].push({ file: relPath, wordCount: wc });
}

// Sort for global min/max
pageData.sort((a, b) => a.wordCount - b.wordCount);

const allCounts = pageData.map(p => p.wordCount);

// Buckets
const pagesUnder700 = pageData.filter(p => p.wordCount < 700);
const pagesUnder800 = pageData.filter(p => p.wordCount < 800);
const pages800to1200 = pageData.filter(p => p.wordCount >= 800 && p.wordCount <= 1200);
const pages1200to1800 = pageData.filter(p => p.wordCount > 1200 && p.wordCount <= 1800);
const pagesAbove1800 = pageData.filter(p => p.wordCount > 1800);

// Comparison pages (vs-*) stats
const vsPages = pageData.filter(p => p.type === 'vs');
const vsCounts = vsPages.map(p => p.wordCount);

// Breakdown by type
const breakdownByType = {};
for (const [type, entries] of Object.entries(byType)) {
  const counts = entries.map(e => e.wordCount);
  counts.sort((a, b) => a - b);
  breakdownByType[type] = {
    count: entries.length,
    min: counts[0],
    max: counts[counts.length - 1],
    avg: avg(counts),
    median: median(counts),
  };
}

const report = {
  generated: new Date().toISOString().split('T')[0],
  total_pages: pageData.length,
  min_word_count: {
    count: pageData[0].wordCount,
    file: pageData[0].file,
  },
  max_word_count: {
    count: pageData[pageData.length - 1].wordCount,
    file: pageData[pageData.length - 1].file,
  },
  average_word_count: avg(allCounts),
  median_word_count: median(allCounts),
  pages_under_700: pagesUnder700.length,
  pages_under_800: pagesUnder800.length,
  pages_800_to_1200: pages800to1200.length,
  pages_1200_to_1800: pages1200to1800.length,
  pages_above_1800: pagesAbove1800.length,
  breakdown_by_type: breakdownByType,
  comparison_pages_stats: {
    count: vsPages.length,
    avg_word_count: avg(vsCounts),
  },
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2), 'utf-8');
console.log(`Report written to ${OUTPUT_FILE}`);
console.log(JSON.stringify(report, null, 2));
