import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { BUILT, builtPages, isRedirect, parse, readBuilt } from "./paths";

/**
 * Checks on the built site (_site), page by page: what a visitor and a search engine get. The verification command
 * builds the site before running the tests.
 */
const PAGES = builtPages().map((path) => ({ path, doc: parse(readBuilt(path)) }));
const CONTENT = PAGES.filter((p) => !isRedirect(p.doc));
const urlOf = (path: string) => "/" + path.replace(/index\.html$/, "");

/** The file a site-relative URL resolves to, or null. */
function fileFor(url: string): string | null {
  const clean = decodeURI(url.split("#")[0].split("?")[0]);
  const p = join(BUILT, clean);
  if (existsSync(p) && statSync(p).isFile()) return p;
  if (existsSync(join(p, "index.html"))) return join(p, "index.html");
  return null;
}

describe("every page", () => {
  it("the site has the pages the narrative calls for", () => {
    const urls = CONTENT.map((p) => urlOf(p.path));
    for (const u of ["/", "/get-started/", "/guide/", "/guide/setup/", "/guide/ui/", "/guide/tickets/", "/guide/telegram/", "/guide/keys/", "/repos/", "/app/"]) {
      expect(urls, u).toContain(u);
    }
  });

  it("has a title and a description, and no two pages share a title", () => {
    const titles = new Map<string, string>();
    for (const { path, doc } of PAGES) {
      const title = doc.querySelector("title")?.textContent?.trim() ?? "";
      const desc = doc.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "";
      expect(title.length, `${path}: title`).toBeGreaterThan(3);
      expect(desc.length, `${path}: description`).toBeGreaterThan(40);
      expect(titles.get(title), `${path} and ${titles.get(title)} share the title "${title}"`).toBeUndefined();
      titles.set(title, path);
      expect(doc.querySelectorAll("h1").length, `${path}: one h1`).toBe(1);
    }
  });

  it("every internal link and image resolves to a built file, and every #anchor to an id on its page", () => {
    const broken: string[] = [];
    for (const { path, doc } of PAGES) {
      const refs = [
        ...[...doc.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")!),
        ...[...doc.querySelectorAll("img[src], script[src]")].map((e) => e.getAttribute("src")!),
        ...[...doc.querySelectorAll('link[rel="stylesheet"][href], link[rel="icon"][href], link[rel="apple-touch-icon"][href]')]
          .map((e) => e.getAttribute("href")!),
      ];
      for (const ref of refs) {
        if (/^(https?:|mailto:)/.test(ref)) continue;
        const [target, anchor] = ref.startsWith("#") ? [urlOf(path), ref.slice(1)] : ref.split("#");
        expect(target.startsWith("/"), `${path}: relative link ${ref} (use relative_url)`).toBe(true);
        const file = fileFor(target);
        if (!file) { broken.push(`${path} -> ${ref}`); continue; }
        if (anchor && file.endsWith(".html")) {
          const t = parse(readFileSync(file, "utf8"));
          if (!t.getElementById(anchor)) broken.push(`${path} -> ${ref} (no #${anchor})`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it("every old address points at a page that exists", () => {
    const redirects = PAGES.filter((p) => isRedirect(p.doc));
    expect(redirects.length).toBeGreaterThan(0);
    for (const { path, doc } of redirects) {
      const to = /url=(\S+)/.exec(doc.querySelector('meta[http-equiv="refresh"]')!.getAttribute("content")!)![1];
      expect(fileFor(to), `${path} -> ${to}`).not.toBeNull();
      expect(doc.querySelector('meta[name="robots"]')?.getAttribute("content"), path).toBe("noindex");
    }
  });

  it("the sitemap lists every content page and no moved one", () => {
    const sitemap = readFileSync(join(BUILT, "sitemap.xml"), "utf8");
    const locs = [...sitemap.matchAll(/<loc>https?:\/\/[^/<]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
    for (const { path } of CONTENT) expect(locs, path).toContain(urlOf(path));
    for (const { path } of PAGES.filter((p) => isRedirect(p.doc))) expect(locs, path).not.toContain(urlOf(path));
  });
});

describe("the ADE app's installers", () => {
  it("are served from the site root, as the frozen app's install command expects", () => {
    const sh = readFileSync(join(BUILT, "install.sh"), "utf8");
    expect(sh.split("\n")[0]).toMatch(/^#!/);
    expect(statSync(join(BUILT, "install.ps1")).size).toBeGreaterThan(0);
  });

  it("the app page gives the install command and links both scripts", () => {
    const app = CONTENT.find((p) => p.path === "app/index.html")!.doc;
    expect(app.body.textContent).toContain("curl -fsSL https://ade.ardata.tech/install.sh | bash");
    const hrefs = [...app.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/install.sh");
    expect(hrefs).toContain("/install.ps1");
  });
});

describe("what the pages never say", () => {
  const text = CONTENT.map(({ path, doc }) => ({ path, body: doc.body.textContent ?? "" }));

  it("no pricing, subscription or hosted service", () => {
    for (const { path, body } of text) {
      expect(body.match(/\bpric(e|es|ing)\b|subscri(be|ption)|hosted (service|version)|per seat|\$\s?\d/gi) ?? [], path).toEqual([]);
    }
  });

  it("no AI attribution", () => {
    for (const { path, body } of text) expect(body.match(/generated with|co-authored-by/gi) ?? [], path).toEqual([]);
  });

  it("GitHub links go only to the better-ade organisation or BMAD, never to a personal account", () => {
    for (const { path, doc } of PAGES) {
      for (const a of doc.querySelectorAll('a[href*="github.com"]')) {
        const href = a.getAttribute("href")!;
        expect(href, path).toMatch(/^https:\/\/(github\.com|raw\.githubusercontent\.com)\/(better-ade|bmad-code-org)(\/|$)/);
      }
    }
  });
});
