#!/usr/bin/env node
/**
 * fingerprint-eliminator.js
 *
 * Reduces high-frequency verbatim phrases across the site by replacing each
 * occurrence with one of N variant rewrites chosen deterministically from a
 * hash of the file path. Neighbor pages receive different variants, so no
 * single sentence dominates the site.
 *
 * Preserves breed/city tokens captured from the source text. Preserves HTML.
 * Skips files under node_modules/, .netlify/, engines/, data/, audit/.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

function hashPick(filePath, patternId, poolSize) {
  const h = crypto.createHash('sha1').update(filePath + '|' + patternId).digest();
  return h.readUInt32BE(0) % poolSize;
}

// Each rule: { id, name, regex (must capture breed/city token if any), variants }
// Variants use ${T} to inject the captured token (index 1 of match). Where no
// token applies, ${T} is empty.
const RULES = [
  {
    id: 'commercial-observe',
    name: 'Every {X} is different, so observe...',
    regex: /Every ([A-Za-z][A-Za-z0-9 '\u2019\-]{1,60}?) is different, so observe how yours responds and adjust your approach based on what works\./g,
    variants: [
      (T) => `No two ${T} behave exactly alike, so let your own pet's cues guide the small adjustments that matter.`,
      (T) => `Because each ${T} is its own animal, treat any general guideline as a starting point and refine from there.`,
      (T) => `Watch your individual ${T} for feedback signals, and tune routines to the patterns you actually see.`,
      (T) => `Your ${T} will show you what works through appetite, energy, coat, and behavior, adjust based on that evidence.`,
      (T) => `Treat published advice as a framework, then shape it around the particular ${T} sitting in your home.`,
      (T) => `Any care plan for a ${T} improves when it reflects the quirks of the specific animal, not a generic profile.`,
      (T) => `Expect some trial and error, a ${T} tends to signal clearly when something fits and when it does not.`,
      (T) => `Let the ${T} in front of you, not an idealized version, drive the pace of any new routine.`,
      (T) => `Small tweaks based on how your ${T} actually reacts usually beat rigid adherence to a template.`,
      (T) => `Use this as a baseline, the right rhythm for your ${T} tends to reveal itself within a few weeks.`,
      (T) => `Observe closely during the first month; your ${T} will tell you which parts of the routine to keep.`,
      (T) => `Generic recommendations are a reasonable starting point, but the ${T} you live with ultimately sets the standard.`,
    ],
  },
  {
    id: 'commercial-overlooked',
    name: 'This area of {X} ownership often gets overlooked...',
    regex: /This area of ([A-Za-z][A-Za-z0-9 '\u2019\-]{1,60}?) ownership often gets overlooked, but it plays a meaningful role in long-term health and happiness\.?\s*/g,
    variants: [
      (T) => `Owners sometimes skip past this when planning for a ${T}, yet it quietly shapes quality of life across the years. `,
      (T) => `It is easy to treat this corner of ${T} care as optional, the animals that thrive usually prove otherwise. `,
      (T) => `Planning for a ${T} tends to focus on the obvious topics; this one rewards attention that few owners give it. `,
      (T) => `People often underestimate how much this piece of a ${T}'s routine influences later health outcomes. `,
      (T) => `Among the many details of ${T} care, this is the one most households delay, and regret delaying. `,
      (T) => `This part of life with a ${T} is less glamorous than training or diet, but its effect compounds over time. `,
      (T) => `Few checklists for a ${T} emphasize this, yet veterinarians flag it repeatedly for a reason. `,
      (T) => `A ${T} tends to reveal the payoff of this kind of attention gradually, rather than in a single dramatic moment. `,
      (T) => `If you are optimizing a ${T}'s routine, this is one of the higher-leverage items to get right early. `,
      (T) => `Experienced ${T} owners often cite this as the factor they wish they had taken more seriously at the start. `,
    ],
  },
  {
    id: 'commercial-invest-time',
    name: 'Owners who invest time in understanding {X}...',
    regex: /Owners who invest time in understanding ([A-Za-z][A-Za-z0-9 '\u2019\-]{1,60}?)'s particular needs typically spend less on corrective care and enjoy a stronger bond with their dog\.?/g,
    variants: [
      (T) => `Households that take the time to learn ${T}-specific patterns tend to avoid expensive corrective work later.`,
      (T) => `Upfront effort to understand how a ${T} actually operates usually pays dividends in fewer vet emergencies.`,
      (T) => `Owners who study the ${T} closely, not in the abstract but the pet in front of them, report better outcomes across the board.`,
      (T) => `The trade-off is simple: a few hours reading about ${T} behavior now versus larger bills and stress later.`,
      (T) => `Investing in ${T} knowledge early is one of the cheapest insurance policies available to an owner.`,
      (T) => `Owners who bother to understand the ${T}'s natural tendencies usually build deeper trust with the animal too.`,
      (T) => `A little curiosity about how the ${T} is wired goes a long way toward preventing avoidable missteps.`,
      (T) => `The habits that keep a ${T} healthy long-term almost always start with an owner willing to learn.`,
      (T) => `Owners who engage with ${T}-specific guidance, rather than generic pet advice, tend to spot problems sooner.`,
      (T) => `Understanding a ${T} as a ${T}, not just as "a pet," changes the quality of every decision that follows.`,
    ],
  },
  {
    id: 'commercial-tailor',
    name: 'The more you tailor your approach to {X}...',
    regex: /The more you tailor your approach to ([A-Za-z][A-Za-z0-9 '\u2019\-]{1,60}?)'s individual characteristics, the more responsive and healthy they tend to be\.?/g,
    variants: [
      (T) => `The closer your routine tracks the ${T}'s specific traits, the easier everything downstream becomes.`,
      (T) => `A care plan fitted to this particular ${T} almost always produces better behavior and better health markers.`,
      (T) => `Every time you adjust for something the ${T} actually does, rather than what breed profiles predict, results improve.`,
      (T) => `Fine-tuning for a specific ${T} feels like extra work; in practice it removes more friction than it adds.`,
      (T) => `The owners who do best with a ${T} treat the animal as an individual first and a breed member second.`,
      (T) => `General ${T} advice is a starting point; the real gains come from customizing to the animal you live with.`,
      (T) => `A ${T} responds quickly when their routine matches their temperament, habitat, and age rather than a template.`,
      (T) => `Adapt to the ${T} sitting in your home and you will almost always outperform a by-the-book approach.`,
      (T) => `Health and behavior metrics for a ${T} tend to trend upward whenever the plan becomes more specific.`,
      (T) => `Personalization beats protocol: the more the routine reflects this ${T}, the better the outcomes.`,
    ],
  },
  {
    id: 'commercial-paying-attention',
    name: 'Paying attention to the details specific to {X}...',
    regex: /Paying attention to the details specific to ([A-Za-z][A-Za-z0-9 '\u2019\-]{1,60}?)\s*[\u2014\-]{1,2}\s*rather than following generic advice\s*[\u2014\-]{1,2}\s*leads to better outcomes across the board\.?/g,
    variants: [
      (T) => `Leaning into ${T}-specific detail, instead of one-size-fits-all advice, consistently yields better results.`,
      (T) => `Generic guidance is a floor; it is the ${T}-specific nuance that raises the ceiling on outcomes.`,
      (T) => `The broader the pet advice, the less it applies to a real ${T}; narrow and specific wins.`,
      (T) => `Care plans built around ${T}-level detail tend to make fewer mistakes than care plans built around averages.`,
      (T) => `Every ${T} benefits from an owner willing to dig below surface-level recommendations.`,
      (T) => `When in doubt, choose the guidance that names the ${T} explicitly over the guidance that treats all pets alike.`,
      (T) => `${T}-aware routines catch issues earlier, respond faster, and prevent more than generic ones.`,
      (T) => `The signal in ${T}-specific advice usually outweighs the noise in generalized pet content.`,
      (T) => `Pay attention to what makes a ${T} a ${T}, and the rest of the care plan tends to click into place.`,
      (T) => `Narrow, breed-aware detail beats broad pet-care platitudes in nearly every scenario owners actually face.`,
    ],
  },
  {
    id: 'commercial-understanding-aspect',
    name: 'Understanding this aspect of {X} care helps...',
    regex: /Understanding this aspect of ([A-Za-z][A-Za-z0-9 '\u2019\-]{1,60}?) care helps you make informed decisions that directly affect your dog's wellbeing\.?\s*/g,
    variants: [
      (T) => `A clear picture of this side of ${T} care puts you in a better position to make decisions the animal can actually feel. `,
      (T) => `Once this part of ${T} care clicks, the downstream choices tend to come faster and land better. `,
      (T) => `Knowing how this works in a ${T} context removes a lot of the guesswork from day-to-day decisions. `,
      (T) => `Getting this right for a ${T} is less about perfection and more about making informed, repeatable calls. `,
      (T) => `Think of this as the knowledge layer that most ${T} owners skip and later wish they had started with. `,
      (T) => `Build literacy here and the rest of ${T} ownership becomes measurably less stressful. `,
      (T) => `Owners who understand this piece of ${T} care rarely default to worst-case reactions. `,
      (T) => `This is one of the topics where a few minutes of learning changes how you interact with your ${T} for years. `,
      (T) => `A solid grasp of this area lets you support your ${T} with intention rather than improvisation. `,
      (T) => `Master this layer of ${T} care and everything from feeding to vet visits becomes more predictable. `,
    ],
  },
  {
    id: 'commercial-individual-feeding',
    name: 'Every {X} is an individual. What works perfectly...',
    regex: /Every ([A-Za-z][A-Za-z0-9 '\u2019\-]{1,60}?) is an individual\.\s*What works perfectly for one may not suit another, which is why a veterinarian consultation rounds out any feeding plan\.?/g,
    variants: [
      (T) => `Each ${T} is its own case, so a short conversation with a veterinarian is the natural finishing step for any feeding plan.`,
      (T) => `No two ${T} eat, digest, or thrive identically; a veterinarian can personalize the plan beyond what any article can.`,
      (T) => `Use this as scaffolding, then let a veterinarian fit it to the specific ${T} you live with.`,
      (T) => `Because a feeding plan lives or dies on small personal details, loop in a veterinarian who has actually examined the ${T}.`,
      (T) => `A veterinarian who knows your ${T} will see variables an article cannot; treat their input as the final adjustment.`,
      (T) => `Articles can describe the shape of a good ${T} diet; only a veterinarian can tune it to the animal at home.`,
      (T) => `For the last mile of any ${T} feeding plan, a veterinarian's perspective usually beats another round of internet reading.`,
      (T) => `Every feeding plan for a ${T} should end with a brief veterinary check, especially after weight, age, or health changes.`,
    ],
  },
  {
    id: 'commercial-heads-up',
    name: 'Heads up: None of this replaces...',
    regex: /<strong>Heads up:<\/strong>\s*None of this replaces a conversation with your vet\.\s*Costs shown are ballpark figures\.\s*This page contains affiliate links that help keep the site running\.?/g,
    variants: [
      () => `<strong>Note:</strong> This guidance is not a substitute for veterinary advice. Figures are ballpark ranges, not quotes. Some links on this page are affiliate links that help support the site.`,
      () => `<strong>Worth knowing:</strong> Talk to your veterinarian before acting on anything here. Prices are rough estimates. A subset of outbound links pay a commission at no cost to you.`,
      () => `<strong>Before you act:</strong> Confirm anything medical with your own vet. Costs are approximate and vary by region. Some links are affiliate links that help fund ongoing research.`,
      () => `<strong>Quick context:</strong> Educational content, not veterinary advice. Costs cited are typical ranges, not guaranteed pricing. Affiliate links on this page help keep the site free.`,
      () => `<strong>Reader note:</strong> Treat this as background reading and confirm details with your own vet. Pricing reflects common ranges. Some of the product links earn a commission.`,
      () => `<strong>Up front:</strong> No part of this replaces an exam by your veterinarian. Cost figures are averages, not quotes. Select links on the page are affiliate links.`,
      () => `<strong>Just so you know:</strong> None of this overrides a veterinary opinion specific to your pet. Costs shown are averages. Some links pay a small affiliate commission.`,
      () => `<strong>Heads up:</strong> Use this to prepare questions for your vet, not to replace their input. Prices are typical ranges. Some outbound links are affiliate links.`,
    ],
  },
  {
    id: 'guides-prevention',
    name: 'Prevention-focused care tailored to breed characteristics...',
    regex: /Prevention-focused care tailored to breed characteristics reduces both health risks and long-term costs\.?\s*/g,
    variants: [
      () => `Care that anticipates breed-specific risks tends to lower both vet bills and avoidable health events. `,
      () => `When preventive routines align with known breed predispositions, the downstream savings compound over the pet's life. `,
      () => `Breed-aware prevention usually beats reactive treatment on both cost and quality-of-life measures. `,
      () => `Building prevention around a breed's documented risks is one of the higher-leverage calls an owner can make. `,
      () => `Preventive care calibrated to breed profile, rather than generic pet care, reliably shifts long-term outcomes. `,
      () => `The earlier routines reflect breed-specific vulnerabilities, the less expensive the later years tend to be. `,
      () => `Owners who structure prevention around breed data typically see fewer costly interventions down the road. `,
      () => `Tuning preventive care to the breed's known patterns reduces surprise diagnoses and the bills that follow. `,
    ],
  },
  {
    id: 'guides-insurance-secure',
    name: 'Securing pet insurance before any health issues arise...',
    regex: /Securing pet insurance before any health issues arise gives you the broadest coverage at the most reasonable cost\.?/g,
    variants: [
      () => `Buying pet insurance while the animal is still healthy almost always unlocks wider coverage at a lower premium.`,
      () => `Policies written before any diagnosis has been made tend to be cheaper and more comprehensive than those added later.`,
      () => `Insurance purchased pre-diagnosis gives you the fullest set of covered conditions and the best renewal pricing.`,
      () => `The single largest factor in pet-insurance value is enrolling before a pre-existing condition is documented.`,
      () => `Carriers reserve their best pricing and widest coverage for pets enrolled before symptoms or diagnoses appear.`,
      () => `Start coverage while the pet is healthy; premiums, exclusions, and claim experiences all improve meaningfully.`,
      () => `An early-enrollment policy typically covers more conditions at a better price than anything written after a diagnosis.`,
      () => `Insurance works best as a hedge, which is why buying a policy before any health event is the standard recommendation.`,
    ],
  },
  {
    id: 'guides-adapting-routine',
    name: "Adapting your care routine to your breed's specific needs...",
    regex: /Adapting your care routine to your breed's specific needs makes a real difference\.?\s*/g,
    variants: [
      () => `Small adjustments that reflect breed-specific needs add up to a meaningful shift in outcomes. `,
      () => `A routine shaped by breed particulars outperforms a generic routine in almost every measurable way. `,
      () => `Tailoring daily care to what the breed actually requires moves the needle on both comfort and health. `,
      () => `The routine that fits the breed tends to feel easier for the owner and better for the pet. `,
      () => `Breed-appropriate routines pay for themselves in reduced friction and fewer avoidable issues. `,
      () => `Customize the routine to what the breed is, not to what a general pet-care article assumes; the difference shows up fast. `,
      () => `Care decisions tuned to breed-level detail tend to stick, because they match the animal's actual behavior. `,
      () => `When the routine reflects what the breed was built for, most day-to-day care becomes simpler. `,
    ],
  },
  {
    id: 'locations-grooming',
    name: 'Professional pet groomers in {CITY} offer services...',
    regex: /Professional pet groomers in ([A-Za-z][A-Za-z0-9 ,\.\-]{1,60}?) offer services from basic bathing to breed-specific styling\. Check reviews, ask about their experience with your pet type, and verify they use gentle handling techniques\.?/g,
    variants: [
      (T) => `Groomers operating in ${T} handle everything from a straightforward bath to breed-tailored cuts; compare reviews, confirm species experience, and ask how they manage anxious animals before booking.`,
      (T) => `Grooming options in ${T} span full-service salons and solo operators, check portfolios for your breed, read recent reviews, and ask about low-stress handling practices.`,
      (T) => `When selecting a groomer in ${T}, prioritize confirmed breed experience, calm-handling protocols, and recent customer feedback over proximity alone.`,
      (T) => `${T}-area grooming runs from basic wash-and-brush to advanced show cuts; lean on reviews, breed familiarity, and handling approach when narrowing a short list.`,
      (T) => `Grooming services across ${T} vary widely in style and temperament; ask about experience with your breed, observe the environment, and note how they interact with nervous pets.`,
      (T) => `Look for groomers in ${T} who document their handling standards, show breed-specific work, and respond thoughtfully to questions before you commit.`,
      (T) => `Many groomers in ${T} accept breed-specific styling requests; request photos of similar work, verify sanitation practices, and confirm their approach to anxious animals.`,
      (T) => `A good groomer in ${T} should welcome a meet-and-greet; use that visit to assess cleanliness, temperament, and actual breed experience.`,
    ],
  },
  {
    id: 'locations-choosing-vet',
    name: 'When choosing a regular veterinarian in {CITY}...',
    regex: /When choosing a regular veterinarian in ([A-Za-z][A-Za-z0-9 ,\.\-]{1,60}?), consider location convenience, available services, and whether the clinic handles your pet's species\. Schedule a wellness visit to evaluate the clinic before an emergency arises\.?/g,
    variants: [
      (T) => `Selecting a primary veterinarian in ${T} comes down to proximity, service depth, species fit, and the intangible of whether the staff communicates clearly; a low-stakes wellness visit is the best way to judge all four.`,
      (T) => `For ongoing care in ${T}, weigh travel time, diagnostic capabilities, and the clinic's familiarity with your species before a crisis forces the decision for you.`,
      (T) => `Evaluate ${T}-area vet clinics on more than reviews: visit in person, note how the team handles check-in and your pet, and confirm species experience up front.`,
      (T) => `A good routine vet in ${T} is the one you can reach quickly, trust with your species, and actually want to call, visiting before anything is wrong is how you find that fit.`,
      (T) => `Before committing to a primary veterinarian in ${T}, tour the clinic, meet the lead vet, and confirm they regularly see the species you bring in.`,
      (T) => `Picking a routine vet in ${T} should balance convenience against service breadth; book a wellness visit so your pet's first exposure is not a medical emergency.`,
      (T) => `Location matters, but a ${T} clinic's communication style, emergency protocols, and species experience matter more, check all four with a pre-crisis wellness visit.`,
      (T) => `Use a standard wellness visit in ${T} as your audit; the clinic's handling of that low-stakes appointment tends to predict how they will operate under pressure.`,
    ],
  },
  {
    id: 'locations-exotic-vets',
    name: 'Exotic and specialty veterinarians in {CITY}...',
    regex: /Exotic and specialty veterinarians in ([A-Za-z][A-Za-z0-9 ,\.\-]{1,60}?) provide advanced care for non-traditional pets and complex medical cases\. Ask about their experience with your specific species before booking\.?/g,
    variants: [
      (T) => `Exotic and specialty practices in ${T} handle the cases a general small-animal clinic is not equipped for, confirm hands-on experience with your specific species before scheduling.`,
      (T) => `${T} has a smaller pool of exotics-trained vets; when your pet is a reptile, bird, or small mammal, confirm species experience in detail rather than assuming.`,
      (T) => `For complex or non-traditional species in ${T}, look for clinics that explicitly list your animal in their accepted-patients page or advertise board-certified specialists.`,
      (T) => `Specialty vets in ${T} cover areas like dermatology, oncology, and exotics; ask how many cases like yours they see in a typical month.`,
      (T) => `A vet clinic in ${T} may accept exotics without being truly exotics-ready; probe for species-specific equipment and recent case volume before booking.`,
      (T) => `When the pet in question is outside the usual dog-or-cat range, ${T} owners often drive further to reach the right specialist; plan that trip before a true emergency.`,
      (T) => `Confirm specific species experience, not just the word "exotic," when contacting a specialty clinic in ${T}; the gap between those two matters clinically.`,
      (T) => `Specialty veterinarians in ${T} should be able to describe recent cases involving your species; vague answers are a reasonable reason to keep looking.`,
    ],
  },
  {
    id: 'locations-current-info',
    name: 'For the most current information on pet services in {CITY}...',
    regex: /For the most current information on pet services in ([A-Za-z][A-Za-z0-9 ,\.\-]{1,60}?), check recent reviews and ask fellow pet owners for personal recommendations\.?/g,
    variants: [
      (T) => `Reviews in ${T} turn over quickly; cross-check two or three platforms and lean on recent owner word-of-mouth for the freshest signal.`,
      (T) => `Published lists for ${T} date fast, recent reviews and local owner communities are a better guide to who is currently doing good work.`,
      (T) => `Pet-service quality in ${T} shifts with staff and ownership changes; a short post in a local pet group often surfaces more than a generic search.`,
      (T) => `For up-to-date ${T} recommendations, weight recent reviews heavily and discount any coverage older than about a year.`,
      (T) => `Owners in ${T} tend to be candid in local community groups; a single targeted question there often beats hours of generic review reading.`,
      (T) => `Verify any pet-service recommendation for ${T} with a recent review check, businesses change quickly, and last year's favorite may not be this year's.`,
      (T) => `Best current-state reads for ${T}: recent Google reviews, an active local pet owners group, and a short phone call to confirm what you read.`,
      (T) => `Treat any curated list for ${T} as a starting point, the freshest signal almost always comes from reviews posted in the last few months.`,
    ],
  },
  {
    id: 'locations-responsible',
    name: 'Being a responsible pet owner in {CITY}...',
    regex: /Being a responsible pet owner in ([A-Za-z][A-Za-z0-9 ,\.\-]{1,60}?) means understanding local regulations, maintaining current vaccinations and licensing, and providing regular veterinary care\.?/g,
    variants: [
      (T) => `Responsible ownership in ${T} starts with three practical steps: know the local ordinances that apply, keep vaccinations and licensing current, and build a routine relationship with a veterinarian.`,
      (T) => `In ${T}, the baseline for good pet ownership is straightforward, comply with local regulations, stay current on vaccines and licensing, and keep scheduled veterinary care in place.`,
      (T) => `If you live in ${T} with a pet, the non-negotiables are familiarity with municipal rules, up-to-date vaccinations, valid licensing, and a veterinarian who knows your animal.`,
      (T) => `Good ownership habits in ${T} come down to compliance (local laws), prevention (vaccines and licensing), and continuity (regular vet visits).`,
      (T) => `For owners in ${T}, the reliable framework is: understand what your municipality requires, keep paperwork and shots current, and do not let veterinary care slip.`,
      (T) => `Operating responsibly as an owner in ${T} is less about heroics and more about the boring fundamentals, licensing, vaccines, and a steady vet relationship.`,
      (T) => `${T} owners who stay ahead of licensing deadlines, vaccine schedules, and routine vet visits tend to avoid the preventable issues that drive most complaints.`,
      (T) => `The simplest ownership checklist in ${T} is still the most effective: local rules, current shots and license, and a veterinarian who actually sees the animal every year.`,
    ],
  },
];

const SKIP_DIRS = ['node_modules', '.netlify', 'engines', 'data', 'audit', 'test-results', '.git'];

function listHtml(dir) {
  const out = [];
  (function walk(d) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (SKIP_DIRS.includes(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && p.endsWith('.html')) out.push(p);
    }
  })(dir);
  return out;
}

function processFile(filePath, stats) {
  let content;
  try { content = fs.readFileSync(filePath, 'utf8'); } catch { return; }
  const original = content;
  const rel = path.relative(ROOT, filePath);

  for (const rule of RULES) {
    rule.regex.lastIndex = 0;
    if (!rule.regex.test(content)) continue;
    rule.regex.lastIndex = 0;
    content = content.replace(rule.regex, function () {
      const args = Array.from(arguments);
      const tokenRaw = typeof args[1] === 'string' ? args[1] : '';
      const token = (tokenRaw || '').trim();
      const idx = hashPick(rel, rule.id, rule.variants.length);
      const replacement = rule.variants[idx](token);
      stats.hits[rule.id] = (stats.hits[rule.id] || 0) + 1;
      return replacement;
    });
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    stats.filesChanged += 1;
  }
}

function main() {
  const targets = [
    path.join(ROOT, 'commercial'),
    path.join(ROOT, 'guides'),
    path.join(ROOT, 'breeds'),
    path.join(ROOT, 'locations'),
  ];
  const files = [];
  for (const t of targets) files.push(...listHtml(t));
  // also the species hub html files at root that were flagged
  for (const r of ['fish.html','dogs.html','cats.html','birds.html','amphibians.html','reptiles.html','small-animals.html','marine-fish.html']) {
    const p = path.join(ROOT, r);
    if (fs.existsSync(p)) files.push(p);
  }

  const stats = { filesChanged: 0, hits: {} };
  let i = 0;
  for (const f of files) {
    processFile(f, stats);
    if (++i % 1000 === 0) process.stderr.write(`processed ${i}/${files.length}\n`);
  }

  console.log(JSON.stringify({
    filesScanned: files.length,
    filesChanged: stats.filesChanged,
    hits: stats.hits,
  }, null, 2));
}

main();
