#!/usr/bin/env node
/**
 * Fix remaining duplicate og:url tags and stale 2024 year references
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');

function fixDuplicateOgUrl(html) {
  let count = 0;
  html = html.replace(/<meta property="og:url"[^>]*>/g, (match) => {
    count++;
    return count <= 1 ? match : '';
  });
  return html;
}

function fixYear2024(html) {
  html = html.replace(/Breed Guide 2024/g, 'Breed Guide 2026');
  html = html.replace(/Complete Guide 2024/g, 'Complete Guide 2026');
  html = html.replace(/Care Guide 2024/g, 'Care Guide 2026');
  return html;
}

// Process specific directories that were missed
const dirs = ['resources', 'tools'];
let fixedCount = 0;

for (const d of dirs) {
  const dir = join(ROOT, d);
  if (!existsSync(dir)) continue;
  const files = readdirSync(dir).filter(f => f.endsWith('.html'));
  for (const file of files) {
    const filePath = join(dir, file);
    let html = readFileSync(filePath, 'utf8');
    const original = html;
    html = fixDuplicateOgUrl(html);
    html = fixYear2024(html);
    if (html !== original) {
      writeFileSync(filePath, html);
      fixedCount++;
    }
  }
}

// Fix locations/index.html
const locIndex = join(ROOT, 'locations', 'index.html');
if (existsSync(locIndex)) {
  let html = readFileSync(locIndex, 'utf8');
  const original = html;
  html = fixDuplicateOgUrl(html);
  if (html !== original) {
    writeFileSync(locIndex, html);
    fixedCount++;
  }
}

// Fix breed index pages
for (const d of ['dog-breeds', 'cat-breeds']) {
  const indexPath = join(ROOT, 'breeds', d + '.html');
  if (existsSync(indexPath)) {
    let html = readFileSync(indexPath, 'utf8');
    const original = html;
    html = fixDuplicateOgUrl(html);
    html = fixYear2024(html);
    if (html !== original) {
      writeFileSync(indexPath, html);
      fixedCount++;
    }
  }
}

// Also fix breed index files in guides
const guidesDir = join(ROOT, 'guides');
for (const file of ['dog-breeds.html', 'cat-breeds.html']) {
  const filePath = join(guidesDir, file);
  if (existsSync(filePath)) {
    let html = readFileSync(filePath, 'utf8');
    const original = html;
    html = fixDuplicateOgUrl(html);
    html = fixYear2024(html);
    if (html !== original) {
      writeFileSync(filePath, html);
      fixedCount++;
    }
  }
}

// Sweep all breed pages for remaining 2024 year references
function processDir(dir) {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.git', '.netlify'].includes(entry.name)) {
      processDir(fullPath);
    } else if (entry.name.endsWith('.html')) {
      let html = readFileSync(fullPath, 'utf8');
      const original = html;
      html = fixYear2024(html);
      html = fixDuplicateOgUrl(html);
      if (html !== original) {
        writeFileSync(fullPath, html);
        fixedCount++;
      }
    }
  }
}

processDir(join(ROOT, 'breeds'));

console.log(`Fixed ${fixedCount} files`);
