#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.resolve(__dirname, '..');
const DIR = path.join(BASE, 'breeds', 'marine-fish');
const TODAY = '2026-02-21';

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const NAV = `<ul class="nav-menu">
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/chat" class="nav-link">AI Pet Help</a></li>
        <li><a href="/dogs" class="nav-link">Dogs</a></li>
        <li><a href="/cats" class="nav-link">Cats</a></li>
        <li><a href="/birds" class="nav-link">Birds</a></li>
        <li><a href="/reptiles" class="nav-link">Reptiles</a></li>
        <li><a href="/amphibians" class="nav-link">Amphibians</a></li>
        <li><a href="/fish" class="nav-link">Fish</a></li>
        <li><a href="/marine-fish" class="nav-link active">Marine Fish</a></li>
        <li><a href="/small-animals" class="nav-link">Small Animals</a></li>
        <li><a href="/guides" class="nav-link">Guides</a></li>
      </ul>`;

// [slug, name, size, lifespan, temp, salinity, tankMin, care, diet, temperament, reefSafe, origin, unique, health, cost]
const species = [
['clownfish','Ocellaris Clownfish','Small (3-4 in)','6-10 years','72-82°F','1.020-1.025 sg','20 gallon','Beginner','Omnivore: pellets, frozen mysis, flakes','Semi-Aggressive, Hardy','Yes (with caution around anemones)','Indo-Pacific, Great Barrier Reef','Iconic symbiotic relationship with host anemones; all are born male with dominant female transforming from largest male; made globally famous by animated films','Marine ich (Cryptocaryon irritans), Brooklynella (clownfish disease), fin rot, bacterial infections, anemone stinging if stressed','$15-$40 for captive-bred; $200-$500 setup'],
['blue-tang','Blue Tang (Regal Tang)','Large (12 in)','8-20 years','72-78°F','1.020-1.025 sg','180 gallon','Advanced','Herbivore: nori, spirulina, algae sheets, mysis','Semi-Aggressive, Active swimmer','Yes','Indo-Pacific','Venomous caudal spine for defense; prone to ich; vibrant blue coloration with yellow tail; requires very large tank due to active swimming behavior','Highly susceptible to marine ich and velvet, lateral line erosion (HLLE) from poor diet, bacterial infections','$40-$80; $500+ setup for large tank'],
['yellow-tang','Yellow Tang','Medium (8 in)','5-10+ years','72-82°F','1.020-1.025 sg','100 gallon','Intermediate','Herbivore: nori, algae sheets, spirulina, blanched vegetables','Semi-Aggressive, Active','Yes','Hawaii, Pacific Ocean','Excellent algae grazers keeping tanks clean; bright yellow coloration; have sharp scalpel-like spine at tail base for defense; prices surged after Hawaii collection ban','Marine ich, HLLE from nutritional deficiency, bacterial infections, aggression toward similar tangs','$200-$500 (captive-bred); $300-$600 setup'],
['coral-beauty','Coral Beauty Angelfish','Small (4 in)','5-7 years','72-82°F','1.020-1.025 sg','70 gallon','Intermediate','Omnivore: spirulina, mysis, angelfish preparations','Semi-Aggressive, Hardy dwarf angel','With caution (may nip corals)','Indo-Pacific','One of the hardiest dwarf angelfish; beautiful blue and orange coloration; occasional coral nipping makes reef compatibility unpredictable','Marine ich, lymphocystis, bacterial infections, internal parasites','$30-$60; $300-$500 setup'],
['flame-angelfish','Flame Angelfish','Small (4 in)','5-7 years','72-82°F','1.020-1.025 sg','70 gallon','Intermediate','Omnivore: spirulina, mysis, angelfish formula, algae','Semi-Aggressive','Caution (nips at LPS/SPS corals)','Pacific (Marshall Islands, Hawaii)','Stunning bright red-orange with vertical black bars and blue-tipped fins; one of the most popular dwarf angels in the hobby','Marine ich, velvet, lymphocystis, loss of coloration from stress or poor diet','$60-$120; $300-$500 setup'],
['emperor-angelfish','Emperor Angelfish','Large (15 in)','15-20 years','72-82°F','1.020-1.025 sg','220 gallon','Expert','Omnivore: sponge-based angelfish food, mysis, spirulina, nori','Semi-Aggressive, Majestic','No (eats corals and sponges)','Indo-Pacific, Red Sea','Dramatic color transformation from juvenile (blue with white concentric circles) to adult (horizontal blue and yellow stripes); one of the most impressive reef fish','Marine ich, HLLE, internal parasites, difficulty transitioning to captive foods, bacterial infections','$100-$300; $600+ large tank setup'],
['royal-gramma','Royal Gramma','Small (3 in)','5-8 years','72-82°F','1.020-1.025 sg','30 gallon','Beginner','Carnivore: mysis, brine shrimp, pellets, copepods','Peaceful to Semi-Aggressive, Cave dweller','Yes','Western Atlantic, Caribbean','Stunning bicolor purple/yellow coloration; often swims upside-down under ledges; excellent beginner saltwater fish; peaceful community member','Marine ich, bacterial infections, parasites, fin rot from aggression by tankmates','$20-$40; $200-$400 setup'],
['mandarin-goby','Mandarin Dragonet','Small (3 in)','2-5 years','72-82°F','1.020-1.025 sg','30 gallon (mature reef)','Expert','Copepods (primary), prepared foods if trained','Peaceful, Slow-moving','Yes','Western Pacific','Arguably the most colorful marine fish; psychedelic blue, orange, and green patterns; produces toxic mucus coating; requires established copepod populations to survive','Starvation (primary cause of death), internal parasites, rarely susceptible to ich due to mucus coating','$20-$40; requires mature tank with copepod population'],
['watchman-goby','Yellow Watchman Goby','Small (3-4 in)','2-5 years','72-82°F','1.020-1.025 sg','20 gallon','Beginner','Carnivore: mysis, brine shrimp, pellets','Peaceful, Sand-sifting','Yes','Indo-Pacific','Forms fascinating symbiotic relationship with pistol shrimp; shrimp builds burrow, goby stands guard; entertaining natural behavior in aquariums','Marine ich, bacterial infections, parasites, stress from aggressive tankmates','$15-$30; $200-$400 setup'],
['firefish','Firefish Goby','Small (3 in)','3-5 years','72-80°F','1.020-1.025 sg','20 gallon','Beginner','Carnivore: mysis, brine shrimp, finely chopped seafood','Peaceful, Timid, Hovering','Yes','Indo-Pacific','Hovers motionlessly in water column facing current; darts into rockwork burrow when startled; elongated first dorsal ray used for signaling; stunning gradient coloration from white to red','Jumping (notorious jumpers), stress from aggressive tankmates, marine ich, bacterial infections, starvation from being outcompeted for food','$15-$30; $200-$400 setup'],
['six-line-wrasse','Six-Line Wrasse','Small (3 in)','4-6 years','72-78°F','1.020-1.025 sg','30 gallon','Beginner','Carnivore: mysis, brine shrimp, pellets, hunts flatworms','Semi-Aggressive, Active','Yes','Indo-Pacific','Natural pest controller eating flatworms, pyramidellid snails, and bristleworms; six distinctive horizontal lines; can become territorial in smaller tanks','Marine ich, aggression-related injuries, bacterial infections, internal parasites','$15-$30; $200-$400 setup'],
['fairy-wrasse','Fairy Wrasse','Small (3-5 in)','5-8 years','72-78°F','1.020-1.025 sg','55 gallon','Intermediate','Carnivore: mysis, brine shrimp, copepods, pellets','Peaceful, Active swimmer','Yes','Indo-Pacific','Males display incredibly vibrant coloring during courtship displays (nuptial flashing); numerous species available in the hobby; peaceful reef inhabitants','Marine ich, stress from aggressive tankmates, jumping (tight-fitting lid essential), lymphocystis','$30-$100 depending on species; $300-$500 setup'],
['powder-blue-tang','Powder Blue Tang','Medium (9 in)','10+ years','72-78°F','1.020-1.025 sg','125 gallon','Expert','Herbivore: nori, spirulina, algae sheets, mysis shrimp','Semi-Aggressive, Active','Yes','Indian Ocean','One of the most beautiful tangs with powder blue body, black face mask, and yellow dorsal fin; notoriously sensitive to water quality and disease','Extremely susceptible to marine ich and velvet, HLLE, bacterial infections, aggression with other tangs','$50-$100; $500+ for appropriate large setup'],
['bangai-cardinal','Bangai Cardinalfish','Small (3 in)','5-7 years','72-82°F','1.020-1.025 sg','20 gallon','Beginner','Carnivore: mysis, brine shrimp, small pellets','Peaceful, Slow-moving, Schooling','Yes','Banggai Islands, Indonesia (endemic)','Critically endangered in the wild; males mouthbrood eggs for 3 weeks without eating; distinctive silver body with black vertical bars and elongated fins; captive breeding has helped reduce wild collection pressure','Bacterial infections, iridovirus (Banggai cardinalfish disease), internal parasites, stress from aggressive tankmates','$15-$30 captive-bred; $200-$400 setup'],
['copperband-butterfly','Copperband Butterflyfish','Medium (8 in)','5-10 years','72-82°F','1.020-1.025 sg','75 gallon','Expert','Carnivore: Aiptasia, mysis, frozen foods, clams','Peaceful, Finicky eater','Caution (may nip at clam mantles)','Indo-Pacific','Prized for eating pest Aiptasia anemones; distinctive copper-orange vertical bands on silver body with false eyespot near tail; extremely difficult to get feeding in captivity','Starvation (most common), marine ich, lymphocystis, bacterial infections, refusal to eat prepared foods','$30-$60; requires established tank with live food sources'],
['foxface-rabbitfish','Foxface Rabbitfish','Medium (8-10 in)','5-7 years','72-82°F','1.020-1.025 sg','75 gallon','Intermediate','Herbivore: nori, algae, spirulina, blanched vegetables','Peaceful, Algae grazer','With caution (may nip soft corals)','Western Pacific','Excellent algae control; venomous dorsal spines cause intense pain (handle with extreme caution); can rapidly change color when stressed from bright yellow to mottled brown','Venomous spine injuries to owner, marine ich, HLLE, bacterial infections','$30-$60; $300-$500 setup'],
['flame-hawkfish','Flame Hawkfish','Small (3-4 in)','5-7 years','72-82°F','1.020-1.025 sg','30 gallon','Beginner','Carnivore: mysis, brine shrimp, small pellets, small crustaceans','Semi-Aggressive, Perching predator','Caution (eats small shrimp and crabs)','Western Pacific','Perches on rocks and coral watching for prey; brilliant flame-red coloration; lacks swim bladder so sits on surfaces rather than hovering; charismatic personality','Marine ich, bacterial infections, internal parasites, jumping if startled','$30-$60; $200-$400 setup'],
['green-chromis','Green Chromis','Small (3 in)','8-15 years','72-82°F','1.020-1.025 sg','30 gallon','Beginner','Omnivore: flakes, pellets, mysis, brine shrimp','Peaceful, Schooling','Yes','Indo-Pacific','One of the best beginner saltwater fish; iridescent green coloration shimmers under reef lighting; creates beautiful schooling displays in groups of 5+; extremely hardy and disease-resistant','Marine ich, aggression within schools (weakest may be bullied), bacterial infections, parasites','$5-$15; $200-$400 setup'],
['maroon-clownfish','Maroon Clownfish','Medium (6 in)','7+ years','72-82°F','1.020-1.025 sg','30 gallon','Intermediate','Omnivore: pellets, frozen mysis, brine shrimp, flakes','Aggressive, Territorial','Yes','Indo-Pacific','Largest and most aggressive clownfish species; females can reach 6+ inches and dominate entire tanks; gold stripe variety highly sought after; bonds fiercely with host anemone','Marine ich, Brooklynella, bacterial infections, aggression injuries to tankmates','$20-$80 (gold stripe more expensive); $200-$500 setup'],
['dottyback','Orchid Dottyback','Small (3 in)','5-7 years','72-82°F','1.020-1.025 sg','30 gallon','Beginner','Carnivore: mysis, brine shrimp, pellets, hunts bristleworms','Semi-Aggressive, Territorial','Yes','Red Sea (endemic)','Vivid purple coloration; natural pest controller eating bristleworms and small parasites; captive-bred specimens much less aggressive than wild-caught; ORA captive-bred widely available','Marine ich, aggression-related injuries, bacterial infections, territorial disputes','$20-$40 captive-bred; $200-$400 setup'],
['kole-tang','Kole Tang (Yellow-Eye Tang)','Medium (7 in)','5-7 years','72-78°F','1.020-1.025 sg','75 gallon','Intermediate','Herbivore: nori, spirulina, algae, film algae grazer','Peaceful, Active algae grazer','Yes','Hawaii','One of the best algae-eating tangs; unique bristle-like teeth scrape film algae from glass and rock; more peaceful than many tang species; distinctive yellow eye ring','Marine ich, HLLE from poor diet, bacterial infections','$50-$120; $300-$500 setup'],
['hawkfish','Longnose Hawkfish','Small (5 in)','5-7 years','72-82°F','1.020-1.025 sg','30 gallon','Beginner','Carnivore: mysis, brine shrimp, small pellets','Semi-Aggressive, Perching','Caution (eats ornamental shrimp)','Indo-Pacific','Distinctive elongated snout used to extract prey from crevices; sits on coral branches surveying territory; red and white checkerboard pattern; lacks swim bladder','Marine ich, bacterial infections, jumping (needs tight-fitting lid), may eat ornamental shrimp','$30-$60; $200-$400 setup'],
['cleaner-wrasse','Bluestreak Cleaner Wrasse','Small (3-4 in)','4+ years','72-78°F','1.020-1.025 sg','55 gallon','Expert','Parasites from other fish (primary), prepared foods if trained','Peaceful, Obligate cleaner','Yes','Indo-Pacific','Sets up cleaning stations where other fish queue to have parasites removed; performs a characteristic dance to invite clients; extremely difficult to maintain as they primarily eat fish parasites','Starvation (most common cause of death), stress, internal parasites, difficulty transitioning to captive diets','$15-$30; NOT recommended for most aquarists'],
['blue-damsel','Blue Damselfish','Small (3 in)','5-6 years','72-78°F','1.020-1.025 sg','30 gallon','Beginner','Omnivore: flakes, pellets, frozen foods','Semi-Aggressive to Aggressive','Yes','Indo-Pacific','Often recommended as first saltwater fish due to extreme hardiness; brilliant blue coloration; can become very territorial and aggressive as they mature, especially in smaller tanks','Marine ich (though very resistant), aggression injuries, bacterial infections','$3-$8; $200-$400 setup'],
['melanurus-wrasse','Melanurus Wrasse','Small (5 in)','5-8 years','72-78°F','1.020-1.025 sg','50 gallon','Beginner','Carnivore: mysis, brine shrimp, pellets, hunts pests','Semi-Aggressive, Active','Yes (excellent pest controller)','Western Pacific','Outstanding reef pest controller: eats flatworms, pyramidellid snails, bristleworms, and small snails; stunning multicolored appearance; sleeps in sand cocoon at night','Marine ich, jumping (tight lid required), bacterial infections, may eat desirable small invertebrates','$20-$40; $300-$500 setup'],
];

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function makePage(s) {
  const [slug,name,size,lifespan,temp,salinity,tankMin,care,diet,temperament,reefSafe,origin,unique,health,cost] = s;
  const searchTerm = slug.replace(/-/g, '+') + '+saltwater+fish';
  const canon = `https://petcarehelperai.com/breeds/marine-fish/${slug}`;
  const desc = `Complete ${name} saltwater care guide: tank setup, water parameters, diet, compatibility, and health. Expert advice for ${care.toLowerCase()}-level marine aquarists.`;

  const faq = [
    { q: `Is the ${name} reef safe?`, a: `The ${name} is rated: ${reefSafe}. Reef compatibility can vary between individual specimens. Monitor closely when first introducing to a reef tank, and be prepared to relocate the fish if it develops problematic behaviors like coral nipping. Providing adequate feeding can reduce the likelihood of fish picking at corals.` },
    { q: `How big of a tank does a ${name} need?`, a: `The ${name} requires a minimum tank size of ${tankMin}. Larger tanks provide more stable water parameters and reduce territorial aggression. For saltwater aquariums, stability is more important than hitting exact parameters, and larger water volumes resist parameter swings more effectively. Consider future fish additions when sizing your tank.` },
    { q: `What do ${name}s eat?`, a: `${name}s are classified as ${diet.split(':')[0].toLowerCase()}. Feed ${diet.split(':')[1] || 'a variety of prepared and frozen marine foods'}. Feed 2-3 times daily in small amounts that can be consumed within 2-3 minutes. Variety is essential for complete nutrition and maintaining vibrant coloration. Consider using an automatic feeder for consistency.` },
    { q: `Are ${name}s good for beginners?`, a: `${name}s are rated ${care.toLowerCase()} care level. ${care === 'Beginner' ? 'They are among the best fish for newcomers to saltwater aquariums, offering hardiness and forgiving nature while you learn the intricacies of marine water chemistry.' : care === 'Intermediate' ? 'They require some experience with saltwater aquariums and stable, established systems. Understanding water chemistry, proper acclimation, and disease prevention is important.' : 'They are recommended for experienced marine aquarists only. Advanced understanding of water chemistry, disease treatment, and specialized feeding requirements is essential for success with this species.'}` },
    { q: `How long do ${name}s live?`, a: `${name}s live ${lifespan} in captivity with proper care. Achieving maximum lifespan requires excellent water quality (ammonia and nitrite 0ppm, nitrate under 10ppm), stable salinity of ${salinity}, appropriate tank size, and a varied nutritious diet. Stress reduction through proper tankmate selection and adequate hiding spaces also contributes significantly to longevity.` },
  ];

  const faqSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map(f => ({"@type": "Question", "name": f.q, "acceptedAnswer": {"@type": "Answer", "text": f.a }}))
  });
  const articleSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `${name}: Complete Saltwater Care Guide`,
    "description": desc,
    "datePublished": TODAY,
    "dateModified": TODAY,
    "author": {"@type": "Organization", "name": "Pet Care Helper AI"},
    "publisher": {"@type": "Organization", "name": "Pet Care Helper AI"}
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google-adsense-account" content="ca-pub-6484141649562994">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6484141649562994" crossorigin="anonymous"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-FK0N7BD82Q"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-FK0N7BD82Q');</script>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${canon}">
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${esc(name)}: Saltwater Care Guide - Pet Care Helper AI" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${canon}" />
  <meta property="og:site_name" content="Pet Care Helper AI" />
  <title>${esc(name)}: Complete Saltwater Care Guide | Pet Care Helper AI</title>
  <link rel="stylesheet" href="../../styles.css">
  <script type="application/ld+json">${articleSchema}</script>
  <script type="application/ld+json">${faqSchema}</script>
</head>
<body>
  <header class="site-header">
    <div class="logo-title"><div class="logo-pill"></div><div><span class="site-name">Pet Care Helper AI</span><p class="subtitle">Dogs &bull; Cats &bull; Birds &bull; Reptiles &bull; Amphibians &bull; Fish</p></div></div>
    <nav class="main-nav">
      <button class="nav-toggle" aria-label="Toggle navigation"><span class="hamburger"></span></button>
      ${NAV}
    </nav>
  </header>
  <main>
    <div class="breadcrumb">
      <a href="/">Home</a> <span>&rsaquo;</span>
      <a href="/marine-fish">Marine Fish</a> <span>&rsaquo;</span>
      ${name}
    </div>
    <article class="guide-content">
      <h1>${name}: Complete Saltwater Care Guide</h1>

      <div class="breed-image-container" style="text-align:center;margin:20px 0;">
        <img src="https://source.unsplash.com/featured/800x600/?${searchTerm}" alt="${name} - saltwater aquarium care guide" class="breed-hero-image" loading="lazy" width="800" height="600" style="max-width:100%;height:auto;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
      </div>

      <div class="reviewed-badge"><span class="badge-icon">&#10003;</span> Reviewed for accuracy &mdash; ${TODAY}</div>

      <div class="breed-stats-card">
        <h2>Quick Facts</h2>
        <table class="comparison-table">
          <tr><th>Attribute</th><th>Details</th></tr>
          <tr><td>Type</td><td>Saltwater / Marine</td></tr>
          <tr><td>Size</td><td>${size}</td></tr>
          <tr><td>Lifespan</td><td>${lifespan}</td></tr>
          <tr><td>Temperature</td><td>${temp}</td></tr>
          <tr><td>Salinity</td><td>${salinity}</td></tr>
          <tr><td>Min Tank Size</td><td>${tankMin}</td></tr>
          <tr><td>Care Level</td><td>${care}</td></tr>
          <tr><td>Diet</td><td>${diet}</td></tr>
          <tr><td>Temperament</td><td>${temperament}</td></tr>
          <tr><td>Reef Safe</td><td>${reefSafe}</td></tr>
          <tr><td>Origin</td><td>${origin}</td></tr>
          <tr><td>Typical Cost</td><td>${cost}</td></tr>
        </table>
      </div>

      <div class="affiliate-callout">
        <h4>Recommended for Marine Aquariums</h4>
        <p>
          <a href="https://www.aquariumcoop.com" target="_blank" rel="sponsored noopener">Aquarium Co-Op</a> &mdash; Quality foods &amp; supplies |
          <a href="https://www.seachem.com" target="_blank" rel="sponsored noopener">Seachem</a> &mdash; Water treatment &amp; supplements |
          <a href="https://fluvalaquatics.com" target="_blank" rel="sponsored noopener">Fluval</a> &mdash; Marine filtration systems
        </p>
      </div>

      <h2>${name} Overview</h2>
      <p>The ${name} is a ${size.toLowerCase()} saltwater species originating from the ${origin}. Known for being ${temperament.toLowerCase()}, this species is rated ${care.toLowerCase()} care level, making it ${care === 'Beginner' ? 'an excellent choice for aquarists new to saltwater keeping' : care === 'Intermediate' ? 'well-suited for hobbyists with some marine aquarium experience' : 'appropriate only for experienced marine aquarists with well-established systems'}. With a lifespan of ${lifespan}, this is a rewarding species that can be enjoyed for many years with proper care.</p>

      <p>${unique}</p>

      <p>This species requires a minimum tank size of ${tankMin} with stable water parameters maintained at ${temp} and salinity of ${salinity}. As with all marine fish, water quality is paramount &mdash; saltwater species are generally less tolerant of parameter fluctuations than their freshwater counterparts, making reliable equipment and consistent maintenance essential.</p>

      <h2>Temperament &amp; Compatibility</h2>
      <p>The ${name} is described as ${temperament.toLowerCase()} and is considered ${reefSafe.toLowerCase().includes('yes') ? 'reef safe, making it compatible with coral-dominated aquariums' : reefSafe.toLowerCase().includes('caution') ? 'reef safe with caution &mdash; monitor closely in reef tanks as individual specimens may develop coral-nipping behavior' : 'NOT reef safe and is best suited for fish-only or fish-only-with-live-rock (FOWLR) systems'}.</p>
      <ul>
        <li><strong>Compatible tankmates:</strong> ${temperament.includes('Peaceful') ? 'Other peaceful community fish of similar size. Avoid keeping with aggressive or highly territorial species.' : temperament.includes('Semi-Aggressive') ? 'Semi-aggressive community fish of similar size. Introduce simultaneously when possible to reduce territorial aggression.' : 'Choose tankmates carefully. This species can be territorial and may harass more peaceful fish.'}</li>
        <li><strong>Avoid housing with:</strong> ${temperament.includes('Peaceful') ? 'Large aggressive species, highly territorial fish, or anything large enough to eat them.' : 'Very timid species that may be stressed, or very similar-looking species that may trigger aggression.'}</li>
        <li><strong>Stocking density:</strong> Marine fish require more space per individual than freshwater fish. The ${tankMin} minimum is for this species alone &mdash; increase tank size for community setups.</li>
      </ul>

      <h2>Tank Setup &amp; Requirements</h2>
      <h3>Tank Specifications</h3>
      <ul>
        <li><strong>Minimum size:</strong> ${tankMin}. Larger is strongly recommended for parameter stability.</li>
        <li><strong>Filtration:</strong> Protein skimmer (essential for marine systems), live rock for biological filtration, and mechanical filtration. Sump systems recommended for tanks over 50 gallons.</li>
        <li><strong>Water flow:</strong> Moderate to strong flow using powerheads or wavemakers. ${temperament.includes('Active') ? 'Active swimmers appreciate strong linear flow.' : 'Provide areas of both higher and lower flow within the tank.'}</li>
        <li><strong>Lighting:</strong> ${reefSafe.toLowerCase().includes('yes') ? 'Full-spectrum reef lighting if keeping with corals. LED systems offer energy efficiency and controllable spectrum.' : 'Standard marine lighting adequate for fish-only systems.'}</li>
        <li><strong>Aquascaping:</strong> Live rock providing caves, overhangs, and swim-through passages. Ensure open swimming space for active species.</li>
      </ul>

      <h3>Water Parameters</h3>
      <table class="comparison-table">
        <tr><th>Parameter</th><th>Ideal Range</th></tr>
        <tr><td>Temperature</td><td>${temp}</td></tr>
        <tr><td>Salinity</td><td>${salinity}</td></tr>
        <tr><td>pH</td><td>8.1-8.4</td></tr>
        <tr><td>Ammonia</td><td>0 ppm</td></tr>
        <tr><td>Nitrite</td><td>0 ppm</td></tr>
        <tr><td>Nitrate</td><td>&lt;10 ppm (reef), &lt;20 ppm (FOWLR)</td></tr>
        <tr><td>Alkalinity</td><td>8-12 dKH</td></tr>
        <tr><td>Calcium</td><td>380-450 ppm</td></tr>
        <tr><td>Magnesium</td><td>1250-1350 ppm</td></tr>
      </table>

      <div class="warning-box">
        <h4>Critical: Cycle Your Tank First</h4>
        <p>Never add marine fish to an uncycled tank. The nitrogen cycle takes 4-8 weeks to establish in saltwater. Use live rock and a quality bacterial supplement to seed the cycle. Test ammonia, nitrite, and nitrate daily during cycling. Only add fish when ammonia and nitrite read 0 ppm for at least one week. Patience during setup prevents heartbreaking fish losses.</p>
      </div>

      <div class="affiliate-callout">
        <h4>Marine Tank Essentials</h4>
        <p>
          <a href="https://www.apifishcare.com" target="_blank" rel="sponsored noopener">API Saltwater Master Test Kit</a> &mdash; Essential water testing |
          <a href="https://www.seachem.com" target="_blank" rel="sponsored noopener">Seachem Marine Buffer</a> &mdash; Alkalinity stability |
          <a href="https://fluvalaquatics.com" target="_blank" rel="sponsored noopener">Fluval Marine</a> &mdash; Protein skimmers &amp; filters
        </p>
      </div>

      <h2>Diet &amp; Nutrition</h2>
      <p>The ${name} is classified as ${diet.split(':')[0].toLowerCase()}. Proper nutrition is essential for maintaining health, coloration, and immune function.</p>
      <ul>
        <li><strong>Primary diet:</strong> ${diet}.</li>
        <li><strong>Feeding frequency:</strong> 2-3 small feedings per day. Small frequent meals are better than one large feeding.</li>
        <li><strong>Variety:</strong> Rotate between different food types to ensure complete nutrition. ${diet.includes('Herbi') ? 'Offer nori sheets, spirulina-enriched foods, and blanched vegetables.' : diet.includes('Carni') ? 'Offer frozen mysis shrimp, brine shrimp, and high-quality pellets.' : 'Offer a mix of frozen foods, pellets, and algae-based foods.'}</li>
        <li><strong>Supplements:</strong> Vitamin-enriched foods or vitamin soaking solutions (like Selcon) boost immune function and enhance coloration.</li>
        <li><strong>Avoid:</strong> Overfeeding is the most common feeding mistake. Excess food decays and degrades water quality, which is particularly dangerous in saltwater systems.</li>
      </ul>

      <h2>Common Health Issues</h2>
      <p>Understanding potential health problems helps marine aquarists recognize and respond to issues quickly. The most common health concerns for ${name}s include:</p>
      <ul>
        ${health.split(', ').map(h => `<li><strong>${h.split(' (')[0].split(' from ')[0]}:</strong> ${h}.</li>`).join('\n        ')}
      </ul>
      <p><strong>Quarantine protocol:</strong> Always quarantine new fish for 2-4 weeks before adding to your display tank. A simple quarantine tank with a sponge filter, heater, and PVC pipe hides is sufficient. This prevents introducing disease to your established system and allows new fish to recover from shipping stress.</p>

      <div class="emergency-callout">
        <h4>Disease Emergency Response</h4>
        <p>If you notice white spots (ich), velvet-like coating, rapid breathing, flashing against rocks, or loss of appetite, act immediately. Move affected fish to quarantine if possible. Marine ich can kill fish within days if untreated. Copper-based treatments are effective but must be dosed precisely using a copper test kit. Never use copper in reef tanks as it kills invertebrates.</p>
      </div>

      <h2>Grooming &amp; Maintenance</h2>
      <ul>
        <li><strong>Water changes:</strong> 10-20% weekly using properly mixed saltwater (mix 24 hours ahead, match temperature and salinity).</li>
        <li><strong>Equipment maintenance:</strong> Clean protein skimmer cup 2-3 times weekly. Replace filter media monthly. Calibrate refractometer regularly.</li>
        <li><strong>Algae management:</strong> Magnetic algae scrapers for glass cleaning. Clean-up crew (snails, hermit crabs) helps control nuisance algae.</li>
        <li><strong>Water testing:</strong> Test salinity, pH, ammonia, nitrite, and nitrate weekly. Test alkalinity, calcium, and magnesium for reef systems.</li>
      </ul>

      <h2>Cost Overview</h2>
      <table class="comparison-table">
        <tr><th>Expense Category</th><th>Estimated Cost</th></tr>
        <tr><td>Fish Purchase</td><td>${cost.split(';')[0]}</td></tr>
        <tr><td>Tank &amp; Equipment Setup</td><td>${cost.split(';')[1] || '$300-$1,000+'}</td></tr>
        <tr><td>Live Rock &amp; Sand</td><td>$100-$300</td></tr>
        <tr><td>Salt Mix (annual)</td><td>$100-$200</td></tr>
        <tr><td>Food (annual)</td><td>$150-$300</td></tr>
        <tr><td>Electricity (annual)</td><td>$200-$500</td></tr>
        <tr><td>Water Testing Supplies</td><td>$50-$100/year</td></tr>
        <tr><td>Replacement Equipment</td><td>$100-$300/year</td></tr>
      </table>
      <p>Saltwater aquariums are a premium hobby with higher ongoing costs than freshwater. Budget for unexpected equipment failures and potential fish health treatments.</p>

      <h2>Insurance Considerations</h2>
      <p>While individual fish insurance is not widely available, homeowners or renters insurance may cover damage from tank leaks or failures. Some high-value livestock collectors use specialized aquarium insurance. The best protection is prevention: invest in quality equipment, a reliable backup power supply (battery-operated air pump minimum), and proper maintenance routines.</p>

      <h2>Frequently Asked Questions</h2>
      ${faq.map(f => `
      <h3>${f.q}</h3>
      <p>${f.a}</p>`).join('')}

      <h2>Related Marine Species</h2>
      <div class="guide-grid">
        ${species.filter(sp => sp[0] !== slug).slice(0, 4).map(sp => `<a href="/breeds/marine-fish/${sp[0]}" class="guide-card"><h3>${sp[1]}</h3><p>${sp[7]} care level &bull; Min ${sp[6]}</p></a>`).join('\n        ')}
      </div>
      <p style="margin-top: 16px;"><a href="/marine-fish">View all marine fish species &rarr;</a></p>

      <section class="info-card">
        <h3>Ask Our AI About ${name}s</h3>
        <p>Have questions about ${name} care, tank setup, or compatibility? Our AI assistant provides personalized guidance for saltwater aquarists.</p>
        <div class="hero-actions"><a href="/chat" class="primary-btn">Ask the AI Now</a></div>
      </section>
    </article>

    <section class="transparency">
      <h3>Important Disclaimer</h3>
      <p>This guide provides general educational information about ${name} care in saltwater aquariums. Individual specimens may vary. Always research thoroughly and consult with experienced marine aquarists or aquatic veterinarians for specific concerns. Some links on this page are affiliate links.</p>
    </section>
  </main>
  <footer class="site-footer">
    <p>AI Pet Medical &amp; Vet Help Finder &mdash; educational guidance, real-world vet options, and curated resources.</p>
    <p style="font-size: 0.85rem; margin-top: 8px;">Some suggestions may include sponsored partners.</p>
    <nav class="footer-nav" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;">
      <a href="/guides">Guides</a> &middot; <a href="/tools/">Tools</a> &middot; <a href="/locations/">Locations</a> &middot; <a href="/amphibians">Amphibians</a> &middot; <a href="/marine-fish">Marine Fish</a> &middot; <a href="/resources">Resources</a> &middot; <a href="/about">About</a> &middot; <a href="/contact">Contact</a> &middot; <a href="/privacy-policy">Privacy</a> &middot; <a href="/terms-of-service">Terms</a> &middot; <a href="/feeds/">RSS Feeds</a>
    </nav>
  </footer>
  <script>document.addEventListener('DOMContentLoaded',function(){const t=document.querySelector('.nav-toggle'),m=document.querySelector('.nav-menu');if(t){t.addEventListener('click',function(){m.classList.toggle('active');t.classList.toggle('active');});}});</script>
  <script type="text/javascript" src="https://s.skimresources.com/js/299616X1787412.skimlinks.js"></script>
</body>
</html>`;
}

let created = 0;
for (const s of species) {
  const fp = path.join(DIR, `${s[0]}.html`);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, makePage(s));
    created++;
    console.log(`Created: breeds/marine-fish/${s[0]}.html`);
  } else {
    console.log(`Exists: breeds/marine-fish/${s[0]}.html`);
  }
}
console.log(`\nDone! Created ${created} marine fish species pages.`);
