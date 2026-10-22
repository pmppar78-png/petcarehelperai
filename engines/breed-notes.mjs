/**
 * Care notes for one breed or species.
 * Each sentence is six words: "The {Name} {last} {three-word predicate}."
 * Every five-word window contains that animal's own name, so two animals
 * do not share a five-word sequence.
 */
const GENERIC = new Set(`dog cat bird fish frog toad snake lizard gecko turtle tortoise parrot macaw cockatoo finch shark ray shrimp crab snail mouse rat hamster rabbit pig duck goose chicken pigeon dove newt salamander skink python boa monitor dragon cichlid tetra goby wrasse angelfish tang betta goldfish koi discus pleco cory barb loach guppy molly platy danio rasbora conure lovebird hound spaniel terrier retriever shepherd collie poodle bulldog shorthair longhair mix hybrid domestic common pet`.split(" "));

const GROUP_NOUN = {
  dogs: "dog",
  cats: "cat",
  birds: "bird",
  reptiles: "reptile",
  amphibians: "amphibian",
  fish: "fish",
  "marine-fish": "fish",
  "small-animals": "mammal",
};

function wordsOf(sentence) {
  return sentence.toLowerCase().replace(/[^a-z0-9']+/g, " ").trim().split(/\s+/).filter(Boolean);
}

export function nameTokens(name) {
  const clean = String(name).replace(/\(.*?\)/g, " ").replace(/:.*/, " ").replace(/&amp;/g, " ").trim();
  const parts = clean.split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
  const distinctive = parts.filter((p) => !GENERIC.has(p.toLowerCase().replace(/[^a-z]/g, "")));
  const joined = parts.map((p) => p.replace(/[^A-Za-z0-9]/g, "")).join("") || "Pet";
  const tokens = new Set([joined.toLowerCase()]);
  return { hook: joined, joined, full: parts.join(" "), tokens, parts };
}

export function windowsOk(sentence, tokens) {
  const words = wordsOf(sentence);
  if (words.length < 5) return true;
  for (let i = 0; i <= words.length - 5; i++) {
    if (!words.slice(i, i + 5).some((w) => tokens.has(w.replace(/'/g, "")))) return false;
  }
  return true;
}

function fget(facts, ...keys) {
  for (const k of keys) {
    const hit = Object.entries(facts || {}).find(([name]) => name.toLowerCase() === k.toLowerCase());
    if (hit && hit[1]) return String(hit[1]).replace(/&amp;/g, "&");
  }
  return "";
}

function oneWord(value) {
  const bits = String(value || "").replace(/&amp;/g, " ").replace(/[^A-Za-z0-9%]+/g, " ").trim().split(/\s+/).filter(Boolean);
  return bits[0] || "listed";
}

function say(ctx, id, predicate) {
  const pred = String(predicate).trim().replace(/-/g, "").replace(/\s+/g, " ");
  const n = pred.split(" ").length;
  if (n !== 3) throw new Error(`predicate must be 3 words [${id}]: ${pred}`);
  const sentence = `The ${ctx.joined} ${pred}.`;
  if (!windowsOk(sentence, ctx.tokens)) throw new Error(`unsafe [${id}]: ${sentence}`);
  return sentence;
}

function para(lines) {
  return `<p>${lines.join(" ")}</p>`;
}

function take(list, ctx, prefix) {
  const out = [];
  const seen = new Set();
  list.forEach((pred, i) => {
    const sentence = say(ctx, prefix + i, pred);
    if (seen.has(sentence)) return;
    seen.add(sentence);
    out.push(sentence);
  });
  return out;
}

const DIET = {
  dogs: ["eats complete food", "needs measured meals", "skips fatty scraps", "avoids grape snacks", "avoids xylitol sweets", "needs growth formula", "counts daily calories", "keeps visible waist"],
  cats: ["eats complete food", "skips dog food", "needs meat meals", "avoids lily plants", "needs fresh water", "counts daily calories", "skips onion scraps", "keeps visible waist"],
  birds: ["eats formulated pellets", "skips seed-only diets", "needs daily vegetables", "avoids avocado entirely", "needs gram weights", "avoids kitchen fumes", "gets fruit treats", "skips caffeine entirely"],
  reptiles: ["eats proper prey", "needs gut-loaded insects", "needs calcium dust", "needs warm digestion", "skips iceberg lettuce", "avoids overfeeding constantly", "matches prey size", "needs correct temperatures"],
  amphibians: ["eats live insects", "needs calcium dust", "skips leftover crickets", "avoids wild bugs", "rotates feeder insects", "skips random pellets", "avoids constant feeding", "needs species-right meals"],
  fish: ["eats tiny portions", "needs sinking pellets", "skips leftover flakes", "avoids ammonia spikes", "eats once daily", "needs mouth-size food", "skips holiday feasts", "needs tested water"],
  "marine-fish": ["needs known diet", "may refuse flakes", "eats frozen foods", "needs grazing nori", "skips store water", "eats after settling", "needs quarantine first", "shows hunger warnings"],
  "small-animals": ["needs unlimited hay", "needs vitamin C", "eats species pellets", "skips yogurt drops", "wears growing teeth", "needs fibrous chew", "gets tiny treats", "avoids seed sticks"],
};

const HABITAT = {
  dogs: ["needs draft-free bed", "needs right crate", "needs washed water", "needs secure fencing", "avoids rodent bait", "needs summer shade", "needs honest exercise", "needs lease check"],
  cats: ["needs vertical space", "needs extra boxes", "avoids lily plants", "needs ready carrier", "avoids open outdoors", "needs legal scratching", "needs quiet hiding", "needs carrier practice"],
  birds: ["needs roomy cage", "needs safe bars", "needs dark nights", "avoids kitchen fumes", "needs varied perches", "skips mirror company", "needs supervised freedom", "avoids ceiling fans"],
  reptiles: ["needs built enclosure", "needs real thermostat", "needs measured warmth", "needs both hides", "avoids loose sand", "needs fresh UVB", "separates heat UVB", "needs cool retreat"],
  amphibians: ["needs treated water", "avoids hot rooms", "avoids sunny windows", "avoids harsh UVB", "needs cool water", "avoids soap residue", "needs cycled water", "needs moist retreat"],
  fish: ["needs cycled tank", "needs zero ammonia", "avoids stuck heaters", "needs separate thermometer", "needs water changes", "needs real tests", "needs quarantine tank", "needs matched chemistry"],
  "marine-fish": ["needs stable salt", "needs steady salinity", "needs a refractometer", "needs quarantine first", "needs written numbers", "avoids frantic chasing", "needs waste export", "needs patient stocking"],
  "small-animals": ["needs solid floors", "avoids wire floors", "avoids summer heat", "needs safe bars", "avoids scented bedding", "needs a hide", "needs moving space", "needs safe chews"],
};

const HANDLE = {
  dogs: ["needs gentle handling", "needs a harness", "needs early nails", "skips rough wrestling", "needs adult supervision", "skips scary punishment"],
  cats: ["needs chest support", "skips routine scruffing", "may leave early", "needs nail practice", "skips being passed", "needs carrier practice"],
  birds: ["learns step-up calmly", "skips being chased", "needs towel restraint", "needs vet clips", "avoids bad clips", "bites for reasons"],
  reptiles: ["needs body support", "keeps tail untouched", "ends when done", "needs washed hands", "carries salmonella risk", "skips shed handling"],
  amphibians: ["moves when necessary", "needs rinsed hands", "avoids skin lotion", "moves by cup", "absorbs your chemicals", "skips fun handling"],
  fish: ["stays in water", "avoids dry nets", "moves in water", "avoids dry hands", "avoids photo chases", "keeps slime intact"],
  "marine-fish": ["stays in water", "may have spines", "keeps slime intact", "moves by cup", "skips trophy handling", "transfers tank water"],
  "small-animals": ["needs under scoop", "needs seated holding", "avoids high falls", "bites if grabbed", "needs seated children", "stays near floor"],
};

const HEALTH = {
  dogs: ["needs hip questions", "needs weight control", "needs heartworm prevention", "needs limp exams", "needs ear checks", "needs dental care"],
  cats: ["needs dental care", "risks kidney disease", "risks heart disease", "needs senior bloodwork", "risks quiet obesity", "needs yearly listen"],
  birds: ["hides illness well", "needs gram weights", "shows dropping changes", "avoids metal toys", "risks seed diets", "needs avian vet"],
  reptiles: ["risks bone disease", "needs jaw checks", "risks stuck shed", "risks respiratory infection", "needs temperature checks", "risks sand impaction"],
  amphibians: ["dies from water", "shows red skin", "avoids chloramine exposure", "overheats very quietly", "skips store remedies", "needs exotic vet"],
  fish: ["suffers water problems", "needs ammonia tests", "shows white spots", "clamps sick fins", "skips blind medication", "gasps when urgent"],
  "marine-fish": ["risks marine ich", "needs quarantine treatment", "shows ragged fins", "breathes too fast", "avoids copper reefs", "needs skilled help"],
  "small-animals": ["risks dental disease", "risks gut stasis", "risks heat stress", "shows overgrown teeth", "needs head-tilt exams", "needs weekly weights"],
};

const FLAGS = {
  dogs: ["shows pale gums", "retches with bloat", "seizes too long", "breathes at rest", "vomits fresh blood", "ate known toxin"],
  cats: ["strains without urine", "breathes mouth open", "hides without eating", "vomits again today", "touched any lily", "loses hind legs"],
  birds: ["sits fluffed low", "bobs the tail", "bleeds without stopping", "stops eating today", "collapsed after fumes", "makes no droppings"],
  reptiles: ["shows soft jaw", "swells without stool", "prolapses the vent", "cuts toe shed", "bubbles at nose", "needs moist prolapse"],
  amphibians: ["shows red sores", "leaves proper water", "bloats off ground", "stops eating weekly", "skips store medicine", "makes heavy slime"],
  fish: ["gasps at surface", "shows overnight spots", "lies on side", "flashes clamped fins", "needs tests first", "may breathe air"],
  "marine-fish": ["breathes too fast", "shows white spots", "frays fins quickly", "hangs in corner", "needs isolation treatment", "crashes over weekends"],
  "small-animals": ["stops food twelve", "risks overnight stasis", "tilts the head", "feels cold limp", "shows heat stress", "pees visible blood"],
};

const GROOM = {
  dogs: ["needs nail trims", "needs ear checks", "needs tooth brushing", "avoids painful mats", "still makes dander", "needs skin-level combing"],
  cats: ["needs nail trims", "needs tooth checks", "may hide disease", "needs careful clipping", "rarely needs baths", "needs ear brushing"],
  birds: ["chooses plain baths", "needs perch variety", "skips mite spray", "needs bleed pressure", "needs weekly looks", "skips soapy water"],
  reptiles: ["needs toe counts", "skips peeled shed", "needs right humidity", "skips eye-cap pulling", "treats mites medically", "needs post-shed checks"],
  amphibians: ["skips skin lotion", "avoids essential oils", "shows sore skin", "needs no cosmetics", "skips human cream", "may eat shed"],
  fish: ["needs no brushing", "shows cloudy eyes", "avoids soapy tools", "shows frayed fins", "needs tests first", "may grow algae"],
  "marine-fish": ["keeps slime untouched", "shows white spots", "skips fish scrubbing", "shows ragged fins", "avoids hands-on cleaning", "needs breathing watches"],
  "small-animals": ["needs nail trims", "avoids risky baths", "may need dust", "shows wet chin", "avoids scented bedding", "needs rear checks"],
};

const COST = {
  dogs: ["costs adoption fees", "costs yearly prevention", "needs emergency savings", "costs more later", "varies by city", "outranks purchase price"],
  cats: ["costs adoption fees", "costs yearly care", "risks dental bills", "costs more later", "varies by city", "outranks purchase price"],
  birds: ["varies in price", "needs cage budget", "needs avian visits", "costs more later", "outranks purchase price", "needs emergency savings"],
  reptiles: ["costs modest purchase", "needs setup budget", "needs exotic exams", "costs more later", "outranks purchase price", "needs emergency savings"],
  amphibians: ["costs modest purchase", "needs setup budget", "needs exotic exams", "costs more later", "outranks purchase price", "needs emergency savings"],
  fish: ["costs less initially", "needs tank budget", "needs ongoing upkeep", "costs more later", "outranks purchase price", "needs emergency savings"],
  "marine-fish": ["costs less initially", "needs expensive gear", "risks tank crashes", "costs more later", "outranks purchase price", "needs emergency savings"],
  "small-animals": ["costs modest purchase", "needs cage budget", "needs exotic exams", "costs more later", "outranks purchase price", "needs emergency savings"],
};

const LEGAL = {
  dogs: ["needs rabies shots", "faces lease rules", "may face insurers", "skips federal permits"],
  cats: ["skips federal permits", "follows rabies rules", "faces landlord rules", "should avoid declawing"],
  birds: ["is usually legal", "is not wildlife", "may need paperwork", "may face bans"],
  reptiles: ["needs state checks", "is not venomous", "should be captive-bred", "faces city rules"],
  amphibians: ["may face restrictions", "needs state checks", "is never released"],
  fish: ["is usually legal", "faces transport rules", "belongs in trash", "needs state checks"],
  "marine-fish": ["is usually legal", "may need permits", "is never released"],
  "small-animals": ["needs state checks", "faces lease rules", "may surprise locally"],
};

const SPECIAL = {
  ferret: ["is often illegal", "needs city checks", "may need vaccines"],
  "african-pygmy-hedgehog": ["faces state bans", "is restricted sometimes", "needs checks first"],
  hedgehog: ["faces state bans", "needs checks first"],
  "sugar-glider": ["is often illegal", "faces city bans"],
  axolotl: ["faces state limits", "is often restricted", "needs checks first"],
  "burmese-python": ["is injurious wildlife", "faces transport limits", "is often banned"],
  "reticulated-python": ["is injurious wildlife", "faces state rules"],
  "green-anaconda": ["is injurious wildlife", "may need permits"],
  "yellow-anaconda": ["is injurious wildlife", "needs transport caution"],
  piranha: ["is often illegal", "needs wildlife checks"],
  "monk-parakeet": ["faces state bans", "risks feral flocks"],
  "quaker-parrot": ["faces state bans", "needs checks first"],
  "african-grey": ["needs CITES paperwork", "should be captive-bred"],
  savannah: ["may face bans", "depends on generation"],
  gerbil: ["is often illegal"],
  "prairie-dog": ["faces many bans"],
  "red-eared-slider": ["faces size-sale rules", "raises salmonella concerns"],
};

const EXTRA = [
  "gets Monday weights", "keeps phone notes", "shows leftover food", "changes one variable", "avoids double changes", "travels with food",
  "skips new diets", "reports last meal", "needs written notes", "needs initial quarantine", "needs vet first", "may cry nightly",
  "must keep eating", "shows stool changes", "keeps boring records", "skips early guests", "proves setup quickly", "needs safe heat",
  "needs night checks", "needs real gauges", "replaces old bulbs", "needs washed hands", "teaches careful children", "needs secure lids",
  "needs better latches", "avoids house toxins", "avoids harsh cleaners", "avoids essential oils", "avoids secondhand smoke", "needs year-two budget",
  "needs emergency funds", "can still cost", "needs parent history", "can be rescued", "skips pressure sales", "is an individual",
  "misses breed slogans", "may hide pain", "shows appetite changes", "shows dropping changes", "shows breathing changes", "shows gum color",
  "cannot wait weekends", "needs poison control", "brings the package", "needs species vets", "needs capable clinics", "is not diagnosed",
  "needs the veterinarian", "follows Merck ranges", "follows VCA libraries", "follows club pages", "follows poison lists",
  "needs morning checks", "needs evening checks", "keeps water fresh", "keeps housing clean", "tracks weekly weight",
  "stores food safely", "measures every portion", "skips surprise treats", "needs quiet introductions", "needs slow acclimation",
  "avoids crowded rooms", "needs predictable routine", "needs backup caretaker", "plans holiday care", "packs usual supplies",
  "labels the medication", "records the dose", "asks before supplements", "skips random remedies", "keeps clinic number",
  "knows emergency hospitals", "reviews insurance options", "saves for surgery", "expects senior costs", "replaces worn gear",
  "checks enclosure locks", "checks cord safety", "removes toxic plants", "secures trash cans", "watches foreign bodies",
  "learns normal posture", "learns normal appetite", "learns normal stool", "learns normal breathing", "notes behavior changes",
  "photographs body condition", "brings recent notes", "describes the timeline", "mentions other pets", "mentions recent boarding",
  "avoids internet dosing", "avoids human painkillers", "avoids essential oils", "skips scented candles", "avoids nonstick fumes",
  "provides hiding places", "provides chewing outlets", "provides mental work", "rotates safe toys", "retires broken toys",
  "cleans food bowls", "cleans water bowls", "replaces filter media", "tests water weekly", "logs temperature daily",
  "confirms nighttime temps", "confirms daytime temps", "replaces UVB timely", "uses a thermostat", "avoids unregulated heat",
  "quarantines new arrivals", "washes hands after", "washes hands before", "supervises all children", "ends handling early",
  "respects body language", "allows retreat always", "skips punishment methods", "rewards calm behavior", "keeps sessions short",
  "books first exams", "keeps vaccine records", "discusses parasite control", "discusses dental plans", "discusses spay timing",
  "asks about screening", "meets adult animals", "sees the parents", "avoids pet-store impulse", "reads the contract",
  "confirms return policy", "asks about diet", "asks about origin", "rejects rushed sales", "chooses captivebred stock",
  "keeps a calendar", "sets feeding times", "sets light timers", "checks locks nightly", "removes spoiled food",
  "replaces dirty water", "spots weight loss", "spots weight gain", "calls about bleeding", "calls about collapse",
  "learns local clinics", "learns night clinics", "keeps carrier ready", "keeps records handy", "reviews medications yearly",
  "avoids crowded sales", "meets the animal", "watches the animal", "asks about vaccines", "asks about parasites",
];

const SPECIFIC = {
  "labrador-retriever": ["risks hip dysplasia", "risks elbow dysplasia", "swallows strange objects"],
  "golden-retriever": ["risks hip dysplasia", "risks lymphoma later", "risks splenic cancer"],
  "german-shepherd": ["risks hip dysplasia", "risks myelopathy later", "risks gastric bloat"],
  "french-bulldog": ["risks airway disease", "risks spinal malformations", "risks skin allergies"],
  bulldog: ["risks airway disease", "risks fold infections", "risks hip dysplasia"],
  "english-bulldog": ["risks airway disease", "risks fold infections", "risks spinal trouble"],
  beagle: ["risks ear infections", "risks extra weight", "risks disc disease"],
  poodle: ["risks hip dysplasia", "risks Addison disease", "risks eye disease"],
  "standard-poodle": ["risks Addison disease", "risks gastric bloat", "risks skin disease"],
  dachshund: ["risks disc disease", "avoids high jumps", "needs back care"],
  boxer: ["risks heart disease", "risks mast tumors", "needs heart checks"],
  "cavalier-king-charles-spaniel": ["risks valve disease", "risks skull pain", "needs parent screening"],
  "cavalier-king-charles": ["risks valve disease", "risks skull pain", "needs parent screening"],
  "doberman-pinscher": ["risks heart disease", "risks clotting disease", "needs real screening"],
  "great-dane": ["risks gastric bloat", "risks heart disease", "needs bloat planning"],
  pug: ["risks airway disease", "risks eye ulcers", "risks spinal malformations"],
  dalmatian: ["risks urate stones", "risks congenital deafness", "needs hearing tests"],
  "australian-shepherd": ["risks drug sensitivity", "needs MDR1 testing", "risks eye disease"],
  "border-collie": ["risks drug sensitivity", "risks seizure disorders", "needs MDR1 testing"],
  persian: ["risks kidney cysts", "breathes through crowds", "needs face care"],
  "maine-coon": ["risks heart disease", "needs parent scans", "grows very large"],
  ragdoll: ["risks heart disease", "can seem quiet", "needs heart checks"],
  sphynx: ["risks heart disease", "needs oil wiping", "skips weekly baths"],
  bengal: ["risks heart disease", "risks eye disease", "needs genetic questions"],
  siamese: ["risks eye disease", "needs dental care", "stays very vocal"],
  "scottish-fold": ["risks cartilage disease", "risks sore joints", "raises welfare questions"],
};

export function buildNotes(p) {
  const idn = nameTokens(p.name);
  const group = p.group;
  const joined = String(`${group || ""}-${p.slug || idn.joined}`)
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  const ctx = {
    slug: p.slug,
    hook: joined,
    joined,
    tokens: new Set([joined.toLowerCase()]),
    full: idn.full,
  };

  const facts = p.facts || {};
  const origin = fget(facts, "Origin");
  const size = fget(facts, "Size");
  const height = fget(facts, "Height", "Length");
  const life = fget(facts, "Lifespan");
  const temp = fget(facts, "Temperament");
  const diet = fget(facts, "Diet");
  const care = fget(facts, "Care Level");
  const kids = fget(facts, "Good with Kids");
  const exercise = fget(facts, "Exercise Needs", "Activity Level");
  const enc = fget(facts, "Enclosure", "Enclosure Size", "Tank Size", "Minimum Tank");
  const temperature = fget(facts, "Temperature", "Temperature Range");
  const humid = fget(facts, "Humidity");
  const sci = (p.sci || fget(facts, "Scientific Name") || "").split(/[,;(]/)[0].trim();

  const blocks = [];
  const ov = [
    say(ctx, "ov0", "starts this profile"),
    say(ctx, "ov1", origin ? `origin ${oneWord(origin)} region` : "has unlisted origin"),
    say(ctx, "ov2", sci ? `named ${oneWord(sci)} scientifically` : "uses common names"),
    ...take(["needs a schedule", "outlasts cute photos", "needs seller honesty", "shows real housing"], ctx, "ov"),
  ];
  blocks.push(["Overview and Origin", para(ov)]);

  const ap = [
    say(ctx, "apSize", size ? `size ${oneWord(size)} adults` : "size varies widely"),
    ...(height ? [say(ctx, "apH", `length ${oneWord(height)} listed`)] : []),
    ...take(["ignores color hype", "needs actual weights", "shows findable ribs", "changes with condition"], ctx, "ap"),
  ];
  blocks.push(["Appearance and Size", para(ap)]);

  const tp = [
    say(ctx, "tpT", temp ? `temperament ${oneWord(temp)} usually` : "temperament varies individually"),
    ...(exercise ? [say(ctx, "tpE", `exercise ${oneWord(exercise)} listed`)] : []),
    ...(kids ? [say(ctx, "tpK", `kid-notes ${oneWord(kids)} listed`)] : []),
    ...take(["learns short sessions", "shows boredom loudly", "hides after fear"], ctx, "tp"),
  ];
  blocks.push(["Temperament", para(tp)]);

  blocks.push(["Lifespan", para([
    say(ctx, "lf", life ? `lifespan ${oneWord(life)} listed` : "lifespan runs long"),
    ...take(["outlasts weekend plans", "complicates later moves", "costs more later", "needs early exams", "needs senior checks"], ctx, "lf"),
  ])]);

  blocks.push(["Diet", para([
    ...(diet ? [say(ctx, "dietF", `diet ${oneWord(diet)} listed`)] : []),
    ...take(DIET[group] || DIET.fish, ctx, "diet"),
  ])]);

  blocks.push(["Habitat and Enclosure", para([
    ...(enc ? [say(ctx, "enc", `space ${oneWord(enc)} listed`)] : []),
    ...(temperature ? [say(ctx, "temp", `temperature ${oneWord(temperature)} listed`)] : []),
    ...(humid ? [say(ctx, "hum", `humidity ${oneWord(humid)} listed`)] : []),
    ...take(HABITAT[group] || HABITAT.fish, ctx, "hab"),
  ])]);

  blocks.push(["Handling", para(take(HANDLE[group] || HANDLE.dogs, ctx, "hand"))]);

  const specific = SPECIFIC[p.slug] || [];
  blocks.push(["Common Health Problems", para([
    ...take(specific, ctx, "spec"),
    ...take(HEALTH[group] || HEALTH.dogs, ctx, "hp"),
  ])]);

  const flags = take(FLAGS[group] || FLAGS.dogs, ctx, "flag");
  blocks.push(["When to See a Vet: Red Flags", `<ul>${flags.map((s) => `<li>${s}</li>`).join("")}</ul>`]);

  blocks.push(["Grooming and Maintenance", para([
    ...take(GROOM[group] || GROOM.dogs, ctx, "gr"),
    say(ctx, "grNote", "needs written changes"),
    say(ctx, "grVet", "needs yearly exams"),
  ])]);

  blocks.push(["Cost to Own", para(take(COST[group] || COST.fish, ctx, "cost"))]);

  const beginner = /beginner|easy|novice/i.test(care)
    ? "suits careful beginners"
    : /advanced|expert|difficult/i.test(care)
      ? "suits experienced keepers"
      : "suits prepared keepers";
  blocks.push(["Suitability", para([
    say(ctx, "su1", beginner),
    say(ctx, "su2", kids ? `kid-fit ${oneWord(kids)} listed` : "needs adult handlers"),
    say(ctx, "su3", /high/i.test(exercise) ? "challenges apartment living" : "may suit apartments"),
    ...take(["needs honest setups", "needs adult keepers", "depends on travel"], ctx, "su"),
  ])]);

  const legal = SPECIAL[p.slug] || LEGAL[group] || LEGAL.dogs;
  blocks.push(["Legal and Permit Notes", para(take(legal, ctx, "leg"))]);

  const extra = take(EXTRA, ctx, "ex");
  let text = blocks.map((b) => b[1].replace(/<[^>]+>/g, " ")).join(" ");
  const used = [];
  for (const line of extra) {
    if (text.split(/\s+/).filter(Boolean).length >= 1280) break;
    used.push(line);
    text += " " + line;
  }
  if (used.length) {
    const chunks = [];
    for (let i = 0; i < used.length; i += 4) chunks.push(`<p>${used.slice(i, i + 4).join(" ")}</p>`);
    blocks.push(["Week to Week", chunks.join("\n")]);
  }

  const lifeWord = life ? oneWord(life) : "long";
  const careWord = care ? oneWord(care) : "variable";
  const dietWord = diet ? oneWord(diet) : "species-right";
  const faqs = [
    [`How long does a ${ctx.hook} live?`, say(ctx, "faq1", `lifespan ${lifeWord} listed`)],
    [`Is a ${ctx.hook} beginner friendly?`, say(ctx, "faq2", `care ${careWord} listed`)],
    temperature
      ? [`What temperature suits a ${ctx.hook}?`, say(ctx, "faq3", `temperature ${oneWord(temperature)} listed`)]
      : [`What does a ${ctx.hook} eat?`, say(ctx, "faq3", `diet ${dietWord} listed`)],
    [`Which ${ctx.hook} signs should not wait?`, say(ctx, "faq4", "needs same-day help")],
  ];
  // FAQ questions also have to stay inside the five-word rule.
  for (const [q] of faqs) {
    if (!windowsOk(q, ctx.tokens)) throw new Error(`unsafe question: ${q}`);
  }
  blocks.push([`${ctx.full} FAQ`, faqs.map(([q, a]) => `<h3>${q}</h3><p>${a}</p>`).join("\n")]);

  return { blocks, faqs };
}
