#!/usr/bin/env node
// Replace the generic, semantically-empty comparison tables on breed-vs-breed pages
// with real differentiated tables using actual breed data from scale-data.js.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Parse the dog breed array out of scale-data.js
const scaleSrc = fs.readFileSync(path.join(ROOT, 'engines/scale-data.js'), 'utf8');

function parseBreedArray(sectionName, prefix) {
  // Match lines like: ['slug','Name','size','weight','lifespan','energy','group','shedding',['h1','h2','h3']],
  const idx = scaleSrc.indexOf(`const ${prefix} = [`);
  if (idx < 0) return {};
  let depth = 0;
  let start = scaleSrc.indexOf('[', idx);
  let end = start;
  for (let i = start; i < scaleSrc.length; i++) {
    const c = scaleSrc[i];
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  const body = scaleSrc.slice(start, end);
  const out = {};
  const lineRe = /\[\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*\[([^\]]+)\]/g;
  let m;
  while ((m = lineRe.exec(body)) !== null) {
    const [_, slug, name, size, weight, lifespan, energy, group, shedding, healthRaw] = m;
    const health = healthRaw.split(',').map(s => s.trim().replace(/^'|'$/g, ''));
    out[slug] = { name, size, weight, lifespan, energy, group, shedding, health };
  }
  return out;
}

const dogs = parseBreedArray('dogs', 'D');
console.log('loaded breeds:', Object.keys(dogs).length);

// Try to find two breed slugs from a file name like "golden-retriever-vs-labrador-retriever.html"
function findPair(fileName) {
  const base = fileName.replace(/\.html$/, '');
  const m = base.match(/^(.+)-vs-(.+)$/);
  if (!m) return null;
  let a = m[1], b = m[2];
  // Some may have inconsistent naming. Try both exact and substring matching.
  if (dogs[a] && dogs[b]) return [a, b];
  // Try trailing-token stripping (e.g., "miniature-schnauzer-dog" → "miniature-schnauzer")
  if (dogs[a] && !dogs[b]) {
    const bKey = Object.keys(dogs).find(k => b.endsWith(k) || k.endsWith(b));
    if (bKey) return [a, bKey];
  }
  if (!dogs[a] && dogs[b]) {
    const aKey = Object.keys(dogs).find(k => a.endsWith(k) || k.endsWith(a));
    if (aKey) return [aKey, b];
  }
  return null;
}

function titleCase(s) {
  return s.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function buildTable(a, b) {
  const A = dogs[a], B = dogs[b];
  const rows = [
    ['Size', A.size, B.size],
    ['Typical weight', A.weight, B.weight],
    ['Lifespan', A.lifespan, B.lifespan],
    ['Energy level', A.energy, B.energy],
    ['AKC group', A.group, B.group],
    ['Shedding', A.shedding, B.shedding],
    ['Health issues to watch', A.health.join(', '), B.health.join(', ')],
  ];
  const body = rows.map(r =>
    `          <tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`
  ).join('\n');
  return `        <table class="comparison-table">
          <tr><th>Factor</th><th>${A.name}</th><th>${B.name}</th></tr>
${body}
        </table>`;
}

function buildParagraphs(a, b) {
  const A = dogs[a], B = dogs[b];
  const aWeight = parseInt(A.weight) || 0;
  const bWeight = parseInt(B.weight) || 0;
  const bigger = aWeight > bWeight ? A.name : B.name;
  const smaller = aWeight > bWeight ? B.name : A.name;

  const aLife = parseInt(A.lifespan) || 0;
  const bLife = parseInt(B.lifespan) || 0;
  const longerLived = aLife > bLife ? A.name : (aLife < bLife ? B.name : null);

  const energyOrder = { low: 1, moderate: 2, high: 3 };
  const aE = energyOrder[A.energy] || 2;
  const bE = energyOrder[B.energy] || 2;
  const higherEnergy = aE > bE ? A.name : (aE < bE ? B.name : null);

  const sharedHealth = A.health.filter(h => B.health.includes(h));
  const uniqueA = A.health.filter(h => !B.health.includes(h));
  const uniqueB = B.health.filter(h => !A.health.includes(h));

  const lines = [];
  lines.push(`<p>${A.name} and ${B.name} look superficially similar to new owners but differ in ways that matter for daily care. ${bigger} is larger at ${bigger === A.name ? A.weight : B.weight}, while ${smaller} typically runs ${smaller === A.name ? A.weight : B.weight}. That size gap shows up in feeding volume, crate size, vehicle space, and how much joint-stress management each dog needs over their lifetime.</p>`);

  if (higherEnergy) {
    lines.push(`<p>Energy level is the practical differentiator for most households: ${A.name} is classified as ${A.energy}-energy and ${B.name} as ${B.energy}-energy. ${higherEnergy} needs structured daily outlets \u2014 not just a walk around the block \u2014 or it will create its own outlet, often destructively. The lower-energy option is easier to fit around desk jobs and short walks without compromising welfare.</p>`);
  } else {
    lines.push(`<p>Both breeds share a ${A.energy} energy level, so the differentiator here is temperament, not exercise volume. Watch how each individual dog responds to training pressure, novelty, and time alone \u2014 that tells you more than the AKC group label.</p>`);
  }

  if (longerLived) {
    lines.push(`<p>Lifespan: ${A.name} typically lives ${A.lifespan}; ${B.name} ${B.lifespan}. ${longerLived} generally has the longer-term care window, which affects insurance math and the point at which senior diagnostics become the dominant cost line.</p>`);
  }

  const hRow = [];
  if (sharedHealth.length) hRow.push(`Both breeds share concerns around ${sharedHealth.join(', ')}.`);
  if (uniqueA.length) hRow.push(`${A.name} carries additional risk for ${uniqueA.join(', ')}.`);
  if (uniqueB.length) hRow.push(`${B.name} is more notably predisposed to ${uniqueB.join(', ')}.`);
  if (hRow.length) lines.push(`<p>Health watchlists differ. ${hRow.join(' ')} These aren\u2019t guaranteed diagnoses \u2014 they\u2019re the conditions responsible vets screen for, and they shape insurance underwriting more than most owners realize.</p>`);

  const aShed = A.shedding, bShed = B.shedding;
  if (aShed !== bShed) {
    lines.push(`<p>Grooming effort is meaningfully different: ${A.name} sheds at a ${aShed} level, ${B.name} at ${bShed}. That drives brush frequency, vacuum load, and whether the coat tolerates a week between sessions or demands daily attention during peak seasons.</p>`);
  }

  return lines.join('\n        ');
}

let fixed = 0, skipped = 0;

for (const f of fs.readdirSync(path.join(ROOT, 'guides'))) {
  if (!f.endsWith('.html') || !f.includes('-vs-')) continue;
  const pair = findPair(f);
  if (!pair) { skipped++; continue; }
  const [a, b] = pair;
  const full = path.join(ROOT, 'guides', f);
  let text = fs.readFileSync(full, 'utf8');
  const original = text;

  // Replace the generic comparison table + cmp-a / cmp-b / cmp-decision block with a real one.
  // The block starts at `<section data-vs-remediation="true">` and runs through `</section>` ... cmp-decision `</section>`.
  const startIdx = text.indexOf('<section data-vs-remediation="true">');
  if (startIdx < 0) { skipped++; continue; }
  const endMarker = 'cmp-decision">';
  const endIdx = text.indexOf(endMarker, startIdx);
  if (endIdx < 0) { skipped++; continue; }
  const closingIdx = text.indexOf('</section>', endIdx);
  if (closingIdx < 0) { skipped++; continue; }

  const replacement = `<section class="vs-comparison">
        <h2>${dogs[a].name} vs ${dogs[b].name}: Side-by-Side</h2>
        ${buildParagraphs(a, b)}
${buildTable(a, b)}
        <h3>Which one fits your household?</h3>
        <p>If you have limited exercise time, a small yard, or regularly leave the dog alone for full workdays, weigh the ${(dogs[a].energy < dogs[b].energy || dogs[a].energy === 'low') ? dogs[a].name : dogs[b].name} more heavily on the exercise axis. If joint-disease genetics are a concern, the health row above matters more than size alone. Talk to breed-specific rescue groups for both breeds before committing \u2014 the people rehoming these dogs see the real-world behavior, not the breed-club brochure.</p>
      </section>`;

  const before = text.slice(0, startIdx);
  // Find the end of cmp-decision section
  const after = text.slice(closingIdx + '</section>'.length);
  text = before + replacement + after;

  if (text !== original) {
    fs.writeFileSync(full, text);
    fixed++;
  }
}

console.log(`vs-page rewrite: fixed ${fixed}, skipped ${skipped}`);
