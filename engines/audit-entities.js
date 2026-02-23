#!/usr/bin/env node
/**
 * Entity/Breed Page Injection Audit Script
 * Scans all breed pages for the injected "Buying Guides" commercial links block.
 * Outputs: audit/entity-injection-audit.md
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const AUDIT_DIR = join(ROOT, 'audit');

const SPECIES_GROUPS = ['dogs', 'cats', 'birds', 'fish', 'marine-fish', 'reptiles', 'amphibians', 'small-animals'];

console.log('Starting entity/breed page injection audit...');

let totalScanned = 0;
let totalWithInjection = 0;
let totalWithout = 0;
const failingFiles = [];
const successExamples = [];
const speciesStats = {};

for (const species of SPECIES_GROUPS) {
  const dir = join(ROOT, 'breeds', species);
  if (!existsSync(dir)) {
    console.log(`  SKIP: breeds/${species} does not exist`);
    continue;
  }

  const files = readdirSync(dir).filter(f => f.endsWith('.html'));
  let spSuccess = 0;
  let spFail = 0;

  for (const file of files) {
    totalScanned++;
    const filePath = join(dir, file);
    const html = readFileSync(filePath, 'utf8');
    const slug = file.replace('.html', '');

    const hasInjection = html.includes('commercial-links-section') && html.includes('Buying Guides');
    const hasCommLinks = html.includes(`/commercial/${species}/${slug}/`);

    if (hasInjection && hasCommLinks) {
      totalWithInjection++;
      spSuccess++;
      // Save some examples
      if (successExamples.length < 15) {
        // Count commercial links
        const linkMatches = html.match(new RegExp(`/commercial/${species}/${slug}/[^"]+`, 'g')) || [];
        successExamples.push({
          file: `breeds/${species}/${file}`,
          slug,
          species,
          linkCount: linkMatches.length,
          links: linkMatches.slice(0, 7)
        });
      }
    } else {
      totalWithout++;
      spFail++;
      failingFiles.push({
        file: `breeds/${species}/${file}`,
        slug,
        species,
        hasInjection,
        hasCommLinks,
        // Check if commercial directory even exists for this entity
        commDirExists: existsSync(join(ROOT, 'commercial', species, slug))
      });
    }
  }

  speciesStats[species] = { total: files.length, success: spSuccess, fail: spFail };
}

// ───────────────────── Git diff examples ─────────────────────
// Try to get git diff snippets for example files
let gitDiffExamples = [];
try {
  // Get list of breed files that were modified (showing the injection)
  for (const ex of successExamples.slice(0, 10)) {
    try {
      // Show the commercial-links-section block from the file
      const filePath = join(ROOT, ex.file);
      const html = readFileSync(filePath, 'utf8');
      const sectionMatch = html.match(/<div class="breed-stats-card commercial-links-section"[\s\S]*?<\/div>/);
      if (sectionMatch) {
        gitDiffExamples.push({
          file: ex.file,
          injectedBlock: sectionMatch[0].substring(0, 600)
        });
      }
    } catch (e) { /* skip */ }
  }
} catch (e) {
  console.log('  Note: git diff not available, using file content instead.');
}

// ───────────────────── Write Report ─────────────────────
let md = `# Entity Page Injection Audit Report\n\n`;
md += `**Generated:** ${new Date().toISOString()}\n\n`;
md += `## Summary\n\n`;
md += `| Metric | Count |\n`;
md += `|--------|-------|\n`;
md += `| **Total entity pages scanned** | ${totalScanned} |\n`;
md += `| **Pages WITH injected Buying Guides block** | ${totalWithInjection} |\n`;
md += `| **Pages WITHOUT injection** | ${totalWithout} |\n`;
md += `| **Injection success rate** | ${((totalWithInjection / totalScanned) * 100).toFixed(1)}% |\n\n`;

md += `## Species Group Breakdown\n\n`;
md += `| Species Group | Total Pages | With Injection | Missing | Rate |\n`;
md += `|---------------|-------------|----------------|---------|------|\n`;
for (const sp of SPECIES_GROUPS) {
  const s = speciesStats[sp] || { total: 0, success: 0, fail: 0 };
  const rate = s.total > 0 ? ((s.success / s.total) * 100).toFixed(1) : '0.0';
  md += `| ${sp} | ${s.total} | ${s.success} | ${s.fail} | ${rate}% |\n`;
}

md += `\n---\n\n## Example Injected Entity Files (10 examples with proof)\n\n`;

for (let i = 0; i < Math.min(10, gitDiffExamples.length); i++) {
  const ex = gitDiffExamples[i];
  md += `### ${i + 1}. \`${ex.file}\`\n\n`;
  md += `**Injected block found in file:**\n\n`;
  md += `\`\`\`html\n${ex.injectedBlock}\n\`\`\`\n\n`;
}

// Show example commercial links for each species
md += `---\n\n## Commercial Links Verification (by species)\n\n`;
for (const sp of SPECIES_GROUPS) {
  const spExamples = successExamples.filter(e => e.species === sp);
  if (spExamples.length > 0) {
    const ex = spExamples[0];
    md += `### ${sp} — \`${ex.file}\`\n\n`;
    md += `Links found (${ex.linkCount}):\n`;
    for (const link of ex.links) {
      md += `- \`${link}\`\n`;
    }
    md += `\n`;
  }
}

// Failures detail
if (failingFiles.length > 0) {
  md += `---\n\n## Failing Entity Pages (${failingFiles.length})\n\n`;
  md += `| # | File | Commercial Dir Exists | Has Injection Class | Has Comm Links |\n`;
  md += `|---|------|----------------------|--------------------|--------------|\n`;
  for (let i = 0; i < failingFiles.length; i++) {
    const f = failingFiles[i];
    md += `| ${i + 1} | \`${f.file}\` | ${f.commDirExists ? 'Yes' : 'No'} | ${f.hasInjection ? 'Yes' : 'No'} | ${f.hasCommLinks ? 'Yes' : 'No'} |\n`;
  }
}

writeFileSync(join(AUDIT_DIR, 'entity-injection-audit.md'), md);
console.log(`Entity injection report written: audit/entity-injection-audit.md`);

// ───────────────────── Console Summary ─────────────────────
console.log('\n═══════════════════════════════════════');
console.log('ENTITY PAGE INJECTION AUDIT SUMMARY');
console.log('═══════════════════════════════════════');
console.log(`TOTAL entity pages scanned: ${totalScanned}`);
console.log(`TOTAL entity pages WITH Buying Guides: ${totalWithInjection}`);
console.log(`TOTAL entity pages MISSING injection: ${totalWithout}`);
if (failingFiles.length > 0) {
  console.log(`\nFailing files:`);
  for (const f of failingFiles.slice(0, 20)) {
    console.log(`  - ${f.file} (commDir=${f.commDirExists}, injection=${f.hasInjection}, links=${f.hasCommLinks})`);
  }
  if (failingFiles.length > 20) {
    console.log(`  ... and ${failingFiles.length - 20} more`);
  }
}
console.log('═══════════════════════════════════════\n');
