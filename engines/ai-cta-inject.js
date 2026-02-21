import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

const BREEDS_DIR = new URL('../breeds/', import.meta.url).pathname;

const AI_CTA_BLOCK = `<div class="ai-cta-block">
  <h3>Get Personalized AI Guidance</h3>
  <p>Have specific questions about your pet? Our AI assistant provides expert-level, personalized advice based on your pet's unique needs and situation.</p>
  <a href="/chat" class="ai-cta-btn">Ask Our AI Now</a>
</div>`;

const BREED_IMAGE_HEADER = `<div class="breed-image-header">
  <div class="breed-image-placeholder" aria-hidden="true">&#x1f43e;</div>
</div>`;

const SUBDIRS = ['dogs', 'cats', 'birds', 'fish', 'reptiles', 'small-animals'];

function getAllHtmlFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllHtmlFiles(fullPath));
    } else if (entry.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

let ctaCount = 0;
let imageHeaderCount = 0;
let filesProcessed = 0;

for (const subdir of SUBDIRS) {
  const subdirPath = join(BREEDS_DIR, subdir);
  let stat;
  try {
    stat = statSync(subdirPath);
  } catch {
    console.log(`Skipping ${subdir} - directory not found`);
    continue;
  }
  if (!stat.isDirectory()) continue;

  const htmlFiles = getAllHtmlFiles(subdirPath);

  for (const filePath of htmlFiles) {
    let html = readFileSync(filePath, 'utf-8');
    let modified = false;

    // Check and inject AI CTA block
    if (!html.includes('ai-cta-block')) {
      if (html.includes('</article>')) {
        html = html.replace('</article>', AI_CTA_BLOCK + '\n    </article>');
        modified = true;
        ctaCount++;
      } else if (html.includes('<footer')) {
        html = html.replace(/<footer/,  AI_CTA_BLOCK + '\n\n  <footer');
        modified = true;
        ctaCount++;
      }
    }

    // Check and inject breed image header after <h1> tag
    if (!html.includes('breed-image-header')) {
      const h1CloseRegex = /<\/h1>/;
      if (h1CloseRegex.test(html)) {
        html = html.replace(h1CloseRegex, '</h1>\n\n      ' + BREED_IMAGE_HEADER);
        modified = true;
        imageHeaderCount++;
      }
    }

    if (modified) {
      writeFileSync(filePath, html, 'utf-8');
      filesProcessed++;
    }
  }
}

console.log(`Done! Processed ${filesProcessed} files total.`);
console.log(`  AI CTA blocks injected: ${ctaCount}`);
console.log(`  Breed image headers injected: ${imageHeaderCount}`);
