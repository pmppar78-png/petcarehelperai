// Interim fix: Wikimedia no longer serves non-standard thumbnail widths (800px/200px return HTTP 400),
// which broke breed photos site-wide. Rewrite to supported widths, and swap files deleted from Commons
// for the neutral placeholder. Remove once images are self-hosted.
const DEAD = [
  "Cavia_porcellus-short_haired_tabby.jpg",
  "Bulldog_inglese.jpg",
  "Boerboel_wiki.jpg",
  "Mastino_sylwetka.jpg",
  "Hamster_057eue.jpg",
  "Yellow_tang_%28Zebrasoma_flavescens%29.jpg",
];
const THUMB = /https:\/\/upload\.wikimedia\.org\/wikipedia\/(?:commons|en)\/thumb\/[^"'\s)]+?\/(\d+)px-([^"'\s)]+)/g;

export default async (request, context) => {
  const response = await context.next();
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  const html = await response.text();
  const fixed = html.replace(THUMB, (url, width, name) => {
    if (DEAD.includes(name)) return "/animal-placeholder.svg";
    if (width === "800") return url.replace("/800px-", "/960px-");
    if (width === "200") return url.replace("/200px-", "/250px-");
    return url;
  });
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(fixed, { status: response.status, statusText: response.statusText, headers });
};

export const config = {
  path: "/*",
  excludedPath: ["/.netlify/*", "/*.js", "/*.css", "/*.xml", "/*.json", "/*.txt", "/*.jpg", "/*.jpeg", "/*.png", "/*.webp", "/*.svg", "/*.ico"],
};
