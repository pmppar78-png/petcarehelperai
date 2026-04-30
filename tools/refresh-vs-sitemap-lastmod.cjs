#!/usr/bin/env node
/*
 * Bumps <lastmod> in sitemap.xml for every /commercial/.../vs-*.html URL
 * to today's date so Google re-crawls the rewritten comparison pages.
 */
const fs = require('fs');
const path = require('path');

const TODAY = new Date().toISOString().slice(0, 10);
const SITEMAP = path.join(__dirname, '..', 'sitemap.xml');

let xml = fs.readFileSync(SITEMAP, 'utf8');
let touched = 0;

xml = xml.replace(
  /(<url>\s*<loc>https:\/\/petcarehelperai\.com\/commercial\/[^<]*\/vs-[^<]+<\/loc>\s*<lastmod>)([^<]+)(<\/lastmod>)/g,
  (_m, a, _b, c) => {
    touched++;
    return `${a}${TODAY}${c}`;
  }
);

fs.writeFileSync(SITEMAP, xml);
console.log(JSON.stringify({ touched, today: TODAY }));
