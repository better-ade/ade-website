import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPOS, parse, readBuilt, readRepo } from "./paths";

/** Stories W-scenarios and W-scenarios-more: people using ADE, told as six short scenarios in the owner's words. */
const home = parse(readBuilt("index.html"));
const plain = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
const flat = (el: Element | null) => plain(el?.textContent ?? "");
const section = home.querySelector("#scenarios")!;
const cards = () => [...home.querySelectorAll("#scenarios [data-scenario]")];
const steps = (card: Element) => [...card.querySelectorAll("ol > li")];
const CLOSING =
  "In every scenario, the human runs the connection: the people, the decisions and the yes. AI agents run the execution and the support.";
const NAMES = ["Jan", "Alvin", "Robert", "Sam", "Ana", "Ben", "Chris", "Mia", "Leo"];
const SCENARIOS = [
  { name: "Jan, a new software engineer", steps: ["Hired.", "Sets up a copilot.", "Uses it daily.", "Runs tasks from the phone.", "Delivers value."] },
  { name: "Alvin, a new hands-on CTO", steps: ["Takes the job.", "Sets up a hub.", "Leads and builds.", "Stays on top of it."] },
  { name: "Robert, a one-person software consultancy", steps: ["Works alone.", "One hub per client.", "Gets a team's process.", "Runs it from anywhere."] },
  { name: "Sam, on call for the platform", steps: ["Gets paged.", "Asks in plain words.", "Stays in control."] },
  { name: "Ana, Ben and Chris, three engineers sharing one brain", steps: ["One hub.", "Shared memory.", "Own agents, own keys.", "One bar for Done."] },
  { name: "Mia teaching Leo, a senior and a junior engineer", steps: ["Shares the hub.", "Learns from the record.", "Builds with guard rails.", "Reviews what matters."] },
];
const SLUGS = ["jan", "alvin", "robert", "sam", "team", "mentor"];

const messaging = readFileSync(resolve(__dirname, "../docs/messaging.md"), "utf8");
/** The "## Scenarios" section of docs/messaging.md: each scenario's heading and steps (markdown stripped), and the closing line. */
function fromMessaging() {
  const start = messaging.indexOf("\n## Scenarios");
  expect(start, "messaging.md has a Scenarios section").toBeGreaterThan(-1);
  const body = messaging.slice(start + 1, messaging.indexOf("\n## ", start + 1));
  const strip = (s: string) => plain(s.replace(/\*\*/g, "").replace(/`/g, ""));
  const out: { name: string; steps: string[] }[] = [];
  // A step runs from its number to the next number, the next heading or a blank line.
  for (const block of body.split(/\n(?=\*\*[A-Z][a-z]+[ ,])/).slice(1)) {
    const [head, ...rest] = block.split("\n");
    const items = rest.join("\n").split(/\n\n/)[0].split(/\n(?=\d+\. )/);
    out.push({ name: strip(head), steps: items.map((i) => strip(i.replace(/^\d+\. /, ""))) });
  }
  const closing = /Closing line: "([\s\S]*?)"\n/.exec(body)![1];
  return { scenarios: out, closing: plain(closing) };
}

describe("scenarios_section", () => {
  it("the home page has #scenarios between #persona and #computer, with its kicker and headline", () => {
    expect(section).toBeTruthy();
    expect(home.querySelector("#persona")!.nextElementSibling).toBe(section);
    expect(section.nextElementSibling).toBe(home.querySelector("#computer"));
    expect(flat(section.querySelector(".kicker"))).toBe("Scenarios");
    expect(flat(section.querySelector("h2"))).toBe("How people use ADE.");
  });

  it("six cards in order (Jan 5 steps, Alvin 4, Robert 4, Sam 3, team 4, mentor 4), each step titled in bold", () => {
    expect(cards().map((c) => c.getAttribute("data-scenario"))).toEqual(SLUGS);
    expect(cards().map((c) => flat(c.querySelector("h3")))).toEqual(SCENARIOS.map((s) => s.name));
    for (const [i, c] of cards().entries()) {
      const li = steps(c);
      expect(li.map((l) => flat(l.querySelector("strong"))), SCENARIOS[i].name).toEqual(SCENARIOS[i].steps);
      for (const l of li) expect(flat(l).startsWith(flat(l.querySelector("strong")))).toBe(true);
    }
  });

  it("the closing line comes after the six cards", () => {
    const close = section.querySelector(".scenarios-close")!;
    expect(flat(close)).toBe(CLOSING);
    const last = cards().at(-1)!;
    expect(last.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("scenarios_truth", () => {
  it("docs/messaging.md has the section, and the page says exactly its words", () => {
    const md = fromMessaging();
    expect(md.scenarios.map((s) => s.name)).toEqual(SCENARIOS.map((s) => s.name));
    expect(md.closing).toBe(CLOSING);
    for (const [i, c] of cards().entries()) {
      expect(steps(c).map(flat), md.scenarios[i].name).toEqual(md.scenarios[i].steps);
    }
  });

  it("every command named is real on main (ade hub new, ade hub import … --share, ade project add, ade dispatch, bin/sync, bin/brain search)", () => {
    const named = [...section.querySelectorAll("code")].map(flat);
    expect(new Set(named)).toEqual(
      new Set(["ade hub new", "ade hub import <url> --share", "ade project add", "ade dispatch", "bin/sync", "bin/brain search"]),
    );
    const ade = readRepo("cli", "ade");
    const table = ade.slice(ade.lastIndexOf('case "$cmd" in'));
    const dispatched = new Set([...table.matchAll(/^\s+([a-z|-]+)\)/gm)].flatMap((m) => m[1].split("|")));
    for (const cmd of ["hub", "project", "dispatch"]) expect(dispatched.has(cmd), `ade ${cmd}`).toBe(true);
    // `ade help` gives the subcommands: `ade hub new <name>`, `ade project add <path-or-git-url>`.
    expect(ade).toMatch(/^ {2}hub\s+ade hub new /m);
    expect(ade).toMatch(/^ {2}project\s+ade project add /m);
    expect(ade).toMatch(/^ {4}new\) hub_new /m);
    expect(ade).toMatch(/^ {4}add\) project_add /m);
    // `ade hub import <url|path> [--share|...]`: the import subcommand and its --share mode.
    expect(ade).toMatch(/^ {14}\| ade hub import <url\|path> \[--share\|/m);
    expect(ade).toMatch(/^ {4}import\) hub_import /m);
    expect(ade).toMatch(/--share\|--handover\|--clone\) /);
    expect(existsSync(resolve(REPOS.brain, "bin/sync")), "bin/sync").toBe(true);
    expect(readRepo("brain", "bin/brain")).toContain("search");
  });

  it("every persona named is one of ade-brain's personas", () => {
    const text = flat(section);
    const personas: [string, string, RegExp][] = [
      ["staff software engineer persona", "staff-software-engineer.md", /^title:\s*Staff Software Engineer$/m],
      ["fractional CTO persona", "fractional-cto.md", /^title:\s*Fractional CTO$/m],
      ["DevOps/SRE persona", "devops-sre.md", /^title:\s*DevOps \/ Site Reliability Engineer$/m],
    ];
    for (const [phrase, file, title] of personas) {
      expect(text, phrase).toContain(phrase);
      expect(existsSync(resolve(REPOS.brain, "personas", file)), file).toBe(true);
      expect(readRepo("brain", `personas/${file}`), file).toMatch(title);
    }
  });
});

describe("scenarios_names", () => {
  it("messaging.md's rule allows first names in scenarios only", () => {
    expect(messaging).toContain(
      "No customer names or full names; scenarios use first names only (Jan, Alvin, Robert, Sam, Ana, Ben, Chris, Mia, Leo)",
    );
    expect(messaging).not.toContain("No person or customer names");
  });

  it("the scenarios name only Jan, Alvin, Robert, Sam, Ana, Ben, Chris, Mia and Leo, by first name", () => {
    // Each heading names its people before its last comma ("Ana, Ben and Chris, three engineers ...").
    const head = (c: Element) => flat(c.querySelector("h3")).replace(/, [^,]*$/, "");
    const named = cards().flatMap((c) => head(c).match(/\b[A-Z][a-z]+/g) ?? []);
    expect(named).toEqual(NAMES);
    // Capitalised words that are not a sentence's first word: only the four names and ADE's own words.
    const known = new Set([...NAMES, "ADE", "CTO", "Telegram", "Done", "API", "DevOps/SRE", "AI"]);
    // Each step without its bold title, each card heading and the closing line: every one starts a sentence.
    const texts = [
      ...cards().flatMap((c) => steps(c).map((l) => flat(l).slice(flat(l.querySelector("strong")).length))),
      ...cards().map((c) => flat(c.querySelector("h3"))),
      flat(section.querySelector(".scenarios-close")),
    ];
    const words = plain(texts.join(" . "))
      .replace(/(^|[.:!?]\s+|"|\d\.\s+)[A-Z][\w'/-]*/g, "$1")
      .match(/\b[A-Z][\w'/-]*/g) ?? [];
    const others = [...new Set(words.map((w) => w.replace(/'s$/, "")))].filter((w) => !known.has(w));
    expect(others).toEqual([]);
    // No surname after a name.
    expect(flat(section)).not.toMatch(new RegExp(`\\b(${NAMES.join("|")}) [A-Z][a-z]+`));
  });
});
