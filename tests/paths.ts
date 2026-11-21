import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** The Jekyll source of the site. */
export const SITE = resolve(__dirname, "../site");
/** The ade-terminal checkout the tests compare against (set by vitest.config.ts). */
export const ADE = process.env.ADE_TERMINAL_DIR!;

export const site = (path: string) => resolve(SITE, path);
export const ade = (path: string) => resolve(ADE, path);
export const readSite = (path: string) => readFileSync(site(path), "utf8");
export const readAde = (path: string) => readFileSync(ade(path), "utf8");
