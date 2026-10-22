/** Vet hub, checker, and symptom guides. Bodies are wrapped by page-shell. */

function faqSchema(pairs) {
  const mainEntity = pairs.map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  }));
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  })}</script>`;
}

const SOURCES = `<h2>Sources</h2>
<ul>
  <li><a href="https://vcahospitals.com/know-your-pet">VCA Hospitals pet health library</a></li>
  <li><a href="https://www.merckvetmanual.com/">Merck Veterinary Manual</a></li>
  <li><a href="https://www.aspca.org/pet-care">ASPCA pet care</a></li>
</ul>
<p>Clinic decisions belong to the veterinarian who can examine the animal. This page is background reading.</p>`;

export const symptoms = [
  {
    slug: "dog-vomiting",
    title: "Dog vomiting",
    description: "How to tell a single upset stomach from an emergency when a dog vomits, including bloat, blood, toxins, and puppies.",
    faqs: [
      ["When is dog vomiting an emergency?", "Go now for unproductive retching, a swelling belly, collapse, blood, repeated vomiting, or a puppy who is dull or dehydrated."],
      ["Can I give a dog human anti-nausea medicine?", "No. Several human drugs are dangerous for dogs. Ask a clinic before giving anything from your cabinet."],
      ["Should I withhold food after one vomit?", "A bright adult dog who vomits once can often skip the next meal and keep water available. Do not fast puppies, toy dogs, or diabetics without calling a clinic."],
    ],
    html: `
<h1>Dog vomiting</h1>
<p>A dog who vomits once and then trots off to beg for dinner is a different case from a dog who cannot stop retching. The first job is to separate those two pictures before you reach for rice, ginger, or a leftover pill.</p>
<h2>What the episode looks like</h2>
<p>Vomiting is an active heave: abdominal effort, then food, fluid, or bile. Regurgitation is quieter and usually brings up undigested food in a tube shape, often right after eating. That distinction matters because regurgitation points more toward esophagus problems, while repeated vomiting points toward the stomach, intestines, pancreas, toxins, or a blockage.</p>
<p>Yellow foam usually means bile from an empty stomach. One bile episode in an otherwise bright dog can follow a long gap between meals. Green material is also bile. Blood that looks like coffee grounds, or fresh red blood, needs a same-day exam. So does vomit that smells like stool, which can happen with a serious intestinal obstruction.</p>
<h2>Go to an emergency clinic now</h2>
<ul>
  <li>Unproductive retching with a tight, swelling belly, especially in a deep-chested dog. That pattern is gastric dilatation-volvulus until a veterinarian says otherwise. Do not wait it out at home.</li>
  <li>Collapse, pale gums, a racing heart, or vomiting with labored breathing.</li>
  <li>Known or possible toxin: chocolate, xylitol gum, grapes, raisins, rodent bait, human painkillers, or a chewed bottle.</li>
  <li>A puppy who vomits, especially with diarrhea, listlessness, or blood. Parvovirus still kills unvaccinated puppies.</li>
  <li>Vomit that continues for more than a few hours, or more than two or three episodes in a day, in any dog.</li>
</ul>
<p>The ASPCA Animal Poison Control Center is (888) 426-4435. A fee may apply. If the dog is collapsing, skip the phone call and drive.</p>
<h2>When a clinic visit can be the same day</h2>
<p>Call your regular veterinarian the same day if an adult dog vomits several times but still stands, walks, and greets you. Bring a photo of the vomit, a list of foods and chews from the last day, and any missing toy or sock you cannot find. Foreign bodies are common and do not always show up as a dramatic belly.</p>
<p>Pancreatitis often shows up as vomiting plus a praying posture, where the chest is down and the hind end stays up. Garbage, fatty table scraps, and some medications raise that risk. Kidney disease, liver disease, and Addison's disease can also announce themselves as a suddenly vomiting dog who used to be fine. Those are not home-kitchen problems.</p>
<h2>A single vomit in a bright adult</h2>
<p>If the dog vomited once, is playful, and has normal gums, many clinics will let you pick up water after a short pause and skip the next meal. Offer a small portion of the usual food at the following meal, not a new recipe. A sudden diet change is a common reason the vomiting continues. Puppies, dogs under about ten pounds, and diabetic dogs should not be fasted while you watch the clock. Call first.</p>
<p>Do not give ibuprofen, naproxen, acetaminophen, or pepto-style products unless a veterinarian names the product and the dose. Several of those drugs injure the stomach, kidneys, or liver.</p>
<h2>What to tell the clinic</h2>
<p>Count the episodes. Note the color. Say whether the dog is still drinking, whether urine and stool are normal, and whether the belly seems bigger than this morning. Mention vaccines if the patient is a puppy, and mention heat cycle, trash raids, and new chews. That history shortens the visit more than a long internet search does.</p>
<p>Use the <a href="/vet/checker">when-to-see-a-vet checker</a> if you are sorting urgent from soon, and read the broader <a href="/vet/">vet help hub</a>. Related breed background sits on the <a href="/breeds/dog-breeds">dog breed directory</a>.</p>
${SOURCES}
<h2>Dog vomiting questions</h2>
<h3>When is dog vomiting an emergency?</h3>
<p>Go now for unproductive retching, a swelling belly, collapse, blood, repeated vomiting, or a puppy who is dull or dehydrated.</p>
<h3>Can I give a dog human anti-nausea medicine?</h3>
<p>No. Several human drugs are dangerous for dogs. Ask a clinic before giving anything from your cabinet.</p>
<h3>Should I withhold food after one vomit?</h3>
<p>A bright adult dog who vomits once can often skip the next meal and keep water available. Do not fast puppies, toy dogs, or diabetics without calling a clinic.</p>`,
  },
  {
    slug: "dog-diarrhea",
    title: "Dog diarrhea",
    description: "How long to watch mild dog diarrhea, and which stool changes mean parvo, bleeding, or dehydration.",
    faqs: [
      ["How long can dog diarrhea wait?", "One mild episode in a bright adult can be watched for a day. Blood, black stool, vomiting, or a dull puppy should be seen the same day."],
      ["Is pumpkin enough?", "A spoon of plain pumpkin is not a treatment for infection, parasites, or a foreign body. It does not replace an exam when the dog is sick."],
      ["What does black stool mean?", "Tarry black stool can mean digested blood from higher in the gut. That deserves a prompt clinic visit, not a home diet trial."],
    ],
    html: `
<h1>Dog diarrhea</h1>
<p>Loose stool has a wide range. One soft pile after a stolen sandwich is ordinary. Watery stool with blood in a puppy is not. Sort the dog in front of you before you change foods.</p>
<h2>Describe the stool</h2>
<p>Soft-serve stool that still has shape is milder than liquid that hits the floor. Mucus streaks suggest large-bowel irritation. Fresh red blood on top of stool is hematochezia. Black, tarry stool is melena and can mean bleeding farther up. Both blood patterns deserve a call the same day, and sooner if the dog is weak.</p>
<p>Straining a small amount of mucus can look like constipation when it is actually colitis. If you are unsure, take a photo. Frequency matters as much as texture: three accidents in an hour is a different problem from one soft stool in the yard.</p>
<h2>Puppies and small dogs</h2>
<p>Parvovirus still shows up as vomiting plus foul diarrhea, often with blood, in incompletely vaccinated puppies. They dehydrate fast. Do not wait a day to see if a quiet puppy "works it out." Bring vaccine records. Clinics will often want that dog isolated from the waiting room, so call from the car.</p>
<p>Toy breeds and puppies have less fluid to lose. Sticky gums, skin that stays tented, or a puppy who will not stand are emergency signs. Offer water unless the dog is vomiting the water straight back. Do not syringe-force large volumes.</p>
<h2>Adult dogs you can watch briefly</h2>
<p>A bright adult who has one or two soft stools, a normal appetite, and no blood can often be fed the usual diet in smaller meals for a day. Skip treats, rawhides, and table food. Many dogs improve when the trigger was a single dietary indiscretion. If the diarrhea is still going at the 24-hour mark, or the dog skips a meal, book a visit.</p>
<p>Chronic soft stool, weight loss, or diarrhea that returns every few weeks needs a workup. Parasites, food intolerance, pancreatic disease, and inflammatory bowel disease do not announce themselves clearly from the driveway. A fecal test is a reasonable first step and is not the whole answer when the dog is losing weight.</p>
<h2>Medicines to skip</h2>
<p>Do not give loperamide or human bismuth products unless a veterinarian has already told you that drug is acceptable for that dog. Collie-type breeds can be sensitive to some gut drugs. Antibiotics are not automatically useful for simple diarrhea, and leftover tablets from a previous illness are a bad idea.</p>
<p>The <a href="/vet/checker">when-to-see-a-vet checker</a> separates bleeding and collapse from a single soft stool. More dog symptoms are listed on the <a href="/vet/">vet help hub</a>.</p>
${SOURCES}
<h2>Dog diarrhea questions</h2>
<h3>How long can dog diarrhea wait?</h3>
<p>One mild episode in a bright adult can be watched for a day. Blood, black stool, vomiting, or a dull puppy should be seen the same day.</p>
<h3>Is pumpkin enough?</h3>
<p>A spoon of plain pumpkin is not a treatment for infection, parasites, or a foreign body. It does not replace an exam when the dog is sick.</p>
<h3>What does black stool mean?</h3>
<p>Tarry black stool can mean digested blood from higher in the gut. That deserves a prompt clinic visit, not a home diet trial.</p>`,
  },
  {
    slug: "dog-limping",
    title: "Dog limping",
    description: "How to judge a dog limp, from a torn nail to a fracture, cruciate tear, or back injury.",
    faqs: [
      ["When is a limp an emergency?", "A leg that will not bear weight, a dangling limb, a cry with a swollen joint, or sudden back pain with weak legs should be seen immediately."],
      ["Can I give ibuprofen for a limp?", "No. Ibuprofen and naproxen commonly cause stomach ulcers and kidney injury in dogs."],
      ["Should I walk a limping dog to test the leg?", "Skip the long walk. A short look in the house is enough until a veterinarian has checked for a fracture or ligament tear."],
    ],
    html: `
<h1>Dog limping</h1>
<p>Limping is the dog refusing to load a painful leg. Some causes are a broken nail. Others are a torn ligament or a fracture that gets worse the longer the dog walks on it. Decide how urgent it is from weight bearing, swelling, and how the limp started.</p>
<h2>Look before you leash up</h2>
<p>Watch the dog walk a few steps on a non-slip floor. A dog who holds a paw completely off the ground needs a same-day exam, and an emergency exam if the leg looks crooked, dangles, or the dog screams when that area is touched. Do not pull, flex, or "test" a swollen joint. You can turn a stable crack into a displaced fracture.</p>
<p>Check the paw pads and the nails. A nail torn at the base bleeds more than people expect and hurts enough to cause a three-legged hop. If the nail is attached by a shred and the dog is otherwise comfortable after the bleeding stops, a regular clinic can often handle it that day. Cover the foot with a light, loose bandage only if you can do it without cutting off circulation, and do not leave it on overnight.</p>
<h2>Knees, hips, and backs</h2>
<p>A sudden limp in the hind leg of a middle-aged dog, often after a play session, is a classic way cranial cruciate ligament disease shows up. The dog may toe-touch and then seem better after rest, which tempts people to wait a month. The knee is still unstable. Book an exam rather than starting a jogging program.</p>
<p>Hind-end weakness that affects both legs, especially with a hunched back, yelping when picked up, or loss of coordination, can be intervertebral disc disease. If the dog cannot stand, drags the toes, or loses bladder control, that is an emergency. Minutes matter more for deep pain loss than for a mild toe-touch limp.</p>
<p>Puppies who limp after a jump may have a growth-plate injury. Older large dogs who are stiff after rest may have osteoarthritis, which is a plan with your veterinarian, not a one-time pain pill from the pharmacy.</p>
<h2>Pain medicine</h2>
<p>Never give ibuprofen, naproxen, or acetaminophen. Dog-specific anti-inflammatories exist, and the dose is based on an exam and bloodwork in many cases. A dose that was safe last year may be wrong after a weight change or a new kidney problem. Ice for ten minutes can help a known sprain while you drive, wrapped in a cloth, not pressed onto an open wound.</p>
<p>Rest means a leash to the bathroom, not "light fetch." Stairs and slick floors make cruciate and disc injuries worse. Use the <a href="/vet/checker">when-to-see-a-vet checker</a> if you are unsure, and see other guides on the <a href="/vet/">vet help hub</a>.</p>
${SOURCES}
<h2>Dog limping questions</h2>
<h3>When is a limp an emergency?</h3>
<p>A leg that will not bear weight, a dangling limb, a cry with a swollen joint, or sudden back pain with weak legs should be seen immediately.</p>
<h3>Can I give ibuprofen for a limp?</h3>
<p>No. Ibuprofen and naproxen commonly cause stomach ulcers and kidney injury in dogs.</p>
<h3>Should I walk a limping dog to test the leg?</h3>
<p>Skip the long walk. A short look in the house is enough until a veterinarian has checked for a fracture or ligament tear.</p>`,
  },
  {
    slug: "dog-itching",
    title: "Dog itching",
    description: "Fleas, allergies, and skin infections in dogs, plus the itch patterns that should be seen quickly.",
    faqs: [
      ["When is itching urgent?", "Facial swelling, hives with vomiting, or any trouble breathing is an emergency. A hot, oozing sore should be seen within a day."],
      ["Will a grain-free diet fix itch?", "Food trials use a veterinary diet or a prescribed novel protein for weeks. Changing the bag at the pet store rarely answers the question."],
      ["Can I use hydrocortisone cream?", "A tiny dab on one intact spot is sometimes fine. Do not coat raw skin, and do not use human sprays that contain other drugs."],
    ],
    html: `
<h1>Dog itching</h1>
<p>Itch is a symptom, not a diagnosis. The same scratch can come from fleas, a pollen allergy, a food reaction, mites, or a yeast infection that moved in after the skin barrier broke. Treating the scratch without finding the driver is why some dogs stay miserable for years.</p>
<h2>Patterns that narrow it down</h2>
<p>Flea allergy often hits the lower back, tail base, and thighs. Even a single flea bite can set off a dog who is allergic, so "I did not see fleas" does not close the case. A flea comb and a serious preventive, chosen with your clinic, belong in the first week.</p>
<p>Paws, armpits, groin, and face are common atopy zones. Ear infections that return every summer often travel with that pattern. Food-related itch can look identical, which is why a real diet trial is a veterinary plan and not a rotation through grocery brands.</p>
<p>Hair loss with little itch can be hormonal. Intense itch in a puppy, especially around the eyes and feet, raises the question of mites. Demodex and sarcoptic mange are diagnosed from skin scrapings, not from a photo.</p>
<h2>When to stop home care</h2>
<p>A moist, foul, painful patch that appears in a day is a hot spot. Clipping and cleaning belong at a clinic if the spot is larger than a coin or the dog will not let you near it. Facial swelling, hives, vomiting, or noisy breathing after a sting or a new chew is an emergency, not an oatmeal bath.</p>
<p>Yeasty feet smell sweet or musty and stain the fur rusty. That infection will not clear if the dog keeps licking, and the licking will not stop if the itch underneath is ignored. Antibiotics and antifungals need a diagnosis. Steroid pills from an old bottle can mask infection.</p>
<h2>What actually helps while you wait</h2>
<p>A short bath with a mild, veterinary-style shampoo can remove pollen from the coat. Dry the dog fully, especially the feet. Wipe paws after grass. Keep nails short so scratching does less damage. Skip essential oils on the skin. An e-collar stops self-trauma for a night, and it is not a cure.</p>
<p>If the itch has lasted more than a week, or the ears are involved, book a visit and bring a list of foods, preventives, and any new detergent. The <a href="/vet/checker">checker</a> flags swelling and breathing trouble. Other topics are on the <a href="/vet/">vet help hub</a>.</p>
${SOURCES}
<h2>Dog itching questions</h2>
<h3>When is itching urgent?</h3>
<p>Facial swelling, hives with vomiting, or any trouble breathing is an emergency. A hot, oozing sore should be seen within a day.</p>
<h3>Will a grain-free diet fix itch?</h3>
<p>Food trials use a veterinary diet or a prescribed novel protein for weeks. Changing the bag at the pet store rarely answers the question.</p>
<h3>Can I use hydrocortisone cream?</h3>
<p>A tiny dab on one intact spot is sometimes fine. Do not coat raw skin, and do not use human sprays that contain other drugs.</p>`,
  },
  {
    slug: "cat-not-eating",
    title: "Cat not eating",
    description: "Why a cat who skips meals needs a faster plan than a dog, including hepatic lipidosis risk.",
    faqs: [
      ["How long can a cat go without eating?", "Call a veterinarian if a cat skips more than a day of calories. Overweight cats can develop hepatic lipidosis after only a few days of not eating."],
      ["Is it hairballs?", "A single hairball in a cat who then eats is common. Repeated retching or a cat who will not touch food is a medical visit."],
      ["Should I offer tuna to tempt a cat?", "A taste of a familiar food is fine. A long stretch of tuna, milk, or a new raw diet is not a treatment for nausea or dental pain."],
    ],
    html: `
<h1>Cat not eating</h1>
<p>Cats are not small dogs when they skip a meal. A dog can miss breakfast and be fine. A cat who does not eat, especially an overweight cat, can develop hepatic lipidosis, a liver crisis that starts after only a few days without calories. Treat a quiet food bowl as a medical clue.</p>
<h2>How fast to call</h2>
<p>If your cat has eaten nothing for about 24 hours, call a clinic the same day. Call sooner if the cat is hiding, losing weight, vomiting, drooling, or breathing with the mouth open. Kittens who skip two meals should not wait overnight. A cat who is interested in food and then walks away, or who chews on one side, may have a painful mouth rather than a picky mood.</p>
<p>Drooling, a pawing at the face, or a foul smell from the mouth points toward dental disease, a foreign body under the tongue, or mouth ulcers. Kidney disease, pancreatitis, and intestinal disease often show up as nausea: the cat sits by the bowl, licks its lips, and leaves. You will not sort those apart from the kitchen.</p>
<h2>What you can check at home</h2>
<p>Confirm the cat is not locked in a closet or eating in a different room. Make sure another pet is not guarding the bowl. Offer the usual diet, slightly warmed, in a quiet place. Do not start a cupboard tour of fish, milk, and deli meat. A cat who feels sick may eat the novelty once and then refuse everything, including the food you will need later for medications.</p>
<p>Count the litter box. No urine, or straining, changes the problem into a possible urinary obstruction, which is an emergency in male cats and is covered on the <a href="/vet/symptoms/cat-urinary">cat urinary page</a>. No stool plus a tight belly also deserves a same-day exam.</p>
<h2>At the clinic</h2>
<p>Expect questions about weight trend, thirst, vomiting, and whether the appetite crash was sudden. Bloodwork is common because kidney disease and liver stress do not have a reliable home test. If the cat has already gone several days without food, the veterinarian may talk about appetite stimulants, anti-nausea medication, or a feeding tube. A tube sounds drastic and is often the kindest way to get calories in while the cause is treated.</p>
<p>Do not give human pain medicine, essential oils on the chin, or "just a little" of a dog's medication. Use the <a href="/vet/checker">when-to-see-a-vet checker</a> and the <a href="/vet/">vet help hub</a> for the next step.</p>
${SOURCES}
<h2>Cat appetite questions</h2>
<h3>How long can a cat go without eating?</h3>
<p>Call a veterinarian if a cat skips more than a day of calories. Overweight cats can develop hepatic lipidosis after only a few days of not eating.</p>
<h3>Is it hairballs?</h3>
<p>A single hairball in a cat who then eats is common. Repeated retching or a cat who will not touch food is a medical visit.</p>
<h3>Should I offer tuna to tempt a cat?</h3>
<p>A taste of a familiar food is fine. A long stretch of tuna, milk, or a new raw diet is not a treatment for nausea or dental pain.</p>`,
  },
  {
    slug: "cat-vomiting",
    title: "Cat vomiting",
    description: "Hairballs versus illness when a cat vomits, and the patterns that need a veterinarian quickly.",
    faqs: [
      ["How often is cat vomiting too often?", "More than once a week, or any day with repeated episodes, deserves a veterinary visit rather than another hairball paste."],
      ["What if the vomit is clear or foamy?", "Foam can be bile or stomach fluid. If it happens often, or with weight loss, it is a medical workup, not a snack schedule tweak alone."],
      ["Are houseplants a concern?", "Yes. Lilies are an emergency for cats even in small amounts. If a lily may have been chewed, go to a clinic now."],
    ],
    html: `
<h1>Cat vomiting</h1>
<p>People normalize cat vomit because hairballs are real. The trouble is that kidney disease, hyperthyroidism, intestinal disease, and toxins look like "just a hairball" until the cat is thin. Frequency and weight are the two facts that cut through the habit.</p>
<h2>Hairball or illness</h2>
<p>A true hairball is a damp wad of hair, usually produced with a single retch, in a cat who grooms a lot and then eats dinner. Liquid vomit with no hair, vomit several times a month, or vomit plus weight loss is not a grooming story. Bring a photo. Note whether food comes up right after eating (sometimes regurgitation or eating too fast) or hours later.</p>
<p>Blood, or brown liquid that looks like coffee grounds, should be seen promptly. So should vomiting with straining to urinate, which can be pain from a blocked bladder rather than a stomach bug. Male cats who vomit and visit the box without producing urine need an emergency clinic.</p>
<h2>Toxins that cannot wait</h2>
<p>Lilies, including many florist lilies and daylilies, can cause kidney failure in cats after a small exposure to pollen or vase water. That is an emergency even if the cat looks fine in the first hour. Permethrin from dog flea spot-ons causes tremors and is also an emergency. Human pain relievers, lilies, and essential oils do not belong in a "watch until morning" plan.</p>
<p>String is another classic. A cat who vomits and has thread under the tongue, or who ate a tinsel strand, may have a linear foreign body. Do not pull a long string that disappears down the throat. Pulling can saw through intestine.</p>
<h2>Chronic vomiting</h2>
<p>Older cats who vomit weekly often need bloodwork and a thyroid check. Hyperthyroidism and chronic kidney disease are common, treatable to a point, and easy to miss if everyone calls it hairballs. Inflammatory bowel disease and intestinal lymphoma can look the same from the outside: intermittent vomit, a picky appetite, and a slowly disappearing waist. Diet trials and imaging are clinic decisions.</p>
<p>While you wait for a booked visit, pull extra treats, keep the usual food, and pick up hair ties and plants. Do not start a rotating buffet. The <a href="/vet/checker">checker</a> and the <a href="/vet/symptoms/cat-not-eating">not-eating guide</a> cover the overlap between nausea and a skipped bowl. More topics sit on the <a href="/vet/">vet help hub</a>.</p>
${SOURCES}
<h2>Cat vomiting questions</h2>
<h3>How often is cat vomiting too often?</h3>
<p>More than once a week, or any day with repeated episodes, deserves a veterinary visit rather than another hairball paste.</p>
<h3>What if the vomit is clear or foamy?</h3>
<p>Foam can be bile or stomach fluid. If it happens often, or with weight loss, it is a medical workup, not a snack schedule tweak alone.</p>
<h3>Are houseplants a concern?</h3>
<p>Yes. Lilies are an emergency for cats even in small amounts. If a lily may have been chewed, go to a clinic now.</p>`,
  },
  {
    slug: "cat-urinary",
    title: "Cat urinary problems",
    description: "Straining, blood in the box, and the male-cat urethral blockage that cannot wait until morning.",
    faqs: [
      ["Is a male cat straining an emergency?", "Yes. A urethral blockage can become life-threatening within hours. Go to an open clinic if a male cat strains, cries, or produces little or no urine."],
      ["What if there is blood but the cat still passes urine?", "Blood with a normal stream still needs a veterinarian promptly. It is less immediately deadly than a blockage and it is not a wait-and-see week."],
      ["Will stress alone cause this?", "Stress and a dry diet are part of feline lower urinary tract disease. They do not let you skip the exam, because you cannot see a blockage from across the room."],
    ],
    html: `
<h1>Cat urinary problems</h1>
<p>Urinary trouble in cats runs from uncomfortable bladder inflammation to a complete blockage. The blocked male cat is the one people wait on too long. If you remember one rule, make it this: a male cat who visits the box again and again and produces little or no urine needs an emergency clinic.</p>
<h2>Blockage versus cystitis</h2>
<p>A urethral plug or stone stops urine from leaving. The bladder fills, potassium rises, and the cat becomes painful, then weak, then collapsed. Early signs are easy to misread as constipation: squatting, crying, licking the penis, a drop of blood on the rim of the box, vomiting, and hiding. Feel the belly only if you can do it without hurting him. A bladder the size of an orange that feels like a rock is an emergency. If you are unsure, go anyway.</p>
<p>Female cats block less often and still get feline idiopathic cystitis and stones. Blood in the box, urinating outside the box, and frequent small puddles deserve a same-day visit. Crystals and infection are diagnosed from a urine sample the clinic collects. The sample you scoop off litter is often too contaminated to trust.</p>
<h2>What not to do overnight</h2>
<p>Do not wait for a male cat to "pass it" until morning. Do not give human painkillers. Do not force water with a syringe into a cat who is vomiting. A prescription urinary diet is useful after a diagnosis and is not the treatment of a cat who is already blocked. Those cats need the obstruction relieved, fluids, and monitoring.</p>
<p>After an episode, clinics often talk about water fountains, canned food to raise moisture, litter-box number (more boxes than cats), and reducing stress in the house. Those steps lower recurrence. They are the follow-up, not the emergency plan.</p>
<h2>Other cats in the house</h2>
<p>A cat who avoids a dirty or ambushed box may urinate elsewhere without having bladder disease. If the stream is large, the cat is comfortable, and there is no blood, a behavior and husbandry review is reasonable. The moment there is straining, blood, or vocalizing, assume a medical problem first. Use the <a href="/vet/checker">when-to-see-a-vet checker</a>, and read <a href="/vet/symptoms/cat-not-eating">cat not eating</a> if nausea showed up too. The <a href="/vet/">vet help hub</a> links the rest.</p>
${SOURCES}
<h2>Cat urinary questions</h2>
<h3>Is a male cat straining an emergency?</h3>
<p>Yes. A urethral blockage can become life-threatening within hours. Go to an open clinic if a male cat strains, cries, or produces little or no urine.</p>
<h3>What if there is blood but the cat still passes urine?</h3>
<p>Blood with a normal stream still needs a veterinarian promptly. It is less immediately deadly than a blockage and it is not a wait-and-see week.</p>
<h3>Will stress alone cause this?</h3>
<p>Stress and a dry diet are part of feline lower urinary tract disease. They do not let you skip the exam, because you cannot see a blockage from across the room.</p>`,
  },
  {
    slug: "bird-quiet",
    title: "Quiet or fluffed bird",
    description: "Why a suddenly quiet, fluffed bird is a same-day avian emergency more often than a mood.",
    faqs: [
      ["Why do birds hide illness?", "A sick bird who looks obviously weak is an easy target in the wild. Pet birds often look almost normal until they are very ill."],
      ["What is a tail bob?", "The tail pumps with each breath because breathing takes extra work. That pattern should be seen by an avian veterinarian the same day."],
      ["Can I offer a heat lamp and wait?", "Gentle warmth can support a bird on the way to the clinic. It is not a substitute for an exam if the bird is fluffed, on the cage floor, or not eating."],
    ],
    html: `
<h1>Quiet or fluffed bird</h1>
<p>A bird who is suddenly quiet is not being polite. Prey species hide weakness. By the time a parakeet, cockatiel, or parrot sits fluffed on the cage floor, the illness is often advanced. Same-day care with an avian veterinarian is the default, not the dramatic option.</p>
<h2>Signs that should move you now</h2>
<p>Watch the breathing before you watch the personality. A tail that bobs with each breath, an open beak, a click or whistle on the inhale, or a bird who sleeps on the floor of the cage instead of a perch needs an emergency or avian clinic today. Droppings that are fewer, or that change from the bird's normal mix of dark feces and white urates, are an early clue people miss. Take a paper towel sample or a photo.</p>
<p>One closed eye, a tilted head, vomiting (head flicking seed onto the cage), blood anywhere, or a female who is straining to pass an egg are also same-day problems. Egg binding can kill a small hen within hours. Do not press on the belly to "help the egg."</p>
<h2>While you travel</h2>
<p>Keep the carrier warm, dark, and quiet. A hospital cage can be a small carrier over a heating pad set low, with a towel so the bird cannot touch the pad directly. Offer the usual food and water if the bird can perch safely. Do not force millet into a gasping bird, and do not give water by syringe to a bird who is too weak to swallow. Aspiration is easy.</p>
<p>Skip oils, vinegar, and over-the-counter bird tonics. Bring the food bag, any nonstick pan that overheated recently (fumes from PTFE-coated pans kill birds), and a note about new toys, candles, or cleaners. Airborne toxins are a classic cause of a bird who was fine at noon and is on the floor at dinner.</p>
<h2>Finding the right clinic</h2>
<p>Not every dog-and-cat clinic stocks avian drugs or knows how to handle a budgie. The Association of Avian Veterinarians keeps a public locator at <a href="https://www.aav.org">aav.org</a>. If the only open door is a general emergency hospital, go there and say clearly that the patient is a bird. Waiting for the perfect specialist until morning is the wrong trade when the bird is tail-bobbing tonight.</p>
<p>The <a href="/vet/checker">checker</a> includes fluffed birds and labored breathing. Species profiles are on the <a href="/breeds/bird-breeds">bird directory</a>, and the <a href="/vet/">vet help hub</a> links the other symptom pages.</p>
${SOURCES}
<h2>Quiet bird questions</h2>
<h3>Why do birds hide illness?</h3>
<p>A sick bird who looks obviously weak is an easy target in the wild. Pet birds often look almost normal until they are very ill.</p>
<h3>What is a tail bob?</h3>
<p>The tail pumps with each breath because breathing takes extra work. That pattern should be seen by an avian veterinarian the same day.</p>
<h3>Can I offer a heat lamp and wait?</h3>
<p>Gentle warmth can support a bird on the way to the clinic. It is not a substitute for an exam if the bird is fluffed, on the cage floor, or not eating.</p>`,
  },
  {
    slug: "reptile-not-eating",
    title: "Reptile not eating",
    description: "How to separate a normal seasonal slowdown from illness when a reptile stops eating.",
    faqs: [
      ["When is a reptile fast an emergency?", "Weight loss, a thinning tail, sunken eyes, discharge, or a snake who refuses food and is losing body condition should be seen by a reptile veterinarian."],
      ["Should I just warm the tank?", "Check temperatures with a thermometer, not your hand. Correct the gradient if it is wrong, and still call a vet if the animal is losing weight."],
      ["Is brumation safe to assume?", "Only if the animal is a healthy adult of a species that actually brumates, the setup is correct, and weight is stable. Sick reptiles get labeled as brumating too often."],
    ],
    html: `
<h1>Reptile not eating</h1>
<p>Reptiles skip meals for boring reasons and for serious ones. A leopard gecko who pauses for a week in winter while holding a fat tail is not the same patient as a bearded dragon who is losing weight with sunken eyes. Husbandry is the first question. It is not the only question.</p>
<h2>Measure before you guess</h2>
<p>Write down the hot-side and cool-side temperatures from a thermometer at animal level, and the humidity. Hands are a bad thermometer. Many "anorexia" cases are a basking spot that never reaches the range that species needs to digest. UVB bulbs expire before they look dim. A coil bulb on the wrong side of glass may be doing nothing. Correct a clear husbandry miss, then watch appetite and weight. If you do not know the target range, use the species profile on this site and a reptile veterinarian, not a forum average.</p>
<p>Weigh the animal on a gram scale. A snake or lizard who refuses food and is also losing weight is sick until proven otherwise. A fat tail on a leopard gecko is a fuel tank. A stick tail is a warning associated with chronic infection, including cryptosporidiosis, and it needs a clinic that sees reptiles. The Association of Reptile and Amphibian Veterinarians explains how to find one at <a href="https://arav.org">arav.org</a>.</p>
<h2>Species patterns</h2>
<p>Ball pythons are famous for fasting, especially in winter, and some healthy adults pause for weeks. That reputation causes people to ignore a thin snake, a respiratory whistle, or mites. A fast plus weight loss, bubbles at the nose, or stuck shed in a dry rack is a veterinary problem. Corn snakes who are otherwise bright rarely fast for long. A bearded dragon who stops eating and sits in one corner may be cold, impacted, or dealing with parasites or metabolic bone disease. Soft jaw and trembling limbs are an emergency pattern for calcium and lighting failure.</p>
<p>Amphibians who stop eating often have a water-quality or temperature problem, or chytrid-type illness in new animals. Quarantine new arrivals. Do not soak a dehydrated frog in a random electrolyte recipe from the internet. A short shallow soak in dechlorinated water at the right temperature is the usual first aid while you travel, and only if the animal can hold its head up.</p>
<h2>Red flags</h2>
<ul>
  <li>Weight loss you can measure, a thinning tail, or sunken eyes.</li>
  <li>Open-mouth breathing, discharge from the nose, or a wheeze.</li>
  <li>Straining, a prolapse from the vent, or a lump that is growing.</li>
  <li>No stool with a firm belly after a large meal, especially on loose substrate.</li>
  <li>Tremors, a rubbery jaw, or inability to lift the body.</li>
</ul>
<p>The <a href="/vet/checker">checker</a> groups these as urgent or soon. Species care notes start at the <a href="/breeds/reptile-breeds">reptile directory</a> and the <a href="/vet/">vet help hub</a>.</p>
${SOURCES}
<h2>Reptile appetite questions</h2>
<h3>When is a reptile fast an emergency?</h3>
<p>Weight loss, a thinning tail, sunken eyes, discharge, or a snake who refuses food and is losing body condition should be seen by a reptile veterinarian.</p>
<h3>Should I just warm the tank?</h3>
<p>Check temperatures with a thermometer, not your hand. Correct the gradient if it is wrong, and still call a vet if the animal is losing weight.</p>
<h3>Is brumation safe to assume?</h3>
<p>Only if the animal is a healthy adult of a species that actually brumates, the setup is correct, and weight is stable. Sick reptiles get labeled as brumating too often.</p>`,
  },
  {
    slug: "fish-gasping",
    title: "Fish gasping at the surface",
    description: "Surface gasping in aquarium fish: oxygen, ammonia, and what to change in the water tonight.",
    faqs: [
      ["Why are fish gasping at the top?", "They are usually short of oxygen, or gills are damaged by ammonia, nitrite, or parasites. Test the water before adding medications."],
      ["Should I do a water change?", "A partial water change with temperature-matched, dechlorinated water is the usual first step when many fish gasp at once."],
      ["Is one fish gasping different?", "One fish at the surface can still be a water problem. It can also be gill disease in that fish. If the group looks fine, separate the sick fish only if you can do it gently, and test the tank anyway."],
    ],
    html: `
<h1>Fish gasping at the surface</h1>
<p>Fish at the surface, mouths breaking the water, are breathing wrong. The whole tank doing it at once is almost always water: low oxygen, high ammonia, or high nitrite. One fish doing it while the others feed can be gill flukes, injury, or the start of the same water problem. Test before you medicate.</p>
<h2>Do this in the first hour</h2>
<p>Look at the thermometer and the filter. A heater stuck on, a filter that stopped, or a film of dust on the surface can drop oxygen fast. Increase surface movement with an air stone or by lowering the water to the filter outlet so it splashes. Do not crank the heater to "help." Match any new water to the tank temperature.</p>
<p>Change 30 to 50 percent of the water if you do not have test results yet and many fish are gasping. Use a dechlorinator that treats the tap water you actually have. Siphon debris from the gravel without tearing up the whole bed. Ammonia spikes after overfeeding, a dead fish, a crashed cycle, or a filter rinsed in chlorinated tap water until the bacteria were gone.</p>
<h2>Read the tests</h2>
<p>Ammonia and nitrite should be zero in a cycled tank. Any measurable ammonia with gasping fish is an emergency for the animals even if they are still upright. Nitrite damages gills and blood. Nitrate is a slower stressor. pH crashes happen in poorly buffered tanks and will also put fish at the surface. Write the numbers down. "The water looks clear" is not a test.</p>
<p>If ammonia is high, keep changing water, stop feeding for a day, and do not add an antibiotic as a reflex. Medicines that claim to fix water are not a substitute for removal of the waste. Some "pH up" products swing the chemistry harder than the fish can stand.</p>
<h2>When it is not the whole tank</h2>
<p>A single fish clamping fins, flashing, or gasping while tankmates are normal may have parasites or a bacterial gill infection. Quarantine is ideal if the fish can be netted without a chase that uses up the last of its oxygen. A short net, a wait, and a container of tank water beat a ten-minute pursuit. Salt, formalin, and copper are easy to overdose. Copper is deadly to invertebrates and to some fish, and it does not belong in the display tank "just in case."</p>
<p>Marine fish gasping is the same emergency with less room for error. Check salinity, temperature, and whether a protein skimmer or powerhead failed. The <a href="/vet/checker">checker</a> marks widespread gasping as urgent. Freshwater and marine profiles are on the <a href="/breeds/fish-breeds">fish directory</a> and the <a href="/breeds/marine-fish-breeds">marine directory</a>.</p>
${SOURCES}
<h2>Gasping fish questions</h2>
<h3>Why are fish gasping at the top?</h3>
<p>They are usually short of oxygen, or gills are damaged by ammonia, nitrite, or parasites. Test the water before adding medications.</p>
<h3>Should I do a water change?</h3>
<p>A partial water change with temperature-matched, dechlorinated water is the usual first step when many fish gasp at once.</p>
<h3>Is one fish gasping different?</h3>
<p>One fish at the surface can still be a water problem. It can also be gill disease in that fish. If the group looks fine, separate the sick fish only if you can do it gently, and test the tank anyway.</p>`,
  },
  {
    slug: "small-mammal-not-eating",
    title: "Rabbit or small mammal not eating",
    description: "Why rabbits and guinea pigs who stop eating need a veterinarian within hours, not the next day.",
    faqs: [
      ["How fast is GI stasis an emergency?", "A rabbit or guinea pig who has not eaten for about 8 to 12 hours, or who has no droppings, should be seen the same day. Overnight waits are how these cases get critical."],
      ["Can I syringe feed at home?", "Only if a veterinarian has shown you how and the animal is still swallowing. Force-feeding a weak or bloated pet can cause aspiration."],
      ["Is a guinea pig the same as a rabbit?", "Both need constant hay and both crash when they stop eating. Guinea pigs also need vitamin C. Neither species should be fasted before a routine visit."],
    ],
    html: `
<h1>Rabbit or small mammal not eating</h1>
<p>Rabbits, guinea pigs, and chinchillas eat almost constantly. A missed meal is not a mood. Their guts slow down when fiber stops coming in, gas builds, and the animal gets painful and colder. That spiral, often called gastrointestinal stasis, is a same-day emergency.</p>
<h2>The clock</h2>
<p>If a rabbit or guinea pig has refused hay and pellets for about 8 to 12 hours, or the overnight droppings are tiny, dry, or missing, call a clinic that sees exotics today. Go to an emergency hospital if the pet is hunched, grinding teeth, bloated, cold, or unwilling to move. Tooth grinding in these species is pain, not contentment. A ballooned belly with no stool is not a "wait until Monday" problem.</p>
<p>Rats and hamsters also need a prompt visit if they stop eating, though the classic gas crisis is most famous in rabbits and guinea pigs. A hamster who is wobbly or cold is an emergency. Sugar gliders and ferrets who skip food can become hypoglycemic. Offer a small familiar meal on the way only if the animal is alert and swallowing.</p>
<h2>What you can do on the way</h2>
<p>Keep the carrier warm and quiet. A rabbit's normal body temperature is higher than a human's comfort, and a painful rabbit drops that temperature. Do not put a heating pad on high or leave the animal on it unattended. Offer a small pile of the usual hay. Do not feed yogurt drops, bread, or a new salad mix as a bribe.</p>
<p>Syringe feeding a recovery formula can be lifesaving after a veterinarian doses pain medicine and shows you the technique. It is dangerous in a bloated, unconscious, or struggling animal because the formula can enter the lungs. If you have not been taught, do not improvise with a baby bottle on the way to the clinic.</p>
<h2>After the crisis</h2>
<p>Dental spurs are a leading reason these pets stop eating. The molars are hard to see at home. A pet who dribbles, prefers soft food, or drops hay may need the teeth examined under proper lighting, sometimes with sedation. Guinea pigs need a dietary source of vitamin C every day. Both species should have unlimited grass hay. Pellets are a side dish.</p>
<p>Find a clinic before you need one. Not every emergency hospital stocks the pain drugs and formulas these species require, so ask "do you treat rabbits tonight?" when you call. The <a href="/vet/checker">checker</a> treats "not eating" in a rabbit or guinea pig as urgent. More small-mammal profiles are on the <a href="/breeds/small-animal-breeds">small animal directory</a>.</p>
${SOURCES}
<h2>Small mammal appetite questions</h2>
<h3>How fast is GI stasis an emergency?</h3>
<p>A rabbit or guinea pig who has not eaten for about 8 to 12 hours, or who has no droppings, should be seen the same day. Overnight waits are how these cases get critical.</p>
<h3>Can I syringe feed at home?</h3>
<p>Only if a veterinarian has shown you how and the animal is still swallowing. Force-feeding a weak or bloated pet can cause aspiration.</p>
<h3>Is a guinea pig the same as a rabbit?</h3>
<p>Both need constant hay and both crash when they stop eating. Guinea pigs also need vitamin C. Neither species should be fasted before a routine visit.</p>`,
  },
];

export function symptomHead(page) {
  return faqSchema(page.faqs);
}

export function hubBody() {
  const cards = symptoms.map((s) => `<a class="guide-card" href="/vet/symptoms/${s.slug}"><h3>${s.title}</h3><p>${s.description}</p></a>`).join("\n");
  return `
<h1>Vet help</h1>
<p>These pages help you decide how fast to reach a clinic. They do not diagnose. A veterinarian who can see, hear, and touch the animal outranks any article, including this one.</p>
<div class="emergency-callout">
  <h4>If breathing is hard, the animal collapsed, or a male cat cannot urinate</h4>
  <p>Go to an open veterinary emergency hospital. If a toxin is involved and the pet is still stable enough for a phone call, the ASPCA Animal Poison Control Center is (888) 426-4435. A consultation fee may apply.</p>
</div>
<p><a class="cta-button" href="/vet/checker">Open the when-to-see-a-vet checker</a></p>
<h2>Symptom guides</h2>
<div class="guide-grid">
${cards}
</div>
<h2>How this section is meant to be used</h2>
<p>Start with the checker if you are staring at a sick pet and need a speed: urgent, soon, or monitor. Open a symptom guide when you want the reasoning behind that speed. Breed and species profiles link here from their red-flag sections so the same advice is not copied onto every animal page.</p>
<p>Urgent means an emergency hospital now. Soon means a clinic today or the next open appointment, and an emergency hospital if your regular clinic is closed and the pet is worsening. Monitor means a bright animal with a mild, brief change, plus a promise to call if the picture shifts.</p>
<h2>What we will not do</h2>
<p>We will not name a dose of a human painkiller. We will not tell you a swelling belly can wait until morning. We will not pretend a telemedicine chat replaces oxygen, surgery, or a urine sample. The <a href="/chat">AI pet helper</a> on this site is educational in the same way. If the pet is in danger, close the tab and drive.</p>
${SOURCES}`;
}

export function checkerBody() {
  return `
<h1>When to see a vet</h1>
<p>Pick the species, tick what you are seeing, and the checker will sort the situation into urgent, soon, or monitor. It is a safety sort, not a diagnosis and not a triage line staffed by a clinic.</p>
<div class="warning-box">
  <h4>Disclaimer</h4>
  <p>This tool does not examine your animal and does not create a veterinary-client relationship. If you are unsure, call a clinic. Trouble breathing, collapse, uncontrolled bleeding, seizures that keep going, a male cat who cannot urinate, a tight swelling belly in a dog, or a rabbit or guinea pig who has stopped eating should go to an emergency hospital now.</p>
</div>
<form class="checker-form" id="vet-checker" action="#">
  <label class="checker-species">Species
    <select id="checker-species" name="species">
      <option value="dog">Dog</option>
      <option value="cat">Cat</option>
      <option value="bird">Bird</option>
      <option value="reptile">Reptile or amphibian</option>
      <option value="small">Rabbit or small mammal</option>
      <option value="fish">Fish</option>
    </select>
  </label>
  <fieldset>
    <legend>What are you seeing?</legend>
    <div id="checker-options"></div>
  </fieldset>
  <button type="submit" class="primary-btn">Check</button>
</form>
<div id="checker-result" class="checker-result" hidden></div>
<h2>How the three speeds work</h2>
<p><strong>Urgent</strong> means leave now for the nearest open veterinary ER. Call them from the car so they can prepare oxygen, a blockage procedure, or decontamination. If the pet was hit by a car, is unconscious, or was in a fight with a wild animal, go even if the list below did not quite match.</p>
<p><strong>Soon</strong> means contact your clinic today. If they cannot see a worsening pet, ask which emergency hospital they use. Soon is not "sometime this month."</p>
<p><strong>Monitor</strong> means the animal is bright, the change is mild, and you have a plan to call if appetite, breathing, urine, or energy gets worse. Write down the time the sign started.</p>
<h2>Poison help</h2>
<p>ASPCA Animal Poison Control Center: (888) 426-4435. Pet Poison Helpline: (855) 764-7661. Both may charge a consultation fee. Bring the package. Do not induce vomiting unless a poison specialist or veterinarian tells you to. Some substances burn on the way back up.</p>
<p>Read the matching guide after you have a speed: <a href="/vet/symptoms/dog-vomiting">dog vomiting</a>, <a href="/vet/symptoms/dog-diarrhea">dog diarrhea</a>, <a href="/vet/symptoms/dog-limping">dog limping</a>, <a href="/vet/symptoms/dog-itching">dog itching</a>, <a href="/vet/symptoms/cat-not-eating">cat not eating</a>, <a href="/vet/symptoms/cat-vomiting">cat vomiting</a>, <a href="/vet/symptoms/cat-urinary">cat urinary</a>, <a href="/vet/symptoms/bird-quiet">quiet bird</a>, <a href="/vet/symptoms/reptile-not-eating">reptile not eating</a>, <a href="/vet/symptoms/fish-gasping">fish gasping</a>, <a href="/vet/symptoms/small-mammal-not-eating">small mammal not eating</a>.</p>
<script>
(function () {
  const options = [
    { id: "breathing", level: "urgent", species: "all", label: "Trouble breathing, blue or pale gums, or open-mouth breathing in a cat or bird" },
    { id: "collapse", level: "urgent", species: "all", label: "Collapse, unresponsiveness, or a seizure that is still going or repeats" },
    { id: "bleeding", level: "urgent", species: "all", label: "Bleeding that will not stop, or a deep wound from a car or a fight" },
    { id: "toxin", level: "urgent", species: "all", label: "Known or possible poison, including chocolate, xylitol, grapes, lily, rodent bait, or a human painkiller" },
    { id: "bloat", level: "urgent", species: "dog", label: "Dog: unproductive retching or a tight, swelling belly" },
    { id: "block", level: "urgent", species: "cat", label: "Cat, especially male: straining to urinate with little or no urine" },
    { id: "stasis", level: "urgent", species: "small", label: "Rabbit or guinea pig: not eating, no droppings, hunched, or bloated" },
    { id: "birddown", level: "urgent", species: "bird", label: "Bird: fluffed on the cage floor, tail bobbing, or bleeding" },
    { id: "gasping", level: "urgent", species: "fish", label: "Several fish gasping at the surface or a filter that has stopped" },
    { id: "reptilebad", level: "urgent", species: "reptile", label: "Reptile: open-mouth breathing, prolapse, seizures, or a soft jaw with tremors" },
    { id: "vomitday", level: "soon", species: "dog cat", label: "Repeated vomiting today, or vomit with blood" },
    { id: "stool", level: "soon", species: "dog cat small", label: "Diarrhea with blood, black stool, or diarrhea plus lethargy" },
    { id: "limp", level: "soon", species: "dog cat", label: "Limping, or a leg that will not bear weight" },
    { id: "appetite", level: "soon", species: "dog cat bird reptile", label: "Has not eaten for about a day (sooner for cats, birds, and reptiles losing weight)" },
    { id: "eye", level: "soon", species: "all", label: "Squinting, a cloudy eye, or an eye injury" },
    { id: "itch", level: "soon", species: "dog cat", label: "A hot, oozing skin sore or an ear that smells and hurts" },
    { id: "onevomit", level: "monitor", species: "dog cat", label: "One vomit, then normal energy, gums, and appetite" },
    { id: "soft", level: "monitor", species: "dog", label: "One soft stool in a bright adult dog, no blood" },
    { id: "milditch", level: "monitor", species: "dog cat", label: "Mild scratching, no swelling, no breathing change" },
    { id: "singlefish", level: "monitor", species: "fish", label: "One fish slightly less active, water tests are normal, others are fine" }
  ];
  const box = document.getElementById("checker-options");
  const speciesEl = document.getElementById("checker-species");
  const result = document.getElementById("checker-result");
  function render() {
    const sp = speciesEl.value;
    box.innerHTML = options.filter((o) => o.species === "all" || o.species.split(" ").includes(sp)).map((o) =>
      '<label><input type="checkbox" data-level="' + o.level + '" value="' + o.id + '"> <span>' + o.label + '</span></label>'
    ).join("");
  }
  speciesEl.addEventListener("change", () => { render(); result.hidden = true; });
  render();
  document.getElementById("vet-checker").addEventListener("submit", function (e) {
    e.preventDefault();
    const picked = [...box.querySelectorAll("input:checked")];
    if (!picked.length) {
      result.hidden = false;
      result.className = "checker-result soon";
      result.innerHTML = "<h2>Select at least one sign</h2><p>If none of the lines fit and you are worried, call a clinic and describe what changed, when it started, and whether the animal is still eating.</p>";
      return;
    }
    const levels = picked.map((el) => el.dataset.level);
    let level = "monitor";
    if (levels.includes("urgent")) level = "urgent";
    else if (levels.includes("soon")) level = "soon";
    const copy = {
      urgent: "<h2>Urgent: go to a veterinary ER now</h2><p>Leave for the nearest open emergency hospital. Call ahead if someone else can dial while you drive. If this may be a poison and the pet is still standing, you can also call ASPCA Animal Poison Control at (888) 426-4435 on the way. Do not induce vomiting unless they tell you to.</p>",
      soon: "<h2>Soon: contact a clinic today</h2><p>Call your veterinarian and describe the signs. If they are closed or cannot fit a pet who is getting worse, ask which emergency hospital covers their patients. Keep water available unless vomiting makes that impossible. Skip human painkillers.</p>",
      monitor: "<h2>Monitor, and call if it changes</h2><p>The signs you ticked are the milder ones, and only if the animal is otherwise bright. Write down the time. Call a clinic if there is another episode, if appetite drops, if breathing changes, or if you simply do not like how the animal looks. You do not need permission to be more careful than this tool.</p>"
    };
    result.hidden = false;
    result.className = "checker-result " + level;
    result.innerHTML = copy[level] + "<p>This is not a diagnosis. A veterinarian who can examine the animal is the next authority.</p>";
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
})();
</script>`;
}

export function creditsIntro(hosted, placeholders) {
  return `<h1>Image credits</h1>
<p>Breed and species photographs on this site are copies of Wikimedia Commons files that were checked against the file title, description, and categories. Each kept photo had to depict that animal. We saved a 960 pixel image and a 250 pixel thumbnail as WebP.</p>
<p>${hosted} photographs are self-hosted. ${placeholders} profiles use the neutral “Photo coming soon” illustration because a usable Commons photo was missing or showed a different species. Those profiles are listed after the credit table.</p>
<p>License names below are the ones Commons reported. Follow the license link for the exact terms. Authors are credited as Commons recorded them.</p>`;
}
