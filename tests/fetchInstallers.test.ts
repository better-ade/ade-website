import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

/**
 * The site serves ADE's installers at /install.sh and /install.ps1, but they
 * live (and are tested against releases) in ade-terminal. The Pages build
 * copies them in with scripts/fetch-installers.sh: from the latest release tag
 * when it has both, else from main. Here the GitHub API and raw hosts are
 * stood in for by file:// trees.
 */
const SCRIPT = resolve(__dirname, "../scripts/fetch-installers.sh");
const REPO = "better-ade/ade-terminal";

function fixture(opts: { latest?: string; refs: Record<string, { sh?: string; ps1?: string }> }) {
  const root = mkdtempSync(join(tmpdir(), "fetch-installers-"));
  const api = join(root, "api");
  const raw = join(root, "raw");
  if (opts.latest) {
    const p = join(api, "repos", REPO, "releases", "latest");
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, JSON.stringify({ tag_name: opts.latest, name: `ADE ${opts.latest}` }));
  }
  for (const [ref, files] of Object.entries(opts.refs)) {
    const docs = join(raw, REPO, ref, "docs");
    mkdirSync(docs, { recursive: true });
    if (files.sh !== undefined) writeFileSync(join(docs, "install.sh"), files.sh);
    if (files.ps1 !== undefined) writeFileSync(join(docs, "install.ps1"), files.ps1);
  }
  const dest = join(root, "site");
  mkdirSync(dest);
  const run = () =>
    spawnSync("bash", [SCRIPT, dest], {
      encoding: "utf8",
      env: { ...process.env, ADE_REPO: REPO, ADE_API: `file://${api}`, ADE_RAW: `file://${raw}`, GITHUB_TOKEN: "" },
    });
  return { dest, run };
}

const sh = (ref: string) => `#!/usr/bin/env bash\necho ${ref}\n`;
const ps1 = (ref: string) => `# ADE installer ${ref}\nWrite-Host ${ref}\n`;

describe("fetch-installers.sh", () => {
  it("copies both installers from the latest release tag", () => {
    const f = fixture({ latest: "v1.2.3", refs: { "v1.2.3": { sh: sh("tag"), ps1: ps1("tag") }, main: { sh: sh("main"), ps1: ps1("main") } } });
    const r = f.run();
    expect(r.status, r.stderr).toBe(0);
    expect(readFileSync(join(f.dest, "install.sh"), "utf8")).toBe(sh("tag"));
    expect(readFileSync(join(f.dest, "install.ps1"), "utf8")).toBe(ps1("tag"));
    expect(r.stdout).toContain("v1.2.3");
  });

  it("falls back to main when there is no release", () => {
    const f = fixture({ refs: { main: { sh: sh("main"), ps1: ps1("main") } } });
    const r = f.run();
    expect(r.status, r.stderr).toBe(0);
    expect(readFileSync(join(f.dest, "install.sh"), "utf8")).toBe(sh("main"));
    expect(readFileSync(join(f.dest, "install.ps1"), "utf8")).toBe(ps1("main"));
    expect(r.stdout).toContain("main");
  });

  it("takes the pair from main when the tag lacks one of them, never a mix", () => {
    const f = fixture({ latest: "v1.2.3", refs: { "v1.2.3": { sh: sh("tag") }, main: { sh: sh("main"), ps1: ps1("main") } } });
    const r = f.run();
    expect(r.status, r.stderr).toBe(0);
    expect(readFileSync(join(f.dest, "install.sh"), "utf8")).toBe(sh("main"));
    expect(readFileSync(join(f.dest, "install.ps1"), "utf8")).toBe(ps1("main"));
  });

  it("fails, writing nothing, when neither ref has the installers", () => {
    const f = fixture({ latest: "v1.2.3", refs: { main: { sh: sh("main") } } });
    const r = f.run();
    expect(r.status).not.toBe(0);
    expect(existsSync(join(f.dest, "install.sh"))).toBe(false);
    expect(existsSync(join(f.dest, "install.ps1"))).toBe(false);
  });

  it("rejects an install.sh that is not a shell script", () => {
    const f = fixture({ refs: { main: { sh: "<!DOCTYPE html><p>Not Found</p>", ps1: ps1("main") } } });
    const r = f.run();
    expect(r.status).not.toBe(0);
    expect(existsSync(join(f.dest, "install.sh"))).toBe(false);
  });
});
