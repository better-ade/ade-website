# W: the paper says keys are signed by the sender (ade-brain story I5)

Status: **Approved** (owner, 2026-11-25: "Both, when merged"; I5 merged as ade-brain #91, 0d13644). Risk: **low** (docs and a figure, covered by tests).
Verification: the site build, then `npm test`.

## Goal
Security point 6 of the paper says what `bin/keys receive` checks in a signed block, Figure 5 shows the signature, and
section 8 says what a signature does not prove.

## Acceptance criteria (each named by its test)
1. Point 6 states the signing, the check against the sender's GitHub keys, the refusals (changed, other key,
   forwarded, `--from`), and the ask before storing; each claim matches ade-brain `bin/keys`
   (tests/sitePaper.test.ts: "the sixth security point says what bin/keys receive checks in a signed block").
2. Section 8 holds "A signature proves a key, not a person." (same test).
3. Figure 5 stays in point 6, safe SVG (existing figure tests).

## Out of scope
One-time links (I6): added when I6 merges.
