import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { parse, readBuilt, readRepo, site } from "./paths";

/**
 * The home page's secure storage section (story W-secure-storage): where a key lives, held to ade-brain's main so the
 * page cannot claim a store or a command the hub does not have.
 */
const home = parse(readBuilt("index.html"));
const sec = home.querySelector("#storage");
const text = ((sec?.textContent) ?? "").replace(/\s+/g, " ");

describe("the home page's secure storage section", () => {
  it("is a section of its own, with its kicker and heading, right after How it works", () => {
    expect(sec).not.toBeNull();
    expect(sec!.querySelector(".kicker")!.textContent).toBe("Secure storage");
    expect(sec!.querySelector("h2")!.textContent).toBe("Keys stay in secure storage.");
    const ids = [...home.querySelectorAll("main section[id]")].map((s) => s.id);
    expect(ids.indexOf("storage")).toBe(ids.indexOf("how-it-works") + 1);
    expect(ids.indexOf("built-with")).toBe(ids.indexOf("storage") + 1);
  });

  it("keeps the sections alternating plain and tinted", () => {
    const secs = [...home.querySelectorAll("main section[id]")].filter((s) => s.id !== "");
    const tints = secs.map((s) => s.classList.contains("tint"));
    for (let i = 1; i < tints.length; i++) expect(tints[i], secs[i].id).toBe(!tints[i - 1]);
  });

  it("shows the paper's Figure 4 from the site's own files, with alt text, and links to the paper", () => {
    const img = sec!.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("/assets/img/paper/keys.svg");
    expect(existsSync(site("assets/img/paper/keys.svg"))).toBe(true);
    expect((img.getAttribute("alt") ?? "").length).toBeGreaterThan(40);
    expect([...sec!.querySelectorAll("a")].some((a) => a.getAttribute("href") === "/paper/")).toBe(true);
  });

  it("names each store the hub has, and says plainly which one is weaker", () => {
    const lib = readRepo("brain", "bin/lib.sh");
    expect(lib).toMatch(/keychain\|pass\|file/);
    expect(lib).toMatch(/files 0600/);
    expect(readRepo("brain", "bin/doctor")).toMatch(/the weaker store/);
    expect(text).toMatch(/macOS Keychain/);
    expect(text).toMatch(/pass/);
    expect(text).toMatch(/weaker/);
  });

  it("names only commands the hub has: the hidden prompt, the key helper, share and receive", () => {
    const keys = readRepo("brain", "bin/keys");
    expect(keys).toMatch(/hidden prompt/);
    expect(keys).toMatch(/apiKeyHelper/);
    for (const c of ["bin/keys set", "bin/keys share", "bin/keys receive"]) {
      expect(text).toContain(c);
      expect(keys).toContain(c.replace("bin/keys ", "keys "));
    }
    expect(text).toMatch(/hidden prompt/);
  });

  it("paste_line: the list has the paste-guard line, after How it is shared", () => {
    const items = [...sec!.querySelectorAll("ul.storage-list li")].map((li) => (li.textContent ?? "").replace(/\s+/g, " "));
    const shared = items.findIndex((t) => t.startsWith("How it is shared:"));
    const paste = items.findIndex((t) => t.startsWith("If you paste one by mistake:"));
    expect(shared).toBeGreaterThanOrEqual(0);
    expect(paste).toBe(shared + 1);
    expect(items[paste]).toBe(
      "If you paste one by mistake: the paste guard stops a message to Claude that holds a key, before it is sent, and names the command that stores it instead. It knows the common key shapes (Anthropic, OpenAI, GitHub, GitLab, Slack, AWS, Google, Telegram, private keys).",
    );
  });

  it("paste_true: every key kind the line names is in ade-brain's paste-guard KEYS, and no claim that the key never reaches local files", () => {
    const li = [...sec!.querySelectorAll("ul.storage-list li")].find((l) => (l.textContent ?? "").startsWith("If you paste one by mistake:"));
    expect(li).toBeDefined();
    const line = (li!.textContent ?? "").replace(/\s+/g, " ");
    const kinds = /key shapes \(([^)]*)\)/.exec(line)![1].split(", ");
    const guard = readRepo("brain", "bin/paste-guard");
    const keys = guard.slice(guard.indexOf("KEYS = ["), guard.indexOf("]\n", guard.indexOf("KEYS = [")));
    const entries = [...keys.matchAll(/^\s*\("([^"]+)"/gm)].map((m) => m[1].toLowerCase());
    expect(kinds.length).toBe(9);
    for (const k of kinds) {
      const name = k.toLowerCase().replace(/s$/, "");
      expect(entries.some((e) => e.includes(name)), k).toBe(true);
    }
    expect(guard).toMatch(/UserPromptSubmit/);
    expect(line).not.toMatch(/never (reach|reaches|written|stored)|not (saved|stored|written)|no local file/i);
  });
});
