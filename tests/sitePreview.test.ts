import { beforeAll, describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { BUILT, builtPages, parse, readBuilt, readSite } from "./paths";

/**
 * "Ask for an early preview" opens an email. The address is never written in a page: site/assets/js/preview.js
 * builds the mailto link when the button is clicked. Without JavaScript the button is a plain link to this repo's
 * issue form, which a small link under it also opens.
 */
const FORM = ".github/ISSUE_TEMPLATE/ade-computer-preview.yml";
const FORM_URL = "https://github.com/better-ade/ade-website/issues/new?template=ade-computer-preview.yml";
const ADDRESS = ["preview", "ardata.tech"].join("@");
const html = readBuilt("index.html");
const home = parse(html);
const hero = home.querySelector("main section")!;
const script = readSite("assets/js/preview.js");

describe("the early preview button", () => {
  it("is the hero's first button, and without JavaScript it opens the issue form in this repo", () => {
    const first = hero.querySelector("a.btn")!;
    expect((first.textContent ?? "").trim()).toMatch(/^Ask for an early preview/);
    expect(first.getAttribute("href")).toBe(FORM_URL);
    expect(first.hasAttribute("data-preview-mail")).toBe(true);
    expect(existsSync(join(BUILT, "..", FORM))).toBe(true);
  });

  it("has a small link under it, 'or open a GitHub issue', to the same form, and no note about a public issue", () => {
    const cta = hero.querySelector(".hero-cta")!;
    const under = cta.nextElementSibling!;
    expect(under.classList.contains("hero-meta")).toBe(true);
    const link = under.querySelector("a")!;
    expect((link.textContent ?? "").trim()).toBe("or open a GitHub issue");
    expect(link.getAttribute("href")).toBe(FORM_URL);
    expect(link.hasAttribute("data-preview-mail")).toBe(false);
    expect(link.classList.contains("btn")).toBe(false);
    expect((hero.textContent ?? "").replace(/\s+/g, " ")).not.toMatch(/public GitHub issue|Put nothing private/);
  });

  it("every other link that asks for a preview on the home page behaves the same way", () => {
    const asks = [...home.querySelectorAll("main a")].filter((a) => /^Ask for an early preview/.test((a.textContent ?? "").trim()));
    expect(asks.length).toBeGreaterThanOrEqual(2);
    for (const a of asks) {
      expect(a.getAttribute("href")).toBe(FORM_URL);
      expect(a.hasAttribute("data-preview-mail")).toBe(true);
    }
  });

  it("the script is loaded on every page the way site.js is: a deferred file of the site's own, not inline", () => {
    for (const page of builtPages()) {
      const doc = parse(readBuilt(page));
      const [site, preview] = ["site", "preview"].map((n) => doc.querySelector(`head script[src^="/assets/js/${n}.js"]`)!);
      expect(preview, page).not.toBeNull();
      expect(preview.getAttributeNames().sort()).toEqual(site.getAttributeNames().sort());
      expect(preview.hasAttribute("defer")).toBe(true);
      expect(preview.textContent).toBe("");
    }
    expect(existsSync(join(BUILT, "assets/js/preview.js"))).toBe(true);
    // The policy lets it run because it is the site's own file; it needs, and gets, no wider allowance.
    const csp = /content="(default-src[^"]+)"/.exec(readSite("_includes/head.html"))![1];
    expect(csp).toMatch(/script-src 'self' 'sha256-[A-Za-z0-9+/=]+'(;|$)/);
  });
});

describe("the script builds the email on click", () => {
  let before: string | null;
  let after: string | null;
  let other: string | null;

  beforeAll(async () => {
    // The built hero, in this test's document; then the script itself, run as the page runs it.
    document.body.innerHTML = hero.outerHTML;
    // Stop the browser's own navigation, after the script has had the click.
    window.addEventListener("click", (e) => e.preventDefault());
    await import("../site/assets/js/preview.js");
    const button = document.querySelector<HTMLAnchorElement>("a[data-preview-mail]")!;
    before = button.getAttribute("href");
    // A click on the arrow inside the button counts as a click on the button.
    button.querySelector("span")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    after = button.getAttribute("href");
    const plain = document.querySelector<HTMLAnchorElement>(".hero-meta a")!;
    plain.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    other = plain.getAttribute("href");
  });

  it("until then the button still points at the issue form", () => {
    expect(before).toBe(FORM_URL);
  });

  it("on click it becomes a mailto to the preview address", () => {
    expect(after!.startsWith("mailto:")).toBe(true);
    expect(after!.slice("mailto:".length).split("?")[0]).toBe(ADDRESS);
  });

  it("with the subject, and a short body asking what for, the team size and the platform", () => {
    const query = after!.slice(after!.indexOf("?") + 1);
    // Encoded as mail programs expect: %20 and %0A, never a plus sign or a raw space or line break.
    expect(query).not.toMatch(/[+\s]/);
    const parts = Object.fromEntries(query.split("&").map((kv) => kv.split("=").map(decodeURIComponent)));
    expect(Object.keys(parts)).toEqual(["subject", "body"]);
    expect(parts.subject).toBe("ADE Computer early preview");
    const lines = parts.body.split("\n").filter((l: string) => l.trim() !== "");
    expect(lines.length).toBeLessThanOrEqual(6);
    expect(parts.body).toMatch(/What would you use it for\?/);
    expect(parts.body).toMatch(/Team size:/);
    expect(parts.body).toMatch(/Platform \(macOS or Linux\):/);
    // No name, price or promise in it.
    expect(parts.body).not.toMatch(/\$|pric|subscri|hosted/i);
  });

  it("leaves the GitHub link under the button alone", () => {
    expect(other).toBe(FORM_URL);
  });
});

describe("the address is never in a page as plain text", () => {
  it("no built page holds the address, an encoded form of it, or any mailto link", () => {
    for (const page of builtPages()) {
      const built = readBuilt(page);
      expect(built.includes(ADDRESS), page).toBe(false);
      expect(built.match(/mailto:/gi) ?? [], page).toEqual([]);
      expect(built.match(/preview\s*(@|&#0*64;|&#x0*40;|&commat;|%40|\(at\)|\[at\])\s*ardata/gi) ?? [], page).toEqual([]);
      expect(parse(built).body.textContent!.includes(ADDRESS), page).toBe(false);
    }
  });

  it("nor does the script's own source: it joins the parts when asked", () => {
    expect(script.includes(ADDRESS)).toBe(false);
    expect(script).not.toMatch(/@ardata/);
    expect(script).not.toMatch(/\beval\b|innerHTML|document\.write/);
  });
});
