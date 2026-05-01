#!/usr/bin/env node
/**
 * Rotate templated title-suffix patterns on commercial pages so they don't
 * repeat verbatim across hundreds of pages. The breed name is hashed to pick
 * a stable variant per page (idempotent across runs).
 *
 * Only commercial/{species}/{breed}/{topic}.html files are touched.
 * Each topic has 4 variant suffixes; one is chosen by stable hash of the breed slug.
 * If the current title already uses a variant from the rotation set, we leave it.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = '/opt/build/repo/commercial';

// All variants are descriptive, non-spammy, and roughly equivalent in intent.
const SUFFIX_VARIANTS = {
  'best-insurance': {
    pattern: /\(2026\): What Coverage Actually Matters/,
    variants: [
      '(2026): What Coverage Actually Matters',
      '(2026): Plans That Pay When It Matters',
      '(2026): Real Claims, Real Premiums Compared',
      '(2026): Coverage Gaps, Premiums & Reimbursement Tiers',
    ],
  },
  'best-enrichment': {
    pattern: /\(2026\): What Actually Keeps Them Happy/,
    variants: [
      '(2026): What Actually Keeps Them Happy',
      '(2026): Toys, Puzzles & Daily Stimulation Picks',
      '(2026): Beating Boredom Without Buying Junk',
      '(2026): Engagement That Holds Up Beyond Day One',
    ],
  },
  'best-habitat-size': {
    pattern: /: Measurements, Setup &amp; Mistakes/,
    variants: [
      ': Measurements, Setup &amp; Mistakes',
      ': Sizing, Layout &amp; What to Avoid',
      ': Crate, Bed &amp; Floorspace Numbers',
      ': How Much Room You Actually Need',
    ],
  },
  'cost-to-own': {
    pattern: /\(2026\): First-Year, Monthly &amp; Lifetime Budget/,
    variants: [
      '(2026): First-Year, Monthly &amp; Lifetime Budget',
      '(2026): Real Budget, Year One Through Senior',
      '(2026): What Owners Actually Pay Each Month',
      '(2026): Startup, Recurring &amp; Hidden Costs',
    ],
  },
  'best-food': {
    pattern: /\(2026\): Vet-Reviewed Picks, Costs &amp; What to Avoid/,
    variants: [
      '(2026): Vet-Reviewed Picks, Costs &amp; What to Avoid',
      '(2026): Diet Picks, Ingredient Red Flags &amp; Monthly Cost',
      '(2026): What to Feed, What to Skip, What It Costs',
      '(2026): Brands That Work, Ingredients That Don\'t',
    ],
  },
  'health-costs': {
    pattern: /\(2026\): Vet Bills, Screenings &amp; Common Conditions/,
    variants: [
      '(2026): Vet Bills, Screenings &amp; Common Conditions',
      '(2026): Annual Vet Spend, Screenings &amp; Top Risks',
      '(2026): Routine Costs, Hereditary Conditions &amp; Tests',
      '(2026): Wellness Costs, Watch-Out Conditions &amp; Visits',
    ],
  },
  // /vs- pages: distinct rotation
  'vs': {
    pattern: /: Cost, Temperament, Training &amp; Which Fits You Better/,
    variants: [
      ': Cost, Temperament, Training &amp; Which Fits You Better',
      ': Side-by-Side Comparison for Real Households',
      ': Costs, Personality &amp; Owner Fit Compared',
      ': Honest Differences Before You Pick One',
    ],
  },
  'first-time-owners': {
    pattern: /\(2026\) — Honest Answer/,
    variants: [
      '(2026) — Honest Answer',
      '(2026): A Realistic Look at Year One',
      '(2026): What Beginners Actually Get Right or Wrong',
      '(2026): Reality Check for New Owners',
    ],
  },
};

function pickVariant(seed, variants) {
  const h = crypto.createHash('md5').update(seed).digest('hex');
  const idx = parseInt(h.slice(0, 8), 16) % variants.length;
  return variants[idx];
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) yield full;
  }
}

function getTopic(file) {
  const base = path.basename(file, '.html');
  if (base.startsWith('vs-')) return 'vs';
  return base;
}
function getBreedSlug(file) {
  // commercial/{species}/{breed}/{topic}.html
  const parts = file.split(path.sep);
  const idx = parts.indexOf('commercial');
  return parts[idx + 2] || '';
}

function rewriteFile(file) {
  const topic = getTopic(file);
  const cfg = SUFFIX_VARIANTS[topic];
  if (!cfg) return 'no_topic';
  let html = fs.readFileSync(file, 'utf8');
  if (!cfg.pattern.test(html)) return 'no_pattern';
  const breed = getBreedSlug(file);
  // Use breed + topic as seed so different topics for the same breed can vary
  const variant = pickVariant(`${breed}|${topic}`, cfg.variants);
  // If chosen variant equals the existing pattern's first form, do nothing
  const orig = cfg.variants[0];
  if (variant === orig) return 'kept_default';
  const oldStr = orig;
  // Replace ALL occurrences (title, og:title, twitter:title)
  if (!html.includes(oldStr)) return 'no_match';
  const updated = html.split(oldStr).join(variant);
  fs.writeFileSync(file, updated, 'utf8');
  return 'rotated';
}

const stats = {};
let count = 0;
for (const f of walk(ROOT)) {
  count++;
  const r = rewriteFile(f);
  stats[r] = (stats[r] || 0) + 1;
}
stats.total = count;
console.log(JSON.stringify(stats, null, 2));
