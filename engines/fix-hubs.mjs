import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function cleanHub(html) {
  html = html.replace(/<a\b[^>]*class="[^"]*breed-card[^"]*"[^>]*>[\s\S]*?<\/a>/gi, (card) => {
    const i = card.search(/class="breed-meta"|breed-meta/);
    if (i < 0) return card;
    const head = card.slice(0, i).replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, "");
    return head + card.slice(i);
  });
  html = html.replace(/(<h2>\s*[A-Z]\s*<\/h2>)\s*<p\b[^>]*>[\s\S]*?<\/p>/gi, "$1");
  return html;
}

const hubs = fs.readdirSync(path.join(ROOT, "breeds")).filter((f) => f.endsWith("-breeds.html"));
for (const name of hubs) {
  const file = path.join(ROOT, "breeds", name);
  const next = cleanHub(fs.readFileSync(file, "utf8"));
  fs.writeFileSync(file, next);
  const yes = (next.match(/data-beginner="yes"/g) || []).length;
  const cards = (next.match(/breed-card|species-card/g) || []).length;
  console.log(name, "cards", cards, "beginner", yes);
}

const terms = path.join(ROOT, "terms-of-service.html");
let t = fs.readFileSync(terms, "utf8");
if (!t.includes("id=\"terms-vet-photos\"")) {
  const block = `
<section id="terms-vet-photos" class="info-card">
  <h2>Vet tools and photographs</h2>
  <p>The when-to-see-a-vet checker and the symptom guides under /vet/ are reading aids. They do not create a veterinary-client relationship, do not rank clinics, and do not tell you a dose. If an animal is struggling to breathe, has collapsed, is bleeding heavily, or is a male cat who cannot pass urine, leave for an open emergency hospital instead of staying on this site.</p>
  <p>Breed photographs credited on the image credits page are copies of Wikimedia Commons files. The license named there, not these terms, controls how you may reuse the picture. The "Photo coming soon" drawing is ours to mark a profile that does not yet have a verified photo of that animal. Do not hotlink the Commons original from our pages; use the credit line if you need the source file.</p>
  <p>City pages describe how to look for local care. They are not a directory of named hospitals, and a sentence on those pages is not an endorsement of a clinic, a price, or a permit decision. Confirm ordinances with the city and medical decisions with a veterinarian licensed where you live.</p>
</section>`;
  t = t.replace("</main>", `${block}\n</main>`);
  fs.writeFileSync(terms, t);
  console.log("terms updated");
}
