import { describe, expect, it } from "vitest";
import { readSite } from "./paths";

/**
 * BMAD v4 task files and /BMad:tasks: commands do not exist on v6, so the
 * guide may name them only where it says it means v4.
 */
describe("BMAD task references in the guide", () => {
  it("the guide never sends v6 users to v4 task files", () => {
    for (const f of ["guide/agents.md", "guide/settings.md", "guide/project-setup.md"]) {
      const body = readSite(f);
      for (const line of body.split("\n")) {
        if (line.includes(".bmad-core/tasks/") || line.includes("/BMad:tasks:")) {
          expect(line.includes("v4"), `${f}: v4-only path without v4 context`).toBe(true);
        }
      }
    }
  });
});
