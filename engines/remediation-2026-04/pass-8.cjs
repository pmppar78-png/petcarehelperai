// Pass 8: Target top remaining recurring paragraph fingerprints on vs-* and other comparison pages.
// These span 200-1400 pages each.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');

function hash(s) { return parseInt(crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 8), 16); }
function titleCase(s) { return String(s || '').replace(/\b\w/g, c => c.toUpperCase()).replace(/-/g, ' '); }
function breedFromPath(p) {
  const m = p.match(/\/commercial\/[^/]+\/([^/]+)\//) || p.match(/\/breeds\/[^/]+\/([^/]+?)(?:\.html)?$/);
  return m ? titleCase(m[1]) : 'pet';
}

// --- Cluster 1: Choose based on which profile... (1352)
const CHOOSE_PROFILE_V = [
  () => `Pick the option whose profile lines up best with your schedule, your tolerance for variable costs, and the commitment you realistically want to make.`,
  () => `The decision largely comes down to which profile matches your weekly time, your budget's flexibility, and your long-term appetite for care.`,
  () => `Base the choice on fit: the weekly schedule the animal requires, the budget surface area it creates, and the commitment you're actually ready to sustain.`,
  () => `What matters here is alignment between your schedule, your budget tolerance, and the profile of daily and lifetime care each animal demands.`,
  () => `Select for the profile that genuinely matches how you live — weekly time, budget elasticity, and the commitment you can sustain across years.`,
  () => `The right call here is the animal whose care cadence fits your actual week, budget swings you can absorb, and a commitment you can realistically keep.`,
  () => `Match the decision to your real constraints: weekly time, budget tolerance, and the realistic span of commitment your household can offer.`,
  () => `This is a fit question more than a preference question — align the choice to your schedule, your budget's flexibility, and your honest long-term commitment.`
];
const CHOOSE_PROFILE_REGEX = /Choose based on which profile matches schedule, budget tolerance, and long-term commitment realistically\./g;

// --- Cluster 2: Choices should be based on daily care workload... (1340)
const DAILY_WORKLOAD_V = [
  () => `Base the choice on the workload you can genuinely absorb daily, the temperament you actually want in the home, and the long-term health trajectory you're comfortable taking on.`,
  () => `The decision should follow three inputs: daily care load, temperament fit with the household, and the long-term health outlook you can sustain.`,
  () => `Weigh three things: how much daily care you can give, which temperament actually suits your household, and which long-term health profile you can carry.`,
  () => `Good decisions here match daily care bandwidth, household temperament preferences, and a realistic view of the long-term health commitments involved.`,
  () => `Decide along three axes: daily care workload, temperament alignment with your home, and long-term health economics you can absorb.`,
  () => `The cleanest decision combines honest daily care bandwidth, a temperament you actually want to live with, and a long-term health outlook you can fund.`,
  () => `Choose by matching daily time commitment, temperament fit, and long-term health outlook — all three matter more than first impressions.`,
  () => `A defensible choice reflects three things: the daily workload you can maintain, the temperament you'll enjoy, and the long-term health profile you can support.`
];
const DAILY_WORKLOAD_REGEX = /Choices should be based on daily care workload, temperament fit, long-term health outlook, and household constraints\./g;

// --- Cluster 3: If you're looking for the less demanding option (721)
const LESS_DEMANDING_V = [
  () => `If lower daily demand is the deciding factor, weigh the time each breed actually takes, the grooming realities, and how much space each one genuinely needs.`,
  () => `When the goal is the less demanding pet, compare honest daily time, grooming cadence, and spatial footprint — not the romanticised version of each.`,
  () => `For owners prioritising lower demand, the meaningful comparison sits at three points: real daily time, grooming load, and space requirements.`,
  () => `If demand is the main axis, look at daily hands-on time, grooming frequency, and space requirements for the realistic version of each breed.`,
  () => `When the aim is lower daily demand, evaluate time, grooming, and space side-by-side rather than relying on breed reputation.`,
  () => `Optimising for lower demand means evaluating actual daily time commitments, grooming cadence, and space needs — in that order.`,
  () => `For households choosing the less demanding option, the decisive factors are hands-on daily time, grooming frequency, and space requirements.`,
  () => `If you're leaning toward the lower-demand choice, the honest comparison is daily time, grooming, and space — the rest sorts out from there.`
];
const LESS_DEMANDING_REGEX = /If you're looking for the less demanding option, focus on daily time commitment[^<.]*?\./g;

// --- Cluster 4: Your choice should reflect which animal's care demands (709)
const ANIMAL_CARE_DEMANDS_V = [
  () => `Let the choice follow the animal whose care demands fit your household's actual rhythm and available capacity most cleanly.`,
  () => `Pick the animal whose care requirements match your household's real schedule and bandwidth, not the one that looks more appealing on paper.`,
  () => `The right call favours the animal whose daily demands slot into your household's available time, energy, and attention.`,
  () => `Choose the animal whose care profile aligns with your household's genuine rhythm rather than the one that feels more aspirational.`,
  () => `The decision rewards honesty about your household's capacity: pick the animal whose demands actually fit the life you're living now.`,
  () => `Pick the animal whose care demands match the household you have, not the one you wish you had — the fit shows up every day.`,
  () => `Align the choice with your household's observable patterns: sleep, schedule, travel frequency, bandwidth. The animal whose needs fit those patterns tends to thrive.`,
  () => `Select the animal whose daily and weekly demands sit comfortably inside your household's real capacity rather than at the edge of it.`
];
const ANIMAL_CARE_DEMANDS_REGEX = /Your choice should reflect which animal's care demands align best with your household[^<.]*?\./g;

// --- Cluster 5: Picking the right pet means honestly evaluating (602)
const PICKING_RIGHT_V = [
  () => `Picking well here comes down to an honest audit of time, budget, and the willingness to adapt routines as the animal's needs shift.`,
  () => `The right choice reveals itself when you audit your own schedule, budget, and willingness to adjust routines truthfully, not optimistically.`,
  () => `A good decision here follows from an honest inventory of time, money, and the household's elasticity around new routines.`,
  () => `The decision is sharper after an honest audit of three inputs: weekly time, household budget, and willingness to restructure routines.`,
  () => `Pick well by accepting the honest numbers on time, money, and your own tolerance for adjusting routines around a new animal.`,
  () => `Good pet-choice decisions start with an unvarnished read on time available, budget available, and the household's flexibility to change its routines.`,
  () => `The useful exercise here is an honest audit of your time, your budget, and your willingness to change how the household runs — then the right animal becomes clearer.`,
  () => `Make the decision from real data on your schedule, budget, and routine-flexibility rather than from an idealised version of any of them.`
];
const PICKING_RIGHT_REGEX = /Picking the right pet means honestly evaluating your time, budget, and willingness[^<.]*?\./g;

// --- Cluster 6: Between these two, the one with lower grooming (602)
const LOWER_GROOMING_V = [
  () => `The lower-grooming, more-moderate-exercise option generally suits a busier household, while the higher-maintenance choice tends to reward households with more daily time.`,
  () => `Of the two, the one with lighter grooming and moderate exercise is usually the better fit for time-constrained households; the other suits owners with more day-to-day availability.`,
  () => `For households with less spare time, the lower-grooming and more-moderate-exercise option is typically the better fit; the other rewards a more hands-on schedule.`,
  () => `If available time is tight, favour the lower-grooming, more-moderate-exercise option; if the household has more capacity, the other rewards that investment.`,
  () => `Households with limited daily time usually do better with the lower-grooming, moderate-exercise option; households with more bandwidth can carry the higher-maintenance alternative.`,
  () => `The lighter-grooming, moderate-exercise option is the safer bet for busier households; the heavier-care option pays back households that have more time to give.`,
  () => `Time-constrained households usually land on the lower-grooming, moderate-exercise option; households with more daily hours can carry the other.`,
  () => `Between the two, the gentler-grooming, moderate-exercise choice fits constrained schedules; the more demanding option suits households with real daily bandwidth.`
];
const LOWER_GROOMING_REGEX = /Between these two, the one with lower grooming demands and more moderate exercise[^<.]*?\./g;

// --- Cluster 7: If minimizing vet visits is a priority (469)
const MIN_VET_V = [
  () => `If keeping vet visits to a minimum is important, compare each breed's hereditary health risks and typical lifespan expectations before deciding.`,
  () => `When minimising vet visits matters, look at each breed's genetic health profile and typical lifespan — those two predict the ongoing clinical load better than anything else.`,
  () => `For owners trying to reduce clinical load, the useful comparison is each breed's hereditary health risks and expected lifespan.`,
  () => `If fewer vet visits is a real priority, weigh each breed's genetic risk list and expected lifespan side by side.`,
  () => `Households aiming to minimise vet interaction should compare breed-specific genetic risks and lifespan expectations head-to-head.`,
  () => `If reduced vet contact matters, the decisive factors are breed-level genetic predispositions and typical lifespan — both drive lifetime visit volume.`,
  () => `To minimise vet visits, compare hereditary health risks and typical lifespan for each breed before temperament and aesthetics.`,
  () => `For lower lifetime vet load, the relevant comparison is genetic health profile and expected lifespan for each breed.`
];
const MIN_VET_REGEX = /If minimizing vet visits is a priority, compare each breed's genetic health profile[^<.]*?\./g;

// --- Cluster 8: A conversation with your veterinarian ensures (395)
const VET_CONVERSATION_V = [
  (breed) => `A call with your vet converts the general guidance here into a plan tailored to the ${breed} in front of them.`,
  (breed) => `Your veterinarian is the one who translates general ${breed} guidance into a plan that reflects the individual animal and its current condition.`,
  (breed) => `Running the specifics past your vet turns this page's generalities into a concrete ${breed} care plan.`,
  (breed) => `The vet's role is to adapt general ${breed} guidance into something calibrated to your animal's actual profile.`,
  (breed) => `A five-minute vet conversation is how generic ${breed} guidance becomes a plan fitted to your specific animal.`,
  (breed) => `Talk the specifics through with your vet so the generalities here become a ${breed} plan calibrated to your animal's current status.`,
  (breed) => `Your vet's input converts these pages of ${breed} guidance into a plan that reflects your animal's weight, age, and health history.`,
  (breed) => `A brief conversation with your veterinarian translates this general ${breed} framework into a plan that fits the individual animal.`
];
const VET_CONVERSATION_REGEX = /A conversation with your veterinarian ensures these general guidelines get adapted[^<.]*?\./g;

// --- Cluster 9: First-time owners typically do better (359)
const FIRST_TIME_V = [
  () => `First-time owners generally have better outcomes with whichever breed has the more forgiving temperament and lower specialist-care needs.`,
  () => `New owners tend to succeed faster with the breed that is more forgiving day-to-day and lighter on specialist care requirements.`,
  () => `If this is a first pet, lean toward the breed whose temperament and care needs offer the larger margin for error.`,
  () => `For first-time households, the breed with the more forgiving temperament and lower specialist-care burden typically produces better early outcomes.`,
  () => `The breed with the gentler learning curve and lower specialist-care needs is usually the safer first-pet choice.`,
  () => `New owners generally do better with whichever option has a more forgiving day-to-day profile and fewer specialist-care demands.`,
  () => `First-pet households tend to see smoother months with the breed that is lower maintenance in both temperament and specialist care.`,
  () => `For a first animal, the more forgiving temperament and lower specialist-care load are usually the safer bets.`
];
const FIRST_TIME_REGEX = /First-time owners typically do better with whichever breed has more forgiving temperament[^<.]*?\./g;

// --- Cluster 10: Spend time with both breeds if possible (334)
const SPEND_TIME_V = [
  () => `If possible, spend real time with both breeds — breed-specific meetups, visits with current owners, and time at events tell you more than any written profile.`,
  () => `Direct exposure beats reading: breed meetups, owner visits, and events surface temperament differences that text cannot capture.`,
  () => `Where possible, get face-time with both breeds — at meetups, with existing owners, or at breed-specific events — before committing.`,
  () => `The honest comparison comes from spending actual time with each breed: meetups, owner visits, and breed-specific events reveal what profiles cannot.`,
  () => `If the option exists, log real hours with both breeds before deciding — breed meetups and conversations with owners compress a lot of learning.`,
  () => `Spend what time you can with each breed in person; breed meetups and owner conversations are the cheapest way to reduce decision risk.`,
  () => `Practical exposure — meetups, owner conversations, breed-specific events — tells you more in an afternoon than profiles tell you in a week.`,
  () => `Prioritise in-person exposure to both breeds; meetups, events, and owner visits surface fit considerations that written guides miss.`
];
const SPEND_TIME_REGEX = /Spend time with both breeds if possible — attending breed-specific meetups[^<.]*?\./g;

// --- Cluster 11: List your non-negotiables (329)
const NON_NEGOTIABLES_V = [
  () => `Start by listing your actual non-negotiables — real exercise time, grooming commitment, budget ceiling — and use that list to narrow the options.`,
  () => `Write out your genuine non-negotiables first: available daily time, grooming tolerance, and budget ceiling. Let those filter the options.`,
  () => `Name your non-negotiables honestly up front — exercise time, grooming willingness, budget tolerance — and the shortlist shrinks quickly.`,
  () => `An honest list of non-negotiables — time, grooming, budget — is the cheapest decision aid available at this stage.`,
  () => `Make your non-negotiables concrete: how much exercise time you actually have, how much grooming you'll tolerate, and what your real budget ceiling is.`,
  () => `A clear list of non-negotiables (exercise time, grooming, budget) removes most of the noise from the decision.`,
  () => `Enumerate the non-negotiables — daily time, grooming, budget — before comparing breeds; most of the decision happens at that list.`,
  () => `Your non-negotiables are the real filter: exercise capacity, grooming commitment, and budget ceiling. Write them down, then compare.`
];
const NON_NEGOTIABLES_REGEX = /List your non-negotiables — exercise time you can commit to, grooming you're willing[^<.]*?\./g;

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

const PATTERNS = [
  { key: 'chooseProfile', regex: CHOOSE_PROFILE_REGEX, variants: CHOOSE_PROFILE_V, needsBreed: false },
  { key: 'dailyWorkload', regex: DAILY_WORKLOAD_REGEX, variants: DAILY_WORKLOAD_V, needsBreed: false },
  { key: 'lessDemanding', regex: LESS_DEMANDING_REGEX, variants: LESS_DEMANDING_V, needsBreed: false },
  { key: 'animalCareDemands', regex: ANIMAL_CARE_DEMANDS_REGEX, variants: ANIMAL_CARE_DEMANDS_V, needsBreed: false },
  { key: 'pickingRight', regex: PICKING_RIGHT_REGEX, variants: PICKING_RIGHT_V, needsBreed: false },
  { key: 'lowerGrooming', regex: LOWER_GROOMING_REGEX, variants: LOWER_GROOMING_V, needsBreed: false },
  { key: 'minVet', regex: MIN_VET_REGEX, variants: MIN_VET_V, needsBreed: false },
  { key: 'vetConversation', regex: VET_CONVERSATION_REGEX, variants: VET_CONVERSATION_V, needsBreed: true },
  { key: 'firstTime', regex: FIRST_TIME_REGEX, variants: FIRST_TIME_V, needsBreed: false },
  { key: 'spendTime', regex: SPEND_TIME_REGEX, variants: SPEND_TIME_V, needsBreed: false },
  { key: 'nonNegotiables', regex: NON_NEGOTIABLES_REGEX, variants: NON_NEGOTIABLES_V, needsBreed: false }
];

function main() {
  const files = walk(ROOT);
  console.log(`Pass 8: scanning ${files.length} files...`);
  let filesModified = 0;
  const byKey = {};
  let total = 0;
  let i = 0;
  for (const f of files) {
    i++;
    if (i % 1500 === 0) console.log(`  ... ${i}/${files.length}, modified ${filesModified}`);
    let html = fs.readFileSync(f, 'utf8');
    const orig = html;
    const breed = breedFromPath(f);
    const baseSeed = hash(f + ':p8');

    for (const p of PATTERNS) {
      let count = 0;
      html = html.replace(p.regex, () => {
        count++;
        const v = p.variants[(baseSeed + PATTERNS.indexOf(p) * 31 + count) % p.variants.length];
        return p.needsBreed ? v(breed) : v();
      });
      byKey[p.key] = (byKey[p.key] || 0) + count;
      total += count;
    }

    if (html !== orig) { fs.writeFileSync(f, html); filesModified++; }
  }
  console.log('\n=== PASS 8 COMPLETE ===');
  console.log(JSON.stringify({ filesScanned: files.length, filesModified, replacements: total, byKey }, null, 2));
}

main();
