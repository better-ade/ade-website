import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { REPOS, builtPages, isRedirect, parse, readBuilt, readRepo, readSite } from "./paths";

/**
 * The truth rule (docs/messaging.md): every claim matches what is merged on `main` today, and anything not merged
 * is labelled Coming. These tests hold the built pages to checkouts of the repos they describe, so a renamed
 * command, a removed script or a new release makes the build fail instead of leaving the site wrong.
 */
const PAGES = builtPages()
  .map((path) => ({ path, doc: parse(readBuilt(path)) }))
  .filter((p) => !isRedirect(p.doc));
const page = (path: string) => PAGES.find((p) => p.path === path)!.doc;

/**
 * True when the element, or the list item, table row, paragraph, quote or card around it, carries a Coming label.
 * A layout's own article (`.prose`, the whole page body) is not a card: one label on a page must not cover the rest.
 */
function labelledComing(el: Element): boolean {
  if (el.querySelector(".coming") || el.classList.contains("coming")) return true;
  const around = el.parentElement?.closest("li, tr, p, blockquote, article:not(.prose)");
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

/** The commands `ade help` lists (the usage heredoc): the first word of each indented line. */
function adeHelp(): Set<string> {
  const src = readRepo("cli", "ade");
  const help = src.slice(src.indexOf("usage() {"), src.indexOf("\nHELP\n", src.indexOf("usage() {")));
  return new Set([...help.matchAll(/^  ([a-z][a-z-]*)\s/gm)].map((m) => m[1]));
}

/** The subcommands ade-secrets dispatches (the last `case "$cmd" in` of bin/ade-secrets). */
function secretsCommands(): Set<string> {
  const src = readRepo("secrets", "bin/ade-secrets");
  const table = src.slice(src.lastIndexOf('case "$cmd" in'));
  const out = new Set<string>();
  for (const m of table.matchAll(/^\s+([a-z|-]+)\)/gm)) for (const c of m[1].split("|")) if (/^[a-z]+$/.test(c)) out.add(c);
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

  it("every `ade <command>` not labelled Coming is one `ade help` lists", () => {
    const help = adeHelp();
    expect(help.has("files") && help.has("update") && help.has("setup")).toBe(true);
    const wrong: string[] = [];
    for (const { path, el } of codes) {
      for (const m of (el.textContent ?? "").matchAll(/(?:^|[\s;(])ade ([a-z][a-z-]*)/gm)) {
        if (!help.has(m[1]) && !labelledComing(el)) wrong.push(`${path}: ade ${m[1]}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it("every `ade-secrets <command>` is one bin/ade-secrets dispatches", () => {
    const real = secretsCommands();
    expect(real.has("vault") && real.has("set")).toBe(true);
    const named: string[] = [];
    const wrong: string[] = [];
    for (const { path, el } of codes) {
      for (const m of (el.textContent ?? "").matchAll(/(?:^|[\s;(])ade-secrets ([a-z]+)/gm)) {
        named.push(m[1]);
        if (!real.has(m[1]) && !labelledComing(el)) wrong.push(`${path}: ade-secrets ${m[1]}`);
      }
    }
    expect(named.length).toBeGreaterThan(0);
    expect(wrong).toEqual([]);
  });

  it("every `prefix <key>` on the ade ui page is in ade ui's own key list (UI_KEYS, shown by prefix ?)", () => {
    const src = readRepo("cli", "ade");
    const list = /^UI_KEYS="([^"]*)"/m.exec(src)![1];
    const bound = new Set([...list.matchAll(/^\s*prefix (\S+)\s/gm)].map((m) => m[1]));
    expect(bound.has("e") && bound.has("l")).toBe(true);
    const named: string[] = [];
    for (const row of page("guide/ui/index.html").querySelectorAll("tr")) {
      const kbd = [...row.querySelectorAll("td:first-child kbd")].map((k) => k.textContent ?? "");
      if (kbd[0] !== "prefix" || kbd.length !== 2 || !/^[a-z?]$/.test(kbd[1]) || labelledComing(row)) continue;
      named.push(kbd[1]);
    }
    expect(named).toEqual(expect.arrayContaining(["a", "t", "e", "l"]));
    for (const k of named) expect(bound.has(k), `prefix ${k}`).toBe(true);
  });

  it("the connectors named are ade-skills plugins, and each asks before every change", () => {
    const plugins: { name: string; description: string }[] = JSON.parse(readRepo("skills", ".claude-plugin/marketplace.json")).plugins;
    const named = PAGES.flatMap(({ doc }) => [...doc.querySelectorAll('[data-truth="plugins"] code')].map((c) => c.textContent ?? ""));
    expect(named).toEqual(expect.arrayContaining(["clickup", "jira", "linear", "orgo"]));
    for (const n of named) {
      const p = plugins.find((x) => x.name === n);
      expect(p, n).toBeTruthy();
      // Orgo's reads are free and "everything else through this server ... asks".
      expect(p!.description, n).toMatch(/(every change|everything else) through this server\b[^;]*\basks/);
    }
  });

  it("every other ade-skills plugin a page names (the guard, the install-ADE skill's plugin) is in the marketplace", () => {
    const plugins: { name: string }[] = JSON.parse(readRepo("skills", ".claude-plugin/marketplace.json")).plugins;
    const named = PAGES.flatMap(({ doc }) => [...doc.querySelectorAll('[data-truth="plugin"]')].map((c) => c.textContent ?? ""));
    expect(named).toContain("guard");
    for (const n of named) expect(plugins.map((x) => x.name), n).toContain(n);
    // The skill the pages name for Orgo is one the orgo plugin ships.
    expect(existsSync(resolve(REPOS.skills, "plugins/orgo/skills/install-ade/SKILL.md"))).toBe(true);
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

  it("the release numbers the pages show (site/_data/releases.yml) are each repo's VERSION on main", () => {
    const data = Object.fromEntries(
      [...readSite("_data/releases.yml").matchAll(/^([a-z_]+):\s*(\S+)\s*$/gm)].map((m) => [m[1], m[2]]),
    );
    const repos = { ade_cli: "cli", ade_brain: "brain", ade_skills: "skills", ade_secrets: "secrets" } as const;
    expect(Object.keys(data).sort()).toEqual(Object.keys(repos).sort());
    for (const [k, repo] of Object.entries(repos)) expect(data[k], k).toBe(readRepo(repo, "VERSION").trim());
  });

  it("Get started names the release the one-line installer installs today (ade-cli's VERSION on main)", () => {
    const version = readRepo("cli", "VERSION").trim();
    expect(page("get-started/index.html").body.textContent).toContain(`v${version}`);
  });

  it("the Repos page gives each repo the verification command its CI runs", () => {
    const rows = [...page("repos/index.html").querySelectorAll("tbody tr")];
    const dirs = { "ade-cli": "cli", "ade-brain": "brain", "ade-method": "method", "ade-agent-registry": "registry", "ade-skills": "skills", "ade-secrets": "secrets" } as const;
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
  ["the GLM and Muse providers", /\b(GLM|Muse)\b/i],
  ["the Kimi and ChatGPT providers (nothing for either is in ade-cli yet)", /\b(Kimi|ChatGPT)\b/i],
  ["ade key and ade vault inside ade, and the hub's keys on ade-secrets (ade-cli A13, A14; ade-brain H2)", /\bade (key|vault)\b|keys` on ade-secrets/i],
  ["the Gemini CLI in ade setup's live test", /live test[^.|]*Gemini|Gemini[^.|]*live test/i],
  ["an Anthropic API key or DeepSeek for the orchestrator", /(API key|DeepSeek) for the orchestrator|API key kept in the hub/i],
  ["connectors beyond ClickUp, Jira, Linear and Orgo, and ade connect (ade-skills K1b to K7; ade-cli A16)", /\b(GitHub|Gmail|Slack|Outlook|Teams|Discord) connector|\bade connect\b/i],
  ["ade project add, list and --scan (ade-cli A21)", /\bade project\b/i],
  ["Telegram pairing without typing commands", /pair(ing|ed)?\b[^.]*without typing/i],
  ["approval buttons for focus agents", /approval buttons/i],
  ["the Telegram commands /status, /progress, /start and /stop", /(?:^|[\s(,])\/(status|progress|start|stop)\b/],
  ["ADE Computer in the cloud", /\bin the cloud\b|\bFly(\.io)?\b/],
  ["the codesec plugin", /\bcodesec\b/i],
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

  it("the home page's Coming list names every item on the list above, each with its own label", () => {
    const items = [...page("index.html").querySelectorAll("#coming li")];
    for (const li of items) expect(li.querySelector(".coming"), li.textContent ?? "").not.toBeNull();
    const text = items.map((li) => li.textContent ?? "").join("\n");
    for (const [name, re] of NOT_MERGED) expect(re.test(text), name).toBe(true);
  });

  it("the label is never empty and always reads Coming", () => {
    for (const { path, doc } of PAGES) for (const c of doc.querySelectorAll(".coming")) expect(c.textContent, path).toBe("Coming");
  });
});
