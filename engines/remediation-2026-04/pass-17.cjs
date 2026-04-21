#!/usr/bin/env node
// Pass 17: Add trust links (Editorial Team, Medical Review, Corrections) to
// commercial-page footers that only have About/Contact/Privacy/Terms/Disclaimer/Editorial.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

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

const FIND = '<a href="/editorial-standards" style="color:#0D9488;">Editorial Standards</a>\n    </p>';
const REPLACE = '<a href="/editorial-standards" style="color:#0D9488;">Editorial Standards</a> &bull;\n      <a href="/editorial-team" style="color:#0D9488;">Editorial Team</a> &bull;\n      <a href="/medical-review-process" style="color:#0D9488;">Medical Review</a> &bull;\n      <a href="/corrections" style="color:#0D9488;">Corrections</a>\n    </p>';

function main() {
  const files = walk(ROOT);
  let modified = 0;
  for (const f of files) {
    const fname = path.basename(f);
    if (['editorial-team.html', 'medical-review-process.html', 'corrections.html'].includes(fname)) continue;
    let html = fs.readFileSync(f, 'utf8');
    if (!html.includes(FIND)) continue;
    if (html.includes('href="/editorial-team"')) continue;
    html = html.replace(FIND, REPLACE);
    fs.writeFileSync(f, html);
    modified++;
  }
  console.log(`Pass 17: ${modified} files updated with trust links in stripped-down footer.`);
}

main();
