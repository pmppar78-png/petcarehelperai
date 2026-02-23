#!/usr/bin/env node
/**
 * Commercial Internal Link Injector
 * Adds links from existing breed pages to their commercial companion pages.
 * Runs AFTER generate-commercial.js
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const speciesTerms = {
  dogs:          { habitat: 'Crate',       enrichment: 'Toys',            feeding: 'Food',   insurance: 'Pet Insurance' },
  cats:          { habitat: 'Enclosure',   enrichment: 'Toys',            feeding: 'Food',   insurance: 'Pet Insurance' },
  birds:         { habitat: 'Cage',        enrichment: 'Enrichment',      feeding: 'Diet',   insurance: 'Pet Insurance' },
  fish:          { habitat: 'Tank',        enrichment: 'Habitat Upgrades',feeding: 'Food',   insurance: 'Pet Insurance' },
  'marine-fish': { habitat: 'Tank',        enrichment: 'Habitat Upgrades',feeding: 'Food',   insurance: 'Pet Insurance' },
  reptiles:      { habitat: 'Enclosure',   enrichment: 'Enrichment',      feeding: 'Diet',   insurance: 'Pet Insurance' },
  amphibians:    { habitat: 'Habitat',     enrichment: 'Enrichment',      feeding: 'Diet',   insurance: 'Pet Insurance' },
  'small-animals':{ habitat: 'Cage',       enrichment: 'Toys & Enrichment',feeding: 'Food',  insurance: 'Pet Insurance' },
};

const speciesDirs = ['dogs', 'cats', 'birds', 'fish', 'marine-fish', 'reptiles', 'amphibians', 'small-animals'];
let injected = 0;

for (const sp of speciesDirs) {
  const dir = join(ROOT, 'breeds', sp);
  if (!existsSync(dir)) continue;
  const files = readdirSync(dir).filter(f => f.endsWith('.html') && !f.includes('breed'));
  const t = speciesTerms[sp];

  for (const file of files) {
    const slug = file.replace('.html', '');
    const commDir = join(ROOT, 'commercial', sp, slug);
    if (!existsSync(commDir)) continue;

    const filePath = join(dir, file);
    let html = readFileSync(filePath, 'utf8');

    // Skip if already injected
    if (html.includes('commercial-links-section')) continue;

    // Extract display name from h1
    const h1Match = html.match(/<h1[^>]*>([^<]+)</);
    const name = h1Match ? h1Match[1].replace(/:.*/,'').trim() : slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

    const linkBlock = `
      <div class="breed-stats-card commercial-links-section" style="margin-top:30px;">
        <h2>Buying Guides for ${name}</h2>
        <ul style="list-style:none;padding:0;">
          <li style="padding:6px 0;"><a href="/commercial/${sp}/${slug}/best-food" style="color:#0D9488;">Best ${t.feeding} for ${name} &rarr;</a></li>
          <li style="padding:6px 0;"><a href="/commercial/${sp}/${slug}/best-insurance" style="color:#0D9488;">Best ${t.insurance} for ${name} &rarr;</a></li>
          <li style="padding:6px 0;"><a href="/commercial/${sp}/${slug}/cost-to-own" style="color:#0D9488;">${name} Cost to Own &rarr;</a></li>
          <li style="padding:6px 0;"><a href="/commercial/${sp}/${slug}/health-costs" style="color:#0D9488;">${name} Health Costs &rarr;</a></li>
          <li style="padding:6px 0;"><a href="/commercial/${sp}/${slug}/first-time-owners" style="color:#0D9488;">Is ${name} Good for First-Time Owners? &rarr;</a></li>
          <li style="padding:6px 0;"><a href="/commercial/${sp}/${slug}/best-habitat-size" style="color:#0D9488;">Best ${t.habitat} Size for ${name} &rarr;</a></li>
          <li style="padding:6px 0;"><a href="/commercial/${sp}/${slug}/best-enrichment" style="color:#0D9488;">Best ${t.enrichment} for ${name} &rarr;</a></li>
        </ul>
      </div>`;

    // Inject before the closing </article> tag
    if (html.includes('</article>')) {
      html = html.replace('</article>', `${linkBlock}\n    </article>`);
    } else {
      // Fallback: inject before </main>
      html = html.replace('</main>', `${linkBlock}\n  </main>`);
    }

    writeFileSync(filePath, html);
    injected++;
  }
}

console.log(`Injected commercial links into ${injected} breed pages`);
