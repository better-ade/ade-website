import { describe, it, expect } from "vitest";
import { builtPages, readBuilt, readSite } from "./paths";
import { createHash } from "node:crypto";

const head = readSite("_includes/head.html");

const csp = /content="(default-src[^"]+)"/.exec(head)?.[1] ?? "";
const inlineScripts = (src: string) =>
  [...src.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const hashOf = (body: string) => `'sha256-${createHash("sha256").update(body).digest("base64")}'`;

/**
 * GitHub Pages serves no response headers of our choosing, so the policy lives
 * in a meta tag. That buys real protection only while the allowance stays
 * narrow: one inline script, named by hash.
 *
 * A hash is exact. Editing the pre-paint theme setter by a single byte stops it
 * executing, and because it runs before first paint, the page would render in
 * the wrong theme with nothing in the console that points at the cause. These
 * tests make that a failed build instead of a confusing bug report.
 */
describe("the site's content security policy", () => {
  it("names the head's inline script by hash", () => {
    const scripts = inlineScripts(head);
    expect(scripts.length).toBeGreaterThan(0);
    for (const body of scripts) expect(csp, `inline script not in the policy: ${body.trim().slice(0, 48)}`).toContain(hashOf(body));
  });

  it("every built page carries the policy, and no inline script beyond the one it names", () => {
    for (const page of builtPages()) {
      const html = readBuilt(page);
      expect(html, page).toContain(`content="${csp}"`);
      for (const body of inlineScripts(html)) expect(csp, `${page}: inline script not in the policy`).toContain(hashOf(body));
      expect(inlineScripts(html).length, `${page}: only the theme setter is inline`).toBe(1);
    }
  });

  it("no page uses an inline style attribute or event handler, which the policy would block", () => {
    for (const page of builtPages()) {
      const html = readBuilt(page);
      expect(html.match(/<[^>]+\sstyle="/g) ?? [], `${page}: style attribute`).toEqual([]);
      expect(html.match(/<[^>]+\son[a-z]+="/g) ?? [], `${page}: inline event handler`).toEqual([]);
    }
  });

  it("does not fall back to allowing inline script wholesale", () => {
    expect(csp).not.toContain("'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it("allows exactly the outside origins the pages actually use", () => {
    expect(csp).toContain("https://fonts.googleapis.com"); // stylesheet
    expect(csp).toContain("https://fonts.gstatic.com");    // font files
    // The ADE app's page is gone, and with it the one call the site made to another origin (the app's latest
    // release): scripts connect to nothing but the site itself, and no script names another origin.
    expect(csp).toMatch(/connect-src 'self'(;|$)/);
    expect(csp).not.toContain("api.github.com");
    for (const file of ["assets/js/site.js", "assets/js/preview.js"]) {
      expect(readSite(file), file).not.toMatch(/\bfetch\(|XMLHttpRequest|sendBeacon|https?:\/\//);
    }
  });

  it("locks down the directives that have no legitimate use here", () => {
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it("sets a referrer policy, which a meta tag can do where a header cannot", () => {
    expect(head).toMatch(/<meta name="referrer" content="strict-origin-when-cross-origin">/);
  });
});
