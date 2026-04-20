// Pass 6: Catch remaining disclaimer variants where <div> and <strong> are not adjacent.
// Also reduce residual fingerprints that pass 5 missed due to strict regex.

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

// Whitespace-tolerant regex; also matches multi-line divs
const FULL_DISCLAIMER_REGEX = /<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:8px;margin:30px 0;font-size:0\.9rem;">\s*<strong>(Heads up|Up front|Please note|About this page|Context|Editorial note):<\/strong>[\s\S]{1,800}?<\/div>/g;

function diversifyDisclaimerDeep(html, filePath) {
  let count = 0;
  const breed = breedFromPath(filePath);
  const species = speciesFromPath(filePath);
  const seed = hash(filePath + ':disclaimer-pass6');
  html = html.replace(FULL_DISCLAIMER_REGEX, () => {
    count++;
    const idx = (seed + count * 13) % DEEP_DISCLAIMER_POOL.length;
    const body = DEEP_DISCLAIMER_POOL[idx](breed, species);
    return `<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:8px;margin:30px 0;font-size:0.9rem;">${body}</div>`;
  });
  return { html, count };
}

// -------- Mop-up: remaining small fingerprints --------
// 27 × Owners who understand this piece; 37 × Getting this right; 20 × Successful training for; 13 × Systematic health tracking; 4 × mistakes derail
const OWNERS_UNDERSTAND_REGEX = /Owners who understand this piece of pet care rarely default to worst-case reactions\./g;
const OWNERS_V = [
  (breed) => `The households that internalise this corner of ${breed} care almost always avoid worst-case reactions.`,
  (breed) => `When an owner understands this part of ${breed} care properly, panic rarely becomes the default mode.`,
  (breed) => `Real familiarity with this slice of ${breed} care keeps households out of reactive decision-making.`,
  (breed) => `Owners with a solid grasp of this layer tend to make calmer, more measured ${breed} decisions under pressure.`,
  (breed) => `Households that genuinely know this part of ${breed} care rarely find themselves in emergency-mode responses.`,
  (breed) => `A ${breed} owner who has actually learned this aspect of care tends to act, not panic.`,
  (breed) => `When the household is genuinely fluent in this dimension of ${breed} care, the reactive decisions tend to drop away.`,
  (breed) => `Skilled ${breed} households rarely land on worst-case reactions because they have already thought this through.`
];

const GETTING_RIGHT_REGEX = /Getting this right for a pet is less about perfection and more about making informed, repeatable calls\./g;
const GETTING_V = [
  (breed) => `Handling this well for a ${breed} is a matter of informed, repeatable decisions rather than a perfect plan.`,
  (breed) => `Getting this right for a ${breed} is less about any specific action and more about the household doing the same informed thing every week.`,
  (breed) => `Quality ${breed} care here is produced by repeatable, informed choices rather than any single brilliant call.`,
  (breed) => `With a ${breed}, informed repetition beats perfection — the households that quietly repeat sensible choices outperform the ones chasing ideal ones.`,
  (breed) => `For a ${breed}, the useful goal is a set of repeatable, informed decisions, not a single perfect plan.`,
  (breed) => `What makes the difference for a ${breed} here is the steady repetition of good-enough choices rather than occasional perfect ones.`,
  (breed) => `A ${breed} benefits most from repeatable, thoughtful decisions that keep being made week after week.`,
  (breed) => `Strong ${breed} care on this dimension is made of small, repeatable decisions rather than any heroic one-off effort.`
];

const SUCCESS_TRAINING_REGEX = /Successful training for ([A-Z][A-Za-z -]+) respects this (?:breed|species)'s ([a-z -]+) trainability profile and natural ([a-z -]+) tendencies\./g;
const SUCCESS_TRAINING_V = [
  (breed, trait, tend) => `Working with a ${breed}'s ${trait} trainability profile — rather than against it — is what makes training sessions land, particularly given the breed's natural ${tend} tendencies.`,
  (breed, trait, tend) => `${breed}s respond best when the training plan matches their ${trait} profile and acknowledges their natural ${tend} habits.`,
  (breed, trait, tend) => `Training outcomes for a ${breed} improve materially when the plan is calibrated to the breed's ${trait} profile and its natural ${tend} tendencies.`,
  (breed, trait, tend) => `A ${breed}'s ${trait} trainability and natural ${tend} tendencies give you the frame — good training works with that frame, not around it.`,
  (breed, trait, tend) => `Training effort for a ${breed} pays off most when it respects the breed's ${trait} trainability profile and leans into its natural ${tend} habits.`,
  (breed, trait, tend) => `Effective ${breed} training acknowledges two things at once: the breed's ${trait} trainability profile and its natural ${tend} tendencies.`,
  (breed, trait, tend) => `For a ${breed}, well-designed training respects the ${trait} trainability baseline and works with the natural ${tend} pattern.`,
  (breed, trait, tend) => `${breed} training lands when the session design maps to the breed's ${trait} profile and its natural ${tend} instincts.`
];

const SYSTEMATIC_HEALTH_REGEX = /Systematic health tracking/g;
const SYSTEMATIC_V = [
  () => `A disciplined approach to health tracking`,
  () => `Consistent, structured health monitoring`,
  () => `A clear health-tracking routine`,
  () => `Steady, structured health logging`,
  () => `Ongoing, organised health tracking`,
  () => `A deliberate system for tracking health`,
  () => `Reliable, structured health tracking`,
  () => `Methodical health monitoring`
];

const MISTAKES_DERAIL_REGEX = /The mistakes that derail new/g;
const MISTAKES_V = [
  () => `Mistakes that catch newer`,
  () => `The errors that tend to derail first-time`,
  () => `Common missteps that trip up newer`,
  () => `The stumbles that most derail first-time`,
  () => `Typical pitfalls that derail new`,
  () => `The errors that most often derail newer`,
  () => `Missteps that tend to catch new`,
  () => `Common derailments for new`
];

function applyPattern(html, regex, variants, seed, argsExtractor) {
  let count = 0;
  html = html.replace(regex, (...args) => {
    count++;
    const v = variants[(seed + count) % variants.length];
    const extracted = argsExtractor ? argsExtractor(args) : [];
    return v(...extracted);
  });
  return { html, count };
}

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
  console.log(`Pass 6: scanning ${files.length} HTML files...`);
  let filesModified = 0;
  const byKey = { disclaimerDeep: 0, ownersUnderstand: 0, gettingRight: 0, successTraining: 0, systematic: 0, mistakes: 0 };
  let total = 0;
  let i = 0;
  for (const f of files) {
    i++;
    if (i % 1500 === 0) console.log(`  ... ${i}/${files.length}, modified ${filesModified}`);
    let html = fs.readFileSync(f, 'utf8');
    const orig = html;
    const breed = breedFromPath(f);
    const s1 = hash(f + ':p6');

    let res;
    res = diversifyDisclaimerDeep(html, f); html = res.html; byKey.disclaimerDeep += res.count; total += res.count;

    res = applyPattern(html, OWNERS_UNDERSTAND_REGEX, OWNERS_V, s1 + 1, () => [breed]);
    html = res.html; byKey.ownersUnderstand += res.count; total += res.count;

    res = applyPattern(html, GETTING_RIGHT_REGEX, GETTING_V, s1 + 2, () => [breed]);
    html = res.html; byKey.gettingRight += res.count; total += res.count;

    res = applyPattern(html, SUCCESS_TRAINING_REGEX, SUCCESS_TRAINING_V, s1 + 3, (args) => [args[1], args[2], args[3]]);
    html = res.html; byKey.successTraining += res.count; total += res.count;

    res = applyPattern(html, SYSTEMATIC_HEALTH_REGEX, SYSTEMATIC_V, s1 + 4, () => []);
    html = res.html; byKey.systematic += res.count; total += res.count;

    res = applyPattern(html, MISTAKES_DERAIL_REGEX, MISTAKES_V, s1 + 5, () => []);
    html = res.html; byKey.mistakes += res.count; total += res.count;

    if (html !== orig) {
      fs.writeFileSync(f, html);
      filesModified++;
    }
  }
  console.log('\n=== PASS 6 COMPLETE ===');
  console.log(JSON.stringify({ filesScanned: files.length, filesModified, replacements: total, byKey }, null, 2));
}

main();
