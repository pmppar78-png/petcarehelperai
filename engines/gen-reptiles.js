import fs from 'fs';
import path from 'path';

const DIR = 'breeds/reptiles';

// [slug, name, size, lifespan, temp, humidity, enclosure, care, diet, temperament, subtype]
const breeds = [
  ['ackie-monitor','Ackie Monitor','Medium (24-28 in)','15-20 years','80-150°F (gradient)','40-60%','4x2x2 ft','Intermediate','Insects, small prey','Active, Inquisitive','Lizard'],
  ['african-clawed-frog','African Clawed Frog','Medium (4-5 in)','15-30 years','68-77°F','Aquatic','10+ gal aquatic','Beginner','Pellets, bloodworms','Peaceful, Hardy','Amphibian'],
  ['african-dwarf-frog','African Dwarf Frog','Small (1-2 in)','5-10 years','72-82°F','Aquatic','5+ gal aquatic','Beginner','Frozen bloodworms, pellets','Peaceful, Social','Amphibian'],
  ['american-bullfrog','American Bullfrog','Large (6-8 in)','7-10 years','75-85°F','70-80%','55+ gal semi-aquatic','Intermediate','Insects, mice, fish','Bold, Voracious','Amphibian'],
  ['axolotl','Axolotl','Medium (9-12 in)','10-15 years','60-68°F','Aquatic','20+ gal aquatic','Intermediate','Earthworms, pellets','Docile, Unique','Amphibian'],
  ['black-throat-monitor','Black Throat Monitor','Very Large (5-7 ft)','20-25 years','80-130°F (gradient)','60-70%','8x4x4 ft minimum','Advanced','Whole prey, insects','Intelligent, Can be tamed','Lizard'],
  ['blood-python','Blood Python','Large (4-6 ft)','20-25 years','78-88°F','60-70%','4x2x1.5 ft','Intermediate','Rats','Docile when established','Snake'],
  ['box-turtle','Box Turtle','Small-Medium (5-7 in)','30-50+ years','70-85°F (gradient)','60-80%','4x2 ft outdoor/indoor','Intermediate','Omnivore: insects, veg, fruit','Shy, Personable','Turtle'],
  ['brazilian-rainbow-boa','Brazilian Rainbow Boa','Medium-Large (5-7 ft)','20-25 years','75-85°F','75-90%','4x2x2 ft','Intermediate','Rats, mice','Generally calm','Snake'],
  ['burmese-python','Burmese Python','Very Large (12-18 ft)','20-30 years','78-90°F','60%','8x4x4 ft minimum','Expert','Large rats, rabbits','Docile but powerful','Snake'],
  ['carpet-python','Carpet Python','Large (6-10 ft)','15-20 years','75-88°F','50-60%','4x2x4 ft (arboreal)','Intermediate','Rats, mice','Semi-arboreal, Active','Snake'],
  ['dart-frog','Dart Frog','Very Small (0.5-2 in)','10-15 years','72-80°F','80-100%','18x18x24 vivarium','Advanced','Fruit flies, springtails','Bold, Diurnal','Amphibian'],
  ['eastern-newt','Eastern Newt','Small (3-5 in)','12-15 years','60-70°F','Semi-aquatic','10+ gal semi-aquatic','Intermediate','Bloodworms, brine shrimp','Peaceful, Interesting','Amphibian'],
  ['fire-bellied-newt','Fire-Bellied Newt','Small (3-5 in)','10-15 years','60-70°F','Semi-aquatic','10+ gal semi-aquatic','Beginner','Bloodworms, pellets','Hardy, Active','Amphibian'],
  ['fire-bellied-toad','Fire-Bellied Toad','Small (2 in)','10-15 years','68-77°F','70-80%','10+ gal semi-aquatic','Beginner','Small insects','Active, Colorful','Amphibian'],
  ['fire-salamander','Fire Salamander','Medium (6-10 in)','10-20 years','55-68°F','70-80%','20+ gal terrestrial','Intermediate','Earthworms, insects','Nocturnal, Striking','Amphibian'],
  ['fire-skink','Fire Skink','Medium (12-15 in)','15-20 years','75-90°F (gradient)','60-70%','40+ gal with substrate','Intermediate','Insects, occasional fruit','Shy, Burrowing','Lizard'],
  ['garter-snake','Garter Snake','Small-Medium (2-3 ft)','10-15 years','72-85°F','50-60%','20+ gal','Beginner','Fish, earthworms, mice','Active, Hardy','Snake'],
  ['greek-tortoise','Greek Tortoise','Small-Medium (5-8 in)','50-100+ years','75-95°F (gradient)','40-60%','4x2 ft or outdoor pen','Intermediate','Leafy greens, weeds, hay','Calm, Long-lived','Turtle'],
  ['green-tree-python','Green Tree Python','Medium (5-7 ft)','15-20 years','72-88°F','50-70%','2x2x3 ft (arboreal)','Advanced','Mice, rats','Display animal, Can bite','Snake'],
  ['hermann-tortoise','Hermann\'s Tortoise','Small-Medium (6-8 in)','50-75+ years','70-90°F (gradient)','40-60%','4x2 ft or outdoor pen','Beginner','Leafy greens, weeds','Calm, Hardy','Turtle'],
  ['hognose-snake','Hognose Snake','Small (1.5-3 ft)','15-20 years','72-90°F','30-50%','20+ gal','Beginner','Mice (some need toads)','Dramatic, Entertaining','Snake'],
  ['jacksons-chameleon','Jackson\'s Chameleon','Medium (9-13 in)','5-10 years','65-80°F','50-80%','2x2x4 ft screen','Advanced','Insects','Solitary, Slow-moving','Lizard'],
  ['leachianus-gecko','Leachianus Gecko','Large (8-17 in)','20-30 years','72-80°F','60-80%','18x18x36 arboreal','Intermediate','Fruit CGD, insects','Vocal, Handleable','Lizard'],
  ['leopard-tortoise','Leopard Tortoise','Large (10-18 in)','50-100 years','75-95°F (gradient)','40-60%','Outdoor pen or 8x4 ft','Intermediate','Grasses, weeds, hay','Calm, Grazer','Turtle'],
  ['long-tailed-lizard','Long-Tailed Lizard','Small (10-12 in, mostly tail)','5-8 years','75-85°F','60-70%','20+ gal tall','Beginner','Small insects','Active, Flighty','Lizard'],
  ['map-turtle','Map Turtle','Medium (4-10 in)','15-25 years','75-85°F (basking 90°F)','Aquatic','55+ gal aquatic','Intermediate','Pellets, insects, veg','Active, Basking','Turtle'],
  ['milk-snake','Milk Snake','Medium (2-5 ft)','15-20 years','72-85°F','40-60%','20-40 gal','Beginner','Mice','Docile, Colorful','Snake'],
  ['mud-turtle','Mud Turtle','Small (3-5 in)','30-50 years','75-82°F','Aquatic','20+ gal aquatic','Beginner','Pellets, insects, worms','Hardy, Easy','Turtle'],
  ['musk-turtle','Musk Turtle','Small (3-5 in)','30-50 years','72-82°F','Aquatic','20+ gal aquatic','Beginner','Pellets, insects, shrimp','Hardy, May be feisty','Turtle'],
  ['ornate-box-turtle','Ornate Box Turtle','Small-Medium (4-6 in)','30-40+ years','70-85°F','50-70%','4x2 ft or outdoor pen','Intermediate','Insects, veg, fruit','Shy, Beautiful','Turtle'],
  ['pacman-frog','Pacman Frog','Medium-Large (4-7 in)','6-10 years','75-85°F','60-80%','10+ gal terrestrial','Beginner','Insects, mice, fish','Ambush predator, Hardy','Amphibian'],
  ['painted-turtle','Painted Turtle','Medium (4-10 in)','25-50 years','75-82°F (basking 90°F)','Aquatic','55+ gal aquatic','Beginner','Pellets, insects, greens','Active, Hardy','Turtle'],
  ['panther-chameleon','Panther Chameleon','Medium (12-20 in)','5-7 years','72-85°F','50-70%','2x2x4 ft screen','Advanced','Insects','Colorful, Solitary','Lizard'],
  ['pine-snake','Pine Snake','Large (4-8 ft)','15-20 years','75-88°F','40-50%','4x2x2 ft','Intermediate','Rats, mice','Hissy but generally calm','Snake'],
  ['poison-dart-frog','Poison Dart Frog','Very Small (0.5-2 in)','10-15 years','72-80°F','80-100%','18x18x24 vivarium','Advanced','Fruit flies, springtails','Bold, Diurnal, Colorful','Amphibian'],
  ['rankins-dragon','Rankin\'s Dragon','Small (10-12 in)','6-10 years','80-110°F (gradient)','30-40%','36x18x18 in','Beginner','Insects, vegetables','Social, Active','Lizard'],
  ['red-eared-slider','Red-Eared Slider','Medium-Large (8-12 in)','20-40+ years','75-85°F (basking 90°F)','Aquatic','75+ gal aquatic','Beginner','Pellets, insects, greens','Active, Hardy','Turtle'],
  ['red-eyed-tree-frog','Red-Eyed Tree Frog','Small (2-3 in)','5-10 years','72-82°F','60-80%','18x18x24 tall','Intermediate','Insects','Nocturnal, Iconic','Amphibian'],
  ['red-footed-tortoise','Red-Footed Tortoise','Medium (10-14 in)','30-50+ years','75-90°F','70-80%','4x2 ft or outdoor pen','Beginner','Fruit, veg, protein','Friendly, Social','Turtle'],
  ['reticulated-python','Reticulated Python','Very Large (10-20+ ft)','15-25 years','78-92°F','60-70%','8x4x4 ft minimum','Expert','Large prey items','Intelligent, Can be unpredictable','Snake'],
  ['ring-neck-snake','Ring-Neck Snake','Small (10-15 in)','6-10 years','65-75°F','50-60%','10+ gal','Intermediate','Slugs, worms, salamanders','Secretive, Small','Snake'],
  ['rosy-boa','Rosy Boa','Small-Medium (2-4 ft)','25-30+ years','72-90°F','30-40%','20+ gal','Beginner','Mice','Docile, Slow-moving','Snake'],
  ['russian-tortoise','Russian Tortoise','Small (6-8 in)','40-50+ years','70-95°F (gradient)','40-50%','4x2 ft or outdoor pen','Beginner','Leafy greens, weeds','Active, Hardy','Turtle'],
  ['savannah-monitor','Savannah Monitor','Large (3-5 ft)','10-15 years','80-130°F (gradient)','40-60%','8x4x4 ft','Advanced','Insects, whole prey','Can be tamed, Needs space','Lizard'],
  ['schneiders-skink','Schneider\'s Skink','Medium (12-16 in)','15-20 years','80-100°F (gradient)','40-50%','40+ gal','Intermediate','Insects, some fruit','Active, Inquisitive','Lizard'],
  ['softshell-turtle','Softshell Turtle','Large (6-24 in)','25-50 years','75-82°F','Aquatic','75+ gal aquatic','Intermediate','Fish, insects, pellets','Fast, Can be nippy','Turtle'],
  ['sulcata-tortoise','Sulcata Tortoise','Very Large (24-30 in, 100+ lbs)','70-100+ years','75-100°F (gradient)','40-55%','Large outdoor enclosure','Intermediate','Grasses, hay, weeds','Hardy, Active grazer','Turtle'],
  ['tiger-salamander','Tiger Salamander','Medium (6-14 in)','10-16 years','60-72°F','70-80%','20+ gal terrestrial','Beginner','Earthworms, insects','Hardy, Personable','Amphibian'],
  ['tomato-frog','Tomato Frog','Medium (2-4 in)','6-8 years','65-80°F','70-80%','10+ gal terrestrial','Beginner','Insects','Sedentary, Colorful','Amphibian'],
  ['tree-frog','Green Tree Frog','Small (1.5-2.5 in)','6-10 years','72-80°F','50-70%','18x18x24 tall','Beginner','Insects','Vocal, Active at night','Amphibian'],
  ['veiled-chameleon','Veiled Chameleon','Medium-Large (12-24 in)','5-8 years','72-95°F (gradient)','50-70%','2x2x4 ft screen','Intermediate','Insects, some veg','Territorial, Impressive','Lizard'],
  ['vine-snake','Vine Snake','Medium-Long (3-6 ft)','8-12 years','75-85°F','60-70%','Tall arboreal enclosure','Advanced','Lizards, frogs','Arboreal, Delicate','Snake'],
  ['whites-tree-frog','White\'s Tree Frog','Medium (3-5 in)','16-20 years','75-85°F','50-70%','18x18x24 tall','Beginner','Insects','Docile, Handleable, Hardy','Amphibian'],
  ['wood-turtle','Wood Turtle','Medium (5-9 in)','40-60 years','65-80°F','60-70%','4x2 ft semi-aquatic','Intermediate','Omnivore: insects, veg, fruit','Intelligent, Active','Turtle'],
];

function makePage(b) {
  const [slug,name,size,lifespan,temp,humidity,enclosure,care,diet,temperament,subtype] = b;
  const isSnake = subtype === 'Snake';
  const isLizard = subtype === 'Lizard';
  const isTurtle = subtype === 'Turtle';
  const isAmph = subtype === 'Amphibian';
  const isAquatic = humidity === 'Aquatic' || humidity === 'Semi-aquatic';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-FK0N7BD82Q"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-FK0N7BD82Q');</script>
  <meta name="description" content="Complete ${name} care guide: habitat setup, ${isSnake ? 'feeding' : isTurtle ? 'diet' : 'husbandry'}, health issues, and expert tips. ${care}-level ${subtype.toLowerCase()}.">
  <link rel="canonical" href="https://petcarehelperai.com/breeds/reptiles/${slug}">
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${name}: Complete Care Guide 2024 - Pet Care Helper AI" />
  <meta property="og:description" content="Complete ${name} care guide: habitat, diet, health, and handling tips." />
  <meta property="og:url" content="https://petcarehelperai.com/breeds/reptiles/${slug}" />
  <meta property="og:site_name" content="Pet Care Helper AI" />
  <title>${name}: Complete Care Guide 2024 - Pet Care Helper AI</title>
  <link rel="stylesheet" href="../../styles.css">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Article","headline":"${name}: Complete Care Guide 2024","datePublished":"2026-02-19","dateModified":"2026-02-19","description":"Complete ${name} care guide covering habitat, diet, health, and handling.","author":{"@type":"Organization","name":"Pet Care Helper AI"},"publisher":{"@type":"Organization","name":"Pet Care Helper AI"}}
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
        <li><a href="/reptiles" class="nav-link active">Reptiles</a></li>
        <li><a href="/fish" class="nav-link">Fish</a></li>
        <li><a href="/guides" class="nav-link">Guides</a></li>
      </ul>
    </nav>
  </header>
  <main>
    <div class="breadcrumb">
      <a href="/">Home</a> <span>&rsaquo;</span>
      <a href="/reptiles">Reptiles</a> <span>&rsaquo;</span>
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
          <tr><td>Temperature</td><td>${temp}</td></tr>
          <tr><td>${isAquatic ? 'Water Type' : 'Humidity'}</td><td>${humidity}</td></tr>
          <tr><td>Enclosure</td><td>${enclosure}</td></tr>
          <tr><td>Care Level</td><td>${care}</td></tr>
          <tr><td>Diet</td><td>${diet}</td></tr>
          <tr><td>Temperament</td><td>${temperament}</td></tr>
        </table>
      </div>

      <div class="affiliate-callout">
        <h4>Recommended for ${name}s</h4>
        <p>
          <a href="https://zoomed.com" target="_blank" rel="sponsored noopener">ZooMed</a> - Heating &amp; lighting |
          <a href="https://www.exo-terra.com" target="_blank" rel="sponsored noopener">ExoTerra</a> - Enclosures &amp; decor |
          <a href="https://www.chewy.com" target="_blank" rel="sponsored noopener">Chewy</a> - ${isSnake ? 'Substrate &amp; supplies' : isTurtle ? 'Aquatic supplies' : isAmph ? 'Vivarium supplies' : 'Reptile essentials'}
        </p>
      </div>

      <h2>${name} Overview</h2>
      <p>The ${name} is a ${size.toLowerCase()} ${subtype.toLowerCase()} known for being ${temperament.toLowerCase()}. With a lifespan of ${lifespan}, this species is a ${lifespan.includes('50') || lifespan.includes('70') || lifespan.includes('100') ? 'very significant long-term commitment that may outlive its owner' : lifespan.includes('20') || lifespan.includes('25') || lifespan.includes('30') ? 'long-term companion requiring years of dedicated care' : 'rewarding pet for committed keepers'}. As a ${care.toLowerCase()}-level species, the ${name} is ${care === 'Beginner' ? 'an excellent choice for newcomers to reptile and amphibian keeping' : care === 'Intermediate' ? 'suited for keepers with some experience in herpetoculture' : 'best kept by experienced keepers with advanced husbandry knowledge'}.</p>

      <p>Their diet of ${diet.toLowerCase()} ${diet.includes('Mouse') || diet.includes('Rat') || diet.includes('prey') ? 'requires owners to be comfortable feeding whole prey items' : diet.includes('Insect') || diet.includes('insect') ? 'requires a supply of live or prepared insects' : 'is straightforward and readily available'}. Temperature requirements of ${temp} make ${isAmph ? 'a cool, controlled environment' : 'proper heating equipment'} essential for their wellbeing.</p>

      <h2>Enclosure Setup &amp; Requirements</h2>
      <h3>Enclosure Size</h3>
      <ul>
        <li><strong>Minimum:</strong> ${enclosure}</li>
        <li><strong>Type:</strong> ${isAquatic ? 'Aquatic or semi-aquatic setup with filtration' : isAmph && !isAquatic ? 'Terrarium with appropriate substrate and water features' : isSnake ? 'PVC enclosure, glass tank, or tub system with secure lid' : isTurtle && !isAquatic ? 'Indoor enclosure or outdoor pen (climate permitting)' : 'Glass or PVC terrarium with proper ventilation'}.</li>
        <li><strong>Security:</strong> ${isSnake ? 'Escape-proof with secure locks - snakes are notorious escape artists' : 'Secure lid to prevent escapes'}.</li>
      </ul>
      <h3>Environmental Requirements</h3>
      <ul>
        <li><strong>Temperature:</strong> ${temp} - use a quality thermostat with every heat source.</li>
        <li><strong>${isAquatic ? 'Water Quality' : 'Humidity'}:</strong> ${isAquatic ? 'Clean, dechlorinated water with appropriate filtration' : humidity + ' - monitor with a digital hygrometer'}.</li>
        <li><strong>Lighting:</strong> ${isLizard || isTurtle ? 'UVB lighting is essential for calcium metabolism and overall health' : isAmph ? 'Low-level lighting; many species are sensitive to bright light' : 'Natural day/night cycle; UVB optional for most snakes'}.</li>
        <li><strong>Substrate:</strong> ${isAquatic ? 'Smooth gravel or bare-bottom for easy cleaning' : isSnake ? 'Coconut fiber, cypress mulch, or paper towels' : isAmph ? 'Coconut fiber, sphagnum moss, or ABG mix' : isTurtle ? 'Soil/coco fiber mix for terrestrial species' : 'Species-appropriate substrate that holds humidity'}.</li>
        <li><strong>Hides &amp; Decor:</strong> ${isSnake ? 'Warm-side and cool-side hides plus water dish' : isAmph ? 'Plants, cork bark, and water features' : isTurtle ? 'Basking area, shade, and soaking dish' : 'Multiple hides, climbing surfaces, and enrichment items'}.</li>
      </ul>

      <div class="affiliate-callout">
        <h4>${name} Habitat Essentials</h4>
        <p>
          <a href="https://zoomed.com" target="_blank" rel="sponsored noopener">ZooMed</a> - ${isLizard || isTurtle ? 'UVB bulbs &amp; fixtures' : isSnake ? 'Heat mats &amp; thermostats' : 'Habitat supplies'} |
          <a href="https://www.exo-terra.com" target="_blank" rel="sponsored noopener">ExoTerra</a> - ${isAmph ? 'Vivariums &amp; misting systems' : 'Terrariums &amp; hides'} |
          <a href="https://www.chewy.com" target="_blank" rel="sponsored noopener">Chewy</a> - Substrate &amp; accessories
        </p>
      </div>

      <h2>Diet &amp; Feeding</h2>
      <ul>
        <li><strong>Primary Diet:</strong> ${diet}.</li>
        <li><strong>Feeding Schedule:</strong> ${isSnake ? 'Every 5-14 days depending on age and size' : isAmph ? 'Every 1-3 days depending on species size and metabolism' : isTurtle ? 'Daily for juveniles, every other day for adults' : 'Daily insects for juveniles, every other day for adults'}.</li>
        <li><strong>Supplements:</strong> ${isSnake ? 'Not typically needed with whole prey' : 'Calcium with D3 and multivitamin dusting on feeder items'}.</li>
        <li><strong>Water:</strong> ${isAquatic ? 'Clean, filtered water is the habitat itself - maintain with regular water changes' : 'Fresh water available at all times in an appropriately sized dish'}.</li>
      </ul>

      <h2>Common Health Issues</h2>
      <ul>
        <li><strong>${isSnake ? 'Respiratory Infections' : isAmph ? 'Skin Infections' : isTurtle ? 'Shell Rot' : 'Metabolic Bone Disease'}:</strong> ${isSnake ? 'From incorrect temperatures or humidity. Signs: wheezing, bubbles, gaping' : isAmph ? 'Bacterial or fungal infections from poor water quality' : isTurtle ? 'From dirty conditions or shell damage' : 'From inadequate UVB and calcium. Signs: soft jaw, tremors'}.</li>
        <li><strong>Parasites:</strong> Both internal and external parasites can affect ${name}s. Annual fecal exams recommended.</li>
        <li><strong>${isSnake ? 'Stuck Shed' : isAmph ? 'Chytrid Fungus' : isTurtle ? 'Vitamin A Deficiency' : 'Impaction'}:</strong> ${isSnake ? 'From low humidity. Soak in lukewarm water and increase humidity' : isAmph ? 'A serious fungal disease; maintain clean conditions and quarantine new animals' : isTurtle ? 'Swollen eyes, respiratory issues; ensure varied diet with vitamin A sources' : 'From ingesting substrate. Use appropriate substrate and proper temperatures'}.</li>
        <li><strong>Stress:</strong> ${name}s can become stressed from improper husbandry, handling, or enclosure placement. Ensure proper setup and gentle interaction.</li>
      </ul>

      <div class="warning-box">
        <h4>Veterinary Care</h4>
        <p>Find a reptile/exotic vet before you need one. Many health issues in ${subtype.toLowerCase()}s are caused by husbandry problems. Regular checkups and fecal testing help prevent serious issues with your ${name}.</p>
      </div>

      <h2>Handling &amp; Temperament</h2>
      <ul>
        <li><strong>Temperament:</strong> ${temperament}.</li>
        <li><strong>Handling:</strong> ${isAmph ? 'Minimize handling - amphibians have permeable skin and can absorb oils and chemicals from your hands. Wet hands or gloves recommended' : isSnake ? 'Support the body and let them feel secure. Avoid handling 48 hours after feeding' : isTurtle ? 'Most tolerate gentle handling but prefer to be observed. Support the shell fully' : 'Handle gently and regularly to maintain tameness. Support the body fully'}.</li>
        <li><strong>Acclimation:</strong> Allow ${care === 'Beginner' ? '1-2 weeks' : '2-4 weeks'} to settle in before handling.</li>
      </ul>

      <h2>Is This ${subtype} Right for You?</h2>
      <h3>${name}s Are Great For:</h3>
      <ul>
        <li>${care === 'Beginner' ? 'First-time reptile/amphibian keepers' : 'Experienced herp keepers'}</li>
        <li>${lifespan.includes('50') || lifespan.includes('100') ? 'Those prepared for a decades-long commitment' : 'Keepers committed to proper long-term care'}</li>
        <li>Those who can provide proper ${isAquatic ? 'aquatic habitat and filtration' : 'temperature and humidity control'}</li>
        <li>${diet.includes('Mouse') || diet.includes('Rat') || diet.includes('prey') ? 'Owners comfortable feeding whole prey items' : 'People who can provide live or prepared food consistently'}</li>
      </ul>
      <h3>${name}s May Not Be Ideal For:</h3>
      <ul>
        <li>${care === 'Advanced' || care === 'Expert' ? 'Beginners without reptile-keeping experience' : 'Those unable to maintain proper environmental conditions'}</li>
        <li>${size.includes('Very Large') || size.includes('Large') ? 'Those without adequate space for a large enclosure' : 'People wanting a completely hands-off pet'}</li>
        <li>${isAmph ? 'Those wanting a pet to handle frequently' : 'Those uncomfortable with their dietary needs'}</li>
      </ul>

      <section class="info-card">
        <h3>Ask Our AI About ${name}s</h3>
        <p>Have specific questions about ${name} care, health, or setup? Our AI assistant can provide personalized guidance.</p>
        <div class="hero-actions"><a href="/chat" class="primary-btn">Ask the AI Now</a></div>
      </section>
    </article>
    <section class="transparency">
      <h3>Disclaimer</h3>
      <p>This care guide provides general information about ${name}s. Individual animals may have different needs. Always consult with a reptile/exotic veterinarian for specific concerns. This page contains affiliate links.</p>
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
console.log(`\nDone! Created ${created} reptile/amphibian species pages.`);
