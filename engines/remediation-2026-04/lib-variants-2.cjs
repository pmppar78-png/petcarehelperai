// Variant banks for non-cost-to-own page types.
// All functions take (breed, species, seed) and return HTML paragraph(s).

const { titleCase, articleFor } = require('./lib-variants.cjs');

// -------- best-food: Best for Transitioning Diet & Weight Management --------

function transitioningDiet(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>Switch ${breedTitle} food over seven to ten days, not one or two. Start with about 25% new food mixed into the existing diet for three days, step to 50/50 for the next three days, shift to 75% new food for two days, then complete the change. This slow ramp gives the ${breedTitle}'s gut microbiome time to adapt and catches any intolerance before it turns into sustained GI upset.</p>
      <p>Track three markers during the transition: stool consistency, appetite, and energy. Any material change in any one of these is a signal to pause the transition for an extra 48 hours, not to push through. Transitions that trigger repeated loose stools or appetite suppression are often diet-quality or ingredient issues, not adjustment issues — the right response is usually a return to the previous food and a conversation with the veterinarian rather than a further change.</p>`,
    `<p>Diet transitions for ${breedTitle} should be planned around life events rather than inserted as standalone changes. Avoid switching food in the same week as travel, boarding, a vet visit, new household stressors, or a change in exercise routine, because it becomes impossible to attribute any observed symptom to the right cause. A quiet week with a stable routine gives a transition the cleanest baseline.</p>
      <p>During the transition itself, keep water intake consistent, keep treat patterns stable, and resist the urge to add enticers to the new food. The goal is for the ${breedTitle} to associate the new food with normal feeding rhythm, not with a novelty experience. Once the switch is complete, hold the new food for at least three weeks before assessing performance.</p>`,
    `<p>Plan the ${breedTitle} transition with a simple day-by-day schedule. Days 1–2: 25% new, 75% old. Days 3–4: 50/50. Days 5–6: 75% new, 25% old. Day 7 onward: 100% new food. If GI signs appear at any stage, drop back to the previous ratio and hold for three to four days before progressing. If two attempts fail to move past a given step, the new food is probably not the right match.</p>
      <p>The most common transition failure is rushing. A two-day transition is effectively a food shock and produces the GI symptoms owners then mistakenly attribute to the new food itself. Give the seven-to-ten-day protocol the benefit of the doubt before concluding that a formulation is wrong for your ${breedTitle}.</p>`,
    `<p>For a sensitive ${breedTitle}, extend the standard transition to fourteen days and keep each step for three full days before advancing. The extra time costs very little and dramatically reduces the chance of triggering a reactive flare that takes weeks to resolve. For most ${breedTitle}s, the ten-day schedule is sufficient; the fourteen-day schedule is a hedge worth taking for any animal with known GI sensitivity or a history of food reactions.</p>
      <p>Keep a short log across the transition: date, ratio, stool quality on a simple 1–4 scale, and appetite. A log catches patterns that memory blurs and makes the next transition — if one is ever needed — noticeably faster and safer.</p>`
  ];
  return variants[seed % variants.length];
}

function weightManagement(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>Weight management for ${breedTitle} is a calorie accounting problem. Most overweight ${breedTitle}s receive the right-looking portion plus the un-tracked calories from treats, chews, table scraps, and training rewards. A weight-management formula with L-carnitine and elevated fibre helps satiety, but it does not fix the accounting. Measure daily food by gram rather than scoop, count treat calories into the daily total, and restrict treats to 10% of daily intake.</p>
      <p>Set a target weight with the veterinarian and reassess monthly. Weight loss of roughly 1% of body weight per week is safe and sustainable; faster loss risks lean-mass depletion, particularly for adult and senior ${breedTitle}s. Re-measure body condition score at each monthly check-in, because weight alone can mislead when lean mass is shifting alongside fat.</p>`,
    `<p>A ${breedTitle} on a weight-management protocol does well on a formulation with higher protein, higher fibre, and lower calorie density. The protein preserves lean mass during caloric deficit; the fibre extends satiety between meals; the lower calorie density allows feeding a similar volume while reducing intake. Combined with structured portion control, this formulation shifts the ${breedTitle} toward a healthy weight without the frustration of visibly smaller meals.</p>
      <p>The biggest hidden variable is exercise. ${breedTitle}s on a weight programme benefit from a modest, consistent increase in daily activity rather than dramatic exercise bursts. Ten to fifteen additional minutes of walking or play per day, sustained for months, outperforms weekend-only intensive sessions.</p>`,
    `<p>Effective weight management for ${breedTitle} requires three measurements: a starting body weight on a reliable scale, a starting body condition score assigned by the veterinarian, and a realistic target for both. Without numbers, progress cannot be evaluated and setbacks cannot be distinguished from expected variability. With numbers, the programme becomes tractable.</p>
      <p>Re-weigh every two weeks during active loss, monthly during maintenance. Adjust portion sizes in small increments rather than large cuts — a 5–10% portion reduction sustained over several weeks outperforms a 25% reduction that triggers begging, scavenging, and rebound overfeeding. Sustainable weight management is almost always a matter of small, maintained adjustments.</p>`,
    `<p>The right weight-management food for ${breedTitle} contains L-carnitine (which supports fat metabolism), an elevated fibre fraction (which extends satiety), a controlled fat content, and high-quality protein sufficient to preserve lean mass during caloric restriction. Avoid products that rely primarily on bulk fillers to achieve low calorie density — they produce volume without supporting nutritional needs.</p>
      <p>Pair the formulation with a portion calculated against target weight rather than current weight, feed measured meals on a fixed schedule, and keep treats below 10% of daily calorie intake. These four habits together resolve the majority of ${breedTitle} weight issues within four to six months.</p>`
  ];
  return variants[seed % variants.length];
}

// -------- best-insurance: Senior Nutrition misplacement & other orphans --------

function seniorCareNotes(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>Senior ${breedTitle}s — typically age seven and up — benefit from a distinct approach to preventive care. Annual wellness exams move to biannual, with baseline bloodwork at each visit. Joint supplementation, dental attention, and weight monitoring all become more important as metabolism slows and chronic conditions become more likely. Insurance plans should be reviewed annually at this stage, paying close attention to per-condition and annual limits, because senior claims concentrate and exhaust limits faster than adult claims.</p>
      <p>Proactive senior management outperforms reactive senior management by a wide margin. The conditions most likely to drive veterinary spend in the ${breedTitle}'s senior years — dental disease, orthopedic change, renal or hepatic drift — are detectable early with routine bloodwork and physical exam. Spending on biannual wellness in year eight is a direct investment in avoiding emergency costs in years ten through twelve.</p>`,
    `<p>Senior care planning for ${breedTitle} deserves its own line in the household budget. Typical senior-year spending runs 1.4× to 2× the adult baseline, driven by bloodwork frequency, medication for joint and organ support, and dental work accumulated over earlier years. Insurance claims concentrate here, and the household that started insurance in year one is substantially ahead of the household that attempts to start it in year eight with pre-existing conditions.</p>
      <p>Review the insurance policy text at this stage — specifically the wording on bilateral conditions, chronic conditions, and per-condition caps. These clauses shape what is actually reimbursed in senior years, and they vary meaningfully between carriers.</p>`,
    `<p>Late-life care for a ${breedTitle} is where policy structure and preventive discipline earn their keep. A senior bloodwork panel catches renal, hepatic, thyroid, and pancreatic drift before it becomes symptomatic, typically at a cost of $180–$350 per panel. Twice-yearly wellness exams at this age cost a fraction of the single emergency workup they commonly prevent.</p>
      <p>If insurance is already in force, keep it. Dropping senior coverage in an attempt to save on premiums is almost always a false economy, because the claim probability is highest exactly here and any subsequent attempt to re-enrol triggers pre-existing condition exclusions on anything diagnosed in the interim.</p>`,
    `<p>Senior ${breedTitle} considerations are frequently grouped under insurance planning because they reshape the household's risk profile. The most important planning insight is that senior-year spending is not evenly distributed: it concentrates in specific events — dental procedures, diagnostic workups, and chronic-disease management — rather than flowing evenly through the year. Budget for lumpy spend, not smooth spend, past age seven.</p>`
  ];
  return variants[seed % variants.length];
}

// -------- best-enrichment: High-Energy / Social / Long-Term orphans --------

function highEnergyEnrichment(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>A high-energy ${breedTitle} needs both physical and cognitive outlets, not just longer walks. Physical outlets alone produce a fitter animal with the same mental restlessness; cognitive outlets alone produce a calm animal with pent-up physical energy. Combine the two — structured exercise followed by problem-solving activities — and the ${breedTitle} settles into a noticeably steadier daily rhythm.</p>
      <p>Rotate the cognitive components so the ${breedTitle} cannot anticipate the activity. Novelty is the active ingredient. Puzzle feeders that switch between mechanisms, scent work that uses new target odours, and training sessions that introduce new behaviours each week all keep the mental workload meaningful.</p>`,
    `<p>For a high-energy ${breedTitle}, the enrichment budget should skew toward activities with variable outcomes rather than predictable ones. A repetitive fetch routine satisfies physical energy but disengages cognitively over time. Activities with search, problem-solving, or decision-making components — scent games, novel agility sequences, sequenced recall drills — hold engagement far longer.</p>
      <p>Two targeted twenty-minute cognitive sessions a day, bracketed by standard physical exercise, produce better behavioural outcomes than a single hour of high-intensity play. The cognitive fatigue compounds through the day and translates into a materially calmer ${breedTitle} by evening.</p>`,
    `<p>High-energy ${breedTitle}s respond to structured enrichment ladders. Start the day with physical exercise to release baseline energy, move to a moderate cognitive task mid-morning, include a short training session at midday, and finish the afternoon with a final physical outlet. Spacing the enrichment across the day reduces crash-and-recover cycles and produces a steadier baseline.</p>
      <p>Evaluate the ladder monthly. Behaviour that appears when the ladder is omitted — excessive vocalisation, destructive chewing, pacing, or demand behaviours — is a direct signal that enrichment is undersupplied, and adjusting the ladder is usually more effective than corrective training.</p>`,
    `<p>The common mistake with high-energy ${breedTitle} enrichment is the assumption that more exercise solves the problem. It does not; it raises the animal's exercise tolerance. A five-mile walk becomes a ten-mile walk becomes a fifteen-mile walk, and the baseline arousal level rises alongside. Cognitive and social enrichment — puzzles, scent work, new environments, supervised interaction with other animals — are the correct levers for a ${breedTitle} that is already physically fit.</p>`
  ];
  return variants[seed % variants.length];
}

function socialEnrichment(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>Social enrichment for ${breedTitle} is frequently undersupplied. Social interaction with other animals and with people introduces a dimension of unpredictability that puzzle feeders and solo activities cannot replicate. Even ${breedTitle}s that are less social by temperament benefit from brief, low-intensity exposures to novel stimuli, because the interpretive work itself is cognitively engaging.</p>
      <p>Calibrate social exposure to the individual animal rather than to the breed average. A well-socialised ${breedTitle} may handle a busy dog park; a more reserved ${breedTitle} may find a quiet leashed walk past unfamiliar people more valuable. Err on the side of shorter, positive exposures repeated often, rather than long exposures that push the animal past its tolerance.</p>`,
    `<p>The simplest social enrichment protocol for ${breedTitle} is the one-novelty-per-day rule: every day, the ${breedTitle} encounters at least one new person, animal, environment, sound, or surface. The novelty does not need to be dramatic — a new route on a walk, a different surface to stand on, a new scent on a familiar toy. Consistent small novelty compounds into the confident, adaptable animal most owners want without the stress of occasional high-novelty events.</p>`,
    `<p>Social needs for ${breedTitle} evolve with age. Puppies need high-frequency, low-intensity exposure to many different stimuli during the critical socialisation window. Adult ${breedTitle}s maintain social flexibility through periodic varied exposure. Seniors benefit from social continuity — familiar people, familiar animals, familiar routines — more than from novelty. Matching the social programme to the life stage keeps engagement positive rather than stressful.</p>`,
    `<p>Social enrichment does not require a dog park. Supervised play with a known, compatible playmate; a leashed walk through a moderately stimulating environment; a training class with familiar instructors — each delivers the social dimension without the variance of open-access group settings. For ${breedTitle}s with low social tolerance, controlled exposures are almost always preferable to chaotic ones.</p>`
  ];
  return variants[seed % variants.length];
}

function longTermEnrichmentPlanning(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>Enrichment for ${breedTitle} is best planned on a weekly cycle rather than a daily one. A weekly plan assigns specific activities to specific days — cognitive puzzle days, scent work days, social outing days, recovery days — and rotates across weeks so the animal does not habituate to a fixed pattern. Owners who plan enrichment weekly report fewer behavioural issues and lower enrichment fatigue than owners who wing it daily.</p>
      <p>Reassess the weekly plan quarterly. The ${breedTitle}'s preferences, energy level, and tolerance for different activity types drift over time, especially between adulthood and early senior years. A plan that worked at age three rarely fits the same animal at age eight without modification.</p>`,
    `<p>Long-term enrichment planning for ${breedTitle} benefits from keeping a small inventory of tools — three to five puzzle feeders rotated weekly, two to three types of chew, a handful of scent work targets, and at least one novel environment per week. The inventory itself is modest, but the rotation produces the novelty that keeps enrichment effective over months and years.</p>
      <p>Avoid rotating too frequently. An enrichment item needs repeated exposure before its difficulty becomes predictable enough for the animal to develop strategies — that strategy-building is part of the cognitive benefit. Rotate weekly, not daily.</p>`,
    `<p>A sustainable ${breedTitle} enrichment programme has three components: a small set of recurring activities that provide baseline engagement, a rotation of novel activities introduced every two to four weeks, and occasional high-intensity events (a training class, an outing to a new environment, a supervised social interaction). Recurring activities provide predictability; rotation provides cognitive engagement; high-intensity events reset the engagement ceiling.</p>`,
    `<p>Enrichment investments for ${breedTitle} compound. An hour invested setting up a puzzle feeder library and a rotation schedule delivers months of varied engagement without further setup. A few hours invested in early socialisation produces a decade of easier handling. A small investment in a structured training foundation produces years of practical value. Prioritise enrichment decisions that pay back over a long window rather than activities that must be regenerated daily.</p>`
  ];
  return variants[seed % variants.length];
}

// -------- health-costs: Building a Vet Fund & related orphans --------

function buildingVetFund(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>A vet fund is a separate, liquid savings balance earmarked for ${breedTitle} veterinary expenses and nothing else. Treat it as non-discretionary: a monthly auto-transfer of $40–$80 from the operating account into a dedicated sub-account. The mechanism matters more than the amount. Households that automate build the fund. Households that intend to save the leftover at month end rarely do.</p>
      <p>Size the fund to cover one significant event plus one ongoing chronic treatment. For most ${breedTitle}s, that is a target balance of $2,500–$4,000. Below $1,000, one emergency depletes the reserve; above $5,000, the opportunity cost of idle cash outweighs the insurance benefit. Keep it in a high-yield savings account to offset inflation drag.</p>`,
    `<p>The behaviour that makes a ${breedTitle} vet fund effective is replenishment after drawdown. Almost every household funds the reserve initially; relatively few top it back up after the first use. Schedule an automatic refill — for example, $100 a month until the target balance is restored — triggered whenever the balance drops below 70% of target.</p>
      <p>Pair the fund with insurance rather than treating them as alternatives. Insurance covers the long tail of large claims; the fund covers the deductible, co-insurance, and anything the policy excludes. Together they remove the financial stress dimension from unexpected veterinary events.</p>`,
    `<p>Building a vet fund for a ${breedTitle} is a discipline problem disguised as a savings problem. The savings math is simple: $60 per month for three years produces a $2,160 reserve, enough to absorb most non-catastrophic events. The discipline is harder: keeping the fund untouched during routine financial pressure, replenishing it after unavoidable drawdowns, and resisting the temptation to cancel the auto-transfer during lean months.</p>
      <p>The most reliable way to enforce the discipline is to place the fund in an account that is inconvenient to access — a separate institution, a different app login, no debit card. Friction on withdrawal dramatically increases the odds of the fund being available when it is actually needed.</p>`,
    `<p>A ${breedTitle} vet fund earns its place in the household finances by decoupling veterinary decisions from cash flow decisions. The best reason to build one is not the emergency itself; it is the absence of pressure during the emergency. Owners with a funded reserve choose treatment on medical grounds; owners without one routinely delay care, which compounds cost and reduces outcomes.</p>
      <p>Start the fund at any balance, even $200, and increment it. The psychological benefit of having any fund at all is larger than the small additional benefit of waiting until a full balance can be deposited.</p>`,
    `<p>Set the vet fund up once and let it work. Target $60 per month automated into a dedicated high-yield savings account. After twenty-four months, the balance typically sits around $1,500 including interest, which absorbs most one-off events for a ${breedTitle}. After forty-eight months, the balance approaches $3,200, a threshold at which the household effectively self-insures against non-catastrophic veterinary spend.</p>
      <p>Pair the fund with even an accident-only insurance policy for catastrophic coverage. The combined monthly cost is typically $80–$120, and the combined financial protection is stronger than either component alone.</p>`
  ];
  return variants[seed % variants.length];
}

function preventiveHealthScreening(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>Preventive screening for ${breedTitle} consists of an annual physical exam, annual fecal screening, annual heartworm or parasite screening as appropriate, and periodic baseline bloodwork. For adult ${breedTitle}s, baseline bloodwork every two to three years is reasonable; for seniors, annual or biannual bloodwork becomes the standard of care. The cumulative cost of preventive screening is trivial next to the emergency cost it prevents.</p>
      <p>The screening catches drift before it becomes symptomatic. Renal function, liver enzymes, and thyroid activity all track measurable trajectories over years, and a single bloodwork panel within normal range tells you less than a trend across multiple panels. Owners who maintain continuity with one veterinary practice build this trend data without intending to.</p>`,
    `<p>Screening decisions for ${breedTitle} should reflect the breed's specific risk profile rather than a generic protocol. Breeds with known cardiac predisposition benefit from earlier echocardiography; breeds prone to orthopedic conditions benefit from radiographic baselines; breeds with endocrine risk benefit from thyroid monitoring. Ask the veterinarian which screens are highest-yield for ${breedTitle} specifically, and allocate the screening budget accordingly.</p>`,
    `<p>Regular screening for a ${breedTitle} is the single highest-return investment in lifetime health. A $250 annual preventive visit catches conditions whose untreated versions cost $1,500–$8,000 to manage. The mathematics are dramatic and not subtle: preventive care pays back multiple times within most ownership lifetimes.</p>`,
    `<p>Preventive screening is boring and it is boring because it works. The ${breedTitle} that arrives for its annual visit, shows no change from prior baselines, and leaves with nothing more than a vaccine update or a refilled preventive prescription is the screening programme functioning correctly. The households that skip screenings for exactly this reason — "nothing happened last time" — are the ones that accumulate the conditions that could have been caught earlier.</p>`
  ];
  return variants[seed % variants.length];
}

function longTermHealthOutcomes(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>Long-term health outcomes for ${breedTitle} track four factors more than any others: weight management, dental maintenance, preventive medication adherence, and veterinary continuity. The first three are tangible, the fourth is often underestimated. Having the same veterinary practice follow the ${breedTitle} across years produces better outcomes because trends become visible and anomalies are caught against a personal baseline rather than a population one.</p>
      <p>A ${breedTitle} that stays near ideal weight, receives regular dental attention, maintains year-round parasite prevention, and sees the same veterinary practice annually has a materially better actuarial trajectory than a ${breedTitle} whose care is reactive and fragmented. The cumulative difference in lifetime veterinary cost can exceed $10,000.</p>`,
    `<p>Households that achieve the best long-term health outcomes for their ${breedTitle} do a small number of simple things consistently. They weigh food rather than scoop; they brush teeth or at least use dental chews; they keep a current vaccine and preventive medication record; they do not skip annual exams. None of those behaviours is exotic; the discipline to maintain them across a decade is what distinguishes the outcomes.</p>`,
    `<p>For long-term ${breedTitle} health, avoid the common failure mode of reactive care. A ${breedTitle} that visits the veterinarian only when something is wrong accumulates late diagnoses, urgent interventions, and compressed treatment timelines. A ${breedTitle} that visits on a preventive schedule accumulates early findings, elective interventions, and longer treatment horizons. The cost difference is real; the welfare difference is larger.</p>`,
    `<p>The outcome data on ${breedTitle} long-term health is consistent across breeds: preventive adherence, weight control, and early detection drive the most meaningful gains. Specific interventions — boutique supplements, alternative therapies, experimental diets — produce smaller and less predictable gains for most animals. Focus the health budget on the three high-return basics, and treat the rest as optional.</p>`
  ];
  return variants[seed % variants.length];
}

function healthCostPredictability(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>Cost predictability for ${breedTitle} health spending comes from structural choices rather than optimistic assumptions. A consistent wellness schedule smooths spend across the year; an insurance policy with a stable premium converts variable medical events into predictable monthly cost; a funded reserve absorbs the remaining variability without disturbing household cash flow.</p>
      <p>Households that want predictable cost also commit to a consistent veterinary practice, a consistent food brand, and a consistent preventive medication cadence. Each rotation introduces transition periods with elevated variability. Stability compounds into predictability.</p>`,
    `<p>Predictable ${breedTitle} health costs are mostly a matter of planning the calendar. A one-page annual calendar showing the wellness visit, vaccine boosters, dental cleaning, preventive medication refills, and insurance renewal transforms lumpy annual spend into twelve predictable monthly commitments. Share the calendar with anyone else responsible for the ${breedTitle} and the compliance rate improves further.</p>`,
    `<p>Factoring in the ${breedTitle}-specific health profile is the difference between a plausible budget and an accurate one. Every breed has a recognisable claim pattern in insurance and wellness data; that pattern should shape the reserve size, the insurance plan structure, and the preventive medication mix. A plan built on breed averages handles roughly 70% of outcomes; a plan built on ${breedTitle}-specific data handles closer to 90%.</p>`,
    `<p>Predictability rises with continuity. One veterinary practice, one insurance carrier, one food brand, one preventive medication protocol — the less churn in the ${breedTitle}'s care inputs, the easier it is to forecast health cost. Households that change vendors often pay more per transaction and carry more administrative overhead than the modest savings sometimes justify.</p>`
  ];
  return variants[seed % variants.length];
}

function specialistCareConsiderations(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>${breedTitle}-specific health conditions occasionally require specialist involvement — orthopaedic surgeons, cardiologists, ophthalmologists, dermatologists, or internal medicine specialists. Specialty consult fees typically run $150–$400 before any diagnostics, and advanced diagnostics such as echocardiography or MRI add $400–$2,500 per event. Insurance reimbursement for specialty care varies by policy structure; review the policy language before a specialty referral becomes urgent.</p>
      <p>The general practitioner is usually the right gatekeeper for specialty referrals. Emergency-room specialty consults are available but cost more and produce less continuity. Where possible, book specialty care through scheduled referrals to avoid the ER premium.</p>`,
    `<p>Specialist care for ${breedTitle} is usually episodic rather than ongoing, which means the cost lands as discrete events rather than a recurring line item. Budget for specialist care through the emergency reserve rather than the monthly operating budget. Typical lifetime specialist spend for a ${breedTitle} is one to three consultations plus any follow-up diagnostics or treatment, totalling $500–$4,000.</p>`,
    `<p>Access to specialist veterinary care varies by metro. Large cities usually offer a full range of specialists within reasonable travel; smaller cities may require travel of 60–180 minutes to reach particular specialties. Travel time does not change the clinical outcome but does affect scheduling logistics and should be factored into the response plan for any ${breedTitle} condition that could require specialty involvement.</p>`,
    `<p>The value of specialist care for ${breedTitle} is almost always highest when it is used early. A specialty consult at the first sign of a suspected cardiac, orthopaedic, or neurological issue produces better outcomes and lower total cost than a specialty consult after an emergency room admission. Delays compound.</p>`
  ];
  return variants[seed % variants.length];
}

// -------- first-time-owners: Active Owners / Training Resources orphans --------

function activeOwners(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>Active-lifestyle households tend to enjoy ${breedTitle} ownership more because the exercise commitment is built into the daily routine rather than being negotiated each day. If you already walk, run, hike, or cycle regularly, the ${breedTitle} fits into those rhythms and benefits from them. The inverse is also true: households without established exercise routines occasionally find the exercise commitment more burdensome than anticipated.</p>
      <p>The fit is not binary. Even active households should match activity type to ${breedTitle} physiology. Avoid sustained running on hard surfaces for young animals whose growth plates have not closed; avoid heat-intensive exercise for breeds prone to brachycephalic or heat-related issues; build endurance gradually rather than front-loading long sessions in the first weeks.</p>`,
    `<p>An active ${breedTitle} household delivers good outcomes because sustained, predictable exercise is harder to replicate with intermittent effort. A ${breedTitle} that walks two to three miles daily, gets a long outing twice a week, and has opportunities for structured play exhibits better behaviour, better weight maintenance, and lower veterinary complication rates than an identical ${breedTitle} in a sedentary household.</p>
      <p>Structure the exercise by intensity and recovery. Two moderate days, one high-intensity day, one recovery day across the week tends to produce a healthier animal than seven days of similar load.</p>`,
    `<p>For active owners, ${breedTitle} fits into existing routines with relatively little friction. Consider the specific activities: running needs a ${breedTitle} whose physiology supports sustained cardio; water sports need a breed with appropriate coat type and swim ability; trail hiking needs paw-protection habits and exposure to varied terrain during growth. Matching the activity mix to the breed's physical strengths produces a more durable partnership.</p>`,
    `<p>Active households should still build deliberate rest into the ${breedTitle}'s week. Constant exercise stimulation raises baseline arousal and, paradoxically, can produce a less calm animal at home. Two scheduled low-activity recovery days per week let the musculature recover, prevent repetitive-strain issues, and reinforce the home environment as a rest context rather than an activity context.</p>`
  ];
  return variants[seed % variants.length];
}

function trainingResources(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>First-time ${breedTitle} owners usually benefit from a structured training class rather than self-directed training. A six-to-eight-week group obedience class, led by a qualified trainer, delivers three things that online resources rarely match: supervised feedback on timing and mechanics, controlled social exposure to other dogs, and a peer cohort of owners who surface common issues faster than any individual household. The cost is typically $150–$350, and the return is reflected in every subsequent year of handling.</p>
      <p>Follow the initial class with at least one intermediate or skill-specific follow-up — scent work, trick training, rally obedience — to consolidate the foundation. Training that stops at basic obedience fades; training that includes at least one follow-up builds lasting handler skill.</p>`,
    `<p>Training resources for ${breedTitle} cluster into three useful categories: foundational obedience classes (for puppies and early-adult animals), behaviour-specific private training (for issues like recall, leash reactivity, or resource guarding), and ongoing enrichment training (trick work, scent work, structured play). Foundational training is essential; behaviour-specific training is issue-driven; enrichment training is lifestyle-driven.</p>
      <p>Budget $300–$600 in the first year for foundational work, $100–$400 per year thereafter for maintenance and enrichment. Training spend concentrated in year one produces outsized returns because it shapes habits before they become entrenched.</p>`,
    `<p>Use certified trainers — CCPDT, IAABC, or KPA credentials — rather than unqualified providers. Credentialed trainers use current, evidence-based methodology and avoid aversive techniques that can create behavioural issues. A ${breedTitle} trained with positive reinforcement techniques develops better handler engagement and lower reactivity than one trained with correction-based methods.</p>`,
    `<p>If classroom training is not practical, private in-home sessions with a qualified trainer deliver similar foundational outcomes at higher cost. Virtual training, while increasingly capable, works best as a supplement to in-person work rather than a replacement for it, because mechanical skills — leash handling, timing of rewards, reading body language — are learned more effectively under direct observation.</p>`
  ];
  return variants[seed % variants.length];
}

// -------- best-habitat-size: Small Living / Climate Control orphans --------

function smallLivingSpaces(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>${breedTitle}s adapt to small living spaces when the environment provides appropriate enrichment and outdoor access, not based on square footage alone. An apartment with consistent daily outdoor exercise, structured enrichment, and environmental control (temperature, noise, light) suits a ${breedTitle} better than a large suburban home without those inputs. The indoor footprint matters less than the programme that surrounds it.</p>
      <p>Practical considerations for small spaces: invest in noise insulation if the building carries outside noise, establish a dedicated rest area away from household traffic, and schedule enrichment to match the animal's arousal rhythm rather than the household's. Most failed small-space placements fail on programme rather than on space.</p>`,
    `<p>For ${breedTitle}s in small homes, organise the space around three zones: a rest zone (crate or bed, quiet, low traffic), an activity zone (feeding, toys, interactive play), and a transition zone (near the door for exits and returns). The functional separation reduces over-stimulation and gives the ${breedTitle} a predictable environment even when total square footage is limited.</p>`,
    `<p>Small-space ${breedTitle} care rewards disciplined daily routine. Fixed feeding times, fixed walk times, and fixed rest windows allow the animal to synchronise its rhythm with the household rather than constantly responding to stimuli. This is particularly important in apartment buildings with variable acoustic environments.</p>`,
    `<p>Vertical layout helps in small spaces. Cat trees, elevated perches, or climbing structures (depending on species) effectively multiply usable square footage by adding a third dimension to the habitat. For ${breedTitle}s where vertical use is appropriate, this is usually the highest-return investment in a small home.</p>`
  ];
  return variants[seed % variants.length];
}

function climateControl(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>Climate control matters more for ${breedTitle} welfare than most first-time owners expect. Temperature extremes outside the species- and breed-specific comfort range produce measurable welfare impacts — appetite suppression, reduced activity, increased respiratory effort — even before reaching medically concerning levels. Maintain indoor temperature within the breed's comfort band year-round.</p>
      <p>Humidity is equally important and less intuitive. Low humidity stresses respiratory systems and dries skin; high humidity impairs thermoregulation. Most ${breedTitle}s do well in the 40–60% relative humidity range, and seasonal humidifiers or dehumidifiers are worth the modest cost in climates that fall outside this band.</p>`,
    `<p>${breedTitle} welfare depends on stable climate rather than any particular temperature. Frequent large swings — an over-cooled room during the day, an over-warm room at night — stress thermoregulation more than a steady slightly-off temperature. Programmable thermostats with narrow set-point ranges deliver better outcomes than aggressive manual adjustments.</p>`,
    `<p>Outdoor climate considerations for ${breedTitle} depend on physiology. Coated breeds manage cold better than heat; short-coated and brachycephalic breeds manage heat poorly. Build the exercise schedule around the daily temperature profile: early-morning and late-evening walks in hot weather, midday walks in cold weather. Skip outdoor exercise entirely at temperature extremes and substitute indoor enrichment.</p>`,
    `<p>Climate-related risks for ${breedTitle} concentrate in the transition seasons. Spring and autumn produce the widest daily temperature swings and the highest incidence of climate-triggered respiratory and musculoskeletal complaints. Transition-season awareness — checking forecast before walks, adjusting activity intensity, monitoring water intake — pays back in reduced veterinary events.</p>`
  ];
  return variants[seed % variants.length];
}

// -------- breeds pages: various orphan stubs --------

function isBreedRightForYou(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const speciesContext = {
    fish: 'aquarium',
    'marine-fish': 'marine aquarium',
    reptile: 'enclosure',
    reptiles: 'enclosure',
    amphibian: 'vivarium',
    amphibians: 'vivarium',
    bird: 'aviary or home',
    birds: 'aviary or home',
    'small-animal': 'home',
    'small-animals': 'home',
    dog: 'household',
    dogs: 'household',
    cat: 'household',
    cats: 'household'
  };
  const context = speciesContext[species] || 'home';
  const variants = [
    `<p>The best way to evaluate whether a ${breedTitle} fits your ${context} is to match three factors: the animal's baseline care demand, your household's realistic capacity, and the environmental constraints of your space. Households that get this match wrong usually do so on one specific dimension — undersized space, undersupplied daily time, or undermatched experience level — rather than across the board. Identifying which dimension is the limiting factor lets you decide whether to adapt the household or choose a better-fit animal.</p>
      <p>A ${breedTitle} rewards households whose routines already include the care cadence the species requires. It becomes stressful for households that must reorganise their schedule to accommodate care. Evaluate honestly rather than optimistically before committing.</p>`,
    `<p>Fit between a ${breedTitle} and a household is usually decided by three questions: Can the environment be sustained at the required stability? Can the daily care cadence be maintained year-round, including during travel and busy periods? Is the household prepared for the typical lifespan and commitment the species requires? Two out of three rarely works; all three needs to be a clear yes.</p>`,
    `<p>${breedTitle} suitability depends on the specific balance of maintenance tolerance, handling interaction, and environmental complexity the household is prepared for. Low-maintenance species in well-set-up environments produce enjoyable ownership for most households. High-maintenance species with specific environmental requirements work well only for households genuinely engaged in that level of detail.</p>`,
    `<p>Evaluating a ${breedTitle} for your ${context} is less about enthusiasm and more about practical constraints. Consider the species' typical adult size, the space required for appropriate enrichment, the daily and weekly care tasks, and the cost profile over the animal's lifespan. Households that evaluate these honestly end up with sustainable, enjoyable placements; households that underestimate any dimension tend to rehome within the first year.</p>`
  ];
  return variants[seed % variants.length];
}

function backgroundShapesCare(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>Understanding the ${breedTitle}'s developmental origin pays off in small daily decisions. A species adapted to narrow temperature and humidity bands rewards careful environmental control; a species adapted to social groups rewards compatible tankmates or housemates; a species with specialised dietary evolution rewards targeted nutrition rather than generic formulations. Care plans that ignore origin tend to generate the chronic issues that care plans respecting origin avoid.</p>`,
    `<p>The ${breedTitle}'s background shapes two things that matter every day: what the animal needs to feel settled, and what stresses it unnecessarily. Settled behaviour — relaxed posture, consistent feeding, normal elimination, full use of enclosure space — tells you the daily environment is matched to the species' evolved expectations. Persistent unsettled behaviour almost always points to a specific environmental mismatch that can be diagnosed and corrected.</p>`,
    `<p>Care decisions for ${breedTitle} that reference the species' natural history consistently outperform decisions made from generic pet advice. Temperature gradients, humidity, lighting cycles, social structure, and dietary composition should all trace back to the environment the species evolved in, adjusted for captive conditions. This approach requires a small upfront investment in research and pays back throughout the animal's life.</p>`,
    `<p>The ${breedTitle}'s background provides the blueprint for its ideal care plan. Species that evolved in particular climates, habitat types, or social structures carry specific baseline requirements that do not change in captivity. Meeting those baselines is the difference between a ${breedTitle} that thrives and a ${breedTitle} that simply survives.</p>`
  ];
  return variants[seed % variants.length];
}

function keepCharacteristicsInMind(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>The traits that distinguish ${breedTitle} from other species or breeds are not trivia — they are the inputs for a personalised care plan. Size, activity rhythm, environmental sensitivity, social structure, and lifespan each map to specific daily, weekly, and annual decisions. A plan that ignores breed-specific traits produces a plan that fits the breed only by accident.</p>`,
    `<p>Match your ${breedTitle}'s care routine to its actual traits rather than generic species advice. An active animal needs more exercise than average; a reserved animal needs more quiet than average; a sensitive animal needs tighter environmental control than average. Calibrating to the specific animal takes a few weeks of observation and delivers better outcomes than any template can.</p>`,
    `<p>The work of knowing a ${breedTitle} well rewards patience. A first-week observation produces surface-level insight; a month of consistent observation produces a useful behavioural baseline; a year of observation produces a refined understanding of the individual animal's preferences, stress signals, and routines. Good care depends on crossing at least the first threshold and aiming for the third.</p>`,
    `<p>${breedTitle} traits define both the opportunities and the constraints of the relationship. Keep these traits in mind when planning the habitat, schedule, diet, and enrichment programme. A plan tuned to the actual animal always outperforms a plan copied from the web.</p>`
  ];
  return variants[seed % variants.length];
}

function detailsMatterPlanning(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>Day-to-day care, budget forecasts, and long-term health planning for ${breedTitle} all improve when they reference the breed's specific profile rather than generic pet advice. Small differences — an extra 20 minutes of daily enrichment, a slightly different feeding schedule, a more targeted preventive medication — accumulate into meaningfully better outcomes over the animal's lifespan.</p>`,
    `<p>Most owners underestimate how much breed-specific calibration affects long-term results. Feeding portions, exercise duration, grooming frequency, and environmental settings all respond better to breed-specific values than to generalised ones. Investing a few hours in breed-specific research produces years of more accurate care decisions.</p>`,
    `<p>The ${breedTitle} breed profile informs every major ownership decision: what to budget for, which veterinary interventions are most relevant, which enrichment types deliver the highest return, and which environmental factors require the most attention. Use the profile as a planning input, not as trivia.</p>`,
    `<p>Details that may seem minor — the exact weight range, the typical activity cadence, the species' seasonal rhythms — translate directly into the daily care plan. Responsible owners build their routines around these specifics rather than defaulting to generic pet-care templates, and the difference shows up in health outcomes over years.</p>`
  ];
  return variants[seed % variants.length];
}

function foundationNutritionExercise(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `<p>With the ${breedTitle} profile in view, each major care decision becomes clearer. Nutrition targets the breed's specific metabolism and activity level. Exercise matches the breed's baseline energy. Preventive medicine focuses on the breed's known risk categories. Enrichment reflects the breed's cognitive and social preferences. Generic advice would not hurt the animal, but targeted advice produces noticeably better outcomes across the lifespan.</p>`,
    `<p>A ${breedTitle}-specific care plan is not exotic; it is simply a standard plan with the ${breedTitle}-relevant values filled in. The effort required to personalise it is modest — a few hours of research, a conversation with the veterinarian, and a willingness to adjust the plan as the animal matures. The return is a plan that fits the animal rather than the average.</p>`,
    `<p>The foundation in place — understanding the ${breedTitle}'s physiology, temperament, environmental needs, and health profile — enables every subsequent decision to be more precise. Nutrition, exercise, enrichment, and preventive medicine all benefit from this baseline. Without it, owners tend to default to generic approaches that leave gains on the table.</p>`,
    `<p>With this foundation, the day-to-day decisions about ${breedTitle} care require less guesswork. Specific, breed-informed choices replace generic defaults, and the quality of the animal's life rises measurably without requiring more total effort from the owner.</p>`
  ];
  return variants[seed % variants.length];
}

module.exports = {
  transitioningDiet,
  weightManagement,
  seniorCareNotes,
  highEnergyEnrichment,
  socialEnrichment,
  longTermEnrichmentPlanning,
  buildingVetFund,
  preventiveHealthScreening,
  longTermHealthOutcomes,
  healthCostPredictability,
  specialistCareConsiderations,
  activeOwners,
  trainingResources,
  smallLivingSpaces,
  climateControl,
  isBreedRightForYou,
  backgroundShapesCare,
  keepCharacteristicsInMind,
  detailsMatterPlanning,
  foundationNutritionExercise
};
