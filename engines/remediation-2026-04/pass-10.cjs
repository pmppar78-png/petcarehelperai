// Pass 10: Break remaining 150-300-page fingerprints.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');

function hash(s) { return parseInt(crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 8), 16); }
function titleCase(s) { return String(s || '').replace(/\b\w/g, c => c.toUpperCase()).replace(/-/g, ' '); }
function breedFromPath(p) {
  const m = p.match(/\/commercial\/[^/]+\/([^/]+)\//) || p.match(/\/breeds\/[^/]+\/([^/]+?)(?:\.html)?$/);
  return m ? titleCase(m[1]) : 'pet';
}

// --- Focus your budget on essentials (301)
const FOCUS_BUDGET_V = [
  () => `Put the budget toward the essentials — correct heating, appropriate diet, enclosure quality — before optional accessories or aesthetics.`,
  () => `The budget earns its keep on fundamentals: heating, correct diet, enclosure quality. Non-essentials can wait until those are solid.`,
  () => `Spend first on the life-support basics (heating, diet, enclosure), and only then on the nice-to-have accessories.`,
  () => `Keep the budget focused on what the animal actually needs — heating, diet, enclosure — and treat decorative items as strictly optional.`,
  () => `Prioritise budget on core life-support: accurate heating, appropriate diet, and adequate enclosure. Cosmetic purchases can wait.`,
  () => `The dollars that matter go to the essentials — heating, diet, enclosure quality — not to the Instagram-friendly accessories.`,
  () => `Front-load the budget on fundamentals that determine health: heating, diet, and enclosure. Aesthetic items are strictly optional.`,
  () => `Core life-support items (heating, diet, enclosure quality) deserve the budget; accessories that don't meaningfully change welfare do not.`
];
const FOCUS_BUDGET_REGEX = /Focus your budget on getting the essentials right — proper heating, correct diet[^<.]*?\./g;

// --- Proactive senior management outperforms (288)
const PROACTIVE_SENIOR_V = [
  (breed) => `Managing senior ${breed} care proactively reliably outperforms reacting to problems as they arise — small, scheduled interventions prevent most emergency-scale interventions.`,
  (breed) => `A proactive senior ${breed} care plan consistently produces better outcomes than waiting for problems to surface.`,
  (breed) => `Scheduled, proactive senior ${breed} management catches issues early and beats a reactive model across almost every dimension that matters.`,
  (breed) => `For a senior ${breed}, structured proactive care — screenings, weight monitoring, pain assessments — produces materially better outcomes than reactive care.`,
  (breed) => `Senior ${breed}s do better on a proactive plan; reactive care tends to trail the problem and cost more to resolve.`,
  (breed) => `A structured proactive approach to senior ${breed} care outperforms a reactive one on both welfare and cost, usually by a wide margin.`,
  (breed) => `Proactive senior ${breed} care — planned screenings, intentional monitoring — catches the things that reactive care tends to miss until they become urgent.`,
  (breed) => `With a senior ${breed}, the proactive care plan usually saves money and welfare both; reactive care loses on both axes.`
];
const PROACTIVE_SENIOR_REGEX = /Proactive senior management outperforms reactive senior management by a wide margin[^<.]*?\./g;

// --- Selecting between these two species / breeds (285 + 249)
const SELECTING_V = [
  () => `Choosing between the two involves weighing hands-on daily care requirements, temperament fit, and the lifetime costs each animal produces.`,
  () => `The decision turns on three inputs: daily care load, temperament alignment with the household, and projected lifetime costs.`,
  () => `Compare both on daily care demands, temperament fit, and lifetime costs — the fourth factor, emotional preference, tends to answer itself after that.`,
  () => `Weigh the two on hands-on daily care, temperament match, and lifetime costs — the three dimensions that determine whether the choice fits.`,
  () => `A rigorous comparison covers daily care load, temperament fit, and lifetime costs before any aesthetic considerations.`,
  () => `Between these two, the useful comparison is daily care effort, temperament alignment, and lifetime costs — in that order of impact.`,
  () => `The side-by-side that matters covers hands-on care, temperament fit, and lifetime financial commitment.`,
  () => `Good decisions between the two involve honest assessments of daily care, temperament, and lifetime economics.`
];
const SELECTING_SPECIES_REGEX = /Selecting between these two species requires weighing hands-on care requirements[^<.]*?\./g;
const SELECTING_BREEDS_REGEX = /Selecting between these two breeds requires weighing hands-on care requirements[^<.]*?\./g;

// --- If insurance is already in force (284)
const INSURANCE_IN_FORCE_V = [
  () => `If insurance is already in place, keep it. Dropping senior coverage to save money usually costs more later than it saves now.`,
  () => `An existing policy is worth keeping; the savings from dropping senior coverage rarely survive a single meaningful claim.`,
  () => `Keep active senior policies active. The cost of dropping one almost always exceeds the savings once a real claim arrives.`,
  () => `Don't drop senior insurance to save money — the typical first major claim retires the savings and then some.`,
  () => `If a senior policy is already in force, retaining it is the high-probability correct move; dropping it is the high-variance one.`,
  () => `Existing senior coverage should stay in force unless the policy is genuinely broken — the math rarely favours cancelling.`,
  () => `Keeping the existing senior policy is usually the right decision; the savings from cancelling almost never cover the next claim.`,
  () => `Active senior insurance is worth more than it looks on the monthly line — don't cancel it to trim the budget.`
];
const INSURANCE_IN_FORCE_REGEX = /If insurance is already in force, keep it\. Dropping senior coverage[^<.]*?\./g;

// --- Consistent environmental monitoring (274)
const ENV_MONITORING_V = [
  (breed) => `Steady environmental monitoring and proactive husbandry are the backbone of healthy ${breed} care — the daily work prevents most of the interventions you'd otherwise need.`,
  (breed) => `Consistent environmental tracking and forward-leaning husbandry produce the outcomes that reactive care usually cannot.`,
  (breed) => `Monitoring the environment with discipline and handling husbandry proactively is what keeps a ${breed} out of problems rather than treating them.`,
  (breed) => `Reliable environmental monitoring and disciplined husbandry are the foundation; without them, care plans drift into reactive mode.`,
  (breed) => `${breed} welfare lives or dies on consistent environmental monitoring and attentive, proactive husbandry.`,
  (breed) => `Environmental monitoring and proactive husbandry, done consistently, are the cheapest way to prevent the problems most ${breed}s develop.`,
  (breed) => `A disciplined monitoring and husbandry routine for a ${breed} is the backbone of good outcomes; nothing else compensates for skipping it.`,
  (breed) => `For a ${breed}, consistent environmental monitoring and a proactive husbandry rhythm are foundational — every other care layer depends on them.`
];
const ENV_MONITORING_REGEX = /Consistent environmental monitoring and proactive husbandry are the foundation[^<.]*?\./g;

// --- Review the insurance policy text (269)
const POLICY_TEXT_V = [
  () => `At this stage, read the policy language carefully — particularly around billing, pre-existing conditions, and chronic-care exclusions.`,
  () => `Now is the right time to actually read the policy text: billing terms, pre-existing clauses, and long-term condition handling are where surprises live.`,
  () => `Review the fine print at this point — billing, pre-existing conditions, and chronic-care exclusions are the clauses that typically matter at claim time.`,
  () => `Get into the policy text: billing mechanics, pre-existing condition rules, and chronic-care exclusions determine what the policy is actually worth.`,
  () => `At this stage, a careful read of the policy pays off — the clauses on billing and pre-existing conditions tend to define real-world usefulness.`,
  () => `Read the policy closely for its billing approach, pre-existing condition handling, and chronic-care exclusions — that is where policy value is won or lost.`,
  () => `Spend twenty minutes on the policy text, focusing on billing flow, pre-existing condition language, and chronic-care exclusions.`,
  () => `The policy's fine print — billing, pre-existing conditions, chronic-care exclusions — is what determines whether it performs during a claim.`
];
const POLICY_TEXT_REGEX = /Review the insurance policy text at this stage — specifically the wording on[^<.]*?\./g;

// --- Temperature, humidity, and cleanliness (248)
const TEMP_HUM_CLEAN_V = [
  () => `Temperature, humidity, and cleanliness function as a system — tuning one without accounting for the others typically produces new problems rather than solutions.`,
  () => `The three — temperature, humidity, and cleanliness — interact. Adjusting one in isolation usually destabilises the other two.`,
  () => `Treat temperature, humidity, and cleanliness as a coupled system; changes to any one propagate through the other two.`,
  () => `These three parameters — temperature, humidity, cleanliness — are coupled, and adjusting one in isolation is a common source of downstream problems.`,
  () => `Temperature, humidity, and cleanliness work as a three-way system; isolated tweaks rarely produce stable results.`,
  () => `Temperature, humidity, and cleanliness are linked; stabilising one usually requires attention to the other two in the same breath.`,
  () => `The environmental trio — temperature, humidity, cleanliness — is interdependent; changes to one should be thought through across all three.`,
  () => `Adjusting temperature, humidity, or cleanliness independently rarely holds; the three stabilise (or destabilise) together.`
];
const TEMP_HUM_CLEAN_REGEX = /Temperature, humidity, and cleanliness work together — adjusting one without the[^<.]*?\./g;

// --- If this is your first time owning a dog (226)
const FIRST_DOG_V = [
  () => `For first-time dog owners, the less demanding of the two breeds is generally the right starting point — it leaves room for the inevitable learning curve.`,
  () => `First-time dog ownership goes more smoothly with the breed that demands less of a new owner; room for mistakes is part of the real value.`,
  () => `If this is a first dog, favour the less demanding breed — the learning curve is real, and margin for error matters.`,
  () => `New dog owners usually do better with the lower-demand breed; the margin for learning errors is what makes the difference.`,
  () => `For a first dog, the less demanding option gives the new owner space to build handling competence without punishing early mistakes.`,
  () => `First-time dog ownership is easier with the lower-demand breed — the learning curve is real and the margin matters.`,
  () => `If this is the first dog, lean toward the breed with the gentler demands; experience comes faster when early missteps cost less.`,
  () => `A first dog is best with the less demanding of the two options; the first months are steep even on the easier breed.`
];
const FIRST_DOG_REGEX = /If this is your first time owning a dog, lean toward the breed that requires less[^<.]*?\./g;

// --- Practical experience ... / Real-world results ... (188/187)
const PRACTICAL_EXP_V = [
  () => `Your own experience with your animal will quickly show which parts of this plan deserve the most attention and which can stay lightweight.`,
  () => `A few months of real ownership will clarify which items here matter most for your specific household and which are largely ornamental.`,
  () => `Real-world use of this plan surfaces the parts that actually matter for your household and the parts you can de-prioritise.`,
  () => `Practical experience with the animal tells you, faster than any guide, which items to prioritise and which to quietly drop.`,
  () => `Lived use of the plan will tell you which pieces matter for your situation and which do not — adjust accordingly.`,
  () => `Your own data — weeks of watching your animal under this plan — is ultimately what tells you where to spend attention.`,
  () => `Day-to-day use of the plan sorts the genuinely important items from the merely theoretical ones faster than reading more guides does.`,
  () => `After a few weeks, the plan's critical items will become obvious from your own observation; trust that signal over any generic ordering.`
];
const PRACTICAL_EXP_REGEX = /Practical experience with your own situation will reveal which aspects deserve[^<.]*?\./g;

const REAL_WORLD_V = [
  () => `Results in the real world are produced by consistency and attention to your particular situation — not by any single recommendation in isolation.`,
  () => `What actually matters in practice is steady execution and attention to your specific circumstances; isolated tips do little without that.`,
  () => `Real results come from consistency and situational attention, not from any single recommendation applied in isolation.`,
  () => `Outcomes follow consistency and close attention to the animal in front of you — not any individual rule in this document.`,
  () => `The difference between a plan that works and one that doesn't is usually consistency and situational judgement, not rule selection.`,
  () => `Consistent execution and attention to your animal's specifics are what produce the outcomes you want — no single item on this page is load-bearing alone.`,
  () => `Real-world outcomes trace back to consistency and attention to situational detail more than to any specific recommendation here.`,
  () => `It is consistency — not any one tip — that produces results; pair that with attention to your animal's particulars and the plan works.`
];
const REAL_WORLD_REGEX = /Real-world results depend on consistency and attention to your individual situation[^<.]*?\./g;

// --- Focus on the factors most relevant... (180) / The specifics here vary... (175)
const FACTORS_RELEVANT_V = [
  () => `Focus on the items most relevant to your household — not every recommendation applies equally to every animal or every owner.`,
  () => `Prioritise the items most applicable to your situation; applying everything uniformly is rarely the best use of attention.`,
  () => `Not every recommendation carries equal weight for every household — pick the items that apply to your specifics and lean into those.`,
  () => `Concentrate effort on the factors that match your situation; recommendations that don't apply can be skipped without cost.`,
  () => `Give attention to the items that fit your household's actual profile; applying everything on the page equally is inefficient.`,
  () => `Weight attention toward the factors that actually affect your setup; uniformly applying every recommendation is rarely the best use of time.`,
  () => `The best returns come from focusing on items that match your household's real constraints and setting the rest aside.`,
  () => `Work the items that fit your situation rather than treating every recommendation on the page as equally load-bearing.`
];
const FACTORS_RELEVANT_REGEX = /Focus on the factors most relevant to your circumstances\. Not every recommendation[^<.]*?\./g;

const SPECIFICS_VARY_V = [
  () => `The details on this page vary by household, so use the structure as orientation rather than prescription.`,
  () => `Specifics here shift from household to household — treat the structure as a map, not a rulebook.`,
  () => `Since specifics vary meaningfully with circumstances, let the structure guide you and adjust the details to your situation.`,
  () => `These specifics vary case by case; use the framework to orient and adapt the details from there.`,
  () => `Details depend on your household's situation; the outline is the durable part, the specifics are adjustable.`,
  () => `Because specifics differ by circumstance, use the framework as a starting point and tune from there.`,
  () => `The details will vary for your household; the structure is portable and the specifics are meant to be adjusted.`,
  () => `Specifics shift with your circumstances — treat the structural guidance here as the durable layer, the details as adjustable.`
];
const SPECIFICS_VARY_REGEX = /The specifics here vary based on individual circumstances, so use these guidelines[^<.]*?\./g;

// --- Portion control / Structure the exercise / Structuring enrichment / Prioritizing habitat
const PORTION_CONTROL_V = [
  (breed) => `Portion control is mechanically simple but needs consistency — start with the recommended range and adjust against weight trend over 4-8 weeks.`,
  (breed) => `For a ${breed}, the mechanics of portion control are easy; the hard part is doing it the same way every day.`,
  (breed) => `Portion control works when it is consistent — begin at the recommended range and calibrate against your ${breed}'s weight trajectory.`,
  (breed) => `Start portions at the recommended range and adjust every few weeks against your ${breed}'s body condition and weight trend.`,
  (breed) => `The ${breed}'s portion plan is simple in principle — use recommended starting ranges and iterate against the scale, not guess work.`,
  (breed) => `Daily portion consistency matters more than portion perfection for a ${breed} — pick a range, measure, adjust to the trend.`,
  (breed) => `Measure portions, track weight, adjust every 2-4 weeks — portion control for a ${breed} is mostly about not skipping any of those steps.`,
  (breed) => `Start at the recommended portion range for your ${breed}, then adjust only in response to weight and condition data.`
];
const PORTION_CONTROL_REGEX = /Portion control is straightforward but requires consistency\. Start with the recommended[^<.]*?\./g;

const STRUCTURE_EXERCISE_V = [
  (breed) => `Structure exercise around intensity and recovery — two moderate sessions, one high-intensity, and a rest day keeps a ${breed} steady without overtraining.`,
  (breed) => `Think of the week as a structured cycle: moderate, moderate, high, recovery — works for most healthy adult ${breed}s.`,
  (breed) => `Build the exercise week around intensity cycling: a couple of moderate days, one harder day, and planned recovery for your ${breed}.`,
  (breed) => `For a ${breed}, cycling exercise by intensity with scheduled recovery produces steadier outcomes than a flat daily routine.`,
  (breed) => `Programme the week for a ${breed}: two moderate-intensity days, one higher-intensity, one recovery — calibrated to the animal's actual fitness.`,
  (breed) => `Exercise structure matters as much as volume for a ${breed}; mix moderate and high-intensity days with intentional recovery.`,
  (breed) => `A useful rhythm for a ${breed}: moderate days, a higher-intensity session, and a planned recovery day — adjust to the animal's actual fitness.`,
  (breed) => `Exercise benefits for a ${breed} compound when intensity and recovery are both structured; flat daily routines underperform cycled ones.`
];
const STRUCTURE_EXERCISE_REGEX = /Structure the exercise by intensity and recovery\. Two moderate days[^<.]*?\./g;

const STRUCTURE_ENRICHMENT_V = [
  (breed) => `A weekly enrichment calendar keeps a ${breed} stimulated without overloading any single day — the consistency is where the benefit lives.`,
  (breed) => `Slotting enrichment into a weekly schedule produces steadier cognitive load for a ${breed} than ad-hoc sessions do.`,
  (breed) => `Planned weekly enrichment for a ${breed} beats reactive enrichment on both cognitive benefit and household sanity.`,
  (breed) => `A structured enrichment week for a ${breed} distributes cognitive load evenly and prevents the spikes that come with impromptu sessions.`,
  (breed) => `Lay out the enrichment week in advance for a ${breed}; predictable stimulation patterns reduce behavioural variance.`,
  (breed) => `Weekly planning of enrichment sessions for a ${breed} produces the consistency that ad-hoc approaches usually miss.`,
  (breed) => `A written weekly enrichment schedule is the single cheapest intervention for a ${breed} with behavioural restlessness.`,
  (breed) => `Scheduling enrichment for a ${breed} — rather than improvising it — produces consistently better behavioural outcomes.`
];
const STRUCTURE_ENRICHMENT_REGEX = /Structuring enrichment into a weekly schedule ensures consistent stimulation[^<.]*?\./g;

const PRIORITIZE_HABITAT_V = [
  (breed) => `Treating habitat stability as the first priority — over reactive fixes — usually produces the largest welfare gain for a ${breed}.`,
  (breed) => `Habitat stability beats habitat firefighting; for a ${breed}, the steadier the setup, the fewer interventions are needed.`,
  (breed) => `Stable habitat first, reactive care second — the order matters and it favours the ${breed} substantially.`,
  (breed) => `Most welfare wins for a ${breed} come from holding the habitat steady, not from reacting after it drifts.`,
  (breed) => `A stable habitat does more for a ${breed}'s welfare than a reactive care routine; pick stability first.`,
  (breed) => `Habitat stability is the cheapest welfare lever for a ${breed}; reactive care is the expensive one.`,
  (breed) => `The biggest welfare return for a ${breed} comes from keeping the habitat consistently stable rather than reacting after parameters drift.`,
  (breed) => `For a ${breed}, investing in habitat stability reliably beats investing in response capacity for the problems that unstable habitats produce.`
];
const PRIORITIZE_HABITAT_REGEX = /Prioritizing habitat stability over reactive care makes the biggest difference[^<.]*?\./g;

// --- Quality of care trumps / This is one of the topics / Paying attention to the small signals
const QUALITY_TRUMPS_V = [
  () => `Quality of care consistently beats quantity of equipment; the fundamentals done well matter more than the shelf of gadgets.`,
  () => `Care quality outperforms gear volume; a few basics handled attentively beat a garage of specialist equipment.`,
  () => `Outcomes follow care quality, not equipment count — done-well basics outrank an expensive setup almost every time.`,
  () => `What the animal needs is quality of attention; no amount of equipment substitutes for that.`,
  () => `The basics done well do more than the fanciest gear; quality of care is the dominant factor.`,
  () => `Equipment is a supporting cast; care quality is the lead role, and outcomes follow accordingly.`,
  () => `Invest in the quality of care first and equipment second — the ratio tends to produce the best results.`,
  () => `A well-cared-for animal in a simple setup outperforms a poorly-cared-for animal in a premium one, reliably.`
];
const QUALITY_TRUMPS_REGEX = /Quality of care trumps quantity of equipment\. The basics done well matter[^<.]*?\./g;

const TOPICS_FEW_MINUTES_V = [
  (breed) => `This is one of those topics where a few minutes of learning genuinely changes how you interact with your ${breed} every day afterwards.`,
  (breed) => `Invest a short window of attention on this topic — it disproportionately changes your day-to-day with the ${breed}.`,
  (breed) => `Few ${breed} care topics compound as well as this one — a small initial investment in understanding pays daily.`,
  (breed) => `Time spent understanding this topic is one of the highest-leverage investments a ${breed} owner can make.`,
  (breed) => `This is a high-leverage topic for ${breed} owners; a short period of focused learning permanently changes daily decisions.`,
  (breed) => `Small effort, lasting payoff: understanding this topic well changes how you handle your ${breed} for as long as the animal is with you.`,
  (breed) => `A focused thirty minutes on this topic measurably improves daily ${breed} care for years afterwards.`,
  (breed) => `The leverage on this topic is unusually high for ${breed} owners — a short learning investment yields persistent gains.`
];
const TOPICS_FEW_MINUTES_REGEX = /This is one of the topics where a few minutes of learning changes how you interact[^<.]*?\./g;

const SMALL_SIGNALS_V = [
  (breed) => `Noticing small signals from your ${breed} usually matters more than following a rigid protocol to the letter.`,
  (breed) => `Attention to the small behavioural signals your ${breed} gives you beats strict protocol adherence most of the time.`,
  (breed) => `Reading the subtle feedback from your ${breed} — appetite, posture, mood — reliably outperforms rigid rule-following.`,
  (breed) => `The ${breed} will signal what's working and what isn't; those signals beat written protocol in most real situations.`,
  (breed) => `A ${breed}'s small daily signals — eaten portions, energy level, coat — are the primary feedback loop. Use it over any rigid rule.`,
  (breed) => `Rigid protocol adherence loses to attentive observation of your ${breed}'s small daily signals almost every time.`,
  (breed) => `Reading your ${breed}'s small signals closely usually produces better decisions than following any single protocol exactly.`,
  (breed) => `Pay attention to the small feedback signals — appetite, energy, coat, posture — rather than to the letter of any protocol.`
];
const SMALL_SIGNALS_REGEX = /Paying attention to the small signals usually matters more than following a rigid[^<.]*?\./g;

// --- Follow the initial class (151) / Re-weigh every two weeks (147) / Pair the formulation (154) / Calibrate social (154)
const FOLLOW_INITIAL_CLASS_V = [
  () => `Follow the initial class with at least one intermediate or skill-specific follow-up — skills fade quickly without reinforcement.`,
  () => `Plan a follow-on class after the initial one; first-class skills erode without a structured second exposure.`,
  () => `A single class rarely sticks — book an intermediate or topic-specific follow-up to lock the skills in.`,
  () => `Initial classes teach the basics; at least one follow-up class is what makes those basics durable in practice.`,
  () => `Add a second class — intermediate or skill-specific — to the training plan. First-class skills fade without reinforcement.`,
  () => `Treat the first class as a foundation, not the end of training; a follow-up course is usually what makes the skills stick.`,
  () => `First classes are necessary but usually insufficient; schedule a follow-up class to keep the skills live.`,
  () => `Initial training benefits from a structured follow-up class; without one, skill retention drops noticeably.`
];
const FOLLOW_INITIAL_CLASS_REGEX = /Follow the initial class with at least one intermediate or skill-specific follow-up[^<.]*?\./g;

const RE_WEIGH_V = [
  () => `Re-weigh every 2 weeks during active weight change, monthly once stable. Adjust portions against the trend, not individual readings.`,
  () => `Weigh-ins every 2 weeks during active loss or gain; monthly once steady. Always adjust against the trend rather than spot readings.`,
  () => `Run scale checks every 2 weeks when weight is moving, monthly when it isn't — adjust portions to the weekly trend, not point values.`,
  () => `Fortnightly weigh-ins during active weight management, monthly during maintenance. Let trend data drive portion adjustments.`,
  () => `Scale every 2 weeks during change, monthly during steady-state. Use the moving average, not single readings, to calibrate portions.`,
  () => `Weigh twice a month during transitions and once a month during maintenance; adjust food against the 4-week trend.`,
  () => `Re-weigh at a 2-week cadence during any portion change, then monthly once the animal is holding a target weight.`,
  () => `Bi-weekly weigh-ins during any weight intervention, monthly during stable periods — trend rather than spot values drives portion decisions.`
];
const RE_WEIGH_REGEX = /Re-weigh every two weeks during active loss, monthly during maintenance[^<.]*?\./g;

const PAIR_FORMULATION_V = [
  (breed) => `Match the formulation with a portion calculated against the ${breed}'s target weight, not the current weight — that's how weight drift gets corrected.`,
  (breed) => `Calculate portions for a ${breed} against target weight, not current weight; this is the mechanism that closes the weight gap over time.`,
  (breed) => `Portion for the target weight, not the current weight — that's the lever that moves a ${breed}'s weight in the right direction.`,
  (breed) => `For a ${breed}, portion against target weight, not where the animal is today; the arithmetic does the corrective work over weeks.`,
  (breed) => `Target-weight portioning (not current-weight) is how a ${breed}'s weight gets adjusted; the diet math does the work if the formulation supports it.`,
  (breed) => `Choose portion size based on the ${breed}'s goal weight and formulation specs, not the weight on the scale today.`,
  (breed) => `Portions should be computed from target weight, not current weight — the right formulation paired with the right target does most of the job.`,
  (breed) => `For a ${breed} on a weight plan, pair the chosen formulation with portions calibrated to target weight, not present weight.`
];
const PAIR_FORMULATION_REGEX = /Pair the formulation with a portion calculated against target weight rather[^<.]*?\./g;

const CALIBRATE_SOCIAL_V = [
  (breed) => `Calibrate social exposure to the specific ${breed} in front of you, not to the breed average — individual temperament variance is larger than breed-level guidance tends to suggest.`,
  (breed) => `Social exposure should track the individual ${breed}'s tolerance, not the breed averages; individual variance is meaningful.`,
  (breed) => `Tune social exposure to the ${breed} as an individual, not to breed-level expectations; the animal will tell you its ceiling faster than any profile will.`,
  (breed) => `Individual ${breed}s vary significantly in social tolerance — calibrate against the animal in the house, not the breed in the abstract.`,
  (breed) => `Match social exposure to your specific ${breed}'s feedback, not to breed-level descriptions — variance within a breed is substantial.`,
  (breed) => `Let the individual ${breed}'s signals, not breed averages, set the ceiling on social exposure.`,
  (breed) => `For a ${breed}, the right social exposure curve is the one that matches the individual animal's observed tolerance — not a breed-level number.`,
  (breed) => `Social-exposure limits for a ${breed} come from the animal, not the breed profile; match the plan to observed behaviour.`
];
const CALIBRATE_SOCIAL_REGEX = /Calibrate social exposure to the individual animal rather than to the breed average[^<.]*?\./g;

// --- General principles but specifics vary (153)
const GEN_PRINCIPLES_V = [
  () => `General principles apply broadly, but the details that matter most are a function of your specific household and your specific animal.`,
  () => `Broad principles are portable; the specific details that matter most depend on your household and your animal.`,
  () => `Generalities travel; specifics do not — translate the portable principles into your household's particulars.`,
  () => `General principles offer structure, but your household and animal determine which specifics actually matter.`,
  () => `Broad guidance works at the structural level; the particulars need to be calibrated to your situation.`,
  () => `Principles apply widely; specifics are household-dependent and should be adjusted accordingly.`,
  () => `The broad principles carry; the specifics that matter are always local to your household and animal.`,
  () => `General principles are useful anchors, but the particulars that move outcomes are specific to your household.`
];
const GEN_PRINCIPLES_REGEX = /While general principles apply broadly, the details that matter most depend[^<.]*?\./g;

// --- Treating the habitat as an interconnected (154)
const INTERCONNECTED_V = [
  () => `Treat the habitat as an interconnected system, not a list of separate line items — dimensions drive each other.`,
  () => `The habitat works as a coupled system; treating it as a checklist of independent items misses the interactions that actually matter.`,
  () => `Think of the habitat as a network of interdependent parameters rather than a set of isolated requirements.`,
  () => `Habitat parameters interact; handling them as a connected system produces better outcomes than treating them as a linear checklist.`,
  () => `An interconnected-systems view of the habitat beats a checklist view — the parameters move each other.`,
  () => `The habitat is a web, not a list — every adjustment propagates, and treating it that way prevents a lot of trial-and-error.`,
  () => `Stable habitats come from treating the parameters as an interacting system rather than a set of independent to-dos.`,
  () => `Habitat parameters are connected; a systems view produces steadier outcomes than an item-by-item approach.`
];
const INTERCONNECTED_REGEX = /Treating the habitat as an interconnected system, rather than a list of separate[^<.]*?\./g;

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === '.netlify' || name === '.claude' || name === 'engines') continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (st.isFile() && p.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const PATTERNS = [
  { key: 'focusBudget', regex: FOCUS_BUDGET_REGEX, variants: FOCUS_BUDGET_V, needsBreed: false },
  { key: 'proactiveSenior', regex: PROACTIVE_SENIOR_REGEX, variants: PROACTIVE_SENIOR_V, needsBreed: true },
  { key: 'selectingSpecies', regex: SELECTING_SPECIES_REGEX, variants: SELECTING_V, needsBreed: false },
  { key: 'selectingBreeds', regex: SELECTING_BREEDS_REGEX, variants: SELECTING_V, needsBreed: false },
  { key: 'insuranceInForce', regex: INSURANCE_IN_FORCE_REGEX, variants: INSURANCE_IN_FORCE_V, needsBreed: false },
  { key: 'envMonitoring', regex: ENV_MONITORING_REGEX, variants: ENV_MONITORING_V, needsBreed: true },
  { key: 'policyText', regex: POLICY_TEXT_REGEX, variants: POLICY_TEXT_V, needsBreed: false },
  { key: 'tempHumClean', regex: TEMP_HUM_CLEAN_REGEX, variants: TEMP_HUM_CLEAN_V, needsBreed: false },
  { key: 'firstDog', regex: FIRST_DOG_REGEX, variants: FIRST_DOG_V, needsBreed: false },
  { key: 'practicalExp', regex: PRACTICAL_EXP_REGEX, variants: PRACTICAL_EXP_V, needsBreed: false },
  { key: 'realWorld', regex: REAL_WORLD_REGEX, variants: REAL_WORLD_V, needsBreed: false },
  { key: 'factorsRelevant', regex: FACTORS_RELEVANT_REGEX, variants: FACTORS_RELEVANT_V, needsBreed: false },
  { key: 'specificsVary', regex: SPECIFICS_VARY_REGEX, variants: SPECIFICS_VARY_V, needsBreed: false },
  { key: 'portionControl', regex: PORTION_CONTROL_REGEX, variants: PORTION_CONTROL_V, needsBreed: true },
  { key: 'structureExercise', regex: STRUCTURE_EXERCISE_REGEX, variants: STRUCTURE_EXERCISE_V, needsBreed: true },
  { key: 'structureEnrichment', regex: STRUCTURE_ENRICHMENT_REGEX, variants: STRUCTURE_ENRICHMENT_V, needsBreed: true },
  { key: 'prioritizeHabitat', regex: PRIORITIZE_HABITAT_REGEX, variants: PRIORITIZE_HABITAT_V, needsBreed: true },
  { key: 'qualityTrumps', regex: QUALITY_TRUMPS_REGEX, variants: QUALITY_TRUMPS_V, needsBreed: false },
  { key: 'topicsFewMin', regex: TOPICS_FEW_MINUTES_REGEX, variants: TOPICS_FEW_MINUTES_V, needsBreed: true },
  { key: 'smallSignals', regex: SMALL_SIGNALS_REGEX, variants: SMALL_SIGNALS_V, needsBreed: true },
  { key: 'followClass', regex: FOLLOW_INITIAL_CLASS_REGEX, variants: FOLLOW_INITIAL_CLASS_V, needsBreed: false },
  { key: 'reWeigh', regex: RE_WEIGH_REGEX, variants: RE_WEIGH_V, needsBreed: false },
  { key: 'pairFormulation', regex: PAIR_FORMULATION_REGEX, variants: PAIR_FORMULATION_V, needsBreed: true },
  { key: 'calibrateSocial', regex: CALIBRATE_SOCIAL_REGEX, variants: CALIBRATE_SOCIAL_V, needsBreed: true },
  { key: 'genPrinciples', regex: GEN_PRINCIPLES_REGEX, variants: GEN_PRINCIPLES_V, needsBreed: false },
  { key: 'interconnected', regex: INTERCONNECTED_REGEX, variants: INTERCONNECTED_V, needsBreed: false }
];

function main() {
  const files = walk(ROOT);
  console.log(`Pass 10: scanning ${files.length} files...`);
  let filesModified = 0;
  const byKey = {};
  let total = 0;
  let i = 0;
  for (const f of files) {
    i++;
    if (i % 1500 === 0) console.log(`  ... ${i}/${files.length}, modified ${filesModified}`);
    let html = fs.readFileSync(f, 'utf8');
    const orig = html;
    const breed = breedFromPath(f);
    const baseSeed = hash(f + ':p10');

    for (let pi = 0; pi < PATTERNS.length; pi++) {
      const p = PATTERNS[pi];
      let count = 0;
      html = html.replace(p.regex, () => {
        count++;
        const v = p.variants[(baseSeed + pi * 29 + count) % p.variants.length];
        return p.needsBreed ? v(breed) : v();
      });
      byKey[p.key] = (byKey[p.key] || 0) + count;
      total += count;
    }

    if (html !== orig) { fs.writeFileSync(f, html); filesModified++; }
  }
  console.log('\n=== PASS 10 COMPLETE ===');
  console.log(JSON.stringify({ filesScanned: files.length, filesModified, replacements: total, byKey }, null, 2));
}

main();
