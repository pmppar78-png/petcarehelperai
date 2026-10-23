/**
 * Origin/main baseline for the prose checkers.
 *
 * Sentences, spacing, and FAQ pairs already present on that page's
 * origin/main copy are an inherited baseline. Checkers may exempt those
 * inherited strings. That exemption is a ratchet: it does not apply when
 * the baseline cannot be read. A missing baseline is a hard error. It is
 * never a pass with zero pages, and it is never treated as an empty
 * origin page that makes every current sentence look new.
 *
 * Resolution order:
 *   1. An explicit --base path, or PRESERVATION_BASE when the caller
 *      forwards it. If that path has no HTML, exit 1.
 *   2. /tmp/main-tree when it already contains HTML.
 *   3. A detached git worktree of origin/main (fetched if needed) at
 *      /tmp/origin-main-baseline.
 *
 * The nine renamed how-big guides are mapped both ways. An old href is
 * satisfied by the new slug.
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const RENAMES = {
  "guides/how-big-do-belgian-malinoiss-get.html": "guides/how-big-do-belgian-malinois-get.html",
  "guides/how-big-do-belgian-tervurens-get.html": "guides/how-big-do-belgian-tervuren-get.html",
  "guides/how-big-do-bichon-frises-get.html": "guides/how-big-do-bichon-frise-get.html",
  "guides/how-big-do-chinese-shar-peis-get.html": "guides/how-big-do-chinese-shar-pei-get.html",
  "guides/how-big-do-great-pyreneess-get.html": "guides/how-big-do-great-pyrenees-get.html",
  "guides/how-big-do-havaneses-get.html": "guides/how-big-do-havanese-get.html",
  "guides/how-big-do-malteses-get.html": "guides/how-big-do-maltese-get.html",
  "guides/how-big-do-shiba-inus-get.html": "guides/how-big-do-shiba-inu-get.html",
  "guides/how-big-do-siberian-huskys-get.html": "guides/how-big-do-siberian-husky-get.html",
};

export const FROM_CURRENT = Object.fromEntries(Object.entries(RENAMES).map(([origin, current]) => [current, origin]));

// The rename map still names the pre-merge plural files. Once those files
// are gone from origin/main, compare the live slug to itself. A missing
// plural file must not look like an empty origin page.
export function originFile(base, rel) {
  const mapped = FROM_CURRENT[rel];
  if (mapped && fs.existsSync(path.join(base, mapped))) return mapped;
  return rel;
}

export const HREF_RENAMES = {
  "/guides/how-big-do-belgian-malinoiss-get": "/guides/how-big-do-belgian-malinois-get",
  "/guides/how-big-do-belgian-tervurens-get": "/guides/how-big-do-belgian-tervuren-get",
  "/guides/how-big-do-bichon-frises-get": "/guides/how-big-do-bichon-frise-get",
  "/guides/how-big-do-chinese-shar-peis-get": "/guides/how-big-do-chinese-shar-pei-get",
  "/guides/how-big-do-great-pyreneess-get": "/guides/how-big-do-great-pyrenees-get",
  "/guides/how-big-do-havaneses-get": "/guides/how-big-do-havanese-get",
  "/guides/how-big-do-malteses-get": "/guides/how-big-do-maltese-get",
  "/guides/how-big-do-shiba-inus-get": "/guides/how-big-do-shiba-inu-get",
  "/guides/how-big-do-siberian-huskys-get": "/guides/how-big-do-siberian-husky-get",
  "/breeds/dogs/pembroke-welsh-corgi/best-food": "/commercial/dogs/pembroke-welsh-corgi/best-food",
  "/breeds/dogs/pembroke-welsh-corgi/best-insurance": "/commercial/dogs/pembroke-welsh-corgi/best-insurance",
  "/breeds/dogs/pembroke-welsh-corgi/cost-to-own": "/commercial/dogs/pembroke-welsh-corgi/cost-to-own",
};

const CACHE = "/tmp/origin-main-baseline";

function fail(detail) {
  console.error(
    `origin baseline missing: ${detail} Checkers fail closed without origin/main. Sentences already on a page's origin/main copy are exempt only after that tree is read. A missing baseline is a failure, not a pass.`
  );
  process.exit(1);
}

export function hasHtml(dir) {
  if (!dir || !fs.existsSync(dir)) return false;
  const stack = [dir];
  let seen = 0;
  while (stack.length && seen < 8000) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return false;
    }
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      seen += 1;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith(".html")) return true;
    }
  }
  return false;
}

function originSha(root) {
  try {
    return execFileSync("git", ["rev-parse", "origin/main"], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    const fetched = spawnSync("git", ["fetch", "origin", "main"], { cwd: root, encoding: "utf8" });
    if (fetched.status !== 0) return "";
    try {
      return execFileSync("git", ["rev-parse", "origin/main"], { cwd: root, encoding: "utf8" }).trim();
    } catch {
      return "";
    }
  }
}

function materialize(root) {
  const sha = originSha(root);
  if (!sha) return "";
  const stamp = path.join(CACHE, ".baseline-sha");
  if (hasHtml(CACHE) && fs.existsSync(stamp) && fs.readFileSync(stamp, "utf8").trim() === sha) return CACHE;
  spawnSync("git", ["worktree", "remove", "--force", CACHE], { cwd: root, encoding: "utf8" });
  fs.rmSync(CACHE, { recursive: true, force: true });
  const added = spawnSync("git", ["worktree", "add", "--detach", CACHE, sha], { cwd: root, encoding: "utf8" });
  if (added.status !== 0 || !hasHtml(CACHE)) return "";
  fs.writeFileSync(stamp, `${sha}\n`);
  return CACHE;
}

export function resolveOriginBase({ root, explicit }) {
  if (explicit) {
    const dir = path.resolve(explicit);
    if (!hasHtml(dir)) fail(`${dir} has no HTML pages.`);
    return dir;
  }
  if (process.env.PRESERVATION_BASE) {
    const dir = path.resolve(process.env.PRESERVATION_BASE);
    if (!hasHtml(dir)) fail(`PRESERVATION_BASE=${dir} has no HTML pages.`);
    return dir;
  }
  if (hasHtml("/tmp/main-tree")) return "/tmp/main-tree";
  const cached = materialize(root);
  if (!cached) fail("could not read /tmp/main-tree or fetch origin/main into a worktree.");
  return cached;
}

export function hrefSatisfied(originHref, currentHrefs) {
  if (currentHrefs.has(originHref)) return true;
  const bare = originHref.replace(/\.html$/i, "");
  const alias = HREF_RENAMES[bare] || HREF_RENAMES[originHref];
  if (!alias) return false;
  return currentHrefs.has(alias) || currentHrefs.has(`${alias}.html`);
}
