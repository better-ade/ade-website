// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, join, normalize } from "node:path";
import { chromium, webkit, type Browser, type BrowserType, type Page } from "playwright";
import { BUILT } from "./paths";

/**
 * Story W-scenario-animations-webkit: the scenario scenes paint in a real browser engine, WebKit (Safari, every
 * iPhone browser) as well as Chromium. jsdom does no layout or painting, so this test drives both engines over the
 * built home page. Browsers: `npx playwright install chromium webkit` (CI does it).
 */
const SLUGS = ["jan", "alvin", "robert", "sam", "team", "mentor"];
const FRAME_MS = 3000;
const TIMES = [1500, 4500]; // the middle of the first and of the second frame
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
  for (const [name, type] of [["chromium", chromium], ["webkit", webkit]] as [string, BrowserType][]) {
    browsers[name] = await type.launch();
  }
}, 60_000);

afterAll(async () => {
  await Promise.all(Object.values(browsers).map((b) => b.close()));
  await new Promise((ok) => server?.close(ok));
});

/** Share of a PNG's pixels that differ from its most common colour, decoded in a blank page of the same browser. */
async function inked(decoder: Page, png: Buffer): Promise<number> {
  return decoder.evaluate(async (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const bmp = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const cv = document.createElement("canvas");
    cv.width = bmp.width;
    cv.height = bmp.height;
    const cx = cv.getContext("2d")!;
    cx.drawImage(bmp, 0, 0);
    const px = cx.getImageData(0, 0, cv.width, cv.height).data;
    const counts = new Map<number, number>();
    for (let i = 0; i < px.length; i += 4) {
      const k = ((px[i] >> 3) << 10) | ((px[i + 1] >> 3) << 5) | (px[i + 2] >> 3);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const total = px.length / 4;
    return total ? 1 - Math.max(...counts.values()) / total : 0;
  }, png.toString("base64"));
}

/** Every card scrolled into view (so the page's reveal-on-scroll shows it), then the scene animations paused at `ms`. */
async function settle(page: Page) {
  for (const slug of SLUGS) {
    const card = page.locator(`[data-scenario="${slug}"]`);
    await card.scrollIntoViewIfNeeded();
    await page.waitForFunction(
      (s) => getComputedStyle(document.querySelector(`[data-scenario="${s}"]`)!).opacity === "1",
      slug,
      { timeout: 5000 },
    );
  }
}
const seek = (page: Page, ms: number) =>
  page.evaluate((t) => {
    for (const a of document.getAnimations()) {
      if ((a as CSSAnimation).animationName?.startsWith("scn-")) {
        a.pause();
        a.currentTime = t;
      }
    }
  }, ms);

type Run = { browser: string; width: number; height: number; motion: "no-preference" | "reduce"; scheme: "light" | "dark" };
const RUNS: Run[] = [];
for (const browser of ["chromium", "webkit"]) {
  for (const [width, height] of [[1280, 900], [390, 844]]) {
    for (const motion of ["no-preference", "reduce"] as const) RUNS.push({ browser, width, height, motion, scheme: "light" });
  }
  RUNS.push({ browser, width: 1280, height: 900, motion: "no-preference", scheme: "dark" });
}

describe("anim_webkit: each scenario scene paints in WebKit and Chromium", () => {
  for (const run of RUNS) {
    const label = `${run.browser} ${run.width}px ${run.scheme}${run.motion === "reduce" ? ", reduced motion" : ""}`;
    it(label, async () => {
      const ctx = await browsers[run.browser].newContext({
        viewport: { width: run.width, height: run.height },
        reducedMotion: run.motion,
        colorScheme: run.scheme,
      });
      try {
        const page = await ctx.newPage();
        const decoder = await ctx.newPage();
        await page.goto(`${origin}/`);
        await settle(page);
        const problems: string[] = [];
        for (const t of run.motion === "reduce" ? [0] : TIMES) {
          if (run.motion !== "reduce") await seek(page, t);
          for (const slug of SLUGS) {
            const stage = page.locator(`[data-scenario="${slug}"] .scn-stage`);
            const box = await stage.boundingBox();
            if (!box || box.width < 1 || box.height < 1) {
              problems.push(`${slug} at ${t} ms: the scene has no size`);
              continue;
            }
            if (run.motion !== "reduce") {
              // The frame that is playing must sit inside the stage, not in its slot to the right.
              const where = await page.evaluate(
                ([s, i]) => {
                  const st = document.querySelector(`[data-scenario="${s}"] .scn-stage`)!.getBoundingClientRect();
                  const f = document.querySelectorAll(`[data-scenario="${s}"] .scn-f`)[i].getBoundingClientRect();
                  return { left: f.left - st.left, right: st.right - f.right };
                },
                [slug, Math.floor(t / FRAME_MS)] as const,
              );
              if (where.left < -1 || where.right < -1) {
                problems.push(`${slug} at ${t} ms: frame ${Math.floor(t / FRAME_MS) + 1} is off the stage (${JSON.stringify(where)})`);
              }
            }
            const share = await inked(decoder, await stage.screenshot({ animations: "allow" }));
            if (share < 0.03) problems.push(`${slug} at ${t} ms: the scene is blank (${(share * 100).toFixed(1)}% drawn)`);
          }
        }
        expect(problems).toEqual([]);
      } finally {
        await ctx.close();
      }
    }, 90_000);
  }
});

/** Story W-scenario-scenes-premium: no text in a premium scene renders under 13px at phone width. */
const PREMIUM = ["jan"];
describe("premium_text: every text in a premium scene renders at 13px or larger at 390px wide", () => {
  for (const browser of ["chromium", "webkit"]) {
    it(browser, async () => {
      const ctx = await browsers[browser].newContext({ viewport: { width: 390, height: 844 } });
      try {
        const page = await ctx.newPage();
        await page.goto(`${origin}/`);
        await settle(page);
        await seek(page, 1500); // every frame settled after its ease-in
        const small = await page.evaluate((slugs) => {
          const out: string[] = [];
          let seen = 0;
          for (const s of slugs) {
            for (const t of document.querySelectorAll(`[data-scenario="${s}"] svg text`)) {
              seen++;
              const px = parseFloat(getComputedStyle(t).fontSize) * (t as SVGTextElement).getScreenCTM()!.a;
              if (!(px >= 13)) out.push(`${s} "${t.textContent}": ${px.toFixed(2)}px`);
            }
          }
          return seen ? out : ["no text found"];
        }, PREMIUM);
        expect(small).toEqual([]);
      } finally {
        await ctx.close();
      }
    }, 60_000);
  }
});
