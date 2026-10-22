/** Lexically distinct paragraph variants. A checker rejects any shared 5-word span. */

function h(str) {
  let n = 2166136261;
  for (let i = 0; i < str.length; i++) n = Math.imul(n ^ str.charCodeAt(i), 16777619);
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
  return (n ^ (n >>> 16)) >>> 0;
}

export function choose(seed, salt, id, list) {
  return list[h(`${seed}|${salt}|${id}`) % list.length];
}

const f = (facts, ...keys) => {
  for (const k of keys) {
    const hit = Object.entries(facts).find(([name]) => name.toLowerCase() === k.toLowerCase());
    if (hit?.[1]) return hit[1];
  }
  return "";
};

function bag(p) {
  const origin = f(p.facts, "Origin");
  const size = f(p.facts, "Size");
  const height = f(p.facts, "Height");
  const life = f(p.facts, "Lifespan");
  const temp = f(p.facts, "Temperament");
  const diet = f(p.facts, "Diet");
  const care = f(p.facts, "Care Level");
  const kids = f(p.facts, "Good with Kids");
  const shed = f(p.facts, "Shedding", "Grooming", "Grooming Needs");
  const exercise = f(p.facts, "Exercise Needs", "Activity Level");
  const train = f(p.facts, "Trainability");
  const enc = f(p.facts, "Enclosure", "Enclosure Size", "Space Requirements");
  const temperature = f(p.facts, "Temperature", "Temperature Range");
  const humid = f(p.facts, "Humidity");
  const bask = f(p.facts, "Basking Spot");
  const group = f(p.facts, "Breed Group");
  return { origin, size, height, life, temp, diet, care, kids, shed, exercise, train, enc, temperature, humid, bask, group, n: p.name };
}

const OVERVIEW = [
  (b) => `${b.n} is the animal this page is about, not a generic pet with the name pasted in. ${b.origin ? `The place attached to the breed is ${b.origin}.` : `No geographic origin is printed in the quick facts, so do not invent a romantic homeland.`} ${b.size ? `Adult size is ${b.size}.` : ""} ${b.life ? `The lifespan to take seriously is ${b.life}.` : ""} ${b.temp ? `Temperament is summarized as ${b.temp}.` : ""} Buy for that list, not for a baby photo.`,
  (b) => `Start with the unglamorous record on a ${b.n}. ${b.life ? `You are looking at ${b.life} of feeding and cleaning.` : "Count the years before the cute phase."} ${b.size ? `The body you are housing is ${b.size}.` : ""} ${b.origin ? `History points to ${b.origin}.` : "Origin is not listed here, and a missing origin is not a blank check to guess."} ${b.temp ? `The usual character line reads ${b.temp}.` : ""} Individuals miss that line in both directions.`,
  (b) => `A ${b.n} in a real house is a schedule. ${b.origin ? `That schedule was shaped in ${b.origin}.` : "The origin field on this profile is empty."} ${b.size ? `Gear has to fit ${b.size} once growth finishes.` : ""} ${b.life ? `Put ${b.life} on the family calendar before money changes hands.` : ""} ${b.temp ? `Expect the bias described as ${b.temp}, then watch the animal you have.` : ""}`,
  (b) => `People shop a ${b.n} on looks and meet the work later. ${b.size ? `Looks settle at ${b.size}.` : ""} ${b.height ? `The height or length beside that is ${b.height}.` : ""} ${b.life ? `Work continues for ${b.life}.` : ""} ${b.origin ? `The traditional home of the breed is ${b.origin}.` : ""} ${b.temp ? `Handlers describe the mindset as ${b.temp}.` : "Mindset is individual."} If those sentences already annoy you, pick a different species.`,
  (b) => `Here is the short version, then the detail. Species or breed: ${b.n}. ${b.origin ? `Origin: ${b.origin}.` : "Origin: not stated in the source table."} ${b.size ? `Size: ${b.size}.` : ""} ${b.life ? `Life: ${b.life}.` : ""} ${b.temp ? `Temperament: ${b.temp}.` : ""} ${b.care ? `Care label: ${b.care}.` : ""} Everything under the next headings is what that label costs in hours.`,
  (b) => `Forget the superlatives. A ${b.n} needs the measurements kept. ${b.life ? `${b.life} is the planning number.` : ""} ${b.size ? `${b.size} is the adult body.` : ""} ${b.origin ? `${b.origin} is where the animal was shaped.` : ""} ${b.temp ? `${b.temp} is the temperament note, which you verify rather than trust.` : ""} The sections after this one are diet, housing, illness, and money.`,
];

const APPEAR = [
  (b) => `${b.n} should be judged as an adult. ${b.size ? `The size written down is ${b.size}.` : "Size varies by sex and by line."} ${b.height ? `Add ${b.height} when you are buying a crate, tank, or carrier.` : ""} Color is the least useful fact. Ribs, muscle, and (where the species stores fat) the tail or the waist tell you whether the ration is right.`,
  (b) => `Juvenile ${b.n} photos lie about bulk. ${b.size ? `Plan the enclosure and the food bag around ${b.size}.` : ""} ${b.height ? `Length or height on the sheet is ${b.height}.` : ""} A heavy animal and a thin one of this same breed need different portions. Learn the feel of a healthy one from a vet or a rescue, not from a filter.`,
  (b) => `Measurements for ${b.n}: ${[b.size, b.height].filter(Boolean).join("; ") || "use an adult weight, not a baby weight"}. Coat, scale, feather, or fin quality shows the last month of care. It does not show whether the breed is 'fancy.' Weigh the animal. Write the number down. That number is the appearance fact that matters at the clinic.`,
];

const TEMPER = [
  (b) => `${b.n} temperament, as printed: ${b.temp || "not reduced to a slogan here"}. ${b.train ? `Trainability is marked ${b.train}.` : "Short teaching sessions beat marathon ones."} ${b.exercise ? `Activity is listed as ${b.exercise}.` : ""} Reward the behavior you want tomorrow. Scaring a prey species, a bird, or a dog teaches it to hide pain and to hide from you.`,
  (b) => `The character blurb for a ${b.n} says ${b.temp || "varies"}. Treat it as a bias. ${b.exercise ? `The exercise or activity line is ${b.exercise}, and that is a daily chore, not a weekend apology.` : ""} ${b.train ? `Training notes say ${b.train}.` : ""} Boredom comes out as chewing, screaming, pacing, or glass-surfing. Those are husbandry clues.`,
  (b) => `Living with a ${b.n} means the ${b.temp || "actual"} temperament you meet at 7 a.m., not the one in the ad. ${b.kids ? `The note about children is "${b.kids}."` : "Children need an adult's hands on the animal."} ${b.train ? `If trainability is ${b.train}, match your patience to that, not to a video.` : ""}`,
];

const LIFE = [
  (b) => `${b.n} lifespan under decent care: ${b.life || "long enough that a whim is a bad reason"}. Animals that miss the range were usually fed wrong, kept at the wrong temperature, or bred from parents nobody checked. Age changes the vet plan. Youngsters need quarantine or vaccines. Elders need weights, dental care, and bloodwork on a schedule a vet sets.`,
  (b) => `Put ${b.life || "the full lifespan"} next to your lease, your kids' ages, and your travel, then decide about a ${b.n}. Rehoming an older animal is harder than walking away from a baby one in a shop. The second half of life is when dental disease, joints, kidneys, or tumors show up, depending on the species.`,
  (b) => `A ${b.n} that reaches ${b.life || "a normal old age"} did not get there on affection. Food, housing, and a clinic that will see the species did the work. Budget the later years at the start. They are more expensive than the purchase.`,
];

function dietFor(p, b) {
  const g = p.group;
  const pools = {
    dogs: [
      () => `${b.n} dogs belong on a complete food that meets AAFCO for the life stage you have, puppy or adult or senior. Count calories. ${b.size ? `A body of ${b.size} does not get the same cup as the dog in the commercial.` : ""} Large-breed puppies need a large-breed growth diet so the joints are not asked to support a rocket. Table scraps and fat-bomb treats are how pancreatitis and obesity start.`,
      () => `Feed a ${b.n} for the ribs you can feel, not for the bowl the dog empties. An AAFCO statement for the right life stage matters more than grain-free marketing. ${b.exercise ? `Exercise is ${b.exercise}, so portions move with work.` : "Portions move when the waist disappears."} Puppies of big breeds grow on a large-breed puppy formula. Grapes, xylitol, chocolate, and cooked bones are not 'a little bit.'`,
      () => `The ${b.n} food decision is boring on purpose: one complete diet, a measuring cup, and a body-condition check every month. ${b.diet ? `The quick facts mention ${b.diet}.` : ""} Switching proteins every week to 'add variety' mostly adds diarrhea. If the stool is chronically soft, ask a vet before you buy the fourth boutique bag.`,
    ],
    cats: [
      () => `${b.n} cats are obligate carnivores. Feed a complete cat food. Dog food is not a substitute, and a vegan diet is not a personality. ${b.diet ? `This profile's diet line says ${b.diet}.` : ""} Match calories to the waist. Lilies, onions, and human painkillers are emergency poisonings.`,
      () => `A ${b.n} can eat wet food, dry food, or both, as long as the food is complete for cats and the calories fit the cat. ${b.size ? `Size on this page is ${b.size}.` : ""} Water intake matters for the bladder and the kidneys. A fountain is optional. A washed bowl is not. Do not 'supplement' with raw fish as the diet.`,
      () => `Pick the ${b.n} ration by stool, coat, and weight, then stop shopping. ${b.diet ? `Listed diet: ${b.diet}.` : ""} Kidney diets, urinary diets, and weight-loss diets are medical tools a vet prescribes after labs, not aisles you guess in.`,
    ],
    birds: [
      () => `${b.n} birds need a formulated pellet as the base. A seed-only diet is how vitamin A deficiency shows up later as a sick bird. Vegetables most days, fruit as a treat. Avocado, chocolate, and fumes from overheated nonstick pans are the household killers. ${b.diet ? `The diet note here is ${b.diet}.` : ""}`,
      () => `Feed a ${b.n} like a bird that has to live ${b.life || "for years"}, not like a treat dispenser. Pellets first. ${b.diet ? `Quick facts: ${b.diet}.` : ""} Weigh the bird in grams. You will not see weight loss under feathers until it is late.`,
      () => `The ${b.n} menu fails when seed is the whole plan. Pellets, chopped vegetables, and a measured treat are the durable version. ${b.diet ? `Published diet line: ${b.diet}.` : ""} No alcohol, no caffeine, no avocado, and no 'people food' you have not looked up on an avian list.`,
    ],
    reptiles: [
      () => `${b.n} feeding follows the category, not a wish. ${b.diet ? `The sheet says ${b.diet}.` : "Confirm whether this species eats insects, whole prey, greens, or a mix."} Gut-load insects. Dust calcium on the schedule a reptile vet gives you. Heat is part of digestion. A cold animal that 'won't eat' often needs the thermostat fixed before a new food.`,
      () => `Put the ${b.n} meal where the animal can use it, at the temperature it can digest. ${b.diet ? `Diet category: ${b.diet}.` : ""} ${b.bask ? `Basking spot listed: ${b.bask}.` : ""} Whole prey should be the right size. Greens for herbivores should be the staple, not a lettuce garnish. Iceberg is not a diet.`,
      () => `A ${b.n} that is fed the wrong class of food fails slowly. ${b.diet ? `Use ${b.diet} as the starting category and refine it with a reptile vet.` : "Ask a reptile vet what class of food this species actually uses."} Calcium without the right temperatures or UVB, where UVB is required, does not stick. Overfeeding obese lizards is as common as starvation.`,
    ],
    amphibians: [
      () => `${b.n} meals are live invertebrates in almost every common pet species. ${b.diet ? `Listed diet: ${b.diet}.` : ""} Dust calcium on most feedings and a multivitamin less often. Remove uneaten crickets. They chew on the animal. Do not dump a pet-store 'amphibian pellet' in as the whole plan unless a vet who sees this species has told you it is appropriate.`,
      () => `Feed a ${b.n} what it will chase or ambush, on a schedule that does not make it obese. ${b.diet ? `The diet field says ${b.diet}.` : ""} Variety of insects beats a single feeder every day. Earthworms are a useful rotation for many frogs and salamanders. Wild-caught bugs can carry pesticides.`,
    ],
    fish: [
      () => `${b.n} food should fit the mouth and the water level where the fish feeds. What is gone in a minute or two is a meal. What sinks and molds is ammonia. ${b.diet ? `Diet note: ${b.diet}.` : ""} Once or twice a day is enough for most adults. A new tank does not need a 'welcome feast.'`,
      () => `Choose ${b.n} food by the species' job: flakes or small pellets for midwater fish, sinking food for bottom fish, vegetables for grazers. ${b.diet ? `This profile lists ${b.diet}.` : ""} Fast the fish one day a week if the body is getting thick. Medicate only after you have tested ammonia, nitrite, and temperature.`,
    ],
    "marine-fish": [
      () => `Know what a ${b.n} eats before it comes home. Some marine fish take pellets. Some need frozen meaty foods. Some are algae grazers that starve beside a full jar of flakes. ${b.diet ? `Listed diet: ${b.diet}.` : ""} Offer food after the lights come up and the fish is settled, not in the bag on day one.`,
      () => `A ${b.n} that refuses prepared food needs the diet it evolved to take, which may mean nori, frozen mysis, or both. ${b.diet ? `Quick facts: ${b.diet}.` : ""} Quarantine is part of feeding, because a fish that will not eat in quarantine is telling you something before it tells the display tank.`,
    ],
    "small-animals": [
      () => `${b.n} nutrition is species-specific. ${b.diet ? `The diet line says ${b.diet}.` : ""} Rabbits, guinea pigs, and chinchillas need hay as the main food, unlimited, not a handful. Guinea pigs need vitamin C every day because they do not make their own. Hamsters, rats, mice, and gerbils need a pellet made for them, with treats measured in pinches.`,
      () => `The expensive ${b.n} diet is the one made of yogurt drops and seed sticks. ${b.diet ? `Start from ${b.diet}.` : "Start from hay or a species pellet, whichever this animal actually requires."} Teeth that grow continuously need the right fiber to wear down. A dental abscess is the bill for the cute treat bag.`,
    ],
  };
  const list = pools[g] || pools.fish;
  return choose(p.slug, p.salt || 0, "diet", list)();
}

function habitatFor(p, b) {
  const g = p.group;
  const pools = {
    dogs: [
      () => `A ${b.n} lives in your house, not in a tank. That still means a bed out of the draft, water that is washed, and a crate or room that is actually safe when you leave. ${b.exercise ? `The exercise figure is ${b.exercise}.` : "Daily exercise is part of housing."} Fences, xylitol in the kitchen, and rodent bait in the garage are the housing failures that become emergencies.`,
      () => `Housing a ${b.n} is doors that latch, a temperature the dog can leave, and shade plus water in summer. ${b.size ? `A body of ${b.size} needs a crate that lets the dog stand and turn, not a souvenir from puppy week.` : ""} Apartment life is a noise and exercise question. Measure those honestly before you sign a lease that forbids the dog.`,
    ],
    cats: [
      () => `${b.n} housing is vertical space, a clean litter box (one more than the number of cats is the usual rule), and no lilies in the building. ${b.enc ? `Space note: ${b.enc}.` : ""} Outdoor access is cars, coyotes, and diseases. A screened porch is a different decision from an open door.`,
      () => `Give a ${b.n} a hiding spot that is not the only litter area, scratching that is legal, and water away from the food if the cat is fussy. ${b.size ? `Adult size is ${b.size}, which still fits a carrier you should practice with on quiet days.` : ""} The carrier comes out before the emergency, or you will not get the cat into it.`,
    ],
    birds: [
      () => `A ${b.n} cage should let the bird stretch, with bar spacing the head cannot pass. ${b.enc ? `Space on this profile: ${b.enc}.` : ""} Sleep needs darkness and quiet, about twelve hours. Kitchens add fumes. Mirrors are not a social life. Perches of more than one diameter save feet.`,
      () => `Place the ${b.n} where the family is, then give a real night. ${b.enc ? `Enclosure guidance: ${b.enc}.` : ""} Drafts, direct noon sun through glass, and scented candles are how birds get sick without a visible wound. Out-of-cage time is supervised. Ceiling fans and open pots of water are not theoretical.`,
    ],
    reptiles: [
      () => `Build the ${b.n} enclosure before the animal arrives. ${b.enc ? `Size to aim for: ${b.enc}.` : ""} ${b.temperature ? `Temperature target: ${b.temperature}.` : "You need a measured warm side and a cool side."} ${b.bask ? `Basking: ${b.bask}.` : ""} ${b.humid ? `Humidity: ${b.humid}.` : "Humidity belongs on a gauge inside the enclosure, not in your memory."} A thermostat is mandatory on heat mats and heat cables. UVB, for species that bask, is a second bulb with an expiry date, not the heat lamp.`,
      () => `${b.n} thermometers go where the animal sits, not on the opposite wall. ${b.temperature ? `Listed range: ${b.temperature}.` : ""} ${b.humid ? `Listed humidity: ${b.humid}.` : ""} ${b.enc ? `Footprint or volume: ${b.enc}.` : ""} Hides on both the warm and cool ends. Loose sand for an animal that snaps food off the ground is how impactions happen. Replace UVB tubes on the manufacturer's clock, often 6 to 12 months, even when they still look bright.`,
    ],
    amphibians: [
      () => `${b.n} water is the husbandry. Treat chlorine and chloramine. ${b.temperature ? `Temperature on the sheet: ${b.temperature}.` : "Most amphibians overheat in a warm living room."} ${b.humid ? `Humidity: ${b.humid}.` : ""} ${b.enc ? `Enclosure: ${b.enc}.` : ""} Do not park the tank in a sunny window. Bright UVB that dries the skin is not a kindness. Axolotls in particular want cool water and low light. Rinse hands before any necessary handling.`,
      () => `Cycle an aquatic setup for a ${b.n} the way you would a fish tank, and keep nitrates low. ${b.temperature ? `Stay near ${b.temperature}.` : ""} ${b.enc ? `Volume or style: ${b.enc}.` : ""} Terrestrial species need a moist retreat, not a swamp, unless the species is actually aquatic. Soap residue in a 'clean' bowl is a skin emergency.`,
    ],
    fish: [
      () => `Cycle the tank before a ${b.n} arrives. Ammonia and nitrite stay at zero. ${b.temperature ? `Temperature: ${b.temperature}.` : ""} ${b.enc ? `Space: ${b.enc}.` : ""} ${f(p.facts, "pH", "pH Range") ? `pH noted here: ${f(p.facts, "pH", "pH Range")}.` : "Match pH to the species instead of chasing a universal number."} A heater and a thermometer on opposite ends catch a stuck heater. Water changes are the filter you cannot buy out of.`,
      () => `${b.n} tanks fail from impatience. ${b.enc ? `Minimum space listed: ${b.enc}.` : ""} ${b.temperature ? `Hold ${b.temperature}.` : ""} Test the water the fish is in, not the water you wish you had. Quarantine new fish if you already have a stocked tank. 'Clear water' is not a test result.`,
    ],
    "marine-fish": [
      () => `A ${b.n} needs stable salt water, not a freshwater kit with a box of salt dumped in on Friday. Salinity around 1.023–1.025, pH about 8.1–8.4, temperature usually 76–82°F unless this species is an exception. ${b.enc ? `Space: ${b.enc}.` : ""} ${b.temperature ? `Profile temperature: ${b.temperature}.` : ""} Quarantine new arrivals. A refractometer beats a swing-arm hydrometer.`,
      () => `Stock a ${b.n} only after the tank has finished cycling and the skimmer, if you use one, is actually pulling waste. ${b.enc ? `The room this fish needs: ${b.enc}.` : ""} Chasing numbers every hour stresses you and does not help. Chasing them never is how tanks crash. Write salinity and temperature down.`,
    ],
    "small-animals": [
      () => `${b.n} cages need solid floor on the standing area. Wire-only floors make sore hocks. ${b.enc ? `Space listed: ${b.enc}.` : ""} ${b.temperature ? `Temperature: ${b.temperature}.` : "Most small mammals are in trouble once a room sits in the mid-80s °F, and chinchillas much sooner."} A hide, chew material that is safe, and bedding that is not scented are the baseline. Bar spacing must not fit a head.`,
      () => `Set a ${b.n} enclosure where you can see droppings and food every day. ${b.enc ? `Start from ${b.enc}.` : ""} Heat is the summer emergency. Cold drafts are the winter one for tiny bodies. Exercise pens beat a single level of wire if the species is a rabbit or a guinea pig that needs to move.`,
    ],
  };
  const list = pools[g] || pools.fish;
  return choose(p.slug, p.salt || 0, "hab", list)();
}

function handleFor(p, b) {
  const pools = {
    dogs: [
      () => `Handle a ${b.n} the way a stranger should be allowed to handle them later. A harness beats a collar for dogs that pull. Nail trims start before the dog has an opinion. Rough wrestling teaches the wrong mouth.`,
      () => `Daily handling of a ${b.n} is paws, ears, and a collar that does not yank the trachea. Children do this with an adult attached. Punishment that scares the dog does not create a safer dog.`,
    ],
    cats: [
      () => `Support a ${b.n} at the chest and the hind end. Scruffing an adult is not routine care. Practice the carrier and the nail trim on dull days so a sick day is possible.`,
      () => `A ${b.n} that is grabbed and passed around learns to hide. Keep sessions short, let the cat leave, and do medical handling when you need it rather than as a party trick.`,
    ],
    birds: [
      () => `A ${b.n} that steps up without a chase is the handling goal. Towels are for clinics. Wing trims, if anyone is considering one, are an avian-vet conversation, because a bad clip causes falls.`,
      () => `Do not chase a ${b.n} around the cage to prove you can hold it. Step-up, a neutral perch, and hands that do not smell like food are the workable path. Bites are information.`,
    ],
    reptiles: [
      () => `Support the body of a ${b.n}. Leave the tail alone. Stop when the animal is done, not when a guest is done. Wash hands before and after. Salmonella is the reason, and it is not rare.`,
      () => `New ${b.n} keepers wait through the first week before handling. Short, low sessions. A reptile is not a comfort object. If it is shedding, feeding, or gaping, put it back.`,
    ],
    amphibians: [
      () => `Handle a ${b.n} when you must move it, not for entertainment. Rinse with dechlorinated water or use a wet powder-free glove. Skin drinks whatever is on yours, including lotion.`,
      () => `If a ${b.n} can be moved in a cup of its own tank water, do that instead of a hand. Oils, soap, and heat from skin are the injuries people do not notice until the next day.`,
    ],
    fish: [
      () => `A ${b.n} is not handled. Nets damage the slime coat. Move the fish in a container of tank water when you can. Dry hands are worse.`,
      () => `Leave the ${b.n} in the water. Chasing it for a photo is how fins split and infections start. If a tank transfer is required, be quick and wet.`,
    ],
    "marine-fish": [
      () => `Do not handle a ${b.n}. Spines on many marine fish are not decorative, and the slime coat is the immune system you can see. Transfer water, not trophies.`,
      () => `A ${b.n} that is cupped in a wet container moves more safely than one that is net-flipped onto a lid. Gloves do not make handling a hobby.`,
    ],
    "small-animals": [
      () => `Scoop a ${b.n} from underneath, close to the floor. Prey animals grabbed from above learn to bite, and a fall from chest height breaks legs.`,
      () => `Sit down to hold a ${b.n}. Support the hind end. No 'almost dropped' moments. Children sit and an adult is in reach of the animal the whole time.`,
    ],
  };
  const list = pools[p.group] || pools.dogs;
  return choose(p.slug, p.salt || 0, "handle", list)();
}

function groomFor(p, b) {
  const pools = {
    dogs: [
      () => `${b.n} grooming is nails, ears, and teeth, plus the coat you actually have. ${b.shed ? `Coat note: ${b.shed}.` : ""} Mats pull skin. A smell from an ear is an infection until a vet says otherwise. Brushing teeth is less romantic than a new collar and more useful.`,
      () => `Keep a ${b.n} comfortable: nails that do not click into the pad, ears that do not reek, and a coat combed to the skin if it can mat. ${b.shed ? `Shedding or grooming level: ${b.shed}.` : ""} A 'hypoallergenic' claim is marketing. Saliva and dander remain.`,
    ],
    cats: [
      () => `${b.n} maintenance is nails, teeth, and whatever the coat demands. ${b.shed ? `Coat: ${b.shed}.` : "Longer coats mat behind the ears and under the legs."} Hairballs are fiber, brushing, and sometimes disease. They are not a personality.`,
      () => `Clip a ${b.n}'s nails before they hook the quick, and look at the teeth when the cat yawns. ${b.shed ? `Grooming note: ${b.shed}.` : ""} Baths are rarely the answer. Mats that are tight to skin need a clipper, not scissors poked in blind.`,
    ],
    birds: [
      () => `A ${b.n} bathes in a dish or a mist of plain water. Nails and beaks that overgrow are diet and perch problems, then a vet's. Skip the pet-store mite spray as a guess. ${b.shed ? `Molt or grooming note: ${b.shed}.` : ""}`,
      () => `Maintenance on a ${b.n} is a weekly look at feet, beak, and the vent, plus a bath the bird can choose. ${b.shed ? `Listed grooming: ${b.shed}.` : ""} Blood feathers that break need pressure and, if it will not stop, a clinic.`,
    ],
    reptiles: [
      () => `Grooming a ${b.n} is a shed check. Toes, tail tip, and eye caps should come free. ${b.humid ? `Humidity listed at ${b.humid} is the prevention.` : "Fix humidity before you pull at skin."} Do not peel shed that is still attached. A retained eye cap is a vet or an experienced keeper problem, not a thumbnail project.`,
      () => `After a ${b.n} sheds, count toes. Stuck bands cut off circulation. ${b.humid ? `The humidity target is ${b.humid}.` : ""} A short lukewarm soak helps only when the air was the actual problem. Mouth rot and mites are medical, not cosmetic.`,
    ],
    amphibians: [
      () => `${b.n} skin is an organ. No lotions, no essential oils in the room, no 'skin polish.' Sores or a sudden dull coat are a vet visit. Shed skin is often eaten.`,
      () => `There is nothing to groom on a ${b.n} except the habitat. Red skin, excess slime, or sores are disease. Do not reach for an antifungal cream made for human feet.`,
    ],
    fish: [
      () => `Nothing on a ${b.n} gets brushed. Cloudy eyes, frayed fins, and extra slime are water quality or disease. Fix the test results before you buy a medication cocktail.`,
      () => `${b.n} 'grooming' is the tank: algae on the glass if you want to see the fish, and no soap in any tool that touches the water. The fish does not need a rinse.`,
    ],
    "marine-fish": [
      () => `No grooming for a ${b.n}. Watch for white spots, ragged fins, and fast breathing. Those are quarantine and water-chemistry problems.`,
      () => `Leave the ${b.n}'s slime coat alone. Hands, nets, and 'cleaning' the fish are how infections start in salt water.`,
    ],
    "small-animals": [
      () => `${b.n} upkeep is nails, clean bedding, and teeth. ${b.shed ? `Coat note: ${b.shed}.` : ""} Teeth that curl or a wet chin mean a dental visit, not a cuter chew toy. Baths are rarely useful and often dangerous, especially for chinchillas.`,
      () => `Check a ${b.n} weekly: nails, rear end, and the wear on the incisors. ${b.shed ? `Grooming listed as ${b.shed}.` : ""} Long-haired guinea pigs and angora-type coats mat. Scented bedding is a respiratory irritant, not a luxury.`,
    ],
  };
  const list = pools[p.group] || pools.dogs;
  return choose(p.slug, p.salt || 0, "groom", list)();
}

function monthFor(p, b) {
  const pools = {
    dogs: [
      () => `Month one with a ${b.n} is a fecal test, a vaccine or shelter record, and a crate that is a bedroom. Night crying happens. Diarrhea that lasts, or a puppy that skips a full day of meals, does not.`,
      () => `Use the first weeks of ${b.n} ownership to learn this dog's stool, appetite, and the walk you can repeat. Book the vet before you book the puppy class. Heartworm prevention starts on a vet's timeline, not when you remember.`,
    ],
    cats: [
      () => `Give a new ${b.n} one room. Litter, water, and food stay put. The first visit covers vaccines, parasites, and a leukemia/FIV test if the history is blank. Hiding is ordinary. Skipping food for more than a day is not.`,
      () => `Week one for a ${b.n} is quiet, a predictable box, and a carrier left open. Do not invite the whole neighborhood. A cat that does not eat, or that strains in the box, goes to a clinic.`,
    ],
    birds: [
      () => `Quarantine a new ${b.n} from other birds for at least 30 days. Weigh it in grams at the first avian visit. Appetite and droppings are the early warning, not the brightness of the feathers.`,
      () => `The first month with a ${b.n} is a stable cage, a pellet introduction if the bird is on seed, and no new toy that can trap a toe. Find the avian vet while the bird is well.`,
    ],
    reptiles: [
      () => `Leave a new ${b.n} alone for several days. Confirm the warm side with a thermometer on day one. The first shed and the first stool tell you whether the box works. A fecal at a reptile vet beats another decorative hide.`,
      () => `Do not handle a fresh ${b.n} for guests. Get temperatures right, offer the correct food, and write down whether it ate. Weight loss in the first month is a setup problem until proven otherwise.`,
    ],
    amphibians: [
      () => `Have the ${b.n} enclosure stable before the shipping day. The first week is skin and appetite, not an audience. A water test or a humidity reading belongs on paper.`,
      () => `Settle a ${b.n} with the lights low and the parameters already in range. If it is an aquatic species, the nitrogen cycle is finished first. Feeding on hour one is optional.`,
    ],
    fish: [
      () => `Acclimate a ${b.n} slowly to the tank's temperature. Feeding a full portion into a brand-new aquarium is how ammonia spikes. Lights off for a few hours help. Quarantine if other fish already live there.`,
      () => `Day one for a ${b.n} is matching temperature and not panicking at a skipped meal. Test ammonia the next morning. A fish gasping at the surface is a water emergency, not shyness, unless the species is built to breathe air.`,
    ],
    "marine-fish": [
      () => `A ${b.n} spends its first weeks in quarantine. Marine ich shows up after the bag, not always in the store. Match salinity. Do not dump store water into your display.`,
      () => `Observe a new ${b.n} for breathing rate and interest in food. Treat in quarantine, not in a reef full of invertebrates, unless a marine vet or a very experienced keeper has a reason.`,
    ],
    "small-animals": [
      () => `Weigh a new ${b.n} on a kitchen scale and keep the number. Prey mammals hide illness. A drop in weight or a change in droppings is the early call. Book an exotic vet before there is an emergency.`,
      () => `The first ${b.n} week is hay or the right pellet, a hide, and a daily weight. A rabbit or guinea pig that stops eating is same-day urgent. Do not wait out the weekend.`,
    ],
  };
  const list = pools[p.group] || pools.dogs;
  return choose(p.slug, p.salt || 0, "month", list)();
}

function mistakeFor(p, b) {
  const pools = {
    dogs: [
      () => `The ${b.n} bills that were avoidable: free-feeding a dog that never stops, skipping heartworm and flea products, and waiting on a limp because the tail is still wagging.`,
      () => `Owners get a ${b.n} into trouble by under-exercising and over-treating, then calling the resulting weight 'the breed.' Joints and pancreases keep the receipt.`,
    ],
    cats: [
      () => `Costly ${b.n} mistakes: a lily in the house, a dry-only plan for a cat that already blocked, and an open balcony.`,
      () => `People lose ${b.n} cats to delay. A male that strains, a cat that has not eaten since yesterday, or open-mouth breathing is not a morning appointment.`,
    ],
    birds: [
      () => `The classic ${b.n} mistakes are seed as the whole diet, a kitchen cage, and a mirror standing in for company.`,
      () => `${b.n} disasters that look like accidents: nonstick fumes, scented candles, and a ceiling fan during out-of-cage time.`,
    ],
    reptiles: [
      () => `Avoidable ${b.n} harm: a heat source with no thermostat, a UVB tube that is years old, and loose sand under an animal that eats on the ground.`,
      () => `People cook or chill a ${b.n} by trusting the sticker on the lid. Measure the surface the animal touches. Then feed.`,
    ],
    amphibians: [
      () => `${b.n} keepers get hurt by untreated tap water, a tank in the sun, and handling for fun.`,
      () => `The quiet ${b.n} failure is heat. A closed tub in a warm room climbs past what amphibian skin can survive.`,
    ],
    fish: [
      () => `${b.n} tanks crash when the fish arrives on day one, the food is heavy, and nobody owns a test kit.`,
      () => `Overcleaning a ${b.n} filter until the bacteria are gone, then overfeeding to 'make up for stress,' is a common loop.`,
    ],
    "marine-fish": [
      () => `${b.n} purchases go wrong when quarantine is skipped and the fish is already larger than the tank will allow.`,
      () => `Chasing salinity with a cheap swing hydrometer is how a ${b.n} gets a slow osmotic problem nobody meant.`,
    ],
    "small-animals": [
      () => `The ${b.n} emergencies people cause are a wire-only floor, a diet of treats, and an overnight wait when a rabbit or guinea pig stops eating.`,
      () => `Heat and cedar bedding are the ${b.n} mistakes that do not look dramatic until the animal is flat.`,
    ],
  };
  const list = pools[p.group] || pools.dogs;
  return choose(p.slug, p.salt || 0, "mistake", list)();
}

function flagsFor(p) {
  const g = p.group;
  const sets = {
    dogs: [
      [
        `Pale, blue, or brick-red gums on a ${p.name} are an emergency.`,
        `Check the gums of a ${p.name}: white, blue, or a deep brick color means go now.`,
      ],
      [
        `A ${p.name} with a tight, swelling belly and unproductive retching needs an emergency clinic, not a walk.`,
        `Retching plus a hard abdomen in a ${p.name} is treated as bloat until a vet says it is not.`,
      ],
      [
        `A seizure in a ${p.name} that lasts more than a couple of minutes, or seizures in a row, is an emergency.`,
        `Cluster seizures or a ${p.name} that does not recover between fits should not wait for office hours.`,
      ],
      [
        `Collapse, or breathing that is hard while a ${p.name} is at rest, skips the 'see how dinner goes' plan.`,
        `If a ${p.name} cannot settle its breathing at rest, that is an emergency trip.`,
      ],
      [
        `Blood in vomit or stool, or vomiting that will not stop, is a same-day problem for a ${p.name}.`,
        `A ${p.name} that vomits repeatedly or passes blood is not a fasting experiment.`,
      ],
      [
        `Known toxin exposure in a ${p.name} (xylitol, rodent bait, grapes, antifreeze, a real dose of chocolate) is a call to a vet or poison control immediately.`,
        `Do not wait for symptoms if a ${p.name} ate xylitol, bait, grapes, or antifreeze.`,
      ],
    ],
    cats: [
      [
        `A male ${p.name} straining in the box and passing little or no urine is an emergency, not constipation.`,
        `Urinary straining in a male ${p.name} can be a blockage. That kills quickly. Go now.`,
      ],
      [
        `Open-mouth breathing or a resting respiratory rate that stays high in a ${p.name} is an emergency.`,
        `A ${p.name} breathing with the mouth open is not purring. Treat it as urgent.`,
      ],
      [
        `A ${p.name} that hides and skips food for more than a day should be examined.`,
        `Appetite loss past a day in a ${p.name}, especially with hiding, is a clinic visit.`,
      ],
      [
        `Repeated vomiting, or vomit with blood, takes a ${p.name} off the home-remedy list.`,
        `Do not fast a vomiting ${p.name} for a heroic length of time. Call.`,
      ],
      [
        `Any lily exposure for a ${p.name} is an emergency even if the cat 'seems fine.'`,
        `Lilies and a ${p.name} do not get a wait-and-see period.`,
      ],
    ],
    birds: [
      [
        `A ${p.name} fluffed on the cage floor is sick until proven otherwise.`,
        `Bottom-of-the-cage posture in a ${p.name} is an avian emergency, not a nap.`,
      ],
      [
        `Tail bobbing with each breath in a ${p.name} means the breathing is too much work.`,
        `Labored breathing in a ${p.name} should be seen the same day.`,
      ],
      [
        `A broken blood feather on a ${p.name} that will not stop bleeding needs pressure and a clinic if it continues.`,
        `Ongoing bleeding on a ${p.name} is not a morning problem.`,
      ],
      [
        `Sudden watery droppings, or no droppings, plus a quiet ${p.name} is a same-day call.`,
        `A ${p.name} that stops eating is already behind. Birds hide illness.`,
      ],
    ],
    reptiles: [
      [
        `A soft jaw or trembling limbs on a ${p.name} points at calcium, vitamin D, and temperatures. See a reptile vet.`,
        `Metabolic bone signs in a ${p.name} (rubbery jaw, shakes) do not get fixed by a new bulb alone after the fact. Go in.`,
      ],
      [
        `No stool plus a swelling belly on a ${p.name} needs a vet, not another meal.`,
        `A bloated ${p.name} that has stopped passing waste is an exam.`,
      ],
      [
        `Blood from the mouth or vent, or tissue protruding from the vent, is an emergency for a ${p.name}.`,
        `A prolapse in a ${p.name} is kept moist and seen immediately. Do not poke it back on a guess.`,
      ],
      [
        `Shed that is cutting a toe or a tail tip on a ${p.name} is urgent once a soak has failed.`,
        `Open-mouth breathing or nose bubbles in a ${p.name} can be a respiratory infection.`,
      ],
    ],
    amphibians: [
      [
        `Red skin, sores, or a sudden heavy slime coat on a ${p.name} should be seen by a vet who treats amphibians.`,
        `Skin that changes color toward red on a ${p.name} is not a mood.`,
      ],
      [
        `A ${p.name} that leaves the water when it should live in it, or the reverse, is telling you the setup or the animal is failing.`,
        `Bloating that lifts a ${p.name} off the ground is a clinic problem.`,
      ],
      [
        `A ${p.name} that had been feeding and then refuses food for a week in correct temperatures needs an exam.`,
        `Do not add a pet-store remedy to a ${p.name} tank and hope.`,
      ],
    ],
    fish: [
      [
        `A ${p.name} gasping at the surface, if the species is not built to breathe air, is a water emergency.`,
        `Surface gasping in a ${p.name} means test oxygen, ammonia, and temperature now.`,
      ],
      [
        `White spots that appear overnight, clamped fins, or flashing on a ${p.name} are a same-day water test and a treatment plan.`,
        `A ${p.name} lying on its side but still breathing needs the water tested before any medicine.`,
      ],
    ],
    "marine-fish": [
      [
        `Fast breathing, white spots, or a ${p.name} hanging in a corner after arrival is a quarantine problem immediately.`,
        `Ragged fins that worsen over a day on a ${p.name} should not go back into a display full of other fish.`,
      ],
    ],
    "small-animals": [
      [
        `A rabbit, guinea pig, or chinchilla — including a ${p.name} — that has not eaten or passed droppings for about 12 hours is an emergency.`,
        `Gut stasis in a ${p.name} does not wait for Monday.`,
      ],
      [
        `Head tilt, or tooth-grinding with a hunched ${p.name}, needs a vet who treats this species.`,
        `Blood in the urine or a ${p.name} that is straining is same-day.`,
      ],
      [
        `A ${p.name} that is cold and limp is an emergency, not a warming-pad experiment you finish alone.`,
        `Heat stress in a ${p.name} (wet chin, sprawled, weak) is urgent.`,
      ],
    ],
  };
  const list = sets[g] || sets.dogs;
  return list.map((options, i) => choose(p.slug, p.salt || 0, `flag${i}`, options));
}

const SUIT = [
  (b, care, kidLine, apt) => `Beginners: a ${b.n} is ${care}. The printed care label is "${b.care || "unlabeled"}." Read housing and diet before you treat that word as permission. Kids: ${kidLine} Apartments: ${apt}`,
  (b, care, kidLine, apt) => `Is a ${b.n} a starter animal? ${care}. Label on the sheet: ${b.care || "none given"}. Children: ${kidLine} Housing: ${apt}`,
  (b, care, kidLine, apt) => `Suitability is three questions. Can a new keeper keep a ${b.n} correctly? Answer from the sheet: ${care}. Can a child be the primary keeper? ${kidLine} Can this be an apartment animal? ${apt}`,
];

const COST_INTRO = [
  (b) => `Money for a ${b.n} in the United States, in recent clinic and pet-retail ranges. These are not quotes. A chronic disease or a coastal city moves the top end.`,
  (b) => `What people actually pay to keep a ${b.n} is below. Purchase price is the small number. Food, prevention, and one bad weekend are the real ones.`,
  (b) => `Budget for a ${b.n} with the table, then add a separate emergency fund. Insurance, where it exists for the species, changes the shape of the risk. It does not erase routine costs.`,
];

const SELLER = [
  (b) => `Before money moves for a ${b.n}, ask what the parents were tested for, what the animal is eating today, and what happens if it is ill in the first two weeks. A seller who will not put feeding and health history in writing is a seller to leave. Rescue animals will not have parents' scores. They should still have an honest medical note.`,
  (b) => `Questions that earn their keep with a ${b.n}: current diet, last weight, last fecal or vet visit, and the specific reason this animal is available. 'Must go today' is pressure, not a discount you are required to take. For dogs and cats, ask about hips, heart, eyes, or the breed's actual tests. For exotics, ask about captive breeding and the temperatures the animal has been kept at.`,
  (b) => `A good ${b.n} source lets you see how the animal is housed and will talk about defects without flinching. Walk away from a room you are not allowed to see, from wild-caught claims shrugged off as 'farm raised,' and from any promise that this species never needs a vet.`,
];

export function voice(p) {
  const b = bag(p);
  const salt = p.salt || 0;
  const seed = p.slug;
  const pick = (id, list) => choose(seed, salt, id, list);
  return {
    b,
    overview: pick("ov", OVERVIEW)(b),
    overview2: pick("ov2", [...OVERVIEW].reverse())(b),
    appear: pick("ap", APPEAR)(b),
    temper: pick("tp", TEMPER)(b),
    life: pick("lf", LIFE)(b),
    diet: dietFor(p, b),
    habitat: habitatFor(p, b),
    handle: handleFor(p, b),
    groom: groomFor(p, b),
    month: monthFor(p, b),
    mistake: mistakeFor(p, b),
    flags: flagsFor(p),
    suitTpl: pick("su", SUIT),
    costIntro: pick("co", COST_INTRO)(b),
    seller: pick("se", SELLER)(b),
    routine: pick("rt", ROUTINE)(b),
  };
}

const ROUTINE = [
  (b) => `A workable week with a ${b.n} is written down. ${b.exercise ? `Exercise or activity on the sheet: ${b.exercise}.` : "Activity happens every day, not when you feel like it."} ${b.diet ? `Food stays ${b.diet}.` : "Food stays the same brand unless a vet changes it."} Weigh or body-score the animal every Sunday. Nails, water, and the enclosure get a look the same day. If appetite drops for more than a day in a mammal, or a reptile that was eating stops while temperatures are correct, you call. You do not restock toys and hope.`,
  (b) => `Monday through Sunday for a ${b.n} should look boring. ${b.life ? `You are protecting a lifespan of ${b.life}.` : "The later years are the point of the boring weeks."} ${b.temperature ? `Check ${b.temperature} with a thermometer, not a hand.` : "Check water, food, and stool instead of guessing mood."} ${b.humid ? `Humidity target ${b.humid} is a gauge reading.` : ""} Write one sentence in a note when something changes. That note is what you read to the vet. It is more useful than a photo of the bowl.`,
  (b) => `Keep a ${b.n} on a clock. Meals at the same times. ${b.exercise ? `The activity commitment is ${b.exercise}.` : "Movement is scheduled."} ${b.size ? `Portions fit ${b.size}, adjusted when the body changes.` : "Portions change when the body changes."} Clean the toilet area before it smells, not after guests comment. Once a month, look at teeth or the equivalent for this species: beak, mouth, or incisors. Once a year, or more often for seniors, a vet who has seen a ${b.n} does the exam you cannot do at the kitchen table.`,
  (b) => `Sunday night is the ${b.n} audit. Food left in the bowl, water film, droppings, and whether the animal used the hide or the bed. ${b.shed ? `Coat check: ${b.shed}.` : "Look at skin, scale, feather, or fur."} Change one thing at a time if something is off. Two changes at once and you will not know which one helped.`,
  (b) => `Travel days are when ${b.n} care falls apart. Pack the usual food, not a new bag from a gas station. ${b.temperature ? `Temperature still has to hit ${b.temperature} in a hotel or a car.` : "Temperature and water still count in a hotel."} A boarded animal needs the same diet written on the form. 'Feed whatever' is how the next vet visit starts.`,
  (b) => `The ${b.n} record that prevents arguments is three numbers: weight, what was eaten, and the last time the animal passed waste. ${b.life ? `Over ${b.life} those numbers matter more than the purchase story.` : "Those numbers matter more than the purchase story."} Keep them in your phone. Read them before you tell a clinic that 'he seems fine.'`,
];

export function shinglesOf(text) {
  const w = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const s = new Set();
  for (let i = 0; i < w.length - 4; i++) s.add(w.slice(i, i + 5).join(" "));
  return s;
}

export function auditVariants() {
  const samples = [];
  const groups = ["dogs", "cats", "birds", "reptiles", "amphibians", "fish", "marine-fish", "small-animals"];
  for (const group of groups) {
    for (let salt = 0; salt < 8; salt++) {
      const p = {
        group, slug: `sample-${group}-${salt}`, salt, name: `Sample ${group} ${salt}`,
        facts: { Origin: "X", Size: "Y", Lifespan: "Z", Temperament: "T", Diet: "D", "Care Level": "C" },
      };
      const v = voice(p);
      samples.push([`${group}:${salt}`, [v.overview, v.appear, v.temper, v.life, v.diet, v.habitat, v.handle, v.groom, v.month, v.mistake, v.seller, ...v.flags].join("\n")]);
    }
  }
  let worst = 0;
  let pair = "";
  for (let i = 0; i < samples.length; i++) {
    for (let j = i + 1; j < samples.length; j++) {
      const A = shinglesOf(samples[i][1]);
      const B = shinglesOf(samples[j][1]);
      let inter = 0;
      for (const x of A) if (B.has(x)) inter++;
      const c = inter / Math.min(A.size, B.size);
      if (c > worst) { worst = c; pair = `${samples[i][0]} vs ${samples[j][0]} (${inter})`; }
    }
  }
  return { worst, pair, n: samples.length };
}
