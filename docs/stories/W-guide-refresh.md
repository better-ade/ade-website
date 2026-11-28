# W-guide-refresh: Get started says what ships today

risk: low (copy on the public site; no secret, sign-in, data or money)
Status: **Approved** (owner, 2026-11-28: "Approve as written").

## Story

As someone setting ADE up from Get started, I want the guide to match what ships today (the seven set-up steps, the
paste guard, one Telegram bot per hub, `ade docs`, `ade keys`, the mouse in `ade ui`, Better Terminal), so I am not
told about steps, settings or states that are gone.

## The text (site/get-started.md and site/_data/repos.yml)

1. Step 1, replacing the "six checked steps" line:
   > `ade setup` walks seven checked steps: Claude Code, Claude, GitHub, your hub, your tools (optional), your first
   > project, Telegram (optional). Rerun to resume.
2. What ships, ade-method: "The rules every agent works by and the four core roles." (drops "and the BMAD v6 settings").
3. What ships, ade-terminal: "Better Terminal, the desktop app: agent status in each tab, a command guard, and
   `ade open`." The "Frozen, still downloadable" state is dropped; the line shows no release (there is no ade-terminal
   checkout for the truth check to read a version from), so it shows no parentheses.
4. Step 2, the Keys line gains: "If you paste a key into a prompt by mistake, the paste guard stops it and names the
   command that stores it."
5. Step 4 gains: "One hub, one Telegram bot. The token goes in that hub's own key store."
6. One short line each: `ade docs` (reads the hub's plans and specs), `ade keys` (sets missing keys at hidden prompts),
   and the mouse buttons ade-cli 0.2.16 added to `ade ui`'s bar.

## Acceptance criteria (tests/siteGuide.test.ts)

1. **steps_seven**: step 1 has the seven-steps line; its count and its list match `GUIDE_STEPS` (and `guide_title`)
   in ade-cli's `ade`, in order.
2. **no_bmad_ships**: Get started's rendered page says "BMAD" nowhere; ade-method's line is the approved text.
3. **terminal_ships**: ade-terminal's line is the approved job, with no "Frozen" and no empty state.
4. **paste_guard_step**: step 2's Keys line has the paste-guard sentence, and ade-brain has `bin/paste-guard`.
5. **one_bot_per_hub**: step 4 has the one-bot sentence.
6. **cli_lines**: `ade docs`, `ade keys` and the bar's buttons are named, and each is in ade-cli's `ade` (its dispatch
   and its `ui_actions` table).
7. The site gate stays green (`npm test`, `jekyll build --strict_front_matter`).

## Out of scope

The paper, the home page.
