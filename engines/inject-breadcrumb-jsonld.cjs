#!/usr/bin/env node
/**
 * Inject BreadcrumbList JSON-LD into every indexable HTML page that
 * does not already contain one. Source-of-truth is the visible
 * <div class="breadcrumb"> markup so visible and schema breadcrumbs match.
 *
 * If the page lacks a visible breadcrumb (e.g. utility / top-level pages),
 * the page is skipped — those pages do not need BreadcrumbList.
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

function htmlDecode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rsaquo;/g, "›")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function jsonEscape(s) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '');
}

function absolutize(href) {
  if (!href) return null;
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  if (href.startsWith('#')) return null;
  if (href.startsWith('/')) return ORIGIN + href.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  return null;
}

function extractVisibleBreadcrumb(html) {
  // Find first <div class="breadcrumb"> ... </div> block (or aria-labeled nav)
  const m = html.match(/<(?:div|nav)[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>([\s\S]*?)<\/(?:div|nav)>/i);
  if (!m) return null;
  const inner = m[1];
  // Items: anchors and trailing text after last <span>
  const items = [];
  // Split by separator span markers
  // Approach: collect anchors and any trailing free text node
  const anchorRe = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let lastEnd = 0;
  let am;
  while ((am = anchorRe.exec(inner)) !== null) {
    const href = am[1];
    const label = htmlDecode(am[2].replace(/<[^>]+>/g, ''));
    if (label) items.push({ name: label, href });
    lastEnd = anchorRe.lastIndex;
  }
  // Trailing label after the last anchor (current page name)
  let tail = inner.slice(lastEnd);
  // Strip span separators and HTML tags
  tail = tail.replace(/<[^>]+>/g, ' ');
  tail = htmlDecode(tail);
  // Tail may include leftover separators like "›" — strip leading separators
  tail = tail.replace(/^[\s›>›»»]+/, '').trim();
  if (tail) items.push({ name: tail, href: null });
  return items.length >= 2 ? items : null;
}

function getCanonical(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return m ? m[1] : null;
}

function hasBreadcrumbList(html) {
  return /"@type"\s*:\s*"BreadcrumbList"/.test(html);
}

function hasNoindex(html) {
  return /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
}

function buildJsonLd(items, canonical) {
  const list = items.map((it, i) => {
    const pos = i + 1;
    const isLast = i === items.length - 1;
    const item = {
      '@type': 'ListItem',
      position: pos,
      name: it.name,
    };
    if (it.href) {
      const abs = absolutize(it.href) || it.href;
      item.item = abs;
    } else if (isLast && canonical) {
      // Use canonical for the leaf when href is absent (Google accepts and prefers item URL)
      item.item = canonical;
    }
    return item;
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list,
  };
}

function injectBreadcrumb(html, jsonLd) {
  const block = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>\n`;
  // Insert before </head>
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${block}</head>`);
  return html;
}

function processFile(file) {
  let html;
  try { html = fs.readFileSync(file, 'utf8'); } catch { return { status: 'read_error' }; }
  if (hasBreadcrumbList(html)) return { status: 'has_schema' };
  if (hasNoindex(html)) return { status: 'noindex_skipped' };
  const canonical = getCanonical(html);
  const items = extractVisibleBreadcrumb(html);
  if (!items) return { status: 'no_visible_breadcrumb' };
  const jsonLd = buildJsonLd(items, canonical);
  const out = injectBreadcrumb(html, jsonLd);
  if (out === html) return { status: 'no_head_close' };
  fs.writeFileSync(file, out, 'utf8');
  return { status: 'injected' };
}

function main() {
  const files = walk(ROOT);
  const stats = {
    total: 0,
    injected: 0,
    has_schema: 0,
    noindex_skipped: 0,
    no_visible_breadcrumb: 0,
    no_head_close: 0,
    read_error: 0,
  };
  const noBreadcrumbList = [];
  for (const f of files) {
    stats.total++;
    const r = processFile(f);
    stats[r.status] = (stats[r.status] || 0) + 1;
    if (r.status === 'no_visible_breadcrumb') noBreadcrumbList.push(f);
  }
  console.log(JSON.stringify(stats, null, 2));
  fs.writeFileSync(
    path.join(ROOT, 'engines', 'breadcrumb-injection-no-visible.txt'),
    noBreadcrumbList.map(f => f.replace(ROOT + '/', '')).join('\n'),
    'utf8'
  );
}

main();
