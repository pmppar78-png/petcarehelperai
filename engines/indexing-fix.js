/**
 * PetCareHelperAI — Indexing Emergency Fix Engine
 *
 * Root Causes Identified:
 * 1. 760 orphaned guide pages (no inbound links)
 * 2. 125 orphaned location pages (not linked from location index)
 * 3. Guide pages don't link back to breed/commercial pages
 * 4. Sitemap trailing-slash inconsistency on /locations/ and /tools/
 * 5. Commercial FAQ content near-identical across breeds
 * 6. Thin breed index pages (amphibian-breeds, marine-fish-breeds)
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('.');
const DOMAIN = 'https://petcarehelperai.com';
const TODAY = '2026-02-26';

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function readFile(p) {
  return fs.readFileSync(path.join(ROOT, p), 'utf-8');
}

function writeFile(p, content) {
  fs.writeFileSync(path.join(ROOT, p), content, 'utf-8');
}

function listHtml(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full)
    .filter(f => f.endsWith('.html') && f !== 'index.html')
    .map(f => f.replace('.html', ''));
}

function slugToTitle(slug) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/ (A|An|And|At|But|By|For|In|Of|On|Or|The|To|Up|Vs|With) /g, (m) => m.toLowerCase())
    .replace(/^./, c => c.toUpperCase());
}

// ============================================================
// LOAD DATA
// ============================================================

const entities = JSON.parse(readFile('data/entities.json'));
const entityMap = new Map();
entities.forEach(e => {
  entityMap.set(`${e.species_group}/${e.slug}`, e);
});

const speciesGroups = ['dogs', 'cats', 'birds', 'fish', 'marine-fish', 'reptiles', 'amphibians', 'small-animals'];
const speciesDisplayNames = {
  dogs: 'Dogs', cats: 'Cats', birds: 'Birds', fish: 'Fish',
  'marine-fish': 'Marine Fish', reptiles: 'Reptiles', amphibians: 'Amphibians',
  'small-animals': 'Small Animals'
};

// ============================================================
// FIX 1: SITEMAP TRAILING SLASH CONSISTENCY
// ============================================================

function fixSitemap() {
  console.log('\n=== FIX 1: SITEMAP TRAILING SLASH CONSISTENCY ===');
  let sitemap = readFile('sitemap.xml');
  let fixes = 0;

  // Fix /locations/ → /locations
  if (sitemap.includes(`${DOMAIN}/locations/</loc>`)) {
    sitemap = sitemap.replace(`${DOMAIN}/locations/</loc>`, `${DOMAIN}/locations</loc>`);
    fixes++;
  }
  // Fix /tools/ → /tools
  if (sitemap.includes(`${DOMAIN}/tools/</loc>`)) {
    sitemap = sitemap.replace(`${DOMAIN}/tools/</loc>`, `${DOMAIN}/tools</loc>`);
    fixes++;
  }

  writeFile('sitemap.xml', sitemap);
  console.log(`  Fixed ${fixes} trailing-slash URLs in sitemap.xml`);
  return fixes;
}

// ============================================================
// FIX 2: LOCATION INDEX — LINK ALL 175 LOCATION PAGES
// ============================================================

function fixLocationIndex() {
  console.log('\n=== FIX 2: LOCATION INDEX — LINK ALL LOCATIONS ===');
  const locationSlugs = listHtml('locations');
  let html = readFile('locations/index.html');

  // Build a map of currently-linked locations
  const linkedLocations = new Set();
  const hrefPattern = /href="\/locations\/([^"]+)"/g;
  let match;
  while ((match = hrefPattern.exec(html)) !== null) {
    linkedLocations.add(match[1]);
  }

  const missingLocations = locationSlugs.filter(s => !linkedLocations.has(s));
  console.log(`  Currently linked: ${linkedLocations.size}`);
  console.log(`  Total location pages: ${locationSlugs.length}`);
  console.log(`  Missing from index: ${missingLocations.length}`);

  if (missingLocations.length === 0) {
    console.log('  No missing locations — skipping.');
    return 0;
  }

  // Group by first letter for organized sections
  const byLetter = {};
  for (const slug of missingLocations) {
    const letter = slug[0].toUpperCase();
    if (!byLetter[letter]) byLetter[letter] = [];
    byLetter[letter].push(slug);
  }

  // Build additional location cards HTML
  let cardsHtml = '';
  for (const slug of missingLocations) {
    const name = slugToTitle(slug);
    cardsHtml += `        <a href="/locations/${slug}" class="guide-card">
          <h4>${name}</h4>
          <p>Find vets, groomers, pet stores, and pet services in ${name}.</p>
        </a>\n`;
  }

  // Insert before the closing of the "More Cities" section
  // The existing expansion section has <!-- expansion-locations-section --> marker
  const marker = '<!-- expansion-locations-section -->';
  if (html.includes(marker)) {
    // Find the closing </div> of the guide-grid inside the expansion section
    const expansionStart = html.indexOf(marker);
    const gridEnd = html.indexOf('</div>', html.indexOf('guide-grid', expansionStart));
    if (gridEnd !== -1) {
      html = html.slice(0, gridEnd) + cardsHtml + html.slice(gridEnd);
    }
  } else {
    // Fallback: insert before </main>
    const mainEnd = html.lastIndexOf('</main>');
    const additionalSection = `
    <section style="margin-top: 40px;">
      <h3>All Cities</h3>
      <div class="guide-grid">
${cardsHtml}      </div>
    </section>\n`;
    html = html.slice(0, mainEnd) + additionalSection + html.slice(mainEnd);
  }

  // Also fix the canonical URL (currently has trailing slash)
  html = html.replace(
    'href="https://petcarehelperai.com/locations/"',
    'href="https://petcarehelperai.com/locations"'
  );
  html = html.replace(
    'content="https://petcarehelperai.com/locations/"',
    'content="https://petcarehelperai.com/locations"'
  );

  writeFile('locations/index.html', html);
  console.log(`  Added ${missingLocations.length} missing location links to index.`);
  return missingLocations.length;
}

// ============================================================
// FIX 3: BREED PAGES → ADD LINKS TO ALL ASSOCIATED GUIDES
// ============================================================

function buildBreedGuideMap() {
  // Build a map of breed slug → [guide slugs]
  const guideFiles = listHtml('guides');
  const breedGuideMap = new Map(); // "dogs/golden-retriever" → ["golden-retriever-health-guide", ...]

  for (const entity of entities) {
    const key = `${entity.species_group}/${entity.slug}`;
    const guides = [];
    const slug = entity.slug;
    const displayLower = entity.display_name.toLowerCase().replace(/\s+/g, '-');

    // Check all guide patterns for this breed
    const patterns = [
      `${slug}-health-guide`,
      `${slug}-health-issues`,
      `${slug}-temperament`,
      `${slug}-grooming-guide`,
      `${slug}-with-kids`,
      `${slug}-apartment-living`,
      `${slug}-shedding-guide`,
      `${slug}-puppy-guide`,
      `${slug}-lifespan-guide`,
      `${slug}-lifespan`,
      `${slug}-indoor-guide`,
      `${slug}-cost-of-ownership`,
      `${slug}-exercise-guide`,
      `${slug}-pet-insurance`,
      `adopt-a-${slug}`,
      `how-big-do-${slug}s-get`,
      `how-big-do-${slug}-get`,
      `${slug}-training`,
    ];

    // Also check displayLower based patterns (for multi-word breeds)
    if (displayLower !== slug) {
      patterns.push(
        `${displayLower}-health-guide`,
        `${displayLower}-health-issues`,
        `${displayLower}-temperament`,
        `${displayLower}-grooming-guide`,
        `${displayLower}-with-kids`,
        `${displayLower}-apartment-living`,
        `${displayLower}-shedding-guide`,
        `${displayLower}-puppy-guide`,
        `${displayLower}-lifespan-guide`,
        `${displayLower}-lifespan`,
        `${displayLower}-indoor-guide`,
        `${displayLower}-cost-of-ownership`,
        `${displayLower}-exercise-guide`,
        `${displayLower}-pet-insurance`,
        `adopt-a-${displayLower}`,
        `how-big-do-${displayLower}s-get`,
        `how-big-do-${displayLower}-get`,
        `${displayLower}-training`,
      );
    }

    // Also find any vs-comparison guides
    for (const g of guideFiles) {
      if (g.includes(slug) && g.includes('-vs-')) {
        patterns.push(g);
      }
    }

    for (const p of patterns) {
      if (guideFiles.includes(p)) {
        guides.push(p);
      }
    }

    if (guides.length > 0) {
      breedGuideMap.set(key, [...new Set(guides)]);
    }
  }

  return breedGuideMap;
}

function guideSlugToTitle(slug) {
  // Convert guide slug to display title
  return slug
    .replace(/^adopt-a-/, 'How to Adopt a ')
    .replace(/^how-big-do-/, 'How Big Do ')
    .replace(/-get$/, ' Get?')
    .replace(/-health-guide$/, ' Health Guide')
    .replace(/-health-issues$/, ' Health Issues')
    .replace(/-temperament$/, ' Temperament')
    .replace(/-grooming-guide$/, ' Grooming Guide')
    .replace(/-with-kids$/, ' With Kids')
    .replace(/-apartment-living$/, ' Apartment Living')
    .replace(/-shedding-guide$/, ' Shedding Guide')
    .replace(/-puppy-guide$/, ' Puppy Guide')
    .replace(/-lifespan-guide$/, ' Lifespan Guide')
    .replace(/-lifespan$/, ' Lifespan')
    .replace(/-indoor-guide$/, ' Indoor Guide')
    .replace(/-cost-of-ownership$/, ' Cost of Ownership')
    .replace(/-exercise-guide$/, ' Exercise Guide')
    .replace(/-pet-insurance$/, ' Pet Insurance')
    .replace(/-training$/, ' Training')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/^How To /, 'How to ')
    .replace(/^How Big Do /, 'How Big Do ')
    .replace(/ Vs /g, ' vs ');
}

function fixBreedPageGuideLinks() {
  console.log('\n=== FIX 3: BREED PAGES → LINK TO ALL ASSOCIATED GUIDES ===');
  const breedGuideMap = buildBreedGuideMap();
  let totalLinksAdded = 0;
  let pagesModified = 0;

  for (const [key, guides] of breedGuideMap) {
    const [species, slug] = key.split('/');
    const breedFile = `breeds/${species}/${slug}.html`;
    const fullPath = path.join(ROOT, breedFile);

    if (!fs.existsSync(fullPath)) continue;

    let html = readFile(breedFile);

    // Check which guides are already linked
    const alreadyLinked = new Set();
    for (const g of guides) {
      if (html.includes(`/guides/${g}`)) {
        alreadyLinked.add(g);
      }
    }

    const newGuides = guides.filter(g => !alreadyLinked.has(g));
    if (newGuides.length === 0) continue;

    // Build a "More Guides" section to insert
    let guidesHtml = `\n    <section class="related-guides-section" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
      <h2>More ${entityMap.get(key)?.display_name || slugToTitle(slug)} Guides</h2>
      <div class="guide-grid">\n`;

    for (const g of newGuides) {
      guidesHtml += `        <a href="/guides/${g}" class="guide-card">
          <h3>${guideSlugToTitle(g)}</h3>
          <p>Expert guide for ${entityMap.get(key)?.display_name || slugToTitle(slug)} owners.</p>
        </a>\n`;
    }

    guidesHtml += `      </div>
    </section>\n`;

    // Insert before </article> or before the transparency/disclaimer section
    const insertPoint = html.indexOf('<section class="transparency">');
    if (insertPoint !== -1) {
      html = html.slice(0, insertPoint) + guidesHtml + html.slice(insertPoint);
    } else {
      // Fallback: insert before </main>
      const mainClose = html.lastIndexOf('</main>');
      if (mainClose !== -1) {
        html = html.slice(0, mainClose) + guidesHtml + html.slice(mainClose);
      }
    }

    writeFile(breedFile, html);
    totalLinksAdded += newGuides.length;
    pagesModified++;
  }

  console.log(`  Modified ${pagesModified} breed pages`);
  console.log(`  Added ${totalLinksAdded} new guide links total`);
  return totalLinksAdded;
}

// ============================================================
// FIX 4: GUIDE PAGES → ADD LINKS BACK TO BREED + COMMERCIAL
// ============================================================

function fixGuidePageBackLinks() {
  console.log('\n=== FIX 4: GUIDE PAGES → LINK BACK TO BREED & COMMERCIAL ===');
  const guideFiles = listHtml('guides');
  let totalLinksAdded = 0;
  let pagesModified = 0;

  for (const entity of entities) {
    const slug = entity.slug;
    const species = entity.species_group;
    const displayName = entity.display_name;
    const breedUrl = `/breeds/${species}/${slug}`;

    // Find guides related to this entity
    const relatedGuides = guideFiles.filter(g => {
      return g.includes(slug) || g.includes(displayName.toLowerCase().replace(/\s+/g, '-'));
    });

    for (const guideName of relatedGuides) {
      const guidePath = `guides/${guideName}.html`;
      if (!fs.existsSync(path.join(ROOT, guidePath))) continue;

      let html = readFile(guidePath);

      // Check if breed page link already exists
      const hasBreedLink = html.includes(breedUrl);

      // Check if commercial links exist
      const hasCommercialLinks = html.includes(`/commercial/${species}/${slug}/`);

      if (hasBreedLink && hasCommercialLinks) continue;

      // Build a "Related Pages" section
      let relatedHtml = '';
      const linksToAdd = [];

      if (!hasBreedLink) {
        linksToAdd.push(`<a href="${breedUrl}" class="guide-card"><h3>${displayName} Breed Profile</h3><p>Complete breed guide with health, temperament, care details, and cost information.</p></a>`);
      }

      if (!hasCommercialLinks) {
        // Add key commercial links
        const commercialTypes = [
          { slug: 'best-food', title: `Best Food for ${displayName}` },
          { slug: 'best-insurance', title: `Best Insurance for ${displayName}` },
          { slug: 'cost-to-own', title: `Cost to Own a ${displayName}` },
        ];

        for (const ct of commercialTypes) {
          const commercialFile = `commercial/${species}/${slug}/${ct.slug}.html`;
          if (fs.existsSync(path.join(ROOT, commercialFile))) {
            linksToAdd.push(`<a href="/commercial/${species}/${slug}/${ct.slug}" class="guide-card"><h3>${ct.title}</h3><p>Expert recommendations and comparison guide.</p></a>`);
          }
        }
      }

      if (linksToAdd.length === 0) continue;

      relatedHtml = `\n    <section class="related-guides-section" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
      <h2>Explore More About ${displayName}</h2>
      <div class="guide-grid">
        ${linksToAdd.join('\n        ')}
      </div>
    </section>\n`;

      // Insert before transparency section or </main>
      const insertPoint = html.indexOf('<section class="transparency">');
      if (insertPoint !== -1) {
        html = html.slice(0, insertPoint) + relatedHtml + html.slice(insertPoint);
      } else {
        const sourcesSection = html.indexOf('<section class="sources-references-section"');
        if (sourcesSection !== -1) {
          html = html.slice(0, sourcesSection) + relatedHtml + html.slice(sourcesSection);
        } else {
          const mainClose = html.lastIndexOf('</main>');
          if (mainClose !== -1) {
            html = html.slice(0, mainClose) + relatedHtml + html.slice(mainClose);
          }
        }
      }

      writeFile(guidePath, html);
      totalLinksAdded += linksToAdd.length;
      pagesModified++;
    }
  }

  // Handle non-breed-specific guides (best-*, general advice)
  // These should at minimum link to the guides hub and relevant species pages
  const handledGuides = new Set();
  for (const entity of entities) {
    const slug = entity.slug;
    const displayName = entity.display_name.toLowerCase().replace(/\s+/g, '-');
    guideFiles.filter(g => g.includes(slug) || g.includes(displayName)).forEach(g => handledGuides.add(g));
  }

  const unhandledGuides = guideFiles.filter(g => !handledGuides.has(g));
  console.log(`  Breed-linked guide pages modified: ${pagesModified}`);
  console.log(`  Non-breed-specific guides remaining: ${unhandledGuides.length}`);

  // For non-breed-specific guides, add links to relevant species hubs
  let nonBreedModified = 0;
  for (const guideName of unhandledGuides) {
    const guidePath = `guides/${guideName}.html`;
    if (!fs.existsSync(path.join(ROOT, guidePath))) continue;

    let html = readFile(guidePath);

    // Determine which species this guide might relate to
    const relatedSpecies = [];
    if (guideName.includes('dog') || guideName.includes('puppy') || guideName.includes('canine')) relatedSpecies.push('dogs');
    if (guideName.includes('cat') || guideName.includes('kitten') || guideName.includes('feline')) relatedSpecies.push('cats');
    if (guideName.includes('bird') || guideName.includes('parrot') || guideName.includes('avian')) relatedSpecies.push('birds');
    if (guideName.includes('fish') || guideName.includes('aquarium') || guideName.includes('aquatic')) relatedSpecies.push('fish');
    if (guideName.includes('reptile') || guideName.includes('lizard') || guideName.includes('snake') || guideName.includes('gecko') || guideName.includes('turtle') || guideName.includes('tortoise')) relatedSpecies.push('reptiles');
    if (guideName.includes('frog') || guideName.includes('salamander') || guideName.includes('newt') || guideName.includes('axolotl')) relatedSpecies.push('amphibians');
    if (guideName.includes('hamster') || guideName.includes('rabbit') || guideName.includes('guinea') || guideName.includes('ferret') || guideName.includes('hedgehog')) relatedSpecies.push('small-animals');
    if (guideName.includes('marine') || guideName.includes('reef') || guideName.includes('saltwater') || guideName.includes('coral')) relatedSpecies.push('marine-fish');

    // If no species detected, link to general hubs
    if (relatedSpecies.length === 0) {
      // Pet-general guide — link to most popular species
      relatedSpecies.push('dogs', 'cats');
    }

    // Check if already has internal hub links
    const hasHubLinks = relatedSpecies.some(s => html.includes(`href="/${s}"`));
    if (hasHubLinks) continue;

    // Build species hub links
    const hubLinks = relatedSpecies.slice(0, 4).map(s =>
      `<a href="/${s}" class="guide-card"><h3>${speciesDisplayNames[s]} Hub</h3><p>Browse all ${speciesDisplayNames[s].toLowerCase()} breeds, guides, and resources.</p></a>`
    );

    // Add the guides main page link
    if (!html.includes('href="/guides"') || hubLinks.length > 0) {
      const sectionHtml = `\n    <section class="related-guides-section" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
      <h2>Browse by Species</h2>
      <div class="guide-grid">
        ${hubLinks.join('\n        ')}
      </div>
    </section>\n`;

      const insertPoint = html.indexOf('<section class="transparency">');
      if (insertPoint !== -1) {
        html = html.slice(0, insertPoint) + sectionHtml + html.slice(insertPoint);
      } else {
        const sourcesSection = html.indexOf('<section class="sources-references-section"');
        if (sourcesSection !== -1) {
          html = html.slice(0, sourcesSection) + sectionHtml + html.slice(sourcesSection);
        } else {
          const mainClose = html.lastIndexOf('</main>');
          if (mainClose !== -1) {
            html = html.slice(0, mainClose) + sectionHtml + html.slice(mainClose);
          }
        }
      }

      writeFile(guidePath, html);
      totalLinksAdded += hubLinks.length;
      nonBreedModified++;
    }
  }

  console.log(`  Non-breed-specific guide pages modified: ${nonBreedModified}`);
  console.log(`  Total links added across all guides: ${totalLinksAdded}`);
  return totalLinksAdded;
}

// ============================================================
// FIX 5: SPECIES HUBS → LINK TO ORPHANED GUIDE CATEGORIES
// ============================================================

function fixSpeciesHubGuideLinks() {
  console.log('\n=== FIX 5: SPECIES HUBS → LINK TO GUIDE CATEGORIES ===');
  const guideFiles = listHtml('guides');
  let totalAdded = 0;

  // For each species hub, find guide categories and add aggregate links
  const speciesHubFiles = {
    dogs: 'dogs.html',
    cats: 'cats.html',
    birds: 'birds.html',
    fish: 'fish.html',
    reptiles: 'reptiles.html',
    amphibians: 'amphibians.html',
    'small-animals': 'small-animals.html',
    'marine-fish': 'marine-fish.html',
  };

  const guideCategories = [
    { pattern: 'apartment-living', title: 'Apartment Living Guides', desc: 'Which breeds thrive in apartments? Find the perfect pet for small spaces.' },
    { pattern: 'with-kids', title: 'Best Breeds for Families with Kids', desc: 'Kid-friendly breeds with gentle temperaments and playful personalities.' },
    { pattern: 'shedding-guide', title: 'Shedding Guides', desc: 'Understand shedding levels and grooming needs before choosing a breed.' },
    { pattern: 'lifespan', title: 'Lifespan Guides', desc: 'Average lifespan, health factors, and how to help your pet live longer.' },
    { pattern: 'grooming-guide', title: 'Grooming Guides', desc: 'Breed-specific grooming needs, tools, and professional care tips.' },
    { pattern: 'temperament', title: 'Temperament Profiles', desc: 'Personality traits, behavior patterns, and what to expect from each breed.' },
    { pattern: 'adopt-a', title: 'Adoption Guides', desc: 'How to find, adopt, and welcome a new pet into your home.' },
    { pattern: 'cost-of-ownership', title: 'Cost of Ownership Guides', desc: 'Full breakdown of annual costs including food, vet care, and supplies.' },
    { pattern: 'exercise-guide', title: 'Exercise Guides', desc: 'Activity levels, exercise needs, and fitness recommendations by breed.' },
    { pattern: 'pet-insurance', title: 'Pet Insurance Guides', desc: 'Which insurance plans best cover breed-specific health conditions.' },
  ];

  for (const [species, fileName] of Object.entries(speciesHubFiles)) {
    const fullPath = path.join(ROOT, fileName);
    if (!fs.existsSync(fullPath)) continue;

    let html = readFile(fileName);

    // Find guide categories that have pages for this species
    const speciesEntities = entities.filter(e => e.species_group === species);
    const availableCategories = [];

    for (const cat of guideCategories) {
      const hasGuides = speciesEntities.some(e => {
        const slug = e.slug;
        const displaySlug = e.display_name.toLowerCase().replace(/\s+/g, '-');
        return guideFiles.includes(`${slug}-${cat.pattern}`) ||
               guideFiles.includes(`${displaySlug}-${cat.pattern}`) ||
               guideFiles.includes(`${cat.pattern.replace('-guide', '')}-${slug}`) ||
               (cat.pattern === 'adopt-a' && guideFiles.includes(`adopt-a-${slug}`)) ||
               (cat.pattern === 'adopt-a' && guideFiles.includes(`adopt-a-${displaySlug}`));
      });
      if (hasGuides) {
        availableCategories.push(cat);
      }
    }

    if (availableCategories.length === 0) continue;

    // Check which categories are already linked
    const newCategories = availableCategories.filter(cat => {
      // Check if any guide matching this category is already linked
      return !speciesEntities.some(e => {
        const slug = e.slug;
        return html.includes(`/guides/${slug}-${cat.pattern}`) ||
               html.includes(`/guides/adopt-a-${slug}`);
      });
    });

    if (newCategories.length === 0) continue;

    // Find 2 example guide links per category to add
    let guideCategoryHtml = `\n    <section style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #E2E8F0;">
      <h2>${speciesDisplayNames[species]} Care Guides</h2>
      <p>Browse expert guides covering every aspect of ${speciesDisplayNames[species].toLowerCase()} ownership and care.</p>
      <div class="guide-grid">\n`;

    for (const cat of newCategories.slice(0, 8)) {
      // Find first 3 actual guides for this category
      const exampleGuides = [];
      for (const e of speciesEntities) {
        const slug = e.slug;
        const displaySlug = e.display_name.toLowerCase().replace(/\s+/g, '-');
        let guideName = null;
        if (guideFiles.includes(`${slug}-${cat.pattern}`)) guideName = `${slug}-${cat.pattern}`;
        else if (guideFiles.includes(`${displaySlug}-${cat.pattern}`)) guideName = `${displaySlug}-${cat.pattern}`;
        else if (cat.pattern === 'adopt-a' && guideFiles.includes(`adopt-a-${slug}`)) guideName = `adopt-a-${slug}`;
        else if (cat.pattern === 'adopt-a' && guideFiles.includes(`adopt-a-${displaySlug}`)) guideName = `adopt-a-${displaySlug}`;

        if (guideName) {
          exampleGuides.push({ name: guideName, entity: e });
          if (exampleGuides.length >= 3) break;
        }
      }

      for (const eg of exampleGuides) {
        guideCategoryHtml += `        <a href="/guides/${eg.name}" class="guide-card">
          <h3>${guideSlugToTitle(eg.name)}</h3>
          <p>${cat.desc}</p>
        </a>\n`;
        totalAdded++;
      }
    }

    guideCategoryHtml += `      </div>
    </section>\n`;

    // Insert before </main>
    const mainClose = html.lastIndexOf('</main>');
    if (mainClose !== -1) {
      html = html.slice(0, mainClose) + guideCategoryHtml + html.slice(mainClose);
    }

    writeFile(fileName, html);
  }

  console.log(`  Added ${totalAdded} guide links to species hub pages`);
  return totalAdded;
}

// ============================================================
// FIX 6: DIFFERENTIATE COMMERCIAL FAQ CONTENT
// ============================================================

function fixCommercialFAQs() {
  console.log('\n=== FIX 6: DIFFERENTIATE COMMERCIAL PAGE FAQs ===');
  let pagesModified = 0;

  const commercialTypes = [
    'best-food', 'best-insurance', 'cost-to-own', 'health-costs',
    'first-time-owners', 'best-enrichment', 'best-habitat-size'
  ];

  // Species-specific FAQ differentiators
  const speciesFaqDiffs = {
    dogs: {
      'best-food': 'Dogs need a balanced diet of protein, fats, and carbohydrates. Larger breeds benefit from large-breed formulas with joint support, while small breeds need calorie-dense kibble in smaller pieces.',
      'best-insurance': 'Dog insurance should cover breed-specific conditions like hip dysplasia, ACL tears, and cancer. Look for plans with no per-incident limits and short waiting periods.',
      'cost-to-own': 'Annual dog ownership costs vary from $1,500 for small breeds to $3,000+ for large breeds, including food, vet care, grooming, training, and supplies.',
      'health-costs': 'Dog veterinary costs average $700-$2,000 annually for routine care, with emergency visits potentially exceeding $5,000 for surgeries or hospitalization.',
      'first-time-owners': 'First-time dog owners should prioritize socialization, consistent training, and establishing a routine. Puppy-proofing your home and finding a trusted veterinarian are essential first steps.',
      'best-enrichment': 'Dogs thrive with puzzle feeders, interactive toys, agility equipment, and scent work activities that challenge their minds and bodies.',
      'best-habitat-size': 'Dogs need adequate indoor space for rest and play, with larger breeds requiring at least a medium-sized yard or regular access to parks for exercise.',
    },
    cats: {
      'best-food': 'Cats are obligate carnivores requiring high-protein diets with taurine and minimal carbohydrates. Wet food helps maintain hydration, which is critical for urinary tract health.',
      'best-insurance': 'Cat insurance should cover dental disease, kidney issues, hyperthyroidism, and cancer — the most common feline health concerns. Indoor cats may qualify for lower premiums.',
      'cost-to-own': 'Annual cat ownership costs range from $1,000 to $2,000, including food, litter, veterinary care, and enrichment. Indoor cats tend to have lower vet costs but need more enrichment investment.',
      'health-costs': 'Cat veterinary costs average $500-$1,500 annually for routine care. Dental cleanings, senior bloodwork, and chronic condition management can add $500-$2,000 per year.',
      'first-time-owners': 'First-time cat owners should prepare with litter box training, scratching posts, and vertical space. Understanding feline body language helps build a strong bond.',
      'best-enrichment': 'Cats need vertical climbing spaces, window perches, interactive wand toys, and hunting-simulation feeders to satisfy their predatory instincts.',
      'best-habitat-size': 'Cats thrive in multi-level environments with at least one room per cat plus communal spaces. Vertical territory (cat trees, shelves) is more important than floor space.',
    },
    birds: {
      'best-food': 'Pet birds need species-specific diets combining pellets, fresh fruits, vegetables, and limited seeds. Avoid avocado, chocolate, and caffeine which are toxic to birds.',
      'best-insurance': 'Avian insurance is specialized — look for plans covering egg binding, respiratory infections, and feather disorders. Fewer providers cover birds, so compare coverage carefully.',
      'cost-to-own': 'Annual bird ownership costs range from $300 for finches to $2,000+ for large parrots, including specialized food, cage maintenance, and avian vet visits.',
      'health-costs': 'Avian veterinary costs average $200-$800 annually. Finding a board-certified avian vet is essential, as general practitioners may lack bird-specific expertise.',
      'first-time-owners': 'First-time bird owners should research species-specific needs carefully. Birds require daily interaction, mental stimulation, and a quiet sleeping environment with 10-12 hours of darkness.',
      'best-enrichment': 'Birds need foraging toys, shreddable materials, swings, mirrors, and regular out-of-cage time. Rotate toys weekly to prevent boredom.',
      'best-habitat-size': 'Bird cages should be wide enough for full wingspan extension. As a minimum, the cage should be 2-3 times the bird\'s wingspan in width and depth.',
    },
    fish: {
      'best-food': 'Freshwater fish diets should match their natural feeding behavior — herbivores need algae-based foods, carnivores need protein-rich pellets, and omnivores need variety.',
      'best-insurance': 'Fish-specific insurance is rare. Instead, invest in quality equipment, backup power supplies, and water testing kits to prevent costly tank crashes.',
      'cost-to-own': 'Annual freshwater fish costs range from $200 for basic setups to $1,500+ for large planted tanks, including electricity, water treatments, food, and equipment replacement.',
      'health-costs': 'Fish health management focuses on water quality and disease prevention. Budget $100-$400 annually for medications, test kits, and water treatment supplies.',
      'first-time-owners': 'First-time fishkeepers should cycle their tank before adding fish, start with hardy species, and invest in a reliable water testing kit.',
      'best-enrichment': 'Fish benefit from live plants, varied terrain, caves and hiding spots, and appropriate tank mates that encourage natural behaviors.',
      'best-habitat-size': 'Tank size depends on species — research adult size, activity level, and schooling requirements. The "one inch per gallon" rule is outdated; use species-specific guidelines.',
    },
    'marine-fish': {
      'best-food': 'Marine fish require specialized diets including marine-specific pellets, frozen mysis shrimp, and live foods. Reef fish often need supplemental algae and vitamin-enriched preparations.',
      'best-insurance': 'Marine aquarium insurance typically covers equipment failure. Focus on investing in quality protein skimmers, backup heaters, and an uninterruptible power supply.',
      'cost-to-own': 'Annual marine fish costs range from $500 to $3,000+, including salt mix, RO/DI water, specialized food, coral supplements, and electricity for equipment.',
      'health-costs': 'Marine fish health management costs $200-$800 annually for quarantine equipment, medications, and water chemistry supplies. Prevention through proper quarantine is essential.',
      'first-time-owners': 'First-time marine fishkeepers should start with a FOWLR (Fish Only With Live Rock) setup, choose hardy species, and master water chemistry before attempting a reef tank.',
      'best-enrichment': 'Marine fish thrive with live rock structures, natural coral (for reef tanks), varied flow patterns, and species-appropriate tank mates.',
      'best-habitat-size': 'Marine tanks should be at least 30 gallons for beginners. Larger water volume provides greater stability in temperature and chemistry.',
    },
    reptiles: {
      'best-food': 'Reptile diets vary dramatically by species — herbivores need calcium-dusted greens, insectivores need gut-loaded crickets, and carnivores need whole prey items.',
      'best-insurance': 'Exotic pet insurance for reptiles should cover metabolic bone disease, respiratory infections, and parasites. Verify the plan covers reptile-specific conditions.',
      'cost-to-own': 'Annual reptile ownership costs range from $300 for small geckos to $1,500+ for large species, including specialized lighting, heating, substrate, and veterinary care.',
      'health-costs': 'Reptile veterinary costs average $200-$600 annually. Finding a reptile-experienced vet is critical, as reptile medicine is a specialized field.',
      'first-time-owners': 'First-time reptile owners should master temperature gradients, humidity control, and UVB lighting requirements before bringing their pet home.',
      'best-enrichment': 'Reptiles benefit from naturalistic enclosures with climbing branches, hide boxes at multiple temperatures, and varied substrate for burrowing species.',
      'best-habitat-size': 'Reptile enclosures should provide a proper thermal gradient. As a minimum, the enclosure length should be 1.5-2 times the animal\'s total length.',
    },
    amphibians: {
      'best-food': 'Amphibian diets focus on live insects dusted with calcium and vitamin D3. Aquatic species may also eat bloodworms, brine shrimp, and commercial amphibian pellets.',
      'best-insurance': 'Amphibian-specific insurance is limited. Focus on preventive care: clean water, proper temperatures, and quarantine protocols to avoid costly health issues.',
      'cost-to-own': 'Annual amphibian ownership costs range from $150 to $600, including live food cultures, water conditioning supplies, and specialized lighting and heating.',
      'health-costs': 'Amphibian veterinary costs average $150-$400 annually. Chytrid fungus prevention and water quality management are the most important health investments.',
      'first-time-owners': 'First-time amphibian owners must prioritize water quality, avoid handling with bare hands (skin oils are harmful), and maintain stable temperatures and humidity.',
      'best-enrichment': 'Amphibians benefit from live plants, varied terrain with land and water areas, hiding spots, and appropriate substrate for burrowing or climbing.',
      'best-habitat-size': 'Amphibian enclosures should replicate their natural habitat. Terrestrial species need floor space; arboreal species need height; aquatic species need water volume.',
    },
    'small-animals': {
      'best-food': 'Small animal diets vary by species — rabbits and guinea pigs need unlimited hay, hamsters need seed and pellet mixes, and ferrets require high-protein diets.',
      'best-insurance': 'Small animal insurance should cover dental issues (common in rabbits), tumors (common in rats), and GI stasis. Compare exotic pet plans from multiple providers.',
      'cost-to-own': 'Annual small animal costs range from $300 for hamsters to $1,200+ for rabbits, including bedding, food, veterinary care, and enclosure maintenance.',
      'health-costs': 'Small animal veterinary costs average $200-$600 annually. Dental issues in rabbits and respiratory problems in rats are the most common expensive conditions.',
      'first-time-owners': 'First-time small animal owners should research species-specific social needs — some species require companions, while others are solitary.',
      'best-enrichment': 'Small animals need species-appropriate enrichment: tunnels and wheels for hamsters, digging boxes for rabbits, climbing structures for rats, and foraging opportunities for all.',
      'best-habitat-size': 'Small animal enclosures should be as large as possible. The minimum sizes often listed are truly minimum — larger spaces always benefit health and behavior.',
    },
  };

  for (const species of speciesGroups) {
    const speciesDir = `commercial/${species}`;
    const speciesPath = path.join(ROOT, speciesDir);
    if (!fs.existsSync(speciesPath)) continue;

    const breedDirs = fs.readdirSync(speciesPath).filter(d =>
      fs.statSync(path.join(speciesPath, d)).isDirectory()
    );

    const diffs = speciesFaqDiffs[species];
    if (!diffs) continue;

    for (const breed of breedDirs) {
      const entity = entityMap.get(`${species}/${breed}`);
      if (!entity) continue;

      for (const ct of commercialTypes) {
        const filePath = `commercial/${species}/${breed}/${ct}.html`;
        const fullFilePath = path.join(ROOT, filePath);
        if (!fs.existsSync(fullFilePath)) continue;

        let html = readFile(filePath);
        const diffText = diffs[ct];
        if (!diffText) continue;

        // Find the generic FAQ answer and make it breed-specific
        // Look for the FAQ schema's generic answer
        const faqSectionIndex = html.indexOf('<h2>Frequently Asked Questions</h2>');
        if (faqSectionIndex === -1) continue;

        // Check if we already added differentiated content
        if (html.includes('<!-- faq-differentiated -->')) continue;

        // Add a breed-specific FAQ intro paragraph right after the FAQ heading
        const breedSpecificFaq = `<h2>Frequently Asked Questions</h2>
      <!-- faq-differentiated -->
      <p><strong>About ${entity.display_name}:</strong> ${diffText}</p>`;

        html = html.replace('<h2>Frequently Asked Questions</h2>', breedSpecificFaq);

        writeFile(filePath, html);
        pagesModified++;
      }
    }
  }

  console.log(`  Differentiated FAQs on ${pagesModified} commercial pages`);
  return pagesModified;
}

// ============================================================
// FIX 7: EXPAND THIN BREED INDEX PAGES
// ============================================================

function fixThinBreedIndexPages() {
  console.log('\n=== FIX 7: EXPAND THIN BREED INDEX PAGES ===');
  let pagesFixed = 0;

  const thinPages = [
    {
      file: 'breeds/amphibian-breeds.html',
      species: 'amphibians',
      name: 'Amphibians',
      intro: `<p>Amphibians make fascinating pets that bridge the gap between aquatic and terrestrial worlds. From the vibrant colors of poison dart frogs (safely captive-bred) to the endearing smile of axolotls, these creatures offer a unique window into one of nature's most diverse animal groups. Whether you're drawn to the low-maintenance care of tree frogs or the interactive nature of fire-bellied toads, our breed directory covers everything you need to know.</p>

      <h2>Choosing the Right Amphibian</h2>
      <p>When selecting an amphibian pet, consider these key factors:</p>
      <ul>
        <li><strong>Habitat type:</strong> Some amphibians are fully aquatic (like axolotls), some are terrestrial (like toads), and others need both land and water (like fire-bellied newts)</li>
        <li><strong>Humidity requirements:</strong> Most amphibians need 60-80% humidity, which means investing in misting systems or manual spraying schedules</li>
        <li><strong>Temperature sensitivity:</strong> Amphibians are ectothermic and highly sensitive to temperature fluctuations — consistency is critical</li>
        <li><strong>Handling tolerance:</strong> Most amphibians should be handled minimally, as oils and chemicals on human skin can be harmful to their permeable skin</li>
        <li><strong>Diet:</strong> Most pet amphibians eat live insects (crickets, fruit flies, worms) dusted with calcium and vitamin supplements</li>
        <li><strong>Lifespan:</strong> Pet amphibians can live 5-20+ years depending on species, so plan for a long-term commitment</li>
      </ul>

      <h2>Popular Amphibian Species for Beginners</h2>
      <p>If you're new to amphibian keeping, these species are well-suited for beginners: White's Tree Frog (docile and hardy), Pacman Frog (easy to feed and house), Fire-Bellied Toad (colorful and active), and the Axolotl (fully aquatic and endlessly fascinating). Each species in our directory below includes detailed care requirements, health information, and habitat setup guides.</p>`
    },
    {
      file: 'breeds/marine-fish-breeds.html',
      species: 'marine-fish',
      name: 'Marine Fish',
      intro: `<p>Marine fishkeeping is one of the most rewarding aquarium hobbies, offering access to some of the most spectacularly colored creatures on Earth. From the iconic Clownfish to the majestic Angelfish, saltwater aquariums bring a piece of the ocean into your home. Our marine fish directory provides detailed profiles for each species, covering compatibility, diet, tank requirements, and health considerations.</p>

      <h2>Getting Started with Marine Fish</h2>
      <p>Marine aquariums require more careful planning than freshwater setups. Here's what to consider:</p>
      <ul>
        <li><strong>Tank size:</strong> Start with at least 30 gallons for a fish-only system; 50+ gallons for a reef tank. Larger volumes are more stable and forgiving of mistakes</li>
        <li><strong>Water chemistry:</strong> Maintain salinity (1.023-1.025 SG), pH (8.1-8.4), and temperature (76-82°F). Invest in a reliable refractometer and test kit</li>
        <li><strong>Filtration:</strong> Live rock provides biological filtration, while protein skimmers remove organic waste before it breaks down. Both are essential for marine systems</li>
        <li><strong>Cycling:</strong> Cycle your tank for 4-6 weeks before adding fish. Use live rock and a bacterial starter to establish the nitrogen cycle</li>
        <li><strong>Compatibility:</strong> Research species compatibility carefully — many marine fish are territorial or aggressive toward similar-looking species</li>
        <li><strong>Quarantine:</strong> Always quarantine new fish for 2-4 weeks before adding them to your display tank to prevent disease introduction</li>
      </ul>

      <h2>Recommended Marine Fish for Beginners</h2>
      <p>Hardy species for new marine fishkeepers include Clownfish (captive-bred are ideal), Royal Gramma, Firefish Goby, and Pajama Cardinals. These species tolerate minor water quality fluctuations and adapt well to aquarium life. Browse our complete directory below for detailed profiles on all marine fish species.</p>`
    },
  ];

  for (const page of thinPages) {
    const fullPath = path.join(ROOT, page.file);
    if (!fs.existsSync(fullPath)) continue;

    let html = readFile(page.file);

    // Find the first <h2> in the main content area and insert intro before it
    const mainContent = html.indexOf('<main');
    if (mainContent === -1) continue;

    const firstH2 = html.indexOf('<h2>', mainContent);
    if (firstH2 === -1) continue;

    // Check if intro was already added
    if (html.includes('Choosing the Right Amphibian') || html.includes('Getting Started with Marine Fish')) continue;

    html = html.slice(0, firstH2) + page.intro + '\n\n      ' + html.slice(firstH2);

    writeFile(page.file, html);
    pagesFixed++;
    console.log(`  Expanded ${page.file}`);
  }

  console.log(`  Expanded ${pagesFixed} thin breed index pages`);
  return pagesFixed;
}

// ============================================================
// FIX 8: TOOLS INDEX CANONICAL FIX
// ============================================================

function fixToolsIndexCanonical() {
  console.log('\n=== FIX 8: TOOLS INDEX CANONICAL FIX ===');
  const toolsIndexPath = 'tools/index.html';
  if (!fs.existsSync(path.join(ROOT, toolsIndexPath))) return 0;

  let html = readFile(toolsIndexPath);
  let fixes = 0;

  if (html.includes('href="https://petcarehelperai.com/tools/"')) {
    html = html.replace(
      /href="https:\/\/petcarehelperai\.com\/tools\/"/g,
      'href="https://petcarehelperai.com/tools"'
    );
    fixes++;
  }
  if (html.includes('content="https://petcarehelperai.com/tools/"')) {
    html = html.replace(
      /content="https:\/\/petcarehelperai\.com\/tools\/"/g,
      'content="https://petcarehelperai.com/tools"'
    );
    fixes++;
  }

  if (fixes > 0) {
    writeFile(toolsIndexPath, html);
    console.log(`  Fixed ${fixes} canonical/OG URL references in tools/index.html`);
  }

  return fixes;
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  console.log('============================================');
  console.log('PetCareHelperAI — Indexing Fix Engine');
  console.log('============================================');
  console.log(`Date: ${TODAY}`);
  console.log(`Root: ${ROOT}`);
  console.log(`Entities loaded: ${entities.length}`);

  const results = {};

  results.sitemapFixes = fixSitemap();
  results.locationFixes = fixLocationIndex();
  results.breedGuideLinks = fixBreedPageGuideLinks();
  results.guideBackLinks = fixGuidePageBackLinks();
  results.hubGuideLinks = fixSpeciesHubGuideLinks();
  results.faqDiffs = fixCommercialFAQs();
  results.thinPageFixes = fixThinBreedIndexPages();
  results.toolsCanonical = fixToolsIndexCanonical();

  console.log('\n============================================');
  console.log('SUMMARY');
  console.log('============================================');
  console.log(`Sitemap trailing-slash fixes: ${results.sitemapFixes}`);
  console.log(`Location index links added: ${results.locationFixes}`);
  console.log(`Breed→Guide links added: ${results.breedGuideLinks}`);
  console.log(`Guide backlinks added: ${results.guideBackLinks}`);
  console.log(`Species hub→Guide links added: ${results.hubGuideLinks}`);
  console.log(`Commercial FAQ differentiations: ${results.faqDiffs}`);
  console.log(`Thin breed index pages expanded: ${results.thinPageFixes}`);
  console.log(`Tools canonical fixes: ${results.toolsCanonical}`);
  console.log('============================================');
}

main().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
