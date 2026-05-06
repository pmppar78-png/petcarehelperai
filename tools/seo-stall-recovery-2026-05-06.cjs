const fs = require('fs');
const path = require('path');

const root = process.cwd();
const site = 'https://petcarehelperai.com';

const titleCase = (slug) => slug
  .split('-')
  .filter(Boolean)
  .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
  .join(' ')
  .replace(/\bAi\b/g, 'AI')
  .replace(/\bVs\b/g, 'vs');

const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.netlify') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
walk(root);

const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, value) => fs.writeFileSync(file, value);

function pathParts(file) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const parts = rel.split('/');
  return { rel, parts };
}

function replaceTagContent(html, tag, value) {
  const pattern = new RegExp(`<${tag}([^>]*)>[\\s\\S]*?<\\/${tag}>`, 'i');
  return html.replace(pattern, `<${tag}$1>${value}</${tag}>`);
}

function setMetaDescription(html, description) {
  return html.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${description}">`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/i, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/i, `<meta name="twitter:description" content="${description}" />`);
}

function setSocialTitle(html, title) {
  return html.replace(/<meta property="og:title" content="[^"]*" \/>/i, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/i, `<meta name="twitter:title" content="${title} | Pet Care Helper AI" />`);
}

function quickAnswerFor(topic, breed, other) {
  if (topic.startsWith('vs-')) {
    return `The better choice is the one whose daily care, health risks, and lifetime cost fit your household consistently. Compare ${breed} and ${other} on routine first, then use temperament, grooming load, and vet-risk planning to break the tie.`;
  }
  const map = {
    'best-food': `Start with a life-stage appropriate food that meets AAFCO standards, then adjust portions for ${breed}'s size, activity, body condition, and any veterinary restrictions. The right food is the one your pet can eat safely and consistently, not the one with the loudest label claim.`,
    'best-insurance': `For ${breed}, prioritize accident-and-illness coverage with hereditary-condition language, clear waiting periods, and a deductible you could still afford during an emergency. Compare reimbursement math before comparing monthly price.`,
    'cost-to-own': `The real cost of ${breed} ownership comes from setup, food, routine veterinary care, preventive screening, and emergency cushion. Budget for the first year separately from the recurring monthly cost.`,
    'health-costs': `Health costs for ${breed} are easiest to manage when routine exams, screening, dental care, and an emergency reserve are planned before symptoms appear. Breed risks should guide questions for a veterinarian, not replace a diagnosis.`,
    'first-time-owners': `${breed} can work for first-time owners when the household can meet the animal's daily routine, space, handling, and veterinary-care needs. The best fit is based on care capacity, not popularity.`,
    'best-habitat-size': `The right setup for ${breed} is the smallest daily environment that still supports safe movement, rest, feeding, hygiene, enrichment, and species-appropriate behavior. Size matters, but layout and maintenance matter just as much.`,
    'best-enrichment': `Good enrichment for ${breed} should reduce boredom, support natural behavior, and fit the animal's age, energy level, and safety limits. Rotate simple, durable options before buying more equipment.`
  };
  return map[topic] || `Use this page to make a practical ownership decision about ${breed}: daily routine, cost, health planning, and household fit matter more than a single headline recommendation.`;
}

function intentTitle(topic, category, breed, other) {
  if (topic.startsWith('vs-')) return `${breed} vs ${other}: Cost, Temperament, Health & Which Fits Better`;
  if (topic === 'best-habitat-size') {
    if (category === 'cats') return `Best Home Setup for ${breed}: Space, Litter, Scratching & Enrichment`;
    if (category === 'dogs') return `Best Home Setup for ${breed}: Space, Exercise & Daily Routine`;
    if (category === 'birds') return `Best Cage Setup for ${breed}: Size, Perches & Enrichment`;
    if (category === 'fish' || category === 'marine-fish') return `Best Tank Setup for ${breed}: Size, Water Quality & Equipment`;
    return `Best Habitat Setup for ${breed}: Space, Safety & Enrichment`;
  }
  const map = {
    'best-food': `Best Food for ${breed}: What to Feed, Portions & Mistakes to Avoid`,
    'best-insurance': `Best Pet Insurance for ${breed}: Coverage, Costs & Red Flags`,
    'cost-to-own': `${breed} Cost to Own: First-Year, Monthly & Vet Budget`,
    'health-costs': `${breed} Health Costs: Vet Bills, Screening & Emergency Budget`,
    'first-time-owners': `Is ${breed} Good for First-Time Owners? Fit, Cost & Care Load`,
    'best-enrichment': `Best Toys & Enrichment for ${breed}: Safe Ideas That Actually Help`
  };
  return map[topic] || `${breed} Care Decision Guide`;
}

function intentDescription(topic, breed, other) {
  if (topic.startsWith('vs-')) return `${breed} vs ${other} compared by daily routine, temperament, grooming, health risk, lifetime cost, and the household each pet fits best.`;
  const map = {
    'best-food': `How to choose food for ${breed}: life stage, portions, ingredients, health restrictions, feeding mistakes, and when to ask your veterinarian.`,
    'best-insurance': `How to compare pet insurance for ${breed}: hereditary coverage, exclusions, waiting periods, deductibles, reimbursement math, and common traps.`,
    'cost-to-own': `A practical ${breed} cost breakdown: first-year setup, monthly food and supplies, routine vet care, emergency budget, and hidden expenses.`,
    'health-costs': `What ${breed} owners should budget for: routine vet care, preventive screening, dental care, emergencies, and condition-specific follow-up.`,
    'first-time-owners': `Is ${breed} a smart first pet? Compare daily care, handling, space, cost, health planning, and beginner mistakes before deciding.`,
    'best-habitat-size': `How to set up a safe daily environment for ${breed}: space, layout, hygiene, enrichment, equipment, and common setup mistakes.`,
    'best-enrichment': `Safe enrichment ideas for ${breed}: toys, rotation plans, boredom signs, safety checks, and what to avoid.`
  };
  return map[topic] || `A practical decision guide for ${breed} owners focused on fit, cost, health planning, and daily care.`;
}

let commercialChanged = 0;
let commercialLoopBlocksRemoved = 0;
for (const file of htmlFiles.filter((f) => path.relative(root, f).replace(/\\/g, '/').startsWith('commercial/'))) {
  const { parts } = pathParts(file);
  const category = parts[1];
  const breed = titleCase(parts[2]);
  const topic = parts[3].replace(/\.html$/, '');
  const other = topic.startsWith('vs-') ? titleCase(topic.slice(3)) : '';
  const title = intentTitle(topic, category, breed, other);
  const desc = intentDescription(topic, breed, other);
  let html = read(file);
  const before = html;

  html = html.replace(/\n<section class="indexing-quality[\s\S]*?<\/section>/g, () => {
    commercialLoopBlocksRemoved += 1;
    return '';
  });

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title} | Pet Care Helper AI</title>`);
  html = setSocialTitle(html, title);
  html = setMetaDescription(html, desc);
  html = replaceTagContent(html, 'h1', title.replace(/&/g, '&amp;'));

  if (!html.includes('data-stall-recovery="quick-answer"')) {
    const qa = quickAnswerFor(topic, breed, other);
    html = html.replace(/(<h1[^>]*>[\s\S]*?<\/h1>)/i, `$1\n      <section class="info-card" data-stall-recovery="quick-answer">\n        <h2>Quick Answer</h2>\n        <p>${qa}</p>\n      </section>`);
  }

  html = html.replace(
    /<div class="breed-stats-card" style="margin-top:30px;">\s*<h2>Related ([^<]+) Pages<\/h2>[\s\S]*?<\/ul>\s*<\/div>/,
    `<div class="breed-stats-card" style="margin-top:30px;">\n        <h2>Most Useful Next Steps for ${breed}</h2>\n        <ul style="list-style:none;padding:0;">\n        <li><a href="/breeds/${category}/${parts[2]}" style="color:#0D9488;font-weight:600;">${breed} full care profile</a></li>\n        <li><a href="/guides" style="color:#0D9488;">Browse practical pet care guides</a></li>\n        <li><a href="/chat" style="color:#0D9488;">Ask a pet-care question</a></li>\n        </ul>\n      </div>`
  );

  html = html.replace(/Best Enclosure Size for ([^<"]+?) Cat/g, 'Best Home Setup for $1 Cat')
    .replace(/Best Enclosure Size for ([^<"]+?) Dog/g, 'Best Home Setup for $1 Dog')
    .replace(/Best Enclosure Size for ([^<"]+?) Bird/g, 'Best Cage Setup for $1 Bird')
    .replace(/Best Enclosure Size for ([^<"]+?) Fish/g, 'Best Tank Setup for $1 Fish');

  if (html !== before) {
    write(file, html);
    commercialChanged += 1;
  }
}

let breedPagesChanged = 0;
for (const file of htmlFiles.filter((f) => path.relative(root, f).replace(/\\/g, '/').startsWith('breeds/'))) {
  let html = read(file);
  const before = html;
  html = html.replace(/<div class="breed-stats-card commercial-links-section" style="margin-top:30px;">\s*<h2>Buying Guides for ([^<]+)<\/h2>\s*<ul style="list-style:none;padding:0;">([\s\S]*?)<\/ul>\s*<\/div>/g, (match, breed, list) => {
    const lis = [...list.matchAll(/<li[\s\S]*?<\/li>/g)].map((m) => m[0])
      .filter((li) => !/\/vs-|best-habitat-size|best-enrichment/.test(li))
      .slice(0, 5);
    if (!lis.length) return match;
    return `<div class="breed-stats-card commercial-links-section" style="margin-top:30px;">\n        <h2>Decision Guides for ${breed}</h2>\n        <p>Use these only when comparing food, insurance, ownership budget, or beginner fit for this specific pet.</p>\n        <ul style="list-style:none;padding:0;">\n          ${lis.join('\n          ')}\n        </ul>\n      </div>`;
  });
  if (html !== before) {
    write(file, html);
    breedPagesChanged += 1;
  }
}

let catFoodFixed = 0;
for (const file of htmlFiles.filter((f) => /guides\/best-food-for-.*cat\.html$/.test(path.relative(root, f).replace(/\\/g, '/')))) {
  let html = read(file);
  const before = html;
  const title = (html.match(/<title>(.*?) \| Pet Care Helper AI<\/title>/i) || [])[1] || '';
  if (title) html = replaceTagContent(html, 'h1', title.replace(/&/g, '&amp;'));
  html = html.replace(
    /<table class="comparison-table">\s*<tr><th>Life Stage<\/th><th>Daily Amount<\/th><th>Meals Per Day<\/th><th>Calories<\/th><\/tr>[\s\S]*?<\/table>/,
    `<table class="comparison-table">\n        <tr><th>Life Stage</th><th>Daily Amount</th><th>Meals Per Day</th><th>Calories</th></tr>\n        <tr><td>Kitten (2-6 months)</td><td>Measured kitten food; adjust by weight and label guidance</td><td>3-4</td><td>Often 200-350, depending on growth</td></tr>\n        <tr><td>Kitten (6-12 months)</td><td>Measured kitten food with body-condition checks</td><td>2-3</td><td>Often 250-400 for active juveniles</td></tr>\n        <tr><td>Adult</td><td>Measured wet or dry food based on ideal weight</td><td>2+</td><td>Usually 200-350, adjusted for activity</td></tr>\n        <tr><td>Senior (7+ years)</td><td>Vet-guided portions if weight, kidney, or dental issues appear</td><td>2+</td><td>Often 180-300, individualized</td></tr>\n      </table>`
  );
  html = html.replace(/Adult ([^<.]+?) typically need 1\.5–2\.5 cups of high-quality food per day, split into two meals\./g, 'Adult $1 typically need a measured daily ration based on ideal weight, calorie density, and body condition, split into two or more meals.');
  html = html.replace(/Adult ([^<.]+?) typically need 1\.5-2\.5 cups of high-quality food per day, split into two meals\./g, 'Adult $1 typically need a measured daily ration based on ideal weight, calorie density, and body condition, split into two or more meals.');
  html = html.replace(/Brands offering medium breed-specific formulas are often a good choice\./g, "Choose a formula that meets AAFCO standards for the cat's life stage and matches any veterinary restrictions.");
  if (html !== before) {
    write(file, html);
    catFoodFixed += 1;
  }
}

const sitemapFile = path.join(root, 'sitemap.xml');
let sitemapPruned = 0;
if (fs.existsSync(sitemapFile)) {
  const xml = read(sitemapFile);
  const blocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  const kept = blocks.filter((block) => {
    const loc = (block.match(/<loc>([^<]+)<\/loc>/) || [])[1] || '';
    const pathname = loc ? new URL(loc).pathname : '';
    const isCommercial = pathname.startsWith('/commercial/');
    if (isCommercial) sitemapPruned += 1;
    return !isCommercial;
  });
  const next = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Priority organic sitemap: commercial decision pages remain crawlable from relevant pages but are not bulk-submitted. -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${kept.join('\n')}\n</urlset>\n`;
  write(sitemapFile, next);
}

console.log(JSON.stringify({
  commercialChanged,
  commercialLoopBlocksRemoved,
  breedPagesChanged,
  catFoodFixed,
  sitemapPruned
}, null, 2));
