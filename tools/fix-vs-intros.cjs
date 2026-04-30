#!/usr/bin/env node
/*
 * Surgically replaces duplicate boilerplate intros and decision lists on
 * commercial /vs- comparison pages with breed-pair-specific copy.
 *
 * GSC was reporting "Crawled - currently not indexed" at 8.1K-page scale.
 * Investigation showed canonicals, robots.txt, sitemap, internal linking,
 * and HTTP statuses were all clean -- the actual cause was 898/1352 vs- pages
 * sharing one of 8 boilerplate intro paragraphs and 645 unique "Choose X If"
 * variants where the top 4 covered 634/1352 pages with breed-name-blind copy.
 *
 * This rewrites the intro and the two "Choose X If..." lists to mention the
 * specific breed pair, increasing page-level uniqueness without changing URL
 * structure, layout, design, or canonical handling.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', 'commercial');
const TODAY = new Date().toISOString().slice(0, 10);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.isFile() && entry.name.startsWith('vs-') && entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const SPECIES = {
  dogs: { singular: 'dog', plural: 'dogs', adopt: 'bring home' },
  cats: { singular: 'cat', plural: 'cats', adopt: 'bring home' },
  birds: { singular: 'bird', plural: 'birds', adopt: 'bring home' },
  reptiles: { singular: 'reptile', plural: 'reptiles', adopt: 'set up' },
  amphibians: { singular: 'amphibian', plural: 'amphibians', adopt: 'set up' },
  fish: { singular: 'fish', plural: 'fish', adopt: 'stock' },
  'marine-fish': { singular: 'marine fish', plural: 'marine fish', adopt: 'stock' },
  'small-animals': { singular: 'small pet', plural: 'small pets', adopt: 'bring home' }
};

const INTRO_TEMPLATES = [
  (a, b, sp) => `<p>Choosing between a ${a} and a ${b} comes down to four practical questions: which ${sp.singular}'s daily workload fits your weekly schedule, which temperament suits the household you actually live in, which long-term health trajectory your budget can absorb, and which of the two reflects the kind of ${sp.singular} you genuinely want to live with for the next decade. The comparison below works through each of those in turn — costs, exercise, grooming, training, health, and lifestyle fit — so the decision rests on lived constraints rather than first impressions.</p>\n      <p>Both the ${a} and the ${b} are well-documented breeds with clear ownership profiles, but the differences that matter for a real household are rarely the ones highlighted in breed marketing. The aim here is to surface the operationally meaningful gaps between the two so the right choice is obvious by the end.</p>`,
  (a, b, sp) => `<p>The ${a} and the ${b} are frequently shortlisted together, but the household experience of owning each one diverges sharply once you get past the first month. This comparison frames the decision around the levers that actually predict satisfaction: daily care load, temperament alignment, lifetime health and insurance costs, and the lifestyle each ${sp.singular} quietly assumes you have. Where one breed asks more from a particular dimension — say, exercise minutes per day or grooming complexity — that gap is called out explicitly rather than averaged away.</p>\n      <p>Read this with your own week in mind: pick the ${sp.singular} whose worst days are the ones you can still handle, not the one whose best days appeal most.</p>`,
  (a, b, sp) => `<p>${a} versus ${b} is a decision that rewards honest accounting more than enthusiasm. The two ${sp.plural} share enough surface similarity to look interchangeable, but their daily routines, training receptivity, and long-term health curves create meaningfully different ownership experiences. The comparison below maps those differences against the dimensions that drive real-world household fit — exercise minutes, training receptivity, grooming time, vet-visit frequency, and the implicit lifestyle assumptions each ${sp.singular} brings.</p>\n      <p>Use the side-by-side and the deeper sections together: the table answers "what is each ${sp.singular} like," and the prose answers "which one will you still be glad you chose three years in."</p>`,
  (a, b, sp) => `<p>The cleanest way to evaluate a ${a} against a ${b} is to ignore preference and start from constraints. How many hours of structured activity can the household reliably deliver each week? What is the realistic monthly ceiling for food, grooming, and routine vet care? Which temperament — the ${a}'s or the ${b}'s — fits the people who actually live in the home, and which one fits the home's noise tolerance, space, and stability? The sections that follow walk those constraints through cost, care, training, health, and decision summary so the answer falls out of the numbers instead of the marketing.</p>\n      <p>Neither ${sp.singular} is objectively the right pick; the right pick is the one whose demands you can meet on your worst week, not your best.</p>`,
  (a, b, sp) => `<p>Decision-makers comparing a ${a} with a ${b} usually start with appearance and end with regret about something operational — the exercise floor was higher than expected, the grooming bill kept climbing, or the temperament needed a different household rhythm. This comparison flips that order: it leads with the operational profile of each ${sp.singular} and treats appearance as a tiebreaker, not an input. Costs, exercise, grooming, training, health risks, and household fit are walked through with concrete numbers so the comparison rests on what you can actually plan for.</p>\n      <p>The ${a} and the ${b} both make excellent companions in the right home. The job here is to identify which home that is.</p>`,
  (a, b, sp) => `<p>Putting a ${a} next to a ${b} is most useful when the comparison is anchored to the household that has to live with the choice. The two ${sp.plural} score differently on the dimensions that drive day-to-day satisfaction — daily activity needs, training receptivity, grooming workload, predictable health concerns, and total cost of ownership — and those gaps tend to widen, not narrow, after the first few months. Below, each axis is examined with practical numbers so the decision survives contact with a real schedule and a real budget.</p>\n      <p>Treat the side-by-side as a screening tool and the long-form sections as confirmation: by the end, the ${sp.singular} that fits should be the obvious one rather than the louder one.</p>`
];

function pickTemplate(a, b) {
  const h = crypto.createHash('sha1').update(a + '|' + b).digest('hex');
  return INTRO_TEMPLATES[parseInt(h.slice(0, 4), 16) % INTRO_TEMPLATES.length];
}

function renderChoose(breed, otherBreed, sp, hash) {
  const variants = [
    [
      `Daily routines built around the ${breed}'s exercise and stimulation needs are sustainable in your week, not aspirational.`,
      `The temperament profile typical of the ${breed} matches the energy level the rest of the household is comfortable living with.`,
      `Lifetime health risks specific to the ${breed} fit your budget for preventive care, screening, and possible treatment.`,
      `Owning a ${breed} appeals more than owning a ${otherBreed} when you weigh emotional fit alongside the operational reality.`
    ],
    [
      `Your weekly schedule reliably absorbs the ${breed}'s exercise, training, and enrichment minimums — not just on good weeks.`,
      `The ${breed}'s social and behavioural baseline lines up with the people, kids, or other pets already in the home.`,
      `You can plan around the ${breed}'s known health predispositions without that planning crowding out other priorities.`,
      `Between a ${breed} and a ${otherBreed}, the ${breed} is the one you keep coming back to when you imagine the next ten years.`
    ],
    [
      `The ${breed}'s daily care load — exercise, grooming, mental stimulation — fits into the rhythm your household already has.`,
      `The temperament you want around dinner, on walks, and during stressful weeks is closer to the ${breed}'s than the ${otherBreed}'s.`,
      `You're prepared to fund the ${breed}'s typical insurance, screening, and preventive-care profile through senior years.`,
      `Your living space, neighborhood, and travel patterns suit a ${breed} better than they suit a ${otherBreed}.`
    ],
    [
      `Time, space, and budget all line up around what a ${breed} actually needs rather than what you hope it will need.`,
      `You already enjoy the kind of human-${sp.singular} interaction style the ${breed} is known for — the ${otherBreed}'s style would feel like a stretch.`,
      `The ${breed}'s long-term health outlook is one you can support with consistent preventive care and appropriate insurance.`,
      `When you imagine the household three years from now, the ${breed} fits the picture more naturally than the ${otherBreed}.`
    ]
  ];
  const idx = parseInt(hash.slice(0, 4), 16) % variants.length;
  return variants[idx].map((s) => `        <li>${s}</li>`).join('\n');
}

let stats = { total: 0, intro_replaced: 0, choose_replaced: 0, errors: 0, lastmod_bumped: 0 };

const files = walk(ROOT);
for (const file of files) {
  stats.total++;
  let html;
  try {
    html = fs.readFileSync(file, 'utf8');
  } catch (err) {
    stats.errors++;
    continue;
  }

  const h1m = html.match(/<h1[^>]*>([^<]+) vs ([^<]+?)(?::\s*Complete Comparison[^<]*)?<\/h1>/);
  if (!h1m) continue;
  const breedA = h1m[1].trim();
  const breedB = h1m[2].trim();

  const rel = path.relative(path.join(__dirname, '..'), file);
  const category = rel.split(path.sep)[1];
  const sp = SPECIES[category] || SPECIES.dogs;
  const hash = crypto.createHash('sha1').update(breedA + '|' + breedB).digest('hex');

  let changed = false;

  // Replace intro paragraph (single <p> after image div, before <h2>Side-by-Side Comparison</h2>)
  const introRe = /(<\/div>\s*\n\s*)<p>([^<]+)<\/p>(\s*\n\s*<h2>Side-by-Side Comparison<\/h2>)/;
  const im = html.match(introRe);
  if (im) {
    const tpl = pickTemplate(breedA, breedB);
    const newIntro = tpl(breedA, breedB, sp);
    html = html.replace(introRe, `$1${newIntro}$3`);
    stats.intro_replaced++;
    changed = true;
  }

  // Replace "Choose X If..." lists
  const chooseARe = new RegExp(
    `(<h2>Choose\\s+${breedA.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s+If\\.\\.\\.<\\/h2>\\s*<ul>)([\\s\\S]*?)(<\\/ul>)`
  );
  const chooseBRe = new RegExp(
    `(<h2>Choose\\s+${breedB.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s+If\\.\\.\\.<\\/h2>\\s*<ul>)([\\s\\S]*?)(<\\/ul>)`
  );
  if (chooseARe.test(html)) {
    html = html.replace(chooseARe, (_, a, _b, c) => `${a}\n${renderChoose(breedA, breedB, sp, hash)}\n      ${c}`);
    stats.choose_replaced++;
    changed = true;
  }
  if (chooseBRe.test(html)) {
    html = html.replace(chooseBRe, (_, a, _b, c) => `${a}\n${renderChoose(breedB, breedA, sp, hash.slice(8))}\n      ${c}`);
    changed = true;
  }

  if (!changed) continue;

  // Bump dateModified in JSON-LD
  const before = html;
  html = html.replace(/"dateModified":"[0-9]{4}-[0-9]{2}-[0-9]{2}"/, `"dateModified":"${TODAY}"`);
  if (html !== before) stats.lastmod_bumped++;

  fs.writeFileSync(file, html);
}

console.log(JSON.stringify(stats, null, 2));
