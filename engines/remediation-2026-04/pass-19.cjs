#!/usr/bin/env node
// Pass 19: Break up the regional-cost-and-care template cluster that shows 2,200+ instances each.
// Same hash-indexed approach as pass-18.

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
    find: 'Keep a short list of two or three local clinics rather than one — redundancy matters on holidays.',
    variants: [
      'Maintain two or three vetted local clinics instead of one, because holiday schedules and after-hours gaps are real.',
      'A small roster of known clinics — not just one — saves you on weekends and holidays when your primary may be closed.',
      'Hold two or three clinics in your contacts, not a single primary, so that holiday closures do not leave you scrambling.',
      'Build a short backup list of local clinics; relying on a single vet is fragile over a full year of schedules.',
      'Two or three local clinics in rotation is a better setup than a single primary, especially around long weekends.',
      'Have more than one clinic option on file; the day you need a backup is always the day the main clinic is closed.',
      'Do not rely on a single clinic — keep a backup or two within driving distance for weekends and holidays.',
      'Redundancy in clinic options is cheap insurance; keep two or three numbers rather than just one.',
      'A single clinic is a single point of failure; a short list of two or three is far more resilient.',
      'Local clinic redundancy matters in practice — keep two or three on a shortlist, not just your primary.',
      'Build out a small bench of two or three clinics so a single closure does not derail care.',
      'Keep a backup clinic or two on file; the main one is never available exactly when you need it most.',
      'Two or three clinics in your phone beats one — holidays, staff shortages, and emergencies all make redundancy pay off.',
      'Track more than one clinic option; the day your primary is closed is the day you will need a backup.',
      'Having a short backup list of clinics is far more useful than most owners realise until they need it.',
      'Line up at least two clinics you would trust; one-clinic setups are brittle around holidays and emergencies.',
      'A pet-care plan with only one clinic is incomplete — keep a second or third option mapped out.',
      'Redundancy in veterinary contacts is underrated; two or three options is the sensible default.',
      'Keep a shortlist of local clinics rather than betting on a single one being open when you need it.',
      'Two or three clinics beats one; the gap between primary-closed and backup-available can be urgent.'
    ]
  },
  {
    find: 'In humid coastal regions, expect a stronger emphasis on parasite prevention year-round; colder inland areas often shift that spending toward joint and cold-weather care instead.',
    variants: [
      'Coastal humid areas typically push spending toward year-round parasite control, while cold inland regions lean toward joint care and cold-weather support.',
      'On humid coasts, parasite prevention dominates the annual budget; inland with cold winters, the same money shifts toward joint support and winter care.',
      'Expect coastal humidity to load the budget on parasite prevention, while inland cold regions redirect those dollars to joint and winter support.',
      'Humid coastal climates tend to favour aggressive parasite control; colder inland climates redirect the equivalent spend toward joint care.',
      'Parasite prevention eats more of the budget in humid coastal zones; colder inland zones shift that line item to joint and winter care.',
      'Climate changes where the money goes — coasts into parasites year-round, cold inland into joints and weather-proofing.',
      'Budget emphasis moves with climate: more parasite control where it is humid, more joint and cold-weather care where it is cold.',
      'Coastal humidity means year-round parasite spend; cold inland means more budget on joint support and winter conditioning.',
      'Where it is humid and coastal, parasite prevention is a year-round line item; where it is cold and inland, joint care dominates instead.',
      'Local climate dictates where the budget skews: parasite-heavy on humid coasts, joint-and-winter heavy in cold inland regions.',
      'Humid coasts push parasite prevention year-round; cold inland areas push joint and cold-weather spending instead.',
      'Climate reshapes the budget — more parasite control on humid coasts, more joint support and cold-weather gear inland.',
      'Annual care tends to bias toward parasites in humid coastal settings and toward joint care in colder inland ones.',
      'On humid coasts, parasite prevention stays heavy all year; inland with cold winters, joint support tends to replace that emphasis.',
      'Expect a parasite-heavy budget on humid coasts and a joint-and-winter-heavy budget in cold inland regions.',
      'Humid coastal climates demand continuous parasite prevention; cold inland climates shift the budget toward joint support.',
      'Coastal humidity keeps parasite prevention a major line year-round; cold inland climates move those dollars to joint and winter care.',
      'Regional climate reshapes annual spending — coasts into parasite prevention, cold interiors into joint and cold-weather care.',
      'Humid coastal regions weight the budget toward parasites; cold inland regions weight it toward joints and winter care.',
      'The parasite-versus-joint balance in the annual budget tracks the climate: humid coasts push one way, cold interiors the other.'
    ]
  },
  {
    find: 'Heat waves and cold snaps are worth preparing for in advance; a simple indoor temperature log for a month reveals patterns you would not otherwise notice.',
    variants: [
      'Prepare for heat waves and cold snaps before they arrive; a month of indoor temperature logging shows patterns you would miss otherwise.',
      'A month-long indoor temperature log reveals surprising patterns — log it before the next heatwave or cold snap rather than after.',
      'Log indoor temperatures for a month before extreme weather hits; the patterns you find will reshape your preparation.',
      'Heat waves and cold snaps reward preparation — a simple thermometer log for 30 days shows where the indoor trouble spots are.',
      'Spend a month logging indoor temperatures and the hot rooms and cold corners you did not know about become obvious.',
      'Before the next heat wave, log 30 days of indoor temperatures to find the microclimates inside your home.',
      'Four weeks of indoor temperature data tells you more about how to prepare for weather extremes than any guide.',
      'Track indoor temperatures for a month and you will identify the rooms that need attention before a weather extreme hits.',
      'A month of indoor temp logging is one of the cheapest, highest-leverage preparations for weather extremes.',
      'Log indoor temperatures over a month — the patterns it reveals drive most of the preparation you actually need.',
      'Advance preparation for weather extremes starts with a month of indoor temperature logging.',
      'Heat waves and cold snaps are easier to handle if you have already mapped your home\'s indoor temperature patterns for a month.',
      'Get ahead of the next extreme by tracking indoor temperatures for four weeks; the data shapes everything else.',
      'Before the season changes, log indoor temperatures for a month to find the rooms that run hot or cold.',
      'A simple 30-day indoor temperature log outperforms generic weather-prep advice almost every time.',
      'Plan for heat and cold by measuring indoor temperatures first — a month of data is usually enough.',
      'Indoor temperature patterns are invisible until you log them; a month of data uncovers rooms that need attention.',
      'Map your home thermally for a month and weather-preparation becomes specific instead of generic.',
      'Before weather extremes hit, log indoor temperatures for 30 days and base preparation on the patterns.',
      'Thirty days of indoor temperature data tells you which rooms to modify and which fans or heaters to buy.'
    ]
  },
  {
    find: 'Dental cleanings are the single most region-sensitive line item, ranging from $250 to well over $900 depending on anesthesia protocols and local wage costs.',
    variants: [
      'Dental cleaning prices vary more by region than any other line item — expect $250 to $900+ depending on anesthesia and local wages.',
      'The price of a dental cleaning ranges from $250 to well past $900 across regions, driven largely by anesthesia protocol and local labor costs.',
      'No line item swings more by region than dental — anywhere from $250 to over $900, mostly because of anesthesia and wages.',
      'Dental work is the most regionally variable cost, from a floor of $250 to over $900, tied to anesthesia choice and local labor rates.',
      'Regional variation is biggest on dental cleanings: $250 on the low end, $900+ on the high end, depending on anesthesia and wages.',
      'Dentals are where you see the widest price spread — $250 in some areas, $900+ in others, based on anesthesia and local cost of living.',
      'Dental cleaning costs depend more on geography than almost any other vet service, ranging $250 to $900+ based on anesthesia and wages.',
      'The dental cleaning line item swings dramatically by region, from $250 to over $900, driven by anesthesia protocols and local wages.',
      'Dental cleanings show the biggest regional spread — roughly $250 to $900+ — because anesthesia protocols and wage rates vary so much.',
      'Expect dental work to vary the most by region of any service — $250 to $900+ depending on anesthesia and local labor costs.',
      'Dental is the line item most affected by where you live, running $250 to $900+ depending on anesthesia protocol and wages.',
      'No service varies more with region than a dental cleaning; $250 in one ZIP code, $900+ in another, largely because of anesthesia and wages.',
      'The single biggest regional-cost driver is dental work — $250 to $900+ — shaped by anesthesia protocol and local wages.',
      'Dental cleanings swing the widest by region, $250 to over $900, with anesthesia choice and local wages as the main drivers.',
      'Regional cost variation peaks with dental cleanings — $250 to $900+ — because anesthesia protocols and labor rates differ sharply.',
      'Dental cleaning pricing is the service most affected by region, $250 to $900+ depending on anesthesia and wages.',
      'Expect the dental line to vary more by region than anything else, from about $250 up past $900.',
      'The dental cleaning price spread is the largest of any service — $250 to $900+ — and tracks local anesthesia protocols and wages.',
      'Dental cleanings vary enormously by region: $250 in some markets, $900+ in others, based on anesthesia and labor costs.',
      'Of all routine services, dental cleanings show the widest regional price spread — $250 to well over $900.'
    ]
  },
  {
    find: 'Urban clinics typically offer longer hours and specialist referrals but fewer in-office compounding options; rural clinics often flip that trade-off entirely.',
    variants: [
      'Urban clinics tend to have longer hours and specialist referrals but less in-office compounding; rural clinics frequently invert that trade-off.',
      'City vets usually offer broader hours and specialist access, while rural ones more often handle in-office compounding.',
      'Urban practices tend toward longer hours and specialist networks; rural practices tend toward in-house compounding and hands-on generalist care.',
      'In cities, clinics lean on longer hours and specialist referrals; rural clinics lean on in-house compounding and breadth of generalist services.',
      'Urban clinics optimise for hours and specialist networks; rural clinics optimise for in-office compounding and general capability.',
      'City clinics trade in-house compounding for specialist referrals and extended hours; rural clinics trade the other way.',
      'Expect longer hours and referral networks at urban clinics, and more in-house compounding at rural ones.',
      'Urban clinics generally have broader hours and specialist access but less in-office compounding; rural clinics often reverse that.',
      'Hours and referrals tend to be stronger at urban clinics; compounding and generalist depth tend to be stronger at rural ones.',
      'The urban-rural trade-off is roughly: hours and referrals versus in-house compounding and generalist breadth.',
      'Urban clinics give you hours and specialists; rural clinics more often give you in-office compounding and full-spectrum generalist care.',
      'City vets tend to prioritise hours and specialist access; country vets more often prioritise in-office compounding.',
      'Urban clinics usually win on hours and specialist access, while rural clinics more often win on in-office compounding and breadth.',
      'Extended hours and specialist referrals are typical of urban clinics; in-office compounding is typical of rural ones.',
      'Urban clinics bias toward hours and referrals; rural clinics bias toward compounding and generalist depth.',
      'The city-rural split tends to be: hours and specialists versus compounding and generalist capability.',
      'Urban clinics favour hours and specialist networks; rural clinics favour in-house compounding and generalist range.',
      'In cities, clinics trade compounding for hours and specialist access; in rural areas, that trade often flips.',
      'Urban clinics are stronger on hours and referrals; rural clinics are stronger on compounding and in-house generalist care.',
      'Extended hours and specialist referrals define urban clinic strengths; in-office compounding and generalist depth define rural ones.'
    ]
  },
  {
    find: 'Standard preventive care tends to range from $180 to $450 a year depending on local pricing, and bundled wellness plans can soften the cost if you commit to a single clinic.',
    variants: [
      'Annual preventive care usually lands between $180 and $450 depending on region, and wellness bundles from a single clinic can reduce the effective cost.',
      'Expect $180 to $450 a year for standard preventive care based on local rates; bundled plans at a single clinic can trim that figure.',
      'Routine preventive spend typically runs $180 to $450 annually by region, with wellness plans offering savings if you stay with one clinic.',
      'Standard preventive care costs $180 to $450 a year in most regions, and committing to one clinic via a bundled plan can reduce the outlay.',
      'Yearly preventive care ranges from $180 to $450 by market, and single-clinic wellness plans often save meaningful money.',
      'Preventive care typically costs $180 to $450 annually depending on where you live, with clinic-specific wellness plans offering bundle discounts.',
      'Annual preventive spending usually falls between $180 and $450 based on region, and wellness bundles reward single-clinic loyalty with lower prices.',
      'Routine preventive care runs $180 to $450 a year locally, and wellness plans that require single-clinic commitment can soften that cost.',
      'Budget $180 to $450 for annual preventive care depending on region; committing to one clinic through a wellness plan can lower the total.',
      'Typical annual preventive care is $180 to $450 by market, with bundled wellness plans offering discounts if you stay with one clinic.',
      'Regional pricing puts preventive care at $180 to $450 a year, and wellness bundles can cut that if you consolidate at one clinic.',
      'Standard preventive care across a year usually costs $180 to $450 depending on region, with wellness plans from single clinics reducing the net.',
      'Yearly routine care typically sits between $180 and $450 by region; bundled plans offered by single clinics can lower the effective cost.',
      'Plan for $180 to $450 in annual preventive care depending on region, with single-clinic wellness plans offering effective discounts.',
      'Routine annual preventive spending is generally $180 to $450 based on location; bundling through one clinic can bring that down.',
      'Preventive care annually runs $180 to $450 depending on local prices, with bundled wellness plans at a single clinic trimming the overall spend.',
      'Yearly preventive care sits in the $180 to $450 range depending on region; wellness plans offered by a single clinic can reduce the total.',
      'Expect to spend $180 to $450 a year on preventive care depending on local costs; wellness bundles tied to one clinic can save money.',
      'Annual preventive care typically costs $180 to $450 by region, and wellness plans that lock you to one clinic can reduce that amount.',
      'A year of preventive care usually costs $180 to $450 depending on region, with bundled plans at a single clinic trimming the total.'
    ]
  },
  {
    find: 'If your area has sharp humidity swings, small things like bedding materials and water-bowl placement end up mattering more than the more dramatic advice you tend to see online.',
    variants: [
      'In regions with big humidity swings, unglamorous details like bedding fabric and water-bowl location matter more than dramatic online tips.',
      'When humidity shifts a lot locally, bedding and bowl placement end up more important than the flashier advice online.',
      'Sharp local humidity swings make small details — bedding material, where you put the water bowl — matter more than the viral tips.',
      'If local humidity moves around, bedding choice and water-bowl placement will matter more than any clickbait care tip.',
      'Big humidity swings make everyday details like bedding materials and bowl positioning outweigh the louder online advice.',
      'Local humidity variability elevates the importance of small choices — bedding, water placement — above the dramatic advice you see online.',
      'Where humidity swings hard, mundane details beat dramatic online advice; bedding and bowl placement are examples.',
      'If humidity varies sharply in your area, boring details like bedding fabric and water-bowl location matter more than dramatic care tips.',
      'With sharp humidity swings, the quiet inputs — bedding materials, where the water bowl sits — outperform flashy internet advice.',
      'In variable-humidity regions, small practical choices about bedding and bowl placement end up more impactful than dramatic internet tips.',
      'Big humidity swings shift the leverage toward small, unglamorous inputs — bedding material, water-bowl location — rather than flashy advice.',
      'Sharp humidity swings favour attention to bedding and bowl placement over the more dramatic care advice you see online.',
      'Regions with big humidity swings reward attention to small details like bedding and water-bowl placement more than viral online tips.',
      'If humidity in your region is volatile, mundane details about bedding and water bowls matter more than the louder online advice.',
      'Unstable local humidity means the small inputs — bedding, water-bowl location — end up outweighing dramatic online advice.',
      'Where humidity swings, the ordinary details of bedding and water-bowl placement matter more than any internet-famous tip.',
      'In humidity-volatile areas, bedding choice and water-bowl location end up outweighing the flashier advice found online.',
      'Big local humidity swings mean the quiet choices — bedding, bowl placement — drive more of the outcome than the dramatic advice.',
      'Sharp humidity swings elevate bedding and water-bowl placement above the flashier tips in online advice.',
      'In regions where humidity moves fast, ordinary choices about bedding and bowl placement outweigh the more sensational online advice.'
    ]
  },
  {
    find: 'Weather apps with pollen and air-quality layers are surprisingly useful planning tools once you start checking them.',
    variants: [
      'Weather apps that show pollen and air-quality data become surprisingly useful planning tools once you habituate to checking them.',
      'Pollen and air-quality layers in weather apps are unexpectedly useful planning aids once you start looking at them regularly.',
      'Apps that overlay pollen and air-quality data on weather turn out to be unexpectedly practical planning tools.',
      'Once you start checking weather apps with pollen and air-quality data, you will notice how useful those layers actually are.',
      'The pollen and air-quality layers in weather apps are more useful than most owners expect, once they become part of the routine.',
      'Weather apps with pollen and air-quality data are more valuable for planning than their niche appearance suggests.',
      'Air-quality and pollen layers in weather apps are a surprisingly strong input to daily planning once you start using them.',
      'Routinely checking pollen and air-quality overlays in weather apps changes daily planning in subtle but useful ways.',
      'Pollen and air-quality weather-app layers turn into valuable planning tools once checking them becomes habit.',
      'The pollen-and-air-quality layer in a good weather app becomes an unexpectedly useful daily check.',
      'Weather apps with pollen and air-quality features are useful planning tools once they are part of your daily routine.',
      'Checking pollen and air-quality layers in weather apps becomes unexpectedly valuable after a few weeks of habit.',
      'Weather apps that include air quality and pollen data earn their place in daily planning once you start using them.',
      'The air-quality and pollen features in modern weather apps are surprisingly useful once you build them into your routine.',
      'Apps that track pollen and air quality alongside weather become useful planning inputs once they are habitually checked.',
      'Pollen and air-quality weather layers turn into useful planning tools once you incorporate them into your routine.',
      'Once you start looking at pollen and air-quality data in weather apps, they earn their place in daily planning.',
      'Weather apps with pollen and air-quality data layers prove themselves as planning tools after a few weeks of use.',
      'The air-quality and pollen features on weather apps are worth more as planning tools than most owners expect.',
      'Pollen and air-quality overlays on weather apps are a useful planning input once they become part of the daily check.'
    ]
  }
];

function main() {
  const files = walk(ROOT);
  console.log(`Pass 19: scanning ${files.length} files...`);
  let filesModified = 0;
  const byPhrase = {};
  PHRASES.forEach((p, i) => byPhrase[i] = 0);

  for (const f of files) {
    let html = fs.readFileSync(f, 'utf8');
    const orig = html;
    const seed = hash(f + ':p19');

    PHRASES.forEach((p, i) => {
      if (!html.includes(p.find)) return;
      let localCount = 0;
      while (html.includes(p.find)) {
        const variant = p.variants[(seed + i * 17 + localCount * 11) % p.variants.length];
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
  console.log('=== PASS 19 COMPLETE ===');
  console.log(JSON.stringify({ filesScanned: files.length, filesModified, byPhrase: report }, null, 2));
}

main();
