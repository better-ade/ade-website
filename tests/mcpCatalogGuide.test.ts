import { describe, expect, it } from "vitest";
import { readAde, readSite } from "./paths";
import { MCP_CATALOG } from "@ade/src/data/mcpCatalog";

/**
 * The guide describes the MCP library and the rules Orgo's install writes.
 * Those are claims about the app, so they are checked against it: a server
 * added to the catalog, or a glob added to `orgo_rules.rs`, must reach the
 * guide too. (The README's count is checked in ade-terminal.)
 */
const guide = readSite("guide/integrations.md");

/** MCP_ASK as Rust defines it. */
function mcpAsk(): string[] {
  const src = readAde("src-tauri/src/orgo_rules.rs");
  const start = src.indexOf("pub const MCP_ASK");
  const block = src.slice(start, src.indexOf("];", start));
  return [...block.matchAll(/"(mcp__[^"]+)"/g)].map((m) => m[1]);
}

/** A server's name with any parenthesised text removed. */
const bare = (name: string) => name.replace(/\([^)]*\)/g, "").trim();

describe("the MCP guide", () => {
  it("the guide's table lists exactly the catalog", () => {
    const library = guide.slice(guide.indexOf("## MCP library"), guide.indexOf("\n## ", guide.indexOf("## MCP library") + 1));
    const rows = library.split("\n").filter((l) => /^\| [^-|][^|]* \| .+ \|$/.test(l) && !l.startsWith("| Group |"));
    expect(rows.length).toBeGreaterThan(0);
    const listed = rows.flatMap((row) => bare(row.split("|")[2]).split(",").map((s) => bare(s))).filter(Boolean);
    expect(new Set(listed).size).toBe(listed.length);
    expect(new Set(listed)).toEqual(new Set(MCP_CATALOG.map((e) => bare(e.name))));
  });

  it("the Orgo section matches the rules ADE writes", () => {
    const start = guide.indexOf("## Orgo cloud computers");
    expect(start).toBeGreaterThan(-1);
    const next = guide.indexOf("\n## ", start + 1);
    const section = guide.slice(start, next === -1 ? undefined : next);
    const ask = mcpAsk();
    expect(ask).toHaveLength(31);
    for (const glob of ask) expect(section, glob).toContain(`\`${glob}\``);
    for (const word of ["subfolder", "worktree", "Continuous", "/mcp", "until you delete", "auto top-up", "allowManagedPermissionRulesOnly", "reorder",
      "part-way", "never the other way round", "home folder", "your hooks run", "10 seconds"]) {
      expect(section, word).toContain(word);
    }
  });

});
