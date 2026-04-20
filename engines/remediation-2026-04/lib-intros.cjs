// Intro variant banks and common recurring-phrase replacements

const { titleCase } = require('./lib-variants.cjs');

// Replace the heavily repeated veterinarian intro sentence(s) with diversified variants.

function introFineTuneRecommendations(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `Run the figures below against the current health status and life stage of your ${breedTitle}, and confirm any medication-sensitive decisions with the veterinarian who actually sees the animal.`,
    `Treat these numbers as the starting point for a conversation with your vet about your ${breedTitle}'s weight, age, and activity level — not as a universal answer.`,
    `Calibrate anything on this page against your specific ${breedTitle}: weight, activity level, health history, and any current medications all shift the defaults in meaningful ways.`,
    `Before acting on any specific recommendation, cross-check it against your ${breedTitle}'s known conditions and medications — your vet is the right person to adjust the plan.`,
    `Use what follows as a planning baseline, then adjust for your ${breedTitle}'s current weight, life stage, and any underlying conditions with input from your regular veterinary practice.`,
    `Fine-tune any protocol below against your ${breedTitle}'s observed behaviour, weight trajectory, and veterinary guidance rather than adopting it verbatim.`,
    `The guidance below targets a healthy adult ${breedTitle}; adjust for puppies, seniors, or animals with existing conditions in consultation with your veterinarian.`,
    `Compare these ranges against your ${breedTitle}'s actual profile — body condition score, activity rhythm, and health history all matter — rather than applying them as a universal template.`,
    `Use the structure here to brief your veterinarian efficiently, then let them personalise the plan to your ${breedTitle}'s specifics.`,
    `The ${breedTitle} figures below are averages; your animal is not an average, and your vet is the right partner for translating ranges into a specific plan.`,
    `Read this as a pre-exam briefing for yourself, then confirm the details with the veterinarian who manages your ${breedTitle}'s care.`,
    `Start with these defaults, then layer in your ${breedTitle}'s individual health profile with your vet's input before making any medication or diet commitments.`
  ];
  return variants[seed % variants.length];
}

function introCheckInWithVet(breed, species, seed) {
  const breedTitle = titleCase(breed);
  const variants = [
    `Before changing your ${breedTitle}'s diet in any material way, a brief call with your vet typically surfaces interactions or considerations a web guide cannot reach.`,
    `Loop your veterinarian in before any significant diet adjustment for your ${breedTitle} — they hold the context that makes the change safe.`,
    `A short veterinary consultation ahead of a diet change gives your ${breedTitle}'s plan a personalised layer that generic advice cannot provide.`,
    `When adjusting your ${breedTitle}'s feeding plan, a quick check-in with your vet is the simplest way to confirm the change fits the animal's current health profile.`,
    `Significant diet changes for a ${breedTitle} benefit from a brief vet conversation — especially if there are existing medications or chronic conditions in play.`,
    `Consider a preliminary vet call before any meaningful diet transition for your ${breedTitle}; it surfaces risks in minutes that might otherwise take weeks to diagnose.`,
    `Diet transitions for ${breedTitle}s are safer when the vet is aware of them in advance, particularly for animals with known sensitivities or ongoing treatment.`,
    `Add a vet touch-point to any non-trivial diet adjustment for your ${breedTitle} — the cost is a phone call and the benefit is an individualised green light.`,
    `A brief vet consultation before switching your ${breedTitle}'s core diet catches interactions that are difficult to anticipate from a general guide.`,
    `Before finalising a diet change for your ${breedTitle}, flag it to the veterinarian who knows the animal's history — they are best placed to spot problems early.`,
    `Significant dietary changes for a ${breedTitle} are worth a five-minute vet conversation up front, particularly if the animal has any existing health considerations.`,
    `Involve your veterinarian before material feeding changes for your ${breedTitle}; small interventions in advance reliably prevent larger interventions later.`
  ];
  return variants[seed % variants.length];
}

// Generic short closer/fingerprint replacements (1-sentence, used mid-page)
const GENERIC_CLOSERS = {
  // "It is easy to treat this corner of {breed} care as optional..." replacement pool
  optionalTrap: (breedTitle, seed) => {
    const variants = [
      `Households that treat this part of ${breedTitle} care as optional often end up paying for the same outcomes through emergency spend or behavioural correction later.`,
      `Skipping this step looks harmless month to month and accumulates into the kind of outcome that shows up in year three or year seven.`,
      `Deferring decisions here is one of the few reliably regrettable choices in ${breedTitle} ownership.`,
      `The households that keep this corner on the plan are consistently the ones with the fewest surprises downstream.`,
      `Quiet parts of a ${breedTitle}'s care plan reward the discipline to handle them on schedule rather than on demand.`,
      `Most households underestimate the compounding value of handling this steadily rather than when it becomes urgent.`,
      `The return on sustained attention here is larger than it looks in any single month.`,
      `Time spent on this layer of the plan pays back most in the years when no single dramatic event happens.`,
      `This is the kind of work that rarely looks essential in isolation and becomes obviously essential in aggregate.`,
      `Consistent effort here does more for lifetime outcomes than bursts of effort when a specific problem arises.`
    ];
    return variants[seed % variants.length];
  },

  respondsWhenRoutineMatches: (breedTitle, seed) => {
    const variants = [
      `${breedTitle}s settle into a stable rhythm when the routine reflects their natural temperament and life stage rather than a one-size-fits-all template.`,
      `Routines that match the ${breedTitle}'s actual energy and social preferences produce a more cooperative animal than routines adapted from other breeds.`,
      `The ${breedTitle}'s behaviour usually tells you within a few weeks whether the routine fits — adjust the routine before trying to adjust the animal.`,
      `A ${breedTitle} on a well-fitted routine is noticeably calmer, more responsive, and easier to handle than one on a generic schedule.`,
      `Tailor the daily rhythm to the ${breedTitle}'s observed preferences; the animal will meet you halfway when the routine reflects its actual temperament.`,
      `${breedTitle}s do their best work when the household routine acknowledges their specific energy rhythm and environmental needs.`,
      `The right routine for this ${breedTitle} is usually visible in the first few weeks of observation — build from what the animal is telling you rather than from a template.`,
      `When the routine respects the ${breedTitle}'s temperament, habitat, and age, the rest of the care plan generally clicks into place.`,
      `Routine fit shows up in small behavioural signals: appetite, sleep, elimination, and mood. Calibrate the routine until those signals stay steady.`,
      `A well-matched daily routine reliably produces the calm, healthy ${breedTitle} that generic advice sometimes fails to deliver.`
    ];
    return variants[seed % variants.length];
  },

  understandingAsNotJustAPet: (breedTitle, seed) => {
    const variants = [
      `Seeing the ${breedTitle} as the specific animal it is — with its own temperament, preferences, and thresholds — changes the quality of every care decision.`,
      `Treating the ${breedTitle} as an individual rather than a category produces better outcomes than any generic checklist.`,
      `The ${breedTitle}'s individuality matters: the same generic advice produces different results in different households because the animal in the middle is always specific.`,
      `Good care starts with recognising the ${breedTitle} as a particular animal with particular preferences, not as a stand-in for the species average.`,
      `Responsive care depends on noticing what this ${breedTitle} actually prefers rather than assuming breed averages hold.`,
      `The households that handle ${breedTitle} care well consistently pay attention to the individual animal's feedback rather than defaulting to breed-level generalisations.`,
      `An effective care plan is specific to the ${breedTitle} in your home, not to the breed in the abstract.`,
      `Breed-level advice is a starting point; the plan gets refined by observing the ${breedTitle} that is actually in the household.`,
      `The best ${breedTitle} care plans are the ones that have been adjusted to match the animal's observed behaviour rather than the breed's published profile.`,
      `Paying attention to the ${breedTitle} as its own animal usually produces better daily decisions than consulting any generic source.`
    ];
    return variants[seed % variants.length];
  }
};

// Disclaimer block diversification specifically for the cost-to-own / best-enrichment / vs-* 1638 duplicate cluster
// (already handled in lib-variants.cjs via disclaimerBlockForPage; kept here for clarity)

module.exports = {
  introFineTuneRecommendations,
  introCheckInWithVet,
  GENERIC_CLOSERS
};
