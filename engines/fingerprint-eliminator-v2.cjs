#!/usr/bin/env node
/**
 * fingerprint-eliminator-v2.cjs
 *
 * Second pass. Handles species-variant tails that v1 missed, plus additional
 * templated phrases surfaced after the first pass.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

function hashPick(filePath, patternId, poolSize) {
  const h = crypto.createHash('sha1').update(filePath + '|' + patternId).digest();
  return h.readUInt32BE(0) % poolSize;
}

const RULES = [
  {
    id: 'invest-time-any-species',
    regex: /Owners who invest time in understanding ([A-Za-z][A-Za-z0-9 '\u2019\-]{1,60}?)'s particular needs typically spend less on corrective care and enjoy a stronger bond with their (?:dog|cat|bird|reptile|amphibian|fish|small animal|pet)\.?/g,
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
    // species-agnostic version of "understanding this aspect of X care"
    id: 'understanding-aspect-any',
    regex: /Understanding this aspect of ([A-Za-z][A-Za-z0-9 '\u2019\-]{1,60}?) care helps you make informed decisions that directly affect your (?:dog|cat|bird|reptile|amphibian|fish|small animal|pet)'s wellbeing\.?\s*/g,
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
    // species-agnostic "feeding plan" closer
    id: 'individual-feeding-any',
    regex: /Every ([A-Za-z][A-Za-z0-9 '\u2019\-]{1,60}?) is an individual\.\s*What works perfectly for one may not suit another, which is why a veterinarian consultation rounds out any (?:feeding|care|enrichment|habitat|training|insurance|cost) plan\.?/g,
    variants: [
      (T) => `Each ${T} is its own case, so a short conversation with a veterinarian is the natural finishing step for any plan.`,
      (T) => `No two ${T} behave identically; a veterinarian can personalize the plan beyond what any article can.`,
      (T) => `Use this as scaffolding, then let a veterinarian fit it to the specific ${T} you live with.`,
      (T) => `Because plans live or die on small personal details, loop in a veterinarian who has actually examined the ${T}.`,
      (T) => `A veterinarian who knows your ${T} will see variables an article cannot; treat their input as the final adjustment.`,
      (T) => `Articles can describe the shape of good ${T} care; only a veterinarian can tune it to the animal at home.`,
      (T) => `For the last mile of any ${T} plan, a veterinarian's perspective usually beats another round of internet reading.`,
      (T) => `Every plan for a ${T} should end with a brief veterinary check, especially after weight, age, or health changes.`,
    ],
  },
  {
    // post-v1: look for "Consult your veterinarian for advice specific to your pet" which still repeats a lot
    id: 'consult-for-advice',
    regex: /Consult your veterinarian for advice specific to your pet\.?/g,
    variants: [
      () => `Run any specific plan past the veterinarian who actually sees your animal.`,
      () => `Your own veterinarian is the right source for guidance tuned to your specific pet.`,
      () => `Anything here worth acting on is worth confirming with your own veterinarian first.`,
      () => `Use a veterinarian familiar with your pet to translate this guidance into specifics.`,
      () => `Loop in your primary veterinarian before applying any of this to your pet directly.`,
      () => `Situational decisions belong to a veterinarian who can examine the animal in person.`,
      () => `A veterinarian who knows your pet will sharpen this general guidance into something usable.`,
      () => `Treat any specific recommendation here as a question to bring to your own veterinarian.`,
    ],
  },
  {
    // the "A stable daily routine" 264-page template
    id: 'stable-daily-routine',
    regex: /A stable daily routine serves as the foundation for behavioral wellness, reducing reactivity and stress responses[\s\S]{0,400}?(?=<\/p>|<p>|<h\d)/g,
    variants: [
      () => `Predictable routines do most of the behavioral work quietly: pets that know the daily rhythm show fewer stress responses and less reactivity. Feed, walk, play, rest, and bedtime at roughly the same times produces more compounding benefit than any single training technique.`,
      () => `Most behavioral problems ease when a household's routine stabilizes. Consistent timing for meals, exercise, downtime, and sleep lets the pet anticipate what comes next, which in turn reduces anxiety-driven behavior.`,
      () => `When the day has predictable shape, pets rely less on vigilance and more on rest. Consistency in feeding, exercise, and quiet time outperforms intermittent high-effort training for long-term behavioral health.`,
      () => `A day with recognizable structure is the single cheapest behavioral intervention available. Pets calm into predictable mealtimes, movement, and bedtime, which lowers baseline stress and reactivity on its own.`,
      () => `Household routines shape behavior more than most owners realize. Regularity in meals, walks, enrichment, and sleep builds a pet that anticipates the day instead of reacting to it.`,
      () => `Stable cadence beats sporadic training for most behavioral goals. A pet that can predict the day's rhythm spends less energy on vigilance and more on rest.`,
      () => `Behavioral wellness is built in the background by routine. When meals, activity, and quiet time occur at consistent times, reactivity and stress responses tend to fade on their own.`,
      () => `Predictability lowers stress load measurably. Feeding, exercise, play, and rest on a recognizable schedule usually produce steadier behavior than any single corrective technique.`,
    ],
  },
  {
    // "Prevalence varies, and many individuals..." - health note boilerplate
    id: 'prevalence-varies',
    regex: /Prevalence varies, and many individuals live full lives without developing these issues\. However, breed-aware veterinary care[\s\S]{0,300}?(?=<\/p>|<p>|<h\d)/g,
    variants: [
      () => `Rates vary across individuals, and plenty of animals never develop the conditions associated with their breed. The real value of breed-aware veterinary care is earlier screening and faster recognition when something does appear.`,
      () => `Breed-linked risks describe populations, not prognoses; many individual pets never encounter the issues their breed is associated with. A veterinarian who knows the breed profile simply catches problems earlier when they do surface.`,
      () => `Statistical risk is not destiny. Many pets in predisposed breeds live full, uneventful lives, which is exactly why breed-aware veterinary care earns its keep: it shortens the distance between the first subtle sign and an accurate diagnosis.`,
      () => `Think of breed predispositions as watchlist items rather than predictions. Many individual animals never show the conditions in question; when they do, a breed-literate veterinarian usually identifies them sooner.`,
      () => `Prevalence figures describe averages across a breed, not any one animal. A veterinarian familiar with breed-specific risk patterns is simply better positioned to catch exceptions early.`,
      () => `Most individuals in at-risk breeds never develop the associated conditions. For the minority that do, breed-aware veterinary care is what shortens the gap between first symptoms and treatment.`,
      () => `Breed-level risk is population-level information; individual outcomes vary widely. The practical payoff of breed-aware veterinary care is earlier detection in the cases where risk does materialize.`,
      () => `Statistics about breed risk do not forecast any single pet's future. They simply justify attentive, breed-aware veterinary care that catches issues early if and when they arise.`,
    ],
  },
  {
    // big breeds "peer-reviewed veterinary sources" transparency block (292 pages)
    id: 'peer-reviewed-transparency',
    regex: /While this guide references peer-reviewed veterinary sources and established breed health data, online health information has inherent limitations\. Breed predispositions describe population-level trends - your individual pet may face different risks based on their genetics, environment, diet, and lifestyle\. Use this resource as a starting point for informed conversations with your veterinary care team, not as a substitute for professional evaluation\.?/g,
    variants: [
      () => `Sources cited here are peer-reviewed where available, but online content has limits that no citation can overcome. Breed predispositions are population averages, not individual predictions; your own pet's genetics, environment, diet, and lifestyle rewrite the picture. Treat this as background reading for your next veterinary visit, not a substitute for one.`,
      () => `This guide leans on peer-reviewed veterinary literature and established breed data, yet any online health resource carries built-in constraints. Breed predispositions describe population trends; the animal in your home may face a different risk profile shaped by genes, environment, nutrition, and routine. Use the material here to prepare better questions for your veterinary team.`,
      () => `Every citation here points to veterinary research or established breed health data, but online health information can only take you so far. The conditions linked to a breed are statistical tendencies, not certainties; your pet's specific risks depend on genetics, environment, diet, and lifestyle. Bring this to a veterinarian rather than acting on it directly.`,
      () => `We reference peer-reviewed veterinary work wherever it exists, but no online resource replaces an in-person exam. Breed predispositions are useful frames, not individual forecasts; environment, diet, genetics, and lifestyle shift any individual pet's actual risk. Use this page to sharpen conversations with your veterinary care team.`,
      () => `Peer-reviewed sources and breed health databases back the claims on this page, yet online information has irreducible limits. Predispositions describe population-level trends, while your own pet's risk is shaped by unique genetics, environment, diet, and lifestyle. The appropriate use of this resource is as a starting point before a veterinary conversation.`,
      () => `The data here draws on peer-reviewed veterinary research and established breed health records, but that does not make it a substitute for professional evaluation. Breed predispositions summarize populations; individual risk depends on a pet's own genetics, environment, diet, and habits. Use this as preparatory reading for your veterinarian, not as a diagnosis.`,
      () => `Citations here refer to peer-reviewed veterinary sources and accepted breed health data, though online guidance has unavoidable gaps. Population-level predispositions will not perfectly map to your individual pet, whose risk reflects genetics, environment, diet, and daily life. Treat the page as a frame for your veterinary team's input rather than a replacement for it.`,
      () => `While the references below point to peer-reviewed veterinary literature, the limits of online health content still apply. Breed predispositions describe how large groups of animals tend to fare; your specific pet's risk profile is individualized by genetics, environment, diet, and lifestyle. Use this resource to prepare for, not replace, a veterinary evaluation.`,
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
  for (const r of ['fish.html','dogs.html','cats.html','birds.html','amphibians.html','reptiles.html','small-animals.html','marine-fish.html']) {
    const p = path.join(ROOT, r);
    if (fs.existsSync(p)) files.push(p);
  }

  const stats = { filesChanged: 0, hits: {} };
  let i = 0;
  for (const f of files) {
    processFile(f, stats);
    if (++i % 2000 === 0) process.stderr.write(`processed ${i}/${files.length}\n`);
  }

  console.log(JSON.stringify({
    filesScanned: files.length,
    filesChanged: stats.filesChanged,
    hits: stats.hits,
  }, null, 2));
}

main();
