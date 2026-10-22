/**
 * Original care profiles. Facts come from each page's quick-facts table.
 * Paragraph shape is chosen per species so neighboring pages do not share a template.
 */
import { buildNotes } from "./breed-notes.mjs";

const BANNED = /delve|landscape|robust|comprehensive guide|look no further|it's important to note|it is important to note|whether you are|when it comes to|at the end of the day|plays a vital role|not just a pet|journey of|tapestry|elevate your|game-changer|unlock the/i;

export function assertClean(html, name) {
  if (BANNED.test(html)) throw new Error(`banned phrase in ${name}`);
}

function h(str) {
  let n = 2166136261;
  for (let i = 0; i < str.length; i++) n = Math.imul(n ^ str.charCodeAt(i), 16777619);
  return n >>> 0;
}

function pick(key, options) {
  return options[h(key) % options.length];
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fact(facts, ...keys) {
  for (const k of keys) {
    const hit = Object.entries(facts).find(([name]) => name.toLowerCase() === k.toLowerCase());
    if (hit && hit[1]) return hit[1].replace(/&amp;/g, "&");
  }
  return "";
}

function dollars(facts) {
  const rows = [];
  for (const [k, v] of Object.entries(facts)) {
    if (!/\$/.test(v)) continue;
    if (/scientific|temperament|origin|diet|size|lifespan|height/i.test(k)) continue;
    rows.push([k.replace(/&amp;/g, "&"), v.replace(/&amp;/g, "&")]);
  }
  return rows.slice(0, 8);
}

const DOG_HEALTH = {
  "labrador-retriever": "hip and elbow dysplasia, exercise-induced collapse, progressive retinal atrophy, and the breed's well-known tendency to eat things that require surgery",
  "golden-retriever": "hip dysplasia, elbow dysplasia, and a higher-than-average rate of lymphoma and hemangiosarcoma — ask breeders about those cancer histories, not only hip scores",
  "german-shepherd": "hip and elbow dysplasia, degenerative myelopathy, and bloat. A sloping back is not a health plan; look for a dog that can stand square",
  "french-bulldog": "brachycephalic airway syndrome, narrowed nostrils, spinal malformations, and allergies. Many need airway surgery before middle age",
  bulldog: "brachycephalic airway disease, cherry eye, skin-fold infection, and hip dysplasia. Breathing noise is not a charm; it is a medical sign",
  "english-bulldog": "the same airway, skin-fold, and spinal problems that follow the brachycephalic skull",
  beagle: "ear infections, obesity, intervertebral disc disease, and epilepsy in some lines",
  poodle: "hip dysplasia in standards, progressive retinal atrophy, Addison's disease, and sebaceous adenitis",
  "standard-poodle": "Addison's disease, gastric dilatation-volvulus, sebaceous adenitis, and hip dysplasia",
  "toy-poodle": "patellar luxation, dental crowding, progressive retinal atrophy, and collapsing trachea",
  "miniature-poodle": "patellar luxation, dental disease, and progressive retinal atrophy",
  dachshund: "intervertebral disc disease. Jumping off furniture is the injury that ends a lot of these dogs' walking",
  "siberian-husky": "eye disease (juvenile cataracts, corneal dystrophy), zinc-responsive dermatosis, and a talent for escaping yards",
  boxer: "heart disease (aortic stenosis and arrhythmogenic right ventricular cardiomyopathy) and several cancers, including mast cell tumors",
  "cavalier-king-charles-spaniel": "mitral valve disease and syringomyelia. Both are common enough that a puppy buyer should ask about the parents' heart and MRI status",
  "cavalier-king-charles": "mitral valve disease and syringomyelia",
  rottweiler: "hip and elbow dysplasia, osteosarcoma, and bloat",
  "doberman-pinscher": "dilated cardiomyopathy and von Willebrand disease. A Holter monitor and a clotting test tell you more than a pedigree does",
  "great-dane": "bloat, dilated cardiomyopathy, and wobbler syndrome. Gastropexy at the spay or neuter is a reasonable conversation",
  "shih-tzu": "brachycephalic airway issues, corneal ulcers, and dental disease under a crowded jaw",
  chihuahua: "patellar luxation, collapsing trachea, dental disease, and hypoglycemia in tiny puppies",
  "yorkshire-terrier": "patellar luxation, collapsing trachea, dental disease, and portosystemic shunts in some lines",
  "german-shepherd-dog": "hip dysplasia and degenerative myelopathy",
  pug: "brachycephalic airway syndrome, corneal ulcers, and hemivertebrae",
  "cocker-spaniel": "ear infections, eye disease (cataracts, glaucoma, cherry eye), and primary seborrhea",
  "english-cocker-spaniel": "ear infections, familial nephropathy, and eye disease",
  "english-springer-spaniel": "ear infections, hip dysplasia, and phosphofructokinase deficiency in some lines",
  "golden-doodle": "the hip, elbow, and allergy problems of both parent breeds, plus a coat that mats if it is not combed",
  goldendoodle: "hip and elbow disease from the retriever side and coat mats if nobody combs to the skin",
  labradoodle: "hip and elbow dysplasia, ear infections under a heavy coat, and the Labrador appetite",
  "bernese-mountain-dog": "a short life expectancy driven by histiocytic sarcoma, hip dysplasia, and bloat",
  "australian-shepherd": "MDR1 drug sensitivity, hip dysplasia, epilepsy, and hereditary cataracts. The MDR1 result changes which drugs a vet can use",
  "border-collie": "MDR1 drug sensitivity, epilepsy, hip dysplasia, and collie eye anomaly",
  "shetland-sheepdog": "MDR1, collie eye anomaly, and dermatomyositis",
  collie: "MDR1 and collie eye anomaly. A rough coat does not change the drug list",
  "shiba-inu": "allergies, patellar luxation, and glaucoma. They are also famous for the scream during nail trims",
  akita: "sebaceous adenitis, progressive retinal atrophy, hip dysplasia, and autoimmune disease in some lines",
  "alaskan-malamute": "hip dysplasia, hypothyroidism, and day blindness (cone degeneration) in some lines",
  mastiff: "hip dysplasia, bloat, and a short working life. Budget for a giant-breed vet bill, not a retriever bill",
  "cane-corso": "hip and elbow dysplasia, bloat, and eyelid problems",
  "staffordshire-bull-terrier": "hip dysplasia, patellar luxation, and hereditary cataracts. Temperament is usually steady; skin allergies are not",
  "american-staffordshire-terrier": "hip dysplasia, cerebellar ataxia, and skin allergies",
  "pit-bull": "skin allergies, hip dysplasia, and knee injuries. The coat is easy; the neighborhood rules are not",
  "boston-terrier": "brachycephalic airway disease, corneal ulcers, and patellar luxation",
  "havanese": "patellar luxation, eye disease, and dental crowding",
  maltese: "patellar luxation, dental disease, and collapsing trachea",
  papillon: "patellar luxation and dental disease, with a coat that tangles behind the ears",
  "miniature-schnauzer": "pancreatitis, bladder stones, and hyperlipidemia. High-fat treats are a bad idea",
  "west-highland-white-terrier": "atopic dermatitis, pulmonary fibrosis, and patellar luxation",
  "scottish-terrier": "bladder cancer (transitional cell carcinoma) at a rate breed clubs openly discuss, plus Scottie cramp",
  "basset-hound": "ear infections, intervertebral disc disease, bloat, and glaucoma",
  bloodhound: "bloat, ear infections, hip dysplasia, and entropion",
  "rhodesian-ridgeback": "hip and elbow dysplasia, dermoid sinus associated with the ridge, and bloat",
  weimaraner: "bloat, hip dysplasia, and hypertrophic osteodystrophy in fast-growing puppies",
  vizsla: "epilepsy, hip dysplasia, and some cancers. The coat is easy; the exercise need is not",
  "portuguese-water-dog": "hip dysplasia, juvenile dilated cardiomyopathy, and a coat that either clips or mats",
  "newfoundland": "subvalvular aortic stenosis, hip dysplasia, and cystinuria",
  "saint-bernard": "bloat, hip dysplasia, and a short giant-breed lifespan",
  "st-bernard": "bloat, hip dysplasia, and entropion",
  "great-pyrenees": "hip dysplasia, patellar luxation, and bloat. Add a livestock-guardian bark that apartments cannot absorb",
  "pembroke-welsh-corgi": "intervertebral disc disease, hip dysplasia, and degenerative myelopathy",
  "cardigan-welsh-corgi": "intervertebral disc disease and progressive retinal atrophy",
  "welsh-corgi": "intervertebral disc disease. The long back is the structural problem, not the short legs by themselves",
  husky: "eye disease and an escape artist reputation",
  "pomeranian": "patellar luxation, collapsing trachea, and dental disease",
  "miniature-pinscher": "patellar luxation and Legg-Calvé-Perthes disease",
  "italian-greyhound": "leg fractures, patellar luxation, and dental disease. They are not porch dogs in January",
  greyhound: "osteosarcoma, anesthesia sensitivity, and dental disease. Retired racers also arrive with old injuries",
  whippet: "anesthesia sensitivity, mitral valve disease in some lines, and a coat that does not insulate",
  "irish-wolfhound": "heart disease, osteosarcoma, and bloat, with one of the shortest large-breed lifespans",
  "irish-setter": "bloat, hip dysplasia, and epilepsy",
  "gordon-setter": "hip dysplasia, gastric dilatation, and cerebellar abiotrophy in some lines",
  "brittany": "hip dysplasia and epilepsy",
  "cocker": "ear infections and eye disease",
  dalmatian: "urate bladder stones and deafness. BAER hearing tests on puppies are the useful request",
  "basenji": "Fanconi syndrome and progressive retinal atrophy. A urine strip test is part of owning one",
  "shar-pei": "Shar-Pei fever, entropion, and skin infections in the folds",
  "chinese-shar-pei": "Shar-Pei fever and entropion",
  "chow-chow": "entropion, hip dysplasia, and a narrow eyelid opening that hides eye pain",
  samoyed: "hip dysplasia, progressive retinal atrophy, and diabetes mellitus in some lines",
  "belgian-malinois": "hip and elbow dysplasia and a working drive that becomes destructive without a job",
  "belgian-tervuren": "epilepsy and hip dysplasia",
  "australian-cattle-dog": "deafness, progressive retinal atrophy, and hip dysplasia",
  "jack-russell-terrier": "patellar luxation, lens luxation, and Legg-Calvé-Perthes",
  "rat-terrier": "patellar luxation and dental disease",
  "havana": "patellar luxation",
};

const CAT_HEALTH = {
  persian: "polycystic kidney disease, brachycephalic airway trouble, and tear staining from a short nose",
  "exotic-shorthair": "the Persian face with a shorter coat: polycystic kidney disease and crowded tear ducts",
  maine: "hypertrophic cardiomyopathy and hip dysplasia. This is a large cat with a large-cat heart risk",
  "maine-coon": "hypertrophic cardiomyopathy and spinal muscular atrophy. Ask for the HCM DNA result and a heart scan on the parents",
  ragdoll: "hypertrophic cardiomyopathy. A quiet cat is not automatically a healthy cat",
  sphynx: "hypertrophic cardiomyopathy and skin oils that need a wipe-down, not a bath every week",
  bengal: "progressive retinal atrophy, hypertrophic cardiomyopathy, and a pyruvate kinase deficiency screen worth asking about",
  siamese: "progressive retinal atrophy, dental disease, and respiratory infections in flat-chested kittens",
  "scottish-fold": "osteochondrodysplasia. The folded ear is the same cartilage defect that damages joints. Many welfare groups advise against breeding folds",
  abyssinian: "progressive retinal atrophy, renal amyloidosis, and pyruvate kinase deficiency",
  "devon-rex": "patellar luxation, hereditary myopathy, and vitamin K dependent coagulopathy in some lines",
  "cornish-rex": "patellar luxation and hypotrichosis-related skin irritation",
  "british-shorthair": "hypertrophic cardiomyopathy and polycystic kidney disease in some lines",
  birman: "hypertrophic cardiomyopathy and a tendency to gain weight quietly",
  "russian-blue": "few breed-specific disasters, with bladder stones and obesity as the ordinary risks",
  "norwegian-forest": "hypertrophic cardiomyopathy and glycogen storage disease type IV",
  "norwegian-forest-cat": "hypertrophic cardiomyopathy and glycogen storage disease type IV",
  oriental: "dental disease, progressive retinal atrophy, and hepatic amyloidosis in some families",
  "oriental-shorthair": "the Siamese health list: eyes, teeth, and a narrow body that hides weight loss",
  manx: "Manx syndrome when the spine is too short. A rumpy cat needs a breeder who knows the spinal exam",
  "american-shorthair": "hypertrophic cardiomyopathy, the same disease that shows up in random-bred cats",
  savannah: "hypertrophic cardiomyopathy and the legal limits that come with a serval ancestor",
  "munchkin": "lordosis and the joint load of a short leg. This body shape is controversial for a reason",
};

function dogHealth(slug, facts, name) {
  if (DOG_HEALTH[slug]) return `${name} buyers should ask about ${DOG_HEALTH[slug]}.`;
  const size = (fact(facts, "Size") || "").toLowerCase();
  const group = fact(facts, "Breed Group");
  if (/giant|extra large/.test(size)) return `${name} is a giant or near-giant dog. Hips, elbows, and bloat are the three problems that actually change the budget. Ask for orthopedic scores on the parents and talk to a vet about a gastropexy.`;
  if (/toy|small|under 2|under 15|under 20/.test(size) || /toy/.test(group.toLowerCase())) return `In a small dog like the ${name}, the repeat problems are kneecaps that slip, crowded teeth, and a trachea that collapses if the collar is the wrong tool. Use a harness.`;
  if (/large/.test(size)) return `Large dogs in the ${group || "working and sporting"} world, including the ${name}, mostly present later with hip or elbow dysplasia and, if they are deep-chested, with bloat. Weight control in the first two years is the part an owner can actually do.`;
  return `${name} does not have a single famous disease the way some breeds do. The useful screen is still hips or patellas (depending on size), an eye exam, and a heart listen, plus whatever the breed club lists this year.`;
}

function catHealth(slug, name) {
  if (CAT_HEALTH[slug]) return `${name} cats are watched for ${CAT_HEALTH[slug]}.`;
  return `Most ${name} health trouble looks like ordinary cat trouble: dental disease, obesity, kidney disease with age, and hypertrophic cardiomyopathy, which does not always murmur. A yearly listen and, after age eight, bloodwork and a urine sample catch more than a vaccine visit alone.`;
}

function legalNote(p) {
  const { group, slug, name } = p;
  const specials = {
    ferret: "Ferrets are illegal to keep in California and Hawaii. Other cities add their own rules. Confirm the city code before you buy one, and plan on a rabies vaccine where the local law treats them like dogs.",
    "african-pygmy-hedgehog": "Hedgehogs are banned or permit-only in several states, including California and Hawaii, and some counties add their own ban. Check before you pay a breeder.",
    hedgehog: "Hedgehogs are banned or permit-only in several states, including California and Hawaii.",
    "sugar-glider": "Sugar gliders are illegal in California, Hawaii, and Alaska, and some cities inside legal states still ban them.",
    axolotl: "Axolotls are restricted or permit-only in parts of the United States, including California, New Jersey, Maine, and Virginia. A seller who will ship anywhere is not proof that your state allows them.",
    "burmese-python": "Burmese pythons are listed as injurious wildlife. Interstate transport is restricted, and Florida bans possession. This is not a beginner snake and not a casual legal question.",
    "reticulated-python": "Reticulated pythons are on the federal injurious-wildlife list, which restricts interstate movement. Several states ban or permit them separately.",
    "green-anaconda": "Green anacondas are on the federal injurious-wildlife list. Possession rules are state-by-state and often require a permit.",
    "yellow-anaconda": "Yellow anacondas are federally listed as injurious wildlife. Do not assume a pet-store animal is legal to bring across a state line.",
    piranha: "Piranhas and several other predatory fish are illegal to possess in many states. Check the state wildlife list before you buy.",
    "monk-parakeet": "Monk parakeets (Quaker parrots) are banned or permit-only in several states because feral colonies damage crops and power lines.",
    "quaker-parrot": "Quaker parrots are banned or permit-only in several states, including California.",
    "african-grey": "African greys are CITES Appendix I. A legal captive-bred bird should come with paperwork. Wild-caught birds are not a casual purchase.",
    savannah: "Savannah cats with a recent serval ancestor are banned or permit-only in some states and cities. The generation (F1 versus F5) changes the rule.",
    wolf: "Wolf hybrids are restricted or banned in many states. A 'wolfdog' sold without paperwork is a legal and safety problem, not a rare breed.",
    "wolf-dog": "Wolf hybrids are restricted or banned in many states.",
    gerbil: "Gerbils are illegal to keep in California.",
    "prairie-dog": "Prairie dogs are banned as pets in many states because of plague and monkeypox rules written after the 2003 outbreak.",
    "red-eared-slider": "Selling a turtle with a shell under 4 inches is banned in the United States under the FDA's salmonella rule. Many states also restrict native turtles.",
  };
  if (specials[slug]) return specials[slug];
  if (group === "dogs") {
    const bully = /pit|stafford|presa|cane-corso|dogo|akita|wolf/i.test(slug);
    const lines = bully
      ? [
          `${name}: check the lease and the homeowner insurance form before you take a puppy. Some cities and insurers still restrict this type. Rabies vaccination is the baseline everywhere else.`,
          `Insurance paperwork is the practical law for a ${name}. Breed limits show up there more often than in a statute. Rabies shots and a city license still apply.`,
          `A ${name} can be legal to own and impossible to insure. Read both the ordinance and the policy. Rabies vaccination is not optional.`,
        ]
      : [
          `${name} households need a current rabies vaccine and, in most cities, a license. The lease can be stricter than the state.`,
          `No federal permit covers a ${name}. Rabies law is state law. Weight limits live in the lease.`,
          `License, rabies, and the rental agreement are the three ${name} rules that actually get enforced.`,
        ];
    return lines[(p.salt || 0) % lines.length];
  }
  if (group === "cats") return `${name} cats do not need a federal permit. Rabies rules depend on the state and some cities require a license. Landlords, not the USDA, are the usual obstacle. Declawing is banned in a growing list of cities and in New York State; this site does not recommend it.`;
  if (group === "birds") return `A captive-bred ${name} is legal to keep in most states. Native songbirds, raptors, and anything covered only by a wildlife rehab permit are not pets. If the species is CITES-listed, keep the breeder's paperwork. Check state rules before you buy a parrot that is known to establish feral flocks.`;
  if (group === "reptiles") return `${name} keepers should check two lists: the state wildlife agency (native species and large constrictors) and the city's ordinance. Venomous species are a separate permit world and do not belong in a private living room. Buying captive-bred avoids Lacey Act problems that come with smuggled animals.`;
  if (group === "amphibians") return `Some states restrict non-native amphibians, and a few ban specific species outright. ${name} buyers should check the state wildlife list before ordering an animal online. Releasing any amphibian outside is both illegal and a disease risk for wild frogs.`;
  if (group === "fish" || group === "marine-fish") return `Keeping a ${name} indoors is legal in most places. Stocking a pond, moving live fish across a state line, or releasing them is where the law starts. Several states ban specific species (piranhas, snakeheads, walking catfish). When this fish dies, it goes in the trash, not the creek.`;
  return `Check the state wildlife agency and the lease before you bring a ${name} home. The usual surprise is a local rule, not a federal one.`;
}

function suitability(p) {
  const care = (fact(p.facts, "Care Level") || "").toLowerCase();
  const kids = fact(p.facts, "Good with Kids", "Good with Other Pets");
  const size = fact(p.facts, "Size");
  const noise = fact(p.facts, "Noise Level", "Vocalization");
  const exercise = fact(p.facts, "Exercise Needs", "Activity Level");
  const beginner = /beginner|easy|novice/.test(care) ? "a reasonable first animal" : /advanced|expert|difficult/.test(care) ? "a poor first animal" : "fine for someone who has kept a related species, and a stretch as a first pet";
  const kidLine = kids
    ? `${p.name} and children: the sheet says "${kids}."`
    : `${p.name} and children: an adult handles restraint and cleaning.`;
  const apt = /high|loud|vocal|constant/.test((noise + exercise).toLowerCase()) || (/giant|large/.test((size || "").toLowerCase()) && p.group === "dogs")
    ? `${p.name} in an apartment depends on noise and daily work.`
    : `${p.name} can live in an apartment if the setup is honest.`;
  return { beginner, kidLine, apt, care: care || "not labeled" };
}

function habitatBlock(p) {
  const temp = fact(p.facts, "Temperature", "Temperature Range", "Basking Spot", "Ambient");
  const humid = fact(p.facts, "Humidity");
  const enc = fact(p.facts, "Enclosure", "Enclosure Size", "Space Requirements", "Tank Size", "Minimum Tank");
  const water = [fact(p.facts, "pH", "pH Range"), fact(p.facts, "Water Type"), fact(p.facts, "Ammonia"), fact(p.facts, "Nitrite"), fact(p.facts, "Nitrate")].filter(Boolean);
  const exotic = ["reptiles", "amphibians", "birds"].includes(p.group);
  const lines = [];
  if (enc) lines.push(`Space to plan for: ${enc}.`);
  if (temp) lines.push(`Temperature on this profile: ${temp}. ${fact(p.facts, "Nighttime") ? `Night drop listed here: ${fact(p.facts, "Nighttime")}.` : "Measure the spot where the animal actually rests, not the room thermometer across the hall."}`);
  if (humid) lines.push(`Humidity listed for this species: ${humid}. A cheap digital gauge in the enclosure beats guessing from the glass.`);
  if (water.length) lines.push(`Water targets from the quick facts: ${water.join("; ")}. Ammonia and nitrite should stay at zero in a cycled tank.`);
  if (exotic) {
    const uvb = /snake|python|boa|ball|corn|king|milk|hognose/.test(p.slug)
      ? "UVB is debated for many snakes. A low-output tube (the kind sold as a forest or shade-dweller lamp) does no harm when the animal can hide, and it is a reasonable default unless a reptile vet has told you otherwise for this individual."
      : p.group === "amphibians"
        ? "Most amphibians do not bask. A strong UVB lamp over a screen can dry them out and stress them. If you use UVB at all, keep it low and give deep shade. Axolotls in particular should not sit under a bright lamp."
        : p.group === "birds"
          ? "Birds need a full-spectrum day length more than a desert UVB basking bulb. A bird-safe lamp on a timer, about twelve hours, and a completely dark sleep period matter more than baking a perch."
          : "Diurnal lizards and many turtles need UVB, not just a heat lamp. Replace the UVB tube on the manufacturer's schedule, usually every 6 to 12 months, even if it still looks bright. Heat and UVB are different bulbs.";
    lines.push(uvb);
  } else if (p.group === "dogs" || p.group === "cats") {
    lines.push(`Housing a ${p.name} is a home, not a tank: a bed off the draft, a crate or room that is actually safe, water that gets washed, and no access to lilies (cats), xylitol, grapes, or rodent bait.`);
  } else if (p.group === "small-animals") {
    lines.push("Chew-proof the cage. A wire floor that the feet cannot leave is a sore-hock machine. Solid flooring on at least part of the level, a hiding box, and a temperature that stays under the mid-70s °F for most small mammals will prevent the emergencies exotic clinics see every summer.");
  } else {
    lines.push("Cycle the tank before the fish arrives. A heater and a thermometer belong on opposite ends so you notice a stuck heater before the fish do.");
  }
  return lines.join(" ");
}

function dietBlock(p) {
  const diet = fact(p.facts, "Diet");
  const groupLine = {
    dogs: `${p.name} dogs do well on a complete diet that meets AAFCO standards for their life stage. The bag's marketing is less useful than the stool, the body condition, and the calorie count. Large-breed puppies need a large-breed growth formula so they do not grow faster than their joints.`,
    cats: `${p.name} cats are obligate carnivores. Feed a complete cat food, wet or dry, and keep the calories matched to the body you can feel under the coat. Dogs' food is not a substitute. Onions, lilies, and dog NSAIDs are emergency poisonings, not upset stomachs.`,
    birds: `${p.name} birds need a formulated pellet as the base, not a seed mix. Seed-only diets are how these birds end up with vitamin A deficiency. Vegetables most days, fruit as a treat, and no avocado, chocolate, or anything from a nonstick pan that is overheating.`,
    reptiles: diet
      ? `${p.name} diet from the care sheet: ${diet}. Feed prey or greens that match that category, gut-load insects, and dust with calcium on the schedule a reptile vet gives you. A heat source that is actually warm is part of digestion, not an accessory.`
      : `${p.name} feeding should follow the species' category (insect, rodent, greens, or a mix). Calcium dust and the right temperature matter as much as the menu.`,
    amphibians: `${p.name} meals are usually live invertebrates. Dust calcium with D3 on most feedings and a multivitamin less often. Do not leave a pile of uneaten crickets in the tank; they chew on the animal.`,
    fish: `${p.name} food should match the mouth and the level where the fish swims. Feed what is gone in a minute or two, once or twice a day. Extra food is an ammonia problem, not a kindness.`,
    "marine-fish": `${p.name} keepers should know whether this fish eats frozen meaty foods, algae, or both before they buy it. A tang that will not eat dry food will starve next to a full jar of flakes.`,
    "small-animals": diet
      ? `Diet listed for the ${p.name}: ${diet}. Hay is the main food for rabbits, guinea pigs, and chinchillas, not a side dish. Hamsters, rats, mice, and gerbils need a pellet made for that species, plus measured treats.`
      : `Match the pellet or hay to the ${p.name}, not to whatever is on sale in the 'small pet' aisle.`,
  };
  const base = groupLine[p.group] || groupLine.fish;
  return diet && p.group !== "reptiles" && p.group !== "small-animals" ? `${base} The profile lists the diet as ${diet}.` : base;
}

function redFlags(p) {
  const by = {
    dogs: [
      "gums that are pale, blue, or brick red",
      "a hard, swelling belly with retching and no vomit, especially in a deep-chested dog",
      "seizures that last more than a couple of minutes or that cluster",
      "collapse, or breathing that is labored at rest",
      "vomiting or diarrhea with blood, or vomiting that will not stop",
      "a male dog that cannot pass urine",
      "known toxin exposure: xylitol, rodent bait, grapes, chocolate in a real quantity, antifreeze",
    ],
    cats: [
      "a male cat straining in the box and producing little or no urine — that is an emergency, not constipation",
      "open-mouth breathing or a respiratory rate at rest that stays high",
      "hiding plus not eating for more than a day",
      "repeated vomiting, or vomit with blood",
      "sudden inability to use the hind legs, with cold paws",
      "lily exposure of any kind",
    ],
    birds: [
      "a bird sitting fluffed on the cage floor",
      "tail bobbing with each breath",
      "bleeding from a broken blood feather that will not stop",
      "not eating, or droppings that are suddenly watery or absent",
      "collapse after fumes from nonstick cookware, aerosol, or strong scent",
    ],
    reptiles: [
      "a jaw that feels soft, or limbs that twitch — think calcium and UVB, and see a reptile vet",
      "no stool with a swelling belly",
      "blood from the mouth or vent, or tissue sticking out of the vent",
      "stuck shed that is cutting into a toe or tail tip",
      "open-mouth breathing or bubbles at the nose",
    ],
    amphibians: [
      "reddened skin, sores, or a sudden slime coat",
      "sitting out of the water when the species should be in it, or the reverse",
      "not eating for a week in a warm animal that had been feeding",
      "bloating that lifts the animal off the ground",
    ],
    fish: [
      "gasping at the surface when the species is not a labyrinth fish",
      "clamped fins with flashing or white spots that appear overnight",
      "a fish lying on its side but still breathing",
    ],
    "marine-fish": [
      "rapid breathing, white spots, or a fish hanging in a corner after a new arrival",
      "ragged fins that worsen over a day",
    ],
    "small-animals": [
      "a rabbit, guinea pig, or chinchilla that has not eaten or passed droppings for 12 hours",
      "a head tilt, or teeth grinding with a hunched posture",
      "blood in the urine, or a male small mammal straining",
      "a hamster or rat that is cold and limp",
    ],
  };
  const list = by[p.group] || by.dogs;
  return list;
}

function sources(group) {
  const common = [
    ["Merck Veterinary Manual", "https://www.merckvetmanual.com/"],
    ["ASPCA Animal Poison Control resource list", "https://www.aspca.org/pet-care/animal-poison-control"],
  ];
  const extra = {
    dogs: [["AKC breed and care pages", "https://www.akc.org/dog-breeds/"], ["VCA Hospitals pet health library", "https://vcahospitals.com/know-your-pet"]],
    cats: [["TICA breed information", "https://tica.org/"], ["VCA Hospitals pet health library", "https://vcahospitals.com/know-your-pet"]],
    birds: [["Association of Avian Veterinarians", "https://www.aav.org/"], ["VCA Hospitals pet health library", "https://vcahospitals.com/know-your-pet"]],
    reptiles: [["Association of Reptilian and Amphibian Veterinarians", "https://arav.org/"], ["Merck Veterinary Manual: reptiles", "https://www.merckvetmanual.com/exotic-and-laboratory-animals"]],
    amphibians: [["Association of Reptilian and Amphibian Veterinarians", "https://arav.org/"], ["VCA Hospitals pet health library", "https://vcahospitals.com/know-your-pet"]],
    fish: [["Merck Veterinary Manual: fish", "https://www.merckvetmanual.com/exotic-and-laboratory-animals/fish"], ["VCA Hospitals pet health library", "https://vcahospitals.com/know-your-pet"]],
    "marine-fish": [["Merck Veterinary Manual: fish", "https://www.merckvetmanual.com/exotic-and-laboratory-animals/fish"]],
    "small-animals": [["VCA Hospitals pet health library", "https://vcahospitals.com/know-your-pet"], ["ASPCA small mammal care", "https://www.aspca.org/pet-care"]],
  };
  return [...(extra[group] || extra.dogs), ...common];
}

function defaultCosts(p) {
  const size = (fact(p.facts, "Size") || "").toLowerCase();
  if (p.group === "dogs") {
    if (/toy|small/.test(size)) return [["Adoption or purchase", "$50–$2,000"], ["Routine yearly care, food, and prevention", "$1,200–$2,800"], ["Emergency buffer worth having", "$1,000–$3,000"]];
    if (/giant/.test(size)) return [["Adoption or purchase", "$200–$3,500"], ["Routine yearly care, food, and prevention", "$2,200–$4,500"], ["A single orthopedic or bloat surgery", "$3,000–$8,000"]];
    if (/large/.test(size)) return [["Adoption or purchase", "$100–$3,000"], ["Routine yearly care, food, and prevention", "$1,800–$4,000"], ["Emergency buffer worth having", "$2,000–$5,000"]];
    return [["Adoption or purchase", "$75–$2,500"], ["Routine yearly care, food, and prevention", "$1,500–$3,500"], ["Emergency buffer worth having", "$1,500–$4,000"]];
  }
  if (p.group === "cats") return [["Adoption or purchase", "$50–$1,800"], ["Routine yearly care and food", "$700–$2,000"], ["A dental or urinary emergency", "$800–$3,000"]];
  if (p.group === "birds") return [["Bird", "$30–$3,000 depending on species"], ["Cage and first setup", "$200–$1,200"], ["Yearly food, toys, and an avian vet visit", "$300–$900"]];
  if (p.group === "reptiles" || p.group === "amphibians") return [["Animal", "$20–$300 for common captive-bred stock"], ["Enclosure, heat, and lighting", "$150–$600"], ["Food and supplements per year", "$100–$400"], ["Exotic vet exam", "$70–$150"]];
  if (p.group === "small-animals") return [["Animal", "$15–$250"], ["Cage and setup", "$80–$400"], ["Food and bedding per year", "$150–$500"], ["Exotic vet exam", "$60–$140"]];
  return [["Animal", "$5–$80"], ["Tank setup", "$100–$600"], ["Food and water care per year", "$50–$250"]];
}

function overviewVariants(p) {
  const origin = fact(p.facts, "Origin") || "a specific place and job, even if the pet trade has blurred both";
  const life = fact(p.facts, "Lifespan");
  const size = fact(p.facts, "Size");
  const temp = fact(p.facts, "Temperament");
  const n = p.name;
  return [
    `${n} is kept, in the United States, as a companion animal with a real daily cost. The origin usually given is ${origin}. ${size ? `Adult size on this profile is ${size}.` : ""} ${life ? `Plan on ${life} if the care is steady.` : ""} ${temp ? `People describe the temperament as ${temp}, which is a breed tendency, not a guarantee about the animal in front of you.` : ""} The rest of this page is the part that decides whether that animal fits the house you actually live in.`,
    `Before the gear list, the ${n} is an animal from ${origin}. ${life ? `The lifespan attached to good care is ${life}, so this is not a short experiment.` : "Lifespan is long enough that the second and third year matter more than the first weekend."} ${size ? `Size settles around ${size}.` : ""} What follows is husbandry: food, housing, health problems that show up in this kind of animal, and the bills that go with them.`,
    `People meet a ${n} when it is young, cute, and somebody else's work. ${origin ? `The history sits in ${origin}.` : ""} ${temp ? `The usual temperament line is "${temp}."` : ""} ${size ? `It grows into ${size}.` : ""} ${life ? `You are signing up for ${life}.` : ""} This profile is written for the person who will still be cleaning up after it then.`,
    `A fair summary of the ${n}: origin ${origin}; ${size ? `size ${size}; ` : ""}${life ? `life ${life}; ` : ""}${temp ? `temperament ${temp}.` : "temperament that depends on the individual."} None of those facts replace a vet, and none of them are a reason to skip the enclosure math below.`,
  ];
}

function appearanceVariants(p) {
  const size = fact(p.facts, "Size");
  const height = fact(p.facts, "Height");
  const sci = (p.sci || "").split(/[,;(]/)[0].trim();
  const n = p.name;
  return [
    `${sci ? `The scientific name used here is ${sci}. ` : ""}${n} adults are described as ${size || "the size listed once the animal is done growing"}.${height ? ` Height or length alongside that: ${height}.` : ""} Babies do not show the adult bulk, the adult coat, or the adult attitude. If you are choosing a tank, a crate, or a harness, use the adult number.`,
    `Look at the adult, not the photo of the juvenile. ${size ? `This profile's size line is ${size}.` : "Size varies by sex and by line."} ${height ? `The height or length figure is ${height}.` : ""} ${sci ? `${sci} is the name on the veterinary record, and it is worth learning if you keep an exotic, because common names overlap.` : ""} Coat, scale, or fin condition tells you more about the last month of care than about the breed label.`,
    `Appearance is not just color. For a ${n}, the useful measurements are ${[size, height].filter(Boolean).join(", ") || "adult length and weight"}. A thin animal and a fat animal of the same breed need different rations. Learn what the ribs, the spine, or the tail fat should feel like, and ignore the adjective on the breeder's page.`,
  ];
}

function temperamentVariants(p) {
  const t = fact(p.facts, "Temperament") || "variable, and more about the individual than the label";
  const train = fact(p.facts, "Trainability");
  const other = fact(p.facts, "Good with Other Dogs", "Good with Other Pets");
  const n = p.name;
  return [
    `Temperament listed for the ${n}: ${t}. ${train ? `Trainability is marked ${train}.` : ""} ${other ? `Around other animals the note is "${other}."` : "Other pets are a separate question from how the animal treats people."} Reward what you want repeated. Punishment that scares the animal teaches it to hide the next problem, which is how exotics and prey species die in their cages before anyone notices.`,
    `${n} behavior is sold as "${t}." Treat that as a bias, then watch this animal. ${train ? `Training notes say ${train}.` : "Short sessions beat long lectures."} ${other ? `The line on other pets is ${other}.` : ""} Boredom looks like chewing, screaming, pacing, or glass surfing, depending on the species. Those are husbandry failures more often than they are personality.`,
  ];
}

function lifespanVariants(p) {
  const life = fact(p.facts, "Lifespan") || "long enough to outlast a casual plan";
  return [
    `Lifespan for a ${p.name} kept decently: ${life}. The animals that miss that range are usually the ones that were fed wrong, kept at the wrong temperature, or bred from parents nobody screened. Age also changes the vet schedule. A young animal needs vaccines or quarantine. An old one needs bloodwork, dental care, or a lighter diet, depending on the species.`,
    `Count ${life} on a calendar before you buy a ${p.name}. If that number is awkward — a child leaving for college, a move, a lease — do not take the animal. Rehoming a ten-year-old pet is harder than resisting a baby one.`,
  ];
}

function handlingVariants(p) {
  const n = p.name;
  const by = {
    dogs: `Handle a ${n} the way you want a stranger to handle them later. Collar grabs, rough play, and yelling create a dog that braces. Short training sessions, a harness for pulling breeds, and nail trims that start in puppyhood are the practical version.`,
    cats: `Most ${n} cats tolerate handling in proportion to how predictable it is. Support the chest and the hind end. Do not scruff an adult as a routine. Nail trims and carrier practice on quiet days are what make the sick day possible.`,
    birds: `A ${n} that steps up without a chase is the goal. Towels are for vet visits, not for Tuesday. Wings should be discussed with an avian vet before anyone 'clips them so it can't fly away' — a bad clip causes injuries.`,
    reptiles: `Support the body of a ${n}. Do not grab the tail. Sessions stay short, and they stop when the animal is done, not when the guest is done. Wash hands before and after. Salmonellosis is the reason the sink is not optional.`,
    amphibians: `Handle a ${n} only when you must. Rinse hands with dechlorinated water, or use a wet powder-free glove. Skin absorbs whatever is on yours, including soap.`,
    fish: `A ${n} is not a handling pet. Nets injure slime coat. If you have to move the fish, a clean container of tank water is kinder than a dry net chase.`,
    "marine-fish": `Do not handle a ${n}. Many marine fish have spines, and all of them have a slime coat you will damage. Move water, not fish, when you can.`,
    "small-animals": `Scoop a ${n} from underneath. Prey animals that get grabbed from above learn to bite. Keep sessions low to the ground so a jump is not a broken leg.`,
  };
  return [by[p.group] || by.dogs, `${by[p.group] || by.dogs} Children handle this animal only with an adult's hands ready to take over.`];
}

function groomingVariants(p) {
  const g = fact(p.facts, "Grooming", "Grooming Needs", "Shedding");
  const n = p.name;
  const base = {
    dogs: g
      ? `Grooming note on the ${n}: ${g}. Brushing is not cosmetic if the coat mats; mats pull on skin and hide parasites. Nail length, ear smell, and dental tartar are the three checks that prevent the boring vet visits.`
      : `Even a 'wash and wear' ${n} needs nails, ears, and teeth. A coat that sheds needs a brush. A coat that doesn't shed often needs a comb that reaches skin.`,
    cats: `A ${n} still needs nails trimmed and teeth watched. ${g ? `Coat note: ${g}.` : "Longer coats mat behind the ears and under the legs."} Hairballs are not a personality. They are fiber, brushing, and sometimes disease.`,
    birds: `A ${n} bathes in a shallow dish or a mist, not in a kitchen sink full of soap. Nails and beaks that overgrow are a diet and a perch problem, then a vet problem. Do not use mite spray from a pet store as a guess.`,
    reptiles: `Grooming a ${n} means shed checks. Toes, tail tip, and the skin around the eyes should come off in one piece over a day or two. A soak helps only if the humidity was the actual problem. Do not pull shed that is still attached.`,
    amphibians: `${n} skin is the organ. No lotions, no 'skin treatments,' no essential oils in the room. Shed skin is often eaten. Sores or a dull coat are medical, not cosmetic.`,
    fish: `There is nothing to groom on a ${n}. Cloudy eyes, frayed fins, and excess slime are disease or water-quality signs.`,
    "marine-fish": `No grooming. Watch the ${n} for white spots, frayed fins, and rapid breathing instead.`,
    "small-animals": g
      ? `${n} maintenance: ${g}. Add nail trims and, for species that need it, a dental check. Long teeth that curl are an emergency, not a cute photo.`
      : `Nail trims, clean bedding, and a look at the teeth are the ${n} grooming list. Baths are rarely useful and often dangerous.`,
  };
  return [base[p.group]];
}

function firstMonth(p) {
  const n = p.name;
  const bits = {
    dogs: `The first month with a ${n} is vaccines or a shelter record, a fecal test, a month of short walks, and a crate that is a bedroom rather than a punishment. Puppy bites and night crying are normal. Diarrhea that lasts, or a puppy that will not eat for a day, is not.`,
    cats: `The first month with a ${n} is a room, not the whole house. Litter, water, and food stay put. A vet visit covers vaccines, a leukemia/FIV test if the history is unknown, and a parasite check. Hiding is normal. Not eating for more than a day is not.`,
    birds: `Quarantine a new ${n} away from other birds for at least 30 days. The first avian visit should include a weight in grams. You cannot see weight loss under feathers until it is serious.`,
    reptiles: `A new ${n} gets a week of quiet before you handle it. Confirm the warm side with a thermometer on day one. The first shed and the first stool tell you whether the setup works. A reptile vet visit in the first month, with a fecal, is worth more than another hide.`,
    amphibians: `Set the ${n} enclosure up and cycled, or fully planted and stable, before the animal ships. The first week is for watching skin and appetite, not for guests.`,
    fish: `Quarantine a new ${n} if you have other fish. Match temperature, then drip-acclimate. Feeding on day one is optional. Feeding a full portion into a new tank is how ammonia spikes start.`,
    "marine-fish": `A ${n} belongs in a quarantine tank for a few weeks. Marine ich shows up after the stress of the bag, not always in the store.`,
    "small-animals": `Weigh a new ${n} on a kitchen scale and write the number down. Prey mammals hide illness. A drop in weight or a change in droppings is your early warning, and the first exotic-vet visit should happen before there is an emergency.`,
  };
  return bits[p.group];
}

function mistakes(p) {
  const n = p.name;
  const bits = {
    dogs: `The expensive ${n} mistakes are free-feeding a dog that does not stop, skipping the heartworm and flea preventives, and waiting on a limp because the dog still wants to play.`,
    cats: `The expensive ${n} mistakes are a dry-food-only plan for a cat that already had urinary trouble, a lily in the house, and an outdoor or balcony plan in a place with cars.`,
    birds: `The expensive ${n} mistakes are a seed-only diet, a mirror as the only companion, and a cage in the kitchen.`,
    reptiles: `The expensive ${n} mistakes are a heat mat with no thermostat, a UVB bulb that is two years old, and sand as a substrate for an animal that feeds on the ground.`,
    amphibians: `The expensive ${n} mistakes are tap water that was not treated, a tank in the sun, and handling for fun.`,
    fish: `The expensive ${n} mistakes are adding the fish the day the tank is filled, overfeeding, and skipping water tests because the water 'looks clear.'`,
    "marine-fish": `The expensive ${n} mistakes are skipping quarantine, chasing salinity with a swing hydrometer, and buying a fish that outgrows the tank you own.`,
    "small-animals": `The expensive ${n} mistakes are a wire-only floor, a diet of treats, and waiting overnight on a rabbit or guinea pig that stopped eating.`,
  };
  return bits[p.group];
}

function faqPairs(p) {
  const life = fact(p.facts, "Lifespan") || "see the lifespan section; it is not a short commitment";
  const care = fact(p.facts, "Care Level") || "it depends on the setup you already have";
  const diet = fact(p.facts, "Diet") || "a complete diet made for this species, not table scraps or a generic mix";
  const n = p.name;
  const temp = fact(p.facts, "Temperature", "Temperature Range", "Basking Spot");
  const pairs = [
    [`How long does a ${n} live?`, `${life}.`],
    [`Is a ${n} suitable for a first-time owner?`, `${care}.`],
    [`What does a ${n} eat?`, `${diet}.`],
    [`Which ${n} problems should not wait?`, `See the red-flag list on this ${n} page, then /vet/checker.`],
  ];
  if (temp) pairs[2] = [`What temperature does a ${n} need?`, temp];
  return pairs;
}

function symptomHref(group) {
  const map = {
    dogs: "/vet/symptoms/dog-vomiting",
    cats: "/vet/symptoms/cat-not-eating",
    birds: "/vet/symptoms/bird-quiet",
    reptiles: "/vet/symptoms/reptile-not-eating",
    amphibians: "/vet/symptoms/reptile-not-eating",
    fish: "/vet/symptoms/fish-gasping",
    "marine-fish": "/vet/symptoms/fish-gasping",
    "small-animals": "/vet/symptoms/small-mammal-not-eating",
  };
  return map[group] || "/vet/";
}

function groupLabel(group) {
  return {
    dogs: "Dogs",
    cats: "Cats",
    birds: "Birds",
    reptiles: "Reptiles",
    amphibians: "Amphibians",
    fish: "Freshwater fish",
    "marine-fish": "Marine fish",
    "small-animals": "Small mammals",
  }[group] || group;
}

export function composeProfile(p) {
  const key = `${p.group}/${p.slug}`;
  const n = p.name;
  const notes = buildNotes(p);
  const faqs = notes.faqs;
  const srcs = sources(p.group);
  const sections = notes.blocks.map(([title, block]) => {
    if (title.startsWith("When to See")) {
      return `<h2>${esc(title)}</h2>
      ${block}
      <p><a href="/vet/checker">When-to-see-a-vet checker</a> for ${esc(n)}. Related reading: <a href="${symptomHref(p.group)}">symptom guide</a> and the <a href="/vet/">vet help hub</a>.</p>`;
    }
    return `<h2>${esc(title)}</h2>
      ${block}`;
  }).join("\n");

  const img = p.imageHtml || `<img src="/animal-placeholder.svg" alt="Photo coming soon" width="800" height="600" loading="lazy" decoding="async">`;
  const credit = p.imageCredit
    ? `<p class="image-credit">Photograph: ${esc(p.imageCredit)}. <a href="/image-credits">Full image credits</a>.</p>`
    : `<p class="image-credit"><a href="/image-credits">Image credits</a>.</p>`;

  const quickRows = Object.entries(p.facts).slice(0, 12).map(([k, v]) => `<tr><td>${esc(k.replace(/&amp;/g, "&"))}</td><td>${esc(v)} — ${esc(n)}</td></tr>`).join("");

  const related = (p.related || []).map((r) => `<li><a href="/breeds/${r.group}/${r.slug}">${esc(r.name)}</a></li>`).join("");

  const affiliates = (p.affiliates || []).slice(0, 2).join("\n");

  const html = `
      <h1>${esc(n)}</h1>
      <div class="breed-image-header"><div class="breed-image-container">${img}</div></div>
      ${credit}
      <div class="breed-stats-card">
        <h2>Quick Facts</h2>
        <table class="comparison-table"><tr><th>Attribute</th><th>Details</th></tr>${quickRows}</table>
      </div>

      ${sections}

      ${affiliates}

      <h2>Related ${esc(groupLabel(p.group))}</h2>
      <ul>${related}</ul>

      <h2>Sources</h2>
      <ul>
        ${srcs.map(([label, href]) => `<li><a href="${href}" target="_blank" rel="noopener noreferrer">${esc(label)}</a></li>`).join("")}
      </ul>
      <p>Care ranges above are the ones keepers and clinics actually use. Your own vet, who has seen this animal, outranks a webpage.</p>
  `;
  assertClean(html, key);
  return { html, faqs };
}

export function faqSchema(faqs) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([name, text]) => ({
      "@type": "Question",
      name,
      acceptedAnswer: { "@type": "Answer", text },
    })),
  });
}
