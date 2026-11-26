import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPOS, parse, readBuilt, readRepo } from "./paths";

/** Story W-persona-over-time: how a persona grows with the brain, and every claim held to ade-brain's `main`. */
const home = parse(readBuilt("index.html"));
const flat = (el: Element | null) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const section = home.querySelector("#persona")!;
const cards = () => [...home.querySelectorAll("#persona [data-persona]")];
const text = () => flat(section);
const KEYS = ["pick", "work", "day", "learn", "remember"];
const HEADLINE = "Build your persona over time, be great at what you do.";

const titles = readdirSync(resolve(REPOS.brain, "personas"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => /^title:\s*(.+)$/m.exec(readRepo("brain", `personas/${f}`))![1].trim());

describe("a persona grows with the brain (home page)", () => {
  it("the home page has the persona section after the story, with the owner's headline", () => {
    const story = home.querySelector("#story")!;
    expect(section).toBeTruthy();
    expect(story.nextElementSibling).toBe(section);
    expect(flat(section.querySelector("h2"))).toBe(HEADLINE);
    expect(flat(section.querySelector(".kicker"))).toBe("The brain");
    const link = section.querySelector("a[href*='ade-brain']");
    expect(link, "a link to ade-brain").toBeTruthy();
  });

  it("the five steps are cards in order", () => {
    expect(cards().map((c) => c.getAttribute("data-persona"))).toEqual(KEYS);
    const names = ["Pick who it is.", "Give it the work.", "It starts each day knowing what is live.",
      "It learns how you work, with your yes.", "It remembers everything, locally."];
    for (const [i, c] of cards().entries()) expect(flat(c.querySelector(".feat-eyebrow")), KEYS[i]).toContain(names[i]);
    expect(text()).toContain("One hub per client, so clients never mix.");
  });

  it("the persona count is ade-brain's", () => {
    const n = titles.length;
    expect(text()).toContain(`One of ${n} personas`);
    // Each persona named matches one of ade-brain's titles (by its key words).
    for (const word of ["staff", "devops", "data engineer", "security", "fractional cto"]) {
      expect(titles.some((t) => t.toLowerCase().includes(word)), word).toBe(true);
    }
  });

  it("every command named is real", () => {
    const readme = readRepo("brain", "README.md");
    const has = (script: string, needle: string) => {
      const src = readRepo("brain", `bin/${script}`);
      expect(src + readme, `${script} ${needle}`).toContain(needle);
    };
    for (const cmd of ["bin/init --persona", "bin/new projects/shop --repo", "bin/learn", "bin/brain search"]) {
      expect(text(), cmd).toContain(cmd);
    }
    has("init", "--persona");
    has("new", "--repo");
    has("learn", "learn");
    has("brain", "search");
  });

  it("the learning limit matches the brain", () => {
    const m = /HUB_LEARN_LINES:-(\d+)/.exec(readRepo("brain", "bin/learn"))!;
    expect(text()).toContain(`At most ${m[1]} lines load into each session`);
    expect(readRepo("brain", "bin/learn")).toMatch(/bin\/learn confirm[^\n]*\n?[^\n]*own terminal/);
    expect(text()).toContain("confirm it in your own terminal");
  });

  it("messaging.md carries the same five steps", () => {
    const md = readFileSync(resolve(__dirname, "../docs/messaging.md"), "utf8").replace(/\s+/g, " ");
    expect(md).toContain(HEADLINE);
    for (const c of cards()) {
      const lead = flat(c.querySelector(".feat-eyebrow")).replace(/^\d\. /, "");
      expect(md, lead).toContain(`**${lead}**`);
    }
  });
});
