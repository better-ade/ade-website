import { describe, expect, it } from "vitest";
import { parse, readBuilt, readRepo } from "./paths";

/**
 * "AI services per role", on Get started under step 2 (it left the home page when the home page was cut to six
 * sections). It names each role with the service it runs on in the example mix, the specialists that load when
 * needed, and the list of services, where anything ade-cli does not run today sits under its own Coming label.
 */
const start = parse(readBuilt("get-started/index.html"));
const section = start.getElementById("services")!;
const names = (selector: string) => [...section.querySelectorAll(selector)].map((e) => (e.textContent ?? "").trim());
const cap = (name: string) => name[0].toUpperCase() + name.slice(1);

describe("AI services per role", () => {
  it("is on Get started, under step 2", () => {
    expect(section).not.toBeNull();
    expect(section.textContent).toMatch(/AI services per role\./);
    const step2 = [...start.querySelectorAll("main h2")].find((h) => /^2\. /.test(h.textContent ?? ""))!;
    const step3 = [...start.querySelectorAll("main h2")].find((h) => /^3\. /.test(h.textContent ?? ""))!;
    expect(step2.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(section.compareDocumentPosition(step3) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("names the orchestrator and each of ade-method's core roles, with its service", () => {
    const core: { name: string }[] = JSON.parse(readRepo("method", "ade.json")).core_roles;
    const roles = [...section.querySelectorAll("[data-role]")];
    expect(roles.map((c) => c.getAttribute("data-role"))).toEqual(["orchestrator", ...core.map((r) => r.name)]);
    for (const [i, r] of roles.entries()) {
      expect((r.textContent ?? "").trim(), r.getAttribute("data-role")!).toMatch(new RegExp(`^${cap(roles[i].getAttribute("data-role")!)}: \\S+$`));
    }
    expect(roles.map((c) => c.querySelector("b")!.textContent)).toEqual(["Claude", "Claude", "Claude", "Gemini", "DeepSeek"]);
  });

  it("names two ade-agent-registry specialists, loaded when needed", () => {
    const registry: { name: string }[] = JSON.parse(readRepo("registry", "registry.json")).roles;
    const named = names(".specialist");
    expect(named).toEqual(["Support", "Sysadmin"]);
    for (const n of named) expect(registry.map((r) => cap(r.name))).toContain(n);
    expect(section.querySelector(".specialist")!.closest("p")!.textContent).toContain("loaded when needed");
  });

  it("lists a service as available only when ade-cli runs it today; the rest each carry the Coming label", () => {
    const cli = readRepo("cli", "ade");
    // What `ade setup` can live-test, and the ones it will not put in a role until their live check passes.
    const live = /^LIVE_PROVIDERS="([^"]*)"/m.exec(cli)![1].split(/\s+/);
    const gated = new Set([...cli.matchAll(/"([a-z]+)\|[^"|]*\(needs the live check\)"/g)].map((m) => m[1]));
    expect(live).toEqual(expect.arrayContaining(["anthropic", "deepseek", "gemini"]));
    const ID: Record<string, string> = { Claude: "anthropic", DeepSeek: "deepseek", Gemini: "gemini", GLM: "glm", Muse: "muse" };
    const now = names(".svc-now > span");
    const soon = names(".svc-soon > span > b");
    expect(now).toEqual(["Claude", "DeepSeek", "Gemini"]);
    expect(soon).toEqual(["GLM", "Muse"]);
    expect(section.querySelectorAll(".coming").length).toBe(2);
    expect(section.querySelectorAll(".svc-now .coming").length).toBe(0);
    for (const n of now) {
      expect(live, n).toContain(ID[n]);
      expect(gated.has(ID[n]), `${n} is still waiting for its live check`).toBe(false);
    }
    // Coming: not in ade-cli at all, or there but held back. When one lands, this fails and the label comes off.
    for (const item of section.querySelectorAll(".svc-soon > span")) {
      expect(item.querySelectorAll(".coming").length, item.textContent ?? "").toBe(1);
      expect(item.querySelector(".coming")!.textContent).toBe("Coming");
    }
    for (const n of soon) {
      const held = ID[n] ? gated.has(ID[n]) : !new RegExp(`\\b${n}\\b`, "i").test(cli);
      expect(held, `${n} is supported now: move it out of the Coming group`).toBe(true);
    }
    // Kimi and ChatGPT are neither released nor next: only in the home page's Later line (tests/siteTruth.test.ts).
    expect(section.textContent).not.toMatch(/Kimi|ChatGPT/);
    expect(cli).not.toMatch(/kimi|moonshot|chatgpt|openai/i);
    // A role runs only on what is available; the orchestrator is on Claude (anything else is Coming).
    for (const s of names("[data-role] b")) expect(now).toContain(s);
    expect(section.querySelector('[data-role="orchestrator"] b')!.textContent).toBe("Claude");
    // The Coming ones are named once in the section, in the list.
    const text = section.textContent ?? "";
    for (const n of soon) expect(text.split(n).length - 1, n).toBe(1);
  });
});
