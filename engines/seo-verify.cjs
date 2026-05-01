#!/usr/bin/env node
/**
 * Comprehensive SEO verification on the static site.
 * Outputs aggregate counts and any specific failures.
 */
const fs = require('fs');
const path = require('path');

const ROOT = '/opt/build/repo';
const ORIGIN = 'https://petcarehelperai.com';
const SKIP_DIRS = new Set([
  'node_modules', '.netlify', '.git', 'embed', 'audit', 'engines',
  'test-results', 'netlify', 'data', 'feeds',
]);

function walk(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.well-known') continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, list);
    else if (entry.isFile() && entry.name.endsWith('.html')) list.push(full);
  }
  return list;
}

function fileToUrl(file) {
  let p = file.replace(ROOT, '').replace(/\\/g, '/');
  p = p.replace(/\/index\.html$/, '/');
  if (p.endsWith('.html')) p = p.replace(/\.html$/, '');
  return ORIGIN + p;
}

function getMeta(html, name) {
  const m = html.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]+)"`, 'i'));
  return m ? m[1] : null;
}
function getTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : null;
}
function getCanonical(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return m ? m[1] : null;
}
function isNoindex(html) {
  return /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
}
function hasBreadcrumbList(html) {
  return /"@type"\s*:\s*"BreadcrumbList"/.test(html);
}
function hasArticle(html) {
  return /"@type"\s*:\s*"Article"/.test(html);
}

const files = walk(ROOT);
const stats = {
  total: files.length,
  withBreadcrumbList: 0,
  withArticle: 0,
  withCanonical: 0,
  withSelfCanonical: 0,
  withTitle: 0,
  withDesc: 0,
  noindex: 0,
  uniqueTitles: 0,
  uniqueDescriptions: 0,
  selfCanonicalMismatches: [],
  missingTitles: [],
  missingDescriptions: [],
  missingCanonical: [],
};

const titleSet = new Map();
const descSet = new Map();
const canonicalSet = new Map();

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const url = fileToUrl(f);
  const title = getTitle(html);
  const desc = getMeta(html, 'description');
  const canonical = getCanonical(html);
  const noindex = isNoindex(html);

  if (hasBreadcrumbList(html)) stats.withBreadcrumbList++;
  if (hasArticle(html)) stats.withArticle++;
  if (canonical) stats.withCanonical++;
  if (canonical === url) stats.withSelfCanonical++;
  else if (canonical && !noindex && stats.selfCanonicalMismatches.length < 25) {
    stats.selfCanonicalMismatches.push({ file: f.replace(ROOT, ''), expected: url, actual: canonical });
  }
  if (title) {
    stats.withTitle++;
    titleSet.set(title, (titleSet.get(title) || 0) + 1);
  } else if (!noindex && stats.missingTitles.length < 20) stats.missingTitles.push(f.replace(ROOT, ''));
  if (desc) {
    stats.withDesc++;
    descSet.set(desc, (descSet.get(desc) || 0) + 1);
  } else if (!noindex && stats.missingDescriptions.length < 20) stats.missingDescriptions.push(f.replace(ROOT, ''));
  if (!canonical && !noindex && stats.missingCanonical.length < 20) stats.missingCanonical.push(f.replace(ROOT, ''));
  if (noindex) stats.noindex++;
  if (canonical) canonicalSet.set(canonical, (canonicalSet.get(canonical) || 0) + 1);
}

stats.uniqueTitles = titleSet.size;
stats.uniqueDescriptions = descSet.size;
const dupTitles = [...titleSet.entries()].filter(([_, c]) => c > 1).length;
const dupDescs = [...descSet.entries()].filter(([_, c]) => c > 1).length;
stats.duplicateTitleCount = dupTitles;
stats.duplicateDescriptionCount = dupDescs;

// Sitemap audit
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
stats.sitemapUrlCount = sitemapUrls.length;

const fileUrlSet = new Set(files.map(fileToUrl));
const missingFromDisk = sitemapUrls.filter(u => !fileUrlSet.has(u));
stats.sitemapUrlsMissingOnDisk = missingFromDisk.slice(0, 20);
stats.sitemapUrlsMissingOnDiskCount = missingFromDisk.length;

// Sitemap should not contain noindex pages
const noindexUrls = new Set();
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  if (isNoindex(html)) noindexUrls.add(fileToUrl(f));
}
const noindexInSitemap = sitemapUrls.filter(u => noindexUrls.has(u));
stats.noindexInSitemap = noindexInSitemap;

// Look for indexable disk pages NOT in sitemap (orphans)
const sitemapSet = new Set(sitemapUrls);
const orphans = [];
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  if (isNoindex(html)) continue;
  const url = fileToUrl(f);
  if (!sitemapSet.has(url)) orphans.push({ file: f.replace(ROOT, ''), url });
}
stats.indexableOrphanCount = orphans.length;
stats.indexableOrphans = orphans.slice(0, 30);

console.log(JSON.stringify(stats, null, 2));
fs.writeFileSync(path.join(ROOT, 'engines', 'seo-verify-report.json'), JSON.stringify(stats, null, 2), 'utf8');
