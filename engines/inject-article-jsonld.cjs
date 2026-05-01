#!/usr/bin/env node
/**
 * Inject Article JSON-LD into article-style pages that lack it.
 * Targets: /guides, /breeds, /locations, /resources.
 * Skips pages already containing Article schema and noindex pages.
 */
const fs = require('fs');
const path = require('path');

const ROOT = '/opt/build/repo';
const ORIGIN = 'https://petcarehelperai.com';
const TARGET_DIRS = ['guides', 'breeds', 'locations', 'resources'];

function walk(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, list);
    else if (entry.isFile() && entry.name.endsWith('.html')) list.push(full);
  }
  return list;
}

function jsonStringSafe(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function htmlDecode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ');
}

function getMeta(html, name) {
  const m = html.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]+)"`, 'i'));
  return m ? htmlDecode(m[1]) : null;
}
function getOg(html, name) {
  const m = html.match(new RegExp(`<meta\\s+property="og:${name}"\\s+content="([^"]+)"`, 'i'));
  return m ? htmlDecode(m[1]) : null;
}
function getTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  return m ? htmlDecode(m[1].trim()) : null;
}
function getCanonical(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return m ? m[1] : null;
}
function getH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? htmlDecode(m[1].replace(/<[^>]+>/g, '')).trim() : null;
}
function hasArticleSchema(html) {
  return /"@type"\s*:\s*"Article"/.test(html);
}
function hasNoindex(html) {
  return /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
}

function buildArticle(html, file) {
  const title = getTitle(html);
  const h1 = getH1(html);
  const desc = getMeta(html, 'description') || getOg(html, 'description');
  const canonical = getCanonical(html) || getOg(html, 'url');
  if (!canonical || !desc || !(h1 || title)) return null;
  const headline = jsonStringSafe(h1 || title);
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description: jsonStringSafe(desc),
    url: canonical,
    datePublished: '2025-09-09',
    dateModified: '2026-04-30',
    author: {
      '@type': 'Organization',
      name: 'Pet Care Helper AI Editorial Team',
      url: `${ORIGIN}/about`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Pet Care Helper AI',
      logo: {
        '@type': 'ImageObject',
        url: `${ORIGIN}/logo.png`,
        width: 600,
        height: 60,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical,
    },
  };
  return article;
}

function inject(html, jsonLd) {
  const block = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n`;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${block}</head>`);
  return html;
}

function processFile(file) {
  const html = fs.readFileSync(file, 'utf8');
  if (hasArticleSchema(html)) return 'has_article';
  if (hasNoindex(html)) return 'noindex';
  const article = buildArticle(html, file);
  if (!article) return 'missing_data';
  fs.writeFileSync(file, inject(html, article), 'utf8');
  return 'injected';
}

function main() {
  const files = [];
  for (const d of TARGET_DIRS) walk(path.join(ROOT, d), files);
  const stats = {};
  for (const f of files) {
    const r = processFile(f);
    stats[r] = (stats[r] || 0) + 1;
  }
  stats.total = files.length;
  console.log(JSON.stringify(stats, null, 2));
}
main();
