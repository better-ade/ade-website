import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

/** The Jekyll source of the site. */
export const SITE = resolve(__dirname, "../site");
/** The built site. The verification command builds it before `npm test`. */
export const BUILT = resolve(__dirname, "../_site");

export const site = (path: string) => resolve(SITE, path);
export const readSite = (path: string) => readFileSync(site(path), "utf8");

/**
 * Checkouts of the repos the site makes claims about (vitest.config.ts finds them). The truth tests read `main`
 * of each, so a page cannot claim what the code does not do.
 */
export const REPOS = {
  cli: process.env.ADE_CLI_DIR!,
  brain: process.env.ADE_BRAIN_DIR!,
  method: process.env.ADE_METHOD_DIR!,
  registry: process.env.ADE_REGISTRY_DIR!,
  skills: process.env.ADE_SKILLS_DIR!,
};
export const readRepo = (repo: keyof typeof REPOS, path: string) => readFileSync(resolve(REPOS[repo], path), "utf8");

/** Every HTML page of the built site, as a path relative to _site (e.g. "guide/ui/index.html"). */
export function builtPages(): string[] {
  if (!existsSync(join(BUILT, "index.html"))) {
    throw new Error(`No built site at ${BUILT}. Build it first: bundle exec jekyll build -s site -d _site`);
  }
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith(".html")) out.push(relative(BUILT, p));
    }
  };
  walk(BUILT);
  return out.sort();
}

export const readBuilt = (path: string) => readFileSync(join(BUILT, path), "utf8");
export const parse = (html: string) => new DOMParser().parseFromString(html, "text/html");

/** A page that only points somewhere else (an old address). */
export const isRedirect = (doc: Document) => !!doc.querySelector('meta[http-equiv="refresh"]');
