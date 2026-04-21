#!/usr/bin/env node
/**
 * Pass 2: Humanization + Internal-Linking Expansion
 *
 * Hunts down residual templated phrases left by earlier generators and
 * rewrites them with varied alternatives, and upgrades "Related Guides"
 * anchor language to feel more editorial. Runs across every species under
 * breeds/, commercial/, and guides/.
 *
 * Idempotent: a second run finds nothing to replace.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

const counters = {
  filesTouched: 0,
  fewChecklists: 0,
  revealsPersonality: 0,
  budgetCushion: 0,
  careRhythm: 0,
  noTwoKins: 0,
  owningMeansAdjusting: 0,
  genericOwnerIntro: 0,
};

function hashInt(str, mod) {
  const h = crypto.createHash('md5').update(str).digest();
  return h.readUInt32BE(0) % mod;
}
const pick = (arr, seed) => arr[hashInt(seed, arr.length)];
const article = (n) => /^[aeiou]/i.test(n) ? 'an' : 'a';

function slugFromPath(p) {
  return path.basename(p).replace(/\.html$/, '');
}

function nameFromBreedPath(p) {
  const base = slugFromPath(p);
  return base.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function humanize(filePath, html) {
  const slug = slugFromPath(filePath);
  let out = html;

  // 1) "Few checklists for a X emphasize this..." — generic filler. Rewrite
  //    into a neutral editorial introduction that doesn't make claims about
  //    what checklists do or don't include.
  const fewRe = /<p>Few checklists for (?:a|an) ([A-Z][A-Za-z' -]+?) emphasize this, yet veterinarians flag it repeatedly for a reason\.\s*(?:Take the time to learn what your individual [^<]* life\.)?\s*<\/p>/g;
  out = out.replace(fewRe, (m, name) => {
    counters.fewChecklists++;
    const alts = [
      `<p>Follow-up reading for ${name} households — the pages below answer the questions most owners hit within the first year.</p>`,
      `<p>A short set of ${name}-specific deep-dives worth bookmarking before a problem brings you back to the vet.</p>`,
      `<p>Most ${name} owners eventually land on these topics. Reading them early makes the first-year learning curve much shorter.</p>`,
      `<p>Practical companions to this page — each answers one of the ${name}-specific questions that comes up most often at checkups.</p>`,
    ];
    return pick(alts, name + ':few');
  });

  // 2) "A {Name} reveals more of its personality over time..."
  const revealsRe = /<p>A ([A-Z][A-Za-z' -]+?) reveals more of its personality over time, and experienced owners know that respecting the animal's natural tendencies leads to a better relationship\. Every quirk has a reason, and the owners who take time to learn those reasons tend to be the most satisfied\.<\/p>/g;
  out = out.replace(revealsRe, (m, name) => {
    counters.revealsPersonality++;
    const a = article(name);
    const alts = [
      `<p>${a[0].toUpperCase() + a.slice(1)} ${name}'s personality unfolds on its own timeline. Early on, most owners misread the quirks as problems; a few months in, the same behaviors usually make sense once you've watched them in context.</p>`,
      `<p>It takes months, not days, to read ${a} ${name} well. The owners who are the happiest with the breed are usually the ones who let the relationship develop rather than trying to decode everything in the first week.</p>`,
      `<p>${a[0].toUpperCase() + a.slice(1)} ${name} rewards patient observation. The quirks that feel inconvenient at first almost always have a reason — figuring out the reason is how the relationship deepens.</p>`,
    ];
    return pick(alts, name + ':reveals');
  });

  // 3) "No two X share the exact same baseline; a short call with the veterinarian..."
  const noTwoKinsRe = /<p>No two ([A-Za-z' -]+?)s? share the exact same baseline; a short call with the veterinarian turns a generic plan into a workable one\.\s*<\/p>/g;
  out = out.replace(noTwoKinsRe, (m, name) => {
    counters.noTwoKins++;
    const alts = [
      `<p>Individual ${name}s vary more than breed averages suggest. A 10-minute conversation with your vet turns generic guidance into a plan that actually fits your animal.</p>`,
      `<p>Breed averages are a starting point, not a prescription. Your ${name}'s actual weight, bloodwork, and behavior are what refine the plan into something useful.</p>`,
      `<p>Generic care plans only work to a point. The specific ${name} in front of you — its diet tolerance, energy, and health history — is what tells you which parts of the generic advice actually apply.</p>`,
    ];
    return pick(alts, name + ':notwoshare');
  });

  // 4) "Welcoming a/an X means adjusting your lifestyle..." — the older generator variant.
  const welcomingRe2 = /<p>Welcoming an? ([A-Z][A-Za-z' -]+?) means adjusting your lifestyle, not just adding a pet\. From daily routines to long-term planning, this animal will become part of how you structure your time, and that's a good thing when approached with the right mindset\.<\/p>/g;
  out = out.replace(welcomingRe2, (m, name) => {
    counters.owningMeansAdjusting++;
    const a = article(name);
    const alts = [
      `<p>Owning ${a} ${name} is a structural change to how your week runs — feeding, exercise, downtime, and budget all shift around the animal. Households that plan for that adjustment tend to be the happiest long term.</p>`,
      `<p>${a[0].toUpperCase() + a.slice(1)} ${name} does not slot neatly into an existing schedule. Your routine flexes around the animal's real needs; the owners who expect that up front avoid most of the common frustrations.</p>`,
      `<p>Bringing home ${a} ${name} is more commitment than casual observers see from the outside. The daily time cost is modest, but the consistency it requires is what makes or breaks the relationship.</p>`,
    ];
    return pick(alts, name + ':welcome2');
  });

  // 5) "A dedicated emergency reserve for your X..." — useful content but repetitive.
  const budgetRe = /<p>A dedicated emergency reserve for your ([A-Z][A-Za-z' -]+?) — even a modest one — takes real pressure off when something unexpected comes up\. Whether it's an unplanned vet visit or replacement equipment, having that cushion means you won't have to hesitate\.<\/p>/g;
  out = out.replace(budgetRe, (m, name) => {
    counters.budgetCushion++;
    const alts = [
      `<p>A small emergency reserve — even a few hundred dollars parked somewhere accessible — changes how you respond to a ${name} health scare. You make the right call faster when cost isn't the first thing running through your head.</p>`,
      `<p>Most experienced ${name} owners set aside a modest emergency fund after their first unexpected vet visit. Having it in place before you need it is the difference between a bad afternoon and a stressful decision.</p>`,
      `<p>An emergency cushion is easy to postpone and quietly expensive to skip. For a ${name}, even $500 set aside for surprise vet bills or replacement gear removes most of the in-the-moment pressure from decisions that matter.</p>`,
    ];
    return pick(alts, name + ':budget');
  });

  // 6) "When the routine reflects what the breed was built for..." — good but generic.
  const rhythmRe = /<p>When the routine reflects what the breed was built for, most day-to-day care becomes simpler\. ([A-Z][A-Za-z' -]+?s? have particular requirements based on their [^<]+)\.<\/p>/g;
  out = out.replace(rhythmRe, (m, inside) => {
    counters.careRhythm++;
    const alts = [
      `<p>Day-to-day care gets easier once the routine matches what the breed was bred for. ${inside}.</p>`,
      `<p>Routines that respect the animal's original purpose save time long-term. ${inside}.</p>`,
      `<p>The closer your schedule sits to what the breed was designed for, the less friction there is in day-to-day care. ${inside}.</p>`,
    ];
    return pick(alts, slug + ':rhythm');
  });

  return out;
}

function main() {
  const files = [
    ...walk(path.join(ROOT, 'breeds')),
    ...walk(path.join(ROOT, 'commercial')),
    ...walk(path.join(ROOT, 'guides')),
  ];
  for (const f of files) {
    if (f.endsWith('/chat.html')) continue;
    const s = fs.readFileSync(f, 'utf8');
    const n = humanize(f, s);
    if (n !== s) {
      fs.writeFileSync(f, n);
      counters.filesTouched++;
    }
  }
  console.log('=== Humanization Pass 2 ===');
  Object.entries(counters).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
}

if (require.main === module) main();
