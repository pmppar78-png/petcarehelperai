#!/usr/bin/env node
/**
 * FAQ JSON-LD must match the visible article text exactly.
 *
 * Each FAQPage question name and acceptedAnswer.text, with whitespace
 * collapsed, must appear in the visible article or main. A pair that is
 * already on that page's origin/main copy, and that was already absent
 * from the origin visible text, is an inherited mismatch and is exempt.
 * A new mismatch fails. A missing origin/main baseline is a hard error.
 *
 * Usage: node engines/check-faq.mjs
 */
import fs from "fs";
import path from "path";
import { FROM_CURRENT, resolveOriginBase } from "./origin-base.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const BASE = resolveOriginBase({ root: ROOT });

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "engines", "test-results", "audit"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function decode(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function visible(html) {
  const match = html.match(/<article\b[\s\S]*?<\/article>/i) || html.match(/<main\b[\s\S]*?<\/main>/i);
  let text = match ? match[0] : "";
  text = text.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = decode(text.replace(/<[^>]+>/g, " "));
  return text.replace(/\s+/g, " ").trim();
}

function faq(html) {
  const out = [];
  const re = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) {
    let data;
    try {
      data = JSON.parse(match[1]);
    } catch {
      continue;
    }
    const nodes = Array.isArray(data) ? data : [data];
    const stack = [...nodes];
    if (data["@graph"]) stack.push(...data["@graph"]);
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== "object") continue;
      const type = node["@type"];
      const types = Array.isArray(type) ? type : [type];
      if (types.includes("FAQPage") && Array.isArray(node.mainEntity)) {
        for (const question of node.mainEntity) {
          out.push({
            name: decode(question.name || "").replace(/\s+/g, " ").trim(),
            text: decode((question.acceptedAnswer && question.acceptedAnswer.text) || "").replace(/\s+/g, " ").trim(),
          });
        }
      }
    }
  }
  return out;
}

const failures = [];
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  const html = fs.readFileSync(file, "utf8");
  const originRel = FROM_CURRENT[rel] || rel;
  const originPath = path.join(BASE, originRel);
  const origin = fs.existsSync(originPath) ? fs.readFileSync(originPath, "utf8") : "";
  const now = visible(html);
  const then = origin ? visible(origin) : "";
  const inherited = new Set(faq(origin).map((item) => `${item.name}\n${item.text}`));
  for (const item of faq(html)) {
    const key = `${item.name}\n${item.text}`;
    const inheritedMiss =
      inherited.has(key) &&
      (!item.name || !then.includes(item.name)) &&
      (!item.text || !then.includes(item.text));
    if (inheritedMiss) continue;
    if (item.name && !now.includes(item.name)) failures.push(`${rel}: question not visible: ${item.name.slice(0, 140)}`);
    if (item.text && !now.includes(item.text)) failures.push(`${rel}: answer not visible: ${item.text.slice(0, 140)}`);
  }
}

if (failures.length) {
  console.error(`faq check failed (${failures.length})`);
  for (const line of failures.slice(0, 80)) console.error(line);
  process.exit(1);
}
console.log("faq check ok");
