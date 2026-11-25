# W: the paper says a keys block can travel as a one-time link (ade-brain story I6)

Status: **Approved** (owner, 2026-11-25: "Both, when merged"; I6 merged as ade-brain #92, 424d127). Risk: **low**
(docs and a figure label, covered by tests). Verification: the site build, then `npm test`.

## Acceptance criteria (each named by its test)
1. Security point 6 says `--link` posts the sealed block to a Onetime Secret service, the link opens once, the
   service holds only ciphertext, and a refused block is kept for a retry; matched against ade-brain `bin/keys`
   (tests/sitePaper.test.ts: "the sixth security point says what bin/keys receive checks in a signed block").
2. Figure 5's sealed-block label reads "chat, email or a one-time link"; the figure stays safe SVG (existing tests).
