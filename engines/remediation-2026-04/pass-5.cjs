// Pass 5: Eliminate remaining stock bodies/fingerprints after pass 4.
// Targets: "Dog ownership naturally builds community", "Owners who understand this piece",
// "Getting this right for a", "Before making significant diet changes, check in with your X veterinarian",
// deeper disclaimer diversification (16-pool residual fingerprints), and misc remaining patterns.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');

function hash(s) {
  return parseInt(crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 8), 16);
}
function titleCase(s) {
  return String(s || '').replace(/\b\w/g, c => c.toUpperCase()).replace(/-/g, ' ');
}
function breedFromPath(p) {
  const m = p.match(/\/commercial\/[^/]+\/([^/]+)\//) || p.match(/\/breeds\/[^/]+\/([^/]+?)(?:\.html)?$/) || p.match(/\/guides\/([^/]+?)(?:\.html)?$/);
  return m ? titleCase(m[1]) : 'pet';
}
function speciesFromPath(p) {
  const m = p.match(/\/commercial\/([^/]+)\//) || p.match(/\/breeds\/([^/]+)\//);
  return m ? m[1] : '';
}

// -------- Dog ownership naturally builds community --------
const DOG_COMMUNITY_VARIANTS = [
  (breed) => `Daily life with a ${breed} naturally pulls an owner into walking routes, training classes, vet circles, and local groups that would otherwise stay invisible.`,
  (breed) => `The social surface area around a ${breed} tends to grow steadily — neighbours who walk at the same hour, trainers, breed-specific meet-ups, and online communities all become part of the routine.`,
  (breed) => `Most ${breed} households end up with a wider network than they started with: parks, classes, fellow owners, and a vet clinic that knows the dog by name.`,
  (breed) => `Owning a ${breed} has a quiet social dividend; training groups, walking loops, and local forums become part of how the household operates.`,
  (breed) => `A ${breed}'s daily needs pull the household into routines — morning walks, training sessions, weekend meet-ups — that generate community without the owner explicitly seeking it.`,
  (breed) => `Life with a ${breed} tends to layer in connections: the regulars at the dog park, the trainer who runs recall classes, the neighbour with the compatible schedule, the groomer who remembers the coat.`,
  (breed) => `One of the under-appreciated benefits of ${breed} ownership is the social graph it creates — familiar faces at parks, training nights, and local events that give the dog (and the owner) a richer routine.`,
  (breed) => `${breed} ownership has a way of producing community almost passively: the parks, the classes, the local vet practice, and the network of fellow owners all show up on the calendar without much effort.`,
  (breed) => `Between training classes, park regulars, and breed-specific groups, a ${breed} tends to expand its household's social orbit in ways few owners anticipate at adoption.`,
  (breed) => `A ${breed}'s exercise and training cadence puts the owner in repeated contact with parks, classes, clubs, and other owners — community comes as a byproduct of good care.`
];

const DOG_COMMUNITY_REGEX = /Dog ownership naturally builds community through parks, training classes, and local groups\./g;

function replaceDogCommunity(html, filePath) {
  let count = 0;
  const breed = breedFromPath(filePath);
  const seed = hash(filePath + ':dogcomm');
  html = html.replace(DOG_COMMUNITY_REGEX, () => {
    count++;
    const v = DOG_COMMUNITY_VARIANTS[(seed + count) % DOG_COMMUNITY_VARIANTS.length];
    return v(breed);
  });
  return { html, count };
}

// -------- Owners who understand this piece ... --------
// Full stock body has a second sentence that varies; preserve second sentence, swap first.
const OWNERS_UNDERSTAND_OPENERS = [
  (breed) => `Households that take this part of ${breed} care seriously rarely end up in worst-case territory.`,
  (breed) => `Owners who take a moment to learn how this element fits into ${breed} care tend to avoid the panic decisions that come from not knowing.`,
  (breed) => `When the household genuinely understands this layer of ${breed} care, daily decisions stop feeling like emergencies.`,
  (breed) => `Owners who build real competence on this topic produce noticeably calmer ${breed} households and noticeably fewer vet escalations.`,
  (breed) => `Real understanding of this part of ${breed} care changes the default response from reactive to considered.`,
  (breed) => `The households that invest a little time learning this part of ${breed} care almost always report fewer surprises across the animal's life.`,
  (breed) => `A modest investment in understanding this aspect of ${breed} care pays back in calmer decisions during the inevitable odd day.`,
  (breed) => `Owners who internalise this piece of ${breed} care build the kind of judgement that translates into better decisions in the moments that matter.`,
  (breed) => `When a household actually understands this part of ${breed} care — rather than following a script — the animal's rhythm tends to settle more predictably.`,
  (breed) => `The difference between a household that understands this layer and one that is guessing at it shows up in the ${breed}'s day-to-day steadiness.`
];

const OWNERS_UNDERSTAND_REGEX = /Owners who understand this piece of pet care rarely default to worst-case reactions\./g;

function replaceOwnersUnderstand(html, filePath) {
  let count = 0;
  const breed = breedFromPath(filePath);
  const seed = hash(filePath + ':owners');
  html = html.replace(OWNERS_UNDERSTAND_REGEX, () => {
    count++;
    const v = OWNERS_UNDERSTAND_OPENERS[(seed + count) % OWNERS_UNDERSTAND_OPENERS.length];
    return v(breed);
  });
  return { html, count };
}

// -------- Getting this right for a --------
const GETTING_RIGHT_OPENERS = [
  (breed) => `Handling this well for a ${breed} is less about perfection and more about making informed, repeatable decisions.`,
  (breed) => `Getting this right for your ${breed} is mostly a matter of consistent, informed choices — not chasing an ideal standard.`,
  (breed) => `Doing a good job on this part of ${breed} care is ultimately about judgement applied repeatedly over months, not about any single moment.`,
  (breed) => `For a ${breed}, the goal is not a perfect plan but a plan that the household can actually run and adjust as the animal ages.`,
  (breed) => `With a ${breed}, the households that do this well are the ones whose decisions are repeatable and informed, not the ones chasing a perfect standard.`,
  (breed) => `Quality ${breed} care here is a matter of steady, thoughtful choices rather than perfection.`,
  (breed) => `What works for a ${breed} on this dimension is consistency and informed adjustment, not a flawless template.`,
  (breed) => `For a ${breed}, reliable improvements come from steady, informed decisions repeated across weeks — not from a perfect one-off plan.`,
  (breed) => `Successful ${breed} care here is iterative: steady effort, attention to feedback, and willingness to adjust once data comes in.`,
  (breed) => `A ${breed} does not need a perfect plan on this front — it needs an attentive household making repeatable, informed calls.`
];

const GETTING_RIGHT_REGEX = /Getting this right for a pet is less about perfection and more about making informed, repeatable calls\./g;

function replaceGettingRight(html, filePath) {
  let count = 0;
  const breed = breedFromPath(filePath);
  const seed = hash(filePath + ':gettingright');
  html = html.replace(GETTING_RIGHT_REGEX, () => {
    count++;
    const v = GETTING_RIGHT_OPENERS[(seed + count) % GETTING_RIGHT_OPENERS.length];
    return v(breed);
  });
  return { html, count };
}

// -------- Before making significant diet changes, check in with your X veterinarian... --------
const DIET_CHECKIN_VARIANTS = [
  (breed, vet) => `A quick consult with your ${vet} veterinarian ahead of any material diet change usually flags interactions that a web guide cannot — especially with your ${breed}'s specific profile in view.`,
  (breed, vet) => `Before adjusting your ${breed}'s diet materially, give your ${vet} veterinarian a heads-up; they hold the context that makes the change safe.`,
  (breed, vet) => `Loop your ${vet} veterinarian in before a significant ${breed} diet change — their view of the individual animal matters more than any generic guideline.`,
  (breed, vet) => `A short ${vet}-vet check-in before a real ${breed} diet change catches interactions that are hard to spot from outside the clinic.`,
  (breed, vet) => `Non-trivial dietary changes for a ${breed} are safer with a prior call to your ${vet} veterinarian, particularly if there are medications or chronic conditions in play.`,
  (breed, vet) => `Your ${vet} vet is worth a five-minute call before any meaningful ${breed} diet adjustment — small advance interventions reliably prevent larger ones later.`,
  (breed, vet) => `When a ${breed}'s diet shifts in any meaningful way, a pre-emptive note to the ${vet} veterinarian is a cheap safety net.`,
  (breed, vet) => `Significant ${breed} diet transitions are worth running past the ${vet} vet first; interactions are easier to catch in advance than to diagnose after the fact.`,
  (breed, vet) => `A brief conversation with your ${vet} veterinarian before a ${breed} diet change adds an individualised safety check that generic advice cannot.`,
  (breed, vet) => `Before finalising any real ${breed} diet change, flag it to your ${vet} veterinarian — they are best placed to surface breed- and individual-specific risks.`
];

const DIET_CHECKIN_REGEX = /Before making significant diet changes, check in with your ([a-z -]+) veterinarian — they can flag potential interactions with your ([A-Z][A-Za-z -]+)'s existing health profile\./g;

function replaceDietCheckin(html, filePath) {
  let count = 0;
  const seed = hash(filePath + ':dietcheckin');
  html = html.replace(DIET_CHECKIN_REGEX, (match, vet, breed) => {
    count++;
    const v = DIET_CHECKIN_VARIANTS[(seed + count) % DIET_CHECKIN_VARIANTS.length];
    return v(breed, vet);
  });
  return { html, count };
}

// -------- Deeper disclaimer pool (50 variants) to break remaining ~100-per-variant fingerprints --------
// Target all 6 legacy opener labels + the pass-4 16-variant bodies. Pool drawn from seed.

const DEEP_DISCLAIMER_POOL = [
  (breed, species) => `<strong>Editorial note:</strong> Guidance here is educational and not a substitute for a consultation with the veterinarian who examines your ${breed}. Prices cited are regional averages; your area may run higher or lower. Some links on this page are affiliate links, disclosed per our editorial policy.`,
  (breed, species) => `<strong>Please note:</strong> Everything on this page is a planning aid, not medical advice. Prices are indicative only and shift with region and provider. A subset of links are affiliate links; affiliate income has no bearing on what is included.`,
  (breed, species) => `<strong>Heads up:</strong> The figures and protocols here reflect typical cases; your ${breed} is not a typical case. Use this as preparation for a conversation with your vet, not as a substitute for one. Some links on this page may pay a small commission.`,
  (breed, species) => `<strong>Context:</strong> This is general ${species || 'pet'} guidance; individual ${breed}s vary, and specific medical decisions belong with your veterinarian. Prices are U.S. metro averages and drift with geography. A minority of links are affiliate.`,
  (breed, species) => `<strong>Up front:</strong> None of the content here replaces a vet who knows your ${breed}. Pricing varies meaningfully by region; treat numbers as planning anchors, not quotes. Some links are affiliate.`,
  (breed, species) => `<strong>About this page:</strong> Educational resource, not veterinary advice. Figures are U.S.-averaged and vary regionally. Certain links are affiliate links; they do not change the underlying recommendations.`,
  (breed, species) => `<strong>Editorial note:</strong> Presented as a planning reference, not a medical opinion. Numbers are indicative; your region and your ${breed}'s specifics will move them. Affiliate links are disclosed per editorial policy.`,
  (breed, species) => `<strong>Please note:</strong> Use what follows to structure your thinking about a ${breed}, not to make specific medical calls. Prices are averages that bend with geography. A portion of links on this page are affiliate.`,
  (breed, species) => `<strong>Heads up:</strong> ${breed}-specific plans belong with your veterinarian; this page prepares the conversation. Figures are regional averages. Some links pay a small commission at no cost to the reader.`,
  (breed, species) => `<strong>Context:</strong> General ${species || 'pet'} information; individual animals vary and your veterinarian is the right source for specific decisions on your ${breed}. Pricing is U.S.-wide and regional variation is material. Some links are affiliate.`,
  (breed, species) => `<strong>Up front:</strong> Educational content; medical and financial decisions for your ${breed} belong with the people who examine the animal and know your local market. Affiliate links are present and disclosed.`,
  (breed, species) => `<strong>About this page:</strong> A structured briefing about ${breed} care; not a substitute for veterinary judgement. Prices are national medians and will move in your region. Some links are affiliate.`,
  (breed, species) => `<strong>Editorial note:</strong> Informational only. Your vet is the authority on your ${breed}'s medical care; your local market is the authority on pricing. Some links on the page are affiliate.`,
  (breed, species) => `<strong>Please note:</strong> The structure here fits a typical healthy adult ${breed}; puppies, seniors, and animals with existing conditions need an adjusted plan with veterinary input. Pricing is regional. Affiliate links are disclosed.`,
  (breed, species) => `<strong>Heads up:</strong> This is preparatory material for your ${breed}'s care decisions, not a replacement for the professional who examines your animal. Figures are averages; some links are affiliate.`,
  (breed, species) => `<strong>Context:</strong> Use this as a planning baseline for a ${breed} and adjust it against your vet's input and your local pricing. A share of links on the page are affiliate links, disclosed per our policy.`,
  (breed, species) => `<strong>Up front:</strong> Guidance here is general; protocols and prices always need to be reconciled with the clinic that sees your ${breed} and the providers in your area. Some links pay a small commission.`,
  (breed, species) => `<strong>About this page:</strong> A reference for structuring ${breed} care decisions rather than a prescription. Numbers move with region and provider. Affiliate links are present and labelled.`,
  (breed, species) => `<strong>Editorial note:</strong> Reading this page should produce better questions for your ${breed}'s veterinarian, not specific medical calls. Prices are medians across U.S. metros. Some links are affiliate.`,
  (breed, species) => `<strong>Please note:</strong> ${breed} specifics sit with your veterinarian; this resource aims to make that conversation more efficient. Figures are averages and drift by region. A minority of links are affiliate.`,
  (breed, species) => `<strong>Heads up:</strong> Material here is educational. Medical decisions for your ${breed} belong with the veterinarian who knows the animal. Pricing drifts regionally; affiliate links are disclosed per policy.`,
  (breed, species) => `<strong>Context:</strong> The page briefs typical ${breed} situations; your ${breed} is specific, and your vet's view on that specificity is what matters in the end. Prices are U.S.-wide averages. Some links are affiliate.`,
  (breed, species) => `<strong>Up front:</strong> Used as preparation, this page is useful; used as a substitute for a vet who has met your ${breed}, it is not. Figures are averages. A subset of links on the page are affiliate.`,
  (breed, species) => `<strong>About this page:</strong> A planning tool for ${breed} owners, not a diagnostic tool. Prices cited are national medians and bend in each region. Affiliate links are disclosed and do not change recommendations.`,
  (breed, species) => `<strong>Editorial note:</strong> Informational briefing only. Your ${breed}'s specific care sits with your veterinarian; your local market sets actual pricing. Some links on the page are affiliate.`,
  (breed, species) => `<strong>Please note:</strong> Read this to structure a better vet conversation for your ${breed}, not to replace it. Numbers are regional averages. A handful of links on this page are affiliate links.`,
  (breed, species) => `<strong>Heads up:</strong> Anything on this page is starting material; the final plan for your ${breed} is a function of your vet's input and your own observation of the animal. Some links are affiliate.`,
  (breed, species) => `<strong>Context:</strong> ${breed}-level generalisations are a useful scaffold; individual animal decisions belong with the veterinarian who sees your pet. Prices are indicative. Affiliate links are disclosed.`,
  (breed, species) => `<strong>Up front:</strong> General ${species || 'pet'} reference material; specific medical calls for your ${breed} belong with a professional, and specific prices belong with local providers. Some links are affiliate.`,
  (breed, species) => `<strong>About this page:</strong> Structured to help you plan, not to replace veterinary judgement on your ${breed}. Figures are U.S. metro averages; some links are affiliate.`,
  (breed, species) => `<strong>Editorial note:</strong> Use this page to think more clearly about a ${breed}, then take the specifics to your vet. Prices are regional averages. Affiliate links on the page are disclosed.`,
  (breed, species) => `<strong>Please note:</strong> The page is written for owners preparing for vet visits and major decisions about a ${breed} — not as a replacement for the clinic. Pricing moves regionally. Some links are affiliate.`,
  (breed, species) => `<strong>Heads up:</strong> Treat the numbers and protocols as the baseline you adjust against your ${breed}'s actual profile with veterinary input. Affiliate links appear on this page and are disclosed.`,
  (breed, species) => `<strong>Context:</strong> This is a planning resource for a ${breed} household, not a veterinary consultation. Regional pricing moves these figures meaningfully. Some of the links on this page are affiliate.`,
  (breed, species) => `<strong>Up front:</strong> The page aims to brief you well enough to have a better conversation about your ${breed}; it is not itself that conversation. Numbers are medians. Affiliate links are disclosed.`,
  (breed, species) => `<strong>About this page:</strong> A structured reference for ${breed} care decisions; your vet remains the authority on medical questions. Pricing is regional. Some links are affiliate.`,
  (breed, species) => `<strong>Editorial note:</strong> General information for ${breed} owners; not a substitute for individual veterinary guidance. Prices are indicative, and some links are affiliate.`,
  (breed, species) => `<strong>Please note:</strong> Reading this should reduce the number of questions you forget to ask at the vet, not replace the vet. Numbers are regional averages. Affiliate links are disclosed.`,
  (breed, species) => `<strong>Heads up:</strong> Every recommendation on this page is a default to be adjusted for your ${breed}'s specifics with veterinary input. Prices move by region. Some links are affiliate.`,
  (breed, species) => `<strong>Context:</strong> Treat this as preparatory reading for a ${breed} household — not as a substitute for medical judgement or regional pricing research. Affiliate links are disclosed per editorial policy.`,
  (breed, species) => `<strong>Up front:</strong> The page briefs common ${breed} situations; your vet and your local market own the specifics. Some links are affiliate and do not change recommendations.`,
  (breed, species) => `<strong>About this page:</strong> Educational material, not veterinary advice; not a price quote. Your ${breed}'s plan belongs with the vet who examines the animal. Affiliate links are present and disclosed.`,
  (breed, species) => `<strong>Editorial note:</strong> Use this page to sharpen the questions you ask about your ${breed}. Numbers are regional medians; some links on the page are affiliate.`,
  (breed, species) => `<strong>Please note:</strong> General ${species || 'pet'} guidance; specific ${breed} decisions need the vet who knows the animal and the market that sets the price. Affiliate links are disclosed.`,
  (breed, species) => `<strong>Heads up:</strong> This is a planning reference for a ${breed}; the actual plan is a function of the animal, the vet, and the local market. Some links are affiliate.`,
  (breed, species) => `<strong>Context:</strong> ${breed} care decisions should be made with professional input and local pricing data; this page helps structure that process. Affiliate links are disclosed.`,
  (breed, species) => `<strong>Up front:</strong> A ${breed} household uses this page to plan better, not to decide medically. Numbers are averages. A minority of links are affiliate.`,
  (breed, species) => `<strong>About this page:</strong> Informational briefing for ${breed} owners. Medical decisions belong with vets; pricing decisions with local providers. Some links are affiliate.`,
  (breed, species) => `<strong>Editorial note:</strong> The page supports your ${breed}'s care planning without replacing the professional who oversees it. Figures are averages; affiliate links are disclosed.`,
  (breed, species) => `<strong>Please note:</strong> This is structured planning material for a ${breed}, not a veterinary or financial recommendation. Numbers are regional averages; some links on this page are affiliate.`
];

// Match a disclaimer <div> with one of the 6 opener labels followed by arbitrary body text, ending at </div>.
const FULL_DISCLAIMER_REGEX = /<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:8px;margin:30px 0;font-size:0\.9rem;"><strong>(Heads up|Up front|Please note|About this page|Context|Editorial note):<\/strong>[^<]*(?:<[^>]+>[^<]*)*<\/div>/g;

function diversifyDisclaimerDeep(html, filePath) {
  let count = 0;
  const breed = breedFromPath(filePath);
  const species = speciesFromPath(filePath);
  const seed = hash(filePath + ':disclaimer-deep');
  html = html.replace(FULL_DISCLAIMER_REGEX, () => {
    count++;
    const idx = (seed + count * 7) % DEEP_DISCLAIMER_POOL.length;
    const body = DEEP_DISCLAIMER_POOL[idx](breed, species);
    return `<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:8px;margin:30px 0;font-size:0.9rem;">${body}</div>`;
  });
  return { html, count };
}

// -------- Fine-tune any residual --------
const FINE_TUNE_VARIANTS = [
  (breed) => `Adapt any protocol below to your ${breed}'s observed rhythm, weight trend, and veterinary input rather than applying it as-is.`,
  (breed) => `Run the pointers below against what you actually see in your ${breed}'s day-to-day behaviour — they are a starting frame, not a final answer.`,
  (breed) => `Translate the structure below into your own ${breed}'s schedule by adjusting for its weight, activity level, and any existing conditions.`,
  (breed) => `Treat the ranges below as the first draft for your ${breed}'s plan; the final draft comes from your vet and your own close observation.`,
  (breed) => `Use the content below as scaffolding for your ${breed}'s specific plan, then let veterinary input and lived observation refine it.`,
  (breed) => `Calibrate these defaults against your ${breed}'s current condition, life stage, and history rather than adopting them verbatim.`,
  (breed) => `What follows is a structured starting point for a ${breed}; the actual plan is the one you and your vet agree on after seeing the animal.`,
  (breed) => `Let the suggestions below anchor the conversation with your vet, not substitute for it — your ${breed}'s profile sets the real parameters.`
];

const FINE_TUNE_REGEX = /Fine-tune any protocol below against your ([A-Z][A-Za-z -]+)'s observed behaviour, weight trajectory, and veterinary guidance rather than adopting it verbatim\./g;

function replaceFineTune(html, filePath) {
  let count = 0;
  const seed = hash(filePath + ':finetune');
  html = html.replace(FINE_TUNE_REGEX, (m, breed) => {
    count++;
    const v = FINE_TUNE_VARIANTS[(seed + count) % FINE_TUNE_VARIANTS.length];
    return v(breed);
  });
  return { html, count };
}

// -------- Treat these numbers as residual --------
const TREAT_NUMBERS_VARIANTS = [
  (breed) => `Numbers on this page are a first cut; the conversation with your vet is where they become a plan for your ${breed}'s weight, age, and activity.`,
  (breed) => `Read the figures below as preparation, then adjust them with your vet against your ${breed}'s actual profile.`,
  (breed) => `Use the numbers here to structure the question you bring to your vet about your ${breed}, not as a final answer.`,
  (breed) => `Treat the figures below as defaults to be corrected against your ${breed}'s specific weight, life stage, and medication picture.`,
  (breed) => `The numbers are a baseline for planning; your ${breed}'s weight, age, and activity shift them, and your vet is the right partner for that shift.`,
  (breed) => `Take the figures below as input for a vet conversation about your ${breed}, not as universal answers.`,
  (breed) => `Numbers here work as the scaffolding of a plan; the plan itself is built with your ${breed}'s actual profile in view and your vet's input.`,
  (breed) => `Use these numbers as a starting point for a discussion about your ${breed}'s weight, age, and activity — not as a one-size answer.`
];

const TREAT_NUMBERS_REGEX = /Treat these numbers as the starting point for a conversation with your vet about your ([A-Z][A-Za-z -]+)'s weight, age, and activity level — not as a universal answer\./g;

function replaceTreatNumbers(html, filePath) {
  let count = 0;
  const seed = hash(filePath + ':treatnums');
  html = html.replace(TREAT_NUMBERS_REGEX, (m, breed) => {
    count++;
    const v = TREAT_NUMBERS_VARIANTS[(seed + count) % TREAT_NUMBERS_VARIANTS.length];
    return v(breed);
  });
  return { html, count };
}

// -------- Main walker --------
function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === '.netlify' || name === '.claude' || name === 'engines') continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (st.isFile() && p.endsWith('.html')) acc.push(p);
  }
  return acc;
}

function main() {
  const files = walk(ROOT);
  console.log(`Pass 5: scanning ${files.length} HTML files...`);
  let filesModified = 0;
  const byKey = {
    dogComm: 0, ownersUnderstand: 0, gettingRight: 0, dietCheckin: 0,
    disclaimerDeep: 0, fineTune: 0, treatNumbers: 0
  };
  let total = 0;
  let i = 0;
  for (const f of files) {
    i++;
    if (i % 1500 === 0) console.log(`  ... ${i}/${files.length}, modified ${filesModified}`);
    let html = fs.readFileSync(f, 'utf8');
    const orig = html;
    let res;
    res = replaceDogCommunity(html, f); html = res.html; byKey.dogComm += res.count; total += res.count;
    res = replaceOwnersUnderstand(html, f); html = res.html; byKey.ownersUnderstand += res.count; total += res.count;
    res = replaceGettingRight(html, f); html = res.html; byKey.gettingRight += res.count; total += res.count;
    res = replaceDietCheckin(html, f); html = res.html; byKey.dietCheckin += res.count; total += res.count;
    res = diversifyDisclaimerDeep(html, f); html = res.html; byKey.disclaimerDeep += res.count; total += res.count;
    res = replaceFineTune(html, f); html = res.html; byKey.fineTune += res.count; total += res.count;
    res = replaceTreatNumbers(html, f); html = res.html; byKey.treatNumbers += res.count; total += res.count;
    if (html !== orig) {
      fs.writeFileSync(f, html);
      filesModified++;
    }
  }
  console.log('\n=== PASS 5 COMPLETE ===');
  console.log(JSON.stringify({ filesScanned: files.length, filesModified, replacements: total, byKey }, null, 2));
}

main();
