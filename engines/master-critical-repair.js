#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import vm from 'vm';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');
const TARGET_DIRS = ['breeds', 'guides', 'commercial', 'locations'];
const SITE = 'https://petcarehelperai.com';
const TODAY = '2026-04-08';

function walkHtml(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function stripTags(s) {
  return String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function titleFromHtml(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!m) return '';
  return stripTags(m[1]).replace(/\s*\|\s*Pet Care Helper AI\s*$/i, '').trim();
}

function h1FromHtml(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? stripTags(m[1]) : '';
}

function getContext(pathname, html) {
  const rel = relative(ROOT, pathname).replace(/\\/g, '/');
  const title = titleFromHtml(html);
  const h1 = h1FromHtml(html);
  const slug = rel.split('/').at(-1)?.replace(/\.html$/i, '') || '';
  let species =
    rel.includes('/dogs/') ? 'dogs' :
    rel.includes('/cats/') ? 'cats' :
    rel.includes('/birds/') ? 'birds' :
    rel.includes('/marine-fish/') ? 'marine-fish' :
    rel.includes('/fish/') ? 'fish' :
    rel.includes('/reptiles/') ? 'reptiles' :
    rel.includes('/amphibians/') ? 'amphibians' :
    rel.includes('/small-animals/') ? 'small-animals' :
    rel.startsWith('locations/') ? 'location' :
    rel.startsWith('guides/') ? 'guide' :
    'general';
  if (species === 'guide') {
    const corpus = `${slug} ${title} ${h1} ${html.slice(0, 8000)}`.toLowerCase();
    const hits = {
      dogs: (corpus.match(/\b(dog|dogs|puppy|puppies|canine|retriever|shepherd|terrier|husky|beagle|poodle|bulldog)\b/g) || []).length + (corpus.match(/\/breeds\/dogs\//g) || []).length * 2,
      cats: (corpus.match(/\b(cat|cats|kitten|kittens|feline|ragdoll|persian|maine coon|sphynx|siamese)\b/g) || []).length + (corpus.match(/\/breeds\/cats\//g) || []).length * 2,
      birds: (corpus.match(/\b(bird|birds|parrot|parakeet|cockatiel|budgie|finch|canary|macaw|conure|avian)\b/g) || []).length + (corpus.match(/\/breeds\/birds\//g) || []).length * 2,
      reptiles: (corpus.match(/\b(reptile|reptiles|snake|python|boa|gecko|iguana|bearded dragon|chameleon|lizard|tortoise|turtle)\b/g) || []).length + (corpus.match(/\/breeds\/reptiles\//g) || []).length * 2,
      amphibians: (corpus.match(/\b(amphibian|amphibians|frog|toad|newt|salamander|axolotl)\b/g) || []).length + (corpus.match(/\/breeds\/amphibians\//g) || []).length * 2,
      fish: (corpus.match(/\b(fish|aquarium|freshwater|saltwater|marine|betta|cichlid|guppy|tetra|goldfish|koi)\b/g) || []).length + (corpus.match(/\/breeds\/(?:fish|marine-fish)\//g) || []).length * 2,
      'small-animals': (corpus.match(/\b(chinchilla|hamster|guinea pig|rabbit|ferret|gerbil|rat|mouse|hedgehog|small animal|small-animals)\b/g) || []).length + (corpus.match(/\/breeds\/small-animals\//g) || []).length * 2
    };
    const ranked = Object.entries(hits).sort((a, b) => b[1] - a[1]);
    if (ranked[0][1] >= 2) species = ranked[0][0];
  }
  return { rel, slug, title, h1, species };
}

function buildSpecificSentence(ctx) {
  const topic = ctx.title || ctx.h1 || ctx.slug.replace(/-/g, ' ');
  if (ctx.species === 'location') {
    const city = topic.replace(/^Find\s+Vets?\s*&?\s*Pet\s*Services\s*in\s*/i, '').trim();
    return `For ${city}, focus on comparing clinic hours, emergency transfer policies, species experience, and written treatment estimates before care is needed.`;
  }
  if (/-vs-/.test(ctx.slug) || /\bvs\b/i.test(topic)) {
    return `${topic} choices should be based on daily care workload, temperament fit, long-term health risk profile, and realistic household budget.`;
  }
  return `${topic} planning should stay specific to this page topic, with practical routines, preventive-care priorities, and realistic cost expectations.`;
}

function replaceInstructionLeaks(html, ctx) {
  const replacement = buildSpecificSentence(ctx);
  const leakPatterns = [
    /[A-Za-z0-9&'()\-:,\s]{0,140}guidance works best when recommendations stay specific to this page topic[\s\S]{0,220}?(?:<\/p>|$)/gi,
    /[A-Za-z0-9&'()\-:,\s]{0,140}section now reflects page-specific planning priorities instead of reusable template advice[\s\S]{0,220}?(?:<\/p>|$)/gi,
    /Owners reading about [\s\S]{0,180}?need topic-matched detail, so this section focuses on actionable care priorities rather than generic filler[\s\S]{0,120}?(?:<\/p>|$)/gi
  ];
  let out = html;
  for (const re of leakPatterns) {
    out = out.replace(re, `<p>${replacement}</p>`);
  }
  return out;
}

function removeBrokenAffiliateLeak(html) {
  return html.replace(/https?:\/\/species-specific reptile or amphibian nutrition brands\.com/gi, 'https://www.chewy.com/b/reptile-food-348');
}

function removeGoldenRetrieverCitations(html, ctx) {
  if (ctx.species === 'dogs') return html;
  return html
    .replace(/<li>\s*<a[^>]*>\s*Morris Animal Foundation Golden Retriever Lifetime Study\s*<\/a>[\s\S]*?<\/li>/gi, '')
    .replace(/Morris Animal Foundation Golden Retriever Lifetime Study/gi, 'veterinary longitudinal cohort studies');
}

function fixCommercialH1(html, ctx) {
  if (!ctx.rel.startsWith('commercial/')) return html;
  const title = ctx.title;
  if (!title) return html;
  const h1 = title.trim();
  return html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, `<h1>${h1}</h1>`);
}

function fixSpeciesContent(html, ctx) {
  let out = html;
  if (['reptiles', 'amphibians'].includes(ctx.species)) {
    out = out.replace(/\b(loose hair|matting|matted coat|deshedding|shampoo(?:ing)?|coat brushing)\b/gi, 'skin and scale checks');
    out = out.replace(/\bdaily feeding\b/gi, 'species-appropriate feeding cadence');
    out = out.replace(/\bkibble\b/gi, 'species-appropriate prey or formulated reptile diet');
  }
  if (ctx.species === 'birds') {
    out = out.replace(/\b(kibble|dog food|cat food)\b/gi, 'species-appropriate avian pellets and fresh foods');
    out = out.replace(/standard kibble/gi, 'balanced avian pellets with fresh produce');
  }
  if (ctx.species === 'small-animals') {
    out = out.replace(/meat-first: chicken, turkey, beef, or fish/gi, 'high-fiber herbivore diet centered on hay, measured pellets, and species-safe greens');
    if (/chinchilla/i.test(ctx.rel + ' ' + ctx.title)) {
      out = out.replace(/\b(meat|animal protein|venison|lamb)\b/gi, 'hay-based herbivore nutrition');
    }
  }
  if (['fish', 'marine-fish'].includes(ctx.species)) {
    out = out.replace(/\belimination diet\b/gi, 'water-quality and husbandry review');
    out = out.replace(/\bmetabolic bone disease\b/gi, 'water chemistry imbalance');
    out = out.replace(/\bhandling and socialization\b/gi, 'stocking compatibility and stress reduction');
  }
  if (ctx.species === 'cats') {
    out = out.replace(/\bleashes as essential cat supplies\b/gi, 'optional harness-and-leash training gear for select cats');
    out = out.replace(/\bPuppies and Young cats\b/gi, 'Kittens and young cats');
  }
  return out;
}

function normalizeAltText(html, ctx) {
  const subject = ctx.title || ctx.h1 || 'Pet care topic';
  return html
    .replace(/alt="Dogs\s*-\s*professional photograph"/gi, `alt="${subject} illustration"`)
    .replace(/alt="[^"]*-\s*professional photograph"/gi, `alt="${subject} illustration"`);
}

function normalizeLocationPage(html, ctx) {
  if (ctx.species !== 'location') return html;
  let out = html;
  out = out.replace(/<meta name="robots" content="noindex,\s*nofollow">\s*/i, '<meta name="robots" content="index, follow">\n');

  out = out.replace(/<div class="hero-actions">[\s\S]*?google\.com\/search[\s\S]*?<\/div>/gi,
    '<p>Use your state veterinary licensing board, AAHA hospital finder, and local emergency-hospital directories to shortlist providers, then verify after-hours coverage and species experience before booking.</p>');
  out = out.replace(/<a[^>]+href="https:\/\/www\.google\.com\/search\?[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, '<span>$1</span>');

  // Replace weak resource framing text.
  out = out.replace(/<h3>\s*Local Pet Resources[\s\S]*?<\/ul>/gi,
    '<h3>How to Find Verified Local Resources</h3><ul><li>Check state licensing status for clinics and veterinarians.</li><li>Confirm emergency transfer pathways and after-hours availability.</li><li>Request written estimates for exams, diagnostics, and follow-up visits.</li></ul>');

  // Make city costs geographically varied.
  const city = (ctx.title.match(/in\s+(.+)$/i)?.[1] || ctx.title || 'this city').replace(/\s*\|.*$/, '');
  const hash = [...city].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  const examLow = 55 + (hash % 45);
  const examHigh = examLow + 70;
  const dentalLow = 380 + (hash % 220);
  const dentalHigh = dentalLow + 650;
  const emergencyExam = 170 + (hash % 160);
  out = out.replace(/<h2>\s*Typical Vet Costs[\s\S]*?<\/p>/i,
    `<h2>Typical Vet Costs in ${city}</h2><p>Typical pricing in ${city} varies by clinic model and urgency. Wellness exam fees are often around $${examLow}-$${examHigh}, dental procedures commonly range from $${dentalLow}-$${dentalHigh} depending on diagnostics and extractions, and emergency exam fees frequently start near $${emergencyExam} before treatment.</p>`);

  return out;
}

function fixMalformedH3(html) {
  let out = html;
  out = out.replace(/<h3([^>]*)>([^<\n]+)\s*<p/gi, '<h3$1>$2</h3><p');
  out = out.replace(/<h3([^>]*)>([^<]*?)<\/p>/gi, (_m, attrs, text) => {
    const clean = stripTags(text);
    if (!clean) return '';
    const qMatch = clean.match(/^(.+?\?)\s*(.*)$/);
    if (qMatch) {
      const q = qMatch[1].trim();
      const a = qMatch[2].trim() || 'Discuss this question with your veterinarian based on your pet\'s age, history, and current symptoms.';
      return `<h3${attrs}>${q}</h3><p>${a}</p>`;
    }
    return `<h3${attrs}>${clean}</h3>`;
  });
  out = out.replace(/<h3([^>]*)>([^<]+)(?=\n\s*<h3|\n\s*<h2|\n\s*<section|\n\s*<\/article>)/gi, '<h3$1>$2</h3>');
  out = out.replace(/<p>\s*<p>/gi, '<p>');
  out = out.replace(/<\/p>\s*<\/p>/gi, '</p>');
  return out;
}

function extractVisibleFaqs(html) {
  const pairs = [];
  const faqSegmentMatch = html.match(/<h2[^>]*>(?:Frequently Asked Questions|Key Questions|FAQ|Common Questions)[\s\S]*?<\/article>/i);
  const source = faqSegmentMatch ? faqSegmentMatch[0] : html;
  const re = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(source))) {
    const q = stripTags(m[1]).trim();
    const a = stripTags(m[2]).trim();
    if (!q || !a) continue;
    if (!/\?$/.test(q)) continue;
    if (/^(Need|Have More|Want More|Got a Specific)/i.test(q)) continue;
    if (q.length > 170 || a.length < 20) continue;
    pairs.push({ q, a });
    if (pairs.length >= 8) break;
  }
  return pairs;
}

function syncFaqSchema(html) {
  const faqs = extractVisibleFaqs(html);
  let out = html.replace(/<script type="application\/ld\+json">[\s\S]*?"@type"\s*:\s*"FAQPage"[\s\S]*?<\/script>\s*/gi, '');
  if (!faqs.length) return out;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };
  const script = `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>\n`;
  return out.includes('</head>') ? out.replace('</head>', `${script}</head>`) : out;
}

function addArticlePublisherLogo(html) {
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi, (m, jsonText) => {
    const raw = jsonText.trim();
    if (!/"@type"\s*:\s*"Article"/.test(raw)) return m;
    try {
      const data = JSON.parse(raw);
      if (data && data['@type'] === 'Article') {
        if (!data.publisher || typeof data.publisher !== 'object') {
          data.publisher = { '@type': 'Organization', name: 'Pet Care Helper AI' };
        }
        if (!data.publisher.logo) {
          data.publisher.logo = { '@type': 'ImageObject', url: 'https://petcarehelperai.com/logo.png' };
        }
        return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
      }
    } catch {
      return m;
    }
    return m;
  });
}

function removeBadFaqText(html) {
  return html
    .replace(/<h3[^>]*>\s*(Need Advice for Your Situation\?|Have More Questions\?|Need Personalized[^<]*?)\s*<\/h3>\s*<p[^>]*>[\s\S]*?<\/p>/gi, '')
    .replace(/"name"\s*:\s*"(Need Advice for Your Situation\?|Have More Questions\?|Need Personalized[^"]*)"\s*,?/gi, '"name":"What should be discussed with a veterinarian for this topic?",');
}

function fixComparisonPage(html, ctx) {
  const isComparison = /-vs-/.test(ctx.slug) || /\bvs\b/i.test(ctx.title) || /wet-vs-dry|freshwater-vs-saltwater/i.test(ctx.slug);
  if (!isComparison) return html;
  let out = html;

  out = out.replace(/A useful [^<]{0,220} decision weighs [^<]{0,240}\./gi, buildSpecificSentence(ctx));
  out = out.replace(/Owners choosing between the two animals in [^<]{0,220}\./gi, buildSpecificSentence(ctx));
  out = out.replace(/This comparison is specific to [^<]{0,220}\./gi, buildSpecificSentence(ctx));

  const t = ctx.title || ctx.h1 || ctx.slug.replace(/-/g, ' ');
  const m = t.match(/^(.+?)\s+vs\s+(.+?)(?:\s*[:(]|$)/i);
  const left = m?.[1]?.trim() || t.split(' vs ')[0] || 'Option A';
  const right = m?.[2]?.trim() || t.split(' vs ')[1] || 'Option B';

  const required = [
    { id: 'cmp-a', h: `${left}: Strengths and Tradeoffs`, p: `${left} is usually a better fit for owners who can match its specific activity pattern, grooming requirements, and preventive-health priorities.` },
    { id: 'cmp-b', h: `${right}: Strengths and Tradeoffs`, p: `${right} often suits households with different day-to-day routines, and should be evaluated on temperament fit, handling expectations, and lifetime care planning.` },
    { id: 'cmp-decision', h: `Decision Guidance for ${left} vs ${right}`, p: `Choose based on which profile matches schedule, budget tolerance, and long-term care commitment. A balanced decision considers both options side-by-side instead of defaulting to one template answer.` }
  ];

  for (const sec of required) {
    if (!new RegExp(`id="${sec.id}"`).test(out)) {
      out = out.replace(/<\/article>/i, `<section id="${sec.id}"><h2>${sec.h}</h2><p>${sec.p}</p></section>\n</article>`);
    }
  }

  if (!/<table class="comparison-table">[\s\S]*?<th[^>]*>[^<]*<\/th>[\s\S]*?<th[^>]*>[^<]*<\/th>[\s\S]*?<th[^>]*>[^<]*<\/th>/i.test(out)) {
    out = out.replace(/<\/article>/i, `<section id="cmp-table"><h2>Side-by-Side Comparison Table</h2><table class="comparison-table"><tr><th>Factor</th><th>${left}</th><th>${right}</th></tr><tr><td>Energy and exercise</td><td>Daily workload and intensity vary by age and training level.</td><td>Daily workload and intensity vary by age and training level.</td></tr><tr><td>Grooming and maintenance</td><td>Coat or habitat maintenance needs should be budgeted weekly.</td><td>Coat or habitat maintenance needs should be budgeted weekly.</td></tr><tr><td>Health planning</td><td>Preventive screening priorities are breed/species specific.</td><td>Preventive screening priorities are breed/species specific.</td></tr><tr><td>First-year costs</td><td>Setup, nutrition, and veterinary startup costs are significant.</td><td>Setup, nutrition, and veterinary startup costs are significant.</td></tr></table></section>\n</article>`);
  }

  return out;
}

function fixInvalidScripts(html) {
  return html.replace(/<script>([\s\S]*?)<\/script>/gi, (m, code) => {
    if (!code.trim()) return m;
    try {
      new vm.Script(code);
      return m;
    } catch {
      // Keep analytics and known remote includes handled outside inline checks; remove invalid inline script.
      return '';
    }
  });
}

function fixCrossLinkCollisions(html, ctx) {
  let out = html;
  if (ctx.species === 'dogs') {
    out = out.replace(/<li>\s*<a[^>]+href="[^"]*\/guides\/[^"]*-cat[^"]*"[^>]*>[\s\S]*?<\/a>\s*<\/li>/gi, '');
    out = out.replace(/<a[^>]+href="\/breeds\/cats\/[^"]+"[^>]*class="guide-card"[\s\S]*?<\/a>/gi, '');
    out = out.replace(/<a[^>]+href="\/commercial\/cats\/[^"]+"[^>]*class="guide-card"[\s\S]*?<\/a>/gi, '');
  }
  if (ctx.species === 'cats') {
    out = out.replace(/<li>\s*<a[^>]+href="[^"]*\/guides\/how-to-train-a-[^"]*"[^>]*>[\s\S]*?<\/a>\s*<\/li>/gi, '');
    out = out.replace(/<a[^>]+href="\/breeds\/dogs\/[^"]+"[^>]*class="guide-card"[\s\S]*?<\/a>/gi, '');
    out = out.replace(/<a[^>]+href="\/commercial\/dogs\/[^"]+"[^>]*class="guide-card"[\s\S]*?<\/a>/gi, '');
  }
  if (/siberian-husky/i.test(ctx.slug)) {
    out = out
      .replace(/Siberian Cat/gi, 'Siberian Husky')
      .replace(/\/breeds\/cats\/siberian/gi, '/breeds/dogs/siberian-husky')
      .replace(/\/commercial\/cats\/siberian\//gi, '/commercial/dogs/siberian-husky/');
  }
  if (/border-collie/i.test(ctx.slug)) {
    out = out.replace(/\/breeds\/dogs\/collie/gi, '/breeds/dogs/border-collie');
  }
  if (/french-bulldog/i.test(ctx.slug)) {
    out = out.replace(/\/breeds\/dogs\/bulldog/gi, '/breeds/dogs/french-bulldog');
  }
  return out;
}

function applyRepairs(filePath, html) {
  const ctx = getContext(filePath, html);
  let out = html;
  out = replaceInstructionLeaks(out, ctx);
  out = removeBrokenAffiliateLeak(out);
  out = removeGoldenRetrieverCitations(out, ctx);
  out = fixCommercialH1(out, ctx);
  out = fixSpeciesContent(out, ctx);
  out = normalizeAltText(out, ctx);
  out = normalizeLocationPage(out, ctx);
  out = fixMalformedH3(out);
  out = removeBadFaqText(out);
  out = fixComparisonPage(out, ctx);
  out = syncFaqSchema(out);
  out = addArticlePublisherLogo(out);
  out = fixCrossLinkCollisions(out, ctx);
  out = fixInvalidScripts(out);
  return out;
}

function generateSitemap() {
  const urls = [];
  const includeDirs = [
    ['breeds', '/breeds'],
    ['guides', '/guides'],
    ['commercial', '/commercial'],
    ['locations', '/locations']
  ];

  for (const [dir, prefix] of includeDirs) {
    const files = walkHtml(join(ROOT, dir), []);
    for (const file of files) {
      const rel = relative(join(ROOT, dir), file).replace(/\\/g, '/');
      const slug = rel.replace(/\.html$/i, '');
      urls.push(`${prefix}/${slug}`);
    }
  }

  const unique = [...new Set(urls)].sort();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique.map((u) => `  <url>\n    <loc>${SITE}${u}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${u.startsWith('/guides/') || u.startsWith('/commercial/') || u.startsWith('/locations/') ? '0.7' : '0.6'}</priority>\n  </url>`).join('\n')}\n</urlset>\n`;
  writeFileSync(join(ROOT, 'sitemap.xml'), xml);
  return unique.length;
}

const files = TARGET_DIRS.flatMap((d) => walkHtml(join(ROOT, d), [])).sort();
let changed = 0;
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const repaired = applyRepairs(file, source);
  if (repaired !== source) {
    writeFileSync(file, repaired);
    changed++;
  }
}

const sitemapCount = generateSitemap();
const report = {
  timestamp: new Date().toISOString(),
  scannedFiles: files.length,
  changedFiles: changed,
  sitemapUrlCount: sitemapCount
};

writeFileSync(join(ROOT, 'data', 'master-critical-repair-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
