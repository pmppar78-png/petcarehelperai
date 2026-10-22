import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SKIP = new Set(["scottish-fold"]);

function field(html, label) {
  const re = new RegExp(`<td>[^<]*${label}[^<]*</td>\\s*<td>([^<]+)`, "i");
  const m = html.match(re);
  return m ? m[1].replace(/\s*—.*$/, "").trim().toLowerCase() : "";
}

function dogYes(slug, html) {
  if (SKIP.has(slug)) return false;
  const train = field(html, "Trainability");
  const ex = field(html, "Exercise");
  const size = field(html, "Size");
  if (!train || train.includes("experienced")) return false;
  if (!/excellent|easy/.test(train)) return false;
  if (ex.includes("high") || size.includes("giant")) return false;
  return true;
}

function catYes(slug, html) {
  if (SKIP.has(slug)) return false;
  const act = field(html, "Activity");
  const groom = field(html, "Grooming");
  if (!act || /\bhigh\b/.test(act)) return false;
  if (/very high|daily/.test(groom)) return false;
  return true;
}

function apply(hubFile, group, decide) {
  const file = path.join(ROOT, "breeds", hubFile);
  let html = fs.readFileSync(file, "utf8");
  let yes = 0;
  html = html.replace(/<a\b[^>]*href="(\/breeds\/[^"]+)"[^>]*>/g, (tag, href) => {
    const slug = href.split("/").pop();
    if (!href.includes(`/breeds/${group}/`)) return tag;
    const profile = path.join(ROOT, "breeds", group, `${slug}.html`);
    if (!fs.existsSync(profile)) return tag;
    const ok = decide(slug, fs.readFileSync(profile, "utf8"));
    if (ok) yes++;
    return tag.replace(/data-beginner="(?:yes|no)"/, `data-beginner="${ok ? "yes" : "no"}"`);
  });
  fs.writeFileSync(file, html);
  console.log(hubFile, yes);
}

apply("dog-breeds.html", "dogs", dogYes);
apply("cat-breeds.html", "cats", catYes);
