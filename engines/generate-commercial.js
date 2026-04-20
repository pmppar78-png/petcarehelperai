#!/usr/bin/env node
/**
 * Commercial Page Engine — PetCareHelperAI
 *
 * Extracts entity data from existing breed pages, generates 8 commercial-intent
 * companion pages per entity, and updates sitemap.xml.
 *
 * Usage: node engines/generate-commercial.js
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TODAY = '2026-02-23';
const SITE = 'https://petcarehelperai.com';
const affiliates = JSON.parse(readFileSync(join(ROOT, 'affiliates.json'), 'utf8'));

// ============================================================
// SPECIES-AWARE TERMINOLOGY MAP
// ============================================================
const speciesTerms = {
  dogs:          { habitat: 'Crate',       enrichment: 'Toys',            feeding: 'Food',   insurance: 'Pet Insurance', navLink: '/dogs',         navLabel: 'Dogs' },
  cats:          { habitat: 'Enclosure',   enrichment: 'Toys',            feeding: 'Food',   insurance: 'Pet Insurance', navLink: '/cats',         navLabel: 'Cats' },
  birds:         { habitat: 'Cage',        enrichment: 'Enrichment',      feeding: 'Diet',   insurance: 'Pet Insurance', navLink: '/birds',        navLabel: 'Birds' },
  fish:          { habitat: 'Tank',        enrichment: 'Habitat Upgrades',feeding: 'Food',   insurance: 'Pet Insurance', navLink: '/fish',         navLabel: 'Fish' },
  'marine-fish': { habitat: 'Tank',        enrichment: 'Habitat Upgrades',feeding: 'Food',   insurance: 'Pet Insurance', navLink: '/marine-fish',  navLabel: 'Marine Fish' },
  reptiles:      { habitat: 'Enclosure',   enrichment: 'Enrichment',      feeding: 'Diet',   insurance: 'Pet Insurance', navLink: '/reptiles',     navLabel: 'Reptiles' },
  amphibians:    { habitat: 'Habitat',     enrichment: 'Enrichment',      feeding: 'Diet',   insurance: 'Pet Insurance', navLink: '/amphibians',   navLabel: 'Amphibians' },
  'small-animals':{ habitat: 'Cage',       enrichment: 'Toys & Enrichment',feeding: 'Food',  insurance: 'Pet Insurance', navLink: '/small-animals', navLabel: 'Small Animals' },
};

// Affiliate category mapping per page type
const affiliateMap = {
  'best-food':        ['foodAndNutrition', 'groomingAndSupplements'],
  'best-insurance':   ['insuranceAndWellness'],
  'cost-to-own':      ['insuranceAndWellness', 'foodAndNutrition'],
  'health-costs':     ['insuranceAndWellness', 'teleVetsAndClinics', 'pharmacyAndMedical'],
  'first-time-owners':['foodAndNutrition', 'trainingAndBehavior', 'insuranceAndWellness'],
  'best-habitat-size':['birdReptileExotic', 'aquariumAndFish', 'devicesGpsAndTech'],
  'best-enrichment':  ['trainingAndBehavior', 'birdReptileExotic', 'devicesGpsAndTech'],
};

// Species-specific affiliate overrides
function getAffiliateCategories(pageType, speciesGroup) {
  const base = affiliateMap[pageType] || ['foodAndNutrition'];
  if (['fish', 'marine-fish'].includes(speciesGroup)) {
    if (['best-habitat-size', 'best-enrichment'].includes(pageType)) return ['aquariumAndFish'];
    if (pageType === 'best-food') return ['aquariumAndFish', 'foodAndNutrition'];
  }
  if (['birds', 'reptiles', 'amphibians'].includes(speciesGroup)) {
    if (['best-habitat-size', 'best-enrichment', 'best-food'].includes(pageType)) return ['birdReptileExotic', ...base];
  }
  return base;
}

// ============================================================
// EXTRACT ENTITY DATA FROM EXISTING BREED PAGES
// ============================================================
function extractEntities() {
  const speciesDirs = ['dogs', 'cats', 'birds', 'fish', 'marine-fish', 'reptiles', 'amphibians', 'small-animals'];
  const entities = [];

  for (const sp of speciesDirs) {
    const dir = join(ROOT, 'breeds', sp);
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter(f => f.endsWith('.html') && !f.includes('breed'));

    for (const file of files) {
      const slug = file.replace('.html', '');
      const html = readFileSync(join(dir, file), 'utf8');

      // Extract display name from <h1>
      const h1Match = html.match(/<h1[^>]*>([^<]+)</);
      let displayName = h1Match ? h1Match[1].replace(/:.*/,'').trim() : slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

      // Extract hero image from og:image
      const ogImgMatch = html.match(/og:image"\s+content="([^"]+)"/);
      const heroImage = ogImgMatch ? ogImgMatch[1] : '';

      // Extract image alt from first <img> with breed-hero or main image
      const imgAltMatch = html.match(/<img[^>]+alt="([^"]+)"[^>]*class="breed-hero/);
      const heroAlt = imgAltMatch ? imgAltMatch[1] : `${displayName} photo`;

      // Extract short summary from first <p> after Overview/About h2
      const summaryMatch = html.match(/<h2>[^<]*(?:Overview|About|Introduction)[^<]*<\/h2>\s*<p>([^<]+)/i);
      const summary = summaryMatch ? summaryMatch[1].trim().slice(0, 300) : `Learn about ${displayName} care, costs, and health needs.`;

      // Extract meta description
      const metaDescMatch = html.match(/name="description"\s+content="([^"]+)"/);
      const metaDesc = metaDescMatch ? metaDescMatch[1] : '';

      entities.push({
        id: `${sp}-${slug}`,
        species_group: sp,
        display_name: displayName,
        slug,
        parent_url: `${SITE}/breeds/${sp}/${slug}`,
        hero_image_src: heroImage,
        hero_image_alt: heroAlt,
        short_summary: summary,
        meta_description: metaDesc,
      });
    }
  }

  return entities;
}

// ============================================================
// FIND SIMILAR ENTITIES (for comparison pages)
// ============================================================
function findSimilar(entity, allEntities) {
  const sameSpecies = allEntities.filter(e =>
    e.species_group === entity.species_group && e.id !== entity.id
  );
  // Pick up to 2 entities from same species group (deterministic by alphabet)
  const sorted = sameSpecies.sort((a, b) => a.slug.localeCompare(b.slug));
  const idx = sorted.findIndex(e => e.slug > entity.slug);
  const picks = [];
  if (idx >= 0 && sorted[idx]) picks.push(sorted[idx]);
  if (idx >= 1 && sorted[idx - 1] && sorted[idx - 1].id !== entity.id) picks.push(sorted[idx - 1]);
  else if (sorted.length > 1 && picks.length < 2) {
    const alt = sorted.find(e => !picks.includes(e) && e.id !== entity.id);
    if (alt) picks.push(alt);
  }
  return picks.slice(0, 2);
}

// ============================================================
// PICK AFFILIATES
// ============================================================
function pickAffiliates(categories, count = 5) {
  const pool = [];
  for (const cat of categories) {
    if (affiliates[cat]) pool.push(...affiliates[cat]);
  }
  // Deterministic selection (no randomness for reproducible builds)
  return pool.slice(0, Math.min(count, pool.length));
}

// ============================================================
// HTML BUILDERS
// ============================================================
function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

function buildHead({ title, description, canonical, cssPath, ogImage, schema }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-FK0N7BD82Q"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-FK0N7BD82Q');</script>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="Pet Care Helper AI" />
  ${ogImage ? `<meta property="og:image" content="${esc(ogImage)}" />` : ''}
  <title>${esc(title)} | Pet Care Helper AI</title>
  <link rel="stylesheet" href="${cssPath}">
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${esc(title)} | Pet Care Helper AI" />
  <meta name="twitter:description" content="${esc(description)}" />
  ${schema}
</head>`;
}

function buildNav(activeLink) {
  const links = [
    ['/', 'Home'], ['/chat', 'AI Pet Help'], ['/dogs', 'Dogs'], ['/cats', 'Cats'],
    ['/birds', 'Birds'], ['/reptiles', 'Reptiles'], ['/amphibians', 'Amphibians'],
    ['/fish', 'Fish'], ['/marine-fish', 'Marine Fish'], ['/small-animals', 'Small Animals'],
    ['/guides', 'Guides']
  ];
  const items = links.map(([href, label]) =>
    `        <li><a href="${href}" class="nav-link${href === activeLink ? ' active' : ''}">${label}</a></li>`
  ).join('\n');
  return `<body>
  <header class="site-header">
    <div class="logo-title">
      <div class="logo-pill"></div>
      <div>
        <span class="site-name">Pet Care Helper AI</span>
        <p class="subtitle">Dogs &bull; Cats &bull; Birds &bull; Reptiles &bull; Amphibians &bull; Fish</p>
      </div>
    </div>
    <nav class="main-nav">
      <button class="nav-toggle" aria-label="Toggle navigation"><span class="hamburger"></span></button>
      <ul class="nav-menu">
${items}
      </ul>
    </nav>
  </header>
  <main>`;
}

function buildFooter() {
  return `  </main>
  <footer style="text-align:center;padding:40px 20px;color:#64748B;font-size:0.85rem;border-top:1px solid #E2E8F0;margin-top:60px;">
    <p>&copy; 2026 Pet Care Helper AI. For informational purposes only. Not veterinary advice.</p>
    <p style="margin-top:8px;">
      <a href="/about" style="color:#0D9488;">About</a> &bull;
      <a href="/contact" style="color:#0D9488;">Contact</a> &bull;
      <a href="/privacy-policy" style="color:#0D9488;">Privacy</a> &bull;
      <a href="/terms-of-service" style="color:#0D9488;">Terms</a> &bull;
      <a href="/medical-disclaimer" style="color:#0D9488;">Medical Disclaimer</a> &bull;
      <a href="/editorial-standards" style="color:#0D9488;">Editorial Standards</a>
    </p>
  </footer>
  <script>
    const t=document.querySelector('.nav-toggle'),m=document.querySelector('.nav-menu');
    if(t&&m){t.addEventListener('click',()=>{m.classList.toggle('open');t.classList.toggle('active');})}
  </script>
</body>
</html>`;
}

function buildBreadcrumb(entity, pageTitle) {
  const t = speciesTerms[entity.species_group];
  return `    <div class="breadcrumb">
      <a href="/">Home</a> <span>&rsaquo;</span>
      <a href="${t.navLink}">${t.navLabel}</a> <span>&rsaquo;</span>
      <a href="/breeds/${entity.species_group}/${entity.slug}">${entity.display_name}</a> <span>&rsaquo;</span>
      ${esc(pageTitle)}
    </div>`;
}

function buildAffiliateTable(partners, heading) {
  if (!partners.length) return '';
  const rows = partners.slice(0, 5).map((p, i) =>
    `          <tr><td>${i + 1}</td><td><a href="${p.url}" target="_blank" rel="sponsored noopener">${esc(p.name)}</a></td><td>${esc(p.hook)}</td></tr>`
  ).join('\n');
  return `
      <div class="breed-stats-card">
        <h2>${esc(heading)}</h2>
        <table class="comparison-table">
          <tr><th>#</th><th>Provider</th><th>Why We Like It</th></tr>
${rows}
        </table>
      </div>`;
}

function buildAffiliateCallout(partners, heading) {
  if (!partners.length) return '';
  const links = partners.slice(0, 3).map(p =>
    `<a href="${p.url}" target="_blank" rel="sponsored noopener">${esc(p.name)}</a> &mdash; ${esc(p.hook)}`
  ).join('. ');
  return `
      <div class="affiliate-callout">
        <h4>${esc(heading)}</h4>
        <p>${links}.</p>
      </div>`;
}

function buildRelatedLinks(entity, allEntities, currentPage) {
  const pages = ['best-food', 'best-insurance', 'cost-to-own', 'health-costs', 'first-time-owners', 'best-habitat-size', 'best-enrichment'];
  const t = speciesTerms[entity.species_group];
  const labels = {
    'best-food': `Best ${t.feeding} for ${entity.display_name}`,
    'best-insurance': `Best ${t.insurance} for ${entity.display_name}`,
    'cost-to-own': `${entity.display_name} Cost to Own`,
    'health-costs': `${entity.display_name} Health Costs`,
    'first-time-owners': `Is ${entity.display_name} Good for First-Time Owners?`,
    'best-habitat-size': `Best ${t.habitat} Size for ${entity.display_name}`,
    'best-enrichment': `Best ${t.enrichment} for ${entity.display_name}`,
  };

  const links = pages.filter(p => p !== currentPage).map(p =>
    `        <li><a href="/commercial/${entity.species_group}/${entity.slug}/${p}" style="color:#0D9488;">${labels[p]}</a></li>`
  ).join('\n');

  // Find comparison pages
  const similar = findSimilar(entity, allEntities);
  const vsLinks = similar.map(s =>
    `        <li><a href="/commercial/${entity.species_group}/${entity.slug}/vs-${s.slug}" style="color:#0D9488;">${entity.display_name} vs ${s.display_name}</a></li>`
  ).join('\n');

  return `
      <div class="breed-stats-card" style="margin-top:30px;">
        <h2>Related ${entity.display_name} Pages</h2>
        <ul style="list-style:none;padding:0;">
        <li><a href="/breeds/${entity.species_group}/${entity.slug}" style="color:#0D9488;font-weight:600;">&larr; ${entity.display_name} Complete Guide</a></li>
${links}
${vsLinks}
        </ul>
      </div>`;
}

function buildDisclaimer() {
  return `
      <div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:8px;margin:30px 0;font-size:0.9rem;">
        <strong>Disclaimer:</strong> This page is for informational purposes only and does not constitute veterinary advice. Costs vary by region, provider, and individual animal. Product links may be affiliate links &mdash; we may earn a commission at no extra cost to you. Always consult a licensed veterinarian for health-related decisions.
      </div>`;
}

function buildFaqSchema(faqs) {
  const items = faqs.map(([q, a]) => ({
    "@type": "Question",
    "name": q,
    "acceptedAnswer": { "@type": "Answer", "text": a }
  }));
  return `<script type="application/ld+json">
  ${JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": items })}
  </script>`;
}

function heroImageBlock(entity) {
  if (!entity.hero_image_src) return '';
  return `
      <div style="text-align:center;margin:20px 0;">
        <img src="${esc(entity.hero_image_src)}" alt="${esc(entity.hero_image_alt)}" loading="lazy" width="800" height="600" style="max-width:100%;height:auto;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
      </div>`;
}

// ============================================================
// PAGE TYPE GENERATORS
// ============================================================

function genBestFood(entity, allEntities) {
  const t = speciesTerms[entity.species_group];
  const title = `Best ${t.feeding} for ${entity.display_name} (2026 Guide)`;
  const desc = `Top-rated ${t.feeding.toLowerCase()} options for ${entity.display_name}. Expert recommendations for nutrition, dietary needs, and feeding guidelines.`;
  const canonical = `${SITE}/commercial/${entity.species_group}/${entity.slug}/best-food`;
  const partners = pickAffiliates(getAffiliateCategories('best-food', entity.species_group));

  const isFish = ['fish', 'marine-fish'].includes(entity.species_group);
  const isExotic = ['birds', 'reptiles', 'amphibians'].includes(entity.species_group);

  const feedingTips = isFish
    ? `Feed small amounts 1-2 times daily. Only provide what can be consumed in 2-3 minutes to maintain water quality. Vary the diet between flakes, pellets, and frozen foods for optimal nutrition.`
    : isExotic
    ? `Follow species-specific feeding guidelines. Supplement with calcium and vitamins as needed. Fresh water should always be available. Avoid foods that are toxic to ${entity.display_name}.`
    : `Choose a high-quality ${t.feeding.toLowerCase()} appropriate for your ${entity.display_name}'s age, size, and activity level. Look for whole protein as the first ingredient. Avoid fillers like corn and soy.`;

  const budgetGuide = isFish
    ? `<tr><td>Basic Flakes/Pellets</td><td>$5-$15/month</td></tr><tr><td>Premium Frozen Foods</td><td>$10-$25/month</td></tr><tr><td>Supplements & Treats</td><td>$5-$15/month</td></tr>`
    : isExotic
    ? `<tr><td>Basic Diet (pellets/seed)</td><td>$10-$30/month</td></tr><tr><td>Fresh Foods & Supplements</td><td>$10-$25/month</td></tr><tr><td>Treats & Enrichment Foods</td><td>$5-$15/month</td></tr>`
    : entity.species_group === 'cats'
    ? `<tr><td>Budget (Dry Kibble)</td><td>$20-$40/month</td></tr><tr><td>Mid-Range (Wet + Dry)</td><td>$40-$80/month</td></tr><tr><td>Premium (Fresh/Raw)</td><td>$80-$150/month</td></tr>`
    : `<tr><td>Budget (Dry Kibble)</td><td>$30-$60/month</td></tr><tr><td>Mid-Range (Wet + Dry Mix)</td><td>$60-$120/month</td></tr><tr><td>Premium (Fresh/Raw)</td><td>$100-$200/month</td></tr>`;

  const faqs = [
    [`What is the best ${t.feeding.toLowerCase()} for ${entity.display_name}?`, `The best ${t.feeding.toLowerCase()} for ${entity.display_name} depends on age, health status, and activity level. Look for species-appropriate nutrition with high-quality ingredients.`],
    [`How often should I feed my ${entity.display_name}?`, isFish ? `Feed small amounts 1-2 times daily, only what can be consumed in 2-3 minutes.` : `Feeding frequency depends on age. Young animals need more frequent meals, while adults typically do well with 1-2 measured meals per day.`],
    [`What foods should ${entity.display_name} avoid?`, `Avoid foods with excessive fillers, artificial preservatives, and any ingredients known to be toxic to this species. Consult your veterinarian for a complete list.`],
    [`How much does ${t.feeding.toLowerCase()} for ${entity.display_name} cost per month?`, `Monthly ${t.feeding.toLowerCase()} costs typically range from $20-$150 depending on the quality and type of diet you choose.`],
    [`Should I choose wet or dry ${t.feeding.toLowerCase()} for ${entity.display_name}?`, `A combination often works best. Wet food provides hydration and palatability, while dry food supports dental health and is more economical.`],
  ];

  const html = `${buildHead({ title, description: desc, canonical, cssPath: '../../../styles.css', ogImage: entity.hero_image_src, schema: buildFaqSchema(faqs) })}
${buildNav(speciesTerms[entity.species_group].navLink)}
${buildBreadcrumb(entity, `Best ${t.feeding}`)}

    <article class="guide-content">
      <h1>${esc(title)}</h1>
${heroImageBlock(entity)}

      <p>Finding the right ${t.feeding.toLowerCase()} for your ${entity.display_name} is one of the most important decisions you'll make as a pet owner. Proper nutrition directly impacts energy levels, coat quality, immune health, and longevity.</p>

${buildAffiliateTable(partners, `Top ${t.feeding} Picks for ${entity.display_name}`)}

      <h2>Feeding Guidelines for ${entity.display_name}</h2>
      <p>${feedingTips}</p>

      <h2>What to Look For</h2>
      <ul>
        <li><strong>Species-appropriate protein:</strong> The primary ingredient should be a quality protein source suitable for ${entity.display_name}.</li>
        <li><strong>No harmful additives:</strong> Avoid artificial colors, flavors, and preservatives.</li>
        <li><strong>Complete nutrition:</strong> Ensure the ${t.feeding.toLowerCase()} meets all nutritional requirements for this species.</li>
        <li><strong>Age-appropriate formula:</strong> Choose a formula matched to your pet's life stage.</li>
        <li><strong>Digestibility:</strong> High-quality ingredients are more easily absorbed and produce less waste.</li>
      </ul>

      <h2>Monthly ${t.feeding} Cost Estimate</h2>
      <table class="comparison-table">
        <tr><th>Diet Tier</th><th>Est. Monthly Cost</th></tr>
${budgetGuide}
      </table>

${buildAffiliateCallout(partners.slice(2, 5), `More ${t.feeding} Options`)}

      <h2>Best ${t.feeding} by Category</h2>
      <ul>
        <li><strong>Best Overall:</strong> A balanced, species-appropriate formula with whole-food ingredients.</li>
        <li><strong>Best Budget:</strong> Affordable options that still meet nutritional standards without fillers.</li>
        <li><strong>Best for Sensitive Stomachs:</strong> Limited-ingredient diets with easily digestible proteins.</li>
        <li><strong>Best for Seniors:</strong> Formulas with joint support and adjusted calorie content for older ${entity.display_name}.</li>
      </ul>

${buildDisclaimer()}
${buildRelatedLinks(entity, allEntities, 'best-food')}
    </article>
${buildFooter()}`;

  return { html, canonical };
}

function genBestInsurance(entity, allEntities) {
  const t = speciesTerms[entity.species_group];
  const title = `Best ${t.insurance} for ${entity.display_name} (2026 Plans & Costs)`;
  const desc = `Compare the best pet insurance plans for ${entity.display_name}. Coverage options, monthly costs, and which plans offer the best value.`;
  const canonical = `${SITE}/commercial/${entity.species_group}/${entity.slug}/best-insurance`;
  const partners = pickAffiliates(getAffiliateCategories('best-insurance', entity.species_group));

  const isExotic = !['dogs', 'cats'].includes(entity.species_group);
  const premiumRange = isExotic ? '$15-$40' : '$30-$80';

  const faqs = [
    [`How much does pet insurance cost for ${entity.display_name}?`, `Monthly premiums for ${entity.display_name} typically range from ${premiumRange} depending on coverage level, deductible, and your location.`],
    [`Is pet insurance worth it for ${entity.display_name}?`, `Pet insurance can save thousands in emergency situations. Given the potential health issues for ${entity.display_name}, many owners find comprehensive coverage provides valuable peace of mind.`],
    [`What does pet insurance cover for ${entity.display_name}?`, `Most plans cover accidents and illnesses including diagnostics, surgery, hospitalization, and medications. Some plans also cover wellness visits and preventive care.`],
    [`When should I get pet insurance for ${entity.display_name}?`, `The best time is when your pet is young and healthy. Pre-existing conditions are typically excluded, so early enrollment provides the broadest coverage.`],
    [`What is the best pet insurance company for ${entity.display_name}?`, `The best insurer depends on your budget and needs. Compare plans based on coverage limits, deductibles, reimbursement rates, and customer reviews.`],
  ];

  const html = `${buildHead({ title, description: desc, canonical, cssPath: '../../../styles.css', ogImage: entity.hero_image_src, schema: buildFaqSchema(faqs) })}
${buildNav(speciesTerms[entity.species_group].navLink)}
${buildBreadcrumb(entity, `Best ${t.insurance}`)}

    <article class="guide-content">
      <h1>${esc(title)}</h1>
${heroImageBlock(entity)}

      <p>Unexpected vet bills can be devastating. Pet insurance for your ${entity.display_name} helps ensure you can always afford the care they need without financial stress.</p>

${buildAffiliateTable(partners, `Top ${t.insurance} Plans for ${entity.display_name}`)}

      <h2>What to Look For in ${t.insurance}</h2>
      <ul>
        <li><strong>Coverage breadth:</strong> Accidents, illnesses, hereditary conditions, and emergency care.</li>
        <li><strong>Reimbursement rate:</strong> Most plans offer 70-90% reimbursement after deductible.</li>
        <li><strong>Annual limits:</strong> Choose unlimited or high annual limits for comprehensive protection.</li>
        <li><strong>Deductible options:</strong> Lower deductibles mean higher premiums but less out-of-pocket per incident.</li>
        <li><strong>Waiting periods:</strong> Understand how long before coverage begins for different conditions.</li>
      </ul>

      <h2>Estimated Monthly Premiums</h2>
      <table class="comparison-table">
        <tr><th>Coverage Level</th><th>Est. Monthly Cost</th><th>Best For</th></tr>
        <tr><td>Accident Only</td><td>$10-$25/mo</td><td>Budget-conscious owners</td></tr>
        <tr><td>Accident + Illness</td><td>${premiumRange}/mo</td><td>Comprehensive protection</td></tr>
        <tr><td>Wellness Add-On</td><td>+$10-$25/mo</td><td>Routine care coverage</td></tr>
      </table>

      <h2>Coverage Types Explained</h2>
      <ul>
        <li><strong>Accident-only plans:</strong> Cover injuries from accidents like broken bones, lacerations, and ingestion of foreign objects.</li>
        <li><strong>Comprehensive plans:</strong> Cover both accidents and illnesses including cancer, infections, and chronic conditions.</li>
        <li><strong>Wellness plans:</strong> Add-on coverage for routine care like vaccinations, dental cleanings, and annual checkups.</li>
      </ul>

${buildAffiliateCallout(partners.slice(2, 5), 'Compare More Plans')}
${buildDisclaimer()}
${buildRelatedLinks(entity, allEntities, 'best-insurance')}
    </article>
${buildFooter()}`;

  return { html, canonical };
}

function genCostToOwn(entity, allEntities) {
  const t = speciesTerms[entity.species_group];
  const title = `${entity.display_name} Cost to Own: Yearly & Lifetime Budget (2026)`;
  const desc = `Complete cost breakdown for owning a ${entity.display_name}. Startup costs, monthly expenses, annual budget, and lifetime estimates.`;
  const canonical = `${SITE}/commercial/${entity.species_group}/${entity.slug}/cost-to-own`;
  const partners = pickAffiliates(getAffiliateCategories('cost-to-own', entity.species_group));

  const isFish = ['fish', 'marine-fish'].includes(entity.species_group);
  const isExotic = ['birds', 'reptiles', 'amphibians'].includes(entity.species_group);
  const isSmall = entity.species_group === 'small-animals';

  let startupCost, annualCost, lifetimeCost;
  if (isFish) {
    startupCost = entity.species_group === 'marine-fish' ? '$300-$1,500' : '$100-$500';
    annualCost = entity.species_group === 'marine-fish' ? '$400-$1,200' : '$150-$500';
    lifetimeCost = entity.species_group === 'marine-fish' ? '$3,000-$15,000' : '$1,000-$5,000';
  } else if (isExotic) {
    startupCost = '$200-$800';
    annualCost = '$300-$800';
    lifetimeCost = '$2,000-$10,000';
  } else if (isSmall) {
    startupCost = '$100-$500';
    annualCost = '$300-$800';
    lifetimeCost = '$1,500-$5,000';
  } else if (entity.species_group === 'cats') {
    startupCost = '$500-$2,000';
    annualCost = '$800-$2,500';
    lifetimeCost = '$12,000-$30,000';
  } else {
    startupCost = '$1,000-$3,000';
    annualCost = '$1,500-$4,500';
    lifetimeCost = '$15,000-$50,000';
  }

  const faqs = [
    [`How much does a ${entity.display_name} cost?`, `Initial purchase/adoption cost varies widely. Budget ${startupCost} for the animal plus initial setup and supplies.`],
    [`What are the monthly costs of owning a ${entity.display_name}?`, `Monthly costs typically include food, supplies, and routine care, averaging $50-$300 depending on the level of care.`],
    [`What is the lifetime cost of a ${entity.display_name}?`, `The estimated lifetime cost of owning a ${entity.display_name} is approximately ${lifetimeCost}, including all food, veterinary care, supplies, and insurance.`],
    [`What unexpected costs should I budget for?`, `Emergency veterinary care is the biggest unexpected cost. Having pet insurance or an emergency fund of $1,000-$3,000 is recommended.`],
    [`How can I reduce the cost of owning a ${entity.display_name}?`, `Buy supplies in bulk, use preventive care to avoid expensive treatments, compare insurance plans, and invest in quality food to prevent health issues.`],
  ];

  const html = `${buildHead({ title, description: desc, canonical, cssPath: '../../../styles.css', ogImage: entity.hero_image_src, schema: buildFaqSchema(faqs) })}
${buildNav(speciesTerms[entity.species_group].navLink)}
${buildBreadcrumb(entity, 'Cost to Own')}

    <article class="guide-content">
      <h1>${esc(title)}</h1>
${heroImageBlock(entity)}

      <p>Before bringing a ${entity.display_name} home, it's essential to understand the full financial commitment. This guide breaks down every cost you can expect from day one through your pet's entire life.</p>

      <h2>Cost Summary at a Glance</h2>
      <table class="comparison-table">
        <tr><th>Cost Category</th><th>Estimated Amount</th></tr>
        <tr><td><strong>Startup Costs</strong></td><td><strong>${startupCost}</strong></td></tr>
        <tr><td><strong>Annual Costs</strong></td><td><strong>${annualCost}</strong></td></tr>
        <tr><td><strong>Estimated Lifetime Cost</strong></td><td><strong>${lifetimeCost}</strong></td></tr>
      </table>

      <h2>Startup Cost Breakdown</h2>
      <ul>
        <li><strong>Animal purchase/adoption:</strong> Varies widely based on source, lineage, and location.</li>
        <li><strong>${t.habitat} and setup:</strong> Initial ${t.habitat.toLowerCase()} purchase and all necessary equipment.</li>
        <li><strong>First vet visit:</strong> Initial health check, vaccinations, and any needed procedures.</li>
        <li><strong>Supplies:</strong> ${t.feeding}, bowls, bedding, ${t.enrichment.toLowerCase()}, and grooming tools.</li>
      </ul>

${buildAffiliateTable(partners, `Save on ${entity.display_name} Care`)}

      <h2>Ongoing Monthly Expenses</h2>
      <table class="comparison-table">
        <tr><th>Expense</th><th>Monthly Estimate</th></tr>
        <tr><td>${t.feeding}</td><td>${isFish ? '$10-$30' : isExotic || isSmall ? '$15-$40' : '$30-$100'}</td></tr>
        <tr><td>Routine Vet Care</td><td>${isFish ? '$5-$15' : '$20-$50'}</td></tr>
        <tr><td>Insurance</td><td>$15-$60</td></tr>
        <tr><td>Supplies & ${t.enrichment}</td><td>${isFish ? '$10-$30' : '$15-$50'}</td></tr>
        <tr><td>Grooming/Maintenance</td><td>${isFish ? '$5-$20' : '$10-$60'}</td></tr>
      </table>

      <h2>Ways to Save</h2>
      <ul>
        <li>Buy supplies in bulk and watch for sales at major pet retailers.</li>
        <li>Invest in preventive care to avoid costly emergency treatments.</li>
        <li>Compare pet insurance plans to find the best value for your budget.</li>
        <li>Choose quality ${t.feeding.toLowerCase()} that prevents health issues long-term.</li>
      </ul>

${buildAffiliateCallout(partners.slice(2, 5), 'Smart Savings Options')}
${buildDisclaimer()}
${buildRelatedLinks(entity, allEntities, 'cost-to-own')}
    </article>
${buildFooter()}`;

  return { html, canonical };
}

function genHealthCosts(entity, allEntities) {
  const t = speciesTerms[entity.species_group];
  const title = `Common Health Problems in ${entity.display_name} (With Cost Estimates)`;
  const desc = `Common health issues in ${entity.display_name} with estimated treatment costs. Know what to watch for and how to budget for veterinary care.`;
  const canonical = `${SITE}/commercial/${entity.species_group}/${entity.slug}/health-costs`;
  const partners = pickAffiliates(getAffiliateCategories('health-costs', entity.species_group));

  const isFish = ['fish', 'marine-fish'].includes(entity.species_group);

  const faqs = [
    [`What are the most common health problems in ${entity.display_name}?`, `Like all ${t.navLabel.toLowerCase()}, ${entity.display_name} can be prone to species-specific conditions. Regular veterinary checkups help catch issues early when treatment is most effective and affordable.`],
    [`How much do vet bills cost for ${entity.display_name}?`, `Routine checkups typically cost $50-$200. Emergency or specialist care can range from $500-$5,000+ depending on the condition.`],
    [`Does pet insurance cover breed-specific conditions?`, `Most comprehensive pet insurance plans cover breed and species-specific conditions as long as they aren't pre-existing. Enroll early for the broadest coverage.`],
    [`How can I prevent health problems in ${entity.display_name}?`, `Provide proper nutrition, regular exercise, routine vet visits, and a clean, appropriate environment. Prevention is always more affordable than treatment.`],
    [`When should I take my ${entity.display_name} to the vet?`, `Schedule annual wellness exams. Seek immediate care for sudden changes in appetite, behavior, energy level, breathing, or any signs of pain or distress.`],
  ];

  const html = `${buildHead({ title, description: desc, canonical, cssPath: '../../../styles.css', ogImage: entity.hero_image_src, schema: buildFaqSchema(faqs) })}
${buildNav(speciesTerms[entity.species_group].navLink)}
${buildBreadcrumb(entity, 'Health Costs')}

    <article class="guide-content">
      <h1>${esc(title)}</h1>
${heroImageBlock(entity)}

      <p>Understanding the common health issues that can affect your ${entity.display_name} helps you prepare financially and catch problems early. This guide covers what to watch for and estimated treatment costs.</p>

      <h2>Common Health Issues & Estimated Costs</h2>
      <table class="comparison-table">
        <tr><th>Condition</th><th>Estimated Treatment Cost</th><th>Severity</th></tr>
        <tr><td>Routine wellness exam</td><td>$50-$200</td><td>Preventive</td></tr>
        <tr><td>Minor illness/infection</td><td>$100-$500</td><td>Low-Moderate</td></tr>
        <tr><td>Diagnostic testing (blood work, imaging)</td><td>$200-$1,000</td><td>Moderate</td></tr>
        <tr><td>Surgery (non-emergency)</td><td>$500-$3,000</td><td>Moderate-High</td></tr>
        <tr><td>Emergency/critical care</td><td>$1,000-$5,000+</td><td>High</td></tr>
        <tr><td>Specialist referral</td><td>$500-$3,000+</td><td>Varies</td></tr>
      </table>

${buildAffiliateTable(partners, 'Protect Against Unexpected Costs')}

      <h2>Prevention Tips</h2>
      <ul>
        <li><strong>Regular checkups:</strong> Annual or semi-annual veterinary visits catch issues early.</li>
        <li><strong>Proper nutrition:</strong> A species-appropriate diet prevents many common health problems.</li>
        <li><strong>Clean environment:</strong> Maintain proper ${isFish ? 'water quality and tank conditions' : 'habitat cleanliness and hygiene'}.</li>
        <li><strong>Appropriate exercise:</strong> Regular activity maintains healthy weight and mental health.</li>
        <li><strong>Pet insurance:</strong> Comprehensive coverage ensures you can afford treatment when needed.</li>
      </ul>

      <h2>Building a Vet Fund</h2>
      <p>Even with insurance, having an emergency fund is wise. Set aside $50-$100 per month specifically for pet healthcare. This builds a safety net of $600-$1,200 per year that can cover deductibles or unexpected costs not fully covered by insurance.</p>

${buildAffiliateCallout(partners.slice(2, 5), 'Vet Care & Insurance Options')}
${buildDisclaimer()}
${buildRelatedLinks(entity, allEntities, 'health-costs')}
    </article>
${buildFooter()}`;

  return { html, canonical };
}

function genFirstTimeOwners(entity, allEntities) {
  const t = speciesTerms[entity.species_group];
  const title = `Is ${entity.display_name} Good for First-Time Owners? (Honest Guide)`;
  const desc = `Should a first-time pet owner get a ${entity.display_name}? Honest assessment of care difficulty, costs, time commitment, and what to expect.`;
  const canonical = `${SITE}/commercial/${entity.species_group}/${entity.slug}/first-time-owners`;
  const partners = pickAffiliates(getAffiliateCategories('first-time-owners', entity.species_group));

  const faqs = [
    [`Is ${entity.display_name} a good pet for beginners?`, `${entity.display_name} can be a good choice for dedicated beginners who research care requirements thoroughly. Success depends on your commitment to proper care, budget, and time.`],
    [`How much time does ${entity.display_name} care require daily?`, `Daily care includes feeding, habitat maintenance, and interaction. Plan for at least 30 minutes to 2 hours of daily care depending on the species' needs.`],
    [`What should I know before getting a ${entity.display_name}?`, `Research the full cost of ownership, space requirements, dietary needs, common health issues, and expected lifespan. Be prepared for a long-term commitment.`],
    [`What supplies do I need for a ${entity.display_name}?`, `Essential supplies include appropriate ${t.habitat.toLowerCase()}, ${t.feeding.toLowerCase()}, water/food dishes, ${t.enrichment.toLowerCase()}, and species-specific care items.`],
    [`How do I find a reputable ${entity.display_name} breeder or rescue?`, `Research breeders thoroughly, ask for health certifications, visit facilities when possible, and consider adoption from species-specific rescues.`],
  ];

  const html = `${buildHead({ title, description: desc, canonical, cssPath: '../../../styles.css', ogImage: entity.hero_image_src, schema: buildFaqSchema(faqs) })}
${buildNav(speciesTerms[entity.species_group].navLink)}
${buildBreadcrumb(entity, 'First-Time Owners')}

    <article class="guide-content">
      <h1>${esc(title)}</h1>
${heroImageBlock(entity)}

      <p>Thinking about getting a ${entity.display_name} as your first pet? This honest guide covers everything you need to know before making the commitment &mdash; including care difficulty, real costs, and what daily life looks like.</p>

      <h2>Quick Assessment</h2>
      <table class="comparison-table">
        <tr><th>Factor</th><th>Rating</th></tr>
        <tr><td>Care Difficulty</td><td>Moderate &mdash; research required</td></tr>
        <tr><td>Time Commitment</td><td>30 min to 2+ hours daily</td></tr>
        <tr><td>Space Required</td><td>Appropriate ${t.habitat.toLowerCase()} + room for enrichment</td></tr>
        <tr><td>Budget Required</td><td>Moderate to high (ongoing costs)</td></tr>
        <tr><td>Beginner Suitability</td><td>Suitable with proper preparation</td></tr>
      </table>

${buildAffiliateTable(partners, 'Starter Essentials')}

      <h2>Pros for First-Time Owners</h2>
      <ul>
        <li><strong>Rewarding companionship:</strong> ${entity.display_name} can form strong bonds with dedicated owners.</li>
        <li><strong>Learning opportunity:</strong> Caring for a pet teaches responsibility and empathy.</li>
        <li><strong>Community support:</strong> Active online communities provide guidance and troubleshooting help.</li>
        <li><strong>Available resources:</strong> Extensive care guides, veterinary support, and quality supplies are readily available.</li>
      </ul>

      <h2>Challenges to Consider</h2>
      <ul>
        <li><strong>Ongoing costs:</strong> ${t.feeding}, veterinary care, and supplies add up over time.</li>
        <li><strong>Time commitment:</strong> Daily feeding, cleaning, and interaction are non-negotiable.</li>
        <li><strong>Health concerns:</strong> Be prepared for potential medical expenses and know your nearest specialist vet.</li>
        <li><strong>Long-term commitment:</strong> Consider the full lifespan and whether you can commit for the duration.</li>
      </ul>

      <h2>First-Time Owner Checklist</h2>
      <ol>
        <li>Research care requirements extensively before purchasing.</li>
        <li>Budget for startup costs AND ongoing monthly expenses.</li>
        <li>Set up the ${t.habitat.toLowerCase()} completely before bringing your ${entity.display_name} home.</li>
        <li>Find a veterinarian experienced with ${t.navLabel.toLowerCase()} in your area.</li>
        <li>Consider pet insurance to protect against unexpected costs.</li>
        <li>Join online communities for species-specific advice and support.</li>
      </ol>

${buildAffiliateCallout(partners.slice(2, 5), 'Getting Started')}
${buildDisclaimer()}
${buildRelatedLinks(entity, allEntities, 'first-time-owners')}
    </article>
${buildFooter()}`;

  return { html, canonical };
}

function genBestHabitat(entity, allEntities) {
  const t = speciesTerms[entity.species_group];
  const title = `Best ${t.habitat} Size for ${entity.display_name} (2026 Guide)`;
  const desc = `Recommended ${t.habitat.toLowerCase()} size and setup for ${entity.display_name}. Complete guide to housing, dimensions, equipment, and accessories.`;
  const canonical = `${SITE}/commercial/${entity.species_group}/${entity.slug}/best-habitat-size`;
  const partners = pickAffiliates(getAffiliateCategories('best-habitat-size', entity.species_group));

  const isFish = ['fish', 'marine-fish'].includes(entity.species_group);

  const faqs = [
    [`What size ${t.habitat.toLowerCase()} does a ${entity.display_name} need?`, `${entity.display_name} requires an appropriately sized ${t.habitat.toLowerCase()} based on their adult size and activity level. Always choose the largest ${t.habitat.toLowerCase()} you can accommodate and afford.`],
    [`What equipment do I need for a ${entity.display_name} ${t.habitat.toLowerCase()}?`, `Essential equipment includes ${isFish ? 'filtration, heating, lighting, and water testing kits' : `appropriate substrate, temperature control, lighting, and ${t.enrichment.toLowerCase()} items`}.`],
    [`How much does a ${entity.display_name} ${t.habitat.toLowerCase()} setup cost?`, `A complete setup typically ranges from $100-$1,000+ depending on size and quality of equipment chosen.`],
    [`Can I use a smaller ${t.habitat.toLowerCase()} for a baby ${entity.display_name}?`, `It's generally better to start with an adult-sized ${t.habitat.toLowerCase()}. This avoids the cost of upgrading later and provides a stable environment from day one.`],
    [`How often should I clean the ${t.habitat.toLowerCase()}?`, `Perform partial cleaning weekly and thorough cleaning monthly. ${isFish ? 'Weekly water changes of 10-25% are essential.' : 'Spot-clean daily and do a full substrate change monthly.'}`],
  ];

  const html = `${buildHead({ title, description: desc, canonical, cssPath: '../../../styles.css', ogImage: entity.hero_image_src, schema: buildFaqSchema(faqs) })}
${buildNav(speciesTerms[entity.species_group].navLink)}
${buildBreadcrumb(entity, `Best ${t.habitat} Size`)}

    <article class="guide-content">
      <h1>${esc(title)}</h1>
${heroImageBlock(entity)}

      <p>The right ${t.habitat.toLowerCase()} is the foundation of good ${entity.display_name} care. This guide covers recommended sizes, essential equipment, and setup tips to keep your pet healthy and comfortable.</p>

      <h2>${t.habitat} Size Recommendations</h2>
      <table class="comparison-table">
        <tr><th>${t.habitat} Size</th><th>Suitability</th><th>Est. Cost</th></tr>
        <tr><td>Minimum Required</td><td>Bare minimum &mdash; not ideal</td><td>$50-$150</td></tr>
        <tr><td>Recommended</td><td>Good for most ${entity.display_name}</td><td>$100-$300</td></tr>
        <tr><td>Ideal/Premium</td><td>Optimal space and enrichment</td><td>$200-$600+</td></tr>
      </table>

${buildAffiliateTable(partners, `Top ${t.habitat} Options`)}

      <h2>Essential Equipment</h2>
      <ul>
        <li><strong>${isFish ? 'Filtration system' : 'Temperature control'}:</strong> ${isFish ? 'Appropriate filtration rated for your tank size.' : 'Heating and/or cooling to maintain species-appropriate temperatures.'}</li>
        <li><strong>Lighting:</strong> ${isFish ? 'LED lighting on a timer for consistent photoperiod.' : 'UVB and/or heat lamps as required for the species.'}</li>
        <li><strong>Substrate:</strong> Species-appropriate substrate for comfort and hygiene.</li>
        <li><strong>Hides and decor:</strong> Multiple hiding spots and visual barriers reduce stress.</li>
        <li><strong>${t.enrichment}:</strong> Items that encourage natural behaviors and mental stimulation.</li>
      </ul>

      <h2>Setup Tips</h2>
      <ul>
        <li>Set up the ${t.habitat.toLowerCase()} at least ${isFish ? '2-4 weeks' : '1 week'} before bringing your ${entity.display_name} home.</li>
        <li>Place the ${t.habitat.toLowerCase()} away from direct sunlight, drafts, and high-traffic areas.</li>
        <li>Test all equipment thoroughly before introducing your pet.</li>
        <li>Have backup supplies (extra ${isFish ? 'filter media and heater' : 'bulbs and heat sources'}) on hand.</li>
      </ul>

${buildAffiliateCallout(partners.slice(2, 5), 'Shop Supplies')}
${buildDisclaimer()}
${buildRelatedLinks(entity, allEntities, 'best-habitat-size')}
    </article>
${buildFooter()}`;

  return { html, canonical };
}

function genBestEnrichment(entity, allEntities) {
  const t = speciesTerms[entity.species_group];
  const title = `Best ${t.enrichment} for ${entity.display_name} (2026 Guide)`;
  const desc = `Top ${t.enrichment.toLowerCase()} recommendations for ${entity.display_name}. Keep your pet mentally stimulated, physically active, and happy.`;
  const canonical = `${SITE}/commercial/${entity.species_group}/${entity.slug}/best-enrichment`;
  const partners = pickAffiliates(getAffiliateCategories('best-enrichment', entity.species_group));

  const isFish = ['fish', 'marine-fish'].includes(entity.species_group);
  const isDog = entity.species_group === 'dogs';
  const isCat = entity.species_group === 'cats';

  let enrichTypes;
  if (isFish) {
    enrichTypes = `<li><strong>Aquascaping:</strong> Live plants, rocks, and driftwood create natural environments.</li>
        <li><strong>Tank mates:</strong> Compatible species add activity and visual interest.</li>
        <li><strong>Feeding variety:</strong> Alternate between different food types for stimulation.</li>
        <li><strong>Water flow features:</strong> Adjustable flow creates exercise opportunities.</li>`;
  } else if (isDog) {
    enrichTypes = `<li><strong>Puzzle toys:</strong> Interactive feeders that challenge your dog mentally.</li>
        <li><strong>Chew toys:</strong> Durable chews for dental health and stress relief.</li>
        <li><strong>Fetch and tug toys:</strong> Active play toys for physical exercise.</li>
        <li><strong>Snuffle mats:</strong> Encourage natural foraging and nose work behaviors.</li>`;
  } else if (isCat) {
    enrichTypes = `<li><strong>Interactive toys:</strong> Wand toys, laser pointers, and motion-activated toys.</li>
        <li><strong>Climbing structures:</strong> Cat trees, shelves, and vertical spaces.</li>
        <li><strong>Puzzle feeders:</strong> Slow feeders and treat-dispensing toys.</li>
        <li><strong>Scratching posts:</strong> Multiple textures and orientations for claw maintenance.</li>`;
  } else {
    enrichTypes = `<li><strong>Foraging opportunities:</strong> Hide food to encourage natural searching behaviors.</li>
        <li><strong>Climbing and exploring:</strong> Branches, tunnels, and platforms for physical activity.</li>
        <li><strong>Sensory enrichment:</strong> New textures, scents, and rearranged decor stimulate curiosity.</li>
        <li><strong>Social interaction:</strong> Regular handling or visual contact (species-appropriate).</li>`;
  }

  const faqs = [
    [`What are the best ${t.enrichment.toLowerCase()} for ${entity.display_name}?`, `The best enrichment encourages natural behaviors. For ${entity.display_name}, this includes foraging opportunities, physical activity, mental challenges, and environmental variety.`],
    [`How much enrichment does ${entity.display_name} need?`, `Provide multiple forms of enrichment and rotate them regularly. Aim for at least 15-60 minutes of active engagement daily, plus passive enrichment always available.`],
    [`Can ${entity.display_name} get bored?`, `Yes, all pets can experience boredom which may lead to stress, destructive behaviors, or health issues. Regular enrichment prevents these problems.`],
    [`How often should I rotate ${t.enrichment.toLowerCase()}?`, `Rotate enrichment items weekly to maintain novelty. Introducing new items and re-introducing old favorites keeps your pet engaged and curious.`],
    [`What is the best budget-friendly enrichment for ${entity.display_name}?`, `Many effective enrichment options are free or low-cost: cardboard boxes, paper bags, DIY puzzle feeders, and rearranging habitat decor all provide excellent stimulation.`],
  ];

  const html = `${buildHead({ title, description: desc, canonical, cssPath: '../../../styles.css', ogImage: entity.hero_image_src, schema: buildFaqSchema(faqs) })}
${buildNav(speciesTerms[entity.species_group].navLink)}
${buildBreadcrumb(entity, `Best ${t.enrichment}`)}

    <article class="guide-content">
      <h1>${esc(title)}</h1>
${heroImageBlock(entity)}

      <p>Mental stimulation and physical activity are essential for a happy, healthy ${entity.display_name}. The right ${t.enrichment.toLowerCase()} prevents boredom, reduces stress, and encourages natural behaviors.</p>

${buildAffiliateTable(partners, `Top ${t.enrichment} for ${entity.display_name}`)}

      <h2>Types of ${t.enrichment}</h2>
      <ul>
${enrichTypes}
      </ul>

      <h2>Enrichment Budget Guide</h2>
      <table class="comparison-table">
        <tr><th>Category</th><th>Monthly Budget</th></tr>
        <tr><td>DIY / Free Options</td><td>$0</td></tr>
        <tr><td>Basic ${t.enrichment}</td><td>$10-$30</td></tr>
        <tr><td>Premium / Interactive</td><td>$25-$75</td></tr>
        <tr><td>Subscription Boxes</td><td>$20-$50</td></tr>
      </table>

      <h2>Enrichment Schedule</h2>
      <ul>
        <li><strong>Daily:</strong> Active engagement time with interactive ${t.enrichment.toLowerCase()} or handling.</li>
        <li><strong>Weekly:</strong> Rotate toys and enrichment items to maintain novelty.</li>
        <li><strong>Monthly:</strong> Introduce new enrichment items or rearrange the habitat.</li>
        <li><strong>Seasonally:</strong> Adjust enrichment types based on your pet's changing needs and interests.</li>
      </ul>

${buildAffiliateCallout(partners.slice(2, 5), `Shop ${t.enrichment}`)}
${buildDisclaimer()}
${buildRelatedLinks(entity, allEntities, 'best-enrichment')}
    </article>
${buildFooter()}`;

  return { html, canonical };
}

function genVsComparison(entity, compEntity, allEntities) {
  const t = speciesTerms[entity.species_group];
  const title = `${entity.display_name} vs ${compEntity.display_name}: Complete Comparison (2026)`;
  const desc = `${entity.display_name} vs ${compEntity.display_name} comparison covering size, temperament, care difficulty, costs, and which is right for you.`;
  const canonical = `${SITE}/commercial/${entity.species_group}/${entity.slug}/vs-${compEntity.slug}`;
  const partners = pickAffiliates(['foodAndNutrition', 'insuranceAndWellness']);

  const faqs = [
    [`Which is better, ${entity.display_name} or ${compEntity.display_name}?`, `Neither is objectively better &mdash; the best choice depends on your lifestyle, experience level, budget, and living situation. Both make wonderful pets for the right owner.`],
    [`Is ${entity.display_name} easier to care for than ${compEntity.display_name}?`, `Care difficulty varies based on species-specific needs. Research both thoroughly and choose the one that best matches your available time and resources.`],
    [`Which costs more, ${entity.display_name} or ${compEntity.display_name}?`, `Costs vary based on individual needs, location, and care level. Compare initial setup costs, monthly food expenses, and potential veterinary costs for each.`],
    [`Can ${entity.display_name} and ${compEntity.display_name} live together?`, `Compatibility depends on species, temperament, and housing setup. Research carefully before housing different species together, and always provide separate resources.`],
  ];

  const html = `${buildHead({ title, description: desc, canonical, cssPath: '../../../styles.css', ogImage: entity.hero_image_src, schema: buildFaqSchema(faqs) })}
${buildNav(speciesTerms[entity.species_group].navLink)}
${buildBreadcrumb(entity, `vs ${compEntity.display_name}`)}

    <article class="guide-content">
      <h1>${esc(title)}</h1>
${heroImageBlock(entity)}

      <p>Trying to decide between a ${entity.display_name} and a ${compEntity.display_name}? This side-by-side comparison covers the key differences in care, temperament, costs, and suitability to help you make the right choice.</p>

      <h2>Side-by-Side Comparison</h2>
      <table class="comparison-table">
        <tr><th>Factor</th><th>${esc(entity.display_name)}</th><th>${esc(compEntity.display_name)}</th></tr>
        <tr><td>Space Needed</td><td>Species-appropriate ${t.habitat.toLowerCase()}</td><td>Species-appropriate ${t.habitat.toLowerCase()}</td></tr>
        <tr><td>Care Difficulty</td><td>Varies by individual</td><td>Varies by individual</td></tr>
        <tr><td>Monthly Cost</td><td>$50-$200+</td><td>$50-$200+</td></tr>
        <tr><td>Time Commitment</td><td>30 min-2 hrs daily</td><td>30 min-2 hrs daily</td></tr>
        <tr><td>Beginner Friendly</td><td>Research required</td><td>Research required</td></tr>
      </table>

${buildAffiliateTable(partners, 'Recommended Resources')}

      <h2>Choose ${entity.display_name} If...</h2>
      <ul>
        <li>You've researched ${entity.display_name}-specific care requirements thoroughly.</li>
        <li>Your living space can accommodate the proper ${t.habitat.toLowerCase()} setup.</li>
        <li>You're prepared for the long-term commitment and costs.</li>
        <li>You find ${entity.display_name}'s specific traits and personality appealing.</li>
      </ul>

      <h2>Choose ${compEntity.display_name} If...</h2>
      <ul>
        <li>You've researched ${compEntity.display_name}-specific care requirements thoroughly.</li>
        <li>${compEntity.display_name}'s care requirements better match your lifestyle.</li>
        <li>You prefer ${compEntity.display_name}'s specific temperament and characteristics.</li>
        <li>Your budget and space better suit ${compEntity.display_name}'s needs.</li>
      </ul>

      <h2>Learn More About Each</h2>
      <ul>
        <li><a href="/breeds/${entity.species_group}/${entity.slug}" style="color:#0D9488;font-weight:600;">${entity.display_name} Complete Guide &rarr;</a></li>
        <li><a href="/breeds/${compEntity.species_group}/${compEntity.slug}" style="color:#0D9488;font-weight:600;">${compEntity.display_name} Complete Guide &rarr;</a></li>
      </ul>

${buildAffiliateCallout(partners.slice(2, 5), 'Get Started')}
${buildDisclaimer()}
${buildRelatedLinks(entity, allEntities, 'vs-comparison')}
    </article>
${buildFooter()}`;

  return { html, canonical };
}

// ============================================================
// MAIN EXECUTION
// ============================================================
console.log('=== Commercial Page Engine ===');
console.log('Phase 0: Extracting entity data...');
const entities = extractEntities();
console.log(`  Found ${entities.length} entities across ${[...new Set(entities.map(e => e.species_group))].length} species groups`);

// Save entities.json
writeFileSync(join(ROOT, 'data', 'entities.json'), JSON.stringify(entities, null, 2));
console.log('  Saved data/entities.json');

// Generate commercial pages
console.log('Phase 1: Generating commercial pages...');
let totalPages = 0;
const sitemapUrls = [];

const pageTypes = [
  { name: 'best-food',          gen: genBestFood },
  { name: 'best-insurance',     gen: genBestInsurance },
  { name: 'cost-to-own',        gen: genCostToOwn },
  { name: 'health-costs',       gen: genHealthCosts },
  { name: 'first-time-owners',  gen: genFirstTimeOwners },
  { name: 'best-habitat-size',  gen: genBestHabitat },
  { name: 'best-enrichment',    gen: genBestEnrichment },
];

for (const entity of entities) {
  const dir = join(ROOT, 'commercial', entity.species_group, entity.slug);
  mkdirSync(dir, { recursive: true });

  // Generate 7 standard pages
  for (const pt of pageTypes) {
    const result = pt.gen(entity, entities);
    writeFileSync(join(dir, `${pt.name}.html`), result.html);
    sitemapUrls.push(result.canonical);
    totalPages++;
  }

  // Generate comparison pages (1-2 per entity)
  const similar = findSimilar(entity, entities);
  for (const comp of similar) {
    const result = genVsComparison(entity, comp, entities);
    writeFileSync(join(dir, `vs-${comp.slug}.html`), result.html);
    sitemapUrls.push(result.canonical);
    totalPages++;
  }
}

console.log(`  Generated ${totalPages} commercial pages for ${entities.length} entities`);

// Update sitemap.xml
console.log('Phase 2: Updating sitemap.xml...');
const existingSitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
const closingTag = '</urlset>';
const commercialEntries = sitemapUrls.map(url => `  <url>
    <loc>${url}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n');

const newSitemap = existingSitemap.replace(closingTag, `${commercialEntries}\n${closingTag}`);
writeFileSync(join(ROOT, 'sitemap.xml'), newSitemap);
console.log(`  Added ${sitemapUrls.length} URLs to sitemap.xml`);

// Summary
console.log('\n=== Generation Complete ===');
console.log(`Total entities: ${entities.length}`);
console.log(`Total commercial pages: ${totalPages}`);
console.log(`Sitemap URLs added: ${sitemapUrls.length}`);

// Write manifest for validation
writeFileSync(join(ROOT, 'data', 'commercial-manifest.json'), JSON.stringify({
  generated: TODAY,
  entityCount: entities.length,
  pageCount: totalPages,
  sitemapUrlCount: sitemapUrls.length,
  speciesGroups: [...new Set(entities.map(e => e.species_group))],
}, null, 2));
console.log('Saved data/commercial-manifest.json');
