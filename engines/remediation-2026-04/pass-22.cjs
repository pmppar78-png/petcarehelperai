#!/usr/bin/env node
// Pass 22: Break up remaining 680-865 instance clusters.

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
    find: 'Beyond professional grooming, at-home maintenance includes regular brushing, bathing, nail care, and dental hygiene.',
    variants: [
      'At-home upkeep between grooming visits covers brushing, bathing, nail care, and dental hygiene.',
      'Home maintenance — brushing, bathing, nails, dental care — matters as much as any professional grooming appointment.',
      'Regular brushing, bathing, nail trims, and dental care at home complement whatever the groomer does.',
      'Between professional visits, plan on regular brushing, bathing, nail care, and dental hygiene at home.',
      'The daily-at-home side of grooming includes brushing, bathing, nails, and dental care.',
      'Home grooming routine: brushing, bathing, nail care, dental hygiene — in addition to any professional services.',
      'Keep up with brushing, bathing, nails, and dental care at home; professional grooming supplements rather than replaces these.',
      'At-home grooming — brushing, bathing, nail trims, dental care — does most of the day-to-day work.',
      'Professional grooming is a supplement; the core work of brushing, bathing, nails, and dental hygiene happens at home.',
      'Expect to brush, bathe, clip nails, and manage dental care at home, in addition to any professional grooming.',
      'Beyond the groomer, home care handles brushing, bathing, nails, and dental hygiene.',
      'The at-home grooming stack: brushing, bathing, nail care, dental care.',
      'Brushing, bathing, nail care, and dental hygiene at home handle most of the grooming work.',
      'Home grooming — brushes, baths, nails, dental — does the bulk of the ongoing work.',
      'Most grooming happens at home: brushing, bathing, nails, and dental care.',
      'At-home grooming covers brushing, bathing, nail trims, and dental hygiene between professional visits.',
      'Between groomer visits, home maintenance includes brushing, bathing, nail care, and dental hygiene.',
      'Day-to-day grooming at home includes brushing, bathing, nail trims, and dental care.',
      'Home grooming responsibilities include brushing, bathing, nails, and dental care beyond any professional work.',
      'Expect brushing, bathing, nail care, and dental hygiene to be ongoing at-home tasks between professional grooming visits.'
    ]
  },
  {
    find: 'Both share a similar number of documented health predispositions, though the specific conditions and their management requirements differ.',
    variants: [
      'Both breeds carry similar numbers of documented predispositions, though the conditions themselves — and how they are managed — differ.',
      'The count of documented health predispositions is similar between the two, but the specific conditions and management approaches differ.',
      'Both have comparable lists of documented health predispositions; the conditions themselves and their management are different.',
      'Documented predispositions land at roughly the same count for each, but differ in type and management approach.',
      'Similar total predisposition counts, but very different specific conditions and management plans.',
      'Both breeds have about the same number of documented health predispositions, though the specifics and management differ.',
      'The two breeds carry similar totals of documented health risks, but with different diseases and different management playbooks.',
      'Total predisposition counts are similar, but the specific diseases and their management requirements differ.',
      'Equivalent numbers of documented health predispositions, though the specific conditions and protocols are different.',
      'Both have similar health-risk counts on paper, but the actual conditions and management differ meaningfully.',
      'The number of documented predispositions is similar; the type and management of those conditions are not.',
      'Both breeds have similar counts of documented health predispositions, with different specific conditions and different management needs.',
      'While the counts of documented predispositions are similar, the conditions and management approaches are meaningfully different.',
      'Documented health-predisposition counts are comparable, but the diseases and their management are distinct.',
      'Both breeds show similar numbers of documented predispositions, though the conditions and their management paths diverge.',
      'Similar predisposition counts, different specific risks, different management requirements.',
      'The two breeds each carry a similar load of documented health predispositions, but the conditions and management paths differ.',
      'Both share comparable numbers of documented health predispositions, though each has its own specific conditions and management plan.',
      'Similar numbers of documented predispositions across both breeds, but different conditions and different care approaches.',
      'Both carry similar predisposition counts, though the specific conditions and their management are different.'
    ]
  },
  {
    find: 'The breed with the shorter daily care checklist is the better fit for a busy household.',
    variants: [
      'For a busy household, the breed with the shorter daily checklist tends to be the better fit.',
      'A busy household is typically better served by the breed with the shorter daily care checklist.',
      'If time is tight, choose the breed with the shorter daily checklist.',
      'Busy owners usually do better with the breed whose daily checklist is shorter.',
      'Shorter daily checklist = better fit for a busy household.',
      'For limited-time households, the breed with the smaller daily care load is the smarter choice.',
      'Busy schedules pair better with the breed that has a shorter daily checklist.',
      'When time is scarce, pick the breed with the shorter daily care routine.',
      'Households short on time generally fare better with the breed whose daily checklist is shorter.',
      'Short daily checklist wins for busy households.',
      'Busy households should lean toward the breed with the lighter daily care load.',
      'Pick the shorter daily checklist if your household is busy.',
      'A shorter daily care checklist usually matches a busy household better.',
      'Busy households benefit from choosing the breed with the shorter daily care list.',
      'If your schedule is packed, the breed with the shorter daily care checklist is a better fit.',
      'The lighter daily checklist is the better match for a busy household.',
      'For time-constrained households, the breed with the shorter daily care list tends to be a better fit.',
      'A busy household is usually better served by the breed whose daily checklist is shorter.',
      'Shorter daily care requirements map to busier households better.',
      'If your household is busy, lean toward the breed with the shorter daily care checklist.'
    ]
  },
  {
    find: 'Similar activity levels mean the daily time commitment is comparable, letting other factors drive the decision.',
    variants: [
      'Because activity levels are similar, daily time commitments are comparable, so other factors should drive the decision.',
      'Similar daily activity requirements mean the time burden is roughly the same; decide on other factors.',
      'Activity levels are close enough that time commitment is similar — other criteria should decide it.',
      'With similar activity needs, the time commitment is roughly equal, so the decision hinges on other factors.',
      'Comparable activity levels put the daily time commitment on par; other factors should be the deciding criteria.',
      'Activity-driven time commitment is similar, so let other factors tip the decision.',
      'Since activity levels are similar, the daily time demand is roughly equal — decide on something else.',
      'Similar activity needs put the daily time commitment on par; other factors should determine the choice.',
      'With activity levels comparable, the time burden is similar, so the decision comes down to other factors.',
      'Equivalent activity levels mean the daily time investment is similar — let other criteria drive the call.',
      'Activity level parity means time commitment is similar; other factors should decide.',
      'Daily time commitment is roughly equivalent given similar activity levels, so decide on other criteria.',
      'Similar activity demands mean daily time commitments are comparable; the decision hinges on other factors.',
      'Because the two breeds have similar activity levels, the time commitment is comparable — other criteria should decide.',
      'Activity levels are close enough that time-commitment parity lets other factors drive the decision.',
      'With comparable activity needs, daily time is a wash; other factors decide.',
      'Similar energy levels make time commitment a tie; other criteria should break it.',
      'Similar activity profiles yield similar time commitments, so other factors determine the outcome.',
      'Because activity levels match, daily time is similar, and other factors become the deciding criteria.',
      'With similar activity levels, the daily time commitment is comparable — other factors should drive the decision.'
    ]
  },
  {
    find: 'Your household is active and can provide the stimulation this breed needs to stay balanced.',
    variants: [
      'An active household that can provide the stimulation this breed requires tends to produce balanced animals.',
      'If your household is active and can meet this breed\'s stimulation needs, balance tends to follow.',
      'Active households able to meet the stimulation demands of this breed usually see well-adjusted animals.',
      'Balance in this breed typically requires an active household that can deliver the stimulation it needs.',
      'This breed stays balanced in active households that can meet its stimulation needs.',
      'Active-household households that provide sufficient stimulation usually get balanced, settled animals.',
      'If your home is active and can meet the stimulation needs, you should see a balanced animal.',
      'An active household capable of providing enough stimulation is typically where this breed thrives.',
      'Balance comes more easily when the household is active enough to deliver the stimulation this breed requires.',
      'The combination of active household plus adequate stimulation typically keeps this breed balanced.',
      'An active lifestyle that provides this breed\'s stimulation requirements tends to produce balanced animals.',
      'Households that are active and can meet the stimulation requirements tend to see balanced dogs.',
      'If your household\'s activity level can meet the stimulation demands, balance generally follows.',
      'For this breed, balance tends to come from an active household that meets the stimulation requirements.',
      'An active household that meets the stimulation needs typically produces a balanced animal.',
      'Balance in this breed tracks closely with an active household that provides enough stimulation.',
      'Active owners who can match this breed\'s stimulation needs usually end up with balanced animals.',
      'When the household is active and the stimulation load is covered, this breed tends to be balanced.',
      'An active household with the capacity to provide adequate stimulation is where this breed is balanced.',
      'If your household is active enough to provide the stimulation this breed needs, balance generally follows.'
    ]
  },
  {
    find: 'Watch for signs of fatigue: heavy breathing, slowing down, reluctance to continue, or lying down during activity.',
    variants: [
      'Watch for heavy breathing, slowing pace, reluctance to continue, or lying down during activity — all signs of fatigue.',
      'Fatigue shows up as heavy breathing, slowing down, reluctance to continue, or lying down during activity.',
      'Signs of fatigue to watch for: heavy breathing, slower pace, resistance to continuing, lying down mid-activity.',
      'Fatigue signs include heavy breathing, slowing down, not wanting to continue, and lying down during activity.',
      'Look for fatigue via heavy breathing, slower pace, resistance, or lying down during activity.',
      'Heavy breathing, slowing down, reluctance to go on, or lying down during activity all indicate fatigue.',
      'Fatigue manifests as heavy breathing, slower movement, reluctance to continue, or lying down during activity.',
      'Watch for the fatigue cues — heavy breathing, slowing pace, resistance to continuing, lying down during activity.',
      'Key fatigue cues: heavy breathing, pace dropping, reluctance to continue, lying down during activity.',
      'Fatigue looks like heavy breathing, slowing down, reluctance to continue, and lying down during activity.',
      'Signs your pet is tired: heavy breathing, slower pace, reluctance to continue, lying down during activity.',
      'Look for heavy breathing, slowing pace, reluctance to continue, and lying down during activity as signs of fatigue.',
      'Fatigue signals: heavy breathing, slowing movement, resistance to continuing, lying down during activity.',
      'Heavy breathing, slower pace, reluctance to continue, or lying down are all signs your pet is fatigued.',
      'Watch for heavy breathing, slowing, reluctance to continue, and lying down during activity.',
      'Fatigue cues to watch: heavy breathing, slower pace, reluctance to continue, lying down during activity.',
      'If you see heavy breathing, slowing down, reluctance to continue, or lying down during activity, your pet is fatigued.',
      'Signs of fatigue — heavy breathing, slowing pace, reluctance to continue, lying down — warrant a rest break.',
      'Fatigue indicators: heavy breathing, slowing down, resistance to continuing, lying down during activity.',
      'Watch for heavy breathing, a slower pace, resistance to continuing, or lying down during activity — all fatigue signs.'
    ]
  }
];

function main() {
  const files = walk(ROOT);
  console.log(`Pass 22: scanning ${files.length} files...`);
  let filesModified = 0;
  const byPhrase = {};
  PHRASES.forEach((p, i) => byPhrase[i] = 0);

  for (const f of files) {
    let html = fs.readFileSync(f, 'utf8');
    const orig = html;
    const seed = hash(f + ':p22');

    PHRASES.forEach((p, i) => {
      if (!html.includes(p.find)) return;
      let localCount = 0;
      while (html.includes(p.find)) {
        const variant = p.variants[(seed + i * 29 + localCount * 19) % p.variants.length];
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
  console.log('=== PASS 22 COMPLETE ===');
  console.log(JSON.stringify({ filesScanned: files.length, filesModified, byPhrase: report }, null, 2));
}

main();
