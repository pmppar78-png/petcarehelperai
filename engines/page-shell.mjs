/** Shared chrome for new HTML pages. Matches the existing site header and footer. */

export function pageShell({ title, description, canonical, active = "", breadcrumb, body, extraHead = "" }) {
  const desc = description.replace(/"/g, "&quot;");
  const nav = [
    ["/", "Home", ""],
    ["/chat", "AI Pet Help", ""],
    ["/vet/", "Vet Help", "vet"],
    ["/dogs", "Dogs", "dogs"],
    ["/cats", "Cats", "cats"],
    ["/birds", "Birds", "birds"],
    ["/reptiles", "Reptiles", "reptiles"],
    ["/amphibians", "Amphibians", "amphibians"],
    ["/fish", "Fish", "fish"],
    ["/marine-fish", "Marine Fish", "marine"],
    ["/small-animals", "Small Animals", "small"],
    ["/guides", "Guides", "guides"],
  ].map(([href, label, key]) => `<li><a href="${href}" class="nav-link${active === key ? " active" : ""}">${label}</a></li>`).join("\n        ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes">
  <title>${title} | Pet Care Helper AI</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="Pet Care Helper AI">
  <link rel="stylesheet" href="/styles.css">
  ${extraHead}
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
        ${nav}
    </ul>
  </nav>
</header>
<main id="main-content">
  <div class="breadcrumb">${breadcrumb}</div>
  <article class="guide-content">
${body}
  </article>
</main>
<footer class="site-footer">
  <p>AI Pet Medical &amp; Vet Help Finder &mdash; educational guidance, real-world vet options, and curated resources.</p>
  <p style="font-size: 0.85rem; margin-top: 8px;">Some suggestions may include sponsored partners. This site does not replace a veterinarian.</p>
  <nav class="footer-nav" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;">
    <a href="/vet/">Vet Help</a> &middot;
    <a href="/vet/checker">When to See a Vet</a> &middot;
    <a href="/image-credits">Image Credits</a> &middot;
    <a href="/guides">Guides</a> &middot;
    <a href="/about">About</a> &middot;
    <a href="/contact">Contact</a> &middot;
    <a href="/privacy-policy">Privacy</a> &middot;
    <a href="/terms-of-service">Terms</a> &middot;
    <a href="/affiliate-disclosure">Disclosure</a> &middot;
    <a href="/editorial-standards">Editorial Standards</a>
  </nav>
</footer>
<script>
document.addEventListener('DOMContentLoaded', function () {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('#mobile-menu');
  if (!navToggle || !navMenu) return;
  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
  const closeMenu = () => { navMenu.classList.remove('active','open'); navToggle.classList.remove('active'); navToggle.setAttribute('aria-expanded','false'); };
  navToggle.addEventListener('click', function () {
    if (!isMobile()) return;
    const open = !navMenu.classList.contains('active');
    navMenu.classList.toggle('active', open);
    navToggle.classList.toggle('active', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { if (isMobile()) closeMenu(); }));
});
</script>
</body>
</html>
`;
}
