import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { REPOS, parse, readBuilt, readRepo } from "./paths";

/**
 * One story across the site (docs/stories/W-narrative.md): a software engineer's day with ADE, in four steps, then the
 * ADE Computer. Each page that introduces ADE tells the steps in the same order, and every tool or connector the
 * story names exists in ade-skills (a recipe or a plugin) or is labelled Coming.
 */
const STEPS = ["you", "context", "projects", "control"] as const;
const NAMES = ["You", "Your context, tools and access", "Projects and customers", "Run it from the terminal or Telegram"];

const home = parse(readBuilt("index.html"));
const start = parse(readBuilt("get-started/index.html"));
const paper = parse(readBuilt("paper/index.html"));
const flat = (el: Element | null) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
/**
 * Get started's section for a step: its numbered h2 and everything up to the next h2, in one element. The home page
 * says each step in one line; the detail the checks below hold is on Get started.
 */
const step = (name: (typeof STEPS)[number]) => {
  const i = STEPS.indexOf(name);
  const h = [...start.querySelectorAll("main h2")].find((e) => flat(e).startsWith(`${i + 1}. `))!;
  const box = start.createElement("div");
  for (let n = h.nextElementSibling; n && n.tagName !== "H2"; n = n.nextElementSibling) box.appendChild(n.cloneNode(true));
  return box;
};
const codes = (el: Element) => [...el.querySelectorAll("code")].map((c) => flat(c));
/** a before b in the document */
const before = (a: Node, b: Node) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

type Recipe = { service: string; title: string; state: "ready" | "held" };
const recipeDir = resolve(REPOS.skills, "plugins/guard/connectors");
const recipes: Recipe[] = readdirSync(recipeDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readRepo("skills", `plugins/guard/connectors/${f}`)));
const plugins: { name: string }[] = JSON.parse(readRepo("skills", ".claude-plugin/marketplace.json")).plugins;

describe("one engineer's day, across the site", () => {
  it("the home page tells the four steps in order, then the ADE Computer line", () => {
    const cards = [...home.querySelectorAll("#story [data-story]")];
    expect(cards.map((c) => c.getAttribute("data-story"))).toEqual([...STEPS]);
    for (const [i, c] of cards.entries()) {
      expect(flat(c.querySelector(".feat-eyebrow")), STEPS[i]).toBe(`Step ${i + 1} · ${NAMES[i]}`);
      // One line each.
      expect(c.querySelectorAll("p").length, STEPS[i]).toBe(1);
      expect(c.querySelectorAll("ul, ol, h3").length, STEPS[i]).toBe(0);
    }
    const computer = home.querySelector('[data-story="computer"]')!;
    expect(computer).not.toBeNull();
    expect(before(cards[3], computer)).toBe(true);
    const text = flat(computer);
    for (const phrase of ["ADE Computer", "mini PC", "compute instance", "dedicated work", "several contracts"]) {
      expect(text, phrase).toContain(phrase);
    }
  });

  it("Get started's step 1 names the hub's personas and ADE's roles as they are", () => {
    const titles = readdirSync(resolve(REPOS.brain, "personas"))
      .filter((f) => f.endsWith(".md"))
      .map((f) => /^title:\s*(.+)$/m.exec(readRepo("brain", `personas/${f}`))![1].trim());
    const you = step("you");
    const text = flat(you);
    expect(text).toContain(`${titles.length} personas`);
    const named = [...you.querySelectorAll("[data-persona]")].map((e) => flat(e));
    expect(named.length).toBeGreaterThan(2);
    for (const n of named) expect(titles, n).toContain(n);
    const core: { name: string }[] = JSON.parse(readRepo("method", "ade.json")).core_roles;
    const specialists: { name: string }[] = JSON.parse(readRepo("registry", "registry.json")).roles;
    expect(text).toContain(`${core.length} core roles`);
    expect(text).toContain(`${specialists.length} specialists`);
    expect(codes(you)).toContain("ade hub new");
  });

  it("Get started's step 2 names Claude, and every tool or connector it names has a recipe or a plugin, or is marked Coming", () => {
    const context = step("context");
    expect(flat(context)).toMatch(/\bClaude\b/);
    expect(codes(context)).toContain("ade connect <service>");
    const tools = [...context.querySelectorAll("[data-tool]")];
    expect(tools.length).toBeGreaterThan(3);
    for (const t of tools) {
      const name = t.getAttribute("data-tool")!;
      const recipe = recipes.find((r) => r.service === name);
      const plugin = plugins.find((p) => p.name === name);
      const coming = !!t.querySelector(".coming");
      if (recipe) {
        expect(flat(t), name).toContain(recipe.title);
        // A ready recipe is said as working; a held one is not built yet.
        expect(coming, `${name} is ${recipe.state}`).toBe(recipe.state === "held");
      } else {
        expect(plugin || coming, `${name}: no recipe, no plugin, and not marked Coming`).toBeTruthy();
      }
    }
    // Every recipe is in the list, and no service is named outside it.
    for (const r of recipes) expect(tools.map((t) => t.getAttribute("data-tool")), r.service).toContain(r.service);
    // The list of tools names no service outside its own tag.
    const rest = tools[0].closest("li, p")!.cloneNode(true) as Element;
    for (const t of rest.querySelectorAll("[data-tool]")) t.remove();
    const others = ["Gmail", "Slack", "Outlook", "Teams", "Discord", "ClickUp", "Jira", "Linear", "Notion", "Google Drive", "Calendar", "Asana"];
    for (const n of others) expect(flat(rest), n).not.toContain(n);
  });

  it("Get started's step 3 names the commands that bring projects in and run focus agents", () => {
    const projects = step("projects");
    const named = codes(projects);
    for (const c of ["ade project add <path or git address>", "ade work <folder>", "ade dispatch", "ade hub new"]) {
      expect(named, c).toContain(c);
    }
    expect(flat(projects)).toMatch(/focus agent/);
    expect(flat(projects)).toMatch(/several tasks at once/);
  });

  it("Get started's step 4 names the terminal and Telegram", () => {
    const control = step("control");
    expect(codes(control)).toContain("ade ui");
    expect(flat(control)).toMatch(/Telegram[^.]*locked to you/);
  });

  it("Get started follows the same four steps, in the same order, then the ADE Computer", () => {
    const heads = [...start.querySelectorAll("main h2")].map((h) => flat(h));
    const steps = heads.filter((h) => /^\d\. /.test(h));
    expect(steps.length).toBe(4);
    for (const [i, h] of steps.entries()) expect(h, NAMES[i]).toMatch(new RegExp(`^${i + 1}\\. ${NAMES[i]}\\b`));
    const lastStep = [...start.querySelectorAll("main h2")].find((h) => flat(h) === steps[3])!;
    const computer = [...start.querySelectorAll("main li, main p")].find((e) => /ADE Computer/.test(flat(e)) && /mini PC/.test(flat(e)))!;
    expect(computer).toBeTruthy();
    expect(before(lastStep, computer)).toBe(true);
  });

  it("the paper introduces ADE with the same four steps, in order", () => {
    const intro = paper.querySelector("main [data-story='paper']")!;
    expect(intro).not.toBeNull();
    // In the opening, before the first numbered section.
    expect(before(intro, paper.getElementById("1-the-problem-done-is-not-a-fact")!)).toBe(true);
    // Each step is named in bold, in order, and nothing else in the opening is.
    expect([...intro.querySelectorAll("strong")].map((e) => flat(e).replace(/[.:]$/, ""))).toEqual(NAMES);
  });
});
