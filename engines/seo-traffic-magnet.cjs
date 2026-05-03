#!/usr/bin/env node
/**
 * SEO Traffic Magnet Upgrader
 *
 * Performs surgical upgrades across breed, commercial, and guide pages:
 *  - Stronger, CTR-friendly titles (title, og:title, twitter:title)
 *  - Sharper meta descriptions that satisfy modern search intent
 *  - High-intent info blocks ("What owners underestimate", reality-check)
 *  - Varied internal-linking anchors on related-guide grids
 *  - De-templating of phrases repeated verbatim across breed cohorts
 *
 * Hard constraints:
 *  - Never modifies <header>, <nav>, <footer>, or site styles
 *  - Never modifies chat.html or the AI chat block
 *  - Never removes existing ad scripts / divs
 *  - Idempotent: a second run does not duplicate upgrades
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const YEAR = '2026';

const counters = {
  breedTitle: 0,
  guideTitle: 0,
  commercialTitle: 0,
  metaDesc: 0,
  ogTitle: 0,
  ogDesc: 0,
  twitterTitle: 0,
  twitterDesc: 0,
  underestimateBox: 0,
  realityCheckBox: 0,
  relatedGuidesVaried: 0,
  humanizedParagraphs: 0,
  filesTouched: 0,
  filesScanned: 0,
};

/* ------------------------------- utilities ------------------------------- */

function hashInt(str, mod) {
  const h = crypto.createHash('md5').update(str).digest();
  return h.readUInt32BE(0) % mod;
}

function pick(arr, seed) {
  return arr[hashInt(seed, arr.length)];
}

function titleCase(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function article(noun) {
  return /^[aeiou]/i.test(noun) ? 'an' : 'a';
}

function replaceTag(html, regex, replacement) {
  let changed = false;
  const next = html.replace(regex, (...args) => {
    changed = true;
    return typeof replacement === 'function' ? replacement(...args) : replacement;
  });
  return { html: next, changed };
}

function setMeta(html, { title, metaDesc, ogTitle, ogDesc, twitterTitle, twitterDesc }) {
  let out = html;
  let hit = false;

  if (title) {
    const r = replaceTag(out, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
    if (r.changed) { out = r.html; counters.titleWritten = (counters.titleWritten || 0) + 1; hit = true; }
  }
  if (metaDesc) {
    const r = replaceTag(
      out,
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${esc(metaDesc)}">`
    );
    if (r.changed) { out = r.html; counters.metaDesc++; hit = true; }
  }
  if (ogTitle) {
    const r = replaceTag(
      out,
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:title" content="${esc(ogTitle)}" />`
    );
    if (r.changed) { out = r.html; counters.ogTitle++; hit = true; }
  }
  if (ogDesc) {
    const r = replaceTag(
      out,
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:description" content="${esc(ogDesc)}" />`
    );
    if (r.changed) { out = r.html; counters.ogDesc++; hit = true; }
  }
  if (twitterTitle) {
    const r = replaceTag(
      out,
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
      `<meta name="twitter:title" content="${esc(twitterTitle)}" />`
    );
    if (r.changed) { out = r.html; counters.twitterTitle++; hit = true; }
  }
  if (twitterDesc) {
    const r = replaceTag(
      out,
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="twitter:description" content="${esc(twitterDesc)}" />`
    );
    if (r.changed) { out = r.html; counters.twitterDesc++; hit = true; }
  }
  return { html: out, hit };
}

function clampLen(str, max) {
  if (str.length <= max) return str;
  const cut = str.slice(0, max - 1).replace(/\s+\S*$/, '');
  return cut + '…';
}

// HTML-entity encode for text nodes and for attribute values.
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ------------------------------- breed pages ------------------------------- */

// Species name for copy
const SPECIES_LABEL = {
  dogs: 'Dog',
  cats: 'Cat',
  birds: 'Bird',
  reptiles: 'Reptile',
  amphibians: 'Amphibian',
  fish: 'Fish',
  'marine-fish': 'Marine Fish',
  'small-animals': 'Small Pet',
};

function upgradeBreedPage(filePath, html) {
  // Derive species + slug + name
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const m = rel.match(/^breeds\/([a-z-]+)\/([a-z0-9-]+)\.html$/);
  if (!m) return html;
  const species = m[1];
  const slug = m[2];
  const name = titleCase(slug);

  // Pull lifespan + temperament from the quick-facts table if present so the
  // title/description can reflect real values and feel less generic.
  let lifespan = '';
  const lifeMatch = html.match(/<td>Lifespan<\/td><td>([^<]+)<\/td>/i);
  if (lifeMatch) lifespan = lifeMatch[1].trim();

  // Title angle rotated by slug hash to avoid identical patterns across cohort.
  const titleAngles = [
    `${name} Care Guide (${YEAR}): Cost, Lifespan, Health & Owner Tips`,
    `${name} (${YEAR}): Cost to Own, Health Issues, Lifespan & Real Owner Advice`,
    `${name} Complete Guide (${YEAR}): Temperament, Costs, Health & What to Expect`,
    `${name} Guide (${YEAR}): Monthly Cost, Health Red Flags & Owner Honest Take`,
    `${name} (${YEAR}) — First-Year Cost, Lifespan, Training & Owner Reality Check`,
  ];
  const titleCore = pick(titleAngles, slug + ':title');
  const title = `${titleCore} | Pet Care Helper AI`;

  const descAngles = [
    `${name} owners share the real first-year cost, monthly budget, lifespan${lifespan ? ` (${lifespan})` : ''}, common health issues, and the training mistakes most people make. Honest, vet-informed guide.`,
    `What it actually costs to own ${article(name).toLowerCase()} ${name}: monthly budget, vet bills, food, grooming, and the quirks first-time owners underestimate.`,
    `A practical ${name} guide: temperament, health issues to watch, lifespan${lifespan ? ` around ${lifespan}` : ''}, training difficulty, and whether this breed fits your life.`,
    `Everything new ${name} owners want to know: startup and monthly costs, health red flags, daily care, and when this breed is (and isn't) the right fit.`,
    `${name} facts that matter: yearly costs, lifespan, early health warning signs, grooming needs, and what owners wish they'd known in year one.`,
  ];
  const desc = clampLen(pick(descAngles, slug + ':desc'), 300);

  // Apply head changes
  let out = html;
  const metaResult = setMeta(out, {
    title,
    metaDesc: desc,
    ogTitle: titleCore,
    ogDesc: desc,
    twitterTitle: titleCore,
    twitterDesc: desc,
  });
  out = metaResult.html;
  if (metaResult.hit) counters.breedTitle++;

  // Insert "What Owners Often Underestimate" block after cost-of-ownership table
  if (!out.includes('what-owners-underestimate') && /<h2>Cost of Ownership<\/h2>/i.test(out)) {
    const underestAngles = [
      [
        'pet insurance waiting periods',
        'emergency vet visits in year one',
        'dental cleanings under anesthesia',
        'replacing chewed or outgrown gear',
        'boarding or pet-sitter costs when traveling',
      ],
      [
        'the real cost of unplanned vet visits',
        'annual dental work most owners skip',
        'prescription food after a health issue',
        'grooming frequency and professional fees',
        'training classes when early habits slip',
      ],
      [
        'emergency savings most new owners skip',
        'how fast a single ER visit eats a year of savings',
        'gear that needs replacing within 12 months',
        'flea, tick, and heartworm prevention year-round',
        'pet-deposit and insurance premiums when renting',
      ],
    ];
    const chosen = pick(underestAngles, slug + ':underest');
    const block = `
      <aside class="what-owners-underestimate" style="margin:24px 0;padding:18px 20px;border-left:4px solid #F59E0B;background:#FFFBEB;border-radius:6px;">
        <h3 style="margin-top:0;">What New ${name} Owners Often Underestimate</h3>
        <p>First-year ${name} budgets regularly miss the costs below. None of them are deal-breakers, but budgeting for them early prevents stressful financial decisions at the vet.</p>
        <ul>
          ${chosen.map((c) => `<li>${c}</li>`).join('\n          ')}
        </ul>
        <p style="margin-bottom:0;">A realistic year-one cushion of a few hundred dollars above the headline numbers covers most of these without disrupting routine care.</p>
      </aside>
`;
    // Insert after the cost table — safest anchor is the closing </table> right after "Total Annual Cost"
    const insertRe = /(<tr><td><strong>Total Annual Cost<\/strong><\/td><td><strong>[^<]+<\/strong><\/td><\/tr>\s*<\/table>)/;
    if (insertRe.test(out)) {
      out = out.replace(insertRe, (m) => m + '\n' + block);
      counters.underestimateBox++;
    }
  }

  // Vary "Related Health & Care Guides" anchor language (only if still default)
  if (/<h2>Related Health &amp; Care Guides<\/h2>\s*<p>Few checklists for a/.test(out)) {
    const variants = [
      `Practical next reads for every ${name} owner — chosen to answer the questions that come up most in the first year.`,
      `If you live with ${article(name).toLowerCase()} ${name}, these are the pages worth bookmarking before a problem shows up at the vet.`,
      `The guides below cover the health, cost, and care topics ${name} owners search for most often after they bring the dog home.`,
      `Short, specific follow-ups for ${name} households — each answers one question a new owner usually asks in the first six months.`,
      `Most ${name} owners hit these topics eventually. Reading them before they become urgent saves money and stress.`,
    ];
    out = out.replace(
      /<h2>Related Health &amp; Care Guides<\/h2>\s*<p>Few checklists for a [^<]*<\/p>/,
      `<h2>Related Health &amp; Care Guides</h2>\n      <p>${pick(variants, slug + ':related')}</p>`
    );
    counters.relatedGuidesVaried++;
  }

  // Replace weak templated filler paragraphs with varied copy (only if unchanged).
  // Pattern 1: "No two X eat, digest, or thrive identically..."
  const noTwoRe = new RegExp(
    `<p>No two ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} eat, digest, or thrive identically; a veterinarian can personalize the plan beyond what any article can\\.<\\/p>`
  );
  if (noTwoRe.test(out)) {
    const alt = [
      `<p>Every ${name} is a little different — body condition, gut tolerance, and activity level shift the right plan. Treat any general advice as a starting point your vet can tune to your individual dog.</p>`,
      `<p>Two ${name} from the same litter can need different food, different portions, and different routines. Use general guidance as a draft and let your vet refine it around your dog's bloodwork and body condition.</p>`,
      `<p>Breed averages are a rough map, not the territory. Your ${name}'s weight, energy, and how it recovers from effort tell you more about what to adjust than any article can.</p>`,
    ];
    out = out.replace(noTwoRe, pick(alt, slug + ':notwo'));
    counters.humanizedParagraphs++;
  }

  // Pattern 2: "It's easy to postpone a vet visit..."
  const vetVisitRe = new RegExp(
    `<p>It's easy to postpone a vet visit when your ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} appears healthy, but that reasoning misses how quietly many issues develop\\. Regular checkups catch problems early, when they're easier and less costly to address\\.<\\/p>`
  );
  if (vetVisitRe.test(out)) {
    const alt = [
      `<p>Skipping an annual checkup because your ${name} "seems fine" is the most common way expensive problems get missed. Most conditions this breed is prone to develop quietly — the vet notices before you do.</p>`,
      `<p>It's tempting to delay a vet visit when your ${name} looks healthy, but several of the breed's common issues are early-warning-sign problems. A 20-minute wellness exam catches things months before they show up at home.</p>`,
      `<p>Healthy behavior at home is not the same as a clean bill of health. Your ${name}'s exam each year is mostly about catching the slow shifts — weight, joint, cardiac, dental — that would otherwise hide until they're urgent.</p>`,
    ];
    out = out.replace(vetVisitRe, pick(alt, slug + ':vet'));
    counters.humanizedParagraphs++;
  }

  // Pattern 3: "Staying ahead of health concerns with your X starts with..."
  const aheadRe = new RegExp(
    `<p>Staying ahead of health concerns with your ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} starts with building a consistent relationship with a qualified veterinarian\\.[^<]*<\\/p>`
  );
  if (aheadRe.test(out)) {
    const alt = [
      `<p>The most useful health habit a ${name} owner can build is a relationship with one specific veterinary practice that knows your dog. Continuity across visits catches subtle weight, dental, and organ changes that a one-off exam cannot.</p>`,
      `<p>Preventive care pays off most when the same clinic sees your ${name} year after year. Trends in weight, bloodwork, and behavior only make sense when someone has a baseline to compare against.</p>`,
      `<p>A reliable baseline is what makes ${name} wellness care actually work. Consistent record-keeping — at home and at your vet — turns small, boring data points into early warnings that save money and discomfort later.</p>`,
    ];
    out = out.replace(aheadRe, pick(alt, slug + ':ahead'));
    counters.humanizedParagraphs++;
  }

  // Pattern 4: "Welcoming an X means adjusting your lifestyle..."
  const welcomingRe = new RegExp(
    `<p>Welcoming an? ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} means adjusting your lifestyle, not just adding a pet\\.[^<]*<\\/p>`
  );
  if (welcomingRe.test(out)) {
    const alt = [
      `<p>The honest way to read this guide: ${article(name)} ${name} is less a pet you add to your life and more a routine your life reshapes around. The owners who thrive with this breed usually expect that reshape before it happens.</p>`,
      `<p>Owning ${article(name)} ${name} does not slot neatly into an existing routine — your schedule flexes around feeding, exercise, and downtime the animal actually needs. People who plan for that live well with the breed; people who don't tend to struggle.</p>`,
      `<p>Bringing home ${article(name)} ${name} is a structural change to your week, not just a lifestyle flourish. Budget, time, and energy all shift, and the households that anticipate that tend to be the happiest long term.</p>`,
    ];
    out = out.replace(welcomingRe, pick(alt, slug + ':welcome'));
    counters.humanizedParagraphs++;
  }

  return out;
}

/* ------------------------------- guide pages ------------------------------- */

// Classify a guide by filename suffix. Returns { type, subject } or null.
function classifyGuide(fileName) {
  const base = fileName.replace(/\.html$/, '');
  const patterns = [
    ['cost-of-ownership',     'cost'],
    ['pet-insurance',         'insurance'],
    ['grooming-guide',        'grooming'],
    ['lifespan-guide',        'lifespan'],
    ['puppy-guide',           'puppy'],
    ['with-kids',             'kids'],
    ['apartment-living',      'apartment'],
    ['shedding-guide',        'shedding'],
    ['exercise-guide',        'exercise'],
    ['indoor-guide',          'indoor'],
    ['health-guide',          'health'],
    ['temperament',           'temperament'],
    ['health-issues',         'healthissues'],
    ['lifespan',              'lifespan'],
  ];
  for (const [suffix, type] of patterns) {
    const tail = '-' + suffix;
    if (base.endsWith(tail)) {
      const subject = titleCase(base.slice(0, -tail.length));
      return { type, subject };
    }
  }
  if (/^adopt-a-/.test(base)) {
    return { type: 'adopt', subject: titleCase(base.replace(/^adopt-a-/, '')) };
  }
  const vsMatch = base.match(/^(.+)-vs-(.+)$/);
  if (vsMatch) {
    return { type: 'vs', subject: titleCase(vsMatch[1]), subject2: titleCase(vsMatch[2]) };
  }
  return null;
}

function guideTemplates(type, subject, subject2) {
  const S = subject;
  const a = article(S);
  const base = {
    cost: {
      title: `${S} Cost to Own (${YEAR}): First-Year, Monthly, Vet, Food & Insurance Breakdown`,
      desc:  `The real cost of owning ${a} ${S}: startup spend, monthly budget, vet and food numbers, insurance ranges, and the hidden costs most first-year owners miss.`,
    },
    insurance: {
      title: `Best Pet Insurance for ${S} (${YEAR}): Coverage That Actually Matters`,
      desc:  `Which pet insurance plans are worth it for ${a} ${S}? Breed-specific conditions to look for, waiting-period traps, reimbursement tiers, and honest cost ranges.`,
    },
    grooming: {
      title: `${S} Grooming Guide: Coat Care, Frequency & Mistakes to Avoid`,
      desc:  `Practical ${S} grooming: brushing cadence, bathing rhythm, paw and ear care, professional fees, and the mistakes owners make that cost them a full restart.`,
    },
    lifespan: {
      title: `${S} Lifespan: Average Age, Health Red Flags & How to Help Them Live Longer`,
      desc:  `How long do ${S}s live, what shortens that number in practice, and the specific habits owners can change — diet, weight, screening — to stretch the healthy years.`,
    },
    puppy: {
      title: `${S} Puppy Guide: First-Year Milestones, Costs & What Most Owners Underestimate`,
      desc:  `A week-by-week ${S} puppy plan: feeding, vaccines, socialization windows, training wins and misses, and the first-year costs that catch new owners off guard.`,
    },
    kids: {
      title: `${S} with Kids: Family Suitability, Safety & What to Know First`,
      desc:  `Is ${a} ${S} a good family pet? Temperament around kids, ages it handles best, household rules that actually work, and the warning signs to take seriously.`,
    },
    apartment: {
      title: `Is a ${S} Apartment-Friendly? Space, Noise & an Honest Owner Reality Check`,
      desc:  `${S} in an apartment: real space needs, noise profile, exercise minimums, neighbor-proof training tips, and whether this breed genuinely fits small-space living.`,
    },
    shedding: {
      title: `${S} Shedding: How Much, When & How to Manage It at Home`,
      desc:  `How much ${S}s shed, the seasonal peaks, the tools that actually help, and allergy realities for households deciding whether the coat is a dealbreaker.`,
    },
    exercise: {
      title: `${S} Exercise Needs: Daily Minutes, Activities & Common Owner Mistakes`,
      desc:  `How much exercise ${a} ${S} really needs — daily minutes, the right kind of activity, signs of under- and over-exercising, and the mistakes that cause behavior issues.`,
    },
    indoor: {
      title: `${S} Indoor Care Guide: Space, Enrichment & Keeping Behavior Healthy`,
      desc:  `How to keep ${a} ${S} happy and well-behaved indoors: enrichment that works, space setup, scratching and chewing outlets, and the signs of boredom to act on.`,
    },
    health: {
      title: `${S} Health Guide: Common Issues, Vet Costs & Warning Signs to Know`,
      desc:  `A plain-English ${S} health guide: breed-specific risks, what early warning signs look like, typical vet costs, and the screenings worth doing before symptoms start.`,
    },
    temperament: {
      title: `${S} Temperament: Personality Traits New Owners Should Expect`,
      desc:  `What ${S} temperament is actually like day to day: energy, social patterns, training realities, quirks new owners should expect, and the traits that surprise people.`,
    },
    healthissues: {
      title: `${S} Health Issues: Common Conditions, Early Warning Signs & Vet Costs`,
      desc:  `The conditions ${S}s are prone to, how each one shows up early, what typical treatment costs look like, and which screenings give the best return.`,
    },
    adopt: {
      title: `How to Adopt a ${S}: Costs, Red Flags & What to Know First`,
      desc:  `Adopting ${a} ${S}: rescue vs. shelter vs. breeder, adoption fees, questions to ask, red flags at a facility, and how to prepare your home for a smooth first month.`,
    },
    vs: {
      title: `${S} vs ${subject2 || ''}: Cost, Temperament & Which One Is the Better Fit`,
      desc:  `${S} vs ${subject2 || ''} compared honestly — size, cost, energy, training, health risks, and the lifestyle each breed actually rewards. Which is right for you?`,
    },
  };
  return base[type] || null;
}

function upgradeGuidePage(filePath, html) {
  const fileName = path.basename(filePath);
  const classified = classifyGuide(fileName);
  if (!classified) return html;

  const tpl = guideTemplates(classified.type, classified.subject, classified.subject2);
  if (!tpl) return html;

  const slug = fileName.replace(/\.html$/, '');
  // Don't stomp a title that already matches our new format exactly.
  const existingTitle = (html.match(/<title>([^<]*)<\/title>/) || [,''])[1];
  const newTitle = `${tpl.title} | Pet Care Helper AI`;
  if (existingTitle === esc(newTitle)) return html; // idempotent

  const desc = clampLen(tpl.desc, 300);

  let out = html;
  const result = setMeta(out, {
    title: newTitle,
    metaDesc: desc,
    ogTitle: tpl.title,
    ogDesc: desc,
    twitterTitle: tpl.title,
    twitterDesc: desc,
  });
  out = result.html;
  if (result.hit) counters.guideTitle++;

  return out;
}

/* ------------------------------- commercial pages ------------------------------- */

function upgradeCommercialPage(filePath, html) {
  // File shape: /commercial/<species>/<breed>/<kind>.html
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const m = rel.match(/^commercial\/([a-z-]+)\/([a-z0-9-]+)\/([a-z-]+)\.html$/);
  if (!m) return html;
  const [, speciesGroup, breedSlug, kind] = m;
  const breed = titleCase(breedSlug);
  const speciesCopy = {
    dogs: {
      first: 'first dog',
      habitatTitle: 'Best Crate & Space Size',
      habitatDesc: 'crates, beds, and living space',
    },
    cats: {
      first: 'first cat',
      habitatTitle: 'Best Indoor Space & Setup',
      habitatDesc: 'litter boxes, scratchers, resting areas, and living space',
    },
    birds: {
      first: 'first bird',
      habitatTitle: 'Best Cage & Room Setup',
      habitatDesc: 'cages, perches, supervised out-of-cage space, and enrichment',
    },
    fish: {
      first: 'first aquarium species',
      habitatTitle: 'Best Tank & Setup Size',
      habitatDesc: 'tank volume, filtration, aquascaping, and maintenance access',
    },
    'marine-fish': {
      first: 'first saltwater aquarium species',
      habitatTitle: 'Best Saltwater Tank & Setup Size',
      habitatDesc: 'tank volume, filtration, reef-safe layout, and maintenance access',
    },
    reptiles: {
      first: 'first reptile',
      habitatTitle: 'Best Enclosure & Setup Size',
      habitatDesc: 'enclosure size, heat gradients, hides, substrate, and lighting',
    },
    amphibians: {
      first: 'first amphibian',
      habitatTitle: 'Best Habitat & Setup Size',
      habitatDesc: 'habitat size, humidity, substrate, water quality, and hides',
    },
    'small-animals': {
      first: 'first small pet',
      habitatTitle: 'Best Cage, Enclosure & Space Size',
      habitatDesc: 'cages or enclosures, bedding, exercise space, and enrichment',
    },
  };
  const copy = speciesCopy[speciesGroup] || speciesCopy.dogs;

  const titles = {
    'best-food': {
      title: `Best Food for ${breed} (${YEAR}): Vet-Reviewed Picks, Costs & What to Avoid`,
      desc:  `Which foods genuinely work for ${article(breed)} ${breed}: vet-informed picks, ingredient red flags, dry-vs-fresh tradeoffs, and what the best brands cost monthly.`,
    },
    'best-insurance': {
      title: `Best Pet Insurance for ${breed} (${YEAR}): What Coverage Actually Matters`,
      desc:  `Honest ${breed} pet insurance comparison: breed-specific conditions to cover, reimbursement tiers worth paying for, waiting-period traps, and typical monthly premiums.`,
    },
    'cost-to-own': {
      title: `${breed} Cost to Own (${YEAR}): First-Year, Monthly & Lifetime Budget`,
      desc:  `What owning ${article(breed)} ${breed} really costs — startup spend, monthly recurring costs, vet and insurance ranges, and the hidden expenses owners miss.`,
    },
    'health-costs': {
      title: `${breed} Health Costs (${YEAR}): Vet Bills, Screenings & Common Conditions`,
      desc:  `What ${breed} owners actually pay for vet care, screenings, and breed-prone conditions — from routine exams to the ER visits most owners don't budget for.`,
    },
    'first-time-owners': {
      title: `Is a ${breed} Good for First-Time Owners? (${YEAR}) — Honest Answer`,
      desc:  `Whether ${article(breed)} ${breed} is a realistic ${copy.first}: care difficulty, time commitment, household fit, and the traits that trip up new owners.`,
    },
    'best-habitat-size': {
      title: `${copy.habitatTitle} for ${breed}: Measurements, Setup & Mistakes`,
      desc:  `How to size ${copy.habitatDesc} for ${article(breed)} ${breed} — measurements that actually fit, setup tips, and common sizing mistakes.`,
    },
    'best-enrichment': {
      title: `Best Toys & Enrichment for ${breed} (${YEAR}): What Actually Keeps Them Happy`,
      desc:  `Enrichment that works for ${breed}s: toys worth buying, puzzles that hold attention, chewers that last, and the signs of boredom to act on fast.`,
    },
  };

  // vs-<other> pattern
  if (/^vs-/.test(kind)) {
    const other = titleCase(kind.slice(3));
    const tpl = {
      title: `${breed} vs ${other}: Cost, Temperament, Training & Which Fits You Better`,
      desc:  `${breed} vs ${other} compared honestly: size, training, exercise, health risks, monthly cost, and the lifestyle each breed actually rewards.`,
    };
    const res = setMeta(html, {
      title: `${tpl.title} | Pet Care Helper AI`,
      metaDesc: clampLen(tpl.desc, 300),
      ogTitle: tpl.title,
      ogDesc: clampLen(tpl.desc, 300),
      twitterTitle: tpl.title,
      twitterDesc: clampLen(tpl.desc, 300),
    });
    if (res.hit) counters.commercialTitle++;
    return res.html;
  }

  const tpl = titles[kind];
  if (!tpl) return html;
  const res = setMeta(html, {
    title: `${tpl.title} | Pet Care Helper AI`,
    metaDesc: clampLen(tpl.desc, 300),
    ogTitle: tpl.title,
    ogDesc: clampLen(tpl.desc, 300),
    twitterTitle: tpl.title,
    twitterDesc: clampLen(tpl.desc, 300),
  });
  if (res.hit) counters.commercialTitle++;
  return res.html;
}

/* ------------------------------- driver ------------------------------- */

function walk(dir, ext, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, ext, out);
    else if (entry.isFile() && entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

function processFile(filePath, upgrader) {
  counters.filesScanned++;
  const original = fs.readFileSync(filePath, 'utf8');
  // Safety: never touch the chat page
  if (filePath.endsWith('/chat.html')) return;
  // Safety: never touch files without a standard <head>/<body> structure
  if (!/<head>/.test(original) || !/<body/i.test(original)) return;

  const updated = upgrader(filePath, original);
  if (updated !== original) {
    fs.writeFileSync(filePath, updated);
    counters.filesTouched++;
  }
}

function main() {
  const breedFiles = walk(path.join(ROOT, 'breeds'), '.html');
  const commercialFiles = walk(path.join(ROOT, 'commercial'), '.html');
  const guideFiles = walk(path.join(ROOT, 'guides'), '.html');

  console.log(`Scanning ${breedFiles.length} breed pages…`);
  breedFiles.forEach((f) => processFile(f, upgradeBreedPage));

  console.log(`Scanning ${commercialFiles.length} commercial pages…`);
  commercialFiles.forEach((f) => processFile(f, upgradeCommercialPage));

  console.log(`Scanning ${guideFiles.length} guide pages…`);
  guideFiles.forEach((f) => processFile(f, upgradeGuidePage));

  console.log('\n=== Traffic Magnet Upgrade Summary ===');
  Object.entries(counters).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
}

if (require.main === module) main();
