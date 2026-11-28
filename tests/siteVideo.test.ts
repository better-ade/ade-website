import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { BUILT, builtPages, parse, readBuilt, site } from "./paths";

/** The site carries no demo video: no player, no link to a video file, no "watch" anchor, and no video files. */

describe("no demo video on the site", () => {
  it("AC1: the built Home and Get started pages have no video; no built page links to /assets/video/ or #watch", () => {
    for (const path of ["index.html", "get-started/index.html"]) {
      const html = readBuilt(path);
      const doc = parse(html);
      expect(doc.querySelectorAll("video").length, path).toBe(0);
      expect(doc.querySelectorAll(".demo-video").length, path).toBe(0);
    }
    const pages = builtPages();
    expect(pages.length).toBeGreaterThan(1);
    for (const p of pages) {
      const doc = parse(readBuilt(p));
      for (const a of Array.from(doc.querySelectorAll("a[href]"))) {
        const href = a.getAttribute("href") ?? "";
        expect(href, p).not.toContain("/assets/video/");
        expect(href, p).not.toMatch(/#watch$/);
      }
    }
  });

  it("AC2: site/assets/video/ and _site/assets/video/ do not exist", () => {
    expect(existsSync(site("./assets/video"))).toBe(false);
    expect(existsSync(join(BUILT, "assets/video"))).toBe(false);
  });
});
