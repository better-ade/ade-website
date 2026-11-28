# W-scenarios-more: two more scenarios, a team sharing a brain and a senior teaching a junior

Status: **Approved** (owner, 2026-11-28: "Both A and B", the words below). Risk: **low** (copy and tests on the public
site; no secret, sign-in, data or money).
Verification: the repo's verification command (README.md).
Owner's words (2026-11-28): "also add a scenario for a 2 to 3 engineers sharing a brain", then "or Senior engineer
teaching a JR engineer".

## Where
Two more cards in `#scenarios`, after Sam's and before the closing line, in this order. The words go into
`docs/messaging.md` first.

## The scenarios (approved words)

**Ana, Ben and Chris, three engineers sharing one brain**
1. **One hub.** Ana makes the team's hub with `ade hub new`; Ben and Chris join it with `ade hub import <url> --share`.
2. **Shared memory.** The journal, the decisions and each project's state are the same for all three; `bin/sync` keeps
   them current, so every session knows what the others did.
3. **Own agents, own keys.** Each runs their own focus agents on their own tickets and sets their own keys; no key is
   shared.
4. **One bar for Done.** The same rules and the same tests for everyone, so nobody's work counts until the tests pass.

**Mia teaching Leo, a senior and a junior engineer**
1. **Shares the hub.** Mia brings Leo into the team's hub with `ade hub import <url> --share`.
2. **Learns from the record.** Leo's agents read the same journal, decisions and project notes Mia's do;
   `bin/brain search` finds why something was done.
3. **Builds with guard rails.** Leo takes his own tickets with his own agents; the tests decide Done, and each change is
   reviewed by its risk before it counts.
4. **Reviews what matters.** Mia reads Leo's stories and reviews, not every line, and spends her time on the decisions
   he can't make yet.

## Acceptance criteria (each named by its test, extending tests/siteScenarios.test.ts)
1. **scenarios_section**: six cards in order (Jan 5, Alvin 4, Robert 4, Sam 3, team 4, mentor 4) in the approved words,
   then the closing line; the cards' `data-scenario` are `jan|alvin|robert|sam|team|mentor`.
2. **scenarios_truth**: `docs/messaging.md` has the words; every command named (`ade hub new`, `ade hub import … --share`,
   `bin/sync`, `bin/brain search`) exists on `main` today (the test checks the ade-cli and ade-brain checkouts).
3. **scenarios_names**: the names rule lists first names only: Jan, Alvin, Robert, Sam, Ana, Ben, Chris, Mia, Leo; the
   test allows only those.
4. **Tints**: home sections still alternate plain and tinted (siteStorage).

## Out of scope
The animations (W-scenario-animations), other sections, changes to the four existing scenarios' words.
