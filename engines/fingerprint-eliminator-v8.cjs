#!/usr/bin/env node
/**
 * fingerprint-eliminator-v8.cjs — sweeps residual fingerprint templates across
 * root-level, resources/, and tools/ directories that were outside prior
 * eliminator scope (commercial/guides/breeds/locations).
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
    id: 'understanding-this-aspect-observe',
    regex: /Understanding this aspect of (?:pet|cat|dog|bird|fish|reptile|amphibian|small-animal|marine fish) care helps you make informed decisions that directly affect your (?:pet|cat|dog|bird|fish|reptile|amphibian|small animal|marine fish)'s wellbeing\. Every (?:pet|cat|dog|bird|fish|reptile|amphibian|small animal|marine fish) is different, so observe how yours responds and adjust your approach based on what works\.?/g,
    variants: [
      () => `Getting a handle on this part of pet care is how you move from guesswork to informed choices that actually track your pet's wellbeing. Individual animals vary widely, so pay attention to how your own responds and tune what you do to match what clearly works for them.`,
      () => `This piece of pet care tends to drive outcomes more than owners expect, which is why informed decision-making here matters. No two pets react identically, so watch how yours handles each change and adjust the approach toward what you see delivering results.`,
      () => `Learning the mechanics of this topic is what lets you make informed, day-to-day choices that protect your pet's long-term wellbeing. Because behavior and tolerance vary animal to animal, the right move is always to observe your own pet closely and shape the plan around what clearly works for them.`,
      () => `The reason this area deserves careful attention is that small decisions here compound into real differences in pet wellbeing. Your pet's individual response is the single best data source you have, so notice what it's telling you and steer your approach toward what keeps them thriving.`,
      () => `A solid working knowledge of this aspect of pet care translates directly into better decisions at home. Since each animal brings its own tolerances and preferences, the practical step is simple: watch how your pet reacts, then keep doing what's clearly working and trim what isn't.`,
      () => `Understanding how this piece of pet care actually functions is the foundation for choices that measurably support your pet's wellbeing. Individual variation is the rule, not the exception, so let your pet's own behavior signal what to keep and what to change.`,
      () => `This corner of pet care rewards owners who dig into the details, because the decisions that follow directly influence day-to-day wellbeing. Keep in mind that every pet calibrates differently, so track how yours specifically responds and shape your routine around what you see succeeding.`,
      () => `Knowing what's going on with this element of pet care is what separates reactive owners from informed ones, and your pet feels the difference. Treat your own animal as the reference case: observe how it responds, then reinforce what's clearly working for that individual.`,
      () => `Depth of understanding in this area translates to meaningfully better choices, which your pet ultimately experiences as a better life. Because no two pets behave the same, the honest approach is to watch how yours responds and adjust your approach toward the things that demonstrably work.`,
      () => `The point of understanding this aspect carefully is that it changes how you make daily decisions, and those decisions are what shape your pet's long-term wellbeing. Individual temperament drives most of the variance, so watch your pet, iterate, and keep the habits that are clearly helping.`,
      () => `This topic affects enough of your pet's wellbeing that it's worth genuinely understanding rather than skimming. Expect individual variation between animals, and treat your own pet's response as the signal: adjust your approach toward what you see working and quietly drop what isn't.`,
      () => `Real fluency with this aspect of pet care lets you replace guesswork with judgment, which ultimately shows up in your pet's day-to-day wellbeing. Every pet is wired a little differently, so use your own as the guide, watch how they respond, and tune the approach to them.`,
      () => `Grasping this part of pet ownership properly is what makes the rest of your choices feel grounded rather than improvised. Because individual pets differ in how they handle just about everything, the practical move is to observe yours closely and lean into whichever approaches are visibly working.`,
      () => `Putting effort into understanding this aspect up front pays off later in decisions that directly affect your pet's wellbeing. Plan for individual variation: no single playbook fits every animal, so read your pet's responses and adjust the approach to match what clearly works for them.`,
      () => `This is one of those pet-care topics where a little more understanding goes a long way in the decisions you'll make week after week. Keep your own pet front and center as you apply any of it, since individual responses vary, and the right plan is the one your specific animal is responding well to.`,
    ],
  },
];

const SCOPE_DIRS = ['resources', 'tools'];
const SCOPE_ROOT_FILES = ['guides.html', 'partners.html', 'press-kit.html', 'resources.html', 'about.html', 'faq.html', 'index.html', 'contact.html', 'editorial-standards.html', 'privacy-policy.html', 'terms-of-service.html', 'medical-disclaimer.html'];
const SKIP_DIRS = ['node_modules', '.netlify', '.git'];

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
    let nth = 0;
    content = content.replace(rule.regex, function () {
      const idx = hashPick(rel + '|' + nth, rule.id, rule.variants.length);
      nth += 1;
      stats.hits[rule.id] = (stats.hits[rule.id] || 0) + 1;
      return rule.variants[idx]();
    });
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    stats.filesChanged += 1;
  }
}

function main() {
  const files = [];
  for (const d of SCOPE_DIRS) {
    const p = path.join(ROOT, d);
    if (fs.existsSync(p)) files.push(...listHtml(p));
  }
  for (const r of SCOPE_ROOT_FILES) {
    const p = path.join(ROOT, r);
    if (fs.existsSync(p)) files.push(p);
  }

  const stats = { filesChanged: 0, hits: {} };
  for (const f of files) processFile(f, stats);
  console.log(JSON.stringify({
    filesScanned: files.length,
    filesChanged: stats.filesChanged,
    hits: stats.hits,
  }, null, 2));
}

main();
