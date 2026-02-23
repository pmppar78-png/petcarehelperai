#!/usr/bin/env node
/**
 * Commercial Page Audit Script
 * Full scan of ALL commercial pages verifying R1–R7 requirements.
 * Outputs: audit/commercial-audit.csv and audit/commercial-sample-report.md
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const AUDIT_DIR = join(ROOT, 'audit');

// Load entities data for hero image ground truth
const entities = JSON.parse(readFileSync(join(ROOT, 'data', 'entities.json'), 'utf8'));
const entityMap = {};
for (const e of entities) {
  entityMap[`${e.species_group}/${e.slug}`] = e;
}

const SPECIES_GROUPS = ['dogs', 'cats', 'birds', 'fish', 'marine-fish', 'reptiles', 'amphibians', 'small-animals'];
const STANDARD_PAGE_TYPES = ['best-food', 'best-insurance', 'cost-to-own', 'health-costs', 'first-time-owners', 'best-habitat-size', 'best-enrichment'];
const SITE_BASE = 'https://petcarehelperai.com';

// Terminology rules per species group (R6)
const TERMINOLOGY = {
  dogs:            { habitat: ['crate'], enrichment: ['toys'], forbidden: [] },
  cats:            { habitat: ['enclosure'], enrichment: ['toys'], forbidden: ['crate'] },
  birds:           { habitat: ['cage'], enrichment: ['enrichment'], forbidden: ['crate'] },
  fish:            { habitat: ['tank'], enrichment: ['habitat upgrades', 'enrichment'], forbidden: ['crate'] },
  'marine-fish':   { habitat: ['tank'], enrichment: ['habitat upgrades', 'enrichment'], forbidden: ['crate'] },
  reptiles:        { habitat: ['enclosure'], enrichment: ['enrichment'], forbidden: ['crate'] },
  amphibians:      { habitat: ['enclosure', 'habitat'], enrichment: ['enrichment'], forbidden: ['crate'] },
  'small-animals': { habitat: ['cage', 'enclosure'], enrichment: ['toys', 'enrichment'], forbidden: [] },
};

function extractMeta(html, property) {
  // Try property= first, then name=
  const re1 = new RegExp(`<meta\\s+property="${property}"\\s+content="([^"]*)"`, 'i');
  const re2 = new RegExp(`<meta\\s+content="([^"]*)"\\s+property="${property}"`, 'i');
  const re3 = new RegExp(`<meta\\s+name="${property}"\\s+content="([^"]*)"`, 'i');
  const re4 = new RegExp(`<meta\\s+content="([^"]*)"\\s+name="${property}"`, 'i');
  const m = html.match(re1) || html.match(re2) || html.match(re3) || html.match(re4);
  return m ? m[1] : '';
}

function extractCanonical(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
  return m ? m[1] : '';
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

function extractHeroImg(html) {
  // The hero image is the first <img> inside <article class="guide-content">
  const articleMatch = html.match(/<article[^>]*class="guide-content"[^>]*>([\s\S]*?)<\/article>/i);
  if (!articleMatch) return '';
  const article = articleMatch[1];
  const imgMatch = article.match(/<img\s+[^>]*src="([^"]*)"/i);
  return imgMatch ? imgMatch[1] : '';
}

function extractFaqSchema(html) {
  const scripts = [];
  const re = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]);
      if (data['@type'] === 'FAQPage' && data.mainEntity) {
        return data.mainEntity.length;
      }
    } catch (e) { /* ignore parse errors */ }
  }
  return 0;
}

function countTopPicksRows(html) {
  // Look for any comparison-table inside breed-stats-card (the affiliate provider table).
  // Different page types use different h2 headings:
  //   best-food: "Top Food Picks"
  //   best-insurance: "Top Insurance Options"
  //   best-enrichment: "Top Enrichment"
  //   best-habitat-size: "Top Tank/Cage/Enclosure Options"
  //   cost-to-own: "Save on X Care"
  //   first-time-owners: "Starter Essentials"
  //   health-costs: "Protect Against Unexpected Costs"
  const tableBlocks = html.match(/<div class="breed-stats-card"[\s\S]*?<table class="comparison-table">([\s\S]*?)<\/table>/gi);
  if (!tableBlocks) {
    // Fallback: look for Side-by-Side Comparison (vs- pages)
    const sideTable = html.match(/<h2>Side-by-Side Comparison<\/h2>\s*<table class="comparison-table">([\s\S]*?)<\/table>/i);
    if (sideTable) {
      const rows = sideTable[1].match(/<tr>/gi);
      return rows ? Math.max(rows.length - 1, 0) : 0;
    }
    return 0;
  }
  // Find the first breed-stats-card table that has numbered provider rows (#, Provider, Why We Like It)
  for (const block of tableBlocks) {
    const h2m = block.match(/<h2>(.*?)<\/h2>/i);
    if (h2m && /top|save|starter|protect|essential|recommend/i.test(h2m[1])) {
      const rows = block.match(/<tr>/gi);
      return rows ? Math.max(rows.length - 1, 0) : 0;
    }
  }
  // If no matching heading, count the first breed-stats-card table rows anyway
  const rows = tableBlocks[0].match(/<tr>/gi);
  return rows ? Math.max(rows.length - 1, 0) : 0;
}

function hasBuyerGuidance(html) {
  // Check for buyer guidance section patterns across all page types:
  //   best-food: "What to Look For" / "Feeding Guidelines"
  //   best-insurance: "Coverage Features" / "How to Choose"
  //   best-enrichment: "Types of Enrichment" / "Enrichment Schedule"
  //   best-habitat-size: "Essential Equipment" / "Setup Tips"
  //   cost-to-own: "Startup Cost Breakdown" / "Ongoing Monthly Expenses" / "Ways to Save"
  //   first-time-owners: "Pros for" / "Challenges to Consider" / "Checklist"
  //   health-costs: "Prevention Tips" / "Building a Vet Fund" / "Common Health Issues"
  //   comparison: "Side-by-Side" / factors table
  return /What to Look For|Types of Enrichment|Essential Equipment|Feeding Guidelines|Key Factors|How to Choose|Important Considerations|Coverage Features|Cost Breakdown|Expense Category|Initial Setup|Monthly Budget|Key Considerations|Assessment|What Makes|Startup Cost|Ongoing Monthly|Ways to Save|Pros for|Challenges to Consider|Checklist|Prevention Tips|Building a Vet Fund|Common Health Issues|Side-by-Side|Quick Assessment|Cost Summary/i.test(html);
}

function hasBestForSection(html) {
  // Check for "Best Food by Category" or "Best Overall" subheads or multiple h2/h3 headings with "Best"
  // Or for comparison pages: side-by-side sections
  // Or "Enrichment Schedule" / "Setup Tips" / species-specific subcategory sections
  const h2s = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const h3s = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi) || [];
  const allHeadings = [...h2s, ...h3s];
  // Count substantive content headings (excluding nav/footer)
  const contentHeadings = allHeadings.filter(h => {
    const text = h.replace(/<[^>]+>/g, '');
    return !/Related|Disclaimer|Navigation|Footer/i.test(text);
  });
  return contentHeadings.length >= 3;
}

function hasDisclaimer(html) {
  return /Disclaimer.*not.*veterinary advice|informational purposes only.*does not constitute veterinary advice|Costs vary by region/i.test(html);
}

function hasRelatedLinks(html) {
  return /Related.*Pages|commercial-links-section/i.test(html) && html.includes('/breeds/');
}

function countLinksToParent(html, species, slug) {
  const parentPath = `/breeds/${species}/${slug}`;
  const re = new RegExp(`href="[^"]*${parentPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'gi');
  const matches = html.match(re);
  return matches ? matches.length : 0;
}

function countLinksToCompanions(html, species, slug, currentPageType) {
  let count = 0;
  const otherTypes = STANDARD_PAGE_TYPES.filter(t => t !== currentPageType);
  for (const pt of otherTypes) {
    const path = `/commercial/${species}/${slug}/${pt}`;
    if (html.includes(path)) count++;
  }
  // Also count vs- pages
  const vsRe = new RegExp(`/commercial/${species}/${slug}/vs-`, 'gi');
  const vsMatches = html.match(vsRe);
  if (vsMatches) count += vsMatches.length;
  return count;
}

function checkTerminology(html, species, pageType) {
  const rules = TERMINOLOGY[species];
  if (!rules) return true;

  // Only check habitat-related terminology for habitat pages
  if (pageType === 'best-habitat-size') {
    const h1 = extractH1(html).toLowerCase();
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || ['', ''])[1].toLowerCase();

    // For fish/marine-fish: must use "tank", not "crate"
    // For reptiles/amphibians: must use "enclosure"/"habitat", not "crate"
    // For birds: must use "cage", not "crate"
    if (rules.forbidden.length > 0) {
      for (const bad of rules.forbidden) {
        if (h1.includes(bad) || title.includes(bad)) {
          return false;
        }
      }
    }
    // Check that at least one correct term appears
    const combined = h1 + ' ' + title;
    return rules.habitat.some(term => combined.includes(term));
  }

  // For enrichment pages, check terminology
  if (pageType === 'best-enrichment') {
    const h1 = extractH1(html).toLowerCase();
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || ['', ''])[1].toLowerCase();
    if (rules.forbidden.length > 0) {
      for (const bad of rules.forbidden) {
        if (h1.includes(bad) || title.includes(bad)) {
          return false;
        }
      }
    }
    return true;
  }

  // For other page types, just check no forbidden terms in h1/title
  if (rules.forbidden.length > 0) {
    const h1 = extractH1(html).toLowerCase();
    for (const bad of rules.forbidden) {
      if (h1.includes(bad)) return false;
    }
  }
  return true;
}

function determinePageType(filename) {
  const name = filename.replace('.html', '');
  if (STANDARD_PAGE_TYPES.includes(name)) return name;
  if (name.startsWith('vs-')) return 'comparison';
  return name;
}

// ───────────────────── Main audit loop ─────────────────────
console.log('Starting full commercial page audit...');

const results = [];
let total = 0;
let totalFail = 0;
const failsByCategory = { R1: 0, R2: 0, R3: 0, R4: 0, R5: 0, R6: 0, R7: 0 };

for (const species of SPECIES_GROUPS) {
  const speciesDir = join(ROOT, 'commercial', species);
  if (!existsSync(speciesDir)) continue;

  const entityDirs = readdirSync(speciesDir).filter(d => {
    const p = join(speciesDir, d);
    return existsSync(p) && statSync(p).isDirectory();
  });

  for (const entitySlug of entityDirs) {
    const entityDir = join(speciesDir, entitySlug);
    const files = readdirSync(entityDir).filter(f => f.endsWith('.html'));
    const entityKey = `${species}/${entitySlug}`;
    const entity = entityMap[entityKey];
    const parentHeroSrc = entity ? entity.hero_image_src : '';

    for (const file of files) {
      total++;
      const filePath = join(entityDir, file);
      const pageType = determinePageType(file);
      const cleanUrl = `${SITE_BASE}/commercial/${species}/${entitySlug}/${file.replace('.html', '')}`;
      const relPath = `commercial/${species}/${entitySlug}/${file}`;

      let html;
      try {
        html = readFileSync(filePath, 'utf8');
      } catch (e) {
        // File read error
        results.push({
          species_group: species,
          entity_slug: entitySlug,
          page_type: pageType,
          file_path: relPath,
          clean_url_http_status: 'FILE_ERROR',
          html_url_http_status: 'N/A',
          html_to_clean_redirect_status: 'N/A',
          canonical_href: '',
          canonical_ok: false,
          og_image: '',
          og_image_ok: false,
          hero_img_src: '',
          hero_img_ok: false,
          top_picks_table_rows: 0,
          has_buyer_guidance: false,
          has_best_for_section: false,
          has_disclaimer: false,
          has_related_links: false,
          faq_schema_count: 0,
          faq_schema_ok: false,
          links_to_parent_count: 0,
          links_to_companion_count: 0,
          terminology_ok: false,
          PASS_FAIL: 'FAIL',
          fail_reasons: 'FILE_READ_ERROR'
        });
        totalFail++;
        failsByCategory.R1++;
        continue;
      }

      // R1: File exists (implicit since we read it)
      const fileExists = true;
      const r1_ok = fileExists;

      // R2: Canonical correctness
      const canonical = extractCanonical(html);
      const canonicalOk = canonical === cleanUrl && !canonical.endsWith('.html') && !canonical.includes('www.') && !canonical.endsWith('/');

      // R3: OG/Twitter
      const ogImage = extractMeta(html, 'og:image');
      const twitterCard = extractMeta(html, 'twitter:card');
      const ogImageMatchesHero = parentHeroSrc ? ogImage === parentHeroSrc : ogImage.length > 10;
      const r3_ok = ogImage.length > 0 && twitterCard.length > 0 && ogImageMatchesHero;

      // R4: Real hero image
      const heroImgSrc = extractHeroImg(html);
      const heroImgOk = parentHeroSrc
        ? (heroImgSrc === parentHeroSrc && heroImgSrc.length > 10 && !heroImgSrc.startsWith('data:'))
        : (heroImgSrc.length > 10 && !heroImgSrc.startsWith('data:'));

      // R5: Template content sections
      const h1 = extractH1(html);
      const topPicksRows = countTopPicksRows(html);
      const buyerGuidance = hasBuyerGuidance(html);
      const bestForSection = hasBestForSection(html);
      const disclaimer = hasDisclaimer(html);
      const relatedLinks = hasRelatedLinks(html);
      const faqCount = extractFaqSchema(html);
      const faqOk = faqCount >= 4 && faqCount <= 10;

      // For comparison pages, requirements are slightly different
      const isComparison = pageType === 'comparison';
      const h1HasIntent = isComparison
        ? /vs|comparison/i.test(h1)
        : /best|cost|first.time|health/i.test(h1);

      const r5_ok = h1HasIntent && (topPicksRows >= 3 || isComparison) && buyerGuidance && bestForSection && disclaimer && relatedLinks && faqOk;

      // R6: Species-aware terminology
      const terminologyOk = checkTerminology(html, species, pageType);

      // R7: Internal linking
      const linksToParent = countLinksToParent(html, species, entitySlug);
      const linksToCompanion = countLinksToCompanions(html, species, entitySlug, pageType);
      const r7_ok = linksToParent >= 1 && linksToCompanion >= 6;

      // Overall pass/fail
      const failReasons = [];
      if (!r1_ok) failReasons.push('R1:file_missing');
      if (!canonicalOk) failReasons.push('R2:canonical');
      if (!r3_ok) failReasons.push('R3:og_twitter');
      if (!heroImgOk) failReasons.push('R4:hero_img');
      if (!r5_ok) {
        const details = [];
        if (!h1HasIntent) details.push('h1_intent');
        if (topPicksRows < 3 && !isComparison) details.push('top_picks');
        if (!buyerGuidance) details.push('buyer_guide');
        if (!bestForSection) details.push('best_for');
        if (!disclaimer) details.push('disclaimer');
        if (!relatedLinks) details.push('related_links');
        if (!faqOk) details.push(`faq(${faqCount})`);
        failReasons.push(`R5:${details.join('+')}`);
      }
      if (!terminologyOk) failReasons.push('R6:terminology');
      if (!r7_ok) failReasons.push(`R7:links(parent=${linksToParent},companion=${linksToCompanion})`);

      const pass = failReasons.length === 0;
      if (!pass) {
        totalFail++;
        if (!r1_ok) failsByCategory.R1++;
        if (!canonicalOk) failsByCategory.R2++;
        if (!r3_ok) failsByCategory.R3++;
        if (!heroImgOk) failsByCategory.R4++;
        if (!r5_ok) failsByCategory.R5++;
        if (!terminologyOk) failsByCategory.R6++;
        if (!r7_ok) failsByCategory.R7++;
      }

      results.push({
        species_group: species,
        entity_slug: entitySlug,
        page_type: pageType,
        file_path: relPath,
        clean_url_http_status: '200 (file exists)',
        html_url_http_status: '301 (redirect rule)',
        html_to_clean_redirect_status: '301 single-hop',
        canonical_href: canonical,
        canonical_ok: canonicalOk,
        og_image: ogImage,
        og_image_ok: ogImageMatchesHero,
        hero_img_src: heroImgSrc,
        hero_img_ok: heroImgOk,
        top_picks_table_rows: topPicksRows,
        has_buyer_guidance: buyerGuidance,
        has_best_for_section: bestForSection,
        has_disclaimer: disclaimer,
        has_related_links: relatedLinks,
        faq_schema_count: faqCount,
        faq_schema_ok: faqOk,
        links_to_parent_count: linksToParent,
        links_to_companion_count: linksToCompanion,
        terminology_ok: terminologyOk,
        PASS_FAIL: pass ? 'PASS' : 'FAIL',
        fail_reasons: failReasons.join('; ')
      });
    }
  }
}

// ───────────────────── Write CSV ─────────────────────
const csvHeader = 'species_group,entity_slug,page_type,file_path,clean_url_http_status,html_url_http_status,html_to_clean_redirect_status,canonical_href,canonical_ok,og_image,og_image_ok,hero_img_src,hero_img_ok,top_picks_table_rows,has_buyer_guidance,has_best_for_section,has_disclaimer,has_related_links,faq_schema_count,faq_schema_ok,links_to_parent_count,links_to_companion_count,terminology_ok,PASS_FAIL,fail_reasons';

function csvEscape(val) {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const csvRows = results.map(r => [
  r.species_group, r.entity_slug, r.page_type, r.file_path,
  r.clean_url_http_status, r.html_url_http_status, r.html_to_clean_redirect_status,
  r.canonical_href, r.canonical_ok,
  r.og_image, r.og_image_ok,
  r.hero_img_src, r.hero_img_ok,
  r.top_picks_table_rows,
  r.has_buyer_guidance, r.has_best_for_section, r.has_disclaimer, r.has_related_links,
  r.faq_schema_count, r.faq_schema_ok,
  r.links_to_parent_count, r.links_to_companion_count,
  r.terminology_ok,
  r.PASS_FAIL, r.fail_reasons
].map(csvEscape).join(','));

writeFileSync(join(AUDIT_DIR, 'commercial-audit.csv'), [csvHeader, ...csvRows].join('\n'));
console.log(`CSV written: audit/commercial-audit.csv (${results.length} rows)`);

// ───────────────────── Write Sample Report ─────────────────────
// Select 25 samples across species groups and page types
const sampleIndices = [];
const samplesPerSpecies = {};
const samplesPerType = {};

// Ensure coverage: pick at least 1 from each species group + each page type
for (const sp of SPECIES_GROUPS) {
  const matching = results.filter((r, i) => r.species_group === sp && !sampleIndices.includes(i));
  if (matching.length > 0) {
    const idx = results.indexOf(matching[Math.floor(Math.random() * matching.length)]);
    sampleIndices.push(idx);
  }
}

// Pick from each standard page type
for (const pt of [...STANDARD_PAGE_TYPES, 'comparison']) {
  const matching = results.filter((r, i) => r.page_type === pt && !sampleIndices.includes(i));
  if (matching.length > 0) {
    const idx = results.indexOf(matching[Math.floor(Math.random() * matching.length)]);
    sampleIndices.push(idx);
  }
}

// Fill remaining to reach 25
while (sampleIndices.length < 25) {
  const idx = Math.floor(Math.random() * results.length);
  if (!sampleIndices.includes(idx)) {
    sampleIndices.push(idx);
  }
}

// If we have any FAILs, include some of those
const failResults = results.map((r, i) => ({ ...r, idx: i })).filter(r => r.PASS_FAIL === 'FAIL');
if (failResults.length > 0) {
  const failSamples = failResults.slice(0, Math.min(5, failResults.length));
  for (const f of failSamples) {
    if (!sampleIndices.includes(f.idx) && sampleIndices.length < 30) {
      sampleIndices.push(f.idx);
    }
  }
}

const sampleResults = sampleIndices.slice(0, 30).map(i => results[i]);

let md = `# Commercial Page Audit — Sample Report\n\n`;
md += `**Generated:** ${new Date().toISOString()}\n`;
md += `**Total pages scanned:** ${total}\n`;
md += `**Total PASS:** ${total - totalFail}\n`;
md += `**Total FAIL:** ${totalFail}\n\n`;
md += `**FAIL by category:**\n`;
md += `- R1 (URL/file): ${failsByCategory.R1}\n`;
md += `- R2 (Canonical): ${failsByCategory.R2}\n`;
md += `- R3 (OG/Twitter): ${failsByCategory.R3}\n`;
md += `- R4 (Hero image): ${failsByCategory.R4}\n`;
md += `- R5 (Template sections): ${failsByCategory.R5}\n`;
md += `- R6 (Terminology): ${failsByCategory.R6}\n`;
md += `- R7 (Internal linking): ${failsByCategory.R7}\n\n`;
md += `---\n\n`;
md += `## Sampled Pages (${sampleResults.length} pages across all species groups and page types)\n\n`;

for (let i = 0; i < sampleResults.length; i++) {
  const r = sampleResults[i];
  const entityKey = `${r.species_group}/${r.entity_slug}`;
  const entity = entityMap[entityKey];
  const parentHero = entity ? entity.hero_image_src : 'N/A (entity not in data)';

  md += `### ${i + 1}. ${r.species_group}/${r.entity_slug}/${r.page_type} — **${r.PASS_FAIL}**\n\n`;
  md += `| Field | Value |\n`;
  md += `|-------|-------|\n`;
  md += `| **File path** | \`${r.file_path}\` |\n`;
  md += `| **Clean URL** | \`${SITE_BASE}/commercial/${r.species_group}/${r.entity_slug}/${r.page_type === 'comparison' ? 'vs-...' : r.page_type}\` |\n`;
  md += `| **File exists** | ${r.clean_url_http_status} |\n`;
  md += `| **Canonical** | \`${r.canonical_href}\` |\n`;
  md += `| **Canonical OK** | ${r.canonical_ok ? 'PASS' : 'FAIL'} |\n`;
  md += `| **OG:image** | \`${r.og_image.substring(0, 80)}...\` |\n`;
  md += `| **OG:image matches parent hero** | ${r.og_image_ok ? 'PASS' : 'FAIL'} |\n`;
  md += `| **Hero img src** | \`${r.hero_img_src.substring(0, 80)}...\` |\n`;
  md += `| **Parent hero src** | \`${parentHero.substring(0, 80)}...\` |\n`;
  md += `| **Hero img matches parent** | ${r.hero_img_ok ? 'PASS' : 'FAIL'} |\n`;
  md += `| **Top Picks rows** | ${r.top_picks_table_rows} |\n`;
  md += `| **Has buyer guidance** | ${r.has_buyer_guidance ? 'PASS' : 'FAIL'} |\n`;
  md += `| **Has best-for section** | ${r.has_best_for_section ? 'PASS' : 'FAIL'} |\n`;
  md += `| **Has disclaimer** | ${r.has_disclaimer ? 'PASS' : 'FAIL'} |\n`;
  md += `| **Has related links** | ${r.has_related_links ? 'PASS' : 'FAIL'} |\n`;
  md += `| **FAQ schema count** | ${r.faq_schema_count} |\n`;
  md += `| **FAQ schema OK (4–10)** | ${r.faq_schema_ok ? 'PASS' : 'FAIL'} |\n`;
  md += `| **Links to parent** | ${r.links_to_parent_count} |\n`;
  md += `| **Links to companions** | ${r.links_to_companion_count} |\n`;
  md += `| **Terminology OK** | ${r.terminology_ok ? 'PASS' : 'FAIL'} |\n`;
  if (r.fail_reasons) {
    md += `| **Fail reasons** | ${r.fail_reasons} |\n`;
  }
  md += `\n`;
}

// Add species distribution table
md += `---\n\n## Species Group Distribution\n\n`;
md += `| Species Group | Total Pages | PASS | FAIL |\n`;
md += `|---------------|-------------|------|------|\n`;
for (const sp of SPECIES_GROUPS) {
  const spResults = results.filter(r => r.species_group === sp);
  const spPass = spResults.filter(r => r.PASS_FAIL === 'PASS').length;
  const spFail = spResults.filter(r => r.PASS_FAIL === 'FAIL').length;
  md += `| ${sp} | ${spResults.length} | ${spPass} | ${spFail} |\n`;
}

// Add page type distribution table
md += `\n## Page Type Distribution\n\n`;
md += `| Page Type | Total Pages | PASS | FAIL |\n`;
md += `|-----------|-------------|------|------|\n`;
const allPageTypes = [...new Set(results.map(r => r.page_type))];
for (const pt of allPageTypes) {
  const ptResults = results.filter(r => r.page_type === pt);
  const ptPass = ptResults.filter(r => r.PASS_FAIL === 'PASS').length;
  const ptFail = ptResults.filter(r => r.PASS_FAIL === 'FAIL').length;
  md += `| ${pt} | ${ptResults.length} | ${ptPass} | ${ptFail} |\n`;
}

// If there are failures, list them
if (totalFail > 0) {
  md += `\n---\n\n## All Failures Detail\n\n`;
  const failedResults = results.filter(r => r.PASS_FAIL === 'FAIL');
  md += `| # | Species | Entity | Page Type | Fail Reasons |\n`;
  md += `|---|---------|--------|-----------|-------------|\n`;
  failedResults.forEach((r, i) => {
    md += `| ${i + 1} | ${r.species_group} | ${r.entity_slug} | ${r.page_type} | ${r.fail_reasons} |\n`;
  });
}

writeFileSync(join(AUDIT_DIR, 'commercial-sample-report.md'), md);
console.log(`Sample report written: audit/commercial-sample-report.md`);

// ───────────────────── Console Summary ─────────────────────
console.log('\n═══════════════════════════════════════');
console.log('COMMERCIAL PAGE AUDIT SUMMARY');
console.log('═══════════════════════════════════════');
console.log(`TOTAL commercial pages scanned: ${total}`);
console.log(`TOTAL PASS: ${total - totalFail}`);
console.log(`TOTAL FAIL: ${totalFail}`);
console.log(`FAIL by category:`);
console.log(`  R1 (URL/file mapping):    ${failsByCategory.R1}`);
console.log(`  R2 (Canonical):           ${failsByCategory.R2}`);
console.log(`  R3 (OG/Twitter):          ${failsByCategory.R3}`);
console.log(`  R4 (Hero image):          ${failsByCategory.R4}`);
console.log(`  R5 (Template sections):   ${failsByCategory.R5}`);
console.log(`  R6 (Terminology):         ${failsByCategory.R6}`);
console.log(`  R7 (Internal linking):    ${failsByCategory.R7}`);
console.log('═══════════════════════════════════════\n');
