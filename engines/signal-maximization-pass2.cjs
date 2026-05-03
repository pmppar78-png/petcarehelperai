#!/usr/bin/env node
/*
 * Phase 2 signal maximization pass.
 *
 * Controlled, deterministic variation for repeated append blocks, FAQ and
 * disclaimer phrasing, comparison-page framing, generic anchors, and the worst
 * duplicated title/meta patterns. It intentionally avoids URL, canonical,
 * schema-type, affiliate-link, and table changes.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = path.join(ROOT, 'data', 'signal-maximization-pass2-report.json');
const PAGE_ROOTS = ['guides', 'breeds', 'commercial', 'resources'];

const TOPIC_LABELS = {
  'best-food': 'food and feeding',
  'best-insurance': 'insurance coverage',
  'cost-to-own': 'ownership cost',
  'health-costs': 'health costs',
  'first-time-owners': 'first-time ownership',
  'best-habitat-size': 'habitat setup',
  'best-enrichment': 'enrichment',
};

const SPECIES_LABELS = {
  dogs: 'dog',
  cats: 'cat',
  birds: 'bird',
  fish: 'fish',
  'marine-fish': 'marine fish',
  reptiles: 'reptile',
  amphibians: 'amphibian',
  'small-animals': 'small animal',
};

const stats = {
  filesScanned: 0,
  filesChanged: 0,
  ownerInsightBlocks: 0,
  vetCareBlocks: 0,
  faqHeadings: 0,
  faqSchemaQuestions: 0,
  disclaimers: 0,
  comparisonIntros: 0,
  comparisonSectionOrders: 0,
  comparisonConclusions: 0,
  anchors: 0,
  genericCardCopy: 0,
  metadataTitles: 0,
  metadataDescriptions: 0,
};

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.netlify') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function hashInt(input) {
  return crypto.createHash('sha1').update(String(input)).digest().readUInt32BE(0);
}

function pick(file, key, arr) {
  return arr[hashInt(`${path.relative(ROOT, file)}|${key}`) % arr.length];
}

function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cleanText(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+\| Pet Care Helper AI$/, '')
    .trim();
}

function titleCaseFromSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function contextFor(file, html) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const parts = rel.split('/');
  const h1 = cleanText((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]);
  const title = cleanText((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]);
  const base = h1 || title || titleCaseFromSlug(path.basename(file, '.html'));
  const species = parts[0] === 'commercial' ? parts[1] : parts[1];
  const speciesLabel = SPECIES_LABELS[species] || 'pet';

  let entity = base
    .replace(/\s*\(2026\).*$/i, '')
    .replace(/\s*:\s*Complete.*$/i, '')
    .replace(/\s*:\s*Side-by-Side.*$/i, '')
    .replace(/\s*\|\s*Pet Care Helper AI$/i, '')
    .trim();

  let peer = '';
  let topic = '';
  let topicLabel = 'care';
  let pageType = parts[0];

  if (parts[0] === 'commercial') {
    entity = titleCaseFromSlug(parts[2]);
    topic = path.basename(file, '.html');
    if (topic.startsWith('vs-')) {
      pageType = 'comparison';
      peer = titleCaseFromSlug(topic.slice(3));
      topicLabel = 'breed comparison';
    } else {
      pageType = topic;
      topicLabel = TOPIC_LABELS[topic] || titleCaseFromSlug(topic).toLowerCase();
    }
  } else if (parts[0] === 'breeds') {
    pageType = 'breed';
    if (parts.length >= 3) entity = titleCaseFromSlug(path.basename(file, '.html'));
  } else if (parts[0] === 'guides') {
    pageType = 'guide';
    topicLabel = base.toLowerCase();
  } else if (parts[0] === 'resources') {
    pageType = 'resource';
    topicLabel = base.toLowerCase();
  }

  return { rel, base, entity, peer, species, speciesLabel, topic, topicLabel, pageType };
}

function subjectFor(ctx) {
  if (ctx.pageType === 'guide') {
    const why = ctx.base.match(/^Why Is My (.+)$/i);
    if (why) return `Your ${why[1]}`;
    return ctx.base;
  }
  if (ctx.pageType === 'resource') return ctx.base;
  return ctx.entity;
}

function ownerLabelFor(ctx) {
  if (ctx.pageType === 'guide') return `Owners Reading About ${escHtml(ctx.base)}`;
  if (ctx.pageType === 'resource') return `Readers Using This ${escHtml(ctx.base)} Resource`;
  return `${escHtml(ctx.entity)} Owners`;
}

function replaceCounting(html, regex, replacement, counter) {
  let count = 0;
  const next = html.replace(regex, (...args) => {
    count += 1;
    return typeof replacement === 'function' ? replacement(...args) : replacement;
  });
  if (count) stats[counter] += count;
  return next;
}

function ownerInsightSection(file, ctx) {
  const subject = escHtml(subjectFor(ctx));
  const ownerLabel = ownerLabelFor(ctx);
  const heading = pick(file, 'owner-heading', [
    `What ${ownerLabel} Usually Notice`,
    `Day-to-Day Signals Around ${subject}`,
    `Real-World Notes on ${subject}`,
  ]);
  const body = pick(file, 'owner-body', [
    `The useful pattern around ${subject} is rarely a single dramatic clue. Better decisions come from tracking small shifts in appetite, activity, handling tolerance, and recovery time, then adjusting the routine around those observations instead of around generic ${escHtml(ctx.speciesLabel)} advice.`,
    `${subject} guidance works best when the household treats the first month as a calibration period. Feeding rhythm, sleep location, noise tolerance, and response to handling all create practical signals that broad pet advice cannot capture.`,
    `The strongest owner notes on ${subject} describe a steady process: keep the routine predictable, change one variable at a time, and note which changes actually affect comfort, behavior, and health markers.`,
  ]);
  const bullets = pick(file, 'owner-bullets', [
    [
      `Track one weekly observation tied to ${subject}, not just supply purchases.`,
      `Review cost assumptions after the first full month; recurring supplies often differ from the startup list.`,
    ],
    [
      `Watch how the pet responds to schedule changes before changing food, gear, or training plans.`,
      `Keep a short note on appetite, energy, and resting spots so subtle changes are easier to spot.`,
    ],
    [
      `Use owner anecdotes as prompts, then validate them against the animal in front of you.`,
      `Plan backup care early; last-minute boarding or specialty help is where many budgets break.`,
    ],
  ]);
  return `<section class="owner-insight" aria-label="Real-World Owner Insight" style="margin:24px 0;padding:20px;border-left:4px solid #0D9488;background:#F0FDFA;border-radius:6px;">
  <h2 style="margin-top:0;">${heading}</h2>
  <p>${body}</p>
  <ul style="margin-top:12px;">
    <li>${bullets[0]}</li>
    <li>${bullets[1]}</li>
  </ul>
</section>`;
}

function vetCareSection(file, ctx) {
  const subject = escHtml(subjectFor(ctx));
  const heading = pick(file, 'vet-heading', [
    `Vet Planning Notes for ${subject}`,
    `Care Access Considerations Around ${subject}`,
    `When Local Care Changes the ${subject} Plan`,
  ]);
  const body = pick(file, 'vet-body', [
    `Local care access matters for ${subject} because pricing, appointment lead times, and species experience vary by region. Confirm the nearest routine clinic, emergency option, and any relevant specialist before a problem forces a rushed search.`,
    `A practical plan for ${subject} includes more than average annual cost. It should account for travel time to the right clinic, after-hours availability, refill logistics, and whether the veterinarian regularly sees this type of ${escHtml(ctx.speciesLabel)}.`,
    `The best preventive plan around ${subject} pairs home observation with a clinic that can handle likely problems for this species. Ask about baseline exams, emergency triage, and how quickly the practice can see a new concern.`,
  ]);
  return `<section class="vet-care" aria-label="Local Vet and Care Considerations" style="margin:24px 0;padding:20px;border-left:4px solid #2563EB;background:#EFF6FF;border-radius:6px;">
  <h2 style="margin-top:0;">${heading}</h2>
  <p>${body}</p>
</section>`;
}

function disclaimerBlock(file, ctx) {
  const lines = {
    'best-food': [
      `<strong>Feeding note:</strong> Use this ${escHtml(ctx.entity)} food guide to prepare better questions for your veterinarian. Product pricing varies by retailer and region. Some outbound links are affiliate links.`,
      `<strong>Diet context:</strong> This page is educational and cannot replace a vet who knows your ${escHtml(ctx.entity)}. Cost ranges are directional. Affiliate links may support the site at no added cost.`,
      `<strong>Before changing food:</strong> Confirm medical or diet-sensitive decisions with your veterinarian. Prices are typical ranges, not quotes. Some product links are affiliate links.`,
    ],
    'best-insurance': [
      `<strong>Coverage note:</strong> Insurance terms depend on carrier rules, location, age, and pre-existing conditions. This ${escHtml(ctx.entity)} overview is educational. Some links may earn referral revenue.`,
      `<strong>Policy context:</strong> Read the current policy documents before buying coverage for a ${escHtml(ctx.entity)}. Costs and exclusions change by provider. Affiliate links are disclosed.`,
      `<strong>Before enrolling:</strong> Treat this as research support, not financial advice. Confirm deductibles, exclusions, and waiting periods directly with the insurer. Some links are affiliate links.`,
    ],
    'cost-to-own': [
      `<strong>Cost note:</strong> ${escHtml(ctx.entity)} budgets vary by region, clinic, age, and care standard. Figures here are planning ranges. Affiliate links may help keep the resource free.`,
      `<strong>Budget context:</strong> This is a planning aid for ${escHtml(ctx.entity)} ownership, not a quote. Local pricing and health events can move totals. Some outbound links are affiliate links.`,
      `<strong>Planning note:</strong> Use these numbers as a starting point, then price care in your own city. Some products or services linked here may generate referral revenue.`,
    ],
    comparison: [
      `<strong>Comparison note:</strong> This ${escHtml(ctx.entity)} vs ${escHtml(ctx.peer)} page is educational and cannot replace advice from a vet, breeder, or rescue that knows your household. Some links are affiliate links.`,
      `<strong>Decision context:</strong> Use this comparison to narrow questions, then validate fit in person. Costs are estimates and some outbound links may earn a commission.`,
      `<strong>Before choosing:</strong> Confirm health, cost, and compatibility details with qualified sources who know the individual animals. Affiliate links may support the site.`,
    ],
    default: [
      `<strong>Care note:</strong> This ${escHtml(ctx.entity)} guidance is educational, not veterinary advice. Costs are approximate and vary by provider. Some links are affiliate links.`,
      `<strong>Reader context:</strong> Use this page to prepare for better decisions, then confirm health questions with your veterinarian. Pricing is directional. Affiliate links may support the site.`,
      `<strong>Before you act:</strong> Confirm medical decisions with a licensed veterinarian. Cost figures are typical ranges, not quotes. Some outbound links are affiliate links.`,
    ],
  };
  return pick(file, `disc-${ctx.pageType}`, lines[ctx.pageType] || lines.default);
}

function transparencySection(file, ctx) {
  const variants = [
    `<section class="transparency">
      <p><strong>Editorial note:</strong> This ${escHtml(ctx.topicLabel)} page is educational and should be used to prepare questions for a veterinarian, not replace an exam. Referral links, when present, do not influence the care guidance.</p>
    </section>`,
    `<section class="transparency">
      <p><strong>Important context:</strong> Online guidance cannot diagnose ${escHtml(ctx.entity)}. Use the information here as a planning aid, then confirm health or treatment decisions with your veterinarian. Affiliate support does not affect recommendations.</p>
    </section>`,
    `<section class="transparency">
      <p><strong>Reader note:</strong> The guidance on this page is informational. A veterinarian who has examined the pet is the right source for diagnosis, treatment, and urgent decisions. Sponsored or referral links are kept separate from editorial judgment.</p>
    </section>`,
  ];
  return pick(file, 'transparency', variants);
}

function improveAnchors(file, html, ctx) {
  const before = html;
  html = html.replace(/<a href="(\/breeds\/[^"]+)"([^>]*)>(&larr; )?([^<]+?) Complete Guide( &rarr;)?<\/a>/g, (m, href, attrs, left, name, right) => {
    const cleanName = cleanText(name);
    const options = [
      `${cleanName} full care profile`,
      `${cleanName} ownership and health guide`,
      `Detailed ${cleanName} breed guide`,
    ];
    const label = pick(file, `${href}|anchor`, options);
    return `<a href="${href}"${attrs}>${left || ''}${escHtml(label)}${right || ''}</a>`;
  });
  const changed = html !== before;
  if (changed) {
    const matchesBefore = before.match(/Complete Guide(?: &rarr;)?<\/a>/g) || [];
    const matchesAfter = html.match(/Complete Guide(?: &rarr;)?<\/a>/g) || [];
    stats.anchors += Math.max(1, matchesBefore.length - matchesAfter.length);
  }
  return html;
}

function improveGenericCardCopy(file, html) {
  let changed = 0;
  html = html.replace(/<a href="([^"]+)" class="guide-card"><h3>([^<]+)<\/h3><p>Expert pet care guide\.?<\/p><\/a>/g, (m, href, h3) => {
    changed += 1;
    const copy = pick(file, `${href}|card`, [
      `${h3} guidance with practical care checkpoints.`,
      `Focused ${h3.toLowerCase()} help for everyday decisions.`,
      `${h3} advice tied to symptoms, costs, and next steps.`,
    ]);
    return `<a href="${href}" class="guide-card"><h3>${h3}</h3><p>${escHtml(copy)}</p></a>`;
  });
  html = html.replace(/<a href="([^"]+)" class="guide-card"><h3>([^<]+)<\/h3><p>Browse the complete breed directory\.?<\/p><\/a>/g, (m, href, h3) => {
    changed += 1;
    const copy = pick(file, `${href}|breed-card`, [
      `Compare ${h3.toLowerCase()} by temperament, care load, and health notes.`,
      `Browse ${h3.toLowerCase()} with practical ownership context.`,
      `Review ${h3.toLowerCase()} profiles before narrowing your shortlist.`,
    ]);
    return `<a href="${href}" class="guide-card"><h3>${h3}</h3><p>${escHtml(copy)}</p></a>`;
  });
  if (changed) stats.genericCardCopy += changed;
  return html;
}

function varyFaqHeading(file, html, ctx) {
  return replaceCounting(
    html,
    /<h2([^>]*)>Frequently Asked Questions(?: About ([^<]+))?<\/h2>/g,
    (m, attrs, about) => {
      const subject = cleanText(about || ctx.entity || ctx.base);
      const variants = [
        `Common Questions About ${escHtml(subject)}`,
        `${escHtml(subject)} Questions Owners Ask`,
        `Quick Answers About ${escHtml(subject)}`,
      ];
      return `<h2${attrs}>${pick(file, 'faq-heading', variants)}</h2>`;
    },
    'faqHeadings'
  );
}

function varyFaqSchema(file, html, ctx) {
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (full, raw) => {
    if (!/"@type"\s*:\s*"FAQPage"/.test(raw)) return full;
    let data;
    try {
      data = JSON.parse(raw.trim());
    } catch {
      return full;
    }
    if (!Array.isArray(data.mainEntity)) return full;

    let changed = 0;
    for (const item of data.mainEntity) {
      if (!item || typeof item.name !== 'string') continue;
      const original = item.name;
      item.name = item.name
        .replace(/^Which is better, (.+) or (.+)\?$/i, 'Which fits which household better: $1 or $2?')
        .replace(/^Is (.+) easier to care for than (.+)\?$/i, 'Which care routine is simpler in practice: $1 or $2?')
        .replace(/^Which costs more, (.+) or (.+)\?$/i, 'How do lifetime costs compare for $1 and $2?')
        .replace(/^What should I know before getting a (.+)\?$/i, 'What matters most before bringing home a $1?')
        .replace(/^How much time does (.+) care require daily\?$/i, 'What daily time commitment should $1 owners expect?')
        .replace(/^What are the best (.+) for (.+)\?$/i, 'Which $1 choices tend to work best for $2?')
        .replace(/^How often should I rotate (.+)\?$/i, 'What rotation schedule keeps $1 useful?');
      if (item.name === original && /^Can (.+) get bored\?$/i.test(item.name)) {
        item.name = item.name.replace(/^Can (.+) get bored\?$/i, 'What boredom signs should $1 owners watch for?');
      }
      if (item.name !== original) changed += 1;
    }

    if (!changed) return full;
    stats.faqSchemaQuestions += changed;
    return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
  });
}

function varyMetadata(file, html, ctx) {
  if (!ctx.rel.startsWith('breeds/')) return html;
  const name = ctx.entity;
  if (!name || name.length > 80) return html;

  const replacement = pick(file, 'meta-title', [
    `${name} Care Profile (2026): Temperament, Costs, Health &amp; Owner Fit`,
    `${name} Ownership Guide (2026): Care Needs, Costs, Lifespan &amp; Health`,
    `${name} Breed Guide (2026): Daily Care, Costs, Temperament &amp; Health`,
  ]);
  const titlePattern = new RegExp(`${escapeRegExp(name)} Complete Guide \\(2026\\): Temperament, Costs, Health &amp; What to Expect`, 'g');
  const before = html;
  html = html.replace(titlePattern, replacement);
  if (html !== before) stats.metadataTitles += 1;

  const descVariants = [
    `A practical ${name} ownership guide covering temperament, health risks, lifespan, daily care, cost planning, and fit for real households.`,
    `Use this ${name} profile to compare temperament, expected costs, lifespan, health concerns, and the care routine this pet actually needs.`,
    `${name} care guidance for owners comparing health needs, daily routine, lifespan, costs, temperament, and long-term household fit.`,
  ];
  const desc = pick(file, 'meta-desc', descVariants);
  const descBefore = html;
  html = html.replace(
    new RegExp(`A practical ${escapeRegExp(name)} guide: temperament, health issues to watch, lifespan around ([^"]+?), training difficulty, and whether this breed fits your life\\.`, 'g'),
    escHtml(desc)
  );
  if (html !== descBefore) stats.metadataDescriptions += 1;
  return html;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function varyCommercialDisclaimer(file, html, ctx) {
  if (!ctx.rel.startsWith('commercial/')) return html;
  return replaceCounting(
    html,
    /<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:8px;margin:30px 0;font-size:0\.9rem;">[\s\S]*?<\/div>/g,
    (m) => {
      if (!/affiliate|veterinary|vet|Costs|costs|Prices|pricing|Figures|figures|quote|coverage/i.test(m)) return m;
      return `<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:8px;margin:30px 0;font-size:0.9rem;">${disclaimerBlock(file, ctx)}</div>`;
    },
    'disclaimers'
  );
}

function varyTransparency(file, html, ctx) {
  if (!/(guides|breeds)\//.test(ctx.rel)) return html;
  return replaceCounting(
    html,
    /<section class="transparency">[\s\S]*?<\/section>/g,
    () => transparencySection(file, ctx),
    'disclaimers'
  );
}

function varyResourceDisclaimer(file, html, ctx) {
  if (!ctx.rel.startsWith('resources/')) return html;
  return replaceCounting(
    html,
    /<p style="margin-top: 2em;"><em><strong>Disclaimer:<\/strong> This article is for educational purposes only and does not constitute ([\s\S]*?)<\/em><\/p>/g,
    () => {
      const subject = escHtml(ctx.base.replace(/\s+-\s+Pet Care Helper AI$/, ''));
      const variants = [
        `<p style="margin-top: 2em;"><em><strong>Disclaimer:</strong> ${subject} is intended for education and planning. It is not veterinary, legal, or financial advice for a specific animal. Confirm medical concerns with a qualified veterinarian and review the <a href="/medical-disclaimer">Medical Disclaimer</a> for complete details.</em></p>`,
        `<p style="margin-top: 2em;"><em><strong>Disclaimer:</strong> Use this ${escHtml(ctx.topicLabel)} resource as background, not as a substitute for professional guidance. Local costs, health needs, and individual circumstances vary. See the <a href="/medical-disclaimer">Medical Disclaimer</a> for complete details.</em></p>`,
        `<p style="margin-top: 2em;"><em><strong>Disclaimer:</strong> This resource provides general education. A veterinarian or qualified professional who understands your pet and location should guide specific decisions. Full details are available in the <a href="/medical-disclaimer">Medical Disclaimer</a>.</em></p>`,
      ];
      return pick(file, 'resource-disclaimer', variants);
    },
    'disclaimers'
  );
}

function applyAppendVariation(file, html, ctx) {
  html = replaceCounting(html, /<section class="owner-insight"[\s\S]*?<\/section>/g, () => ownerInsightSection(file, ctx), 'ownerInsightBlocks');
  html = replaceCounting(html, /<section class="vet-care"[\s\S]*?<\/section>/g, () => vetCareSection(file, ctx), 'vetCareBlocks');
  return html;
}

function comparisonIntro(file, ctx) {
  const a = escHtml(ctx.entity);
  const b = escHtml(ctx.peer);
  return pick(file, 'vs-intro', [
    `<p>${a} versus ${b} is less about picking a universal winner and more about matching the animal to the household that will live with the decision every day. The table below keeps the quick facts visible, while the following sections separate temperament, care load, cost pressure, and health planning.</p>
      <p>Read the comparison in two passes: first for obvious constraints like space and budget, then again for the subtler fit questions that tend to matter after the first year.</p>`,
    `<p>The practical difference between ${a} and ${b} shows up in routine, not reputation. Exercise cadence, grooming tolerance, training style, and medical planning all change how each option feels once the novelty has worn off.</p>
      <p>Use the side-by-side table for fast screening, then rely on the deeper notes to decide which tradeoffs your household can support consistently.</p>`,
    `<p>Choosing between ${a} and ${b} works best when the decision starts with daily constraints: time, space, handling comfort, likely vet costs, and how much structure the household can maintain.</p>
      <p>The goal is not to crown one choice. It is to identify which set of needs fits the life the owner can actually provide.</p>`,
  ]);
}

function varyComparisonPage(file, html, ctx) {
  if (ctx.pageType !== 'comparison' || !ctx.peer) return html;

  const introBefore = html;
  html = html.replace(
    /(<\/div>\s*\n\s*)(<p>[\s\S]*?<\/p>\s*\n\s*<p>[\s\S]*?<\/p>)(\s*\n\s*<h2>Side-by-Side Comparison<\/h2>)/,
    (m, pre, _paras, post) => `${pre}${comparisonIntro(file, ctx)}${post}`
  );
  if (html !== introBefore) stats.comparisonIntros += 1;

  const decisionBefore = html;
  html = html.replace(
    /<section id="cmp-decision"><h2>Decision Guidance for ([^<]+)<\/h2><p>[\s\S]*?<\/p><\/section>/,
    () => {
      const variants = [
        `<section id="cmp-decision"><h2>Decision Guidance for ${escHtml(ctx.entity)} vs ${escHtml(ctx.peer)}</h2><p>Start with the constraint most likely to fail on a busy week: time, budget, grooming, training, space, or veterinary access. The stronger match is the option whose hardest requirement still feels manageable.</p></section>`,
        `<section id="cmp-decision"><h2>Decision Guidance for ${escHtml(ctx.entity)} vs ${escHtml(ctx.peer)}</h2><p>Choose by friction, not by highlight reel. The better fit is the pet whose ordinary care routine, likely health costs, and temperament match the household on an average Tuesday.</p></section>`,
        `<section id="cmp-decision"><h2>Decision Guidance for ${escHtml(ctx.entity)} vs ${escHtml(ctx.peer)}</h2><p>A sound decision weighs the best traits against the demands that repeat every week. If one option needs a routine the household cannot maintain, the other is usually the wiser long-term choice.</p></section>`,
      ];
      return pick(file, 'vs-decision', variants);
    }
  );
  if (html !== decisionBefore) stats.comparisonConclusions += 1;

  const blocks = [];
  html = html.replace(/\n?(<section data-vs-remediation="true"[\s\S]*?<\/section>)\s*/g, (m, block) => {
    blocks.push({ id: 'direct', block });
    return '\n';
  });
  html = html.replace(/\n?(<section id="cmp-a"[\s\S]*?<\/section>)\s*/g, (m, block) => {
    blocks.push({ id: 'a', block });
    return '\n';
  });
  html = html.replace(/\n?(<section id="cmp-b"[\s\S]*?<\/section>)\s*/g, (m, block) => {
    blocks.push({ id: 'b', block });
    return '\n';
  });
  html = html.replace(/\n?(<section id="cmp-decision"[\s\S]*?<\/section>)\s*/g, (m, block) => {
    blocks.push({ id: 'decision', block });
    return '\n';
  });

  if (blocks.length >= 3) {
    const byId = Object.fromEntries(blocks.map((b) => [b.id, b.block]));
    const orders = [
      ['direct', 'a', 'b', 'decision'],
      ['a', 'b', 'direct', 'decision'],
      ['direct', 'decision', 'a', 'b'],
    ];
    const order = pick(file, 'vs-order', orders);
    const ordered = order.filter((id) => byId[id]).map((id) => byId[id]).join('\n');
    html = html.replace(/(\s*<\/article>)/, `\n${ordered}\n$1`);
    stats.comparisonSectionOrders += 1;
  }

  return html;
}

function processFile(file) {
  stats.filesScanned += 1;
  const original = fs.readFileSync(file, 'utf8');
  let html = original;
  const ctx = contextFor(file, html);

  html = applyAppendVariation(file, html, ctx);
  html = varyFaqHeading(file, html, ctx);
  html = varyFaqSchema(file, html, ctx);
  html = varyCommercialDisclaimer(file, html, ctx);
  html = varyTransparency(file, html, ctx);
  html = varyResourceDisclaimer(file, html, ctx);
  html = varyComparisonPage(file, html, ctx);
  html = improveAnchors(file, html, ctx);
  html = improveGenericCardCopy(file, html);
  html = varyMetadata(file, html, ctx);

  if (html !== original) {
    fs.writeFileSync(file, html);
    stats.filesChanged += 1;
  }
}

const files = PAGE_ROOTS.flatMap((root) => walk(path.join(ROOT, root)));
for (const file of files) processFile(file);

fs.writeFileSync(REPORT_PATH, JSON.stringify({
  generatedAt: new Date().toISOString(),
  scope: PAGE_ROOTS,
  stats,
}, null, 2));

console.log(JSON.stringify(stats, null, 2));
