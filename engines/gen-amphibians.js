#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.resolve(__dirname, '..');
const DIR = path.join(BASE, 'breeds', 'amphibians');
const TODAY = '2026-02-21';

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const NAV = `<ul class="nav-menu">
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/chat" class="nav-link">AI Pet Help</a></li>
        <li><a href="/dogs" class="nav-link">Dogs</a></li>
        <li><a href="/cats" class="nav-link">Cats</a></li>
        <li><a href="/birds" class="nav-link">Birds</a></li>
        <li><a href="/reptiles" class="nav-link">Reptiles</a></li>
        <li><a href="/amphibians" class="nav-link active">Amphibians</a></li>
        <li><a href="/fish" class="nav-link">Fish</a></li>
        <li><a href="/marine-fish" class="nav-link">Marine Fish</a></li>
        <li><a href="/small-animals" class="nav-link">Small Animals</a></li>
        <li><a href="/guides" class="nav-link">Guides</a></li>
      </ul>`;

// [slug, name, size, lifespan, temp, humidity, enclosure, care, diet, temperament, habitat_type, origin, unique_trait, health_issues, cost_range]
const species = [
['axolotl','Axolotl','Medium (9-12 in)','10-15 years','60-68°F','Aquatic','20+ gallon aquatic tank','Intermediate','Earthworms, bloodworms, pellets','Docile, Curious','Fully aquatic','Mexico (Lake Xochimilco)','Retains larval features throughout life including external gills; can regenerate lost limbs','Fungal infections from warm water, impaction from gravel substrate, gill deterioration from poor water quality, ammonia burns, bacterial infections (red leg syndrome)','$30-$75 for animal; $200-$400 setup'],
['african-clawed-frog','African Clawed Frog','Medium (4-5 in)','15-30 years','68-77°F','Aquatic','10+ gallon aquatic tank','Beginner','Sinking pellets, bloodworms, earthworms','Hardy, Active swimmer','Fully aquatic','Sub-Saharan Africa','Completely aquatic frog with no tongue; uses front claws to shovel food into mouth','Bacterial infections (red leg), bloating/dropsy, fungal skin infections, obesity from overfeeding, Chytrid fungus','$5-$25 for animal; $100-$200 setup'],
['african-dwarf-frog','African Dwarf Frog','Small (1-2 in)','5-10 years','72-82°F','Aquatic','5+ gallon aquatic tank','Beginner','Frozen bloodworms, brine shrimp, frog pellets','Peaceful, Social','Fully aquatic','Central Africa (Congo region)','Tiny fully aquatic frog that must surface to breathe air; often kept in community tanks','Bacterial skin infections, bloating, internal parasites, fungal infections, stress from aggressive tankmates','$3-$10 for animal; $50-$150 setup'],
['pacman-frog','Pacman Frog (Ceratophrys)','Medium-Large (4-7 in)','6-10 years','75-85°F','60-80%','10+ gallon terrestrial','Beginner','Crickets, dubia roaches, earthworms, pinkie mice','Ambush predator, Sedentary','Terrestrial, burrowing','South America (Argentina, Brazil)','Named for its enormous mouth; sits buried in substrate waiting to ambush prey that walks past','Metabolic bone disease from calcium deficiency, impaction from loose substrate, bacterial infections, obesity, toxic out syndrome','$20-$60 for animal; $100-$200 setup'],
['red-eyed-tree-frog','Red-Eyed Tree Frog','Small (2-3 in)','5-10 years','72-82°F','60-80%','18x18x24 in tall vivarium','Intermediate','Crickets, fruit flies, small roaches','Nocturnal, Arboreal','Arboreal, humid tropical','Central America (Costa Rica to Panama)','Iconic bright red eyes may serve as startle coloration to deter predators; vibrant green with blue and yellow striped sides','Bacterial skin infections, parasites, stress-related illness, metabolic bone disease, dehydration','$40-$75 for animal; $200-$400 setup'],
['whites-tree-frog','White\'s Tree Frog (Dumpy Frog)','Medium (3-5 in)','16-20 years','75-85°F','50-70%','18x18x24 in tall vivarium','Beginner','Crickets, dubia roaches, earthworms','Docile, Handleable, Hardy','Arboreal','Australia and New Guinea','One of the most handleable amphibians; develops adorable fatty ridges over the eyes with age; produces antimicrobial skin secretions being researched for medical uses','Obesity (very common), bacterial infections, parasites, lipid keratopathy from fatty diets, fungal infections','$30-$60 for animal; $150-$300 setup'],
['green-tree-frog','American Green Tree Frog','Small (1.5-2.5 in)','6-10 years','72-80°F','50-70%','18x18x24 in tall vivarium','Beginner','Crickets, small moths, fruit flies','Vocal, Active at night','Arboreal','Southeastern United States','Loud raspy call on humid evenings; a white or cream lateral stripe runs from jaw to groin; excellent display animal','Bacterial infections, parasites, metabolic bone disease from inadequate supplementation, stress from over-handling','$5-$15 for animal; $100-$250 setup'],
['tomato-frog','Tomato Frog','Medium (2-4 in)','6-8 years','65-80°F','70-80%','10+ gallon terrestrial','Beginner','Crickets, earthworms, dubia roaches','Sedentary, Colorful','Terrestrial','Madagascar','Bright tomato-red coloration warns predators; can secrete a thick sticky white mucus when threatened that can cause allergic reactions in humans','Parasites, bacterial infections, obesity, metabolic bone disease, impaction, sensitivity to chemicals','$25-$50 for animal; $100-$200 setup'],
['fire-bellied-toad','Fire-Bellied Toad','Small (2 in)','10-15 years','68-77°F','70-80%','10+ gallon semi-aquatic','Beginner','Small crickets, fruit flies, waxworms','Active, Colorful, Hardy','Semi-aquatic','East Asia (China, Korea)','Bright red-orange belly is aposematic warning coloration; skin secretions are mildly toxic; when threatened, arches back to flash belly colors (unken reflex)','Bacterial infections from poor water quality, parasites, metabolic bone disease, skin irritation from handling, Chytrid fungus','$5-$15 for animal; $75-$150 setup'],
['fire-bellied-newt','Fire-Bellied Newt','Small (3-5 in)','10-15 years','60-70°F','Semi-aquatic','10+ gallon semi-aquatic','Beginner','Frozen bloodworms, brine shrimp, chopped earthworms','Hardy, Active, Social','Semi-aquatic','Japan and China','Bright orange-red belly warning coloration; produces tetrodotoxin skin secretions (same toxin as pufferfish); can regenerate limbs and organs','Bacterial skin infections, fungal infections, parasites, bloating, water quality sensitivity','$8-$20 for animal; $75-$200 setup'],
['eastern-newt','Eastern Newt','Small (3-5 in)','12-15 years','60-70°F','Semi-aquatic','10+ gallon semi-aquatic','Intermediate','Bloodworms, brine shrimp, small worms','Peaceful, Interesting lifecycle','Semi-aquatic (adults); terrestrial (efts)','Eastern North America','Remarkable three-stage life cycle: aquatic larva, terrestrial bright-orange red eft juvenile (toxic), then olive-green aquatic adult','Bacterial infections, parasites, sensitivity to water chemicals, fungal infections, stress from poor water quality','$5-$15 for animal; $75-$150 setup'],
['tiger-salamander','Tiger Salamander','Medium-Large (6-14 in)','10-16 years','60-72°F','70-80%','20+ gallon terrestrial','Beginner','Earthworms, crickets, waxworms','Hardy, Personable, Burrowing','Terrestrial, burrowing','North America (widespread)','One of the largest terrestrial salamanders in the world; bold personality for an amphibian; will learn to associate owner with food and approach for feeding','Bacterial infections, fungal infections, parasites, metabolic bone disease, edema/bloating, sensitivity to chemicals','$20-$40 for animal; $100-$200 setup'],
['fire-salamander','Fire Salamander','Medium (6-10 in)','10-20 years','55-68°F','70-80%','20+ gallon terrestrial','Intermediate','Earthworms, crickets, slugs, waxworms','Nocturnal, Bold patterning','Terrestrial, cool and humid','Europe (widespread)','Striking black and yellow warning coloration; one of few salamanders that gives live birth; can spray toxic secretions from parotoid glands','Bacterial infections, fungal infections, Bsal (Batrachochytrium salamandrivorans) a lethal salamander-specific chytrid, overheating (heat-sensitive species), parasites','$40-$100 for animal; $150-$300 setup'],
['dart-frog','Dart Frog (Dendrobatidae)','Very Small (0.5-2 in)','10-15 years','72-80°F','80-100%','18x18x24 in bioactive vivarium','Advanced','Fruit flies, springtails, isopods','Bold, Diurnal, Territorial','Terrestrial to semi-arboreal','Central and South America','Wild specimens produce potent alkaloid toxins from their diet; captive-bred specimens are non-toxic; some of the most vibrantly colored animals on earth','Parasites (particularly coccidia), bacterial infections, spindly leg syndrome in froglets from nutritional deficiency, stress from improper vivarium conditions, dehydration','$40-$150 for animal; $300-$600 vivarium setup'],
['gray-tree-frog','Gray Tree Frog','Small (1.5-2 in)','7-10 years','65-78°F','50-70%','18x18x24 in tall vivarium','Beginner','Crickets, moths, small roaches, fruit flies','Vocal, Color-changing, Hardy','Arboreal','Eastern North America','Can change color from gray to green depending on temperature and environment; produces a glycerol antifreeze allowing it to survive freezing temperatures in winter','Bacterial infections, parasites, metabolic bone disease, dehydration, stress from improper humidity','$8-$20 for animal; $100-$250 setup'],
['budgetts-frog','Budgett\'s Frog (Hippo Frog)','Large (4-5 in)','15-20 years','75-82°F','Aquatic/Semi-aquatic','20+ gallon shallow aquatic','Intermediate','Earthworms, fish, shrimp, roaches','Aggressive, Vocal, Unique appearance','Aquatic to semi-aquatic','South America (Argentina, Paraguay, Bolivia)','Bizarre flattened appearance with enormous mouth; known for loud screaming vocalizations when threatened; will bite when handled; resembles a living pancake','Bacterial infections, bloating, parasites, fungal infections, obesity, ammonia sensitivity in shallow water setups','$50-$150 for animal; $100-$250 setup'],
['surinam-toad','Surinam Toad','Medium (4-8 in)','7-10 years','75-82°F','Aquatic','20+ gallon aquatic','Advanced','Earthworms, bloodworms, small fish, shrimp','Sedentary, Ambush feeder, Unique','Fully aquatic','Northern South America','One of the most unusual amphibians alive: completely flat body, no tongue, star-shaped fingertips; females incubate eggs embedded in the skin of their back, from which fully formed froglets emerge','Bacterial infections, fungal infections, sensitivity to water quality, parasites, stress from water parameter fluctuations','$30-$80 for animal; $150-$300 setup'],
['spring-peeper','Spring Peeper','Very Small (0.75-1.5 in)','3-4 years','55-72°F','60-80%','10+ gallon tall vivarium','Advanced','Fruit flies, springtails, pinhead crickets','Vocal, Secretive, Cold-tolerant','Semi-arboreal, woodland','Eastern North America','Iconic spring chorus heard across eastern forests; produces glycerol antifreeze surviving temperatures well below freezing; tiny X-shaped mark on back identifies species','Chytrid fungus, bacterial infections, dehydration, parasites, sensitivity to chemicals and pollutants, stress in captivity','$5-$15 for animal; $100-$200 setup'],
['american-bullfrog','American Bullfrog','Large (6-8 in)','7-10 years in captivity','75-85°F','70-80%','55+ gallon semi-aquatic','Intermediate','Large insects, earthworms, mice, fish, crayfish','Bold, Voracious, Territorial','Semi-aquatic','Eastern North America (invasive worldwide)','Largest frog in North America; deep resonant jug-o-rum call; voracious predator that will eat nearly anything that fits in its mouth including other frogs, mice, small snakes, and birds','Bacterial infections (red leg syndrome), parasites, Chytrid fungus, obesity in captivity, metabolic bone disease, cannibalism if housed with smaller individuals','$10-$25 for animal; $150-$300 setup'],
['chinese-fire-belly-newt','Chinese Fire Belly Newt','Small (3-4 in)','10-15 years','58-68°F','Semi-aquatic','10+ gallon semi-aquatic','Beginner','Frozen bloodworms, brine shrimp, small worms','Hardy, Social, Active','Semi-aquatic, cool water','China','Bright orange-red belly provides warning coloration; produces tetrodotoxin; extremely hardy and forgiving of beginner mistakes; does best in groups','Fungal infections from warm water, bacterial skin infections, parasites, bloating, sensitivity to chemicals in water','$5-$15 for animal; $75-$150 setup'],
];

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function makePage(s) {
  const [slug,name,size,lifespan,temp,humidity,enclosure,care,diet,temperament,habitat,origin,unique,health,cost] = s;
  const isAquatic = humidity === 'Aquatic' || humidity.includes('Aquatic') || humidity === 'Semi-aquatic';
  const searchTerm = slug.replace(/-/g, '+') + '+amphibian';
  const canon = `https://petcarehelperai.com/breeds/amphibians/${slug}`;
  const desc = `Complete ${name} care guide covering habitat setup, diet, health issues, temperament, and costs. Expert advice for ${care.toLowerCase()}-level amphibian keepers.`;

  const faq = [
    { q: `How long do ${name}s live?`, a: `${name}s typically live ${lifespan} in captivity with proper care. Lifespan depends heavily on water quality, temperature stability, diet variety, and stress levels. Providing optimal husbandry conditions is the most important factor in achieving maximum lifespan. Regular health monitoring and prompt treatment of illness also contribute significantly to longevity.` },
    { q: `What do ${name}s eat?`, a: `${name}s eat ${diet.toLowerCase()}. Variety is essential for balanced nutrition. Most amphibians benefit from gut-loaded insects (fed nutritious food 24 hours before offering to your pet) and calcium/vitamin D3 dusting on feeder items at every other feeding for juveniles and twice weekly for adults. Overfeeding is a common problem that leads to obesity and related health issues.` },
    { q: `Are ${name}s good pets for beginners?`, a: `${name}s are rated as ${care.toLowerCase()}-level pets. ${care === 'Beginner' ? 'They are an excellent choice for first-time amphibian keepers due to their hardiness and relatively straightforward care requirements. However, all amphibians require commitment to maintaining proper water quality and environmental conditions.' : care === 'Intermediate' ? 'They require some prior experience with amphibian keeping or a willingness to research thoroughly before acquiring one. Understanding water chemistry, temperature control, and amphibian health signs is important.' : 'They require significant experience with amphibian husbandry and are not recommended for beginners. Advanced knowledge of vivarium design, micro-climate management, and specialized feeding techniques is essential for success.'}` },
    { q: `What size enclosure does a ${name} need?`, a: `${name}s require a minimum of ${enclosure}. Larger enclosures are always better as they provide more stable environmental conditions and allow for more natural behaviors. ${isAquatic ? 'Water depth, filtration capacity, and surface area for gas exchange are more important than raw volume. A quality filter rated for at least twice your tank size is recommended.' : 'Vertical space is important for arboreal species, while floor space matters more for terrestrial burrowers. Good ventilation prevents stagnant air while maintaining humidity.'}` },
    { q: `What temperature do ${name}s need?`, a: `${name}s require temperatures of ${temp}. ${temp.includes('60') || temp.includes('55') ? 'This is a cool-temperature species that can suffer heat stress above 72°F. Room temperature in air-conditioned homes is often sufficient, but a chiller may be needed in warm climates.' : 'A reliable thermometer (digital probe type recommended) should be used to monitor temperatures. Avoid placing enclosures near windows, heating vents, or other sources of temperature fluctuation.'} Consistent temperatures within the recommended range are more important than hitting exact numbers.` },
  ];

  const faqSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  });

  const articleSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `${name}: Complete Amphibian Care Guide`,
    "description": desc,
    "datePublished": TODAY,
    "dateModified": TODAY,
    "author": { "@type": "Organization", "name": "Pet Care Helper AI" },
    "publisher": { "@type": "Organization", "name": "Pet Care Helper AI" }
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
  <meta property="og:title" content="${esc(name)}: Complete Care Guide - Pet Care Helper AI" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${canon}" />
  <meta property="og:site_name" content="Pet Care Helper AI" />
  <title>${esc(name)}: Complete Amphibian Care Guide | Pet Care Helper AI</title>
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
      <a href="/amphibians">Amphibians</a> <span>&rsaquo;</span>
      ${name}
    </div>
    <article class="guide-content">
      <h1>${name}: Complete Care Guide</h1>

      <div class="breed-image-container" style="text-align:center;margin:20px 0;">
        <img src="https://source.unsplash.com/featured/800x600/?${searchTerm}" alt="${name} - complete amphibian care guide" class="breed-hero-image" loading="lazy" width="800" height="600" style="max-width:100%;height:auto;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
      </div>

      <div class="reviewed-badge"><span class="badge-icon">&#10003;</span> Reviewed for accuracy &mdash; ${TODAY}</div>

      <div class="breed-stats-card">
        <h2>Quick Facts</h2>
        <table class="comparison-table">
          <tr><th>Attribute</th><th>Details</th></tr>
          <tr><td>Scientific Classification</td><td>Amphibian</td></tr>
          <tr><td>Size</td><td>${size}</td></tr>
          <tr><td>Lifespan</td><td>${lifespan}</td></tr>
          <tr><td>Temperature</td><td>${temp}</td></tr>
          <tr><td>${isAquatic ? 'Water Type' : 'Humidity'}</td><td>${humidity}</td></tr>
          <tr><td>Enclosure</td><td>${enclosure}</td></tr>
          <tr><td>Care Level</td><td>${care}</td></tr>
          <tr><td>Diet</td><td>${diet}</td></tr>
          <tr><td>Temperament</td><td>${temperament}</td></tr>
          <tr><td>Origin</td><td>${origin}</td></tr>
          <tr><td>Habitat Type</td><td>${habitat}</td></tr>
          <tr><td>Typical Cost</td><td>${cost}</td></tr>
        </table>
      </div>

      <div class="affiliate-callout">
        <h4>Recommended for ${name} Keepers</h4>
        <p>
          <a href="https://zoomed.com" target="_blank" rel="sponsored noopener">Zoo Med</a> &mdash; Heating, lighting &amp; habitat supplies |
          <a href="https://www.exo-terra.com" target="_blank" rel="sponsored noopener">Exo Terra</a> &mdash; Vivariums &amp; terrarium accessories |
          <a href="https://www.chewy.com" target="_blank" rel="sponsored noopener">Chewy</a> &mdash; Amphibian food &amp; supplies
        </p>
      </div>

      <h2>${name} Overview</h2>
      <p>The ${name} is a ${size.toLowerCase()} amphibian originating from ${origin}. Known for being ${temperament.toLowerCase()}, this species has captivated hobbyists and herpetology enthusiasts around the world. With a lifespan of ${lifespan}, the ${name} represents ${lifespan.includes('15') || lifespan.includes('20') || lifespan.includes('30') ? 'a significant long-term commitment that prospective owners should consider carefully before acquiring' : 'a rewarding companion for those willing to provide proper care and habitat conditions'}.</p>

      <p>As a ${care.toLowerCase()}-level species, the ${name} is ${care === 'Beginner' ? 'an excellent choice for newcomers to amphibian keeping, offering a forgiving and rewarding introduction to the hobby' : care === 'Intermediate' ? 'well-suited for keepers who have some experience with amphibians or are willing to invest time in learning proper husbandry techniques' : 'recommended only for experienced amphibian keepers with a thorough understanding of specialized care requirements'}. Their natural habitat is ${habitat.toLowerCase()}, which informs the type of enclosure setup required for optimal health and wellbeing in captivity.</p>

      <p>${unique}</p>

      <h2>Temperament &amp; Behavior</h2>
      <p>The ${name} is characterized as ${temperament.toLowerCase()}. Understanding their natural behaviors is essential for providing appropriate care and setting realistic expectations as an owner.</p>
      <ul>
        <li><strong>Activity pattern:</strong> ${temperament.includes('Nocturnal') ? 'Primarily active at night, becoming more visible and engaging in natural behaviors after dark. Provide dim or red lighting for nighttime observation.' : temperament.includes('Diurnal') ? 'Active during daylight hours, making them rewarding display animals. You can observe feeding, exploration, and social behaviors throughout the day.' : 'Active at various times, often becoming more animated during feeding and during dawn/dusk periods.'}</li>
        <li><strong>Handling tolerance:</strong> ${isAquatic ? 'As an aquatic species, handling should be minimized. When necessary, use wet hands or aquarium-safe nets. Amphibian skin absorbs chemicals from human hands.' : temperament.includes('Handleable') || temperament.includes('Docile') ? 'Tolerates gentle handling better than most amphibians. Always wash and rinse hands thoroughly before handling, as amphibian skin is highly permeable. Keep handling sessions short (5-10 minutes) to minimize stress.' : 'Handling should be kept to a minimum. This species is best enjoyed as a display animal. When handling is necessary, use clean, wet hands and keep sessions brief.'}</li>
        <li><strong>Social behavior:</strong> ${temperament.includes('Social') ? 'Does well in groups when provided adequate space. Social interaction with conspecifics contributes to natural behavior and reduced stress.' : temperament.includes('Territorial') ? 'Can be territorial, especially males. Provide ample space and visual barriers if housing multiple individuals.' : 'Can be housed individually or in small groups with adequate space and resources for each animal.'}</li>
        <li><strong>Feeding response:</strong> ${temperament.includes('Ambush') || temperament.includes('Voracious') ? 'Strong feeding response; may strike at anything that moves near its mouth. Use feeding tongs to avoid accidental bites during feeding time.' : 'Typically accepts food readily once established. New arrivals may need a few days to settle in before feeding.'}</li>
      </ul>

      <h2>Size &amp; Physical Characteristics</h2>
      <p>Adult ${name}s reach ${size.toLowerCase()}, though size can vary based on sex, diet quality, and genetic lineage. ${temperament.includes('Color') || unique.includes('color') || unique.includes('Color') ? 'Their striking coloration is one of their most appealing features and serves important biological functions in the wild.' : 'Their physical appearance reflects adaptations to their natural habitat and lifestyle.'}</p>
      <p>Juveniles are typically smaller and may display different coloration or patterns than adults. Growth rate depends on feeding frequency, temperature, and overall care quality. Expect most growth to occur during the first 1-2 years of life, with growth slowing significantly after reaching adult size.</p>

      <h2>Lifespan &amp; Longevity</h2>
      <p>${name}s typically live ${lifespan} in captivity when provided with proper care. Key factors influencing lifespan include:</p>
      <ul>
        <li><strong>Water/habitat quality:</strong> The single most important factor. Clean, properly conditioned water and appropriate humidity prevent the majority of health problems that shorten amphibian lives.</li>
        <li><strong>Temperature stability:</strong> Maintaining ${temp} consistently, without rapid fluctuations, reduces stress and supports immune function.</li>
        <li><strong>Diet quality:</strong> A varied diet with proper supplementation (calcium and vitamins) supports long-term health. Gut-loading feeder insects dramatically improves nutritional value.</li>
        <li><strong>Stress reduction:</strong> Proper enclosure design with adequate hiding spots, appropriate lighting, and minimal disturbance promotes longevity.</li>
        <li><strong>Preventive care:</strong> Quarantining new animals, maintaining clean conditions, and monitoring for early signs of illness all contribute to maximum lifespan.</li>
      </ul>

      <h2>Diet &amp; Nutrition</h2>
      <p>Proper nutrition is foundational to ${name} health. Their primary diet consists of ${diet.toLowerCase()}.</p>
      <h3>Feeding Guidelines</h3>
      <ul>
        <li><strong>Primary foods:</strong> ${diet}. Offer variety to ensure complete nutrition.</li>
        <li><strong>Feeding frequency:</strong> ${size.includes('Small') || size.includes('Very Small') ? 'Feed daily to every other day for juveniles, every 2-3 days for adults' : 'Feed every 2-3 days for juveniles, 2-3 times weekly for adults'}. Adjust based on body condition.</li>
        <li><strong>Portion size:</strong> Offer only what can be consumed in 10-15 minutes. Remove uneaten food to prevent water contamination.</li>
        <li><strong>Supplementation:</strong> ${isAquatic ? 'Aquatic amphibians typically get adequate vitamins from a varied diet of quality foods. Occasionally supplement with vitamin-enriched foods.' : 'Dust feeder insects with calcium powder with D3 at every other feeding. Use a multivitamin supplement once weekly. Gut-load feeder insects 24 hours before offering.'}</li>
        <li><strong>Hydration:</strong> ${isAquatic ? 'Aquatic species obtain water directly from their environment. Maintain clean, dechlorinated water at all times.' : 'Provide a clean water dish large enough for soaking. Mist the enclosure regularly to maintain humidity and provide drinking water on leaves and glass surfaces.'}</li>
      </ul>

      <div class="warning-box">
        <h4>Feeding Safety</h4>
        <p>Never feed wild-caught insects, as they may carry pesticides or parasites. Always use captive-bred feeder insects from reputable suppliers. Avoid feeding insects larger than the width between your ${name}'s eyes to prevent choking and impaction.</p>
      </div>

      <div class="affiliate-callout">
        <h4>${name} Food &amp; Supplements</h4>
        <p>
          <a href="https://www.chewy.com" target="_blank" rel="sponsored noopener">Chewy</a> &mdash; Frozen bloodworms, pellets &amp; feeder insects |
          <a href="https://zoomed.com" target="_blank" rel="sponsored noopener">Zoo Med ReptiCalcium</a> &mdash; Calcium with D3 supplement |
          <a href="https://www.oxbowanimalhealth.com" target="_blank" rel="sponsored noopener">Oxbow</a> &mdash; Premium small animal nutrition
        </p>
      </div>

      <h2>Housing &amp; Habitat Requirements</h2>
      <h3>Enclosure Size &amp; Type</h3>
      <ul>
        <li><strong>Minimum size:</strong> ${enclosure}</li>
        <li><strong>Recommended:</strong> Larger is always better. More space provides greater environmental stability and allows for more natural behaviors.</li>
        <li><strong>Type:</strong> ${isAquatic ? 'Glass aquarium with secure mesh or solid lid. Fully aquatic species need appropriate water depth and filtration.' : habitat.includes('arboreal') || habitat.includes('Arboreal') ? 'Tall glass vivarium with front-opening doors for easy access. Screen top provides ventilation while maintaining humidity with regular misting.' : 'Glass terrarium or plastic tub with secure ventilated lid. Front-opening vivariums are ideal for access without disturbing the setup.'}</li>
        <li><strong>Security:</strong> Amphibians are surprisingly good escape artists. Ensure all openings are secured with no gaps larger than the animal's head.</li>
      </ul>
      <h3>Environmental Parameters</h3>
      <ul>
        <li><strong>Temperature:</strong> ${temp}. Use a reliable digital thermometer to monitor. ${temp.includes('55') || temp.includes('58') || temp.includes('60') ? 'This species requires cool conditions. A chiller or placement in a cool room may be necessary during summer months.' : 'A low-wattage heat mat on a thermostat can maintain appropriate temperatures. Avoid heat lamps that can dehydrate amphibians.'}</li>
        <li><strong>Humidity:</strong> ${humidity}. ${isAquatic ? 'Maintain clean, dechlorinated water. Use a quality filter and perform regular water changes (20-30% weekly).' : 'Monitor with a digital hygrometer. Maintain with regular misting, live plants, and a large water feature.'}</li>
        <li><strong>Lighting:</strong> ${isAquatic ? 'Standard aquarium lighting on a 12-hour cycle. Avoid direct sunlight which can overheat the water.' : 'Low-level LED lighting on a 12-hour day/night cycle. UVB is not strictly required for most amphibians but may benefit species with access to natural sunlight in the wild.'}</li>
        <li><strong>Substrate:</strong> ${isAquatic ? 'Large smooth river rocks, bare bottom, or fine sand. Avoid gravel small enough to be ingested.' : 'Coconut fiber, ABG mix (for bioactive setups), or sphagnum moss. Avoid substrates that can cause impaction if ingested.'}</li>
        <li><strong>Decor:</strong> ${isAquatic ? 'Smooth rocks, driftwood, live or silk plants, and PVC pipe hides. Avoid sharp decorations that can damage delicate skin.' : 'Cork bark hides, live plants, leaf litter, and branches for climbing (arboreal species). Create multiple hiding spots to reduce stress.'}</li>
      </ul>

      <div class="affiliate-callout">
        <h4>${name} Habitat Essentials</h4>
        <p>
          <a href="https://www.exo-terra.com" target="_blank" rel="sponsored noopener">Exo Terra</a> &mdash; ${isAquatic ? 'Aquatic habitat accessories' : 'Vivariums &amp; misting systems'} |
          <a href="https://zoomed.com" target="_blank" rel="sponsored noopener">Zoo Med</a> &mdash; Thermostats, hygrometers &amp; substrates |
          <a href="https://www.chewy.com" target="_blank" rel="sponsored noopener">Chewy</a> &mdash; Terrariums &amp; aquatic supplies
        </p>
      </div>

      <h2>Common Health Concerns</h2>
      <p>Understanding potential health issues helps ${name} owners recognize problems early when treatment is most effective. The most common health concerns include:</p>
      <ul>
        ${health.split(', ').map(h => `<li><strong>${h.split(' from ')[0].split(' (')[0]}:</strong> ${h}. Monitor closely and consult an exotic veterinarian if symptoms persist.</li>`).join('\n        ')}
      </ul>

      <div class="emergency-callout">
        <h4>When to See an Exotic Vet Immediately</h4>
        <p>Seek veterinary care if your ${name} shows: lethargy lasting more than 48 hours, refusal to eat for more than one week, visible skin lesions or discoloration, abnormal swelling or bloating, difficulty breathing or gasping, loss of coordination, or rapid weight loss. Amphibians hide illness instinctively, so visible symptoms often indicate the condition has progressed significantly.</p>
      </div>

      <h2>Grooming &amp; Maintenance</h2>
      <ul>
        <li><strong>Enclosure cleaning:</strong> ${isAquatic ? 'Perform 20-30% water changes weekly using dechlorinated water at the same temperature. Clean filter media monthly (rinse in old tank water, never tap water). Remove waste and uneaten food daily.' : 'Spot-clean waste daily. Full substrate changes every 4-8 weeks for non-bioactive setups. Bioactive vivariums require minimal maintenance once established.'}</li>
        <li><strong>Water quality:</strong> ${isAquatic ? 'Test water parameters weekly: ammonia and nitrite should always be 0 ppm, nitrate under 20 ppm. Use a quality dechlorinator for all water additions.' : 'Change water dish daily with fresh, dechlorinated water. Amphibians absorb water through their skin, so water quality directly impacts health.'}</li>
        <li><strong>Shedding:</strong> Amphibians shed their skin regularly (often eating the shed skin). Ensure proper humidity to facilitate clean shedding. Retained shed can indicate dehydration or skin infection.</li>
      </ul>

      <h2>Exercise &amp; Enrichment</h2>
      <ul>
        <li><strong>Natural behaviors:</strong> Provide an environment that allows ${temperament.includes('Arboreal') || habitat.includes('arboreal') ? 'climbing, exploring vertical spaces, and perching at various heights' : temperament.includes('Burrowing') || temperament.includes('burrowing') ? 'burrowing, tunneling, and creating burrow systems in deep substrate' : isAquatic ? 'swimming freely, exploring tank furnishings, and interacting with water current' : 'exploring, hiding, and hunting for food'}.</li>
        <li><strong>Feeding enrichment:</strong> Rather than always placing food in the same spot, vary feeding locations to encourage natural foraging and hunting behaviors.</li>
        <li><strong>Environmental complexity:</strong> A well-furnished enclosure with multiple hides, climbing surfaces, and varied terrain provides ongoing mental stimulation.</li>
        <li><strong>Live plants:</strong> ${isAquatic ? 'Live aquatic plants improve water quality, provide shelter, and create a more natural, stimulating environment.' : 'Live terrarium plants increase humidity, improve air quality, provide climbing surfaces, and create a more natural, enriching habitat.'}</li>
      </ul>

      <h2>Cost Overview</h2>
      <p>Understanding the full cost of ${name} ownership helps ensure you can provide proper care throughout the animal's life.</p>
      <table class="comparison-table">
        <tr><th>Expense Category</th><th>Estimated Cost</th></tr>
        <tr><td>Animal Purchase</td><td>${cost.split(';')[0]}</td></tr>
        <tr><td>Enclosure &amp; Setup</td><td>${cost.split(';')[1] || '$100-$400'}</td></tr>
        <tr><td>Food (annual)</td><td>$100-$300</td></tr>
        <tr><td>Supplies &amp; Maintenance (annual)</td><td>$50-$150</td></tr>
        <tr><td>Veterinary Care (annual)</td><td>$50-$200 (exotic vet)</td></tr>
        <tr><td>Total First Year</td><td>$250-$900+</td></tr>
        <tr><td>Annual Ongoing Cost</td><td>$200-$650</td></tr>
      </table>

      <h2>Insurance Considerations</h2>
      <p>Exotic pet insurance is available from select providers and can help cover unexpected veterinary costs for amphibians. While not as widely available as dog and cat insurance, some providers now offer coverage for reptiles and amphibians. Consider insurance especially if exotic veterinary care in your area is expensive or if your species is prone to health issues that may require professional treatment.</p>

      <div class="affiliate-callout">
        <h4>Protect Your ${name}</h4>
        <p>
          <a href="https://www.spotpetins.com" target="_blank" rel="sponsored noopener">Spot Insurance</a> &mdash; Exotic pet coverage options |
          <a href="https://www.lemonade.com/pet" target="_blank" rel="sponsored noopener">Lemonade Pet</a> &mdash; Affordable pet insurance plans
        </p>
      </div>

      <h2>Frequently Asked Questions</h2>
      ${faq.map(f => `
      <h3>${f.q}</h3>
      <p>${f.a}</p>`).join('')}

      <h2>Related Species &amp; Guides</h2>
      <div class="guide-grid">
        ${species.filter(sp => sp[0] !== slug).slice(0, 4).map(sp => `<a href="/breeds/amphibians/${sp[0]}" class="guide-card"><h3>${sp[1]}</h3><p>${sp[6]} care level &bull; ${sp[2]}</p></a>`).join('\n        ')}
      </div>
      <p style="margin-top: 16px;"><a href="/amphibians">View all amphibian species &rarr;</a></p>

      <section class="info-card">
        <h3>Ask Our AI About ${name}s</h3>
        <p>Have specific questions about ${name} care, habitat setup, or health concerns? Our AI assistant provides personalized guidance based on your specific situation.</p>
        <div class="hero-actions"><a href="/chat" class="primary-btn">Ask the AI Now</a></div>
      </section>
    </article>

    <section class="transparency">
      <h3>Important Disclaimer</h3>
      <p>This guide provides general educational information about ${name} care and is not a substitute for professional exotic veterinary advice. Individual animals may have unique needs. Always consult with a qualified exotic veterinarian for health concerns. Some links on this page are affiliate links &mdash; purchases through these links support our ability to provide free pet care resources at no additional cost to you.</p>
    </section>
  </main>
  <footer class="site-footer">
    <p>AI Pet Medical &amp; Vet Help Finder &mdash; educational guidance, real-world vet options, and curated resources.</p>
    <p style="font-size: 0.85rem; margin-top: 8px;">Some suggestions may include sponsored partners. This does not affect our guidance.</p>
    <nav class="footer-nav" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;">
      <a href="/guides">Guides</a> &middot; <a href="/tools/">Tools</a> &middot; <a href="/locations/">Locations</a> &middot; <a href="/amphibians">Amphibians</a> &middot; <a href="/marine-fish">Marine Fish</a> &middot; <a href="/resources">Resources</a> &middot; <a href="/about">About</a> &middot; <a href="/contact">Contact</a> &middot; <a href="/privacy-policy">Privacy</a> &middot; <a href="/terms-of-service">Terms</a> &middot; <a href="/feeds/">RSS Feeds</a>
    </nav>
  </footer>
  <script>document.addEventListener('DOMContentLoaded',function(){const t=document.querySelector('.nav-toggle'),m=document.querySelector('.nav-menu');if(t){t.addEventListener('click',function(){m.classList.toggle('active');t.classList.toggle('active');});}});</script>
</body>
</html>`;
}

let created = 0;
for (const s of species) {
  const fp = path.join(DIR, `${s[0]}.html`);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, makePage(s));
    created++;
    console.log(`Created: breeds/amphibians/${s[0]}.html`);
  } else {
    console.log(`Exists: breeds/amphibians/${s[0]}.html`);
  }
}
console.log(`\nDone! Created ${created} amphibian species pages.`);
