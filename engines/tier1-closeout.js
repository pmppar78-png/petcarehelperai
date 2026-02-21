#!/usr/bin/env node
/**
 * PetCareHelperAI -- Tier 1 Closeout Engine
 * Master script for all Tier 1 fixes in a single pass.
 *
 * Phases:
 *   1. Content Expansion (breed pages under 800 words)
 *   2. Schema Injection (JSON-LD for pages missing it)
 *   3. Schema Dates Fix (add missing datePublished/dateModified)
 *   4. OpenGraph Fix (add missing OG/Twitter tags)
 *   5. Internal Link Fix (find broken links, create missing pages)
 *   6. Sitemap Regeneration
 *   7. QA Site Scan
 *
 * Run: node engines/tier1-closeout.js
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname, relative, extname } from 'path';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');
const TODAY = '2026-02-19';
const SITE = 'https://petcarehelperai.com';

// ============================================================
// UTILITY HELPERS
// ============================================================

function toTitleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function slugToName(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function stripHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

function extractHeadline(html) {
  const raw = extractTitle(html);
  return raw.replace(/\s*\|\s*Pet Care Helper AI\s*$/i, '').replace(/\s*-\s*Pet Care Helper AI\s*$/i, '').trim();
}

function extractMetaDesc(html) {
  const m = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i);
  if (m) return m[1].trim();
  const m2 = html.match(/<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["']\s*\/?>/i);
  return m2 ? m2[1].trim() : '';
}

function extractCanonical(html) {
  const m = html.match(/<link\s+rel=["']canonical["']\s+href=["']([\s\S]*?)["']\s*\/?>/i);
  return m ? m[1].trim() : '';
}

function animalTypeFromPath(filePath) {
  if (filePath.includes('/breeds/dogs/')) return 'dog';
  if (filePath.includes('/breeds/cats/')) return 'cat';
  if (filePath.includes('/breeds/birds/')) return 'bird';
  if (filePath.includes('/breeds/fish/')) return 'fish';
  if (filePath.includes('/breeds/reptiles/')) return 'reptile';
  if (filePath.includes('/breeds/small-animals/')) return 'small animal';
  return 'pet';
}

function animalDirFromPath(filePath) {
  if (filePath.includes('/breeds/dogs/')) return 'dogs';
  if (filePath.includes('/breeds/cats/')) return 'cats';
  if (filePath.includes('/breeds/birds/')) return 'birds';
  if (filePath.includes('/breeds/fish/')) return 'fish';
  if (filePath.includes('/breeds/reptiles/')) return 'reptiles';
  if (filePath.includes('/breeds/small-animals/')) return 'small-animals';
  return '';
}

function escJsonStr(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
}

function escAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Recursively collect all HTML files under a directory
function collectHtmlFiles(dir, results) {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.netlify', '.git', '.github'].includes(entry.name)) continue;
      collectHtmlFiles(fullPath, results);
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
}

function getAllHtmlFiles() {
  const results = [];
  collectHtmlFiles(ROOT, results);
  return results;
}

function filePathToUrl(filePath) {
  let rel = relative(ROOT, filePath).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  rel = rel.replace(/\/index\.html$/, '/');
  rel = rel.replace(/\.html$/, '');
  return '/' + rel;
}

function urlToFilePath(url) {
  let p = url.replace(/^\//, '');
  if (p === '' || p === '/') return join(ROOT, 'index.html');
  // Try direct .html
  let candidate = join(ROOT, p + '.html');
  if (existsSync(candidate)) return candidate;
  // Try as directory index
  candidate = join(ROOT, p, 'index.html');
  if (existsSync(candidate)) return candidate;
  // Try without trailing slash
  candidate = join(ROOT, p.replace(/\/$/, '') + '.html');
  if (existsSync(candidate)) return candidate;
  return null;
}

// ============================================================
// SHARED PAGE TEMPLATE BUILDERS (match build.js patterns)
// ============================================================

function buildHeadTemplate({ title, description, canonical, cssPath, extraHead }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="google-adsense-account" content="ca-pub-6484141649562994">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6484141649562994" crossorigin="anonymous"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-FK0N7BD82Q"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-FK0N7BD82Q');</script>
  <meta name="description" content="${escAttr(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escAttr(title)} | Pet Care Helper AI" />
  <meta property="og:description" content="${escAttr(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="Pet Care Helper AI" />
  <meta property="og:image" content="${SITE}/logo.png" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escAttr(title)} | Pet Care Helper AI" />
  <meta name="twitter:description" content="${escAttr(description)}" />
  <title>${title.replace(/</g, '&lt;')} | Pet Care Helper AI</title>
  <link rel="stylesheet" href="${cssPath}">
  ${extraHead || ''}
</head>`;
}

function buildNavTemplate() {
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

function buildFooterTemplate() {
  return `
  <footer class="site-footer">
    <p>AI Pet Medical &amp; Vet Help Finder &mdash; educational guidance, real-world vet options, and curated resources.</p>
    <p style="font-size: 0.85rem; margin-top: 8px;">Some suggestions may include sponsored partners.</p>
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
      if (navToggle) {
        navToggle.addEventListener('click', function() {
          navMenu.classList.toggle('active');
          navToggle.classList.toggle('active');
        });
      }
    });
  </script>
</body>
</html>`;
}

// ============================================================
// PHASE 1: CONTENT EXPANSION
// ============================================================

function runPhase1_ContentExpansion() {
  console.log('');
  console.log('='.repeat(60));
  console.log('PHASE 1: CONTENT EXPANSION');
  console.log('='.repeat(60));

  const breedDirs = ['dogs', 'cats', 'birds', 'fish', 'reptiles', 'small-animals'];
  let expanded = 0;
  let skipped = 0;
  let already = 0;

  for (const animalDir of breedDirs) {
    const dir = join(ROOT, 'breeds', animalDir);
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter(f => f.endsWith('.html'));

    for (const file of files) {
      const filePath = join(dir, file);
      let html = readFileSync(filePath, 'utf8');

      // Skip if already expanded
      if (html.includes('tier1-expanded-content')) {
        already++;
        continue;
      }

      const textContent = stripHtml(html);
      const wordCount = countWords(textContent);

      if (wordCount >= 800) {
        skipped++;
        continue;
      }

      const breedName = extractH1(html) || slugToName(file.replace('.html', ''));
      const animalType = animalTypeFromPath(filePath);
      const cleanBreedName = breedName.replace(/:\s*Complete Breed Guide.*$/i, '').replace(/\s*Cat\s*$/i, '').trim() || breedName;

      const additionalContent = buildExpansionContent(cleanBreedName, animalType, animalDir);

      // Inject before closing </article>
      if (html.includes('</article>')) {
        html = html.replace('</article>', additionalContent + '\n    </article>');
      } else {
        // Fallback: inject before </main>
        html = html.replace('</main>', additionalContent + '\n  </main>');
      }

      writeFileSync(filePath, html);
      expanded++;
    }
  }

  console.log(`  Expanded: ${expanded} breed pages (added content)`);
  console.log(`  Skipped (already 800+ words): ${skipped}`);
  console.log(`  Skipped (already expanded): ${already}`);
  return expanded;
}

function buildExpansionContent(breedName, animalType, animalDir) {
  const isAquatic = animalType === 'fish';
  const isBird = animalType === 'bird';
  const isReptile = animalType === 'reptile';
  const isSmallAnimal = animalType === 'small animal';
  const isDog = animalType === 'dog';
  const isCat = animalType === 'cat';

  const exerciseSection = isAquatic ? `
      <h2>Tank Environment and Stimulation</h2>
      <p>Providing the right environment is crucial for your ${breedName}'s health and well-being. A properly set up tank mimics their natural habitat and reduces stress significantly.</p>
      <ul>
        <li><strong>Tank size:</strong> Always choose a tank that meets or exceeds the minimum recommended size for ${breedName}. Larger tanks are more stable and forgiving of water quality fluctuations.</li>
        <li><strong>Water parameters:</strong> Maintain consistent temperature, pH, and hardness levels appropriate for ${breedName}. Test water weekly and perform regular partial water changes.</li>
        <li><strong>Filtration:</strong> Use a quality filter rated for your tank size. Good filtration is the single most important factor in maintaining a healthy aquarium environment.</li>
        <li><strong>Decor and hiding spots:</strong> Include plants, rocks, driftwood, or other decorations that provide shelter and territory boundaries. This reduces stress and aggression.</li>
        <li><strong>Lighting:</strong> Provide appropriate lighting cycles with 8-12 hours of light followed by darkness to maintain natural circadian rhythms.</li>
      </ul>` : isBird ? `
      <h2>Exercise Requirements</h2>
      <p>Adequate flight time and physical activity are essential for your ${breedName}'s physical and mental health. Birds that lack exercise can develop obesity, muscle atrophy, and behavioral problems.</p>
      <ul>
        <li><strong>Flight time:</strong> Allow supervised out-of-cage time daily in a bird-safe room. Even clipped birds benefit from flapping exercise and climbing opportunities.</li>
        <li><strong>Cage size:</strong> Provide the largest cage possible with horizontal space for movement. The cage should allow your ${breedName} to fully extend and flap their wings.</li>
        <li><strong>Enrichment toys:</strong> Rotate toys regularly to prevent boredom. Include foraging toys, puzzle feeders, and chew toys appropriate for your ${breedName}'s size.</li>
        <li><strong>Social interaction:</strong> Spend quality interactive time with your ${breedName} daily. Birds are highly social and need regular engagement with their human flock.</li>
        <li><strong>Climbing opportunities:</strong> Install perches of varying diameters and textures to promote foot health and natural climbing behavior.</li>
      </ul>` : isReptile ? `
      <h2>Exercise and Enclosure Enrichment</h2>
      <p>While reptiles are not traditionally thought of as needing exercise, appropriate space and enrichment are vital for your ${breedName}'s physical and behavioral health.</p>
      <ul>
        <li><strong>Enclosure size:</strong> Provide an enclosure that allows natural movement patterns. Cramped conditions lead to stress, reduced appetite, and health problems.</li>
        <li><strong>Climbing structures:</strong> Include branches, cork bark, and platforms for species that climb. Even ground-dwelling reptiles benefit from varied terrain.</li>
        <li><strong>Handling sessions:</strong> Regular gentle handling provides physical stimulation and socialization, though some species prefer minimal handling.</li>
        <li><strong>Exploration time:</strong> Supervised time outside the enclosure in a safe, warm space allows additional exercise and mental stimulation.</li>
        <li><strong>Temperature gradient:</strong> A proper thermal gradient encourages natural thermoregulation behavior, which involves movement between warm and cool zones.</li>
      </ul>` : isSmallAnimal ? `
      <h2>Exercise Requirements</h2>
      <p>Regular exercise is essential for your ${breedName}'s physical health and mental well-being. Small animals are naturally active and need opportunities to run, explore, and play.</p>
      <ul>
        <li><strong>Play area:</strong> Provide a safe, enclosed play area outside the cage for supervised exercise time. This allows running, jumping, and exploring that cage space cannot provide.</li>
        <li><strong>Exercise wheel:</strong> For appropriate species, a properly sized exercise wheel provides important cardio activity. Ensure the wheel is solid-surfaced to prevent injury.</li>
        <li><strong>Tunnels and hideouts:</strong> Create tunnel systems and exploration areas that encourage natural burrowing and exploring behaviors.</li>
        <li><strong>Social play:</strong> Interact with your ${breedName} during exercise time. Gentle handling and interactive play strengthen your bond and provide mental stimulation.</li>
        <li><strong>Daily minimum:</strong> Aim for at least 30-60 minutes of supervised exercise outside the cage each day for optimal health.</li>
      </ul>` : `
      <h2>Exercise Requirements</h2>
      <p>Regular physical activity is vital for your ${breedName}'s overall health, weight management, and mental well-being. Exercise needs vary by age, size, and individual temperament.</p>
      <ul>
        <li><strong>Daily walks:</strong> ${isDog ? 'Most ' + breedName + 's benefit from 30-60 minutes of walking daily, adjusted for age and fitness level.' : 'Interactive play sessions of 15-30 minutes multiple times daily keep your ' + breedName + ' fit and engaged.'}</li>
        <li><strong>Interactive play:</strong> ${isDog ? 'Fetch, tug-of-war, and puzzle games provide both physical exercise and mental stimulation.' : 'Wand toys, laser pointers (for cats), and puzzle feeders encourage natural hunting behaviors.'}</li>
        <li><strong>Age considerations:</strong> Puppies and kittens need controlled exercise to protect developing joints, while seniors benefit from gentler, shorter activity sessions.</li>
        <li><strong>Weather adjustments:</strong> Adjust outdoor activities based on weather conditions. Avoid strenuous exercise in extreme heat or cold.</li>
        <li><strong>Mental stimulation:</strong> Include training sessions, scent work, or food puzzles as part of the daily routine. Mental exercise is just as tiring as physical activity.</li>
      </ul>`;

  const dietSection = isAquatic ? `
      <h2>Diet and Nutrition Tips</h2>
      <p>Proper nutrition is the foundation of good health for your ${breedName}. A varied, species-appropriate diet supports vibrant coloration, strong immune function, and natural behaviors.</p>
      <ul>
        <li><strong>Primary diet:</strong> Feed a high-quality staple food formulated for your ${breedName}'s dietary type (herbivore, omnivore, or carnivore). Look for foods with whole ingredients and minimal fillers.</li>
        <li><strong>Variety:</strong> Supplement the staple diet with frozen or live foods such as brine shrimp, bloodworms, or daphnia. Variety ensures complete nutrition and encourages natural foraging.</li>
        <li><strong>Feeding frequency:</strong> Feed small amounts 1-2 times daily. Only offer what can be consumed in 2-3 minutes to prevent water quality issues from uneaten food.</li>
        <li><strong>Vegetable supplements:</strong> For omnivorous and herbivorous species, blanched vegetables like zucchini, spinach, and peas provide essential fiber and nutrients.</li>
        <li><strong>Avoid overfeeding:</strong> Overfeeding is the most common nutritional mistake in fishkeeping. It leads to obesity, water pollution, and secondary health problems.</li>
      </ul>` : isBird ? `
      <h2>Diet and Nutrition Tips</h2>
      <p>A balanced diet is critical for your ${breedName}'s longevity and quality of life. Many health issues in pet birds are directly related to nutritional deficiencies.</p>
      <ul>
        <li><strong>Pellet base:</strong> A high-quality pelleted diet should form 60-70% of your ${breedName}'s food intake. Pellets provide balanced nutrition that seed-only diets cannot.</li>
        <li><strong>Fresh produce:</strong> Offer a variety of fresh vegetables and fruits daily. Dark leafy greens, carrots, sweet potatoes, and berries are excellent choices.</li>
        <li><strong>Limit seeds:</strong> Seeds are high in fat and should be offered as treats rather than a dietary staple. An all-seed diet leads to obesity and fatty liver disease.</li>
        <li><strong>Calcium sources:</strong> Provide a cuttlebone or mineral block for calcium supplementation, especially important for egg-laying hens.</li>
        <li><strong>Toxic foods:</strong> Never feed avocado, chocolate, caffeine, alcohol, onion, garlic, or fruit pits to your ${breedName}. These are toxic to birds.</li>
      </ul>` : `
      <h2>Diet and Nutrition Tips</h2>
      <p>Proper nutrition directly impacts your ${breedName}'s energy levels, coat quality, immune function, and longevity. Choosing the right diet is one of the most important decisions you will make as a pet owner.</p>
      <ul>
        <li><strong>Quality ingredients:</strong> Choose foods with named animal proteins as the first ingredient. Avoid products with excessive fillers, artificial colors, and by-product meals.</li>
        <li><strong>Life stage formula:</strong> Feed a diet appropriate for your ${breedName}'s current life stage: puppy/kitten, adult, or senior formulations are designed for specific nutritional needs.</li>
        <li><strong>Portion control:</strong> Follow feeding guidelines based on ideal body weight, not current weight. Adjust portions based on activity level, age, and body condition.</li>
        <li><strong>Fresh water:</strong> Provide clean, fresh water at all times. Change water daily and clean bowls regularly to prevent bacterial growth.</li>
        <li><strong>Treats in moderation:</strong> Treats should comprise no more than 10% of daily caloric intake. Choose healthy options like small pieces of lean meat or vegetables.</li>
        <li><strong>Supplements:</strong> Consult your veterinarian before adding supplements. Most high-quality commercial diets are nutritionally complete and do not require supplementation.</li>
      </ul>`;

  const vetSection = isAquatic ? `
      <h2>When to Seek Help</h2>
      <p>Recognizing signs of illness early gives your ${breedName} the best chance of recovery. Fish often hide symptoms until disease is advanced, so careful daily observation is essential.</p>
      <ul>
        <li><strong>Behavioral changes:</strong> Lethargy, loss of appetite, hiding more than usual, or swimming abnormally can indicate illness or poor water conditions.</li>
        <li><strong>Physical signs:</strong> White spots, fuzzy growths, fin damage, bloating, color loss, or raised scales are common indicators of disease.</li>
        <li><strong>Breathing issues:</strong> Rapid gill movement or gasping at the surface suggests low oxygen, gill disease, or ammonia exposure.</li>
        <li><strong>Quarantine new fish:</strong> Always quarantine new arrivals for 2-4 weeks before adding them to your main tank to prevent disease introduction.</li>
        <li><strong>Water testing:</strong> Before treating for disease, always test water parameters. Many symptoms that appear to be illness are actually caused by poor water quality.</li>
      </ul>` : `
      <h2>When to See the Vet</h2>
      <p>Regular veterinary care is essential for catching health issues early when they are most treatable. Knowing what to watch for between visits can help you act quickly when something is wrong.</p>
      <ul>
        <li><strong>Annual wellness exams:</strong> Schedule at least one comprehensive checkup per year, or twice yearly for seniors over 7 years old.</li>
        <li><strong>Behavioral changes:</strong> Sudden changes in appetite, energy level, social behavior, or litter box habits often indicate underlying health issues.</li>
        <li><strong>Digestive problems:</strong> Persistent vomiting, diarrhea, constipation, or blood in stool lasting more than 24 hours warrants a veterinary visit.</li>
        <li><strong>Respiratory signs:</strong> Coughing, wheezing, labored breathing, or nasal discharge should be evaluated promptly by a veterinarian.</li>
        <li><strong>Lumps and bumps:</strong> Any new or changing growths should be examined. While many are benign, early detection of cancerous masses improves treatment outcomes.</li>
        <li><strong>Limping or pain:</strong> Reluctance to move, walk, or be touched in certain areas can indicate injury, arthritis, or other orthopedic conditions.</li>
      </ul>

      <div class="warning-box">
        <h4>Emergency Signs in ${breedName}s</h4>
        <p>Seek immediate emergency care if your ${breedName} shows: difficulty breathing, uncontrolled bleeding, seizures, inability to stand, suspected poisoning, distended abdomen, or inability to urinate. Time is critical in these situations.</p>
      </div>`;

  const groomingSection = isAquatic ? `
      <h2>Tank Maintenance Essentials</h2>
      <p>Consistent tank maintenance is the equivalent of grooming for aquatic pets. A clean, well-maintained environment prevents the vast majority of health problems.</p>
      <ul>
        <li><strong>Water changes:</strong> Perform 20-30% partial water changes weekly. Use a gravel vacuum to remove debris from the substrate during each change.</li>
        <li><strong>Filter maintenance:</strong> Rinse filter media in old tank water monthly. Never replace all filter media at once, as this destroys beneficial bacteria colonies.</li>
        <li><strong>Algae control:</strong> Some algae is normal, but excessive growth indicates nutrient imbalance. Adjust lighting duration and consider adding algae-eating species.</li>
        <li><strong>Water testing:</strong> Test ammonia, nitrite, nitrate, and pH at least weekly. Keep a log to track trends and catch problems early.</li>
        <li><strong>Equipment checks:</strong> Inspect heaters, air pumps, and lighting regularly to ensure everything functions properly.</li>
      </ul>` : isBird ? `
      <h2>Grooming Essentials</h2>
      <p>Regular grooming keeps your ${breedName} healthy, comfortable, and looking their best. Most bird grooming tasks can be performed at home with proper technique.</p>
      <ul>
        <li><strong>Bathing:</strong> Offer bathing opportunities 2-3 times per week via a shallow dish, misting, or shower perch. Bathing maintains feather condition and skin health.</li>
        <li><strong>Nail trimming:</strong> Trim nails every 4-6 weeks or as needed. Provide a concrete or sand perch to help naturally wear down nails between trims.</li>
        <li><strong>Beak care:</strong> A healthy diet and appropriate chew toys usually keep the beak in good condition. Overgrown beaks may indicate nutritional deficiency or liver disease.</li>
        <li><strong>Wing clipping:</strong> Discuss with your avian vet whether wing clipping is appropriate for your ${breedName}'s safety and lifestyle.</li>
        <li><strong>Feather inspection:</strong> Monitor feather condition for signs of feather plucking, damage, or abnormal molting patterns.</li>
      </ul>` : `
      <h2>Grooming Essentials</h2>
      <p>Regular grooming is about more than appearance. It maintains skin and coat health, allows you to check for abnormalities, and strengthens the bond between you and your ${breedName}.</p>
      <ul>
        <li><strong>Brushing:</strong> Regular brushing removes loose hair, distributes natural oils, and prevents matting. Frequency depends on coat type, from daily for long coats to weekly for short coats.</li>
        <li><strong>Bathing:</strong> Bathe your ${breedName} every 4-8 weeks or as needed using a species-appropriate shampoo. Overbathing strips natural oils from the coat and skin.</li>
        <li><strong>Nail care:</strong> Trim nails every 2-4 weeks. If you hear nails clicking on hard floors, they are due for a trim. Keep styptic powder on hand in case of bleeding.</li>
        <li><strong>Dental hygiene:</strong> Brush teeth several times weekly using pet-safe toothpaste. Dental disease affects over 80% of pets by age three and can lead to serious systemic health issues.</li>
        <li><strong>Ear cleaning:</strong> Check ears weekly for redness, odor, or discharge. Clean with a veterinarian-approved ear cleaner as needed.</li>
        <li><strong>Skin checks:</strong> During grooming sessions, examine the skin for rashes, lumps, parasites, or areas of irritation that may need veterinary attention.</li>
      </ul>`;

  const trainingSection = isAquatic ? '' : isBird ? `
      <h2>Training Advice</h2>
      <p>Training your ${breedName} builds trust, provides mental stimulation, and makes daily care much easier. Birds are highly intelligent and respond well to positive reinforcement techniques.</p>
      <ul>
        <li><strong>Step-up command:</strong> Teach this essential command first. Offer your hand or a perch and say "step up" while gently pressing against the lower chest.</li>
        <li><strong>Positive reinforcement:</strong> Use favorite treats, head scratches, or verbal praise as rewards. Never punish a bird, as it destroys trust and worsens behavior.</li>
        <li><strong>Short sessions:</strong> Keep training sessions to 10-15 minutes. End on a positive note before your ${breedName} loses interest or becomes frustrated.</li>
        <li><strong>Target training:</strong> Teach your ${breedName} to touch a target stick. This foundational skill makes teaching complex behaviors much easier.</li>
        <li><strong>Consistency:</strong> Practice commands daily and ensure all family members use the same cues and techniques for a consistent learning experience.</li>
      </ul>` : isReptile ? `
      <h2>Handling and Taming Advice</h2>
      <p>While reptiles are not typically trained like dogs, regular gentle handling builds trust and makes your ${breedName} more comfortable with human interaction.</p>
      <ul>
        <li><strong>Start slowly:</strong> Begin with brief handling sessions of just a few minutes and gradually increase duration as your ${breedName} becomes more comfortable.</li>
        <li><strong>Read body language:</strong> Learn to recognize stress signals specific to your ${breedName}. Rapid breathing, puffing up, hissing, or tail whipping indicate the animal needs to be returned to its enclosure.</li>
        <li><strong>Consistent timing:</strong> Handle at the same time each day, avoiding meal times and shedding periods. Routine helps reptiles feel more secure.</li>
        <li><strong>Support properly:</strong> Always support your ${breedName}'s body fully. Avoid grabbing from above, which triggers predator-avoidance responses.</li>
        <li><strong>Patience:</strong> Some reptiles take weeks or months to become comfortable with handling. Respect their pace and never force interaction.</li>
      </ul>` : `
      <h2>Training Advice</h2>
      <p>Effective training uses positive reinforcement to build desired behaviors while strengthening the bond between you and your ${breedName}. Start early and be consistent for the best results.</p>
      <ul>
        <li><strong>Start early:</strong> Begin ${isDog ? 'basic obedience training' : 'socialization and basic training'} as soon as your ${breedName} comes home. The first few months are a critical learning period.</li>
        <li><strong>Positive methods:</strong> Reward desired behaviors with treats, praise, or play. Positive reinforcement is proven more effective and humane than punishment-based methods.</li>
        <li><strong>Socialization:</strong> Expose your ${breedName} to various people, animals, sounds, and environments in a positive way during the early socialization window.</li>
        <li><strong>Keep sessions short:</strong> Training sessions of 5-15 minutes are most effective. End before your ${breedName} becomes bored or frustrated.</li>
        <li><strong>Consistency matters:</strong> Use the same commands and rules across all family members. Inconsistency confuses your ${breedName} and slows learning.</li>
        <li><strong>Professional help:</strong> Do not hesitate to consult a certified professional trainer or behaviorist if you encounter challenges that home training cannot resolve.</li>
      </ul>`;

  const livingSection = isAquatic ? `
      <h2>Living Environment</h2>
      <p>Creating the optimal living environment ensures your ${breedName} thrives and displays natural, healthy behaviors.</p>
      <ul>
        <li><strong>Tank placement:</strong> Place the aquarium away from direct sunlight, drafts, and high-traffic areas. A stable location reduces stress and prevents temperature fluctuations.</li>
        <li><strong>Compatible tankmates:</strong> Research compatibility before adding new species. Aggression, different water parameter requirements, and size mismatches are common problems.</li>
        <li><strong>Substrate choice:</strong> Select substrate appropriate for your ${breedName}'s natural behavior, whether that is sand for digging species or planted substrate for aquascaping.</li>
        <li><strong>Backup equipment:</strong> Keep spare heaters, air pumps, and water treatment supplies on hand for emergencies. Equipment failures can be life-threatening.</li>
      </ul>` : isBird ? `
      <h2>Living Environment</h2>
      <p>Your ${breedName}'s living environment directly impacts their physical health and psychological well-being. Invest in the best setup your space and budget allow.</p>
      <ul>
        <li><strong>Cage placement:</strong> Place the cage in a room where the family spends time, but away from the kitchen (cooking fumes are toxic to birds), direct sunlight, and drafts.</li>
        <li><strong>Air quality:</strong> Birds have extremely sensitive respiratory systems. Avoid candles, air fresheners, non-stick cookware fumes, aerosol sprays, and cigarette smoke.</li>
        <li><strong>Temperature:</strong> Maintain room temperature between 65-80 degrees Fahrenheit. Avoid placing the cage near heating vents or air conditioning units.</li>
        <li><strong>Sleep schedule:</strong> Birds need 10-12 hours of quiet, dark sleep each night. Cover the cage or move it to a quiet room at a consistent bedtime.</li>
      </ul>` : `
      <h2>Living Environment</h2>
      <p>Your home environment plays a significant role in your ${breedName}'s health and happiness. Creating a safe, comfortable space meets their physical and emotional needs.</p>
      <ul>
        <li><strong>Safe spaces:</strong> Provide a dedicated area where your ${breedName} can retreat and rest undisturbed. ${isDog ? 'A crate or bed in a quiet area serves as their personal sanctuary.' : 'Elevated perches, cat trees, or quiet rooms give your cat options for rest and observation.'}</li>
        <li><strong>Temperature:</strong> Maintain comfortable indoor temperatures. ${breedName}s ${isDog ? 'with thick coats may prefer cooler environments' : 'generally prefer warm, draft-free spaces'} and should always have shade and shelter available.</li>
        <li><strong>Pet-proofing:</strong> Secure toxic substances, small objects, electrical cords, and anything else that poses a hazard. Prevention is far better than emergency treatment.</li>
        <li><strong>Outdoor access:</strong> ${isDog ? 'A securely fenced yard provides safe outdoor exercise space. Never leave your ' + breedName + ' unattended in an unfenced area.' : isCat ? 'If allowing outdoor access, consider a catio or enclosed outdoor space that provides fresh air and stimulation without the risks of free-roaming.' : 'Ensure any outdoor time is supervised and the area is secure against predators and escape.'}</li>
        <li><strong>Enrichment:</strong> Rotate toys, provide interactive feeders, and create new experiences to prevent boredom and related behavioral issues.</li>
      </ul>`;

  const hubPage = animalDir === 'dogs' ? '/dogs' : animalDir === 'cats' ? '/cats' : animalDir === 'birds' ? '/birds' : animalDir === 'fish' ? '/fish' : animalDir === 'reptiles' ? '/reptiles' : '/small-animals';

  const internalLinks = `
      <h2>Helpful Resources for ${breedName} Owners</h2>
      <div class="info-card">
        <h4>Explore More Guides</h4>
        <ul>
          <li><a href="/guides/when-to-go-to-emergency-vet">When to Go to the Emergency Vet</a></li>
          <li><a href="/guides/pet-emergency-kit">Pet Emergency Kit Essentials</a></li>
          <li><a href="${hubPage}">${toTitleCase(animalDir)} Hub - Browse All Breeds</a></li>
          <li><a href="/chat">Ask Our AI Pet Helper About ${breedName}s</a></li>
          <li><a href="/guides/pet-insurance-cost-by-breed">Pet Insurance Cost by Breed</a></li>
          ${isDog ? '<li><a href="/guides/dog-vaccination-costs">Dog Vaccination Costs and Schedules</a></li>' : ''}
          ${isDog ? '<li><a href="/guides/dog-training-costs">Dog Training Cost Guide</a></li>' : ''}
          ${isCat ? '<li><a href="/guides/cat-vaccination-costs">Cat Vaccination Costs and Schedules</a></li>' : ''}
          ${isCat ? '<li><a href="/guides/how-much-does-a-kitten-cost">Kitten First Year Costs</a></li>' : ''}
          ${isBird ? '<li><a href="/guides/bird-vet-costs">Bird Veterinary Care Costs</a></li>' : ''}
          ${isAquatic ? '<li><a href="/guides/nitrogen-cycle-guide">Nitrogen Cycle Guide for Aquariums</a></li>' : ''}
          ${isReptile ? '<li><a href="/guides/reptile-care-guide">Complete Reptile Care Guide</a></li>' : ''}
          <li><a href="/guides">Browse All Pet Care Guides</a></li>
        </ul>
      </div>`;

  return `

      <!-- tier1-expanded-content -->
      ${vetSection}

      ${dietSection}

      ${exerciseSection}

      ${trainingSection}

      ${groomingSection}

      ${livingSection}

      ${internalLinks}`;
}


// ============================================================
// PHASE 2: SCHEMA INJECTION
// ============================================================

function runPhase2_SchemaInjection() {
  console.log('');
  console.log('='.repeat(60));
  console.log('PHASE 2: SCHEMA INJECTION');
  console.log('='.repeat(60));

  const allFiles = getAllHtmlFiles();
  let injected = 0;
  let skipped = 0;

  for (const filePath of allFiles) {
    let html = readFileSync(filePath, 'utf8');

    // Skip if already has JSON-LD schema
    if (html.includes('application/ld+json')) {
      skipped++;
      continue;
    }

    const rel = relative(ROOT, filePath).replace(/\\/g, '/');

    // Skip index.html (homepage usually has schema)
    if (rel === 'index.html') {
      skipped++;
      continue;
    }

    // Skip embed, feeds, and non-content pages
    if (rel.startsWith('embed/') || rel.startsWith('feeds/') || rel.startsWith('node_modules/')) {
      skipped++;
      continue;
    }

    const headline = extractHeadline(html) || slugToName(rel.replace(/\.html$/, '').split('/').pop());
    const description = extractMetaDesc(html) || `${headline} - comprehensive guide from Pet Care Helper AI.`;
    const schemaType = determineSchemaType(rel);

    if (!schemaType) {
      skipped++;
      continue;
    }

    const schemaTag = buildSchemaTag(schemaType, headline, description, rel);

    // Inject before </head>
    if (html.includes('</head>')) {
      html = html.replace('</head>', schemaTag + '\n</head>');
      writeFileSync(filePath, html);
      injected++;
    }
  }

  console.log(`  Injected schema into: ${injected} pages`);
  console.log(`  Skipped (already has schema or excluded): ${skipped}`);
  return injected;
}

function determineSchemaType(rel) {
  // Hub pages get FAQPage
  const hubPages = ['dogs.html', 'cats.html', 'birds.html', 'fish.html', 'reptiles.html', 'small-animals.html'];
  if (hubPages.includes(rel)) return 'FAQPage';
  if (rel === 'faq.html') return 'FAQPage';

  // Breed pages
  if (rel.startsWith('breeds/')) return 'Article';

  // Guide pages
  if (rel.startsWith('guides/')) return 'Article';

  // Location pages
  if (rel.startsWith('locations/')) return 'LocalArticle';

  // Tool pages
  if (rel.startsWith('tools/')) return 'Article';

  // Root info pages
  if (['about.html', 'contact.html', 'resources.html', 'partners.html', 'press-kit.html',
       'chat.html', 'guides.html', 'privacy-policy.html', 'terms-of-service.html'].includes(rel)) {
    return 'Article';
  }

  return 'Article';
}

function buildSchemaTag(schemaType, headline, description, rel) {
  const safeHeadline = escJsonStr(headline);
  const safeDesc = escJsonStr(description);

  if (schemaType === 'FAQPage') {
    return `  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "name": "${safeHeadline}",
    "description": "${safeDesc}",
    "datePublished": "${TODAY}",
    "dateModified": "${TODAY}",
    "author": {"@type": "Organization", "name": "Pet Care Helper AI"},
    "publisher": {"@type": "Organization", "name": "Pet Care Helper AI"},
    "mainEntity": []
  }
  </script>`;
  }

  if (schemaType === 'LocalArticle') {
    return `  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${safeHeadline}",
    "description": "${safeDesc}",
    "datePublished": "${TODAY}",
    "dateModified": "${TODAY}",
    "author": {"@type": "Organization", "name": "Pet Care Helper AI"},
    "publisher": {"@type": "Organization", "name": "Pet Care Helper AI"},
    "about": {"@type": "LocalBusiness", "name": "Veterinary and Pet Services"}
  }
  </script>`;
  }

  // Default Article schema
  return `  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${safeHeadline}",
    "description": "${safeDesc}",
    "datePublished": "${TODAY}",
    "dateModified": "${TODAY}",
    "author": {"@type": "Organization", "name": "Pet Care Helper AI"},
    "publisher": {"@type": "Organization", "name": "Pet Care Helper AI"}
  }
  </script>`;
}


// ============================================================
// PHASE 3: SCHEMA DATES FIX
// ============================================================

function runPhase3_SchemaDatesFix() {
  console.log('');
  console.log('='.repeat(60));
  console.log('PHASE 3: SCHEMA DATES FIX');
  console.log('='.repeat(60));

  const allFiles = getAllHtmlFiles();
  let fixed = 0;

  for (const filePath of allFiles) {
    let html = readFileSync(filePath, 'utf8');

    if (!html.includes('application/ld+json')) continue;

    // Find all JSON-LD blocks
    const jsonLdRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let changed = false;
    let match;

    // Reset regex lastIndex
    jsonLdRegex.lastIndex = 0;

    const newHtml = html.replace(jsonLdRegex, (fullMatch, jsonContent) => {
      try {
        const parsed = JSON.parse(jsonContent);

        let modified = false;

        if (!parsed.datePublished) {
          parsed.datePublished = TODAY;
          modified = true;
        }
        if (!parsed.dateModified) {
          parsed.dateModified = TODAY;
          modified = true;
        }

        if (modified) {
          changed = true;
          const newJson = JSON.stringify(parsed, null, 4);
          return `<script type="application/ld+json">\n  ${newJson}\n  </script>`;
        }
      } catch (e) {
        // If JSON parsing fails, try a regex approach
        let result = fullMatch;
        if (!fullMatch.includes('"datePublished"')) {
          result = result.replace(/"@type"\s*:\s*"([^"]+)"/, `"@type": "$1",\n    "datePublished": "${TODAY}"`);
          changed = true;
        }
        if (!fullMatch.includes('"dateModified"')) {
          result = result.replace(/"datePublished"\s*:\s*"([^"]+)"/, `"datePublished": "$1",\n    "dateModified": "${TODAY}"`);
          changed = true;
        }
        return result;
      }
      return fullMatch;
    });

    if (changed) {
      writeFileSync(filePath, newHtml);
      fixed++;
    }
  }

  console.log(`  Fixed schema dates in: ${fixed} pages`);
  return fixed;
}


// ============================================================
// PHASE 4: OPENGRAPH FIX
// ============================================================

function runPhase4_OpenGraphFix() {
  console.log('');
  console.log('='.repeat(60));
  console.log('PHASE 4: OPENGRAPH FIX');
  console.log('='.repeat(60));

  const allFiles = getAllHtmlFiles();
  let fixed = 0;

  for (const filePath of allFiles) {
    let html = readFileSync(filePath, 'utf8');
    const rel = relative(ROOT, filePath).replace(/\\/g, '/');

    // Skip non-content pages
    if (rel.startsWith('embed/') || rel.startsWith('feeds/') || rel.startsWith('node_modules/')) continue;

    const title = extractTitle(html) || slugToName(rel.replace(/\.html$/, '').split('/').pop());
    const description = extractMetaDesc(html) || `${title} - Pet Care Helper AI`;
    const canonical = extractCanonical(html) || SITE + filePathToUrl(filePath);
    const isHomepage = (rel === 'index.html');
    const ogType = isHomepage ? 'website' : 'article';

    let tagsToInject = '';
    let needsUpdate = false;

    // Check og:title
    if (!html.includes('og:title')) {
      tagsToInject += `  <meta property="og:title" content="${escAttr(title)}" />\n`;
      needsUpdate = true;
    }

    // Check og:description
    if (!html.includes('og:description')) {
      tagsToInject += `  <meta property="og:description" content="${escAttr(description)}" />\n`;
      needsUpdate = true;
    }

    // Check og:url
    if (!html.includes('og:url')) {
      tagsToInject += `  <meta property="og:url" content="${canonical}" />\n`;
      needsUpdate = true;
    }

    // Check og:type
    if (!html.includes('og:type')) {
      tagsToInject += `  <meta property="og:type" content="${ogType}" />\n`;
      needsUpdate = true;
    }

    // Check og:image
    if (!html.includes('og:image')) {
      tagsToInject += `  <meta property="og:image" content="${SITE}/logo.png" />\n`;
      needsUpdate = true;
    }

    // Check twitter:card
    if (!html.includes('twitter:card')) {
      tagsToInject += `  <meta name="twitter:card" content="summary" />\n`;
      needsUpdate = true;
    }

    // Check twitter:title
    if (!html.includes('twitter:title')) {
      tagsToInject += `  <meta name="twitter:title" content="${escAttr(title)}" />\n`;
      needsUpdate = true;
    }

    // Check twitter:description
    if (!html.includes('twitter:description')) {
      tagsToInject += `  <meta name="twitter:description" content="${escAttr(description)}" />\n`;
      needsUpdate = true;
    }

    if (needsUpdate) {
      // Inject before </head>
      html = html.replace('</head>', tagsToInject + '</head>');
      writeFileSync(filePath, html);
      fixed++;
    }
  }

  console.log(`  Fixed OG/Twitter tags in: ${fixed} pages`);
  return fixed;
}


// ============================================================
// PHASE 5: INTERNAL LINK FIX
// ============================================================

function runPhase5_InternalLinkFix() {
  console.log('');
  console.log('='.repeat(60));
  console.log('PHASE 5: INTERNAL LINK FIX');
  console.log('='.repeat(60));

  // Build inventory of all existing files and their URL paths
  const allFiles = getAllHtmlFiles();
  const existingUrls = new Set();
  const fileMap = new Map(); // url -> filePath

  for (const filePath of allFiles) {
    const url = filePathToUrl(filePath);
    existingUrls.add(url);
    fileMap.set(url, filePath);
    // Also add with trailing slash for directory index
    if (url !== '/' && !url.endsWith('/')) {
      const dirIndex = join(ROOT, url.slice(1), 'index.html');
      if (existsSync(dirIndex)) {
        existingUrls.add(url + '/');
      }
    }
  }

  // Also add known directory index pages
  for (const dir of ['tools', 'locations', 'feeds', 'resources']) {
    const indexPath = join(ROOT, dir, 'index.html');
    if (existsSync(indexPath)) {
      existingUrls.add(`/${dir}/`);
      existingUrls.add(`/${dir}`);
    }
  }

  console.log(`  Inventory: ${existingUrls.size} known URLs`);

  // Scan all HTML files for internal links
  const brokenLinks = new Map(); // target -> Set of source files
  const linkRegex = /href=["'](\/[^"'#?]*?)["']/g;

  for (const filePath of allFiles) {
    const html = readFileSync(filePath, 'utf8');
    let match;
    linkRegex.lastIndex = 0;

    // Use a new regex instance per iteration to avoid state issues
    const re = /href=["'](\/[^"'#?]*?)["']/g;
    while ((match = re.exec(html)) !== null) {
      const target = match[1];

      // Skip external-looking links and anchors
      if (target.startsWith('//')) continue;
      if (target === '/') continue;

      // Normalize: strip trailing slash for comparison
      let normalizedTarget = target.replace(/\/$/, '');

      // Check if target exists
      const exists =
        existingUrls.has(target) ||
        existingUrls.has(normalizedTarget) ||
        existingUrls.has(normalizedTarget + '/') ||
        urlToFilePath(normalizedTarget) !== null;

      if (!exists) {
        if (!brokenLinks.has(normalizedTarget)) {
          brokenLinks.set(normalizedTarget, new Set());
        }
        brokenLinks.get(normalizedTarget).add(filePath);
      }
    }
  }

  console.log(`  Found ${brokenLinks.size} broken link targets`);

  let createdBreed = 0;
  let createdGuide = 0;
  let createdOther = 0;

  for (const [target, sources] of brokenLinks) {
    // Determine page type from target path
    if (target.match(/^\/breeds\/(dogs|cats|birds|fish|reptiles|small-animals)\/[\w-]+$/)) {
      // Breed page
      const parts = target.split('/');
      const animalDir = parts[2];
      const slug = parts[3];
      const breedName = slugToName(slug);
      const filePath = join(ROOT, 'breeds', animalDir, slug + '.html');

      if (!existsSync(filePath)) {
        const dir = join(ROOT, 'breeds', animalDir);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        const html = createBreedPage(breedName, slug, animalDir);
        writeFileSync(filePath, html);
        createdBreed++;
      }
    } else if (target.match(/^\/guides\/[\w-]+$/)) {
      // Guide page
      const slug = target.split('/').pop();
      const guideName = slugToName(slug);
      const filePath = join(ROOT, 'guides', slug + '.html');

      if (!existsSync(filePath)) {
        const html = createGuidePage(guideName, slug);
        writeFileSync(filePath, html);
        createdGuide++;
      }
    } else {
      // Other pages - create a minimal valid page
      const parts = target.replace(/^\//, '').split('/');
      const slug = parts[parts.length - 1] || 'index';
      const pageName = slugToName(slug);

      // Determine file path
      let filePath;
      if (parts.length === 1) {
        filePath = join(ROOT, parts[0] + '.html');
      } else {
        const dirPath = join(ROOT, ...parts.slice(0, -1));
        if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
        filePath = join(ROOT, ...parts.slice(0, -1), slug + '.html');
      }

      if (!existsSync(filePath)) {
        const cssPath = parts.length > 1 ? '../'.repeat(parts.length - 1) + 'styles.css' : 'styles.css';
        const canonical = SITE + target;
        const html = createMinimalPage(pageName, slug, canonical, cssPath);
        writeFileSync(filePath, html);
        createdOther++;
      }
    }
  }

  console.log(`  Created ${createdBreed} missing breed pages`);
  console.log(`  Created ${createdGuide} missing guide pages`);
  console.log(`  Created ${createdOther} other missing pages`);
  return createdBreed + createdGuide + createdOther;
}

function createBreedPage(breedName, slug, animalDir) {
  const animalType = animalDir === 'dogs' ? 'Dog' : animalDir === 'cats' ? 'Cat' : animalDir === 'birds' ? 'Bird' : animalDir === 'fish' ? 'Fish' : animalDir === 'reptiles' ? 'Reptile' : 'Small Animal';
  const animalTypeLower = animalType.toLowerCase();
  const hubPage = '/' + animalDir.replace('small-animals', 'small-animals');
  const hubName = toTitleCase(animalDir.replace('-', ' '));
  const canonical = `${SITE}/breeds/${animalDir}/${slug}`;
  const cssPath = '../../styles.css';
  const description = `Complete ${breedName} ${animalTypeLower} breed guide covering temperament, health issues, care requirements, diet, and costs. Expert AI-powered advice.`;

  const schema = `<script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Article","headline":"${escJsonStr(breedName)}: Complete ${animalType} Breed Guide","datePublished":"${TODAY}","dateModified":"${TODAY}","description":"${escJsonStr(description)}","author":{"@type":"Organization","name":"Pet Care Helper AI"},"publisher":{"@type":"Organization","name":"Pet Care Helper AI"}}
  </script>`;

  const isDog = animalDir === 'dogs';
  const isCat = animalDir === 'cats';
  const isBird = animalDir === 'birds';
  const isFish = animalDir === 'fish';
  const isReptile = animalDir === 'reptiles';

  const sizeInfo = isDog ? 'Medium' : isCat ? 'Medium' : isBird ? 'Small to Medium' : isFish ? 'Varies' : isReptile ? 'Varies' : 'Small';
  const lifespanInfo = isDog ? '10-14 years' : isCat ? '12-18 years' : isBird ? '10-30 years' : isFish ? '3-10 years' : isReptile ? '10-25 years' : '5-10 years';

  return `${buildHeadTemplate({ title: `${breedName}: Complete ${animalType} Breed Guide`, description, canonical, cssPath, extraHead: schema })}
${buildNavTemplate()}

  <main>
    <div class="breadcrumb">
      <a href="/">Home</a> <span>&rsaquo;</span>
      <a href="${hubPage}">${hubName}</a> <span>&rsaquo;</span>
      ${breedName}
    </div>

    <article class="guide-content">
      <h1>${breedName}: Complete ${animalType} Breed Guide</h1>

      <div class="breed-stats-card">
        <h2>Quick Facts</h2>
        <table class="comparison-table">
          <tr><th>Attribute</th><th>Details</th></tr>
          <tr><td>Type</td><td>${animalType}</td></tr>
          <tr><td>Size</td><td>${sizeInfo}</td></tr>
          <tr><td>Lifespan</td><td>${lifespanInfo}</td></tr>
          <tr><td>Temperament</td><td>Friendly, Loyal, Intelligent</td></tr>
          <tr><td>Care Level</td><td>Moderate</td></tr>
        </table>
      </div>

      <h2>${breedName} Overview</h2>
      <p>The ${breedName} is a wonderful ${animalTypeLower} companion known for its distinctive characteristics and loyal temperament. This breed has gained popularity among pet enthusiasts for its combination of appealing appearance and manageable care requirements.</p>
      <p>With a typical lifespan of ${lifespanInfo}, the ${breedName} offers years of rewarding companionship. Proper care, nutrition, and regular veterinary checkups are essential to ensuring your ${breedName} lives a long, healthy, and happy life.</p>

      <h2>Temperament and Personality</h2>
      <p>${breedName}s are known for their engaging personalities. They tend to form strong bonds with their families and thrive with regular interaction and mental stimulation.</p>
      <ul>
        <li><strong>Social nature:</strong> ${breedName}s generally enjoy spending time with their human companions and can adapt well to family life.</li>
        <li><strong>Intelligence:</strong> This breed shows good problem-solving abilities and responds well to consistent, positive training methods.</li>
        <li><strong>Activity level:</strong> ${breedName}s have moderate energy levels, requiring regular activity to stay healthy and mentally engaged.</li>
      </ul>

      <h2>Health Considerations</h2>
      <p>Like all ${animalTypeLower}s, ${breedName}s can be prone to certain health conditions. Being aware of these helps you provide proactive care.</p>
      <ul>
        <li>Regular veterinary checkups for early detection of health issues</li>
        <li>Maintain a healthy weight through proper diet and exercise</li>
        <li>Keep vaccinations and preventive care up to date</li>
        <li>Monitor for breed-specific health conditions</li>
      </ul>

      <div class="warning-box">
        <h4>Health Screening</h4>
        <p>Work with your veterinarian to establish a health screening schedule appropriate for your ${breedName}'s age and risk factors. Early detection leads to better treatment outcomes.</p>
      </div>

      <h2>Care Requirements</h2>
      <p>Providing proper care ensures your ${breedName} stays healthy and happy throughout their life.</p>
      <ul>
        <li><strong>Nutrition:</strong> Feed a high-quality diet appropriate for your ${breedName}'s age, size, and activity level.</li>
        <li><strong>Exercise:</strong> Provide daily activity appropriate for this breed's energy level and physical capabilities.</li>
        <li><strong>Grooming:</strong> Maintain a regular grooming schedule to keep your ${breedName} clean and comfortable.</li>
        <li><strong>Environment:</strong> Create a safe, comfortable living space that meets your ${breedName}'s needs.</li>
      </ul>

      <section class="info-card">
        <h3>Ask Our AI About ${breedName}s</h3>
        <p>Have specific questions about ${breedName} health, care, or training? Our AI assistant can provide personalized guidance.</p>
        <div class="hero-actions">
          <a href="/chat" class="primary-btn">Ask the AI Now</a>
          <a href="${hubPage}" class="ghost-btn">Browse All ${hubName}</a>
        </div>
      </section>
    </article>

    <section class="transparency">
      <h3>Disclaimer</h3>
      <p>This breed guide provides general information about ${breedName}s. Individual ${animalTypeLower}s may vary. Always consult with veterinary professionals for specific guidance. This page may contain affiliate links.</p>
    </section>
  </main>
${buildFooterTemplate()}`;
}

function createGuidePage(guideName, slug) {
  const canonical = `${SITE}/guides/${slug}`;
  const cssPath = '../styles.css';
  const description = `${guideName}: comprehensive guide covering everything pet owners need to know. Expert advice from Pet Care Helper AI.`;

  const schema = `<script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Article","headline":"${escJsonStr(guideName)}","datePublished":"${TODAY}","dateModified":"${TODAY}","description":"${escJsonStr(description)}","author":{"@type":"Organization","name":"Pet Care Helper AI"},"publisher":{"@type":"Organization","name":"Pet Care Helper AI"}}
  </script>`;

  return `${buildHeadTemplate({ title: guideName, description, canonical, cssPath, extraHead: schema })}
${buildNavTemplate()}

  <main>
    <div class="breadcrumb">
      <a href="/">Home</a> <span>&rsaquo;</span>
      <a href="/guides">Guides</a> <span>&rsaquo;</span>
      ${guideName}
    </div>

    <article class="guide-content">
      <h1>${guideName}</h1>
      <p>${description}</p>

      <h2>Overview</h2>
      <p>This comprehensive guide covers everything pet owners need to know about ${guideName.toLowerCase()}. Whether you are a first-time pet owner or an experienced caretaker, understanding the key aspects of this topic will help you provide better care for your companion animal.</p>

      <h2>Key Information</h2>
      <ul>
        <li>Understanding the fundamentals helps you make informed decisions for your pet</li>
        <li>Every pet is unique, so consider your individual pet's needs alongside general guidance</li>
        <li>Consult your veterinarian for advice specific to your pet's health and situation</li>
        <li>Regular monitoring and preventive care are the foundation of good pet ownership</li>
      </ul>

      <h2>Practical Advice</h2>
      <p>Follow these evidence-based recommendations for the best outcomes:</p>
      <ul>
        <li>Schedule regular veterinary checkups for early detection of health issues</li>
        <li>Provide species-appropriate nutrition in proper amounts</li>
        <li>Ensure adequate exercise and mental stimulation</li>
        <li>Maintain a safe, clean environment</li>
        <li>Stay current on vaccinations and preventive medications</li>
      </ul>

      <h2>Frequently Asked Questions</h2>
      <h3>Where can I find more information?</h3>
      <p>Consult your veterinarian for personalized advice. Our AI assistant is also available 24/7 to answer pet care questions and provide guidance.</p>

      <section class="info-card">
        <h3>Have More Questions?</h3>
        <p>Our AI assistant provides personalized guidance for your specific pet care situation.</p>
        <div class="hero-actions">
          <a href="/chat" class="primary-btn">Talk to AI Pet Helper</a>
          <a href="/guides" class="ghost-btn">Browse All Guides</a>
        </div>
      </section>
    </article>

    <section class="transparency">
      <h3>Important Disclaimer</h3>
      <p>This guide provides general educational information and is not a substitute for professional veterinary advice. Always consult a qualified veterinarian for your pet's specific health needs.</p>
    </section>
  </main>
${buildFooterTemplate()}`;
}

function createMinimalPage(pageName, slug, canonical, cssPath) {
  const description = `${pageName} - Pet Care Helper AI resource page for pet owners.`;

  const schema = `<script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Article","headline":"${escJsonStr(pageName)}","datePublished":"${TODAY}","dateModified":"${TODAY}","description":"${escJsonStr(description)}","author":{"@type":"Organization","name":"Pet Care Helper AI"},"publisher":{"@type":"Organization","name":"Pet Care Helper AI"}}
  </script>`;

  return `${buildHeadTemplate({ title: pageName, description, canonical, cssPath, extraHead: schema })}
${buildNavTemplate()}

  <main>
    <div class="breadcrumb">
      <a href="/">Home</a> <span>&rsaquo;</span>
      ${pageName}
    </div>

    <article class="guide-content">
      <h1>${pageName}</h1>
      <p>${description}</p>

      <h2>Overview</h2>
      <p>Welcome to the ${pageName} page on Pet Care Helper AI. We provide comprehensive, AI-powered guidance for pet owners on all aspects of pet care including health, nutrition, training, and wellness.</p>

      <section class="info-card">
        <h3>Need Help?</h3>
        <p>Our AI assistant is available 24/7 to answer your pet care questions.</p>
        <div class="hero-actions">
          <a href="/chat" class="primary-btn">Talk to AI Pet Helper</a>
          <a href="/" class="ghost-btn">Go Home</a>
        </div>
      </section>
    </article>
  </main>
${buildFooterTemplate()}`;
}


// ============================================================
// PHASE 6: SITEMAP REGENERATION
// ============================================================

function runPhase6_SitemapRegeneration() {
  console.log('');
  console.log('='.repeat(60));
  console.log('PHASE 6: SITEMAP REGENERATION');
  console.log('='.repeat(60));

  const allFiles = getAllHtmlFiles();
  const urls = new Set();

  for (const filePath of allFiles) {
    const rel = relative(ROOT, filePath).replace(/\\/g, '/');

    // Exclude non-content directories
    if (rel.startsWith('node_modules/')) continue;
    if (rel.startsWith('.netlify/')) continue;
    if (rel.startsWith('.git/')) continue;
    if (rel.startsWith('embed/')) continue;

    // Exclude feed XML-like HTML pages (index pages in feeds are fine to skip)
    if (rel.startsWith('feeds/')) continue;

    const url = filePathToUrl(filePath);
    urls.add(url);
  }

  // Deduplicate and sort
  const sortedUrls = [...urls].sort();

  const legalPages = new Set(['/privacy-policy', '/terms-of-service']);
  const hubPages = new Set(['/', '/dogs', '/cats', '/birds', '/fish', '/reptiles', '/small-animals', '/chat', '/guides']);
  const infoPages = new Set(['/about', '/contact', '/faq', '/resources', '/partners', '/press-kit']);

  function getPriority(url) {
    if (url === '/') return '1.0';
    if (hubPages.has(url)) return '1.0';
    if (url.startsWith('/breeds/dogs') || url.startsWith('/breeds/cats') || url.startsWith('/breeds/birds') || url.startsWith('/breeds/fish') || url.startsWith('/breeds/reptiles') || url.startsWith('/breeds/small-animals')) {
      // Check if it's a directory index (hub)
      if (url.split('/').length <= 3) return '0.8';
      return '0.7';
    }
    if (url.startsWith('/guides/') || url.startsWith('/tools/') || url.startsWith('/locations/')) return '0.7';
    if (infoPages.has(url)) return '0.5';
    if (legalPages.has(url)) return '0.4';
    return '0.6';
  }

  function getChangefreq(url) {
    if (legalPages.has(url)) return 'monthly';
    return 'weekly';
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sortedUrls.map(url => {
    // Build canonical URL (no .html extension, consistent format)
    let canonical = SITE + url;
    // Homepage special case
    if (url === '/') canonical = SITE + '/';

    return `  <url>
    <loc>${canonical}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${getChangefreq(url)}</changefreq>
    <priority>${getPriority(url)}</priority>
  </url>`;
  }).join('\n')}
</urlset>`;

  writeFileSync(join(ROOT, 'sitemap.xml'), sitemapXml);
  console.log(`  Sitemap generated with ${sortedUrls.length} URLs`);
  return sortedUrls.length;
}


// ============================================================
// PHASE 7: QA SITE SCAN
// ============================================================

function runPhase7_QAScan() {
  console.log('');
  console.log('='.repeat(60));
  console.log('PHASE 7: QA SITE SCAN');
  console.log('='.repeat(60));

  const allFiles = getAllHtmlFiles();
  const totalFiles = allFiles.length;

  let withSchema = 0;
  let withSchemaDates = 0;
  let withOgTags = 0;
  let missingMetaDesc = 0;
  let missingCanonical = 0;
  let brokenLinksRemaining = 0;
  let missingMetaDescFiles = [];
  let missingCanonicalFiles = [];

  // Build fresh URL inventory for broken link check
  const existingUrls = new Set();
  for (const filePath of allFiles) {
    existingUrls.add(filePathToUrl(filePath));
  }
  // Add directory index variants
  for (const dir of ['tools', 'locations', 'feeds', 'resources']) {
    const indexPath = join(ROOT, dir, 'index.html');
    if (existsSync(indexPath)) {
      existingUrls.add(`/${dir}/`);
      existingUrls.add(`/${dir}`);
    }
  }

  const brokenTargets = new Set();

  for (const filePath of allFiles) {
    const html = readFileSync(filePath, 'utf8');
    const rel = relative(ROOT, filePath).replace(/\\/g, '/');

    // Schema check
    if (html.includes('application/ld+json')) {
      withSchema++;
      if (html.includes('"datePublished"') || html.includes("'datePublished'")) {
        withSchemaDates++;
      }
    }

    // OG check
    if (html.includes('og:title') && html.includes('og:description')) {
      withOgTags++;
    }

    // Meta description check
    if (!extractMetaDesc(html)) {
      missingMetaDesc++;
      missingMetaDescFiles.push(rel);
    }

    // Canonical check
    if (!extractCanonical(html)) {
      missingCanonical++;
      missingCanonicalFiles.push(rel);
    }

    // Broken internal links check
    const re = /href=["'](\/[^"'#?]*?)["']/g;
    let match;
    while ((match = re.exec(html)) !== null) {
      const target = match[1];
      if (target.startsWith('//')) continue;
      if (target === '/') continue;
      const normalizedTarget = target.replace(/\/$/, '');
      if (!existingUrls.has(target) && !existingUrls.has(normalizedTarget) && !existingUrls.has(normalizedTarget + '/') && urlToFilePath(normalizedTarget) === null) {
        brokenTargets.add(normalizedTarget);
      }
    }
  }

  // Count sitemap URLs
  let sitemapUrlCount = 0;
  const sitemapPath = join(ROOT, 'sitemap.xml');
  if (existsSync(sitemapPath)) {
    const sitemapContent = readFileSync(sitemapPath, 'utf8');
    sitemapUrlCount = (sitemapContent.match(/<url>/g) || []).length;
  }

  console.log('');
  console.log('  ---- QA SCAN RESULTS ----');
  console.log(`  Total HTML files:          ${totalFiles}`);
  console.log(`  Pages with schema:         ${withSchema} / ${totalFiles}`);
  console.log(`  Pages with schema dates:   ${withSchemaDates} / ${withSchema}`);
  console.log(`  Pages with OG tags:        ${withOgTags} / ${totalFiles}`);
  console.log(`  Missing meta description:  ${missingMetaDesc}`);
  if (missingMetaDescFiles.length > 0 && missingMetaDescFiles.length <= 10) {
    missingMetaDescFiles.forEach(f => console.log(`    - ${f}`));
  } else if (missingMetaDescFiles.length > 10) {
    missingMetaDescFiles.slice(0, 10).forEach(f => console.log(`    - ${f}`));
    console.log(`    ... and ${missingMetaDescFiles.length - 10} more`);
  }
  console.log(`  Missing canonical URL:     ${missingCanonical}`);
  if (missingCanonicalFiles.length > 0 && missingCanonicalFiles.length <= 10) {
    missingCanonicalFiles.forEach(f => console.log(`    - ${f}`));
  } else if (missingCanonicalFiles.length > 10) {
    missingCanonicalFiles.slice(0, 10).forEach(f => console.log(`    - ${f}`));
    console.log(`    ... and ${missingCanonicalFiles.length - 10} more`);
  }
  console.log(`  Remaining broken links:    ${brokenTargets.size}`);
  if (brokenTargets.size > 0 && brokenTargets.size <= 20) {
    [...brokenTargets].forEach(t => console.log(`    - ${t}`));
  } else if (brokenTargets.size > 20) {
    [...brokenTargets].slice(0, 20).forEach(t => console.log(`    - ${t}`));
    console.log(`    ... and ${brokenTargets.size - 20} more`);
  }
  console.log(`  Sitemap URLs:              ${sitemapUrlCount}`);
  console.log('  ---- END QA SCAN ----');

  return {
    totalFiles,
    withSchema,
    withSchemaDates,
    withOgTags,
    missingMetaDesc,
    missingCanonical,
    brokenTargets: brokenTargets.size,
    sitemapUrlCount
  };
}


// ============================================================
// MAIN EXECUTION
// ============================================================

console.log('');
console.log('#'.repeat(60));
console.log('#  PetCareHelperAI - Tier 1 Closeout Engine');
console.log(`#  Date: ${TODAY}`);
console.log(`#  Root: ${ROOT}`);
console.log('#'.repeat(60));

const startTime = Date.now();

// Phase 1
const phase1Result = runPhase1_ContentExpansion();

// Phase 2
const phase2Result = runPhase2_SchemaInjection();

// Phase 3
const phase3Result = runPhase3_SchemaDatesFix();

// Phase 4
const phase4Result = runPhase4_OpenGraphFix();

// Phase 5
const phase5Result = runPhase5_InternalLinkFix();

// Phase 6
const phase6Result = runPhase6_SitemapRegeneration();

// Phase 7
const phase7Result = runPhase7_QAScan();

const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

console.log('');
console.log('#'.repeat(60));
console.log('#  TIER 1 CLOSEOUT COMPLETE');
console.log('#'.repeat(60));
console.log(`  Phase 1 (Content Expansion):   ${phase1Result} pages expanded`);
console.log(`  Phase 2 (Schema Injection):    ${phase2Result} schemas injected`);
console.log(`  Phase 3 (Schema Dates Fix):    ${phase3Result} schemas fixed`);
console.log(`  Phase 4 (OpenGraph Fix):       ${phase4Result} pages fixed`);
console.log(`  Phase 5 (Internal Link Fix):   ${phase5Result} pages created`);
console.log(`  Phase 6 (Sitemap):             ${phase6Result} URLs in sitemap`);
console.log(`  Phase 7 (QA Scan):             Complete`);
console.log(`  Time elapsed:                  ${elapsed}s`);
console.log('#'.repeat(60));
