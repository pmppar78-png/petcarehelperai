#!/usr/bin/env node
// Pass 14: Add Editorial Team, Medical Review Process, and Corrections links to site footers.
// Covers both the full site-footer (top-level pages) and the compact footer-nav on guides/breeds/etc.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (['node_modules', '.git', '.netlify', '.claude', 'engines', 'audit', 'test-results'].includes(name)) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const files = walk(ROOT);

const ADD_COMPACT_NAV = ' &middot;\n      <a href="/editorial-team">Editorial Team</a> &middot;\n      <a href="/medical-review-process">Medical Review</a> &middot;\n      <a href="/corrections">Corrections</a>';

let compactUpdated = 0;
let fullUpdated = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  // Skip the trust pages themselves (already have the links)
  const fname = path.basename(file);
  if (['editorial-team.html', 'medical-review-process.html', 'corrections.html'].includes(fname)) continue;

  // 1. Compact footer-nav variant (guides, breeds, commercial, etc.)
  if (html.includes('<a href="/feeds/">RSS Feeds</a>') && !html.includes('/editorial-team">Editorial Team')) {
    html = html.replace(
      '<a href="/feeds/">RSS Feeds</a>',
      `<a href="/editorial-team">Editorial Team</a> &middot;\n      <a href="/medical-review-process">Medical Review</a> &middot;\n      <a href="/corrections">Corrections</a> &middot;\n      <a href="/feeds/">RSS Feeds</a>`
    );
    if (html !== before) compactUpdated++;
  }

  // 2. Full site-footer with "Partner With Us" — add Trust & Process links section if the page has the older 4-column footer without it
  if (html.includes('Partner With Us') && !html.includes('Trust &amp; Process')) {
    // We will NOT restructure existing footers to avoid regressions; we just add a link into the footer-legal bar.
    if (html.includes('<a href="/affiliate-disclosure">Affiliate Disclosure</a>') && !html.includes('<a href="/corrections">Corrections</a>')) {
      html = html.replace(
        '<a href="/affiliate-disclosure">Affiliate Disclosure</a>',
        '<a href="/affiliate-disclosure">Affiliate Disclosure</a>\n          <a href="/corrections">Corrections</a>\n          <a href="/editorial-team">Editorial Team</a>'
      );
      if (html !== before) fullUpdated++;
    }
  }

  if (html !== before) fs.writeFileSync(file, html, 'utf8');
}

console.log(`Footer nav updates: ${compactUpdated} compact, ${fullUpdated} full.`);
