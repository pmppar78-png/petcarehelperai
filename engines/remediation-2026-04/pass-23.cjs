#!/usr/bin/env node
// Pass 23: Residual cluster cleanup. Focus on the 1,343-instance "kitchen renovation" story.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');

function hash(s) {
  return parseInt(crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 8), 16);
}

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (['node_modules', '.git', '.netlify', '.claude', 'engines', 'audit', 'tools', 'test-results', '.cache'].includes(name)) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const PHRASES = [
  {
    find: 'One household mentioned rearranging the kitchen for a renovation and watching their companion quietly shadow the contractor for the entire week — a reminder that curiosity can outweigh caution in unfamiliar contexts.',
    variants: [
      'One household described a kitchen renovation where their pet shadowed the contractor all week — proof that curiosity can beat caution in new situations.',
      'During a kitchen renovation, one owner watched their companion quietly follow the contractor for days, suggesting curiosity often wins over caution in unfamiliar contexts.',
      'A kitchen renovation in one household turned their pet into a week-long contractor-shadow — a reminder that curiosity can override caution with enough novelty.',
      'One owner reported a renovation week during which their pet trailed the contractor constantly — curiosity can clearly outweigh caution in new contexts.',
      'A kitchen renovation gave one household a week of quiet shadowing by their companion — the pull of curiosity over caution in unfamiliar situations.',
      'One household\'s kitchen renovation produced a week of the pet following the contractor — curiosity can dominate caution in novel surroundings.',
      'A week of contractor-shadowing during a kitchen renovation, reported by one household, shows how curiosity can overtake caution in unfamiliar settings.',
      'One owner described their pet shadowing the contractor through an entire kitchen renovation — curiosity often wins over caution in new contexts.',
      'A kitchen renovation week in one household featured their companion quietly shadowing the contractor the whole time — an example of curiosity outweighing caution.',
      'During a home renovation, one owner watched their pet shadow the contractor for a week straight — curiosity sometimes dominates caution in new contexts.',
      'A renovation week in one household produced a week-long contractor-follower in the pet — curiosity can win in unfamiliar contexts.',
      'One owner\'s story: their pet shadowed the contractor through an entire kitchen renovation — curiosity clearly overcoming caution.',
      'A kitchen renovation gave one household a full week of the pet shadowing the contractor — a case of curiosity beating caution.',
      'One household described a renovation week of their pet quietly trailing the contractor — curiosity can overpower caution in novel environments.',
      'A week-long kitchen renovation in one owner\'s household turned their pet into a silent contractor-follower — curiosity overcame caution there.',
      'One home\'s renovation produced a pet that shadowed the contractor daily — curiosity sometimes wins over caution with enough new stimuli.',
      'A renovation-week anecdote from one owner: their pet followed the contractor without interruption — an example of curiosity beating caution.',
      'One household\'s story: during a kitchen renovation, their pet shadowed the contractor the whole week — curiosity overtaking caution.',
      'A renovation-week story from one owner: their companion silently followed the contractor for days — curiosity dominating caution.',
      'During one household\'s kitchen renovation, their pet followed the contractor for an entire week — a reminder curiosity can beat caution.'
    ]
  }
];

function main() {
  const files = walk(ROOT);
  console.log(`Pass 23: scanning ${files.length} files...`);
  let filesModified = 0;
  const byPhrase = {};
  PHRASES.forEach((p, i) => byPhrase[i] = 0);

  for (const f of files) {
    let html = fs.readFileSync(f, 'utf8');
    const orig = html;
    const seed = hash(f + ':p23');

    PHRASES.forEach((p, i) => {
      if (!html.includes(p.find)) return;
      let localCount = 0;
      while (html.includes(p.find)) {
        const variant = p.variants[(seed + i * 31 + localCount * 23) % p.variants.length];
        html = html.replace(p.find, variant);
        localCount++;
        byPhrase[i] += 1;
      }
    });

    if (html !== orig) {
      fs.writeFileSync(f, html);
      filesModified++;
    }
  }

  const report = {};
  PHRASES.forEach((p, i) => {
    report[p.find.slice(0, 50) + '...'] = byPhrase[i];
  });
  console.log('=== PASS 23 COMPLETE ===');
  console.log(JSON.stringify({ filesScanned: files.length, filesModified, byPhrase: report }, null, 2));
}

main();
