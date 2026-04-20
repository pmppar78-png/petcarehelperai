#!/usr/bin/env node
// Remove specific brand-name promises from meta descriptions when those brands
// are not actually present in the article body. Also remove orphan "compared:
// Brand1, Brand2, and more" patterns from the visible <p> after <h1>.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'guides');

// A brand list we might see in meta descriptions. If the brand appears only in
// <meta> and <title> tags (and maybe the first <p>) but nowhere else in the
// article body, we strip it from meta/title/intro.
const BRAND_WORDS = [
  'BarkBox', 'Bullymake', 'PupBox', 'Pooch Box', 'Chewy',
  'Kong', 'Chuckit', 'Furbo', 'Petcube', 'Wyze',
  'Embark', 'Wisdom Panel', 'DNA My Dog',
  'Frontline', 'Advantage', 'Advantix', 'Seresto', 'Nexgard',
  'Hill\u2019s', 'Blue Buffalo', 'Purina', 'Royal Canin',
  'Trupanion', 'Spot', 'Embrace', 'Healthy Paws', 'Fetch',
  'Ruff Greens', 'Nulo', 'Taste of the Wild',
  'West Paw', 'PetSafe', 'Whistle', 'Fi', 'Tractive',
  'KitNipBox', 'Meowbox', 'Cat Lady', 'RescueBox',
];

function bodyText(html) {
  // Strip <head>...</head> and meta/script/style
  let body = html.replace(/<head[\s\S]*?<\/head>/i, '');
  body = body.replace(/<script[\s\S]*?<\/script>/g, '');
  body = body.replace(/<style[\s\S]*?<\/style>/g, '');
  // The first <p> after <h1> often repeats the meta description — skip it by
  // looking only at content *after* the hero image for this check.
  return body;
}

let changed = 0;

for (const f of fs.readdirSync(DIR)) {
  if (!f.startsWith('best-') || !f.endsWith('.html')) continue;
  const full = path.join(DIR, f);
  let text = fs.readFileSync(full, 'utf8');
  const original = text;

  // Get the article body only (what the user reads)
  const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/);
  const article = articleMatch ? articleMatch[1] : '';

  // For each brand mentioned in <meta> / <title> / intro, check if it appears
  // elsewhere in the article body. If not, strip the "compared: X, Y, Z"
  // pattern and replace with neutral language.
  const metaDesc = (text.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const brandsInMeta = BRAND_WORDS.filter(b => metaDesc.includes(b));
  if (brandsInMeta.length === 0) continue;

  // Check if brands appear in article headings/paragraphs (outside intro)
  // Strip the first intro <p> (which is often a duplicate of meta)
  const articleAfterIntro = article.replace(/<p>[\s\S]*?<\/p>/, '');
  const missingBrands = brandsInMeta.filter(b => !articleAfterIntro.includes(b));

  if (missingBrands.length === 0) continue; // brands are delivered — leave alone

  // Rewrite meta description to drop the brand claims and become descriptive of what the page actually covers.
  const h1Match = text.match(/<h1>([^<]+)<\/h1>/);
  const h1 = h1Match ? h1Match[1].trim() : '';
  const honestDesc = `${h1}: what to look for, how to compare features, what they typically cost, and red flags to avoid. Practical buying guide rather than a ranked product list.`;

  text = text.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${honestDesc}"`
  );
  text = text.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${honestDesc}"`
  );
  text = text.replace(
    /<meta name="twitter:description" content="[^"]*"/,
    `<meta name="twitter:description" content="${honestDesc}"`
  );

  // Rewrite the opening paragraph (first <p> after <h1>) to drop brand claims.
  text = text.replace(
    /(<h1>[^<]+<\/h1>\s*)<p>[^<]*<\/p>/,
    (m, h) => `${h}<p>${honestDesc}</p>`
  );

  if (text !== original) {
    fs.writeFileSync(full, text);
    changed++;
  }
}

console.log(`bait-and-switch fix: ${changed} product pages rewritten`);
