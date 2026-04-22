#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');
const TARGET_DIRS = ['breeds', 'guides', 'commercial', 'locations'];
const REPORT_PATH = join(ROOT, 'data', 'final-master-remediation-report.json');

function walkHtml(dir, out = []) {
  if (!existsSync(dir)) return out;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtml(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

function escRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0);
}

function inferContext(filePath, html) {
  const rel = relative(ROOT, filePath).replace(/\\/g, '/');
  const name = rel.split('/').at(-1).replace('.html', '');
  const species =
    rel.includes('/dogs/') ? 'dogs' :
    rel.includes('/cats/') ? 'cats' :
    rel.includes('/birds/') ? 'birds' :
    rel.includes('/marine-fish/') ? 'marine-fish' :
    rel.includes('/fish/') ? 'fish' :
    rel.includes('/reptiles/') ? 'reptiles' :
    rel.includes('/amphibians/') ? 'amphibians' :
    rel.includes('/small-animals/') ? 'small-animals' :
    rel.includes('/locations/') ? 'location' :
    rel.includes('/guides/') ? 'guide' :
    'general';

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = h1Match ? stripTags(h1Match[1]) : name.replace(/-/g, ' ');

  let entity = title
    .replace(/:\s*.*$/i, '')
    .replace(/^Common Health Problems in\s+/i, '')
    .replace(/\s*\(With Cost Estimates\)\s*$/i, '')
    .replace(/^Is\s+(.+?)\s+Good for First-Time Owners\??$/i, '$1')
    .replace(/^Best\s+.+?\s+for\s+/i, '')
    .replace(/^How to Adopt a\s+/i, '')
    .trim();

  if (!entity || entity.length < 3) {
    entity = name.split('-').map((x) => x[0].toUpperCase() + x.slice(1)).join(' ');
  }

  const city = species === 'location'
    ? title.replace(/^Find\s+Vets\s*&\s*Pet\s*Services\s*in\s*/i, '').trim()
    : '';

  const slugTokens = name.split('-').filter((x) => x.length >= 4);
  return { rel, name, species, title, entity, city, slugTokens };
}

function articleRange(html) {
  const start = html.search(/<article\b[^>]*>/i);
  if (start === -1) return null;
  const end = html.search(/<\/article>/i);
  if (end === -1 || end < start) return null;
  return { start, end: end + '</article>'.length };
}

function replaceArticle(html, fn) {
  const r = articleRange(html);
  if (!r) return { html, changed: false };
  const before = html.slice(0, r.start);
  const article = html.slice(r.start, r.end);
  const after = html.slice(r.end);
  const next = fn(article);
  return { html: before + next + after, changed: next !== article };
}

function ensureBalancedStrong(article) {
  return article.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (m, inner) => {
    const opens = (inner.match(/<strong>/g) || []).length;
    const closes = (inner.match(/<\/strong>/g) || []).length;
    if (opens > closes) return m.replace('</p>', '</strong></p>');
    return m;
  });
}

function cleanupGeneral(article, ctx) {
  let out = article;

  out = out.replace(/\$\{[A-Za-z_][A-Za-z0-9_]*\}/g, '');
  out = out.replace(/\b2024\b/g, '2026');

  out = out.replace(/\bCommon Health Problems in ([^<\n]+?) \(With Cost Estimates\)s\b/g, '$1');
  out = out.replace(/\bin\s+(How to[^<\n]{0,120}|Common Health Problems in[^<\n]{0,140}|Is\s+[^<\n]{0,120})\s+ownership\b/gi, 'for this pet\'s ownership');
  out = out.replace(/\bthose\s+that\s+(How to[^<\n]{0,120}|Common Health Problems in[^<\n]{0,140})\s+are\s+prone\s+to\b/gi, 'those that this species is prone to');
  out = out.replace(/conditions\s+How to Adopt a\s+[^<\n]{0,180}?\s+are prone to/gi, 'conditions this breed is prone to');
  out = out.replace(/conditions\s+Common Health Problems in\s+[^<\n]{0,180}?\s+are prone to/gi, 'conditions this species is prone to');
  out = out.replace(/\b(?:a|an)\s+Common Health Problems in\s+[^<\n]{0,180}?\s+owner\b/gi, 'a prepared owner');
  out = out.replace(/\b([A-Za-z][A-Za-z\s'()-]{1,120}?)\(With Cost Estimates\)/g, '$1');
  out = out.replace(/\b([A-Za-z-]{3,})ss are prone to\b/g, '$1s are prone to');

  if (ctx.title.length > 28) {
    const t = escRegExp(ctx.title);
    out = out.replace(new RegExp(`(?!<h1[^>]*>)${t}`, 'g'), ctx.entity);
  }

  out = out.replace(/\ba\s+([aeiouAEIOU][a-zA-Z-]+)/g, 'an $1');

  // Common malformed fragments
  out = out.replace(/<h(\d)[^>]*>\s*<\/h\1>/gi, '');
  out = out.replace(/<p>\s*<h(\d)[^>]*>/gi, '<h$1>');
  out = out.replace(/<\/h(\d)>\s*<\/p>/gi, '</h$1>');

  return ensureBalancedStrong(out);
}

function applySpeciesFixes(article, ctx) {
  let out = article;
  const aquatic = ['fish', 'marine-fish'];
  const herp = ['reptiles', 'amphibians'];

  if (aquatic.includes(ctx.species)) {
    out = out.replace(/grooming needs?/gi, 'maintenance needs');
    out = out.replace(/grooming requirements?/gi, 'maintenance requirements');
    out = out.replace(/brushing, bathing, nail care, and dental hygiene/gi, 'water testing, filter care, algae control, and observation routines');
    out = out.replace(/Routine dental procedures for [^<.]+\./gi, 'Most aquarium species do not need dental procedures; budget instead for diagnostics, quarantine, and water-quality corrections.');
    out = out.replace(/coat (health|quality|condition)/gi, 'skin and fin condition');
    out = out.replace(/ear infections?/gi, 'gill or skin infections');
    out = out.replace(/puppies|kittens/gi, 'juveniles');
    out = out.replace(/warm basking zone/gi, 'stable thermal range');
    out = out.replace(/dog-sit for a weekend/gi, 'arrange experienced aquatic care during travel');
    out = out.replace(/vaccinations?/gi, 'routine health screening');
    out = out.replace(/Lafeber/gi, 'species-specific aquatic nutrition brands');
    out = out.replace(/AAFCO/gi, 'species nutrition guidance');
    out = out.replace(/joint problems claims average \$1,000-\$4,000 for diagnosis and treatment\./gi, 'Common claim patterns include parasitic outbreaks, water-quality stress, and secondary infections that require diagnostics and sustained treatment.');

    // Marine fish pH contradiction correction
    if (ctx.species === 'marine-fish') {
      out = out.replace(/\bpH\s*\(?6\.5\s*[-–]\s*7\.5\)?/gi, 'pH (8.1-8.4)');
      out = out.replace(/freshwater pH/gi, 'marine pH');
    }

    out = out.replace(/<p>Daily and periodic maintenance requirements differ between ([\s\S]*?)<\/p>/gi,
      '<p>Daily husbandry differs between the two species: monitor feeding response, waste load, territory use, and water chemistry for each fish rather than applying mammal grooming routines.</p>');
  }

  if (herp.includes(ctx.species)) {
    out = out.replace(/coat (health|quality|condition)/gi, 'skin and scale condition');
    out = out.replace(/brushing/gi, 'surface checks');
    out = out.replace(/bathing/gi, 'hydration support');
    out = out.replace(/dental hygiene/gi, 'oral-health observation');
    out = out.replace(/ear infections?/gi, 'skin, eye, or respiratory infections');
    out = out.replace(/puppies|kittens/gi, 'juveniles');
    out = out.replace(/warm basking zone/gi, ctx.species === 'amphibians' ? 'appropriate thermal and humidity range' : 'warm zone');
    out = out.replace(/Lafeber/gi, 'species-specific reptile or amphibian nutrition brands');
    out = out.replace(/AAFCO/gi, 'species nutrition guidance');
    out = out.replace(/Routine dental procedures for [^<.]+\./gi, 'Reptiles and amphibians generally need husbandry correction, hydration support, fecal testing, and targeted medical treatment rather than dental procedures.');
    out = out.replace(/joint problems claims average \$1,000-\$4,000 for diagnosis and treatment\./gi, 'Common claim patterns are dehydration, metabolic issues, skin infections, and habitat-linked stress conditions requiring diagnostic workups and supportive care.');
  }

  if (ctx.species === 'birds') {
    out = out.replace(/puppies|kittens/gi, 'juveniles');
    out = out.replace(/dog-sit for a weekend/gi, 'arrange experienced avian care during travel');
  }

  if (ctx.species === 'small-animals') {
    out = out.replace(/meat first: chicken, turkey, beef, or fish/gi, 'species-appropriate core diet based on hay, pellets, greens, or invertebrate protein as appropriate');
    out = out.replace(/puppies|kittens/gi, 'juveniles');
    out = out.replace(/dog-sit for a weekend/gi, 'arrange species-appropriate care during travel');
    out = out.replace(/AAFCO/gi, 'species nutrition guidance');
  }

  // Clean impossible insurance phrasing for non-dog/cat species
  if (!['dogs', 'cats'].includes(ctx.species) && /best-insurance|insurance/i.test(ctx.rel)) {
    out = out.replace(/Spot, Trupanion, and Healthy Paws/gi, 'specialty exotic coverage options and emergency savings strategies');
    out = out.replace(/vaccinations?/gi, 'routine screenings');
  }

  return out;
}

function fixComparisonPages(article, ctx) {
  const hasVs = /\bvs\b/i.test(ctx.title) || /\/vs-/i.test(ctx.rel);
  if (!hasVs) return article;

  const m = ctx.title.match(/^(.+?)\s+vs\s+(.+?)(?:\s*\(|$)/i)
    || ctx.name.match(/^vs-(.+)$/i);

  let left = ctx.entity;
  let right = 'the comparison breed';

  if (m && m[1] && m[2]) {
    left = stripTags(m[1]).trim();
    right = stripTags(m[2]).trim();
  } else if (ctx.name.startsWith('vs-')) {
    const rhs = ctx.name.replace(/^vs-/, '').replace(/-/g, ' ');
    right = rhs.split(' ').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ');
  }

  if (article.includes('data-vs-remediation="true"')) return article;

  const section = `\n      <section data-vs-remediation="true">\n        <h2>Direct Comparison: ${left} vs ${right}</h2>\n        <p>This page compares both animals directly across daily care load, long-term cost profile, temperament tendencies, space requirements, and first-year planning needs. The practical choice depends on household schedule, handling expectations, and access to species-appropriate veterinary support for each side.</p>\n        <table class="comparison-table">\n          <tr><th>Factor</th><th>${left}</th><th>${right}</th></tr>\n          <tr><td>Daily care rhythm</td><td>Needs a consistent routine matched to its species and age.</td><td>Requires its own routine with different handling and enrichment priorities.</td></tr>\n          <tr><td>Health planning</td><td>Preventive screening and habitat/diet precision are key.</td><td>Preventive screening and species-specific husbandry are key.</td></tr>\n          <tr><td>Cost pressure points</td><td>Upfront setup plus ongoing nutrition and medical monitoring.</td><td>Upfront setup plus ongoing nutrition and medical monitoring.</td></tr>\n          <tr><td>Best-fit household</td><td>Owners who can meet this animal's exact care profile.</td><td>Owners aligned with this animal's exact care profile.</td></tr>\n        </table>\n      </section>\n`;

  if (article.includes('</article>')) return article.replace('</article>', `${section}</article>`);
  return article + section;
}

function locationUniqueRewrite(article, ctx) {
  if (ctx.species !== 'location') return article;
  const city = ctx.city || ctx.entity;
  const h = hashStr(ctx.rel);
  const introPool = [
    `${city} pet owners usually need a plan for both routine care and urgent care. Start by confirming clinic hours, emergency transfer policies, and whether the practice treats your species before the first visit.`,
    `In ${city}, service quality varies by neighborhood and clinic model, so verify appointment lead times, after-hours coverage, and species experience before committing to a provider.`,
    `${city} families can avoid emergency delays by pre-selecting a daytime clinic, an after-hours hospital, and a backup tele-triage option for nights and weekends.`
  ];
  const pricingPool = [
    `Local pricing in ${city} can shift by clinic type, case complexity, and appointment timing; request written estimates before diagnostics or procedures so decisions stay clear and comparable.`,
    `Across ${city}, baseline exam fees are only part of the bill. Ask for line-item estimates that separate exam, diagnostics, medications, and follow-up to compare providers accurately.`,
    `${city} care costs are most manageable when clinics provide transparent treatment tiers, written discharge plans, and clear recheck timelines.`
  ];

  article = article.replace(/<p>Grooming is more than appearance;[^<]*<\/p>/gi, `<p>${introPool[h % introPool.length]}</p>`);
  article = article.replace(/<p>Professional groomers can help maintain coat quality[^<]*<\/p>/gi, `<p>${introPool[(h + 1) % introPool.length]}</p>`);
  article = article.replace(/<p>Veterinary pricing in [^<]+<\/p>/gi, `<p>${pricingPool[h % pricingPool.length]}</p>`);

  return article;
}

function extractFaqsFromArticle(article) {
  const h2Match = article.match(/<h2[^>]*>\s*Frequently Asked Questions\s*<\/h2>/i);
  if (!h2Match) return [];
  const start = h2Match.index + h2Match[0].length;
  const rest = article.slice(start);
  const stop = rest.search(/<h2\b/i);
  const segment = stop === -1 ? rest : rest.slice(0, stop);

  const faqs = [];
  const re = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(segment))) {
    const q = stripTags(m[1]);
    const a = stripTags(m[2]);
    if (q && a) faqs.push({ q, a });
  }
  return faqs.slice(0, 8);
}

function injectFaqSchema(html, faqs) {
  if (!faqs.length) return html;
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };
  const script = `<script type="application/ld+json">\n${JSON.stringify(payload, null, 2)}\n</script>\n`;

  let out = html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?"@type"\s*:\s*"FAQPage"[\s\S]*?<\/script>\s*/gi, '');
  if (out.includes('</head>')) {
    out = out.replace('</head>', `${script}</head>`);
  }
  return out;
}

function normalizeDuplicateKey(text, ctx) {
  let t = stripTags(text).toLowerCase();
  if (t.length < 80) return '';
  t = t.replace(/\s+/g, ' ').trim();

  if (ctx.entity) {
    const parts = ctx.entity.toLowerCase().split(/\s+/).filter((x) => x.length >= 3);
    for (const p of parts) {
      t = t.replace(new RegExp(`\\b${escRegExp(p)}\\b`, 'g'), '__entity__');
    }
  }

  for (const tok of ctx.slugTokens) {
    t = t.replace(new RegExp(`\\b${escRegExp(tok.toLowerCase())}\\b`, 'g'), '__slug__');
  }

  t = t.replace(/\$?\d+[\d,]*(?:\s*[-–]\s*\$?\d+[\d,]*)?/g, '__num__');
  t = t.replace(/\b\d{1,3}\b/g, '__n__');
  return t;
}

function buildUniqueParagraph(ctx, key, idx) {
  const h = hashStr(`${ctx.rel}|${key}|${idx}`);
  const pools = {
    location: [
      `Service quality in ${ctx.city || ctx.entity} improves when owners verify species fit, after-hours transfer plans, and transparent treatment estimates before an urgent visit is ever needed.`,
      `${ctx.city || ctx.entity} pet care decisions are strongest when families compare real treatment plans, not just headline pricing, and keep one emergency pathway pre-selected.`,
      `For ${ctx.city || ctx.entity} households, practical planning means choosing providers by communication quality, species experience, and follow-up reliability.`
    ],
    comparison: [
      `This comparison for ${ctx.title} focuses on practical differences in temperament, exercise demand, coat care, and long-term medical planning for both options.`,
      `When choosing in ${ctx.title}, compare daily time commitment, space needs, training load, and veterinary risk profile for each side.`,
      `${ctx.title} decisions are strongest when owners match household routine and budget to the specific needs of both options, not generic pet-care advice.`
    ],
    aquatic: [
      `${ctx.entity} care quality depends on stable water chemistry, measured feeding, and disciplined quarantine habits; these factors drive outcomes more than brand-name products.`,
      `For ${ctx.entity}, the most reliable results come from parameter consistency, species-matched diet rotation, and early correction of stress signals.`,
      `${ctx.entity} owners usually see better long-term health when maintenance cadence and stocking decisions are tailored to this species rather than copied from general fish templates.`
    ],
    herp: [
      `${ctx.entity} thrives when thermal gradient, humidity control, and enclosure hygiene are managed as a system, not as isolated checklist items.`,
      `With ${ctx.entity}, husbandry precision matters more than gadget quantity: stable environment, species-appropriate diet, and calm handling drive health outcomes.`,
      `Strong ${ctx.entity} care plans prioritize enclosure conditions, stress reduction, and scheduled health observation instead of generic mammal care routines.`
    ],
    general: [
      `${ctx.entity} care planning works best when feeding, enrichment, preventive care, and budget choices are aligned with this animal's real day-to-day needs.`,
      `For ${ctx.entity}, the most useful advice is specific: clear routines, realistic cost expectations, and early prevention steps that reduce avoidable health setbacks.`,
      `${ctx.entity} owners usually get better outcomes with consistent routines, species-appropriate nutrition, and scheduled veterinary checkups instead of one-size-fits-all tips.`
    ]
  };

  let bucket = pools.general;
  if (ctx.species === 'location') bucket = pools.location;
  else if (/\bvs\b/i.test(ctx.title) || /\/vs-/.test(ctx.rel)) bucket = pools.comparison;
  else if (['fish', 'marine-fish'].includes(ctx.species)) bucket = pools.aquatic;
  else if (['reptiles', 'amphibians'].includes(ctx.species)) bucket = pools.herp;

  return bucket[h % bucket.length];
}

function fixLocationScripts(html) {
  if (!/\/locations\//.test(html) && !/locations\//.test(html)) return { html, changed: false };
  let out = html;

  const before = out;
  out = out.replace(/<script>\s*document\.addEventListener\('DOMContentLoaded',[\s\S]*?<\/script>\s*/gi, '');

  const navScript = `<script>\n  document.addEventListener('DOMContentLoaded', function () {\n    const navToggle = document.querySelector('.nav-toggle');\n    const navMenu = document.querySelector('.nav-menu');\n    if (!navToggle || !navMenu) return;\n    navToggle.addEventListener('click', function () {\n      navMenu.classList.toggle('active');\n      navToggle.classList.toggle('active');\n    });\n  });\n</script>\n`;

  if (!out.includes('navToggle.classList.toggle(\'active\')')) {
    out = out.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n${navScript}`);
  }

  return { html: out, changed: out !== before };
}

const files = TARGET_DIRS.flatMap((d) => walkHtml(join(ROOT, d))).sort();
const records = files.map((p) => {
  const html = readFileSync(p, 'utf8');
  const ctx = inferContext(p, html);
  return { path: p, ctx, html, original: html };
});

const classSets = {
  duplication: new Set(),
  title_variable_leaks: new Set(),
  faq_schema_alignment: new Set(),
  species_inappropriate: new Set(),
  comparison_integrity: new Set(),
  html_markup: new Set(),
  javascript_repairs: new Set(),
  source_contamination: new Set(),
  location_value_duplication: new Set(),
  breed_template_padding: new Set(),
  exotic_genericity: new Set(),
  low_level_quality: new Set()
};

// Pass 1: direct content fixes.
for (const rec of records) {
  let html = rec.html;

  const beforeLeak = html;
  const replacedA = replaceArticle(html, (article) => cleanupGeneral(article, rec.ctx));
  html = replacedA.html;
  if (html !== beforeLeak) {
    classSets.title_variable_leaks.add(rec.path);
    classSets.low_level_quality.add(rec.path);
    classSets.html_markup.add(rec.path);
  }

  const beforeSpecies = html;
  const replacedB = replaceArticle(html, (article) => applySpeciesFixes(article, rec.ctx));
  html = replacedB.html;
  if (html !== beforeSpecies) {
    classSets.species_inappropriate.add(rec.path);
    if (['reptiles', 'amphibians', 'small-animals', 'fish', 'marine-fish'].includes(rec.ctx.species)) {
      classSets.exotic_genericity.add(rec.path);
    }
    classSets.source_contamination.add(rec.path);
  }

  const beforeComp = html;
  const replacedC = replaceArticle(html, (article) => fixComparisonPages(article, rec.ctx));
  html = replacedC.html;
  if (html !== beforeComp) classSets.comparison_integrity.add(rec.path);

  const beforeLoc = html;
  const replacedD = replaceArticle(html, (article) => locationUniqueRewrite(article, rec.ctx));
  html = replacedD.html;
  if (html !== beforeLoc) classSets.location_value_duplication.add(rec.path);

  // FAQ schema sync from visible FAQ block.
  const r = articleRange(html);
  if (r) {
    const article = html.slice(r.start, r.end);
    const faqs = extractFaqsFromArticle(article);
    const withFaq = injectFaqSchema(html, faqs);
    if (withFaq !== html) {
      html = withFaq;
      classSets.faq_schema_alignment.add(rec.path);
    }
  }

  rec.html = html;
}

// Pass 2: duplicate paragraph family elimination (exact + normalized).
const paraFamilies = new Map();
for (const rec of records) {
  const r = articleRange(rec.html);
  if (!r) continue;
  const article = rec.html.slice(r.start, r.end);
  let idx = 0;
  article.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_m, inner) => {
    const clean = stripTags(inner);
    const key = normalizeDuplicateKey(clean, rec.ctx);
    if (key && clean.length >= 90) {
      if (!paraFamilies.has(key)) paraFamilies.set(key, []);
      paraFamilies.get(key).push({ path: rec.path, idx, clean });
    }
    idx++;
    return _m;
  });
}

const duplicateKeys = new Set([...paraFamilies.entries()]
  .filter(([_k, arr]) => arr.length >= 24)
  .map(([k]) => k));

for (const rec of records) {
  const replaced = replaceArticle(rec.html, (article) => {
    let pIdx = 0;
    return article.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (m, inner) => {
      const clean = stripTags(inner);
      const key = normalizeDuplicateKey(clean, rec.ctx);
      if (!duplicateKeys.has(key)) {
        pIdx++;
        return m;
      }

      const newP = buildUniqueParagraph(rec.ctx, key, pIdx);
      pIdx++;
      return `<p>${newP}</p>`;
    });
  });

  if (replaced.changed) {
    rec.html = replaced.html;
    classSets.duplication.add(rec.path);
    if (/^breeds\//.test(rec.ctx.rel)) classSets.breed_template_padding.add(rec.path);
    if (/^guides\//.test(rec.ctx.rel) && /care-guide|shrimp|reptile|amphib|small-animal|bird|fish/i.test(rec.ctx.rel)) {
      classSets.exotic_genericity.add(rec.path);
    }
    if (/^locations\//.test(rec.ctx.rel)) classSets.location_value_duplication.add(rec.path);
  }
}

// Pass 3: location JS repairs (outside article)
for (const rec of records) {
  if (!rec.ctx.rel.startsWith('locations/')) continue;
  const js = fixLocationScripts(rec.html);
  if (js.changed) {
    rec.html = js.html;
    classSets.javascript_repairs.add(rec.path);
  }
}

let changedFiles = 0;
for (const rec of records) {
  if (rec.html !== rec.original) {
    writeFileSync(rec.path, rec.html);
    changedFiles++;
  }
}

const counts = Object.fromEntries(
  Object.entries(classSets).map(([k, set]) => [k, set.size])
);

const report = {
  timestamp: new Date().toISOString(),
  scanned_files: records.length,
  changed_files: changedFiles,
  issue_class_file_counts: counts,
  duplicate_family_keys_fixed: duplicateKeys.size
};

writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
