import { beforeAll, describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parse, readSite } from "./paths";

/**
 * The download count (story W-download-count). The Pages build fetches the release asset downloads of ade-terminal
 * and ade-cli (scripts/fetch-downloads.sh) into site/_data/downloads.json; the home page's hero and Get started show
 * one plain line from it, rounded down to the hundred, and leave it out when the file is missing or not usable. The
 * GitHub API is stood in for by a local server, and the pages are built here from a copy of the site with each data
 * file, so the tests do not depend on the network or on what the last fetch wrote.
 */
const ROOT = resolve(__dirname, "..");
const SCRIPT = join(ROOT, "scripts/fetch-downloads.sh");
const REPOS = ["better-ade/ade-terminal", "better-ade/ade-cli"];
const LINE = /^([\d,]+\+) downloads of ADE and ade-terminal$/;
const said = (el: Element | null) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv = {}): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((done) => {
    const p = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, ...env } });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d) => (stdout += d));
    p.stderr.on("data", (d) => (stderr += d));
    p.on("close", (status) => done({ status, stdout, stderr }));
  });
}

/* ---------- The fake GitHub API ---------- */

type Pages = Record<string, unknown[][] | "error">;
const release = (...counts: number[]) => ({ tag_name: "v1", assets: counts.map((n, i) => ({ name: `a${i}`, download_count: n })) });

/** A server answering /repos/<repo>/releases?page=N from `pages` (page N is pages[repo][N-1], then []). */
async function fakeApi(pages: Pages): Promise<{ url: string; seen: string[]; close: () => Promise<void> }> {
  const seen: string[] = [];
  const server: Server = createServer((req, res) => {
    seen.push(req.url ?? "");
    const url = new URL(req.url ?? "/", "http://x");
    const m = /^\/repos\/([^/]+\/[^/]+)\/releases$/.exec(url.pathname);
    const repo = m ? pages[m[1]] : undefined;
    if (!m || repo === undefined || repo === "error") {
      res.writeHead(m && repo === "error" ? 500 : 404, { "content-type": "application/json" });
      res.end(JSON.stringify({ message: "nope" }));
      return;
    }
    const page = Number(url.searchParams.get("page") ?? "1");
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(repo[page - 1] ?? []));
  });
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  const { port } = server.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}`, seen, close: () => new Promise((ok) => server.close(() => ok())) };
}

async function fetchWith(api: string, opts: { stale?: string } = {}) {
  const dest = mkdtempSync(join(tmpdir(), "fetch-downloads-"));
  const file = join(dest, "_data", "downloads.json");
  if (opts.stale !== undefined) {
    mkdirSync(join(dest, "_data"));
    writeFileSync(file, opts.stale);
  }
  const r = await run("bash", [SCRIPT, dest], { ADE_API: api, GITHUB_TOKEN: "" });
  return { ...r, file, data: existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : undefined };
}

/* ---------- Pages built from a copy of the site, with a given data file ---------- */

type Built = { home: Document; start: Document };
async function buildWith(data: string | undefined): Promise<Built> {
  // The real path: Jekyll's safe mode refuses includes reached through a symlink (macOS's /var is one).
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), "site-downloads-")));
  const src = join(tmp, "site");
  cpSync(join(ROOT, "site"), src, { recursive: true, filter: (p) => !p.endsWith(join("_data", "downloads.json")) });
  if (data !== undefined) writeFileSync(join(src, "_data", "downloads.json"), data);
  const out = join(tmp, "out");
  const r = await run("bundle", ["exec", "jekyll", "build", "-s", src, "-d", out, "--strict_front_matter"], { JEKYLL_ENV: "production" });
  if (r.status !== 0) throw new Error(`jekyll build failed:\n${r.stdout}\n${r.stderr}`);
  const doc = (p: string) => parse(readFileSync(join(out, p), "utf8"));
  const built = { home: doc("index.html"), start: doc("get-started/index.html") };
  rmSync(tmp, { recursive: true, force: true });
  return built;
}

const data = (total: unknown) => JSON.stringify({ total, repos: { "ade-terminal": 1, "ade-cli": 1 }, date: "2026-11-28" });
const FIXTURES: Record<string, string | undefined> = {
  real: data(2398),
  exact: data(2300),
  big: data(1234567),
  none: undefined,
  zero: data(0),
  under: data(99),
  text: data("lots"),
  noTotal: JSON.stringify({ repos: {}, date: "2026-11-28" }),
};
const built: Record<string, Built> = {};
beforeAll(async () => {
  const names = Object.keys(FIXTURES);
  const docs = await Promise.all(names.map((n) => buildWith(FIXTURES[n])));
  names.forEach((n, i) => (built[n] = docs[i]));
}, 240_000);

/** The download line on a built page: its element (or null). */
const lineOf = (doc: Document) => doc.querySelector(".downloads");

/* ---------- The acceptance criteria ---------- */

describe("downloads_fetch: the Pages build fetches the count", () => {
  const pagesYml = readFileSync(join(ROOT, ".github/workflows/pages.yml"), "utf8");

  it("pages.yml runs scripts/fetch-downloads.sh site beside the installers, with the workflow's token, before the build", () => {
    const steps = pagesYml.split(/\n(?=\s+- )/);
    const at = (re: RegExp) => steps.findIndex((s) => re.test(s));
    const installers = at(/run: scripts\/fetch-installers\.sh site/);
    const downloads = at(/run: scripts\/fetch-downloads\.sh site/);
    const build = at(/name: Build the site/);
    expect(installers).toBeGreaterThan(-1);
    expect(downloads).toBe(installers + 1);
    expect(build).toBeGreaterThan(downloads);
    expect(steps[downloads]).toMatch(/GITHUB_TOKEN: \$\{\{ github\.token \}\}/);
  });

  it("the daily scheduled build keeps it fresh", () => {
    expect(pagesYml).toMatch(/schedule:\s*\n\s*- cron: "[\d*]+ [\d*]+ \* \* \*"/);
  });

  it("the generated file is not committed", () => {
    expect(readFileSync(join(ROOT, ".gitignore"), "utf8")).toMatch(/^site\/_data\/downloads\.json$/m);
  });

  it("sums assets[].download_count over every page of each repo's releases and writes the total, each repo and the date", async () => {
    const api = await fakeApi({
      [REPOS[0]]: [[release(1000, 500), release(200)], [release(92)]],
      [REPOS[1]]: [[release(600, 6), { tag_name: "v0", assets: [] }]],
    });
    try {
      const r = await fetchWith(api.url);
      expect(r.status, r.stderr).toBe(0);
      expect(r.data).toEqual({
        total: 2398,
        repos: { "ade-terminal": 1792, "ade-cli": 606 },
        date: new Date().toISOString().slice(0, 10),
      });
      // Every page was asked for, until the first empty one.
      for (const p of [1, 2, 3]) expect(api.seen.some((u) => u.startsWith(`/repos/${REPOS[0]}/releases?`) && u.includes(`page=${p}`))).toBe(true);
      expect(api.seen.some((u) => u.startsWith(`/repos/${REPOS[1]}/releases?`) && u.includes("page=2"))).toBe(true);
    } finally {
      await api.close();
    }
  });
});

describe("downloads_shown: the hero and Get started show one plain line", () => {
  it("the hero, under its buttons, says '**2,300+ downloads** of ADE and ade-terminal', rounded down to the hundred", () => {
    const copy = built.real.home.querySelector(".hero-copy")!;
    const line = lineOf(built.real.home)!;
    expect(line).not.toBeNull();
    expect(copy.contains(line)).toBe(true);
    expect(said(line)).toBe("2,300+ downloads of ADE and ade-terminal");
    expect(said(line.querySelector("strong"))).toBe("2,300+ downloads");
    // Under the buttons (and the small link under them), in the words' column.
    const cta = copy.querySelector(".hero-cta")!;
    expect(cta.compareDocumentPosition(line) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(copy.querySelectorAll(".downloads").length).toBe(1);
    expect(built.real.home.querySelectorAll(".downloads").length).toBe(1);
  });

  it("Get started shows the same line", () => {
    const lines = built.real.start.querySelectorAll(".downloads");
    expect(lines.length).toBe(1);
    expect(said(lines[0])).toBe("2,300+ downloads of ADE and ade-terminal");
  });

  it("never overstates, and writes thousands with separators", () => {
    expect(said(lineOf(built.exact.home))).toBe("2,300+ downloads of ADE and ade-terminal");
    expect(said(lineOf(built.big.home))).toBe("1,234,500+ downloads of ADE and ade-terminal");
    expect(said(lineOf(built.big.start))).toBe("1,234,500+ downloads of ADE and ade-terminal");
  });

  it("is plain text, not a badge image or a link", () => {
    for (const b of [built.real.home, built.real.start]) {
      const line = lineOf(b)!;
      expect(line.querySelector("img, svg, a, script, object, iframe")).toBeNull();
      expect(line.tagName).toBe("P");
    }
  });
});

describe("downloads_fallback: no usable count, no line, and the build still passes", () => {
  it.each(["none", "zero", "under", "text", "noTotal"])("with data '%s' neither page shows a count", (name) => {
    for (const doc of [built[name].home, built[name].start]) {
      expect(lineOf(doc)).toBeNull();
      expect(said(doc.body)).not.toMatch(/downloads of ADE/);
    }
  });

  it("the include reads only the data file, so the line can never be stale-but-current: no number is written in a page", () => {
    const include = readSite("_includes/downloads.html");
    expect(include).toMatch(/site\.data\.downloads/);
    // No count of its own: nothing of a thousand or more is written in it (its only numbers are the rounding's 100).
    expect(include).not.toMatch(/\d,\d{3}|\d{4,}/);
    expect(readSite("index.html")).not.toMatch(/\d+,?\d*\+ downloads/);
    expect(readSite("get-started.md")).not.toMatch(/\d+,?\d*\+ downloads/);
  });

  const cases: [string, Pages][] = [
    ["an API error", { [REPOS[0]]: "error", [REPOS[1]]: [[release(606)]] }],
    ["an empty list", { [REPOS[0]]: [], [REPOS[1]]: [] }],
    ["a page that is not a list", { [REPOS[0]]: [[release(1)]], [REPOS[1]]: [{ message: "rate limited" } as unknown as unknown[]] }],
  ];
  it.each(cases)("on %s the script exits 0, writes nothing and removes a stale file", async (_name, pages) => {
    const api = await fakeApi(pages);
    try {
      const r = await fetchWith(api.url, { stale: data(5000) });
      expect(r.status, r.stderr).toBe(0);
      expect(existsSync(r.file)).toBe(false);
      expect(r.stderr).toMatch(/download count/);
    } finally {
      await api.close();
    }
  });

  it("on an unreachable API the script exits 0 and writes nothing", async () => {
    const api = await fakeApi({});
    await api.close();
    const r = await fetchWith(api.url);
    expect(r.status, r.stderr).toBe(0);
    expect(existsSync(r.file)).toBe(false);
  });

  it("two pages for one repo are both counted, with a second repo's error still failing the whole count", async () => {
    const api = await fakeApi({ [REPOS[0]]: [[release(100)], [release(200)]], [REPOS[1]]: "error" });
    try {
      const r = await fetchWith(api.url);
      expect(r.status).toBe(0);
      expect(r.data).toBeUndefined();
    } finally {
      await api.close();
    }
  });
});

describe("downloads_no_new_source: nothing is loaded in the browser for it", () => {
  // The policy as it was before the count (story W-download-count leaves it unchanged).
  const CSP =
    "default-src 'self'; script-src 'self' 'sha256-FsIZN6Mqzes8U6LwztrW72hqF7cLDnCGBES+X937vAQ='; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'none'; object-src 'none'";

  it("the CSP in site/_includes/head.html is unchanged", () => {
    expect(readSite("_includes/head.html")).toContain(`<meta http-equiv="Content-Security-Policy" content="${CSP}">`);
  });

  it("the include names no other origin and loads nothing", () => {
    const include = readSite("_includes/downloads.html");
    expect(include).not.toMatch(/https?:|<script|<img|<iframe|<object|<link|shields\.io|api\.github\.com/i);
  });

  it("no built page loads anything from GitHub or shields.io", () => {
    for (const doc of [built.real.home, built.real.start]) {
      for (const el of doc.querySelectorAll("script[src], img[src], link[href], iframe[src], source[src]")) {
        const src = el.getAttribute("src") ?? el.getAttribute("href") ?? "";
        expect(src).not.toMatch(/shields\.io|api\.github\.com|githubusercontent|github\.com/);
      }
    }
    for (const file of ["assets/js/site.js", "assets/js/preview.js"]) expect(readSite(file)).not.toMatch(/downloads|shields|api\.github/);
  });
});

describe("downloads_truth: the page's wording is messaging.md's", () => {
  const md = readFileSync(join(ROOT, "docs/messaging.md"), "utf8");
  const flat = md.replace(/\s+/g, " ");

  it("messaging.md has the line and says what is counted, and what is not", () => {
    expect(md).toContain('"**2,300+ downloads** of ADE and ade-terminal"');
    expect(flat).toMatch(/release asset downloads of ade-terminal and ade-cli/);
    expect(flat).toMatch(/package manager and a `git clone` are not counted/);
    expect(flat).toMatch(/rounded down to the hundred/);
  });

  it("the built line is messaging.md's line, with the number from the data", () => {
    const m = /"\*\*([\d,]+\+) downloads\*\* (of ADE and ade-terminal)"/.exec(md)!;
    for (const doc of [built.real.home, built.real.start]) {
      const line = said(lineOf(doc));
      expect(line).toMatch(LINE);
      expect(line.replace(LINE.exec(line)![1], m[1])).toBe(`${m[1]} downloads ${m[2]}`);
    }
  });
});
