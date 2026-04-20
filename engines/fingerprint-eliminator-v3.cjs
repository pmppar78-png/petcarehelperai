#!/usr/bin/env node
/**
 * fingerprint-eliminator-v3.cjs — peer-reviewed transparency block (em-dash variant)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');

function hashPick(filePath, patternId, poolSize) {
  const h = crypto.createHash('sha1').update(filePath + '|' + patternId).digest();
  return h.readUInt32BE(0) % poolSize;
}

const PEER_VARIANTS = [
  () => `Sources cited here are peer-reviewed where available, but online content has limits that no citation can overcome. Breed predispositions are population averages, not individual predictions; your own pet's genetics, environment, diet, and lifestyle rewrite the picture. Treat this as background reading for your next veterinary visit, not a substitute for one.`,
  () => `This guide leans on peer-reviewed veterinary literature and established breed data, yet any online health resource carries built-in constraints. Breed predispositions describe population trends; the animal in your home may face a different risk profile shaped by genes, environment, nutrition, and routine. Use the material here to prepare better questions for your veterinary team.`,
  () => `Every citation here points to veterinary research or established breed health data, but online health information can only take you so far. The conditions linked to a breed are statistical tendencies, not certainties; your pet's specific risks depend on genetics, environment, diet, and lifestyle. Bring this to a veterinarian rather than acting on it directly.`,
  () => `We reference peer-reviewed veterinary work wherever it exists, but no online resource replaces an in-person exam. Breed predispositions are useful frames, not individual forecasts; environment, diet, genetics, and lifestyle shift any individual pet's actual risk. Use this page to sharpen conversations with your veterinary care team.`,
  () => `Peer-reviewed sources and breed health databases back the claims on this page, yet online information has irreducible limits. Predispositions describe population-level trends, while your own pet's risk is shaped by unique genetics, environment, diet, and lifestyle. The appropriate use of this resource is as a starting point before a veterinary conversation.`,
  () => `The data here draws on peer-reviewed veterinary research and established breed health records, but that does not make it a substitute for professional evaluation. Breed predispositions summarize populations; individual risk depends on a pet's own genetics, environment, diet, and habits. Use this as preparatory reading for your veterinarian, not as a diagnosis.`,
  () => `Citations here refer to peer-reviewed veterinary sources and accepted breed health data, though online guidance has unavoidable gaps. Population-level predispositions will not perfectly map to your individual pet, whose risk reflects genetics, environment, diet, and daily life. Treat the page as a frame for your veterinary team's input rather than a replacement for it.`,
  () => `While the references below point to peer-reviewed veterinary literature, the limits of online health content still apply. Breed predispositions describe how large groups of animals tend to fare; your specific pet's risk profile is individualized by genetics, environment, diet, and lifestyle. Use this resource to prepare for, not replace, a veterinary evaluation.`,
];

// Handles both hyphen ("-") and em dash ("—") and en dash ("–") before "your individual pet"
const PEER_REGEX = /While this guide references peer-reviewed veterinary sources and established breed health data, online health information has inherent limitations\. Breed predispositions describe population-level trends\s*[\u2014\u2013\-]\s*your individual pet may face different risks based on their genetics, environment, diet, and lifestyle\. Use this resource as a starting point for informed conversations with your veterinary care team, not as a substitute for professional evaluation\.?/g;

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

function main() {
  const files = [];
  for (const t of ['commercial', 'guides', 'breeds', 'locations']) {
    files.push(...listHtml(path.join(ROOT, t)));
  }
  let changed = 0, hits = 0;
  for (const f of files) {
    let c;
    try { c = fs.readFileSync(f, 'utf8'); } catch { continue; }
    PEER_REGEX.lastIndex = 0;
    if (!PEER_REGEX.test(c)) continue;
    PEER_REGEX.lastIndex = 0;
    const rel = path.relative(ROOT, f);
    const n = c.replace(PEER_REGEX, () => {
      hits += 1;
      return PEER_VARIANTS[hashPick(rel, 'peer-reviewed', PEER_VARIANTS.length)]();
    });
    if (n !== c) {
      fs.writeFileSync(f, n);
      changed += 1;
    }
  }
  console.log(JSON.stringify({ filesScanned: files.length, filesChanged: changed, hits }, null, 2));
}

main();
