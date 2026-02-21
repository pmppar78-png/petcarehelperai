import fs from 'fs';
import path from 'path';

const DIR = 'breeds/dogs';

const breeds = [
  ['akita','Akita','Large','70-130 lbs','24-28 in','10-14 years','Loyal, Courageous, Dignified','Good','Moderate','High','Moderate','Working'],
  ['alaskan-klee-kai','Alaskan Klee Kai','Small to Medium','10-25 lbs','13-17 in','12-16 years','Intelligent, Energetic, Loyal','Good','Moderate','High','Moderate','Northern'],
  ['alaskan-malamute','Alaskan Malamute','Large','75-100 lbs','23-25 in','10-14 years','Affectionate, Loyal, Playful','Good','High','Low','High','Working'],
  ['american-bulldog','American Bulldog','Large','60-120 lbs','20-28 in','10-16 years','Confident, Friendly, Assertive','Moderate','High','Moderate','Moderate','Working'],
  ['american-eskimo','American Eskimo Dog','Small to Medium','10-35 lbs','9-19 in','13-15 years','Playful, Alert, Clever','Excellent','Moderate','High','Moderate','Non-Sporting'],
  ['american-eskimo-dog','American Eskimo Dog','Small to Medium','10-35 lbs','9-19 in','13-15 years','Playful, Alert, Clever','Excellent','Moderate','High','Moderate','Non-Sporting'],
  ['basenji','Basenji','Small to Medium','22-24 lbs','16-17 in','13-14 years','Independent, Smart, Poised','Moderate','Moderate','High','Low','Hound'],
  ['bearded-collie','Bearded Collie','Medium','45-55 lbs','20-22 in','12-14 years','Lively, Smart, Active','Excellent','High','Moderate','High','Herding'],
  ['belgian-malinois','Belgian Malinois','Large','40-80 lbs','22-26 in','14-16 years','Confident, Smart, Hardworking','Good','Very High','Moderate','Moderate','Herding'],
  ['belgian-sheepdog','Belgian Sheepdog','Large','45-75 lbs','22-26 in','12-14 years','Bright, Watchful, Versatile','Good','High','Moderate','High','Herding'],
  ['belgian-tervuren','Belgian Tervuren','Large','45-75 lbs','22-26 in','12-14 years','Courageous, Alert, Devoted','Good','High','Moderate','High','Herding'],
  ['bloodhound','Bloodhound','Large','80-110 lbs','23-27 in','10-12 years','Friendly, Independent, Inquisitive','Good','Moderate','Moderate','Low','Hound'],
  ['border-terrier','Border Terrier','Small','11-16 lbs','12-15 in','12-15 years','Affectionate, Happy, Plucky','Excellent','Moderate','Moderate','Low','Terrier'],
  ['bordoodle','Bordoodle','Medium','30-60 lbs','15-22 in','12-15 years','Intelligent, Friendly, Active','Excellent','High','Moderate','Low to Moderate','Hybrid'],
  ['cavalier-king-charles','Cavalier King Charles Spaniel','Small','13-18 lbs','12-13 in','12-15 years','Affectionate, Gentle, Graceful','Excellent','Moderate','High','Moderate','Toy'],
  ['cesky-terrier','Cesky Terrier','Small','14-24 lbs','10-13 in','12-15 years','Adventurous, Clever, Family-Oriented','Good','Moderate','Low','Moderate','Terrier'],
  ['chesapeake-bay-retriever','Chesapeake Bay Retriever','Large','55-80 lbs','21-26 in','10-13 years','Affectionate, Bright, Sensitive','Good','High','Moderate','High','Sporting'],
  ['chi-poo','Chi-Poo','Small','5-20 lbs','5-15 in','12-15 years','Energetic, Playful, Loving','Good','Moderate','Low','Moderate','Hybrid'],
  ['chow-chow','Chow Chow','Medium to Large','45-70 lbs','17-20 in','8-12 years','Dignified, Bright, Serious','Moderate','Low to Moderate','High','High','Non-Sporting'],
  ['coton-de-tulear','Coton de Tulear','Small','8-15 lbs','9-11 in','15-19 years','Charming, Bright, Happy','Excellent','Moderate','Low','High','Non-Sporting'],
  ['croatian-sheepdog','Croatian Sheepdog','Medium','29-43 lbs','16-21 in','13-14 years','Agile, Alert, Intelligent','Good','High','Low','Moderate','Herding'],
  ['dandie-dinmont-terrier','Dandie Dinmont Terrier','Small','18-24 lbs','8-11 in','12-15 years','Independent, Smart, Proud','Good','Moderate','Moderate','Moderate','Terrier'],
  ['dogue-de-bordeaux','Dogue de Bordeaux','Large','99-110+ lbs','23-27 in','5-8 years','Loyal, Affectionate, Courageous','Good','Moderate','Moderate','Low','Working'],
  ['english-bulldog','English Bulldog','Medium','40-50 lbs','14-15 in','8-10 years','Calm, Courageous, Friendly','Excellent','Low','Low','Low','Non-Sporting'],
  ['english-cocker-spaniel','English Cocker Spaniel','Medium','26-34 lbs','15-17 in','12-14 years','Merry, Affectionate, Busy','Excellent','High','Moderate','High','Sporting'],
  ['english-setter','English Setter','Large','45-80 lbs','23-27 in','12 years','Gentle, Mellow, Merry','Excellent','High','Moderate','High','Sporting'],
  ['finnish-lapphund','Finnish Lapphund','Medium','33-53 lbs','16-21 in','12-15 years','Friendly, Alert, Agile','Excellent','Moderate','Moderate','High','Herding'],
  ['flat-coated-retriever','Flat-Coated Retriever','Large','60-70 lbs','22-24 in','8-10 years','Cheerful, Optimistic, Good-Humored','Excellent','High','Moderate','High','Sporting'],
  ['foxhound','American Foxhound','Large','60-70 lbs','21-25 in','11-13 years','Independent, Easy-Going, Sweet','Good','High','Low','Low','Hound'],
  ['fox-terrier-smooth','Smooth Fox Terrier','Small to Medium','15-19 lbs','15 in','12-15 years','Friendly, Bold, Independent','Good','High','Moderate','Low','Terrier'],
  ['gordon-setter','Gordon Setter','Large','45-80 lbs','23-27 in','12-13 years','Affectionate, Confident, Bold','Good','High','Moderate','High','Sporting'],
  ['greater-swiss-mountain-dog','Greater Swiss Mountain Dog','Large','85-140 lbs','23-28 in','8-11 years','Faithful, Dependable, Family-Oriented','Excellent','Moderate','Moderate','Moderate','Working'],
  ['hokkaido','Hokkaido','Medium','44-66 lbs','18-20 in','12-15 years','Brave, Devoted, Alert','Moderate','High','Moderate','Moderate','Working'],
  ['irish-doodle','Irish Doodle','Medium to Large','40-70 lbs','22-28 in','10-13 years','Friendly, Active, Intelligent','Excellent','High','Low','Moderate','Hybrid'],
  ['irish-red-and-white-setter','Irish Red and White Setter','Large','35-60 lbs','22-26 in','11-15 years','Courageous, Spirited, Friendly','Good','High','Moderate','High','Sporting'],
  ['irish-terrier','Irish Terrier','Medium','25-27 lbs','18 in','13-15 years','Bold, Dashing, Spirited','Good','High','Moderate','Moderate','Terrier'],
  ['irish-water-spaniel','Irish Water Spaniel','Large','45-68 lbs','21-24 in','12-13 years','Playful, Hardworking, Brave','Good','High','Low','Moderate','Sporting'],
  ['japanese-spitz','Japanese Spitz','Small to Medium','10-25 lbs','12-15 in','12-14 years','Loyal, Intelligent, Playful','Excellent','Moderate','Low','High','Non-Sporting'],
  ['jindo','Korean Jindo','Medium','30-50 lbs','18-22 in','12-15 years','Loyal, Bold, Alert','Moderate','High','Moderate','Moderate','Non-Sporting'],
  ['keeshond','Keeshond','Medium','35-45 lbs','17-18 in','12-15 years','Friendly, Outgoing, Lively','Excellent','Moderate','Moderate','High','Non-Sporting'],
  ['lhasa-apso','Lhasa Apso','Small','12-18 lbs','10-11 in','12-15 years','Confident, Smart, Comical','Good','Moderate','Moderate','High','Non-Sporting'],
  ['norwegian-elkhound','Norwegian Elkhound','Medium','48-55 lbs','19-21 in','12-15 years','Bold, Loyal, Playful','Good','High','Moderate','High','Hound'],
  ['olde-english-bulldogge','Olde English Bulldogge','Medium to Large','50-80 lbs','16-20 in','9-14 years','Friendly, Courageous, Alert','Good','Moderate','Moderate','Low','Working'],
  ['pit-bull','American Pit Bull Terrier','Medium to Large','30-65 lbs','17-21 in','12-16 years','Confident, Smart, Good-Natured','Good','High','Moderate','Low','Terrier'],
  ['plott-hound','Plott Hound','Medium to Large','40-60 lbs','20-25 in','12-14 years','Bold, Loyal, Alert','Good','High','Low','Low','Hound'],
  ['polish-tatra-sheepdog','Polish Tatra Sheepdog','Large','80-130 lbs','24-28 in','10-12 years','Calm, Intelligent, Protective','Good','Moderate','Moderate','High','Working'],
  ['portuguese-water-dog','Portuguese Water Dog','Medium','35-60 lbs','17-23 in','11-13 years','Affectionate, Adventurous, Athletic','Excellent','High','Low','High','Working'],
  ['presa-canario','Presa Canario','Large','84-110 lbs','22-26 in','9-11 years','Confident, Calm, Strong-Willed','Moderate','Moderate','Moderate','Low','Working'],
  ['pug','Pug','Small','14-18 lbs','10-13 in','13-15 years','Charming, Mischievous, Loving','Excellent','Low','Low','Low','Toy'],
  ['puli','Puli','Medium','25-35 lbs','16-17 in','10-15 years','Loyal, Agile, Obedient','Good','High','Low','High','Herding'],
  ['redbone-coonhound','Redbone Coonhound','Medium to Large','45-70 lbs','21-27 in','12-15 years','Even-Tempered, Amiable, Mellow','Good','High','Low','Low','Hound'],
  ['rhodesian-ridgeback','Rhodesian Ridgeback','Large','70-85 lbs','24-27 in','10-12 years','Dignified, Affectionate, Even-Tempered','Good','High','Low','Low','Hound'],
  ['saint-berdoodle','Saint Berdoodle','Large','70-150 lbs','24-30 in','8-12 years','Friendly, Gentle, Loyal','Excellent','Moderate','Low to Moderate','Moderate','Hybrid'],
  ['saint-bernard','Saint Bernard','Large','120-180 lbs','26-30 in','8-10 years','Playful, Charming, Inquisitive','Excellent','Moderate','Moderate','High','Working'],
  ['samoyed','Samoyed','Medium to Large','35-65 lbs','19-23 in','12-14 years','Adaptable, Friendly, Gentle','Excellent','High','High','Very High','Working'],
  ['shiba-inu','Shiba Inu','Small to Medium','17-23 lbs','13-17 in','13-16 years','Alert, Active, Attentive','Moderate','Moderate','High','Moderate','Non-Sporting'],
  ['shikoku','Shikoku','Medium','35-55 lbs','17-22 in','10-12 years','Brave, Enthusiastic, Alert','Moderate','High','Moderate','Moderate','Working'],
  ['shorkie','Shorkie','Small','5-12 lbs','6-11 in','12-15 years','Energetic, Loyal, Playful','Good','Moderate','Low','Moderate','Hybrid'],
  ['spanish-mastiff','Spanish Mastiff','Large','140-200 lbs','28-35 in','10-12 years','Affectionate, Determined, Noble','Good','Low','Moderate','High','Working'],
  ['spinone-italiano','Spinone Italiano','Large','61-85 lbs','22-27 in','10-12 years','Sociable, Docile, Patient','Excellent','Moderate','Low','Moderate','Sporting'],
  ['springer-spaniel','English Springer Spaniel','Medium','40-50 lbs','19-20 in','12-14 years','Friendly, Playful, Obedient','Excellent','High','Moderate','Moderate','Sporting'],
  ['swedish-vallhund','Swedish Vallhund','Small to Medium','20-35 lbs','11-14 in','12-15 years','Friendly, Energetic, Watchful','Good','High','Moderate','Moderate','Herding'],
  ['tibetan-spaniel','Tibetan Spaniel','Small','9-15 lbs','10 in','12-15 years','Assertive, Independent, Playful','Good','Moderate','Moderate','Moderate','Non-Sporting'],
  ['tibetan-terrier','Tibetan Terrier','Medium','18-30 lbs','14-17 in','15-16 years','Affectionate, Sensitive, Clever','Good','Moderate','Moderate','High','Non-Sporting'],
  ['toy-manchester-terrier','Toy Manchester Terrier','Small','Under 12 lbs','10-12 in','15-17 years','Spirited, Bright, Agile','Good','Moderate','Moderate','Low','Toy'],
  ['welsh-corgi','Welsh Corgi (Pembroke)','Small to Medium','Up to 30 lbs','10-12 in','12-13 years','Smart, Affectionate, Alert','Good','High','Moderate','Moderate','Herding'],
  ['west-highland-terrier','West Highland White Terrier','Small','15-20 lbs','10-11 in','13-15 years','Loyal, Happy, Entertaining','Good','Moderate','Moderate','Moderate','Terrier'],
  ['west-highland-white-terrier','West Highland White Terrier','Small','15-20 lbs','10-11 in','13-15 years','Loyal, Happy, Entertaining','Good','Moderate','Moderate','Moderate','Terrier'],
  ['wire-fox-terrier','Wire Fox Terrier','Small to Medium','15-19 lbs','15 in','12-15 years','Friendly, Bold, Independent','Good','High','Moderate','High','Terrier'],
];

const healthByGroup = {
  'Working': {cats: ['Hip Dysplasia','Elbow Dysplasia','Bloat (GDV)','Hypothyroidism'], specific: ['Joint problems from rapid growth','Heart conditions','Osteosarcoma']},
  'Herding': {cats: ['Hip Dysplasia','Progressive Retinal Atrophy','Epilepsy','Collie Eye Anomaly'], specific: ['MDR1 gene sensitivity','Degenerative Myelopathy']},
  'Hound': {cats: ['Ear Infections','Bloat','Hip Dysplasia','Eye Conditions'], specific: ['Scent-driven selective hearing','Obesity from food motivation']},
  'Sporting': {cats: ['Hip Dysplasia','Progressive Retinal Atrophy','Ear Infections','Cancer'], specific: ['Exercise-related injuries','Allergies']},
  'Terrier': {cats: ['Patellar Luxation','Legg-Calve-Perthes','Dental Issues','Eye Conditions'], specific: ['Skin allergies','Von Willebrand Disease']},
  'Toy': {cats: ['Patellar Luxation','Dental Disease','Collapsed Trachea','Heart Disease'], specific: ['Hypoglycemia','Luxating patella']},
  'Non-Sporting': {cats: ['Hip Dysplasia','Eye Conditions','Allergies','Hypothyroidism'], specific: ['Dental issues','Skin conditions']},
  'Northern': {cats: ['Patellar Luxation','Cardiac Issues','Liver Disease','Thyroid Issues'], specific: ['Autoimmune conditions','Eye defects']},
  'Hybrid': {cats: ['Hip Dysplasia','Eye Conditions','Allergies','Bloat'], specific: ['Varies by parent breeds','Genetic diversity generally beneficial']},
};

function titleCase(s) { return s.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '); }

function makePage(b) {
  const [slug,name,size,weight,height,lifespan,temperament,goodKids,exercise,shedding,grooming,group] = b;
  const h = healthByGroup[group] || healthByGroup['Non-Sporting'];
  const sizeClass = weight.includes('100') || weight.includes('120') || weight.includes('140') || weight.includes('180') || weight.includes('200') || size.includes('Large') ? 'large' : (size.includes('Small') ? 'small' : 'medium');
  const foodCost = sizeClass === 'large' ? '$600-$1,200' : sizeClass === 'small' ? '$300-$600' : '$400-$800';
  const vetCost = '$300-$600';
  const insCost = sizeClass === 'large' ? '$400-$800' : '$300-$600';
  const groomCost = grooming === 'Very High' || grooming === 'High' ? '$300-$600' : '$100-$300';
  const supplyCost = '$150-$300';
  const trainCost = '$200-$500';
  const totalLow = 300+300+300+100+150+200;
  const totalHigh = 1200+600+800+600+300+500;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google-adsense-account" content="ca-pub-6484141649562994">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6484141649562994" crossorigin="anonymous"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-FK0N7BD82Q"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-FK0N7BD82Q');</script>
  <meta name="description" content="Complete ${name} guide: temperament, health issues, lifespan, cost of ownership, training tips, and recommended products. Expert AI-powered advice.">
  <link rel="canonical" href="https://petcarehelperai.com/breeds/dogs/${slug}">
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${name}: Complete Breed Guide 2024 - Pet Care Helper AI" />
  <meta property="og:description" content="Complete ${name} guide: temperament, health issues, lifespan, cost of ownership, training tips, and recommended products." />
  <meta property="og:url" content="https://petcarehelperai.com/breeds/dogs/${slug}" />
  <meta property="og:site_name" content="Pet Care Helper AI" />
  <title>${name}: Complete Breed Guide 2024 - Pet Care Helper AI</title>
  <link rel="stylesheet" href="../../styles.css">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Article","headline":"${name}: Complete Breed Guide 2024","datePublished":"2026-02-19","dateModified":"2026-02-19","description":"Complete ${name} guide covering temperament, health, care, and costs.","author":{"@type":"Organization","name":"Pet Care Helper AI"},"publisher":{"@type":"Organization","name":"Pet Care Helper AI"}}
  </script>
</head>
<body>
  <header class="site-header">
    <div class="logo-title">
      <div class="logo-pill"></div>
      <div>
        <span class="site-name">Pet Care Helper AI</span>
        <p class="subtitle">Dogs &bull; Cats &bull; Birds &bull; Reptiles &bull; Fish</p>
      </div>
    </div>
    <nav class="main-nav">
      <button class="nav-toggle" aria-label="Toggle navigation"><span class="hamburger"></span></button>
      <ul class="nav-menu">
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/chat" class="nav-link">AI Pet Help</a></li>
        <li><a href="/dogs" class="nav-link active">Dogs</a></li>
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
      <a href="/dogs">Dogs</a> <span>&rsaquo;</span>
      <a href="/breeds/dog-breeds">Breeds</a> <span>&rsaquo;</span>
      ${name}
    </div>

    <article class="guide-content">
      <h1>${name}: Complete Breed Guide</h1>

      <div class="breed-stats-card">
        <h2>Quick Facts</h2>
        <table class="comparison-table">
          <tr><th>Attribute</th><th>Details</th></tr>
          <tr><td>Breed Group</td><td>${group}</td></tr>
          <tr><td>Size</td><td>${size} (${weight})</td></tr>
          <tr><td>Height</td><td>${height}</td></tr>
          <tr><td>Lifespan</td><td>${lifespan}</td></tr>
          <tr><td>Temperament</td><td>${temperament}</td></tr>
          <tr><td>Good with Kids</td><td>${goodKids}</td></tr>
          <tr><td>Shedding</td><td>${shedding}</td></tr>
          <tr><td>Exercise Needs</td><td>${exercise}</td></tr>
          <tr><td>Grooming Needs</td><td>${grooming}</td></tr>
        </table>
      </div>

      <div class="affiliate-callout">
        <h4>Recommended for ${name}s</h4>
        <p>
          <a href="https://www.thefarmersdog.com" target="_blank" rel="sponsored noopener">The Farmer's Dog</a> - Fresh meals tailored to breed size |
          <a href="https://embarkvet.com" target="_blank" rel="sponsored noopener">Embark DNA</a> - Screen for breed-specific conditions |
          <a href="https://www.spotpetins.com" target="_blank" rel="sponsored noopener">Spot Insurance</a> - Coverage for ${name} health issues
        </p>
      </div>

      <h2>${name} Overview</h2>
      <p>The ${name} is a ${size.toLowerCase()} ${group.toLowerCase()} breed known for being ${temperament.toLowerCase()}. Weighing ${weight} and standing ${height} tall, this breed combines an appealing appearance with a wonderful temperament that has made it a favorite among dog enthusiasts worldwide. With a lifespan of ${lifespan}, the ${name} offers years of loyal companionship.</p>

      <p>Originally developed for ${group === 'Working' ? 'various working tasks including guarding, pulling, and rescue' : group === 'Herding' ? 'herding livestock with intelligence and agility' : group === 'Hound' ? 'hunting and tracking with exceptional senses' : group === 'Sporting' ? 'assisting hunters in the field with stamina and retrieving ability' : group === 'Terrier' ? 'hunting vermin and small game with tenacity and courage' : group === 'Toy' ? 'companionship and providing comfort to their owners' : group === 'Hybrid' ? 'combining the best traits of its parent breeds' : 'a variety of purposes'}, the ${name} has evolved into an excellent family companion while retaining many of its original instincts and abilities.</p>

      <p>${name}s are ${goodKids === 'Excellent' ? 'exceptional family dogs that get along wonderfully with children of all ages' : goodKids === 'Good' ? 'good family dogs that do well with respectful children' : 'best suited for families with older children who understand how to interact with dogs'}. Their ${temperament.split(',')[0].trim().toLowerCase()} nature makes them ${exercise === 'Very High' || exercise === 'High' ? 'ideal for active families who enjoy outdoor activities' : 'adaptable to various living situations including apartments with adequate exercise'}.</p>

      <h2>Temperament &amp; Personality</h2>
      <p>${name}s have a distinctive personality that endears them to their owners:</p>
      <ul>
        <li><strong>${temperament.split(',')[0].trim()}:</strong> This defining trait makes the ${name} a standout companion that bonds deeply with their family.</li>
        <li><strong>${temperament.split(',')[1]?.trim() || 'Devoted'}:</strong> Their ${(temperament.split(',')[1]?.trim() || 'devoted').toLowerCase()} nature means they are always eager to please and participate in family activities.</li>
        <li><strong>${temperament.split(',')[2]?.trim() || 'Adaptable'}:</strong> ${name}s show remarkable ${(temperament.split(',')[2]?.trim() || 'adaptability').toLowerCase()} in various situations and environments.</li>
        <li><strong>Family-Oriented:</strong> They thrive on human companionship and form strong bonds with all family members.</li>
        <li><strong>Alert:</strong> ${name}s are naturally watchful and will alert their families to unusual activity.</li>
        <li><strong>${exercise === 'Very High' || exercise === 'High' ? 'Energetic' : exercise === 'Moderate' ? 'Moderately Active' : 'Calm'}:</strong> Their energy level is ${exercise.toLowerCase()}, requiring ${exercise === 'Very High' ? 'extensive daily exercise and mental stimulation' : exercise === 'High' ? 'regular daily exercise and activities' : exercise === 'Moderate' ? 'moderate daily walks and play sessions' : 'gentle daily walks and some playtime'}.</li>
        <li><strong>Social:</strong> ${name}s ${goodKids === 'Excellent' ? 'are typically friendly with strangers and other dogs' : 'can be selective with strangers but warm up with proper introductions'}.</li>
        <li><strong>Trainable:</strong> Their intelligence makes training ${group === 'Terrier' || group === 'Hound' ? 'rewarding but requires patience due to their independent streak' : 'enjoyable and rewarding for both dog and owner'}.</li>
      </ul>

      <h2>Common Health Issues</h2>
      <p>${name}s are generally healthy dogs, but like all breeds, they can be prone to certain conditions:</p>

      <h3>Orthopedic Conditions</h3>
      <ul>
        <li><strong>${h.cats[0]}:</strong> A common concern in ${sizeClass} breeds. Regular screening and maintaining healthy weight helps manage this condition.</li>
        <li><strong>${h.cats[1]}:</strong> Can affect ${name}s, particularly as they age. Early detection through regular vet visits is important.</li>
      </ul>

      <h3>Other Health Concerns</h3>
      <ul>
        <li><strong>${h.cats[2]}:</strong> ${name} owners should be aware of this condition and discuss prevention strategies with their veterinarian.</li>
        <li><strong>${h.cats[3]}:</strong> Regular health screening helps catch this condition early when it is most treatable.</li>
        <li><strong>${h.specific[0]}:</strong> A breed-relevant concern that responsible breeders screen for.</li>
      </ul>

      <div class="warning-box">
        <h4>Health Screening Recommendation</h4>
        <p>Request appropriate health clearances from breeders including hip evaluations, eye certifications, and cardiac screenings. Consider <a href="https://embarkvet.com" target="_blank" rel="sponsored noopener">Embark DNA testing</a> to screen for breed-specific genetic conditions in your ${name}.</p>
      </div>

      <h2>Cost of Ownership</h2>
      <p>Understanding the full cost of ${name} ownership helps you prepare financially:</p>

      <table class="comparison-table">
        <tr><th>Expense Category</th><th>Annual Cost Estimate</th></tr>
        <tr><td>Food (premium quality)</td><td>${foodCost}</td></tr>
        <tr><td>Veterinary Care (routine)</td><td>${vetCost}</td></tr>
        <tr><td>Pet Insurance</td><td>${insCost}</td></tr>
        <tr><td>Grooming</td><td>${groomCost}</td></tr>
        <tr><td>Training (first year)</td><td>${trainCost}</td></tr>
        <tr><td>Supplies &amp; Toys</td><td>${supplyCost}</td></tr>
        <tr><td><strong>Total Annual Cost</strong></td><td><strong>$${totalLow.toLocaleString()}-$${totalHigh.toLocaleString()}</strong></td></tr>
      </table>

      <div class="affiliate-callout">
        <h4>Save on ${name} Care</h4>
        <p>
          <a href="https://www.chewy.com/app/autoship" target="_blank" rel="sponsored noopener">Chewy Autoship</a> - Save up to 35% on food &amp; supplies |
          <a href="https://www.lemonade.com/pet" target="_blank" rel="sponsored noopener">Lemonade Pet</a> - Affordable coverage from $15/month |
          <a href="https://k9traininginstitute.com" target="_blank" rel="sponsored noopener">K9 Training Institute</a> - Expert ${name} training
        </p>
      </div>

      <h2>Exercise &amp; Activity Requirements</h2>
      <p>${name}s have ${exercise.toLowerCase()} exercise needs:</p>
      <ul>
        <li><strong>Daily Exercise:</strong> ${exercise === 'Very High' ? '2+ hours of vigorous activity including running, hiking, or sport work' : exercise === 'High' ? '1-2 hours of active exercise including walks, play, and mental stimulation' : exercise === 'Moderate' ? '45-60 minutes of daily walks and play sessions' : '30-45 minutes of gentle walks and light play'}.</li>
        <li><strong>Mental Stimulation:</strong> Puzzle toys, training sessions, and interactive games are essential for this intelligent breed.</li>
        <li><strong>Activities:</strong> ${group === 'Sporting' ? 'Excels at field work, agility, dock diving, and retrieving games' : group === 'Herding' ? 'Thrives in herding trials, agility, obedience, and rally' : group === 'Working' ? 'Enjoys cart pulling, weight pull, obedience, and protection sports' : group === 'Hound' ? 'Loves scent work, lure coursing, and long walks' : group === 'Terrier' ? 'Enjoys earthdog trials, agility, and interactive play' : 'Enjoys walks, fetch, agility, and interactive play'}.</li>
        <li><strong>Socialization:</strong> Regular interaction with other dogs and people keeps your ${name} well-adjusted.</li>
        <li><strong>Age Considerations:</strong> Puppies need controlled exercise to protect developing joints; seniors benefit from gentler activity.</li>
      </ul>

      <h2>Training Tips for ${name}s</h2>
      <p>Training a ${name} is ${group === 'Terrier' || group === 'Hound' ? 'rewarding but requires patience and consistency' : 'generally enjoyable thanks to their willing nature'}:</p>
      <ul>
        <li><strong>Positive Reinforcement:</strong> Use treats, praise, and play as rewards for desired behaviors.</li>
        <li><strong>Consistency:</strong> Establish clear rules and maintain them across all family members.</li>
        <li><strong>Early Socialization:</strong> Expose your ${name} to various people, animals, sounds, and environments from puppyhood.</li>
        <li><strong>Short Sessions:</strong> Keep training sessions to 10-15 minutes for maximum effectiveness.</li>
        <li><strong>Patience:</strong> ${group === 'Terrier' || group === 'Hound' ? 'Their independent streak means they may not always comply immediately - stay patient and make training more rewarding than alternatives' : 'While eager to please, every dog learns at their own pace'}.</li>
        <li><strong>Professional Help:</strong> Consider professional training classes, especially for first-time ${name} owners.</li>
      </ul>

      <h2>Nutrition &amp; Feeding</h2>
      <p>Proper nutrition is essential for your ${name}'s health:</p>
      <ul>
        <li><strong>High-Quality Food:</strong> Choose foods with named meat proteins as the primary ingredient, appropriate for ${sizeClass} breeds.</li>
        <li><strong>Portion Control:</strong> Follow feeding guidelines based on ideal weight and adjust based on activity level.</li>
        <li><strong>Life Stage:</strong> Feed puppy formula until ${sizeClass === 'large' ? '18-24 months' : '12 months'}, then transition to adult food.</li>
        <li><strong>Meal Schedule:</strong> Two measured meals daily for adults; three meals for puppies.</li>
        <li><strong>Fresh Water:</strong> Always provide access to clean, fresh water.</li>
        <li><strong>Treats:</strong> Keep treats to 10% or less of daily caloric intake.</li>
      </ul>

      <div class="affiliate-callout">
        <h4>Top Food Choices for ${name}s</h4>
        <p>
          <a href="https://www.thefarmersdog.com" target="_blank" rel="sponsored noopener">The Farmer's Dog</a> - Pre-portioned fresh meals |
          <a href="https://www.myollie.com" target="_blank" rel="sponsored noopener">Ollie</a> - Custom meals for ${sizeClass} breeds |
          <a href="https://www.hillspet.com" target="_blank" rel="sponsored noopener">Hill's Science Diet</a> - Vet-recommended nutrition
        </p>
      </div>

      <h2>Grooming Requirements</h2>
      <p>${name}s have ${grooming.toLowerCase()} grooming needs:</p>
      <ul>
        <li><strong>Brushing:</strong> ${grooming === 'Very High' || grooming === 'High' ? 'Daily brushing is recommended to prevent matting and keep the coat healthy' : grooming === 'Moderate' ? 'Brush 2-3 times weekly to remove loose hair and maintain coat health' : 'Weekly brushing is sufficient to keep the coat in good condition'}.</li>
        <li><strong>Bathing:</strong> Every ${grooming === 'Very High' || grooming === 'High' ? '3-4 weeks' : '4-8 weeks'} or as needed.</li>
        <li><strong>Nail Trimming:</strong> Every 2-3 weeks to prevent overgrowth.</li>
        <li><strong>Dental Care:</strong> Brush teeth several times weekly to prevent dental disease.</li>
        <li><strong>Ear Cleaning:</strong> Check and clean ears weekly, especially if ears are floppy.</li>
        <li><strong>Shedding:</strong> ${shedding === 'High' ? 'Heavy shedding year-round with seasonal increases' : shedding === 'Moderate' ? 'Moderate shedding throughout the year' : 'Minimal shedding, making them a better choice for allergy sufferers'}.</li>
      </ul>

      <h2>Is a ${name} Right for You?</h2>

      <h3>${name}s Are Great For:</h3>
      <ul>
        <li>${goodKids === 'Excellent' ? 'Families with children of all ages' : 'Families with older, respectful children'}</li>
        <li>${exercise === 'Very High' || exercise === 'High' ? 'Active individuals and families who enjoy outdoor adventures' : 'Owners who can provide moderate daily exercise'}</li>
        <li>${group === 'Working' || group === 'Herding' ? 'Experienced dog owners who can provide firm, consistent leadership' : 'Both first-time and experienced dog owners'}</li>
        <li>Those looking for a ${temperament.split(',')[0].trim().toLowerCase()} and devoted companion</li>
        <li>People who can commit to ${grooming === 'Very High' || grooming === 'High' ? 'regular grooming maintenance' : 'basic grooming needs'}</li>
      </ul>

      <h3>${name}s May Not Be Ideal For:</h3>
      <ul>
        <li>${sizeClass === 'large' ? 'Those living in small apartments without yard access' : 'Owners unable to provide adequate exercise despite small size'}</li>
        <li>${exercise === 'Very High' || exercise === 'High' ? 'Sedentary owners or those with limited time for exercise' : 'Those expecting a completely inactive companion'}</li>
        <li>${shedding === 'High' ? 'People with severe dog allergies' : shedding === 'Moderate' ? 'Those who cannot tolerate any shedding' : 'Owners who want zero grooming requirements'}</li>
        <li>People who leave their dogs alone for extended periods</li>
      </ul>

      <section class="info-card">
        <h3>Ask Our AI About ${name}s</h3>
        <p>Have specific questions about ${name} health, training, or care? Our AI assistant can provide personalized guidance.</p>
        <div class="hero-actions">
          <a href="/chat" class="primary-btn">Ask the AI Now</a>
        </div>
      </section>
    </article>

    <section class="transparency">
      <h3>Disclaimer</h3>
      <p>This breed guide provides general information about ${name}s. Individual dogs may vary in temperament and health. Always consult with veterinary professionals and reputable breeders for specific guidance. This page contains affiliate links.</p>
    </section>
  </main>

  <footer class="site-footer">
    <p>AI Pet Medical &amp; Vet Help Finder &mdash; educational guidance, real-world vet options, and curated resources.</p>
    <p style="font-size: 0.85rem; margin-top: 8px;">Some suggestions may include sponsored partners.</p>
    <nav class="footer-nav" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;">
      <a href="/guides">Guides</a> &middot;
      <a href="/tools/">Tools</a> &middot;
      <a href="/locations/">Locations</a> &middot;
      <a href="/resources">Resources</a> &middot;
      <a href="/about">About</a> &middot;
      <a href="/contact">Contact</a> &middot;
      <a href="/privacy-policy">Privacy</a> &middot;
      <a href="/terms-of-service">Terms</a> &middot;
      <a href="/feeds/">RSS Feeds</a>
    </nav>
  </footer>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const navToggle = document.querySelector('.nav-toggle');
      const navMenu = document.querySelector('.nav-menu');
      if (navToggle) {
        navToggle.addEventListener('click', function() {
          navMenu.classList.toggle('active');
          navToggle.classList.toggle('active');
        });
      }
    });
  </script>
</body>
</html>`;
}

// Generate all pages
let created = 0;
for (const b of breeds) {
  const filePath = path.join(DIR, `${b[0]}.html`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, makePage(b));
    created++;
    console.log(`Created: ${filePath}`);
  } else {
    console.log(`Exists: ${filePath}`);
  }
}
console.log(`\nDone! Created ${created} dog breed pages.`);
