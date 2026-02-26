/**
 * PetCareHelperAI — Indexing Fix Engine Phase 2
 *
 * Handles:
 * 1. Add ALL unlinked guides to guides.html hub (categorized sections)
 * 2. Differentiate commercial FAQ JSON-LD schema per breed
 * 3. Fix any remaining orphaned non-breed guides with species hub links
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('.');
const DOMAIN = 'https://petcarehelperai.com';

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
// FIX A: ADD ALL UNLINKED GUIDES TO GUIDES HUB
// ============================================================

function fixGuidesHub() {
  console.log('\n=== FIX A: GUIDES HUB — LINK ALL GUIDES ===');
  let html = readFile('guides.html');

  const allGuides = listHtml('guides');

  // Find all guides currently linked from the hub
  const linkedGuides = new Set();
  const hrefPattern = /href="\/guides\/([^"]+)"/g;
  let match;
  while ((match = hrefPattern.exec(html)) !== null) {
    linkedGuides.add(match[1]);
  }

  const unlinkedGuides = allGuides.filter(g => !linkedGuides.has(g));
  console.log(`  Total guides: ${allGuides.length}`);
  console.log(`  Currently linked from hub: ${linkedGuides.size}`);
  console.log(`  Unlinked guides: ${unlinkedGuides.length}`);

  if (unlinkedGuides.length === 0) {
    console.log('  All guides already linked — skipping.');
    return 0;
  }

  // Categorize unlinked guides
  const categories = {
    'Breed Adoption Guides': [],
    'Breed Temperament Profiles': [],
    'Breed Health Issues': [],
    'Breed Grooming Guides': [],
    'Breed Apartment Living Guides': [],
    'Family & Kids Compatibility': [],
    'Shedding Guides': [],
    'Lifespan Guides': [],
    'Puppy & Growth Guides': [],
    'Indoor Living Guides': [],
    'Cost of Ownership Guides': [],
    'Exercise Guides': [],
    'Pet Insurance Guides': [],
    'Breed Comparison Guides': [],
    'Best Product Guides': [],
    'Health & Wellness Guides': [],
    'Species Care Guides': [],
    'General Pet Care': [],
  };

  for (const g of unlinkedGuides) {
    if (g.startsWith('adopt-a-')) categories['Breed Adoption Guides'].push(g);
    else if (g.endsWith('-temperament')) categories['Breed Temperament Profiles'].push(g);
    else if (g.endsWith('-health-issues')) categories['Breed Health Issues'].push(g);
    else if (g.endsWith('-grooming-guide')) categories['Breed Grooming Guides'].push(g);
    else if (g.endsWith('-apartment-living')) categories['Breed Apartment Living Guides'].push(g);
    else if (g.endsWith('-with-kids')) categories['Family & Kids Compatibility'].push(g);
    else if (g.endsWith('-shedding-guide')) categories['Breed Shedding Guides'] ? categories['Breed Shedding Guides'].push(g) : (categories['Shedding Guides'].push(g));
    else if (g.includes('-lifespan')) categories['Lifespan Guides'].push(g);
    else if (g.endsWith('-puppy-guide') || g.startsWith('how-big-do-')) categories['Puppy & Growth Guides'].push(g);
    else if (g.endsWith('-indoor-guide')) categories['Indoor Living Guides'].push(g);
    else if (g.endsWith('-cost-of-ownership')) categories['Cost of Ownership Guides'].push(g);
    else if (g.endsWith('-exercise-guide')) categories['Exercise Guides'].push(g);
    else if (g.endsWith('-pet-insurance')) categories['Pet Insurance Guides'].push(g);
    else if (g.includes('-vs-') || g.startsWith('compare-')) categories['Breed Comparison Guides'].push(g);
    else if (g.startsWith('best-')) categories['Best Product Guides'].push(g);
    else if (g.includes('-health') || g.includes('-disease') || g.includes('-poisoning') || g.includes('-uti') || g.includes('-cancer') || g.includes('-diabetes') || g.includes('-epilepsy') || g.includes('-allergy') || g.includes('vaccination') || g.includes('emergency')) categories['Health & Wellness Guides'].push(g);
    else if (g.includes('-care-guide') || g.includes('keeping') || g.includes('setup') || g.includes('tank') || g.includes('aquarium') || g.includes('terrarium')) categories['Species Care Guides'].push(g);
    else categories['General Pet Care'].push(g);
  }

  // Build HTML for each non-empty category
  let sectionsHtml = '\n    <!-- comprehensive-guide-directory -->\n';

  for (const [catName, guides] of Object.entries(categories)) {
    if (guides.length === 0) continue;

    guides.sort();

    sectionsHtml += `    <section class="content-section">
      <h2>${catName}</h2>
      <div class="guide-grid">\n`;

    for (const g of guides) {
      const title = slugToTitle(g);
      sectionsHtml += `        <a href="/guides/${g}" class="guide-card"><h3>${title}</h3><p>Expert pet care guide and recommendations.</p></a>\n`;
    }

    sectionsHtml += `      </div>
    </section>\n\n`;
  }

  // Insert before </main>
  const mainClose = html.lastIndexOf('</main>');
  if (mainClose !== -1) {
    html = html.slice(0, mainClose) + sectionsHtml + html.slice(mainClose);
  }

  writeFile('guides.html', html);
  console.log(`  Added ${unlinkedGuides.length} guide links across ${Object.entries(categories).filter(([,v]) => v.length > 0).length} categories`);
  return unlinkedGuides.length;
}

// ============================================================
// FIX B: DIFFERENTIATE COMMERCIAL FAQ JSON-LD SCHEMAS
// ============================================================

function fixCommercialFAQSchema() {
  console.log('\n=== FIX B: DIFFERENTIATE COMMERCIAL FAQ SCHEMAS ===');
  const entities = JSON.parse(readFile('data/entities.json'));
  let pagesModified = 0;

  const speciesGroups = ['dogs', 'cats', 'birds', 'fish', 'marine-fish', 'reptiles', 'amphibians', 'small-animals'];

  // Breed-size-based food FAQ differentiators
  const sizeClassifiers = {
    dogs: (name) => {
      const large = ['Great Dane', 'Mastiff', 'Newfoundland', 'Saint Bernard', 'Bernese', 'Rottweiler', 'German Shepherd', 'Labrador', 'Golden Retriever', 'Akita', 'Malamute', 'Husky', 'Cane Corso', 'Doberman', 'Bullmastiff', 'Leonberger', 'Great Pyrenees', 'Irish Wolfhound', 'Greyhound', 'Rhodesian'];
      const small = ['Chihuahua', 'Yorkie', 'Yorkshire', 'Maltese', 'Pomeranian', 'Papillon', 'Toy', 'Miniature', 'Dachshund', 'Shih Tzu', 'Pekingese', 'Havanese', 'Bichon', 'Affenpinscher', 'Brussels Griffon'];
      for (const l of large) if (name.includes(l)) return 'large';
      for (const s of small) if (name.includes(s)) return 'small';
      return 'medium';
    }
  };

  for (const species of speciesGroups) {
    const speciesDir = `commercial/${species}`;
    const speciesPath = path.join(ROOT, speciesDir);
    if (!fs.existsSync(speciesPath)) continue;

    const breedDirs = fs.readdirSync(speciesPath).filter(d =>
      fs.statSync(path.join(speciesPath, d)).isDirectory()
    );

    for (const breed of breedDirs) {
      const entity = entities.find(e => e.species_group === species && e.slug === breed);
      if (!entity) continue;

      const displayName = entity.display_name;
      const breedDir = `commercial/${species}/${breed}`;
      const breedPath = path.join(ROOT, breedDir);

      const files = fs.readdirSync(breedPath).filter(f => f.endsWith('.html'));

      for (const file of files) {
        const filePath = `${breedDir}/${file}`;
        let html = readFile(filePath);

        // Only modify FAQPage JSON-LD
        const faqSchemaMatch = html.match(/"@type"\s*:\s*"FAQPage"/);
        if (!faqSchemaMatch) continue;

        // Find the FAQPage JSON-LD block
        const faqStart = html.lastIndexOf('<script type="application/ld+json">', html.indexOf('"FAQPage"'));
        const faqEnd = html.indexOf('</script>', html.indexOf('"FAQPage"'));
        if (faqStart === -1 || faqEnd === -1) continue;

        const faqBlock = html.slice(faqStart + '<script type="application/ld+json">'.length, faqEnd).trim();

        try {
          const faqData = JSON.parse(faqBlock);
          if (!faqData.mainEntity || !Array.isArray(faqData.mainEntity)) continue;

          let modified = false;

          // Customize generic answers with breed-specific details
          for (const q of faqData.mainEntity) {
            const answer = q.acceptedAnswer?.text || '';

            // Replace generic "this species" or "this breed" with actual name
            if (answer.includes('this species') || answer.includes('this breed')) {
              q.acceptedAnswer.text = answer
                .replace(/this species/g, displayName)
                .replace(/this breed/g, displayName);
              modified = true;
            }

            // Add breed name to generic feeding answers
            if (answer.includes('Feeding frequency depends on age') && !answer.includes(displayName)) {
              q.acceptedAnswer.text = `For ${displayName}: ${answer}`;
              modified = true;
            }

            // Add breed name to generic food quality answers
            if (answer.includes('species-appropriate nutrition') && !answer.includes(displayName)) {
              const sizeClass = species === 'dogs' ? sizeClassifiers.dogs(displayName) : null;
              const sizeNote = sizeClass ? ` As a ${sizeClass}-sized breed, ${displayName} has specific nutritional requirements for their body type.` : '';
              q.acceptedAnswer.text = answer.replace(
                'species-appropriate nutrition',
                `nutrition formulated for ${displayName}`
              ) + sizeNote;
              modified = true;
            }

            // Make cost ranges breed-specific
            if (answer.includes('$20-$150') && !answer.includes(displayName)) {
              q.acceptedAnswer.text = `For ${displayName}, ${answer.charAt(0).toLowerCase() + answer.slice(1)}`;
              modified = true;
            }
          }

          if (modified) {
            const newFaqJson = JSON.stringify(faqData);
            const newBlock = `<script type="application/ld+json">\n  ${newFaqJson}\n  </script>`;
            html = html.slice(0, faqStart) + newBlock + html.slice(faqEnd + '</script>'.length);
            writeFile(filePath, html);
            pagesModified++;
          }
        } catch (e) {
          // Skip unparseable JSON
        }
      }
    }
  }

  console.log(`  Differentiated FAQ schemas on ${pagesModified} commercial pages`);
  return pagesModified;
}

// ============================================================
// FIX C: NON-BREED GUIDE PAGES → ADD SPECIES HUB + BREED LINKS
// ============================================================

function fixNonBreedGuideLinks() {
  console.log('\n=== FIX C: NON-BREED GUIDES → ADD CONTEXTUAL LINKS ===');
  const guideFiles = listHtml('guides');
  const entities = JSON.parse(readFile('data/entities.json'));
  let pagesModified = 0;

  // Build set of breed-specific guide slugs
  const breedGuides = new Set();
  for (const entity of entities) {
    const slug = entity.slug;
    guideFiles.filter(g => g.includes(slug)).forEach(g => breedGuides.add(g));
  }

  const nonBreedGuides = guideFiles.filter(g => !breedGuides.has(g));

  // Category to related guides mapping
  const categoryLinks = {
    dog: ['/dogs', '/breeds/dog-breeds', '/guides/dog-nutrition', '/guides/dog-training'],
    cat: ['/cats', '/breeds/cat-breeds', '/guides/cat-nutrition', '/guides/cat-behavior'],
    bird: ['/birds', '/breeds/bird-breeds', '/guides/bird-health', '/guides/bird-nutrition'],
    fish: ['/fish', '/breeds/fish-breeds', '/guides/fish-water-quality', '/guides/fish-health'],
    reptile: ['/reptiles', '/breeds/reptile-breeds', '/guides/reptile-health', '/guides/reptile-habitat'],
    amphibian: ['/amphibians', '/breeds/amphibian-breeds'],
    'small-animal': ['/small-animals', '/breeds/small-animal-breeds'],
    marine: ['/marine-fish', '/breeds/marine-fish-breeds'],
  };

  for (const guideName of nonBreedGuides) {
    const guidePath = `guides/${guideName}.html`;
    if (!fs.existsSync(path.join(ROOT, guidePath))) continue;

    let html = readFile(guidePath);

    // Skip if already has our section marker
    if (html.includes('<!-- guide-cross-links -->')) continue;

    // Determine relevant species
    const relatedLinks = [];
    for (const [keyword, links] of Object.entries(categoryLinks)) {
      if (guideName.includes(keyword) ||
          (keyword === 'dog' && (guideName.includes('puppy') || guideName.includes('canine'))) ||
          (keyword === 'cat' && (guideName.includes('kitten') || guideName.includes('feline'))) ||
          (keyword === 'fish' && (guideName.includes('aquarium') || guideName.includes('aquatic'))) ||
          (keyword === 'reptile' && (guideName.includes('gecko') || guideName.includes('snake') || guideName.includes('lizard') || guideName.includes('turtle') || guideName.includes('tortoise') || guideName.includes('chameleon'))) ||
          (keyword === 'amphibian' && (guideName.includes('frog') || guideName.includes('salamander') || guideName.includes('newt') || guideName.includes('axolotl'))) ||
          (keyword === 'small-animal' && (guideName.includes('hamster') || guideName.includes('rabbit') || guideName.includes('guinea') || guideName.includes('ferret') || guideName.includes('hedgehog') || guideName.includes('chinchilla') || guideName.includes('gerbil') || guideName.includes('rat') || guideName.includes('mouse'))) ||
          (keyword === 'marine' && (guideName.includes('reef') || guideName.includes('saltwater') || guideName.includes('coral')))) {
        relatedLinks.push(...links);
      }
    }

    // If no specific match, add general pet links
    if (relatedLinks.length === 0) {
      if (guideName.startsWith('best-dog-')) relatedLinks.push('/dogs', '/breeds/dog-breeds');
      else if (guideName.startsWith('best-cat-')) relatedLinks.push('/cats', '/breeds/cat-breeds');
      else if (guideName.startsWith('best-bird-')) relatedLinks.push('/birds', '/breeds/bird-breeds');
      else if (guideName.startsWith('best-fish-') || guideName.startsWith('best-aquarium-')) relatedLinks.push('/fish', '/breeds/fish-breeds');
      else if (guideName.startsWith('best-reptile-')) relatedLinks.push('/reptiles', '/breeds/reptile-breeds');
      else relatedLinks.push('/dogs', '/cats', '/guides');
    }

    // De-duplicate and check which links don't already exist
    const uniqueLinks = [...new Set(relatedLinks)];
    const newLinks = uniqueLinks.filter(link => !html.includes(`href="${link}"`));

    if (newLinks.length === 0) continue;

    const linksHtml = newLinks.map(link => {
      const parts = link.split('/').filter(Boolean);
      let title, desc;
      if (link.startsWith('/breeds/')) {
        title = slugToTitle(parts[parts.length - 1]);
        desc = 'Browse the complete breed directory.';
      } else if (link.startsWith('/guides/')) {
        title = slugToTitle(parts[parts.length - 1]);
        desc = 'Expert pet care guide.';
      } else {
        title = slugToTitle(parts[parts.length - 1]) + ' Hub';
        desc = `Complete ${slugToTitle(parts[parts.length - 1]).toLowerCase()} care resources.`;
      }
      return `        <a href="${link}" class="guide-card"><h3>${title}</h3><p>${desc}</p></a>`;
    }).join('\n');

    const sectionHtml = `\n    <!-- guide-cross-links -->
    <section class="related-guides-section" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
      <h2>Related Resources</h2>
      <div class="guide-grid">
${linksHtml}
      </div>
    </section>\n`;

    // Insert before transparency section, sources, or </main>
    let insertPoint = html.indexOf('<section class="transparency">');
    if (insertPoint === -1) insertPoint = html.indexOf('<section class="sources-references-section"');
    if (insertPoint === -1) insertPoint = html.lastIndexOf('</main>');

    if (insertPoint !== -1) {
      html = html.slice(0, insertPoint) + sectionHtml + html.slice(insertPoint);
      writeFile(guidePath, html);
      pagesModified++;
    }
  }

  console.log(`  Modified ${pagesModified} non-breed guide pages with cross-links`);
  return pagesModified;
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  console.log('============================================');
  console.log('PetCareHelperAI — Indexing Fix Engine Phase 2');
  console.log('============================================');

  const results = {};

  results.guidesHub = fixGuidesHub();
  results.faqSchema = fixCommercialFAQSchema();
  results.nonBreedGuides = fixNonBreedGuideLinks();

  console.log('\n============================================');
  console.log('PHASE 2 SUMMARY');
  console.log('============================================');
  console.log(`Guides hub: ${results.guidesHub} links added`);
  console.log(`FAQ schema differentiations: ${results.faqSchema}`);
  console.log(`Non-breed guide cross-links: ${results.nonBreedGuides}`);
  console.log('============================================');
}

main().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
