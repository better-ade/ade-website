# W-scenario-animations: each scenario plays as an animation

Status: **Approved** (owner, 2026-11-28: "Approve as described"; built after W-scenarios-more). Risk: **low** (drawings and CSS on
the public site; no secret, sign-in, data or money; the CSP is unchanged).
Verification: the repo's verification command (README.md).
Owner's words (2026-11-28): "add a graphics on the scenario, animation rather than text please".

## The idea
Each of the six cards in `#scenarios` becomes a small animated scene that plays its steps in order, one frame per step,
looping. Under the scene, only the step titles show ("Hired.", "Sets up a copilot." ...), and the current one lights up
as its frame plays. The full step sentences (the approved words) stay in the page for screen readers and search, but are
not shown.

| Card | Frames (one per step) |
|---|---|
| Jan | a badge "hired" → a hub folder opens with a persona tag → a terminal: tabs go ⟳ then ○, a test line turns green → a phone: a message out, "Done ✓" and a screenshot back → a shipped box reaches a company and its customers |
| Alvin | a CTO badge over a laptop → one hub holding projects, decisions, rules → stories fan out to three agents, each with a review check → a briefing list: open, waiting, stale; a search finds a decision |
| Robert | one person, three client logos → three separate hubs, a wall between them → plan, build, review lanes, a green test gate → tasks fan out to all clients; a phone shows progress, a terminal shows "approve" |
| Sam | a night sky, a pager alert → a phone, "check why the API is slow" → an agent's findings and a drafted fix; production behind a lock until Sam taps yes |
| Team (Ana, Ben, Chris) | one hub, three laptops join it → a shared journal syncing to all three → three terminals, each with its own agents and own key → one green test gate all three pass through |
| Mentor (Mia, Leo) | Mia's hub, Leo joins → Leo's agent reads the journal and a decision; a search finds the why → Leo's terminal: tabs ⟳ then ○, a test turns green, a review check → Mia reads a story and a review, approves a decision |

## Acceptance criteria (each named by its test, tests/siteScenarioAnimations.test.ts)
1. **anim_scenes**: each card has one inline SVG scene with one group per step, in step order (5, 4, 4, 3, 4, 4), and a role
   of `img` with an accessible name that names the scenario.
2. **anim_titles**: under each scene, only the bold step titles are visible; the current title is marked as its frame
   plays. The full approved sentences are in the card as visually hidden text, so siteScenarios' word checks still hold.
3. **anim_motion**: the animation is CSS only (keyframes in `site.css`), about 3 s per frame, looping. With
   `prefers-reduced-motion: reduce` nothing moves: each card shows its frames as a still strip, and the titles are all
   shown.
4. **anim_csp**: no script, no new file type, no style attribute; the CSP in `site/_includes/head.html` is unchanged
   (the test checks it). Each scene stays under a size budget (8 KB of SVG per card).
5. **anim_phone**: at phone width each scene fits its card, with no horizontal scroll.

## Out of scope
Video, Lottie or any animation library, sound, changes to the scenarios' words, and other sections.
