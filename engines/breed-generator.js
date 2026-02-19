#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════
// breed-generator.js — Generates ALL 242 missing breed/species pages
// for PetCareHelperAI with comprehensive, breed-specific, SEO-optimized content
//
// Architecture: Breed-specific data tables + intelligent content generators
// that produce unique, expert-level content for each breed based on its
// specific characteristics, health concerns, care requirements, and history.
//
// ES Module — run: node /opt/build/repo/engines/breed-generator.js
// ═══════════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, '..');
const BREEDS_DIR = path.join(BASE_DIR, 'breeds');
const TODAY = '2026-02-19';

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ═══════════════════════════════════════════════════════════════════════════════
// AFFILIATE LINK DATABASE
// ═══════════════════════════════════════════════════════════════════════════════
const AFF = {
  thefarmersdog: ["The Farmer's Dog",'https://www.thefarmersdog.com'],
  chewy: ['Chewy Autoship','https://www.chewy.com/app/autoship'],
  nomnom: ['Nom Nom','https://www.nomnomnow.com'],
  ollie: ['Ollie','https://www.myollie.com'],
  smalls: ['Smalls','https://www.smalls.com'],
  openfarm: ['Open Farm','https://openfarmpet.com'],
  hillspet: ["Hill's Science Diet",'https://www.hillspet.com'],
  royalcanin: ['Royal Canin','https://www.royalcanin.com'],
  spot: ['Spot Insurance','https://www.spotpetins.com'],
  lemonade: ['Lemonade Pet','https://www.lemonade.com/pet'],
  trupanion: ['Trupanion','https://trupanion.com'],
  pumpkin: ['Pumpkin','https://pumpkin.care'],
  embrace: ['Embrace','https://www.embracepetinsurance.com'],
  embark: ['Embark DNA','https://embarkvet.com'],
  wisdom: ['Wisdom Panel','https://www.wisdompanel.com'],
  basepaws: ['Basepaws','https://www.basepaws.com'],
  k9training: ['K9 Training Institute','https://k9traininginstitute.com'],
  spiritdog: ['SpiritDog Training','https://spiritdogtraining.com'],
  goodpup: ['GoodPup','https://goodpup.com'],
  zestypaws: ['Zesty Paws','https://www.zestypaws.com'],
  furminator: ['FURminator','https://www.furminator.com'],
  pawp: ['Pawp','https://pawp.com'],
  vetster: ['Vetster','https://vetster.com'],
  airvet: ['Airvet','https://airvet.com'],
  petmeds: ['1-800-PetMeds','https://www.1800petmeds.com'],
  petcarerx: ['PetCareRx','https://www.petcarerx.com'],
  zoomed: ['Zoo Med','https://zoomed.com'],
  exoterra: ['Exo Terra','https://www.exo-terra.com'],
  lafeber: ['Lafeber','https://lafeber.com'],
  kaytee: ['Kaytee','https://www.kaytee.com'],
  oxbow: ['Oxbow','https://www.oxbowanimalhealth.com'],
  harrisons: ["Harrison's Bird Foods",'https://harrisonsbirdfoods.com'],
  repashy: ['Repashy','https://repashy.com'],
  aquariumcoop: ['Aquarium Co-Op','https://www.aquariumcoop.com'],
  seachem: ['Seachem','https://www.seachem.com'],
  fluval: ['Fluval','https://fluvalaquatics.com'],
  apifishcare: ['API','https://apifishcare.com']
};

function affHTML(key, desc) {
  const a = AFF[key];
  return `<a href="${a[1]}" target="_blank" rel="sponsored noopener">${a[0]}</a> - ${desc}`;
}


// ═══════════════════════════════════════════════════════════════════════════════
// DOG BREED DATABASE — 69 breeds with complete breed-specific data
// Fields: name, group, origin, size, height, lifespan, temperament, kidFriendly,
//   dogFriendly, shedding, exercise, trainability, overview[3], traits[8+],
//   healthCategories{}, costRows[], extraCosts[], idealFor[], notIdealFor[],
//   relatedBreeds[], affiliateKeys, emergencySigns[], insuranceNote, faq[]
// ═══════════════════════════════════════════════════════════════════════════════

const DOGS = {
akita:{n:'Akita',g:'Working',o:'Japan',sz:'Large (70-130 lbs)',ht:'24-28 inches',ls:'10-13 years',tp:'Courageous, Dignified, Loyal',kd:'Moderate (older children)',dg:'Can be aggressive with same-sex dogs',sh:'Heavy (seasonal blowouts)',ex:'Moderate (1-2 hours daily)',tr:'Moderate (independent thinker)',
ov:['The Akita is a powerful, noble breed originating from the mountainous regions of northern Japan. Originally bred for guarding royalty and hunting large game such as wild boar, elk, and Yezo bears, the Akita is a formidable and dignified companion. The famous story of Hachiko, the Akita who waited at Shibuya Station for nine years for his deceased owner, exemplifies this breed\'s legendary loyalty.',
'There are two distinct varieties: the Japanese Akita (Akita Inu) with limited color patterns including red, brindle, and white, and the American Akita, which is larger, more heavily boned, and accepts all color patterns. Both share the characteristic broad head, thick double coat, curled tail, and cat-like grooming habits that make this breed uniquely clean among large dogs.',
'Akitas are natural guardians who take protective duties seriously without needing protection training. They require experienced owners who understand the Akita\'s strong will, territorial nature, and the critical importance of early socialization and firm but fair leadership throughout the dog\'s life.'],
tt:['Fiercely loyal and devoted to family with legendary protective instincts','Dignified and reserved with strangers, taking time to assess new people carefully','Independent thinker bred to make decisions when hunting large game without human direction','Can be dominant or aggressive with same-sex dogs; early socialization is absolutely critical','Cat-like cleanliness and self-grooming habits with minimal doggy odor','Quiet guardian that rarely barks without reason; not a nuisance barker','Deeply affectionate, playful, and even silly with trusted family members','Strong prey drive from hunting heritage requiring caution around small animals','Territorial and naturally protective of home, property, and family boundaries','May challenge leadership if boundaries are not consistently maintained from puppyhood'],
hl:{'Orthopedic Conditions':[['Hip Dysplasia','A significant concern with abnormal hip joint development leading to arthritis and lameness. OFA or PennHIP screening essential for breeding stock.'],['Elbow Dysplasia','Malformation of the elbow joint causing lameness and pain. Screen breeding stock with OFA evaluation.'],['Cruciate Ligament Rupture','Large frame puts significant stress on knee ligaments. Surgical repair typically costs $3,000-$5,000 per knee.']],'Autoimmune Conditions':[['Autoimmune Thyroiditis','The most common cause of hypothyroidism in Akitas, causing weight gain, lethargy, and skin problems. Requires lifelong daily medication.'],['Pemphigus Foliaceus','Autoimmune skin condition causing pustules and crusting. Akitas have a higher incidence than most breeds.'],['VKH-Like Syndrome','An autoimmune condition particularly prevalent in Akitas that attacks pigmented cells, causing eye inflammation, skin depigmentation, and potential blindness.']],'Other Concerns':[['Bloat (GDV)','Life-threatening stomach torsion emergency. Prophylactic gastropexy recommended during spay/neuter.'],['Progressive Retinal Atrophy','Gradual retina degeneration leading to blindness. DNA testing available.'],['Sebaceous Adenitis','Destruction of sebaceous glands causing hair loss and scaly skin.']]},
ct:[['Food (premium quality)','$800-$1,200'],['Veterinary Care (routine)','$400-$700'],['Pet Insurance','$500-$900'],['Grooming','$200-$400'],['Training (first year)','$500-$1,200'],['Supplies & Toys','$200-$400'],['Total Annual Cost','$2,600-$4,800']],
xc:['Initial purchase: $1,000-$4,500 from reputable breeders','Gastropexy surgery (recommended preventative): $400-$1,500','Hip/elbow screening: $200-$400','Autoimmune treatment if needed: can exceed $2,000/year'],
yf:['Experienced dog owners who understand dominant independent breeds','Single-dog households or homes without same-sex dogs','Those wanting a loyal natural guardian','Families with older respectful children','Homes with securely fenced yards in moderate climates','People who appreciate a dignified independent companion'],
nf:['First-time dog owners','Homes with multiple dogs especially same-sex','Families with young children','Those wanting off-leash or dog-park reliability','Apartment dwellers without yard','People who dislike heavy seasonal shedding','Hot climates without reliable air conditioning'],
rl:[['shiba-inu','Shiba Inu','Smaller Japanese spitz with similar independence'],['alaskan-malamute','Alaskan Malamute','Large northern breed with similar strength'],['chow-chow','Chow Chow','Dignified loyal breed also reserved with strangers']],
af:{t:[['thefarmersdog','Fresh food with precise portions for large breeds'],['embark','Screen for VKH, hip dysplasia & 200+ conditions'],['spot','Coverage for autoimmune conditions common in Akitas']],f:[['thefarmersdog','Pre-portioned fresh meals for large breeds'],['ollie','Custom high-protein recipes for large dogs'],['hillspet','Large breed joint-support formulas']],s:[['chewy','Save up to 35% on large-breed supplies'],['trupanion','Direct vet payment for hip surgery'],['furminator','Essential deshedding for double coats']]},
em:['Restlessness with unproductive retching or distended abdomen (bloat/GDV emergency)','Sudden eye redness, squinting, or vision changes (possible VKH syndrome)','Rapid skin depigmentation around nose, lips, or eyelids','Sudden lameness or inability to bear weight (ligament rupture)','Widespread pustules or crusting skin lesions (pemphigus)','Extreme lethargy combined with rapid weight gain (thyroid crisis)','Collapse or weakness after exercise in warm weather'],
in:'Akita insurance premiums average $50-$75/month due to orthopedic and autoimmune predispositions. Look for policies covering hereditary conditions, bilateral hip/elbow coverage, and autoimmune disorders. Consider plans without per-condition limits as VKH and hip replacement can each exceed $5,000.',
fq:[['Are Akitas good with children?','Akitas can be excellent with children they are raised with but should always be supervised. They may not tolerate rough handling. Families with toddlers should wait until children are older.'],['Why are Akitas banned in some areas?','Some jurisdictions include Akitas in breed-specific legislation due to size and guarding instincts. Check local regulations and ensure adequate homeowner insurance.'],['Can Akitas live in hot climates?','They can adapt but need air conditioning, shade, and careful heat management. Never exercise an Akita in high temperatures.']]},

'alaskan-klee-kai':{n:'Alaskan Klee Kai',g:'Northern/Spitz (UKC)',o:'United States',sz:'Small to Medium (10-25 lbs)',ht:'13-17 inches (three sizes)',ls:'12-16 years',tp:'Intelligent, Energetic, Loyal',kd:'Moderate (older children preferred)',dg:'Good with socialization',sh:'Heavy (seasonal blowouts)',ex:'Moderate to High',tr:'Moderate (intelligent but stubborn)',
ov:['The Alaskan Klee Kai was developed in the 1970s by Linda Spurlin in Wasilla, Alaska, as a companion-sized version of the Alaskan Husky. These miniature northern dogs come in Toy (up to 13 inches), Miniature (13-15 inches), and Standard (15-17 inches) sizes, all possessing the intelligence, energy, and striking appearance of their larger sled dog relatives.',
'Unlike their outgoing Husky cousins, Klee Kai are reserved and cautious with strangers, making them surprisingly effective watchdogs. They bond intensely with their families and can be wary of unfamiliar situations. Early and extensive socialization is critical to prevent excessive shyness or fearfulness.',
'Klee Kai are highly intelligent, requiring both physical exercise and mental stimulation. They excel in agility, rally, and nosework. Their striking facial masks, erect ears, and curled tails give them an irresistible appearance that belies their spirited independent personality.'],
tt:['Extremely strong bonds with family, acting as devoted velcro dogs at home','Naturally cautious with strangers unlike outgoing Husky relatives','Quick learners who outsmart owners by opening doors and solving puzzles','Known for wide range of vocalizations including unique yodels and screams','Strong prey drive compelling them to chase small animals intensely','Clever escape artists who climb fences and dig under barriers','Agile, fast, and athletic despite their compact size','Emotionally sensitive, responding poorly to harsh corrections','Alert watchdogs announcing all visitors and unusual activity','Need significant mental stimulation or will create destructive entertainment'],
hl:{'Genetic Conditions':[['Factor VII Deficiency','Blood clotting disorder; DNA test available and essential for breeding stock. Affected dogs bleed excessively.'],['Liver Shunts','Portosystemic shunts causing growth issues and neurological signs. May need surgical correction.'],['Thyroid Disease','Autoimmune thyroiditis causing hypothyroidism. Annual thyroid panels recommended.']],'Other Concerns':[['Patellar Luxation','Kneecap displacement common in smaller sizes. Surgery costs $1,500-$3,000.'],['Cardiac Issues','Some lines show heart murmurs. Cardiologist screening recommended.'],['Juvenile Cataracts','Can appear in young dogs. Annual CERF exams recommended.'],['Cryptorchidism','Retained testicles at higher rates than average.']]},
ct:[['Food','$300-$500'],['Veterinary Care','$300-$500'],['Pet Insurance','$300-$500'],['Grooming','$150-$300'],['Training','$300-$600'],['Supplies','$150-$300'],['Total Annual','$1,500-$2,700']],
xc:['Purchase: $1,500-$3,000+ (limited breeders)','DNA testing: $200-$300','Patellar luxation surgery: $1,500-$3,000'],
yf:['Experienced small-dog owners','Active individuals wanting compact companion','Those wanting Husky look in smaller package','Dog sport enthusiasts','Homes with older children'],
nf:['First-time dog owners','Families with very young children','Those wanting an outgoing stranger-friendly dog','Homes with cats or small pets','People disliking heavy shedding'],
rl:[['shiba-inu','Shiba Inu','Similar size and independent nature'],['american-eskimo','American Eskimo Dog','Similar spitz type, friendlier'],['keeshond','Keeshond','Friendlier larger spitz alternative']],
af:{t:[['embark','Essential Factor VII & genetic screening'],['spot','Coverage for genetic conditions'],['thefarmersdog','Portioned fresh meals for small breeds']],f:[['thefarmersdog','Fresh meals for small breeds'],['nomnom','Vet-formulated fresh food'],['openfarm','Ethically sourced small-breed food']],s:[['chewy','Save on premium small-breed food'],['lemonade','Affordable coverage from $15/month'],['furminator','Compact deshedding tools']]},
em:['Excessive bleeding from minor wounds (Factor VII deficiency)','Stunted growth or seizures in puppies (liver shunt)','Sudden lameness or leg holding (patellar luxation)','Exercise intolerance or fainting (cardiac issues)','Vision changes in young dogs (juvenile cataracts)'],
in:'Klee Kai insurance averages $30-$50/month. Critical to cover genetic conditions like Factor VII deficiency and liver shunts, plus patellar luxation for smaller varieties.',
fq:[['Are they good apartment dogs?','Can adapt with exercise but vocal nature may disturb neighbors.'],['How are they different from Huskies?','Smaller, more reserved with strangers, lower exercise needs.'],['Are they hypoallergenic?','No. Heavy shedding especially during biannual blowouts.']]},

'alaskan-malamute':{n:'Alaskan Malamute',g:'Working',o:'Alaska, USA',sz:'Large (75-100 lbs)',ht:'23-25 inches',ls:'10-14 years',tp:'Affectionate, Loyal, Playful',kd:'Good (with supervision)',dg:'Variable (can be dominant)',sh:'Very Heavy',ex:'High (2+ hours daily)',tr:'Moderate (stubborn, independent)',
ov:['The Alaskan Malamute is one of the oldest Arctic sled dog breeds, developed by the Mahlemut Inuit people for hauling heavy freight across frozen distances. Unlike the Siberian Husky bred for speed, the Malamute was designed for power and endurance, pulling heavy loads over long distances with incredible stamina and a deep work ethic.',
'Among the largest northern breeds, Malamutes have a powerful build, broad head, and thick double coat withstanding temperatures of -60°F. Their wolf-like appearance with plumed curling tail and expressive brown eyes makes them strikingly beautiful in shades of gray, black, sable, and red with white markings.',
'Pack-oriented dogs forming strong family bonds, Malamutes are affectionate, playful, and often silly. However, their independent nature and strong prey drive require experienced handling. Most greet strangers with enthusiasm rather than suspicion, making them poor guard dogs but excellent companions for active experienced owners.'],
tt:['Built for incredible strength and endurance, pulling loads exceeding their own weight','Pack-oriented, thriving on family interaction and considering household their pack','Generally friendly and welcoming to humans unlike guard-oriented breeds','Tests boundaries constantly, may ignore commands deemed unnecessary','Will chase and potentially harm small animals including cats','Loves digging craters and communicating with distinctive woo-woo howls','Maintains puppy-like playfulness and humor well into old age','Some individuals resource guard food and toys; early prevention important','Thrives in cold weather but suffers significantly in heat','Notorious escape artist requiring tall secure fencing without gaps'],
hl:{'Orthopedic':[['Hip Dysplasia','Common in breed. OFA or PennHIP screening required for responsible breeding.'],['Chondrodysplasia','Form of dwarfism with shorter limbs. DNA test available.']],'Neurological/Genetic':[['Polyneuropathy','Progressive neurological disease causing leg weakness. DNA test available for Malamute-specific form.'],['Day Blindness (Cone Degeneration)','Breed-specific condition causing vision loss in bright light. DNA test available.']],'Other Concerns':[['Bloat (GDV)','Deep-chested breed at risk for life-threatening stomach torsion.'],['Hypothyroidism','Underactive thyroid common. Annual blood work recommended.'],['Cataracts','Hereditary cataracts possible. Annual eye exams recommended.'],['Coat Funk (Alopecia X)','Hair loss condition particularly after spay/neuter.']]},
ct:[['Food','$900-$1,400'],['Vet Care','$400-$700'],['Insurance','$500-$800'],['Grooming','$300-$500'],['Training','$400-$800'],['Supplies','$200-$400'],['Total Annual','$2,700-$4,600']],
xc:['Purchase: $1,200-$3,000','Secure fencing: $2,000-$5,000','Higher AC costs in summer','Gastropexy: $400-$1,500 preventative'],
yf:['Experienced large-breed owners','Active outdoor adventure families','Cold-climate residents','Hiking/backpacking enthusiasts','Homes with large fenced yards'],
nf:['First-time owners','Hot climate residents','Homes with small pets','Those wanting obedient eager-to-please dogs','Apartment living','Frequently absent owners'],
rl:[['akita','Akita','Large northern breed with stronger guarding instinct'],['samoyed','Samoyed','Friendlier northern breed, similar coat'],['greater-swiss-mountain-dog','Greater Swiss Mountain Dog','Large working breed, gentler temperament']],
af:{t:[['embark','Test for polyneuropathy & chondrodysplasia'],['trupanion','Direct vet payment for hip surgery'],['thefarmersdog','Fresh food portioned for large active breeds']],f:[['thefarmersdog','Portioned fresh meals for large breeds'],['ollie','High-protein for active working dogs'],['hillspet','Large breed joint-support formulas']],s:[['chewy','Save on large-breed food & supplies'],['furminator','Heavy-duty deshedding tools'],['spot','Coverage for genetic conditions']]},
em:['Bloated or distended abdomen with restlessness (GDV emergency)','Sudden hind-end weakness or leg dragging (polyneuropathy)','Complete vision loss in bright light (cone degeneration)','Heat stroke: excessive panting, bright red gums, collapse','Severe acute lameness or inability to stand'],
in:'Malamute insurance averages $45-$70/month. Prioritize policies covering hip dysplasia, polyneuropathy, and bloat/GDV emergency surgery.',
fq:[['Are Malamutes and Huskies the same?','No. Malamutes are larger, more powerful, bred for hauling heavy loads. Huskies are smaller and faster.'],['Can they live in warm climates?','Possible but not ideal. Need AC, limited heat exposure, never exercise in warm temperatures.'],['Do they make good guard dogs?','Generally no. Most are too friendly with people, though their size can deter.']]},

'american-bulldog':{n:'American Bulldog',g:'Working/Guardian (UKC)',o:'United States',sz:'Large (60-120 lbs)',ht:'20-28 inches',ls:'10-15 years',tp:'Confident, Loyal, Energetic',kd:'Good (with socialization)',dg:'Variable',sh:'Moderate',ex:'High (1-2 hours)',tr:'Moderate to High',
ov:['The American Bulldog is a powerful athletic breed descended from working bulldogs brought to America by early settlers. Unlike the compact English Bulldog, the American Bulldog retained the taller, more athletic build used for farm work, livestock guarding, and catch work with semi-feral cattle and pigs in the rural South.',
'Two primary types exist: the Johnson (Classic/Bully) type, larger with shorter muzzle, and the Scott (Standard/Performance) type, leaner and more athletic. Many modern American Bulldogs are hybrid blends combining the best characteristics of both lines.',
'Confident and courageous with a strong work ethic and deep family loyalty, American Bulldogs are versatile athletes excelling in weight pulling, agility, and protection work. Their strength, intelligence, and devotion make outstanding companions for experienced owners providing proper training and socialization.'],
tt:['Natural confidence and courage willing to confront threats protecting family','Intense loyalty forming deep bonds with all family members','Powerful athletes requiring significant daily exercise and activity','Remarkably gentle and patient with children in their own family','Natural protectors wary of strangers guarding their territory','Strong-willed requiring consistent leadership and clear boundaries','Despite tough appearance, quite clownish and entertaining at home','High work drive needing channeling into appropriate activities','Determined and tenacious once focused on any task','Mouthy breed benefiting from early bite-inhibition training'],
hl:{'Orthopedic':[['Hip Dysplasia','Very common. Screening essential. Surgery: $3,000-$7,000.'],['Elbow Dysplasia','Joint malformation causing lameness.'],['Cruciate Ligament Tears','Active heavy dogs prone to ACL injuries.']],'Skin & Allergies':[['Environmental & Food Allergies','Extremely common, causing skin itching, ear infections, hot spots.'],['Demodex Mange','Some lines susceptible in puppyhood.'],['Cherry Eye','Prolapsed third eyelid gland needing surgical correction.']],'Other':[['NCL (Neuronal Ceroid Lipofuscinosis)','Fatal neurological disease in some lines. DNA test available.'],['Kidney Disease','Some lines prone to early-onset problems.'],['Brachycephalic Issues','Shorter-muzzled Johnson types may have breathing difficulties.']]},
ct:[['Food','$700-$1,100'],['Vet Care','$400-$700'],['Insurance','$400-$800'],['Grooming','$100-$200'],['Training','$400-$1,000'],['Supplies','$200-$400'],['Total Annual','$2,200-$4,200']],
xc:['Purchase: $1,500-$3,500','Allergy management: $500-$2,000/year','Hip surgery: $3,000-$7,000','Secure fencing: $1,500-$4,000'],
yf:['Experienced large-breed owners','Active families with older children','Those wanting loyal family protector','Suburban/rural homes with yards','Dog sport enthusiasts'],
nf:['First-time owners','Apartment living','Sedentary lifestyles','Areas with breed-specific legislation','Multi-pet homes without proper introductions'],
rl:[['english-bulldog','English Bulldog','More compact, lower-energy cousin'],['pit-bull','Pit Bull','Similar athletic build, different history'],['dogue-de-bordeaux','Dogue de Bordeaux','French mastiff with similar loyalty']],
af:{t:[['embark','Screen for NCL & genetic conditions'],['spot','Coverage for orthopedic & allergy conditions'],['thefarmersdog','Limited-ingredient meals for allergy-prone dogs']],f:[['thefarmersdog','Fresh food for allergy-prone dogs'],['ollie','High-protein for athletic breeds'],['royalcanin','Breed-specific nutrition']],s:[['chewy','Save on allergy supplements & food'],['trupanion','Direct payment for hip surgery'],['k9training','Training for powerful breeds']]},
em:['Bloated abdomen with pacing (GDV)','Sudden severe lameness (cruciate rupture)','Difficulty breathing in heat (brachycephalic distress)','Seizures in young dogs (NCL)','Swollen red mass in eye (cherry eye)'],
in:'American Bulldog insurance averages $45-$70/month. Essential for orthopedic conditions, allergies, and genetic diseases.',
fq:[['Are they aggressive?','Not inherently, but protective. Proper socialization essential.'],['Same as Pit Bulls?','No. Distinct breeds with different origins and standards.'],['Need lots of exercise?','Yes, 1-2 hours daily of vigorous activity.']]},

