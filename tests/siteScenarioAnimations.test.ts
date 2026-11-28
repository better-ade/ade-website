import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { parse, readBuilt, readSite } from "./paths";

/** Story W-scenario-animations: each scenario card plays as a small CSS-animated scene, one frame per step. */
const home = parse(readBuilt("index.html"));
const css = readSite("assets/css/site.css");
const plain = (s: string) => s.replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();
const flat = (el: Element | null) => plain(el?.textContent ?? "");
const cards = () => [...home.querySelectorAll("#scenarios [data-scenario]")];
const COUNTS: Record<string, number> = { jan: 5, alvin: 4, robert: 4, sam: 3, team: 4, mentor: 4 };
const WHO: Record<string, string[]> = {
  jan: ["Jan"],
  alvin: ["Alvin"],
  robert: ["Robert"],
  sam: ["Sam"],
  team: ["Ana", "Ben", "Chris"],
  mentor: ["Mia", "Leo"],
};
const FRAME = 3; // seconds a frame plays
const slug = (c: Element) => c.getAttribute("data-scenario")!;
const scene = (c: Element) => c.querySelector("svg")!;
const frames = (c: Element) => [...scene(c).children].filter((e) => e.classList.contains("scn-f"));

/** The body of the first `@media (<query>)` block that holds `needle`, braces balanced. */
function media(query: string, needle: string): string {
  let from = 0;
  for (;;) {
    const at = css.indexOf(`@media (${query})`, from);
    if (at < 0) return "";
    let depth = 0;
    let i = css.indexOf("{", at);
    const start = i;
    for (; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}" && --depth === 0) break;
    }
    const body = css.slice(start + 1, i);
    if (body.includes(needle)) return body;
    from = i;
  }
}
const keyframes = (name: string) => new RegExp(`@keyframes ${name} \\{`).test(css);

describe("anim_scenes", () => {
  it("each of the six cards has one inline SVG scene, a group per step in step order, named for its people", () => {
    expect(cards().map(slug)).toEqual(Object.keys(COUNTS));
    for (const c of cards()) {
      const svgs = c.querySelectorAll("svg");
      expect(svgs.length, slug(c)).toBe(1);
      const svg = scene(c);
      expect(svg.getAttribute("role"), slug(c)).toBe("img");
      const name = svg.getAttribute("aria-label") ?? "";
      for (const who of WHO[slug(c)]) expect(name, slug(c)).toContain(who);
      const n = COUNTS[slug(c)];
      expect(frames(c).map((f) => f.tagName.toLowerCase()), slug(c)).toEqual(Array(n).fill("g"));
      expect(frames(c).map((f) => f.classList.contains(`scn-f${frames(c).indexOf(f) + 1}`)), slug(c)).toEqual(Array(n).fill(true));
      expect(c.querySelectorAll("ol > li").length, slug(c)).toBe(n);
      expect(c.classList.contains(`scn-n${n}`), `${slug(c)} carries scn-n${n}`).toBe(true);
      // The scene comes between the heading and the titles.
      expect(svg.compareDocumentPosition(c.querySelector("ol")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(c.querySelector("h3")!.compareDocumentPosition(svg) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it("the frames sit side by side in the drawing (a still strip), one 320-wide slot each", () => {
    for (const c of cards()) {
      const n = COUNTS[slug(c)];
      expect(scene(c).getAttribute("viewBox"), slug(c)).toBe(`0 0 ${320 * n} 180`);
      frames(c).forEach((f, i) => {
        expect(f.getAttribute("transform"), `${slug(c)} frame ${i + 1}`).toBe(i === 0 ? null : `translate(${320 * i} 0)`);
      });
    }
  });
});

describe("anim_titles", () => {
  it("only the bold step titles show; each full approved sentence stays in the card, visually hidden", () => {
    for (const c of cards()) {
      for (const li of c.querySelectorAll("ol > li")) {
        const kids = [...li.children];
        expect(kids.map((k) => k.tagName.toLowerCase()), flat(li)).toEqual(["strong", "span"]);
        expect(kids[1].classList.contains("scn-say"), flat(li)).toBe(true);
        expect(flat(kids[1]).length, flat(li)).toBeGreaterThan(10);
        // Nothing but the title and the hidden sentence: no loose text that would show.
        const loose = [...li.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
        expect(loose, flat(li)).toEqual([]);
      }
    }
    const say = /\.scn-say \{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(say).toMatch(/position: absolute/);
    expect(say).toMatch(/width: 1px/);
    expect(say).toMatch(/clip-path: inset\(50%\)/);
    expect(say).not.toMatch(/display: none|visibility: hidden/);
  });

  it("the current title is marked as its frame plays: the same timing and delay as its frame", () => {
    const motion = media("prefers-reduced-motion: no-preference", ".scn-f");
    for (const n of [3, 4, 5]) {
      expect(motion).toMatch(new RegExp(`\\.scn-n${n} li \\{ animation: scn-l${n} ${n * FRAME}s linear infinite; \\}`));
      expect(keyframes(`scn-l${n}`), `scn-l${n}`).toBe(true);
      for (let i = 2; i <= n; i++) {
        const d = -(n - i + 1) * FRAME;
        expect(motion, `n${n} step ${i}`).toContain(`.scn-n${n} .scn-f${i}, .scn-n${n} li:nth-child(${i}) { animation-delay: ${d}s; }`);
      }
    }
  });
});

describe("anim_motion", () => {
  it("CSS keyframes only, about 3 s a frame, looping, and only when motion is welcome", () => {
    const motion = media("prefers-reduced-motion: no-preference", ".scn-f");
    expect(motion).not.toBe("");
    for (const n of [3, 4, 5]) {
      expect(keyframes(`scn-f${n}`), `scn-f${n}`).toBe(true);
      expect(motion).toMatch(new RegExp(`\\.scn-n${n} \\.scn-f \\{ animation: scn-f${n} ${n * FRAME}s linear infinite; \\}`));
      expect(motion).toMatch(new RegExp(`\\.scn-n${n} \\.scn-scene \\{ width: ${n}00%; \\}`));
    }
    // Every scene animation is declared inside the no-preference block.
    const outside = css.replace(motion, "");
    expect(outside).not.toMatch(/\.scn[^{]*\{[^}]*animation: (?!none)/);
  });

  it("with reduced motion nothing moves: the frames show as a still strip and every title shows", () => {
    const reduce = media("prefers-reduced-motion: reduce", ".scn");
    expect(reduce).toMatch(/\.scn \* \{ animation: none !important; \}/);
    // The strip is the base style: the scene at the card's width, every frame visible in its own slot.
    expect(css).toMatch(/\.scn-scene \{[^}]*width: 100%;[^}]*\}/);
    expect(css).not.toMatch(/(^|\n)\.scn-f \{[^}]*opacity: 0/);
    expect(css).not.toMatch(/(^|\n)\.scn-steps li \{[^}]*opacity/);
  });
});

describe("anim_csp", () => {
  it("no script, no style attribute, no address and no new file in the scenes", () => {
    const section = home.querySelector("#scenarios")!;
    expect(section.querySelectorAll("script, style, image, img, foreignObject, iframe").length).toBe(0);
    for (const el of section.querySelectorAll("*")) {
      for (const { name, value } of [...el.attributes]) {
        expect(name, el.tagName).not.toMatch(/^(style|on[a-z]+)$/);
        if (/href$/.test(name)) expect(value, el.tagName).toMatch(/^#/);
      }
    }
  });

  it("the content security policy in head.html is unchanged", () => {
    const head = readSite("_includes/head.html");
    expect(head).toContain(
      `content="default-src 'self'; script-src 'self' 'sha256-FsIZN6Mqzes8U6LwztrW72hqF7cLDnCGBES+X937vAQ='; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'none'; object-src 'none'"`,
    );
    const changed = (() => {
      try {
        return execFileSync("git", ["diff", "--name-only", "origin/main", "--", "site/_includes/head.html"], {
          cwd: resolve(__dirname, ".."),
          encoding: "utf8",
        });
      } catch {
        return ""; // no git history (an export): the policy text above still holds it
      }
    })();
    expect(changed.trim()).toBe("");
  });

  it("each scene stays under 8 KB of SVG", () => {
    for (const c of cards()) expect(scene(c).outerHTML.length, slug(c)).toBeLessThan(8 * 1024);
  });
});

describe("anim_phone", () => {
  it("each scene scales to its card's width, clipped to one frame, so a phone never scrolls sideways", () => {
    for (const c of cards()) {
      const svg = scene(c);
      expect(svg.hasAttribute("width"), slug(c)).toBe(false);
      expect(svg.hasAttribute("height"), slug(c)).toBe(false);
      expect(svg.parentElement!.classList.contains("scn-stage"), slug(c)).toBe(true);
    }
    expect(css).toMatch(/\.scn-stage \{[^}]*overflow: hidden;[^}]*\}/);
    expect(css).toMatch(/\.scn-scene \{[^}]*height: auto;[^}]*\}/);
    // Labels stay readable at phone width: no scene text under 13 user units.
    const sizes = [...css.matchAll(/\.scn-scene[^{]*\{[^}]*font: \d+ (\d+)px/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(0);
    for (const s of sizes) expect(s).toBeGreaterThanOrEqual(13);
  });
});
