import fs from 'fs';
import path from 'path';

const DIR = 'breeds/birds';

// [slug, name, size, lifespan, noise, careLevel, diet, type]
const breeds = [
  ['american-singer-canary','American Singer Canary','Small (5 in)','10-15 years','Moderate (melodious)','Beginner','Seeds, greens, egg food','Canary'],
  ['bourke-parakeet','Bourke\'s Parakeet','Small (7-8 in)','15-25 years','Low','Beginner','Seeds, pellets, vegetables','Parakeet'],
  ['bourkes-parakeet','Bourke\'s Parakeet','Small (7-8 in)','15-25 years','Low','Beginner','Seeds, pellets, vegetables','Parakeet'],
  ['button-quail','Button Quail','Very Small (4 in)','3-6 years','Very Low','Intermediate','Seeds, insects, greens','Quail'],
  ['chicken','Backyard Chicken','Medium-Large','5-10 years','Moderate','Beginner','Layer feed, greens, insects','Poultry'],
  ['cordon-bleu','Cordon Bleu Finch','Very Small (5 in)','7-10 years','Low (soft warble)','Intermediate','Seeds, live insects, egg food','Finch'],
  ['coturnix-quail','Coturnix Quail','Small (7 in)','2-5 years','Low','Beginner','Game bird feed, greens','Quail'],
  ['diamond-dove','Diamond Dove','Small (7-8 in)','10-15 years','Low (gentle coo)','Beginner','Seeds, grit, greens','Dove'],
  ['dove','Ring-necked Dove','Medium (12 in)','12-20 years','Low (soft coo)','Beginner','Seeds, grit, greens','Dove'],
  ['gloster-canary','Gloster Canary','Small (4.5 in)','10-15 years','Moderate','Beginner','Seeds, greens, egg food','Canary'],
  ['gouldian-finch','Gouldian Finch','Very Small (5 in)','6-8 years','Very Low','Advanced','Seeds, live food, supplements','Finch'],
  ['java-finch','Java Finch','Small (5-6 in)','7-12 years','Low','Beginner','Seeds, pellets, greens','Finch'],
  ['lineolated-parakeet','Lineolated Parakeet','Small (6-7 in)','10-20 years','Low','Beginner','Pellets, seeds, vegetables','Parakeet'],
  ['lorikeet','Rainbow Lorikeet','Medium (10-12 in)','20-30 years','High','Advanced','Nectar, pollen, fruit','Lorikeet'],
  ['meyer-parrot','Meyer\'s Parrot','Small-Medium (8-9 in)','25-35 years','Low-Moderate','Intermediate','Pellets, vegetables, nuts','Parrot'],
  ['mynah','Common Mynah','Medium (9-10 in)','12-25 years','High (excellent talker)','Intermediate','Pellets, fruit, insects','Softbill'],
  ['owl-finch','Owl Finch','Very Small (4 in)','5-8 years','Very Low','Intermediate','Seeds, live insects, greens','Finch'],
  ['pigeon','Domestic Pigeon','Medium (12-14 in)','10-15 years','Low','Beginner','Pigeon mix, grit, greens','Pigeon'],
  ['red-bellied-parrot','Red-Bellied Parrot','Small-Medium (9 in)','20-30 years','Low-Moderate','Intermediate','Pellets, vegetables, nuts','Parrot'],
  ['red-factor-canary','Red Factor Canary','Small (5 in)','10-15 years','Moderate','Beginner','Seeds, color food, greens','Canary'],
  ['roller-canary','Roller Canary','Small (5 in)','10-15 years','Moderate (rolling song)','Beginner','Seeds, greens, egg food','Canary'],
  ['society-finch','Society Finch','Very Small (4-5 in)','5-8 years','Very Low','Beginner','Seeds, greens, egg food','Finch'],
  ['spice-finch','Spice Finch','Very Small (4-5 in)','5-8 years','Very Low','Beginner','Seeds, greens','Finch'],
  ['star-finch','Star Finch','Very Small (4-5 in)','5-8 years','Very Low','Intermediate','Seeds, live insects, greens','Finch'],
  ['toucan','Toucan','Large (18-25 in)','15-20 years','Moderate','Advanced','Fruit, pellets, insects','Softbill'],
  ['zebra-finch','Zebra Finch','Very Small (4 in)','5-10 years','Low (cheerful chirps)','Beginner','Seeds, greens, cuttlebone','Finch'],
];

function makePage(b) {
  const [slug,name,size,lifespan,noise,careLevel,diet,type] = b;
  const isParrot = type === 'Parrot' || type === 'Lorikeet' || type === 'Parakeet';
  const isFinch = type === 'Finch' || type === 'Canary';
  const cageSize = isParrot ? '24x24x36 inches minimum' : isFinch ? '24x12x18 inches minimum (flight cage preferred)' : '24x24x24 inches minimum';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google-adsense-account" content="ca-pub-6484141649562994">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6484141649562994" crossorigin="anonymous"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-FK0N7BD82Q"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-FK0N7BD82Q');</script>
  <meta name="description" content="Complete ${name} care guide: housing, diet, temperament, health issues, and recommended products. Expert AI-powered advice.">
  <link rel="canonical" href="https://petcarehelperai.com/breeds/birds/${slug}">
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${name}: Complete Species Guide 2024 - Pet Care Helper AI" />
  <meta property="og:description" content="Complete ${name} care guide: housing, diet, temperament, health issues, and recommended products." />
  <meta property="og:url" content="https://petcarehelperai.com/breeds/birds/${slug}" />
  <meta property="og:site_name" content="Pet Care Helper AI" />
  <title>${name}: Complete Species Guide 2024 - Pet Care Helper AI</title>
  <link rel="stylesheet" href="../../styles.css">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Article","headline":"${name}: Complete Species Guide 2024","datePublished":"2026-02-19","dateModified":"2026-02-19","description":"Complete ${name} care guide covering housing, diet, temperament, and health.","author":{"@type":"Organization","name":"Pet Care Helper AI"},"publisher":{"@type":"Organization","name":"Pet Care Helper AI"}}
  </script>
</head>
<body>
  <header class="site-header">
    <div class="logo-title"><div class="logo-pill"></div><div><span class="site-name">Pet Care Helper AI</span><p class="subtitle">Dogs &bull; Cats &bull; Birds &bull; Reptiles &bull; Fish</p></div></div>
    <nav class="main-nav">
      <button class="nav-toggle" aria-label="Toggle navigation"><span class="hamburger"></span></button>
      <ul class="nav-menu">
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/chat" class="nav-link">AI Pet Help</a></li>
        <li><a href="/dogs" class="nav-link">Dogs</a></li>
        <li><a href="/cats" class="nav-link">Cats</a></li>
        <li><a href="/birds" class="nav-link active">Birds</a></li>
        <li><a href="/reptiles" class="nav-link">Reptiles</a></li>
        <li><a href="/fish" class="nav-link">Fish</a></li>
        <li><a href="/guides" class="nav-link">Guides</a></li>
      </ul>
    </nav>
  </header>
  <main>
    <div class="breadcrumb">
      <a href="/">Home</a> <span>&rsaquo;</span>
      <a href="/birds">Birds</a> <span>&rsaquo;</span>
      <a href="/breeds/bird-breeds">Species</a> <span>&rsaquo;</span>
      ${name}
    </div>
    <article class="guide-content">
      <h1>${name}: Complete Species Guide</h1>
      <div class="breed-stats-card">
        <h2>Quick Facts</h2>
        <table class="comparison-table">
          <tr><th>Attribute</th><th>Details</th></tr>
          <tr><td>Type</td><td>${type}</td></tr>
          <tr><td>Size</td><td>${size}</td></tr>
          <tr><td>Lifespan</td><td>${lifespan}</td></tr>
          <tr><td>Noise Level</td><td>${noise}</td></tr>
          <tr><td>Diet</td><td>${diet}</td></tr>
          <tr><td>Care Level</td><td>${careLevel}</td></tr>
          <tr><td>Cage Size</td><td>${cageSize}</td></tr>
        </table>
      </div>

      <div class="affiliate-callout">
        <h4>Recommended for ${name}s</h4>
        <p>
          ${isParrot ? '<a href="https://harrisonsbirdfoods.com" target="_blank" rel="sponsored noopener">Harrison\'s Bird Foods</a> - Organic pellets | <a href="https://lafeber.com" target="_blank" rel="sponsored noopener">Lafeber</a> - Nutri-berries &amp; pellets' : '<a href="https://www.kaytee.com" target="_blank" rel="sponsored noopener">Kaytee</a> - Premium bird food | <a href="https://lafeber.com" target="_blank" rel="sponsored noopener">Lafeber</a> - Quality bird nutrition'} |
          <a href="https://www.chewy.com" target="_blank" rel="sponsored noopener">Chewy</a> - Cages &amp; accessories
        </p>
      </div>

      <h2>${name} Overview</h2>
      <p>The ${name} is a ${size.toLowerCase()} ${type.toLowerCase()} that has captivated bird enthusiasts worldwide. With a lifespan of ${lifespan}, this species offers ${lifespan.includes('20') || lifespan.includes('25') || lifespan.includes('30') ? 'many years of companionship and is a significant commitment' : 'years of enjoyment for dedicated keepers'}. Their ${noise.toLowerCase()} noise level makes them ${noise.includes('Very Low') || noise.includes('Low') ? 'suitable for apartments and noise-sensitive environments' : 'better suited for homes where some vocalization is acceptable'}.</p>

      <p>As a ${careLevel.toLowerCase()}-level bird, the ${name} is ${careLevel === 'Beginner' ? 'an excellent choice for first-time bird owners who are ready to provide proper care' : careLevel === 'Intermediate' ? 'well-suited for owners with some bird-keeping experience' : 'best kept by experienced aviculturists who understand their specialized needs'}. Their diet of ${diet.toLowerCase()} requires ${careLevel === 'Advanced' ? 'careful preparation and supplementation' : 'consistent quality and variety'}.</p>

      <h2>Housing Requirements</h2>
      <p>Providing appropriate housing is essential for ${name} health and happiness:</p>
      <ul>
        <li><strong>Cage Size:</strong> ${cageSize} - always provide the largest cage possible.</li>
        <li><strong>Bar Spacing:</strong> ${isFinch ? '1/4 to 1/2 inch' : isParrot ? '1/2 to 3/4 inch' : '1/2 inch'} to prevent escape or injury.</li>
        <li><strong>Perches:</strong> Multiple perches of varying diameters and materials for foot health.</li>
        <li><strong>Placement:</strong> In a social area away from drafts, direct sunlight, and kitchen fumes.</li>
        <li><strong>Enrichment:</strong> ${isParrot ? 'Foraging toys, puzzles, and destructible items are essential' : 'Swings, mirrors, and bathing dishes provide enrichment'}.</li>
        <li><strong>Cleaning:</strong> Daily water and food changes; weekly thorough cage cleaning.</li>
      </ul>

      <h2>Diet &amp; Nutrition</h2>
      <p>Proper nutrition is critical for ${name} health:</p>
      <ul>
        <li><strong>Primary Diet:</strong> ${diet}.</li>
        <li><strong>Fresh Foods:</strong> ${isParrot ? 'Dark leafy greens, vegetables, and limited fruits daily' : isFinch ? 'Occasional greens and egg food for supplementation' : 'Fresh vegetables and occasional fruit'}.</li>
        <li><strong>Supplements:</strong> ${isFinch ? 'Cuttlebone and mineral grit for calcium' : 'Calcium supplements and vitamin-enriched foods as needed'}.</li>
        <li><strong>Fresh Water:</strong> Clean water available at all times; change daily.</li>
        <li><strong>Avoid:</strong> Avocado, chocolate, caffeine, alcohol, and high-salt foods are toxic to birds.</li>
      </ul>

      <div class="affiliate-callout">
        <h4>Top Food Choices for ${name}s</h4>
        <p>
          ${isParrot ? '<a href="https://harrisonsbirdfoods.com" target="_blank" rel="sponsored noopener">Harrison\'s Bird Foods</a> - Certified organic pellets' : '<a href="https://www.kaytee.com" target="_blank" rel="sponsored noopener">Kaytee</a> - Premium seed mixes'} |
          <a href="https://lafeber.com" target="_blank" rel="sponsored noopener">Lafeber</a> - Nutritious bird foods |
          <a href="https://www.chewy.com" target="_blank" rel="sponsored noopener">Chewy</a> - Wide selection of bird foods
        </p>
      </div>

      <h2>Health Issues</h2>
      <p>${name}s can be susceptible to several health conditions:</p>
      <ul>
        <li><strong>Respiratory Infections:</strong> Caused by drafts, poor air quality, or bacteria. Signs include wheezing, nasal discharge, and tail bobbing.</li>
        <li><strong>${isParrot ? 'Feather Destructive Behavior' : 'Feather Issues'}:</strong> ${isParrot ? 'Plucking can indicate stress, boredom, or medical issues' : 'Abnormal molting or feather loss may indicate health problems'}.</li>
        <li><strong>Nutritional Deficiencies:</strong> ${isFinch ? 'Egg binding in females from calcium deficiency' : 'Vitamin A deficiency is common with seed-only diets'}.</li>
        <li><strong>Parasites:</strong> Mites and internal parasites can affect pet birds. Regular vet checks help prevent issues.</li>
        <li><strong>Egg Binding:</strong> Females may become egg-bound; maintain proper calcium and nutrition.</li>
      </ul>

      <div class="warning-box">
        <h4>Avian Vet Care</h4>
        <p>Birds hide illness instinctively. By the time symptoms are visible, the bird may be seriously ill. Find an avian veterinarian before you need one, and schedule annual wellness checks for your ${name}.</p>
      </div>

      <h2>Temperament &amp; Behavior</h2>
      <ul>
        <li><strong>Social Needs:</strong> ${isFinch ? 'Best kept in pairs or small groups; they are social flock birds' : isParrot ? 'Require significant daily interaction and out-of-cage time' : 'Benefit from regular human interaction and socialization'}.</li>
        <li><strong>Noise:</strong> ${noise} - ${noise.includes('Very Low') || noise.includes('Low') ? 'one of the quieter bird species, suitable for apartments' : 'can be vocal, especially at dawn and dusk'}.</li>
        <li><strong>${isParrot ? 'Talking Ability' : 'Vocalizations'}:</strong> ${isParrot ? 'Some individuals may learn words and phrases with training' : isFinch || type === 'Canary' ? 'Males typically sing more than females' : 'Natural vocalizations are part of their charm'}.</li>
        <li><strong>Activity:</strong> ${isFinch ? 'Active flyers that prefer flight space over handling' : 'Enjoy exploring and interactive play'}.</li>
      </ul>

      <h2>Is This Bird Right for You?</h2>
      <h3>${name}s Are Great For:</h3>
      <ul>
        <li>${careLevel === 'Beginner' ? 'First-time bird owners' : 'Experienced bird keepers'}</li>
        <li>${noise.includes('Low') || noise.includes('Very Low') ? 'Apartment dwellers and noise-sensitive households' : 'Those who enjoy bird vocalizations'}</li>
        <li>${isFinch ? 'Those who prefer watching birds rather than handling' : 'Owners who can provide daily interaction'}</li>
        <li>People committed to providing proper diet and housing</li>
      </ul>
      <h3>${name}s May Not Be Ideal For:</h3>
      <ul>
        <li>${careLevel === 'Advanced' ? 'Beginners without bird-keeping experience' : 'Those unable to commit to regular care routines'}</li>
        <li>${lifespan.includes('20') || lifespan.includes('25') || lifespan.includes('30') ? 'Those not ready for a long-term commitment' : 'Owners expecting a very long-lived pet'}</li>
        <li>People who want a completely silent pet</li>
      </ul>

      <section class="info-card">
        <h3>Ask Our AI About ${name}s</h3>
        <p>Have specific questions about ${name} care, diet, or health? Our AI assistant can provide personalized guidance.</p>
        <div class="hero-actions"><a href="/chat" class="primary-btn">Ask the AI Now</a></div>
      </section>
    </article>
    <section class="transparency">
      <h3>Disclaimer</h3>
      <p>This species guide provides general information about ${name}s. Individual birds may vary. Always consult with avian veterinary professionals for specific guidance. This page contains affiliate links.</p>
    </section>
  </main>
  <footer class="site-footer">
    <p>AI Pet Medical &amp; Vet Help Finder &mdash; educational guidance, real-world vet options, and curated resources.</p>
    <p style="font-size: 0.85rem; margin-top: 8px;">Some suggestions may include sponsored partners.</p>
    <nav class="footer-nav" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;">
      <a href="/guides">Guides</a> &middot; <a href="/tools/">Tools</a> &middot; <a href="/locations/">Locations</a> &middot; <a href="/resources">Resources</a> &middot; <a href="/about">About</a> &middot; <a href="/contact">Contact</a> &middot; <a href="/privacy-policy">Privacy</a> &middot; <a href="/terms-of-service">Terms</a> &middot; <a href="/feeds/">RSS Feeds</a>
    </nav>
  </footer>
  <script>document.addEventListener('DOMContentLoaded',function(){const t=document.querySelector('.nav-toggle'),m=document.querySelector('.nav-menu');if(t){t.addEventListener('click',function(){m.classList.toggle('active');t.classList.toggle('active');});}});</script>
  <script type="text/javascript" src="https://s.skimresources.com/js/299616X1787412.skimlinks.js"></script>
</body>
</html>`;
}

let created = 0;
for (const b of breeds) {
  const fp = path.join(DIR, `${b[0]}.html`);
  if (!fs.existsSync(fp)) { fs.writeFileSync(fp, makePage(b)); created++; console.log(`Created: ${fp}`); }
  else { console.log(`Exists: ${fp}`); }
}
console.log(`\nDone! Created ${created} bird species pages.`);
