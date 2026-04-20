// Pass 9: Fix regex mismatches from pass 8 - capture the actual phrasing variations.

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

const CHOOSE_PROFILE_V = [
  () => `Pick the option whose profile lines up best with your schedule, tolerance for variable costs, and the commitment you realistically want to make.`,
  () => `The decision largely comes down to which profile matches your weekly time, your budget's flexibility, and your long-term appetite for care.`,
  () => `Base the choice on fit: the weekly schedule the animal requires, the budget surface area it creates, and the commitment you're actually ready to sustain.`,
  () => `What matters here is alignment between your schedule, your budget tolerance, and the profile of daily and lifetime care each animal demands.`,
  () => `Select for the profile that genuinely matches how you live — weekly time, budget elasticity, and the commitment you can sustain across years.`,
  () => `The right call here is the animal whose care cadence fits your actual week, budget swings you can absorb, and a commitment you can realistically keep.`,
  () => `Match the decision to your real constraints: weekly time, budget tolerance, and the realistic span of commitment your household can offer.`,
  () => `This is a fit question more than a preference question — align the choice to your schedule, your budget's flexibility, and your honest long-term commitment.`
];
const CHOOSE_PROFILE_REGEX = /Choose based on which profile matches schedule, budget tolerance, and long-term(?: care)? commitment(?: realistically)?\./g;

const DAILY_WORKLOAD_V = [
  () => `Base the choice on the workload you can genuinely absorb daily, the temperament you actually want in the home, and the long-term health trajectory you're comfortable taking on.`,
  () => `The decision should follow these inputs: daily care load, temperament fit with the household, the long-term health outlook you can sustain, and your budget realities.`,
  () => `Weigh these things: how much daily care you can give, which temperament actually suits your household, which long-term health profile you can carry, and your budget.`,
  () => `Good decisions here match daily care bandwidth, household temperament preferences, a realistic view of long-term health commitments, and household budget constraints.`,
  () => `Decide along these axes: daily care workload, temperament alignment with your home, long-term health economics, and your actual household budget.`,
  () => `The cleanest decision combines honest daily care bandwidth, a temperament you actually want to live with, a long-term health outlook you can fund, and a realistic budget view.`,
  () => `Choose by matching daily time commitment, temperament fit, long-term health outlook, and household budget — all four matter more than first impressions.`,
  () => `A defensible choice reflects the daily workload you can maintain, the temperament you'll enjoy, the long-term health profile you can support, and the budget you have.`
];
const DAILY_WORKLOAD_REGEX = /Choices should be based on daily care workload, temperament fit, long-term health(?: risk)? (?:outlook|profile)[^<.]*?\./g;

const FIRST_TIME_V = [
  (breed) => `First-time owners generally have better outcomes with whichever breed has the more forgiving training requirements and lower daily maintenance.`,
  (breed) => `New owners tend to succeed faster with the breed that is more forgiving to train and lighter on daily maintenance.`,
  (breed) => `If this is a first pet, lean toward the breed whose training curve and daily care needs offer the larger margin for error.`,
  (breed) => `For first-time households, the breed with more forgiving training requirements and lower daily maintenance typically produces better early outcomes.`,
  (breed) => `The breed with the gentler training curve and lower daily maintenance is usually the safer first-pet choice.`,
  (breed) => `New owners generally do better with whichever option has a more forgiving training profile and lighter daily maintenance.`,
  (breed) => `First-pet households tend to see smoother months with the breed whose training requirements are more forgiving and whose daily care demands are lower.`,
  (breed) => `For a first animal, the more forgiving training requirements and lower daily maintenance demands are usually the safer bets.`
];
const FIRST_TIME_REGEX = /First-time owners typically do better with whichever breed has more forgiving training requirements[^<.]*?\./g;

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
  console.log(`Pass 9: scanning ${files.length} files...`);
  let filesModified = 0;
  const byKey = { chooseProfile: 0, dailyWorkload: 0, firstTime: 0 };
  let total = 0;
  let i = 0;
  for (const f of files) {
    i++;
    if (i % 1500 === 0) console.log(`  ... ${i}/${files.length}, modified ${filesModified}`);
    let html = fs.readFileSync(f, 'utf8');
    const orig = html;
    const breed = breedFromPath(f);
    const seed = hash(f + ':p9');

    let count = 0;
    html = html.replace(CHOOSE_PROFILE_REGEX, () => { count++; return CHOOSE_PROFILE_V[(seed + count) % CHOOSE_PROFILE_V.length](); });
    byKey.chooseProfile += count; total += count;

    count = 0;
    html = html.replace(DAILY_WORKLOAD_REGEX, () => { count++; return DAILY_WORKLOAD_V[(seed + 7 + count) % DAILY_WORKLOAD_V.length](); });
    byKey.dailyWorkload += count; total += count;

    count = 0;
    html = html.replace(FIRST_TIME_REGEX, () => { count++; return FIRST_TIME_V[(seed + 13 + count) % FIRST_TIME_V.length](breed); });
    byKey.firstTime += count; total += count;

    if (html !== orig) { fs.writeFileSync(f, html); filesModified++; }
  }
  console.log('\n=== PASS 9 COMPLETE ===');
  console.log(JSON.stringify({ filesScanned: files.length, filesModified, replacements: total, byKey }, null, 2));
}

main();
