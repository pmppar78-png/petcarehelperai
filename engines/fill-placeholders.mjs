#!/usr/bin/env node
/**
 * Fill placeholder breed photos from verified free images.
 * Commons search, then research-grade iNaturalist (CC0 / CC BY / CC BY-SA).
 * A file is kept only when the title, description, categories, or taxon
 * identify that species or breed. Look-alikes stay on the placeholder.
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const MANIFEST = path.join(ROOT, "data/image-manifest.json");
const UA = "PetCareHelperAI/1.0 (breed photo credits; https://petcarehelperai.com/image-credits)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Required identification. binomials: any one must match fully. */
const ID = {
  "dogs/belgian-sheepdog": { phrases: ["groenendael", "belgian sheepdog"] },
  "reptiles/bearded-dragon": { binomials: ["pogona vitticeps"], reject: ["barbata", "henrylawsoni", "minor"] },
  "reptiles/rankins-dragon": { binomials: ["pogona henrylawsoni"], reject: ["vitticeps", "barbata"] },
  "reptiles/blue-tongue-skink": { binomials: ["tiliqua scincoides"], reject: ["rugosa"] },
  "reptiles/king-snake": { binomials: ["lampropeltis californiae", "lampropeltis getula"], reject: ["elapsoides", "triangulum"] },
  "reptiles/milk-snake": { binomials: ["lampropeltis triangulum"], reject: ["elapsoides"] },
  "reptiles/mexican-black-kingsnake": { binomials: ["lampropeltis californiae nigrita", "lampropeltis getula nigrita"], phrase: "nigrita" },
  "reptiles/electric-blue-gecko": { binomials: ["lygodactylus williamsi"] },
  "reptiles/gargoyle-gecko": { binomials: ["rhacodactylus auriculatus"] },
  "reptiles/giant-day-gecko": { binomials: ["phelsuma grandis"] },
  "reptiles/gold-dust-day-gecko": { binomials: ["phelsuma laticauda"] },
  "reptiles/mourning-gecko": { binomials: ["lepidodactylus lugubris"] },
  "reptiles/house-gecko": { binomials: ["hemidactylus turcicus"] },
  "reptiles/green-iguana": { binomials: ["iguana iguana"], reject: ["delicatissima"] },
  "reptiles/green-tree-python": { binomials: ["morelia viridis"] },
  "reptiles/burmese-python": { binomials: ["python bivittatus"] },
  "reptiles/blood-python": { binomials: ["python brongersmai"] },
  "reptiles/reticulated-python": { binomials: ["malayopython reticulatus", "python reticulatus"] },
  "reptiles/amazon-tree-boa": { binomials: ["corallus hortulana", "corallus hortulanus"] },
  "reptiles/brazilian-rainbow-boa": { binomials: ["epicrates cenchria"] },
  "reptiles/rosy-boa": { binomials: ["lichanura trivirgata", "lichanura orcutti"] },
  "reptiles/western-hognose": { binomials: ["heterodon nasicus"] },
  "reptiles/hognose-snake": { binomials: ["heterodon nasicus"] },
  "reptiles/garter-snake": { binomials: ["thamnophis sirtalis"] },
  "reptiles/ring-neck-snake": { binomials: ["diadophis punctatus"] },
  "reptiles/rat-snake": { binomials: ["pantherophis obsoletus", "pantherophis alleghaniensis"] },
  "reptiles/ackie-monitor": { binomials: ["varanus acanthurus"] },
  "reptiles/sailfin-dragon": { binomials: ["hydrosaurus pustulatus"] },
  "reptiles/fire-skink": { binomials: ["riopa fernandi", "lepidothyris fernandi", "mochlus fernandi"] },
  "reptiles/long-tailed-lizard": { binomials: ["takydromus sexlineatus"] },
  "reptiles/greek-tortoise": { binomials: ["testudo graeca"], reject: ["hermanni", "horsfieldii"] },
  "reptiles/hermann-tortoise": { binomials: ["testudo hermanni"], reject: ["graeca", "horsfieldii"] },
  "reptiles/russian-tortoise": { binomials: ["testudo horsfieldii", "agricionemys horsfieldii"], reject: ["hermanni", "graeca"] },
  "reptiles/red-footed-tortoise": { binomials: ["chelonoidis carbonarius"], reject: ["denticulatus"] },
  "reptiles/musk-turtle": { binomials: ["sternotherus odoratus"] },
  "reptiles/mud-turtle": { binomials: ["kinosternon subrubrum", "kinosternon baurii"] },
  "reptiles/map-turtle": { binomials: ["graptemys geographica", "graptemys ouachitensis"] },
  "reptiles/softshell-turtle": { binomials: ["apalone spinifera"] },
  "reptiles/tegu": { binomials: ["salvator merianae"] },
  "amphibians/whites-tree-frog": { binomials: ["ranoidea caerulea", "litoria caerulea"], reject: ["infrafrenata", "chloris"] },
  "amphibians/budgetts-frog": { binomials: ["lepidobatrachus laevis"] },
  "amphibians/surinam-toad": { binomials: ["pipa pipa"] },
  "amphibians/pacman-frog": { binomials: ["ceratophrys cranwelli", "ceratophrys ornata"] },
  "amphibians/fire-bellied-toad": { binomials: ["bombina orientalis"], reject: ["variegata"] },
  "amphibians/fire-bellied-newt": { binomials: ["cynops pyrrhogaster", "hypselotriton orientalis"] },
  "amphibians/dart-frog": { binomials: ["dendrobates tinctorius", "ranitomeya variabilis", "oophaga pumilio"] },
  "amphibians/tree-frog": { binomials: ["dryophytes cinereus", "hyla cinerea"], reject: ["caerulea", "chrysoscelis"] },
  "birds/blue-and-gold-macaw": { binomials: ["ara ararauna"], reject: ["chloropterus", "macao"] },
  "birds/green-wing-macaw": { binomials: ["ara chloropterus"], reject: ["ararauna", "macao"] },
  "birds/golden-conure": { binomials: ["guaruba guarouba"] },
  "birds/half-moon-conure": { binomials: ["eupsittula canicularis", "aratinga canicularis"] },
  "birds/dusky-conure": { binomials: ["aratinga weddellii", "eupsittula weddellii"] },
  "birds/hawk-headed-parrot": { binomials: ["deroptyus accipitrinus"] },
  "birds/indian-ringneck": { binomials: ["psittacula krameri"] },
  "birds/java-finch": { binomials: ["lonchura oryzivora", "padda oryzivora"] },
  "birds/kakariki": { binomials: ["cyanoramphus novaezelandiae"] },
  "birds/cordon-bleu": { binomials: ["uraeginthus bengalus", "uraeginthus angolensis"] },
  "birds/owl-finch": { binomials: ["taeniopygia bichenovii", "stizoptera bichenovii"] },
  "birds/spice-finch": { binomials: ["lonchura punctulata"] },
  "birds/mynah": { binomials: ["acridotheres tristis"] },
  "birds/dove": { binomials: ["streptopelia risoria", "streptopelia capicola"] },
  "birds/pigeon": { binomials: ["columba livia"] },
  "birds/canary": { binomials: ["serinus canaria"] },
  "birds/bourke-parakeet": { binomials: ["neopsephotus bourkii", "neophema bourkii"] },
  "birds/bourkes-parakeet": { binomials: ["neopsephotus bourkii", "neophema bourkii"] },
  "birds/caique": { binomials: ["pionites leucogaster", "pionites melanocephalus"] },
  "birds/rosellas": { binomials: ["platycercus eximius"] },
  "birds/chicken": { binomials: ["gallus gallus domesticus"], phrases: ["domestic chicken", "backyard chicken"] },
  "cats/donskoy": { phrases: ["don sphynx", "donskoy cat"] },
  "cats/javanese": { phrases: ["javanese cat"] },
  "cats/minuet": { phrases: ["napoleon cat", "minuet cat"] },
  "small-animals/dwarf-hotot": { phrases: ["hotot rabbit", "blanc de hotot", "dwarf hotot"] },
  "small-animals/long-haired-hamster": { phrases: ["teddy bear hamster", "longhair syrian", "long haired syrian"] },
  "dogs/maremma-sheepdog": { phrases: ["maremmano", "pastore maremmano", "maremma sheepdog"] },
  "dogs/polish-tatra-sheepdog": { phrases: ["tatra sheepdog", "polish tatra", "owczarek podhalanski"] },
  "birds/gloster-canary": { phrases: ["gloster corona", "gloster consort", "gloster canary"] },
  "fish/bristlenose-pleco": { binomials: ["ancistrus cirrhosus", "ancistrus dolichopterus", "ancistrus triradiatus"] },
  "fish/clown-pleco": { binomials: ["panaqolus maccus"] },
  "fish/peacock-bass": { binomials: ["cichla ocellaris", "cichla temensis"] },
  "fish/pencilfish": { binomials: ["nannostomus beckfordi", "nannostomus eques"] },
  "fish/rabbit-snail": { binomials: ["tylomelania patriarchalis", "tylomelania gemmifera"] },
  "fish/vampire-crab": { binomials: ["geosesarma dennerle", "geosesarma hagen"] },
  "fish/convict-cichlid": { binomials: ["amatitlania nigrofasciata"] },
  "fish/gold-barb": { binomials: ["barbodes semifasciolatus", "puntius semifasciolatus"] },
  "fish/ghost-shrimp": { binomials: ["palaemonetes paludosus"] },
  "fish/dwarf-crayfish": { binomials: ["cambarellus patzcuarensis"] },
  "fish/blue-velvet-shrimp": { binomials: ["neocaridina davidi"] },
  "fish/celestial-pearl-danio": { binomials: ["danio margaritatus"] },
  "fish/chili-rasbora": { binomials: ["boraras brigittae"] },
  "fish/ember-tetra": { binomials: ["hyphessobrycon amandae"] },
  "fish/rasbora": { binomials: ["trigonostigma heteromorpha"] },
  "fish/clown-loach": { binomials: ["chromobotia macracanthus"] },
  "fish/siamese-algae-eater": { binomials: ["crossocheilus oblongus", "crossocheilus langei"] },
  "fish/pictus-catfish": { binomials: ["pimelodus pictus"] },
  "fish/glass-catfish": { binomials: ["kryptopterus vitreolus"] },
  "fish/honey-gourami": { binomials: ["trichogaster chuna", "trichopodus chuna"] },
  "fish/ram-cichlid": { binomials: ["mikrogeophagus ramirezi"] },
  "fish/german-blue-ram": { binomials: ["mikrogeophagus ramirezi"] },
  "fish/bolivian-ram": { binomials: ["mikrogeophagus altispinosus"] },
  "fish/electric-yellow-cichlid": { binomials: ["labidochromis caeruleus"] },
  "fish/electric-blue-acara": { binomials: ["andinoacara pulcher"] },
  "fish/frontosa": { binomials: ["cyphotilapia frontosa"] },
  "fish/green-terror": { binomials: ["andinoacara rivulatus"] },
  "fish/severum": { binomials: ["heros efasciatus"] },
  "fish/nerite-snail": { binomials: ["neritina natalensis", "vittina natalensis"] },
  "fish/ramshorn-snail": { binomials: ["planorbella duryi", "planorbarius corneus"] },
  "fish/turbo-snail": { binomials: ["turbo fluctuosus"] },
  "fish/cleaner-shrimp": { binomials: ["lysmata amboinensis"] },
  "fish/hatchetfish": { binomials: ["gasteropelecus sternicla", "carnegiella strigata"] },
  "fish/fancy-goldfish": { phrases: ["fancy goldfish", "oranda", "ryukin", "ranchu"] },
  "marine-fish/clownfish": { binomials: ["amphiprion ocellaris"], reject: ["percula"] },
  "marine-fish/maroon-clownfish": { binomials: ["premnas biaculeatus", "amphiprion biaculeatus"] },
  "marine-fish/blue-tang": { binomials: ["paracanthurus hepatus"] },
  "marine-fish/kole-tang": { binomials: ["ctenochaetus strigosus"] },
  "marine-fish/powder-blue-tang": { binomials: ["acanthurus leucosternon"] },
  "marine-fish/bangai-cardinal": { binomials: ["pterapogon kauderni"] },
  "marine-fish/coral-beauty": { binomials: ["centropyge bispinosa"] },
  "marine-fish/dottyback": { binomials: ["pseudochromis fridmani"] },
  "marine-fish/firefish": { binomials: ["nemateleotris magnifica"] },
  "marine-fish/hawkfish": { binomials: ["oxycirrhites typus"] },
  "marine-fish/mandarin-goby": { binomials: ["synchiropus splendidus"] },
  "marine-fish/melanurus-wrasse": { binomials: ["halichoeres melanurus"] },
  "marine-fish/watchman-goby": { binomials: ["cryptocentrus cinctus"] },
  "marine-fish/blue-damsel": { binomials: ["chrysiptera cyanea"] },
  "small-animals/short-tailed-opossum": { binomials: ["monodelphis domestica"] },
  "small-animals/giant-african-land-snail": { binomials: ["lissachatina fulica", "achatina fulica"] },
  "small-animals/winter-white": { binomials: ["phodopus sungorus"] },
  "small-animals/mongolian-gerbil": { binomials: ["meriones unguiculatus"] },
  "small-animals/flying-squirrel": { binomials: ["petaurus breviceps"], reject: ["glaucomys"] },
  "small-animals/african-pygmy-hedgehog": { binomials: ["atelerix albiventris"] },
  "fish/hermit-crab": { binomials: ["clibanarius vittatus", "pagurus bernhardus"] },
  "small-animals/hermit-crab-pet": { binomials: ["coenobita clypeatus"] },
};

const BREED_PHRASE = {
  "dogs/flat-coated-retriever": "flat coated retriever",
  "dogs/chinese-shar-pei": "shar pei",
  "dogs/peruvian-inca-orchid": "peruvian inca orchid",
  "dogs/belgian-sheepdog": "groenendael",
  "dogs/bichon-frise": "bichon frise",
  "dogs/brussels-griffon": "brussels griffon",
  "dogs/english-cocker-spaniel": "english cocker",
  "dogs/entlebucher-mountain-dog": "entlebucher",
  "dogs/german-pinscher": "german pinscher",
  "dogs/german-wirehaired-pointer": "german wirehaired pointer",
  "dogs/kai-ken": "kai ken",
  "dogs/kishu-ken": "kishu",
  "dogs/maremma-sheepdog": "maremma sheepdog",
  "dogs/polish-tatra-sheepdog": "polish tatra sheepdog",
  "dogs/scottish-deerhound": "scottish deerhound",
  "dogs/wire-fox-terrier": "wire fox terrier",
  "dogs/akbash": "akbash",
  "dogs/anatolian-shepherd": "anatolian shepherd",
  "dogs/boerboel": "boerboel",
  "dogs/bohemian-shepherd": "bohemian shepherd",
  "dogs/bulldog": "english bulldog",
  "dogs/english-bulldog": "english bulldog",
  "dogs/english-toy-spaniel": "english toy spaniel",
  "dogs/giant-schnauzer": "giant schnauzer",
  "dogs/neapolitan-mastiff": "neapolitan mastiff",
  "dogs/presa-canario": "presa canario",
  "dogs/white-shepherd": "white shepherd",
  "dogs/xoloitzcuintli": "xoloitzcuintli",
  "cats/maine-coon": "maine coon",
  "cats/norwegian-forest-cat": "norwegian forest",
  "cats/somali": "somali cat",
  "cats/havana-brown": "havana brown",
  "cats/selkirk-rex": "selkirk rex",
  "cats/donskoy": "donskoy cat",
  "cats/british-longhair": "british longhair",
  "cats/javanese": "javanese cat",
  "cats/oriental-longhair": "oriental longhair",
  "cats/thai": "thai cat",
  "cats/savannah": "savannah cat",
  "cats/colorpoint-shorthair": "colorpoint shorthair",
  "cats/domestic-shorthair": "domestic shorthair",
  "cats/domestic-longhair": "domestic longhair",
  "cats/asian": "asian cat",
  "cats/chinchilla": "chinchilla persian",
  "cats/minuet": "minuet cat",
  "small-animals/abyssinian-guinea-pig": "abyssinian guinea",
  "small-animals/american-guinea-pig": "american guinea pig",
  "small-animals/baldwin-guinea-pig": "baldwin guinea",
  "small-animals/coronet-guinea-pig": "coronet guinea",
  "small-animals/rex-guinea-pig": "rex guinea",
  "small-animals/silkie-guinea-pig": "silkie guinea",
  "small-animals/teddy-guinea-pig": "teddy guinea",
  "small-animals/texel-guinea-pig": "texel guinea",
  "small-animals/white-crested-guinea-pig": "white crested guinea",
  "small-animals/flemish-giant": "flemish giant",
  "small-animals/mini-rex": "mini rex",
  "small-animals/dwarf-hotot": "dwarf hotot",
  "small-animals/english-angora": "english angora",
  "small-animals/new-zealand-white": "new zealand white rabbit",
  "small-animals/ferret-albino": "albino ferret",
  "small-animals/ferret-sable": "sable ferret",
  "small-animals/fancy-rat": "fancy rat",
  "small-animals/hairless-rat": "hairless rat",
  "small-animals/long-haired-hamster": "long-haired syrian hamster",
  "small-animals/chinchilla-standard-gray": "chinchilla",
  "birds/american-singer-canary": "american singer",
  "birds/gloster-canary": "gloster canary",
  "birds/red-factor-canary": "red factor canary",
  "birds/roller-canary": "roller canary",
};

const REJECT_IF = {
  "dogs/bulldog": ["french bulldog", "american bulldog", "olde english"],
  "dogs/english-bulldog": ["french bulldog", "american bulldog"],
  "dogs/belgian-sheepdog": ["malinois", "tervuren", "laekenois"],
  "dogs/english-cocker-spaniel": ["american cocker"],
  "dogs/white-shepherd": ["anatolian"],
  "cats/somali": ["abyssinian cat", "stamp"],
  "cats/domestic-longhair": ["maine coon"],
  "dogs/giant-schnauzer": ["miniature schnauzer", "sznaucer sredni"],
  "fish/blue-velvet-shrimp": ["var red", "cherry"],
  "fish/vampire-crab": ["aurantium", "possibly"],
  "birds/dusky-conure": ["clay lick", "ara severus", "amazona"],
  "birds/red-factor-canary": ["chick", "chic", "nestling"],
  "birds/roller-canary": ["birdcage", "bird cage", "vogelbauer"],
  "birds/canary": ["gloster", "roller", "red factor", "american singer"],
  "fish/ram-cichlid": ["altispinosus", "bolivian"],
  "fish/german-blue-ram": ["altispinosus"],
  "fish/bolivian-ram": ["ramirezi"],
  "reptiles/hognose-snake": ["platirhinos"],
  "amphibians/fire-bellied-toad": ["bombina bombina", "bombina variegata"],
};

function hasPhrase(hay, phrase) {
  return hay.includes(norm(phrase));
}

function badCategory(cats) {
  const blob = cats.join(" | ");
  return /(range map|locator map|distribution map|coat of arms|flag of|postage stamp|\bstamps?\b|church|église|cathedral|aircraft|air force|naval base|birdcage|bird cage|line art|hanacaraka|sports jersey|guinea hog|skeleton|skull of|diagram|illustration of|drawings of|paintings of|logo|icon of|herald|coat of|sunset)/i.test(blob);
}

function badSubject(text) {
  return /\b(church|eglise|cathedral|mosque|stamp|stamps|aircraft|airplane|air force|naval base|birdcage|bird cage|line art|hanacaraka|sports jersey|guinea hog|skeleton|diagram|coat of arms|postage|sunset)\b/.test(norm(text));
}

function freeCommonsLicense(license) {
  const l = license.toLowerCase();
  if (/non-free|fair use|all rights reserved/.test(l)) return false;
  return /cc0|cc-by|cc by|public domain|gfdl|attribution/.test(l);
}

async function fetchJson(url) {
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (res.status === 429 || res.status >= 500) {
      await sleep(700 * (i + 1));
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${url.slice(0, 120)}`);
    return res.json();
  }
  throw new Error("retry exhausted");
}

function matchesBinomial(hay, binomial) {
  return norm(binomial).split(" ").every((p) => hay.includes(p));
}

function identify(key, subject, full) {
  const rule = ID[key];
  const phrases = [BREED_PHRASE[key], ...(rule?.phrases || [])].filter(Boolean);
  const rejects = REJECT_IF[key] || [];
  if (rejects.some((r) => full.includes(norm(r)))) return false;
  if (/\b(possibly|unconfirmed|misidentified)\b/.test(full)) return false;
  if (rule?.binomials) {
    const matched = rule.binomials.find((b) => matchesBinomial(subject, b));
    if (matched) {
      if ((rule.reject || []).some((r) => full.includes(norm(r)) && !norm(matched).includes(norm(r)))) return false;
      return true;
    }
  }
  return phrases.some((p) => hasPhrase(subject, p));
}

async function searchCommons(query) {
  const url = "https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: "8",
    gsrsearch: query,
    prop: "imageinfo|categories",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "1280",
    cllimit: "40",
  });
  const data = await fetchJson(url);
  const pages = Object.values(data?.query?.pages || {});
  const out = [];
  for (const page of pages) {
    if (page.missing !== undefined || !page.imageinfo) continue;
    const info = page.imageinfo[0] || {};
    const meta = info.extmetadata || {};
    const license = stripHtml(meta.LicenseShortName?.value || "");
    if (!/^image\/(jpeg|png|webp)/.test(info.mime || "")) continue;
    if (!freeCommonsLicense(license)) continue;
    const cats = (page.categories || []).map((c) => c.title.replace(/^Category:/, ""));
    if (badCategory(cats)) continue;
    out.push({
      source: "Wikimedia Commons",
      title: page.title.replace(/^File:/, ""),
      description: stripHtml(meta.ImageDescription?.value || ""),
      objectName: stripHtml(meta.ObjectName?.value || ""),
      artist: stripHtml(meta.Artist?.value || "Unknown").slice(0, 180),
      license,
      licenseUrl: stripHtml(meta.LicenseUrl?.value || "https://commons.wikimedia.org/wiki/Commons:Licensing"),
      pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
      download: info.thumburl || info.url,
      mime: info.mime,
      categories: cats,
    });
  }
  return out;
}

async function searchInat(binomial) {
  const taxonData = await fetchJson(
    "https://api.inaturalist.org/v1/taxa?" + new URLSearchParams({ q: binomial, per_page: "5" })
  );
  const taxon = (taxonData.results || []).find((t) => norm(t.name) === norm(binomial) && (t.rank === "species" || t.rank === "subspecies"));
  if (!taxon) return [];
  const obsData = await fetchJson(
    "https://api.inaturalist.org/v1/observations?" + new URLSearchParams({
      taxon_id: String(taxon.id),
      quality_grade: "research",
      photo_license: "cc0,cc-by,cc-by-sa",
      photos: "true",
      per_page: "6",
      order_by: "votes",
      order: "desc",
    })
  );
  const out = [];
  for (const obs of obsData.results || []) {
    if (obs.quality_grade !== "research") continue;
    const name = obs.taxon?.name || "";
    if (!norm(name).startsWith(norm(binomial))) continue;
    const photo = (obs.photos || [])[0];
    if (!photo) continue;
    const code = (photo.license_code || "").toLowerCase();
    if (!["cc0", "cc-by", "cc-by-sa"].includes(code)) continue;
    const url = String(photo.url || "").replace("/square.", "/large.");
    if (!url.startsWith("http")) continue;
    const licenseName = code === "cc0" ? "CC0" : code === "cc-by" ? "CC BY" : "CC BY-SA";
    out.push({
      source: "iNaturalist",
      title: `${name} observation ${obs.id}`,
      description: `Research-grade iNaturalist observation of ${name}`,
      objectName: name,
      artist: obs.user?.name || obs.user?.login || "iNaturalist observer",
      license: licenseName,
      licenseUrl: code === "cc0"
        ? "https://creativecommons.org/publicdomain/zero/1.0/"
        : code === "cc-by"
          ? "https://creativecommons.org/licenses/by/4.0/"
          : "https://creativecommons.org/licenses/by-sa/4.0/",
      pageUrl: `https://www.inaturalist.org/observations/${obs.id}`,
      download: url,
      mime: "image/jpeg",
      categories: [`taxon:${name}`, "research-grade"],
    });
  }
  return out;
}

function convertPair(srcPath, mainPath, thumbPath) {
  const py = `
from PIL import Image
im = Image.open(${JSON.stringify(srcPath)})
if im.mode not in ("RGB", "RGBA"):
    im = im.convert("RGB")
if im.mode == "RGBA":
    bg = Image.new("RGB", im.size, (245, 247, 246))
    bg.paste(im, mask=im.split()[-1])
    im = bg
w, h = im.size
def save(tw, dest):
    if w > tw:
        nh = max(1, round(h * tw / w))
        out = im.resize((tw, nh), Image.Resampling.LANCZOS)
    else:
        out = im
    out.save(dest, "WEBP", quality=78, method=4)
    return out.size
mw, mh = save(960, ${JSON.stringify(mainPath)})
tw, th = save(250, ${JSON.stringify(thumbPath)})
print(f"{mw} {mh} {tw} {th}")
`;
  const res = spawnSync("python3", ["-c", py], { encoding: "utf8" });
  if (res.status !== 0) throw new Error(res.stderr || "convert failed");
  const [mw, mh, tw, th] = res.stdout.trim().split(/\s+/).map(Number);
  return { width: mw, height: mh, thumbWidth: tw, thumbHeight: th };
}

async function download(url, dest) {
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status === 429) {
      await sleep(1000 * (i + 1));
      continue;
    }
    if (!res.ok) throw new Error(String(res.status));
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1500) throw new Error("tiny file");
    fs.writeFileSync(dest, buf);
    return;
  }
  throw new Error("download failed");
}

function applyHtml(group, slug, entry) {
  const file = path.join(ROOT, "breeds", group, `${slug}.html`);
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, "utf8");
  const tag = `<img src="${entry.main}" srcset="${entry.thumb} 250w, ${entry.main} 960w" sizes="(max-width: 640px) 92vw, 960px" alt="${entry.alt.replace(/"/g, "&quot;")}" width="${entry.width}" height="${entry.height}" loading="lazy" decoding="async">`;
  if (!/<img\b/i.test(html)) return;
  html = html.replace(/<img\b[\s\S]*?>/i, tag);
  const og = `https://petcarehelperai.com${entry.main}`;
  if (/property="og:image"/i.test(html)) {
    html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${og}" />`);
  } else {
    html = html.replace("</head>", `  <meta property="og:image" content="${og}" />\n</head>`);
  }
  fs.writeFileSync(file, html);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const used = new Set(
  manifest.images.filter((i) => !i.placeholder && i.sourceFile).map((i) => i.sourceFile)
);

const targets = manifest.images.filter((i) => i.placeholder);
const found = [];
const missed = [];

for (const profile of targets) {
  const key = `${profile.group}/${profile.slug}`;
  const rule = ID[key];
  const phrase = BREED_PHRASE[key];
  if (!rule && !phrase) {
    missed.push({ key, reason: "no confident identification rule" });
    continue;
  }
  const queries = [];
  if (rule?.binomials) queries.push(`"${rule.binomials[0]}"`);
  if (phrase) queries.push(`"${phrase}"`);
  for (const extra of rule?.phrases || []) queries.push(`"${extra}"`);
  let candidates = [];
  const consider = (list) => {
    for (const cand of list) {
      const fileKey = cand.source === "Wikimedia Commons" ? cand.title : cand.pageUrl;
      if (used.has(fileKey)) continue;
      const subject = norm([cand.title, cand.objectName, cand.categories.join(" ")].join(" "));
      const full = norm([cand.title, cand.description, cand.objectName, cand.categories.join(" ")].join(" "));
      if (badSubject(cand.title) || badSubject(cand.objectName) || badSubject(cand.categories.join(" "))) continue;
      if (/snail/.test(key) && /\bshell\b/.test(norm(cand.title))) continue;
      if (!identify(key, subject, full)) continue;
      return cand;
    }
    return null;
  };
  let pick = null;
  try {
    for (const q of queries) {
      candidates = await searchCommons(q);
      pick = consider(candidates);
      await sleep(120);
      if (pick) break;
    }
    if (!pick && rule?.binomials) {
      for (const b of rule.binomials.slice(0, 2)) {
        const inat = await searchInat(b);
        pick = consider(inat);
        await sleep(180);
        if (pick) break;
      }
    }
  } catch (err) {
    missed.push({ key, reason: `search error: ${err.message}` });
    console.log("err", key, err.message);
    continue;
  }
  if (!pick) {
    missed.push({ key, reason: candidates.length ? "no candidate passed identification" : "no free photo found" });
    console.log("miss", key);
    continue;
  }
  const dir = path.join(ROOT, "images", "breeds", profile.group);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `${profile.slug}.src`);
  const main = path.join(dir, `${profile.slug}.webp`);
  const thumb = path.join(dir, `${profile.slug}-thumb.webp`);
  try {
    await download(pick.download, tmp);
    const dims = convertPair(tmp, main, thumb);
    fs.unlinkSync(tmp);
    const altSci = (rule?.binomials?.[0] || "").replace(/\b\w/g, (c) => c.toUpperCase());
    const alt = altSci ? `${profile.name.replace(/:$/, "")} (${altSci})` : profile.name.replace(/:$/, "");
    const entry = {
      ...profile,
      placeholder: false,
      reason: `verified ${pick.source}`,
      sourceFile: pick.source === "Wikimedia Commons" ? pick.title : pick.pageUrl,
      main: `/images/breeds/${profile.group}/${profile.slug}.webp`,
      thumb: `/images/breeds/${profile.group}/${profile.slug}-thumb.webp`,
      width: dims.width,
      height: dims.height,
      thumbWidth: dims.thumbWidth,
      thumbHeight: dims.thumbHeight,
      author: pick.artist,
      license: pick.license,
      licenseUrl: pick.licenseUrl,
      commonsUrl: pick.pageUrl,
      commonsTitle: pick.title,
      source: pick.source,
      alt,
    };
    Object.assign(profile, entry);
    used.add(entry.sourceFile);
    applyHtml(profile.group, profile.slug, entry);
    found.push({ key, source: pick.source, title: pick.title, license: pick.license });
    console.log("ok", key, pick.source, pick.title.slice(0, 80));
  } catch (err) {
    missed.push({ key, reason: `download/convert: ${err.message}` });
    console.log("fail", key, err.message);
    for (const f of [tmp, main, thumb]) if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  await sleep(80);
}

const hosted = manifest.images.filter((i) => !i.placeholder).length;
const placeholders = manifest.images.filter((i) => i.placeholder).length;
manifest.hosted = hosted;
manifest.placeholders = placeholders;
manifest.generated = new Date().toISOString();
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
fs.writeFileSync(path.join(ROOT, "data/photo-fill-report.json"), JSON.stringify({ found, missed, hosted, placeholders }, null, 2));
console.log(JSON.stringify({ found: found.length, missed: missed.length, hosted, placeholders }));
