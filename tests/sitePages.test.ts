import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { BUILT, builtPages, isRedirect, parse, readBuilt, readSite } from "./paths";

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

/** The pages this site no longer has. Links to them are in the repos' READMEs, so each one still answers. */
const REMOVED = ["/guide/", "/guide/setup/", "/guide/ui/", "/guide/tickets/", "/guide/telegram/", "/guide/connectors/", "/guide/keys/", "/repos/", "/app/"];
/** Older addresses that used to redirect to one of those. */
const OLDER = [
  "/agent-hub/", "/guide/agents/", "/guide/anti-slop/", "/guide/contracts/", "/guide/files/", "/guide/integrations/", "/guide/project-setup/",
  "/guide/scratchpad/", "/guide/settings/", "/guide/shortcuts/", "/guide/sync/", "/guide/terminal/", "/guide/tokens/", "/guide/troubleshooting/",
];

describe("every page", () => {
  it("the site is three pages: the home page, Get started and the technical paper", () => {
    expect(CONTENT.map((p) => urlOf(p.path)).sort()).toEqual(["/", "/get-started/", "/paper/"]);
  });

  it("the guide, the Repos page and the ADE app page are gone, and each of their addresses redirects to the home page", () => {
    const moved = Object.fromEntries(
      PAGES.filter((p) => isRedirect(p.doc)).map(({ path, doc }) => [
        urlOf(path),
        /url=(\S+)/.exec(doc.querySelector('meta[http-equiv="refresh"]')!.getAttribute("content")!)![1],
      ]),
    );
    for (const u of REMOVED) expect(moved[u], u).toBe("/");
    // Every older address that pointed at one of them now points at the home page too: none is left behind them.
    for (const u of OLDER) expect(moved[u], u).toBe("/");
    for (const [from, to] of Object.entries(moved)) expect(["/", "/get-started/"], from).toContain(to);
    expect(moved["/training/"]).toBe("/get-started/");
    // The link a visitor is shown, when the refresh does not fire, goes to the same place.
    for (const { path, doc } of PAGES.filter((p) => isRedirect(p.doc))) {
      expect(doc.querySelector("main a")!.getAttribute("href"), path).toBe(moved[urlOf(path)]);
    }
    // Nothing still links to a removed address: not a page, not the header, not the footer.
    for (const { path, doc } of PAGES) {
      for (const a of doc.querySelectorAll("a[href]")) {
        const href = a.getAttribute("href")!.split("#")[0];
        expect([...REMOVED, ...OLDER].includes(href), `${path} -> ${href}`).toBe(false);
        expect(href, path).not.toMatch(/^\/(guide|repos|app)(\/|$)/);
      }
    }
  });

  it("the header's menu has no item for a removed page", () => {
    for (const { path, doc } of PAGES) {
      const items = [...doc.querySelectorAll("#site-nav a")].map((a) => (a.textContent ?? "").trim());
      expect(items, path).toEqual(["How it works", "Paper", "GitHub", "Get started"]);
      expect(doc.querySelector(".brand small"), path).toBeNull();
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

  // The app's page is gone; the scripts stay, because installs of the app and its own README fetch them from here.
});

/** The issue form the home page's first button falls back to. GitHub reads it from the default branch of this repo. */
const PREVIEW_FORM = ".github/ISSUE_TEMPLATE/ade-computer-preview.yml";
const PREVIEW_URL = "https://github.com/better-ade/ade-website/issues/new?template=ade-computer-preview.yml";

describe("the home page leads with ADE Computer", () => {
  const home = CONTENT.find((p) => p.path === "index.html")!.doc;
  const hero = home.querySelector("main section")!;

  it("the first section names ADE Computer in the page's one h1 block, and what it is", () => {
    expect(hero.querySelector("h1")).not.toBeNull();
    const text = (hero.textContent ?? "").replace(/\s+/g, " ");
    expect(text).toContain("ADE Computer");
    for (const word of ["Ubuntu desktop", "VS Code", "terminal", "database tools", "per project or per task", "your own Docker"]) {
      expect(text, word).toContain(word);
    }
  });

  // The button itself, and the email it opens, are held in tests/sitePreview.test.ts.
  it("the issue form the button falls back to exists, and Get started links it with the note that an issue is public", () => {
    expect(existsSync(join(BUILT, "..", PREVIEW_FORM))).toBe(true);
    const start = CONTENT.find((p) => p.path === "get-started/index.html")!.doc;
    const link = [...start.querySelectorAll("main a")].find((a) => a.getAttribute("href") === PREVIEW_URL)!;
    expect(link).toBeTruthy();
    expect((link.closest("li")!.textContent ?? "").replace(/\s+/g, " ")).toMatch(/public[^.]*put nothing private in it/);
  });

  it("the issue form asks the four questions, and opens with the note that issues are public", () => {
    const form = readFileSync(join(BUILT, "..", PREVIEW_FORM), "utf8");
    expect(form).toMatch(/^name: \S/m);
    expect(form).toMatch(/^description: \S/m);
    const types = [...form.matchAll(/^  - type: (\w+)/gm)].map((m) => m[1]);
    expect(types[0]).toBe("markdown");
    const note = form.slice(form.indexOf("- type: markdown"), form.indexOf("- type:", form.indexOf("- type: markdown") + 1));
    expect(note).toMatch(/public/);
    expect(note).toMatch(/nothing private/);
    const ids = [...form.matchAll(/^    id: ([a-z-]+)/gm)].map((m) => m[1]);
    expect(ids).toEqual(["use", "team-size", "platform", "anything-else"]);
    for (const os of ["macOS", "Linux"]) expect(form, os).toMatch(new RegExp(`^        - ${os}`, "m"));
    // Only what it would be used for is required; nobody is made to say more.
    expect([...form.matchAll(/required: true/g)].length).toBe(1);
    // No assignee, no person, no address: the form is client-neutral like the pages.
    expect(form).not.toMatch(/assignees:|@[A-Za-z0-9-]+|mailto:/);
  });
});

describe("keys", () => {
  // The keys guide is gone with the guide. What the home page still says about keys is held here.
  const home = CONTENT.find((p) => p.path === "index.html")!.doc;
  const card = [...home.querySelectorAll("#today .orx-card")].find((c) => c.querySelector(".feat-eyebrow")?.textContent === "Keys")!;

  it("the home page names the two places a key is typed, and that it is never in a chat, a file or a command line", () => {
    expect(card).toBeTruthy();
    const codes = [...card.querySelectorAll("code")].map((c) => c.textContent ?? "");
    for (const c of ["ade setup", "bin/keys set <name>"]) expect(codes, c).toContain(c);
    const text = (card.textContent ?? "").replace(/\s+/g, " ");
    for (const phrase of ["hidden prompt", "only at your own terminal", "Agents never see a value", "Never in a chat, a file or a command line"]) {
      expect(text, phrase).toContain(phrase);
    }
  });

  it("shows nothing shaped like a key", () => {
    for (const { path, doc } of CONTENT) {
      const body = doc.body.textContent ?? "";
      expect(body.match(/\b(sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_\w{20,}|AKIA[0-9A-Z]{16}|\d{8,10}:[A-Za-z0-9_-]{35})\b/g) ?? [], path).toEqual([]);
    }
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

  it("no link to a better-ade repo that is not on the list of public repos (a private repo is never linked)", () => {
    const listed = new Set([...readSite("_data/repos.yml").matchAll(/^- name: (\S+)/gm)].map((m) => m[1]));
    expect(listed.has("ade-cli") && listed.has("ade-website")).toBe(true);
    expect(listed.has("ade-computer")).toBe(false);
    for (const { path, doc } of PAGES) {
      for (const a of doc.querySelectorAll('a[href*="github.com/better-ade/"], a[href*="githubusercontent.com/better-ade/"]')) {
        const repo = /\/better-ade\/([^/?#]+)/.exec(a.getAttribute("href")!)![1];
        expect(listed.has(repo), `${path}: ${repo}`).toBe(true);
      }
    }
  });

  it("no command that installs or starts an ADE Computer, and no address of its image", () => {
    for (const { path, body } of text) {
      expect(body.match(/ade-computer\b|docker (pull|run|build|login)|ghcr\.io/gi) ?? [], path).toEqual([]);
    }
  });
});
