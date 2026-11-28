# W-scenarios-stage: "How people use ADE" as one stage: pick who you are, the story plays, each step explained

Status: **Approved** (owner, 2026-11-28: "on the How people use ADE. i feel like we can do better", then "Pick who you
are", then "explain the process section by section"). Built before W-narrative (which then moves this section into
Act 1 unchanged). Risk: **low** (layout and CSS on the public site; no secret, sign-in, data or money; CSP unchanged).
Verification: the repo's verification command (README.md).

## The idea
The six cards become one stage.
- **The people row:** Jan, Alvin, Robert, Sam, the team (Ana, Ben, Chris) and Mia & Leo, each a round avatar drawing
  with the role under it (engineer, CTO, consultant, on call, three engineers, mentor). One is picked; Jan first.
- **The stage:** the picked person's premium scene, large (about twice today's card), playing its frames as now.
- **The process, step by step** (the owner's "explain the process section by section"): beside the scene (under it
  on a phone), the person's steps as a numbered timeline, each with its bold title **and its full approved sentence
  shown**, not hidden. The step whose frame is playing is lit, with a progress line down the timeline.
- The closing line stays under the stage.

## How (no script, as today)
The CSP allows no new script. The picker is a radio group with labels (`:checked` selects the person's panel), so it
works with the keyboard and screen readers (a real radio group with a legend), and with nothing else loaded. On a
phone the people row scrolls sideways (scroll-snap). With `prefers-reduced-motion`, each scene is the still strip and
every step is lit. The words are the approved ones, unchanged; siteScenarios' word checks still hold.

## Acceptance criteria (each named by its test, tests/siteScenariosStage.test.ts)
1. **stage_people**: one radio group with six people in the approved order, Jan checked by default; picking each
   shows only that person's scene and steps (Chromium and WebKit).
2. **stage_steps_shown**: every step's title and full approved sentence are visible for the picked person; the lit
   step follows the playing frame.
3. **stage_keyboard**: arrow keys move between people; focus is visible; the group has an accessible name.
4. **stage_csp**: no script, no style attribute, CSP unchanged; scenes keep their 16 KB budget.
5. **stage_phone**: at 390 px the people row scrolls sideways with no page-wide horizontal scroll, the scene fits,
   and step text is at least 13 px.
6. **stage_reduced**: with reduced motion, still strips and every step shown.

## Out of scope
New words, new people, new scenes, the other sections.
