/**
 * Title, meta description, headings, JSON-LD headlines, image alts, and
 * link text against origin/main.
 *
 * Every origin heading must remain, at the same level, with the same text.
 * A completed page whose visible article differs from origin/main may add
 * headings. It may not drop or rewrite one. Title, meta description,
 * Open Graph title, Twitter title, and JSON-LD headline/name still have to
 * match origin/main on every page.
 *
 * The only exemption is a reviewed sentence row in
 * data/preservation-replacements.json: when an origin heading is that
 * row's original sentence, the same-level heading may be the replacement
 * text instead. There is no heading-exemption list.
 *
 * Empty strings are failures. Link text is never skipped for being empty.
 * Every token of the origin title, meta description, Open Graph title and
 * description, Twitter title and description, JSON-LD headline, name,
 * description, and every link text, must still be present. A question
 * name may differ from origin when the visible heading changed, but an
 * empty question name fails, and on guides/why-does-my-* each FAQ name
 * must equal a visible heading. A renamed guide is compared with its
 * origin slug. A rename map that points a file at itself is a failure.
 */
import fs from "fs";
import path from "path";
import { FROM_CURRENT, originFile, resolveOriginBase } from "./origin-base.mjs";

export function decode(text) {
  return String(text)
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;|&quot;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function norm(text) {
  return decode(text).toLowerCase().replace(/[.!?]+$/g, "").replace(/\s+/g, " ").trim();
}

export function escapeText(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function attr(tag, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i");
  const match = tag.match(re);
  return match ? decode(match[2]) : "";
}

export function stripNotices(html) {
  return html.replace(
    /<(p|div|aside|section)\b[^>]*\bclass\s*=\s*(["'])[^"']*\b(?:affiliate-disclosure|medical-disclaimer)\b[^"']*\2[^>]*>[\s\S]*?<\/\1>/gi,
    " ",
  );
}

function tagText(html, re) {
  const match = html.match(re);
  return match ? decode(match[1]) : "";
}

export function headingsOf(html) {
  const out = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = re.exec(html))) {
    const text = decode(match[2].replace(/<[^>]+>/g, " "));
    if (text) out.push({ level: match[1], text });
  }
  return out;
}

export function imagesOf(html) {
  const out = [];
  const re = /<img\b[^>]*>/gi;
  let match;
  while ((match = re.exec(html))) {
    out.push({ src: attr(match[0], "src"), alt: attr(match[0], "alt"), tag: match[0] });
  }
  return out;
}

export function linksOf(html) {
  const out = [];
  const source = stripNotices(html);
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(source))) {
    const text = decode(match[2].replace(/<[^>]+>/g, " "));
    const href = attr(`<a ${match[1]}>`, "href");
    out.push({ href, text });
  }
  return out;
}

function jsonNodes(html) {
  const headlines = [];
  const names = [];
  const descriptions = [];
  const questionNames = [];
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) {
    let data;
    try {
      data = JSON.parse(match[1]);
    } catch {
      headlines.push("INVALID JSON-LD");
      continue;
    }
    const stack = [data];
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== "object") continue;
      if (Array.isArray(node)) {
        stack.push(...node);
        continue;
      }
      const types = [].concat(node["@type"] || []);
      if (typeof node.headline === "string") headlines.push(decode(node.headline));
      if (typeof node.description === "string") descriptions.push(decode(node.description));
      if (typeof node.name === "string") {
        if (types.includes("Question")) questionNames.push(decode(node.name));
        else names.push(decode(node.name));
      }
      for (const value of Object.values(node)) {
        if (value && typeof value === "object") stack.push(value);
      }
    }
  }
  return { headlines, names, descriptions, questionNames };
}

export function chromeOf(html) {
  const twitter = html.match(/<meta\b[^>]*name\s*=\s*["']twitter:title["'][^>]*>/i);
  const twitterDesc = html.match(/<meta\b[^>]*name\s*=\s*["']twitter:description["'][^>]*>/i);
  const og = html.match(/<meta\b[^>]*property\s*=\s*["']og:title["'][^>]*>/i);
  const ogDesc = html.match(/<meta\b[^>]*property\s*=\s*["']og:description["'][^>]*>/i);
  const meta = html.match(/<meta\b[^>]*name\s*=\s*["']description["'][^>]*>/i);
  return {
    title: tagText(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    description: meta ? attr(meta[0], "content") : "",
    og: og ? attr(og[0], "content") : "",
    ogDescription: ogDesc ? attr(ogDesc[0], "content") : "",
    twitter: twitter ? attr(twitter[0], "content") : "",
    twitterDescription: twitterDesc ? attr(twitterDesc[0], "content") : "",
    headings: headingsOf(html),
    images: imagesOf(html).map(({ src, alt }) => ({ src, alt })),
    links: linksOf(html),
    json: jsonNodes(html),
  };
}

export function visibleBody(html) {
  return decode(
    stripNotices(html)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function sameList(a, b) {
  return a.length === b.length && a.every((item, i) => item === b[i]);
}

export function tokensOf(value) {
  return (decode(String(value)).match(/[A-Za-z0-9]+/g) || []).map((token) => token.toLowerCase());
}

export function tokensCover(origin, current) {
  if (String(current).trim() === "" && String(origin).trim() !== "") return false;
  const bag = new Map();
  for (const token of tokensOf(current)) bag.set(token, (bag.get(token) || 0) + 1);
  for (const token of tokensOf(origin)) {
    const have = bag.get(token) || 0;
    if (!have) return false;
    bag.set(token, have - 1);
  }
  return true;
}

function matchStrings(originList, currentList, label, problems) {
  let cursor = 0;
  for (const item of originList) {
    let found = -1;
    for (let i = cursor; i < currentList.length; i++) {
      if (tokensCover(item, currentList[i])) {
        found = i;
        break;
      }
    }
    if (found < 0) {
      problems.push(`${label} lost tokens: ${String(item).slice(0, 120)}`);
      continue;
    }
    cursor = found + 1;
  }
  const originEmpty = originList.filter((item) => String(item).trim() === "").length;
  const currentEmpty = currentList.filter((item) => String(item).trim() === "").length;
  if (currentEmpty > originEmpty) problems.push(`${label} has an empty string`);
}

function fieldTokens(origin, current, label, problems) {
  if (String(current).trim() === "" && String(origin).trim() !== "") problems.push(`${label} is empty`);
  else if (!tokensCover(origin, current)) problems.push(`${label} lost tokens`);
}

function expectedHeading(head, rows) {
  for (const row of rows) {
    if (norm(row.original) === norm(head.text)) return row.replacement;
  }
  return head.text;
}

export function compareChrome(originHtml, currentHtml, rows = []) {
  const origin = chromeOf(originHtml);
  const current = chromeOf(currentHtml);
  const problems = [];
  if (origin.title !== current.title) problems.push(`title: ${JSON.stringify(current.title)} != ${JSON.stringify(origin.title)}`);
  if (origin.description !== current.description) problems.push("meta description differs");
  if (origin.og !== current.og) problems.push("og:title differs");
  if (origin.twitter !== current.twitter) problems.push("twitter:title differs");
  fieldTokens(origin.title, current.title, "title", problems);
  fieldTokens(origin.description, current.description, "meta description", problems);
  fieldTokens(origin.og, current.og, "og:title", problems);
  fieldTokens(origin.ogDescription, current.ogDescription, "og:description", problems);
  fieldTokens(origin.twitter, current.twitter, "twitter:title", problems);
  fieldTokens(origin.twitterDescription, current.twitterDescription, "twitter:description", problems);
  matchStrings(origin.json.headlines, current.json.headlines, "JSON-LD headline", problems);
  matchStrings(origin.json.names, current.json.names, "JSON-LD name", problems);
  matchStrings(origin.json.descriptions, current.json.descriptions, "JSON-LD description", problems);
  if (current.json.questionNames.some((item) => String(item).trim() === "")) {
    problems.push("JSON-LD question name is empty");
  }

  const used = new Array(current.headings.length).fill(false);
  let cursor = 0;
  for (const head of origin.headings) {
    const expect = norm(expectedHeading(head, rows));
    let found = -1;
    for (let i = cursor; i < current.headings.length; i++) {
      if (used[i]) continue;
      if (current.headings[i].level === head.level && norm(current.headings[i].text) === expect) {
        found = i;
        break;
      }
    }
    if (found < 0) {
      problems.push(`missing h${head.level}: ${head.text.slice(0, 140)}`);
      continue;
    }
    used[found] = true;
    cursor = found + 1;
  }
  const originH1 = origin.headings.find((head) => head.level === "1");
  const currentH1 = current.headings.find((head) => head.level === "1");
  if (originH1) {
    const expect = norm(expectedHeading(originH1, rows));
    if (!currentH1 || norm(currentH1.text) !== expect) problems.push("H1 differs");
  }
  const extras = current.headings.filter((_, i) => !used[i]);
  const sameBody = visibleBody(originHtml) === visibleBody(currentHtml);
  if (sameBody && extras.length) problems.push(`extra headings on an unchanged page: ${extras.length}`);

  if (sameBody) {
    if (!sameList(origin.images.map((img) => `${img.src}\n${img.alt}`), current.images.map((img) => `${img.src}\n${img.alt}`))) {
      problems.push("image alt differs");
    }
    if (!sameList(origin.links.map((link) => link.text), current.links.map((link) => link.text))) {
      problems.push("link text differs");
    }
    matchStrings(origin.links.map((link) => link.text), current.links.map((link) => link.text), "link text", problems);
  } else {
    const altsBySrc = new Map(current.images.filter((img) => img.src).map((img) => [img.src, img.alt]));
    for (const img of origin.images) {
      if (!img.src) continue;
      if (!altsBySrc.has(img.src) || altsBySrc.get(img.src) !== img.alt) {
        problems.push(`image alt differs for ${img.src}`);
        break;
      }
    }
    let linkAt = 0;
    for (const link of origin.links) {
      let found = -1;
      for (let i = linkAt; i < current.links.length; i++) {
        if (current.links[i].text === link.text) {
          found = i;
          break;
        }
      }
      if (found < 0) {
        problems.push(`missing link text: ${link.text.slice(0, 120)}`);
        break;
      }
      linkAt = found + 1;
    }
    matchStrings(origin.links.map((link) => link.text), current.links.map((link) => link.text), "link text", problems);
  }
  return { ok: !problems.length, problems, sameBody, extras: extras.length };
}

export function loadSentenceRows(root) {
  const rows = JSON.parse(fs.readFileSync(path.join(root, "data/preservation-replacements.json"), "utf8"));
  const byPage = new Map();
  for (const row of rows) {
    if (row.kind) continue;
    if (!byPage.has(row.page)) byPage.set(row.page, []);
    byPage.get(row.page).push(row);
  }
  return byPage;
}

export function walkHtml(root) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (["node_modules", ".git", "engines", "audit"].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith(".html")) out.push(full);
    }
  }
  return out;
}

export function assertChrome(root, base) {
  const rows = loadSentenceRows(root);
  const problems = [];
  let pages = 0;
  for (const file of walkHtml(root)) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    const originRel = originFile(base, rel);
    const originPath = path.join(base, originRel);
    if (!fs.existsSync(originPath)) {
      if (FROM_CURRENT[rel]) problems.push(`${rel}: origin counterpart missing (${FROM_CURRENT[rel]})`);
      continue;
    }
    if (!fs.existsSync(originPath)) continue;
    pages += 1;
    const result = compareChrome(
      fs.readFileSync(originPath, "utf8"),
      fs.readFileSync(file, "utf8"),
      rows.get(rel) || [],
    );
    if (!result.ok) problems.push(`${rel}: ${result.problems.slice(0, 4).join("; ")}`);
  }
  return { pages, problems };
}

export function assertWhyQuestions(root) {
  const dir = path.join(root, "guides");
  const problems = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.startsWith("why-does-my-") || !name.endsWith(".html")) continue;
    const html = fs.readFileSync(path.join(dir, name), "utf8");
    const headings = headingsOf(html).map((head) => head.text);
    const questions = chromeOf(html).json.questionNames;
    for (const question of questions) {
      if (!headings.includes(question)) problems.push(`${name}: FAQ name is not a visible question: ${question}`);
    }
  }
  return problems;
}

export function runChromeFixtures() {
  const origin = [
    "<title>How Big Do Havaneses Get? Size &amp; Growth Guide</title>",
    '<meta name="description" content="Havanese full size: 7-13 lbs.">',
    '<meta property="og:title" content="How Big Do Havaneses Get? Size &amp; Growth Guide">',
    '<meta property="og:description" content="Havanese full size: 7-13 lbs.">',
    '<meta name="twitter:title" content="How Big Do Havaneses Get? Size &amp; Growth Guide">',
    '<meta name="twitter:description" content="Havanese full size: 7-13 lbs.">',
    '<a href="/guides/best-food-for-havanese">Havanese Diet &amp; Nutrition Guide</a>',
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Pet Care Helper AI","description":"Press Kit for Pet Care Helper AI."}</script>',
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"How Big Do Havaneses Get? Size & Growth Guide","name":"How Big Do Havaneses Get? Size & Growth Guide"}</script>',
  ].join("\n");
  const cases = [
    ["stripped name", origin.replaceAll("Havaneses", "").replaceAll("Havanese", "").replaceAll("Pet Care Helper AI", "")],
    ["empty link text", origin.replace(">Havanese Diet &amp; Nutrition Guide<", "><")],
    ["empty JSON-LD name", origin.replace('"name":"Pet Care Helper AI"', '"name":""')],
  ];
  const misses = [];
  for (const [label, html] of cases) {
    const result = compareChrome(origin, html, []);
    if (result.ok) misses.push(label);
  }
  if (misses.length) {
    console.error(`chrome fixtures failed open: ${misses.join(", ")}`);
    process.exit(1);
  }
  if (FROM_CURRENT["guides/how-big-do-havanese-get.html"] !== "guides/how-big-do-havaneses-get.html") {
    console.error("chrome fixtures failed open: Havanese rename map points at itself");
    process.exit(1);
  }
  console.log("chrome fixtures ok (stripped name, empty link text, empty JSON-LD name)");
}

function main() {
  runChromeFixtures();
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const why = assertWhyQuestions(root);
  if (why.length) {
    console.error(`why-does FAQ names failed (${why.length})`);
    for (const line of why.slice(0, 40)) console.error(line);
    process.exit(1);
  }
  const base = resolveOriginBase({ root });
  const { pages, problems } = assertChrome(root, base);
  if (problems.length) {
    console.error(`chrome check failed (${problems.length} pages)`);
    for (const line of problems.slice(0, 40)) console.error(line);
    process.exit(1);
  }
  console.log(`chrome check ok (${pages} html files)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();
