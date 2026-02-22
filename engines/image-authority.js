#!/usr/bin/env node
/**
 * PetCareHelperAI — Visual Authority Enforcement Engine
 *
 * Replaces ALL broken source.unsplash.com URLs and styled placeholder divs
 * with real, permanent Wikimedia Commons images sourced from Wikipedia.
 *
 * Usage: node engines/image-authority.js
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE_DIR = join(__dirname, '..');

const WIKI_API = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const IMAGE_WIDTH = 800;
const CONCURRENCY = 3;
const API_TIMEOUT = 10000;
const RETRY_DELAY = 2000;

// ============================================================
// EXPLICIT BREED-TO-WIKIPEDIA TITLE MAPPINGS
// ============================================================

const EXPLICIT_MAPPINGS = {
  // ---- DOGS ----
  'dogs/affenpinscher': 'Affenpinscher',
  'dogs/afghan-hound': 'Afghan_Hound',
  'dogs/airedale-terrier': 'Airedale_Terrier',
  'dogs/akbash': 'Akbash',
  'dogs/akita': 'Akita_(dog_breed)',
  'dogs/alaskan-klee-kai': 'Alaskan_Klee_Kai',
  'dogs/alaskan-malamute': 'Alaskan_Malamute',
  'dogs/american-bulldog': 'American_Bulldog',
  'dogs/american-eskimo': 'American_Eskimo_Dog',
  'dogs/american-eskimo-dog': 'American_Eskimo_Dog',
  'dogs/american-foxhound': 'American_Foxhound',
  'dogs/american-pit-bull-terrier': 'American_Pit_Bull_Terrier',
  'dogs/american-staffordshire-terrier': 'American_Staffordshire_Terrier',
  'dogs/american-water-spaniel': 'American_Water_Spaniel',
  'dogs/anatolian-shepherd': 'Anatolian_Shepherd',
  'dogs/aussiedoodle': 'Aussiedoodle',
  'dogs/australian-cattle-dog': 'Australian_Cattle_Dog',
  'dogs/australian-kelpie': 'Australian_Kelpie',
  'dogs/australian-shepherd': 'Australian_Shepherd',
  'dogs/australian-terrier': 'Australian_Terrier',
  'dogs/azawakh': 'Azawakh',
  'dogs/barbet': 'Barbet_(dog)',
  'dogs/basenji': 'Basenji',
  'dogs/basenjis': 'Basenji',
  'dogs/basset-hound': 'Basset_Hound',
  'dogs/beagle': 'Beagle',
  'dogs/bearded-collie': 'Bearded_Collie',
  'dogs/beauceron': 'Beauceron',
  'dogs/belgian-malinois': 'Belgian_Malinois',
  'dogs/belgian-sheepdog': 'Belgian_Sheepdog',
  'dogs/belgian-tervuren': 'Belgian_Tervuren',
  'dogs/bergamasco': 'Bergamasco_Shepherd',
  'dogs/berger-picard': 'Berger_Picard',
  'dogs/bernedoodle': 'Bernedoodle',
  'dogs/bernese-mountain-dog': 'Bernese_Mountain_Dog',
  'dogs/bichon-frise': 'Bichon_Frise',
  'dogs/black-and-tan-coonhound': 'Black_and_Tan_Coonhound',
  'dogs/black-russian-terrier': 'Black_Russian_Terrier',
  'dogs/bloodhound': 'Bloodhound',
  'dogs/bluetick-coonhound': 'Bluetick_Coonhound',
  'dogs/boerboel': 'Boerboel',
  'dogs/bohemian-shepherd': 'Bohemian_Shepherd',
  'dogs/border-collie': 'Border_Collie',
  'dogs/border-terrier': 'Border_Terrier',
  'dogs/bordoodle': 'Bordoodle',
  'dogs/borzoi': 'Borzoi',
  'dogs/boston-terrier': 'Boston_Terrier',
  'dogs/bouvier-des-flandres': 'Bouvier_des_Flandres',
  'dogs/boxer': 'Boxer_(dog)',
  'dogs/boykin-spaniel': 'Boykin_Spaniel',
  'dogs/bracco-italiano': 'Bracco_Italiano',
  'dogs/briard': 'Briard',
  'dogs/brittany': 'Brittany_(dog)',
  'dogs/brussels-griffon': 'Brussels_Griffon',
  'dogs/bulldog': 'Bulldog',
  'dogs/bullmastiff': 'Bullmastiff',
  'dogs/bull-terrier': 'Bull_Terrier',
  'dogs/cairn-terrier': 'Cairn_Terrier',
  'dogs/canaan-dog': 'Canaan_Dog',
  'dogs/cane-corso': 'Cane_Corso',
  'dogs/cardigan-welsh-corgi': 'Cardigan_Welsh_Corgi',
  'dogs/carolina-dog': 'Carolina_Dog',
  'dogs/carpathian-shepherd': 'Carpathian_Shepherd_Dog',
  'dogs/caucasian-shepherd': 'Caucasian_Shepherd_Dog',
  'dogs/cavachon': 'Cavachon',
  'dogs/cavalier-king-charles': 'Cavalier_King_Charles_Spaniel',
  'dogs/cavalier-king-charles-spaniel': 'Cavalier_King_Charles_Spaniel',
  'dogs/cavapoo': 'Cavapoo',
  'dogs/central-asian-shepherd': 'Central_Asian_Shepherd_Dog',
  'dogs/cesky-terrier': 'Cesky_Terrier',
  'dogs/chesapeake-bay-retriever': 'Chesapeake_Bay_Retriever',
  'dogs/chihuahua': 'Chihuahua_(dog)',
  'dogs/chinese-crested': 'Chinese_Crested_Dog',
  'dogs/chinese-shar-pei': 'Shar_Pei',
  'dogs/chi-poo': 'Chi-Poo',
  'dogs/chorkie': 'Chorkie',
  'dogs/chow-chow': 'Chow_Chow',
  'dogs/cirneco-dell-etna': "Cirneco_dell'Etna",
  'dogs/clumber-spaniel': 'Clumber_Spaniel',
  'dogs/cockapoo': 'Cockapoo',
  'dogs/cocker-spaniel': 'Cocker_Spaniel',
  'dogs/collie': 'Collie',
  'dogs/coton-de-tulear': 'Coton_de_Tulear',
  'dogs/croatian-sheepdog': 'Croatian_Sheepdog',
  'dogs/dachshund': 'Dachshund',
  'dogs/dalmatian': 'Dalmatian_(dog)',
  'dogs/dandie-dinmont-terrier': 'Dandie_Dinmont_Terrier',
  'dogs/doberman-pinscher': 'Dobermann',
  'dogs/dogo-argentino': 'Dogo_Argentino',
  'dogs/dogue-de-bordeaux': 'Dogue_de_Bordeaux',
  'dogs/dutch-shepherd': 'Dutch_Shepherd',
  'dogs/east-european-shepherd': 'East_European_Shepherd',
  'dogs/english-bulldog': 'Bulldog',
  'dogs/english-cocker-spaniel': 'English_Cocker_Spaniel',
  'dogs/english-foxhound': 'English_Foxhound',
  'dogs/english-setter': 'English_Setter',
  'dogs/english-springer-spaniel': 'English_Springer_Spaniel',
  'dogs/english-toy-spaniel': 'King_Charles_Spaniel',
  'dogs/entlebucher-mountain-dog': 'Entlebucher_Mountain_Dog',
  'dogs/estrela-mountain-dog': 'Estrela_Mountain_Dog',
  'dogs/field-spaniel': 'Field_Spaniel',
  'dogs/finnish-lapphund': 'Finnish_Lapphund',
  'dogs/finnish-spitz': 'Finnish_Spitz',
  'dogs/flat-coated-retriever': 'Flat-Coated_Retriever',
  'dogs/foxhound': 'Foxhound',
  'dogs/fox-terrier-smooth': 'Smooth_Fox_Terrier',
  'dogs/french-bulldog': 'French_Bulldog',
  'dogs/german-pinscher': 'German_Pinscher',
  'dogs/german-shepherd': 'German_Shepherd',
  'dogs/german-shorthaired-pointer': 'German_Shorthaired_Pointer',
  'dogs/german-wirehaired-pointer': 'German_Wirehaired_Pointer',
  'dogs/giant-schnauzer': 'Giant_Schnauzer',
  'dogs/goldendoodle': 'Goldendoodle',
  'dogs/golden-retriever': 'Golden_Retriever',
  'dogs/gordon-setter': 'Gordon_Setter',
  'dogs/great-dane': 'Great_Dane',
  'dogs/greater-swiss-mountain-dog': 'Greater_Swiss_Mountain_Dog',
  'dogs/great-pyrenees': 'Great_Pyrenees',
  'dogs/greyhound': 'Greyhound',
  'dogs/harrier': 'Harrier_(dog)',
  'dogs/havanese': 'Havanese_dog',
  'dogs/hokkaido': 'Hokkaido_(dog)',
  'dogs/ibizan-hound': 'Ibizan_Hound',
  'dogs/irish-doodle': 'Irish_Doodle',
  'dogs/irish-red-and-white-setter': 'Irish_Red_and_White_Setter',
  'dogs/irish-setter': 'Irish_Setter',
  'dogs/irish-terrier': 'Irish_Terrier',
  'dogs/irish-water-spaniel': 'Irish_Water_Spaniel',
  'dogs/irish-wolfhound': 'Irish_Wolfhound',
  'dogs/italian-greyhound': 'Italian_Greyhound',
  'dogs/jack-russell-terrier': 'Jack_Russell_Terrier',
  'dogs/japanese-chin': 'Japanese_Chin',
  'dogs/japanese-spitz': 'Japanese_Spitz',
  'dogs/jindo': 'Korean_Jindo',
  'dogs/kai-ken': 'Kai_Ken',
  'dogs/kangal': 'Kangal_Shepherd_Dog',
  'dogs/keeshond': 'Keeshond',
  'dogs/kerry-blue-terrier': 'Kerry_Blue_Terrier',
  'dogs/king-shepherd': 'King_Shepherd',
  'dogs/kishu-ken': 'Kishu',
  'dogs/komondor': 'Komondor',
  'dogs/kooikerhondje': 'Kooikerhondje',
  'dogs/kuvasz': 'Kuvasz',
  'dogs/labradoodle': 'Labradoodle',
  'dogs/labrador-retriever': 'Labrador_Retriever',
  'dogs/lagotto-romagnolo': 'Lagotto_Romagnolo',
  'dogs/lakeland-terrier': 'Lakeland_Terrier',
  'dogs/leonberger': 'Leonberger',
  'dogs/lhasa-apso': 'Lhasa_Apso',
  'dogs/maltese': 'Maltese_dog',
  'dogs/maltipoo': 'Maltipoo',
  'dogs/manchester-terrier': 'Manchester_Terrier',
  'dogs/maremma-sheepdog': 'Maremma_Sheepdog',
  'dogs/mastiff': 'English_Mastiff',
  'dogs/miniature-pinscher': 'Miniature_Pinscher',
  'dogs/miniature-poodle': 'Poodle',
  'dogs/miniature-schnauzer': 'Miniature_Schnauzer',
  'dogs/morkie': 'Morkie',
  'dogs/mudi': 'Mudi',
  'dogs/neapolitan-mastiff': 'Neapolitan_Mastiff',
  'dogs/newfoundland': 'Newfoundland_dog',
  'dogs/norfolk-terrier': 'Norfolk_Terrier',
  'dogs/norwegian-elkhound': 'Norwegian_Elkhound',
  'dogs/norwegian-lundehund': 'Norwegian_Lundehund',
  'dogs/norwich-terrier': 'Norwich_Terrier',
  'dogs/nova-scotia-duck-tolling-retriever': 'Nova_Scotia_Duck_Tolling_Retriever',
  'dogs/olde-english-bulldogge': 'Olde_English_Bulldogge',
  'dogs/old-english-sheepdog': 'Old_English_Sheepdog',
  'dogs/otterhound': 'Otterhound',
  'dogs/papillon': 'Papillon_(dog)',
  'dogs/parson-russell-terrier': 'Parson_Russell_Terrier',
  'dogs/pekingese': 'Pekingese',
  'dogs/pembroke-welsh-corgi': 'Pembroke_Welsh_Corgi',
  'dogs/peruvian-inca-orchid': 'Peruvian_Inca_Orchid',
  'dogs/pharaoh-hound': 'Pharaoh_Hound',
  'dogs/pit-bull': 'American_Pit_Bull_Terrier',
  'dogs/plott-hound': 'Plott_Hound',
  'dogs/pointer': 'Pointer_(dog_breed)',
  'dogs/polish-lowland-sheepdog': 'Polish_Lowland_Sheepdog',
  'dogs/polish-tatra-sheepdog': 'Tatra_Shepherd_Dog',
  'dogs/pomeranian': 'Pomeranian_(dog)',
  'dogs/pomsky': 'Pomsky',
  'dogs/poodle': 'Poodle',
  'dogs/portuguese-water-dog': 'Portuguese_Water_Dog',
  'dogs/presa-canario': 'Perro_de_Presa_Canario',
  'dogs/pug': 'Pug',
  'dogs/puggle': 'Puggle',
  'dogs/puli': 'Puli_(dog)',
  'dogs/pumi': 'Pumi_(dog)',
  'dogs/pyrenean-mastiff': 'Pyrenean_Mastiff',
  'dogs/rat-terrier': 'Rat_Terrier',
  'dogs/redbone-coonhound': 'Redbone_Coonhound',
  'dogs/rhodesian-ridgeback': 'Rhodesian_Ridgeback',
  'dogs/rottweiler': 'Rottweiler',
  'dogs/saint-berdoodle': 'St._Bernard_(dog)',
  'dogs/saint-bernard': 'St._Bernard_(dog)',
  'dogs/saluki': 'Saluki',
  'dogs/samoyed': 'Samoyed_(dog)',
  'dogs/sarplaninac': 'Sarplaninac',
  'dogs/schipperke': 'Schipperke',
  'dogs/schnoodle': 'Schnoodle',
  'dogs/scottish-deerhound': 'Scottish_Deerhound',
  'dogs/scottish-terrier': 'Scottish_Terrier',
  'dogs/sealyham-terrier': 'Sealyham_Terrier',
  'dogs/sheepadoodle': 'Sheepadoodle',
  'dogs/shetland-sheepdog': 'Shetland_Sheepdog',
  'dogs/shiba-inu': 'Shiba_Inu',
  'dogs/shih-poo': 'Shih-poo',
  'dogs/shih-tzu': 'Shih_Tzu',
  'dogs/shikoku': 'Shikoku_(dog)',
  'dogs/shiloh-shepherd': 'Shiloh_Shepherd',
  'dogs/shorkie': 'Shorkie',
  'dogs/siberian-husky': 'Siberian_Husky',
  'dogs/silky-terrier': 'Australian_Silky_Terrier',
  'dogs/skye-terrier': 'Skye_Terrier',
  'dogs/sloughi': 'Sloughi',
  'dogs/soft-coated-wheaten-terrier': 'Soft-coated_Wheaten_Terrier',
  'dogs/spanish-mastiff': 'Spanish_Mastiff',
  'dogs/spanish-water-dog': 'Spanish_Water_Dog',
  'dogs/spinone-italiano': 'Spinone_Italiano',
  'dogs/springer-spaniel': 'English_Springer_Spaniel',
  'dogs/stabyhoun': 'Stabyhoun',
  'dogs/staffordshire-bull-terrier': 'Staffordshire_Bull_Terrier',
  'dogs/standard-poodle': 'Poodle',
  'dogs/standard-schnauzer': 'Standard_Schnauzer',
  'dogs/st-bernard': 'St._Bernard_(dog)',
  'dogs/sussex-spaniel': 'Sussex_Spaniel',
  'dogs/swedish-vallhund': 'Swedish_Vallhund',
  'dogs/taiwan-dog': 'Taiwan_Dog',
  'dogs/thai-ridgeback': 'Thai_Ridgeback',
  'dogs/tibetan-mastiff': 'Tibetan_Mastiff',
  'dogs/tibetan-spaniel': 'Tibetan_Spaniel',
  'dogs/tibetan-terrier': 'Tibetan_Terrier',
  'dogs/tornjak': 'Tornjak',
  'dogs/toy-fox-terrier': 'Toy_Fox_Terrier',
  'dogs/toy-manchester-terrier': 'Manchester_Terrier',
  'dogs/toy-poodle': 'Poodle',
  'dogs/treeing-walker-coonhound': 'Treeing_Walker_Coonhound',
  'dogs/vizsla': 'Vizsla',
  'dogs/weimaraner': 'Weimaraner',
  'dogs/welsh-corgi': 'Welsh_Corgi',
  'dogs/welsh-springer-spaniel': 'Welsh_Springer_Spaniel',
  'dogs/welsh-terrier': 'Welsh_Terrier',
  'dogs/west-highland-terrier': 'West_Highland_White_Terrier',
  'dogs/west-highland-white-terrier': 'West_Highland_White_Terrier',
  'dogs/whippet': 'Whippet',
  'dogs/white-shepherd': 'White_Shepherd',
  'dogs/wire-fox-terrier': 'Wire_Fox_Terrier',
  'dogs/wirehaired-pointing-griffon': 'Wirehaired_Pointing_Griffon',
  'dogs/wirehaired-vizsla': 'Wirehaired_Vizsla',
  'dogs/xoloitzcuintli': 'Xoloitzcuintli',
  'dogs/yorkipoo': 'Yorkipoo',
  'dogs/yorkshire-terrier': 'Yorkshire_Terrier',

  // ---- CATS ----
  'cats/abyssinian': 'Abyssinian_(cat)',
  'cats/american-bobtail': 'American_Bobtail',
  'cats/american-curl': 'American_Curl',
  'cats/american-shorthair': 'American_Shorthair',
  'cats/american-wirehair': 'American_Wirehair',
  'cats/arabian-mau': 'Arabian_Mau',
  'cats/asian': 'Asian_(cat_breed)',
  'cats/balinese': 'Balinese_(cat)',
  'cats/bengal': 'Bengal_cat',
  'cats/birman': 'Birman',
  'cats/bombay': 'Bombay_(cat)',
  'cats/british-longhair': 'British_Longhair',
  'cats/british-shorthair': 'British_Shorthair',
  'cats/burmese': 'Burmese_cat',
  'cats/burmilla': 'Burmilla',
  'cats/chartreux': 'Chartreux',
  'cats/chausie': 'Chausie',
  'cats/cheetoh': 'Cheetoh',
  'cats/chinchilla': 'Chinchilla_(cat)',
  'cats/colorpoint-shorthair': 'Colorpoint_Shorthair',
  'cats/cornish-rex': 'Cornish_Rex',
  'cats/cymric': 'Cymric_(cat)',
  'cats/devon-rex': 'Devon_Rex',
  'cats/domestic-longhair': 'Domestic_long-haired_cat',
  'cats/domestic-shorthair': 'Domestic_short-haired_cat',
  'cats/donskoy': 'Donskoy_cat',
  'cats/egyptian-mau': 'Egyptian_Mau',
  'cats/european-burmese': 'Burmese_cat',
  'cats/european-shorthair': 'European_Shorthair',
  'cats/exotic-shorthair': 'Exotic_Shorthair',
  'cats/havana-brown': 'Havana_Brown',
  'cats/highlander': 'Highlander_(cat)',
  'cats/himalayan': 'Himalayan_(cat)',
  'cats/japanese-bobtail': 'Japanese_Bobtail',
  'cats/javanese': 'Javanese_(cat)',
  'cats/khao-manee': 'Khao_Manee',
  'cats/korat': 'Korat',
  'cats/kurilian-bobtail': 'Kurilian_Bobtail',
  'cats/laperm': 'LaPerm',
  'cats/lykoi': 'Lykoi',
  'cats/maine-coon': 'Maine_Coon',
  'cats/manx': 'Manx_cat',
  'cats/minuet': 'Minuet_cat',
  'cats/munchkin': 'Munchkin_cat',
  'cats/nebelung': 'Nebelung',
  'cats/norwegian-forest-cat': 'Norwegian_Forest_cat',
  'cats/ocicat': 'Ocicat',
  'cats/oriental-longhair': 'Oriental_Longhair',
  'cats/oriental-shorthair': 'Oriental_Shorthair',
  'cats/persian': 'Persian_cat',
  'cats/peterbald': 'Peterbald',
  'cats/pixie-bob': 'Pixie-bob',
  'cats/ragamuffin': 'RagaMuffin',
  'cats/ragdoll': 'Ragdoll',
  'cats/russian-blue': 'Russian_Blue',
  'cats/russian-white': 'Russian_White,_Black_and_Tabby',
  'cats/savannah': 'Savannah_cat',
  'cats/scottish-fold': 'Scottish_Fold',
  'cats/selkirk-rex': 'Selkirk_Rex',
  'cats/serengeti': 'Serengeti_cat',
  'cats/siamese': 'Siamese_cat',
  'cats/siberian': 'Siberian_cat',
  'cats/singapura': 'Singapura_cat',
  'cats/snowshoe': 'Snowshoe_cat',
  'cats/sokoke': 'Sokoke',
  'cats/somali': 'Somali_(cat)',
  'cats/sphynx': 'Sphynx_cat',
  'cats/thai': 'Thai_(cat)',
  'cats/tiffanie': 'Tiffanie',
  'cats/tonkinese': 'Tonkinese_cat',
  'cats/toyger': 'Toyger',
  'cats/turkish-angora': 'Turkish_Angora',
  'cats/turkish-van': 'Turkish_Van',

  // ---- FISH (Freshwater) ----
  'fish/african-cichlid': 'Cichlid',
  'fish/amano-shrimp': 'Caridina_multidentata',
  'fish/angelfish': 'Pterophyllum',
  'fish/apistogramma': 'Apistogramma',
  'fish/arowana': 'Arowana',
  'fish/assassin-snail': 'Anentome_helena',
  'fish/bamboo-shrimp': 'Atyopsis_moluccensis',
  'fish/betta-fish': 'Siamese_fighting_fish',
  'fish/blenny': 'Blenny',
  'fish/blue-damsel': 'Chrysiptera_cyanea',
  'fish/blue-green-chromis': 'Chromis_viridis',
  'fish/blue-tang': 'Paracanthurus_hepatus',
  'fish/blue-velvet-shrimp': 'Neocaridina_davidi',
  'fish/bolivian-ram': 'Mikrogeophagus_altispinosus',
  'fish/bristlenose-pleco': 'Ancistrus',
  'fish/cardinal-tetra': 'Cardinal_tetra',
  'fish/celestial-pearl-danio': 'Celestichthys_margaritatus',
  'fish/cherry-barb': 'Cherry_barb',
  'fish/cherry-shrimp': 'Neocaridina_davidi',
  'fish/chili-rasbora': 'Boraras_brigittae',
  'fish/chromis': 'Chromis',
  'fish/cleaner-shrimp': 'Lysmata_amboinensis',
  'fish/cleaner-wrasse': 'Bluestreak_cleaner_wrasse',
  'fish/clownfish': 'Clownfish',
  'fish/clown-loach': 'Clown_loach',
  'fish/clown-pleco': 'Panaqolus_maccus',
  'fish/common-pleco': 'Hypostomus_plecostomus',
  'fish/congo-tetra': 'Congo_tetra',
  'fish/convict-cichlid': 'Convict_cichlid',
  'fish/coral-beauty': 'Centropyge_bispinosa',
  'fish/corydoras': 'Corydoras',
  'fish/crystal-red-shrimp': 'Caridina_cantonensis',
  'fish/danio': 'Danio',
  'fish/discus': 'Symphysodon',
  'fish/dottyback': 'Pseudochromidae',
  'fish/dwarf-crayfish': 'Cambarellus',
  'fish/dwarf-gourami': 'Dwarf_gourami',
  'fish/electric-blue-acara': 'Andinoacara_pulcher',
  'fish/electric-blue-crayfish': 'Procambarus_alleni',
  'fish/electric-yellow-cichlid': 'Labidochromis_caeruleus',
  'fish/ember-tetra': 'Hyphessobrycon_amandae',
  'fish/emperor-angelfish': 'Emperor_angelfish',
  'fish/endler-livebearer': 'Poecilia_wingei',
  'fish/fairy-wrasse': 'Cirrhilabrus',
  'fish/fancy-goldfish': 'Goldfish',
  'fish/fiddler-crab': 'Fiddler_crab',
  'fish/firefish': 'Nemateleotris_magnifica',
  'fish/flame-angelfish': 'Centropyge_loricula',
  'fish/flowerhorn': 'Flowerhorn_cichlid',
  'fish/french-angelfish': 'French_angelfish',
  'fish/frontosa': 'Cyphotilapia_frontosa',
  'fish/german-blue-ram': 'Mikrogeophagus_ramirezi',
  'fish/ghost-shrimp': 'Ghost_shrimp',
  'fish/glass-catfish': 'Kryptopterus_vitreolus',
  'fish/goby': 'Goby',
  'fish/gold-barb': 'Barbodes_semifasciolatus',
  'fish/goldfish': 'Goldfish',
  'fish/gouramis': 'Gourami',
  'fish/green-terror': 'Andinoacara_rivulatus',
  'fish/guppy': 'Guppy',
  'fish/hatchetfish': 'Gasteropelecidae',
  'fish/hawkfish': 'Hawkfish',
  'fish/hermit-crab': 'Hermit_crab',
  'fish/hillstream-loach': 'Gastromyzontidae',
  'fish/honey-gourami': 'Honey_gourami',
  'fish/jack-dempsey': 'Jack_Dempsey_(fish)',
  'fish/killifish': 'Killifish',
  'fish/koi': 'Koi',
  'fish/kole-tang': 'Ctenochaetus_strigosus',
  'fish/kuhli-loach': 'Kuhli_loach',
  'fish/mandarin-goby': 'Synchiropus_splendidus',
  'fish/maroon-clownfish': 'Maroon_clownfish',
  'fish/melanurus-wrasse': 'Halichoeres_melanurus',
  'fish/molly': 'Poecilia_sphenops',
  'fish/mystery-snail': 'Pomacea_bridgesii',
  'fish/neon-tetra': 'Neon_tetra',
  'fish/nerite-snail': 'Neritidae',
  'fish/oscar': 'Oscar_(fish)',
  'fish/otocinclus': 'Otocinclus',
  'fish/pacu': 'Pacu',
  'fish/peacock-bass': 'Cichla',
  'fish/pearl-gourami': 'Pearl_gourami',
  'fish/pencilfish': 'Nannostomus',
  'fish/peppermint-shrimp': 'Lysmata_wurdemanni',
  'fish/pictus-catfish': 'Pimelodus_pictus',
  'fish/platy': 'Southern_platyfish',
  'fish/pleco': 'Hypostomus_plecostomus',
  'fish/powder-blue-tang': 'Powder_blue_tang',
  'fish/rabbit-snail': 'Tylomelania',
  'fish/rainbow-fish': 'Rainbowfish',
  'fish/ram-cichlid': 'Mikrogeophagus_ramirezi',
  'fish/ramshorn-snail': 'Planorbidae',
  'fish/rasbora': 'Rasbora',
  'fish/red-claw-crab': 'Perisesarma_bidens',
  'fish/rosy-barb': 'Rosy_barb',
  'fish/rummy-nose-tetra': 'Rummy-nose_tetra',
  'fish/severum': 'Heros_severus',
  'fish/siamese-algae-eater': 'Crossocheilus_oblongus',
  'fish/silver-dollar': 'Silver_dollar_(fish)',
  'fish/six-line-wrasse': 'Pseudocheilinus_hexataenia',
  'fish/swordtail': 'Green_swordtail',
  'fish/tiger-barb': 'Tiger_barb',
  'fish/turbo-snail': 'Turbo_(gastropod)',
  'fish/upside-down-catfish': 'Synodontis_nigriventris',
  'fish/vampire-crab': 'Geosesarma',
  'fish/watchman-goby': 'Cryptocentrus_cinctus',
  'fish/white-cloud': 'White_Cloud_Mountain_minnow',
  'fish/white-cloud-mountain-minnow': 'White_Cloud_Mountain_minnow',
  'fish/wrasse': 'Wrasse',
  'fish/yellow-tang': 'Yellow_tang',
  'fish/zebra-danio': 'Zebrafish',

  // ---- MARINE FISH ----
  'marine-fish/bangai-cardinal': 'Banggai_cardinalfish',
  'marine-fish/blue-damsel': 'Chrysiptera_cyanea',
  'marine-fish/blue-tang': 'Paracanthurus_hepatus',
  'marine-fish/cleaner-wrasse': 'Bluestreak_cleaner_wrasse',
  'marine-fish/clownfish': 'Clownfish',
  'marine-fish/copperband-butterfly': 'Copperband_butterflyfish',
  'marine-fish/coral-beauty': 'Centropyge_bispinosa',
  'marine-fish/dottyback': 'Pseudochromidae',
  'marine-fish/emperor-angelfish': 'Emperor_angelfish',
  'marine-fish/fairy-wrasse': 'Cirrhilabrus',
  'marine-fish/firefish': 'Nemateleotris_magnifica',
  'marine-fish/flame-angelfish': 'Centropyge_loricula',
  'marine-fish/flame-hawkfish': 'Neocirrhites_armatus',
  'marine-fish/foxface-rabbitfish': 'Foxface_rabbitfish',
  'marine-fish/green-chromis': 'Chromis_viridis',
  'marine-fish/hawkfish': 'Hawkfish',
  'marine-fish/kole-tang': 'Ctenochaetus_strigosus',
  'marine-fish/mandarin-goby': 'Synchiropus_splendidus',
  'marine-fish/maroon-clownfish': 'Maroon_clownfish',
  'marine-fish/melanurus-wrasse': 'Halichoeres_melanurus',
  'marine-fish/powder-blue-tang': 'Powder_blue_tang',
  'marine-fish/royal-gramma': 'Royal_gramma',
  'marine-fish/six-line-wrasse': 'Pseudocheilinus_hexataenia',
  'marine-fish/watchman-goby': 'Cryptocentrus_cinctus',
  'marine-fish/yellow-tang': 'Yellow_tang',

  // ---- REPTILES ----
  'reptiles/ackie-monitor': 'Varanus_acanthurus',
  'reptiles/african-clawed-frog': 'African_clawed_frog',
  'reptiles/african-dwarf-frog': 'African_dwarf_frog',
  'reptiles/african-fat-tailed-gecko': 'African_fat-tailed_gecko',
  'reptiles/amazon-tree-boa': 'Corallus_hortulana',
  'reptiles/american-bullfrog': 'American_bullfrog',
  'reptiles/anole': 'Anolis',
  'reptiles/armadillo-lizard': 'Armadillo_girdled_lizard',
  'reptiles/axolotl': 'Axolotl',
  'reptiles/ball-python': 'Ball_python',
  'reptiles/bearded-dragon': 'Pogona',
  'reptiles/black-throat-monitor': 'Black-throated_monitor',
  'reptiles/blood-python': 'Python_brongersmai',
  'reptiles/blue-tongue-skink': 'Blue-tongued_skink',
  'reptiles/boa-constrictor': 'Boa_constrictor',
  'reptiles/box-turtle': 'Box_turtle',
  'reptiles/brazilian-rainbow-boa': 'Rainbow_boa',
  'reptiles/bull-snake': 'Bullsnake',
  'reptiles/burmese-python': 'Burmese_python',
  'reptiles/california-kingsnake': 'California_kingsnake',
  'reptiles/carpet-python': 'Carpet_python',
  'reptiles/chameleon': 'Chameleon',
  'reptiles/childrens-python': "Children's_python",
  'reptiles/chinese-water-dragon': 'Chinese_water_dragon',
  'reptiles/corn-snake': 'Corn_snake',
  'reptiles/crested-gecko': 'Crested_gecko',
  'reptiles/dart-frog': 'Poison_dart_frog',
  'reptiles/eastern-newt': 'Eastern_newt',
  'reptiles/electric-blue-gecko': 'Lygodactylus_williamsi',
  'reptiles/emerald-tree-boa': 'Emerald_tree_boa',
  'reptiles/fire-bellied-newt': 'Fire-bellied_newt',
  'reptiles/fire-bellied-toad': 'Bombina',
  'reptiles/fire-salamander': 'Fire_salamander',
  'reptiles/fire-skink': 'Fire_skink',
  'reptiles/frilled-dragon': 'Frill-necked_lizard',
  'reptiles/gargoyle-gecko': 'Rhacodactylus_auriculatus',
  'reptiles/garter-snake': 'Garter_snake',
  'reptiles/giant-day-gecko': 'Phelsuma_grandis',
  'reptiles/gold-dust-day-gecko': 'Phelsuma_laticauda',
  'reptiles/greek-tortoise': 'Greek_tortoise',
  'reptiles/green-iguana': 'Green_iguana',
  'reptiles/green-tree-python': 'Green_tree_python',
  'reptiles/hermann-tortoise': "Hermann's_tortoise",
  'reptiles/hognose-snake': 'Heterodon',
  'reptiles/house-gecko': 'Common_house_gecko',
  'reptiles/jacksons-chameleon': "Jackson's_chameleon",
  'reptiles/kenyan-sand-boa': 'Kenya_sand_boa',
  'reptiles/king-snake': 'Kingsnake',
  'reptiles/knob-tailed-gecko': 'Nephrurus',
  'reptiles/leachianus-gecko': 'Rhacodactylus_leachianus',
  'reptiles/leopard-gecko': 'Leopard_gecko',
  'reptiles/leopard-tortoise': 'Leopard_tortoise',
  'reptiles/long-tailed-lizard': 'Takydromus_sexlineatus',
  'reptiles/map-turtle': 'Map_turtle',
  'reptiles/mexican-black-kingsnake': 'Lampropeltis_getula_nigrita',
  'reptiles/milk-snake': 'Milk_snake',
  'reptiles/monitor-lizard': 'Monitor_lizard',
  'reptiles/mourning-gecko': 'Lepidodactylus_lugubris',
  'reptiles/mud-turtle': 'Kinosternidae',
  'reptiles/musk-turtle': 'Common_musk_turtle',
  'reptiles/ornate-box-turtle': 'Ornate_box_turtle',
  'reptiles/pacman-frog': 'Ceratophrys',
  'reptiles/painted-turtle': 'Painted_turtle',
  'reptiles/panther-chameleon': 'Panther_chameleon',
  'reptiles/pine-snake': 'Pinesnake',
  'reptiles/plated-lizard': 'Plated_lizard',
  'reptiles/poison-dart-frog': 'Poison_dart_frog',
  'reptiles/rainbow-boa': 'Rainbow_boa',
  'reptiles/rankins-dragon': 'Pogona_henrylawsoni',
  'reptiles/rat-snake': 'Rat_snake',
  'reptiles/red-eared-slider': 'Red-eared_slider',
  'reptiles/red-eyed-tree-frog': 'Red-eyed_tree_frog',
  'reptiles/red-footed-tortoise': 'Red-footed_tortoise',
  'reptiles/reticulated-python': 'Reticulated_python',
  'reptiles/ring-neck-snake': 'Ring-necked_snake',
  'reptiles/rosy-boa': 'Lichanura',
  'reptiles/rough-green-snake': 'Rough_green_snake',
  'reptiles/russian-tortoise': 'Russian_tortoise',
  'reptiles/sailfin-dragon': 'Hydrosaurus',
  'reptiles/satanic-leaf-tailed-gecko': 'Uroplatus_phantasticus',
  'reptiles/savannah-monitor': 'Savannah_monitor',
  'reptiles/schneiders-skink': "Schneider's_skink",
  'reptiles/softshell-turtle': 'Trionychidae',
  'reptiles/spotted-python': 'Antaresia_maculosa',
  'reptiles/sulcata-tortoise': 'African_spurred_tortoise',
  'reptiles/tegu': 'Argentine_black_and_white_tegu',
  'reptiles/tiger-salamander': 'Tiger_salamander',
  'reptiles/tokay-gecko': 'Tokay_gecko',
  'reptiles/tomato-frog': 'Tomato_frog',
  'reptiles/tree-frog': 'Tree_frog',
  'reptiles/uromastyx': 'Uromastyx',
  'reptiles/veiled-chameleon': 'Veiled_chameleon',
  'reptiles/vine-snake': 'Vine_snake',
  'reptiles/western-hognose': 'Heterodon_nasicus',
  'reptiles/whites-tree-frog': 'Australian_green_tree_frog',
  'reptiles/woma-python': 'Aspidites_ramsayi',
  'reptiles/wood-turtle': 'Wood_turtle',

  // ---- BIRDS ----
  'birds/african-grey': 'Grey_parrot',
  'birds/alexandrine-parakeet': 'Alexandrine_parakeet',
  'birds/amazon-parrot': 'Amazon_parrot',
  'birds/american-singer-canary': 'Domestic_canary',
  'birds/blue-and-gold-macaw': 'Blue-and-yellow_macaw',
  'birds/bourke-parakeet': "Bourke's_parrot",
  'birds/bourkes-parakeet': "Bourke's_parrot",
  'birds/budgerigar': 'Budgerigar',
  'birds/button-quail': 'Buttonquail',
  'birds/caique': 'Caique',
  'birds/canary': 'Domestic_canary',
  'birds/cape-parrot': 'Cape_parrot',
  'birds/chicken': 'Chicken',
  'birds/cockatiel': 'Cockatiel',
  'birds/cockatoo': 'Cockatoo',
  'birds/conure': 'Conure',
  'birds/cordon-bleu': 'Uraeginthus',
  'birds/coturnix-quail': 'Japanese_quail',
  'birds/diamond-dove': 'Diamond_dove',
  'birds/dove': 'Rock_dove',
  'birds/dusky-conure': 'Dusky-headed_parakeet',
  'birds/eclectus': 'Eclectus_parrot',
  'birds/finch': 'Finch',
  'birds/galah': 'Galah',
  'birds/gloster-canary': 'Domestic_canary',
  'birds/goffin-cockatoo': 'Tanimbar_corella',
  'birds/golden-conure': 'Golden_parakeet',
  'birds/gouldian-finch': 'Gouldian_finch',
  'birds/green-cheek-conure': 'Green-cheeked_parakeet',
  'birds/green-wing-macaw': 'Red-and-green_macaw',
  'birds/half-moon-conure': 'Orange-fronted_parakeet',
  'birds/hawk-headed-parrot': 'Red-fan_parrot',
  'birds/hyacinth-macaw': 'Hyacinth_macaw',
  'birds/indian-ringneck': 'Rose-ringed_parakeet',
  'birds/java-finch': 'Java_sparrow',
  'birds/jenday-conure': 'Jandaya_parakeet',
  'birds/kakariki': 'Kakariki',
  'birds/lineolated-parakeet': 'Barred_parakeet',
  'birds/lorikeet': 'Lorikeet',
  'birds/lovebird': 'Lovebird',
  'birds/macaw': 'Macaw',
  'birds/masked-lovebird': 'Yellow-collared_lovebird',
  'birds/meyer-parrot': "Meyer's_parrot",
  'birds/military-macaw': 'Military_macaw',
  'birds/moluccan-cockatoo': 'Salmon-crested_cockatoo',
  'birds/mynah': 'Common_hill_myna',
  'birds/nanday-conure': 'Nanday_parakeet',
  'birds/owl-finch': 'Double-barred_finch',
  'birds/pacific-parrotlet': 'Pacific_parrotlet',
  'birds/parrotlet': 'Parrotlet',
  'birds/peach-faced-lovebird': 'Rosy-faced_lovebird',
  'birds/pigeon': 'Rock_dove',
  'birds/pionus': 'Pionus',
  'birds/plum-headed-parakeet': 'Plum-headed_parakeet',
  'birds/princess-parrot': 'Princess_parrot',
  'birds/quaker-parrot': 'Monk_parakeet',
  'birds/red-bellied-parrot': 'Red-bellied_parrot',
  'birds/red-factor-canary': 'Domestic_canary',
  'birds/red-rumped-parrot': 'Red-rumped_parrot',
  'birds/roller-canary': 'Domestic_canary',
  'birds/rosellas': 'Rosella',
  'birds/scarlet-macaw': 'Scarlet_macaw',
  'birds/senegal-parrot': 'Senegal_parrot',
  'birds/society-finch': 'Society_finch',
  'birds/spice-finch': 'Scaly-breasted_munia',
  'birds/star-finch': 'Star_finch',
  'birds/sun-conure': 'Sun_parakeet',
  'birds/toucan': 'Toucan',
  'birds/umbrella-cockatoo': 'White_cockatoo',
  'birds/zebra-finch': 'Zebra_finch',

  // ---- SMALL ANIMALS ----
  'small-animals/abyssinian-guinea-pig': 'Abyssinian_guinea_pig',
  'small-animals/african-pygmy-hedgehog': 'Four-toed_hedgehog',
  'small-animals/american-guinea-pig': 'American_guinea_pig',
  'small-animals/american-rabbit': 'American_rabbit',
  'small-animals/angora-rabbit': 'Angora_rabbit',
  'small-animals/baldwin-guinea-pig': 'Skinny_pig',
  'small-animals/californian-rabbit': 'Californian_rabbit',
  'small-animals/chinchilla': 'Chinchilla',
  'small-animals/chinchilla-mutations': 'Chinchilla',
  'small-animals/chinchilla-standard-gray': 'Chinchilla',
  'small-animals/chinese-hamster': 'Chinese_hamster',
  'small-animals/continental-giant': 'Flemish_Giant_rabbit',
  'small-animals/coronet-guinea-pig': 'Guinea_pig',
  'small-animals/degu': 'Common_degu',
  'small-animals/dumbo-rat': 'Fancy_rat',
  'small-animals/dutch-rabbit': 'Dutch_rabbit',
  'small-animals/dwarf-campbell': "Campbell's_dwarf_hamster",
  'small-animals/dwarf-hamster': 'Dwarf_hamster',
  'small-animals/dwarf-hotot': 'Dwarf_Hotot',
  'small-animals/emperor-scorpion': 'Emperor_scorpion',
  'small-animals/english-angora': 'English_Angora',
  'small-animals/english-lop': 'English_Lop',
  'small-animals/fancy-mouse': 'Fancy_mouse',
  'small-animals/fancy-rat': 'Fancy_rat',
  'small-animals/fennec-fox': 'Fennec_fox',
  'small-animals/ferret': 'Ferret',
  'small-animals/ferret-albino': 'Ferret',
  'small-animals/ferret-sable': 'Ferret',
  'small-animals/flemish-giant': 'Flemish_Giant_rabbit',
  'small-animals/flying-squirrel': 'Southern_flying_squirrel',
  'small-animals/french-lop': 'French_Lop',
  'small-animals/gerbil': 'Mongolian_gerbil',
  'small-animals/giant-african-land-snail': 'Lissachatina_fulica',
  'small-animals/hairless-rat': 'Fancy_rat',
  'small-animals/harlequin-rabbit': 'Harlequin_rabbit',
  'small-animals/hedgehog': 'Four-toed_hedgehog',
  'small-animals/hermit-crab-pet': 'Hermit_crab',
  'small-animals/hissing-cockroach': 'Madagascar_hissing_cockroach',
  'small-animals/holland-lop': 'Holland_Lop',
  'small-animals/jersey-wooly': 'Jersey_Wooly',
  'small-animals/lionhead': 'Lionhead_rabbit',
  'small-animals/long-haired-hamster': 'Golden_hamster',
  'small-animals/mini-lop': 'Mini_Lop',
  'small-animals/mini-rex': 'Mini_Rex',
  'small-animals/mongolian-gerbil': 'Mongolian_gerbil',
  'small-animals/mouse': 'Fancy_mouse',
  'small-animals/netherland-dwarf': 'Netherland_Dwarf',
  'small-animals/new-zealand-white': 'New_Zealand_rabbit',
  'small-animals/peruvian-guinea-pig': 'Peruvian_guinea_pig',
  'small-animals/polish-rabbit': 'Polish_rabbit',
  'small-animals/prairie-dog': 'Prairie_dog',
  'small-animals/rat': 'Fancy_rat',
  'small-animals/rex-guinea-pig': 'Guinea_pig',
  'small-animals/rex-rabbit': 'Rex_rabbit',
  'small-animals/roborovski-hamster': 'Roborovski_dwarf_hamster',
  'small-animals/short-tailed-opossum': 'Short-tailed_opossum',
  'small-animals/silkie-guinea-pig': 'Silkie_guinea_pig',
  'small-animals/skinny-pig': 'Skinny_pig',
  'small-animals/stick-insect': 'Phasmatodea',
  'small-animals/sugar-glider': 'Sugar_glider',
  'small-animals/syrian-hamster': 'Golden_hamster',
  'small-animals/tarantula': 'Tarantula',
  'small-animals/teddy-guinea-pig': 'Guinea_pig',
  'small-animals/texel-guinea-pig': 'Texel_guinea_pig',
  'small-animals/white-crested-guinea-pig': 'Guinea_pig',
  'small-animals/winter-white': 'Winter_white_dwarf_hamster',

  // ---- AMPHIBIANS ----
  'amphibians/african-clawed-frog': 'African_clawed_frog',
  'amphibians/african-dwarf-frog': 'African_dwarf_frog',
  'amphibians/american-bullfrog': 'American_bullfrog',
  'amphibians/axolotl': 'Axolotl',
  'amphibians/budgetts-frog': "Budgett's_frog",
  'amphibians/chinese-fire-belly-newt': 'Chinese_fire_belly_newt',
  'amphibians/dart-frog': 'Poison_dart_frog',
  'amphibians/eastern-newt': 'Eastern_newt',
  'amphibians/fire-bellied-newt': 'Fire-bellied_newt',
  'amphibians/fire-bellied-toad': 'Bombina',
  'amphibians/fire-salamander': 'Fire_salamander',
  'amphibians/gray-tree-frog': 'Gray_tree_frog',
  'amphibians/green-tree-frog': 'American_green_tree_frog',
  'amphibians/pacman-frog': 'Ceratophrys',
  'amphibians/red-eyed-tree-frog': 'Red-eyed_tree_frog',
  'amphibians/spring-peeper': 'Spring_peeper',
  'amphibians/surinam-toad': 'Common_Surinam_toad',
  'amphibians/tiger-salamander': 'Tiger_salamander',
  'amphibians/tomato-frog': 'Tomato_frog',
  'amphibians/whites-tree-frog': 'Australian_green_tree_frog',
};

// ============================================================
// CATEGORY FALLBACK IMAGES (guaranteed Wikimedia URLs)
// ============================================================

const CATEGORY_FALLBACKS = {
  dogs: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/YellowLabradorLooking_new.jpg/800px-YellowLabradorLooking_new.jpg',
    alt: 'Dog breed'
  },
  cats: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/800px-Cat03.jpg',
    alt: 'Cat breed'
  },
  fish: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Neon_tetra_inn_aquarium.jpg/800px-Neon_tetra_inn_aquarium.jpg',
    alt: 'Aquarium fish'
  },
  'marine-fish': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Amphiprion_ocellaris_%28Clown_anemonefish%29_in_Heteractis_magnifica_%28Sea_anemone%29.jpg/800px-Amphiprion_ocellaris_%28Clown_anemonefish%29_in_Heteractis_magnifica_%28Sea_anemone%29.jpg',
    alt: 'Marine fish'
  },
  reptiles: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Pogona_vitticeps_close-up_2009_G1.jpg/800px-Pogona_vitticeps_close-up_2009_G1.jpg',
    alt: 'Reptile'
  },
  birds: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Budgerigars_in_Aviary.jpg/800px-Budgerigars_in_Aviary.jpg',
    alt: 'Pet bird'
  },
  'small-animals': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Cavia_porcellus-short_haired_tabby.jpg/800px-Cavia_porcellus-short_haired_tabby.jpg',
    alt: 'Small pet'
  },
  amphibians: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Axolotl_ganz.jpg/800px-Axolotl_ganz.jpg',
    alt: 'Amphibian'
  },
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function slugToTitle(slug) {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('_');
}

function getCategoryFromPath(filePath) {
  const rel = filePath.replace(BASE_DIR, '').replace(/\\/g, '/');
  const match = rel.match(/\/breeds\/([^/]+)\/[^/]+\.html$/);
  return match ? match[1] : null;
}

function getSlugFromPath(filePath) {
  return filePath.split('/').pop().replace('.html', '');
}

function extractH1(html) {
  const match = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
  if (!match) return '';
  return match[1].replace(/<[^>]+>/g, '').trim();
}

function resizeWikiThumbnail(thumbUrl, width) {
  if (!thumbUrl) return null;
  return thumbUrl.replace(/\/\d+px-/, `/${width}px-`);
}

// ============================================================
// WIKIPEDIA API FETCHING
// ============================================================

async function fetchWikiImage(title, retryCount = 0) {
  const url = WIKI_API + encodeURIComponent(title);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PetCareHelperAI/1.0 (https://petcarehelperai.com; contact@petcarehelperai.com)',
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeout);

    if (resp.status === 429 || resp.status === 503) {
      if (retryCount < 3) {
        await sleep(RETRY_DELAY * (retryCount + 1));
        return fetchWikiImage(title, retryCount + 1);
      }
      return null;
    }

    if (!resp.ok) return null;

    const data = await resp.json();

    if (data.thumbnail && data.thumbnail.source) {
      return {
        thumbnail: resizeWikiThumbnail(data.thumbnail.source, IMAGE_WIDTH),
        original: data.originalimage ? data.originalimage.source : null,
        title: data.title,
        description: data.description || ''
      };
    }
    return null;
  } catch (err) {
    if (retryCount < 2) {
      await sleep(RETRY_DELAY * (retryCount + 1));
      return fetchWikiImage(title, retryCount + 1);
    }
    return null;
  }
}

async function fetchImageForBreed(category, slug) {
  const key = `${category}/${slug}`;

  // Try explicit mapping first
  if (EXPLICIT_MAPPINGS[key]) {
    const result = await fetchWikiImage(EXPLICIT_MAPPINGS[key]);
    if (result) return result;
  }

  // Auto-convert slug to title and try
  const autoTitle = slugToTitle(slug);
  const result = await fetchWikiImage(autoTitle);
  if (result) return result;

  // Try with category suffixes
  const suffixes = {
    dogs: ['_(dog)', '_(dog_breed)'],
    cats: ['_(cat)', '_cat'],
    fish: ['_(fish)'],
    'marine-fish': ['_(fish)'],
    reptiles: ['_(reptile)', '_(lizard)', '_(snake)'],
    birds: ['_(bird)', '_(parrot)'],
    'small-animals': ['_(animal)', '_(rabbit)', '_(rodent)'],
    amphibians: ['_(amphibian)', '_(frog)'],
  };

  const catSuffixes = suffixes[category] || [];
  for (const suffix of catSuffixes) {
    const suffixResult = await fetchWikiImage(autoTitle + suffix);
    if (suffixResult) return suffixResult;
  }

  return null;
}

// ============================================================
// HTML PROCESSING
// ============================================================

function buildImageTag(imageUrl, altText) {
  const escapedAlt = altText.replace(/"/g, '&quot;').replace(/&(?!amp;|quot;|lt;|gt;|#)/g, '&amp;');
  return `<div class="breed-image-container" style="text-align:center;margin:20px 0;">
<img src="${imageUrl}"
     alt="${escapedAlt}"
     class="breed-hero-image"
     loading="lazy"
     width="800" height="600"
     style="max-width:100%;height:auto;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1);aspect-ratio:4/3;object-fit:cover;">
</div>`;
}

function replaceFallbackImage(html, imageUrl) {
  // Replace fallback category images with breed-specific images
  const fallbackUrls = Object.values(CATEGORY_FALLBACKS).map(f => f.url);
  let modified = html;
  for (const fallbackUrl of fallbackUrls) {
    if (modified.includes(fallbackUrl)) {
      modified = modified.split(fallbackUrl).join(imageUrl);
    }
  }
  return modified;
}

function replaceUnsplashImage(html, imageUrl) {
  // Replace the src attribute in img tags with source.unsplash.com URLs
  return html.replace(
    /src="https:\/\/source\.unsplash\.com\/featured\/\d+x\d+\/\?[^"]*"/g,
    `src="${imageUrl}"`
  );
}

function replaceStyledPlaceholder(html, imageUrl, altText) {
  // Replace the entire styled placeholder div with a real image
  const placeholderRegex = /<div class="breed-image-placeholder-styled"[^>]*>[\s\S]*?<\/div>/g;
  const imageTag = buildImageTag(imageUrl, altText);
  return html.replace(placeholderRegex, imageTag);
}

function replaceEmojiPlaceholder(html, imageUrl, altText) {
  // Replace the old-style emoji placeholder
  const emojiRegex = /<div class="breed-image-placeholder"[^>]*>[\s\S]*?<\/div>/g;
  const imageTag = buildImageTag(imageUrl, altText);
  return html.replace(emojiRegex, imageTag);
}

function updateOgImage(html, imageUrl) {
  // Check if og:image already exists
  if (html.includes('property="og:image"')) {
    return html.replace(
      /<meta property="og:image" content="[^"]*"\s*\/?>/,
      `<meta property="og:image" content="${imageUrl}" />`
    );
  }
  // Add og:image before </head> if it doesn't exist
  if (html.includes('og:site_name')) {
    return html.replace(
      /(<meta property="og:site_name" content="[^"]*"\s*\/?>)/,
      `$1\n  <meta property="og:image" content="${imageUrl}" />`
    );
  }
  return html;
}

function updateAltText(html, breedName) {
  // Improve alt text to be descriptive and SEO-friendly
  const altPattern = /alt="[^"]*care guide photo"/g;
  const newAlt = `${breedName} - professional breed photo`;
  return html.replace(altPattern, `alt="${newAlt.replace(/"/g, '&quot;')}"`);
}

function processBreedFile(filePath, imageUrl, breedName) {
  let html;
  try {
    html = readFileSync(filePath, 'utf8');
  } catch {
    return { success: false, reason: 'read_error' };
  }

  let modified = html;
  let changeType = 'none';

  // Check for broken Unsplash URLs
  if (modified.includes('source.unsplash.com')) {
    modified = replaceUnsplashImage(modified, imageUrl);
    modified = updateAltText(modified, breedName);
    changeType = 'unsplash_replaced';
  }

  // Check for styled placeholder divs
  if (modified.includes('breed-image-placeholder-styled')) {
    modified = replaceStyledPlaceholder(modified, imageUrl, `${breedName} - professional breed photo`);
    changeType = 'placeholder_replaced';
  }

  // Check for old-style emoji placeholders
  if (modified.includes('breed-image-placeholder')) {
    modified = replaceEmojiPlaceholder(modified, imageUrl, `${breedName} - professional breed photo`);
    changeType = changeType === 'none' ? 'emoji_replaced' : changeType;
  }

  // Replace fallback images with breed-specific images
  modified = replaceFallbackImage(modified, imageUrl);
  if (modified !== html && changeType === 'none') {
    changeType = 'fallback_upgraded';
  }

  // Update OG image
  modified = updateOgImage(modified, imageUrl);

  if (modified !== html) {
    writeFileSync(filePath, modified, 'utf8');
    return { success: true, changeType };
  }

  return { success: false, reason: 'no_changes' };
}

// ============================================================
// FILE COLLECTION
// ============================================================

function collectBreedFiles() {
  const categories = ['dogs', 'cats', 'fish', 'marine-fish', 'reptiles', 'birds', 'small-animals', 'amphibians'];
  const files = [];

  for (const cat of categories) {
    const dir = join(BASE_DIR, 'breeds', cat);
    if (!existsSync(dir)) continue;

    try {
      const entries = readdirSync(dir).filter(f => f.endsWith('.html'));
      for (const entry of entries) {
        files.push({
          path: join(dir, entry),
          category: cat,
          slug: entry.replace('.html', '')
        });
      }
    } catch {
      console.warn(`  WARN: Could not read directory ${dir}`);
    }
  }

  return files;
}

// ============================================================
// CONCURRENT BATCH PROCESSOR
// ============================================================

async function processInBatches(items, batchSize, processor) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    const processed = Math.min(i + batchSize, items.length);
    if (processed % 50 === 0 || processed === items.length) {
      console.log(`  Progress: ${processed}/${items.length} breeds processed`);
    }
    await sleep(300); // Rate limiting courtesy - Wikipedia recommends max 200 req/s
  }
  return results;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('=== PetCareHelperAI Visual Authority Enforcement Engine ===');
  console.log(`Base directory: ${BASE_DIR}`);
  console.log('');

  // Step 1: Collect all breed files
  console.log('Step 1: Collecting breed files...');
  const breedFiles = collectBreedFiles();
  console.log(`  Found ${breedFiles.length} breed files across all categories`);
  console.log('');

  // Step 2: Fetch images from Wikipedia
  console.log('Step 2: Fetching real images from Wikipedia...');
  const imageCache = {};
  let wikiHits = 0;
  let wikiFallbacks = 0;

  const fetchResults = await processInBatches(breedFiles, CONCURRENCY, async (file) => {
    const result = await fetchImageForBreed(file.category, file.slug);

    if (result && result.thumbnail) {
      imageCache[`${file.category}/${file.slug}`] = result.thumbnail;
      return { ...file, imageUrl: result.thumbnail, source: 'wikipedia' };
    } else {
      const fallback = CATEGORY_FALLBACKS[file.category];
      if (fallback) {
        imageCache[`${file.category}/${file.slug}`] = fallback.url;
        return { ...file, imageUrl: fallback.url, source: 'fallback' };
      }
      return { ...file, imageUrl: null, source: 'none' };
    }
  });

  wikiHits = fetchResults.filter(r => r.source === 'wikipedia').length;
  wikiFallbacks = fetchResults.filter(r => r.source === 'fallback').length;
  const noImage = fetchResults.filter(r => r.source === 'none').length;

  console.log(`  Wikipedia hits: ${wikiHits}`);
  console.log(`  Category fallbacks: ${wikiFallbacks}`);
  console.log(`  No image available: ${noImage}`);
  console.log('');

  // Step 3: Process HTML files
  console.log('Step 3: Updating HTML files with real images...');
  let unsplashReplaced = 0;
  let placeholderReplaced = 0;
  let emojiReplaced = 0;
  let fallbackUpgraded = 0;
  let noChanges = 0;
  let errors = 0;

  for (const file of fetchResults) {
    if (!file.imageUrl) {
      errors++;
      continue;
    }

    const breedName = extractH1(readFileSync(file.path, 'utf8'));
    const result = processBreedFile(file.path, file.imageUrl, breedName || file.slug.replace(/-/g, ' '));

    if (result.success) {
      if (result.changeType === 'unsplash_replaced') unsplashReplaced++;
      else if (result.changeType === 'placeholder_replaced') placeholderReplaced++;
      else if (result.changeType === 'emoji_replaced') emojiReplaced++;
      else if (result.changeType === 'fallback_upgraded') fallbackUpgraded++;
    } else {
      if (result.reason === 'no_changes') noChanges++;
      else errors++;
    }
  }

  console.log(`  Unsplash URLs replaced: ${unsplashReplaced}`);
  console.log(`  Styled placeholders replaced: ${placeholderReplaced}`);
  console.log(`  Emoji placeholders replaced: ${emojiReplaced}`);
  console.log(`  Fallbacks upgraded to breed-specific: ${fallbackUpgraded}`);
  console.log(`  No changes needed: ${noChanges}`);
  console.log(`  Errors: ${errors}`);
  console.log('');

  // Log fallback breeds for transparency
  const fallbackBreeds = fetchResults.filter(r => r.source === 'fallback');
  if (fallbackBreeds.length > 0) {
    console.log('Breeds using category fallback images:');
    for (const fb of fallbackBreeds) {
      console.log(`  - ${fb.category}/${fb.slug}`);
    }
    console.log('');
  }

  console.log('=== Summary ===');
  console.log(`  Total breed files: ${breedFiles.length}`);
  console.log(`  Successfully updated: ${unsplashReplaced + placeholderReplaced + emojiReplaced + fallbackUpgraded}`);
  console.log(`  Wikipedia image coverage: ${((wikiHits / breedFiles.length) * 100).toFixed(1)}%`);
  console.log(`  Total coverage (with fallbacks): ${(((wikiHits + wikiFallbacks) / breedFiles.length) * 100).toFixed(1)}%`);
  console.log('');
  console.log('Visual authority enforcement complete.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
