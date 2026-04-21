#!/usr/bin/env node
/*
 * gen-hero-pages.js
 * Combines the 5 hero-pages-data-*.js modules and renders each entry into
 * a full HTML page under /guides/hero/<slug>.html using the site's shared
 * header, footer, schema, and styling conventions.
 * Also generates /guides/hero/index.html and emits a list of sitemap entries.
 */

const fs = require('fs');
const path = require('path');

const dataFiles = [
  './hero-pages-data.cjs',
  './hero-pages-data-2.cjs',
  './hero-pages-data-3.cjs',
  './hero-pages-data-4.cjs',
  './hero-pages-data-5.cjs',
];

const pages = dataFiles.flatMap((f) => require(path.join(__dirname, f)));

const SITE = 'https://petcarehelperai.com';
const GA = 'G-FK0N7BD82Q';

function escape(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wordCount(html) {
  return html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

function render(page) {
  const canonical = `${SITE}/guides/hero/${page.slug}`;
  const metaDesc = page.description;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: metaDesc,
    datePublished: page.published,
    dateModified: page.published,
    author: [
      { '@type': 'Organization', name: 'Pet Care Helper AI' },
      {
        '@type': 'Person',
        name: 'Paul Paradis',
        jobTitle: 'Founder',
        url: `${SITE}/about`,
      },
    ],
    reviewedBy: {
      '@type': 'Organization',
      name: 'Pet Care Helper AI Editorial Team',
      url: `${SITE}/editorial-standards`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Pet Care Helper AI',
      logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` },
    },
    mainEntityOfPage: canonical,
  };

  const hubLinks = (page.hubs || []).map((h) => {
    const label = h.replace(/^\//, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return `<a href="${h}" class="nav-link">${label}</a>`;
  }).join(' &middot; ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="dns-prefetch" href="https://www.googletagmanager.com">
  <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes">
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA}');</script>
  <meta name="description" content="${escape(metaDesc)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escape(page.title)}">
  <meta property="og:description" content="${escape(metaDesc)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="Pet Care Helper AI">
  <meta property="og:image" content="${SITE}/logo.png">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escape(page.title)}">
  <meta name="twitter:description" content="${escape(metaDesc)}">
  <title>${escape(page.title)} | Pet Care Helper AI</title>
  <link rel="stylesheet" href="../../styles.css">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>
<header class="site-header">
  <div class="logo-title">
    <div class="logo-pill"></div>
    <div>
      <span class="site-name">Pet Care Helper AI</span>
      <p class="subtitle">Dogs &bull; Cats &bull; Birds &bull; Reptiles &bull; Amphibians &bull; Fish</p>
    </div>
  </div>
  <nav class="main-nav">
    <button type="button" class="nav-toggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="mobile-menu"><span class="hamburger"></span></button>
    <ul class="nav-menu" id="mobile-menu">
      <li><a href="/" class="nav-link">Home</a></li>
      <li><a href="/chat" class="nav-link">AI Pet Help</a></li>
      <li><a href="/dogs" class="nav-link">Dogs</a></li>
      <li><a href="/cats" class="nav-link">Cats</a></li>
      <li><a href="/birds" class="nav-link">Birds</a></li>
      <li><a href="/reptiles" class="nav-link">Reptiles</a></li>
      <li><a href="/fish" class="nav-link">Fish</a></li>
      <li><a href="/guides" class="nav-link active">Guides</a></li>
      <li><a href="/about" class="nav-link">About</a></li>
    </ul>
  </nav>
</header>

<main id="main-content">
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <ol itemscope itemtype="https://schema.org/BreadcrumbList">
      <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="/"><span itemprop="name">Home</span></a>
        <meta itemprop="position" content="1">
      </li>
      <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="/guides"><span itemprop="name">Guides</span></a>
        <meta itemprop="position" content="2">
      </li>
      <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="/guides/hero/"><span itemprop="name">In-Depth Guides</span></a>
        <meta itemprop="position" content="3">
      </li>
      <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <span itemprop="name">${escape(page.title)}</span>
        <meta itemprop="position" content="4">
      </li>
    </ol>
  </nav>

  <article class="guide-content" style="max-width: 780px; margin: 0 auto; padding: 20px;">
    <p style="font-size: 0.85em; color: #64748B; margin-bottom: 4px;">${escape(page.category)} &middot; Updated ${page.published}</p>
    <h1>${escape(page.title)}</h1>
    <p style="font-size: 1.08em; color: #334155; line-height: 1.7; margin-bottom: 20px;"><em>${escape(metaDesc)}</em></p>

    <div style="background:#F8FAFC;border-left:3px solid #0D9488;padding:14px 18px;margin:20px 0;font-size:0.92em;color:#475569;">
      <strong>Editorial note:</strong> This guide was written by the editorial team and reviewed against current veterinary consensus. It is not veterinary advice. Decisions affecting your pet's health should involve your veterinarian. See our <a href="/editorial-standards">Editorial Standards</a> and <a href="/medical-disclaimer">Medical Disclaimer</a>.
    </div>

    ${page.body.trim()}

    <hr style="margin: 40px 0 20px; border: 0; border-top: 1px solid #E2E8F0;">

    <section class="content-section">
      <h2>Related reading</h2>
      <p>Other in-depth guides on this site:</p>
      <ul>
        ${pages.filter((p) => p.slug !== page.slug).slice(0, 6).map((p) => `<li><a href="/guides/hero/${p.slug}">${escape(p.title)}</a></li>`).join('\n        ')}
      </ul>
      <p style="margin-top: 16px;">Or browse the species hubs: ${hubLinks}</p>
    </section>

    <section class="transparency" style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #E2E8F0; font-size: 0.9em; color: #64748B;">
      <p><strong>Disclosures:</strong> This site publishes independent pet care guidance. Some pages include affiliate links to products and services; if you choose to purchase through those links, we may earn a commission at no additional cost to you. Affiliate relationships do not influence the health and care information on this page. For our full disclosure and editorial process, see our <a href="/editorial-standards">Editorial Standards</a>.</p>
      <p><strong>Medical disclaimer:</strong> This content is for educational purposes and does not constitute veterinary advice, diagnosis, or treatment. Always consult a licensed veterinarian about decisions affecting your pet's health. See our full <a href="/medical-disclaimer">Medical Disclaimer</a>.</p>
    </section>
  </article>
</main>

<footer class="site-footer">
  <p>Pet Care Helper AI &mdash; evidence-informed pet care guidance, written for owners who want to read the details.</p>
  <nav class="footer-nav" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;">
    <a href="/guides">Guides</a> &middot;
    <a href="/guides/hero/">In-Depth Guides</a> &middot;
    <a href="/tools/">Tools</a> &middot;
    <a href="/about">About</a> &middot;
    <a href="/contact">Contact</a> &middot;
    <a href="/editorial-standards">Editorial Standards</a> &middot;
    <a href="/medical-disclaimer">Medical Disclaimer</a> &middot;
    <a href="/privacy-policy">Privacy</a> &middot;
    <a href="/terms-of-service">Terms</a>
  </nav>
</footer>

<script>
  document.addEventListener('DOMContentLoaded', function () {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('#mobile-menu, .nav-menu');
    if (!navToggle || !navMenu) return;
    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
    navToggle.addEventListener('click', function () {
      if (!isMobile()) return;
      navMenu.classList.toggle('active');
      navToggle.setAttribute('aria-expanded', navMenu.classList.contains('active') ? 'true' : 'false');
    });
  });
</script>
</body>
</html>
`;
}

function renderIndex() {
  const byCategory = {};
  for (const p of pages) {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  }
  const cats = Object.keys(byCategory).sort();
  const cards = cats.map((cat) => {
    const items = byCategory[cat].map((p) => {
      return `<article class="guide-card" style="padding:18px;border:1px solid #E2E8F0;border-radius:10px;background:#fff;margin-bottom:12px;">
        <h3 style="margin:0 0 6px;font-size:1.08em;"><a href="/guides/hero/${p.slug}" style="text-decoration:none;color:#0F172A;">${p.title}</a></h3>
        <p style="font-size:0.92em;color:#475569;margin:0;">${p.description}</p>
      </article>`;
    }).join('\n');
    return `<section class="content-section" style="margin-bottom:28px;">
      <h2 style="font-size:1.25em;border-bottom:2px solid #0D9488;padding-bottom:6px;margin-bottom:14px;">${cat}</h2>
      ${items}
    </section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="dns-prefetch" href="https://www.googletagmanager.com">
  <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes">
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA}');</script>
  <meta name="description" content="In-depth pet care guides — long-form, evidence-informed reference pieces on emergency care, behavior, nutrition, and senior health for dogs, cats, birds, reptiles, and fish.">
  <link rel="canonical" href="${SITE}/guides/hero/">
  <meta property="og:title" content="In-Depth Pet Care Guides - Pet Care Helper AI">
  <meta property="og:description" content="Our long-form reference guides, covering the questions most pet owners google at 2 AM.">
  <meta property="og:url" content="${SITE}/guides/hero/">
  <title>In-Depth Pet Care Guides - Pet Care Helper AI</title>
  <link rel="stylesheet" href="../../styles.css">
</head>
<body>
<header class="site-header">
  <div class="logo-title">
    <div class="logo-pill"></div>
    <div>
      <span class="site-name">Pet Care Helper AI</span>
      <p class="subtitle">Dogs &bull; Cats &bull; Birds &bull; Reptiles &bull; Amphibians &bull; Fish</p>
    </div>
  </div>
  <nav class="main-nav">
    <button type="button" class="nav-toggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="mobile-menu"><span class="hamburger"></span></button>
    <ul class="nav-menu" id="mobile-menu">
      <li><a href="/" class="nav-link">Home</a></li>
      <li><a href="/chat" class="nav-link">AI Pet Help</a></li>
      <li><a href="/dogs" class="nav-link">Dogs</a></li>
      <li><a href="/cats" class="nav-link">Cats</a></li>
      <li><a href="/birds" class="nav-link">Birds</a></li>
      <li><a href="/reptiles" class="nav-link">Reptiles</a></li>
      <li><a href="/fish" class="nav-link">Fish</a></li>
      <li><a href="/guides" class="nav-link active">Guides</a></li>
      <li><a href="/about" class="nav-link">About</a></li>
    </ul>
  </nav>
</header>
<main id="main-content">
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <ol itemscope itemtype="https://schema.org/BreadcrumbList">
      <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="/"><span itemprop="name">Home</span></a>
        <meta itemprop="position" content="1">
      </li>
      <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="/guides"><span itemprop="name">Guides</span></a>
        <meta itemprop="position" content="2">
      </li>
      <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <span itemprop="name">In-Depth Guides</span>
        <meta itemprop="position" content="3">
      </li>
    </ol>
  </nav>

  <section class="hero" style="padding: 40px 20px; max-width: 840px; margin: 0 auto;">
    <h1>In-Depth Pet Care Guides</h1>
    <p style="font-size: 1.1em; color: #475569; line-height: 1.7;">These are our long-form reference guides — written to be read once carefully, then returned to when something specific comes up. Each is grounded in current veterinary consensus, cross-checked against published literature where applicable, and written in plain English. We skip the platitudes. We include the specific numbers, decisions, and trade-offs that matter when you're making a real call.</p>
    <p style="font-size: 0.9em; color: #64748B;"><em>Last full review: April 2026. Updated as veterinary consensus shifts. See <a href="/editorial-standards">Editorial Standards</a> for our full process.</em></p>
  </section>

  <div style="max-width: 840px; margin: 0 auto; padding: 0 20px 40px;">
    ${cards}
  </div>
</main>
<footer class="site-footer">
  <p>Pet Care Helper AI &mdash; evidence-informed pet care guidance, written for owners who want to read the details.</p>
  <nav class="footer-nav" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;">
    <a href="/guides">Guides</a> &middot;
    <a href="/guides/hero/">In-Depth Guides</a> &middot;
    <a href="/tools/">Tools</a> &middot;
    <a href="/about">About</a> &middot;
    <a href="/contact">Contact</a> &middot;
    <a href="/editorial-standards">Editorial Standards</a> &middot;
    <a href="/medical-disclaimer">Medical Disclaimer</a> &middot;
    <a href="/privacy-policy">Privacy</a> &middot;
    <a href="/terms-of-service">Terms</a>
  </nav>
</footer>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('#mobile-menu, .nav-menu');
    if (!navToggle || !navMenu) return;
    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
    navToggle.addEventListener('click', function () {
      if (!isMobile()) return;
      navMenu.classList.toggle('active');
      navToggle.setAttribute('aria-expanded', navMenu.classList.contains('active') ? 'true' : 'false');
    });
  });
</script>
</body>
</html>
`;
}

const outDir = path.join(__dirname, '..', 'guides', 'hero');
fs.mkdirSync(outDir, { recursive: true });

const counts = [];
for (const page of pages) {
  const html = render(page);
  const outPath = path.join(outDir, `${page.slug}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  const wc = wordCount(page.body);
  counts.push({ slug: page.slug, words: wc });
}

fs.writeFileSync(path.join(outDir, 'index.html'), renderIndex(), 'utf8');

const sitemapEntries = pages.map((p) => {
  return `  <url>\n    <loc>${SITE}/guides/hero/${p.slug}</loc>\n    <lastmod>${p.published}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.9</priority>\n  </url>`;
}).join('\n');
sitemapEntries.length && fs.writeFileSync(path.join(__dirname, 'hero-sitemap-entries.txt'),
  `  <url>\n    <loc>${SITE}/guides/hero/</loc>\n    <lastmod>2026-04-20</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n${sitemapEntries}\n`, 'utf8');

console.log(`Wrote ${pages.length} hero pages and index:`);
counts.forEach((c) => console.log(`  /guides/hero/${c.slug}.html  (${c.words} words)`));
console.log(`Sitemap entries written to engines/hero-sitemap-entries.txt`);
