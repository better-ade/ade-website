import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { REPOS, builtPages, isRedirect, parse, readBuilt, readRepo } from "./paths";

/**
 * The truth rule (docs/messaging.md): every claim matches what is merged on `main` today, and anything not merged
 * is labelled Coming. These tests hold the built pages to checkouts of the repos they describe, so a renamed
 * command, a removed script or a new release makes the build fail instead of leaving the site wrong.
 */
const PAGES = builtPages()
  .map((path) => ({ path, doc: parse(readBuilt(path)) }))
  .filter((p) => !isRedirect(p.doc));
const page = (path: string) => PAGES.find((p) => p.path === path)!.doc;

/** True when the element, or the list item, table row, paragraph or quote around it, carries a Coming label. */
function labelledComing(el: Element): boolean {
  if (el.querySelector(".coming") || el.classList.contains("coming")) return true;
  const around = el.parentElement?.closest("li, tr, p, blockquote, article");
  return !!around && !!around.querySelector(".coming");
}

/** The subcommands ade-cli's main dispatches (the `case "$cmd" in` at the end of the script). */
function adeCommands(): Set<string> {
  const src = readRepo("cli", "ade");
  const table = src.slice(src.lastIndexOf('case "$cmd" in'));
  const out = new Set<string>();
  for (const m of table.matchAll(/^\s+([a-z|"-]+)\)/gm)) for (const c of m[1].split("|")) if (/^[a-z][a-z-]*$/.test(c)) out.add(c);
  return out;
}

describe("commands and scripts the pages name exist on main", () => {
  const codes = PAGES.flatMap(({ path, doc }) => [...doc.querySelectorAll("main code")].map((el) => ({ path, el })));

  it("every `ade <command>` is one ade-cli dispatches, or is labelled Coming", () => {
    const real = adeCommands();
    expect(real.has("setup") && real.has("ui") && real.has("dispatch")).toBe(true);
    const wrong: string[] = [];
    for (const { path, el } of codes) {
      for (const m of (el.textContent ?? "").matchAll(/(?:^|[\s;(])ade ([a-z][a-z-]*)/gm)) {
        if (!real.has(m[1]) && !labelledComing(el)) wrong.push(`${path}: ade ${m[1]}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it("every `bin/<script>` is a script in ade-brain's bin/", () => {
    const wrong: string[] = [];
    for (const { path, el } of codes) {
      for (const m of (el.textContent ?? "").matchAll(/(?<![\w./~])bin\/([a-z][a-z0-9.-]*)/g)) {
        if (!existsSync(resolve(REPOS.brain, "bin", m[1])) && !labelledComing(el)) wrong.push(`${path}: bin/${m[1]}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it("the specialists and plugins named are the ones in ade-agent-registry and ade-skills", () => {
    const home = page("index.html");
    const roles: { name: string }[] = JSON.parse(readRepo("registry", "registry.json")).roles;
    const plugins: { name: string }[] = JSON.parse(readRepo("skills", ".claude-plugin/marketplace.json")).plugins;
    const named = [...home.querySelectorAll("#who code")].map((c) => c.textContent);
    expect(roles.map((r) => r.name)).toEqual(expect.arrayContaining(["forward-deployed", "support"]));
    for (const n of ["forward-deployed", "support"]) expect(named).toContain(n);
    expect(plugins.map((p) => p.name)).toContain("fde");
    expect(named).toContain("fde");
  });
});

describe("numbers and versions", () => {
  const home = page("index.html").body.textContent ?? "";

  it("the core roles are ade-method's, by count and by name", () => {
    const core: { name: string }[] = JSON.parse(readRepo("method", "ade.json")).core_roles;
    expect(home).toContain(`${core.length} core roles`);
    expect(home).toContain(`from ade-method: ${core.map((r) => r.name).join(", ")}`);
  });

  it("the specialist count is ade-agent-registry's, and the Repos page lists each one", () => {
    const roles: { name: string }[] = JSON.parse(readRepo("registry", "registry.json")).roles;
    expect(home).toContain(`${roles.length} specialists`);
    const row = [...page("repos/index.html").querySelectorAll("tr")].find((tr) => tr.textContent?.includes("ade-agent-registry"))!;
    const text = (row.textContent ?? "").toLowerCase();
    for (const r of roles) expect(text, r.name).toContain(r.name.replace(/-/g, " "));
  });

  it("Get started names the release the one-line installer installs today (ade-cli's VERSION on main)", () => {
    const version = readRepo("cli", "VERSION").trim();
    expect(page("get-started/index.html").body.textContent).toContain(`v${version}`);
  });

  it("the Repos page gives each repo the verification command its CI runs", () => {
    const rows = [...page("repos/index.html").querySelectorAll("tbody tr")];
    const dirs = { "ade-cli": "cli", "ade-brain": "brain", "ade-method": "method", "ade-agent-registry": "registry", "ade-skills": "skills" } as const;
    for (const [name, key] of Object.entries(dirs)) {
      const ci = readRepo(key, ".github/workflows/ci.yml");
      const command = /command:\s*"([^"]+)"/.exec(ci)![1];
      const row = rows.find((tr) => tr.querySelector("td a")?.textContent === name)!;
      expect(row, name).toBeTruthy();
      expect(row.querySelectorAll("td")[2].textContent, name).toBe(command);
    }
  });

  it("the hero's terminal output is ade-cli's own suite list", () => {
    const shown = [...page("index.html").querySelectorAll(".term")].map((t) => t.textContent ?? "").join("\n");
    const suites = [...shown.matchAll(/ok\s+(test_[a-z_]+\.sh)/g)].map((m) => m[1]);
    expect(suites.length).toBeGreaterThan(0);
    for (const s of suites) expect(existsSync(resolve(REPOS.cli, "tests", s)), s).toBe(true);
  });
});

/**
 * Work that is not merged on main today. Wherever a page mentions one, a Coming label sits beside it. When one is
 * merged, take it off this list and drop its labels in the same change.
 */
const NOT_MERGED: [string, RegExp][] = [
  ["crash recovery (ade-brain R1)", /crash recovery/i],
  ["the ade-secrets vault, ade key, ade vault (ade-secrets S1, S2; ade-cli A13, A14)", /\bvault\b|ade-secrets|\bade key\b/i],
  ["restoring connections (ade-cli A10)", /restor(e|ing) connections|ade restore/i],
  ["self-update (ade-cli A11, A12)", /self-update|ade update|auto-update/i],
  ["the file viewer (ade-cli A15)", /file viewer/i],
  ["server mode (ade-brain V2)", /server mode/i],
  ["Gemini, GLM and Muse providers (ade-brain E1, providers)", /\b(Gemini|GLM|Muse)\b/],
  ["a tab per focus agent in ade ui (ade-brain V1)", /tab per focus agent/i],
  ["Telegram approvals and talking to focus agents (ade-brain C7)", /buttons|talking to focus agents/i],
  ["the hub on Linux (ade-brain V1)", /hub on Linux/i],
];

describe("not merged yet is labelled Coming", () => {
  it.each(NOT_MERGED)("%s", (_name, re) => {
    const unlabelled: string[] = [];
    for (const { path, doc } of PAGES) {
      for (const el of doc.querySelectorAll("main p, main li, main td, main h2, main h3, main figcaption, main summary")) {
        // Check the innermost block that says it: a paragraph inside a list item is judged on its own.
        if (el.querySelector("p, li, td")) continue;
        const text = el.textContent ?? "";
        if (!re.test(text)) continue;
        if (/^\s*Coming\b/.test(text) || labelledComing(el)) continue;
        unlabelled.push(`${path}: "${text.trim().slice(0, 90)}"`);
      }
    }
    expect(unlabelled).toEqual([]);
  });

  it("the label is never empty and always reads Coming", () => {
    for (const { path, doc } of PAGES) for (const c of doc.querySelectorAll(".coming")) expect(c.textContent, path).toBe("Coming");
  });
});
