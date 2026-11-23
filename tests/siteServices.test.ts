import { describe, expect, it } from "vitest";
import { parse, readBuilt, readRepo } from "./paths";

/**
 * "Mix AI services per role", the section right under the home page's hero. It carries what the hero's drawing no
 * longer does: each role with the service it runs on, the specialists that load when needed, and the list of
 * services, where anything ade-cli does not run today sits under its own Coming label.
 */
const home = parse(readBuilt("index.html"));
const sections = [...home.querySelectorAll("main > section")];
const section = home.getElementById("services")!;
const names = (selector: string) => [...section.querySelectorAll(selector)].map((e) => (e.textContent ?? "").trim());
const cap = (name: string) => name[0].toUpperCase() + name.slice(1);

describe("Mix AI services per role", () => {
  it("is the section right under the hero, with that headline", () => {
    expect(section).not.toBeNull();
    expect(sections[1]).toBe(section);
    expect(section.querySelector("h2")!.textContent).toBe("Mix AI services per role.");
  });

  it("has a card for the orchestrator and each of ade-method's core roles, with its face and its service", () => {
    const core: { name: string }[] = JSON.parse(readRepo("method", "ade.json")).core_roles;
    const cards = [...section.querySelectorAll(".role-card[data-role]")];
    expect(cards.map((c) => c.querySelector("h3")!.textContent)).toEqual(["Orchestrator", ...core.map((r) => cap(r.name))]);
    expect(cards.map((c) => c.getAttribute("data-role"))).toEqual(["orchestrator", ...core.map((r) => r.name)]);
    for (const c of cards) {
      // The same face as in the hero's drawing, with the role's job icon; both are drawn in the page.
      const uses = [...c.querySelectorAll("svg use")].map((u) => u.getAttribute("href")!);
      expect(uses[0]).toBe("#hx-i-agent");
      expect(uses.length).toBe(2);
      for (const u of uses) expect(home.getElementById(u.slice(1)), u).not.toBeNull();
      expect(c.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
      expect((c.querySelector(".role-service")!.textContent ?? "").replace(/\s+/g, " ").trim()).toMatch(/^Runs on \S+$/);
      expect((c.querySelector("p:not(.role-service)")!.textContent ?? "").length).toBeGreaterThan(20);
    }
    expect(cards.map((c) => c.querySelector(".role-service b")!.textContent)).toEqual(["Claude", "Claude", "Claude", "Gemini", "DeepSeek"]);
  });

  it("shows two ade-agent-registry specialists as smaller cards, loaded when needed", () => {
    const registry: { name: string }[] = JSON.parse(readRepo("registry", "registry.json")).roles;
    const cards = [...section.querySelectorAll(".role-card--specialist")];
    expect(cards.map((c) => c.querySelector("h3")!.textContent)).toEqual(["Support", "Sysadmin"]);
    for (const c of cards) {
      expect(registry.map((r) => cap(r.name))).toContain(c.querySelector("h3")!.textContent);
      expect(c.textContent).toContain("loaded when needed");
      expect(c.hasAttribute("data-role")).toBe(false);
      expect(c.querySelector(".role-service")).toBeNull();
      expect(c.querySelector("svg use")!.getAttribute("href")).toBe("#hx-i-agent");
    }
  });

  it("lists a service as available only when ade-cli runs it today; the rest each carry the Coming label", () => {
    const cli = readRepo("cli", "ade");
    // What `ade setup` can live-test, and the ones it will not put in a role until their live check passes.
    const live = /^LIVE_PROVIDERS="([^"]*)"/m.exec(cli)![1].split(/\s+/);
    const gated = new Set([...cli.matchAll(/"([a-z]+)\|[^"|]*\(needs the live check\)"/g)].map((m) => m[1]));
    expect(live).toEqual(expect.arrayContaining(["anthropic", "deepseek", "gemini"]));
    const ID: Record<string, string> = { Claude: "anthropic", DeepSeek: "deepseek", Gemini: "gemini", GLM: "glm", Muse: "muse" };
    const now = names(".svc-now li");
    const soon = names(".svc-soon li b");
    expect(now).toEqual(["Claude", "DeepSeek", "Gemini"]);
    expect(soon).toEqual(["GLM", "Muse", "Kimi", "ChatGPT"]);
    expect(section.querySelectorAll(".svc-now .coming").length).toBe(0);
    for (const n of now) {
      expect(live, n).toContain(ID[n]);
      expect(gated.has(ID[n]), `${n} is still waiting for its live check`).toBe(false);
    }
    // Coming: not in ade-cli at all, or there but held back. When one lands, this fails and the label comes off.
    for (const li of section.querySelectorAll(".svc-soon li")) {
      expect(li.querySelectorAll(".coming").length, li.textContent ?? "").toBe(1);
      expect(li.querySelector(".coming")!.textContent).toBe("Coming");
    }
    for (const n of soon) {
      const held = ID[n] ? gated.has(ID[n]) : !new RegExp(`\\b${n}\\b`, "i").test(cli);
      expect(held, `${n} is supported now: move it out of the Coming group`).toBe(true);
    }
    expect(cli).not.toMatch(/kimi|moonshot|chatgpt|openai/i);
    // A role runs only on what is available; the orchestrator is on Claude (anything else is Coming).
    const services = names(".role-card[data-role] .role-service b");
    for (const s of services) expect(now).toContain(s);
    expect(section.querySelector('.role-card[data-role="orchestrator"] .role-service b')!.textContent).toBe("Claude");
    // The Coming ones are named once in the section, in the list.
    const text = section.textContent ?? "";
    for (const n of soon) expect(text.split(n).length - 1, n).toBe(1);
  });
});
