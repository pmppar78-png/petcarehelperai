#!/usr/bin/env node
// Pass 20: Continue breaking up the remaining 1,200-2,300 instance clusters.
// Same approach as pass-18/19. These are more regional-cost / care-plan template sentences.

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

function makeVariants(base, count) {
  // Shorthand — we hand-craft 15 variants per phrase below.
  return base;
}

const PHRASES = [
  {
    find: 'Vaccination pricing varies widely: some rural clinics charge a flat $35 per core vaccine, while urban practices may quote $55–$75 plus an exam fee on top.',
    variants: [
      'Core vaccine pricing spans a wide range — roughly $35 flat at some rural clinics, $55–$75 plus exam fees at urban practices.',
      'Expect $35 flat at lower-cost rural clinics and $55–$75 plus an exam fee at urban practices for core vaccines.',
      'Vaccine prices vary: rural clinics sometimes charge a flat $35 per core vaccine, while urban ones tend toward $55–$75 plus an exam fee.',
      'The spread on core vaccines runs from about $35 flat in rural clinics to $55–$75 plus exam in urban practices.',
      'Rural clinics may quote a flat $35 per core vaccine; urban practices typically run $55–$75 plus an exam fee.',
      'Core vaccine pricing is geography-sensitive — flat $35 in some rural clinics, $55–$75 plus exam in cities.',
      'Vaccination costs differ sharply by market: rural flat $35 vs. urban $55–$75 plus exam fees.',
      'Expect a pricing gap of roughly 2x on core vaccines between rural and urban clinics ($35 vs. $55–$75 plus exam).',
      'Core vaccines typically cost around $35 flat in rural clinics and $55–$75 plus exam in urban ones.',
      'The price range for a core vaccine is about $35 at rural flat-rate clinics and $55–$75 plus exam fees at urban practices.',
      'Rural clinics often offer flat-rate vaccines near $35; urban practices tend to charge $55–$75 plus exam fees.',
      'Core vaccine prices swing from about $35 rural-flat to $55–$75 urban-plus-exam.',
      'You will see roughly $35 flat at lower-cost rural clinics and $55–$75 plus exam at urban practices for the same core vaccine.',
      'Vaccine pricing ranges widely — $35 at rural flat-rate clinics, $55–$75 plus exam at most urban practices.',
      'Typical core vaccine pricing: rural ~$35 flat, urban $55–$75 plus an exam fee.',
      'Cost per core vaccine runs about $35 flat in rural areas and $55–$75 plus an exam fee in urban areas.',
      'Urban practices typically charge $55–$75 plus exam fees for core vaccines; rural clinics sometimes come in at a flat $35.',
      'Expect a wide vaccine pricing range — ~$35 flat at rural clinics, $55–$75 plus an exam fee at urban practices.',
      'Core vaccine prices differ a lot by market: $35 flat in rural areas, $55–$75 plus exam in cities.',
      'The pricing spread for core vaccines is significant — roughly $35 rural-flat vs. $55–$75 urban-plus-exam.'
    ]
  },
  {
    find: 'Seasonal shifts often matter more than most pet care blogs imply — a spring that arrives early or late can visibly change appetite, shedding, and activity levels within a week or two.',
    variants: [
      'Most pet-care blogs underplay seasonal shifts; an early or late spring can change appetite, shedding, and activity noticeably within a week or two.',
      'Seasons affect pets more than most blogs suggest — an off-schedule spring moves appetite, shedding, and activity within a week or two.',
      'Blogs tend to understate seasonal effects; a spring that lands early or late can shift appetite, shedding, and activity in about two weeks.',
      'The impact of seasonal shifts is bigger than most pet-care blogs admit, with appetite, shedding, and activity visibly changing within a week or two of an off-schedule season.',
      'Seasonal timing matters more than most blogs suggest — visible changes in appetite, shedding, and activity often show within two weeks of an early or late spring.',
      'Most pet-care content understates how much seasonal shifts affect behavior; an early or late spring can alter appetite, shedding, and activity in a week or two.',
      'Owners usually see measurable changes in appetite, shedding, and activity within a week or two of an early or late spring — blogs tend to downplay this.',
      'Pet-care blogs tend to understate seasonality, but an off-schedule spring can shift appetite, shedding, and activity within a fortnight.',
      'The effect of seasonal shifts is bigger than most blogs suggest, visible in appetite, shedding, and activity changes within a week or two.',
      'Seasonality hits harder than pet-care blogs imply — an off-schedule spring moves appetite, shedding, and activity within about two weeks.',
      'An early or late spring often produces visible changes in appetite, shedding, and activity within two weeks, which most blogs underplay.',
      'Seasonal effects are larger than most blogs describe — appetite, shedding, and activity commonly change within a week or two of season shifts.',
      'Pet-care blogs understate seasonal influence; off-schedule springs tend to alter appetite, shedding, and activity within ten to fifteen days.',
      'The real effect of seasonal shifts is bigger than pet-care blogs admit, with appetite, shedding, and activity shifting inside two weeks of an early or late spring.',
      'Most blogs understate seasonal effects — appetite, shedding, and activity often change within a fortnight of an early or late spring.',
      'Seasonal influence on pets is stronger than most pet-care content implies — changes in appetite, shedding, and activity appear within about two weeks.',
      'Seasonal shifts move appetite, shedding, and activity within a week or two of an off-schedule spring — stronger than most blogs acknowledge.',
      'An early or late spring typically produces visible shifts in appetite, shedding, and activity within ten to fifteen days, more than most blogs convey.',
      'The season-driven shift in appetite, shedding, and activity within two weeks of spring landing early or late is bigger than most blogs suggest.',
      'Seasonal shifts have more behavioral impact than blogs describe — appetite, shedding, and activity change within a week or two of an off-schedule spring.'
    ]
  },
  {
    find: 'Mountain and high-altitude households should factor in respiratory-load considerations for any travel plans, which many lowland vets do not raise unprompted.',
    variants: [
      'If you live at altitude, build respiratory load into travel plans for your pet — a factor many lowland vets will not raise on their own.',
      'High-altitude households should consider respiratory strain on travel, which lowland vets often do not mention unprompted.',
      'Living at altitude changes travel planning for pets; respiratory load is a factor most lowland vets will not raise unless asked.',
      'Mountain-area owners should plan for altitude-related respiratory load on travel; lowland vets often omit this consideration by default.',
      'Altitude effects on respiration are worth factoring into travel plans — a consideration most lowland vets do not bring up on their own.',
      'If you are at elevation, travel plans should account for respiratory load; many lowland vets will not mention it unless asked.',
      'High-altitude households should plan around respiratory considerations for travel, a topic lowland vets often skip unless prompted.',
      'Altitude adds a respiratory consideration to travel planning that lowland vets typically do not raise unprompted.',
      'Elevation-driven respiratory load matters for pet travel; many lowland vets will not bring this up unless asked.',
      'If you live in the mountains, factor in respiratory strain for travel; most lowland vets will not volunteer the consideration.',
      'Altitude-adapted pets face respiratory load considerations during travel that lowland vets rarely address without prompting.',
      'For households at altitude, travel plans should account for respiratory load — a factor often missed by lowland vets.',
      'Elevation introduces a respiratory-load consideration to travel planning that most lowland vets do not raise by default.',
      'Mountain-area households should plan for respiratory load on travel, which lowland vets tend to overlook unless asked.',
      'Altitude affects respiratory load during travel; most lowland vets will not bring it up without prompting.',
      'If your household is at altitude, plan for respiratory considerations on travel; lowland vets often miss this.',
      'High-altitude homes need to factor respiratory load into travel planning — a topic that lowland vets commonly miss.',
      'Elevation complicates travel planning with respiratory-load considerations that lowland vets typically skip unless asked.',
      'Plan for respiratory load during travel if you live at altitude; it is a detail many lowland vets do not raise.',
      'Altitude-dwelling pets carry respiratory-load considerations for travel that lowland vets rarely discuss unprompted.'
    ]
  },
  {
    find: 'Wildfire smoke, ragweed season, and indoor humidity all influence respiratory comfort in ways that a standard wellness checklist does not capture.',
    variants: [
      'Wildfire smoke, ragweed season, and indoor humidity affect respiratory comfort in ways standard wellness checklists miss.',
      'Standard wellness checklists do not capture how wildfire smoke, ragweed, and indoor humidity shape respiratory comfort.',
      'Respiratory comfort is affected by wildfire smoke, ragweed season, and indoor humidity — factors standard checklists overlook.',
      'Wellness checklists typically miss the respiratory impact of wildfire smoke, ragweed, and indoor humidity.',
      'Respiratory comfort depends on wildfire smoke, ragweed season, and indoor humidity — none of which standard checklists cover.',
      'The three inputs most standard wellness checklists miss: wildfire smoke, ragweed season, and indoor humidity — all matter for respiratory comfort.',
      'Wildfire smoke, ragweed, and indoor humidity levels all shape respiratory comfort beyond what a standard wellness form captures.',
      'A standard wellness form misses respiratory-comfort factors like wildfire smoke, ragweed season, and indoor humidity.',
      'Wildfire smoke, ragweed, and indoor humidity are respiratory-comfort inputs that most checklists fail to address.',
      'Expect wildfire smoke, ragweed season, and indoor humidity to matter for respiratory comfort — even though standard checklists rarely include them.',
      'Respiratory comfort is shaped by wildfire smoke, ragweed season, and indoor humidity, none of which standard wellness forms track.',
      'Wildfire smoke, ragweed, and indoor humidity all influence respiratory comfort, and standard checklists typically do not address them.',
      'Standard wellness checklists leave out wildfire smoke, ragweed, and indoor humidity — all real respiratory-comfort variables.',
      'Respiratory comfort is driven by wildfire smoke, ragweed season, and indoor humidity — variables most wellness checklists ignore.',
      'The standard wellness checklist misses major respiratory factors: wildfire smoke, ragweed season, and indoor humidity.',
      'Wildfire smoke, ragweed season, and indoor humidity shape respiratory comfort, but a standard wellness form rarely asks about them.',
      'Standard checklists do not capture the respiratory impact of wildfire smoke, ragweed season, or indoor humidity.',
      'Wellness forms often skip wildfire smoke, ragweed, and indoor humidity — all meaningful factors for respiratory comfort.',
      'Respiratory comfort is sensitive to wildfire smoke, ragweed season, and indoor humidity — factors the standard wellness checklist misses.',
      'Wildfire smoke, ragweed, and indoor humidity are major respiratory-comfort inputs absent from most standard checklists.'
    ]
  },
  {
    find: 'If travel plans are on the horizon, book care logistics at least 6 weeks early during school-break seasons.',
    variants: [
      'Planning travel during school breaks? Book pet-care logistics at least six weeks out.',
      'During school-break travel seasons, lock in pet-care logistics six-plus weeks in advance.',
      'If you plan to travel during school breaks, reserve pet care six or more weeks early.',
      'School-break travel demands at least a six-week lead time for pet-care logistics.',
      'Book pet-care logistics six-plus weeks ahead if travel during school-break seasons is on your calendar.',
      'Travel around school breaks? Get pet-care logistics set at least six weeks in advance.',
      'For school-break travel, pet-care reservations need at least six weeks of lead time.',
      'School-break travel fills pet-care capacity early — book at least six weeks out.',
      'If travel plans land during school-break seasons, lock pet-care logistics in six weeks or more ahead of time.',
      'Plan pet-care bookings at least six weeks ahead for travel during school-break seasons.',
      'School-break travel crowds pet-care capacity; book six-plus weeks early.',
      'At minimum six weeks of lead time is needed for pet-care logistics during school-break travel seasons.',
      'Travel during school breaks? Pet-care logistics should be locked in at least six weeks ahead.',
      'Reserve pet-care logistics six-plus weeks early for travel during school-break seasons.',
      'For school-break travel, pet-care reservations at least six weeks out are typically necessary.',
      'School-break travel plans require six-plus weeks of lead time on pet-care logistics.',
      'If travel falls during a school break, book pet care at least six weeks in advance.',
      'School-break travel planning should include pet-care logistics secured six weeks ahead.',
      'For travel during school breaks, pet-care bookings need at least six weeks of lead time.',
      'Plan to book pet-care logistics six weeks or more ahead for school-break travel.'
    ]
  },
  {
    find: 'Desert climates tend to push care plans toward hydration monitoring and paw-pad protection, while northern climates place more weight on seasonal coat care and indoor enrichment.',
    variants: [
      'Desert climates steer care plans toward hydration and paw-pad protection; northern climates weight them toward coat care and indoor enrichment.',
      'In desert regions, care plans lean on hydration monitoring and paw-pad protection; up north, they lean on coat care and indoor enrichment.',
      'Climate shifts the care emphasis — deserts toward hydration and paw pads, northern areas toward coats and indoor enrichment.',
      'Expect hydration and paw-pad protection to dominate desert care plans, and coat care and indoor enrichment to dominate northern ones.',
      'Desert care plans center on hydration and paw-pad protection; northern care plans center on coat care and indoor enrichment.',
      'Where it is hot and dry, plan around hydration and paw pads; where it is cold and dark, plan around coats and indoor enrichment.',
      'Climate drives the focus: hydration and paw pads in deserts, coats and indoor enrichment up north.',
      'Desert climates emphasise hydration and paw-pad care; northern climates emphasise seasonal coat care and indoor enrichment.',
      'Hydration and paw-pad protection lead in desert care plans; coat care and indoor enrichment lead in northern ones.',
      'Desert regions push care toward hydration and paw pads; northern regions push it toward coats and indoor enrichment.',
      'Regional care emphasis: deserts on hydration and paw pads, northern areas on coats and indoor enrichment.',
      'Deserts bias care toward hydration monitoring and paw-pad protection; northern climates bias it toward coat maintenance and indoor enrichment.',
      'In desert conditions, hydration and paw pads lead; in northern conditions, coat care and indoor enrichment take the lead.',
      'Desert care prioritises hydration and paw pads; northern care prioritises coats and indoor enrichment.',
      'Expect desert care plans to emphasise hydration and paw-pad care; northern plans emphasise coats and indoor enrichment.',
      'Hydration and paw-pad protection dominate desert plans; coat care and indoor enrichment dominate northern ones.',
      'The desert/northern split: hydration and paw pads versus coats and indoor enrichment.',
      'Care plans in deserts focus on hydration and paw pads; in northern climates, they focus on coats and indoor enrichment.',
      'Desert care plans tilt toward hydration and paw-pad protection; northern plans tilt toward coat care and indoor enrichment.',
      'Hot-dry climates emphasise hydration and paw pads in care; cold-northern climates emphasise coat care and indoor enrichment.'
    ]
  },
  {
    find: 'An annual wellness visit in a small town can run $45–$85, while the same appointment in a large metro area often lands closer to $110–$180, and emergency after-hours visits can triple that figure.',
    variants: [
      'Annual wellness visits run $45–$85 in small towns and $110–$180 in large metros, with emergency after-hours visits triple that.',
      'Wellness visit pricing: $45–$85 small-town, $110–$180 metro, emergency after-hours roughly 3x the metro rate.',
      'Expect $45–$85 for annual wellness in small towns, $110–$180 in large metros, and triple that for after-hours emergencies.',
      'Annual wellness costs: $45–$85 in small towns, $110–$180 in metros; after-hours emergencies can triple the metro figure.',
      'Small-town wellness visits cost $45–$85; metro visits $110–$180; after-hours emergencies roughly 3x metro pricing.',
      'Wellness visit pricing varies widely — $45–$85 in small towns, $110–$180 in metros, and 3x that for after-hours emergencies.',
      'A routine wellness visit runs $45–$85 in small towns, $110–$180 in metros, and emergency after-hours visits can cost three times the metro rate.',
      'Annual wellness: $45–$85 small-town, $110–$180 big-city, and after-hours emergency visits commonly 3x the big-city rate.',
      'Small-town annual wellness: $45–$85; large-metro annual wellness: $110–$180; emergency after-hours: about 3x the metro figure.',
      'Expect $45–$85 for a wellness visit in a small town and $110–$180 in a metro, with emergency after-hours visits tripling the metro price.',
      'Annual wellness visit costs: small-town $45–$85, metro $110–$180, after-hours emergency roughly triple the metro rate.',
      'A wellness visit runs $45–$85 in small towns and $110–$180 in metros; emergency after-hours often costs three times the metro figure.',
      'Pricing for wellness visits: $45–$85 in small towns, $110–$180 in metros; emergency after-hours visits typically run 3x the metro cost.',
      'Small-town wellness pricing ($45–$85) vs. metro ($110–$180), with after-hours emergency visits roughly 3x the metro rate.',
      'Wellness visit pricing: $45–$85 (small town), $110–$180 (metro); emergency after-hours visits often three times the metro figure.',
      'Annual wellness visits can be $45–$85 in small towns, $110–$180 in metros, and 3x the metro rate for after-hours emergencies.',
      'Expect $45–$85 in small towns and $110–$180 in metros for wellness visits, with emergency visits roughly tripling the metro price.',
      'An annual wellness appointment runs $45–$85 in a small town, $110–$180 in a metro, and about 3x metro for after-hours emergencies.',
      'Wellness visit costs: small-town $45–$85, big-city $110–$180, after-hours emergency roughly three times the big-city rate.',
      'Small-town wellness ($45–$85) contrasts with metro wellness ($110–$180), and emergency after-hours is about 3x the metro figure.'
    ]
  },
  {
    find: 'If introductions to new people tend to feel awkward, try the "parallel activity" method — shared presence without direct interaction for the first 10–15 minutes.',
    variants: [
      'When introductions feel awkward, try parallel activity — being in the same space without direct interaction for the first 10–15 minutes.',
      'For awkward introductions, use parallel activity: shared presence with no direct interaction for the first 10–15 minutes.',
      'If meeting new people feels stilted, try 10–15 minutes of parallel activity — presence without interaction — first.',
      'Parallel activity handles awkward introductions well: 10–15 minutes of shared space without direct interaction.',
      'Try parallel activity for stiff introductions — coexist in the same space without direct interaction for the first 10–15 minutes.',
      'Awkward first meetings often ease with parallel activity: shared presence, no direct interaction, for the first 10–15 minutes.',
      'For tense introductions, parallel activity — same room, no direct interaction — for 10–15 minutes tends to reset the dynamic.',
      'The parallel-activity technique (shared space, no direct interaction) is useful for smoothing awkward introductions in the first 10–15 minutes.',
      'Parallel activity — simply being in the same space without interacting — works well for awkward introductions, for the first 10–15 minutes.',
      'When introductions stall, try 10–15 minutes of parallel activity: shared presence, no direct interaction.',
      'Awkward first meetings benefit from parallel activity — 10–15 minutes of coexistence without forced interaction.',
      'Parallel activity (no direct interaction, shared space) is a reliable fix for stiff introductions in the first 10–15 minutes.',
      'If introductions are awkward, run 10–15 minutes of parallel activity first — shared space without interaction.',
      'Parallel-activity introductions — being present without interacting — tend to smooth awkward first meetings over the first 10–15 minutes.',
      'Try parallel activity (coexistence, no direct interaction) for 10–15 minutes when introductions feel awkward.',
      'For awkward intros, lead with parallel activity: 10–15 minutes of shared presence with no direct interaction.',
      'Parallel activity — shared presence without direct interaction — softens awkward introductions in the first 10–15 minutes.',
      'When meeting new people is stiff, use 10–15 minutes of parallel activity before any direct interaction.',
      'Parallel activity handles awkward first meetings well: 10–15 minutes of coexistence without direct interaction.',
      'Try parallel activity for 10–15 minutes during awkward introductions — shared space with no direct interaction.'
    ]
  },
  {
    find: 'Many owners report that mid-week is a better time for grooming sessions than weekends — less household noise, fewer distractions, calmer outcomes.',
    variants: [
      'Mid-week grooming sessions often go better than weekend ones — quieter house, fewer distractions, calmer animal.',
      'Owners often find mid-week grooming smoother than weekend grooming because the household is quieter.',
      'Tuesday-to-Thursday grooming tends to produce calmer outcomes than Saturday-Sunday grooming, thanks to lower household noise.',
      'Mid-week grooming usually beats weekend grooming on calm — quieter house, fewer distractions.',
      'Weekends are louder and more distracting; mid-week grooming tends to produce calmer sessions.',
      'A mid-week grooming slot often works better than a weekend slot because the house is quieter.',
      'Grooming on a weekday mid-week tends to produce calmer outcomes than weekend sessions.',
      'Owners commonly report smoother grooming mid-week than on weekends — less household chaos, more focus.',
      'Mid-week grooming sessions are often easier than weekend ones because the household is less busy.',
      'Tuesday through Thursday tends to beat Saturday-Sunday for grooming because the house is quieter.',
      'Weekday-mid-week grooming is typically calmer than weekend grooming thanks to lower household activity.',
      'Many owners observe that mid-week grooming goes smoother than weekends — lower noise, fewer interruptions.',
      'Mid-week grooming sessions tend to be calmer because the household is quieter than on weekends.',
      'Calmer grooming outcomes tend to show up mid-week rather than on weekends, thanks to a less noisy house.',
      'Weekend grooming faces more household chaos; mid-week sessions tend to be calmer and more productive.',
      'A mid-week slot often produces better grooming results than a weekend slot because the house is quieter.',
      'Owners find mid-week grooming tends to go better than weekend grooming — less household noise and distraction.',
      'Mid-week grooming typically beats weekend grooming on calm and focus.',
      'Grooming sessions tend to go smoother mid-week, when the household is quieter than on weekends.',
      'Tuesday-to-Thursday grooming often has calmer outcomes than Saturday-Sunday grooming.'
    ]
  }
];

function main() {
  const files = walk(ROOT);
  console.log(`Pass 20: scanning ${files.length} files...`);
  let filesModified = 0;
  const byPhrase = {};
  PHRASES.forEach((p, i) => byPhrase[i] = 0);

  for (const f of files) {
    let html = fs.readFileSync(f, 'utf8');
    const orig = html;
    const seed = hash(f + ':p20');

    PHRASES.forEach((p, i) => {
      if (!html.includes(p.find)) return;
      let localCount = 0;
      while (html.includes(p.find)) {
        const variant = p.variants[(seed + i * 19 + localCount * 13) % p.variants.length];
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
  console.log('=== PASS 20 COMPLETE ===');
  console.log(JSON.stringify({ filesScanned: files.length, filesModified, byPhrase: report }, null, 2));
}

main();
