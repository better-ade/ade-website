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

/** True when the element is in the one quiet "Later:" line (what is neither released nor next). */
const inLater = (el: Element) => !!el.closest(".later");

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

  it("every `ade <command>` is one ade-cli dispatches, or is labelled Coming, or is in the Later line", () => {
    const real = adeCommands();
    expect(real.has("setup") && real.has("ui") && real.has("dispatch")).toBe(true);
    const wrong: string[] = [];
    for (const { path, el } of codes) {
      for (const m of (el.textContent ?? "").matchAll(/(?:^|[\s;(])ade ([a-z][a-z-]*)/gm)) {
        if (!real.has(m[1]) && !labelledComing(el) && !inLater(el)) wrong.push(`${path}: ade ${m[1]}`);
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
        if (!help.has(m[1]) && !labelledComing(el) && !inLater(el)) wrong.push(`${path}: ade ${m[1]}`);
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

  it("every `prefix <key>` a page names is in ade ui's own key list (UI_KEYS, shown by prefix ?)", () => {
    const src = readRepo("cli", "ade");
    const list = /^UI_KEYS="([^"]*)"/m.exec(src)![1];
    const bound = new Set([...list.matchAll(/^\s*prefix (\S+)\s/gm)].map((m) => m[1]));
    expect(bound.has("e") && bound.has("l")).toBe(true);
    // The ade ui guide page, with its table of keys, is gone; Get started still names four of them.
    const named: string[] = [];
    for (const { doc } of PAGES) {
      for (const k of doc.querySelectorAll("main kbd")) {
        const next = k.nextElementSibling;
        if (k.textContent !== "prefix" || next?.tagName !== "KBD" || labelledComing(k.parentElement!)) continue;
        expect(next.textContent, "a single key after prefix").toMatch(/^[a-z?]$/);
        named.push(next.textContent!);
      }
    }
    expect(named).toEqual(expect.arrayContaining(["f", "?", "d", "e"]));
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

  it("the specialist count is ade-agent-registry's", () => {
    const roles: { name: string }[] = JSON.parse(readRepo("registry", "registry.json")).roles;
    expect(home).toContain(`${roles.length} specialists`);
  });

  it("the release numbers the pages show (site/_data/releases.yml) are each repo's VERSION on main", () => {
    const data = Object.fromEntries(
      [...readSite("_data/releases.yml").matchAll(/^([a-z_]+):\s*(\S+)\s*$/gm)].map((m) => [m[1], m[2]]),
    );
    const repos = { ade_cli: "cli", ade_brain: "brain", ade_skills: "skills", ade_secrets: "secrets", ade_method: "method", ade_agent_registry: "registry" } as const;
    expect(Object.keys(data).sort()).toEqual(Object.keys(repos).sort());
    for (const [k, repo] of Object.entries(repos)) expect(data[k], k).toBe(readRepo(repo, "VERSION").trim());
  });

  it("Get started names the release the one-line installer installs today (ade-cli's VERSION on main)", () => {
    const version = readRepo("cli", "VERSION").trim();
    expect(page("get-started/index.html").body.textContent).toContain(`v${version}`);
  });

  it("the home page gives each repo the verification command its CI runs", () => {
    // The Repos page, with its table, is gone. The home page's "Isn't this just prompts?" answer names the same
    // commands: each `command` in code, followed by "in" and the repos that are held to it.
    const answer = [...page("index.html").querySelectorAll("#faq details")].find((d) => /just prompts/.test(d.querySelector("summary")!.textContent ?? ""))!;
    const claimed: Record<string, string> = {};
    for (const code of answer.querySelectorAll("p code")) {
      let after = "";
      for (let n = code.nextSibling; n && n.nodeName !== "CODE"; n = n.nextSibling) after += n.textContent ?? "";
      if (!/^\s+in\s/.test(after)) continue;
      for (const m of after.split(".")[0].matchAll(/\bade-[a-z-]+/g)) claimed[m[0]] = code.textContent ?? "";
    }
    const dirs = { "ade-cli": "cli", "ade-brain": "brain", "ade-method": "method", "ade-agent-registry": "registry", "ade-skills": "skills", "ade-secrets": "secrets" } as const;
    expect(Object.keys(claimed).sort()).toEqual(Object.keys(dirs).sort());
    for (const [name, key] of Object.entries(dirs)) {
      const ci = readRepo(key, ".github/workflows/ci.yml");
      const command = /command:\s*"([^"]+)"/.exec(ci)![1];
      expect(claimed[name], name).toBe(command);
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
 * Work that is not merged on main today and is next. Wherever a page mentions one, a Coming label sits beside it. When
 * one is merged, take it off this list and drop its labels in the same change.
 */
const NOT_MERGED: [string, RegExp][] = [
  ["the GLM and Muse providers", /\b(GLM|Muse)\b/i],
  ["the Gemini CLI in ade setup's live test", /live test[^.|]*Gemini|Gemini[^.|]*live test/i],
  ["an Anthropic API key or DeepSeek for the orchestrator", /(API key|DeepSeek) for the orchestrator|API key kept in the hub/i],
  // ade connect (ade-cli A16) is merged; the recipes it reads for these services are `held` in ade-skills (K7 makes
  // GitHub and Gmail ready). tests/siteNarrative.test.ts holds the home page's list to each recipe's state.
  ["the connectors beyond ClickUp, Jira and Linear (held recipes in ade-skills)", /\b(GitHub|Gmail|Slack|Outlook|Teams|Discord) connectors?\b|\b(Gmail|Slack|Outlook|Discord)\b|\bade connect\b[^.]*\bGitHub\b/i],
  ["Telegram pairing without typing commands", /pair(ing|ed)?\b[^.]*without (typing|slash)/i],
  ["approval buttons for focus agents", /approval buttons/i],
];
/** What the site keeps under Coming: each is named on the home page, with its label. */
const NEXT = ["approval buttons for focus agents", "Telegram pairing without typing commands", "the connectors beyond ClickUp, Jira and Linear (held recipes in ade-skills)"];

/**
 * Not merged, and not next: said once per page, in one quiet line that starts "Later:" (class `later`), with no label
 * per item. Anywhere else on the site, none of these is mentioned at all.
 */
const LATER: [string, RegExp][] = [
  ["the Kimi and ChatGPT providers (nothing for either is in ade-cli yet)", /\b(Kimi|ChatGPT)\b/i],
  ["ade key and ade vault inside ade, with keys per hub (ade-cli A13, A14; ade-brain H2)", /\bade (key|vault)\b|keys` on ade-secrets/i],
  ["the Telegram commands for status and progress", /Telegram commands|progress commands|(?:^|[\s(,])\/(status|progress|start|stop)\b/i],
  ["ADE Computer in the cloud", /\bin the cloud\b|\bFly(\.io)?\b/],
  ["the codesec plugin", /\bcodesec\b|code-security plugin/i],
];
const BLOCKS = "main p, main li, main td, main h2, main h3, main figcaption, main summary";

describe("not merged yet is labelled Coming", () => {
  it.each(NOT_MERGED)("%s", (_name, re) => {
    const unlabelled: string[] = [];
    for (const { path, doc } of PAGES) {
      for (const el of doc.querySelectorAll(BLOCKS)) {
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

  it("there is no Coming list: the section is gone, nothing links to it, and what is next is labelled where it is named", () => {
    const home = page("index.html");
    expect(home.querySelector("#coming")).toBeNull();
    expect((home.body.textContent ?? "")).not.toMatch(/Not merged yet, and marked as such/);
    for (const { path, doc } of PAGES) for (const a of doc.querySelectorAll("a[href]")) expect(a.getAttribute("href"), path).not.toMatch(/#coming$/);
    // The four the site keeps under Coming are each named on the home page, in a block that carries the label.
    for (const name of NEXT) {
      const re = NOT_MERGED.find(([n]) => n === name)![1];
      const said = [...home.querySelectorAll(BLOCKS)].filter((el) => !el.querySelector("p, li, td") && re.test(el.textContent ?? ""));
      expect(said.length, name).toBeGreaterThan(0);
      for (const el of said) expect(labelledComing(el), name).toBe(true);
    }
  });

  it("the label is never empty and always reads Coming", () => {
    for (const { path, doc } of PAGES) for (const c of doc.querySelectorAll(".coming")) expect(c.textContent, path).toBe("Coming");
  });
});

describe("what comes later is one quiet line, not a list of labels", () => {
  it.each(LATER)("%s is named only in a Later line", (_name, re) => {
    const elsewhere: string[] = [];
    for (const { path, doc } of PAGES) {
      for (const el of doc.querySelectorAll(BLOCKS)) {
        if (el.querySelector("p, li, td")) continue;
        const text = el.textContent ?? "";
        if (re.test(text) && !inLater(el)) elsewhere.push(`${path}: "${text.trim().slice(0, 90)}"`);
      }
    }
    expect(elsewhere).toEqual([]);
  });

  it("the home page and the paper each have one Later line, which names every item and carries no label", () => {
    for (const path of ["index.html", "paper/index.html"]) {
      const lines = [...page(path).querySelectorAll(".later")];
      expect(lines.length, path).toBe(1);
      const text = lines[0].textContent ?? "";
      expect(text.trim(), path).toMatch(/^Later:/);
      expect(lines[0].querySelector(".coming"), path).toBeNull();
      for (const [name, re] of LATER) expect(re.test(text), `${path}: ${name}`).toBe(true);
      // Nothing that is next is in it: those keep their own label where they are named.
      for (const [name, re] of NOT_MERGED) expect(re.test(text), `${path}: ${name}`).toBe(false);
    }
    // On the home page it sits in the services section, not in a section of its own.
    expect(page("index.html").querySelector("#services .later")).not.toBeNull();
    expect(page("get-started/index.html").querySelector(".later")).toBeNull();
  });
});
