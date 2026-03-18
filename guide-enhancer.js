(function() {
  'use strict';

  var article = document.querySelector('.guide-content');
  if (!article) return;

  var path = window.location.pathname;
  var title = document.querySelector('h1');
  if (!title) return;
  var titleText = title.textContent.trim();

  // Simple hash for deterministic variation
  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  var pageHash = hash(titleText);

  // Detect guide type from URL
  function getGuideType() {
    if (/temperament|personality/.test(path)) return 'temperament';
    if (/health-issues|health/.test(path)) return 'health';
    if (/how-to-train/.test(path)) return 'training';
    if (/shedding/.test(path)) return 'shedding';
    if (/pet-insurance|insurance/.test(path)) return 'insurance';
    if (/grooming/.test(path)) return 'grooming';
    if (/exercise/.test(path)) return 'exercise';
    if (/cost-of-ownership/.test(path)) return 'cost';
    if (/adopt-a-/.test(path)) return 'adoption';
    if (/best-food-for|best-food/.test(path)) return 'food';
    if (/lifespan/.test(path)) return 'lifespan';
    if (/with-kids/.test(path)) return 'kids';
    if (/apartment/.test(path)) return 'apartment';
    if (/can-dogs-eat|can-cats-eat/.test(path)) return 'food-safety';
    if (/care-guide|starter|beginner/.test(path)) return 'care';
    return 'general';
  }

  // Detect animal category from breadcrumb or URL
  function getAnimalCategory() {
    var bc = document.querySelector('.breadcrumb');
    if (bc) {
      var text = bc.textContent.toLowerCase();
      if (text.indexOf('dogs') !== -1) return 'dog';
      if (text.indexOf('cats') !== -1) return 'cat';
      if (text.indexOf('birds') !== -1) return 'bird';
      if (text.indexOf('reptiles') !== -1) return 'reptile';
      if (text.indexOf('amphibians') !== -1) return 'amphibian';
      if (text.indexOf('fish') !== -1 || text.indexOf('marine') !== -1) return 'fish';
      if (text.indexOf('small animals') !== -1) return 'small-animal';
    }
    if (/dog|puppy|terrier|retriever|shepherd|bulldog|poodle|spaniel|hound|collie|husky|corgi|labrador|beagle|dachshund|chihuahua|rottweiler|boxer|mastiff|akita|shiba/.test(path)) return 'dog';
    if (/cat|kitten|persian|siamese|bengal|maine-coon|ragdoll|sphynx|tabby|shorthair|longhair|abyssinian|burmese/.test(path)) return 'cat';
    if (/bird|parrot|parakeet|cockatiel|finch|canary|macaw|cockatoo|budgie|lovebird|conure/.test(path)) return 'bird';
    if (/reptile|gecko|snake|lizard|turtle|tortoise|iguana|chameleon|skink|bearded-dragon|python|boa/.test(path)) return 'reptile';
    if (/amphibian|frog|toad|newt|salamander|axolotl/.test(path)) return 'amphibian';
    if (/fish|aquarium|tetra|guppy|betta|goldfish|cichlid|barb|pleco/.test(path)) return 'fish';
    if (/hamster|rabbit|guinea-pig|ferret|gerbil|chinchilla|hedgehog|rat|mouse/.test(path)) return 'small-animal';
    return 'pet';
  }

  var guideType = getGuideType();
  var animalCat = getAnimalCategory();

  // Extract breed/animal name from title
  function getSubjectName() {
    var t = titleText;
    t = t.replace(/Guide|Personality|Temperament|Health Issues|Pet Insurance|Cost of Ownership|Grooming|Shedding|Exercise Needs|Lifespan|Apartment Living|How to Train a|Best Food for|with Kids|Adopt a/gi, '').trim();
    t = t.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
    return t || 'your pet';
  }
  var subject = getSubjectName();

  // Create styled section
  function createSection(heading, content, style) {
    var section = document.createElement('section');
    section.className = 'enhanced-insight';
    var styles = {
      green: 'background:#F0FDF4;border-left:4px solid #22C55E;',
      amber: 'background:#FFFBEB;border-left:4px solid #F59E0B;',
      blue: 'background:#EFF6FF;border-left:4px solid #3B82F6;',
      rose: 'background:#FFF1F2;border-left:4px solid #F43F5E;',
      purple: 'background:#FAF5FF;border-left:4px solid #A855F7;',
      slate: 'background:#F8FAFC;border-left:4px solid #64748B;'
    };
    section.style.cssText = (styles[style] || styles.slate) + 'padding:20px 24px;margin:28px 0;border-radius:0 10px 10px 0;';
    section.innerHTML = '<h3 style="margin:0 0 12px 0;font-size:1.1em;">' + heading + '</h3>' + content;
    return section;
  }

  // Shuffle array deterministically based on hash
  function shuffled(arr, seed) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = (seed + i * 7) % (i + 1);
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  // Content pools by guide type
  var sections = {};

  // TEMPERAMENT GUIDES
  sections.temperament = [
    function() {
      var contexts = {
        dog: '<p>Temperament is shaped by genetics, early socialization, and ongoing environment. A ' + subject + ' raised in isolation will behave differently from one with diverse early experiences, even with identical lineage.</p><ul><li>Puppies have a critical socialization window between 3 and 14 weeks — experiences during this period disproportionately shape adult behavior</li><li>Lack of early positive exposure to varied people, animals, and environments often leads to fear-based reactivity later</li><li>Breed tendencies set a baseline, but individual variation within any breed is substantial</li></ul>',
        cat: '<p>Feline temperament is influenced by genetics, maternal behavior, and early handling. Cats handled gently between 2 and 7 weeks of age tend to be more social and confident as adults.</p><ul><li>Unlike dogs, cats were not selectively bred for cooperation with humans — their social behavior is more variable</li><li>A cat\'s relationship with its primary caregiver is often more nuanced than perceived — research shows cats do form secure attachments</li><li>Stress signals in cats are subtle — many owners misread avoidance as independence</li></ul>',
        bird: '<p>Avian temperament is closely tied to species-specific flock dynamics and individual history. Birds that are hand-raised tend to be more comfortable with human interaction but may develop dependency issues.</p><ul><li>Parrots in particular can exhibit complex emotional responses including jealousy, preference for specific people, and mourning</li><li>Noise level and vocalization patterns are temperament traits that vary enormously even within the same species</li></ul>',
        reptile: '<p>Reptile behavior is often mischaracterized as personality when it is primarily driven by thermoregulation needs, hunger state, and stress levels. What appears to be "friendliness" in a reptile is typically calm tolerance.</p><ul><li>Consistent, gentle handling from a young age builds tolerance, not affection in the mammalian sense</li><li>Defensive behaviors like hissing, puffing, or tail whipping are stress responses, not aggression</li></ul>'
      };
      return createSection('What Actually Shapes ' + subject + ' Behavior', contexts[animalCat] || contexts.dog, 'blue');
    },
    function() {
      var items = {
        dog: '<ul><li>Assuming a breed label fully predicts an individual dog\'s behavior — mixed-breed dogs and shelter dogs often defy breed stereotypes</li><li>Confusing submissive behavior with calm temperament — a fearful dog that freezes is not a "well-behaved" dog</li><li>Expecting adult temperament from a puppy — many breed-specific traits (like guarding instincts) do not fully emerge until 18-36 months</li><li>Over-socializing a shy dog by forcing interactions — gradual, positive exposure works; flooding creates more fear</li></ul>',
        cat: '<ul><li>Expecting a cat to be predictably affectionate on the owner\'s schedule — cats initiate interaction on their own terms</li><li>Interpreting a slow blink as indifference — it is actually a sign of trust and comfort</li><li>Punishing unwanted behavior — cats do not learn from punishment; they learn from environmental modification and positive reinforcement</li><li>Assuming all cats of a breed act the same — individual variation is often larger than breed differences</li></ul>',
        default: '<ul><li>Expecting immediate bonding — most animals need days to weeks to adjust to a new environment before showing their true temperament</li><li>Confusing fear-based behavior with aggression — the response is different and requires different handling</li><li>Assuming temperament is fixed — behavior is always an interaction between genetics and environment, and it can change with age, health status, and life experiences</li></ul>'
      };
      return createSection('Common Temperament Misconceptions', items[animalCat] || items['default'], 'amber');
    },
    function() {
      return createSection('When Behavior Changes Warrant a Vet Visit', '<p>Sudden personality changes are often the first sign of a medical problem, not a behavioral one.</p><ul><li>A normally social animal becoming withdrawn or hiding</li><li>Unexplained aggression or irritability in a previously calm animal</li><li>Changes in appetite, sleep patterns, or activity levels alongside behavioral shifts</li><li>Vocalizing more than usual, especially when being touched or picked up</li></ul><p><strong>Rule of thumb:</strong> If a behavioral change appears without any change in environment or routine, consult your veterinarian before assuming it is a training or socialization issue.</p>', 'rose');
    },
    function() {
      return createSection('What This Guide Does Not Cover', '<p>This temperament overview provides breed-level tendencies, not individual predictions. It does not cover:</p><ul><li>Behavioral modification for specific problems like separation anxiety, resource guarding, or fear aggression — these require professional assessment</li><li>Medication-assisted behavior management — only a veterinarian or veterinary behaviorist can prescribe and monitor anxiolytics</li><li>Breed-specific legislation or housing restrictions that may affect ownership</li></ul>', 'slate');
    }
  ];

  // HEALTH GUIDES
  sections.health = [
    function() {
      return createSection('When to Call Your Veterinarian Immediately', '<p>Not every health concern requires an emergency visit, but these signs should never be waited on:</p><ul><li><strong>Difficulty breathing</strong> — open-mouth breathing, labored respiration, or blue-tinged gums</li><li><strong>Sudden collapse or inability to stand</strong></li><li><strong>Uncontrolled bleeding</strong> that does not stop with gentle pressure within 5 minutes</li><li><strong>Suspected poisoning</strong> — bring the substance packaging if possible</li><li><strong>Bloated, hard abdomen</strong> with restlessness or unproductive retching (potential GDV in dogs)</li><li><strong>Seizures lasting more than 2 minutes</strong> or cluster seizures</li><li><strong>Unable to urinate</strong> for more than 12-24 hours (life-threatening in cats)</li></ul><p>For non-emergency concerns, a same-week appointment is usually appropriate. Document symptoms with photos or video before the visit — this helps your vet assess intermittent issues.</p>', 'rose');
    },
    function() {
      return createSection('Common Health Misinformation to Watch For', '<p>Pet health advice is abundant online, but not all of it is accurate. Be skeptical of:</p><ul><li>"Natural" remedies promoted as alternatives to veterinary treatment — some herbal supplements interact dangerously with medications or delay necessary care</li><li>Dosage advice from non-veterinary sources — drug metabolism varies significantly between species and even between breeds</li><li>Claims that certain diets cure genetic conditions — while nutrition matters, genetic predispositions cannot be "dieted away"</li><li>Anecdotal recovery stories presented as evidence — survivorship bias makes ineffective treatments appear successful</li></ul><p>When evaluating health claims, prioritize peer-reviewed veterinary research and guidance from licensed veterinarians who have examined your specific animal.</p>', 'amber');
    },
    function() {
      return createSection('Tracking Health Changes Over Time', '<p>Keeping a simple health log significantly improves veterinary care outcomes:</p><ul><li><strong>Monthly weight checks</strong> — unexplained weight gain or loss of 5-10% warrants investigation</li><li><strong>Eating and drinking patterns</strong> — note changes in appetite, water intake, or food preferences</li><li><strong>Behavior notes</strong> — changes in energy, social behavior, or sleep can precede visible illness by weeks</li><li><strong>Stool and urine</strong> — changes in color, consistency, frequency, or straining</li><li><strong>Photos of lumps, bumps, or skin changes</strong> — with dates, so your vet can track progression</li></ul><p>Bring this log to vet appointments. It provides objective data that helps distinguish chronic patterns from acute changes.</p>', 'green');
    },
    function() {
      return createSection('What This Health Guide Does Not Cover', '<p>This guide addresses breed-level health predispositions and general awareness. It intentionally does not cover:</p><ul><li>Specific dosages for any medication — all dosing requires veterinary calculation based on your individual animal\'s weight, age, and health status</li><li>Diagnostic interpretation — blood work values, imaging results, and test findings require professional context</li><li>Surgical decision-making — the decision to pursue surgery involves factors (anesthesia risk, recovery capacity, quality of life) that only your vet team can assess in person</li><li>Alternative or complementary therapies — evidence quality varies widely, and some may interact with conventional treatments</li></ul>', 'slate');
    }
  ];

  // TRAINING GUIDES
  sections.training = [
    function() {
      var items = {
        dog: '<ul><li><strong>Inconsistent rules between family members</strong> — if one person allows the dog on furniture and another punishes it, the dog cannot learn the expected behavior</li><li><strong>Training sessions that are too long</strong> — for most dogs, 5-10 minute sessions with clear rewards outperform 30-minute drills that lead to frustration</li><li><strong>Repeating a cue when the animal doesn\'t respond</strong> — saying "sit, sit, SIT" teaches the dog the cue is "sit-sit-sit," not "sit"</li><li><strong>Punishing after the fact</strong> — dogs associate consequences with their most recent action, not something they did minutes ago</li><li><strong>Skipping socialization during the critical period</strong> — no amount of adult training fully compensates for missed early socialization between 3-14 weeks</li></ul>',
        cat: '<ul><li><strong>Assuming cats can\'t be trained</strong> — cats respond well to positive reinforcement; they simply do not respond to coercion</li><li><strong>Using punishment-based methods</strong> — spray bottles, shaking cans, and physical corrections damage trust and increase stress without teaching desired behavior</li><li><strong>Not providing appropriate outlets</strong> — scratching, climbing, and hunting behavior are normal; redirect them, don\'t suppress them</li><li><strong>Ignoring environmental factors</strong> — many "behavior problems" are environmental problems (too few litter boxes, no vertical space, resource competition in multi-cat homes)</li></ul>',
        default: '<ul><li><strong>Moving too fast</strong> — building trust takes time, and rushing the process creates setbacks</li><li><strong>Inconsistent rewards</strong> — unpredictable reinforcement confuses learning</li><li><strong>Expecting human-like understanding</strong> — animals learn through association and consequence, not verbal explanation</li></ul>'
      };
      return createSection('Training Mistakes That Set Back Progress', items[animalCat] || items['default'], 'amber');
    },
    function() {
      return createSection('Realistic Training Timelines', '<p>Training guides often omit how long results actually take. Set realistic expectations:</p><ul><li><strong>Basic commands (sit, stay, come):</strong> Most animals grasp the basics in 1-3 weeks with daily practice, but reliable performance in distracting environments takes 3-6 months</li><li><strong>House training:</strong> Typically 4-6 months for puppies; some breeds take longer. Expect setbacks during adolescence (6-18 months)</li><li><strong>Leash manners:</strong> Consistent loose-leash walking usually requires 2-4 months of daily practice</li><li><strong>Fear or reactivity:</strong> Behavioral modification for fear-based issues often requires 6-12+ months of consistent counter-conditioning, sometimes with professional guidance</li></ul><p><strong>Key principle:</strong> If progress stalls for more than 2-3 weeks despite consistent effort, re-evaluate your approach or consult a certified professional trainer (look for CPDT-KA or IAABC credentials).</p>', 'green');
    },
    function() {
      return createSection('When Training Alone Is Not Enough', '<p>Some behavioral issues require professional assessment, not just more training:</p><ul><li>Aggression that involves biting with intent to harm — this is a safety issue, not a training gap</li><li>Severe separation anxiety (destructive behavior, self-harm, prolonged vocalization) — may require medication alongside behavior modification</li><li>Compulsive behaviors (tail chasing, excessive licking, pacing) — often have medical or neurological components</li><li>Sudden behavioral changes in a previously well-trained animal — rule out medical causes first</li></ul><p>A veterinary behaviorist (DACVB) can prescribe medication when needed and design comprehensive behavior modification plans. Your regular veterinarian can provide referrals.</p>', 'rose');
    }
  ];

  // INSURANCE GUIDES
  sections.insurance = [
    function() {
      return createSection('What Pet Insurance Typically Does Not Cover', '<p>Understanding exclusions is as important as understanding coverage:</p><ul><li><strong>Pre-existing conditions</strong> — any condition diagnosed or showing symptoms before coverage begins is excluded by virtually all insurers</li><li><strong>Waiting periods</strong> — most policies have 14-day waiting periods for illness and 2-day for accidents; some have 6-12 month waits for orthopedic conditions</li><li><strong>Cosmetic procedures</strong> — tail docking, ear cropping, dewclaw removal (unless medically necessary)</li><li><strong>Breeding-related costs</strong> — pregnancy, whelping/queening complications, C-sections</li><li><strong>Preventive care</strong> — unless you add a wellness rider (which may or may not be cost-effective depending on your vet\'s pricing)</li><li><strong>Behavioral treatment</strong> — coverage varies widely; some insurers cover behavioral consultations, many do not</li></ul>', 'amber');
    },
    function() {
      return createSection('Questions to Ask Before Choosing a Policy', '<ul><li>Does the policy use a benefit schedule (fixed payout per condition) or reimburse actual vet costs? — Actual cost reimbursement is generally more protective</li><li>What is the annual maximum, and is it per-condition or overall? — Per-condition limits can leave gaps for animals with multiple health issues</li><li>Can your veterinarian direct-bill, or must you pay upfront and submit claims? — Cash flow matters during expensive treatments</li><li>How does the premium change as your pet ages? — Request a premium projection for 5 and 10 years out</li><li>Is there a multi-pet discount? — If you have more than one animal, this can significantly affect value</li><li>What is the claims processing time? — Some insurers pay in days; others take weeks</li></ul>', 'blue');
    },
    function() {
      return createSection('When Insurance Makes the Biggest Financial Difference', '<p>Pet insurance provides the most value in specific scenarios:</p><ul><li><strong>Emergency surgery</strong> — a single cruciate ligament repair can cost $3,000-$6,000; GDV surgery $5,000-$10,000</li><li><strong>Chronic conditions requiring ongoing treatment</strong> — diabetes, allergies, hypothyroidism, or cancer treatment can cost $1,000-$5,000+ annually</li><li><strong>Breeds with known expensive health predispositions</strong> — the math often favors insurance for breeds with high rates of costly conditions</li></ul><p>Insurance is least cost-effective for healthy animals of breeds with few genetic predispositions who only need routine care. However, the point of insurance is protecting against the unexpected — not subsidizing predictable expenses.</p>', 'green');
    }
  ];

  // COST GUIDES
  sections.cost = [
    function() {
      return createSection('Costs Most New Owners Underestimate', '<ul><li><strong>Emergency veterinary care</strong> — a single after-hours vet visit averages $800-$2,500, and emergencies happen to about 1 in 3 pets annually</li><li><strong>Dental procedures</strong> — professional dental cleanings under anesthesia cost $300-$800; extractions add $150-$600 per tooth</li><li><strong>End-of-life care</strong> — euthanasia, cremation/burial, and associated costs typically run $200-$600</li><li><strong>Boarding or pet-sitting</strong> — holiday boarding averages $30-$85/night; costs add up quickly for vacations and work travel</li><li><strong>Home damage</strong> — chewing, scratching, accidents during house-training, and digging are normal behaviors that can cause real property damage in the first 1-2 years</li></ul>', 'amber');
    },
    function() {
      return createSection('Realistic Cost-Saving Strategies', '<p>Not all money-saving advice is equally effective. Here is what actually makes a meaningful difference:</p><ul><li><strong>Preventive care over reactive care</strong> — annual wellness exams catch problems early when treatment is 2-5x less expensive than late-stage intervention</li><li><strong>Dental home care</strong> — daily tooth brushing reduces the frequency of expensive professional cleanings</li><li><strong>Weight management</strong> — keeping your pet at a healthy weight reduces lifetime veterinary costs by an estimated 15-25% by preventing obesity-related conditions</li><li><strong>Buying food in larger quantities</strong> — bulk purchasing from reputable retailers can save 10-20% without compromising quality</li></ul><p><strong>What does not save money long-term:</strong> skipping vaccinations, buying the cheapest food regardless of quality, or avoiding vet visits until problems become severe.</p>', 'green');
    },
    function() {
      return createSection('Financial Planning Before You Commit', '<p>Before bringing a new pet home, run through this financial reality check:</p><ul><li>Can you absorb a $2,000-$5,000 unexpected veterinary bill without going into debt?</li><li>If not, are you prepared to pay $40-$80/month for pet insurance?</li><li>Have you budgeted for the first-year "startup" costs, which are typically 2-3x higher than subsequent years?</li><li>If you rent, have you verified pet policies and accounted for any required pet deposits or monthly pet rent?</li><li>Have you identified a primary veterinarian and confirmed their pricing is within your budget?</li></ul><p>Honest financial assessment before adoption prevents the painful situation of having to surrender a pet due to unforeseen costs — one of the most common reasons animals enter shelters.</p>', 'blue');
    }
  ];

  // GROOMING GUIDES
  sections.grooming = [
    function() {
      return createSection('Signs You Should Stop Grooming and Consult a Vet', '<p>Grooming is also an opportunity to detect health problems early. Stop and schedule a vet appointment if you notice:</p><ul><li>Lumps, bumps, or masses that were not there before — especially if they are growing or changing</li><li>Skin that is hot, inflamed, or has an unusual odor</li><li>Hair loss in patches (as opposed to normal shedding) — this may indicate allergies, hormonal issues, or skin infections</li><li>Excessive sensitivity or pain when touching areas that were previously tolerated</li><li>Discharge from ears that is dark, foul-smelling, or excessive</li><li>Nails that are splitting, cracked, or growing abnormally</li></ul>', 'rose');
    },
    function() {
      return createSection('Professional Grooming vs. Home Grooming: An Honest Assessment', '<p>Not everything needs a professional groomer, but some things genuinely do:</p><ul><li><strong>Worth doing at home:</strong> Regular brushing, basic bathing, nail trims (once you learn proper technique), ear cleaning, tooth brushing</li><li><strong>Worth paying a professional for:</strong> Breed-specific haircuts requiring clipping patterns, severely matted coats (matting close to skin can cause cuts if done incorrectly), anal gland expression (learn the signs that it is needed, but have your vet or groomer handle it)</li><li><strong>Money-saving tip:</strong> Ask your groomer for a "maintenance" visit between full grooms — just a bath, nail trim, and sanitary trim — at a lower cost</li></ul>', 'green');
    }
  ];

  // SHEDDING GUIDES
  sections.shedding = [
    function() {
      return createSection('When Shedding Is Not Normal Shedding', '<p>All animals with fur or feathers shed. But excessive or unusual hair loss may indicate a medical problem:</p><ul><li><strong>Patchy hair loss</strong> (bald spots) — may indicate ringworm, allergies, or hormonal disorders like hypothyroidism or Cushing\'s disease</li><li><strong>Excessive shedding with skin irritation</strong> — flea allergy dermatitis, food allergies, or environmental allergies</li><li><strong>Seasonal changes that seem extreme</strong> — indoor pets with consistent temperature exposure may shed year-round rather than seasonally, which is normal but can seem excessive</li><li><strong>Hair loss accompanied by excessive scratching, licking, or chewing</strong> — this is the animal trying to address discomfort, not a grooming preference</li></ul><p>If shedding patterns change suddenly or are accompanied by other symptoms, consult your veterinarian rather than assuming it is normal.</p>', 'rose');
    },
    function() {
      return createSection('What Actually Reduces Shedding (and What Doesn\'t)', '<p>Marketing claims about shedding products abound. Here is what the evidence supports:</p><ul><li><strong>Regular brushing works</strong> — it does not reduce the amount of hair shed but captures it before it reaches your furniture. Frequency depends on coat type.</li><li><strong>Quality nutrition helps</strong> — diets rich in omega-3 and omega-6 fatty acids support coat health, which can reduce breakage and excessive shedding</li><li><strong>"Deshedding" tools</strong> — effective when used correctly, but aggressive use can damage the coat and irritate skin. Follow manufacturer guidelines for frequency.</li><li><strong>What doesn\'t work:</strong> shaving double-coated breeds (damages the coat and does not reduce shedding), oral supplements without veterinary guidance (some are unnecessary; some can cause side effects)</li></ul>', 'green');
    }
  ];

  // FOOD/DIET GUIDES
  sections.food = [
    function() {
      return createSection('Reading Pet Food Labels: What Actually Matters', '<p>Pet food marketing is deliberately confusing. Focus on what is meaningful:</p><ul><li><strong>AAFCO statement</strong> — look for "complete and balanced" and whether it meets standards through feeding trials or formulation. Feeding trials are a higher standard.</li><li><strong>Life stage</strong> — "all life stages" food is formulated to meet puppy/kitten needs, which means higher calories. An adult-only formula is usually more appropriate for adult animals.</li><li><strong>Ingredient order matters less than you think</strong> — ingredients are listed by pre-cooking weight. "Chicken" as the first ingredient may contribute less protein than "chicken meal" listed third, because chicken is 70% water before cooking.</li><li><strong>Marketing terms to ignore:</strong> "holistic" (no legal definition), "premium" (no standard), "human-grade" (meaningful only if the facility is USDA-certified for human food production)</li></ul>', 'blue');
    },
    function() {
      return createSection('Dietary Mistakes to Avoid', '<ul><li><strong>Frequent diet changes</strong> — switching foods abruptly causes gastrointestinal upset. Transition over 7-10 days by mixing increasing proportions of the new food.</li><li><strong>Overfeeding treats</strong> — treats should constitute no more than 10% of daily caloric intake. Many owners significantly exceed this, contributing to obesity.</li><li><strong>Feeding raw without veterinary guidance</strong> — raw diets carry real risks of bacterial contamination (Salmonella, Listeria) for both the animal and human family members. If you choose raw feeding, do so with veterinary nutritionist oversight.</li><li><strong>Supplementing a complete diet</strong> — adding calcium, vitamins, or other supplements to an already balanced commercial diet can create dangerous nutrient imbalances</li></ul>', 'amber');
    }
  ];

  // ADOPTION GUIDES
  sections.adoption = [
    function() {
      return createSection('Questions to Ask the Shelter or Breeder', '<ul><li><strong>Shelters/rescues:</strong> What is known about this animal\'s history? How does it behave with other animals, children, and strangers? Has it been assessed for resource guarding? What medical care has been provided? Is there a return policy if the match does not work out?</li><li><strong>Breeders:</strong> Can you provide health clearance documentation for both parents? What is the health history of previous litters? What socialization has this animal received? Do you offer a health guarantee, and what does it cover? Will you take the animal back at any point in its life if the owner cannot keep it?</li></ul><p><strong>Red flags:</strong> Any source that discourages you from asking questions, will not allow you to see the living conditions, or pressures you to decide immediately.</p>', 'blue');
    },
    function() {
      return createSection('The First 72 Hours After Adoption', '<p>The transition period is the most stressful time for both you and your new pet. Plan for it:</p><ul><li><strong>Have the environment set up before arrival</strong> — food, water, sleeping area, confinement space. Do not introduce the entire house at once.</li><li><strong>Expect abnormal behavior</strong> — hiding, refusal to eat, excessive vocalization, or over-attachment are all normal stress responses during the first 3-14 days</li><li><strong>Limit visitors</strong> — well-meaning friends and family should wait at least a week before meeting the new animal</li><li><strong>Follow the "3-3-3 rule" (for dogs):</strong> 3 days to decompress, 3 weeks to learn your routine, 3 months to feel at home. Do not judge a dog\'s permanent personality during the first month.</li><li><strong>Schedule a vet visit</strong> within the first week — even if the shelter provided medical care, establishing a relationship with your own veterinarian is important</li></ul>', 'green');
    },
    function() {
      return createSection('Honest Self-Assessment Before Adopting', '<p>These are the questions adoption counselors wish every potential adopter would answer honestly:</p><ul><li>What will you do with this animal when you go on vacation?</li><li>Are all members of your household genuinely on board — including roommates and partners?</li><li>If you move, will you commit to finding pet-friendly housing even if it costs more or limits your options?</li><li>Can you handle the financial reality of a medical emergency without surrendering the animal?</li><li>Are you prepared for behavioral challenges that may take months of consistent work to address?</li><li>If your life circumstances change significantly (new baby, new job, new relationship), is rehoming off the table?</li></ul>', 'amber');
    }
  ];

  // LIFESPAN GUIDES
  sections.lifespan = [
    function() {
      return createSection('What Actually Extends Lifespan (Evidence-Based)', '<p>Many longevity claims lack evidence. Here is what peer-reviewed research consistently supports:</p><ul><li><strong>Maintaining healthy body weight</strong> — a landmark Purina study showed dogs kept at ideal weight lived 1.8 years longer on average than overweight dogs. This is the single most impactful factor within owner control.</li><li><strong>Regular preventive veterinary care</strong> — early detection of conditions like dental disease, kidney disease, and cancer meaningfully improves treatment outcomes and longevity</li><li><strong>Dental health maintenance</strong> — periodontal disease is linked to systemic organ damage including heart and kidney disease</li><li><strong>Mental and physical enrichment</strong> — cognitive stimulation and appropriate exercise reduce stress and support both mental and physical health into old age</li></ul><p><strong>What lacks strong evidence:</strong> specific "longevity" supplements, anti-aging diets marketed to pets, and breed-specific miracle protocols sold online.</p>', 'green');
    },
    function() {
      return createSection('Recognizing Quality of Life Changes', '<p>As animals age, quality of life assessment becomes as important as extending lifespan:</p><ul><li><strong>Mobility</strong> — reluctance to climb stairs, difficulty standing, or changed gait may indicate pain that can often be managed</li><li><strong>Engagement</strong> — withdrawal from activities previously enjoyed, loss of interest in food or play, or disorientation</li><li><strong>Comfort</strong> — restlessness, inability to find a comfortable position, changes in breathing patterns</li><li><strong>Dignity</strong> — incontinence, inability to self-groom, or distress from loss of function</li></ul><p>Quality of life scales (such as the HHHHHMM scale for pets) provide a framework for objective assessment. Discuss end-of-life planning with your veterinarian before it becomes urgent — making decisions in crisis is harder for everyone.</p>', 'purple');
    }
  ];

  // WITH-KIDS GUIDES
  sections.kids = [
    function() {
      return createSection('Safety Rules That Prevent Most Incidents', '<p>The majority of pet-related injuries to children are preventable with consistent supervision and clear rules:</p><ul><li><strong>Never leave young children unsupervised with any animal</strong> — this applies regardless of the animal\'s temperament or the child\'s experience. Most bites happen when an adult is "in the other room."</li><li><strong>Teach children to recognize stress signals</strong> — a dog showing whale eye, lip licking, or turning away is asking for space. A cat with flattened ears or a twitching tail is not enjoying the interaction.</li><li><strong>No face-to-face contact</strong> — children should not put their faces near an animal\'s face, even a pet they know well</li><li><strong>Let the animal retreat</strong> — every pet should have a safe space where children are not allowed to follow</li><li><strong>No disturbing during eating or sleeping</strong> — these are the most common triggers for defensive reactions</li></ul>', 'rose');
    },
    function() {
      return createSection('Age-Appropriate Responsibilities for Children', '<p>Involving children in pet care teaches empathy and responsibility, but expectations should match developmental stage:</p><ul><li><strong>Ages 3-5:</strong> Help pour pre-measured food into the bowl, gentle supervised petting with coaching on technique, picking up toys</li><li><strong>Ages 6-8:</strong> Filling water bowls, supervised brushing, helping with cleanup under direction</li><li><strong>Ages 9-12:</strong> Regular feeding responsibilities with oversight, walking a well-trained dog in safe areas, basic grooming tasks</li><li><strong>Ages 13+:</strong> More independent care tasks, but an adult should remain ultimately responsible for veterinary care, nutrition decisions, and safety</li></ul><p><strong>Important:</strong> A child should never be the sole caretaker of a pet. Adults must remain responsible for ensuring the animal\'s needs are consistently met.</p>', 'blue');
    }
  ];

  // APARTMENT GUIDES
  sections.apartment = [
    function() {
      return createSection('Apartment Living Realities Most Guides Overlook', '<ul><li><strong>Noise complaints</strong> — barking, squawking, or scratching can create conflicts with neighbors. If your animal vocalizes when alone, address separation-related behaviors before they become a lease issue.</li><li><strong>Elevator and hallway encounters</strong> — your pet will encounter unfamiliar people and animals in shared spaces. Reliable recall and leash manners are non-negotiable, not optional.</li><li><strong>Limited outdoor access</strong> — you will need a consistent plan for bathroom needs and exercise. Balconies are not substitutes for outdoor time, and most are not safe without modifications.</li><li><strong>Lease restrictions are real</strong> — breed restrictions, weight limits, and pet deposits vary. Verify before signing, not after. Some renters\' insurance policies also exclude specific breeds.</li><li><strong>Damage deposits</strong> — assume you will lose some or all of your pet deposit. Budget for this reality.</li></ul>', 'amber');
    },
    function() {
      return createSection('Making a Small Space Work', '<p>Space limitations do not automatically mean poor quality of life — what matters is how you use the space:</p><ul><li><strong>Vertical space matters</strong> — especially for cats. Wall-mounted shelves, cat trees, and window perches effectively double available territory without taking floor space</li><li><strong>Scheduled enrichment beats continuous access</strong> — a focused 15-minute training session or puzzle toy provides more stimulation than a yard full of nothing to do</li><li><strong>Sound management</strong> — white noise machines can help pets in apartments by masking hallway noises that trigger barking or alert behavior</li><li><strong>Crate or safe space</strong> — in a small apartment, having one clearly designated resting area where the animal is not disturbed creates predictability and reduces anxiety</li></ul>', 'green');
    }
  ];

  // FOOD SAFETY GUIDES
  sections['food-safety'] = [
    function() {
      return createSection('Common Sources of Accidental Exposure', '<p>Most pet poisonings happen at home through everyday scenarios:</p><ul><li><strong>Dropped food during cooking</strong> — onions, garlic, grapes, chocolate, and xylitol-containing products are commonly dropped within pet reach</li><li><strong>Unattended plates and trash</strong> — holiday meals are peak times for emergency vet visits related to toxic food ingestion</li><li><strong>Well-meaning visitors</strong> — guests who don\'t know the rules often share food with pets. Communicate clearly before gatherings.</li><li><strong>Children sharing snacks</strong> — young children regularly share food with pets, often unnoticed by adults</li><li><strong>Compost bins and gardens</strong> — decomposing food can be more toxic than fresh versions, and some garden plants are dangerous</li></ul>', 'amber');
    },
    function() {
      return createSection('Preparing for a Toxicity Emergency', '<p>Save these resources before you need them:</p><ul><li><strong>ASPCA Animal Poison Control:</strong> (888) 426-4435 — there is a consultation fee (~$75) but they provide specific guidance and a case number for your vet</li><li><strong>Pet Poison Helpline:</strong> (855) 764-7661 — alternative resource with 24/7 availability</li><li><strong>Your emergency vet\'s address and phone number</strong> — find your nearest 24-hour emergency veterinary hospital now, not at 2 AM when you need it</li><li><strong>Know your pet\'s weight</strong> — toxicologists calculate danger thresholds by body weight. Having an accurate, recent weight saves critical time.</li></ul>', 'rose');
    }
  ];

  // EXERCISE GUIDES
  sections.exercise = [
    function() {
      return createSection('Signs of Over-Exercise and Under-Exercise', '<p>Finding the right balance matters more than following a formula:</p><ul><li><strong>Under-exercise signs:</strong> Destructive behavior, excessive barking or vocalization, weight gain, restlessness, attention-seeking that escalates, hyperactivity indoors</li><li><strong>Over-exercise signs:</strong> Excessive panting lasting more than 10 minutes after stopping, limping or reluctance to move after activity, sleeping far more than usual, loss of enthusiasm for walks (previously enjoyed)</li><li><strong>Special caution for growing animals:</strong> Puppies and kittens should avoid forced repetitive exercise (long runs, sustained jumping) until growth plates close — typically 12-18 months depending on size</li><li><strong>Brachycephalic breeds</strong> (flat-faced dogs/cats) have reduced respiratory capacity and overheat easily. Moderate intensity and watch for labored breathing.</li></ul>', 'amber');
    },
    function() {
      return createSection('Exercise Adaptations by Life Stage', '<p>Exercise needs change significantly throughout an animal\'s life:</p><ul><li><strong>Young animals (under 1 year):</strong> Short, frequent play sessions rather than prolonged exercise. Emphasis on exploration and socialization over endurance.</li><li><strong>Adult animals:</strong> Peak exercise capacity. Match intensity to breed, individual fitness, and health status. Build up gradually for any new activity.</li><li><strong>Senior animals:</strong> Reduce intensity but maintain consistency. Swimming and controlled leash walks are easier on aging joints than running or jumping. Watch for signs of pain after activity.</li><li><strong>Post-surgery or recovering animals:</strong> Follow your veterinarian\'s specific rehabilitation timeline. Returning to activity too quickly is the most common cause of re-injury.</li></ul>', 'green');
    }
  ];

  // GENERAL / CARE GUIDES
  sections.general = [
    function() {
      return createSection('Before You Bring a New Pet Home', '<p>Preparation before arrival prevents the most common early problems:</p><ul><li>Complete your enclosure/space setup before the animal arrives — making adjustments with a stressed new pet is harder for everyone</li><li>Identify your primary veterinarian and schedule a first appointment within the first week</li><li>Pet-proof the living space — electrical cords, toxic plants, small objects, open windows/doors, accessible chemicals</li><li>Have at least 2 weeks of food and essential supplies on hand</li><li>Plan for the adjustment period — take time off work if possible for the first few days</li></ul>', 'blue');
    },
    function() {
      return createSection('Building a Veterinary Relationship', '<p>Your relationship with your veterinarian is the most important factor in your pet\'s long-term health:</p><ul><li>Schedule wellness visits even when your pet seems healthy — baseline data is invaluable when something changes</li><li>Be honest about financial constraints — most vets will help prioritize what is most important within your budget</li><li>Ask questions until you understand — a good vet welcomes informed owners</li><li>Bring notes and observations — "she\'s been doing this thing" is less helpful than "she\'s been limping on her right front leg for 3 days, worse after rest"</li></ul>', 'green');
    }
  ];

  // Also map care type
  sections.care = sections.general;

  // Get sections for this guide type, fall back to general
  var typeSections = sections[guideType] || sections.general;

  // Shuffle and select 2-3 sections based on page hash
  var selected = shuffled(typeSections, pageHash);
  var numToShow = 2 + (pageHash % 2); // 2 or 3 sections
  selected = selected.slice(0, Math.min(numToShow, selected.length));

  // Find insertion point - before FAQ or before info-card or before sources
  var insertBefore = article.querySelector('.info-card')
    || article.querySelector('.sources-references-section')
    || article.querySelector('.transparency');

  // Also check for h2 containing "Frequently Asked Questions"
  var h2s = article.querySelectorAll('h2');
  for (var i = 0; i < h2s.length; i++) {
    if (/frequently asked/i.test(h2s[i].textContent)) {
      insertBefore = h2s[i];
      break;
    }
  }

  if (!insertBefore) {
    insertBefore = article.lastElementChild;
  }

  // Insert the sections
  for (var s = 0; s < selected.length; s++) {
    var node = selected[s]();
    if (insertBefore && insertBefore.parentNode) {
      insertBefore.parentNode.insertBefore(node, insertBefore);
    }
  }

  // Add "Last Updated" badge with actual schema date
  var schemaScript = document.querySelector('script[type="application/ld+json"]');
  if (schemaScript) {
    try {
      var schema = JSON.parse(schemaScript.textContent);
      if (schema.dateModified) {
        var badge = document.createElement('div');
        badge.style.cssText = 'display:inline-flex;align-items:center;gap:6px;background:#F1F5F9;border:1px solid #CBD5E1;border-radius:6px;padding:6px 12px;font-size:0.85em;color:#475569;margin:12px 0;';
        badge.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg> Last reviewed: ' + schema.dateModified;
        var h1 = article.querySelector('h1');
        if (h1 && h1.nextSibling) {
          h1.parentNode.insertBefore(badge, h1.nextSibling);
        }
      }
    } catch(e) {}
  }
})();
