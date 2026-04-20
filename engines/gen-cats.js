import fs from 'fs';
import path from 'path';

const DIR = 'breeds/cats';

const breeds = [
  ['asian','Asian Cat','Medium','6-13 lbs','12-18 years','Playful, Affectionate, Social','Low','High','Good','Good','Low','High'],
  ['chinchilla','Chinchilla Persian','Medium to Large','7-12 lbs','12-17 years','Gentle, Quiet, Sweet','Low','Low','Excellent','Good','Very High','Moderate'],
  ['domestic-longhair','Domestic Longhair','Varies','8-15 lbs','12-18 years','Varies Widely, Adaptable','Moderate to High','Moderate','Good','Good','Moderate to High','Moderate'],
  ['domestic-shorthair','Domestic Shorthair','Varies','8-15 lbs','12-20 years','Varies Widely, Adaptable','Moderate','Moderate','Good','Good','Low','Moderate'],
  ['donskoy','Donskoy','Medium','6-12 lbs','12-15 years','Friendly, Intelligent, Active','None','Moderate to High','Good','Good','Moderate (skin care)','High'],
  ['highlander','Highlander Cat','Large','10-20 lbs','10-15 years','Gentle, Playful, Confident','Low','High','Excellent','Good','Low','High'],
  ['laperm','LaPerm','Small to Medium','5-10 lbs','10-15 years','Gentle, Affectionate, Active','Low','Moderate','Excellent','Good','Low','High'],
  ['manx','Manx','Medium','8-12 lbs','8-14 years','Playful, Smart, Loyal','Low to Moderate','Moderate','Excellent','Good','Low','High'],
  ['ocicat','Ocicat','Medium to Large','6-15 lbs','12-18 years','Active, Social, Devoted','Low','High','Good','Good','Low','Very High'],
  ['oriental-longhair','Oriental Longhair','Medium','5-10 lbs','12-15 years','Social, Vocal, Intelligent','Moderate','High','Good (older)','Good','Moderate','Very High'],
  ['ragamuffin','Ragamuffin','Large','10-20 lbs','12-16 years','Calm, Friendly, Sweet','Moderate','Moderate','Excellent','Good','Moderate','Moderate'],
  ['russian-white','Russian White','Medium','8-15 lbs','15-20 years','Gentle, Quiet, Loyal','Low','Moderate','Good','Good','Low','Moderate'],
  ['selkirk-rex','Selkirk Rex','Medium to Large','6-16 lbs','15-20 years','Patient, Loving, Playful','Low','Moderate','Excellent','Good','Moderate','Moderate'],
  ['serengeti','Serengeti Cat','Medium to Large','8-15 lbs','10-15 years','Active, Confident, Friendly','Low','Very High','Good','Good','Low','High'],
];

function makePage(b) {
  const [slug,name,size,weight,lifespan,temperament,shedding,activity,goodKids,goodPets,grooming,intelligence] = b;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-FK0N7BD82Q"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-FK0N7BD82Q');</script>
  <meta name="description" content="Complete ${name} guide: personality, health issues, grooming, cost of ownership, and care tips. Expert AI-powered advice.">
  <link rel="canonical" href="https://petcarehelperai.com/breeds/cats/${slug}">
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${name}: Complete Breed Guide 2024 - Pet Care Helper AI" />
  <meta property="og:description" content="Complete ${name} guide: personality, health issues, grooming, cost of ownership, and care tips." />
  <meta property="og:url" content="https://petcarehelperai.com/breeds/cats/${slug}" />
  <meta property="og:site_name" content="Pet Care Helper AI" />
  <title>${name}: Complete Breed Guide 2024 - Pet Care Helper AI</title>
  <link rel="stylesheet" href="../../styles.css">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Article","headline":"${name}: Complete Breed Guide 2024","datePublished":"2026-02-19","dateModified":"2026-02-19","description":"Complete ${name} guide covering personality, health, grooming, and costs.","author":{"@type":"Organization","name":"Pet Care Helper AI"},"publisher":{"@type":"Organization","name":"Pet Care Helper AI"}}
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
        <li><a href="/cats" class="nav-link active">Cats</a></li>
        <li><a href="/birds" class="nav-link">Birds</a></li>
        <li><a href="/reptiles" class="nav-link">Reptiles</a></li>
        <li><a href="/fish" class="nav-link">Fish</a></li>
        <li><a href="/guides" class="nav-link">Guides</a></li>
      </ul>
    </nav>
  </header>
  <main>
    <div class="breadcrumb">
      <a href="/">Home</a> <span>&rsaquo;</span>
      <a href="/cats">Cats</a> <span>&rsaquo;</span>
      <a href="/breeds/cat-breeds">Breeds</a> <span>&rsaquo;</span>
      ${name}
    </div>
    <article class="guide-content">
      <h1>${name}: Complete Breed Guide</h1>
      <div class="breed-stats-card">
        <h2>Quick Facts</h2>
        <table class="comparison-table">
          <tr><th>Attribute</th><th>Details</th></tr>
          <tr><td>Size</td><td>${size} (${weight})</td></tr>
          <tr><td>Lifespan</td><td>${lifespan}</td></tr>
          <tr><td>Temperament</td><td>${temperament}</td></tr>
          <tr><td>Shedding</td><td>${shedding}</td></tr>
          <tr><td>Activity Level</td><td>${activity}</td></tr>
          <tr><td>Good with Kids</td><td>${goodKids}</td></tr>
          <tr><td>Good with Other Pets</td><td>${goodPets}</td></tr>
          <tr><td>Grooming Needs</td><td>${grooming}</td></tr>
          <tr><td>Intelligence</td><td>${intelligence}</td></tr>
        </table>
      </div>

      <div class="affiliate-callout">
        <h4>Recommended for ${name}s</h4>
        <p>
          <a href="https://www.basepaws.com" target="_blank" rel="sponsored noopener">Basepaws DNA Test</a> - Genetic health screening |
          <a href="https://www.spotpetins.com" target="_blank" rel="sponsored noopener">Spot Insurance</a> - Coverage for breed-specific conditions |
          <a href="https://www.chewy.com" target="_blank" rel="sponsored noopener">Chewy</a> - Premium food &amp; supplies
        </p>
      </div>

      <h2>${name} Overview</h2>
      <p>The ${name} is a ${size.toLowerCase()} cat breed known for being ${temperament.toLowerCase()}. Weighing ${weight} with a lifespan of ${lifespan}, these cats make wonderful companions for the right owner. Their ${activity.toLowerCase()} activity level and ${intelligence.toLowerCase()} intelligence make them ${activity === 'Very High' || activity === 'High' ? 'engaging and entertaining pets that keep their owners on their toes' : 'adaptable and pleasant companions for a variety of households'}.</p>

      <p>${name}s are ${goodKids === 'Excellent' ? 'excellent family cats that bond well with children' : 'good with respectful family members'} and ${goodPets === 'Good' ? 'generally get along well with other pets when properly introduced' : 'can coexist with other pets with proper introduction'}. Their ${shedding.toLowerCase()} shedding level and ${grooming.toLowerCase()} grooming needs make them ${grooming === 'Low' || grooming === 'Very Low' ? 'relatively easy to maintain' : 'a rewarding breed for those willing to invest in regular grooming'}.</p>

      <h2>Personality &amp; Temperament</h2>
      <p>${name}s have distinctive personalities that set them apart:</p>
      <ul>
        <li><strong>${temperament.split(',')[0].trim()}:</strong> This core trait defines the ${name} experience and makes them beloved companions.</li>
        <li><strong>${temperament.split(',')[1]?.trim() || 'Devoted'}:</strong> Their ${(temperament.split(',')[1]?.trim() || 'devoted').toLowerCase()} nature means they form strong bonds with their families.</li>
        <li><strong>${temperament.split(',')[2]?.trim() || 'Adaptable'}:</strong> ${name}s show remarkable ${(temperament.split(',')[2]?.trim() || 'adaptability').toLowerCase()} in daily life.</li>
        <li><strong>Intelligence:</strong> With ${intelligence.toLowerCase()} intelligence, they ${intelligence === 'Very High' || intelligence === 'High' ? 'are quick learners who can master tricks and enjoy puzzle toys' : 'are clever cats that enjoy interactive play'}.</li>
        <li><strong>Activity:</strong> Their ${activity.toLowerCase()} energy level means they ${activity === 'Very High' || activity === 'High' ? 'need significant daily play and enrichment' : 'enjoy regular play sessions balanced with relaxation'}.</li>
        <li><strong>Social Nature:</strong> ${name}s ${goodKids === 'Excellent' ? 'thrive in busy households and enjoy being the center of attention' : 'appreciate companionship while also valuing their independence'}.</li>
      </ul>

      <h2>Common Health Issues</h2>
      <p>${name}s are generally healthy, but can be prone to certain conditions:</p>
      <h3>Genetic Conditions</h3>
      <ul>
        <li><strong>Hypertrophic Cardiomyopathy (HCM):</strong> The most common heart disease in cats. Regular echocardiograms recommended.</li>
        <li><strong>Progressive Retinal Atrophy:</strong> Some lines may carry genes for this eye condition. DNA testing available.</li>
      </ul>
      <h3>General Health Concerns</h3>
      <ul>
        <li><strong>Dental Disease:</strong> Regular dental care and cleanings help prevent periodontal issues.</li>
        <li><strong>Obesity:</strong> Monitor food intake and ensure adequate exercise, especially for indoor cats.</li>
        <li><strong>Kidney Disease:</strong> Common in aging cats. Regular bloodwork helps with early detection.</li>
      </ul>

      <div class="warning-box">
        <h4>Health Screening Recommendation</h4>
        <p>Ask breeders for HCM screening results and genetic testing. Consider <a href="https://www.basepaws.com" target="_blank" rel="sponsored noopener">Basepaws DNA testing</a> for comprehensive health screening of your ${name}.</p>
      </div>

      <h2>Cost of Ownership</h2>
      <table class="comparison-table">
        <tr><th>Expense Category</th><th>Annual Cost Estimate</th></tr>
        <tr><td>Food (premium quality)</td><td>$400-$800</td></tr>
        <tr><td>Veterinary Care (routine)</td><td>$200-$400</td></tr>
        <tr><td>Pet Insurance</td><td>$300-$600</td></tr>
        <tr><td>Litter &amp; Supplies</td><td>$200-$400</td></tr>
        <tr><td>Toys &amp; Enrichment</td><td>$100-$300</td></tr>
        <tr><td>Grooming</td><td>${grooming === 'Very High' || grooming === 'High' || grooming.includes('Moderate to High') ? '$200-$500' : '$50-$150'}</td></tr>
        <tr><td><strong>Total Annual Cost</strong></td><td><strong>$1,250-$3,050</strong></td></tr>
      </table>

      <div class="affiliate-callout">
        <h4>Save on ${name} Care</h4>
        <p>
          <a href="https://www.chewy.com/app/autoship" target="_blank" rel="sponsored noopener">Chewy Autoship</a> - Save on food &amp; litter |
          <a href="https://www.lemonade.com/pet" target="_blank" rel="sponsored noopener">Lemonade Pet</a> - Affordable cat insurance |
          <a href="https://www.feliway.com" target="_blank" rel="sponsored noopener">Feliway</a> - Stress reduction products
        </p>
      </div>

      <h2>Nutrition &amp; Feeding</h2>
      <ul>
        <li><strong>High-Protein Diet:</strong> Cats are obligate carnivores - choose foods with named meat as the primary ingredient.</li>
        <li><strong>Wet &amp; Dry Mix:</strong> A combination provides hydration benefits and dental health.</li>
        <li><strong>Portion Control:</strong> Follow feeding guidelines and adjust based on activity level and weight.</li>
        <li><strong>Fresh Water:</strong> Always available; many cats prefer running water fountains.</li>
        <li><strong>Life Stage:</strong> Feed kitten formula until 12 months, then transition to adult food.</li>
      </ul>

      <h2>Grooming Requirements</h2>
      <ul>
        <li><strong>Brushing:</strong> ${grooming === 'Very High' || grooming.includes('High') ? 'Daily brushing recommended to prevent matting' : grooming === 'Moderate' || grooming.includes('Moderate') ? 'Brush 2-3 times weekly' : 'Weekly brushing is sufficient'}.</li>
        <li><strong>Bathing:</strong> ${shedding === 'None' ? 'Regular bathing needed for hairless skin care' : 'Rarely needed unless medically necessary'}.</li>
        <li><strong>Nail Trimming:</strong> Every 2-3 weeks.</li>
        <li><strong>Dental Care:</strong> Regular brushing recommended to prevent dental disease.</li>
        <li><strong>Ear Cleaning:</strong> Weekly checks and cleaning as needed.</li>
      </ul>

      <h2>Is a ${name} Right for You?</h2>
      <h3>${name}s Are Great For:</h3>
      <ul>
        <li>${activity === 'Very High' || activity === 'High' ? 'Active owners who enjoy interactive play' : 'Owners looking for a balanced companion'}</li>
        <li>${goodKids === 'Excellent' ? 'Families with children' : 'Households with respectful family members'}</li>
        <li>Those who appreciate a ${temperament.split(',')[0].trim().toLowerCase()} feline companion</li>
        <li>${grooming === 'Low' ? 'People wanting a low-maintenance cat' : 'Owners willing to commit to regular grooming'}</li>
      </ul>
      <h3>${name}s May Not Be Ideal For:</h3>
      <ul>
        <li>${activity === 'Very High' || activity === 'High' ? 'Those seeking a calm, low-energy cat' : 'Those wanting a very active, dog-like cat'}</li>
        <li>${shedding === 'Moderate to High' || shedding === 'Moderate' ? 'People with severe cat allergies' : 'Those who prefer a traditional-coated cat'}</li>
        <li>People away from home for extended periods</li>
      </ul>

      <section class="info-card">
        <h3>Ask Our AI About ${name}s</h3>
        <p>Have specific questions about ${name} health, behavior, or care? Our AI assistant can provide personalized guidance.</p>
        <div class="hero-actions"><a href="/chat" class="primary-btn">Ask the AI Now</a></div>
      </section>
    </article>
    <section class="transparency">
      <h3>Disclaimer</h3>
      <p>This breed guide provides general information about ${name}s. Individual cats may vary. Always consult with veterinary professionals for specific guidance. This page contains affiliate links.</p>
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
</body>
</html>`;
}

let created = 0;
for (const b of breeds) {
  const fp = path.join(DIR, `${b[0]}.html`);
  if (!fs.existsSync(fp)) { fs.writeFileSync(fp, makePage(b)); created++; console.log(`Created: ${fp}`); }
  else { console.log(`Exists: ${fp}`); }
}
console.log(`\nDone! Created ${created} cat breed pages.`);
