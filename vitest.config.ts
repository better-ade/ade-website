import { defineConfig } from "vitest/config";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The truth tests hold the site to the code it describes, so they read checkouts of the better-ade repos at `main`.
 * Each is named by its environment variable; otherwise ./repos/<name> (what CI checks out) or a sibling ../<name>.
 */
const REPOS: Record<string, { name: string; marker: string }> = {
  ADE_CLI_DIR: { name: "ade-cli", marker: "ade" },
  ADE_BRAIN_DIR: { name: "ade-brain", marker: "bin/lib.sh" },
  ADE_METHOD_DIR: { name: "ade-method", marker: "ade.json" },
  ADE_REGISTRY_DIR: { name: "ade-agent-registry", marker: "registry.json" },
  ADE_SKILLS_DIR: { name: "ade-skills", marker: ".claude-plugin/marketplace.json" },
  ADE_SECRETS_DIR: { name: "ade-secrets", marker: "bin/ade-secrets" },
};

function find(env: string): string {
  const { name, marker } = REPOS[env];
  const given = process.env[env];
  const candidates = given ? [resolve(given)] : [resolve(__dirname, "repos", name), resolve(__dirname, "..", name)];
  const found = candidates.find((dir) => existsSync(resolve(dir, marker)));
  if (!found) {
    throw new Error(`No ${name} checkout found (tried ${candidates.join(", ")}). Clone better-ade/${name} or set ${env}.`);
  }
  return found;
}

const env = Object.fromEntries(Object.keys(REPOS).map((k) => [k, find(k)]));

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts"],
    env,
  },
});
