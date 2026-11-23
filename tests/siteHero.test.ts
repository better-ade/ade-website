import { describe, expect, it } from "vitest";
import { gzipSync } from "node:zlib";
import { parse, readBuilt, readRepo, readSite } from "./paths";

/**
 * The home page's hero shows an ADE Computer desktop with the agents at work on it: an inline SVG, moved by CSS
 * keyframes alone. Two drawings share the classes: a wide one, and one laid out for a phone. These tests hold it to
 * what it must stay: named for a screen reader, still when motion is not wanted, true to ADE's real roles, readable in
 * both themes, and made of nothing fetched from anywhere.
 */
const home = parse(readBuilt("index.html"));
const hero = home.querySelector("main section")!;
const drawings = [...hero.querySelectorAll('svg[role="img"]')];
const wide = hero.querySelector("svg.hx--wide")!;
const phone = hero.querySelector("svg.hx--phone")!;
const css = readSite("assets/css/site.css");
const labels = (svg: Element, selector: string) => [...svg.querySelectorAll(selector)].map((t) => (t.textContent ?? "").trim());
const cap = (name: string) => name[0].toUpperCase() + name.slice(1);

describe("the hero's ADE Computer, with the agents at work", () => {
  it("is in the hero, after the headline and the buttons, with an accessible name", () => {
    expect(wide).not.toBeNull();
    expect(phone).not.toBeNull();
    expect(drawings.length).toBe(2);
    const lastButton = [...hero.querySelectorAll("a.btn")].pop()!;
    for (const svg of drawings) {
      expect(svg.getAttribute("aria-label")!.length).toBeGreaterThan(40);
      expect(svg.getAttribute("aria-label")!.length).toBeLessThan(200);
      expect(svg.querySelector("title")!.textContent).toBe(svg.getAttribute("aria-label"));
      for (const word of ["ADE Computer", "Orchestrator", "Product", "Architect", "Developer", "Reviewer", "tests pass"]) {
        expect(svg.getAttribute("aria-label"), word).toContain(word);
      }
      // The headline and the buttons come first, at every width.
      expect(hero.querySelector("h1")!.compareDocumentPosition(svg) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(lastButton.compareDocumentPosition(svg) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it("names the orchestrator, ade-method's core roles in order, and two ade-agent-registry specialists", () => {
    const core: { name: string }[] = JSON.parse(readRepo("method", "ade.json")).core_roles;
    const registry: { name: string }[] = JSON.parse(readRepo("registry", "registry.json")).roles;
    expect(labels(wide, ".hx-agent .hx-label")).toEqual(["Orchestrator", ...core.map((r) => cap(r.name))]);
    expect(labels(wide, ".hx-agent .hx-label")).toEqual(["Orchestrator", "Product", "Architect", "Developer", "Reviewer"]);
    const specialists = labels(wide, ".hx-specialist .hx-label");
    expect(specialists).toEqual(["Support", "Sysadmin"]);
    for (const s of specialists) expect(registry.map((r) => cap(r.name)), s).toContain(s);
    expect((wide.textContent ?? "").replace(/\s+/g, " ")).toContain("loaded when needed");
    // The phone drawing keeps the five and leaves the specialists out.
    expect(labels(phone, ".hx-agent .hx-label")).toEqual(labels(wide, ".hx-agent .hx-label"));
    expect(labels(phone, ".hx-specialist .hx-label")).toEqual([]);
  });

  it("plays the hand-off: the message, the ticket, the terminal with its test, Done, and the note back", () => {
    for (const svg of drawings) {
      const text = (svg.textContent ?? "").replace(/\s+/g, " ");
      for (const said of ["can’t log in", "Ticket", "bash tests/run.sh", "not ok", "tests pass ✓ Done", "Done. Tests pass."]) {
        expect(text, said).toContain(said);
      }
      expect(svg.querySelectorAll(".hx-pulse").length, "one pulse for each hand-off").toBe(5);
      expect(svg.querySelectorAll(".hx-ring").length, "one ring for each agent").toBe(5);
      expect(svg.querySelector(".hx-dot"), "the test dot").not.toBeNull();
    }
    expect(css).toMatch(/\.hx-dot\s*\{[^}]*animation:\s*hx-dot 12s/);
    expect(css).toMatch(/@keyframes hx-dot\s*\{[^@]*#ff7b72[^@]*#3fb950/);
  });

  it("is a desktop of our own: a top bar, a dock with four plain icons, a terminal", () => {
    for (const svg of drawings) {
      expect(svg.querySelector(".hx-bar")).not.toBeNull();
      expect([...svg.querySelectorAll(".hx-dock-icon")].map((u) => u.getAttribute("href"))).toEqual(["#hx-i-code", "#hx-i-term", "#hx-i-db", "#hx-i-web"]);
      expect(svg.querySelector(".hx-term")).not.toBeNull();
    }
  });

  it("stands still, on its last frame, when reduced motion is asked for", () => {
    const reduce = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g)].map((m) => m[1]).join("\n");
    expect(reduce).toMatch(/\.hx \*\s*\{[^}]*animation:\s*none\s*!important/);
    // Every moving part rests on the end state: the rules outside keyframes never hide what the last frame shows.
    const rule = (cls: string) => new RegExp(`(^|[\\s,])\\.${cls}\\s*\\{([^}]*)\\}`, "m").exec(css)?.[2] ?? "";
    for (const cls of ["hx-msg", "hx-ticket", "hx-note", "hx-out2", "hx-out5", "hx-stamp", "hx-reply"]) {
      expect(rule(cls), cls).toMatch(/animation:/);
      expect(rule(cls), cls).not.toMatch(/opacity:\s*0/);
    }
    expect(rule("hx-dot")).toMatch(/fill:\s*#3fb950/);
    // The loop is one length for every part, about twelve seconds, and nothing else.
    const durations = new Set([...css.matchAll(/animation:\s*hx-[a-z0-9-]+ ([\d.]+s)/g)].map((m) => m[1]));
    expect([...durations]).toEqual(["12s"]);
  });

  it("uses no script, image, font or address of its own", () => {
    const visual = hero.querySelector(".hero-computer")!;
    expect(visual.querySelectorAll("script, image, img, foreignObject, style, iframe, a").length).toBe(0);
    for (const el of visual.querySelectorAll("*")) {
      for (const attr of el.getAttributeNames()) {
        const v = el.getAttribute(attr)!;
        expect(attr, "no style attribute or event handler (the policy blocks them)").not.toMatch(/^(style|on[a-z]+)$/);
        if (attr === "href" || attr === "xlink:href") expect(v).toMatch(/^#hx-/);
        if (/url\(/.test(v)) expect(v).toMatch(/^url\(#hx[a-z0-9-]*\)$/);
        if (attr !== "aria-label") expect(v, attr).not.toMatch(/https?:|\/\//);
      }
    }
    // Every reference resolves inside the page.
    for (const use of visual.querySelectorAll("use")) expect(home.getElementById(use.getAttribute("href")!.slice(1)), use.getAttribute("href")!).not.toBeNull();
    const own = css.slice(css.indexOf("/* ---------- Hero: the ADE Computer"), css.indexOf("/* ---------- end of the hero's ADE Computer"));
    expect(own.length).toBeGreaterThan(500);
    expect(own).not.toMatch(/url\(|@import|@font-face|https?:/);
    // A few KB on the wire (Pages serves both compressed): the two drawings, and their rules.
    expect(gzipSync(visual.outerHTML).length).toBeLessThan(4500);
    expect(gzipSync(own).length).toBeLessThan(2500);
  });
});

/** WCAG relative luminance and contrast, for opaque #rrggbb colours. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/** The custom properties of one theme block, by name. */
function tokens(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

describe("the hero drawing's text is readable in both themes", () => {
  const own = css.slice(css.indexOf("/* ---------- Hero: the ADE Computer"), css.indexOf("/* ---------- end of the hero's ADE Computer"));
  const light = tokens(/:root\s*\{([^}]*)\}/.exec(css)![1]);
  const dark = { ...light, ...tokens(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/.exec(css)![1]) };
  /** Each text colour the drawing uses, and the surfaces that text is drawn on. */
  const SURFACES: Record<string, string[]> = {
    "var(--text)": ["panel"],
    "var(--text-2)": ["panel", "panel-2"],
    "var(--text-3)": ["panel"],
    "var(--agent-green)": ["panel"],
    "#d7d8de": ["term-bg"],
    "#9a9ba3": ["term-bg"],
    "#ff7b72": ["term-bg"],
    "#3fb950": ["term-bg"],
  };
  const fills = [...own.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((m) => /\btext\b|\.hx-t-/.test(m[1]))
    .flatMap((m) => [...m[2].matchAll(/(?:^|[;\s])fill:\s*([^;]+);/g)].map((f) => f[1].trim()));

  it("every text colour is one whose surface is known", () => {
    expect(fills.length).toBeGreaterThan(5);
    for (const f of fills) expect(Object.keys(SURFACES), f).toContain(f);
  });

  it("each is at least 4.5 to 1 on its surface, light and dark", () => {
    for (const [name, theme] of [["light", light], ["dark", dark]] as const) {
      for (const f of new Set(fills)) {
        const ink = f.startsWith("var(") ? theme[f.slice(6, -1)] : f;
        for (const s of SURFACES[f]) {
          expect(contrast(ink, theme[s]), `${name}: ${f} on --${s}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it("terminal text is a fixed light colour, since the terminal is dark in both themes", () => {
    const term = [...own.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => /\.hx-t-term/.test(m[1]));
    expect(term.length).toBeGreaterThan(0);
    for (const m of term) expect(m[2], m[1].trim()).not.toMatch(/fill:\s*var\(/);
  });
});
