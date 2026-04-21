// Pass 12: Break the high-frequency "Health Awareness" and daily-care template blocks.
// Targets (file counts at time of writing):
//   - "Not every individual will be affected..." Health Awareness block  (~294 files)
//   - "Your veterinarian knows your pet/cat/dog best..."                 (~706 files)
//   - "have particular requirements based on their..."                    (~1317 files)
//   - "Weighing around X-Y lbs and lifespan of A-B yrs, the BREED ..."   (~1322 files)
//   - "with high energy levels need consistent outlets..."                (~642 files)
//   - "At the end of the day, BREED ownership is about companionship..." (~67 small animal files)
//   - "breed-specific considerations worth understanding early"           (~265 files)
//   - "unique health and temperament characteristics"                     (~258 files)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');

function hash(s) {
  return parseInt(crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 8), 16);
}

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === '.netlify' ||
        name === '.claude' || name === 'engines' || name === 'audit') continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (st.isFile() && p.endsWith('.html')) acc.push(p);
  }
  return acc;
}

// --- 1. Health Awareness block: "... carry genetic predispositions to X. Not every individual will be affected, but knowing these risks lets you work with your vet to establish an appropriate screening schedule. Early detection changes outcomes significantly for most of these conditions."
const HEALTH_AWARE_V = [
  (subj, conds) => `${subj} carry genetic predispositions to ${conds}. Prevalence varies by individual, so the practical approach is a screening cadence that matches your vet's read of the breed's real-world risks. For most of these conditions, earlier identification translates directly into better management.`,
  (subj, conds) => `${subj} have documented breed-level risk for ${conds}. Not every animal develops these issues, but awareness of the pattern lets you and your vet set a screening schedule calibrated to the actual threat level — and catching problems early typically improves the trajectory.`,
  (subj, conds) => `Predispositions seen in ${subj} include ${conds}. Many individuals go their whole lives without expressing these conditions, but the ones that matter are usually more manageable when caught on a screening visit rather than during a crisis.`,
  (subj, conds) => `${subj} show elevated breed-level risk for ${conds}. Your vet can build a screening interval around those specific conditions; early-stage findings almost always give you more treatment options than advanced-stage ones.`,
  (subj, conds) => `Key conditions flagged in ${subj} populations: ${conds}. These are probabilities, not destinies — but the probabilities are high enough that a structured screening plan with your vet pays off, especially given how much earlier detection improves outcomes.`,
  (subj, conds) => `Watch ${subj} for ${conds}, all documented at breed level. An individual animal may never show symptoms, yet the cost-benefit of targeted screening is strongly favorable: most of these respond far better to early intervention than late.`,
  (subj, conds) => `${subj} carry known breed-associated risks including ${conds}. A screening schedule tuned to those specific risks — which your vet can outline — is one of the highest-leverage moves you make as an owner, because most of these conditions are easier to treat earlier than later.`,
  (subj, conds) => `The breed-level risk profile for ${subj} includes ${conds}. None of that is deterministic for a given individual, but a targeted screening plan catches the issues that matter while they are still small, and most of these conditions are materially easier to manage when caught that way.`
];
// Matches "SUBJECT carry genetic predispositions to X, Y, Z. Not every individual will be affected, but knowing these risks lets you work with your vet to establish an appropriate screening schedule. Early detection changes outcomes significantly for most of these conditions."
const HEALTH_AWARE_REGEX = /([A-Z][A-Za-z' \-]+?) carry genetic predispositions to ([^.<]+?)\. Not every individual will be affected, but knowing these risks lets you work with your vet to establish an appropriate screening schedule\. Early detection changes outcomes significantly for most of these conditions\./g;

// --- 2. "Your veterinarian knows your X best — always verify dietary choices with them, especially if your X has existing health conditions."
const VET_BEST_V = [
  (sub) => `Run any significant dietary change past your vet before making it — they already know your ${sub}'s history, and existing conditions can make ordinary-seeming food swaps risky.`,
  (sub) => `Your vet has context no article can replicate; confirm food choices with them directly, particularly when your ${sub} already has medical conditions in the picture.`,
  (sub) => `Check with your vet on diet decisions. They see the full health record, which matters most when your ${sub} has ongoing conditions that a generic food recommendation won't account for.`,
  (sub) => `Diet choices should be cleared by the vet who actually manages your ${sub}'s care, especially where known conditions change what is safe or appropriate.`,
  (sub) => `Verify dietary decisions with your vet — not because generic advice is wrong, but because your ${sub}'s medical history is where the nuances actually live.`,
  (sub) => `Before changing foods, loop in your vet. They know your ${sub}'s bloodwork, medications, and history in a way no buyer's guide can, and existing conditions make that context decisive.`,
  (sub) => `Bring dietary questions to your vet; their knowledge of your ${sub}'s existing conditions and history is what turns a generic answer into a correct one.`,
  (sub) => `Confirm any meaningful feeding change with your vet first. They work from the full record of your ${sub}'s health, which is where the real constraints live.`
];
const VET_BEST_REGEX = /Your veterinarian knows your (pet|cat|dog) best — always verify dietary choices with them, especially if your (pet|cat|dog) has existing health conditions\./g;

// --- 3. "BREED(s) have particular requirements based on their SIZE size, SHED shedding level, and genetic predispositions to X and Y."
const PARTICULAR_V = [
  (subj, size, shed, conds) => `Care for ${subj} has to account for a ${size} frame, a ${shed} shedding profile, and breed-linked risk around ${conds}.`,
  (subj, size, shed, conds) => `Practical ${subj} care is shaped by three things: ${size} size, ${shed} shedding, and a known predisposition to ${conds}.`,
  (subj, size, shed, conds) => `${subj} sit in the ${size}-size category, shed at a ${shed} level, and carry documented risk for ${conds} — those three factors drive most of the daily-care decisions.`,
  (subj, size, shed, conds) => `The care profile for ${subj} is anchored by a ${size} build, ${shed} coat shedding, and breed-associated risk for ${conds}.`,
  (subj, size, shed, conds) => `Plan ${subj} care around a ${size} body size, ${shed} shedding, and the breed's documented predisposition toward ${conds}.`,
  (subj, size, shed, conds) => `For ${subj}, the inputs that matter most are a ${size} frame, a ${shed} shedding coat, and breed-level risk for ${conds}.`,
  (subj, size, shed, conds) => `${subj} bring a ${size} build, a ${shed} shedding pattern, and breed-specific health risk around ${conds} — each of those shifts routine care in a different direction.`,
  (subj, size, shed, conds) => `Three variables drive daily care for ${subj}: their ${size} size, their ${shed} shedding level, and their breed-associated risk of ${conds}.`
];
const PARTICULAR_REGEX = /([A-Z][A-Za-z' \-]+?) have particular requirements based on their (small|medium|large|giant|tiny|miniature|toy) size, (no|light|moderate|heavy|minimal|low|high|seasonal) shedding level, and genetic predispositions to ([^.<]+?)\./g;

// --- 4. "Weighing around X-Y lbs and lifespan of A-B yrs, the BREED does best with an owner who understands its breed-specific quirks."
const WEIGHING_QUIRKS_V = [
  (wt, life, breed) => `At ${wt} and with a typical ${life} lifespan, the ${breed} rewards owners who understand the breed's specific quirks rather than treating it as a generic pet.`,
  (wt, life, breed) => `Expect ${wt} at maturity and roughly ${life} of life with a ${breed}; the breed's idiosyncrasies matter, and owners who understand them do materially better.`,
  (wt, life, breed) => `${wt} at maturity, ${life} lifespan — the ${breed} does best in a home where the owner actually understands the breed-level quirks rather than learning them the hard way.`,
  (wt, life, breed) => `The ${breed} typically weighs ${wt} and lives ${life}; the breed has its own set of quirks, and outcomes track closely to how well the owner understands them.`,
  (wt, life, breed) => `Size: around ${wt}. Lifespan: about ${life}. The ${breed} is a breed with specific quirks, and the best homes for it are the ones that have taken the time to learn them.`,
  (wt, life, breed) => `A mature ${breed} runs ${wt} with a ${life} life expectancy, and the breed has enough quirks of its own that owner knowledge is a real variable in how well things go.`,
  (wt, life, breed) => `Plan for ${wt} of dog and ${life} of life with a ${breed} — and plan for an ownership experience that rewards knowing the breed rather than treating it as generic.`,
  (wt, life, breed) => `At ${wt} and ${life} of typical lifespan, the ${breed} brings enough breed-specific nuance that informed owners consistently outperform unprepared ones.`
];
// Matches: "Weighing around 6-10 lbs and lifespan of 9-15 yrs, the Abyssinian does best with an owner who understands its breed-specific quirks."
const WEIGHING_QUIRKS_REGEX = /Weighing around ([0-9.]+(?:-[0-9.]+)?\s*(?:lbs|kg|oz|g|grams|pounds)) and lifespan of ([0-9.]+(?:-[0-9.]+)?\s*(?:yrs|years))(?:\.?|,)? the ([A-Z][A-Za-z'\. \-]+?) does best with an owner who understands its breed-specific quirks\./g;

// --- 4b. "Weighing around ... comes with breed-specific considerations worth understanding early."
const WEIGHING_CONSIDERATIONS_V = [
  (wt, life, breed) => `Size ${wt} and expected lifespan ${life}; the ${breed} comes with enough breed-specific nuance that getting oriented to it early is worth the effort.`,
  (wt, life, breed) => `A ${breed} at ${wt} and a ${life} lifespan has breed-level considerations that are easier to absorb before adoption than after.`,
  (wt, life, breed) => `${wt} body size, ${life} expected life — and the ${breed} has particular breed-specific care realities worth learning up front, not in reaction to problems.`,
  (wt, life, breed) => `Plan for ${wt} of animal and ${life} of companionship with a ${breed}; the breed-specific care considerations are the kind it pays to read up on before day one.`,
  (wt, life, breed) => `The ${breed} averages ${wt} at maturity with a ${life} lifespan and arrives with breed-level care considerations best internalised early rather than discovered late.`,
  (wt, life, breed) => `At ${wt} and ${life} of life expectancy, the ${breed} carries specific care considerations that benefit from early attention.`,
  (wt, life, breed) => `${breed} adults typically weigh ${wt} and live ${life}; the practical breed-specific considerations are the kind worth knowing going in, not figuring out later.`,
  (wt, life, breed) => `Between the ${wt} adult size and ${life} lifespan, the ${breed} has enough breed-specific care considerations that early familiarity with them pays off throughout ownership.`
];
const WEIGHING_CONSIDERATIONS_REGEX = /Weighing around ([0-9.]+(?:-[0-9.]+)?\s*(?:lbs|kg|oz|g|grams|pounds)) and lifespan of ([0-9.]+(?:-[0-9.]+)?\s*(?:yrs|years))(?:\.?|,)? the ([A-Z][A-Za-z'\. \-]+?) comes with breed-specific considerations worth understanding early\./g;

// --- 4c. "Weighing around ... requires attention to its unique health and temperament characteristics."
const WEIGHING_UNIQUE_V = [
  (wt, life, breed) => `At ${wt} with a ${life} lifespan, the ${breed} has a health and temperament profile that rewards close attention rather than generic care.`,
  (wt, life, breed) => `The ${breed} runs about ${wt} at maturity with a typical ${life} life expectancy; both its health pattern and its temperament are specific enough to deserve deliberate attention.`,
  (wt, life, breed) => `Plan for ${wt} of animal, a ${life} lifespan, and a distinct combination of health considerations and temperament that matters more than a species-level view would suggest.`,
  (wt, life, breed) => `${wt} adult size, ${life} life expectancy — and the ${breed} has a health and temperament footprint that is worth reading on its own terms.`,
  (wt, life, breed) => `Expect ${wt} at maturity and ${life} of life with a ${breed}; the combination of its health pattern and temperament profile is where owner attention pays the largest dividends.`,
  (wt, life, breed) => `At ${wt} and a ${life} lifespan, the ${breed} is a breed whose temperament and health considerations each warrant focused attention, not default assumptions.`,
  (wt, life, breed) => `The ${breed} typically weighs ${wt} and lives ${life}; owner results track strongly to how seriously the breed's unique health and temperament traits are taken.`,
  (wt, life, breed) => `Plan on ${wt} and ${life} of life with a ${breed}, and plan on the breed's temperament and health profile being specific enough that deliberate attention to both is the baseline.`
];
const WEIGHING_UNIQUE_REGEX = /Weighing around ([0-9.]+(?:-[0-9.]+)?\s*(?:lbs|kg|oz|g|grams|pounds)) and lifespan of ([0-9.]+(?:-[0-9.]+)?\s*(?:yrs|years))(?:\.?|,)? the ([A-Z][A-Za-z'\. \-]+?) requires attention to its unique health and temperament characteristics\./g;

// --- 5. "BREEDs with high energy levels need consistent outlets for their drive and enthusiasm."
const OUTLETS_V = [
  (subj) => `High-energy ${subj} work best with consistent, structured outlets — without them, the drive converts into stress behaviors rather than evaporating.`,
  (subj) => `If you own ${subj}, plan on steady daily outlets for their energy; the breed's drive is real, and the alternatives to channeling it are worse.`,
  (subj) => `${subj} run at a high energy level that needs regular, predictable outlets — physical exercise, structured play, scent or mental work — or it reroutes into problem behaviors.`,
  (subj) => `Owners of ${subj} should bake energy outlets into the daily schedule; skipping a day here and there is fine, skipping the concept is not.`,
  (subj) => `The high-energy profile of ${subj} calls for consistent physical and mental outlets; occasional effort will not absorb it.`,
  (subj) => `For ${subj}, daily outlets — real exercise, real engagement — are the baseline; intermittent effort doesn't match the breed's actual output.`,
  (subj) => `${subj} need their drive channeled consistently rather than sporadically; a reliable schedule of physical and mental work produces a calmer animal and a calmer household.`,
  (subj) => `High-energy ${subj} do better with a rhythm of daily activity than with weekend-only bursts — the drive is daily, and so the outlets should be too.`
];
const OUTLETS_REGEX = /([A-Z][A-Za-z' \-]+?)s with high energy levels need consistent outlets for their drive and enthusiasm\./g;

// --- 6. "At the end of the day, BREED ownership is about companionship. The grooming, the vet visits, the training — those are the practical side. The emotional return is a small animal that knows you, trusts you, and becomes a genuine part of your family. Most BREED owners say that part makes everything else worthwhile."
const COMPANIONSHIP_V = [
  (breed, species) => `Strip everything else away and ${breed} ownership comes down to the relationship. Grooming, vet visits, and training are the operating costs; what they buy is ${species === 'small animal' ? 'an' : 'a'} ${species} that recognises you, trusts you, and integrates into the household. Most ${breed} owners describe that dynamic as the reason the rest of it is worth doing.`,
  (breed, species) => `The daily mechanics of keeping a ${breed} — grooming, vet trips, training sessions — are real, but they are the supporting cast. The lead is the bond: ${species === 'small animal' ? 'an' : 'a'} ${species} that knows its people, settles around them, and becomes part of the family. Most ${breed} owners report that the emotional side quietly outweighs the logistical one.`,
  (breed, species) => `${breed} ownership is, at its core, a relationship. Everything else — grooming, veterinary care, training — is infrastructure. What you actually get in return is ${species === 'small animal' ? 'an' : 'a'} ${species} that knows you, relaxes around you, and becomes woven into household life. Most ${breed} owners say that piece is what carries the rest.`,
  (breed, species) => `Behind the grooming, the vet visits, and the training sits the real reason people keep ${breed}s: the companionship. ${species === 'small animal' ? 'An' : 'A'} ${species} that recognises its people and trusts them is a genuine presence in a home, and most ${breed} owners say that's the part that makes the upkeep feel like a fair trade.`,
  (breed, species) => `Owning a ${breed} is a practical commitment on paper — grooming, vet care, training — but the thing that keeps owners engaged is relational. ${species === 'small animal' ? 'An' : 'A'} ${species} that knows you and trusts you becomes part of the texture of daily life, and most ${breed} owners identify that bond as the reason they keep doing the work.`,
  (breed, species) => `The grooming, vet appointments, and training around a ${breed} are the operational half of ownership; the other half is the relationship. The ${species} learns your patterns, trusts your handling, and becomes a real participant in household life — and most ${breed} owners name that as the part that justifies the rest.`,
  (breed, species) => `Look past the schedule of grooming, vet care, and training and ${breed} ownership is really about a relationship with ${species === 'small animal' ? 'a small, aware animal' : `a ${species}`} that ends up knowing its people well. Most ${breed} owners will tell you that dynamic — more than the mechanics — is why the arrangement works.`,
  (breed, species) => `A ${breed} owner's daily list (grooming, vet visits, training) tells you the operational story, not the actual one. The actual one is the bond — ${species === 'small animal' ? 'an' : 'a'} ${species} that knows you, trusts you, and becomes part of the family unit — and most ${breed} owners cite that as what carries everything else.`
];
const COMPANIONSHIP_REGEX = /At the end of the day, ([A-Z][A-Za-z'\.()\- ]+?) ownership is about companionship\. The grooming, the vet visits, the training — those are the practical side\. The emotional return is a (small animal|dog|cat|bird|companion|pet) that knows you, trusts you, and becomes a genuine part of your family\. Most \1 owners say that part makes everything else worthwhile\./g;

function main() {
  const files = walk(ROOT);
  console.log(`Pass 12: scanning ${files.length} files...`);
  let filesModified = 0;
  const byKey = { health: 0, vet: 0, particular: 0, wQuirks: 0, wConsid: 0, wUnique: 0, outlets: 0, companion: 0 };
  let total = 0;
  let i = 0;
  for (const f of files) {
    i++;
    if (i % 2000 === 0) console.log(`  ... ${i}/${files.length}, modified ${filesModified}`);
    let html = fs.readFileSync(f, 'utf8');
    const orig = html;
    const seed = hash(f + ':p12');

    let count;

    count = 0;
    html = html.replace(HEALTH_AWARE_REGEX, (m, subj, conds) => {
      count++;
      return HEALTH_AWARE_V[(seed + count) % HEALTH_AWARE_V.length](subj, conds);
    });
    byKey.health += count; total += count;

    count = 0;
    html = html.replace(VET_BEST_REGEX, (m, sub1) => {
      count++;
      return VET_BEST_V[(seed + 3 + count) % VET_BEST_V.length](sub1);
    });
    byKey.vet += count; total += count;

    count = 0;
    html = html.replace(PARTICULAR_REGEX, (m, subj, size, shed, conds) => {
      count++;
      return PARTICULAR_V[(seed + 7 + count) % PARTICULAR_V.length](subj, size, shed, conds);
    });
    byKey.particular += count; total += count;

    count = 0;
    html = html.replace(WEIGHING_QUIRKS_REGEX, (m, wt, life, breed) => {
      count++;
      return WEIGHING_QUIRKS_V[(seed + 11 + count) % WEIGHING_QUIRKS_V.length](wt, life, breed);
    });
    byKey.wQuirks += count; total += count;

    count = 0;
    html = html.replace(WEIGHING_CONSIDERATIONS_REGEX, (m, wt, life, breed) => {
      count++;
      return WEIGHING_CONSIDERATIONS_V[(seed + 17 + count) % WEIGHING_CONSIDERATIONS_V.length](wt, life, breed);
    });
    byKey.wConsid += count; total += count;

    count = 0;
    html = html.replace(WEIGHING_UNIQUE_REGEX, (m, wt, life, breed) => {
      count++;
      return WEIGHING_UNIQUE_V[(seed + 19 + count) % WEIGHING_UNIQUE_V.length](wt, life, breed);
    });
    byKey.wUnique += count; total += count;

    count = 0;
    html = html.replace(OUTLETS_REGEX, (m, subj) => {
      count++;
      return OUTLETS_V[(seed + 23 + count) % OUTLETS_V.length](subj);
    });
    byKey.outlets += count; total += count;

    count = 0;
    html = html.replace(COMPANIONSHIP_REGEX, (m, breed, species) => {
      count++;
      return COMPANIONSHIP_V[(seed + 29 + count) % COMPANIONSHIP_V.length](breed, species);
    });
    byKey.companion += count; total += count;

    if (html !== orig) {
      fs.writeFileSync(f, html);
      filesModified++;
    }
  }
  console.log('\n=== PASS 12 COMPLETE ===');
  console.log(JSON.stringify({ filesScanned: files.length, filesModified, replacements: total, byKey }, null, 2));
}

main();
