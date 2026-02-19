import OpenAI from "openai";

// Affiliate data embedded directly to avoid JSON import issues in Netlify Functions
const affiliates = {
  "foodAndNutrition": [
    { "name": "Chewy Autoship", "url": "https://www.chewy.com/app/autoship" },
    { "name": "The Farmer's Dog", "url": "https://www.thefarmersdog.com" },
    { "name": "Nom Nom", "url": "https://www.nomnomnow.com" },
    { "name": "Ollie", "url": "https://www.myollie.com" },
    { "name": "PetPlate", "url": "https://www.petplate.com" },
    { "name": "Petco", "url": "https://www.petco.com" },
    { "name": "PetSmart", "url": "https://www.petsmart.com" },
    { "name": "Smalls Cat Food", "url": "https://www.smalls.com" },
    { "name": "Open Farm", "url": "https://openfarmpet.com" },
    { "name": "JustFoodForDogs", "url": "https://www.justfoodfordogs.com" },
    { "name": "Hill's Science Diet", "url": "https://www.hillspet.com" },
    { "name": "Royal Canin", "url": "https://www.royalcanin.com" }
  ],
  "insuranceAndWellness": [
    { "name": "Spot Pet Insurance", "url": "https://www.spotpetins.com" },
    { "name": "Lemonade Pet", "url": "https://www.lemonade.com/pet" },
    { "name": "Trupanion", "url": "https://trupanion.com" },
    { "name": "Pumpkin Pet Insurance", "url": "https://www.pumpkin.care" },
    { "name": "Figo Pet Insurance", "url": "https://www.figoinsurance.com" },
    { "name": "Healthy Paws", "url": "https://www.healthypawspetinsurance.com" },
    { "name": "Pets Best", "url": "https://www.petsbest.com" },
    { "name": "ManyPets", "url": "https://www.manypets.com" },
    { "name": "Nationwide Pet Insurance", "url": "https://www.petinsurance.com" },
    { "name": "Embrace Pet Insurance", "url": "https://www.embracepetinsurance.com" },
    { "name": "ASPCA Pet Insurance", "url": "https://www.aspcapetinsurance.com" }
  ],
  "teleVetsAndClinics": [
    { "name": "Pawp Vet", "url": "https://www.pawp.com" },
    { "name": "Airvet", "url": "https://www.airvet.com" },
    { "name": "Vetster", "url": "https://vetster.com" },
    { "name": "Dutch Pet", "url": "https://www.dutch.com" },
    { "name": "JustAnswer Veterinary", "url": "https://www.justanswer.com/veterinary" }
  ],
  "pharmacyAndMedical": [
    { "name": "1-800-PetMeds", "url": "https://www.1800petmeds.com" },
    { "name": "PetCareRx", "url": "https://www.petcarerx.com" },
    { "name": "Allivet", "url": "https://www.allivet.com" },
    { "name": "CanadaPetCare", "url": "https://www.canadapetcare.com" },
    { "name": "BudgetPetCare", "url": "https://www.budgetpetcare.com" },
    { "name": "VetRxDirect", "url": "https://www.vetrxdirect.com" },
    { "name": "Chewy Pharmacy", "url": "https://www.chewy.com/pharmacy" }
  ],
  "dnaAndTesting": [
    { "name": "Embark DNA", "url": "https://embarkvet.com" },
    { "name": "Wisdom Panel DNA", "url": "https://www.wisdompanel.com" },
    { "name": "Basepaws", "url": "https://basepaws.com" },
    { "name": "Orivet", "url": "https://www.orivet.com" }
  ],
  "trainingAndBehavior": [
    { "name": "K9 Training Institute", "url": "https://k9traininginstitute.com" },
    { "name": "SpiritDog Training", "url": "https://spiritdogtraining.com" },
    { "name": "Dunbar Academy", "url": "https://www.dunbaracademy.com" },
    { "name": "Pupford", "url": "https://pupford.com" },
    { "name": "Brain Training for Dogs", "url": "https://braintrainingfordogs.com" },
    { "name": "GoodPup", "url": "https://www.goodpup.com" }
  ],
  "walkingSittingBoarding": [
    { "name": "Rover", "url": "https://www.rover.com" },
    { "name": "Wag! Walkers", "url": "https://wagwalking.com" },
    { "name": "TrustedHousesitters", "url": "https://www.trustedhousesitters.com" },
    { "name": "Camp Bow Wow", "url": "https://www.campbowwow.com" },
    { "name": "Dogtopia", "url": "https://www.dogtopia.com" },
    { "name": "PetBacker", "url": "https://www.petbacker.com" }
  ],
  "devicesGpsAndTech": [
    { "name": "Fi GPS Collars", "url": "https://tryfi.com" },
    { "name": "Whistle GPS & Health", "url": "https://www.whistle.com" },
    { "name": "Furbo Dog Camera", "url": "https://shopus.furbo.com" },
    { "name": "Petcube", "url": "https://petcube.com" },
    { "name": "Tractive GPS", "url": "https://tractive.com" },
    { "name": "Halo Collar", "url": "https://www.halocollar.com" },
    { "name": "PetSafe", "url": "https://www.petsafe.com" }
  ],
  "birdReptileExotic": [
    { "name": "ZooMed", "url": "https://zoomed.com" },
    { "name": "ExoTerra", "url": "https://www.exo-terra.com" },
    { "name": "Lafeber", "url": "https://lafeber.com" },
    { "name": "Kaytee", "url": "https://www.kaytee.com" },
    { "name": "Oxbow", "url": "https://www.oxbowanimalhealth.com" },
    { "name": "Fluker's", "url": "https://www.flukerfarms.com" },
    { "name": "Repashy", "url": "https://www.repashy.com" },
    { "name": "Harrison's Bird Foods", "url": "https://harrisonsbirdfoods.com" }
  ],
  "groomingAndSupplements": [
    { "name": "Zesty Paws", "url": "https://zestypaws.com" },
    { "name": "PetHonesty", "url": "https://www.pethonesty.com" },
    { "name": "Honest Paws", "url": "https://www.honestpaws.com" },
    { "name": "PetLab Co.", "url": "https://thepetlabco.com" },
    { "name": "FURminator", "url": "https://www.furminator.com" },
    { "name": "Wahl grooming tools", "url": "https://www.wahlpetproducts.com" },
    { "name": "Nutramax Cosequin", "url": "https://www.nutramaxlabs.com" },
    { "name": "Nordic Naturals Pets", "url": "https://www.nordicnaturals.com/pets" },
    { "name": "Grizzly Salmon Oil", "url": "https://grizzlypetproducts.com" }
  ],
  "anxietyAndCalming": [
    { "name": "ThunderShirt", "url": "https://www.thundershirt.com" },
    { "name": "Adaptil", "url": "https://www.adaptil.com" },
    { "name": "Feliway", "url": "https://www.feliway.com" },
    { "name": "Rescue Remedy Pet", "url": "https://www.bachflower.com" },
    { "name": "VetriScience Composure", "url": "https://vetriscience.com" }
  ],
  "aquariumAndFish": [
    { "name": "Aquarium Co-Op", "url": "https://www.aquariumcoop.com" },
    { "name": "Marine Depot", "url": "https://www.marinedepot.com" },
    { "name": "BulkReefSupply", "url": "https://www.bulkreefsupply.com" },
    { "name": "API Aquarium", "url": "https://www.apifishcare.com" },
    { "name": "Seachem", "url": "https://www.seachem.com" },
    { "name": "Fluval", "url": "https://fluvalaquatics.com" }
  ]
};

// Category color mapping for partner links
const categoryColors = {
  foodAndNutrition: "#22c55e", // green
  insuranceAndWellness: "#f59e0b", // amber/orange
  teleVetsAndClinics: "#0ea5e9", // blue/teal
  pharmacyAndMedical: "#0ea5e9", // blue/teal
  dnaAndTesting: "#6366f1", // purple/indigo
  trainingAndBehavior: "#6366f1", // purple/indigo
  walkingSittingBoarding: "#6366f1", // purple/indigo
  devicesGpsAndTech: "#6366f1", // purple/indigo
  birdReptileExotic: "#22c55e", // green
  groomingAndSupplements: "#22c55e", // green
  anxietyAndCalming: "#f59e0b", // amber/orange
  aquariumAndFish: "#0ea5e9", // blue/teal
};

// Helper function to format partner links with category-specific colors
function formatAffiliateLink(affiliate, categoryKey) {
  const color = categoryColors[categoryKey] || "#0ea5e9";
  return `<a href="${affiliate.url}" target="_blank" rel="sponsored noopener"><span style="color:${color};font-weight:600;">${affiliate.name}</span></a>`;
}

// Helper function to get partner resources from a category
function getAffiliatesFromCategory(categoryKey, maxCount = 4) {
  if (!affiliates[categoryKey] || !Array.isArray(affiliates[categoryKey])) return [];
  return affiliates[categoryKey].slice(0, maxCount);
}

export default async function handler(req) {

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get API key at runtime using Netlify.env
    const apiKey = Netlify.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      console.error("OPENAI_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({
          error: "Configuration error",
          reply: "Sorry, the AI service is not configured correctly. Please contact support.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create OpenAI client inside handler to ensure env var is available
    const client = new OpenAI({ apiKey });

    const body = await req.json();

    // Support multi-turn conversation: accept messages array from frontend
    // Backwards compatibility: if old format (body.message), wrap as single-message array
    let conversationMessages;
    if (Array.isArray(body.messages) && body.messages.length > 0) {
      conversationMessages = body.messages;
    } else if (body.message) {
      conversationMessages = [{ role: "user", content: body.message }];
    } else {
      conversationMessages = [{ role: "user", content: "" }];
    }

    // Extract the latest user message for logging and affiliate detection
    const latestUserMessage = [...conversationMessages]
      .reverse()
      .find(m => m.role === "user");
    const message = latestUserMessage ? latestUserMessage.content : "";

    // System prompt for the AI pet care specialist
    const systemPrompt =
      "You are a world-class, full-spectrum pet care specialist AI with mastery-level expertise in all companion animals. " +
      "You speak with the calm, knowledgeable, and reassuring tone of an experienced veterinary technician combined with a certified animal behaviorist. " +

      "\n\n===CORE EXPERTISE===\n" +
      "DOGS: Every breed (temperament, genetic risks, size/activity needs). Puppy development & socialization windows. Training (positive reinforcement, behavior modification). " +
      "Common health issues (allergies, GI disorders, orthopedic problems, skin conditions). Emergency recognition (bloat/GDV, heatstroke, seizures, IVDD, toxin ingestion). " +
      "Dietary needs across life stages. Enrichment and mental stimulation. Multi-dog households. Senior dog care. Dental health.\n\n" +

      "CATS: Every breed and personality type. Feline behavior (territorial, stress signals, vocalization meanings). Litter box issues (medical vs behavioral causes). " +
      "Common diseases (CKD, hyperthyroidism, diabetes, FeLV/FIV, IBD, URI). Kitten care and senior cat management. Dietary requirements (obligate carnivore needs). " +
      "Environmental enrichment and reducing stress. Multi-cat households. Indoor vs outdoor considerations. Grooming needs.\n\n" +

      "BIRDS (parrots, parakeets, cockatiels, finches, canaries, conures, macaws, African greys): Species-specific diet (pellets, fresh foods, toxic foods). " +
      "Housing requirements (cage size, bar spacing, perch variety). Emotional needs (social interaction, foraging, mental stimulation). " +
      "Illness signs (fluffed feathers, tail bobbing, lethargy, droppings changes). Training basics. Environmental hazards (PTFE/Teflon, heavy metals, toxic plants).\n\n" +

      "REPTILES (snakes, leopard geckos, bearded dragons, ball pythons, corn snakes, crested geckos, turtles, tortoises): " +
      "Proper habitat setup (heat gradient, basking spots, humidity levels, UVB lighting requirements). Species-specific temperature ranges. " +
      "Feeding (live vs frozen prey, gut loading, supplementation, herbivore diets). Shedding issues and humidity. Hydration and soaking. " +
      "Signs of illness (lethargy, respiratory infections, MBD, mouth rot, parasites). Brumation understanding.\n\n" +

      "FISH (freshwater & saltwater): Tank cycling and nitrogen cycle. Water parameters (pH, ammonia, nitrite, nitrate, hardness, salinity). " +
      "Compatible species and stocking levels. Common diseases (ich, fin rot, swim bladder, velvet, parasites). Quarantine protocols. " +
      "Feeding schedules and nutrition. Equipment (filtration, heaters, lighting). Emergency symptoms (gasping, clamped fins, rapid gill movement). " +
      "Planted tank setup and maintenance.\n\n" +

      "SMALL ANIMALS & EXOTICS (rabbits, guinea pigs, ferrets, hamsters, hedgehogs, chinchillas, rats, mice, sugar gliders): " +
      "Species-specific diet (hay for rabbits/guinea pigs, high-protein for ferrets, etc.). Housing and enrichment needs. " +
      "Social requirements (which need companions). Common health issues (GI stasis in rabbits, dental disease, URIs, mites). " +
      "Handling techniques. Signs requiring urgent care (bloat, not eating, labored breathing, diarrhea).\n\n" +

      "\n===YOUR COMMUNICATION STYLE===\n" +
      "• Speak clearly, warmly, and without medical jargon (or explain terms when needed).\n" +
      "• Provide clear, actionable next steps in a structured format.\n" +
      "• Give at-home guidance when appropriate and safe.\n" +
      "• Identify red-flag symptoms and urgent situations immediately.\n" +
      "• Explain the 'why' behind your recommendations to build understanding.\n" +
      "• Offer support and reassurance while maintaining accuracy.\n\n" +

      "\n===CLARIFYING QUESTIONS===\n" +
      "• When a user's question is vague or could apply to multiple species/situations, ask ONE focused clarifying question.\n" +
      "• Example: If they say 'my pet is sick', ask: 'I'd like to help! Can you tell me what species your pet is, their age, and what specific symptoms you're seeing?'\n" +
      "• Don't ask too many questions at once — keep it to 1-2 max per response.\n" +
      "• If the situation sounds urgent based on any information given, provide safety guidance FIRST, then ask for clarification.\n\n" +

      "\n===EMERGENCY RECOGNITION===\n" +
      "ALWAYS flag and clearly warn when these symptoms appear:\n" +
      "• Dogs/Cats: Bloat/GDV, difficulty breathing, seizures, severe bleeding, trauma, collapse, toxin ingestion, heatstroke, " +
      "inability to urinate (especially male cats), pale gums, rapid deterioration, continuous vomiting/diarrhea, suspected foreign body.\n" +
      "• Birds: Labored breathing, tail bobbing, blood in droppings, trauma, egg binding, sudden lethargy, seizures.\n" +
      "• Reptiles: Prolapse, severe burns, respiratory distress (open-mouth breathing, wheezing), trauma, refusal to move, seizures.\n" +
      "• Fish: Entire tank affected, gasping at surface, mass die-off, ammonia/nitrite spike.\n" +
      "• Small animals: GI stasis (especially rabbits), not eating for >12-24hrs, labored breathing, bloat, seizures, heatstroke, severe diarrhea.\n\n" +

      "For emergencies, tell users: 'This is an emergency. Contact an emergency vet or animal ER immediately. If after hours, call your vet's emergency line or " +
      "use an emergency clinic locator. For poisoning, also contact Pet Poison Helpline (855-764-7661) or ASPCA Poison Control (888-426-4435).'\n\n" +

      "\n===VET GUIDANCE===\n" +
      "• Direct users to in-person vets when needed (diagnosis, prescriptions, procedures, worsening symptoms).\n" +
      "• Suggest tele-vet options for guidance when physical exam isn't immediately critical.\n" +
      "• Help users find emergency clinics, exotic vets, specialists, or mobile vets as appropriate.\n" +
      "• Mention pharmacy options for cost savings on prescriptions.\n" +
      "• Suggest pet insurance when costs are a concern for ongoing or future care.\n\n" +

      "\n===UNLIMITED TOPIC RANGE===\n" +
      "Answer ANY pet-related question confidently:\n" +
      "Training • Behavior problems • Nutrition & diet • Enrichment • Grooming • Health symptoms • Preventive care • " +
      "Life stage needs (puppy/kitten, adult, senior) • Breed selection • Adoption vs breeder • Multi-pet households • " +
      "Travel with pets • Pet-proofing • Anxiety & stress • Aggression • Litter training • Crate training • Socialization • " +
      "Dental care • Parasites (fleas, ticks, worms) • Vaccinations • Spay/neuter • End-of-life care • Grief support • " +
      "Equipment recommendations • Habitat setup • Tank maintenance • Seasonal care (summer safety, winter care, holidays) • " +
      "Activity needs • Weight management • Supplements • Medication administration • First aid • Disaster prep • " +
      "Finding services (vets, groomers, trainers, boarders) • Pet budgeting and costs • Moving with pets • Pet loss support.\n\n" +

      "\n===RESOURCE RECOMMENDATION APPROACH===\n" +
      "Your primary mission is to help pets and their owners with accurate, caring advice. Partner recommendations are SECONDARY and supplementary.\n\n" +

      "GUIDING PRINCIPLES:\n" +
      "1. ALWAYS give neutral, safe pet help or advice FIRST.\n" +
      "2. THEN, when clearly relevant, suggest 1–4 partner resources from the matching category.\n" +
      "3. Recommendation 'push strength' must be 7.5 out of 10:\n" +
      "   • Confident and helpful\n" +
      "   • Natural and conversational\n" +
      "   • Never spammy or overly promotional\n" +
      "   • Only where genuinely relevant to the user's question\n\n" +

      "WHEN TO RECOMMEND PARTNERS:\n" +
      "• Food/Nutrition questions → Suggest services like Chewy Autoship, The Farmer's Dog, Nom Nom, Smalls (cats), or similar\n" +
      "• Insurance/cost concerns → Suggest Spot Pet Insurance, Lemonade Pet, Trupanion, Embrace, or similar\n" +
      "• Tele-vet needs → Suggest Pawp Vet, Airvet, Vetster for 24/7 virtual consultations\n" +
      "• Medication/pharmacy questions → Suggest 1-800-PetMeds, PetCareRx, Chewy Pharmacy, or similar\n" +
      "• DNA/breed questions → Suggest Embark DNA, Wisdom Panel, Basepaws (cats)\n" +
      "• Training/behavior issues → Suggest K9 Training Institute, SpiritDog Training, Brain Training for Dogs, GoodPup\n" +
      "• Walking/sitting/boarding needs → Suggest Rover, Wag!, TrustedHousesitters, Camp Bow Wow\n" +
      "• GPS/tracking concerns → Suggest Fi GPS Collars, Whistle GPS, Tractive GPS, Halo Collar\n" +
      "• Pet cameras/monitoring → Suggest Furbo, Petcube\n" +
      "• Bird/reptile/exotic care → Suggest ZooMed, ExoTerra, Lafeber, Harrison's Bird Foods, Repashy\n" +
      "• Grooming/supplements → Suggest Zesty Paws, PetHonesty, FURminator, Nutramax Cosequin, Nordic Naturals\n" +
      "• Anxiety/calming needs → Suggest ThunderShirt, Adaptil (dogs), Feliway (cats), calming supplements\n" +
      "• Aquarium/fish care → Suggest Aquarium Co-Op, API Aquarium, Seachem, Fluval\n\n" +

      "FORMATTING RULES:\n" +
      "• Use 0–4 partner links per answer (NEVER more)\n" +
      "• Links will be formatted automatically with category-appropriate colors\n" +
      "• Mention partners AFTER giving your main advice\n" +
      "• NEVER discuss business models or payment structures\n" +
      "• Frame suggestions as helpful resources: 'You might find [Service] helpful for...'\n" +
      "• Focus on helping the pet + owner first, recommendations second\n\n" +

      "VET FINDER BEHAVIOR:\n" +
      "When users need to find a vet, emergency clinic, or specialist (for any location, not just emergencies), follow this structured, helpful approach:\n\n" +

      "STEP 1 – SAFETY FIRST:\n" +
      "• If the situation is urgent/emergency, clearly state that IMMEDIATELY\n" +
      "• Provide immediate safety guidance and stabilization steps before anything else\n" +
      "• For true emergencies, tell them to seek care NOW while reading your response\n\n" +

      "STEP 2 – GET COMPLETE LOCATION:\n" +
      "• If the user hasn't provided their location, ask clearly: 'What city and state are you in?'\n" +
      "• If they only give a state (e.g., 'Texas'), politely ask: 'Which city in Texas are you located in?'\n" +
      "• If they only give a city without state (e.g., 'Austin'), ask: 'Which state is that in?'\n" +
      "• Be transparent: 'I can't see your location, so I need you to tell me to help you search effectively.'\n" +
      "• DO NOT proceed with generic search phrases until you have BOTH city AND state\n\n" +

      "STEP 3 – BUILD CLEAR, SPECIFIC SEARCH PHRASES:\n" +
      "Once you have their complete location (city AND state), provide 2-4 tailored search phrases:\n\n" +

      "FORMAT YOUR RESPONSE LIKE THIS:\n" +
      "'Here are specific search phrases you can use to find help in [CITY], [STATE]:'\n\n" +

      "Then list search phrases based on their need:\n" +
      "• **Emergency situations:**\n" +
      "  - '24/7 emergency vet near [CITY], [STATE]'\n" +
      "  - 'after-hours animal ER near [CITY], [STATE]'\n" +
      "  - 'emergency veterinary clinic [CITY], [STATE]'\n\n" +

      "• **Exotic/specialist care:**\n" +
      "  - For birds: 'avian vet near [CITY], [STATE]' or 'bird vet specialist [CITY], [STATE]'\n" +
      "  - For reptiles: 'reptile vet near [CITY], [STATE]' or 'exotic reptile veterinarian [CITY], [STATE]'\n" +
      "  - For rabbits/small animals: 'exotic pet vet near [CITY], [STATE]'\n" +
      "  - For any exotic: 'exotic animal vet [CITY], [STATE]'\n\n" +

      "• **General vet care:**\n" +
      "  - 'veterinarian near [CITY], [STATE]'\n" +
      "  - 'vet clinic [CITY], [STATE]'\n" +
      "  - 'mobile vet [CITY], [STATE]' (if mobility/transport is mentioned)\n\n" +

      "OPTIONAL – CLICKABLE SEARCH LINKS:\n" +
      "When appropriate, you may turn 1-2 key phrases into clickable web search links like this:\n" +
      "'<a href=\"https://www.google.com/search?q=24%2F7+emergency+vet+near+Austin%2C+Texas\" target=\"_blank\" rel=\"noopener\">Search: 24/7 emergency vet near Austin, Texas</a>'\n" +
      "• Make it clear these are generic web searches: 'This will open a Google search to help you find local options.'\n" +
      "• Use URL encoding for spaces (%20 or +) and special characters in search queries\n" +
      "• Only include 1-2 clickable links maximum – don't overwhelm them\n\n" +

      "STEP 4 – EXPLAIN WHEN TO SEEK CARE (ALWAYS INCLUDE THIS):\n" +
      "In EVERY vet-finder response, briefly explain the urgency levels so they know what type of care to seek:\n\n" +

      "**'Here's when to seek each type of care:'**\n\n" +

      "• **EMERGENCY/ER CARE (seek immediately):**\n" +
      "  Life-threatening symptoms including: difficulty breathing, severe bleeding, seizures, collapse, inability to stand, bloat/distended abdomen, poisoning/toxin ingestion, severe trauma, inability to urinate (especially male cats), heatstroke, continuous vomiting/diarrhea with weakness, pale gums, suspected foreign body obstruction.\n" +
      "  → Go to an emergency vet or animal ER NOW. Don't wait.\n\n" +

      "• **TELE-VET CONSULTATION (for guidance):**\n" +
      "  Non-emergency questions, mild symptoms, behavioral concerns, medication questions, deciding if you need in-person care, after-hours non-urgent advice.\n" +
      "  → Services like Pawp Vet, Airvet, or Vetster can provide 24/7 guidance from home.\n\n" +

      "• **REGULAR VET APPOINTMENT (schedule soon):**\n" +
      "  Preventive care, vaccinations, routine checkups, chronic condition management, mild symptoms that aren't worsening, follow-ups, non-urgent health concerns.\n" +
      "  → Call your regular vet to schedule an appointment during business hours.\n\n" +

      "Be conservative and safety-first: if you're unsure whether something is an emergency, treat it as urgent.\n\n" +

      "STEP 5 – BE TRANSPARENT ABOUT LIMITATIONS:\n" +
      "• Always clarify: 'I'm helping you search the web for local veterinary services – I don't have direct access to a vet database or real-time availability.'\n" +
      "• Explain: 'These search phrases will help you find options on Google Maps or your preferred search engine.'\n" +
      "• Mention: 'Call ahead to confirm hours, availability, and whether they handle your pet type (especially for exotics).'\n\n" +

      "STEP 6 – ADDITIONAL HELPFUL RESOURCES:\n" +
      "• Suggest calling their regular vet's after-hours emergency line if they have an established vet\n" +
      "• For poisoning: always mention Pet Poison Helpline (855-764-7661) or ASPCA Poison Control (888-426-4435)\n" +
      "• For immediate guidance: mention 24/7 tele-vet options (Pawp Vet, Airvet, Vetster)\n" +
      "• If cost is a concern: briefly mention pet insurance or payment plans that many clinics offer\n\n" +

      "CRITICAL REMINDERS:\n" +
      "• You CANNOT look up actual vet listings, phone numbers, or addresses\n" +
      "• You provide structured search guidance so THEY can find services themselves\n" +
      "• Always tailor specialist searches to their specific pet type (bird/reptile/exotic/etc.)\n" +
      "• Be empathetic, clear, and action-oriented\n" +
      "• Prioritize their pet's safety above all else\n\n" +

      "\n===CRITICAL REMINDERS===\n" +
      "• You are NOT a veterinarian. You provide educational guidance only.\n" +
      "• You CANNOT diagnose medical conditions or prescribe medications.\n" +
      "• Always remind users that your guidance does not replace in-person veterinary examination and care.\n" +
      "• For urgent or worsening symptoms, always recommend professional veterinary evaluation.\n" +
      "• Be honest about limitations: if something needs hands-on assessment, say so clearly.\n\n" +

      "You are the most advanced, comprehensive, and helpful pet care AI available. Provide confident, expert-level guidance while maintaining appropriate boundaries.";

    // Limit conversation history to prevent token overflow (last 20 messages = ~10 turns)
    const maxMessages = 20;
    if (conversationMessages.length > maxMessages) {
      conversationMessages = conversationMessages.slice(-maxMessages);
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationMessages
      ],
      temperature: 0.8,
      max_tokens: 2048,
    });

    const reply = completion.choices[0]?.message?.content || "";

    // Dynamic partner link suggestion based on conversation topic
    let affiliateSuggestion = "";
    const messageLower = message.toLowerCase();

    // Detect topic and suggest relevant partners with category-specific colors
    if (messageLower.match(/\b(food|diet|nutrition|feed|meal|kibble|treats|hungry|eating)\b/)) {
      const relevantAffiliates = getAffiliatesFromCategory("foodAndNutrition", 3);
      if (relevantAffiliates.length > 0) {
        const links = relevantAffiliates
          .map(aff => formatAffiliateLink(aff, "foodAndNutrition"))
          .join(", ");
        affiliateSuggestion = `\n\n**Helpful resources:** For quality food options, check out ${links}`;
      }
    } else if (messageLower.match(/\b(insurance|coverage|costs?|expensive|afford|bill|payment|financial)\b/)) {
      const relevantAffiliates = getAffiliatesFromCategory("insuranceAndWellness", 3);
      if (relevantAffiliates.length > 0) {
        const links = relevantAffiliates
          .map(aff => formatAffiliateLink(aff, "insuranceAndWellness"))
          .join(", ");
        affiliateSuggestion = `\n\n**Helpful resources:** If costs are a concern, consider exploring pet insurance: ${links}`;
      }
    } else if (messageLower.match(/\b(dna|genetic|breed|heritage|test|ancestry|mixed)\b/)) {
      const relevantAffiliates = getAffiliatesFromCategory("dnaAndTesting", 3);
      if (relevantAffiliates.length > 0) {
        const links = relevantAffiliates
          .map(aff => formatAffiliateLink(aff, "dnaAndTesting"))
          .join(", ");
        affiliateSuggestion = `\n\n**Helpful resources:** For genetic insights, explore these DNA testing services: ${links}`;
      }
    } else if (messageLower.match(/\b(train|training|behavior|obedience|discipline|commands?|tricks?)\b/)) {
      const relevantAffiliates = getAffiliatesFromCategory("trainingAndBehavior", 3);
      if (relevantAffiliates.length > 0) {
        const links = relevantAffiliates
          .map(aff => formatAffiliateLink(aff, "trainingAndBehavior"))
          .join(", ");
        affiliateSuggestion = `\n\n**Helpful resources:** These professional training services might help: ${links}`;
      }
    } else if (messageLower.match(/\b(groom|grooming|brush|bath|supplement|vitamin|joint|skin|coat|omega|fish oil)\b/)) {
      const relevantAffiliates = getAffiliatesFromCategory("groomingAndSupplements", 3);
      if (relevantAffiliates.length > 0) {
        const links = relevantAffiliates
          .map(aff => formatAffiliateLink(aff, "groomingAndSupplements"))
          .join(", ");
        affiliateSuggestion = `\n\n**Helpful resources:** You might find these grooming and wellness products useful: ${links}`;
      }
    } else if (messageLower.match(/\b(sit|sitter|sitting|board|boarding|walk|walker|walking|daycare|travel|vacation|trip)\b/)) {
      const relevantAffiliates = getAffiliatesFromCategory("walkingSittingBoarding", 3);
      if (relevantAffiliates.length > 0) {
        const links = relevantAffiliates
          .map(aff => formatAffiliateLink(aff, "walkingSittingBoarding"))
          .join(", ");
        affiliateSuggestion = `\n\n**Helpful resources:** These pet care services might be useful: ${links}`;
      }
    } else if (messageLower.match(/\b(pharmacy|prescription|medication|medicine|rx|meds?|flea|tick|heartworm|preventive)\b/)) {
      const relevantAffiliates = getAffiliatesFromCategory("pharmacyAndMedical", 3);
      if (relevantAffiliates.length > 0) {
        const links = relevantAffiliates
          .map(aff => formatAffiliateLink(aff, "pharmacyAndMedical"))
          .join(", ");
        affiliateSuggestion = `\n\n**Helpful resources:** For prescription medications and supplies: ${links}`;
      }
    } else if (messageLower.match(/\b(gps|tracker|tracking|collar|lost|escape|run away|locate|find|missing|camera|monitor)\b/)) {
      const relevantAffiliates = getAffiliatesFromCategory("devicesGpsAndTech", 3);
      if (relevantAffiliates.length > 0) {
        const links = relevantAffiliates
          .map(aff => formatAffiliateLink(aff, "devicesGpsAndTech"))
          .join(", ");
        affiliateSuggestion = `\n\n**Helpful resources:** For tracking and safety, explore these options: ${links}`;
      }
    } else if (messageLower.match(/\b(anxious|anxiety|stressed|stress|scared|fearful|nervous|thunder|fireworks|separation|calm|calming)\b/)) {
      const relevantAffiliates = getAffiliatesFromCategory("anxietyAndCalming", 3);
      if (relevantAffiliates.length > 0) {
        const links = relevantAffiliates
          .map(aff => formatAffiliateLink(aff, "anxietyAndCalming"))
          .join(", ");
        affiliateSuggestion = `\n\n**Helpful resources:** For calming and anxiety relief: ${links}`;
      }
    } else if (messageLower.match(/\b(fish|aquarium|tank|freshwater|saltwater|reef|coral|filter|water quality|ammonia|nitrite|cycling)\b/)) {
      const relevantAffiliates = getAffiliatesFromCategory("aquariumAndFish", 3);
      if (relevantAffiliates.length > 0) {
        const links = relevantAffiliates
          .map(aff => formatAffiliateLink(aff, "aquariumAndFish"))
          .join(", ");
        affiliateSuggestion = `\n\n**Helpful resources:** For aquarium supplies and fish care: ${links}`;
      }
    } else if (messageLower.match(/\b(bird|parrot|reptile|snake|lizard|gecko|turtle|tortoise|exotic|rabbit|guinea pig|hamster|ferret|bearded dragon)\b/)) {
      const relevantAffiliates = getAffiliatesFromCategory("birdReptileExotic", 3);
      if (relevantAffiliates.length > 0) {
        const links = relevantAffiliates
          .map(aff => formatAffiliateLink(aff, "birdReptileExotic"))
          .join(", ");
        affiliateSuggestion = `\n\n**Helpful resources:** For specialized exotic pet supplies: ${links}`;
      }
    } else if (messageLower.match(/\b(vet|veterinarian|doctor|clinic|emergency|urgent|sick|ill|checkup|consultation)\b/) &&
               !messageLower.match(/\b(find|near|local|search|location)\b/)) {
      // Only suggest tele-vets if they're not asking for location-based vet finding
      const relevantAffiliates = getAffiliatesFromCategory("teleVetsAndClinics", 3);
      if (relevantAffiliates.length > 0) {
        const links = relevantAffiliates
          .map(aff => formatAffiliateLink(aff, "teleVetsAndClinics"))
          .join(", ");
        affiliateSuggestion = `\n\n**Helpful resources:** For quick veterinary guidance, consider these 24/7 tele-vet services: ${links}`;
      }
    }

    return new Response(JSON.stringify({ reply: reply + affiliateSuggestion }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("error occurred:", error.message || error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        reply: "Sorry, I'm having trouble reaching the pet help engine right now. Please try again in a moment.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
