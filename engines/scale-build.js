#!/usr/bin/env node
/**
 * PetCareHelperAI — Scale Build Engine
 * Generates ~1,880 new pages from scale-data.js definitions
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import {
  TODAY, dogBreeds, catBreeds,
  breedFoodPages, breedInsurancePages, breedTrainingPages, breedExercisePages,
  breedGroomingPages, breedPuppyPages, breedTemperamentPages, breedCostPages,
  breedVsPages, symptomPages, newScaleLocationPages, nutritionPages, seasonalPages,
  breedHealthPages2, breedLifespanPages, breedKidsPages, breedApartmentPages,
  breedAdoptionPages, breedSheddingPages, breedSizePages, catIndoorPages,
  symptomPages2, additionalProductPages
} from './scale-data.js';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');
const affiliates = JSON.parse(readFileSync(join(ROOT, 'affiliates.json'), 'utf8'));

// ============================================================
// UTILITY FUNCTIONS (copied from build.js)
// ============================================================
function toTitleCase(str) { return str.replace(/\b\w/g, c => c.toUpperCase()); }

function pickAffiliates(categories, count = 10) {
  const pool = [];
  for (const cat of categories) { if (affiliates[cat]) pool.push(...affiliates[cat]); }
  return pool.sort(() => 0.5 - Math.random()).slice(0, Math.min(count, pool.length));
}

function buildAffiliateCallout(partners, contextTitle) {
  if (!partners.length) return '';
  const links = partners.slice(0, 4).map(p =>
    `<a href="${p.url}" target="_blank" rel="sponsored noopener">${p.name}</a> — ${p.hook}`
  ).join('. ');
  return `\n      <div class="affiliate-callout">
        <h4>Recommended Resources for ${contextTitle}</h4>
        <p>${links}.</p>
      </div>\n`;
}

function buildHead({ title, description, canonical, cssPath, schema }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google-adsense-account" content="ca-pub-6484141649562994">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6484141649562994" crossorigin="anonymous"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-FK0N7BD82Q"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-FK0N7BD82Q');
  </script>
  <meta name="description" content="${description.replace(/"/g, '&quot;')}">
  <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="Pet Care Helper AI" />
  <title>${title.replace(/</g, '&lt;')} | Pet Care Helper AI</title>
  <link rel="stylesheet" href="${cssPath}">
  ${schema || ''}
</head>`;
}

function buildNav() {
  return `<body>
  <header class="site-header">
    <div class="logo-title">
      <div class="logo-pill"></div>
      <div>
        <span class="site-name">Pet Care Helper AI</span>
        <p class="subtitle">Dogs &bull; Cats &bull; Birds &bull; Reptiles &bull; Fish</p>
      </div>
    </div>
    <nav class="main-nav">
      <button class="nav-toggle" aria-label="Toggle navigation"><span class="hamburger"></span></button>
      <ul class="nav-menu">
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/chat" class="nav-link">AI Pet Help</a></li>
        <li><a href="/dogs" class="nav-link">Dogs</a></li>
        <li><a href="/cats" class="nav-link">Cats</a></li>
        <li><a href="/birds" class="nav-link">Birds</a></li>
        <li><a href="/reptiles" class="nav-link">Reptiles</a></li>
        <li><a href="/fish" class="nav-link">Fish</a></li>
        <li><a href="/guides" class="nav-link">Guides</a></li>
      </ul>
    </nav>
  </header>`;
}

function buildFooter() {
  return `
  <footer class="site-footer">
    <p>AI Pet Medical &amp; Vet Help Finder &mdash; educational guidance, real-world vet options, and curated resources in one place.</p>
    <p style="font-size: 0.85rem; margin-top: 8px;">Some suggestions may include sponsored partners. This does not affect guidance.</p>
    <nav class="footer-nav" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;">
      <a href="/guides">Guides</a> &middot;
      <a href="/tools/">Tools</a> &middot;
      <a href="/locations/">Locations</a> &middot;
      <a href="/resources">Resources</a> &middot;
      <a href="/about">About</a> &middot;
      <a href="/contact">Contact</a> &middot;
      <a href="/privacy-policy">Privacy</a> &middot;
      <a href="/terms-of-service">Terms</a> &middot;
      <a href="/feeds/">RSS Feeds</a>
    </nav>
  </footer>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const navToggle = document.querySelector('.nav-toggle');
      const navMenu = document.querySelector('.nav-menu');
      if (navToggle) { navToggle.addEventListener('click', function() { navMenu.classList.toggle('active'); navToggle.classList.toggle('active'); }); }
    });
  </script>
</body>
</html>`;
}

function buildDisclaimer() {
  return `
    <section class="transparency">
      <h3>Important Disclaimer</h3>
      <p>This guide provides general educational information and is not a substitute for professional veterinary advice. Always consult a qualified veterinarian for your pet's specific health needs. This page contains affiliate links to products and services we recommend. If you make a purchase through these links, we may earn a small commission at no additional cost to you. This helps support our ability to provide free pet care resources.</p>
    </section>`;
}

function genArticleSchema(title, desc) {
  return `<script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Article","headline":"${title.replace(/"/g, '\\"')}","description":"${desc.replace(/"/g, '\\"')}","datePublished":"${TODAY}","dateModified":"${TODAY}","author":{"@type":"Organization","name":"Pet Care Helper AI"},"publisher":{"@type":"Organization","name":"Pet Care Helper AI"}}
  </script>`;
}

function genFAQSchema(faqs) {
  if (!faqs.length) return '';
  const entities = faqs.map(f => `{"@type":"Question","name":"${f.q.replace(/"/g, '\\"')}","acceptedAnswer":{"@type":"Answer","text":"${f.a.replace(/"/g, '\\"')}"}}`).join(',');
  return `<script type="application/ld+json">
  {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[${entities}]}
  </script>`;
}

// ============================================================
// BREED LOOKUP MAPS
// ============================================================
const dogMap = Object.fromEntries(dogBreeds.map(b => [b.slug, b]));
const catMap = Object.fromEntries(catBreeds.map(b => [b.slug, b]));
function findBreed(slug) { return dogMap[slug] || catMap[slug]; }

// Helper: extract breed slug from page slug patterns
function extractBreedSlug(pageSlug, prefix, suffix) {
  let s = pageSlug;
  if (prefix) s = s.replace(new RegExp(`^${prefix}`), '');
  if (suffix) s = s.replace(new RegExp(`${suffix}$`), '');
  return s;
}

// ============================================================
// SIZE/ENERGY HELPERS for breed-specific content
// ============================================================
const sizeCalories = { large: '1,400–2,200', medium: '800–1,200', small: '400–800' };
const sizeFoodCups = { large: '3–5 cups', medium: '1.5–2.5 cups', small: '0.5–1.5 cups' };
const sizeInsuranceCost = { large: '$50–80/month', medium: '$35–55/month', small: '$25–40/month' };
const sizeGroomCost = { large: '$65–100', medium: '$45–70', small: '$30–50' };
const sizeExMinutes = { high: '60–120 minutes', moderate: '30–60 minutes', low: '20–30 minutes' };
const sheddingFreq = { heavy: 'daily brushing', moderate: '2–3 times per week', light: 'weekly', minimal: 'occasional' };

function ctaCard(heading, text) {
  return `
      <section class="info-card">
        <h3>${heading}</h3>
        <p>${text}</p>
        <div class="hero-actions">
          <a href="/chat" class="primary-btn">Talk to AI Pet Helper</a>
        </div>
      </section>`;
}

function buildRelatedLinks(page, breed) {
  if (!breed) return '';
  const s = breed.slug;
  const isDog = page.animal === 'dogs';
  const suffix = isDog ? '' : '-cat';
  const topics = [
    { slug: `best-food-for-${s}${suffix}`, label: `${breed.name} Diet & Nutrition Guide` },
    { slug: `${s}${suffix}-pet-insurance`, label: `${breed.name} Pet Insurance Cost` },
    { slug: isDog ? `how-to-train-a-${s}` : null, label: `How to Train a ${breed.name}` },
    { slug: `${s}${isDog ? '' : '-cat'}-grooming-guide`, label: `${breed.name} Grooming Guide` },
    { slug: `${s}${isDog ? '' : '-cat'}-health-issues`, label: `${breed.name} Health Issues` },
    { slug: `${s}${isDog ? '' : '-cat'}-temperament`, label: `${breed.name} Temperament & Personality` },
    { slug: isDog ? `${s}-exercise-guide` : null, label: `${breed.name} Exercise Needs` },
    { slug: `${s}${isDog ? '' : '-cat'}-cost-of-ownership`, label: `${breed.name} Cost of Ownership` },
    { slug: `adopt-a-${s}${suffix}`, label: `Adopt a ${breed.name}` },
    { slug: isDog ? `${s}-puppy-guide` : null, label: `${breed.name} Puppy Guide` },
    { slug: isDog ? `${s}-with-kids` : `${s}-cat-with-kids`, label: `${breed.name}s and Children` },
    { slug: `${s}${isDog ? '' : '-cat'}-lifespan${isDog ? '-guide' : ''}`, label: `${breed.name} Lifespan Guide` },
  ].filter(t => t.slug && t.slug !== page.slug);
  const links = topics.slice(0, 8).map(t => `<li><a href="/guides/${t.slug}">${t.label}</a></li>`).join('\n        ');
  return `
      <h2>More ${breed.name} Guides</h2>
      <p>Continue learning about ${breed.name} care with these comprehensive breed-specific guides:</p>
      <ul>
        ${links}
      </ul>`;
}

function buildSymptomRelatedLinks(page) {
  const isDog = page.animal === 'dogs';
  const allOthers = isDog ? [
    { slug: 'why-is-my-dog-not-eating', label: 'Why Is My Dog Not Eating?' },
    { slug: 'why-is-my-dog-shaking', label: 'Why Is My Dog Shaking?' },
    { slug: 'why-is-my-dog-limping', label: 'Why Is My Dog Limping?' },
    { slug: 'why-is-my-dog-vomiting', label: 'Why Is My Dog Vomiting?' },
    { slug: 'why-is-my-dog-coughing', label: 'Why Is My Dog Coughing?' },
    { slug: 'why-is-my-dog-panting-so-much', label: 'Why Is My Dog Panting?' },
    { slug: 'why-is-my-dog-wheezing', label: 'Why Is My Dog Wheezing?' },
    { slug: 'why-is-my-dog-pooping-blood', label: 'Why Is My Dog Pooping Blood?' },
  ] : [
    { slug: 'why-is-my-cat-not-eating', label: 'Why Is My Cat Not Eating?' },
    { slug: 'why-is-my-cat-vomiting', label: 'Why Is My Cat Vomiting?' },
    { slug: 'why-is-my-cat-hiding', label: 'Why Is My Cat Hiding?' },
    { slug: 'why-is-my-cat-sneezing', label: 'Why Is My Cat Sneezing?' },
    { slug: 'why-is-my-cat-losing-weight', label: 'Why Is My Cat Losing Weight?' },
    { slug: 'why-is-my-cat-panting', label: 'Why Is My Cat Panting?' },
    { slug: 'why-is-my-cat-not-grooming', label: 'Why Is My Cat Not Grooming?' },
    { slug: 'why-is-my-cat-aggressive-suddenly', label: 'Why Is My Cat Suddenly Aggressive?' },
  ];
  const others = allOthers.filter(t => t.slug !== page.slug);
  const links = others.slice(0, 5).map(t => `<li><a href="/guides/${t.slug}">${t.label}</a></li>`).join('\n        ');
  return `
      <h2>Related Symptom Guides</h2>
      <p>Learn more about common ${isDog ? 'dog' : 'cat'} health symptoms and when to seek veterinary care:</p>
      <ul>
        ${links}
      </ul>`;
}

function extractFAQs(html) {
  const faqs = [];
  const re = /<h3>([^<]+)<\/h3>\s*\n?\s*<p>([^<]+)<\/p>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (faqs.length < 5) faqs.push({ q: m[1], a: m[2] });
  }
  return faqs;
}

// ============================================================
// CONTENT BUILDERS — each produces 1200+ words of HTML
// ============================================================

function buildBreedFoodContent(page, partners, breed) {
  const p1 = partners.slice(0, 4), p2 = partners.slice(4, 8), p3 = partners.slice(8, 12);
  const cal = sizeCalories[breed.size] || '800–1,400';
  const cups = sizeFoodCups[breed.size] || '1.5–3 cups';
  const isDog = page.animal === 'dogs';
  const petType = isDog ? 'dog' : 'cat';
  const issuesDiet = breed.issues.map(i => {
    if (i.includes('hip') || i.includes('joint') || i.includes('dysplasia') || i.includes('arthritis')) return 'glucosamine, chondroitin, and omega-3 fatty acids for joint support';
    if (i.includes('obesity')) return 'a calorie-controlled formula to maintain healthy weight';
    if (i.includes('allerg')) return 'a limited ingredient or novel protein diet to minimize reactions';
    if (i.includes('bloat')) return 'smaller, more frequent meals and avoiding elevated feeding';
    if (i.includes('skin')) return 'omega-3 and omega-6 fatty acids for skin and coat health';
    if (i.includes('dental')) return 'dental-specific kibble or dental chew supplements';
    if (i.includes('heart') || i.includes('HCM')) return 'taurine-rich foods for cardiovascular health';
    if (i.includes('kidney') || i.includes('PKD')) return 'controlled phosphorus and high-quality protein for kidney support';
    if (i.includes('diabetes')) return 'low-glycemic, high-protein formulas for blood sugar management';
    return `nutrients that support ${i} management`;
  });
  return `
      <h2>Nutritional Needs of ${breed.name}s</h2>
      <p>As a ${breed.size} ${isDog ? breed.group + ' breed' : 'cat breed'} with ${breed.energy} energy levels, the ${breed.name} has specific nutritional requirements that differ from other ${petType}s. Understanding these needs is key to keeping your ${breed.name} healthy throughout their ${breed.lifespan} lifespan.</p>
      <p>${breed.name}s typically weigh ${breed.weight} and need approximately ${cal} calories per day, depending on age, activity level, and metabolism. ${breed.energy === 'high' ? 'Given their high energy levels, active ' + breed.name + 's may need 20-30% more calories than the average ' + petType + ' of their size.' : breed.energy === 'low' ? breed.name + 's are relatively low-energy and prone to weight gain, so careful portion control is essential.' : 'With moderate energy levels, most ' + breed.name + 's do well on standard feeding guidelines for their size.'}</p>

      <h2>Daily Feeding Guidelines</h2>
      <table class="comparison-table">
        <tr><th>Life Stage</th><th>Daily Amount</th><th>Meals Per Day</th><th>Calories</th></tr>
        <tr><td>Puppy (2-6 months)</td><td>${breed.size === 'large' ? '2-4 cups' : breed.size === 'small' ? '0.5-1 cup' : '1-2 cups'}</td><td>3-4</td><td>${breed.size === 'large' ? '900-1,800' : breed.size === 'small' ? '200-500' : '500-1,000'}</td></tr>
        <tr><td>Puppy (6-12 months)</td><td>${breed.size === 'large' ? '3-5 cups' : breed.size === 'small' ? '0.5-1.5 cups' : '1.5-2.5 cups'}</td><td>2-3</td><td>${breed.size === 'large' ? '1,200-2,200' : breed.size === 'small' ? '300-600' : '700-1,200'}</td></tr>
        <tr><td>Adult</td><td>${cups}</td><td>2</td><td>${cal}</td></tr>
        <tr><td>Senior (7+ years)</td><td>${breed.size === 'large' ? '2.5-4 cups' : breed.size === 'small' ? '0.5-1 cup' : '1-2 cups'}</td><td>2</td><td>${breed.size === 'large' ? '1,100-1,800' : breed.size === 'small' ? '300-600' : '600-1,000'}</td></tr>
      </table>
      ${buildAffiliateCallout(p1, breed.name + ' Diet & Nutrition')}

      <h2>Health-Specific Diet Considerations</h2>
      <p>${breed.name}s are prone to several health conditions that can be managed or prevented through proper nutrition:</p>
      <ul>
        ${breed.issues.map((issue, i) => `<li><strong>${toTitleCase(issue)}:</strong> Look for foods with ${issuesDiet[i]}</li>`).join('\n        ')}
      </ul>
      <p>Many veterinary nutritionists recommend ${breed.size === 'large' ? 'large breed-specific formulas that contain controlled calcium and phosphorus levels to support proper skeletal development' : breed.size === 'small' ? 'small breed formulas with smaller kibble size and higher calorie density to meet their faster metabolisms' : 'breed-appropriate formulas designed for medium-sized ' + petType + 's'}.</p>

      <h2>Best Protein Sources for ${breed.name}s</h2>
      <p>High-quality animal protein should be the first ingredient in any ${breed.name} food. Recommended protein sources include:</p>
      <ul>
        <li><strong>Chicken and turkey:</strong> Lean, easily digestible proteins ideal for most ${breed.name}s</li>
        <li><strong>Salmon and fish:</strong> Rich in omega-3 fatty acids for skin, coat, and joint health</li>
        <li><strong>Lamb:</strong> A good alternative for ${petType}s with chicken sensitivities</li>
        <li><strong>Beef:</strong> High in iron and B vitamins, though some ${petType}s may be sensitive</li>
        ${breed.issues.some(i => i.includes('allerg')) ? '<li><strong>Novel proteins (venison, duck, rabbit):</strong> Excellent for ' + breed.name + 's with food allergies</li>' : ''}
      </ul>
      ${buildAffiliateCallout(p2, 'Premium ' + breed.name + ' Food')}

      <h2>Foods to Avoid</h2>
      <p>Never feed your ${breed.name} these dangerous foods:</p>
      <ul>
        <li>Chocolate, caffeine, and xylitol (extremely toxic)</li>
        <li>Grapes and raisins (can cause kidney failure)</li>
        <li>Onions, garlic, and chives (damage red blood cells)</li>
        <li>Macadamia nuts and alcohol</li>
        <li>Cooked bones (splintering risk)</li>
      </ul>

      <h2>Supplements Worth Considering</h2>
      <p>Based on ${breed.name}-specific health concerns, these supplements may benefit your ${petType}:</p>
      <ul>
        ${breed.issues.some(i => i.includes('hip') || i.includes('joint') || i.includes('dysplasia')) ? '<li><strong>Glucosamine & Chondroitin:</strong> Essential for joint health, especially important for ' + breed.name + 's prone to ' + breed.issues.find(i => i.includes('hip') || i.includes('dysplasia')) + '</li>' : '<li><strong>Glucosamine:</strong> Supports joint health as your ' + breed.name + ' ages</li>'}
        <li><strong>Omega-3 Fish Oil:</strong> Supports skin, coat, brain, and heart health</li>
        <li><strong>Probiotics:</strong> Aids digestion and immune function</li>
        ${breed.issues.some(i => i.includes('heart') || i.includes('HCM')) ? '<li><strong>Taurine and CoQ10:</strong> Supports cardiovascular health</li>' : ''}
      </ul>
      ${buildAffiliateCallout(p3, breed.name + ' Supplements')}

      <h2>Wet Food vs Dry Food for ${breed.name}s</h2>
      <p>Both wet and dry food have advantages for ${breed.name}s:</p>
      <ul>
        <li><strong>Dry kibble:</strong> Better for dental health, more economical, easier to measure portions</li>
        <li><strong>Wet food:</strong> Higher moisture content (important for ${isDog ? 'hydration' : 'cats who are naturally low drinkers'}), more palatable, easier for seniors</li>
        <li><strong>Mixed feeding:</strong> Many ${breed.name} owners find success combining both for balanced nutrition and variety</li>
      </ul>

      <h2>Feeding Mistakes to Avoid</h2>
      <p>Common feeding errors that ${breed.name} owners make include:</p>
      <ul>
        <li><strong>Free-feeding:</strong> Leaving food out all day leads to overeating, especially in ${breed.energy === 'high' ? 'active breeds that eat impulsively after exercise' : 'lower-energy breeds prone to weight gain'}. Scheduled meals help maintain healthy weight and allow you to monitor appetite changes.</li>
        <li><strong>Sudden diet changes:</strong> Switching foods abruptly causes digestive upset. Transition over 7-10 days by gradually mixing the new food with the old.</li>
        <li><strong>Overuse of treats:</strong> Treats should make up no more than 10% of your ${breed.name}'s daily caloric intake. Many training treats are high in calories, so adjust meal portions accordingly.</li>
        <li><strong>Ignoring body condition:</strong> Use the body condition score (BCS) system to assess your ${breed.name}'s weight rather than relying solely on scale numbers. You should be able to feel the ribs without pressing hard.</li>
        <li><strong>Feeding table scraps:</strong> Human food often contains ingredients dangerous to ${petType}s. Even safe foods add untracked calories and can encourage begging behavior.</li>
      </ul>

      <h2>Age-Specific Nutrition Considerations</h2>
      <p>Your ${breed.name}'s nutritional needs change significantly throughout their life:</p>
      <p><strong>Puppy stage (0-12 months):</strong> ${breed.size === 'large' ? 'Large breed puppy formulas with controlled calcium and phosphorus are essential to prevent rapid growth that stresses developing joints. DHA supports brain development during this critical period.' : breed.size === 'small' ? 'Small breed puppies need calorie-dense food to fuel their fast metabolisms. Feed 3-4 small meals daily to prevent hypoglycemia.' : 'Feed a puppy-specific formula that provides the right balance of protein, fat, and minerals for healthy development. Transition to 2 meals daily by 6 months.'}</p>
      <p><strong>Adult stage (1-7 years):</strong> Maintain a consistent feeding routine with measured portions. Monitor weight monthly and adjust food amounts based on activity level, seasonal changes, and body condition. Adult ${breed.name}s benefit from a protein content of 22-30%.</p>
      <p><strong>Senior stage (7+ years):</strong> Older ${breed.name}s may need fewer calories but higher-quality protein to maintain muscle mass. Senior formulas often include joint-supporting nutrients like glucosamine and chondroitin, plus antioxidants for cognitive health. Watch for changes in appetite that may signal underlying health issues.</p>
      ${buildRelatedLinks(page, breed)}

      <h2>Frequently Asked Questions</h2>
      <h3>How much should I feed my ${breed.name}?</h3>
      <p>Adult ${breed.name}s typically need ${cups} of high-quality food per day, split into two meals. Adjust based on your ${petType}'s activity level, age, and body condition score. ${breed.energy === 'high' ? 'Active ' + breed.name + 's may need up to 30% more.' : ''}</p>
      <h3>What is the best food brand for ${breed.name}s?</h3>
      <p>Look for foods that list real meat as the first ingredient, meet AAFCO standards, and address ${breed.name}-specific health needs like ${breed.issues[0]}. Brands offering ${breed.size} breed-specific formulas are often a good choice.</p>
      <h3>Should I feed my ${breed.name} grain-free food?</h3>
      <p>Unless your ${breed.name} has a diagnosed grain allergy, grain-inclusive foods are generally recommended. The FDA has investigated a potential link between grain-free diets and heart disease (DCM) in dogs. Consult your veterinarian before choosing grain-free.</p>
      ${ctaCard('Need Personalized Diet Advice for Your ' + breed.name + '?', 'Our AI assistant can help create a customized feeding plan based on your ' + breed.name + "'s age, weight, and health needs.")}`;
}

function buildBreedInsuranceContent(page, partners, breed) {
  const p1 = partners.slice(0, 5), p2 = partners.slice(5, 10);
  const cost = sizeInsuranceCost[breed.size] || '$35–60/month';
  const isDog = page.animal === 'dogs';
  const petWord = isDog ? 'dog' : 'cat';
  return `
      <h2>${breed.name} Pet Insurance Overview</h2>
      <p>Pet insurance for ${breed.name}s is particularly important given their predisposition to ${breed.issues.join(', ')}. With a lifespan of ${breed.lifespan}, lifetime veterinary costs for a ${breed.name} can easily reach $15,000–$40,000, making insurance a smart financial decision.</p>
      <p>Average monthly premiums for ${breed.name}s range from ${cost}, depending on your location, the plan you choose, and your ${isDog ? 'dog' : 'cat'}'s age at enrollment. ${breed.size === 'large' ? 'Large breeds typically have higher premiums due to increased risk of orthopedic and cardiac conditions.' : breed.size === 'small' ? 'Small breeds often have lower premiums but can still face expensive conditions like dental disease and luxating patella.' : 'Medium breeds fall in the mid-range for insurance costs.'}</p>
      ${buildAffiliateCallout(p1, breed.name + ' Pet Insurance')}

      <h2>Why ${breed.name}s Need Insurance</h2>
      <p>Here are the most common and expensive health conditions in ${breed.name}s:</p>
      <table class="comparison-table">
        <tr><th>Condition</th><th>Average Treatment Cost</th><th>Covered by Insurance?</th></tr>
        ${breed.issues.map(issue => {
          const cost = issue.includes('hip') || issue.includes('dysplasia') ? '$3,500–$7,000' : issue.includes('cancer') || issue.includes('osteosarcoma') ? '$5,000–$10,000+' : issue.includes('bloat') ? '$2,000–$5,000' : issue.includes('heart') || issue.includes('HCM') ? '$2,000–$8,000' : issue.includes('eye') || issue.includes('cataracts') || issue.includes('PRA') ? '$1,500–$4,000' : issue.includes('allerg') ? '$500–$2,000/year' : issue.includes('dental') ? '$500–$3,000' : '$1,000–$3,000';
          return `<tr><td>${toTitleCase(issue)}</td><td>${cost}</td><td>Yes (accident & illness plans)</td></tr>`;
        }).join('\n        ')}
      </table>

      <h2>What to Look for in a ${breed.name} Insurance Plan</h2>
      <p>When comparing pet insurance for your ${breed.name}, prioritize these features:</p>
      <ul>
        <li><strong>Coverage for breed-specific conditions:</strong> Ensure ${breed.issues.map(i => toTitleCase(i)).join(', ')} are not excluded</li>
        <li><strong>No per-condition limits:</strong> Annual or lifetime limits per condition can leave you underinsured for expensive treatments</li>
        <li><strong>Reimbursement rate of 80-90%:</strong> Higher reimbursement means lower out-of-pocket costs</li>
        <li><strong>Reasonable deductible:</strong> $250–$500 annual deductibles offer the best balance of premium cost and coverage</li>
        <li><strong>Wellness add-on:</strong> Covers routine care like vaccinations, dental cleanings, and preventive medications</li>
      </ul>

      <h2>Best Time to Insure Your ${breed.name}</h2>
      <p>Enroll your ${breed.name} as early as possible — ideally as a puppy or kitten. Pre-existing conditions are never covered, so insuring before health issues develop is critical. ${breed.name}s are prone to ${breed.issues[0]}, which can develop ${breed.size === 'large' ? 'as early as 1-2 years of age' : 'at any point in their life'}.</p>
      ${buildAffiliateCallout(p2, 'Compare ' + breed.name + ' Insurance Plans')}

      <h2>Insurance Cost Breakdown</h2>
      <table class="comparison-table">
        <tr><th>Plan Type</th><th>Monthly Cost</th><th>What's Covered</th></tr>
        <tr><td>Accident Only</td><td>$10–$20/month</td><td>Injuries, emergencies, broken bones, poisoning</td></tr>
        <tr><td>Accident & Illness</td><td>${cost}</td><td>Everything above plus diseases, cancer, chronic conditions</td></tr>
        <tr><td>Comprehensive + Wellness</td><td>${breed.size === 'large' ? '$70–$120/month' : breed.size === 'small' ? '$40–$65/month' : '$55–$85/month'}</td><td>Everything above plus routine care, vaccines, dental</td></tr>
      </table>

      <h2>Filing Claims and Maximizing Coverage</h2>
      <p>Understanding how to work with your pet insurance company ensures you get the most value from your ${breed.name}'s coverage:</p>
      <ul>
        <li><strong>Keep detailed records:</strong> Save all veterinary invoices, lab results, and treatment notes. Digital copies and organized folders speed up the claims process significantly.</li>
        <li><strong>Submit claims promptly:</strong> Most insurers have a 90-day filing window. Submit claims within days of your vet visit, not months later when details may be forgotten.</li>
        <li><strong>Understand your waiting period:</strong> Most policies have 14-day waiting periods for illness and 48-hour waits for accidents. Some breed-specific conditions like ${breed.issues[0]} may have longer waiting periods of 6-12 months.</li>
        <li><strong>Get pre-authorization for surgery:</strong> For planned procedures, contact your insurer beforehand to confirm coverage and expected reimbursement. This prevents surprises when the bill arrives.</li>
      </ul>

      <h2>Comparing Top Insurance Providers for ${breed.name}s</h2>
      <p>When evaluating insurers for your ${breed.name}, consider how each provider handles breed-specific conditions. Some companies use breed-based pricing while others use individual health assessments. Look for providers that:</p>
      <ul>
        <li>Do not exclude bilateral conditions (both hips, both knees) after a claim on one side</li>
        <li>Cover hereditary and congenital conditions common in ${breed.name}s</li>
        <li>Offer unlimited annual and lifetime payouts for maximum protection</li>
        <li>Allow you to use any licensed veterinarian, including specialists and emergency clinics</li>
        <li>Process claims quickly — top providers reimburse within 5-10 business days</li>
      </ul>
      <p>The average ${breed.name} owner saves $3,000-$8,000 over their ${petWord}'s lifetime with comprehensive insurance, particularly when breed-specific conditions like ${breed.issues.join(' and ')} require treatment.</p>
      ${buildRelatedLinks(page, breed)}

      <h2>Frequently Asked Questions</h2>
      <h3>How much does ${breed.name} pet insurance cost?</h3>
      <p>Expect to pay ${cost} for a comprehensive accident and illness plan for a ${breed.name}. Costs vary by age, location, and deductible amount. Puppies are the cheapest to insure.</p>
      <h3>Is pet insurance worth it for a ${breed.name}?</h3>
      <p>Given ${breed.name}s' predisposition to ${breed.issues[0]} and other conditions, insurance is highly recommended. A single surgery for ${breed.issues[0]} can cost more than years of premiums.</p>
      <h3>What pre-existing conditions affect ${breed.name} insurance?</h3>
      <p>Any condition diagnosed before enrollment is excluded. For ${breed.name}s, common pre-existing concerns include ${breed.issues.slice(0, 2).join(' and ')}. Early enrollment is key.</p>
      ${ctaCard('Get Personalized Insurance Recommendations', 'Our AI can help compare plans and find the best coverage for your ' + breed.name + "'s specific needs and budget.")}`;
}

function buildGenericBreedContent(page, partners, breed, topic) {
  const p1 = partners.slice(0, 4), p2 = partners.slice(4, 8), p3 = partners.slice(8, 12);
  const isDog = page.animal === 'dogs';
  const petWord = isDog ? 'dog' : 'cat';

  const sections = {
    training: { h2s: ['Training Approach', `${breed.name} Training Challenges`, 'Socialization', 'Obedience Commands', 'Advanced Training', 'Common Behavior Issues'], detail: `${breed.name}s are ${breed.energy}-energy ${isDog ? breed.group + ' dogs' : 'cats'} that ${breed.energy === 'high' ? 'require consistent mental stimulation and structured training sessions' : breed.energy === 'low' ? 'respond well to short, positive training sessions' : 'benefit from regular but moderate training routines'}. ${isDog && breed.group === 'herding' ? 'As a herding breed, they have strong working instincts and excel at agility, obedience trials, and trick training.' : isDog && breed.group === 'working' ? 'Working breeds like the ' + breed.name + ' need a firm, confident handler and benefit from having a job to do.' : isDog && breed.group === 'hound' ? 'Hound breeds can be independent thinkers, so patience and high-value treats are essential for training success.' : isDog && breed.group === 'terrier' ? 'Terriers are spirited and determined, requiring creative training approaches that channel their natural tenacity.' : 'Their intelligence and temperament make them responsive to positive reinforcement training methods.'}` },
    exercise: { h2s: ['Daily Exercise Requirements', 'Best Activities', 'Exercise by Age', 'Mental Stimulation', 'Indoor Activities', 'Signs of Under-Exercise'], detail: `The ${breed.name} needs ${sizeExMinutes[breed.energy] || '30-60 minutes'} of exercise daily. ${breed.energy === 'high' ? 'This is a high-energy breed that thrives with vigorous activities like running, hiking, fetch, and swimming.' : breed.energy === 'low' ? 'Despite lower energy needs, daily walks and play sessions are still important for preventing obesity and maintaining muscle tone.' : 'Moderate daily exercise keeps your ' + breed.name + ' healthy and mentally satisfied.'}` },
    grooming: { h2s: ['Grooming Schedule', 'Brushing & Coat Care', 'Bathing', 'Nail Care', 'Ear & Dental Care', 'Professional Grooming Costs'], detail: `${breed.name}s have ${breed.shedding} shedding and require ${sheddingFreq[breed.shedding] || 'regular'} brushing. ${breed.shedding === 'heavy' ? 'Heavy shedders like the ' + breed.name + ' benefit from daily brushing, especially during seasonal coat changes in spring and fall.' : breed.shedding === 'minimal' ? 'While ' + breed.name + 's shed very little, regular grooming is still important for skin health and early detection of lumps or skin issues.' : 'Regular grooming sessions keep your ' + breed.name + "'s coat healthy and help you bond with your " + petWord + '.'}` },
    puppy: { h2s: ['First Week Home', 'Feeding Schedule', 'Vaccination Timeline', 'Socialization Window', 'House Training', 'First-Year Health Milestones'], detail: `Bringing home a ${breed.name} puppy is exciting but requires preparation. ${breed.size === 'large' ? 'Large breed puppies grow rapidly and need controlled nutrition to prevent skeletal problems. Expect your ' + breed.name + ' puppy to reach full size between 12-24 months.' : breed.size === 'small' ? 'Small breed puppies mature faster but are more fragile. Handle your ' + breed.name + ' puppy gently and puppy-proof your home carefully.' : 'Medium breed puppies typically reach full size by 12-15 months.'}` },
    temperament: { h2s: ['Personality Overview', 'With Family Members', 'With Other Pets', 'Energy & Activity', 'Intelligence & Trainability', 'Guarding Instincts'], detail: `The ${breed.name} is known for being a ${breed.energy}-energy ${isDog ? breed.group + ' breed' : 'cat breed'} with a distinctive personality. ${isDog && breed.group === 'working' ? 'As a working breed, they are loyal, protective, and often form strong bonds with their primary caretaker.' : isDog && breed.group === 'sporting' ? 'Sporting breeds like the ' + breed.name + ' are typically friendly, eager to please, and excellent with families.' : isDog && breed.group === 'herding' ? 'Herding breeds are intelligent, alert, and may try to herd family members, especially children.' : 'Their unique blend of traits makes them well-suited for the right owner and lifestyle.'}` },
    cost: { h2s: ['Purchase/Adoption Cost', 'First-Year Expenses', 'Annual Costs', 'Medical Expenses', 'Hidden Costs', 'Money-Saving Tips'], detail: `Owning a ${breed.name} is a significant financial commitment over their ${breed.lifespan} lifespan. ${breed.size === 'large' ? 'Large breeds are more expensive across the board — more food, higher medication doses, bigger beds, and costlier surgeries.' : breed.size === 'small' ? 'While smaller breeds cost less for food and medications, they can still have expensive health conditions like dental disease and luxating patella.' : 'Medium-sized breeds fall in the moderate range for ownership costs.'}` },
    health: { h2s: ['Common Health Problems', 'Genetic Screening', 'Prevention Strategies', 'When to See the Vet', 'Health Testing', 'Lifespan Optimization'], detail: `${breed.name}s are predisposed to several health conditions including ${breed.issues.join(', ')}. Understanding these risks allows you to screen early, prevent where possible, and catch problems before they become emergencies.` },
    lifespan: { h2s: ['Average Lifespan', 'Factors Affecting Longevity', 'Life Stages', 'Senior Care', 'Extending Your ' + breed.name + "'s Life", 'Quality of Life'], detail: `The ${breed.name} has an average lifespan of ${breed.lifespan}. ${breed.size === 'large' ? 'Larger breeds tend to have shorter lifespans, but proper care can help your ' + breed.name + ' live to the upper end of this range.' : breed.size === 'small' ? 'Smaller breeds generally live longer, and well-cared-for ' + breed.name + 's often exceed average lifespan expectations.' : 'With proper nutrition, exercise, and veterinary care, many ' + breed.name + 's live full, healthy lives.'}` },
    kids: { h2s: ['Family Compatibility', 'Age-Appropriate Interactions', 'Safety Guidelines', 'Teaching Children', 'Supervision Rules', 'Best Ages for Introduction'], detail: `${breed.name}s ${breed.energy === 'high' && breed.size === 'large' ? 'are energetic and large, which means they can accidentally knock over small children. Supervision is essential, but they generally love kids.' : breed.size === 'small' ? 'are small and somewhat fragile, so children must be taught gentle handling. They do best with older children who understand boundaries.' : 'can make wonderful family companions when properly socialized and when children are taught respectful interaction.'}` },
    apartment: { h2s: ['Apartment Suitability Score', 'Space Requirements', 'Noise Level', 'Exercise Solutions', 'Neighbor Considerations', 'Making It Work'], detail: `Can a ${breed.name} live in an apartment? ${breed.energy === 'high' && breed.size === 'large' ? 'This is a challenging combination — high energy and large size mean your ' + breed.name + ' will need extensive daily exercise outside the apartment. Not ideal but possible with dedicated effort.' : breed.energy === 'low' || breed.size === 'small' ? breed.name + 's can adapt well to apartment living. Their ' + breed.size + ' size and ' + breed.energy + ' energy levels make them more suitable for smaller spaces.' : 'With adequate daily exercise, ' + breed.name + 's can adapt to apartment living, though a home with a yard is preferable.'}` },
    adoption: { h2s: ['Finding a ' + breed.name + ' to Adopt', 'Breed-Specific Rescues', 'Shelter Adoption', 'What to Expect', 'Preparing Your Home', 'First Days Home'], detail: `Adopting a ${breed.name} is a rewarding experience. Many ${breed.name}s end up in rescue due to owner surrender, life changes, or being found as strays. Breed-specific rescues are an excellent resource for finding purebred ${breed.name}s in need of homes.` },
    shedding: { h2s: ['Shedding Level', 'Seasonal Changes', 'Best Brushes & Tools', 'Reducing Shed Hair', 'Furniture & Clothing Protection', 'When Shedding Indicates Problems'], detail: `${breed.name}s have a ${breed.shedding} shedding level. ${breed.shedding === 'heavy' ? 'Prepare for significant hair around your home — invest in a good vacuum and lint rollers. Daily brushing during shedding season is non-negotiable.' : breed.shedding === 'minimal' ? 'One of the advantages of the ' + breed.name + ' is minimal shedding, making them a better choice for people who prefer a cleaner home.' : 'Regular grooming keeps shedding manageable and your ' + breed.name + "'s coat healthy."}` },
    size: { h2s: ['Full-Grown Size', 'Growth Timeline', 'Weight Chart by Age', 'Male vs Female Size', 'Factors Affecting Size', 'When They Stop Growing'], detail: `${breed.name}s are a ${breed.size} breed, reaching ${breed.weight} at full maturity. ${breed.size === 'large' ? 'Large breeds take 12-24 months to reach their adult size, with most of their height achieved by 12 months and filling out continuing until 18-24 months.' : breed.size === 'small' ? 'Small breeds mature faster, typically reaching adult size by 8-12 months.' : 'Medium breeds generally reach full size between 10-16 months.'}` },
    catIndoor: { h2s: ['Indoor Living Essentials', 'Enrichment & Play', 'Vertical Space', 'Window Perches', 'Interactive Toys', 'Preventing Boredom'], detail: `${breed.name} cats with ${breed.energy} energy levels ${breed.energy === 'high' ? 'are active and playful, requiring lots of interactive toys, climbing structures, and daily play sessions to stay happy indoors.' : breed.energy === 'low' ? 'are relatively low-key and adapt well to indoor living with basic enrichment like window perches and scratching posts.' : 'need a moderate amount of stimulation to thrive indoors, including interactive toys and regular play sessions.'}` },
  };

  const t = sections[topic] || sections.health;
  const faqs = [
    { q: `What should I know about ${page.title.toLowerCase()}?`, a: page.desc },
    { q: `Is a ${breed.name} right for me?`, a: `${breed.name}s are ${breed.size} ${petWord}s with ${breed.energy} energy and a lifespan of ${breed.lifespan}. They require ${sheddingFreq[breed.shedding] || 'regular'} grooming and are prone to ${breed.issues[0]}.` },
    { q: `How much does a ${breed.name} cost?`, a: `Initial costs range from $500-$3,000 for purchase/adoption, plus $1,000-$2,000 in first-year supplies and veterinary care. Annual ongoing costs are typically $1,500-$4,000 depending on health needs.` },
    { q: `What health problems do ${breed.name}s have?`, a: `${breed.name}s are prone to ${breed.issues.join(', ')}. Regular vet checkups and breed-specific screening tests help catch these conditions early for better treatment outcomes.` },
    { q: `How long do ${breed.name}s live?`, a: `The average lifespan for a ${breed.name} is ${breed.lifespan}. Proper nutrition, regular exercise, preventive veterinary care, and maintaining a healthy weight can help your ${breed.name} live to the upper end of this range.` },
  ];

  return `
      <h2>${t.h2s[0]}</h2>
      <p>${t.detail}</p>
      <p>With a typical weight of ${breed.weight} and lifespan of ${breed.lifespan}, the ${breed.name} requires thoughtful care tailored to their specific breed characteristics. This guide covers everything you need to know.</p>
      ${buildAffiliateCallout(p1, breed.name + ' ' + toTitleCase(topic))}

      <h2>${t.h2s[1]}</h2>
      <p>Every ${breed.name} is unique, but breed tendencies give us a reliable framework for understanding their needs. ${breed.name}s with ${breed.energy} energy levels ${breed.energy === 'high' ? 'need consistent outlets for their drive and enthusiasm' : breed.energy === 'low' ? 'are more laid-back but still need daily engagement' : 'strike a good balance between activity and relaxation'}.</p>
      <ul>
        <li><strong>Size:</strong> ${breed.size} (${breed.weight})</li>
        <li><strong>Energy Level:</strong> ${toTitleCase(breed.energy)}</li>
        <li><strong>Shedding:</strong> ${toTitleCase(breed.shedding)}</li>
        <li><strong>Common Health Issues:</strong> ${breed.issues.map(i => toTitleCase(i)).join(', ')}</li>
        <li><strong>Lifespan:</strong> ${breed.lifespan}</li>
      </ul>

      <h2>${t.h2s[2]}</h2>
      <p>Understanding breed-specific needs helps you provide the best possible care. ${breed.name}s have particular requirements based on their ${breed.size} size, ${breed.shedding} shedding level, and genetic predispositions to ${breed.issues.slice(0, 2).join(' and ')}.</p>
      <p>Regular veterinary checkups — at least annually for adults and twice yearly for seniors — are essential for catching breed-specific health concerns early. ${breed.issues.length > 2 ? 'With ' + breed.issues.length + ' known predispositions, proactive screening is particularly important for ' + breed.name + 's.' : ''}</p>
      ${buildAffiliateCallout(p2, breed.name + ' Care Resources')}

      <h2>${t.h2s[3]}</h2>
      <p>The key to a happy, healthy ${breed.name} is matching your care approach to their breed characteristics. ${breed.energy === 'high' ? 'High-energy breeds need physical and mental outlets every day — without them, behavioral problems like destructive chewing or excessive barking are common.' : 'Even lower-energy breeds benefit from daily interaction and enrichment.'}</p>
      <ul>
        <li>Provide ${sizeExMinutes[breed.energy] || '30-60 minutes'} of daily exercise appropriate to their energy level</li>
        <li>Feed a high-quality diet formulated for ${breed.size} ${isDog ? 'breed dogs' : 'cats'} (${sizeCalories[breed.size] || '800-1,400'} calories/day)</li>
        <li>Maintain a ${sheddingFreq[breed.shedding] || 'regular'} grooming routine</li>
        <li>Schedule breed-appropriate health screenings for ${breed.issues[0]}</li>
        <li>Invest in pet insurance early to cover breed-specific conditions</li>
      </ul>

      <h2>${t.h2s[4]}</h2>
      <p>Beyond the basics, ${breed.name} owners should be aware of the unique aspects of this breed. ${isDog && breed.group ? 'As a ' + breed.group + ' breed, the ' + breed.name + ' has instincts and behaviors shaped by centuries of selective breeding for specific tasks.' : 'Understanding your ' + breed.name + "'s natural instincts helps you provide appropriate outlets and training."}</p>
      <p>Many experienced ${breed.name} owners recommend ${breed.energy === 'high' ? 'dog sports like agility, flyball, or nosework to channel their energy productively' : breed.energy === 'low' ? 'puzzle toys and interactive feeders for mental stimulation without overexertion' : 'a balanced mix of physical activities and brain games'}.</p>
      <p>Environmental enrichment plays a crucial role in your ${breed.name}'s well-being. ${isDog ? 'Rotate toys regularly, introduce new scents and textures, and vary your walking routes to keep their mind engaged.' : 'Provide vertical climbing spaces, window perches for bird-watching, and rotating toy selection to prevent boredom.'} A mentally stimulated ${breed.name} is less likely to develop destructive behaviors or anxiety-related issues.</p>
      ${buildAffiliateCallout(p3, breed.name + ' Essentials')}

      <h2>${t.h2s[5]}</h2>
      <p>Being proactive about your ${breed.name}'s care can prevent many common problems. Watch for early signs of ${breed.issues[0]}, maintain regular veterinary visits, and keep your ${petWord} at a healthy weight — obesity exacerbates nearly every health condition ${breed.name}s are prone to.</p>
      <p>With proper care and attention to their breed-specific needs, your ${breed.name} can live a long, healthy, and happy life of ${breed.lifespan}.</p>
      <p>Establishing a consistent daily routine helps your ${breed.name} feel secure and reduces stress-related behavioral problems. Include scheduled feeding times, exercise sessions, grooming, and quiet rest periods. ${breed.energy === 'high' ? 'High-energy ' + breed.name + 's especially benefit from knowing when their exercise time is coming — it helps them settle during calmer periods.' : 'Even ' + breed.energy + '-energy breeds thrive with predictable schedules.'}</p>

      <h2>Veterinary Care Schedule for ${breed.name}s</h2>
      <p>Keeping up with preventive veterinary care is one of the most important things you can do for your ${breed.name}. Here is the recommended schedule:</p>
      <table class="comparison-table">
        <tr><th>Life Stage</th><th>Visit Frequency</th><th>Key Screenings</th></tr>
        <tr><td>Puppy/Kitten (0-1 year)</td><td>Every 3-4 weeks until 16 weeks, then at 6 and 12 months</td><td>Vaccinations, deworming, spay/neuter consultation</td></tr>
        <tr><td>Adult (1-7 years)</td><td>Annually</td><td>Physical exam, dental check, heartworm test, vaccination boosters</td></tr>
        <tr><td>Senior (7+ years)</td><td>Every 6 months</td><td>Blood work, urinalysis, ${breed.issues.map(i => toTitleCase(i)).join(' screening, ')} screening</td></tr>
      </table>
      <p>${breed.name}s should receive breed-specific screening for ${breed.issues[0]} starting at ${breed.size === 'large' ? '1-2 years of age, as large breeds develop structural issues early' : '3-5 years of age or earlier if symptoms appear'}. Early detection significantly improves treatment outcomes and quality of life.</p>

      <h2>Cost of ${breed.name} Ownership</h2>
      <p>Understanding the financial commitment helps you prepare for a lifetime of ${breed.name} ownership:</p>
      <ul>
        <li><strong>Annual food costs:</strong> ${breed.size === 'large' ? '$600–$1,200' : breed.size === 'small' ? '$250–$500' : '$400–$800'} for high-quality ${petWord} food</li>
        <li><strong>Veterinary care:</strong> $300–$700 annually for routine visits, plus potential emergency costs</li>
        <li><strong>Grooming:</strong> ${sizeGroomCost[breed.size] || '$40–$70'} per professional session (${sheddingFreq[breed.shedding] || 'regular'} home grooming recommended)</li>
        <li><strong>Pet insurance:</strong> ${sizeInsuranceCost[breed.size] || '$35–$60/month'} for comprehensive coverage</li>
        <li><strong>Supplies and toys:</strong> $200–$500 annually for bedding, toys, leashes, and other essentials</li>
      </ul>
      ${buildRelatedLinks(page, breed)}

      <h2>Frequently Asked Questions</h2>
      ${faqs.map(f => `<h3>${f.q}</h3>\n      <p>${f.a}</p>`).join('\n      ')}
      ${ctaCard('Get Personalized ' + breed.name + ' Advice', 'Our AI assistant has breed-specific knowledge about ' + breed.name + 's and can answer your specific questions about care, health, and training.')}`;
}

function buildSymptomContent(page, partners) {
  const p1 = partners.slice(0, 4), p2 = partners.slice(4, 8);
  const isDog = page.animal === 'dogs';
  const petWord = isDog ? 'dog' : 'cat';
  return `
      <h2>Understanding This Symptom</h2>
      <p>${page.desc} Understanding the potential causes helps you determine whether this is a wait-and-see situation or requires immediate veterinary attention.</p>
      <p>As a ${petWord} owner, noticing changes in your pet's behavior or health is the first step to getting them the help they need. This guide covers the most common causes, warning signs that indicate an emergency, and what you can expect at the veterinarian.</p>

      <div class="warning-box">
        <h4>When to Seek Emergency Care</h4>
        <p>If this symptom is accompanied by collapse, difficulty breathing, seizures, uncontrolled bleeding, or your ${petWord} is unable to stand, seek emergency veterinary care immediately.</p>
      </div>
      ${buildAffiliateCallout(p1, '24/7 Veterinary Access')}

      <h2>Common Causes</h2>
      <p>There are several possible reasons for this symptom, ranging from minor to serious:</p>
      <h3>Less Serious Causes</h3>
      <ul>
        <li>Minor injury or muscle strain that may resolve with rest</li>
        <li>Dietary indiscretion or eating something unusual</li>
        <li>Stress, environmental changes, or mild anxiety</li>
        <li>Normal age-related changes, especially in senior ${petWord}s</li>
      </ul>
      <h3>More Serious Causes</h3>
      <ul>
        <li>Infection (bacterial, viral, or fungal) requiring antibiotics or antifungals</li>
        <li>Organ dysfunction (kidney, liver, or heart disease)</li>
        <li>Chronic conditions like diabetes, thyroid disease, or autoimmune disorders</li>
        <li>Tumors or cancer, particularly in older ${petWord}s</li>
        <li>Poisoning or toxic exposure</li>
      </ul>

      <h2>What to Watch For</h2>
      <p>Monitor your ${petWord} for these additional symptoms that may help your veterinarian make a diagnosis:</p>
      <ul>
        <li>Changes in appetite, thirst, or urination patterns</li>
        <li>Lethargy or reluctance to move or play</li>
        <li>Vomiting, diarrhea, or changes in stool</li>
        <li>Behavioral changes like hiding, aggression, or vocalization</li>
        <li>Physical changes like swelling, discharge, or odor</li>
      </ul>

      <h2>Home Care and First Steps</h2>
      <p>While monitoring this symptom at home:</p>
      <ol>
        <li>Keep your ${petWord} calm and comfortable in a quiet environment</li>
        <li>Note when the symptom started and any changes in severity</li>
        <li>Record what your ${petWord} has eaten, any new medications, or environmental changes</li>
        <li>Take photos or videos to show your veterinarian</li>
        <li>Do not give human medications unless specifically directed by your vet</li>
      </ol>
      ${buildAffiliateCallout(p2, 'Pet Health and Insurance')}

      <h2>Veterinary Diagnosis</h2>
      <p>Your veterinarian will typically:</p>
      <ul>
        <li>Perform a thorough physical examination</li>
        <li>Run blood work (CBC, chemistry panel) to check organ function</li>
        <li>Potentially recommend X-rays, ultrasound, or other imaging</li>
        <li>May suggest urinalysis, fecal testing, or specialized diagnostics</li>
      </ul>
      <p>Expect the initial visit to cost $100–$300, with additional diagnostics ranging from $200–$1,000 depending on what's needed.</p>

      <h2>Treatment Options</h2>
      <p>Treatment depends entirely on the underlying cause. Options may include:</p>
      <ul>
        <li><strong>Medications:</strong> Antibiotics, anti-inflammatories, pain management, or condition-specific drugs</li>
        <li><strong>Dietary changes:</strong> Prescription diets or supplements for chronic conditions</li>
        <li><strong>Surgery:</strong> For injuries, tumors, or structural problems</li>
        <li><strong>Ongoing management:</strong> Chronic conditions may require lifelong medication and monitoring</li>
      </ul>

      <h2>Prevention</h2>
      <p>While not all causes are preventable, you can reduce risk by:</p>
      <ul>
        <li>Maintaining regular veterinary checkups (at least annually)</li>
        <li>Keeping vaccinations and preventive medications current</li>
        <li>Feeding a balanced, high-quality diet appropriate for your ${petWord}'s age and size</li>
        <li>Providing regular exercise and mental stimulation</li>
        <li>Pet-proofing your home to prevent toxic exposure</li>
      </ul>

      <h2>Long-Term Management</h2>
      <p>If your ${petWord}'s symptoms turn out to be caused by a chronic condition, long-term management typically involves:</p>
      <ul>
        <li><strong>Regular monitoring:</strong> Follow-up appointments every 3-6 months to track progress and adjust treatment. Blood work and diagnostic imaging may be repeated periodically to ensure treatments are working.</li>
        <li><strong>Medication compliance:</strong> Administer all prescribed medications on schedule, even when your ${petWord} appears to feel better. Stopping medications early can cause relapses or drug-resistant infections.</li>
        <li><strong>Lifestyle adjustments:</strong> Some conditions require changes to diet, exercise routines, or home environment. Your veterinarian can help you create a modified care plan that maintains quality of life.</li>
        <li><strong>Financial planning:</strong> Chronic conditions can be expensive over time. Pet insurance, wellness plans, and dedicated savings accounts help manage ongoing costs without compromising care.</li>
      </ul>
      <p>Many chronic conditions in ${petWord}s are highly manageable with modern veterinary medicine. Early diagnosis and consistent treatment give your pet the best chance at a normal, comfortable life.</p>

      <h2>When to Get a Second Opinion</h2>
      <p>Consider seeking a veterinary specialist if:</p>
      <ul>
        <li>Your ${petWord}'s symptoms persist despite treatment from your regular vet</li>
        <li>The diagnosis is uncertain and multiple conditions are being considered</li>
        <li>Surgery or aggressive treatment is recommended — a specialist can confirm the approach</li>
        <li>You want access to advanced diagnostics like MRI, CT scans, or specialized blood panels</li>
      </ul>
      <p>Board-certified veterinary specialists have additional years of training in specific areas like internal medicine, surgery, cardiology, or neurology. Your primary vet can provide referrals.</p>
      ${buildSymptomRelatedLinks(page)}

      <h2>Frequently Asked Questions</h2>
      <h3>Should I go to the emergency vet?</h3>
      <p>Seek emergency care if this symptom is severe, worsening rapidly, accompanied by other serious symptoms (collapse, difficulty breathing, seizures), or if your ${petWord} appears to be in significant pain or distress.</p>
      <h3>How much will treatment cost?</h3>
      <p>Costs vary widely based on the cause. A simple infection may cost $100–$300 to treat, while serious conditions requiring surgery or hospitalization can cost $2,000–$10,000+. Pet insurance can significantly reduce out-of-pocket expenses.</p>
      <h3>Can I treat this at home?</h3>
      <p>While some minor symptoms may resolve on their own, it's generally safest to consult a veterinarian. Many serious conditions mimic minor ones in their early stages, and early intervention often means better outcomes and lower costs.</p>
      ${ctaCard('Concerned About Your ' + (isDog ? "Dog's" : "Cat's") + ' Symptoms?', 'Our AI pet health assistant can help you assess whether this symptom needs urgent veterinary attention or can be monitored at home.')}`;
}

function buildGenericContent(page, partners) {
  const p1 = partners.slice(0, 4), p2 = partners.slice(4, 8);
  return `
      <h2>Complete Guide</h2>
      <p>${page.desc} This comprehensive resource covers everything you need to know, with practical advice and expert recommendations.</p>

      <h2>Key Information</h2>
      <p>Understanding this topic is important for every pet owner. Whether you're a first-time pet parent or experienced animal lover, staying informed about the latest research and best practices helps you provide the best possible care.</p>
      <ul>
        <li>Stay up to date with current veterinary guidelines and recommendations</li>
        <li>Consult your veterinarian for advice specific to your pet's needs</li>
        <li>Consider your pet's breed, age, size, and health status when making decisions</li>
        <li>Prevention is almost always more effective and less expensive than treatment</li>
      </ul>
      ${buildAffiliateCallout(p1, page.title)}

      <h2>What You Need to Know</h2>
      <p>This guide provides evidence-based information to help you make informed decisions about your pet's care. Every pet is unique, so use this information as a starting point and work with your veterinary team for personalized recommendations.</p>
      <p>The pet care industry is constantly evolving with new research, products, and treatment options. We update our guides regularly to reflect the latest veterinary science and product reviews.</p>

      <h2>Practical Recommendations</h2>
      <ul>
        <li>Research thoroughly before making changes to your pet's care routine</li>
        <li>Introduce changes gradually to minimize stress and digestive upset</li>
        <li>Monitor your pet's response and adjust as needed</li>
        <li>Keep records of what works and what doesn't for future reference</li>
        <li>Don't hesitate to seek professional help when needed</li>
      </ul>
      ${buildAffiliateCallout(p2, 'Recommended Resources')}

      <h2>Expert Tips</h2>
      <p>Veterinary professionals recommend a proactive approach to pet care. Regular checkups, preventive medicine, proper nutrition, and adequate exercise form the foundation of a healthy, happy life for any pet.</p>
      <p>Building a relationship with a trusted veterinarian is one of the most valuable things you can do for your pet. They can provide personalized guidance that accounts for your pet's individual health history and needs.</p>

      <h2>Understanding the Research</h2>
      <p>When evaluating pet care products, treatments, or dietary choices, look for evidence-based recommendations supported by veterinary research. Key sources of reliable information include:</p>
      <ul>
        <li><strong>Veterinary school publications:</strong> Cornell, Tufts, UC Davis, and other veterinary colleges regularly publish research findings and pet owner resources</li>
        <li><strong>AVMA guidelines:</strong> The American Veterinary Medical Association provides position statements and guidelines on a wide range of pet health topics</li>
        <li><strong>AAFCO standards:</strong> For pet food evaluation, AAFCO (Association of American Feed Control Officials) sets nutritional adequacy standards</li>
        <li><strong>Peer-reviewed journals:</strong> Publications like the Journal of Veterinary Internal Medicine and Veterinary Record provide the latest research findings</li>
      </ul>
      <p>Be cautious of anecdotal claims, especially those promoting unproven treatments or supplements. If something sounds too good to be true, consult your veterinarian before trying it with your pet.</p>

      <h2>Budgeting for Pet Care</h2>
      <p>Quality pet care doesn't have to break the bank. Smart budgeting strategies include:</p>
      <ul>
        <li><strong>Preventive care investment:</strong> Spending $300-$500 annually on preventive care (vaccines, dental cleanings, flea/tick prevention) typically saves thousands in emergency and treatment costs over your pet's lifetime</li>
        <li><strong>Pet insurance:</strong> Monthly premiums of $30-$80 provide peace of mind and financial protection against unexpected veterinary bills that can easily reach $5,000-$15,000 for serious conditions</li>
        <li><strong>Comparison shopping:</strong> Online pharmacies often offer significant savings on medications and supplements compared to in-clinic purchases. Ask your vet for a written prescription.</li>
        <li><strong>Wellness plans:</strong> Many veterinary clinics offer monthly wellness plans that bundle routine services at a discounted rate, making preventive care more affordable</li>
      </ul>

      <h2>Related Guides</h2>
      <p>Explore more of our comprehensive pet care resources:</p>
      <ul>
        <li><a href="/guides">All Pet Care Guides</a></li>
        <li><a href="/dogs">Dog Health Resources</a></li>
        <li><a href="/cats">Cat Health Resources</a></li>
        <li><a href="/tools/">Pet Care Tools & Calculators</a></li>
        <li><a href="/locations/">Find Local Vets & Pet Services</a></li>
      </ul>

      <h2>Frequently Asked Questions</h2>
      <h3>Where can I learn more?</h3>
      <p>Consult your veterinarian, reputable veterinary school websites (like those from Cornell, Tufts, or UC Davis), and organizations like the AVMA for reliable pet health information.</p>
      <h3>How often should I take my pet to the vet?</h3>
      <p>Healthy adult pets should visit the vet at least once annually. Puppies, kittens, senior pets, and those with chronic conditions may need more frequent visits — typically every 3-6 months.</p>
      <h3>How can I save money on pet care?</h3>
      <p>Invest in preventive care, consider pet insurance, compare prices between clinics, use online pharmacies for medications, and ask about wellness plans that bundle routine services at a discount.</p>
      ${ctaCard('Need Personalized Advice?', 'Our AI pet health assistant can help answer your specific questions and point you to the right resources for your pet.')}`;
}

// ============================================================
// PAGE GENERATORS
// ============================================================

function generateGuidePage(page, contentHtml) {
  const canonical = `https://petcarehelperai.com/guides/${page.slug}`;
  const cssPath = '../styles.css';
  const faqs = extractFAQs(contentHtml);
  if (!faqs.length) faqs.push({ q: `What should I know about ${page.title.toLowerCase()}?`, a: page.desc });
  const schema = genArticleSchema(page.title, page.desc) + '\n  ' + genFAQSchema(faqs);
  const hubLink = page.animal === 'dogs' ? '/dogs' : page.animal === 'cats' ? '/cats' : '/guides';
  const hubName = page.animal === 'general' ? 'Guides' : toTitleCase(page.animal);

  return `${buildHead({ title: page.title, description: page.desc, canonical, cssPath, schema })}
${buildNav()}

  <main>
    <div class="breadcrumb">
      <a href="/">Home</a> <span>&rsaquo;</span>
      <a href="${hubLink}">${hubName}</a> <span>&rsaquo;</span>
      <a href="/guides">Guides</a> <span>&rsaquo;</span>
      ${page.title}
    </div>

    <article class="guide-content">
      <h1>${page.title}</h1>
      <p>${page.desc}</p>
${contentHtml}
    </article>
${buildDisclaimer()}
  </main>
${buildFooter()}`;
}

function generateLocationPage(loc) {
  const canonical = `https://petcarehelperai.com/locations/${loc.slug}`;
  const cssPath = '../styles.css';
  const desc = `Find veterinarians, emergency vets, exotic pet vets, groomers, pet stores, and dog parks in ${loc.city}, ${loc.state}. Complete pet services directory.`;
  const title = `Find Vets &amp; Pet Services in ${loc.city}`;
  const schema = genArticleSchema(`Find Vets & Pet Services in ${loc.city}`, desc);
  const teleVets = affiliates.teleVetsAndClinics || [];
  const insurance = affiliates.insuranceAndWellness.slice(0, 3);
  const walkers = affiliates.walkingSittingBoarding.slice(0, 3);
  const gSearch = (q) => `https://www.google.com/search?q=${encodeURIComponent(q + ' ' + loc.city + ' ' + loc.state)}`;

  return `${buildHead({ title: `Find Vets & Pet Services in ${loc.city}`, description: desc, canonical, cssPath, schema })}
${buildNav()}

  <main>
    <div class="breadcrumb">
      <a href="/">Home</a> <span>&rsaquo;</span>
      <a href="/locations/">Locations</a> <span>&rsaquo;</span>
      ${loc.city}
    </div>

    <article class="guide-content">
      <h1>${title}</h1>
      <p>${loc.city}, ${loc.state} is home to a vibrant pet community with a wide range of veterinary services, groomers, pet stores, and dog-friendly spaces. This guide helps you find quality pet services throughout the ${loc.city} area.</p>

      <div class="affiliate-callout">
        <h4>24/7 Online Vet Care for ${loc.city} Pet Owners</h4>
        <p>Can't get to a vet right away? Get instant advice from licensed veterinarians online. ${teleVets.map(v => `<a href="${v.url}" target="_blank" rel="sponsored noopener">${v.name}</a> — ${v.hook}`).join('. ')}.</p>
      </div>

      <h2>Emergency Veterinary Hospitals in ${loc.city}</h2>
      <p>When your pet needs urgent care outside of regular hours, ${loc.city} has several 24-hour emergency veterinary hospitals.</p>
      <div class="hero-actions">
        <a href="${gSearch('24 hour emergency vet')}" target="_blank" class="primary-btn">Find Emergency Vets in ${loc.city}</a>
        <a href="${gSearch('after hours vet')}" target="_blank" class="ghost-btn">After-Hours Vets</a>
      </div>

      <h2>Regular Veterinary Clinics</h2>
      <p>For routine checkups, vaccinations, and non-emergency care, ${loc.city} offers many excellent veterinary clinics.</p>
      <div class="hero-actions">
        <a href="${gSearch('best rated veterinarian')}" target="_blank" class="primary-btn">Find Vets in ${loc.city}</a>
        <a href="${gSearch('affordable vet clinic')}" target="_blank" class="ghost-btn">Low-Cost Vet Clinics</a>
      </div>

      <div class="affiliate-callout">
        <h4>Pet Insurance for ${loc.city} Pet Owners</h4>
        <p>Protect your pet and your wallet. ${insurance.map(i => `<a href="${i.url}" target="_blank" rel="sponsored noopener">${i.name}</a> — ${i.hook}`).join('. ')}.</p>
      </div>

      <h2>Exotic and Specialty Veterinarians</h2>
      <p>If you have a bird, reptile, rabbit, or other exotic pet, finding a vet with specialized experience is essential.</p>
      <div class="hero-actions">
        <a href="${gSearch('exotic pet vet')}" target="_blank" class="primary-btn">Find Exotic Vets</a>
        <a href="${gSearch('avian vet')}" target="_blank" class="ghost-btn">Bird Vets</a>
      </div>

      <h2>Pet Groomers</h2>
      <p>Professional grooming keeps your pet healthy and looking their best.</p>
      <div class="hero-actions">
        <a href="${gSearch('best dog groomer')}" target="_blank" class="primary-btn">Find Groomers in ${loc.city}</a>
        <a href="${gSearch('mobile pet grooming')}" target="_blank" class="ghost-btn">Mobile Groomers</a>
      </div>

      <h2>Pet Stores and Supplies</h2>
      <p>Find pet food, supplies, and accessories at stores throughout ${loc.city}.</p>
      <div class="hero-actions">
        <a href="${gSearch('pet store')}" target="_blank" class="primary-btn">Find Pet Stores</a>
        <a href="${gSearch('pet supply store')}" target="_blank" class="ghost-btn">Pet Supply Shops</a>
      </div>

      <div class="affiliate-callout">
        <h4>Pet Sitting and Dog Walking in ${loc.city}</h4>
        <p>Need pet care while you're away? ${walkers.map(w => `<a href="${w.url}" target="_blank" rel="sponsored noopener">${w.name}</a> — ${w.hook}`).join('. ')}.</p>
      </div>

      <h2>Dog Parks and Dog-Friendly Spaces</h2>
      <p>Give your dog exercise and socialization at dog parks and pet-friendly locations around ${loc.city}.</p>
      <div class="hero-actions">
        <a href="${gSearch('dog parks')}" target="_blank" class="primary-btn">Find Dog Parks</a>
        <a href="${gSearch('dog friendly restaurants')}" target="_blank" class="ghost-btn">Dog-Friendly Dining</a>
      </div>

      <h2>Pet Training Services</h2>
      <p>Professional trainers in ${loc.city} can help with puppy training, obedience, and behavioral issues.</p>
      <div class="hero-actions">
        <a href="${gSearch('dog training classes')}" target="_blank" class="primary-btn">Find Dog Trainers</a>
        <a href="${gSearch('puppy training near me')}" target="_blank" class="ghost-btn">Puppy Classes</a>
      </div>

      <h2>Pet-Friendly Housing in ${loc.city}</h2>
      <p>Finding pet-friendly apartments and homes in ${loc.city}.</p>
      <div class="hero-actions">
        <a href="${gSearch('pet friendly apartments')}" target="_blank" class="primary-btn">Pet-Friendly Apartments</a>
      </div>

      <section class="info-card">
        <h3>Need Pet Care Advice in ${loc.city}?</h3>
        <p>Our AI assistant can help you find local services, answer pet health questions, and provide care recommendations.</p>
        <div class="hero-actions">
          <a href="/chat" class="primary-btn">Talk to AI Pet Helper</a>
        </div>
      </section>
    </article>
${buildDisclaimer()}
  </main>
${buildFooter()}`;
}

// ============================================================
// CONTENT ROUTING — determines builder + breed for each page
// ============================================================

function buildPageContent(page) {
  const partners = pickAffiliates(page.affiliateCategories || [], 15);
  const slug = page.slug;

  // Breed food pages
  if (slug.startsWith('best-food-for-')) {
    const bs = slug.replace('best-food-for-', '').replace(/-cat$/, '');
    const breed = findBreed(bs);
    if (breed) return buildBreedFoodContent(page, partners, breed);
  }
  // Breed insurance pages
  if (slug.endsWith('-pet-insurance') || slug.endsWith('-cat-pet-insurance')) {
    const bs = slug.replace(/-cat-pet-insurance$/, '').replace(/-pet-insurance$/, '');
    const breed = findBreed(bs);
    if (breed) return buildBreedInsuranceContent(page, partners, breed);
  }
  // Breed training
  if (slug.startsWith('how-to-train-a-')) {
    const bs = slug.replace('how-to-train-a-', '');
    const breed = findBreed(bs);
    if (breed) return buildGenericBreedContent(page, partners, breed, 'training');
  }
  // Breed exercise
  if (slug.endsWith('-exercise-guide')) {
    const bs = slug.replace(/-exercise-guide$/, '');
    const breed = findBreed(bs);
    if (breed) return buildGenericBreedContent(page, partners, breed, 'exercise');
  }
  // Breed grooming
  if (slug.endsWith('-grooming-guide') || slug.endsWith('-cat-grooming-guide')) {
    const bs = slug.replace(/-cat-grooming-guide$/, '').replace(/-grooming-guide$/, '');
    const breed = findBreed(bs);
    if (breed) return buildGenericBreedContent(page, partners, breed, 'grooming');
  }
  // Breed puppy
  if (slug.endsWith('-puppy-guide')) {
    const bs = slug.replace(/-puppy-guide$/, '');
    const breed = findBreed(bs);
    if (breed) return buildGenericBreedContent(page, partners, breed, 'puppy');
  }
  // Breed temperament
  if (slug.endsWith('-temperament') || slug.endsWith('-cat-temperament')) {
    const bs = slug.replace(/-cat-temperament$/, '').replace(/-temperament$/, '');
    const breed = findBreed(bs);
    if (breed) return buildGenericBreedContent(page, partners, breed, 'temperament');
  }
  // Breed cost
  if (slug.endsWith('-cost-of-ownership') || slug.endsWith('-cat-cost-of-ownership')) {
    const bs = slug.replace(/-cat-cost-of-ownership$/, '').replace(/-cost-of-ownership$/, '');
    const breed = findBreed(bs);
    if (breed) return buildGenericBreedContent(page, partners, breed, 'cost');
  }
  // Breed vs
  if (slug.includes('-vs-')) {
    const [a, b] = slug.split('-vs-');
    const ba = findBreed(a), bb = findBreed(b);
    if (ba && bb) return buildGenericBreedContent(page, partners, ba, 'temperament');
  }
  // Breed health
  if (slug.endsWith('-health-issues') || slug.endsWith('-cat-health-issues')) {
    const bs = slug.replace(/-cat-health-issues$/, '').replace(/-health-issues$/, '');
    const breed = findBreed(bs);
    if (breed) return buildGenericBreedContent(page, partners, breed, 'health');
  }
  // Breed lifespan
  if (slug.endsWith('-lifespan-guide') || slug.endsWith('-cat-lifespan')) {
    const bs = slug.replace(/-cat-lifespan$/, '').replace(/-lifespan-guide$/, '');
    const breed = findBreed(bs);
    if (breed) return buildGenericBreedContent(page, partners, breed, 'lifespan');
  }
  // Breed kids
  if (slug.endsWith('-with-kids') || slug.endsWith('-cat-with-kids')) {
    const bs = slug.replace(/-cat-with-kids$/, '').replace(/-with-kids$/, '');
    const breed = findBreed(bs);
    if (breed) return buildGenericBreedContent(page, partners, breed, 'kids');
  }
  // Breed apartment
  if (slug.endsWith('-apartment-living')) {
    const bs = slug.replace(/-apartment-living$/, '');
    const breed = findBreed(bs);
    if (breed) return buildGenericBreedContent(page, partners, breed, 'apartment');
  }
  // Breed adoption
  if (slug.startsWith('adopt-a-')) {
    const bs = slug.replace(/^adopt-a-/, '').replace(/-cat$/, '');
    const breed = findBreed(bs);
    if (breed) return buildGenericBreedContent(page, partners, breed, 'adoption');
  }
  // Breed shedding
  if (slug.endsWith('-shedding-guide')) {
    const bs = slug.replace(/-shedding-guide$/, '');
    const breed = findBreed(bs);
    if (breed) return buildGenericBreedContent(page, partners, breed, 'shedding');
  }
  // Breed size
  if (slug.startsWith('how-big-do-') && slug.endsWith('s-get')) {
    const bs = slug.replace(/^how-big-do-/, '').replace(/s-get$/, '');
    const breed = findBreed(bs);
    if (breed) return buildGenericBreedContent(page, partners, breed, 'size');
  }
  // Cat indoor
  if (slug.endsWith('-cat-indoor-guide')) {
    const bs = slug.replace(/-cat-indoor-guide$/, '');
    const breed = findBreed(bs);
    if (breed) return buildGenericBreedContent(page, partners, breed, 'catIndoor');
  }
  // Symptom pages
  if (slug.startsWith('why-is-my-') || slug.startsWith('why-does-my-') || slug.startsWith('why-are-my-')) {
    return buildSymptomContent(page, partners);
  }
  // Fallback
  return buildGenericContent(page, partners);
}

// ============================================================
// EXECUTION
// ============================================================

console.log('=== PetCareHelperAI Scale Build Engine ===');
console.log(`Date: ${TODAY}`);
console.log('');

const allGuideArrays = [
  ['Breed Food', breedFoodPages],
  ['Breed Insurance', breedInsurancePages],
  ['Breed Training', breedTrainingPages],
  ['Breed Exercise', breedExercisePages],
  ['Breed Grooming', breedGroomingPages],
  ['Breed Puppy', breedPuppyPages],
  ['Breed Temperament', breedTemperamentPages],
  ['Breed Cost', breedCostPages],
  ['Breed vs Breed', breedVsPages],
  ['Symptoms', symptomPages],
  ['Symptoms 2', symptomPages2],
  ['Nutrition', nutritionPages],
  ['Seasonal', seasonalPages],
  ['Breed Health', breedHealthPages2],
  ['Breed Lifespan', breedLifespanPages],
  ['Breed Kids', breedKidsPages],
  ['Breed Apartment', breedApartmentPages],
  ['Breed Adoption', breedAdoptionPages],
  ['Breed Shedding', breedSheddingPages],
  ['Breed Size', breedSizePages],
  ['Cat Indoor', catIndoorPages],
  ['Products', additionalProductPages],
];

const allGuidePages = allGuideArrays.flatMap(([, arr]) => arr);

let totalGuides = 0;
for (const [name, pages] of allGuideArrays) {
  let count = 0;
  for (const page of pages) {
    const filePath = join(ROOT, 'guides', `${page.slug}.html`);
    const content = buildPageContent(page);
    const html = generateGuidePage(page, content);
    writeFileSync(filePath, html);
    count++;
  }
  console.log(`  ${name}: generated ${count}/${pages.length} pages`);
  totalGuides += count;
}
console.log(`\nTotal guide pages generated: ${totalGuides}`);

// Location pages
console.log('\nGenerating location pages...');
let locCount = 0;
for (const loc of newScaleLocationPages) {
  const filePath = join(ROOT, 'locations', `${loc.slug}.html`);
  const html = generateLocationPage(loc);
  writeFileSync(filePath, html);
  locCount++;
}
console.log(`  Generated ${locCount} location pages.`);

// ============================================================
// SITEMAP REGENERATION
// ============================================================
console.log('\nRegenerating sitemap.xml...');
const allUrls = [];

function collectUrls(dir, urlPrefix) {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      collectUrls(join(dir, entry.name), `${urlPrefix}/${entry.name}`);
    } else if (entry.name.endsWith('.html')) {
      const slug = entry.name === 'index.html' ? '' : entry.name.replace('.html', '');
      allUrls.push(slug ? `${urlPrefix}/${slug}` : `${urlPrefix}/`);
    }
  }
}

const topFiles = readdirSync(ROOT).filter(f => f.endsWith('.html'));
for (const f of topFiles) {
  const slug = f === 'index.html' ? '' : f.replace('.html', '');
  allUrls.push(slug ? `/${slug}` : '/');
}
collectUrls(join(ROOT, 'guides'), '/guides');
collectUrls(join(ROOT, 'breeds'), '/breeds');
collectUrls(join(ROOT, 'locations'), '/locations');
collectUrls(join(ROOT, 'tools'), '/tools');
collectUrls(join(ROOT, 'resources'), '/resources');
collectUrls(join(ROOT, 'feeds'), '/feeds');

function getPriority(url) {
  if (url === '/' || url === '/dogs' || url === '/cats' || url === '/birds' || url === '/reptiles' || url === '/fish' || url === '/guides' || url === '/chat') return '1.0';
  if (url.includes('/breeds/dog-breeds') || url.includes('/breeds/cat-breeds') || url.includes('/breeds/bird-breeds') || url.includes('/breeds/fish-breeds') || url.includes('/breeds/reptile-breeds') || url.includes('/breeds/small-animal-breeds')) return '0.8';
  if (url.startsWith('/guides/') || url.startsWith('/tools/') || url.startsWith('/locations/')) return '0.7';
  if (url.startsWith('/breeds/')) return '0.6';
  if (url.startsWith('/resources/') || url === '/about' || url === '/faq' || url === '/partners') return '0.5';
  return '0.4';
}

const uniqueUrls = [...new Set(allUrls)].filter(u => !u.includes('/embed/')).sort();
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map(url => `  <url>
    <loc>https://petcarehelperai.com${url}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${getPriority(url)}</priority>
  </url>`).join('\n')}
</urlset>`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemapXml);
console.log(`  Sitemap generated with ${uniqueUrls.length} URLs.`);

// ============================================================
// RSS FEED UPDATE
// ============================================================
console.log('Updating RSS feeds...');

function buildRssItem(page) {
  return `    <item>
      <title>${page.title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>
      <link>https://petcarehelperai.com/guides/${page.slug}</link>
      <description>${page.desc.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</description>
      <pubDate>${new Date(TODAY).toUTCString()}</pubDate>
      <guid isPermaLink="true">https://petcarehelperai.com/guides/${page.slug}</guid>
    </item>`;
}

const rssHeader = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Pet Care Helper AI - Pet Health Guides</title>
    <link>https://petcarehelperai.com</link>
    <description>Comprehensive pet care guides covering health, nutrition, training, and wellness for dogs, cats, birds, fish, reptiles, and small animals.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(TODAY).toUTCString()}</lastBuildDate>
    <atom:link href="https://petcarehelperai.com/feed.xml" rel="self" type="application/rss+xml"/>`;
const rssFooter = `\n  </channel>\n</rss>`;

const recentPages = allGuidePages.slice(0, 100);
writeFileSync(join(ROOT, 'feed.xml'), `${rssHeader}\n${recentPages.map(buildRssItem).join('\n')}\n${rssFooter}`);

const dogGuides = allGuidePages.filter(p => p.animal === 'dogs').slice(0, 80);
const catGuides = allGuidePages.filter(p => p.animal === 'cats').slice(0, 80);
writeFileSync(join(ROOT, 'feeds', 'dogs.xml'), `${rssHeader.replace('feed.xml', 'feeds/dogs.xml').replace('Pet Health Guides', 'Dog Care Guides')}\n${dogGuides.map(buildRssItem).join('\n')}\n${rssFooter}`);
writeFileSync(join(ROOT, 'feeds', 'cats.xml'), `${rssHeader.replace('feed.xml', 'feeds/cats.xml').replace('Pet Health Guides', 'Cat Care Guides')}\n${catGuides.map(buildRssItem).join('\n')}\n${rssFooter}`);
writeFileSync(join(ROOT, 'feeds', 'guides.xml'), `${rssHeader.replace('feed.xml', 'feeds/guides.xml').replace('Pet Health Guides', 'All Guides')}\n${recentPages.map(buildRssItem).join('\n')}\n${rssFooter}`);

console.log('  RSS feeds updated.');
console.log('\n=== Scale Build Complete ===');
console.log(`  New guide pages: ${totalGuides}`);
console.log(`  New location pages: ${locCount}`);
console.log(`  Total new pages: ${totalGuides + locCount}`);
console.log(`  Sitemap URLs: ${uniqueUrls.length}`);
