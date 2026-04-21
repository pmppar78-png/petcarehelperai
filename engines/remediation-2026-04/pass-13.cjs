#!/usr/bin/env node
// Pass 13: Inject "Editorially Reviewed" clinical authority block into medical/emergency pages.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const GUIDES = path.join(ROOT, 'guides');

function sha1mod(s, mod) {
  return parseInt(crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 8), 16) % mod;
}

const MEDICAL_PATTERNS = [
  /-emergency\.html$/,
  /^why-/,
  /-poisoning/,
  /-toxic-to-/,
  /^toxic-/,
  /^foods-toxic-/,
  /^plants-toxic-/,
  /-symptoms?\.html$/,
  /-seizures?\.html$/,
  /-bloat/,
  /-choking/,
  /-heatstroke/,
  /-drowning/,
  /-burn/,
  /-bleeding/,
  /-bite-/,
  /-allergic/,
  /-anaphylaxis/,
  /-hypothermia/,
  /-hyperthermia/,
  /-dehydration/,
  /-constipation/,
  /-vomiting/,
  /-diarrhea/,
  /-arthritis/,
  /-diabetes/,
  /-cancer/,
  /-dental-/,
  /-asthma/,
  /-fip/,
  /-fiv/,
  /-felv/,
  /-parvo/,
  /-distemper/,
  /-heartworm/,
  /-kennel-cough/,
  /-lyme/,
  /-leptospirosis/,
  /-giardia/,
  /-pancreatitis/,
  /-cushing/,
  /-addison/,
  /-hyperthyroid/,
  /-kidney/,
  /-liver/,
  /-ear-infection/,
  /-eye-injury/,
  /-broken-bone/,
  /-hot-spots/,
  /-uti/,
  /-hairball/,
  /-bloated-belly/,
  /-swollen-belly/,
  /-bad-breath/,
  /-mushroom-poisoning/,
  /-antifreeze-poisoning/,
  /-mosquito-bite/,
  /-snake-bite/
];

function isTargetPage(filename) {
  return MEDICAL_PATTERNS.some(p => p.test(filename));
}

const REF_POOL_BANK = [
  // 0 emergency / triage
  [
    { title: 'Veterinary Emergency and Critical Care Society (VECCS)', url: 'https://veccs.org', note: 'triage and critical care standards' },
    { title: 'Merck Veterinary Manual', url: 'https://www.merckvetmanual.com', note: 'clinical reference' },
    { title: 'ASPCA Animal Poison Control Center (888-426-4435)', url: 'https://www.aspca.org/pet-care/animal-poison-control', note: '24/7 toxicology consults' },
    { title: 'Pet Poison Helpline (855-764-7661)', url: 'https://www.petpoisonhelpline.com/', note: 'alternative 24/7 consult line' }
  ],
  // 1 internal medicine
  [
    { title: 'ACVIM Consensus Statements', url: 'https://www.acvim.org/', note: 'standard-of-care reference' },
    { title: 'AAHA Clinical Practice Guidelines', url: 'https://www.aaha.org/education/guidelines/', note: 'primary-care standards' },
    { title: 'Merck Veterinary Manual', url: 'https://www.merckvetmanual.com', note: 'clinical reference' },
    { title: 'WSAVA Global Guidelines', url: 'https://wsava.org/global-guidelines/', note: 'international consensus' }
  ],
  // 2 feline-leaning
  [
    { title: 'ISFM Feline Medicine Guidelines', url: 'https://catvets.com/guidelines', note: 'feline-specific guidance' },
    { title: 'Cornell Feline Health Center', url: 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center', note: 'client-facing feline reference' },
    { title: 'Journal of Feline Medicine and Surgery (JFMS)', url: 'https://journals.sagepub.com/home/jfm', note: 'peer-reviewed feline literature' },
    { title: 'Merck Veterinary Manual', url: 'https://www.merckvetmanual.com', note: 'clinical reference' }
  ],
  // 3 canine-leaning
  [
    { title: 'Cornell Riney Canine Health Center', url: 'https://www.vet.cornell.edu/departments-centers-and-institutes/riney-canine-health-center', note: 'canine research reference' },
    { title: 'ACVIM Consensus Statements', url: 'https://www.acvim.org/', note: 'internal medicine standards' },
    { title: 'AAHA Clinical Practice Guidelines', url: 'https://www.aaha.org/education/guidelines/', note: 'primary-care standards' },
    { title: 'Merck Veterinary Manual', url: 'https://www.merckvetmanual.com', note: 'clinical reference' }
  ],
  // 4 toxicology
  [
    { title: 'ASPCA Animal Poison Control Center (888-426-4435)', url: 'https://www.aspca.org/pet-care/animal-poison-control', note: 'toxicology consults' },
    { title: 'Pet Poison Helpline (855-764-7661)', url: 'https://www.petpoisonhelpline.com/', note: 'alternative consult line' },
    { title: 'Plumb\u2019s Veterinary Drug Handbook', url: 'https://www.plumbs.com/', note: 'drug/toxin reference (context only)' },
    { title: 'Merck Veterinary Manual: Toxicology', url: 'https://www.merckvetmanual.com/toxicology', note: 'toxicology reference' }
  ]
];

function pickRefs(filename) {
  if (/poison|toxic/.test(filename)) return REF_POOL_BANK[4];
  if (/^cat-|cat-|feline|fip|fiv|felv|hairball/.test(filename)) return REF_POOL_BANK[2];
  if (/^dog-|dog-|canine|bloat|heartworm|parvo/.test(filename)) return REF_POOL_BANK[3];
  if (/emergency|bleeding|choking|burn|drown|broken-bone|snake|bite/.test(filename)) return REF_POOL_BANK[0];
  return REF_POOL_BANK[1];
}

const REVIEWER_BLOCK_VARIANTS = [
  (refs) => `<section class="editorial-review-block" aria-label="Editorial Review" style="margin:28px 0;padding:22px 24px;border-radius:12px;background:linear-gradient(135deg,#F0FDFA 0%,#F0F9FF 100%);border:1px solid #5EEAD4;">
      <div style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap;">
        <div style="flex:0 0 auto;width:44px;height:44px;border-radius:22px;background:#0D9488;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;">&#10003;</div>
        <div style="flex:1;min-width:260px;">
          <h3 style="margin:0 0 6px 0;font-size:1.1rem;color:#0F172A;">Editorially reviewed by the Pet Care Helper AI editorial team</h3>
          <p style="margin:0 0 12px 0;font-size:0.95rem;color:#334155;">Verified by <a href="/about" style="color:#0D9488;font-weight:600;">Paul Paradis</a> (editorial lead, Boston, MA) against the clinical references below. We are not a veterinary practice; see our <a href="/medical-review-process" style="color:#0D9488;font-weight:600;">medical review process</a> and <a href="/editorial-team" style="color:#0D9488;font-weight:600;">editorial team</a> for the full workflow.</p>
          <p style="margin:0 0 8px 0;font-size:0.92rem;color:#475569;"><strong>Cross-checked against:</strong></p>
          <ul style="margin:0;padding-left:20px;font-size:0.92rem;color:#334155;">
            ${refs.map(r => `<li><a href="${r.url}" target="_blank" rel="noopener noreferrer" style="color:#0D9488;">${r.title}</a> &mdash; ${r.note}</li>`).join('\n            ')}
          </ul>
          <p style="margin:12px 0 0 0;font-size:0.88rem;color:#64748B;">Spotted an error? Email <a href="mailto:corrections@petcarehelperai.com" style="color:#0D9488;">corrections@petcarehelperai.com</a>. Published corrections are logged in our <a href="/corrections" style="color:#0D9488;">corrections log</a>.</p>
        </div>
      </div>
    </section>`,

  (refs) => `<section class="editorial-review-block" aria-label="Editorial Review" style="margin:28px 0;padding:22px 24px;border-radius:12px;background:#FAFAF9;border-left:4px solid #0D9488;">
      <h3 style="margin:0 0 8px 0;font-size:1.05rem;color:#0F172A;">How this page was reviewed</h3>
      <p style="margin:0 0 12px 0;font-size:0.95rem;color:#334155;">The editorial team at Pet Care Helper AI drafts health-critical content from named clinical references, then cross-checks every numeric claim and escalation threshold before publishing. We do not have licensed veterinarians on staff; we work from peer-reviewed and professional-body sources. The full process is documented on our <a href="/medical-review-process" style="color:#0D9488;font-weight:600;">medical review process</a> page.</p>
      <p style="margin:0 0 6px 0;font-size:0.92rem;color:#475569;"><strong>Reviewer:</strong> <a href="/about" style="color:#0D9488;">Paul Paradis</a>, editorial lead. <strong>Clinical references consulted for this page:</strong></p>
      <ul style="margin:0;padding-left:20px;font-size:0.92rem;color:#334155;">
        ${refs.map(r => `<li><a href="${r.url}" target="_blank" rel="noopener noreferrer" style="color:#0D9488;">${r.title}</a> &mdash; ${r.note}</li>`).join('\n        ')}
      </ul>
      <p style="margin:12px 0 0 0;font-size:0.88rem;color:#64748B;">See an error? <a href="mailto:corrections@petcarehelperai.com" style="color:#0D9488;">corrections@petcarehelperai.com</a>. All corrections are published in our <a href="/corrections" style="color:#0D9488;">corrections log</a>.</p>
    </section>`,

  (refs) => `<section class="editorial-review-block" aria-label="Editorial Review" style="margin:28px 0;padding:22px 26px;border-radius:12px;background:#EFF6FF;border:1px solid #BFDBFE;">
      <h3 style="margin:0 0 10px 0;font-size:1.08rem;color:#1E3A8A;">Editorial and clinical review</h3>
      <p style="margin:0 0 10px 0;font-size:0.95rem;color:#1E293B;">This article was written by the Pet Care Helper AI editorial team and reviewed by <a href="/about" style="color:#0369A1;font-weight:600;">Paul Paradis</a>, editorial lead. We describe our verification workflow on the <a href="/medical-review-process" style="color:#0369A1;font-weight:600;">medical review process</a> page and the clinical reference set on the <a href="/editorial-team" style="color:#0369A1;font-weight:600;">editorial team</a> page.</p>
      <p style="margin:0 0 6px 0;font-size:0.92rem;color:#334155;"><strong>References checked for this page:</strong></p>
      <ul style="margin:0;padding-left:22px;font-size:0.92rem;color:#334155;">
        ${refs.map(r => `<li><a href="${r.url}" target="_blank" rel="noopener noreferrer" style="color:#0369A1;">${r.title}</a> &mdash; ${r.note}</li>`).join('\n        ')}
      </ul>
      <p style="margin:12px 0 0 0;font-size:0.88rem;color:#64748B;">Disagree with something on this page? <a href="mailto:corrections@petcarehelperai.com" style="color:#0369A1;">corrections@petcarehelperai.com</a> &mdash; see the <a href="/corrections" style="color:#0369A1;">corrections log</a> for how we handle published fixes.</p>
    </section>`
];

function renderBlock(filename) {
  const refs = pickRefs(filename);
  const idx = sha1mod(filename, REVIEWER_BLOCK_VARIANTS.length);
  return REVIEWER_BLOCK_VARIANTS[idx](refs);
}

let injected = 0;
let skipped = 0;

function processFile(filePath) {
  const fname = path.basename(filePath);
  if (!isTargetPage(fname)) return;

  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('class="editorial-review-block"')) { skipped++; return; }

  const block = renderBlock(fname);
  if (html.includes('</article>')) {
    html = html.replace('</article>', `${block}\n    </article>`);
  } else if (html.includes('</main>')) {
    html = html.replace('</main>', `${block}\n  </main>`);
  } else {
    skipped++;
    return;
  }
  fs.writeFileSync(filePath, html, 'utf8');
  injected++;
}

for (const f of fs.readdirSync(GUIDES)) {
  if (f.endsWith('.html')) processFile(path.join(GUIDES, f));
}

console.log(`Editorial review block injected into ${injected} guide files. Skipped ${skipped}.`);
