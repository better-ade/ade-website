# W-scenario-animations-webkit: the scenario drawings show in Safari

Status: **Approved** (a bug in W-scenario-animations, reported by the owner 2026-11-28: "Some of the graphics are not
showing on the website"; the coordinator's default is to fix it under the approved story's look). Risk: **low**.
Verification: the repo's verification command (README.md).

## The bug
On https://ade.ardata.tech/ in WebKit (Safari, and every iPhone browser), each scenario card's scene is empty: no
drawing, not even the stage, while the titles animate. Chrome draws the scenes. Screenshots by the coordinator in
Playwright WebKit 26 and Chrome at 1280x900.

## Acceptance criteria (each named by its test)
1. **anim_webkit**: a browser test renders the built home page in WebKit and in Chromium, desktop and phone width, and
   checks each of the six scenes paints (its frame on screen has non-background pixels, and its box has a non-zero
   size) at two times in the loop, and with reduced motion. It fails on main today.
2. Every card's scene shows in Safari and Chrome, light and dark theme; the look, timing and words are unchanged.
3. Each of the six cards (including team and mentor) is visible once scrolled into view in both browsers.
4. The CSP is unchanged; no script; the SVG budgets hold (siteScenarioAnimations still passes).

## Out of scope
New drawings, timing changes, other sections.
