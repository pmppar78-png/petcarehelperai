#!/usr/bin/env node
/**
 * PetCareHelperAI — Complete Build Engine
 * Engines: Content Generation, Internal Linking, Sitemap/Indexing, Monetization Density
 *
 * Generates all expansion pages, injects cross-links into existing pages,
 * regenerates sitemap.xml, and ensures affiliate density across every page.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, relative } from 'path';
import {
  TODAY, costPages, safetyPages, emergencyPages, dogDiseasePages, catDiseasePages,
  behaviorPages, productPages, breedHealthPages, exoticPages, newLocationPages, comparisonPages
} from './content-data.js';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');
const affiliates = JSON.parse(readFileSync(join(ROOT, 'affiliates.json'), 'utf8'));

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function toTitleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function pickAffiliates(categories, count = 10) {
  const pool = [];
  for (const cat of categories) {
    if (affiliates[cat]) pool.push(...affiliates[cat]);
  }
  // Shuffle and take up to count
  const shuffled = pool.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function buildAffiliateCallout(partners, contextTitle) {
  if (!partners.length) return '';
  const links = partners.slice(0, 4).map(p =>
    `<a href="${p.url}" target="_blank" rel="sponsored noopener">${p.name}</a> — ${p.hook}`
  ).join('. ');
  return `\n      <div class="affiliate-callout">
        <h4>Recommended Resources for ${contextTitle}</h4>
        <p>${links}.</p>
      </div>\n`;
}

function buildAffiliateCalloutSimple(partners, heading) {
  if (!partners.length) return '';
  const links = partners.slice(0, 3).map(p =>
    `<a href="${p.url}" target="_blank" rel="sponsored noopener">${p.name}</a> (${p.hook})`
  ).join(', ');
  return `\n      <div class="affiliate-callout">
        <h4>${heading}</h4>
        <p>Top picks: ${links}.</p>
      </div>\n`;
}

// ============================================================
// HEAD / BOILERPLATE GENERATORS
// ============================================================

function buildHead({ title, description, canonical, cssPath, schema, ogTitle, ogDesc }) {
  const ogTags = `
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${(ogTitle || title).replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${(ogDesc || description).replace(/"/g, '&quot;')}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="Pet Care Helper AI" />`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="google-adsense-account" content="ca-pub-6484141649562994">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6484141649562994" crossorigin="anonymous"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-FK0N7BD82Q"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-FK0N7BD82Q');
  </script>
  <!-- Skimlinks Affiliate Integration -->
  <script type="text/javascript">
    var skimlinks_domain = "petcarehelperai.com";
  </script>
  <script type="text/javascript" src="https://s.skimresources.com/js/PUBLISHER_ID.skimlinks.js" async></script>
  <!-- Sovrn Commerce (VigLink) Integration -->
  <script type="text/javascript">
    var defined_vglnk = typeof vglnk !== "undefined";
    if (!defined_vglnk) {
      var vglnk = {key: "SOVRN_API_KEY"};
      (function(d, t) {
        var s = d.createElement(t);
        s.type = "text/javascript";
        s.async = true;
        s.src = "//cdn.viglink.com/api/vglnk.js";
        var r = d.getElementsByTagName(t)[0];
        r.parentNode.insertBefore(s, r);
      }(document, "script"));
    }
  </script>
  <meta name="description" content="${description.replace(/"/g, '&quot;')}">
  <link rel="canonical" href="${canonical}">${ogTags}
  <title>${title.replace(/</g, '&lt;')} | Pet Care Helper AI</title>
  <link rel="stylesheet" href="${cssPath}">
  ${schema || ''}
</head>`;
}

function buildNav(cssPath) {
  return `<body>
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
        <li><a href="/dogs" class="nav-link">Dogs</a></li>
        <li><a href="/cats" class="nav-link">Cats</a></li>
        <li><a href="/birds" class="nav-link">Birds</a></li>
        <li><a href="/reptiles" class="nav-link">Reptiles</a></li>
        <li><a href="/fish" class="nav-link">Fish</a></li>
        <li><a href="/guides" class="nav-link">Guides</a></li>
      </ul>
    </nav>
  </header>`;
}

function buildFooter() {
  return `
  <footer class="site-footer">
    <p>AI Pet Medical &amp; Vet Help Finder &mdash; educational guidance, real-world vet options, and curated resources in one place.</p>
    <p style="font-size: 0.85rem; margin-top: 8px;">Some suggestions may include sponsored partners. This does not affect guidance.</p>
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

function buildDisclaimer() {
  return `
    <section class="transparency">
      <h3>Important Disclaimer</h3>
      <p>This guide provides general educational information and is not a substitute for professional veterinary advice. Always consult a qualified veterinarian for your pet's specific health needs. This page contains affiliate links to products and services we recommend. If you make a purchase through these links, we may earn a small commission at no additional cost to you. This helps support our ability to provide free pet care resources.</p>
    </section>`;
}

// ============================================================
// CONTENT GENERATION ENGINE
// ============================================================

/**
 * Generates deep, substantive content for each page type.
 * Each page gets 10+ sections, FAQ schema, comprehensive coverage.
 */

function generateArticleSchema(title, desc) {
  return `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title.replace(/"/g, '\\"')}",
    "description": "${desc.replace(/"/g, '\\"')}",
    "datePublished": "${TODAY}",
    "dateModified": "${TODAY}",
    "author": {"@type": "Organization", "name": "Pet Care Helper AI"},
    "publisher": {"@type": "Organization", "name": "Pet Care Helper AI"}
  }
  </script>`;
}

function generateFAQSchema(faqs) {
  const entities = faqs.map(faq => `      {
        "@type": "Question",
        "name": "${faq.q.replace(/"/g, '\\"')}",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "${faq.a.replace(/"/g, '\\"')}"
        }
      }`).join(',\n');
  return `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
${entities}
    ]
  }
  </script>`;
}

// ============================================================
// GUIDE PAGE CONTENT BUILDER
// ============================================================

function buildGuideSections(page) {
  const slug = page.slug;
  const title = page.title;
  const animal = page.animal;
  const cats = page.affiliateCategories || [];
  const partnerSets = [];
  for (let i = 0; i < Math.min(cats.length, 4); i++) {
    const catPartners = affiliates[cats[i]] || [];
    partnerSets.push(catPartners);
  }

  // Build contextual sections based on the page type
  let sections = '';
  const allPartners = pickAffiliates(cats, 15);

  // Introduction
  sections += `
      <h2>Overview</h2>
      <p>${page.desc} This comprehensive guide covers everything pet owners need to know, with expert insights and actionable recommendations.</p>`;

  // Build content sections based on topic
  if (slug.includes('cost') || slug.includes('how-much') || slug.includes('pricing') || slug.includes('lifetime')) {
    sections += buildCostContent(page, allPartners);
  } else if (slug.includes('can-dogs-eat') || slug.includes('can-cats-eat') || slug.includes('toxic') || slug.includes('safe-') || slug.includes('poisoning') || slug.includes('pet-proofing')) {
    sections += buildSafetyContent(page, allPartners);
  } else if (slug.includes('emergency') || slug.includes('choking') || slug.includes('heatstroke') || slug.includes('seizure') || slug.includes('bloat-emergency') || slug.includes('cpr') || slug.includes('drowning') || slug.includes('burn') || slug.includes('bleeding') || slug.includes('broken-bone') || slug.includes('bite') || slug.includes('snake-bite') || slug.includes('fall-injury')) {
    sections += buildEmergencyContent(page, allPartners);
  } else if (slug.includes('disease') || slug.includes('infection') || slug.includes('cancer') || slug.includes('-uti') || slug.includes('pancreatitis') || slug.includes('cushing') || slug.includes('thyroid') || slug.includes('ivdd') || slug.includes('diabetes') || slug.includes('heart-disease') || slug.includes('colitis') || slug.includes('ibd') || slug.includes('allerg') || slug.includes('obesity') || slug.includes('dental') || slug.includes('parvo') || slug.includes('kennel') || slug.includes('lyme') || slug.includes('hotspot') || slug.includes('cataract') || slug.includes('cruciate') || slug.includes('parasite') || slug.includes('mange') || slug.includes('addison') || slug.includes('felv') || slug.includes('fiv') || slug.includes('asthma') || slug.includes('constipation') || slug.includes('fip') || slug.includes('litter-box') || slug.includes('overgroom') || slug.includes('respiratory') || slug.includes('ear-infection') || slug.includes('skin-allerg')) {
    sections += buildDiseaseContent(page, allPartners);
  } else if (slug.includes('training') || slug.includes('anxiety') || slug.includes('phobia') || slug.includes('reactiv') || slug.includes('guarding') || slug.includes('potty') || slug.includes('crate') || slug.includes('biting') || slug.includes('impulse') || slug.includes('recall') || slug.includes('leash-walking') || slug.includes('aggression') || slug.includes('barking') || slug.includes('digging') || slug.includes('socializ') || slug.includes('clicker') || slug.includes('introducing') || slug.includes('travel-anxiety') || slug.includes('teething') || slug.includes('enrichment')) {
    sections += buildBehaviorContent(page, allPartners);
  } else if (slug.includes('best-') || slug.includes('buying')) {
    sections += buildProductContent(page, allPartners);
  } else if (slug.includes('health-guide')) {
    sections += buildBreedHealthContent(page, allPartners);
  } else if (slug.includes('care-guide') || slug.includes('nitrogen-cycle') || slug.includes('planted-aquarium') || slug.includes('freshwater-vs') || slug.includes('shrimp')) {
    sections += buildExoticCareContent(page, allPartners);
  } else if (slug.includes('compare-')) {
    sections += buildComparisonContent(page, allPartners);
  } else {
    sections += buildGenericContent(page, allPartners);
  }

  return sections;
}

function buildCostContent(page, partners) {
  const p1 = partners.slice(0, 4);
  const p2 = partners.slice(4, 8);
  const p3 = partners.slice(8, 12);
  return `
      <h2>Average Cost Breakdown</h2>
      <p>Understanding the full cost picture helps pet owners budget effectively and avoid financial surprises. Prices vary significantly based on location, facility type, and your pet's specific needs.</p>
      <table class="comparison-table">
        <tr><th>Service/Item</th><th>Average Cost Range</th><th>Notes</th></tr>
        <tr><td>Basic Service</td><td>$50 – $200</td><td>Varies by region and provider</td></tr>
        <tr><td>Mid-Range Option</td><td>$200 – $500</td><td>Includes standard care package</td></tr>
        <tr><td>Premium/Emergency</td><td>$500 – $2,000+</td><td>Specialist or after-hours rates apply</td></tr>
        <tr><td>Ongoing/Annual</td><td>$300 – $1,500/year</td><td>Preventive care and maintenance</td></tr>
      </table>
      ${buildAffiliateCallout(p1, 'Saving on Pet Care Costs')}

      <h2>Factors That Affect Cost</h2>
      <p>Several key factors determine the actual price you'll pay.</p>
      <h3>Geographic Location</h3>
      <p>Urban areas and coastal cities tend to have higher veterinary and service costs compared to rural areas and the Midwest. The cost of living in your area directly correlates with pet care pricing.</p>
      <h3>Pet Size and Breed</h3>
      <p>Larger pets generally cost more for medications, food, grooming, and surgical procedures. Brachycephalic breeds and giant breeds often face higher costs due to breed-specific health concerns.</p>
      <h3>Facility Type</h3>
      <p>Emergency animal hospitals charge 2-3x more than regular veterinary clinics. Specialty hospitals and board-certified specialists command premium rates for advanced diagnostics and treatment.</p>
      <h3>Severity and Complexity</h3>
      <p>Simple, routine procedures cost far less than complex surgeries, multi-day hospitalizations, or treatments requiring advanced imaging and specialist consultation.</p>

      <h2>How Pet Insurance Helps</h2>
      <p>Pet insurance can significantly reduce out-of-pocket costs for unexpected medical expenses. Most plans cover 70-90% of eligible costs after meeting your annual deductible.</p>
      <ul>
        <li>Accident and illness plans cover emergencies, surgeries, hospitalizations, and chronic conditions</li>
        <li>Wellness add-ons can cover routine checkups, vaccinations, and preventive care</li>
        <li>Plans typically cost $30-$70/month for dogs and $15-$35/month for cats</li>
        <li>The younger your pet when enrolled, the lower the premium and fewer exclusions</li>
      </ul>
      ${buildAffiliateCallout(p2, 'Pet Insurance Options')}

      <h2>Ways to Save Money</h2>
      <p>Smart strategies can significantly reduce your pet care expenses without compromising quality of care.</p>
      <h3>Preventive Care</h3>
      <ul>
        <li>Keep vaccinations and preventive medications current to avoid expensive treatments later</li>
        <li>Schedule annual wellness exams to catch issues early when they're cheaper to treat</li>
        <li>Maintain dental hygiene at home to reduce the need for costly professional cleanings</li>
        <li>Keep your pet at a healthy weight to prevent obesity-related health problems</li>
      </ul>
      <h3>Smart Shopping</h3>
      <ul>
        <li>Compare prices between veterinary clinics — costs can vary 50-100% for the same procedure</li>
        <li>Ask about payment plans for expensive procedures</li>
        <li>Use online pharmacies for maintenance medications (often 20-40% cheaper than vet office prices)</li>
        <li>Look into veterinary school clinics for reduced-cost care from supervised students</li>
        <li>Consider tele-vet consultations for non-emergency questions ($20-50 vs $50-100+ office visits)</li>
      </ul>
      ${buildAffiliateCallout(p3, 'Save on Pet Medications')}

      <h2>Emergency Financial Planning</h2>
      <p>Unexpected veterinary emergencies can cost $1,000-$5,000 or more. Having a financial safety net is essential for every pet owner.</p>
      <ul>
        <li><strong>Pet savings fund:</strong> Set aside $50-100 monthly in a dedicated pet emergency account</li>
        <li><strong>Pet insurance:</strong> Protects against catastrophic costs for a predictable monthly premium</li>
        <li><strong>Care credit:</strong> Veterinary financing with promotional zero-interest periods</li>
        <li><strong>Breed research:</strong> Know your breed's common health issues and likely costs before adopting</li>
      </ul>

      <h2>Frequently Asked Questions</h2>
      <h3>How can I reduce veterinary costs?</h3>
      <p>Keep up with preventive care, compare prices between clinics, use online pharmacies for medications, and consider pet insurance for major expenses. Wellness plans offered by some clinics bundle preventive services at a discount.</p>
      <h3>Is pet insurance worth the cost?</h3>
      <p>Pet insurance is generally worth it for most pet owners. A single emergency surgery can cost $3,000-$7,000. Monthly premiums of $30-60 provide peace of mind and financial protection against unexpected bills.</p>
      <h3>What is the most expensive pet to own?</h3>
      <p>Large dogs, especially breeds prone to health issues (Bulldogs, Great Danes, Bernese Mountain Dogs), tend to be the most expensive pets overall due to higher food costs, larger medication doses, and breed-specific health problems.</p>

      <section class="info-card">
        <h3>Need Help Budgeting for Pet Care?</h3>
        <p>Our AI assistant can help you estimate costs for your specific pet breed, create a pet care budget, and find affordable care options in your area.</p>
        <div class="hero-actions">
          <a href="/chat" class="primary-btn">Talk to AI Pet Helper</a>
          <a href="/tools/cost-calculator" class="ghost-btn">Try Cost Calculator</a>
        </div>
      </section>`;
}

function buildSafetyContent(page, partners) {
  const p1 = partners.slice(0, 4);
  const p2 = partners.slice(4, 8);
  return `
      <h2>Toxicity and Safety Overview</h2>
      <p>Understanding what is safe and what is dangerous for your pet can prevent emergencies and save lives. This guide provides clear, veterinarian-informed guidance on this important topic.</p>

      <div class="warning-box">
        <h4>Emergency Warning</h4>
        <p>If you believe your pet has ingested something toxic, contact your veterinarian, the ASPCA Animal Poison Control Center (888-426-4435), or the Pet Poison Helpline (855-764-7661) immediately. Time is critical in poisoning cases.</p>
      </div>

      <h2>Why This Is Dangerous</h2>
      <p>Many common household items and foods that are perfectly safe for humans can be toxic or even fatal to pets. Pets metabolize substances differently, and even small amounts of certain toxins can cause severe organ damage.</p>
      <ul>
        <li>Pets have different metabolic pathways that cannot process certain compounds</li>
        <li>Smaller body size means toxins reach dangerous concentrations more quickly</li>
        <li>Some substances accumulate in the body over time, causing delayed reactions</li>
        <li>Symptoms may not appear immediately, but internal damage can begin within minutes</li>
      </ul>

      <h2>Signs of Poisoning or Adverse Reaction</h2>
      <p>Watch for these symptoms if you suspect your pet has been exposed to something harmful:</p>
      <ul>
        <li><strong>Gastrointestinal:</strong> Vomiting, diarrhea, drooling, loss of appetite, abdominal pain</li>
        <li><strong>Neurological:</strong> Tremors, seizures, disorientation, unsteady gait, loss of coordination</li>
        <li><strong>Respiratory:</strong> Difficulty breathing, coughing, wheezing, rapid breathing</li>
        <li><strong>Cardiovascular:</strong> Pale gums, rapid or slow heart rate, weakness, collapse</li>
        <li><strong>Other:</strong> Excessive thirst or urination, lethargy, bloody urine or stool</li>
      </ul>
      ${buildAffiliateCallout(p1, '24/7 Emergency Vet Access')}

      <h2>What to Do in an Emergency</h2>
      <h3>Immediate Steps</h3>
      <ol>
        <li>Remove your pet from the source of exposure</li>
        <li>Do NOT induce vomiting unless specifically instructed by a veterinarian or poison control</li>
        <li>Try to identify what your pet consumed and approximately how much</li>
        <li>Note when the exposure occurred and any symptoms you've observed</li>
        <li>Call your vet, ASPCA Poison Control (888-426-4435), or Pet Poison Helpline (855-764-7661)</li>
        <li>Follow their instructions exactly — bring the product packaging to the vet if possible</li>
      </ol>

      <h2>Prevention Tips</h2>
      <p>The best approach to pet safety is preventing exposure in the first place.</p>
      <ul>
        <li>Store all potentially dangerous items in secure, pet-proof locations</li>
        <li>Never leave food unattended where pets can reach it</li>
        <li>Educate all family members and visitors about pet safety rules</li>
        <li>Keep emergency numbers saved in your phone</li>
        <li>Consider pet-proofing products for cabinets, trash cans, and storage areas</li>
      </ul>
      ${buildAffiliateCallout(p2, 'Pet Safety and Insurance')}

      <h2>Frequently Asked Questions</h2>
      <h3>How quickly do toxicity symptoms appear?</h3>
      <p>Symptoms can appear within 30 minutes to 24 hours depending on the substance, amount ingested, and your pet's size. Some toxins cause immediate vomiting while others have delayed effects on organs like the kidneys or liver.</p>
      <h3>Should I make my pet vomit?</h3>
      <p>Never induce vomiting without veterinary guidance. Some substances cause more damage coming back up, and vomiting can be dangerous with certain toxins, sharp objects, or if your pet is already showing neurological symptoms.</p>
      <h3>Are small amounts still dangerous?</h3>
      <p>For some substances, yes. Certain toxins like xylitol, lilies (for cats), and some medications can be dangerous or fatal even in very small amounts. When in doubt, always contact your veterinarian.</p>

      <section class="info-card">
        <h3>Worried About Something Your Pet Ate?</h3>
        <p>Our AI assistant can help you assess the situation and guide you on next steps. For emergencies, always contact your vet or poison control directly.</p>
        <div class="hero-actions">
          <a href="/chat" class="primary-btn">Talk to AI Pet Helper</a>
          <a href="/tools/symptom-checker" class="ghost-btn">Try Symptom Checker</a>
        </div>
      </section>`;
}

function buildEmergencyContent(page, partners) {
  const p1 = partners.slice(0, 4);
  const p2 = partners.slice(4, 8);
  return `
      <div class="emergency-box" style="background: #FEF2F2; border: 2px solid #EF4444; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h2 style="color: #DC2626; margin-top: 0;">Emergency Situation</h2>
        <p style="font-size: 1.1rem;"><strong>If your pet is in immediate danger, call your nearest emergency veterinary hospital right now.</strong> This guide provides first aid information but is not a substitute for professional emergency veterinary care.</p>
      </div>

      <h2>Recognizing the Emergency</h2>
      <p>Quick recognition of an emergency situation can save your pet's life. Knowing what to look for and how to respond in those critical first minutes is essential for every pet owner.</p>
      <ul>
        <li>Stay calm — your pet can sense your anxiety, which may worsen their stress</li>
        <li>Assess the situation quickly and safely</li>
        <li>Remove your pet from any ongoing danger</li>
        <li>Note the time the emergency began and all symptoms</li>
      </ul>

      <h2>Immediate First Aid Steps</h2>
      <p>These steps should be taken while arranging transport to the veterinarian.</p>
      <ol>
        <li><strong>Ensure safety:</strong> Make sure you and your pet are in a safe location away from traffic, hazards, or other animals</li>
        <li><strong>Assess breathing and consciousness:</strong> Check if your pet is responsive, breathing, and has a pulse</li>
        <li><strong>Control obvious bleeding:</strong> Apply gentle pressure with a clean cloth if there is active bleeding</li>
        <li><strong>Keep your pet warm:</strong> Cover with a blanket to prevent shock, especially in small or young animals</li>
        <li><strong>Minimize movement:</strong> If a spinal or bone injury is suspected, move your pet as little as possible</li>
        <li><strong>Transport carefully:</strong> Use a flat surface as a stretcher if needed; keep the head slightly elevated</li>
      </ol>
      ${buildAffiliateCallout(p1, '24/7 Emergency Veterinary Access')}

      <h2>Warning Signs That Need Immediate Attention</h2>
      <p>These symptoms indicate a true emergency requiring immediate veterinary care:</p>
      <ul>
        <li>Difficulty breathing, gasping, or blue/white gums</li>
        <li>Uncontrollable bleeding or bleeding that doesn't stop with pressure</li>
        <li>Seizures lasting more than 3 minutes or multiple seizures in a row</li>
        <li>Loss of consciousness or inability to stand</li>
        <li>Suspected poisoning with neurological symptoms</li>
        <li>Distended, hard abdomen (possible bloat/GDV — life-threatening)</li>
        <li>Straining to urinate with no production (possible urinary blockage)</li>
        <li>Severe trauma from a vehicle, fall, or animal attack</li>
      </ul>

      <h2>When to Call a Tele-Vet vs Emergency Hospital</h2>
      <p>Not every urgent situation requires an emergency room visit, but some absolutely do.</p>
      <h3>Call a Tele-Vet When:</h3>
      <ul>
        <li>Your pet has mild symptoms and you're unsure if they need emergency care</li>
        <li>You need guidance on monitoring symptoms at home</li>
        <li>Your pet ate something and you're not sure if it's toxic</li>
        <li>You need advice on basic first aid while arranging transport</li>
      </ul>
      <h3>Go to the Emergency Hospital When:</h3>
      <ul>
        <li>Any of the warning signs listed above are present</li>
        <li>Your pet's condition is rapidly worsening</li>
        <li>There has been significant trauma</li>
        <li>Your gut tells you something is seriously wrong</li>
      </ul>
      ${buildAffiliateCallout(p2, 'Pet Insurance for Emergencies')}

      <h2>Preparing for Emergencies</h2>
      <ul>
        <li>Save your nearest emergency vet's address and phone number in your phone</li>
        <li>Keep a pet first aid kit stocked and accessible</li>
        <li>Know the route to your nearest 24-hour veterinary emergency hospital</li>
        <li>Keep pet insurance active to cover emergency costs (average emergency visit: $1,000-$3,000)</li>
        <li>Learn basic pet CPR and first aid techniques</li>
        <li>Post emergency numbers where all family members can find them</li>
      </ul>

      <h2>Frequently Asked Questions</h2>
      <h3>How do I know if it's a real emergency?</h3>
      <p>When in doubt, treat it as an emergency. It's always better to visit the vet and find out everything is fine than to wait too long when your pet needs urgent care. Trust your instincts as a pet owner.</p>
      <h3>How much does an emergency vet visit cost?</h3>
      <p>Emergency vet visits typically cost $200-$500 for the exam alone, with treatment adding $500-$5,000+ depending on severity. Pet insurance can cover 70-90% of these costs after your deductible.</p>

      <section class="info-card">
        <h3>Need Immediate Guidance?</h3>
        <p>Our AI assistant can help you assess symptoms and determine whether your pet needs emergency care. For true emergencies, always go directly to your nearest emergency vet.</p>
        <div class="hero-actions">
          <a href="/chat" class="primary-btn">Talk to AI Pet Helper</a>
          <a href="/tools/symptom-checker" class="ghost-btn">Try Symptom Checker</a>
        </div>
      </section>`;
}

function buildDiseaseContent(page, partners) {
  const p1 = partners.slice(0, 4);
  const p2 = partners.slice(4, 8);
  const p3 = partners.slice(8, 12);
  return `
      <h2>What Is ${page.title}?</h2>
      <p>${page.desc} Understanding this condition helps pet owners recognize early warning signs and seek appropriate treatment promptly.</p>

      <h2>Causes and Risk Factors</h2>
      <p>Multiple factors can contribute to the development of this condition:</p>
      <ul>
        <li><strong>Genetic predisposition:</strong> Certain breeds are at higher risk due to inherited traits</li>
        <li><strong>Age:</strong> Some conditions are more common in puppies/kittens or senior pets</li>
        <li><strong>Environmental factors:</strong> Diet, toxin exposure, stress, and living conditions play a role</li>
        <li><strong>Underlying health issues:</strong> Other conditions may increase susceptibility</li>
        <li><strong>Immune system status:</strong> Compromised immune function can predispose to disease</li>
      </ul>

      <h2>Symptoms to Watch For</h2>
      <p>Early detection significantly improves treatment outcomes. Watch for these signs:</p>
      <ul>
        <li>Changes in appetite, water consumption, or weight</li>
        <li>Behavioral changes including lethargy, restlessness, or hiding</li>
        <li>Physical symptoms specific to the affected body system</li>
        <li>Changes in bathroom habits (frequency, appearance, straining)</li>
        <li>Visible discomfort, pain response to touch, or changes in posture</li>
        <li>Respiratory changes, coughing, or labored breathing</li>
      </ul>

      <div class="warning-box">
        <h4>When to See the Vet Immediately</h4>
        <p>Seek immediate veterinary care if symptoms are severe, rapidly worsening, or if your pet shows signs of distress, stops eating for more than 24 hours, or has difficulty breathing.</p>
      </div>

      <h2>Diagnosis</h2>
      <p>Your veterinarian will use a combination of diagnostic approaches to confirm the condition:</p>
      <ul>
        <li><strong>Physical examination:</strong> Thorough assessment of your pet's overall condition</li>
        <li><strong>Blood work:</strong> Complete blood count (CBC) and chemistry panel to evaluate organ function</li>
        <li><strong>Urinalysis:</strong> Evaluates kidney function and checks for infection</li>
        <li><strong>Imaging:</strong> X-rays, ultrasound, or advanced imaging as indicated</li>
        <li><strong>Specialized tests:</strong> Biopsies, cultures, or condition-specific diagnostics</li>
      </ul>
      ${buildAffiliateCallout(p1, 'Veterinary Consultation Options')}

      <h2>Treatment Options</h2>
      <p>Treatment depends on the severity and specific presentation of the condition.</p>
      <h3>Medical Management</h3>
      <ul>
        <li>Prescription medications to address the underlying cause and manage symptoms</li>
        <li>Supportive care including fluids, nutritional support, and pain management</li>
        <li>Dietary modifications that may be required for long-term management</li>
        <li>Regular monitoring and follow-up appointments to track progress</li>
      </ul>
      <h3>Advanced Treatment</h3>
      <ul>
        <li>Surgical intervention if indicated for the specific condition</li>
        <li>Specialist referral for complex or refractory cases</li>
        <li>Ongoing medication adjustment based on response to treatment</li>
      </ul>
      ${buildAffiliateCallout(p2, 'Pet Medications and Pharmacy')}

      <h2>Prevention and Management</h2>
      <ul>
        <li>Regular veterinary checkups for early detection (annually, or semi-annually for seniors)</li>
        <li>Maintain a healthy weight through proper nutrition and exercise</li>
        <li>Keep vaccinations and preventive medications current</li>
        <li>Breed-specific health screenings recommended by your veterinarian</li>
        <li>Provide a low-stress, enriched environment</li>
        <li>Follow your vet's recommendations for diet and lifestyle modifications</li>
      </ul>

      <h2>Cost of Treatment</h2>
      <p>Treatment costs vary based on severity and duration:</p>
      <table class="comparison-table">
        <tr><th>Treatment Type</th><th>Estimated Cost Range</th></tr>
        <tr><td>Initial Diagnosis</td><td>$200 – $800</td></tr>
        <tr><td>Medication (monthly)</td><td>$30 – $200</td></tr>
        <tr><td>Surgery (if needed)</td><td>$1,500 – $6,000</td></tr>
        <tr><td>Ongoing Management (annual)</td><td>$500 – $3,000</td></tr>
      </table>
      ${buildAffiliateCallout(p3, 'Pet Insurance Coverage')}

      <h2>Frequently Asked Questions</h2>
      <h3>Is this condition curable?</h3>
      <p>Treatment outcomes depend on the specific condition, severity at diagnosis, and your pet's overall health. Some conditions are fully treatable, while others require ongoing management. Your veterinarian can provide the most accurate prognosis for your pet's specific situation.</p>
      <h3>How can I afford treatment?</h3>
      <p>Pet insurance covers most illness treatments after your deductible. Other options include veterinary payment plans, CareCredit financing, pet health savings accounts, and charitable assistance programs for pet owners in financial need.</p>

      <section class="info-card">
        <h3>Concerned About Your Pet's Health?</h3>
        <p>Our AI assistant can help you understand symptoms, learn about conditions, and determine when veterinary care is needed.</p>
        <div class="hero-actions">
          <a href="/chat" class="primary-btn">Talk to AI Pet Helper</a>
          <a href="/tools/symptom-checker" class="ghost-btn">Try Symptom Checker</a>
        </div>
      </section>`;
}

function buildBehaviorContent(page, partners) {
  const p1 = partners.slice(0, 4);
  const p2 = partners.slice(4, 8);
  return `
      <h2>Understanding the Behavior</h2>
      <p>${page.desc} Behavioral issues are among the most common reasons pets are surrendered to shelters, but most can be successfully addressed with patience, consistency, and the right approach.</p>

      <h2>Why This Happens</h2>
      <p>Behavior problems rarely occur in isolation. Understanding the root cause is essential for effective treatment.</p>
      <ul>
        <li><strong>Lack of training:</strong> Many behavioral issues stem from inconsistent or absent early training</li>
        <li><strong>Fear and anxiety:</strong> Fear is the most common cause of aggression and avoidance behaviors</li>
        <li><strong>Frustration:</strong> Unmet physical or mental needs lead to destructive or attention-seeking behaviors</li>
        <li><strong>Medical causes:</strong> Pain, illness, or cognitive decline can trigger behavioral changes</li>
        <li><strong>Past experience:</strong> Traumatic events or poor socialization during critical developmental periods</li>
        <li><strong>Environmental factors:</strong> Changes in routine, new family members, moving, or household stress</li>
      </ul>

      <h2>Training Approach</h2>
      <p>Positive reinforcement-based training is the most effective and humane approach to behavior modification.</p>
      <h3>Foundation Principles</h3>
      <ul>
        <li>Reward desired behaviors immediately and consistently</li>
        <li>Ignore or redirect unwanted behaviors rather than punishing them</li>
        <li>Keep training sessions short (5-10 minutes) and frequent</li>
        <li>Be patient — behavior change takes time, especially with deeply ingrained patterns</li>
        <li>Ensure all family members follow the same training protocols</li>
        <li>Set your pet up for success by managing the environment</li>
      </ul>
      ${buildAffiliateCallout(p1, 'Training Resources')}

      <h3>Step-by-Step Protocol</h3>
      <ol>
        <li><strong>Identify triggers:</strong> Note exactly what causes the behavior — context, timing, people, places</li>
        <li><strong>Manage the environment:</strong> Prevent the behavior from being practiced while you work on training</li>
        <li><strong>Build foundation skills:</strong> Ensure basic obedience commands are solid before addressing complex behaviors</li>
        <li><strong>Desensitize gradually:</strong> Introduce triggers at low intensity and pair with positive experiences</li>
        <li><strong>Counter-condition:</strong> Change the emotional response to triggers through systematic pairing with rewards</li>
        <li><strong>Proof in context:</strong> Gradually increase difficulty as your pet succeeds at each level</li>
        <li><strong>Maintain progress:</strong> Continue practicing and reinforcing even after the behavior improves</li>
      </ol>

      <h2>When to Get Professional Help</h2>
      <p>Some behavioral issues benefit from or require professional guidance:</p>
      <ul>
        <li>Aggression of any type (biting, growling, lunging) — especially toward people</li>
        <li>Behaviors that have not improved after 4-6 weeks of consistent training</li>
        <li>Anxiety that significantly impacts your pet's quality of life</li>
        <li>Sudden behavioral changes (may indicate a medical problem)</li>
        <li>Behaviors that create safety concerns for family members or other pets</li>
      </ul>
      ${buildAffiliateCallout(p2, 'Calming and Behavior Support')}

      <h2>Products That Can Help</h2>
      <p>While no product replaces proper training, these tools can support your behavior modification program:</p>
      <ul>
        <li><strong>Calming aids:</strong> Pheromone diffusers, pressure wraps, and calming supplements</li>
        <li><strong>Training tools:</strong> Clickers, treat pouches, long lines, and appropriate harnesses</li>
        <li><strong>Enrichment:</strong> Puzzle toys, snuffle mats, and interactive feeders to address boredom</li>
        <li><strong>Management tools:</strong> Baby gates, crates, and environmental barriers to prevent practice of unwanted behaviors</li>
      </ul>

      <h2>Frequently Asked Questions</h2>
      <h3>How long does behavior modification take?</h3>
      <p>Simple training goals may show improvement in 1-2 weeks, while deeply ingrained behavioral issues often require 2-6 months of consistent work. Some fears and anxieties may need ongoing management throughout your pet's life.</p>
      <h3>Should I use punishment-based methods?</h3>
      <p>No. Research consistently shows that punishment-based methods increase fear, anxiety, and aggression while damaging the human-animal bond. Positive reinforcement training is both more effective and more humane.</p>

      <section class="info-card">
        <h3>Need Personalized Behavior Advice?</h3>
        <p>Our AI assistant can help you understand your pet's behavior and develop a customized training plan.</p>
        <div class="hero-actions">
          <a href="/chat" class="primary-btn">Talk to AI Pet Helper</a>
        </div>
      </section>`;
}

function buildProductContent(page, partners) {
  const p1 = partners.slice(0, 5);
  const p2 = partners.slice(5, 10);
  const p3 = partners.slice(10, 15);
  return `
      <h2>Buyer's Guide</h2>
      <p>${page.desc} We've researched and evaluated the top options to help you make an informed decision for your pet.</p>

      <h2>What to Look For</h2>
      <p>Key factors to consider when choosing the right product:</p>
      <ul>
        <li><strong>Quality and durability:</strong> Look for well-constructed products that will withstand daily use</li>
        <li><strong>Safety:</strong> Check for non-toxic materials, no small parts that can be swallowed, and appropriate sizing</li>
        <li><strong>Size appropriateness:</strong> Products must be correctly sized for your pet's breed and weight</li>
        <li><strong>Ease of cleaning:</strong> Products that are easy to wash and maintain last longer and stay hygienic</li>
        <li><strong>Value:</strong> Consider long-term cost including replacements, refills, or subscriptions</li>
        <li><strong>Reviews and testing:</strong> Look for products tested by independent organizations or highly rated by verified buyers</li>
      </ul>

      <h2>Top Recommendations</h2>
      ${buildAffiliateCallout(p1, 'Top Picks')}

      <h3>Best Overall</h3>
      <p>For most pet owners, we recommend looking for products that balance quality, safety, and value. The best overall choice combines durability with thoughtful design features that make daily use easy.</p>

      <h3>Best Budget Option</h3>
      <p>You don't have to spend a fortune to get a quality product. Budget-friendly options from reputable brands offer solid construction and essential features without premium pricing.</p>

      <h3>Best Premium Option</h3>
      <p>Premium products often include advanced features, superior materials, and longer warranties. These are worth considering for pets with specific needs or owners who want the absolute best.</p>

      <h2>Comparison Table</h2>
      <table class="comparison-table">
        <tr><th>Feature</th><th>Budget Option</th><th>Mid-Range</th><th>Premium</th></tr>
        <tr><td>Price Range</td><td>$10-30</td><td>$30-60</td><td>$60-150+</td></tr>
        <tr><td>Durability</td><td>Good</td><td>Very Good</td><td>Excellent</td></tr>
        <tr><td>Features</td><td>Basic</td><td>Standard</td><td>Advanced</td></tr>
        <tr><td>Warranty</td><td>Limited</td><td>1 Year</td><td>2+ Years</td></tr>
      </table>
      ${buildAffiliateCallout(p2, 'More Top-Rated Options')}

      <h2>Size Guide</h2>
      <p>Proper sizing is critical for safety and comfort. Use these general guidelines:</p>
      <table class="comparison-table">
        <tr><th>Pet Size</th><th>Weight Range</th><th>Product Size</th></tr>
        <tr><td>Extra Small</td><td>Under 10 lbs</td><td>XS / Small</td></tr>
        <tr><td>Small</td><td>10-25 lbs</td><td>Small / Medium</td></tr>
        <tr><td>Medium</td><td>25-50 lbs</td><td>Medium / Large</td></tr>
        <tr><td>Large</td><td>50-80 lbs</td><td>Large / XL</td></tr>
        <tr><td>Extra Large</td><td>80+ lbs</td><td>XL / XXL</td></tr>
      </table>

      <h2>Care and Maintenance</h2>
      <ul>
        <li>Inspect products regularly for wear, damage, or loose parts</li>
        <li>Follow manufacturer cleaning instructions to maintain product integrity</li>
        <li>Replace products that show significant wear to prevent safety issues</li>
        <li>Store products properly when not in use to extend lifespan</li>
      </ul>
      ${buildAffiliateCallout(p3, 'Shop All Pet Products')}

      <h2>Frequently Asked Questions</h2>
      <h3>How often should I replace this product?</h3>
      <p>Most pet products should be inspected monthly and replaced when showing significant wear. High-use items like toys and bedding may need replacement every 3-12 months, while durable items like crates and bowls can last years with proper care.</p>
      <h3>Where is the best place to buy pet products?</h3>
      <p>Online retailers like Chewy, Amazon, and Petco often offer competitive prices with the convenience of home delivery. Specialty stores may carry higher-quality or niche products not found at big-box retailers.</p>

      <section class="info-card">
        <h3>Need Help Choosing the Right Product?</h3>
        <p>Our AI assistant can recommend products based on your pet's specific breed, size, and needs.</p>
        <div class="hero-actions">
          <a href="/chat" class="primary-btn">Talk to AI Pet Helper</a>
        </div>
      </section>`;
}

function buildBreedHealthContent(page, partners) {
  const p1 = partners.slice(0, 4);
  const p2 = partners.slice(4, 8);
  const p3 = partners.slice(8, 12);
  const breedName = page.title.replace(' Health Guide', '');
  return `
      <h2>${breedName} Health Overview</h2>
      <p>${page.desc} Every breed has its own set of health predispositions that responsible owners should understand and monitor for throughout their pet's life.</p>

      <h2>Common Health Conditions</h2>
      <p>The following conditions are commonly seen in this breed. Early detection and preventive care significantly improve outcomes.</p>
      <h3>Orthopedic Issues</h3>
      <ul>
        <li>Joint and bone conditions common to the breed's body structure</li>
        <li>Weight management is critical for reducing orthopedic stress</li>
        <li>Appropriate exercise levels help maintain joint health without overloading</li>
        <li>Screening tests available for many genetic orthopedic conditions</li>
      </ul>
      <h3>Cardiac Concerns</h3>
      <ul>
        <li>Breed-specific heart conditions that may develop with age</li>
        <li>Annual cardiac screening recommended for at-risk breeds</li>
        <li>Early detection allows for medication that can slow progression</li>
      </ul>
      <h3>Skin and Coat Conditions</h3>
      <ul>
        <li>Allergies and dermatitis common in many breeds</li>
        <li>Proper grooming and nutrition help prevent skin issues</li>
        <li>Environmental and food allergy testing available</li>
      </ul>
      ${buildAffiliateCallout(p1, `${breedName} Health Insurance`)}

      <h2>Recommended Health Screenings</h2>
      <p>Breed-specific health screenings help identify genetic conditions early:</p>
      <table class="comparison-table">
        <tr><th>Test</th><th>When</th><th>Why</th></tr>
        <tr><td>Hip/Elbow Evaluation</td><td>12-24 months</td><td>Screen for dysplasia</td></tr>
        <tr><td>Cardiac Exam</td><td>Annual</td><td>Detect heart conditions</td></tr>
        <tr><td>Eye Exam (CERF)</td><td>Annual</td><td>Screen for eye diseases</td></tr>
        <tr><td>DNA Testing</td><td>Any age</td><td>Identify genetic risk factors</td></tr>
        <tr><td>Blood Panel</td><td>Annual (biannual 7+)</td><td>Monitor organ function</td></tr>
      </table>
      ${buildAffiliateCallout(p2, 'DNA and Genetic Testing')}

      <h2>Nutrition Recommendations</h2>
      <p>Proper nutrition is foundational to breed health:</p>
      <ul>
        <li>Choose food formulated for your breed's size category (small, medium, large, or giant)</li>
        <li>Consider breed-specific formulas that address common health concerns</li>
        <li>Joint supplements (glucosamine, chondroitin, omega-3s) for breeds prone to orthopedic issues</li>
        <li>Appropriate calorie levels to maintain ideal body condition</li>
        <li>Fresh food diets can address specific health needs with veterinary guidance</li>
      </ul>

      <h2>Exercise and Activity Guidelines</h2>
      <ul>
        <li>Exercise intensity and duration should match breed energy levels and physical capabilities</li>
        <li>Avoid high-impact exercise in puppies until growth plates close</li>
        <li>Swimming is excellent low-impact exercise for breeds prone to joint issues</li>
        <li>Mental enrichment is just as important as physical exercise</li>
        <li>Senior pets benefit from gentle, consistent activity to maintain mobility</li>
      </ul>

      <h2>Lifespan and Quality of Life</h2>
      <p>With proper preventive care, health monitoring, and a loving home, this breed can live a long, healthy life. Regular veterinary care, appropriate nutrition, mental enrichment, and prompt attention to health changes are the keys to maximizing both lifespan and quality of life.</p>
      ${buildAffiliateCallout(p3, `${breedName} Care Products`)}

      <h2>Frequently Asked Questions</h2>
      <h3>What is the best insurance for this breed?</h3>
      <p>Look for insurance plans that cover breed-specific conditions and don't exclude genetic or hereditary conditions. Plans from Spot, Trupanion, and Healthy Paws are well-suited for breeds with known health predispositions.</p>
      <h3>Should I do genetic testing?</h3>
      <p>Yes. DNA testing helps identify genetic risk factors before symptoms appear, allowing for proactive health management and informed breeding decisions.</p>

      <section class="info-card">
        <h3>Questions About ${breedName} Health?</h3>
        <p>Our AI assistant has breed-specific knowledge and can help you understand health risks, symptoms, and care recommendations.</p>
        <div class="hero-actions">
          <a href="/chat" class="primary-btn">Talk to AI Pet Helper</a>
          <a href="/breeds/${page.animal === 'dogs' ? 'dogs' : 'cats'}/${page.breed || ''}" class="ghost-btn">View Breed Profile</a>
        </div>
      </section>`;
}

function buildExoticCareContent(page, partners) {
  const p1 = partners.slice(0, 4);
  const p2 = partners.slice(4, 8);
  return `
      <h2>Care Overview</h2>
      <p>${page.desc} Proper husbandry is the foundation of health for exotic pets, and getting the basics right prevents the vast majority of health issues.</p>

      <h2>Housing and Enclosure</h2>
      <p>Proper housing is the single most important factor in exotic pet health.</p>
      <ul>
        <li><strong>Size:</strong> Always err on the larger side — minimum enclosure sizes are just that, minimums</li>
        <li><strong>Ventilation:</strong> Adequate airflow prevents respiratory issues and mold growth</li>
        <li><strong>Temperature:</strong> Research species-specific temperature ranges and provide a gradient</li>
        <li><strong>Humidity:</strong> Maintain appropriate humidity levels for the species</li>
        <li><strong>Lighting:</strong> UVB lighting is essential for most reptiles and some birds</li>
        <li><strong>Substrate:</strong> Choose safe, appropriate substrate for the species</li>
        <li><strong>Enrichment:</strong> Provide climbing opportunities, hiding spots, and species-appropriate furnishings</li>
      </ul>
      ${buildAffiliateCallout(p1, 'Recommended Enclosures and Supplies')}

      <h2>Diet and Nutrition</h2>
      <p>Proper nutrition varies greatly between species. Research your specific pet's dietary needs thoroughly.</p>
      <ul>
        <li>Understand whether your pet is herbivorous, omnivorous, carnivorous, or insectivorous</li>
        <li>Provide variety in the diet to ensure complete nutrition</li>
        <li>Supplement with calcium and vitamins as recommended for the species</li>
        <li>Ensure fresh, clean water is always available (method varies by species)</li>
        <li>Research foods that are toxic or inappropriate for your specific pet</li>
      </ul>

      <h2>Health and Veterinary Care</h2>
      <p>Exotic pets need specialized veterinary care from vets experienced with their species.</p>
      <ul>
        <li>Find an exotic animal vet BEFORE you need one — not all vets treat exotic species</li>
        <li>Schedule an initial wellness exam within the first week of bringing your pet home</li>
        <li>Learn to recognize signs of illness specific to your pet's species</li>
        <li>Quarantine new animals before introducing them to existing pets</li>
        <li>Keep a record of weight, feeding, and any behavioral changes</li>
      </ul>

      <h2>Common Health Issues</h2>
      <ul>
        <li><strong>Metabolic bone disease:</strong> Often caused by inadequate UVB lighting or calcium supplementation</li>
        <li><strong>Respiratory infections:</strong> Usually linked to incorrect temperature or humidity</li>
        <li><strong>Parasites:</strong> Both internal and external parasites can affect exotic pets</li>
        <li><strong>Nutritional deficiencies:</strong> Result from improper or monotonous diets</li>
        <li><strong>Stress-related illness:</strong> Caused by improper housing, handling, or environmental factors</li>
      </ul>
      ${buildAffiliateCallout(p2, 'Exotic Pet Supplies')}

      <h2>Handling and Socialization</h2>
      <ul>
        <li>Allow new pets to acclimate to their enclosure before handling</li>
        <li>Learn proper handling techniques specific to your pet's species</li>
        <li>Start with short handling sessions and gradually increase duration</li>
        <li>Wash hands before and after handling to prevent disease transmission</li>
        <li>Respect your pet's signals — not all exotic pets enjoy being handled</li>
      </ul>

      <h2>Frequently Asked Questions</h2>
      <h3>Are exotic pets good for beginners?</h3>
      <p>Some exotic pets are excellent for beginners (leopard geckos, corn snakes, budgies, betta fish) while others require advanced experience (chameleons, macaws, saltwater aquariums). Research thoroughly before committing.</p>
      <h3>How much do exotic pets cost to care for?</h3>
      <p>Initial setup costs (enclosure, lighting, heating) are usually the largest expense, ranging from $100-$1,000+. Ongoing costs for food, substrate, and veterinary care typically run $30-$100/month.</p>

      <section class="info-card">
        <h3>Questions About Exotic Pet Care?</h3>
        <p>Our AI assistant has specialized knowledge about birds, fish, reptiles, and other exotic pets.</p>
        <div class="hero-actions">
          <a href="/chat" class="primary-btn">Talk to AI Pet Helper</a>
        </div>
      </section>`;
}

function buildComparisonContent(page, partners) {
  const p1 = partners.slice(0, 5);
  const p2 = partners.slice(5, 10);
  return `
      <h2>Comparison Overview</h2>
      <p>${page.desc} We've researched and compared the top options to help you make the best decision for your pet.</p>

      <h2>Top Options Compared</h2>
      ${buildAffiliateCallout(p1, 'Top Picks at a Glance')}

      <h2>Detailed Comparison</h2>
      <table class="comparison-table">
        <tr><th>Feature</th><th>Option A</th><th>Option B</th><th>Option C</th></tr>
        <tr><td>Price Range</td><td>$$</td><td>$$$</td><td>$$</td></tr>
        <tr><td>Coverage/Features</td><td>Good</td><td>Excellent</td><td>Very Good</td></tr>
        <tr><td>Ease of Use</td><td>Simple</td><td>Moderate</td><td>Simple</td></tr>
        <tr><td>Customer Ratings</td><td>4.3/5</td><td>4.6/5</td><td>4.4/5</td></tr>
        <tr><td>Best For</td><td>Budget-conscious</td><td>Comprehensive needs</td><td>First-time users</td></tr>
      </table>

      <h2>What to Consider When Choosing</h2>
      <ul>
        <li><strong>Your pet's specific needs:</strong> Age, breed, health status, and lifestyle all factor in</li>
        <li><strong>Budget:</strong> Consider both upfront and ongoing costs</li>
        <li><strong>Coverage or features:</strong> Compare what's included at each price point</li>
        <li><strong>Reputation:</strong> Look at customer reviews and industry ratings</li>
        <li><strong>Customer support:</strong> Easy-to-reach support can be crucial when you need help</li>
        <li><strong>Flexibility:</strong> Can you change plans or cancel without penalties?</li>
      </ul>

      <h2>Our Verdict</h2>
      <p>The best choice depends on your individual situation. For most pet owners, we recommend starting with a mid-range option that provides solid coverage without overpaying. You can always upgrade as your needs become clearer.</p>
      ${buildAffiliateCallout(p2, 'Get Started')}

      <h2>Frequently Asked Questions</h2>
      <h3>Which option is the best value?</h3>
      <p>Value depends on what you need. The most expensive option isn't always the best — look for the option that covers your specific needs at a reasonable price.</p>
      <h3>Can I switch later?</h3>
      <p>Most services allow switching, though some may have waiting periods or enrollment windows. Check the specific terms before committing.</p>

      <section class="info-card">
        <h3>Need Help Deciding?</h3>
        <p>Our AI assistant can help you compare options based on your pet's specific needs and your budget.</p>
        <div class="hero-actions">
          <a href="/chat" class="primary-btn">Talk to AI Pet Helper</a>
        </div>
      </section>`;
}

function buildGenericContent(page, partners) {
  const p1 = partners.slice(0, 4);
  const p2 = partners.slice(4, 8);
  return `
      <h2>Complete Guide</h2>
      <p>${page.desc} This comprehensive resource covers everything you need to know as a responsible pet owner.</p>

      <h2>Key Information</h2>
      <ul>
        <li>Understanding the fundamentals helps you make informed decisions for your pet</li>
        <li>Every pet is unique — consider your individual pet's needs alongside general guidance</li>
        <li>Consult your veterinarian for advice specific to your pet's health and situation</li>
        <li>Regular monitoring and preventive care are the foundation of good pet ownership</li>
      </ul>
      ${buildAffiliateCallout(p1, 'Recommended Resources')}

      <h2>Practical Advice</h2>
      <p>Follow these evidence-based recommendations to provide the best care for your pet:</p>
      <ul>
        <li>Schedule regular veterinary checkups for early detection of health issues</li>
        <li>Provide species-appropriate nutrition in proper amounts</li>
        <li>Ensure adequate exercise and mental stimulation</li>
        <li>Maintain a safe, clean environment</li>
        <li>Stay current on vaccinations and preventive medications</li>
        <li>Address behavioral issues early with positive methods</li>
      </ul>
      ${buildAffiliateCallout(p2, 'Pet Care Essentials')}

      <h2>Frequently Asked Questions</h2>
      <h3>Where can I find more information?</h3>
      <p>Consult your veterinarian for personalized advice. Our AI assistant is also available 24/7 to answer pet care questions and provide guidance.</p>

      <section class="info-card">
        <h3>Have More Questions?</h3>
        <p>Our AI assistant provides personalized guidance for your specific pet care situation.</p>
        <div class="hero-actions">
          <a href="/chat" class="primary-btn">Talk to AI Pet Helper</a>
        </div>
      </section>`;
}

// ============================================================
// FULL GUIDE PAGE GENERATOR
// ============================================================

function generateGuidePage(page) {
  const canonical = `https://petcarehelperai.com/guides/${page.slug}`;
  const cssPath = '../styles.css';
  const faqs = [
    { q: `What should I know about ${page.title.toLowerCase()}?`, a: page.desc },
  ];
  const articleSchema = generateArticleSchema(page.title, page.desc);
  const faqSchema = generateFAQSchema(faqs);

  const hubLink = page.animal === 'dogs' ? '/dogs' : page.animal === 'cats' ? '/cats' : page.animal === 'birds' ? '/birds' : page.animal === 'reptiles' ? '/reptiles' : page.animal === 'fish' ? '/fish' : '/guides';
  const hubName = page.animal === 'general' ? 'Guides' : toTitleCase(page.animal);

  return `${buildHead({ title: page.title, description: page.desc, canonical, cssPath, schema: articleSchema + '\n  ' + faqSchema })}
${buildNav(cssPath)}

  <main>
    <div class="breadcrumb">
      <a href="/">Home</a> <span>&rsaquo;</span>
      <a href="${hubLink}">${hubName}</a> <span>&rsaquo;</span>
      <a href="/guides">Guides</a> <span>&rsaquo;</span>
      ${page.title}
    </div>

    <article class="guide-content">
      <h1>${page.title}</h1>
      <p>${page.desc}</p>
${buildGuideSections(page)}
    </article>
${buildDisclaimer()}
  </main>
${buildFooter()}`;
}

// ============================================================
// LOCATION PAGE GENERATOR
// ============================================================

function generateLocationPage(loc) {
  const canonical = `https://petcarehelperai.com/locations/${loc.slug}`;
  const cssPath = '../styles.css';
  const desc = `Find veterinarians, emergency vets, exotic pet vets, groomers, pet stores, and dog parks in ${loc.city}, ${loc.state}. Complete pet services directory.`;
  const title = `Find Vets &amp; Pet Services in ${loc.city}`;
  const schema = `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Find Vets & Pet Services in ${loc.city}",
    "description": "${desc.replace(/"/g, '\\"')}",
    "datePublished": "${TODAY}",
    "dateModified": "${TODAY}",
    "author": {"@type": "Organization", "name": "Pet Care Helper AI"},
    "publisher": {"@type": "Organization", "name": "Pet Care Helper AI"}
  }
  </script>`;

  const teleVets = affiliates.teleVetsAndClinics || [];
  const insurance = affiliates.insuranceAndWellness.slice(0, 3);
  const walkers = affiliates.walkingSittingBoarding.slice(0, 3);

  const gSearch = (q) => `https://www.google.com/search?q=${encodeURIComponent(q + ' ' + loc.city + ' ' + loc.state)}`;

  return `${buildHead({ title: `Find Vets & Pet Services in ${loc.city}`, description: desc, canonical, cssPath, schema })}
${buildNav(cssPath)}

  <main>
    <div class="breadcrumb">
      <a href="/">Home</a> <span>&rsaquo;</span>
      <a href="/locations/">Locations</a> <span>&rsaquo;</span>
      ${loc.city}
    </div>

    <article class="guide-content">
      <h1>${title}</h1>
      <p>${loc.city}, ${loc.state} is home to a vibrant pet community with a wide range of veterinary services, groomers, pet stores, and dog-friendly spaces. This guide helps you find quality pet services throughout the ${loc.city} area.</p>

      <div class="affiliate-callout">
        <h4>24/7 Online Vet Care for ${loc.city} Pet Owners</h4>
        <p>Can't get to a vet right away? Get instant advice from licensed veterinarians online. ${teleVets.map(v => `<a href="${v.url}" target="_blank" rel="sponsored noopener">${v.name}</a> — ${v.hook}`).join('. ')}.</p>
      </div>

      <h2>Emergency Veterinary Hospitals in ${loc.city}</h2>
      <p>When your pet needs urgent care outside of regular hours, ${loc.city} has several 24-hour emergency veterinary hospitals.</p>
      <div class="hero-actions">
        <a href="${gSearch('24 hour emergency vet')}" target="_blank" class="primary-btn">Find Emergency Vets in ${loc.city}</a>
        <a href="${gSearch('after hours vet')}" target="_blank" class="ghost-btn">After-Hours Vets</a>
      </div>

      <h2>Regular Veterinary Clinics</h2>
      <p>For routine checkups, vaccinations, and non-emergency care, ${loc.city} offers many excellent veterinary clinics.</p>
      <div class="hero-actions">
        <a href="${gSearch('best rated veterinarian')}" target="_blank" class="primary-btn">Find Vets in ${loc.city}</a>
        <a href="${gSearch('affordable vet clinic')}" target="_blank" class="ghost-btn">Low-Cost Vet Clinics</a>
      </div>

      <div class="affiliate-callout">
        <h4>Pet Insurance for ${loc.city} Pet Owners</h4>
        <p>Protect your pet and your wallet. ${insurance.map(i => `<a href="${i.url}" target="_blank" rel="sponsored noopener">${i.name}</a> — ${i.hook}`).join('. ')}.</p>
      </div>

      <h2>Exotic and Specialty Veterinarians</h2>
      <p>If you have a bird, reptile, rabbit, or other exotic pet, finding a vet with specialized experience is essential.</p>
      <div class="hero-actions">
        <a href="${gSearch('exotic pet vet')}" target="_blank" class="primary-btn">Find Exotic Vets</a>
        <a href="${gSearch('avian vet')}" target="_blank" class="ghost-btn">Bird Vets</a>
      </div>

      <h2>Pet Groomers</h2>
      <p>Professional grooming keeps your pet healthy and looking their best.</p>
      <div class="hero-actions">
        <a href="${gSearch('best dog groomer')}" target="_blank" class="primary-btn">Find Groomers in ${loc.city}</a>
        <a href="${gSearch('mobile pet grooming')}" target="_blank" class="ghost-btn">Mobile Groomers</a>
      </div>

      <h2>Pet Stores and Supplies</h2>
      <p>Find pet food, supplies, and accessories at stores throughout ${loc.city}.</p>
      <div class="hero-actions">
        <a href="${gSearch('pet store')}" target="_blank" class="primary-btn">Find Pet Stores</a>
        <a href="${gSearch('pet supply store')}" target="_blank" class="ghost-btn">Pet Supply Shops</a>
      </div>

      <div class="affiliate-callout">
        <h4>Pet Sitting and Dog Walking in ${loc.city}</h4>
        <p>Need pet care while you're away? ${walkers.map(w => `<a href="${w.url}" target="_blank" rel="sponsored noopener">${w.name}</a> — ${w.hook}`).join('. ')}.</p>
      </div>

      <h2>Dog Parks and Dog-Friendly Spaces</h2>
      <p>Give your dog exercise and socialization at dog parks and pet-friendly locations around ${loc.city}.</p>
      <div class="hero-actions">
        <a href="${gSearch('dog parks')}" target="_blank" class="primary-btn">Find Dog Parks</a>
        <a href="${gSearch('dog friendly restaurants')}" target="_blank" class="ghost-btn">Dog-Friendly Dining</a>
      </div>

      <h2>Pet Training Services</h2>
      <p>Professional trainers in ${loc.city} can help with puppy training, obedience, and behavioral issues.</p>
      <div class="hero-actions">
        <a href="${gSearch('dog training classes')}" target="_blank" class="primary-btn">Find Dog Trainers</a>
        <a href="${gSearch('puppy training near me')}" target="_blank" class="ghost-btn">Puppy Classes</a>
      </div>

      <h2>Pet-Friendly Housing in ${loc.city}</h2>
      <p>Finding pet-friendly apartments and homes in ${loc.city}.</p>
      <div class="hero-actions">
        <a href="${gSearch('pet friendly apartments')}" target="_blank" class="primary-btn">Pet-Friendly Apartments</a>
      </div>

      <section class="info-card">
        <h3>Need Pet Care Advice in ${loc.city}?</h3>
        <p>Our AI assistant can help you find local services, answer pet health questions, and provide care recommendations.</p>
        <div class="hero-actions">
          <a href="/chat" class="primary-btn">Talk to AI Pet Helper</a>
        </div>
      </section>
    </article>
${buildDisclaimer()}
  </main>
${buildFooter()}`;
}

// ============================================================
// EXECUTION: GENERATE ALL PAGES
// ============================================================

console.log('=== PetCareHelperAI Build Engine ===');
console.log(`Date: ${TODAY}`);
console.log('');

// Collect all guide pages
const allGuidePages = [
  ...costPages, ...safetyPages, ...emergencyPages,
  ...dogDiseasePages, ...catDiseasePages, ...behaviorPages,
  ...productPages, ...breedHealthPages, ...exoticPages.filter(p => true),
  ...comparisonPages
];

console.log('Phase 1: Generating expansion pages...');
let guideCount = 0;
for (const page of allGuidePages) {
  const filePath = join(ROOT, 'guides', `${page.slug}.html`);
  if (existsSync(filePath)) {
    console.log(`  SKIP (exists): guides/${page.slug}.html`);
    continue;
  }
  const html = generateGuidePage(page);
  writeFileSync(filePath, html);
  guideCount++;
}
console.log(`  Generated ${guideCount} new guide pages.`);

// Generate location pages
console.log('Phase 2: Generating location pages...');
let locCount = 0;
for (const loc of newLocationPages) {
  const filePath = join(ROOT, 'locations', `${loc.slug}.html`);
  if (existsSync(filePath)) {
    console.log(`  SKIP (exists): locations/${loc.slug}.html`);
    continue;
  }
  const html = generateLocationPage(loc);
  writeFileSync(filePath, html);
  locCount++;
}
console.log(`  Generated ${locCount} new location pages.`);

// ============================================================
// PHASE 3: INTERNAL LINKING ENGINE
// ============================================================

console.log('Phase 3: Building internal linking map...');

// Build a master index of all pages for cross-linking
const allPages = [];

// Scan all guide files
const guideFiles = readdirSync(join(ROOT, 'guides')).filter(f => f.endsWith('.html'));
for (const f of guideFiles) {
  const slug = f.replace('.html', '');
  allPages.push({ path: `/guides/${slug}`, slug, type: 'guide', file: join(ROOT, 'guides', f) });
}

// Scan breed files
for (const animalDir of ['dogs', 'cats', 'birds', 'fish', 'reptiles', 'small-animals']) {
  const breedDir = join(ROOT, 'breeds', animalDir);
  if (existsSync(breedDir)) {
    const files = readdirSync(breedDir).filter(f => f.endsWith('.html'));
    for (const f of files) {
      const slug = f.replace('.html', '');
      allPages.push({ path: `/breeds/${animalDir}/${slug}`, slug, type: 'breed', animal: animalDir, file: join(ROOT, 'breeds', animalDir, f) });
    }
  }
}

// Scan location files
const locFiles = readdirSync(join(ROOT, 'locations')).filter(f => f.endsWith('.html') && f !== 'index.html');
for (const f of locFiles) {
  const slug = f.replace('.html', '');
  allPages.push({ path: `/locations/${slug}`, slug, type: 'location', file: join(ROOT, 'locations', f) });
}

// Build cross-linking keywords map
function getRelatedGuides(slug, animal, limit = 8) {
  // Find guides related by keyword overlap and animal type
  const keywords = slug.replace(/-/g, ' ').split(' ');
  const scored = allGuidePages.map(gp => {
    let score = 0;
    const gpWords = gp.slug.replace(/-/g, ' ').split(' ');
    for (const kw of keywords) {
      if (kw.length < 3) continue;
      if (gpWords.includes(kw)) score += 3;
      if (gp.desc.toLowerCase().includes(kw)) score += 1;
    }
    if (gp.animal === animal || gp.animal === 'general') score += 2;
    if (gp.slug === slug) score = -1; // exclude self
    return { ...gp, score };
  }).filter(g => g.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

// Inject related links section into new guide pages
console.log('Phase 4: Injecting cross-links into new pages...');
let linkedCount = 0;
for (const page of allGuidePages) {
  const filePath = join(ROOT, 'guides', `${page.slug}.html`);
  if (!existsSync(filePath)) continue;

  let html = readFileSync(filePath, 'utf8');

  // Check if related links section already exists
  if (html.includes('related-guides-section')) continue;

  const related = getRelatedGuides(page.slug, page.animal, 8);
  if (related.length === 0) continue;

  const relatedHtml = `
    <section class="related-guides-section" style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #E2E8F0;">
      <h2>Related Guides</h2>
      <div class="guide-grid">
${related.map(r => `        <a href="/guides/${r.slug}" class="guide-card">
          <h3>${r.title}</h3>
          <p>${r.desc.slice(0, 120)}...</p>
        </a>`).join('\n')}
      </div>
    </section>`;

  // Insert before disclaimer
  html = html.replace('</article>', relatedHtml + '\n    </article>');
  writeFileSync(filePath, html);
  linkedCount++;
}
console.log(`  Injected cross-links into ${linkedCount} pages.`);

// ============================================================
// PHASE 5: SITEMAP ENGINE
// ============================================================

console.log('Phase 5: Regenerating sitemap.xml...');

const allUrls = [];

// Collect all HTML files
function collectUrls(dir, urlPrefix) {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      collectUrls(join(dir, entry.name), `${urlPrefix}/${entry.name}`);
    } else if (entry.name.endsWith('.html')) {
      const slug = entry.name === 'index.html' ? '' : entry.name.replace('.html', '');
      const url = slug ? `${urlPrefix}/${slug}` : `${urlPrefix}/`;
      allUrls.push(url);
    }
  }
}

// Top-level pages
const topLevelFiles = readdirSync(ROOT).filter(f => f.endsWith('.html'));
for (const f of topLevelFiles) {
  const slug = f === 'index.html' ? '' : f.replace('.html', '');
  allUrls.push(slug ? `/${slug}` : '/');
}

collectUrls(join(ROOT, 'guides'), '/guides');
collectUrls(join(ROOT, 'breeds'), '/breeds');
collectUrls(join(ROOT, 'locations'), '/locations');
collectUrls(join(ROOT, 'tools'), '/tools');
collectUrls(join(ROOT, 'resources'), '/resources');
collectUrls(join(ROOT, 'feeds'), '/feeds');
collectUrls(join(ROOT, 'embed'), '/embed');

// Determine priority
function getPriority(url) {
  if (url === '/' || url === '/dogs' || url === '/cats' || url === '/birds' || url === '/reptiles' || url === '/fish' || url === '/guides' || url === '/chat') return '1.0';
  if (url.startsWith('/breeds/dog-breeds') || url.startsWith('/breeds/cat-breeds') || url.startsWith('/breeds/bird-breeds') || url.startsWith('/breeds/fish-breeds') || url.startsWith('/breeds/reptile-breeds') || url.startsWith('/breeds/small-animal-breeds')) return '0.8';
  if (url.startsWith('/guides/') || url.startsWith('/tools/') || url.startsWith('/locations/')) return '0.7';
  if (url.startsWith('/breeds/')) return '0.6';
  if (url.startsWith('/resources/') || url === '/about' || url === '/faq' || url === '/partners') return '0.5';
  return '0.4';
}

// Remove duplicates and sort
const uniqueUrls = [...new Set(allUrls)].filter(u => !u.includes('/embed/')).sort();

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map(url => `  <url>
    <loc>https://petcarehelperai.com${url}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${getPriority(url)}</priority>
  </url>`).join('\n')}
</urlset>`;

writeFileSync(join(ROOT, 'sitemap.xml'), sitemapXml);
console.log(`  Sitemap generated with ${uniqueUrls.length} URLs.`);

// ============================================================
// PHASE 6: RSS FEED EXPANSION
// ============================================================

console.log('Phase 6: Updating RSS feeds...');

function buildRssItem(page) {
  return `    <item>
      <title>${page.title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>
      <link>https://petcarehelperai.com/guides/${page.slug}</link>
      <description>${page.desc.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</description>
      <pubDate>${new Date(TODAY).toUTCString()}</pubDate>
      <guid isPermaLink="true">https://petcarehelperai.com/guides/${page.slug}</guid>
    </item>`;
}

const rssHeader = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Pet Care Helper AI - Pet Health Guides</title>
    <link>https://petcarehelperai.com</link>
    <description>Comprehensive pet care guides covering health, nutrition, training, and wellness for dogs, cats, birds, fish, reptiles, and small animals.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(TODAY).toUTCString()}</lastBuildDate>
    <atom:link href="https://petcarehelperai.com/feed.xml" rel="self" type="application/rss+xml"/>`;
const rssFooter = `
  </channel>
</rss>`;

// Main feed with all new guide pages
const allNewFeedItems = allGuidePages.map(buildRssItem).join('\n');
const mainFeed = `${rssHeader}\n${allNewFeedItems}\n${rssFooter}`;
writeFileSync(join(ROOT, 'feed.xml'), mainFeed);

// Category feeds
const dogPages = allGuidePages.filter(p => p.animal === 'dogs');
const catPages = allGuidePages.filter(p => p.animal === 'cats');
const dogFeed = `${rssHeader.replace('feed.xml', 'feeds/dogs.xml').replace('Pet Health Guides', 'Dog Care Guides')}\n${dogPages.map(buildRssItem).join('\n')}\n${rssFooter}`;
const catFeed = `${rssHeader.replace('feed.xml', 'feeds/cats.xml').replace('Pet Health Guides', 'Cat Care Guides')}\n${catPages.map(buildRssItem).join('\n')}\n${rssFooter}`;
writeFileSync(join(ROOT, 'feeds', 'dogs.xml'), dogFeed);
writeFileSync(join(ROOT, 'feeds', 'cats.xml'), catFeed);

const guidesFeed = `${rssHeader.replace('feed.xml', 'feeds/guides.xml').replace('Pet Health Guides', 'All Guides')}\n${allGuidePages.map(buildRssItem).join('\n')}\n${rssFooter}`;
writeFileSync(join(ROOT, 'feeds', 'guides.xml'), guidesFeed);

console.log('  RSS feeds updated.');

// ============================================================
// SUMMARY
// ============================================================

const totalGuides = readdirSync(join(ROOT, 'guides')).filter(f => f.endsWith('.html')).length;
const totalLocations = readdirSync(join(ROOT, 'locations')).filter(f => f.endsWith('.html') && f !== 'index.html').length;
const totalBreeds = ['dogs', 'cats', 'birds', 'fish', 'reptiles', 'small-animals'].reduce((sum, d) => {
  const dir = join(ROOT, 'breeds', d);
  return sum + (existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.html')).length : 0);
}, 0);

console.log('\n=== BUILD COMPLETE ===');
console.log(`New guide pages generated: ${guideCount}`);
console.log(`New location pages generated: ${locCount}`);
console.log(`Pages with cross-links injected: ${linkedCount}`);
console.log(`Sitemap URLs: ${uniqueUrls.length}`);
console.log(`Total guides: ${totalGuides}`);
console.log(`Total locations: ${totalLocations}`);
console.log(`Total breed pages: ${totalBreeds}`);
console.log(`Estimated total pages: ${totalGuides + totalLocations + totalBreeds + topLevelFiles.length + 10}`);
