// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { chromium, webkit, type Browser, type BrowserContext, type Page } from "playwright";
import { BUILT } from "./paths";

/**
 * Story W-scenarios-stage: "How people use ADE" as one stage. A radio group of six people (no script: `:checked`
 * shows the picked person's panel), the picked person's scene large, and beside it their steps as a numbered
 * timeline with every title and full approved sentence shown, the step whose frame plays lit. Both engines.
 */
const SLUGS = ["jan", "alvin", "robert", "sam", "team", "mentor"];
const PEOPLE = ["Jan", "Alvin", "Robert", "Sam", "Ana, Ben, Chris", "Mia & Leo"];
const ROLES = ["engineer", "CTO", "consultant", "on call", "three engineers", "mentor"];
const COUNTS: Record<string, number> = { jan: 5, alvin: 4, robert: 4, sam: 3, team: 4, mentor: 4 };
const LEGEND = "Pick who you are";
const FRAME_MS = 3000;
const ENGINES = { chromium, webkit } as const;
const TYPES: Record<string, string> = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml",
  ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2", ".json": "application/json",
};

let server: Server;
let origin = "";
const browsers: Record<string, Browser> = {};

beforeAll(async () => {
  server = createServer((req, res) => {
    let file = normalize(join(BUILT, decodeURIComponent((req.url ?? "/").split("?")[0])));
    if (!file.startsWith(BUILT)) return res.writeHead(403).end();
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  const addr = server.address();
  origin = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;
  for (const [name, type] of Object.entries(ENGINES)) browsers[name] = await type.launch();
}, 60_000);

afterAll(async () => {
  await Promise.all(Object.values(browsers).map((b) => b.close()));
  await new Promise((ok) => server?.close(ok));
});

type Opts = { width?: number; height?: number; motion?: "no-preference" | "reduce" };
async function open(browser: string, o: Opts = {}): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browsers[browser].newContext({
    viewport: { width: o.width ?? 1280, height: o.height ?? 900 },
    reducedMotion: o.motion ?? "no-preference",
  });
  ctx.setDefaultTimeout(8000);
  const page = await ctx.newPage();
  await page.goto(`${origin}/`);
  await centre(page, "#scenarios fieldset");
  return { ctx, page };
}

/**
 * Scroll `selector` to the middle of the view at once, then wait until nothing moves: the page's smooth scrolling
 * is bypassed (behavior "instant"), the scroll position holds for two frames, and every CSS transition (the
 * reveal-on-scroll fade) has ended. Playwright's scrollIntoViewIfNeeded waited for a "stable" box, which a smooth
 * scroll or a reveal still in flight could outlast on a slow WebKit runner.
 */
async function centre(page: Page, selector: string) {
  await page.evaluate((sel) => {
    document.querySelector(sel)!.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
  }, selector);
  await page.waitForFunction(
    () =>
      new Promise<boolean>((done) => {
        const at = () => `${scrollX},${scrollY}`;
        const before = at();
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            done(at() === before && !document.getAnimations().some((a) => a instanceof CSSTransition)),
          ),
        );
      }),
  );
}

/** Pick a person by clicking their label (scrolled into view, as a visitor would). */
async function pick(page: Page, slug: string) {
  const label = page.locator(`#scenarios label[for="scn-who-${slug}"]`);
  await centre(page, `#scenarios label[for="scn-who-${slug}"]`);
  await label.click();
  await centre(page, `#scenarios [data-scenario="${slug}"]`);
}

/** Pause every scene animation at `ms`. */
const seek = (page: Page, ms: number) =>
  page.evaluate((t) => {
    for (const a of document.getAnimations()) {
      if ((a as CSSAnimation).animationName?.startsWith("scn-")) {
        a.pause();
        a.currentTime = t;
      }
    }
  }, ms);

/** Which panels are shown, and for the shown one: its stage, frames and steps as laid out. */
const layout = (page: Page) =>
  page.evaluate(() => {
    const shown = [...document.querySelectorAll("#scenarios [data-scenario]")].filter(
      (el) => (el as HTMLElement).offsetParent !== null && el.getBoundingClientRect().height > 0,
    );
    const panel = shown[0];
    if (!panel) return { shown: [] as string[], stage: null, frames: [], steps: [] };
    const r = (el: Element) => {
      const b = el.getBoundingClientRect();
      return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height };
    };
    return {
      shown: shown.map((el) => el.getAttribute("data-scenario")!),
      stage: r(panel.querySelector(".scn-stage")!),
      frames: [...panel.querySelectorAll(".scn-f")].map(r),
      steps: [...panel.querySelectorAll("ol > li")].map((li) => {
        const say = li.querySelector(".scn-say")!;
        const cs = getComputedStyle(li);
        return {
          title: r(li.querySelector("strong")!),
          say: r(say),
          sayClip: getComputedStyle(say).clipPath,
          lit: `${cs.borderTopColor}|${cs.color}`,
          animation: cs.animationName,
        };
      }),
    };
  });

const onStage = (f: { left: number; right: number }, s: { left: number; right: number }) =>
  f.left - s.left >= -1 && s.right - f.right >= -1;

describe("stage_people: one radio group of six people, Jan first and picked; picking shows only that person", () => {
  for (const browser of Object.keys(ENGINES)) {
    it(browser, async () => {
      const { ctx, page } = await open(browser);
      try {
        const group = page.locator("#scenarios fieldset");
        expect(await group.count()).toBe(1);
        const radios = group.locator('input[type="radio"]');
        expect(await radios.count()).toBe(6);
        expect(new Set(await radios.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).name))).size).toBe(1);
        expect(await radios.evaluateAll((els) => els.map((e) => e.id))).toEqual(SLUGS.map((s) => `scn-who-${s}`));
        // Each person is a label with a round drawing, the name, then the role under it.
        const labels = group.locator("label");
        expect(await labels.count()).toBe(6);
        expect(await labels.locator(".scn-name").allTextContents()).toEqual(PEOPLE);
        expect(await labels.locator(".scn-role").allTextContents()).toEqual(ROLES);
        expect(await labels.locator("svg.scn-av").count()).toBe(6);
        for (let i = 0; i < 6; i++) {
          const nm = await labels.nth(i).locator(".scn-name").boundingBox();
          const rl = await labels.nth(i).locator(".scn-role").boundingBox();
          expect(rl!.y, PEOPLE[i]).toBeGreaterThanOrEqual(nm!.y + nm!.height - 1);
        }
        // Jan is checked by default and is the only panel shown.
        expect(await radios.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).checked))).toEqual(
          SLUGS.map((s) => s === "jan"),
        );
        expect((await layout(page)).shown).toEqual(["jan"]);
        for (const slug of [...SLUGS.slice(1), "jan"]) {
          await pick(page, slug);
          expect(await page.locator(`#scn-who-${slug}`).isChecked(), slug).toBe(true);
          const l = await layout(page);
          expect(l.shown, slug).toEqual([slug]);
          expect(l.steps.length, slug).toBe(COUNTS[slug]);
          expect(l.stage!.width, slug).toBeGreaterThan(650); // large: the old card scene was at most 520 wide
        }
      } finally {
        await ctx.close();
      }
    }, 90_000);
  }
});

describe("stage_steps_shown: every title and full sentence is visible; the lit step follows the playing frame", () => {
  for (const browser of Object.keys(ENGINES)) {
    it(browser, async () => {
      const { ctx, page } = await open(browser);
      try {
        const problems: string[] = [];
        for (const slug of SLUGS) {
          await pick(page, slug);
          for (let k = 0; k < COUNTS[slug]; k++) {
            await seek(page, FRAME_MS * k + FRAME_MS / 2);
            const l = await layout(page);
            l.steps.forEach((s, i) => {
              if (s.title.width < 20 || s.title.height < 10) problems.push(`${slug} step ${i + 1}: the title is not shown`);
              if (s.say.width < 100 || s.say.height < 13 || s.sayClip !== "none") {
                problems.push(`${slug} step ${i + 1}: the sentence is hidden (${JSON.stringify(s.say)}, ${s.sayClip})`);
              }
            });
            // The step titled k+1 is lit; the others are not, and look the same.
            const lit = l.steps[k].lit;
            const others = l.steps.filter((_, i) => i !== k).map((s) => s.lit);
            if (others.some((o) => o === lit)) problems.push(`${slug} frame ${k + 1}: step ${k + 1} is not the only lit step`);
            if (new Set(others).size > 1) problems.push(`${slug} frame ${k + 1}: the unlit steps differ`);
            if (!onStage(l.frames[k], l.stage!)) problems.push(`${slug} frame ${k + 1} is not the one on the stage`);
          }
        }
        expect(problems).toEqual([]);
        // The steps sit beside the scene on a wide screen.
        await pick(page, "jan");
        const side = await page.evaluate(() => {
          const p = document.querySelector('#scenarios [data-scenario="jan"]')!;
          const st = p.querySelector(".scn-stage")!.getBoundingClientRect();
          const ol = p.querySelector("ol")!.getBoundingClientRect();
          return { stageRight: st.right, olLeft: ol.left, olTop: ol.top, stageBottom: st.bottom };
        });
        expect(side.olLeft).toBeGreaterThanOrEqual(side.stageRight);
        expect(side.olTop).toBeLessThan(side.stageBottom);
        // A progress line runs down the timeline: each step draws one.
        const line = await page.evaluate(() => {
          const li = document.querySelector('#scenarios [data-scenario="jan"] ol > li')!;
          const a = getComputedStyle(li, "::after");
          return { content: a.content, width: parseFloat(a.width), height: parseFloat(a.height) };
        });
        expect(line.content).not.toBe("none");
        expect(line.height).toBeGreaterThan(line.width);
      } finally {
        await ctx.close();
      }
    }, 120_000);
  }
});

describe("stage_keyboard: arrow keys move between people, focus shows, the group is named", () => {
  for (const browser of Object.keys(ENGINES)) {
    it(browser, async () => {
      const { ctx, page } = await open(browser);
      try {
        const group = page.getByRole("group", { name: LEGEND });
        expect(await group.count()).toBe(1);
        expect(await group.getByRole("radio").count()).toBe(6);
        for (const [i, who] of PEOPLE.entries()) {
          expect(await group.getByRole("radio", { name: `${who} ${ROLES[i]}`, exact: true }).count(), who).toBe(1);
        }
        await page.locator("#scn-who-jan").focus();
        const ring = (slug: string) =>
          page.evaluate((s) => {
            const lb = document.querySelector(`#scenarios label[for="scn-who-${s}"]`)!;
            const cs = getComputedStyle(lb);
            return cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2;
          }, slug);
        expect(await ring("alvin"), "no ring on a person without focus").toBe(false);
        for (const slug of SLUGS.slice(1)) {
          await page.keyboard.press("ArrowRight");
          expect(await page.evaluate(() => document.activeElement?.id), slug).toBe(`scn-who-${slug}`);
          expect(await page.locator(`#scn-who-${slug}`).isChecked(), slug).toBe(true);
          expect((await layout(page)).shown, slug).toEqual([slug]);
          expect(await ring(slug), `${slug}: focus is visible`).toBe(true);
        }
        await page.keyboard.press("ArrowLeft");
        expect(await page.locator("#scn-who-team").isChecked()).toBe(true);
        expect((await layout(page)).shown).toEqual(["team"]);
      } finally {
        await ctx.close();
      }
    }, 60_000);
  }
});

describe("stage_csp: no script, no style attribute, the CSP unchanged, each scene under 16 KB", () => {
  const html = readFileSync(join(BUILT, "index.html"), "utf8");
  const start = html.indexOf('<section class="section" id="scenarios">');
  const section = html.slice(start, html.indexOf("</section>", start));

  it("the section has no script, no style attribute or element, no handler and no address but #", () => {
    expect(start).toBeGreaterThan(-1);
    expect(section).not.toMatch(/<script|<style|<iframe|<img|<image/i);
    expect(section).not.toMatch(/\s(style|on[a-z]+)\s*=/i);
    for (const m of section.matchAll(/\s(?:xlink:)?href="([^"]*)"/g)) expect(m[1]).toMatch(/^#/);
    // The picker is markup only: a fieldset with a legend, radios and labels.
    expect(section).toMatch(/<fieldset[^>]*>\s*<legend[^>]*>Pick who you are<\/legend>/);
    expect((section.match(/<input [^>]*type="radio"/g) ?? []).length).toBe(6);
  });

  it("each scene stays under 16 KB", () => {
    const scenes = [...section.matchAll(/<svg class="scn-scene[\s\S]*?<\/svg>/g)].map((m) => m[0]);
    expect(scenes.length).toBe(6);
    for (const s of scenes) expect(s.length).toBeLessThan(16 * 1024);
  });

  it("the content security policy in head.html is unchanged", () => {
    const head = readFileSync(resolve(__dirname, "../site/_includes/head.html"), "utf8");
    expect(head).toContain(
      `content="default-src 'self'; script-src 'self' 'sha256-FsIZN6Mqzes8U6LwztrW72hqF7cLDnCGBES+X937vAQ='; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'none'; object-src 'none'"`,
    );
    let changed = "";
    try {
      changed = execFileSync("git", ["diff", "--name-only", "origin/main", "--", "site/_includes/head.html"], {
        cwd: resolve(__dirname, ".."),
        encoding: "utf8",
      });
    } catch {
      changed = ""; // no git history (an export): the policy text above still holds it
    }
    expect(changed.trim()).toBe("");
  });
});

describe("stage_phone: at 390px the people row scrolls sideways, the page does not, the scene fits, text is 13px+", () => {
  for (const browser of Object.keys(ENGINES)) {
    it(browser, async () => {
      const { ctx, page } = await open(browser, { width: 390, height: 844 });
      try {
        for (const slug of SLUGS) {
          await pick(page, slug);
          const m = await page.evaluate((s) => {
            const row = document.querySelector("#scenarios .scn-row")!;
            const rs = getComputedStyle(row);
            const panel = document.querySelector(`#scenarios [data-scenario="${s}"]`)!;
            const st = panel.querySelector(".scn-stage")!.getBoundingClientRect();
            const small: string[] = [];
            const walker = document.createTreeWalker(panel.querySelector("ol")!, NodeFilter.SHOW_TEXT);
            for (let n = walker.nextNode(); n; n = walker.nextNode()) {
              if (!n.textContent!.trim()) continue;
              const px = parseFloat(getComputedStyle(n.parentElement!).fontSize);
              if (!(px >= 13)) small.push(`"${n.textContent!.trim()}": ${px}px`);
            }
            for (const t of document.querySelectorAll("#scenarios .scn-row label span")) {
              const px = parseFloat(getComputedStyle(t).fontSize);
              if (!(px >= 13)) small.push(`label "${t.textContent}": ${px}px`);
            }
            return {
              rowScrolls: row.scrollWidth > row.clientWidth + 1,
              overflowX: rs.overflowX,
              snap: rs.scrollSnapType,
              pageWide: document.documentElement.scrollWidth - document.documentElement.clientWidth,
              stage: { left: st.left, right: st.right, width: st.width },
              view: document.documentElement.clientWidth,
              small,
            };
          }, slug);
          expect(m.rowScrolls, slug).toBe(true);
          expect(["auto", "scroll"]).toContain(m.overflowX);
          expect(m.snap).toMatch(/^x/);
          expect(m.pageWide, `${slug}: the page scrolls sideways`).toBeLessThanOrEqual(0);
          expect(m.stage.left, slug).toBeGreaterThanOrEqual(0);
          expect(m.stage.right, slug).toBeLessThanOrEqual(m.view);
          expect(m.stage.width, slug).toBeGreaterThan(300);
          expect(m.small, slug).toEqual([]);
        }
      } finally {
        await ctx.close();
      }
    }, 90_000);
  }
});

describe("stage_reduced: with reduced motion each scene is the still strip and every step is shown and lit", () => {
  for (const browser of Object.keys(ENGINES)) {
    it(browser, async () => {
      const { ctx, page } = await open(browser, { motion: "reduce" });
      try {
        for (const slug of SLUGS) {
          await pick(page, slug);
          const l = await layout(page);
          expect(l.shown, slug).toEqual([slug]);
          // Every frame side by side on the stage, nothing moving.
          expect(l.frames.length, slug).toBe(COUNTS[slug]);
          for (const [i, f] of l.frames.entries()) expect(onStage(f, l.stage!), `${slug} frame ${i + 1}`).toBe(true);
          const running = await page.evaluate(
            () => document.getAnimations().filter((a) => (a as CSSAnimation).animationName?.startsWith("scn-")).length,
          );
          expect(running, slug).toBe(0);
          // Every step shown in full and lit alike.
          expect(new Set(l.steps.map((s) => s.lit)).size, slug).toBe(1);
          for (const [i, s] of l.steps.entries()) {
            expect(s.say.width > 100 && s.sayClip === "none", `${slug} step ${i + 1}`).toBe(true);
            expect(s.animation, `${slug} step ${i + 1}`).toBe("none");
          }
        }
        // The lit look is the lit one (the same as the playing step's in motion), not the dimmed one.
        const reduced = (await layout(page)).steps[0].lit;
        const moving = await open(browser);
        try {
          await pick(moving.page, "mentor");
          await seek(moving.page, FRAME_MS / 2);
          expect((await layout(moving.page)).steps[0].lit).toBe(reduced);
        } finally {
          await moving.ctx.close();
        }
      } finally {
        await ctx.close();
      }
    }, 90_000);
  }
});
