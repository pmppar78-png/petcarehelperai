// Scale expansion data — breed metadata + programmatic page generation
export const TODAY = '2026-02-21';

// Dog breed data: [slug, name, size, weight, lifespan, energy, group, shedding, [health issues]]
const D = [
  ['labrador-retriever','Labrador Retriever','large','55-80 lbs','10-13 yrs','high','sporting','heavy',['hip dysplasia','elbow dysplasia','obesity']],
  ['german-shepherd','German Shepherd','large','50-90 lbs','9-13 yrs','high','herding','heavy',['hip dysplasia','degenerative myelopathy','bloat']],
  ['golden-retriever','Golden Retriever','large','55-75 lbs','10-12 yrs','high','sporting','heavy',['cancer','hip dysplasia','heart disease']],
  ['french-bulldog','French Bulldog','small','16-28 lbs','10-12 yrs','low','non-sporting','moderate',['brachycephalic syndrome','spinal disorders','allergies']],
  ['bulldog','Bulldog','medium','40-50 lbs','8-10 yrs','low','non-sporting','moderate',['brachycephalic syndrome','hip dysplasia','skin infections']],
  ['poodle','Poodle','medium','40-70 lbs','12-15 yrs','high','non-sporting','minimal',['hip dysplasia','progressive retinal atrophy','bloat']],
  ['beagle','Beagle','medium','20-30 lbs','10-15 yrs','high','hound','moderate',['epilepsy','hypothyroidism','cherry eye']],
  ['rottweiler','Rottweiler','large','80-135 lbs','8-10 yrs','moderate','working','moderate',['hip dysplasia','osteosarcoma','heart disease']],
  ['german-shorthaired-pointer','German Shorthaired Pointer','large','45-70 lbs','12-14 yrs','high','sporting','moderate',['hip dysplasia','bloat','cancer']],
  ['dachshund','Dachshund','small','16-32 lbs','12-16 yrs','moderate','hound','moderate',['IVDD','obesity','dental disease']],
  ['pembroke-welsh-corgi','Pembroke Welsh Corgi','medium','25-30 lbs','12-15 yrs','high','herding','heavy',['hip dysplasia','degenerative myelopathy','obesity']],
  ['australian-shepherd','Australian Shepherd','medium','40-65 lbs','12-15 yrs','high','herding','heavy',['hip dysplasia','epilepsy','cataracts']],
  ['yorkshire-terrier','Yorkshire Terrier','small','4-7 lbs','11-15 yrs','moderate','toy','minimal',['dental disease','luxating patella','collapsed trachea']],
  ['boxer','Boxer','large','50-80 lbs','10-12 yrs','high','working','light',['cancer','heart disease','hip dysplasia']],
  ['cavalier-king-charles-spaniel','Cavalier King Charles Spaniel','small','13-18 lbs','9-14 yrs','moderate','toy','moderate',['mitral valve disease','syringomyelia','hip dysplasia']],
  ['doberman-pinscher','Doberman Pinscher','large','60-100 lbs','10-12 yrs','high','working','light',['dilated cardiomyopathy','von Willebrand disease','hip dysplasia']],
  ['miniature-schnauzer','Miniature Schnauzer','small','11-20 lbs','12-15 yrs','high','terrier','minimal',['pancreatitis','urinary stones','cataracts']],
  ['cane-corso','Cane Corso','large','88-120 lbs','9-12 yrs','moderate','working','light',['hip dysplasia','bloat','cherry eye']],
  ['great-dane','Great Dane','large','110-175 lbs','7-10 yrs','moderate','working','moderate',['bloat','hip dysplasia','heart disease']],
  ['shih-tzu','Shih Tzu','small','9-16 lbs','10-18 yrs','low','toy','moderate',['brachycephalic syndrome','dental disease','eye problems']],
  ['siberian-husky','Siberian Husky','medium','35-60 lbs','12-14 yrs','high','working','heavy',['hip dysplasia','cataracts','progressive retinal atrophy']],
  ['bernese-mountain-dog','Bernese Mountain Dog','large','70-115 lbs','6-8 yrs','moderate','working','heavy',['cancer','hip dysplasia','bloat']],
  ['pomeranian','Pomeranian','small','3-7 lbs','12-16 yrs','moderate','toy','heavy',['luxating patella','collapsed trachea','dental disease']],
  ['boston-terrier','Boston Terrier','small','12-25 lbs','11-13 yrs','moderate','non-sporting','light',['brachycephalic syndrome','cataracts','luxating patella']],
  ['havanese','Havanese','small','7-13 lbs','14-16 yrs','moderate','toy','light',['luxating patella','cataracts','heart murmurs']],
  ['english-springer-spaniel','English Springer Spaniel','medium','40-50 lbs','12-14 yrs','high','sporting','moderate',['hip dysplasia','progressive retinal atrophy','ear infections']],
  ['shetland-sheepdog','Shetland Sheepdog','small','15-25 lbs','12-14 yrs','high','herding','heavy',['collie eye anomaly','hip dysplasia','thyroid disease']],
  ['brittany','Brittany','medium','30-40 lbs','12-14 yrs','high','sporting','moderate',['hip dysplasia','epilepsy','hypothyroidism']],
  ['cocker-spaniel','Cocker Spaniel','medium','20-30 lbs','10-14 yrs','moderate','sporting','moderate',['ear infections','cataracts','hip dysplasia']],
  ['border-collie','Border Collie','medium','30-55 lbs','12-15 yrs','high','herding','heavy',['hip dysplasia','epilepsy','collie eye anomaly']],
  ['vizsla','Vizsla','medium','44-60 lbs','12-14 yrs','high','sporting','light',['hip dysplasia','epilepsy','cancer']],
  ['chihuahua','Chihuahua','small','2-6 lbs','14-16 yrs','moderate','toy','light',['luxating patella','heart disease','dental disease']],
  ['miniature-pinscher','Miniature Pinscher','small','8-12 lbs','12-16 yrs','high','toy','light',['luxating patella','Legg-Calve-Perthes','progressive retinal atrophy']],
  ['rhodesian-ridgeback','Rhodesian Ridgeback','large','70-85 lbs','10-12 yrs','moderate','hound','light',['hip dysplasia','dermoid sinus','hypothyroidism']],
  ['basset-hound','Basset Hound','medium','40-65 lbs','12-13 yrs','low','hound','moderate',['ear infections','obesity','bloat']],
  ['newfoundland','Newfoundland','large','100-150 lbs','8-10 yrs','moderate','working','heavy',['hip dysplasia','heart disease','bloat']],
  ['belgian-malinois','Belgian Malinois','large','40-80 lbs','14-16 yrs','high','herding','moderate',['hip dysplasia','elbow dysplasia','progressive retinal atrophy']],
  ['west-highland-white-terrier','West Highland White Terrier','small','13-22 lbs','13-15 yrs','moderate','terrier','moderate',['skin allergies','luxating patella','liver disease']],
  ['collie','Collie','large','50-75 lbs','12-14 yrs','moderate','herding','heavy',['collie eye anomaly','hip dysplasia','bloat']],
  ['weimaraner','Weimaraner','large','55-90 lbs','10-13 yrs','high','sporting','light',['bloat','hip dysplasia','hypothyroidism']],
  ['maltese','Maltese','small','4-7 lbs','12-15 yrs','moderate','toy','minimal',['luxating patella','dental disease','collapsed trachea']],
  ['bichon-frise','Bichon Frise','small','12-18 lbs','14-15 yrs','moderate','non-sporting','minimal',['allergies','bladder stones','luxating patella']],
  ['bloodhound','Bloodhound','large','80-110 lbs','10-12 yrs','moderate','hound','moderate',['bloat','hip dysplasia','ear infections']],
  ['akita','Akita','large','70-130 lbs','10-13 yrs','moderate','working','heavy',['hip dysplasia','bloat','autoimmune thyroiditis']],
  ['portuguese-water-dog','Portuguese Water Dog','medium','35-60 lbs','11-13 yrs','high','working','minimal',['hip dysplasia','progressive retinal atrophy','heart disease']],
  ['chesapeake-bay-retriever','Chesapeake Bay Retriever','large','55-80 lbs','10-13 yrs','high','sporting','heavy',['hip dysplasia','progressive retinal atrophy','bloat']],
  ['dalmatian','Dalmatian','large','45-70 lbs','11-13 yrs','high','non-sporting','heavy',['deafness','urinary stones','hip dysplasia']],
  ['st-bernard','St. Bernard','large','120-180 lbs','8-10 yrs','low','working','heavy',['hip dysplasia','bloat','heart disease']],
  ['samoyed','Samoyed','medium','35-65 lbs','12-14 yrs','high','working','heavy',['hip dysplasia','diabetes','hypothyroidism']],
  ['australian-cattle-dog','Australian Cattle Dog','medium','35-50 lbs','12-16 yrs','high','herding','moderate',['hip dysplasia','progressive retinal atrophy','deafness']],
  ['soft-coated-wheaten-terrier','Soft Coated Wheaten Terrier','medium','30-40 lbs','12-14 yrs','high','terrier','minimal',['protein-losing nephropathy','Addisons disease','allergies']],
  ['whippet','Whippet','medium','25-40 lbs','12-15 yrs','moderate','hound','light',['heart disease','eye problems','anesthesia sensitivity']],
  ['alaskan-malamute','Alaskan Malamute','large','75-100 lbs','10-14 yrs','high','working','heavy',['hip dysplasia','hypothyroidism','bloat']],
  ['irish-setter','Irish Setter','large','60-70 lbs','12-15 yrs','high','sporting','moderate',['hip dysplasia','bloat','epilepsy']],
  ['papillon','Papillon','small','5-10 lbs','14-16 yrs','moderate','toy','moderate',['luxating patella','dental disease','progressive retinal atrophy']],
  ['bull-terrier','Bull Terrier','medium','50-70 lbs','12-13 yrs','high','terrier','light',['heart disease','kidney disease','deafness']],
  ['scottish-terrier','Scottish Terrier','small','18-22 lbs','12 yrs','moderate','terrier','moderate',['bladder cancer','von Willebrand disease','Scotty cramp']],
  ['airedale-terrier','Airedale Terrier','medium','50-70 lbs','11-14 yrs','high','terrier','moderate',['hip dysplasia','hypothyroidism','cancer']],
  ['american-staffordshire-terrier','American Staffordshire Terrier','medium','40-70 lbs','12-16 yrs','high','terrier','light',['hip dysplasia','heart disease','allergies']],
  ['cairn-terrier','Cairn Terrier','small','13-14 lbs','13-15 yrs','moderate','terrier','moderate',['luxating patella','cataracts','liver shunts']],
  ['english-mastiff','English Mastiff','large','120-230 lbs','6-10 yrs','low','working','moderate',['hip dysplasia','bloat','heart disease']],
  ['chinese-shar-pei','Chinese Shar-Pei','medium','45-60 lbs','8-12 yrs','moderate','non-sporting','light',['skin infections','entropion','Shar-Pei fever']],
  ['lhasa-apso','Lhasa Apso','small','12-18 lbs','12-15 yrs','moderate','non-sporting','moderate',['kidney disease','cherry eye','luxating patella']],
  ['italian-greyhound','Italian Greyhound','small','7-14 lbs','14-15 yrs','moderate','toy','minimal',['dental disease','leg fractures','epilepsy']],
  ['shiba-inu','Shiba Inu','medium','17-23 lbs','13-16 yrs','moderate','non-sporting','heavy',['allergies','luxating patella','hip dysplasia']],
  ['old-english-sheepdog','Old English Sheepdog','large','60-100 lbs','10-12 yrs','moderate','herding','heavy',['hip dysplasia','hypothyroidism','cataracts']],
  ['irish-wolfhound','Irish Wolfhound','large','105-180 lbs','6-8 yrs','moderate','hound','moderate',['heart disease','bloat','osteosarcoma']],
  ['staffordshire-bull-terrier','Staffordshire Bull Terrier','medium','24-38 lbs','12-14 yrs','high','terrier','light',['hip dysplasia','cataracts','allergies']],
  ['american-bulldog','American Bulldog','large','60-120 lbs','10-12 yrs','moderate','working','moderate',['hip dysplasia','cherry eye','allergies']],
  ['great-pyrenees','Great Pyrenees','large','85-160 lbs','10-12 yrs','low','working','heavy',['bloat','hip dysplasia','bone cancer']],
  ['miniature-american-shepherd','Miniature American Shepherd','medium','20-40 lbs','12-13 yrs','high','herding','moderate',['hip dysplasia','progressive retinal atrophy','drug sensitivity']],
  ['rat-terrier','Rat Terrier','small','10-25 lbs','12-18 yrs','high','terrier','moderate',['luxating patella','hip dysplasia','allergies']],
  ['norwegian-elkhound','Norwegian Elkhound','medium','48-55 lbs','12-15 yrs','high','hound','heavy',['hip dysplasia','progressive retinal atrophy','kidney disease']],
  ['english-cocker-spaniel','English Cocker Spaniel','medium','26-34 lbs','12-14 yrs','moderate','sporting','moderate',['ear infections','hip dysplasia','progressive retinal atrophy']],
  ['pug','Pug','small','14-18 lbs','13-15 yrs','low','toy','heavy',['brachycephalic syndrome','eye problems','obesity']],
  ['belgian-tervuren','Belgian Tervuren','large','45-75 lbs','12-14 yrs','high','herding','heavy',['hip dysplasia','progressive retinal atrophy','epilepsy']],
  ['jack-russell-terrier','Jack Russell Terrier','small','13-17 lbs','13-16 yrs','high','terrier','moderate',['luxating patella','deafness','eye disease']],
  ['flat-coated-retriever','Flat-Coated Retriever','large','60-70 lbs','8-10 yrs','high','sporting','moderate',['cancer','hip dysplasia','bloat']],
  ['toy-poodle','Toy Poodle','small','4-6 lbs','10-18 yrs','moderate','toy','minimal',['luxating patella','progressive retinal atrophy','Legg-Calve-Perthes']],
  ['standard-poodle','Standard Poodle','large','40-70 lbs','10-18 yrs','high','non-sporting','minimal',['hip dysplasia','bloat','Addisons disease']],
];

export const dogBreeds = D.map(([slug,name,size,weight,lifespan,energy,group,shedding,issues]) =>
  ({slug,name,size,weight,lifespan,energy,group,shedding,issues}));

// Cat breed data: [slug, name, size, weight, lifespan, energy, coat, shedding, [health issues]]
const C = [
  ['persian','Persian','medium','7-12 lbs','10-17 yrs','low','long','heavy',['PKD','breathing issues','eye problems']],
  ['maine-coon','Maine Coon','large','10-25 lbs','10-13 yrs','moderate','long','heavy',['HCM','hip dysplasia','spinal muscular atrophy']],
  ['ragdoll','Ragdoll','large','10-20 lbs','12-17 yrs','low','long','moderate',['HCM','bladder stones','obesity']],
  ['british-shorthair','British Shorthair','medium','9-18 lbs','12-20 yrs','low','short','moderate',['HCM','obesity','diabetes']],
  ['siamese','Siamese','medium','6-14 lbs','15-20 yrs','high','short','light',['amyloidosis','dental disease','asthma']],
  ['bengal','Bengal','medium','8-15 lbs','12-16 yrs','high','short','light',['HCM','PRA','luxating patella']],
  ['abyssinian','Abyssinian','medium','6-10 lbs','9-15 yrs','high','short','light',['renal amyloidosis','PRA','gingivitis']],
  ['scottish-fold','Scottish Fold','medium','6-13 lbs','11-14 yrs','moderate','short','moderate',['osteochondrodysplasia','HCM','PKD']],
  ['sphynx','Sphynx','medium','6-12 lbs','8-14 yrs','high','hairless','minimal',['HCM','skin infections','respiratory issues']],
  ['russian-blue','Russian Blue','medium','7-15 lbs','15-20 yrs','moderate','short','moderate',['bladder stones','obesity','anxiety']],
  ['birman','Birman','medium','6-12 lbs','12-16 yrs','moderate','long','moderate',['HCM','kidney disease','FIP']],
  ['oriental-shorthair','Oriental Shorthair','medium','5-10 lbs','12-15 yrs','high','short','light',['amyloidosis','dental disease','heart disease']],
  ['devon-rex','Devon Rex','small','5-10 lbs','9-15 yrs','high','short','light',['HCM','luxating patella','myopathy']],
  ['norwegian-forest-cat','Norwegian Forest Cat','large','12-16 lbs','14-16 yrs','moderate','long','heavy',['HCM','hip dysplasia','glycogen storage disease']],
  ['burmese','Burmese','medium','8-12 lbs','10-17 yrs','high','short','light',['diabetes','HCM','head defect']],
  ['exotic-shorthair','Exotic Shorthair','medium','7-12 lbs','8-15 yrs','low','short','moderate',['PKD','breathing issues','eye problems']],
  ['tonkinese','Tonkinese','medium','6-12 lbs','12-16 yrs','high','short','light',['dental disease','FIP','inflammatory bowel disease']],
  ['american-shorthair','American Shorthair','medium','8-15 lbs','15-20 yrs','moderate','short','moderate',['HCM','obesity','dental disease']],
  ['cornish-rex','Cornish Rex','small','5-10 lbs','11-15 yrs','high','short','minimal',['HCM','luxating patella','hyperthyroidism']],
  ['ragamuffin','Ragamuffin','large','10-20 lbs','12-16 yrs','moderate','long','moderate',['HCM','PKD','obesity']],
  ['somali','Somali','medium','6-10 lbs','11-16 yrs','high','long','moderate',['renal amyloidosis','PRA','dental disease']],
  ['turkish-angora','Turkish Angora','medium','5-10 lbs','12-18 yrs','high','long','moderate',['deafness','HCM','ataxia']],
  ['balinese','Balinese','medium','5-10 lbs','12-20 yrs','high','long','moderate',['amyloidosis','asthma','dental disease']],
  ['chartreux','Chartreux','medium','7-16 lbs','12-15 yrs','moderate','short','moderate',['luxating patella','hip dysplasia','bladder stones']],
  ['singapura','Singapura','small','4-8 lbs','11-15 yrs','high','short','light',['PKD','uterine inertia','HCM']],
  ['manx','Manx','medium','8-12 lbs','8-14 yrs','moderate','short','moderate',['Manx syndrome','arthritis','constipation']],
  ['ocicat','Ocicat','medium','6-15 lbs','12-18 yrs','high','short','light',['HCM','renal amyloidosis','dental disease']],
  ['japanese-bobtail','Japanese Bobtail','medium','5-10 lbs','9-15 yrs','high','short','light',['obesity','urinary tract issues','dental disease']],
  ['havana-brown','Havana Brown','medium','6-10 lbs','8-13 yrs','moderate','short','light',['HCM','calcium oxalate stones','upper respiratory']],
  ['bombay','Bombay','medium','6-11 lbs','12-16 yrs','moderate','short','light',['HCM','breathing issues','excessive tearing']],
];

export const catBreeds = C.map(([slug,name,size,weight,lifespan,energy,coat,shedding,issues]) =>
  ({slug,name,size,weight,lifespan,energy,coat,shedding,issues}));

// ============================================================
// BREED x TOPIC CROSSOVER PAGES (generated from breed arrays)
// ============================================================

export const breedFoodPages = [
  ...dogBreeds.map(b => ({slug:`best-food-for-${b.slug}`,title:`Best Food for ${b.name}: Diet & Nutrition Guide`,desc:`Complete guide to the best dog food for ${b.name}s based on their ${b.size} size, ${b.energy} energy level, and health needs including ${b.issues[0]}.`,animal:'dogs',affiliateCategories:['foodAndNutrition','groomingAndSupplements']})),
  ...catBreeds.map(b => ({slug:`best-food-for-${b.slug}-cat`,title:`Best Food for ${b.name} Cats: Nutrition Guide`,desc:`Top rated cat food for ${b.name} cats. Diet recommendations for their ${b.coat} coat, ${b.energy} energy needs, and common concerns like ${b.issues[0]}.`,animal:'cats',affiliateCategories:['foodAndNutrition','groomingAndSupplements']})),
];

export const breedInsurancePages = [
  ...dogBreeds.map(b => ({slug:`${b.slug}-pet-insurance`,title:`${b.name} Pet Insurance: Costs & Best Plans`,desc:`Compare the best pet insurance plans for ${b.name}s. Coverage for ${b.issues.join(', ')}, average premiums, and which plans offer the best value.`,animal:'dogs',affiliateCategories:['insuranceAndWellness']})),
  ...catBreeds.map(b => ({slug:`${b.slug}-cat-pet-insurance`,title:`${b.name} Cat Insurance: Costs & Best Plans`,desc:`Best pet insurance for ${b.name} cats. Compare plans covering ${b.issues.join(', ')}, monthly costs, and coverage recommendations.`,animal:'cats',affiliateCategories:['insuranceAndWellness']})),
];

export const breedTrainingPages = dogBreeds.map(b => ({
  slug:`how-to-train-a-${b.slug}`,title:`How to Train a ${b.name}: Complete Guide`,
  desc:`${b.name} training guide covering obedience, socialization, and behavior. Tips for their ${b.energy} energy ${b.group} breed temperament.`,
  animal:'dogs',affiliateCategories:['trainingAndBehavior']
}));

export const breedExercisePages = dogBreeds.map(b => ({
  slug:`${b.slug}-exercise-guide`,title:`${b.name} Exercise Needs: Activity & Fitness Guide`,
  desc:`How much exercise does a ${b.name} need? Activity recommendations for this ${b.size} ${b.energy}-energy ${b.group} breed.`,
  animal:'dogs',affiliateCategories:['trainingAndBehavior','devicesGpsAndTech']
}));

export const breedGroomingPages = [
  ...dogBreeds.map(b => ({slug:`${b.slug}-grooming-guide`,title:`${b.name} Grooming Guide: Coat Care & Tips`,desc:`Complete ${b.name} grooming guide. ${b.shedding} shedding management, bathing schedule, nail care, and professional grooming costs.`,animal:'dogs',affiliateCategories:['groomingAndSupplements']})),
  ...catBreeds.map(b => ({slug:`${b.slug}-cat-grooming-guide`,title:`${b.name} Cat Grooming: Coat Care Guide`,desc:`Grooming guide for ${b.name} cats with ${b.coat} ${b.shedding}-shedding coat. Brushing, bathing, nail trimming, and coat maintenance tips.`,animal:'cats',affiliateCategories:['groomingAndSupplements']})),
];

export const breedPuppyPages = dogBreeds.map(b => ({
  slug:`${b.slug}-puppy-guide`,title:`${b.name} Puppy Guide: First Year Care`,
  desc:`Everything you need for a ${b.name} puppy's first year. Feeding schedule, training milestones, vaccination timeline, and health concerns for ${b.size} breed puppies.`,
  animal:'dogs',affiliateCategories:['foodAndNutrition','trainingAndBehavior','insuranceAndWellness']
}));

export const breedTemperamentPages = [
  ...dogBreeds.map(b => ({slug:`${b.slug}-temperament`,title:`${b.name} Temperament & Personality Guide`,desc:`${b.name} temperament traits, personality, and behavior. What to expect from this ${b.energy}-energy ${b.group} breed with family, kids, and other pets.`,animal:'dogs',affiliateCategories:['trainingAndBehavior']})),
  ...catBreeds.map(b => ({slug:`${b.slug}-cat-temperament`,title:`${b.name} Cat Temperament & Personality`,desc:`${b.name} cat personality, behavior traits, and temperament. ${b.energy} energy level, affection, and compatibility with families and other pets.`,animal:'cats',affiliateCategories:['trainingAndBehavior']})),
];

export const breedCostPages = [
  ...dogBreeds.map(b => ({slug:`${b.slug}-cost-of-ownership`,title:`Cost of Owning a ${b.name}: Budget Guide`,desc:`Total cost of owning a ${b.name}: purchase price, food, vet bills, grooming, and insurance. Annual and lifetime budget for this ${b.size} breed.`,animal:'dogs',affiliateCategories:['insuranceAndWellness','foodAndNutrition']})),
  ...catBreeds.map(b => ({slug:`${b.slug}-cat-cost-of-ownership`,title:`Cost of Owning a ${b.name} Cat: Budget Guide`,desc:`Complete cost breakdown for ${b.name} cat ownership including food, veterinary care, grooming, and supplies. Monthly and annual budgets.`,animal:'cats',affiliateCategories:['insuranceAndWellness','foodAndNutrition']})),
];

// ============================================================
// BREED VS BREED COMPARISONS (60 pages)
// ============================================================
const vsPairs = [
  ['labrador-retriever','golden-retriever'],['french-bulldog','bulldog'],['german-shepherd','belgian-malinois'],
  ['siberian-husky','alaskan-malamute'],['beagle','basset-hound'],['poodle','labrador-retriever'],
  ['golden-retriever','german-shepherd'],['rottweiler','doberman-pinscher'],['boxer','bulldog'],
  ['yorkshire-terrier','maltese'],['shih-tzu','lhasa-apso'],['pomeranian','chihuahua'],
  ['border-collie','australian-shepherd'],['great-dane','english-mastiff'],['bernese-mountain-dog','st-bernard'],
  ['cavalier-king-charles-spaniel','cocker-spaniel'],['boston-terrier','french-bulldog'],['akita','shiba-inu'],
  ['dachshund','beagle'],['pembroke-welsh-corgi','australian-cattle-dog'],['newfoundland','great-pyrenees'],
  ['dalmatian','weimaraner'],['irish-setter','vizsla'],['miniature-schnauzer','scottish-terrier'],
  ['collie','shetland-sheepdog'],['rhodesian-ridgeback','vizsla'],['jack-russell-terrier','rat-terrier'],
  ['german-shepherd','rottweiler'],['labrador-retriever','boxer'],['golden-retriever','labrador-retriever'],
  ['french-bulldog','pug'],['siberian-husky','german-shepherd'],['poodle','bichon-frise'],
  ['bulldog','staffordshire-bull-terrier'],['great-dane','cane-corso'],['chihuahua','yorkshire-terrier'],
  ['shih-tzu','havanese'],['samoyed','siberian-husky'],['border-collie','german-shepherd'],
  ['australian-shepherd','miniature-american-shepherd'],['rottweiler','cane-corso'],['boxer','doberman-pinscher'],
  ['beagle','cocker-spaniel'],['maltese','bichon-frise'],['papillon','chihuahua'],
  ['bull-terrier','american-staffordshire-terrier'],['english-springer-spaniel','brittany'],
  ['bloodhound','basset-hound'],['weimaraner','german-shorthaired-pointer'],
  ['old-english-sheepdog','collie'],['pug','boston-terrier'],['whippet','italian-greyhound'],
  ['great-pyrenees','bernese-mountain-dog'],['flat-coated-retriever','golden-retriever'],
  ['chesapeake-bay-retriever','labrador-retriever'],['toy-poodle','maltese'],
  ['standard-poodle','golden-retriever'],['irish-wolfhound','great-dane'],
  ['cairn-terrier','west-highland-white-terrier'],['norwegian-elkhound','siberian-husky'],
  ['airedale-terrier','miniature-schnauzer'],
];

const breedMap = Object.fromEntries(dogBreeds.map(b => [b.slug, b]));
export const breedVsPages = vsPairs.map(([a,b]) => {
  const ba = breedMap[a], bb = breedMap[b];
  return {slug:`${a}-vs-${b}`,title:`${ba?.name||a} vs ${bb?.name||b}: Breed Comparison`,desc:`${ba?.name||a} vs ${bb?.name||b} — detailed comparison of size, temperament, exercise needs, health, and costs to help you choose the right breed.`,animal:'dogs',affiliateCategories:['foodAndNutrition','insuranceAndWellness']};
});

// ============================================================
// SYMPTOM PAGES (95 pages)
// ============================================================
export const symptomPages = [
  {slug:'why-is-my-dog-limping',title:'Why Is My Dog Limping',desc:'Common causes of dog limping including injuries, arthritis, ligament tears, and when limping requires emergency veterinary care.',animal:'dogs'},
  {slug:'why-is-my-dog-vomiting',title:'Why Is My Dog Vomiting',desc:'Dog vomiting causes from dietary indiscretion to serious illness. When to worry, home care tips, and emergency warning signs.',animal:'dogs'},
  {slug:'why-is-my-dog-shaking',title:'Why Is My Dog Shaking or Trembling',desc:'Reasons dogs shake including cold, anxiety, pain, neurological issues, and poisoning. How to tell normal from concerning trembling.',animal:'dogs'},
  {slug:'why-is-my-dog-not-eating',title:'Why Is My Dog Not Eating',desc:'Loss of appetite in dogs: common causes, when it signals illness, and strategies to encourage eating. When to see a vet.',animal:'dogs'},
  {slug:'why-is-my-dog-panting-at-night',title:'Why Is My Dog Panting at Night',desc:'Nighttime panting in dogs from heat to pain, anxiety, and heart disease. How to identify the cause and when to seek help.',animal:'dogs'},
  {slug:'why-is-my-dog-coughing',title:'Why Is My Dog Coughing',desc:'Dog cough causes: kennel cough, heart disease, collapsed trachea, allergies, and foreign objects. Types of coughs and treatments.',animal:'dogs'},
  {slug:'why-is-my-dog-scratching-so-much',title:'Why Is My Dog Scratching So Much',desc:'Excessive scratching in dogs: allergies, fleas, dry skin, infections, and mange. Diagnosis and treatment for itchy dogs.',animal:'dogs'},
  {slug:'why-is-my-dog-drinking-so-much-water',title:'Why Is My Dog Drinking So Much Water',desc:'Excessive thirst in dogs (polydipsia) causes including diabetes, kidney disease, Cushings, and dehydration. When to test.',animal:'dogs'},
  {slug:'why-is-my-dog-losing-hair',title:'Why Is My Dog Losing Hair',desc:'Dog hair loss causes: allergies, hormonal imbalances, infections, stress, and parasites. Diagnosis and treatment options.',animal:'dogs'},
  {slug:'why-does-my-dog-have-diarrhea',title:'Why Does My Dog Have Diarrhea',desc:'Dog diarrhea causes, home remedies, when to see a vet, and how to prevent future episodes. Acute vs chronic diarrhea guide.',animal:'dogs'},
  {slug:'why-is-my-dog-licking-his-paws',title:'Why Is My Dog Licking His Paws',desc:'Excessive paw licking in dogs: allergies, injuries, anxiety, infections, and pain. How to stop the behavior and treat causes.',animal:'dogs'},
  {slug:'why-is-my-dog-whining',title:'Why Is My Dog Whining So Much',desc:'Dog whining causes: attention seeking, anxiety, pain, hunger, and excitement. How to understand and address excessive whining.',animal:'dogs'},
  {slug:'why-is-my-dog-sneezing',title:'Why Is My Dog Sneezing',desc:'Dog sneezing causes from allergies to nasal infections, foreign objects, and tumors. Reverse sneezing vs regular sneezing.',animal:'dogs'},
  {slug:'why-does-my-dog-have-bad-breath',title:'Why Does My Dog Have Bad Breath',desc:'Dog bad breath causes: dental disease, kidney failure, diabetes, and oral tumors. When halitosis signals serious health issues.',animal:'dogs'},
  {slug:'why-is-my-dog-eating-grass',title:'Why Is My Dog Eating Grass',desc:'Dogs eating grass: nausea, dietary needs, boredom, or instinct. When grass eating is normal vs a sign of illness.',animal:'dogs'},
  {slug:'why-is-my-dog-scooting',title:'Why Is My Dog Scooting on the Floor',desc:'Dog scooting causes: anal gland issues, parasites, allergies, and infections. How to help and when to see a veterinarian.',animal:'dogs'},
  {slug:'why-are-my-dogs-eyes-red',title:'Why Are My Dogs Eyes Red',desc:'Red eyes in dogs: allergies, infections, glaucoma, cherry eye, and dry eye. Diagnosis and treatment for canine eye problems.',animal:'dogs'},
  {slug:'why-is-my-dog-stiff-after-resting',title:'Why Is My Dog Stiff After Resting',desc:'Dog stiffness after rest: arthritis, Lyme disease, IVDD, and muscle injuries. How to help and when to worry.',animal:'dogs'},
  {slug:'why-is-my-dog-peeing-in-the-house',title:'Why Is My Dog Peeing in the House',desc:'Indoor urination causes in dogs: UTI, marking, anxiety, aging, and medical conditions. Solutions and when to see a vet.',animal:'dogs'},
  {slug:'why-is-my-dog-constipated',title:'Why Is My Dog Constipated',desc:'Dog constipation causes, home remedies, safe laxatives, and when to see a vet. Prevention tips for regular bowel movements.',animal:'dogs'},
  {slug:'why-is-my-dog-drooling-excessively',title:'Why Is My Dog Drooling Excessively',desc:'Excessive drooling in dogs beyond normal: nausea, dental disease, poisoning, heatstroke, and oral tumors.',animal:'dogs'},
  {slug:'why-is-my-dog-losing-weight',title:'Why Is My Dog Losing Weight',desc:'Unexplained weight loss in dogs: cancer, diabetes, kidney disease, parasites, and dental problems. When to get blood work.',animal:'dogs'},
  {slug:'why-does-my-dog-have-bumps-on-skin',title:'Why Does My Dog Have Bumps on Skin',desc:'Skin bumps on dogs: hives, cysts, tumors, insect bites, and infections. When lumps require biopsy and veterinary attention.',animal:'dogs'},
  {slug:'why-is-my-dog-pacing',title:'Why Is My Dog Pacing and Restless',desc:'Restless pacing in dogs: pain, anxiety, cognitive dysfunction, bloat, and neurological issues. Warning signs of emergencies.',animal:'dogs'},
  {slug:'why-is-my-dog-breathing-fast',title:'Why Is My Dog Breathing Fast',desc:'Rapid breathing in dogs (tachypnea): heat, pain, heart disease, respiratory infection, and anxiety. Normal vs abnormal rates.',animal:'dogs'},
  {slug:'why-does-my-dog-have-ear-infections',title:'Why Does My Dog Keep Getting Ear Infections',desc:'Recurring ear infections in dogs: allergies, anatomy, moisture, and bacteria. Prevention, treatment, and breeds at risk.',animal:'dogs'},
  {slug:'why-is-my-dog-having-seizures',title:'Why Is My Dog Having Seizures',desc:'Dog seizure causes: epilepsy, toxin exposure, liver disease, and brain tumors. What to do during a seizure and when to rush to the vet.',animal:'dogs'},
  {slug:'why-is-my-dog-bloated',title:'Why Is My Dogs Stomach Bloated',desc:'Bloated stomach in dogs: GDV (bloat), parasites, overeating, and organ enlargement. Bloat is a life-threatening emergency.',animal:'dogs'},
  {slug:'why-is-my-dog-not-pooping',title:'Why Is My Dog Not Pooping',desc:'Dog not pooping for days: constipation, obstruction, dehydration, and dietary issues. When lack of bowel movements is an emergency.',animal:'dogs'},
  {slug:'why-is-my-dog-lethargic',title:'Why Is My Dog Lethargic and Tired',desc:'Dog lethargy causes: infection, pain, anemia, heart disease, and depression. How to tell tiredness from serious illness.',animal:'dogs'},
  {slug:'why-does-my-dog-smell-bad',title:'Why Does My Dog Smell Bad',desc:'Bad dog odor causes: skin infections, dental disease, ear infections, anal glands, and yeast. Solutions for smelly dogs.',animal:'dogs'},
  {slug:'why-is-my-dog-gagging',title:'Why Is My Dog Gagging and Retching',desc:'Dog gagging without vomiting: kennel cough, foreign object, laryngeal paralysis, and tracheal collapse. When to seek emergency care.',animal:'dogs'},
  {slug:'why-is-my-dog-snoring',title:'Why Is My Dog Snoring So Loud',desc:'Dog snoring causes: brachycephalic airway, obesity, allergies, and polyps. When snoring indicates breathing problems needing treatment.',animal:'dogs'},
  {slug:'why-is-my-dog-reverse-sneezing',title:'Why Is My Dog Reverse Sneezing',desc:'Reverse sneezing in dogs: causes, what it looks like, how to help, and when it signals nasal mites or other problems.',animal:'dogs'},
  {slug:'why-is-my-dog-head-tilting',title:'Why Is My Dog Tilting Its Head',desc:'Head tilting in dogs: ear infections, vestibular disease, brain tumors, and stroke. Cute vs concerning head tilts explained.',animal:'dogs'},
  {slug:'why-is-my-dog-hiding',title:'Why Is My Dog Hiding and Acting Strange',desc:'Dogs hiding behavior: pain, fear, illness, anxiety, and cognitive decline. How to identify the cause and help your dog.',animal:'dogs'},
  {slug:'why-is-my-dog-peeing-blood',title:'Why Is My Dog Peeing Blood',desc:'Blood in dog urine (hematuria): UTI, bladder stones, cancer, and prostate issues. This always requires veterinary attention.',animal:'dogs'},
  {slug:'why-does-my-dog-have-hot-spots',title:'Why Does My Dog Have Hot Spots',desc:'Hot spots (moist dermatitis) in dogs: causes, treatment, prevention, and breeds prone to this painful skin condition.',animal:'dogs'},
  {slug:'why-is-my-dog-chewing-on-everything',title:'Why Is My Dog Chewing on Everything',desc:'Destructive chewing in dogs: teething, boredom, anxiety, and dental pain. How to redirect chewing and protect your belongings.',animal:'dogs'},
  {slug:'why-is-my-dog-throwing-up-yellow-bile',title:'Why Is My Dog Throwing Up Yellow Bile',desc:'Yellow bile vomiting in dogs: bilious vomiting syndrome, empty stomach, pancreatitis, and intestinal blockage.',animal:'dogs'},
  {slug:'why-is-my-dog-yelping-in-pain',title:'Why Is My Dog Yelping in Pain',desc:'Dog yelping and crying: back pain, joint issues, abdominal pain, and injuries. How to assess pain and when to seek emergency care.',animal:'dogs'},
  {slug:'why-does-my-dog-have-cloudy-eyes',title:'Why Does My Dog Have Cloudy Eyes',desc:'Cloudy eyes in dogs: nuclear sclerosis, cataracts, glaucoma, and corneal ulcers. Age-related vs disease-related changes.',animal:'dogs'},
  {slug:'why-is-my-dog-falling-over',title:'Why Is My Dog Falling Over and Losing Balance',desc:'Loss of balance in dogs: vestibular disease, ear infection, stroke, and toxins. Emergency signs and what to expect at the vet.',animal:'dogs'},
  {slug:'why-does-my-dog-keep-licking-lips',title:'Why Does My Dog Keep Licking Its Lips',desc:'Excessive lip licking in dogs: nausea, anxiety, oral pain, and dehydration. Context clues to identify the underlying cause.',animal:'dogs'},
  {slug:'why-is-my-dog-swollen-face',title:'Why Is My Dogs Face Swollen',desc:'Facial swelling in dogs: allergic reaction, insect stings, dental abscess, and tumors. When swelling is an emergency.',animal:'dogs'},
  // Cat symptom pages
  {slug:'why-is-my-cat-sneezing',title:'Why Is My Cat Sneezing',desc:'Cat sneezing causes: upper respiratory infection, allergies, foreign objects, and dental disease. When to see a vet.',animal:'cats'},
  {slug:'why-is-my-cat-not-eating',title:'Why Is My Cat Not Eating',desc:'Loss of appetite in cats is always concerning. Causes include illness, stress, dental pain, and kidney disease. When to seek help.',animal:'cats'},
  {slug:'why-is-my-cat-peeing-outside-litter-box',title:'Why Is My Cat Peeing Outside the Litter Box',desc:'Inappropriate urination in cats: UTI, stress, litter box issues, and kidney disease. Medical vs behavioral causes and solutions.',animal:'cats'},
  {slug:'why-is-my-cat-vomiting',title:'Why Is My Cat Vomiting',desc:'Cat vomiting causes: hairballs, dietary issues, poisoning, kidney disease, and pancreatitis. Occasional vs chronic vomiting.',animal:'cats'},
  {slug:'why-is-my-cat-losing-weight',title:'Why Is My Cat Losing Weight',desc:'Unexplained weight loss in cats: hyperthyroidism, diabetes, cancer, kidney disease, and dental problems. Always warrants testing.',animal:'cats'},
  {slug:'why-is-my-cat-hiding',title:'Why Is My Cat Hiding',desc:'Cat hiding behavior: illness, pain, stress, new environment, and fear. How to coax a cat out and when hiding signals a problem.',animal:'cats'},
  {slug:'why-is-my-cat-drooling',title:'Why Is My Cat Drooling',desc:'Cat drooling causes: dental disease, nausea, oral tumors, poisoning, and upper respiratory infections. Normal vs concerning drool.',animal:'cats'},
  {slug:'why-is-my-cat-scratching-furniture',title:'Why Is My Cat Scratching Furniture',desc:'Cats scratching furniture: natural behavior, territory marking, and nail maintenance. How to redirect to scratching posts.',animal:'cats'},
  {slug:'why-is-my-cat-meowing-so-much',title:'Why Is My Cat Meowing So Much',desc:'Excessive meowing in cats: hunger, attention, pain, cognitive dysfunction, and hyperthyroidism. Understanding cat vocalizations.',animal:'cats'},
  {slug:'why-is-my-cat-drinking-so-much-water',title:'Why Is My Cat Drinking So Much Water',desc:'Excessive thirst in cats (polydipsia): kidney disease, diabetes, hyperthyroidism, and liver disease. Always needs veterinary testing.',animal:'cats'},
  {slug:'why-does-my-cat-have-diarrhea',title:'Why Does My Cat Have Diarrhea',desc:'Cat diarrhea causes: dietary changes, parasites, IBD, food allergies, and infections. Home care vs veterinary treatment.',animal:'cats'},
  {slug:'why-is-my-cat-coughing',title:'Why Is My Cat Coughing',desc:'Cat coughing causes: asthma, heartworm, respiratory infection, and heart disease. Difference between coughing and hairballs.',animal:'cats'},
  {slug:'why-is-my-cat-losing-hair',title:'Why Is My Cat Losing Hair',desc:'Cat hair loss (alopecia): overgrooming, allergies, ringworm, hormonal issues, and stress. Diagnosis and treatment options.',animal:'cats'},
  {slug:'why-is-my-cat-breathing-fast',title:'Why Is My Cat Breathing Fast',desc:'Rapid breathing in cats: stress, heart disease, asthma, pleural effusion, and anemia. Normal respiratory rates and warning signs.',animal:'cats'},
  {slug:'why-are-my-cats-eyes-watery',title:'Why Are My Cats Eyes Watery',desc:'Cat watery eyes: allergies, infection, blocked tear ducts, and feline herpesvirus. When eye discharge needs veterinary attention.',animal:'cats'},
  {slug:'why-is-my-cat-limping',title:'Why Is My Cat Limping',desc:'Limping in cats: injuries, arthritis, fractures, and infections. Cats hide pain well, so limping often signals significant discomfort.',animal:'cats'},
  {slug:'why-is-my-cat-constipated',title:'Why Is My Cat Constipated',desc:'Cat constipation causes: dehydration, megacolon, hairballs, and kidney disease. Safe home remedies and when to see a vet.',animal:'cats'},
  {slug:'why-does-my-cat-have-bad-breath',title:'Why Does My Cat Have Bad Breath',desc:'Cat bad breath: dental disease, kidney failure, diabetes, and oral cancer. Halitosis in cats often signals serious health issues.',animal:'cats'},
  {slug:'why-is-my-cat-overgrooming',title:'Why Is My Cat Overgrooming',desc:'Excessive grooming in cats: stress, allergies, pain, and obsessive-compulsive behavior. How to identify and treat the cause.',animal:'cats'},
  {slug:'why-is-my-cat-lethargic',title:'Why Is My Cat Lethargic',desc:'Cat lethargy causes: infection, anemia, heart disease, kidney failure, and FIP. How to distinguish normal rest from concerning inactivity.',animal:'cats'},
  {slug:'why-is-my-cat-shaking',title:'Why Is My Cat Shaking or Trembling',desc:'Cat trembling causes: cold, pain, fear, hypoglycemia, and kidney disease. When shaking in cats requires emergency veterinary care.',animal:'cats'},
  {slug:'why-does-my-cat-have-dandruff',title:'Why Does My Cat Have Dandruff',desc:'Cat dandruff causes: dry air, poor nutrition, obesity, skin parasites, and fungal infections. Home treatment and prevention tips.',animal:'cats'},
  {slug:'why-is-my-cat-peeing-blood',title:'Why Is My Cat Peeing Blood',desc:'Blood in cat urine: UTI, bladder stones, feline idiopathic cystitis, and cancer. This always requires veterinary attention.',animal:'cats'},
  {slug:'why-is-my-cat-snoring',title:'Why Is My Cat Snoring',desc:'Cat snoring causes: obesity, upper respiratory infection, polyps, and brachycephalic anatomy. When snoring signals a problem.',animal:'cats'},
  {slug:'why-is-my-cat-pulling-out-fur',title:'Why Is My Cat Pulling Out Its Fur',desc:'Cats pulling out fur (psychogenic alopecia): stress, allergies, pain, and parasites. Treatment and environmental enrichment solutions.',animal:'cats'},
  {slug:'why-does-my-cat-have-black-spots-on-lips',title:'Why Does My Cat Have Black Spots on Lips',desc:'Black spots on cat lips and gums: lentigo simplex vs melanoma. When to worry about pigmentation changes in cats.',animal:'cats'},
  {slug:'why-is-my-cat-yowling-at-night',title:'Why Is My Cat Yowling at Night',desc:'Nighttime yowling in cats: cognitive dysfunction, hyperthyroidism, pain, mating behavior, and anxiety. Solutions for restful nights.',animal:'cats'},
  {slug:'why-does-my-cat-keep-throwing-up-hairballs',title:'Why Does My Cat Keep Throwing Up Hairballs',desc:'Frequent hairballs in cats: when its normal, prevention strategies, diet changes, and when hairballs signal underlying GI problems.',animal:'cats'},
  {slug:'why-is-my-cat-walking-funny',title:'Why Is My Cat Walking Funny',desc:'Abnormal cat gait: vestibular disease, injury, saddle thrombus, and neurological issues. Some causes are life-threatening emergencies.',animal:'cats'},
  {slug:'why-is-my-cats-nose-dry',title:'Why Is My Cats Nose Dry',desc:'Dry nose in cats: normal variation, dehydration, sunburn, and autoimmune disease. Myths vs reality about wet vs dry cat noses.',animal:'cats'},
  {slug:'why-does-my-cat-have-scabs',title:'Why Does My Cat Have Scabs',desc:'Scabs on cats: miliary dermatitis, allergies, parasites, and ringworm. Common locations and what they indicate about the cause.',animal:'cats'},
].map(p => ({...p, affiliateCategories: p.affiliateCategories || ['teleVetsAndClinics','insuranceAndWellness','pharmacyAndMedical']}));

// ============================================================
// NEW LOCATION PAGES (120 cities — excluding existing 51)
// ============================================================
export const newScaleLocationPages = [
  {slug:'fort-worth',city:'Fort Worth',state:'Texas'},{slug:'el-paso',city:'El Paso',state:'Texas'},
  {slug:'arlington-tx',city:'Arlington',state:'Texas'},{slug:'plano-tx',city:'Plano',state:'Texas'},
  {slug:'irving-tx',city:'Irving',state:'Texas'},{slug:'garland-tx',city:'Garland',state:'Texas'},
  {slug:'laredo-tx',city:'Laredo',state:'Texas'},{slug:'lubbock-tx',city:'Lubbock',state:'Texas'},
  {slug:'corpus-christi',city:'Corpus Christi',state:'Texas'},{slug:'colorado-springs',city:'Colorado Springs',state:'Colorado'},
  {slug:'aurora-co',city:'Aurora',state:'Colorado'},{slug:'lakewood-co',city:'Lakewood',state:'Colorado'},
  {slug:'fort-collins',city:'Fort Collins',state:'Colorado'},{slug:'long-beach',city:'Long Beach',state:'California'},
  {slug:'oakland',city:'Oakland',state:'California'},{slug:'anaheim',city:'Anaheim',state:'California'},
  {slug:'santa-ana',city:'Santa Ana',state:'California'},{slug:'riverside',city:'Riverside',state:'California'},
  {slug:'irvine-ca',city:'Irvine',state:'California'},{slug:'stockton',city:'Stockton',state:'California'},
  {slug:'chula-vista',city:'Chula Vista',state:'California'},{slug:'modesto',city:'Modesto',state:'California'},
  {slug:'fontana',city:'Fontana',state:'California'},{slug:'moreno-valley',city:'Moreno Valley',state:'California'},
  {slug:'huntington-beach',city:'Huntington Beach',state:'California'},{slug:'glendale-ca',city:'Glendale',state:'California'},
  {slug:'san-bernardino',city:'San Bernardino',state:'California'},{slug:'fresno',city:'Fresno',state:'California'},
  {slug:'bakersfield',city:'Bakersfield',state:'California'},{slug:'virginia-beach',city:'Virginia Beach',state:'Virginia'},
  {slug:'norfolk-va',city:'Norfolk',state:'Virginia'},{slug:'chesapeake-va',city:'Chesapeake',state:'Virginia'},
  {slug:'newport-news',city:'Newport News',state:'Virginia'},{slug:'alexandria-va',city:'Alexandria',state:'Virginia'},
  {slug:'tulsa',city:'Tulsa',state:'Oklahoma'},{slug:'wichita',city:'Wichita',state:'Kansas'},
  {slug:'newark',city:'Newark',state:'New Jersey'},{slug:'jersey-city',city:'Jersey City',state:'New Jersey'},
  {slug:'lincoln-ne',city:'Lincoln',state:'Nebraska'},{slug:'toledo',city:'Toledo',state:'Ohio'},
  {slug:'st-paul',city:'St. Paul',state:'Minnesota'},{slug:'durham-nc',city:'Durham',state:'North Carolina'},
  {slug:'greensboro',city:'Greensboro',state:'North Carolina'},{slug:'winston-salem',city:'Winston-Salem',state:'North Carolina'},
  {slug:'fayetteville-nc',city:'Fayetteville',state:'North Carolina'},{slug:'st-petersburg-fl',city:'St. Petersburg',state:'Florida'},
  {slug:'hialeah-fl',city:'Hialeah',state:'Florida'},{slug:'henderson-nv',city:'Henderson',state:'Nevada'},
  {slug:'north-las-vegas',city:'North Las Vegas',state:'Nevada'},{slug:'reno',city:'Reno',state:'Nevada'},
  {slug:'chandler-az',city:'Chandler',state:'Arizona'},{slug:'scottsdale-az',city:'Scottsdale',state:'Arizona'},
  {slug:'glendale-az',city:'Glendale',state:'Arizona'},{slug:'gilbert-az',city:'Gilbert',state:'Arizona'},
  {slug:'surprise-az',city:'Surprise',state:'Arizona'},{slug:'madison-wi',city:'Madison',state:'Wisconsin'},
  {slug:'boise',city:'Boise',state:'Idaho'},{slug:'spokane',city:'Spokane',state:'Washington'},
  {slug:'tacoma',city:'Tacoma',state:'Washington'},{slug:'bellevue-wa',city:'Bellevue',state:'Washington'},
  {slug:'des-moines',city:'Des Moines',state:'Iowa'},{slug:'lexington-ky',city:'Lexington',state:'Kentucky'},
  {slug:'rochester-ny',city:'Rochester',state:'New York'},{slug:'yonkers-ny',city:'Yonkers',state:'New York'},
  {slug:'grand-rapids',city:'Grand Rapids',state:'Michigan'},{slug:'ann-arbor',city:'Ann Arbor',state:'Michigan'},
  {slug:'knoxville',city:'Knoxville',state:'Tennessee'},{slug:'chattanooga',city:'Chattanooga',state:'Tennessee'},
  {slug:'clarksville-tn',city:'Clarksville',state:'Tennessee'},{slug:'akron',city:'Akron',state:'Ohio'},
  {slug:'dayton',city:'Dayton',state:'Ohio'},{slug:'amarillo',city:'Amarillo',state:'Texas'},
  {slug:'montgomery-al',city:'Montgomery',state:'Alabama'},{slug:'huntsville-al',city:'Huntsville',state:'Alabama'},
  {slug:'little-rock',city:'Little Rock',state:'Arkansas'},{slug:'tallahassee',city:'Tallahassee',state:'Florida'},
  {slug:'pensacola',city:'Pensacola',state:'Florida'},{slug:'augusta-ga',city:'Augusta',state:'Georgia'},
  {slug:'savannah-ga',city:'Savannah',state:'Georgia'},{slug:'macon-ga',city:'Macon',state:'Georgia'},
  {slug:'sioux-falls',city:'Sioux Falls',state:'South Dakota'},{slug:'columbia-sc',city:'Columbia',state:'South Carolina'},
  {slug:'charleston-sc',city:'Charleston',state:'South Carolina'},{slug:'baton-rouge',city:'Baton Rouge',state:'Louisiana'},
  {slug:'providence',city:'Providence',state:'Rhode Island'},{slug:'provo-ut',city:'Provo',state:'Utah'},
  {slug:'springfield-mo',city:'Springfield',state:'Missouri'},{slug:'naperville-il',city:'Naperville',state:'Illinois'},
  {slug:'peoria-il',city:'Peoria',state:'Illinois'},{slug:'eugene',city:'Eugene',state:'Oregon'},
  {slug:'salem-or',city:'Salem',state:'Oregon'},{slug:'asheville-nc',city:'Asheville',state:'North Carolina'},
  {slug:'portland-me',city:'Portland',state:'Maine'},{slug:'burlington-vt',city:'Burlington',state:'Vermont'},
  {slug:'manchester-nh',city:'Manchester',state:'New Hampshire'},{slug:'hartford-ct',city:'Hartford',state:'Connecticut'},
  {slug:'new-haven-ct',city:'New Haven',state:'Connecticut'},{slug:'worcester-ma',city:'Worcester',state:'Massachusetts'},
  {slug:'springfield-ma',city:'Springfield',state:'Massachusetts'},{slug:'wilmington-de',city:'Wilmington',state:'Delaware'},
  {slug:'anchorage',city:'Anchorage',state:'Alaska'},{slug:'jackson-ms',city:'Jackson',state:'Mississippi'},
  {slug:'billings-mt',city:'Billings',state:'Montana'},{slug:'fargo-nd',city:'Fargo',state:'North Dakota'},
  {slug:'bismarck-nd',city:'Bismarck',state:'North Dakota'},{slug:'cheyenne-wy',city:'Cheyenne',state:'Wyoming'},
  {slug:'charleston-wv',city:'Charleston',state:'West Virginia'},{slug:'santa-fe-nm',city:'Santa Fe',state:'New Mexico'},
  {slug:'boulder-co',city:'Boulder',state:'Colorado'},{slug:'tempe-az',city:'Tempe',state:'Arizona'},
  {slug:'overland-park-ks',city:'Overland Park',state:'Kansas'},{slug:'durham-nc-south',city:'South Durham',state:'North Carolina'},
  {slug:'coral-springs-fl',city:'Coral Springs',state:'Florida'},{slug:'palm-bay-fl',city:'Palm Bay',state:'Florida'},
  {slug:'lakeland-fl',city:'Lakeland',state:'Florida'},{slug:'port-st-lucie-fl',city:'Port St. Lucie',state:'Florida'},
  {slug:'gainesville-fl',city:'Gainesville',state:'Florida'},{slug:'cape-coral-fl',city:'Cape Coral',state:'Florida'},
  {slug:'clearwater-fl',city:'Clearwater',state:'Florida'},{slug:'miramar-fl',city:'Miramar',state:'Florida'},
  {slug:'brownsville-tx',city:'Brownsville',state:'Texas'},{slug:'mcallen-tx',city:'McAllen',state:'Texas'},
  {slug:'killeen-tx',city:'Killeen',state:'Texas'},{slug:'midland-tx',city:'Midland',state:'Texas'},
];

// ============================================================
// NUTRITION & DIET PAGES (40 pages)
// ============================================================
export const nutritionPages = [
  {slug:'raw-diet-for-dogs',title:'Raw Diet for Dogs: Complete Guide',desc:'Everything about raw feeding for dogs including BARF and prey model diets, safety considerations, nutritional balance, and transitioning tips.',animal:'dogs',affiliateCategories:['foodAndNutrition','groomingAndSupplements']},
  {slug:'grain-free-dog-food-guide',title:'Grain-Free Dog Food: Pros, Cons & FDA Warning',desc:'Is grain-free dog food safe? FDA DCM investigation, when grain-free is appropriate, and top grain-inclusive alternatives.',animal:'dogs',affiliateCategories:['foodAndNutrition']},
  {slug:'senior-dog-nutrition-guide',title:'Senior Dog Nutrition: Feeding Your Aging Dog',desc:'Nutritional needs change as dogs age. Calorie adjustments, joint support, cognitive health supplements, and best senior dog foods.',animal:'dogs',affiliateCategories:['foodAndNutrition','groomingAndSupplements','pharmacyAndMedical']},
  {slug:'dog-food-for-sensitive-stomachs',title:'Best Dog Food for Sensitive Stomachs',desc:'Top rated dog foods for sensitive digestion. Limited ingredient diets, easily digestible proteins, and feeding tips for GI-sensitive dogs.',animal:'dogs',affiliateCategories:['foodAndNutrition']},
  {slug:'homemade-dog-food-recipes-guide',title:'Homemade Dog Food Recipes & Nutrition Guide',desc:'Vet-approved homemade dog food recipes with proper nutritional balance. Meal prep tips, essential supplements, and foods to avoid.',animal:'dogs',affiliateCategories:['foodAndNutrition','groomingAndSupplements']},
  {slug:'puppy-feeding-schedule-guide',title:'Puppy Feeding Schedule by Age & Size',desc:'Complete puppy feeding guide from weaning to adulthood. How much, how often, and the best foods for small, medium, and large breed puppies.',animal:'dogs',affiliateCategories:['foodAndNutrition']},
  {slug:'healthy-dog-treat-recipes',title:'Healthy Dog Treat Recipes',desc:'Easy homemade dog treat recipes using safe, nutritious ingredients. Frozen treats, training treats, and dental chew alternatives.',animal:'dogs',affiliateCategories:['foodAndNutrition']},
  {slug:'raw-diet-for-cats-guide',title:'Raw Diet for Cats: Benefits, Risks & How-To',desc:'Raw feeding for cats explained. Nutritional requirements, safety concerns, commercial raw options, and transitioning from kibble.',animal:'cats',affiliateCategories:['foodAndNutrition']},
  {slug:'best-food-indoor-cats',title:'Best Cat Food for Indoor Cats',desc:'Indoor cats have unique nutritional needs. Lower calorie formulas, hairball prevention, and top-rated indoor cat food brands compared.',animal:'cats',affiliateCategories:['foodAndNutrition']},
  {slug:'cat-food-urinary-health-guide',title:'Best Cat Food for Urinary Health',desc:'Urinary tract health through diet. pH-balanced formulas, moisture content importance, and veterinary diet options for FLUTD prevention.',animal:'cats',affiliateCategories:['foodAndNutrition','pharmacyAndMedical']},
  {slug:'kitten-feeding-complete-guide',title:'Kitten Feeding Guide: Birth to 12 Months',desc:'Complete kitten nutrition guide covering bottle feeding, weaning, growth formulas, feeding schedules, and transitioning to adult food.',animal:'cats',affiliateCategories:['foodAndNutrition']},
  {slug:'wet-vs-dry-cat-food-comparison',title:'Wet vs Dry Cat Food: Which Is Better',desc:'Pros and cons of wet vs dry cat food. Hydration benefits, dental health, cost comparison, and veterinary recommendations for feeding.',animal:'cats',affiliateCategories:['foodAndNutrition']},
  {slug:'cat-food-for-hairball-control',title:'Best Cat Food for Hairball Control',desc:'Cat foods formulated to reduce hairballs through fiber content and coat health ingredients. Top brands and feeding strategies compared.',animal:'cats',affiliateCategories:['foodAndNutrition','groomingAndSupplements']},
  {slug:'cat-food-weight-gain-guide',title:'Best Cat Food for Weight Gain in Underweight Cats',desc:'How to help an underweight cat gain weight safely. High-calorie foods, appetite stimulants, and when weight loss indicates illness.',animal:'cats',affiliateCategories:['foodAndNutrition','pharmacyAndMedical']},
  {slug:'best-dog-food-large-breeds-guide',title:'Best Dog Food for Large Breeds',desc:'Nutritional needs specific to large and giant breed dogs. Joint support, controlled growth formulas, and bloat prevention through feeding.',animal:'dogs',affiliateCategories:['foodAndNutrition','groomingAndSupplements']},
  {slug:'best-dog-food-small-breeds-guide',title:'Best Dog Food for Small Breeds',desc:'Small breed dogs need calorie-dense kibble for fast metabolisms. Top small breed formulas, feeding frequency, and dental considerations.',animal:'dogs',affiliateCategories:['foodAndNutrition']},
  {slug:'dog-food-joint-health-guide',title:'Best Dog Food for Joint Health',desc:'Dog foods with glucosamine, chondroitin, and omega-3s for joint support. Best options for dogs with arthritis or breed-related joint issues.',animal:'dogs',affiliateCategories:['foodAndNutrition','groomingAndSupplements','pharmacyAndMedical']},
  {slug:'best-dog-food-toppers-guide',title:'Best Dog Food Toppers & Meal Enhancers',desc:'Boost your dogs meals with nutritious toppers. Bone broth, freeze-dried raw, goats milk, and other meal enhancers reviewed.',animal:'dogs',affiliateCategories:['foodAndNutrition']},
  {slug:'freeze-dried-dog-food-guide',title:'Freeze-Dried Dog Food: Complete Guide',desc:'Is freeze-dried dog food worth the cost? Benefits, nutritional value, rehydration tips, and top freeze-dried brands compared.',animal:'dogs',affiliateCategories:['foodAndNutrition']},
  {slug:'limited-ingredient-dog-food-guide',title:'Best Limited Ingredient Dog Foods',desc:'LID dog foods for allergies and sensitivities. Single protein options, novel proteins, and elimination diet protocols for food allergies.',animal:'dogs',affiliateCategories:['foodAndNutrition']},
  {slug:'large-breed-puppy-food-guide',title:'Best Puppy Food for Large Breeds',desc:'Large breed puppies need controlled calcium and growth rates. Best formulas to prevent developmental orthopedic disease.',animal:'dogs',affiliateCategories:['foodAndNutrition','insuranceAndWellness']},
  {slug:'dehydrated-dog-food-guide',title:'Dehydrated Dog Food: Benefits & Top Brands',desc:'Dehydrated dog food combines convenience with whole-food nutrition. How it compares to kibble, raw, and freeze-dried options.',animal:'dogs',affiliateCategories:['foodAndNutrition']},
  {slug:'dog-food-weight-loss-guide',title:'Best Dog Food for Weight Loss',desc:'Weight management dog foods with reduced calories and high protein. Feeding strategies, portion control, and exercise plans for overweight dogs.',animal:'dogs',affiliateCategories:['foodAndNutrition','insuranceAndWellness']},
  {slug:'fresh-dog-food-delivery-guide',title:'Fresh Dog Food Delivery Services Compared',desc:'Fresh dog food subscription services reviewed. The Farmers Dog, Ollie, Nom Nom, and JustFoodForDogs compared on cost, ingredients, and quality.',animal:'dogs',affiliateCategories:['foodAndNutrition']},
  {slug:'cat-food-sensitive-stomach-guide',title:'Best Cat Food for Sensitive Stomachs',desc:'Cat foods for digestive issues including IBD, food sensitivities, and frequent vomiting. Limited ingredient and hydrolyzed protein options.',animal:'cats',affiliateCategories:['foodAndNutrition','pharmacyAndMedical']},
  {slug:'cat-food-diabetes-guide',title:'Best Cat Food for Diabetic Cats',desc:'Low-carb, high-protein cat foods for diabetic cats. How diet management can reduce or eliminate insulin needs in feline diabetes.',animal:'cats',affiliateCategories:['foodAndNutrition','pharmacyAndMedical']},
  {slug:'prescription-pet-food-guide',title:'Prescription Pet Food: Is It Worth the Cost',desc:'When veterinary prescription diets are necessary, how they work, costs compared to regular food, and alternatives for common conditions.',animal:'general',affiliateCategories:['foodAndNutrition','pharmacyAndMedical','insuranceAndWellness']},
  {slug:'high-protein-dog-food-guide',title:'Best High Protein Dog Foods',desc:'High protein dog food benefits, ideal protein percentages by life stage, and top brands with real meat as the first ingredient.',animal:'dogs',affiliateCategories:['foodAndNutrition']},
  {slug:'high-fiber-dog-food-guide',title:'Best High Fiber Dog Foods',desc:'Fiber for dogs: benefits for digestion, weight management, and anal gland health. Top high-fiber formulas and natural fiber sources.',animal:'dogs',affiliateCategories:['foodAndNutrition']},
  {slug:'dog-food-rotation-feeding',title:'Dog Food Rotation Diet: Benefits & How-To',desc:'Why rotating dog food brands and proteins benefits your dog. How to switch safely, rotation schedules, and avoiding digestive upset.',animal:'dogs',affiliateCategories:['foodAndNutrition']},
  {slug:'food-allergies-in-dogs-guide',title:'Food Allergies in Dogs: Symptoms & Solutions',desc:'Identifying and managing food allergies in dogs. Common allergens, elimination diet protocols, and hypoallergenic food options.',animal:'dogs',affiliateCategories:['foodAndNutrition','pharmacyAndMedical','teleVetsAndClinics']},
  {slug:'food-allergies-in-cats-guide',title:'Food Allergies in Cats: Complete Guide',desc:'Cat food allergy symptoms, testing methods, elimination diets, and novel protein foods. How to identify and manage feline food sensitivities.',animal:'cats',affiliateCategories:['foodAndNutrition','pharmacyAndMedical']},
  {slug:'human-foods-safe-dogs-complete-list',title:'Human Foods Safe for Dogs: Complete A-Z List',desc:'Complete list of human foods dogs can and cannot eat. From apples to zucchini, know exactly what is safe to share with your dog.',animal:'dogs',affiliateCategories:['foodAndNutrition','teleVetsAndClinics']},
  {slug:'human-foods-safe-cats-complete-list',title:'Human Foods Safe for Cats: Complete A-Z List',desc:'Which human foods can cats eat? Comprehensive list of safe and dangerous foods for cats with portion guidelines.',animal:'cats',affiliateCategories:['foodAndNutrition','teleVetsAndClinics']},
  {slug:'pet-supplement-complete-guide',title:'Pet Supplements Guide: Which Ones Actually Work',desc:'Evidence-based guide to pet supplements. Joint support, probiotics, omega-3s, and multivitamins reviewed for dogs and cats.',animal:'general',affiliateCategories:['groomingAndSupplements','pharmacyAndMedical']},
  {slug:'probiotics-for-dogs-guide',title:'Probiotics for Dogs: Benefits & Best Products',desc:'Do dogs need probiotics? Gut health benefits, when to use them, best probiotic supplements, and probiotic-rich foods for dogs.',animal:'dogs',affiliateCategories:['groomingAndSupplements','foodAndNutrition']},
  {slug:'omega-3-fatty-acids-pets',title:'Omega-3 for Dogs & Cats: Benefits & Dosing',desc:'Fish oil and omega-3 benefits for pets: skin health, joint support, cognitive function, and heart health. Dosing guidelines by weight.',animal:'general',affiliateCategories:['groomingAndSupplements','foodAndNutrition']},
  {slug:'dog-hydration-guide',title:'Dog Hydration: How Much Water Dogs Need',desc:'How much water should your dog drink daily? Factors affecting hydration, signs of dehydration, and encouraging water intake.',animal:'dogs',affiliateCategories:['foodAndNutrition','devicesGpsAndTech']},
  {slug:'cat-hydration-guide',title:'Cat Hydration: Getting Cats to Drink More Water',desc:'Cats are prone to dehydration. Water fountain benefits, wet food hydration, and creative ways to increase your cats water intake.',animal:'cats',affiliateCategories:['foodAndNutrition','devicesGpsAndTech']},
  {slug:'dog-diet-for-kidney-disease',title:'Diet for Dogs with Kidney Disease',desc:'Renal diet for dogs with CKD. Low phosphorus, controlled protein, and prescription food options to slow kidney disease progression.',animal:'dogs',affiliateCategories:['foodAndNutrition','pharmacyAndMedical','insuranceAndWellness']},
];

// ============================================================
// SEASONAL & SITUATIONAL PAGES (35 pages)
// ============================================================
export const seasonalPages = [
  {slug:'dog-summer-safety-guide',title:'Dog Summer Safety: Heat, Water & Outdoor Tips',desc:'Keep your dog safe in summer heat. Heatstroke prevention, paw pad burns, swimming safety, and outdoor adventure tips.',animal:'dogs',affiliateCategories:['devicesGpsAndTech','foodAndNutrition']},
  {slug:'winter-dog-care-guide',title:'Winter Dog Care: Cold Weather Safety',desc:'Protecting your dog in winter. Hypothermia prevention, paw care, antifreeze dangers, and indoor exercise alternatives.',animal:'dogs',affiliateCategories:['groomingAndSupplements','devicesGpsAndTech']},
  {slug:'holiday-pet-dangers-guide',title:'Holiday Pet Dangers: Christmas, Halloween & More',desc:'Seasonal hazards for pets during holidays. Toxic decorations, dangerous foods, stress management, and keeping pets safe during festivities.',animal:'general',affiliateCategories:['teleVetsAndClinics','anxietyAndCalming']},
  {slug:'traveling-with-pets-guide',title:'Traveling with Pets: Car, Plane & Hotel Guide',desc:'Complete pet travel guide covering car safety, airline requirements, hotel policies, and keeping pets comfortable during trips.',animal:'general',affiliateCategories:['walkingSittingBoarding','devicesGpsAndTech']},
  {slug:'relocating-with-pets',title:'Moving with Pets: Stress-Free Relocation Guide',desc:'Minimize pet stress during a move. Preparation timeline, travel day tips, helping pets adjust to new homes, and updating records.',animal:'general',affiliateCategories:['walkingSittingBoarding','anxietyAndCalming']},
  {slug:'new-baby-and-dogs',title:'Introducing Your Dog to a New Baby',desc:'Prepare your dog for a new baby. Pre-birth training, safe introductions, managing jealousy, and creating harmony between babies and dogs.',animal:'dogs',affiliateCategories:['trainingAndBehavior','anxietyAndCalming']},
  {slug:'pet-grief-and-loss-guide',title:'Coping with Pet Loss: A Grief Support Guide',desc:'Processing the grief of losing a pet. Stages of grief, memorialization options, helping children cope, and when to consider a new pet.',animal:'general',affiliateCategories:['insuranceAndWellness']},
  {slug:'senior-pet-care-complete-guide',title:'Senior Pet Care: Caring for Aging Dogs & Cats',desc:'Comprehensive senior pet care covering mobility, nutrition, cognitive decline, pain management, and quality of life assessment.',animal:'general',affiliateCategories:['pharmacyAndMedical','insuranceAndWellness','foodAndNutrition']},
  {slug:'multi-pet-household-tips',title:'Multi-Pet Household: Managing Dogs & Cats Together',desc:'Tips for households with multiple pets. Introducing new pets, managing resources, preventing conflict, and creating harmony.',animal:'general',affiliateCategories:['trainingAndBehavior','anxietyAndCalming']},
  {slug:'pet-first-aid-kit-essentials',title:'Pet First Aid Kit: Essential Supplies List',desc:'Build a complete pet first aid kit. Must-have supplies, medications to include, and step-by-step first aid for common emergencies.',animal:'general',affiliateCategories:['pharmacyAndMedical','devicesGpsAndTech']},
  {slug:'dog-swimming-safety-guide',title:'Dog Swimming Safety: Pools, Lakes & Ocean',desc:'Water safety for dogs. Teaching dogs to swim, life jacket selection, pool dangers, blue-green algae warnings, and beach safety.',animal:'dogs',affiliateCategories:['devicesGpsAndTech','insuranceAndWellness']},
  {slug:'fireworks-anxiety-pets-guide',title:'Fireworks Anxiety in Pets: Prevention & Treatment',desc:'Help your pet through fireworks season. Desensitization training, calming products, safe spaces, and medication options.',animal:'general',affiliateCategories:['anxietyAndCalming','trainingAndBehavior','pharmacyAndMedical']},
  {slug:'halloween-pet-safety-guide',title:'Halloween Pet Safety: Candy, Costumes & Stress',desc:'Keep pets safe on Halloween. Chocolate dangers, costume safety, doorbell anxiety, and preventing pets from escaping.',animal:'general',affiliateCategories:['teleVetsAndClinics','anxietyAndCalming']},
  {slug:'spring-allergy-season-pets',title:'Spring Allergies in Pets: Symptoms & Treatment',desc:'Seasonal allergies affect dogs and cats too. Pollen triggers, symptoms, antihistamines, and managing environmental allergies in pets.',animal:'general',affiliateCategories:['pharmacyAndMedical','groomingAndSupplements']},
  {slug:'tick-season-complete-guide',title:'Tick Season Guide: Prevention & Removal for Pets',desc:'Complete tick guide for pet owners. Prevention products, safe removal techniques, tick-borne diseases, and seasonal risk by region.',animal:'general',affiliateCategories:['pharmacyAndMedical','insuranceAndWellness']},
  {slug:'pet-friendly-road-trips-guide',title:'Pet-Friendly Road Trips: Planning & Packing',desc:'Plan the perfect road trip with your pet. Car safety, rest stop schedule, pet-friendly hotels, and packing essentials.',animal:'general',affiliateCategories:['walkingSittingBoarding','devicesGpsAndTech']},
  {slug:'flying-with-pets-airline-guide',title:'Flying with Pets: Airline Rules & Safety',desc:'Complete guide to flying with pets. Cabin vs cargo, airline pet policies compared, health certificates, and reducing travel stress.',animal:'general',affiliateCategories:['walkingSittingBoarding','anxietyAndCalming']},
  {slug:'camping-with-dogs-guide',title:'Camping with Dogs: Gear, Safety & Etiquette',desc:'Take your dog camping safely. Essential gear, wildlife encounters, leave-no-trace principles, and dog-friendly campground tips.',animal:'dogs',affiliateCategories:['devicesGpsAndTech','foodAndNutrition']},
  {slug:'pet-disaster-preparedness-guide',title:'Pet Disaster Preparedness: Emergency Planning',desc:'Emergency preparedness for pet owners. Evacuation kits, shelter plans, ID and microchipping, and disaster-specific guides.',animal:'general',affiliateCategories:['devicesGpsAndTech','pharmacyAndMedical']},
  {slug:'introducing-puppy-to-older-dog',title:'Introducing a New Puppy to Your Older Dog',desc:'Step-by-step guide to introducing a puppy to a resident dog. Managing energy differences, preventing resource guarding, and building bonds.',animal:'dogs',affiliateCategories:['trainingAndBehavior','anxietyAndCalming']},
  {slug:'introducing-dogs-and-cats',title:'Dogs and Cats Living Together: Introduction Guide',desc:'How to introduce dogs and cats safely. Gradual introduction protocol, management strategies, and signs of successful cohabitation.',animal:'general',affiliateCategories:['trainingAndBehavior','anxietyAndCalming']},
  {slug:'puppy-socialization-critical-window',title:'Puppy Socialization: The Critical Window Guide',desc:'Puppy socialization during the 3-16 week critical period. Exposure checklist, safe socialization during vaccinations, and common mistakes.',animal:'dogs',affiliateCategories:['trainingAndBehavior']},
  {slug:'senior-dog-comfort-care',title:'Senior Dog Comfort: Mobility, Pain & Quality of Life',desc:'Improving quality of life for senior dogs. Orthopedic beds, ramps, pain management, supplements, and knowing when its time.',animal:'dogs',affiliateCategories:['pharmacyAndMedical','groomingAndSupplements','insuranceAndWellness']},
  {slug:'canine-cognitive-dysfunction-guide',title:'Dog Dementia (CCD): Signs, Treatment & Care',desc:'Canine cognitive dysfunction syndrome in senior dogs. Symptoms, diagnosis, medication, supplements, and environmental enrichment.',animal:'dogs',affiliateCategories:['pharmacyAndMedical','insuranceAndWellness']},
  {slug:'pet-obesity-prevention-guide',title:'Pet Obesity Prevention: Weight Management Guide',desc:'Pet obesity is an epidemic. How to assess body condition, calculate calories, create exercise plans, and achieve healthy weight loss.',animal:'general',affiliateCategories:['foodAndNutrition','insuranceAndWellness']},
  {slug:'dog-arthritis-complete-guide',title:'Arthritis in Dogs: Symptoms, Treatment & Management',desc:'Comprehensive guide to canine arthritis. NSAIDs, supplements, physical therapy, weight management, and improving mobility.',animal:'dogs',affiliateCategories:['pharmacyAndMedical','groomingAndSupplements','insuranceAndWellness']},
  {slug:'cat-arthritis-complete-guide',title:'Arthritis in Cats: Signs, Treatment & Comfort',desc:'Feline arthritis is underdiagnosed. Subtle signs, pain medication, environmental modifications, and supplements for arthritic cats.',animal:'cats',affiliateCategories:['pharmacyAndMedical','groomingAndSupplements']},
  {slug:'dental-care-dogs-guide',title:'Dog Dental Care at Home: Brushing & Beyond',desc:'Home dental care for dogs. Toothbrushing technique, dental chews, water additives, and when professional cleaning is needed.',animal:'dogs',affiliateCategories:['groomingAndSupplements','pharmacyAndMedical']},
  {slug:'dental-care-cats-guide',title:'Cat Dental Care: Prevention & Home Maintenance',desc:'Keeping cat teeth healthy at home. Toothbrushing for cats, dental treats, and recognizing signs of periodontal disease.',animal:'cats',affiliateCategories:['groomingAndSupplements','pharmacyAndMedical']},
  {slug:'flea-prevention-complete-guide',title:'Complete Flea Prevention Guide for Dogs & Cats',desc:'Flea prevention strategies for every pet. Comparing topical, oral, and collar options. Treating infestations and environmental control.',animal:'general',affiliateCategories:['pharmacyAndMedical']},
  {slug:'heartworm-prevention-complete-guide',title:'Heartworm Prevention Guide: Dogs & Cats',desc:'Heartworm disease prevention for dogs and cats. Monthly preventatives compared, testing schedules, and treatment if infected.',animal:'general',affiliateCategories:['pharmacyAndMedical','insuranceAndWellness']},
  {slug:'microchipping-pets-complete-guide',title:'Pet Microchipping: Everything You Need to Know',desc:'Complete guide to pet microchipping. How it works, cost, registration, updating information, and why every pet needs a microchip.',animal:'general',affiliateCategories:['devicesGpsAndTech','insuranceAndWellness']},
  {slug:'pet-adoption-checklist-guide',title:'Pet Adoption Checklist: Prepare for Your New Pet',desc:'Complete adoption preparation guide. Supplies checklist, home setup, first vet visit, and helping your new pet adjust.',animal:'general',affiliateCategories:['foodAndNutrition','insuranceAndWellness','trainingAndBehavior']},
  {slug:'foster-pet-complete-guide',title:'Fostering Pets: Complete Guide for New Fosters',desc:'Everything you need to know about fostering dogs and cats. Getting started, supplies, medical care, decompression, and adoption events.',animal:'general',affiliateCategories:['foodAndNutrition','insuranceAndWellness']},
  {slug:'new-baby-and-cats',title:'Introducing Your Cat to a New Baby',desc:'Prepare your cat for a new family member. Scent introduction, nursery boundaries, managing stress, and creating safe spaces for cats.',animal:'cats',affiliateCategories:['anxietyAndCalming','trainingAndBehavior']},
];

// ============================================================
// ADDITIONAL BREED CROSSOVER PAGES (reach 3,000+ total)
// ============================================================

export const breedHealthPages2 = [
  ...dogBreeds.map(b => ({slug:`${b.slug}-health-issues`,title:`${b.name} Health Issues: Common Problems & Prevention`,desc:`Common health problems in ${b.name}s including ${b.issues.join(', ')}. Prevention, symptoms to watch for, and treatment options.`,animal:'dogs',affiliateCategories:['insuranceAndWellness','pharmacyAndMedical','teleVetsAndClinics']})),
  ...catBreeds.map(b => ({slug:`${b.slug}-cat-health-issues`,title:`${b.name} Cat Health Issues & Prevention`,desc:`Health problems common in ${b.name} cats: ${b.issues.join(', ')}. Screening, prevention, and treatment guide.`,animal:'cats',affiliateCategories:['insuranceAndWellness','pharmacyAndMedical']})),
];

export const breedLifespanPages = [
  ...dogBreeds.map(b => ({slug:`${b.slug}-lifespan-guide`,title:`${b.name} Lifespan: How Long Do They Live`,desc:`${b.name} average lifespan of ${b.lifespan}, factors affecting longevity, and how to help your ${b.name} live a longer, healthier life.`,animal:'dogs',affiliateCategories:['insuranceAndWellness','foodAndNutrition']})),
  ...catBreeds.map(b => ({slug:`${b.slug}-cat-lifespan`,title:`${b.name} Cat Lifespan & Longevity Guide`,desc:`How long do ${b.name} cats live? Average lifespan of ${b.lifespan}, health factors, and tips for maximizing your cats years.`,animal:'cats',affiliateCategories:['insuranceAndWellness','foodAndNutrition']})),
];

export const breedKidsPages = [
  ...dogBreeds.map(b => ({slug:`${b.slug}-with-kids`,title:`Are ${b.name}s Good with Kids? Family Guide`,desc:`Is a ${b.name} good for families with children? Temperament around kids, safety considerations, and age-appropriate interactions.`,animal:'dogs',affiliateCategories:['trainingAndBehavior']})),
  ...catBreeds.map(b => ({slug:`${b.slug}-cat-with-kids`,title:`Are ${b.name} Cats Good with Kids?`,desc:`${b.name} cats with children: temperament, patience level, and tips for fostering a safe, loving relationship between cat and kids.`,animal:'cats',affiliateCategories:['trainingAndBehavior']})),
];

export const breedApartmentPages = dogBreeds.map(b => ({
  slug:`${b.slug}-apartment-living`,title:`${b.name} in an Apartment: Can They Adapt?`,
  desc:`Can a ${b.name} thrive in an apartment? Space needs, noise level, exercise requirements, and tips for ${b.size} breed apartment living.`,
  animal:'dogs',affiliateCategories:['trainingAndBehavior','devicesGpsAndTech']
}));

export const breedAdoptionPages = [
  ...dogBreeds.map(b => ({slug:`adopt-a-${b.slug}`,title:`How to Adopt a ${b.name}: Rescue Guide`,desc:`Adopting a ${b.name}: breed-specific rescues, what to expect, adoption costs, and preparing your home for a rescued ${b.name}.`,animal:'dogs',affiliateCategories:['insuranceAndWellness','foodAndNutrition','trainingAndBehavior']})),
  ...catBreeds.map(b => ({slug:`adopt-a-${b.slug}-cat`,title:`How to Adopt a ${b.name} Cat: Rescue Guide`,desc:`Finding and adopting a ${b.name} cat from shelters and breed-specific rescues. What to expect and preparation tips.`,animal:'cats',affiliateCategories:['insuranceAndWellness','foodAndNutrition']})),
];

export const breedSheddingPages = dogBreeds.map(b => ({
  slug:`${b.slug}-shedding-guide`,title:`${b.name} Shedding: Management & Grooming Tips`,
  desc:`${b.name} shedding level: ${b.shedding}. Seasonal patterns, best brushes, deshedding tools, and reducing loose fur in your home.`,
  animal:'dogs',affiliateCategories:['groomingAndSupplements']
}));

export const breedSizePages = dogBreeds.map(b => ({
  slug:`how-big-do-${b.slug}s-get`,title:`How Big Do ${b.name}s Get? Size & Growth Guide`,
  desc:`${b.name} full size: ${b.weight}, ${b.size} breed. Growth timeline from puppy to adult, weight chart, and when they stop growing.`,
  animal:'dogs',affiliateCategories:['foodAndNutrition']
}));

// Cat-specific behavior/indoor pages
export const catIndoorPages = catBreeds.map(b => ({
  slug:`${b.slug}-cat-indoor-guide`,title:`${b.name} Cat Indoor Living Guide`,
  desc:`Keeping a ${b.name} cat happy indoors. Enrichment, vertical space, play needs for their ${b.energy} energy level, and preventing boredom.`,
  animal:'cats',affiliateCategories:['trainingAndBehavior','anxietyAndCalming']
}));

// Additional symptom pages
export const symptomPages2 = [
  {slug:'why-is-my-dog-pooping-blood',title:'Why Is My Dog Pooping Blood',desc:'Blood in dog stool: HGE, parasites, colitis, and cancer. Bright red vs dark blood and when this is an emergency.',animal:'dogs'},
  {slug:'why-is-my-dog-not-drinking-water',title:'Why Is My Dog Not Drinking Water',desc:'Dog refusing water: nausea, pain, mouth injury, and illness. Dehydration signs and how to encourage fluid intake.',animal:'dogs'},
  {slug:'why-is-my-dog-wobbly',title:'Why Is My Dog Wobbly and Off Balance',desc:'Dog wobbling and stumbling: vestibular disease, ear infection, toxins, and stroke. Emergency signs and treatment options.',animal:'dogs'},
  {slug:'why-is-my-dog-wheezing',title:'Why Is My Dog Wheezing',desc:'Dog wheezing causes: allergies, collapsed trachea, heart disease, and foreign objects. When wheezing needs urgent care.',animal:'dogs'},
  {slug:'why-does-my-dog-have-a-swollen-belly',title:'Why Does My Dog Have a Swollen Belly',desc:'Abdominal distension in dogs: bloat/GDV, fluid retention, Cushings, and pregnancy. Life-threatening vs non-urgent causes.',animal:'dogs'},
  {slug:'why-is-my-dog-not-sleeping',title:'Why Is My Dog Not Sleeping at Night',desc:'Dog insomnia and restlessness: pain, anxiety, cognitive dysfunction, and medical conditions. Solutions for better sleep.',animal:'dogs'},
  {slug:'why-is-my-dog-tail-between-legs',title:'Why Is My Dog Walking with Tail Between Legs',desc:'Dog tail tucking: fear, pain, anal gland issues, and submission. Understanding body language and when to seek help.',animal:'dogs'},
  {slug:'why-is-my-dog-dragging-back-legs',title:'Why Is My Dog Dragging Back Legs',desc:'Hind leg dragging in dogs: IVDD, degenerative myelopathy, injury, and tick paralysis. This often requires emergency care.',animal:'dogs'},
  {slug:'why-is-my-dog-stomach-gurgling',title:'Why Is My Dogs Stomach Gurgling Loudly',desc:'Loud stomach noises in dogs (borborygmi): hunger, gas, dietary indiscretion, and GI disorders. When rumbling is concerning.',animal:'dogs'},
  {slug:'why-does-my-dog-keep-getting-utis',title:'Why Does My Dog Keep Getting UTIs',desc:'Recurrent urinary tract infections in dogs: anatomy, bacteria, stones, and underlying conditions. Prevention and treatment.',animal:'dogs'},
  {slug:'why-is-my-cat-not-grooming',title:'Why Is My Cat Not Grooming Itself',desc:'When cats stop grooming: arthritis, obesity, dental pain, depression, and illness. A cat neglecting grooming needs veterinary attention.',animal:'cats'},
  {slug:'why-is-my-cat-panting',title:'Why Is My Cat Panting',desc:'Cat panting causes: heat, stress, pain, heart disease, and asthma. Panting is rarely normal in cats and often signals a problem.',animal:'cats'},
  {slug:'why-does-my-cat-have-a-bloated-belly',title:'Why Does My Cat Have a Bloated Belly',desc:'Cat abdominal bloating: FIP, organ enlargement, fluid, parasites, and pregnancy. When a swollen belly needs urgent care.',animal:'cats'},
  {slug:'why-is-my-cat-pooping-outside-litter-box',title:'Why Is My Cat Pooping Outside the Litter Box',desc:'Inappropriate defecation in cats: medical issues, litter box problems, stress, and territorial marking. Solutions that work.',animal:'cats'},
  {slug:'why-is-my-cat-not-using-litter-box',title:'Why Is My Cat Avoiding the Litter Box',desc:'Litter box avoidance in cats: location, cleanliness, litter type, medical issues, and multi-cat conflicts. Troubleshooting guide.',animal:'cats'},
  {slug:'why-is-my-cat-aggressive-suddenly',title:'Why Is My Cat Suddenly Aggressive',desc:'Sudden aggression in cats: pain, redirected aggression, fear, and neurological issues. How to handle and when to see a vet.',animal:'cats'},
  {slug:'why-does-my-cat-knead',title:'Why Does My Cat Knead (Make Biscuits)',desc:'Cat kneading behavior: comfort, nursing instinct, territory marking, and affection. What kneading means about your cats emotional state.',animal:'cats'},
  {slug:'why-is-my-cat-head-pressing',title:'Why Is My Cat Head Pressing Against Walls',desc:'Head pressing in cats: liver disease, brain tumors, toxins, and infections. This is always a veterinary emergency requiring immediate care.',animal:'cats'},
  {slug:'why-does-my-cat-eat-plastic',title:'Why Does My Cat Eat Plastic (Pica)',desc:'Cat pica and eating non-food items: nutritional deficiency, anxiety, OCD, and GI disorders. Preventing dangerous ingestion.',animal:'cats'},
].map(p => ({...p, affiliateCategories: p.affiliateCategories || ['teleVetsAndClinics','insuranceAndWellness','pharmacyAndMedical']}));

// Additional product review pages
export const additionalProductPages = [
  {slug:'best-dog-crates-guide',title:'Best Dog Crates: Wire, Plastic & Soft-Sided',desc:'Top rated dog crates for training, travel, and home use. Size guide, crate training tips, and airline-approved options.',animal:'dogs',affiliateCategories:['trainingAndBehavior']},
  {slug:'best-dog-harnesses-guide',title:'Best Dog Harnesses: No-Pull & Front-Clip',desc:'Top no-pull dog harnesses for walking and training. Front-clip vs back-clip, size fitting, and breed-specific recommendations.',animal:'dogs',affiliateCategories:['trainingAndBehavior','devicesGpsAndTech']},
  {slug:'best-dog-beds-orthopedic',title:'Best Orthopedic Dog Beds for Joint Support',desc:'Orthopedic dog beds for senior dogs, large breeds, and dogs with arthritis. Memory foam, bolster, and heated bed options compared.',animal:'dogs',affiliateCategories:['groomingAndSupplements']},
  {slug:'best-dog-cameras-guide',title:'Best Dog Cameras & Pet Monitors',desc:'Pet cameras with treat dispensers, two-way audio, and night vision. Monitor your dog while away and manage separation anxiety.',animal:'dogs',affiliateCategories:['devicesGpsAndTech']},
  {slug:'best-dog-dna-tests',title:'Best Dog DNA Tests: Breed & Health Screening',desc:'Compare dog DNA tests from Embark, Wisdom Panel, and more. Breed identification, health screening, and genetic trait testing.',animal:'dogs',affiliateCategories:['dnaAndTesting']},
  {slug:'best-cat-trees-towers',title:'Best Cat Trees & Towers for Every Budget',desc:'Cat trees, towers, and climbing furniture compared. Space requirements, stability, materials, and picks for multi-cat households.',animal:'cats',affiliateCategories:['trainingAndBehavior']},
  {slug:'best-cat-water-fountains',title:'Best Cat Water Fountains to Increase Hydration',desc:'Cat water fountains encourage drinking. Ceramic, stainless steel, and plastic options compared on flow, noise, and cleaning ease.',animal:'cats',affiliateCategories:['foodAndNutrition','devicesGpsAndTech']},
  {slug:'best-interactive-dog-toys',title:'Best Interactive Dog Toys & Puzzle Feeders',desc:'Mentally stimulating dog toys to prevent boredom. Puzzle feeders, treat-dispensing toys, and IQ-boosting games for smart breeds.',animal:'dogs',affiliateCategories:['trainingAndBehavior']},
  {slug:'best-dog-life-jackets',title:'Best Dog Life Jackets for Swimming Safety',desc:'Dog life jacket reviews for pools, lakes, and boats. Size fitting, visibility features, and picks for different breed sizes.',animal:'dogs',affiliateCategories:['devicesGpsAndTech']},
  {slug:'best-pet-insurance-companies-2026',title:'Best Pet Insurance Companies in 2026',desc:'Comprehensive pet insurance comparison for 2026. Coverage, costs, claim processes, and which company is best for your pet.',animal:'general',affiliateCategories:['insuranceAndWellness']},
  {slug:'best-dog-subscription-boxes',title:'Best Dog Subscription Boxes',desc:'Monthly dog subscription boxes compared: BarkBox, Bullymake, PupBox, and more. Toys, treats, and themed boxes reviewed.',animal:'dogs',affiliateCategories:['foodAndNutrition']},
  {slug:'best-cat-subscription-boxes',title:'Best Cat Subscription Boxes',desc:'Monthly cat subscription boxes compared. KitNipBox, Meowbox, and more. Toys, treats, and accessories delivered monthly.',animal:'cats',affiliateCategories:['foodAndNutrition']},
  {slug:'best-pet-strollers',title:'Best Pet Strollers for Dogs & Cats',desc:'Pet strollers for senior pets, small breeds, and multi-pet families. Jogging strollers, travel strollers, and heavy-duty options.',animal:'general',affiliateCategories:['devicesGpsAndTech']},
  {slug:'best-dog-cooling-products',title:'Best Dog Cooling Products for Hot Weather',desc:'Cooling mats, vests, bandanas, and pools for dogs in summer heat. Keep your dog comfortable and prevent heatstroke.',animal:'dogs',affiliateCategories:['groomingAndSupplements','devicesGpsAndTech']},
  {slug:'best-cat-calming-products',title:'Best Cat Calming Products: Diffusers, Treats & Sprays',desc:'Cat anxiety solutions: Feliway diffusers, calming treats, CBD products, and pheromone sprays compared for effectiveness.',animal:'cats',affiliateCategories:['anxietyAndCalming','pharmacyAndMedical']},
  {slug:'best-dog-gps-trackers-guide',title:'Best Dog GPS Trackers & Smart Collars',desc:'GPS trackers for dogs compared: Fi, Whistle, Apple AirTag, and more. Real-time tracking, activity monitoring, and escape alerts.',animal:'dogs',affiliateCategories:['devicesGpsAndTech']},
  {slug:'best-dog-calming-products',title:'Best Dog Calming Products: Anxiety Relief',desc:'Dog anxiety solutions: ThunderShirt, calming treats, pheromone diffusers, and supplements for noise phobia and separation anxiety.',animal:'dogs',affiliateCategories:['anxietyAndCalming','pharmacyAndMedical']},
  {slug:'best-dog-dental-chews',title:'Best Dental Chews & Treats for Dogs',desc:'VOHC-approved dental chews and treats for dogs. Plaque and tartar control, ingredient safety, and picks by dog size.',animal:'dogs',affiliateCategories:['groomingAndSupplements','foodAndNutrition']},
  {slug:'best-pet-cleaning-products',title:'Best Pet Stain & Odor Removers',desc:'Enzymatic cleaners and pet stain removers compared. Urine, vomit, and odor elimination for carpets, furniture, and hardwood.',animal:'general',affiliateCategories:['groomingAndSupplements']},
  {slug:'best-automatic-litter-boxes-guide',title:'Best Automatic Self-Cleaning Litter Boxes',desc:'Self-cleaning litter box reviews: Litter-Robot, PetSafe, and more. Features, noise levels, multi-cat capacity, and value comparison.',animal:'cats',affiliateCategories:['devicesGpsAndTech']},
  {slug:'best-dog-raincoats',title:'Best Dog Raincoats & Waterproof Gear',desc:'Waterproof dog coats and rain gear for wet weather walks. Sizing, reflective features, and picks for every dog size.',animal:'dogs',affiliateCategories:['groomingAndSupplements']},
  {slug:'best-cat-scratching-posts',title:'Best Cat Scratching Posts & Pads',desc:'Cat scratching post reviews: sisal, cardboard, and wall-mounted options. Protecting furniture while satisfying natural scratching instincts.',animal:'cats',affiliateCategories:['trainingAndBehavior']},
  {slug:'best-dog-winter-coats',title:'Best Dog Winter Coats & Cold Weather Gear',desc:'Insulated dog coats, booties, and cold weather accessories. Keep your dog warm and protected during winter walks.',animal:'dogs',affiliateCategories:['groomingAndSupplements','devicesGpsAndTech']},
  {slug:'best-pet-odor-eliminators',title:'Best Pet Odor Eliminators for Home',desc:'Remove pet odors from your home: air purifiers, enzyme sprays, carpet treatments, and whole-house solutions for pet owners.',animal:'general',affiliateCategories:['groomingAndSupplements']},
  {slug:'best-cat-toys-2026',title:'Best Cat Toys for Indoor Enrichment 2026',desc:'Interactive, electronic, and DIY cat toys to keep indoor cats entertained. Picks for solo play, puzzle feeders, and wand toys.',animal:'cats',affiliateCategories:['trainingAndBehavior']},
  {slug:'best-dog-poop-bags-dispensers',title:'Best Dog Poop Bags & Dispensers',desc:'Biodegradable and eco-friendly dog poop bags compared. Dispenser styles, durability, and the most environmentally responsible options.',animal:'dogs',affiliateCategories:['groomingAndSupplements']},
  {slug:'best-pet-first-aid-kits',title:'Best Pet First Aid Kits for Dogs & Cats',desc:'Emergency pet first aid kits for home and travel. Essential supplies, medication dosing guides, and when to use each item.',animal:'general',affiliateCategories:['pharmacyAndMedical']},
  {slug:'best-dog-food-toppers',title:'Best Dog Food Toppers & Meal Enhancers',desc:'Boost your dogs meals with food toppers: bone broth, freeze-dried raw, and nutritional powders compared for picky eaters.',animal:'dogs',affiliateCategories:['foodAndNutrition']},
  {slug:'best-cat-carriers-travel',title:'Best Cat Carriers for Vet Visits & Travel',desc:'Cat carrier reviews: hard-sided, soft-sided, and backpack styles. Airline-approved options and stress-reducing features.',animal:'cats',affiliateCategories:['devicesGpsAndTech']},
  {slug:'best-dog-nail-grinders',title:'Best Dog Nail Grinders & Clippers',desc:'Dog nail grinding tools compared to clippers. Quiet operation, safety guards, and tips for stress-free nail maintenance at home.',animal:'dogs',affiliateCategories:['groomingAndSupplements']},
  {slug:'best-pet-water-bottles-travel',title:'Best Pet Water Bottles for Walks & Travel',desc:'Portable dog water bottles and travel bowls for hikes, walks, and road trips. Leak-proof designs and capacity options compared.',animal:'dogs',affiliateCategories:['devicesGpsAndTech']},
  {slug:'best-dog-ear-cleaners',title:'Best Dog Ear Cleaning Solutions',desc:'Dog ear cleaners for routine care and infection prevention. Vet-recommended formulas, proper technique, and breed-specific needs.',animal:'dogs',affiliateCategories:['groomingAndSupplements','pharmacyAndMedical']},
  {slug:'best-cat-litter-2026',title:'Best Cat Litter Types Compared 2026',desc:'Clay, crystal, pine, corn, and tofu cat litters compared. Dust levels, odor control, tracking, and environmental impact ratings.',animal:'cats',affiliateCategories:['groomingAndSupplements']},
  {slug:'best-dog-training-treats',title:'Best Dog Training Treats: Low Calorie & High Value',desc:'Training treats compared: freeze-dried, soft chews, and single-ingredient options. Calorie counts and picks for allergy-prone dogs.',animal:'dogs',affiliateCategories:['foodAndNutrition','trainingAndBehavior']},
];
