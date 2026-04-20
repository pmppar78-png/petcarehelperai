// Pass 7: catch species-specific ({species} not "pet") variants missed by pass 6, plus
// training regex with parentheses in trait.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');

function hash(s) { return parseInt(crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 8), 16); }
function titleCase(s) { return String(s || '').replace(/\b\w/g, c => c.toUpperCase()).replace(/-/g, ' '); }
function breedFromPath(p) {
  const m = p.match(/\/commercial\/[^/]+\/([^/]+)\//) || p.match(/\/breeds\/[^/]+\/([^/]+?)(?:\.html)?$/) || p.match(/\/guides\/([^/]+?)(?:\.html)?$/);
  return m ? titleCase(m[1]) : 'pet';
}

const OWNERS_V = [
  (breed) => `The households that internalise this corner of ${breed} care almost always avoid worst-case reactions.`,
  (breed) => `When an owner understands this part of ${breed} care properly, panic rarely becomes the default mode.`,
  (breed) => `Real familiarity with this slice of ${breed} care keeps households out of reactive decision-making.`,
  (breed) => `Owners with a solid grasp of this layer tend to make calmer, more measured ${breed} decisions under pressure.`,
  (breed) => `Households that genuinely know this part of ${breed} care rarely find themselves in emergency-mode responses.`,
  (breed) => `A ${breed} owner who has actually learned this aspect of care tends to act, not panic.`,
  (breed) => `When the household is genuinely fluent in this dimension of ${breed} care, the reactive decisions tend to drop away.`,
  (breed) => `Skilled ${breed} households rarely land on worst-case reactions because they have already thought this through.`,
  (breed) => `An owner who has done the reading on this part of ${breed} care tends to respond thoughtfully rather than reactively.`,
  (breed) => `When ${breed} households understand this aspect of care, the default response to the unexpected moves from panic to observation.`
];

const GETTING_V = [
  (breed) => `Handling this well for a ${breed} is a matter of informed, repeatable decisions rather than a perfect plan.`,
  (breed) => `Getting this right for a ${breed} is less about any specific action and more about the household doing the same informed thing every week.`,
  (breed) => `Quality ${breed} care here is produced by repeatable, informed choices rather than any single brilliant call.`,
  (breed) => `With a ${breed}, informed repetition beats perfection — the households that quietly repeat sensible choices outperform the ones chasing ideal ones.`,
  (breed) => `For a ${breed}, the useful goal is a set of repeatable, informed decisions, not a single perfect plan.`,
  (breed) => `What makes the difference for a ${breed} here is the steady repetition of good-enough choices rather than occasional perfect ones.`,
  (breed) => `A ${breed} benefits most from repeatable, thoughtful decisions that keep being made week after week.`,
  (breed) => `Strong ${breed} care on this dimension is made of small, repeatable decisions rather than any heroic one-off effort.`,
  (breed) => `For a ${breed}, informed repetition across months tends to outperform any perfect one-off effort.`,
  (breed) => `The ${breed} households that do well on this dimension are the ones quietly repeating informed choices, not chasing perfection.`
];

const TRAINING_V = [
  (breed, trait, tend) => `Working with a ${breed}'s ${trait} trainability profile — rather than against it — is what makes training sessions land, particularly given the natural ${tend} tendencies.`,
  (breed, trait, tend) => `${breed}s respond best when the training plan matches their ${trait} profile and acknowledges their natural ${tend} habits.`,
  (breed, trait, tend) => `Training outcomes for a ${breed} improve materially when the plan is calibrated to the ${trait} profile and the natural ${tend} tendencies.`,
  (breed, trait, tend) => `A ${breed}'s ${trait} trainability and natural ${tend} tendencies set the frame — good training works with that frame, not around it.`,
  (breed, trait, tend) => `Training effort for a ${breed} pays off most when it respects the ${trait} trainability profile and leans into the natural ${tend} habits.`,
  (breed, trait, tend) => `Effective ${breed} training acknowledges the ${trait} trainability profile and the natural ${tend} tendencies at the same time.`,
  (breed, trait, tend) => `For a ${breed}, well-designed training respects the ${trait} trainability baseline and works with the natural ${tend} pattern.`,
  (breed, trait, tend) => `${breed} training lands when the session design maps to the ${trait} profile and the natural ${tend} instincts.`,
  (breed, trait, tend) => `Building a training routine around a ${breed}'s ${trait} profile and its natural ${tend} tendencies tends to produce steadier outcomes than generic training advice.`,
  (breed, trait, tend) => `Good ${breed} training starts from the ${trait} trainability baseline and accepts the natural ${tend} tendencies rather than fighting them.`
];

// Allow any species word; match full sentence
const OWNERS_REGEX = /Owners who understand this piece of [a-z]+ care rarely default to worst-case reactions\./g;
const GETTING_REGEX = /Getting this right for a [a-z]+ is less about perfection and more about making informed, repeatable calls\./g;
// Allow parentheses / full words in trait & tendency
const TRAINING_REGEX = /Successful training for ([A-Z][A-Za-z '.-]+(?:\s*\([^)]+\))?) respects this (?:breed|species)'s ([a-z -]+(?:\s*\([^)]+\))?) trainability profile and natural ([a-z -]+(?:\s*\([^)]+\))?) tendencies\./g;

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
  console.log(`Pass 7: scanning ${files.length} files...`);
  let filesModified = 0;
  const byKey = { owners: 0, getting: 0, training: 0 };
  let total = 0;
  let i = 0;
  for (const f of files) {
    i++;
    if (i % 1500 === 0) console.log(`  ... ${i}/${files.length}, modified ${filesModified}`);
    let html = fs.readFileSync(f, 'utf8');
    const orig = html;
    const breed = breedFromPath(f);
    const seed = hash(f + ':p7');

    let count = 0;
    html = html.replace(OWNERS_REGEX, () => { count++; return OWNERS_V[(seed + count) % OWNERS_V.length](breed); });
    byKey.owners += count; total += count;

    count = 0;
    html = html.replace(GETTING_REGEX, () => { count++; return GETTING_V[(seed + 3 + count) % GETTING_V.length](breed); });
    byKey.getting += count; total += count;

    count = 0;
    html = html.replace(TRAINING_REGEX, (m, b, trait, tend) => { count++; return TRAINING_V[(seed + 7 + count) % TRAINING_V.length](b, trait, tend); });
    byKey.training += count; total += count;

    if (html !== orig) { fs.writeFileSync(f, html); filesModified++; }
  }
  console.log('\n=== PASS 7 COMPLETE ===');
  console.log(JSON.stringify({ filesScanned: files.length, filesModified, replacements: total, byKey }, null, 2));
}

main();
