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
  it("is a section of its own, with its kicker and heading, between How it works and What works today", () => {
    expect(sec).not.toBeNull();
    expect(sec!.querySelector(".kicker")!.textContent).toBe("Secure storage");
    expect(sec!.querySelector("h2")!.textContent).toBe("Keys stay in secure storage.");
    const ids = [...home.querySelectorAll("main section[id]")].map((s) => s.id);
    expect(ids.indexOf("storage")).toBe(ids.indexOf("how-it-works") + 1);
    expect(ids.indexOf("today")).toBe(ids.indexOf("storage") + 1);
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
});
