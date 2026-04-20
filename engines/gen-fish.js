import fs from 'fs';
import path from 'path';

const DIR = 'breeds/fish';

// [slug, name, size, lifespan, temp, pH, tankMin, care, diet, temperament, type]
const breeds = [
  ['apistogramma','Apistogramma','Small (2-3 in)','3-5 years','72-86°F','5.0-7.0','20 gal','Intermediate','Omnivore','Semi-Aggressive','Freshwater'],
  ['blue-damsel','Blue Damselfish','Small (3 in)','5-6 years','72-78°F','8.1-8.4','30 gal','Beginner','Omnivore','Semi-Aggressive','Saltwater'],
  ['blue-tang','Blue Tang','Large (12 in)','8-20 years','72-78°F','8.1-8.4','180 gal','Advanced','Herbivore','Semi-Aggressive','Saltwater'],
  ['cardinal-tetra','Cardinal Tetra','Small (2 in)','4-5 years','73-81°F','4.6-6.2','10 gal','Beginner','Omnivore','Peaceful','Freshwater'],
  ['chromis','Green Chromis','Small (3 in)','8-15 years','72-82°F','8.1-8.4','30 gal','Beginner','Omnivore','Peaceful','Saltwater'],
  ['cleaner-shrimp','Cleaner Shrimp','Small (2-3 in)','2-3 years','72-82°F','8.1-8.4','10 gal','Beginner','Omnivore','Peaceful','Saltwater Invert'],
  ['cleaner-wrasse','Cleaner Wrasse','Small (3-4 in)','4+ years','72-78°F','8.1-8.4','55 gal','Expert','Parasites/Prepared','Peaceful','Saltwater'],
  ['clownfish','Clownfish','Small (3-4 in)','6-10 years','72-82°F','8.0-8.4','20 gal','Beginner','Omnivore','Semi-Aggressive','Saltwater'],
  ['clown-pleco','Clown Pleco','Small (3-4 in)','10-12 years','73-82°F','6.8-7.6','20 gal','Beginner','Herbivore (wood)','Peaceful','Freshwater'],
  ['common-pleco','Common Pleco','Very Large (15-24 in)','10-15 years','72-86°F','6.5-7.5','125 gal','Beginner','Omnivore','Peaceful','Freshwater'],
  ['coral-beauty','Coral Beauty Angelfish','Small (4 in)','5-7 years','72-82°F','8.1-8.4','70 gal','Intermediate','Omnivore','Semi-Aggressive','Saltwater'],
  ['danio','Zebra Danio','Small (2 in)','3-5 years','64-77°F','6.0-8.0','10 gal','Beginner','Omnivore','Peaceful','Freshwater'],
  ['dwarf-gourami','Dwarf Gourami','Small (3.5 in)','4-6 years','72-82°F','6.0-7.5','10 gal','Beginner','Omnivore','Peaceful','Freshwater'],
  ['emperor-angelfish','Emperor Angelfish','Large (15 in)','15-20 years','72-82°F','8.1-8.4','220 gal','Expert','Omnivore','Semi-Aggressive','Saltwater'],
  ['fairy-wrasse','Fairy Wrasse','Small (3-5 in)','5-8 years','72-78°F','8.1-8.4','55 gal','Intermediate','Carnivore','Peaceful','Saltwater'],
  ['fancy-goldfish','Fancy Goldfish','Medium (6-8 in)','10-15 years','65-75°F','6.0-8.0','20 gal per fish','Beginner','Omnivore','Peaceful','Freshwater'],
  ['firefish','Firefish Goby','Small (3 in)','3-5 years','72-80°F','8.1-8.4','20 gal','Beginner','Carnivore','Peaceful/Timid','Saltwater'],
  ['flame-angelfish','Flame Angelfish','Small (4 in)','5-7 years','72-82°F','8.1-8.4','70 gal','Intermediate','Omnivore','Semi-Aggressive','Saltwater'],
  ['french-angelfish','French Angelfish','Large (15 in)','10-15 years','72-82°F','8.1-8.4','250 gal','Expert','Omnivore','Semi-Aggressive','Saltwater'],
  ['hermit-crab','Hermit Crab (Marine)','Small (1-2 in)','2-5 years','72-82°F','8.1-8.4','10 gal','Beginner','Omnivore/Scavenger','Peaceful','Saltwater Invert'],
  ['honey-gourami','Honey Gourami','Small (2 in)','4-8 years','72-82°F','6.0-7.5','10 gal','Beginner','Omnivore','Peaceful','Freshwater'],
  ['koi','Koi','Very Large (24-36 in)','25-35 years','36-90°F','7.0-8.5','1000 gal / pond','Intermediate','Omnivore','Peaceful','Freshwater/Pond'],
  ['kole-tang','Kole Tang','Medium (7 in)','5-7 years','72-78°F','8.1-8.4','75 gal','Intermediate','Herbivore','Peaceful','Saltwater'],
  ['mandarin-goby','Mandarin Goby','Small (3 in)','2-5 years','72-82°F','8.1-8.4','30 gal','Expert','Copepods','Peaceful','Saltwater'],
  ['maroon-clownfish','Maroon Clownfish','Medium (6 in)','7+ years','72-82°F','8.0-8.4','30 gal','Intermediate','Omnivore','Aggressive','Saltwater'],
  ['melanurus-wrasse','Melanurus Wrasse','Small (5 in)','5-8 years','72-78°F','8.1-8.4','50 gal','Beginner','Carnivore','Semi-Aggressive','Saltwater'],
  ['otocinclus','Otocinclus','Very Small (1-2 in)','3-5 years','72-79°F','6.0-7.5','10 gal','Intermediate','Herbivore (algae)','Peaceful','Freshwater'],
  ['pearl-gourami','Pearl Gourami','Medium (4-5 in)','4-5 years','77-82°F','6.0-8.0','30 gal','Beginner','Omnivore','Peaceful','Freshwater'],
  ['peppermint-shrimp','Peppermint Shrimp','Small (2 in)','2-3 years','72-82°F','8.1-8.4','10 gal','Beginner','Omnivore','Peaceful','Saltwater Invert'],
  ['pictus-catfish','Pictus Catfish','Medium (5 in)','8-10 years','72-78°F','5.8-6.8','55 gal','Intermediate','Omnivore','Peaceful','Freshwater'],
  ['powder-blue-tang','Powder Blue Tang','Medium (9 in)','10+ years','72-78°F','8.1-8.4','125 gal','Expert','Herbivore','Semi-Aggressive','Saltwater'],
  ['rainbow-fish','Rainbowfish','Medium (4-6 in)','5-8 years','72-82°F','6.5-8.0','30 gal','Beginner','Omnivore','Peaceful','Freshwater'],
  ['ram-cichlid','Ram Cichlid','Small (2-3 in)','3-4 years','78-85°F','5.0-7.0','20 gal','Intermediate','Omnivore','Peaceful','Freshwater'],
  ['rasbora','Harlequin Rasbora','Small (2 in)','5-8 years','72-81°F','6.0-7.5','10 gal','Beginner','Omnivore','Peaceful','Freshwater'],
  ['six-line-wrasse','Six-Line Wrasse','Small (3 in)','4-6 years','72-78°F','8.1-8.4','30 gal','Beginner','Carnivore','Semi-Aggressive','Saltwater'],
  ['turbo-snail','Turbo Snail','Small (2-3 in)','3-5 years','72-82°F','8.1-8.4','10 gal','Beginner','Herbivore (algae)','Peaceful','Saltwater Invert'],
  ['watchman-goby','Watchman Goby','Small (3-4 in)','2-5 years','72-82°F','8.1-8.4','20 gal','Beginner','Carnivore','Peaceful','Saltwater'],
  ['white-cloud','White Cloud Mountain Minnow','Very Small (1.5 in)','5-7 years','60-72°F','6.0-8.0','10 gal','Beginner','Omnivore','Peaceful','Freshwater'],
  ['wrasse','Wrasse','Varies (3-12 in)','5-10 years','72-82°F','8.1-8.4','50+ gal','Intermediate','Carnivore','Varies','Saltwater'],
  ['yellow-tang','Yellow Tang','Medium (8 in)','5-10+ years','72-82°F','8.1-8.4','100 gal','Intermediate','Herbivore','Semi-Aggressive','Saltwater'],
];

function makePage(b) {
  const [slug,name,size,lifespan,temp,pH,tankMin,care,diet,temperament,type] = b;
  const isSalt = type.includes('Salt');
  const isInvert = type.includes('Invert');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-FK0N7BD82Q"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-FK0N7BD82Q');</script>
  <meta name="description" content="Complete ${name} care guide: tank setup, water parameters, diet, and health. Expert advice for ${isSalt ? 'saltwater' : 'freshwater'} aquarium keepers.">
  <link rel="canonical" href="https://petcarehelperai.com/breeds/fish/${slug}">
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${name} Care Guide: Tank Setup, Diet &amp; Health - Pet Care Helper AI" />
  <meta property="og:description" content="Complete ${name} care guide: tank setup, water parameters, diet, and health." />
  <meta property="og:url" content="https://petcarehelperai.com/breeds/fish/${slug}" />
  <meta property="og:site_name" content="Pet Care Helper AI" />
  <title>${name} Care Guide: Tank Setup, Diet &amp; Health - Pet Care Helper AI</title>
  <link rel="stylesheet" href="../../styles.css">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Article","headline":"${name} Care Guide","datePublished":"2026-02-19","dateModified":"2026-02-19","description":"Complete care guide for ${name} covering tank requirements, water parameters, diet, and health.","author":{"@type":"Organization","name":"Pet Care Helper AI"},"publisher":{"@type":"Organization","name":"Pet Care Helper AI"}}
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
        <li><a href="/birds" class="nav-link">Birds</a></li>
        <li><a href="/reptiles" class="nav-link">Reptiles</a></li>
        <li><a href="/fish" class="nav-link active">Fish</a></li>
        <li><a href="/guides" class="nav-link">Guides</a></li>
      </ul>
    </nav>
  </header>
  <main>
    <div class="breadcrumb">
      <a href="/">Home</a> <span>&rsaquo;</span>
      <a href="/fish">Fish</a> <span>&rsaquo;</span>
      <a href="/breeds/fish-breeds">Species</a> <span>&rsaquo;</span>
      ${name}
    </div>
    <article class="guide-content">
      <h1>${name}: Complete Care Guide</h1>
      <div class="breed-stats-card">
        <h2>Quick Facts</h2>
        <table class="comparison-table">
          <tr><th>Attribute</th><th>Details</th></tr>
          <tr><td>Type</td><td>${type}</td></tr>
          <tr><td>Size</td><td>${size}</td></tr>
          <tr><td>Lifespan</td><td>${lifespan}</td></tr>
          <tr><td>Temperature</td><td>${temp}</td></tr>
          <tr><td>pH Range</td><td>${pH}</td></tr>
          <tr><td>Min Tank Size</td><td>${tankMin}</td></tr>
          <tr><td>Care Level</td><td>${care}</td></tr>
          <tr><td>Diet</td><td>${diet}</td></tr>
          <tr><td>Temperament</td><td>${temperament}</td></tr>
        </table>
      </div>

      <div class="affiliate-callout">
        <h4>Recommended for ${name}s</h4>
        <p>
          <a href="https://www.aquariumcoop.com" target="_blank" rel="sponsored noopener">Aquarium Co-Op</a> - Quality foods &amp; supplies |
          <a href="https://www.seachem.com" target="_blank" rel="sponsored noopener">Seachem</a> - Water treatment |
          <a href="https://fluvalaquatics.com" target="_blank" rel="sponsored noopener">Fluval</a> - Filtration systems
        </p>
      </div>

      <h2>${name} Overview</h2>
      <p>The ${name} is a ${size.toLowerCase()} ${type.toLowerCase()} ${isInvert ? 'invertebrate' : 'species'} that ${care === 'Beginner' ? 'is an excellent choice for both beginners and experienced aquarists' : care === 'Intermediate' ? 'is well-suited for hobbyists with some experience' : 'requires advanced knowledge and a well-established aquarium'}. With a lifespan of ${lifespan}, this ${temperament.toLowerCase()} species requires a minimum tank size of ${tankMin}.</p>

      <p>${name}s thrive in water temperatures of ${temp} with a pH range of ${pH}. As ${diet.toLowerCase().includes('omni') ? 'an omnivore' : diet.toLowerCase().includes('herb') ? 'an herbivore' : 'a carnivore'}, they ${diet.toLowerCase().includes('omni') ? 'accept a wide variety of foods' : diet.toLowerCase().includes('herb') ? 'primarily graze on algae and plant matter' : 'prefer meaty foods and live or frozen offerings'}.</p>

      <h2>Tank Requirements &amp; Setup</h2>
      <h3>Tank Size</h3>
      <ul>
        <li><strong>Minimum:</strong> ${tankMin}</li>
        <li><strong>Recommended:</strong> Larger is always better for stability and swimming room.</li>
        <li><strong>Type:</strong> ${isSalt ? 'Saltwater reef or fish-only setup' : 'Freshwater planted or community tank'}</li>
      </ul>
      <h3>Equipment</h3>
      <ul>
        <li><strong>Filtration:</strong> ${isSalt ? 'Protein skimmer and live rock for biological filtration' : 'Quality canister or HOB filter rated for your tank size'}.</li>
        <li><strong>Heating:</strong> Reliable heater to maintain ${temp}.</li>
        <li><strong>Lighting:</strong> ${isSalt ? 'Appropriate reef or marine lighting' : 'Standard aquarium lighting; planted tanks benefit from full-spectrum'}.</li>
        ${isSalt ? '<li><strong>Powerheads:</strong> For adequate water flow and circulation.</li>' : '<li><strong>Air Pump:</strong> Optional but beneficial for oxygenation.</li>'}
      </ul>

      <h2>Water Parameters</h2>
      <table class="comparison-table">
        <tr><th>Parameter</th><th>Ideal Range</th></tr>
        <tr><td>Temperature</td><td>${temp}</td></tr>
        <tr><td>pH</td><td>${pH}</td></tr>
        <tr><td>Ammonia</td><td>0 ppm</td></tr>
        <tr><td>Nitrite</td><td>0 ppm</td></tr>
        <tr><td>Nitrate</td><td>${isSalt ? '&lt;10 ppm' : '&lt;20 ppm'}</td></tr>
        ${isSalt ? '<tr><td>Salinity</td><td>1.020-1.025 sg</td></tr>' : ''}
      </table>

      <div class="warning-box">
        <h4>Water Quality Warning</h4>
        <p>${isSalt ? 'Saltwater species are sensitive to parameter fluctuations. Use an RO/DI unit for water changes and test regularly.' : 'Always cycle your tank fully before adding fish. Use a quality test kit to monitor ammonia, nitrite, and nitrate levels.'} Never add ${name}s to an uncycled or newly set up tank.</p>
      </div>

      <h2>Diet &amp; Feeding</h2>
      <ul>
        <li><strong>Primary Diet:</strong> ${diet}.</li>
        <li><strong>Foods:</strong> ${diet.includes('Omni') ? 'High-quality flakes/pellets, frozen brine shrimp, mysis shrimp, and blanched vegetables' : diet.includes('Herb') ? 'Algae sheets, spirulina flakes, blanched vegetables, and algae-based pellets' : 'Frozen mysis shrimp, brine shrimp, quality pellets, and live foods'}.</li>
        <li><strong>Feeding Schedule:</strong> ${isInvert ? 'Feed 2-3 times weekly or allow natural grazing' : 'Feed 1-2 times daily, only what can be consumed in 2-3 minutes'}.</li>
        <li><strong>Variety:</strong> Rotate different food types for balanced nutrition.</li>
      </ul>

      <div class="affiliate-callout">
        <h4>${name} Tank Essentials</h4>
        <p>
          <a href="https://www.apifishcare.com" target="_blank" rel="sponsored noopener">API Master Test Kit</a> - Monitor water quality |
          <a href="https://www.seachem.com" target="_blank" rel="sponsored noopener">Seachem Prime</a> - Water conditioner |
          <a href="https://www.aquariumcoop.com" target="_blank" rel="sponsored noopener">Aquarium Co-Op</a> - Premium fish foods
        </p>
      </div>

      <h2>Common Health Issues</h2>
      <ul>
        <li><strong>${isSalt ? 'Marine Ich (Cryptocaryon)' : 'Ich (White Spot Disease)'}:</strong> White spots on body and fins. ${isSalt ? 'Treat with copper-based medication in quarantine tank' : 'Raise temperature gradually and use ich medication'}.</li>
        <li><strong>${isSalt ? 'Marine Velvet' : 'Fin Rot'}:</strong> ${isSalt ? 'Dusty gold appearance; highly contagious and often fatal if untreated' : 'Ragged or deteriorating fins; improve water quality and treat with antibacterials'}.</li>
        <li><strong>${isInvert ? 'Molting Issues' : 'Parasites'}:</strong> ${isInvert ? 'Ensure proper water parameters and nutrition during molting' : 'Internal and external parasites; quarantine new additions'}.</li>
        <li><strong>Stress:</strong> Faded colors, hiding, or erratic behavior often indicate stress from poor water quality or aggressive tankmates.</li>
      </ul>

      <h2>Compatibility</h2>
      <ul>
        <li><strong>Temperament:</strong> ${temperament} - ${temperament.includes('Peaceful') ? 'pairs well with other peaceful community species' : temperament.includes('Semi') ? 'may show territorial behavior; choose tankmates carefully' : 'best kept with similar-sized semi-aggressive species'}.</li>
        <li><strong>Tank Mates:</strong> ${temperament.includes('Peaceful') ? 'Other peaceful community fish of similar size' : 'Research compatible species carefully before adding to your tank'}.</li>
        <li><strong>Avoid:</strong> ${temperament.includes('Peaceful') ? 'Large aggressive species that may bully or eat them' : 'Very timid species that may be stressed by their presence'}.</li>
      </ul>

      <h2>Is This Species Right for You?</h2>
      <h3>${name}s Are Great For:</h3>
      <ul>
        <li>${care === 'Beginner' ? 'Beginning aquarists looking for a rewarding species' : 'Experienced hobbyists ready for a rewarding challenge'}</li>
        <li>${isSalt ? 'Reef aquarium enthusiasts' : 'Community freshwater tank keepers'}</li>
        <li>Those who can maintain stable ${isSalt ? 'saltwater' : 'freshwater'} parameters</li>
      </ul>
      <h3>${name}s May Not Be Ideal For:</h3>
      <ul>
        <li>${care === 'Expert' || care === 'Advanced' ? 'Beginners without established, mature tanks' : 'Those unable to commit to regular water testing and maintenance'}</li>
        <li>${tankMin.includes('100') || tankMin.includes('125') || tankMin.includes('180') || tankMin.includes('220') || tankMin.includes('250') || tankMin.includes('1000') ? 'Hobbyists without space for a large aquarium' : 'Those looking for a zero-maintenance pet'}</li>
      </ul>

      <section class="info-card">
        <h3>Ask Our AI About ${name}s</h3>
        <p>Have specific questions about ${name} care, tank setup, or health? Our AI assistant can provide personalized guidance.</p>
        <div class="hero-actions"><a href="/chat" class="primary-btn">Ask the AI Now</a></div>
      </section>
    </article>
    <section class="transparency">
      <h3>Disclaimer</h3>
      <p>This care guide provides general information about ${name}s. Individual specimens may vary. Always research thoroughly and consult with aquarium professionals. This page contains affiliate links.</p>
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
console.log(`\nDone! Created ${created} fish species pages.`);
