import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { REPOS, parse, readBuilt, readRepo, readSite } from "./paths";

/**
 * Get started says what ships today (docs/stories/W-guide-refresh.md): the seven set-up steps, no BMAD settings,
 * Better Terminal, the paste guard, one Telegram bot per hub, `ade docs`, `ade keys` and the mouse in `ade ui`.
 * Each claim is held to ade-cli's or ade-brain's main.
 */
const start = parse(readBuilt("get-started/index.html"));
/** The text, on one line, with kramdown's typographic apostrophes back to plain ones. */
const flat = (el: Element | null) => (el?.textContent ?? "").replace(/\s+/g, " ").replace(/\u2019/g, "'").trim();
const cli = readRepo("cli", "ade");

/** Get started's numbered step n: its h2 and everything up to the next h2. */
const step = (n: number) => {
  const h = [...start.querySelectorAll("main h2")].find((e) => flat(e).startsWith(`${n}. `))!;
  const box = start.createElement("div");
  for (let e = h.nextElementSibling; e && e.tagName !== "H2"; e = e.nextElementSibling) box.appendChild(e.cloneNode(true));
  return box;
};
const items = (el: Element) => [...el.querySelectorAll("li")].map((li) => flat(li));
const ships = () => {
  const h = start.getElementById("what-ships-with-ade")!;
  let ul = h.nextElementSibling;
  while (ul && ul.tagName !== "UL") ul = ul.nextElementSibling;
  return [...ul!.querySelectorAll(":scope > li")].map((li) => flat(li));
};

/** The subcommands ade-cli's main dispatches (the `case "$cmd" in` at the end of the script). */
const dispatched = () => {
  const table = cli.slice(cli.lastIndexOf('case "$cmd" in'));
  return new Set([...table.matchAll(/^\s+([a-z][a-z-]*)\)/gm)].map((m) => m[1]));
};

describe("Get started says what ships today", () => {
  it("steps_seven: step 1 lists ade setup's checked steps, as many and in the order of GUIDE_STEPS in ade-cli", () => {
    const ids = /^GUIDE_STEPS="([^"]*)"/m.exec(cli)![1].split(/\s+/);
    const body = cli.slice(cli.indexOf("guide_title() {"), cli.indexOf("\n}", cli.indexOf("guide_title() {")));
    const titles = ids.map((id) => new RegExp(`\\b${id}\\) echo "([^"]+)"`).exec(body)![1].toLowerCase());
    const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    const line = items(step(1)).find((t) => /^ade setup walks/.test(t))!;
    expect(line).toBe(
      "ade setup walks seven checked steps: Claude Code, Claude, GitHub, your hub, your tools (optional), your first project, Telegram (optional). Rerun to resume.",
    );
    const m = /walks (\w+) checked steps: (.+)\. Rerun/.exec(line)!;
    expect(m[1]).toBe(words[ids.length]);
    const named = m[2].split(", ");
    expect(named.length).toBe(ids.length);
    for (const [i, n] of named.entries()) expect(titles[i], n).toContain(n.toLowerCase());
  });

  it("no_bmad_ships: the page's content names BMAD nowhere; ade-method is the rules and the core roles", () => {
    // The site-wide footer's "Built on ... the BMAD Method" credit is on every page and is not this guide's claim.
    expect(start.querySelector("main")!.outerHTML).not.toMatch(/BMAD/i);
    const version = /^ade_method:\s*(\S+)/m.exec(readSite("_data/releases.yml"))![1];
    expect(ships()).toContain(`ade-method (v${version}): The rules every agent works by and the four core roles.`);
  });

  it("terminal_ships: ade-terminal is Better Terminal, with no Frozen state", () => {
    const line = ships().find((t) => t.startsWith("ade-terminal"))!;
    expect(line).toBe("ade-terminal: Better Terminal, the desktop app: agent status in each tab, a command guard, and ade open.");
    expect(flat(start.body)).not.toMatch(/Frozen/);
    expect(dispatched().has("open")).toBe(true);
  });

  it("paste_guard_step: step 2's Keys line says a pasted key is stopped, and ade-brain has the paste guard", () => {
    const keys = items(step(2)).find((t) => t.startsWith("Keys:"))!;
    expect(keys).toContain("If you paste a key into a prompt by mistake, the paste guard stops it and names the command that stores it.");
    expect(existsSync(resolve(REPOS.brain, "bin/paste-guard"))).toBe(true);
  });

  it("one_bot_per_hub: step 4 says one hub, one Telegram bot, its token in that hub's key store", () => {
    expect(items(step(4))).toContain("One hub, one Telegram bot. The token goes in that hub's own key store.");
  });

  it("cli_lines: ade docs, ade keys and ade ui's buttons are named, and each is in ade-cli", () => {
    const real = dispatched();
    expect(items(step(3))).toContain("ade docs: reads the hub's plans and specs, newest first.");
    expect(items(step(2))).toContain("ade keys: sets missing keys at hidden prompts.");
    for (const c of ["docs", "keys"]) expect(real.has(c), `ade ${c}`).toBe(true);
    // The bar's buttons: the second column of ui_actions, the one table the keys, buttons and menu are made from.
    const table = cli.slice(cli.indexOf("ui_actions() {"), cli.indexOf("\n}", cli.indexOf("ui_actions() {")));
    const buttons = new Set([...table.matchAll(/^\s+(?:"\?"|\S)\s+("[^"]*"|\S+)\s/gm)].map((m) => m[1].replace(/"/g, "")).filter((b) => b !== "-"));
    expect([...buttons].sort()).toEqual(["+ agent", "? keys", "approve", "dash", "files", "tickets"]);
    const mouse = [...step(4).querySelectorAll("li")].find((li) => /^Or click/.test(flat(li)))!;
    const named = [...mouse.querySelectorAll("code")].map((c) => flat(c)).filter((c) => /^\[.*\]$/.test(c)).map((c) => c.slice(1, -1));
    expect(named.length).toBe(6);
    for (const b of named) expect(buttons.has(b), b).toBe(true);
    expect(cli).toMatch(/right click for every action/);
  });
});
