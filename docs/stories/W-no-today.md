# W-no-today: the home page drops "What works today"

risk: low (removing copy from the public site; no secret, sign-in, data or money)
Status: **Approved** (owner, 2026-11-28: "remove this entire secrion What works today").

## Story
The home page's "What works today" section (`#today`: the "Merged and working." list and its "Later:" line) goes,
whole. Nothing replaces it. What the site claims elsewhere is unchanged.

## Acceptance criteria (each named by its test)
1. **no_today_section**: the home page has no `#today` section, no "What works today" kicker and no "Merged and
   working." heading (tests/sitePages.test.ts or the home test that fits).
2. **no_today_link**: no page or include links to `/#today`; the footer's "What works today" link is gone.
3. **sections_alternate**: the home sections still alternate plain and tinted (the existing check, kept green; flip the
   next section's tint if needed).
4. Tests that relied on the section are updated to what the page is now: the Secure storage order check (it sits
   before Used on real work), and the "Later" check (the home page no longer carries a Later line; the paper still
   does). `docs/messaging.md` says so in the lines that named the section.
5. The site gate stays green (README, "Verification command").
6. **no_built_on**: the footer no longer says "Built on Claude Code and the open-source BMAD Method (v6)." (the paper is untouched).
7. **no_coming_note**: the footer no longer says "What is not merged yet is marked Coming"; it keeps "ADE · open source, MIT licensed".

## Out of scope
Any other copy; the paper.

## Added (owner, 2026-11-28)
"remove this Built on Claude Code and the open-source BMAD Method (v6)." and, quoted by the owner, the footer's "What
is not merged yet is marked Coming".
6. **no_built_on**: the footer has no "Built on Claude Code and the open-source BMAD Method (v6)." line; docs/messaging.md
   no longer asks for it. The paper's references (Claude Code, BMAD) stay.
7. **no_coming_note**: the footer has no "What is not merged yet is marked Coming" note.
8. **from_ardata**: where the "Built on" line was, the footer says "From the Engineering Practices at AR Data
   Intelligence Solutions Inc." (owner, 2026-11-28: "Add from the Engineering Practices at AR Data Intelligence
   Solutions Inc."); docs/messaging.md names that footer sentence.
