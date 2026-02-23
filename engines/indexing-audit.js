#!/usr/bin/env node
/**
 * indexing-audit.js - Full indexing crawl and QA for PetCareHelperAI
 *
 * Checks:
 * - 200-equivalent presence (sitemap URLs must map to files)
 * - No unintended noindex/nofollow on indexable pages
 * - Canonical exists and aligns to expected URL
 * - No duplicate canonicals
 * - Sitemap aligns to indexable URLs (no extras, no missing)
 * - robots.txt conflicts (disallow)
 * - Orphaned indexable pages (missing from sitemap)
 *
 * Run: node engines/indexing-audit.js
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE_DIR = join(__dirname, '..');
const SITE = 'https://petcarehelperai.com';

const EXCLUDE_DIRS = new Set(['node_modules', '.netlify', 'engines', '.git']);
const EXCLUDE_PATH_PREFIXES = ['embed/', 'feeds/'];
const EXCLUDE_FILES = new Set(['404.html', 'styles.css.html']);

function collectHtmlFiles(dir) {
  const results = [];
  let entries = [];
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

function fileToUrlPath(filePath) {
  const rel = relative(BASE_DIR, filePath).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) {
    const dir = rel.slice(0, -'/index.html'.length);
    return `/${dir}/`;
  }
  return '/' + rel.replace(/\.html$/, '');
}

function extractCanonical(html) {
  const m = html.match(/<link\s+rel=["']canonical["']\s+href=["']([\s\S]*?)["']\s*\/?>/i);
  return m ? m[1].trim() : '';
}

function extractRobotsMeta(html) {
  const m = html.match(/<meta\s+name=["']robots["']\s+content=["']([\s\S]*?)["']\s*\/?>/i);
  if (m) return m[1].toLowerCase();
  const m2 = html.match(/<meta\s+content=["']([\s\S]*?)["']\s+name=["']robots["']\s*\/?>/i);
  return m2 ? m2[1].toLowerCase() : '';
}

function isExcluded(rel) {
  if (EXCLUDE_FILES.has(rel)) return true;
  return EXCLUDE_PATH_PREFIXES.some(prefix => rel.startsWith(prefix));
}

function parseSitemapLocs(xml) {
  const locs = new Set();
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    locs.add(m[1].trim());
  }
  return locs;
}

function parseRobotsDisallow(txt) {
  const disallow = [];
  const lines = txt.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(':').map(p => p.trim());
    if (parts.length >= 2 && parts[0].toLowerCase() === 'disallow') {
      disallow.push(parts.slice(1).join(':'));
    }
  }
  return disallow.filter(p => p !== '');
}

function urlToFilePath(url) {
  if (!url.startsWith(SITE)) return null;
  let path = url.slice(SITE.length);
  if (path === '') path = '/';
  if (path === '/') return join(BASE_DIR, 'index.html');
  if (path.endsWith('/')) {
    return join(BASE_DIR, path.slice(1), 'index.html');
  }
  return join(BASE_DIR, path.slice(1) + '.html');
}

function runAudit() {
  const allFiles = collectHtmlFiles(BASE_DIR);

  const indexable = [];
  const issues = [];
  const canonicalMap = new Map();
  const sitemapPath = join(BASE_DIR, 'sitemap.xml');
  const sitemapLocs = existsSync(sitemapPath)
    ? parseSitemapLocs(readFileSync(sitemapPath, 'utf-8'))
    : new Set();

  const robotsPath = join(BASE_DIR, 'robots.txt');
  const disallow = existsSync(robotsPath)
    ? parseRobotsDisallow(readFileSync(robotsPath, 'utf-8'))
    : [];

  for (const filePath of allFiles) {
    const rel = relative(BASE_DIR, filePath).replace(/\\/g, '/');
    if (isExcluded(rel)) continue;

    let html;
    try {
      html = readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }

    const robots = extractRobotsMeta(html);
    const hasNoindex = robots.includes('noindex');
    const hasNofollow = robots.includes('nofollow');

    const urlPath = fileToUrlPath(filePath);
    const expectedCanonical = SITE + (urlPath === '/' ? '/' : urlPath);

    if (hasNoindex) {
      issues.push({ type: 'unintended-noindex', file: rel });
      continue;
    }

    if (hasNofollow) {
      issues.push({ type: 'unintended-nofollow', file: rel });
    }

    const canonical = extractCanonical(html);
    if (!canonical) {
      issues.push({ type: 'missing-canonical', file: rel });
    } else if (canonical !== expectedCanonical) {
      issues.push({ type: 'canonical-misalignment', file: rel, canonical, expected: expectedCanonical });
    }

    if (canonical) {
      const list = canonicalMap.get(canonical) || [];
      list.push(rel);
      canonicalMap.set(canonical, list);
    }

    indexable.push({ rel, filePath, urlPath, canonical: canonical || expectedCanonical });
  }

  // Duplicate canonical conflicts
  for (const [canon, files] of canonicalMap.entries()) {
    if (files.length > 1) {
      issues.push({ type: 'duplicate-canonical', canonical: canon, files });
    }
  }

  // Sitemap alignment and 200-equivalent file presence
  const indexableUrls = new Set(indexable.map(p => SITE + (p.urlPath === '/' ? '/' : p.urlPath)));

  for (const url of indexableUrls) {
    if (!sitemapLocs.has(url)) {
      issues.push({ type: 'missing-from-sitemap', url });
    }
  }

  for (const url of sitemapLocs) {
    const filePath = urlToFilePath(url);
    if (!filePath || !existsSync(filePath)) {
      issues.push({ type: 'sitemap-url-404', url });
      continue;
    }
    const rel = relative(BASE_DIR, filePath).replace(/\\/g, '/');
    if (isExcluded(rel)) {
      issues.push({ type: 'sitemap-url-nonindexable', url });
    }
  }

  // Robots.txt conflicts
  if (disallow.length > 0) {
    for (const url of indexableUrls) {
      const path = url.replace(SITE, '');
      for (const rule of disallow) {
        if (rule === '/' && path.startsWith('/')) {
          issues.push({ type: 'robots-disallow', url, rule });
        } else if (rule !== '/' && rule !== '' && path.startsWith(rule)) {
          issues.push({ type: 'robots-disallow', url, rule });
        }
      }
    }
  }

  return {
    totalCrawled: indexable.length,
    totalIssues: issues.length,
    issues
  };
}

const result = runAudit();
console.log(JSON.stringify(result, null, 2));
