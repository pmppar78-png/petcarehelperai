// Pass 11: Break remaining location-page fingerprints.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');

function hash(s) { return parseInt(crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 8), 16); }

const VISITING_V = [
  () => `An in-person visit before committing is the cheapest way to verify that a facility's practice matches its marketing.`,
  () => `Touring a facility before booking services reveals operational patterns that online reviews almost never capture.`,
  () => `A walk-through before commitment tells you more about the facility's actual standards than an hour of reading reviews.`,
  () => `Visit the facility in person before signing anything — the gap between the website and the reality is where most bad experiences originate.`,
  () => `Physical visits beat online research for evaluating local pet services; see the kennels, the exam rooms, and the staff interactions first.`,
  () => `Go see the place. A short tour of kennels, treatment areas, and waiting rooms shows you things online listings cannot.`,
  () => `Arrange a brief site visit before booking — the tone at reception, the state of the facilities, and how staff handle pets in the building all carry information.`,
  () => `Visiting in person is the single most efficient pre-booking check; it typically surfaces dealbreakers within the first few minutes.`
];
const VISITING_REGEX = /Visiting a facility in person before committing gives you a firsthand[^<.]*?\./g;

const FISH_TANK_V = [
  (breed, size) => `A ${breed} does best with at least ${size} — bigger water volumes give you more stable chemistry, extra swim space, and flexibility when you want to add tankmates.`,
  (breed, size) => `Plan for a minimum of ${size} for a ${breed}; larger tanks are easier to manage because they buffer water-chemistry swings and give the fish room to establish territory.`,
  (breed, size) => `${breed}s need a starting tank of ${size} or more. Larger systems are more forgiving on water chemistry and far easier on tankmate compatibility.`,
  (breed, size) => `Size the tank at ${size} or greater for a ${breed}. Bigger volumes stabilise parameters and widen your aquascaping and tankmate options.`,
  (breed, size) => `Target a ${size} tank at minimum for a ${breed}. The larger footprint provides the stability and flexibility that small tanks tend to lack.`,
  (breed, size) => `Don't go below ${size} for a ${breed}. Larger tanks are measurably easier to keep stable and open up more layout options.`,
  (breed, size) => `${size} is the floor for a ${breed}; above that, water-chemistry stability and tankmate options improve substantially.`,
  (breed, size) => `Size up to at least ${size} for a ${breed}. Bigger tanks forgive mistakes that smaller ones punish, and the aesthetics improve too.`
];
// "require a minimum tank size of X+ gallons. Larger tanks are always better..."
const FISH_TANK_REGEX = /([A-Z][A-Za-z' -]+)s? require a minimum tank size of (\d+\+? gallons)\. Larger tanks are always better as they provide more stable water conditions[^<.]*?\./g;

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
  console.log(`Pass 11: scanning ${files.length} files...`);
  let filesModified = 0;
  const byKey = { visiting: 0, fishTank: 0 };
  let total = 0;
  let i = 0;
  for (const f of files) {
    i++;
    if (i % 1500 === 0) console.log(`  ... ${i}/${files.length}, modified ${filesModified}`);
    let html = fs.readFileSync(f, 'utf8');
    const orig = html;
    const seed = hash(f + ':p11');

    let count = 0;
    html = html.replace(VISITING_REGEX, () => { count++; return VISITING_V[(seed + count) % VISITING_V.length](); });
    byKey.visiting += count; total += count;

    count = 0;
    html = html.replace(FISH_TANK_REGEX, (m, breed, size) => { count++; return FISH_TANK_V[(seed + 7 + count) % FISH_TANK_V.length](breed, size); });
    byKey.fishTank += count; total += count;

    if (html !== orig) { fs.writeFileSync(f, html); filesModified++; }
  }
  console.log('\n=== PASS 11 COMPLETE ===');
  console.log(JSON.stringify({ filesScanned: files.length, filesModified, replacements: total, byKey }, null, 2));
}

main();
