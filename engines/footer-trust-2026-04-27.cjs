#!/usr/bin/env node
/*
 * Footer trust-signal update for root pages.
 *
 * Replaces the existing "Educational guidance only." line with a more
 * explicit informational-purposes disclosure plus a visible domain contact,
 * which is what the indexing-quality directive calls for.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const FILES = [
  'about.html', 'affiliate-disclosure.html', 'amphibians.html', 'birds.html',
  'cats.html', 'contact.html', 'corrections.html', 'dogs.html',
  'editorial-standards.html', 'editorial-team.html', 'faq.html', 'fish.html',
  'guides.html', 'index.html', 'marine-fish.html', 'medical-disclaimer.html',
  'medical-review-process.html', 'privacy-policy.html', 'reptiles.html',
  'resources.html', 'small-animals.html', 'terms-of-service.html',
];

const OLD = '<p>&copy; 2026 Pet Care Helper AI. Based in Boston, MA. Educational guidance only.</p>';
const NEW = '<p>&copy; 2026 Pet Care Helper AI &middot; Based in Boston, MA. <strong>For informational purposes only &mdash; not veterinary advice.</strong> Reach the editorial team at <a href="mailto:hello@petcarehelperai.com" style="color:#5EEAD4;">hello@petcarehelperai.com</a> or use the <a href="/contact" style="color:#5EEAD4;">contact form</a>. Corrections: <a href="mailto:corrections@petcarehelperai.com" style="color:#5EEAD4;">corrections@petcarehelperai.com</a>.</p>';

let touched = 0;
for (const name of FILES) {
  const p = path.join(ROOT, name);
  if (!fs.existsSync(p)) continue;
  const before = fs.readFileSync(p, 'utf8');
  if (!before.includes(OLD)) continue;
  fs.writeFileSync(p, before.replace(OLD, NEW));
  touched += 1;
}
console.log(`Footer trust-signal: updated ${touched} of ${FILES.length} root pages.`);
