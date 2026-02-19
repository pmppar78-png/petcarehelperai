#!/usr/bin/env node
/**
 * PetCareHelperAI — Hub Page Updater & Orphan Fixer
 * 1. Adds links to new content on hub pages (dogs.html, cats.html, etc.)
 * 2. Injects related-guide sections into existing orphaned guides
 * 3. Updates the main guides.html index
 * 4. Updates the locations/index.html
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import {
  costPages, safetyPages, emergencyPages, dogDiseasePages, catDiseasePages,
  behaviorPages, productPages, breedHealthPages, exoticPages, comparisonPages, newLocationPages
} from './content-data.js';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');

// All new guide pages (flat list)
const allNewPages = [
  ...costPages, ...safetyPages, ...emergencyPages,
  ...dogDiseasePages, ...catDiseasePages, ...behaviorPages,
  ...productPages, ...breedHealthPages, ...exoticPages, ...comparisonPages
];

function buildGuideGridSection(title, pages) {
  if (pages.length === 0) return '';
  return `
      <h3>${title}</h3>
      <div class="guide-grid">
${pages.map(p => `        <a href="/guides/${p.slug}" class="guide-card">
          <h4>${p.title}</h4>
          <p>${p.desc.slice(0, 100)}...</p>
        </a>`).join('\n')}
      </div>`;
}

// ============================================================
// 1. UPDATE HUB PAGES
// ============================================================

function updateHubPage(filename, animalType) {
  const filePath = join(ROOT, filename);
  if (!existsSync(filePath)) return;

  let html = readFileSync(filePath, 'utf8');

  // Check if we already added expansion content
  if (html.includes('expansion-content-section')) return;

  // Get relevant new pages for this animal
  const dogPages = allNewPages.filter(p => p.animal === 'dogs');
  const catPages = allNewPages.filter(p => p.animal === 'cats');
  const birdPages = allNewPages.filter(p => p.animal === 'birds');
  const fishPages = allNewPages.filter(p => p.animal === 'fish');
  const reptilePages = allNewPages.filter(p => p.animal === 'reptiles');
  const generalPages = allNewPages.filter(p => p.animal === 'general');

  let relevantPages;
  switch (animalType) {
    case 'dogs': relevantPages = dogPages; break;
    case 'cats': relevantPages = catPages; break;
    case 'birds': relevantPages = birdPages; break;
    case 'fish': relevantPages = fishPages; break;
    case 'reptiles': relevantPages = reptilePages; break;
    default: relevantPages = generalPages;
  }

  // Group by type
  const healthPages = relevantPages.filter(p => p.slug.includes('disease') || p.slug.includes('infection') || p.slug.includes('cancer') || p.slug.includes('uti') || p.slug.includes('pancreatitis') || p.slug.includes('cushings') || p.slug.includes('thyroid') || p.slug.includes('ivdd') || p.slug.includes('heart') || p.slug.includes('colitis') || p.slug.includes('ibd') || p.slug.includes('allerg') || p.slug.includes('obesity') || p.slug.includes('dental') || p.slug.includes('parvo') || p.slug.includes('kennel') || p.slug.includes('lyme') || p.slug.includes('hotspot') || p.slug.includes('cataract') || p.slug.includes('cruciate') || p.slug.includes('parasite') || p.slug.includes('mange') || p.slug.includes('addison') || p.slug.includes('felv') || p.slug.includes('fiv') || p.slug.includes('asthma') || p.slug.includes('constipation') || p.slug.includes('fip') || p.slug.includes('litter-box') || p.slug.includes('overgroom') || p.slug.includes('respiratory') || p.slug.includes('ear-infection') || p.slug.includes('skin-allerg'));
  const breedHealthGuides = relevantPages.filter(p => p.slug.includes('health-guide'));
  const behaviorGuides = relevantPages.filter(p => p.slug.includes('training') || p.slug.includes('anxiety') || p.slug.includes('phobia') || p.slug.includes('reactiv') || p.slug.includes('guarding') || p.slug.includes('potty') || p.slug.includes('crate') || p.slug.includes('biting') || p.slug.includes('impulse') || p.slug.includes('recall') || p.slug.includes('leash') || p.slug.includes('aggression') || p.slug.includes('barking') || p.slug.includes('digging') || p.slug.includes('socializ') || p.slug.includes('clicker') || p.slug.includes('introducing') || p.slug.includes('enrichment'));
  const productGuides = relevantPages.filter(p => p.slug.includes('best-'));
  const careGuides = relevantPages.filter(p => p.slug.includes('care-guide'));
  const costGuides = allNewPages.filter(p => (p.animal === animalType || p.animal === 'general') && (p.slug.includes('cost') || p.slug.includes('how-much') || p.slug.includes('pricing')));
  const safetyGuides = allNewPages.filter(p => (p.animal === animalType || p.animal === 'general') && (p.slug.includes('can-dogs') || p.slug.includes('can-cats') || p.slug.includes('toxic') || p.slug.includes('safe-') || p.slug.includes('poisoning') || p.slug.includes('food-safety')));
  const emergencyGuides = allNewPages.filter(p => (p.animal === animalType || p.animal === 'general') && (p.slug.includes('emergency') || p.slug.includes('choking') || p.slug.includes('heatstroke') || p.slug.includes('seizure') || p.slug.includes('cpr') || p.slug.includes('when-to-go')));

  let newSections = `\n    <!-- expansion-content-section -->
    <section style="margin-top: 40px;">`;

  if (healthPages.length > 0) {
    newSections += buildGuideGridSection('Health &amp; Disease Guides', healthPages.slice(0, 12));
  }
  if (breedHealthGuides.length > 0) {
    newSections += buildGuideGridSection('Breed-Specific Health Guides', breedHealthGuides.slice(0, 10));
  }
  if (behaviorGuides.length > 0) {
    newSections += buildGuideGridSection('Training &amp; Behavior Guides', behaviorGuides.slice(0, 8));
  }
  if (productGuides.length > 0) {
    newSections += buildGuideGridSection('Product Buying Guides', productGuides.slice(0, 8));
  }
  if (careGuides.length > 0) {
    newSections += buildGuideGridSection('Species Care Guides', careGuides.slice(0, 10));
  }
  if (costGuides.length > 0) {
    newSections += buildGuideGridSection('Cost &amp; Pricing Guides', costGuides.slice(0, 8));
  }
  if (safetyGuides.length > 0) {
    newSections += buildGuideGridSection('Safety &amp; Toxicity Guides', safetyGuides.slice(0, 8));
  }
  if (emergencyGuides.length > 0) {
    newSections += buildGuideGridSection('Emergency Guides', emergencyGuides.slice(0, 6));
  }

  newSections += `
    </section>`;

  // Insert before the closing </main> tag
  html = html.replace('</main>', newSections + '\n  </main>');
  writeFileSync(filePath, html);
  console.log(`  Updated ${filename} with new guide links`);
}

console.log('=== Hub Page Updater ===\n');
console.log('Updating animal hub pages...');
updateHubPage('dogs.html', 'dogs');
updateHubPage('cats.html', 'cats');
updateHubPage('birds.html', 'birds');
updateHubPage('fish.html', 'fish');
updateHubPage('reptiles.html', 'reptiles');

// ============================================================
// 2. UPDATE GUIDES INDEX
// ============================================================

console.log('\nUpdating guides index page...');
const guidesIndexPath = join(ROOT, 'guides.html');
if (existsSync(guidesIndexPath)) {
  let guidesHtml = readFileSync(guidesIndexPath, 'utf8');

  if (!guidesHtml.includes('expansion-guides-section')) {
    const costSection = buildGuideGridSection('Cost &amp; Pricing Guides', costPages.slice(0, 10));
    const safetySection = buildGuideGridSection('Safety &amp; Toxicity Guides', safetyPages.slice(0, 10));
    const emergencySection = buildGuideGridSection('Emergency Response Guides', emergencyPages.slice(0, 8));
    const dogDiseaseSection = buildGuideGridSection('Dog Health &amp; Disease Guides', dogDiseasePages.slice(0, 10));
    const catDiseaseSection = buildGuideGridSection('Cat Health &amp; Disease Guides', catDiseasePages.slice(0, 10));
    const behaviorSection = buildGuideGridSection('Training &amp; Behavior Guides', behaviorPages.slice(0, 10));
    const productSection = buildGuideGridSection('Product Buying Guides', productPages.slice(0, 10));
    const breedHealthSection = buildGuideGridSection('Breed-Specific Health Guides', breedHealthPages.slice(0, 10));
    const exoticSection = buildGuideGridSection('Bird, Fish &amp; Reptile Guides', exoticPages.slice(0, 10));
    const compSection = buildGuideGridSection('Comparison &amp; Life-Stage Guides', comparisonPages.slice(0, 10));

    const newContent = `\n    <!-- expansion-guides-section -->
    <section style="margin-top: 40px;">
      <h2>Comprehensive Pet Care Library</h2>
      <p>Explore our expanded collection of in-depth guides covering health, safety, training, products, and more for every type of pet.</p>
      ${costSection}
      ${safetySection}
      ${emergencySection}
      ${dogDiseaseSection}
      ${catDiseaseSection}
      ${behaviorSection}
      ${productSection}
      ${breedHealthSection}
      ${exoticSection}
      ${compSection}
    </section>`;

    guidesHtml = guidesHtml.replace('</main>', newContent + '\n  </main>');
    writeFileSync(guidesIndexPath, guidesHtml);
    console.log('  Updated guides.html with all new guide links');
  }
}

// ============================================================
// 3. UPDATE LOCATIONS INDEX
// ============================================================

console.log('\nUpdating locations index page...');
const locIndexPath = join(ROOT, 'locations', 'index.html');
if (existsSync(locIndexPath)) {
  let locHtml = readFileSync(locIndexPath, 'utf8');

  if (!locHtml.includes('expansion-locations-section')) {
    const newCityLinks = newLocationPages.map(l =>
      `        <a href="/locations/${l.slug}" class="guide-card">
          <h4>${l.city}, ${l.state}</h4>
          <p>Find vets, groomers, pet stores, and pet services in ${l.city}.</p>
        </a>`
    ).join('\n');

    const newContent = `\n    <!-- expansion-locations-section -->
    <section style="margin-top: 40px;">
      <h3>More Cities</h3>
      <div class="guide-grid">
${newCityLinks}
      </div>
    </section>`;

    locHtml = locHtml.replace('</main>', newContent + '\n  </main>');
    writeFileSync(locIndexPath, locHtml);
    console.log('  Updated locations/index.html with 28 new cities');
  }
}

// ============================================================
// 4. INJECT RELATED LINKS INTO EXISTING ORPHANED GUIDES
// ============================================================

console.log('\nInjecting cross-links into existing guides...');

// Build a keyword index for all guides
const allGuideSlugs = readdirSync(join(ROOT, 'guides')).filter(f => f.endsWith('.html')).map(f => f.replace('.html', ''));

function findRelatedSlugs(slug, limit = 6) {
  const words = slug.split('-').filter(w => w.length >= 3);
  const scored = allGuideSlugs.map(other => {
    if (other === slug) return { slug: other, score: -1 };
    const otherWords = other.split('-').filter(w => w.length >= 3);
    let score = 0;
    for (const w of words) {
      if (otherWords.includes(w)) score += 3;
    }
    // Boost if both are about same animal type
    if ((slug.includes('dog') && other.includes('dog')) ||
        (slug.includes('cat') && other.includes('cat')) ||
        (slug.includes('bird') && other.includes('bird')) ||
        (slug.includes('fish') && other.includes('fish')) ||
        (slug.includes('reptile') && other.includes('reptile'))) {
      score += 2;
    }
    return { slug: other, score };
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.slug);
}

let orphanFixed = 0;
const guideFiles = readdirSync(join(ROOT, 'guides')).filter(f => f.endsWith('.html'));
for (const f of guideFiles) {
  const filePath = join(ROOT, 'guides', f);
  let html = readFileSync(filePath, 'utf8');

  // Skip if already has related guides section
  if (html.includes('related-guides-section')) continue;

  const slug = f.replace('.html', '');
  const related = findRelatedSlugs(slug, 6);
  if (related.length < 2) continue;

  // Get titles from files
  const relatedLinks = related.map(rSlug => {
    const rFile = join(ROOT, 'guides', `${rSlug}.html`);
    if (!existsSync(rFile)) return null;
    const rHtml = readFileSync(rFile, 'utf8');
    const titleMatch = rHtml.match(/<h1>([^<]+)<\/h1>/);
    const title = titleMatch ? titleMatch[1] : rSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `        <a href="/guides/${rSlug}" class="guide-card">
          <h3>${title}</h3>
        </a>`;
  }).filter(Boolean);

  if (relatedLinks.length < 2) continue;

  const relatedSection = `
    <section class="related-guides-section" style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #E2E8F0;">
      <h2>Related Guides</h2>
      <div class="guide-grid">
${relatedLinks.join('\n')}
      </div>
    </section>`;

  // Insert before </article> or before disclaimer
  if (html.includes('</article>')) {
    html = html.replace('</article>', relatedSection + '\n    </article>');
  }

  writeFileSync(filePath, html);
  orphanFixed++;
}
console.log(`  Added related links to ${orphanFixed} existing guide pages`);

// ============================================================
// 5. ADD CROSS-LINKS TO BREED PAGES
// ============================================================

console.log('\nAdding guide links to breed pages...');

// Build lookup for breed health guides
const breedHealthMap = {};
for (const p of breedHealthPages) {
  if (p.breed) {
    breedHealthMap[p.breed] = p;
  }
}

let breedLinksAdded = 0;
for (const animalDir of ['dogs', 'cats']) {
  const breedDir = join(ROOT, 'breeds', animalDir);
  if (!existsSync(breedDir)) continue;
  const files = readdirSync(breedDir).filter(f => f.endsWith('.html'));

  for (const f of files) {
    const filePath = join(breedDir, f);
    let html = readFileSync(filePath, 'utf8');

    // Skip if already has breed-guide-links
    if (html.includes('breed-guide-links-section')) continue;

    const breedSlug = f.replace('.html', '');

    // Find relevant guides for this breed
    const relevantGuides = [];

    // Check for breed-specific health guide
    if (breedHealthMap[breedSlug]) {
      relevantGuides.push({ slug: breedHealthMap[breedSlug].slug, title: breedHealthMap[breedSlug].title });
    }

    // Add general health guides for the animal type
    const diseasePages = animalDir === 'dogs' ? dogDiseasePages : catDiseasePages;
    for (const dp of diseasePages.slice(0, 4)) {
      relevantGuides.push({ slug: dp.slug, title: dp.title });
    }

    // Add cost guides
    const costGuide = costPages.find(p => p.animal === animalDir || p.animal === 'general');
    if (costGuide) relevantGuides.push({ slug: costGuide.slug, title: costGuide.title });

    // Add insurance comparison
    relevantGuides.push({ slug: 'compare-pet-insurance', title: 'Pet Insurance Comparison Guide' });

    if (relevantGuides.length === 0) continue;

    const linksHtml = `
    <!-- breed-guide-links-section -->
    <section style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #E2E8F0;">
      <h2>Related Health &amp; Care Guides</h2>
      <div class="guide-grid">
${relevantGuides.slice(0, 6).map(g => `        <a href="/guides/${g.slug}" class="guide-card">
          <h3>${g.title}</h3>
        </a>`).join('\n')}
      </div>
    </section>`;

    // Insert before </article>
    if (html.includes('</article>')) {
      html = html.replace('</article>', linksHtml + '\n    </article>');
      writeFileSync(filePath, html);
      breedLinksAdded++;
    }
  }
}
console.log(`  Added guide links to ${breedLinksAdded} breed pages`);

// ============================================================
// SUMMARY
// ============================================================

console.log('\n=== Hub Updates Complete ===');
console.log(`Hub pages updated: 5`);
console.log(`Guides index updated: 1`);
console.log(`Locations index updated: 1`);
console.log(`Existing guides with cross-links added: ${orphanFixed}`);
console.log(`Breed pages with guide links added: ${breedLinksAdded}`);
