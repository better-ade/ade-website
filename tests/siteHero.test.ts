import { describe, expect, it } from "vitest";
import { gzipSync } from "node:zlib";
import { parse, readBuilt, readRepo, readSite } from "./paths";

/**
 * The home page's hero is two columns on a wide screen: the words on the left, and on the right a drawing of a phone
 * beside an ADE Computer window, with the agents at work around the window's terminal. The drawing is one inline SVG,
 * moved by CSS keyframes alone. These tests hold it to what it must stay: beside the words above the breakpoint and
 * under them below it, named for a screen reader, a team around a terminal and not a list, the phone apart from the
 * window, the terminal never empty, still when motion is not wanted, true to ADE's real roles, readable in both
 * themes and at the size it is shown, and made of nothing fetched from anywhere.
 */
const home = parse(readBuilt("index.html"));
const hero = home.querySelector("main section")!;
const drawings = [...hero.querySelectorAll('svg[role="img"]')];
const svg = hero.querySelector("svg.hx")!;
const css = readSite("assets/css/site.css");
const own = css.slice(css.indexOf("/* ---------- Hero: the ADE Computer"), css.indexOf("/* ---------- end of the hero's ADE Computer"));
const labels = (selector: string) => [...svg.querySelectorAll(selector)].map((t) => (t.textContent ?? "").trim());
const cap = (name: string) => name[0].toUpperCase() + name.slice(1);
const said = (el: Element) => (el.textContent ?? "").replace(/\s+/g, " ").trim();
const text = said(svg);
/** The body of the first `@media (<query>) { ... }` in the hero's own rules. */
const media = (query: string) => {
  const start = own.indexOf(`@media (${query}) {`);
  expect(start, query).toBeGreaterThan(-1);
  return /@media [^{]+\{((?:[^{}]|\{[^{}]*\})*)\}/.exec(own.slice(start))![1];
};
/** A drawn rectangle, in the drawing's own units. */
type Box = { x: number; y: number; w: number; h: number };
const box = (el: Element): Box => {
  const n = (a: string) => Number(el.getAttribute(a) ?? 0);
  return { x: n("x"), y: n("y"), w: n("width"), h: n("height") };
};
const overlap = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const mid = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
const WIDTH = 392;

describe("the hero is two columns on a wide screen", () => {
  const grid = hero.querySelector(".hero-grid")!;

  it("holds exactly the words, then the drawing", () => {
    expect(grid).not.toBeNull();
    expect([...grid.children].map((c) => c.className)).toEqual(["hero-copy", "hero-computer"]);
    // The words come first in the page, so they are first when the columns stack and for a screen reader.
    const copy = grid.children[0];
    expect(copy.querySelector("h1")).not.toBeNull();
    expect(copy.querySelectorAll("a.btn").length).toBe(2);
    expect(copy.querySelectorAll(".hero-meta").length).toBe(2);
    expect(copy.querySelector(".hero-kicker")).not.toBeNull();
    expect(grid.children[1].querySelector("svg.hx")).not.toBeNull();
  });

  it("from 1024px up: two columns, the drawing's the wider, centred against each other, the words left-aligned", () => {
    const wide = media("min-width: 1024px");
    const cols = /\.hero-grid\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0, (\d+)fr\) minmax\(0, (\d+)fr\);[^}]*align-items:\s*center;/.exec(wide)!;
    expect(cols).not.toBeNull();
    expect(Number(cols[2])).toBeGreaterThan(Number(cols[1]));
    // A bit more, not most of the row: the words keep at least two fifths.
    expect(Number(cols[1]) / (Number(cols[1]) + Number(cols[2]))).toBeGreaterThanOrEqual(0.4);
    expect(wide).toMatch(/\.hero-grid \.hero-copy\s*\{[^}]*text-align:\s*left;/);
    expect(wide).toMatch(/\.hero-grid \.hero-cta, \.hero-grid \.hero-meta\s*\{[^}]*justify-content:\s*flex-start;/);
    // Below it nothing makes a grid: the drawing follows the words, as the page orders them.
    expect(own.replace(wide, "")).not.toMatch(/\.hero-grid\s*\{[^}]*display:\s*grid/);
    expect(css.slice(0, css.indexOf(own))).not.toMatch(/\.hero-grid/);
  });

  it("the headline stays the largest text on the page in the column", () => {
    const h1 = /\.hero-grid h1\s*\{[^}]*font-size:\s*clamp\((\d+)px, [^,]+, (\d+)px\)/.exec(media("min-width: 1024px"))!;
    const h2 = /\.section-head h2\s*\{[^}]*font-size:\s*clamp\((\d+)px, ([\d.]+)vw, (\d+)px\)/.exec(css)!;
    expect(Number(h1[2])).toBeGreaterThan(Number(h2[3]));
    // At the breakpoint itself, where both are at their smallest two-column size.
    expect(Number(h1[1])).toBeGreaterThan(Math.min(Number(h2[3]), Math.max(Number(h2[1]), (Number(h2[2]) / 100) * 1024)));
  });

  it("no text in the drawing is smaller than 13px when shown in the column", () => {
    // At 1024px the drawing's column is its narrowest: its share of (1024 - 2 x 28 padding - the gap).
    expect(svg.getAttribute("viewBox")).toMatch(new RegExp(`^0 0 ${WIDTH} \\d+$`));
    const wide = media("min-width: 1024px");
    const gap = /\.hero-grid\s*\{[^}]*gap:\s*clamp\((\d+)px, ([\d.]+)vw, \d+px\)/.exec(wide)!;
    const cols = /grid-template-columns:\s*minmax\(0, (\d+)fr\) minmax\(0, (\d+)fr\)/.exec(wide)!;
    const share = Number(cols[2]) / (Number(cols[1]) + Number(cols[2]));
    const column = (1024 - 56 - Math.max(Number(gap[1]), (Number(gap[2]) / 100) * 1024)) * share;
    const sizes = [
      ...[...svg.querySelectorAll("[font-size]")].map((e) => Number(e.getAttribute("font-size"))),
      ...[...own.matchAll(/\.hx[^{}]*\{[^}]*font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1])),
    ];
    expect(sizes.length).toBeGreaterThan(8);
    for (const t of svg.querySelectorAll("text")) {
      expect(t.closest("[font-size]") ?? t.closest(".hx-label"), t.textContent ?? "").not.toBeNull();
    }
    expect(Math.min(...sizes) * (column / WIDTH)).toBeGreaterThanOrEqual(13);
    // And the drawing is no taller than a 1280x800 first screen leaves it under the header, at its widest column.
    const height = Number(svg.getAttribute("viewBox")!.split(" ")[3]);
    const widest = (1180 - 56 - 56) * share;
    expect(height * (widest / WIDTH)).toBeLessThanOrEqual(800 - 60 - 64 - 24);
  });
});

describe("the hero's ADE Computer, with the agents at work", () => {
  const agents = [...svg.querySelectorAll(".hx-agent")];
  const badges = agents.map((g) => box(g.querySelector("rect.hx-card")!));
  const term = box(svg.querySelector("rect.hx-term")!);
  const frame = box(svg.querySelector("rect.hx-frame")!);
  const phone = box(svg.querySelector(".hx-phone rect.hx-phone-body")!);

  it("is in the hero, after the headline and the buttons, with an accessible name", () => {
    expect(svg).not.toBeNull();
    expect(drawings.length).toBe(1);
    const lastButton = [...hero.querySelectorAll("a.btn")].pop()!;
    expect(svg.getAttribute("aria-label")!.length).toBeGreaterThan(40);
    expect(svg.getAttribute("aria-label")!.length).toBeLessThan(260);
    expect(svg.querySelector("title")!.textContent).toBe(svg.getAttribute("aria-label"));
    for (const word of ["ADE Computer", "Telegram", "Orchestrator", "Product", "Architect", "Developer", "Reviewer", "tests pass"]) {
      expect(svg.getAttribute("aria-label"), word).toContain(word);
    }
    expect(hero.querySelector("h1")!.compareDocumentPosition(svg) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(lastButton.compareDocumentPosition(svg) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("names the orchestrator and ade-method's core roles in order, and nobody else", () => {
    const core: { name: string }[] = JSON.parse(readRepo("method", "ade.json")).core_roles;
    expect(labels(".hx-agent .hx-label")).toEqual(["Orchestrator", ...core.map((r) => cap(r.name))]);
    expect(labels(".hx-agent .hx-label")).toEqual(["Orchestrator", "Product", "Architect", "Developer", "Reviewer"]);
    expect(labels(".hx-label").length).toBe(5);
  });

  it("leaves the ticket card, the specialists and the services list to the section under it", () => {
    expect(svg.querySelectorAll(".hx-specialist, .hx-models, .hx-soon, .hx-coming-pill").length).toBe(0);
    expect(text).not.toMatch(/Support|Sysadmin|loaded when needed|Runs on|Coming|GLM|Muse|Kimi|ChatGPT|design note/);
    // The ticket is a small tag in Product's colour, in Product's moment of the loop; no card titled Ticket.
    const tag = svg.querySelector(".hx-ticket")!;
    expect(said(tag)).toBe("Login fails after reset");
    expect(tag.classList.contains("hx-c2")).toBe(true);
    expect(text).not.toMatch(/\bTicket\b/i);
    expect(box(tag.querySelector("rect")!).h).toBeLessThanOrEqual(20);
    for (const name of ["hx-specialist", "hx-models", "hx-soon", "hx-coming-pill", "hx-note"]) expect(own, name).not.toContain(name);
  });

  it("arranges the five around a central terminal, as a team and not a list", () => {
    expect(badges.length).toBe(5);
    const c = mid(term);
    const at = badges.map(mid);
    // The terminal is in the middle of the window, and no badge is drawn over it or over another badge.
    expect(Math.abs(c.x - mid(frame).x)).toBeLessThan(1);
    for (const [i, b] of badges.entries()) {
      expect(overlap(b, term), labels(".hx-agent .hx-label")[i]).toBe(false);
      for (const other of badges.slice(i + 1)) expect(overlap(b, other)).toBe(false);
      expect(b.x).toBeGreaterThanOrEqual(frame.x);
      expect(b.x + b.w).toBeLessThanOrEqual(frame.x + frame.w);
    }
    // Not a column and not a row: there are badges above and below the terminal, and to its left and right.
    expect(new Set(at.map((p) => p.x)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(at.map((p) => p.y)).size).toBeGreaterThanOrEqual(3);
    expect(at.filter((p) => p.y < term.y).length).toBeGreaterThanOrEqual(2);
    expect(at.filter((p) => p.y > term.y + term.h).length).toBeGreaterThanOrEqual(2);
    expect(at.filter((p) => p.x < c.x - 20).length).toBeGreaterThanOrEqual(2);
    expect(at.filter((p) => p.x > c.x + 20).length).toBeGreaterThanOrEqual(2);
    // In hand-off order they go once round the terminal: the angles from its centre only ever turn one way.
    const angles = at.map((p) => Math.atan2(p.y - c.y, p.x - c.x));
    const turns = angles.map((a, i) => ((angles[(i + 1) % 5] - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
    expect(turns.every((t) => t > 0) || turns.every((t) => t < 0)).toBe(true);
    // The Orchestrator is the one nearest the phone.
    const near = at.map((p) => Math.hypot(p.x - mid(phone).x, p.y - mid(phone).y));
    expect(near.indexOf(Math.min(...near))).toBe(0);
  });

  it("draws a second phone, ADE on your phone: the read-only web view, apart from the window and the Telegram phone", () => {
    const web = svg.querySelector(".hx-web")!;
    const body = box(web.querySelector("rect.hx-phone-body")!);
    expect(overlap(body, frame)).toBe(false);
    expect(frame.x - (body.x + body.w)).toBeGreaterThanOrEqual(10);
    expect(overlap(body, phone)).toBe(false);
    expect(body.h).toBeGreaterThan(body.w * 1.6);
    // ADE's own logo and the word, the agents and their states, in step with the loop (each one's colour class is the agent's).
    expect(web.querySelector("use")!.getAttribute("href")).toBe("#hx-i-ade");
    expect(web.querySelector(".hx-chat-name")!.textContent).toBe("ADE");
    const names = [...web.querySelectorAll("g[class^='hx-c'] > text:first-child")].map((t) => t.textContent);
    expect(names).toEqual(["Orchestrator", "Developer", "Reviewer"]);
    expect(web.querySelector(".hx-stamp")!.textContent).toMatch(/tests pass.*Done/);
    // Labelled as what it is: the read-only web view over your own Tailscale network, and the services as an example mix.
    const caption = (svg.parentElement!.querySelector(".hero-caption")!.textContent ?? "").replace(/\s+/g, " ");
    expect(caption).toMatch(/ADE on your phone is the read-only web view/);
    expect(caption).toMatch(/Tailscale/);
    expect(caption).toMatch(/example mix/);
  });

  it("draws the hand-off lines between them, and a pulse for each hand-off", () => {
    const wire = svg.querySelector("path.hx-wire")!;
    expect(wire).not.toBeNull();
    // One stroke from the phone to the Orchestrator and one between each pair of neighbours round the ring.
    expect((wire.getAttribute("d")!.match(/M/g) ?? []).length).toBe(6);
    expect(own).toMatch(/\.hx-wire\s*\{[^}]*stroke:\s*var\(--line-3\)[^}]*stroke-dasharray/);
    expect(svg.querySelectorAll(".hx-pulse").length, "one pulse for each hand-off").toBe(7);
    expect(svg.querySelectorAll(".hx-ring").length, "one ring for each agent").toBe(5);
  });

  it("draws Telegram as a phone beside the window's lower-left corner, apart from it", () => {
    const chat = svg.querySelector(".hx-phone")!;
    // Beside: wholly to the left of the window, with a gap. Lower: in its bottom half, ending no lower than it.
    expect(overlap(phone, frame)).toBe(false);
    expect(frame.x - (phone.x + phone.w)).toBeGreaterThanOrEqual(10);
    expect(phone.x).toBeGreaterThanOrEqual(0);
    expect(mid(phone).y).toBeGreaterThan(mid(frame).y);
    expect(phone.y + phone.h).toBeLessThanOrEqual(frame.y + frame.h);
    expect(phone.h).toBeGreaterThan(phone.w * 1.6);
    // Nothing of the phone's is drawn inside the window, and nothing of the window's over the phone.
    for (const r of chat.querySelectorAll("rect")) expect(overlap(box(r), frame)).toBe(false);
    for (const r of svg.querySelectorAll("rect")) {
      if (!r.closest(".hx-phone") && !r.closest("defs")) expect(overlap(box(r), phone), r.getAttribute("class") ?? "").toBe(false);
    }
    // The word and Telegram's own logo, unmodified: the white paper plane in the blue circle, drawn once, as a symbol.
    expect(chat.querySelector(".hx-chat-name")!.textContent).toBe("Telegram");
    expect(chat.querySelector("use")!.getAttribute("href")).toBe("#hx-i-telegram");
    expect(chat.querySelectorAll("use").length).toBe(1);
    const logo = svg.querySelector("symbol#hx-i-telegram")!;
    expect(logo.getAttribute("viewBox")).toBe("0 0 240 240");
    const disc = logo.querySelector("circle")!;
    expect([disc.getAttribute("cx"), disc.getAttribute("cy"), disc.getAttribute("r")]).toEqual(["120", "120", "120"]);
    const plane = logo.querySelector("path")!;
    expect(plane.getAttribute("fill")).toBe("#fff");
    expect(plane.getAttribute("d")!.startsWith("M54.3 118.8c35-15.2 58.3-25.3 70-30.2")).toBe(true);
    const stops = [...svg.querySelectorAll("#hx-tg stop")].map((x) => (x.getAttribute("stop-color") ?? "").toLowerCase());
    expect(stops).toEqual(["#2aabee", "#229ed9"]);
    // Telegram's blues are in the logo and nowhere else in the drawing or its rules.
    const outside = svg.outerHTML.replace(/<symbol id="hx-i-telegram".*?<\/symbol>/s, "").replace(/<linearGradient id="hx-tg".*?<\/linearGradient>/s, "");
    expect((outside + own).match(/#(0088cc|08c|229ed9|24a1de|2aabee|27a7e7|0af)\b/gi) ?? []).toEqual([]);
    // The owner's message goes in and the reply comes back, and the phone hands off to the Orchestrator and back.
    expect(said(chat.querySelector(".hx-msg")!)).toBe("can’t log in");
    expect(said(chat.querySelector(".hx-reply")!)).toBe("Done. Tests pass.");
    expect(svg.querySelector(".hx-pulse.hx-p0"), "the pulse from the phone").not.toBeNull();
    expect(svg.querySelector(".hx-pulse.hx-p6"), "the pulse back to the phone").not.toBeNull();
    // Approval buttons are not merged (siteTruth's NOT_MERGED list), so the drawing shows none.
    expect(text).not.toMatch(/Approve|Deny/);
  });

  it("the terminal is never empty: it opens on a prompt and a line of output that stay", () => {
    const open = [...svg.querySelectorAll(".hx-term-open text")];
    expect(open.length).toBe(2);
    expect(said(open[0])).toMatch(/^\$ \S/);
    expect(said(open[1])).toMatch(/^[A-Za-z]/);
    for (const t of open) {
      // Outside the part of the drawing that is cleared between loops, and under no typing cover.
      expect(t.closest(".hx-live")).toBeNull();
      expect([...t.classList].filter((c) => /^hx-(out|k)\d/.test(c))).toEqual([]);
      const y = Number(t.getAttribute("y"));
      for (const cover of svg.querySelectorAll(".hx-cover")) {
        const b = box(cover);
        expect(y > b.y && y < b.y + b.h, said(t)).toBe(false);
      }
      expect(y).toBeGreaterThan(term.y);
      expect(y).toBeLessThan(term.y + term.h);
    }
    expect(own).not.toMatch(/\.hx-term-open[^{]*\{[^}]*(animation|opacity)/);
    // Every line of the terminal is inside it.
    for (const t of svg.querySelectorAll(".hx-term-lines text")) {
      const y = Number(t.getAttribute("y"));
      expect(y > term.y + 20 && y < term.y + term.h, said(t)).toBe(true);
    }
  });

  it("names on each role the service it runs on, the same as the section under the hero, and only ones ADE runs today", () => {
    const cli = readRepo("cli", "ade");
    const live = /^LIVE_PROVIDERS="([^"]*)"/m.exec(cli)![1].split(/\s+/);
    const ID: Record<string, string> = { Claude: "anthropic", DeepSeek: "deepseek", Gemini: "gemini" };
    const roles = Object.fromEntries(agents.map((g) => [g.querySelector(".hx-label")!.textContent, g.querySelector(".hx-model")!.textContent]));
    expect(roles).toEqual({ Orchestrator: "Claude", Product: "Claude", Architect: "Claude", Developer: "Gemini", Reviewer: "DeepSeek" });
    for (const m of Object.values(roles)) expect(live, m!).toContain(ID[m!]);
    const cards = Object.fromEntries(
      [...home.querySelectorAll("#services .role-card[data-role]")].map((c) => [c.querySelector("h3")!.textContent, c.querySelector(".role-service b")!.textContent]),
    );
    expect(roles).toEqual(cards);
    // It is the small second line of the badge, and on a phone it goes.
    for (const g of agents) {
      const [name, model] = [g.querySelector(".hx-label")!, g.querySelector(".hx-model")!];
      expect(Number(model.getAttribute("y"))).toBeGreaterThan(Number(name.getAttribute("y")));
      expect(Number(model.getAttribute("font-size"))).toBeLessThanOrEqual(10);
    }
    expect(media("max-width: 700px")).toMatch(/\.hx \.hx-model, \.hx \.hx-corner\s*\{[^}]*display:\s*none/);
  });

  it("gives each role the same agent face, with its job as a corner badge and a light that glows while it works", () => {
    for (const g of agents) {
      expect(g.querySelector("use.hx-face")!.getAttribute("href"), g.textContent ?? "").toBe("#hx-i-agent");
    }
    expect(agents.map((g) => g.querySelector(".hx-corner use")!.getAttribute("href"))).toEqual(
      ["#hx-i-orch", "#hx-i-product", "#hx-i-architect", "#hx-i-developer", "#hx-i-reviewer"],
    );
    // The light shares its role's ring animation, so it glows exactly while that role is working.
    agents.forEach((g, i) => {
      expect(g.querySelector(".hx-ring")!.classList.contains(`hx-r${i + 1}`)).toBe(true);
      expect(g.querySelector(".hx-glow")!.classList.contains(`hx-r${i + 1}`)).toBe(true);
      expect([...g.classList]).toContain(`hx-c${i + 1}`);
    });
    // Calm at rest (and so under reduced motion); the Reviewer's check arrives with Done and stays.
    expect(own).toMatch(/\.hx-glow\s*\{[^}]*opacity:\s*0;/);
    expect(agents[4].querySelector(".hx-live .hx-check")).not.toBeNull();
    expect(svg.querySelectorAll(".hx-check").length).toBe(1);
    expect(own).toMatch(/\.hx-check\s*\{\s*animation:\s*hx-stamp 12s/);
    // One family of plain shapes: a rounded screen, two eyes, a status light.
    const face = home.getElementById("hx-i-agent")!;
    expect(face.querySelectorAll("rect.hx-face-head").length).toBe(1);
    expect(face.querySelectorAll("circle.hx-face-dot").length).toBe(3);
  });

  it("plays the hand-off: the message, the ticket, the terminal with its test, Done, and the reply", () => {
    for (const line of ["can’t log in", "Login fails after reset", "bash tests/run.sh", "not ok", "ok all tests pass", "tests pass ✓ Done", "Done. Tests pass."]) {
      expect(text, line).toContain(line);
    }
    expect(svg.querySelector(".hx-dot"), "the test dot").not.toBeNull();
    expect(css).toMatch(/\.hx-dot\s*\{[^}]*animation:\s*hx-dot 12s/);
    expect(css).toMatch(/@keyframes hx-dot\s*\{[^@]*#ff7b72[^@]*#3fb950/);
  });

  it("is a desktop of our own: a top bar, a dock with four plain icons, a terminal", () => {
    expect(svg.querySelector(".hx-bar")).not.toBeNull();
    expect([...svg.querySelectorAll(".hx-dock-icon")].map((u) => u.getAttribute("href"))).toEqual(["#hx-i-code", "#hx-i-term", "#hx-i-db", "#hx-i-web"]);
    expect(svg.querySelector(".hx-term")).not.toBeNull();
    // The dock is along the bottom, under the team, so the window's width goes to the terminal and the badges.
    const dock = box(svg.querySelector("rect.hx-dock")!);
    expect(dock.w).toBeGreaterThan(dock.h * 4);
    for (const b of badges) expect(overlap(b, dock)).toBe(false);
  });

  it("stands still, on its last frame, when reduced motion is asked for", () => {
    expect(media("prefers-reduced-motion: reduce")).toMatch(/\.hx \*\s*\{[^}]*animation:\s*none\s*!important/);
    // Every moving part rests on the end state: the rules outside keyframes never hide what the last frame shows.
    const rule = (cls: string) => new RegExp(`(^|[\\s,])\\.${cls}\\s*\\{([^}]*)\\}`, "m").exec(css)?.[2] ?? "";
    for (const cls of ["hx-msg", "hx-ticket", "hx-out2", "hx-out5", "hx-stamp", "hx-reply"]) {
      expect(rule(cls), cls).toMatch(/animation:/);
      expect(rule(cls), cls).not.toMatch(/opacity:\s*0/);
    }
    expect(rule("hx-dot")).toMatch(/fill:\s*#3fb950/);
    // The loop is one length for every part, about twelve seconds, and nothing else.
    const durations = new Set([...css.matchAll(/animation:\s*hx-[a-z0-9-]+ ([\d.]+s)/g)].map((m) => m[1]));
    expect([...durations]).toEqual(["12s"]);
    // Every animation the drawing names has its keyframes, and no keyframes are left over.
    const used = new Set([...own.matchAll(/animation:\s*(hx-[a-z0-9-]+) /g)].map((m) => m[1]));
    const defined = new Set([...own.matchAll(/@keyframes (hx-[a-z0-9-]+)/g)].map((m) => m[1]));
    expect([...used].sort()).toEqual([...defined].sort());
  });

  it("uses no script, image, font or address of its own", () => {
    const visual = hero.querySelector(".hero-computer")!;
    expect(visual.querySelectorAll("script, image, img, foreignObject, style, iframe, a").length).toBe(0);
    for (const el of visual.querySelectorAll("*")) {
      for (const attr of el.getAttributeNames()) {
        const v = el.getAttribute(attr)!;
        expect(attr, "no style attribute or event handler (the policy blocks them)").not.toMatch(/^(style|on[a-z]+)$/);
        if (attr === "href" || attr === "xlink:href") expect(v).toMatch(/^#hx-/);
        if (/url\(/.test(v)) expect(v).toMatch(/^url\(#hx[a-z0-9-]*\)$/);
        if (attr !== "aria-label") expect(v, attr).not.toMatch(/https?:|\/\//);
      }
    }
    // Every reference resolves inside the page.
    for (const use of visual.querySelectorAll("use")) expect(home.getElementById(use.getAttribute("href")!.slice(1)), use.getAttribute("href")!).not.toBeNull();
    expect(own.length).toBeGreaterThan(500);
    expect(own).not.toMatch(/url\(|@import|@font-face|https?:/);
    // A few KB, raw and on the wire: the drawing as served, and its rules.
    expect(Buffer.byteLength(visual.outerHTML)).toBeLessThan(15000);
    expect(gzipSync(visual.outerHTML).length).toBeLessThan(3600);
    expect(gzipSync(own).length).toBeLessThan(3000);
  });
});

/** WCAG relative luminance and contrast, for opaque #rrggbb colours. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/** The custom properties of one theme block, by name. */
function tokens(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

describe("the hero drawing's text is readable in both themes", () => {
  const light = tokens(/:root\s*\{([^}]*)\}/.exec(css)![1]);
  const dark = { ...light, ...tokens(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/.exec(css)![1]) };
  /** Each text colour the drawing uses, and the surfaces that text is drawn on. */
  const SURFACES: Record<string, string[]> = {
    "var(--text)": ["panel", "panel-2"],
    "var(--text-2)": ["panel", "panel-2"],
    "var(--text-3)": ["panel"],
    "var(--agent-green)": ["panel"],
    "var(--violet)": ["panel"],
    "#d7d8de": ["term-bg"],
    "#9a9ba3": ["term-bg"],
    "#ff7b72": ["term-bg"],
    "#3fb950": ["term-bg"],
  };
  const fills = [...own.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((m) => /\btext\b|\.hx-t-/.test(m[1]))
    .flatMap((m) => [...m[2].matchAll(/(?:^|[;\s])fill:\s*([^;]+);/g)].map((f) => f[1].trim()));

  it("every text colour is one whose surface is known", () => {
    expect(fills.length).toBeGreaterThan(5);
    for (const f of fills) expect(Object.keys(SURFACES), f).toContain(f);
  });

  it("each is at least 4.5 to 1 on its surface, light and dark", () => {
    for (const [name, theme] of [["light", light], ["dark", dark]] as const) {
      for (const f of new Set(fills)) {
        const ink = f.startsWith("var(") ? theme[f.slice(6, -1)] : f;
        for (const s of SURFACES[f]) {
          expect(contrast(ink, theme[s]), `${name}: ${f} on --${s}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it("terminal text is a fixed light colour, since the terminal is dark in both themes", () => {
    const term = [...own.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => /\.hx-t-term/.test(m[1]));
    expect(term.length).toBeGreaterThan(0);
    for (const m of term) expect(m[2], m[1].trim()).not.toMatch(/fill:\s*var\(/);
  });
});
