#!/usr/bin/env node
/**
 * fix-indexability.js — Surgical fixes for "Crawled - currently not indexed" GSC issue
 *
 * 1. Remove empty/invalid FAQPage schemas ("mainEntity": [])
 * 2. Regenerate sitemap.xml with commercial pages included
 * 3. Create sitemap index for better crawl management
 * 4. Fix generic placeholder tables in cost guide pages
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');

// ============================================================
// FIX 1: Remove empty FAQPage schemas
// ============================================================

console.log('=== Fix 1: Removing empty FAQPage schemas ===');

function fixEmptyFAQSchemas(dir) {
  let fixed = 0;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      fixed += fixEmptyFAQSchemas(fullPath);
    } else if (entry.name.endsWith('.html')) {
      let html = readFileSync(fullPath, 'utf8');
      // Match script tags containing FAQPage with empty mainEntity
      const emptyFAQPattern = /<script type="application\/ld\+json">\s*\{[^}]*"@type"\s*:\s*"FAQPage"[^<]*"mainEntity"\s*:\s*\[\s*\][^<]*\}\s*<\/script>/g;
      if (emptyFAQPattern.test(html)) {
        html = html.replace(emptyFAQPattern, '');
        // Clean up any resulting double newlines
        html = html.replace(/\n\s*\n\s*\n/g, '\n\n');
        writeFileSync(fullPath, html);
        fixed++;
      }
    }
  }
  return fixed;
}

const faqFixed = fixEmptyFAQSchemas(join(ROOT, 'guides'));
console.log(`  Fixed ${faqFixed} pages with empty FAQPage schemas.`);

// ============================================================
// FIX 2: Regenerate sitemap with commercial pages + sitemap index
// ============================================================

console.log('\n=== Fix 2: Regenerating sitemap with commercial pages ===');

const TODAY = new Date().toISOString().split('T')[0];

function collectHtmlUrls(dir, urlPrefix) {
  const urls = [];
  if (!existsSync(dir)) return urls;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      urls.push(...collectHtmlUrls(join(dir, entry.name), `${urlPrefix}/${entry.name}`));
    } else if (entry.name.endsWith('.html')) {
      const slug = entry.name === 'index.html' ? '' : entry.name.replace('.html', '');
      const url = slug ? `${urlPrefix}/${slug}` : `${urlPrefix}/`;
      urls.push(url);
    }
  }
  return urls;
}

// Collect URLs by section
const breedUrls = collectHtmlUrls(join(ROOT, 'breeds'), '/breeds').sort();
const guideUrls = collectHtmlUrls(join(ROOT, 'guides'), '/guides').sort();
const commercialUrls = collectHtmlUrls(join(ROOT, 'commercial'), '/commercial').sort();
const locationUrls = collectHtmlUrls(join(ROOT, 'locations'), '/locations').sort();

// Top-level + other sections
const otherUrls = [];
const topLevelFiles = readdirSync(ROOT).filter(f => f.endsWith('.html'));
for (const f of topLevelFiles) {
  const slug = f === 'index.html' ? '' : f.replace('.html', '');
  otherUrls.push(slug ? `/${slug}` : '/');
}
otherUrls.push(...collectHtmlUrls(join(ROOT, 'tools'), '/tools'));
otherUrls.push(...collectHtmlUrls(join(ROOT, 'resources'), '/resources'));
otherUrls.sort();

// Exclude non-indexable paths
const excludePrefixes = ['/embed/', '/feeds/', '/chat', '/404', '/styles.css'];
function shouldInclude(url) {
  return !excludePrefixes.some(prefix => url === prefix || url.startsWith(prefix + '/') || url.startsWith(prefix + '.'));
}

function getPriority(url) {
  if (url === '/') return '1.0';
  if (['/dogs', '/cats', '/birds', '/reptiles', '/fish', '/marine-fish', '/amphibians', '/small-animals', '/guides'].includes(url)) return '0.9';
  if (url.startsWith('/breeds/') && url.split('/').length === 3) return '0.8';
  if (url.startsWith('/guides/')) return '0.7';
  if (url.startsWith('/breeds/')) return '0.7';
  if (url.startsWith('/commercial/')) return '0.6';
  if (url.startsWith('/locations/')) return '0.6';
  return '0.5';
}

function buildSitemapXml(urls, comment) {
  const filteredUrls = [...new Set(urls)].filter(shouldInclude).sort();
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${comment} -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${filteredUrls.map(url => `  <url>
    <loc>https://petcarehelperai.com${url}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${getPriority(url)}</priority>
  </url>`).join('\n')}
</urlset>`;
}

// Write sub-sitemaps
writeFileSync(join(ROOT, 'sitemap-breeds.xml'), buildSitemapXml(breedUrls, 'Breed pages'));
writeFileSync(join(ROOT, 'sitemap-guides.xml'), buildSitemapXml(guideUrls, 'Guide pages'));
writeFileSync(join(ROOT, 'sitemap-commercial.xml'), buildSitemapXml(commercialUrls, 'Commercial/decision pages'));
writeFileSync(join(ROOT, 'sitemap-pages.xml'), buildSitemapXml([...otherUrls, ...locationUrls], 'Core pages, locations, tools, resources'));

// Write sitemap index
const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://petcarehelperai.com/sitemap-pages.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://petcarehelperai.com/sitemap-breeds.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://petcarehelperai.com/sitemap-guides.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://petcarehelperai.com/sitemap-commercial.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
</sitemapindex>`;

writeFileSync(join(ROOT, 'sitemap.xml'), sitemapIndex);

const filteredBreeds = [...new Set(breedUrls)].filter(shouldInclude);
const filteredGuides = [...new Set(guideUrls)].filter(shouldInclude);
const filteredCommercial = [...new Set(commercialUrls)].filter(shouldInclude);
const filteredOther = [...new Set([...otherUrls, ...locationUrls])].filter(shouldInclude);

console.log(`  sitemap-pages.xml: ${filteredOther.length} URLs`);
console.log(`  sitemap-breeds.xml: ${filteredBreeds.length} URLs`);
console.log(`  sitemap-guides.xml: ${filteredGuides.length} URLs`);
console.log(`  sitemap-commercial.xml: ${filteredCommercial.length} URLs`);
console.log(`  Total: ${filteredOther.length + filteredBreeds.length + filteredGuides.length + filteredCommercial.length} URLs`);

// ============================================================
// FIX 3: Fix generic placeholder cost tables in guide pages
// ============================================================

console.log('\n=== Fix 3: Fixing generic placeholder cost tables ===');

const genericCostTable = `<tr><td>Basic Service</td><td>$50 – $200</td><td>Varies by region and provider</td></tr>
        <tr><td>Mid-Range Option</td><td>$200 – $500</td><td>Includes standard care package</td></tr>
        <tr><td>Premium/Emergency</td><td>$500 – $2,000+</td><td>Specialist or after-hours rates apply</td></tr>
        <tr><td>Ongoing/Annual</td><td>$300 – $1,500/year</td><td>Preventive care and maintenance</td></tr>`;

// Topic-specific cost replacement data
const costReplacements = {
  'emergency-vet-costs': {
    rows: `<tr><td>Emergency exam fee</td><td>$150 – $350</td><td>After-hours and weekend rates higher</td></tr>
        <tr><td>Diagnostic imaging (X-ray/ultrasound)</td><td>$250 – $800</td><td>Often needed for trauma or internal issues</td></tr>
        <tr><td>Emergency surgery</td><td>$1,500 – $5,000+</td><td>Bloat, foreign body, fracture repair</td></tr>
        <tr><td>ICU hospitalization (per day)</td><td>$600 – $2,500</td><td>Continuous monitoring and IV fluids</td></tr>`
  },
  'pet-medication-costs': {
    rows: `<tr><td>Flea/tick prevention (monthly)</td><td>$15 – $50</td><td>Varies by pet weight and brand</td></tr>
        <tr><td>Heartworm prevention (monthly)</td><td>$10 – $30</td><td>Required year-round in most regions</td></tr>
        <tr><td>Chronic condition meds (monthly)</td><td>$30 – $200</td><td>Arthritis, thyroid, seizure, allergy meds</td></tr>
        <tr><td>Antibiotic course (7-14 days)</td><td>$20 – $150</td><td>Depends on drug type and pet size</td></tr>`
  },
  'flea-tick-prevention-cost': {
    rows: `<tr><td>Topical treatment (monthly)</td><td>$15 – $25</td><td>Frontline, Advantage, Revolution</td></tr>
        <tr><td>Oral chewable (monthly)</td><td>$20 – $50</td><td>NexGard, Simparica, Bravecto</td></tr>
        <tr><td>Flea collar (8 months)</td><td>$50 – $75</td><td>Seresto; lasts up to 8 months</td></tr>
        <tr><td>Annual total (dog)</td><td>$200 – $500/year</td><td>Depends on product and weight class</td></tr>`
  },
  'heartworm-treatment-cost': {
    rows: `<tr><td>Heartworm test</td><td>$35 – $75</td><td>Annual screening recommended</td></tr>
        <tr><td>Monthly prevention</td><td>$10 – $30</td><td>Heartgard, Interceptor, ProHeart</td></tr>
        <tr><td>Treatment (mild infection)</td><td>$1,000 – $2,500</td><td>Immiticide injections + hospitalization</td></tr>
        <tr><td>Treatment (severe infection)</td><td>$3,000 – $5,000+</td><td>Extended protocol with stabilization</td></tr>`
  },
  'cat-surgery-costs': {
    rows: `<tr><td>Spay/neuter</td><td>$200 – $600</td><td>Varies by clinic and weight</td></tr>
        <tr><td>Dental extraction</td><td>$400 – $1,200</td><td>Includes anesthesia and imaging</td></tr>
        <tr><td>Foreign body removal</td><td>$1,500 – $4,000</td><td>Exploratory surgery required</td></tr>
        <tr><td>Tumor removal</td><td>$800 – $3,500</td><td>Biopsy typically additional $200-$400</td></tr>`
  },
  'dog-vaccination-costs': {
    rows: `<tr><td>Core vaccines (DHPP)</td><td>$75 – $150</td><td>Distemper, hepatitis, parvo, parainfluenza</td></tr>
        <tr><td>Rabies vaccine</td><td>$20 – $50</td><td>Required by law in most states</td></tr>
        <tr><td>Bordetella (kennel cough)</td><td>$25 – $50</td><td>Often required for boarding/daycare</td></tr>
        <tr><td>Full puppy series (first year)</td><td>$200 – $400</td><td>3-4 rounds at 3-4 week intervals</td></tr>`
  },
  'cat-vaccination-costs': {
    rows: `<tr><td>FVRCP core vaccine</td><td>$50 – $100</td><td>Feline viral rhinotracheitis, calicivirus, panleukopenia</td></tr>
        <tr><td>Rabies vaccine</td><td>$20 – $50</td><td>Required by law; given at 12-16 weeks</td></tr>
        <tr><td>FeLV vaccine</td><td>$30 – $60</td><td>Recommended for outdoor or multi-cat homes</td></tr>
        <tr><td>Full kitten series (first year)</td><td>$150 – $300</td><td>Includes exam fees and booster rounds</td></tr>`
  },
  'pet-x-ray-cost': {
    rows: `<tr><td>Single-view X-ray</td><td>$75 – $200</td><td>One area; often 2 views taken</td></tr>
        <tr><td>Multi-view X-ray set</td><td>$150 – $400</td><td>Multiple body areas or follow-up views</td></tr>
        <tr><td>Dental X-rays (full mouth)</td><td>$200 – $500</td><td>Requires sedation in most cases</td></tr>
        <tr><td>Contrast/barium study</td><td>$300 – $800</td><td>Used for GI obstruction diagnosis</td></tr>`
  },
  'pet-microchipping-cost': {
    rows: `<tr><td>Microchip implant</td><td>$25 – $75</td><td>Quick injection; no anesthesia needed</td></tr>
        <tr><td>Registration fee</td><td>$0 – $25</td><td>Some chips include free registration</td></tr>
        <tr><td>At low-cost clinic or event</td><td>$10 – $25</td><td>Shelter events often cheapest option</td></tr>
        <tr><td>Bundled with spay/neuter</td><td>$15 – $35 (add-on)</td><td>Discounted when combined with surgery</td></tr>`
  },
  'how-much-does-a-kitten-cost': {
    rows: `<tr><td>Adoption fee (shelter)</td><td>$75 – $200</td><td>Usually includes spay/neuter + first vaccines</td></tr>
        <tr><td>Breeder purchase</td><td>$500 – $2,500+</td><td>Pedigreed breeds; health guarantee varies</td></tr>
        <tr><td>First-year supplies</td><td>$300 – $800</td><td>Litter box, food, carrier, toys, bed</td></tr>
        <tr><td>First-year veterinary</td><td>$400 – $900</td><td>Vaccines, spay/neuter, wellness exams</td></tr>`
  },
  'bird-vet-costs': {
    rows: `<tr><td>Avian wellness exam</td><td>$75 – $200</td><td>Find an avian-specialist vet</td></tr>
        <tr><td>Blood panel</td><td>$100 – $350</td><td>CBC and chemistry for baseline health</td></tr>
        <tr><td>Crop/fecal testing</td><td>$50 – $150</td><td>Screens for infections and parasites</td></tr>
        <tr><td>Emergency/hospital care</td><td>$500 – $2,500+</td><td>After-hours avian ER is limited</td></tr>`
  },
  'reptile-vet-costs': {
    rows: `<tr><td>Herp wellness exam</td><td>$75 – $175</td><td>Exotic vet specialist recommended</td></tr>
        <tr><td>Fecal parasite test</td><td>$30 – $75</td><td>Common in wild-caught reptiles</td></tr>
        <tr><td>Blood work</td><td>$100 – $300</td><td>Evaluates organ function and calcium</td></tr>
        <tr><td>Surgery (abscess/MBD)</td><td>$500 – $2,000+</td><td>Metabolic bone disease treatment intensive</td></tr>`
  },
  'pet-cremation-cost': {
    rows: `<tr><td>Communal cremation</td><td>$50 – $150</td><td>Ashes not returned; lowest cost</td></tr>
        <tr><td>Private cremation</td><td>$150 – $400</td><td>Individual; ashes returned to owner</td></tr>
        <tr><td>Urn or memorial keepsake</td><td>$30 – $250</td><td>Wide range from basic to custom</td></tr>
        <tr><td>Home burial (where legal)</td><td>$0 – $50</td><td>Check local ordinances first</td></tr>`
  },
  'spay-neuter-cost': {
    rows: `<tr><td>Dog neuter (male)</td><td>$150 – $400</td><td>Varies by size; large breeds higher</td></tr>
        <tr><td>Dog spay (female)</td><td>$200 – $600</td><td>More complex surgery than neuter</td></tr>
        <tr><td>Cat neuter (male)</td><td>$75 – $200</td><td>Usually quickest recovery</td></tr>
        <tr><td>Cat spay (female)</td><td>$150 – $400</td><td>Includes anesthesia and pain meds</td></tr>`
  },
  'dog-training-costs': {
    rows: `<tr><td>Group class (6-8 weeks)</td><td>$100 – $300</td><td>Basic obedience; most affordable</td></tr>
        <tr><td>Private session (per hour)</td><td>$75 – $200</td><td>One-on-one with certified trainer</td></tr>
        <tr><td>Board-and-train (2-4 weeks)</td><td>$1,500 – $4,000</td><td>Dog stays with trainer; intensive</td></tr>
        <tr><td>Behavioral specialist</td><td>$150 – $350/session</td><td>For aggression, anxiety, reactivity</td></tr>`
  },
  'pet-boarding-costs': {
    rows: `<tr><td>Standard kennel (per night)</td><td>$30 – $60</td><td>Basic accommodation with daily walks</td></tr>
        <tr><td>Luxury boarding (per night)</td><td>$60 – $120</td><td>Private suites, webcams, extra play</td></tr>
        <tr><td>In-home pet sitting (per day)</td><td>$50 – $100</td><td>Sitter stays in your home</td></tr>
        <tr><td>Cat-only boarding (per night)</td><td>$25 – $55</td><td>Quieter, cat-specific facilities</td></tr>`
  },
  'pet-dental-cleaning-cost': {
    rows: `<tr><td>Dog dental cleaning</td><td>$300 – $800</td><td>Includes anesthesia, scaling, polishing</td></tr>
        <tr><td>Cat dental cleaning</td><td>$250 – $700</td><td>Similar process; lighter anesthesia</td></tr>
        <tr><td>Tooth extraction (per tooth)</td><td>$50 – $300</td><td>Simple vs surgical extraction varies</td></tr>
        <tr><td>Pre-anesthetic blood work</td><td>$75 – $200</td><td>Required for safe anesthesia</td></tr>`
  },
  'dog-allergy-testing-cost': {
    rows: `<tr><td>Intradermal skin test</td><td>$200 – $400</td><td>Gold standard; done by dermatologist</td></tr>
        <tr><td>Serum (blood) allergy test</td><td>$200 – $350</td><td>Less invasive; screens many allergens</td></tr>
        <tr><td>Elimination diet trial</td><td>$50 – $200</td><td>8-12 week restricted diet; food cost only</td></tr>
        <tr><td>Immunotherapy (per year)</td><td>$300 – $800</td><td>Custom allergy shots or sublingual drops</td></tr>`
  },
  'pet-insurance-cost-by-breed': {
    rows: `<tr><td>Small dog breeds (monthly)</td><td>$25 – $50</td><td>Chihuahua, Pom, Yorkie, Dachshund</td></tr>
        <tr><td>Large dog breeds (monthly)</td><td>$50 – $90</td><td>GSD, Golden, Lab, Rottweiler</td></tr>
        <tr><td>Cat breeds (monthly)</td><td>$15 – $40</td><td>Generally lower risk and cost</td></tr>
        <tr><td>Brachycephalic breeds (monthly)</td><td>$60 – $120</td><td>Bulldogs, Pugs — highest premiums</td></tr>`
  },
  'fish-aquarium-setup-costs': {
    rows: `<tr><td>10-gallon starter kit</td><td>$50 – $150</td><td>Tank, filter, heater, light included</td></tr>
        <tr><td>55-gallon community tank</td><td>$250 – $600</td><td>Tank, stand, filtration, substrate</td></tr>
        <tr><td>Saltwater reef setup</td><td>$1,000 – $5,000+</td><td>Skimmer, lighting, live rock, RO/DI</td></tr>
        <tr><td>Ongoing monthly costs</td><td>$20 – $80</td><td>Food, water conditioner, electricity</td></tr>`
  },
  'how-much-does-a-puppy-cost': {
    rows: `<tr><td>Adoption fee (shelter/rescue)</td><td>$100 – $400</td><td>Includes spay/neuter and first vaccines</td></tr>
        <tr><td>Breeder purchase</td><td>$800 – $3,500+</td><td>Purebred with health clearances</td></tr>
        <tr><td>First-year supplies</td><td>$500 – $1,200</td><td>Crate, bed, bowls, leash, toys</td></tr>
        <tr><td>First-year veterinary</td><td>$500 – $1,200</td><td>Vaccines, spay/neuter, wellness visits</td></tr>`
  },
  'dog-grooming-costs': {
    rows: `<tr><td>Basic bath and brush</td><td>$30 – $60</td><td>Short-coat breeds; includes nail trim</td></tr>
        <tr><td>Full groom (clip/style)</td><td>$50 – $120</td><td>Medium to long coats; breed-specific cuts</td></tr>
        <tr><td>Large/giant breed groom</td><td>$80 – $175</td><td>Higher for matted coats; allow extra time</td></tr>
        <tr><td>Add-on services</td><td>$10 – $30 each</td><td>Teeth brushing, de-shed, flea treatment</td></tr>`
  },
  'dog-surgery-costs': {
    rows: `<tr><td>ACL/cruciate repair</td><td>$2,000 – $6,000</td><td>TPLO most common in medium-large dogs</td></tr>
        <tr><td>Foreign body removal</td><td>$1,500 – $4,000</td><td>Depends on location and complexity</td></tr>
        <tr><td>Mass/tumor removal</td><td>$500 – $3,000</td><td>Plus $200-$500 for biopsy/pathology</td></tr>
        <tr><td>Bloat/GDV emergency</td><td>$3,000 – $7,500</td><td>Life-threatening; requires immediate surgery</td></tr>`
  },
  'how-much-does-a-vet-visit-cost': {
    rows: `<tr><td>Routine wellness exam</td><td>$50 – $100</td><td>Physical check, discussion, plan</td></tr>
        <tr><td>Sick visit/diagnosis</td><td>$100 – $300</td><td>Exam plus diagnostics if needed</td></tr>
        <tr><td>Urgent care visit</td><td>$150 – $400</td><td>Same-day for non-emergency concerns</td></tr>
        <tr><td>Emergency vet visit</td><td>$200 – $500+</td><td>After-hours; treatment costs separate</td></tr>`
  },
  'lifetime-cost-of-owning-a-dog': {
    rows: `<tr><td>Small breed (lifetime)</td><td>$15,000 – $25,000</td><td>12-16 year lifespan; lower food/med costs</td></tr>
        <tr><td>Medium breed (lifetime)</td><td>$20,000 – $35,000</td><td>10-14 year lifespan; moderate costs</td></tr>
        <tr><td>Large breed (lifetime)</td><td>$25,000 – $45,000</td><td>8-12 year lifespan; highest food/vet costs</td></tr>
        <tr><td>Annual average (all sizes)</td><td>$1,500 – $3,500</td><td>Food, vet, grooming, supplies, insurance</td></tr>`
  }
};

let costFixed = 0;
for (const [slug, data] of Object.entries(costReplacements)) {
  const filePath = join(ROOT, 'guides', `${slug}.html`);
  if (!existsSync(filePath)) continue;

  let html = readFileSync(filePath, 'utf8');
  if (html.includes('Basic Service</td>')) {
    html = html.replace(
      /<tr><td>Basic Service<\/td>.*?<\/tr>\s*<tr><td>Mid-Range Option<\/td>.*?<\/tr>\s*<tr><td>Premium\/Emergency<\/td>.*?<\/tr>\s*<tr><td>Ongoing\/Annual<\/td>.*?<\/tr>/s,
      data.rows
    );
    writeFileSync(filePath, html);
    costFixed++;
    console.log(`  Fixed cost table: ${slug}`);
  }
}
console.log(`  Fixed ${costFixed} cost guide tables.`);

// ============================================================
// SUMMARY
// ============================================================

console.log('\n=== INDEXABILITY FIXES COMPLETE ===');
console.log(`Empty FAQ schemas removed: ${faqFixed}`);
console.log(`Generic cost tables fixed: ${costFixed}`);
console.log(`Sitemap now includes commercial pages`);
console.log(`Sitemap index created with 4 sub-sitemaps`);
