# W-scenario-scenes-premium: the scenario drawings look premium

Status: **Approved** to build a sample (owner, 2026-11-28: "Make these graphics premium"). The coordinator's default
reading of "premium" is below; Jan's card is built first and shown to the owner, and the other five follow only on the
owner's yes to the sample. Risk: **low** (drawings and CSS on the public site; no secret, sign-in, data or money).
Verification: the repo's verification command (README.md). Builds on W-scenario-animations-webkit (same files).

## What "premium" means here
- **Depth**: layered stage (soft gradient backdrop, subtle grid or glow in the accent), cards and devices with soft
  shadows and 1px highlights, not flat outlines.
- **Real-looking UI**: the terminal has a title bar, tab strip with ⟳/○ states and monospace lines; the phone is a
  proper device frame with chat bubbles (no third-party logo or branding); the hub is a polished folder/stack icon.
- **Motion with craft**: frames ease in (slide and scale with a soft fade, not a hard cut), and each frame has one
  small live detail: a typing cursor, a spinner turning, a check drawing itself (stroke-dashoffset), a pulse on the
  alert, a progress bar filling.
- **One visual system**: one icon style (stroke width, corner radius), the site's palette and accent only, the site's
  fonts, light and dark themes both deliberate.
- **Legible**: no text in a scene smaller than 13px at 390px wide; fewer, larger labels.

## Acceptance criteria (each named by its test, extending tests/siteScenarioAnimations.test.ts)
1. **premium_sample**: Jan's scene is rebuilt to the above; screenshots (WebKit and Chrome, light and dark, 1280 and
   390 wide, three moments of the loop) go to the owner before the other cards are touched.
2. **premium_all**: after the owner's yes, the other five scenes follow the same system.
3. **premium_text**: every text element in a scene renders at 13px or larger at 390px wide (browser test).
4. **premium_budget**: each scene stays under 16 KB of SVG (raised from 8 KB for the richer drawing); no raster images,
   no script, no style attribute, the CSP unchanged; reduced motion still shows the still strip.
5. The webkit browser test (anim_webkit) still passes for every card.

## Out of scope
Changes to the scenario words or timing, video, illustration libraries, other sections.
