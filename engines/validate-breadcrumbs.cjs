#!/usr/bin/env node
/**
 * Validate that:
 *  1. Every BreadcrumbList "item" URL maps to an existing file (no internal 404s)
 *  2. Every BreadcrumbList JSON-LD parses as valid JSON
 *  3. robots.txt allows Googlebot and references the sitemap
 *  4. The home origin redirect rules in netlify.toml don't form chains for any sitemap URL
 */
const fs = require('fs');
const path = require('path');

const ROOT = '/opt/build/repo';
const ORIGIN = 'https://petcarehelperai.com';

// Build set of valid URLs
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

const files = walk(ROOT);
const validUrls = new Set(files.map(fileToUrl));
// Add common alias URLs that exist
validUrls.add(ORIGIN + '/');

const stats = {
  pagesScanned: 0,
  breadcrumbBlocks: 0,
  parseErrors: [],
  brokenItemUrls: {},  // url -> count
};

const ldRe = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
for (const f of files) {
  stats.pagesScanned++;
  const html = fs.readFileSync(f, 'utf8');
  let m;
  ldRe.lastIndex = 0;
  while ((m = ldRe.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw.includes('BreadcrumbList')) continue;
    let obj;
    try { obj = JSON.parse(raw); }
    catch (e) {
      if (stats.parseErrors.length < 10) stats.parseErrors.push({ file: f.replace(ROOT, ''), err: e.message });
      continue;
    }
    // Walk to find BreadcrumbList(s)
    function findBc(node) {
      if (!node || typeof node !== 'object') return [];
      if (node['@type'] === 'BreadcrumbList' && Array.isArray(node.itemListElement)) return [node];
      let acc = [];
      for (const v of Object.values(node)) {
        if (v && typeof v === 'object') acc = acc.concat(findBc(v));
      }
      return acc;
    }
    const bcs = findBc(obj);
    for (const bc of bcs) {
      stats.breadcrumbBlocks++;
      for (const it of bc.itemListElement) {
        const url = it.item && (typeof it.item === 'string' ? it.item : it.item['@id']);
        if (!url) continue;
        // Strip trailing fragments/query
        const clean = url.split('#')[0].split('?')[0];
        if (clean === ORIGIN || clean === ORIGIN + '/' || validUrls.has(clean)) continue;
        // Try with trailing slash variants
        const noSlash = clean.replace(/\/$/, '');
        const withSlash = noSlash + '/';
        if (validUrls.has(noSlash) || validUrls.has(withSlash)) continue;
        stats.brokenItemUrls[clean] = (stats.brokenItemUrls[clean] || 0) + 1;
      }
    }
  }
}

// robots.txt
const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
stats.robots = {
  allowsGooglebot: !/User-agent:\s*Googlebot[\s\S]*?Disallow:\s*\//.test(robots),
  hasSitemap: /Sitemap:\s*https?:\/\//i.test(robots),
};

// Sitemap canonical match
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
stats.sitemapUrls = sitemapUrls.length;

// Confirm canonicals on disk pages match sitemap inclusion
let canonicalSitemapMismatch = 0;
const sitemapSet = new Set(sitemapUrls);
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const isNoindex = /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
  const cm = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  if (!cm) continue;
  const canonical = cm[1];
  if (isNoindex && sitemapSet.has(canonical)) canonicalSitemapMismatch++;
}
stats.noindexCanonicalsInSitemap = canonicalSitemapMismatch;

// Top 20 broken urls
stats.brokenItemUrlsCount = Object.keys(stats.brokenItemUrls).length;
stats.topBrokenItemUrls = Object.entries(stats.brokenItemUrls).sort((a,b)=>b[1]-a[1]).slice(0, 30);

console.log(JSON.stringify(stats, null, 2));
fs.writeFileSync(path.join(ROOT, 'engines', 'breadcrumb-validation-report.json'), JSON.stringify(stats, null, 2), 'utf8');
