import { defineConfig } from "vitest/config";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Several tests hold the site to ADE's own code (roles, colours, the MCP
 * catalog, palette commands), so they need a checkout of better-ade/ade-terminal.
 * ADE_TERMINAL_DIR names it; otherwise ./ade-terminal (what CI checks out) or a
 * sibling ../ade-terminal clone is used.
 */
function adeTerminalDir(): string {
  const env = process.env.ADE_TERMINAL_DIR;
  const candidates = env ? [resolve(env)] : [resolve(__dirname, "ade-terminal"), resolve(__dirname, "../ade-terminal")];
  const found = candidates.find((dir) => existsSync(resolve(dir, "src/data/agentColors.ts")));
  if (!found) {
    throw new Error(`No ade-terminal checkout found (tried ${candidates.join(", ")}). Clone better-ade/ade-terminal or set ADE_TERMINAL_DIR.`);
  }
  return found;
}

const ADE = adeTerminalDir();

export default defineConfig({
  resolve: { alias: { "@ade": ADE } },
  server: { fs: { allow: [__dirname, ADE] } },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts"],
    env: { ADE_TERMINAL_DIR: ADE },
  },
});
