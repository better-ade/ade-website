import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BUILT, builtPages, parse, readBuilt, readRepo, readSite } from "./paths";

/**
 * The technical paper, at /paper/. Its text comes from the paper's source through scripts/paper-page.py; the page
 * is held here to its place on the site, and to the repos where it names a role, a release or a service. Every
 * `ade` command and every Coming item in it is also covered by tests/siteTruth.test.ts, which reads every page.
 */
const PDF = "/assets/ade-whitepaper.pdf";
const paper = parse(readBuilt("paper/index.html"));
const main = paper.querySelector("main")!;
const text = (main.textContent ?? "").replace(/\s+/g, " ");

describe("the technical paper's page", () => {
  it("exists at /paper/, with its title as the one h1, the byline and a description", () => {
    expect(builtPages()).toContain("paper/index.html");
    expect(paper.querySelectorAll("h1").length).toBe(1);
    expect(paper.querySelector("h1")!.textContent).toBe("Fast and verified: delivering software with a team of AI agents");
    expect((main.querySelector(".lead")!.textContent ?? "").trim()).toBe("The ADE team · Conceived May 2025 · This edition November 2026");
    expect(text).not.toMatch(/draft for review/i);
    expect(paper.querySelector('meta[name="description"]')!.getAttribute("content")!.length).toBeGreaterThan(80);
  });

  it("is in the sitemap", () => {
    const sitemap = readFileSync(join(BUILT, "sitemap.xml"), "utf8");
    expect(sitemap).toMatch(/<loc>https:\/\/[^/<]+\/paper\/<\/loc>/);
  });

  it("is in the menu of every page, where Guide was, and linked from the home page", () => {
    for (const page of builtPages()) {
      const items = [...parse(readBuilt(page)).querySelectorAll("#site-nav a")];
      expect(items[1].textContent, page).toBe("Paper");
      expect(items[1].getAttribute("href"), page).toBe("/paper/");
    }
    expect(paper.querySelector('#site-nav a[aria-current="page"]')!.textContent).toBe("Paper");
    const home = parse(readBuilt("index.html"));
    const link = [...home.querySelectorAll('main a[href="/paper/"]')].find((a) => /^Read the technical paper/.test((a.textContent ?? "").trim()));
    expect(link).toBeTruthy();
  });

  it("has a table of contents that lists every section, each linked to its heading", () => {
    const toc = [...main.querySelectorAll("#markdown-toc a")];
    const sections = [...main.querySelectorAll("h2, h3")].filter((h) => h.textContent !== "Contents");
    expect(main.querySelectorAll("h2").length).toBeGreaterThanOrEqual(11);
    expect(sections.length).toBeGreaterThanOrEqual(19);
    expect(toc.map((a) => a.textContent)).toEqual(sections.map((h) => h.textContent));
    for (const [i, a] of toc.entries()) expect(a.getAttribute("href")).toBe("#" + sections[i].id);
    expect(sections[0].textContent).toBe("Abstract");
  });

  it("renders its tables as tables, inside the page's prose so they take the site's table rules", () => {
    const tables = [...main.querySelectorAll(".prose table")];
    expect(tables.length).toBe(5);
    for (const t of tables) {
      expect(t.querySelectorAll("thead th").length).toBeGreaterThanOrEqual(2);
      expect(t.querySelectorAll("tbody tr").length).toBeGreaterThanOrEqual(3);
    }
    // No markdown left unrendered.
    expect(text).not.toMatch(/\|---|\*\*|^#+ /m);
    const css = readSite("assets/css/site.css");
    expect(css).toMatch(/\.prose table\s*\{[^}]*overflow-x:\s*auto/);
    expect(css).toMatch(/\.prose\s*\{[^}]*overflow-wrap:\s*break-word/);
  });

  it("shows its four figures from the site's own files, each with its caption as the alt text and under it", () => {
    const figures = [...main.querySelectorAll("figure.paper-fig")];
    expect(figures.map((f) => f.querySelector("img")!.getAttribute("src"))).toEqual(
      ["lifecycle", "arch", "dataflow", "keys"].map((n) => `/assets/img/paper/${n}.svg`),
    );
    for (const [i, f] of figures.entries()) {
      const img = f.querySelector("img")!;
      const caption = (f.querySelector("figcaption")!.textContent ?? "").trim();
      expect(caption).toMatch(/^Figure [1-4]\. \S/);
      expect(img.getAttribute("alt")).toBe(caption);
      const file = join(BUILT, img.getAttribute("src")!);
      expect(existsSync(file), img.getAttribute("src")!).toBe(true);
      // A drawing of its own: nothing fetched, nothing run.
      const svg = readFileSync(file, "utf8");
      expect(svg).toMatch(/^<svg /);
      expect(svg.replace('xmlns="http://www.w3.org/2000/svg"', "")).not.toMatch(/https?:|<script|<image|<foreignObject|\son[a-z]+=|@import|url\((?!#)/);
      expect(i).toBeLessThan(4);
    }
    expect(figures.length).toBe(4);
    // The numbered list that figure 4 sits in keeps counting: the security model's five points are one list.
    const list = main.querySelector("[id=\"5-security-model\"] ~ ol")!;
    expect(list.querySelectorAll(":scope > li").length).toBe(5);
    expect(list.querySelector(":scope > li figure.paper-fig img")!.getAttribute("src")).toBe("/assets/img/paper/keys.svg");
  });

  it("lists its references as one numbered list, and every citation in the text points at one of them", () => {
    const refs = [...main.querySelectorAll("ol.paper-refs > li")];
    expect(refs.length).toBe(7);
    expect(main.querySelector("#references + ol.paper-refs")).not.toBeNull();
    // The citation numbers stay plain text: "[5]" in a sentence, never a link.
    const cited = new Set([...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])));
    expect(cited.size).toBeGreaterThan(0);
    for (const n of cited) expect(n >= 1 && n <= refs.length, `[${n}]`).toBe(true);
    for (const a of main.querySelectorAll("a")) expect(a.textContent).not.toMatch(/^\[\d+\]$/);
    // An address in a reference is a link to exactly that address, and none is to a GitHub account the site may not link.
    const links = refs.flatMap((li) => [...li.querySelectorAll("a")]);
    expect(links.length).toBeGreaterThanOrEqual(5);
    for (const a of links) {
      expect(a.getAttribute("href")).toBe(a.textContent);
      expect(a.getAttribute("href")).toMatch(/^https:\/\//);
      if (a.getAttribute("href")!.includes("github.com")) expect(a.getAttribute("href")).toMatch(/^https:\/\/github\.com\/(better-ade|bmad-code-org)\//);
    }
  });

  it("offers the PDF, and the file it links is a PDF of this paper", () => {
    const link = [...main.querySelectorAll("a")].find((a) => (a.textContent ?? "").trim() === "Download PDF")!;
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe(PDF);
    const file = join(BUILT, PDF);
    expect(existsSync(file)).toBe(true);
    const bytes = readFileSync(file);
    expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(20000);
    // The page itself prints without the menu, the footer or the button.
    const css = readSite("assets/css/site.css");
    const print = /@media print \{((?:[^{}]|\{[^{}]*\})*)\}/.exec(css)![1];
    expect(print).toMatch(/\.site-header, \.site-footer, \.skip, \.paper-actions\s*\{\s*display:\s*none/);
    expect(print).toMatch(/\.prose table\s*\{[^}]*display:\s*table/);
    expect(css).toMatch(/@page\s*\{\s*size:\s*A4/);
  });
});

describe("what the paper says is true of the repos", () => {
  it("its four core roles are ade-method's, in order", () => {
    const core: { name: string }[] = JSON.parse(readRepo("method", "ade.json")).core_roles;
    const para = [...main.querySelectorAll("p")].find((p) => /^Four core roles do the work\./.test((p.textContent ?? "").trim()))!;
    const named = [...para.querySelectorAll("strong")].map((s) => (s.textContent ?? "").toLowerCase()).slice(0, core.length);
    expect(named).toEqual(core.map((r) => r.name));
  });

  it("the releases in its table are each repo's VERSION on main, where the repo is public", () => {
    const rows = Object.fromEntries(
      [...main.querySelectorAll("[id=\"6-evidence-building-ade-with-ade\"] ~ table tbody tr")].map((tr) => {
        const cells = [...tr.querySelectorAll("td")].map((td) => (td.textContent ?? "").trim());
        return [cells[0], cells];
      }),
    );
    const repos = { "ade-cli": "cli", "ade-brain": "brain", "ade-skills": "skills", "ade-secrets": "secrets", "ade-method": "method", "ade-agent-registry": "registry" } as const;
    for (const [name, key] of Object.entries(repos)) expect(rows[name][2], name).toBe("v" + readRepo(key, "VERSION").trim());
    // The count is the sum of the rows, and the numbers carry the date they are of.
    const merged = Object.entries(rows).filter(([name]) => name !== "Total").map(([, cells]) => Number(cells[1]));
    expect(merged.length).toBe(8);
    expect(merged.reduce((a, b) => a + b, 0)).toBe(Number(rows.Total[1]));
    expect(rows.Total[1]).toBe("142");
    expect(text.match(/as of 23 November 2026/g)!.length).toBe(2);
    expect(text).toContain("142 pull requests merged across eight repositories");
  });

  it("the services it says ADE runs today are the ones ade-cli can test live, and the rest are labelled Coming", () => {
    const cli = readRepo("cli", "ade");
    const live = /^LIVE_PROVIDERS="([^"]*)"/m.exec(cli)![1].split(/\s+/);
    const gated = new Set([...cli.matchAll(/"([a-z]+)\|[^"|]*\(needs the live check\)"/g)].map((m) => m[1]));
    const para = [...main.querySelectorAll("p")].find((p) => /^Each role can run on a different service\./.test((p.textContent ?? "").trim()))!;
    expect(para.textContent).toContain("Today ADE runs Claude, DeepSeek and Gemini");
    for (const id of ["anthropic", "deepseek", "gemini"]) {
      expect(live, id).toContain(id);
      expect(gated.has(id), id).toBe(false);
    }
    for (const id of ["glm", "muse"]) expect(gated.has(id), id).toBe(true);
    expect(para.querySelector(".coming")).not.toBeNull();
  });

  it("the connectors and the guard it names are ade-skills plugins, and the specialists are in the registry", () => {
    const plugins: { name: string }[] = JSON.parse(readRepo("skills", ".claude-plugin/marketplace.json")).plugins;
    for (const n of ["clickup", "jira", "linear", "orgo", "guard"]) expect(plugins.map((p) => p.name), n).toContain(n);
    for (const n of ["ClickUp", "Jira", "Linear", "Orgo"]) expect(text, n).toContain(n);
    const roles: { name: string }[] = JSON.parse(readRepo("registry", "registry.json")).roles;
    for (const n of ["support", "sysadmin"]) expect(roles.map((r) => r.name), n).toContain(n);
  });
});
