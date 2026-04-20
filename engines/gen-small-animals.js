import fs from 'fs';
import path from 'path';

const DIR = 'breeds/small-animals';

// [slug, name, size, lifespan, diet, social, care, activity, space, subtype]
const breeds = [
  ['american-rabbit','American Rabbit','Large (9-12 lbs)','8-12 years','Hay, pellets, vegetables','Social - pairs/groups','Beginner','Moderate','4x2 ft minimum','Rabbit'],
  ['baldwin-guinea-pig','Baldwin Guinea Pig','Medium (1.5-2.5 lbs)','5-7 years','Hay, pellets, vegetables, vitamin C','Social - keep in pairs','Intermediate','Moderate','7.5 sq ft minimum','Guinea Pig'],
  ['californian-rabbit','Californian Rabbit','Large (8-11 lbs)','5-10 years','Hay, pellets, vegetables','Social - pairs/groups','Beginner','Moderate','4x2 ft minimum','Rabbit'],
  ['chinchilla-mutations','Chinchilla (Color Mutations)','Medium (1-2 lbs)','10-20 years','Hay, pellets, limited treats','Can live in pairs','Intermediate','High (nocturnal)','Multi-level cage','Chinchilla'],
  ['chinchilla-standard-gray','Standard Gray Chinchilla','Medium (1-2 lbs)','10-20 years','Hay, pellets, limited treats','Can live in pairs','Intermediate','High (nocturnal)','Multi-level cage','Chinchilla'],
  ['continental-giant','Continental Giant Rabbit','Very Large (12-25 lbs)','4-7 years','Hay, pellets, vegetables','Social','Intermediate','Moderate','Very large enclosure','Rabbit'],
  ['coronet-guinea-pig','Coronet Guinea Pig','Medium (1.5-2.5 lbs)','5-7 years','Hay, pellets, vegetables, vitamin C','Social - keep in pairs','Intermediate','Moderate','7.5 sq ft minimum','Guinea Pig'],
  ['degu','Degu','Small (6-10 oz)','6-9 years','Hay, degu pellets, vegetables','Highly social - groups','Intermediate','Very High','Multi-level cage','Degu'],
  ['dumbo-rat','Dumbo Rat','Small-Medium (0.5-1.5 lbs)','2-3 years','Lab blocks, fresh food','Highly social - pairs/groups','Beginner','High','2 cu ft per rat minimum','Rat'],
  ['dutch-rabbit','Dutch Rabbit','Small-Medium (3.5-5.5 lbs)','5-8 years','Hay, pellets, vegetables','Social - pairs/groups','Beginner','Moderate','4x2 ft minimum','Rabbit'],
  ['dwarf-campbell','Campbell\'s Dwarf Hamster','Very Small (1-2 oz)','1.5-2 years','Hamster mix, vegetables, protein','Solitary preferred','Beginner','High (nocturnal)','450+ sq in floor','Hamster'],
  ['dwarf-hotot','Dwarf Hotot Rabbit','Small (2.5-3.5 lbs)','7-10 years','Hay, pellets, vegetables','Social - pairs/groups','Beginner','Moderate','4x2 ft minimum','Rabbit'],
  ['english-angora','English Angora Rabbit','Medium (5-7.5 lbs)','7-12 years','Hay, pellets, vegetables','Social','Advanced','Low','4x2 ft minimum','Rabbit'],
  ['english-lop','English Lop Rabbit','Large (9-11 lbs)','5-7 years','Hay, pellets, vegetables','Social - pairs','Intermediate','Moderate','4x2 ft minimum','Rabbit'],
  ['fancy-mouse','Fancy Mouse','Very Small (0.5-1 oz)','1.5-3 years','Mouse food, seeds, vegetables','Social - females in groups','Beginner','High','Minimum 1 sq ft per mouse','Mouse'],
  ['fancy-rat','Fancy Rat','Small-Medium (0.5-1.5 lbs)','2-3 years','Lab blocks, fresh food','Highly social - pairs/groups','Beginner','High','2 cu ft per rat minimum','Rat'],
  ['ferret-albino','Albino Ferret','Medium (1.5-4 lbs)','6-10 years','High-protein ferret food','Social - pairs preferred','Intermediate','Very High','Multi-level cage + play time','Ferret'],
  ['ferret-sable','Sable Ferret','Medium (1.5-4 lbs)','6-10 years','High-protein ferret food','Social - pairs preferred','Intermediate','Very High','Multi-level cage + play time','Ferret'],
  ['flying-squirrel','Sugar Glider / Flying Squirrel','Very Small (2-5 oz)','10-15 years','Specialized diet, fruits, insects','Highly social','Advanced','High (nocturnal)','Tall cage with branches','Exotic'],
  ['french-lop','French Lop Rabbit','Large (10-15 lbs)','5-7 years','Hay, pellets, vegetables','Social','Intermediate','Moderate','Large enclosure','Rabbit'],
  ['gerbil','Gerbil','Very Small (2-4 oz)','3-5 years','Gerbil food, hay, vegetables','Social - same-sex pairs','Beginner','High','10+ gal with deep bedding','Gerbil'],
  ['hairless-rat','Hairless Rat','Small-Medium (0.5-1.5 lbs)','1.5-3 years','Lab blocks, fresh food','Highly social - pairs/groups','Intermediate','High','2 cu ft per rat, warm','Rat'],
  ['harlequin-rabbit','Harlequin Rabbit','Medium (6.5-9.5 lbs)','5-8 years','Hay, pellets, vegetables','Social','Beginner','Moderate','4x2 ft minimum','Rabbit'],
  ['mini-lop','Mini Lop Rabbit','Small-Medium (4.5-6.5 lbs)','7-14 years','Hay, pellets, vegetables','Social - pairs','Beginner','Moderate','4x2 ft minimum','Rabbit'],
  ['mongolian-gerbil','Mongolian Gerbil','Very Small (2-4 oz)','3-5 years','Gerbil food, hay, vegetables','Social - same-sex pairs','Beginner','High','10+ gal with deep bedding','Gerbil'],
  ['mouse','Pet Mouse','Very Small (0.5-1 oz)','1.5-3 years','Mouse food, seeds, vegetables','Social - females in groups','Beginner','High','Minimum 1 sq ft per mouse','Mouse'],
  ['new-zealand-white','New Zealand White Rabbit','Large (9-12 lbs)','5-8 years','Hay, pellets, vegetables','Social','Beginner','Moderate','4x2 ft minimum','Rabbit'],
  ['polish-rabbit','Polish Rabbit','Small (2.5-3.5 lbs)','5-6 years','Hay, pellets, vegetables','Social','Beginner','Moderate','4x2 ft minimum','Rabbit'],
  ['prairie-dog','Prairie Dog','Medium (1-3 lbs)','8-12 years','Hay, grasses, vegetables','Highly social - groups','Advanced','High','Large enclosure or room','Exotic'],
  ['rat','Pet Rat','Small-Medium (0.5-1.5 lbs)','2-3 years','Lab blocks, fresh food','Highly social - pairs/groups','Beginner','High','2 cu ft per rat minimum','Rat'],
  ['rex-rabbit','Rex Rabbit','Medium (7.5-10.5 lbs)','5-6 years','Hay, pellets, vegetables','Social','Beginner','Moderate','4x2 ft minimum','Rabbit'],
  ['silkie-guinea-pig','Silkie Guinea Pig','Medium (1.5-2.5 lbs)','5-7 years','Hay, pellets, vegetables, vitamin C','Social - keep in pairs','Intermediate','Moderate','7.5 sq ft minimum','Guinea Pig'],
  ['texel-guinea-pig','Texel Guinea Pig','Medium (1.5-2.5 lbs)','5-7 years','Hay, pellets, vegetables, vitamin C','Social - keep in pairs','Intermediate','Moderate','7.5 sq ft minimum','Guinea Pig'],
  ['white-crested-guinea-pig','White Crested Guinea Pig','Medium (1.5-2.5 lbs)','5-7 years','Hay, pellets, vegetables, vitamin C','Social - keep in pairs','Beginner','Moderate','7.5 sq ft minimum','Guinea Pig'],
  ['winter-white','Winter White Dwarf Hamster','Very Small (1-2 oz)','1.5-2 years','Hamster mix, vegetables, protein','Solitary preferred','Beginner','High (nocturnal)','450+ sq in floor','Hamster'],
];

function makePage(b) {
  const [slug,name,size,lifespan,diet,social,care,activity,space,subtype] = b;
  const isRabbit = subtype === 'Rabbit';
  const isGP = subtype === 'Guinea Pig';
  const isRat = subtype === 'Rat';
  const isHamster = subtype === 'Hamster';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-FK0N7BD82Q"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-FK0N7BD82Q');</script>
  <meta name="description" content="Complete ${name} care guide: housing, diet, handling, health issues, and recommended products. Expert AI-powered advice for small pet owners.">
  <link rel="canonical" href="https://petcarehelperai.com/breeds/small-animals/${slug}">
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${name}: Complete Care Guide 2024 - Pet Care Helper AI" />
  <meta property="og:description" content="Complete ${name} care guide: housing, diet, handling, and health issues." />
  <meta property="og:url" content="https://petcarehelperai.com/breeds/small-animals/${slug}" />
  <meta property="og:site_name" content="Pet Care Helper AI" />
  <title>${name}: Complete Care Guide 2024 - Pet Care Helper AI</title>
  <link rel="stylesheet" href="../../styles.css">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Article","headline":"${name}: Complete Care Guide 2024","datePublished":"2026-02-19","dateModified":"2026-02-19","description":"Complete ${name} care guide covering housing, diet, handling, and health.","author":{"@type":"Organization","name":"Pet Care Helper AI"},"publisher":{"@type":"Organization","name":"Pet Care Helper AI"}}
  </script>
</head>
<body>
  <header class="site-header">
    <div class="logo-title"><div class="logo-pill"></div><div><span class="site-name">Pet Care Helper AI</span><p class="subtitle">Dogs &bull; Cats &bull; Birds &bull; Reptiles &bull; Fish &bull; Small Pets</p></div></div>
    <nav class="main-nav">
      <button class="nav-toggle" aria-label="Toggle navigation"><span class="hamburger"></span></button>
      <ul class="nav-menu">
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/chat" class="nav-link">AI Pet Help</a></li>
        <li><a href="/dogs" class="nav-link">Dogs</a></li>
        <li><a href="/cats" class="nav-link">Cats</a></li>
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
      <a href="/small-animals">Small Animals</a> <span>&rsaquo;</span>
      <a href="/breeds/small-animal-breeds">Breeds</a> <span>&rsaquo;</span>
      ${name}
    </div>
    <article class="guide-content">
      <h1>${name}: Complete Care Guide</h1>
      <div class="breed-stats-card">
        <h2>Quick Facts</h2>
        <table class="comparison-table">
          <tr><th>Attribute</th><th>Details</th></tr>
          <tr><td>Type</td><td>${subtype}</td></tr>
          <tr><td>Size</td><td>${size}</td></tr>
          <tr><td>Lifespan</td><td>${lifespan}</td></tr>
          <tr><td>Diet</td><td>${diet}</td></tr>
          <tr><td>Social Needs</td><td>${social}</td></tr>
          <tr><td>Activity Level</td><td>${activity}</td></tr>
          <tr><td>Care Level</td><td>${care}</td></tr>
          <tr><td>Space Requirements</td><td>${space}</td></tr>
        </table>
      </div>

      <div class="affiliate-callout">
        <h4>Recommended for ${name}s</h4>
        <p>
          <a href="https://www.chewy.com" target="_blank" rel="sponsored noopener">Chewy</a> - ${subtype} food &amp; supplies |
          <a href="https://www.kaytee.com" target="_blank" rel="sponsored noopener">Kaytee</a> - Habitats &amp; bedding |
          <a href="https://www.petco.com" target="_blank" rel="sponsored noopener">Petco</a> - Small pet essentials
        </p>
      </div>

      <h2>${name} Overview</h2>
      <p>The ${name} is a ${size.toLowerCase()} ${subtype.toLowerCase()} that makes ${care === 'Beginner' ? 'an excellent pet for beginners and families' : care === 'Intermediate' ? 'a wonderful pet for those with some small animal experience' : 'a rewarding but challenging pet for experienced keepers'}. With a lifespan of ${lifespan}, they are ${lifespan.includes('10') || lifespan.includes('12') || lifespan.includes('15') || lifespan.includes('20') ? 'a significant long-term commitment' : 'a shorter-term commitment compared to some pets'}. Their ${activity.toLowerCase()} activity level and ${social.toLowerCase()} social nature make them engaging and entertaining companions.</p>

      <p>${name}s ${social.includes('Social') || social.includes('social') ? 'thrive with companionship and are best kept with compatible cage mates' : social.includes('Solitary') ? 'are solitary animals that should be housed individually to prevent fighting' : 'have specific social needs that should be researched carefully'}. Their diet of ${diet.toLowerCase()} is ${isRabbit || isGP ? 'hay-based with supplemental pellets and fresh vegetables' : isRat ? 'primarily lab blocks supplemented with fresh foods' : 'specifically formulated for their nutritional needs'}.</p>

      <h2>Housing Requirements</h2>
      <ul>
        <li><strong>Space:</strong> ${space} - always provide the largest enclosure possible.</li>
        <li><strong>Type:</strong> ${isRabbit ? 'Indoor pen, x-pen, or free-roam with bunny-proofing' : isGP ? 'C&amp;C cage or large commercial enclosure with solid flooring' : isHamster ? 'Large bin cage, tank, or commercial cage with deep bedding' : isRat ? 'Multi-level wire cage with solid platforms' : 'Species-appropriate enclosure with proper ventilation'}.</li>
        <li><strong>Bedding:</strong> ${isRabbit ? 'Paper-based bedding, fleece liners, or hay' : isHamster ? 'Paper-based bedding, 6+ inches deep for burrowing' : 'Paper-based or fleece bedding; avoid cedar and pine'}.</li>
        <li><strong>Enrichment:</strong> ${isRabbit ? 'Tunnels, platforms, chew toys, and digging boxes' : isGP ? 'Tunnels, hidey houses, and hay racks' : isHamster ? 'Wheel (8+ inches), tunnels, chew toys, sand bath' : isRat ? 'Hammocks, ropes, tunnels, and foraging opportunities' : 'Species-appropriate toys and hiding spots'}.</li>
        <li><strong>Temperature:</strong> ${isRabbit ? '60-70°F ideal; rabbits are sensitive to heat above 80°F' : isGP ? '65-75°F ideal; avoid drafts and direct sunlight' : '65-75°F for most small animals; avoid temperature extremes'}.</li>
        <li><strong>Cleaning:</strong> Spot-clean daily; full cleaning weekly.</li>
      </ul>

      <h2>Diet &amp; Nutrition</h2>
      <ul>
        <li><strong>Primary Diet:</strong> ${diet}.</li>
        ${isRabbit ? '<li><strong>Hay:</strong> Unlimited timothy hay (80% of diet). Alfalfa only for babies under 6 months.</li>' : ''}
        ${isGP ? '<li><strong>Vitamin C:</strong> Guinea pigs cannot produce their own vitamin C. Supplement with bell peppers, kale, or vitamin C tablets daily.</li>' : ''}
        <li><strong>Fresh Foods:</strong> ${isRabbit || isGP ? 'Leafy greens daily; limited fruit as treats' : isRat ? 'Small amounts of fruits, vegetables, and protein daily' : isHamster ? 'Small amounts of vegetables, occasional protein treats' : 'Appropriate fresh food supplements'}.</li>
        <li><strong>Water:</strong> Fresh water always available via bottle or bowl (rabbits and guinea pigs often prefer bowls).</li>
        <li><strong>Avoid:</strong> ${isRabbit ? 'Iceberg lettuce, beans, potatoes, seeds, chocolate, and processed foods' : isGP ? 'Iceberg lettuce, potatoes, onions, and foods high in sugar' : 'Chocolate, caffeine, citrus, and foods toxic to small animals'}.</li>
      </ul>

      <div class="affiliate-callout">
        <h4>Top Food Choices for ${name}s</h4>
        <p>
          <a href="https://www.chewy.com" target="_blank" rel="sponsored noopener">Chewy</a> - Premium ${subtype.toLowerCase()} food |
          <a href="https://www.kaytee.com" target="_blank" rel="sponsored noopener">Kaytee</a> - Timothy hay &amp; treats |
          <a href="https://www.oxbowanimalhealth.com" target="_blank" rel="sponsored noopener">Oxbow</a> - Veterinarian-recommended nutrition
        </p>
      </div>

      <h2>Common Health Issues</h2>
      <ul>
        ${isRabbit ? `
        <li><strong>GI Stasis:</strong> A life-threatening condition where the digestive system slows or stops. Signs: not eating, no droppings. Requires immediate veterinary attention.</li>
        <li><strong>Dental Disease:</strong> Teeth grow continuously; malocclusion causes pain and inability to eat. Hay helps wear teeth naturally.</li>
        <li><strong>Respiratory Infections:</strong> Snuffles (Pasteurella) is common. Signs: sneezing, nasal discharge.</li>
        ` : isGP ? `
        <li><strong>Scurvy (Vitamin C Deficiency):</strong> Causes lethargy, rough coat, swollen joints. Supplement vitamin C daily.</li>
        <li><strong>Respiratory Infections:</strong> Common in guinea pigs; signs include sneezing, labored breathing.</li>
        <li><strong>Bumblefoot:</strong> Painful foot infection from rough or wire surfaces. Use solid, clean flooring.</li>
        ` : isRat ? `
        <li><strong>Respiratory Disease:</strong> Extremely common in rats (mycoplasma). Signs: sneezing, porphyrin (red discharge around eyes/nose).</li>
        <li><strong>Tumors:</strong> Both benign (mammary) and malignant tumors are common, especially in females.</li>
        <li><strong>Bumblefoot:</strong> Foot infections from wire floors. Use solid platforms and clean bedding.</li>
        ` : isHamster ? `
        <li><strong>Wet Tail:</strong> Serious diarrheal disease, especially in young hamsters. Requires immediate vet care.</li>
        <li><strong>Respiratory Infections:</strong> Caused by drafts, bedding dust, or illness. Signs: sneezing, wheezing.</li>
        <li><strong>Dental Issues:</strong> Overgrown teeth from lack of chewing material.</li>
        ` : `
        <li><strong>Dental Issues:</strong> Many small animals have continuously growing teeth that can cause problems.</li>
        <li><strong>Respiratory Infections:</strong> Common across small animal species from drafts or poor conditions.</li>
        <li><strong>Parasites:</strong> Mites and internal parasites can affect small animals.</li>
        `}
        <li><strong>Obesity:</strong> Overfeeding treats and under-exercising leads to obesity in most small animals.</li>
      </ul>

      <div class="warning-box">
        <h4>Exotic Vet Care</h4>
        <p>Small animals are considered exotic pets and require a veterinarian experienced with their species. Find an exotic vet before you need one. ${isRabbit ? 'Rabbits should be spayed/neutered for health and behavior benefits.' : isGP ? 'Guinea pigs hide illness well - annual checkups are important.' : 'Regular health checks help catch issues early.'}</p>
      </div>

      <h2>Handling &amp; Taming</h2>
      <ul>
        <li><strong>Initial Adjustment:</strong> Allow ${care === 'Beginner' ? '3-5 days' : '1-2 weeks'} to settle into their new home before handling.</li>
        <li><strong>Approach:</strong> ${isRabbit ? 'Never pick up by ears. Support hindquarters and front simultaneously' : isGP ? 'Scoop gently with both hands; support the body fully' : isHamster ? 'Let them walk onto your hand; avoid grabbing from above (predator response)' : 'Move slowly and let them come to you'}.</li>
        <li><strong>Bonding:</strong> ${isRat ? 'Rats bond quickly and enjoy shoulder rides and free-roam time' : isRabbit ? 'Sit on the floor and let them approach you; many enjoy head petting' : 'Regular, gentle handling builds trust over time'}.</li>
        <li><strong>Exercise:</strong> ${isRabbit ? 'Daily free-roaming time in bunny-proofed space' : isGP ? 'Floor time in safe, enclosed area' : isRat ? 'Daily out-of-cage time for exploration and bonding' : 'Species-appropriate exercise opportunities'}.</li>
      </ul>

      <h2>Is a ${name} Right for You?</h2>
      <h3>${name}s Are Great For:</h3>
      <ul>
        <li>${care === 'Beginner' ? 'First-time small pet owners' : 'Experienced small animal keepers'}</li>
        <li>${social.includes('Social') ? 'Those willing to keep multiple animals' : 'Owners who want a single pet'}</li>
        <li>${activity.includes('nocturnal') ? 'Night owls who are active in the evening' : 'Those who enjoy watching active, entertaining pets'}</li>
        <li>People who can commit to ${lifespan} of care</li>
      </ul>
      <h3>${name}s May Not Be Ideal For:</h3>
      <ul>
        <li>${isRabbit ? 'Those expecting a low-maintenance, cage-only pet' : 'Those unable to maintain proper enclosure conditions'}</li>
        <li>${activity.includes('nocturnal') ? 'People who want a daytime-active pet' : 'Those wanting a completely quiet pet'}</li>
        <li>${care === 'Advanced' ? 'Beginners without small animal experience' : 'Those unable to provide regular care and interaction'}</li>
        <li>Very young children without adult supervision</li>
      </ul>

      <section class="info-card">
        <h3>Ask Our AI About ${name}s</h3>
        <p>Have specific questions about ${name} care, health, or behavior? Our AI assistant can provide personalized guidance.</p>
        <div class="hero-actions"><a href="/chat" class="primary-btn">Ask the AI Now</a></div>
      </section>
    </article>
    <section class="transparency">
      <h3>Disclaimer</h3>
      <p>This care guide provides general information about ${name}s. Individual animals may vary. Always consult with exotic veterinary professionals for specific guidance. This page contains affiliate links.</p>
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
console.log(`\nDone! Created ${created} small animal pages.`);
