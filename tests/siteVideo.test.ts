import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { BUILT, parse, readBuilt, site } from "./paths";

/**
 * The video of ADE's user flow on a fresh Ubuntu desktop: rendered by ade-drill's drill D4 in CI (RAW_RECORD=1, the
 * `ade-d4-video` artifact), shown on the home page in the hero, under its Get started call and at the top of Get started,
 * each time with the same caption: where it was recorded, and what in it is a stand-in.
 */
const MP4 = "/assets/video/ade-demo.mp4";
const POSTER = "/assets/video/ade-demo.png";
const CAPTION = "Feature to ship on a fresh Ubuntu desktop, recorded in CI. Claude sign-in and the agents' work are stand-ins.";
const MB = 1024 * 1024;

/** The movie's length in seconds, from its mvhd box (version 0 or 1). */
function seconds(buf: Buffer): number {
  const at = buf.indexOf("mvhd");
  expect(at, "the MP4 has an mvhd box").toBeGreaterThan(0);
  const v = buf[at + 4];
  if (v === 1) return Number(buf.readBigUInt64BE(at + 4 + 4 + 16 + 4)) / buf.readUInt32BE(at + 4 + 4 + 16);
  return buf.readUInt32BE(at + 4 + 4 + 8 + 4) / buf.readUInt32BE(at + 4 + 4 + 8);
}

const pages = { home: "index.html", "Get started": "get-started/index.html" };

describe("the video of the user flow", () => {
  it("is an MP4 under 10 MB and 90 s, with a PNG poster, in the site and in the built site", () => {
    const mp4 = readFileSync(site("." + MP4));
    expect(mp4.subarray(4, 8).toString()).toBe("ftyp");
    expect(mp4.length).toBeLessThan(10 * MB);
    const s = seconds(mp4);
    expect(s).toBeGreaterThan(20);
    expect(s).toBeLessThan(90);
    const png = readFileSync(site("." + POSTER));
    expect(png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
    expect(png.length).toBeLessThan(1 * MB);
    for (const f of [MP4, POSTER]) expect(statSync(join(BUILT, f)).size, f).toBe(statSync(site("." + f)).size);
  });

  for (const [name, path] of Object.entries(pages)) {
    it(`is on the ${name} page: controls, muted, playsinline, nothing loaded before a play, the poster, and the caption under it`, () => {
      const doc = parse(readBuilt(path));
      const videos = doc.querySelectorAll("main video");
      expect(videos.length).toBe(1);
      const v = videos[0];
      for (const a of ["controls", "muted", "playsinline"]) expect(v.hasAttribute(a), a).toBe(true);
      expect(v.getAttribute("preload")).toBe("none");
      expect(v.getAttribute("poster")).toBe(POSTER);
      expect(v.querySelector('source[type="video/mp4"]')!.getAttribute("src")).toBe(MP4);
      expect(v.hasAttribute("autoplay")).toBe(false);
      const fig = v.closest("figure")!;
      expect(fig).not.toBeNull();
      expect((fig.querySelector("figcaption")!.textContent ?? "").replace(/\s+/g, " ").trim()).toBe(CAPTION);
      expect(existsSync(join(BUILT, MP4))).toBe(true);
    });
  }

  it("on the home page, it is in the hero, after its Get started call", () => {
    const doc = parse(readBuilt("index.html"));
    const hero = doc.querySelector("section.hero")!;
    const call = hero.querySelector('a[href="/get-started/"]')!;
    const video = hero.querySelector("video")!;
    expect(call).not.toBeNull();
    expect(video).not.toBeNull();
    expect(call.compareDocumentPosition(video) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("on Get started, it comes before the first step", () => {
    const doc = parse(readBuilt("get-started/index.html"));
    const body = doc.querySelector(".page-body")!;
    const fig = body.querySelector("figure")!;
    const h2 = body.querySelector("h2")!;
    expect(fig.compareDocumentPosition(h2) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
