# W-persona-over-time: the home page tells how a persona grows with the brain

risk: low (copy and tests on the public site; no secret, sign-in, data or money)
Status: Approved (owner, 2026-11-26: the five-step draft, headline "Build your persona over time, be great at what you do")

## Story

As an engineer looking at ADE, I want to see how a hub becomes my persona over time, so I understand that it keeps and
grows what I know about each client.

A new home-page section `#persona`, right after `#story`: kicker "The brain", h2 "Build your persona over time, be great
at what you do.", five step cards in order, then one closing line, then a link to ade-brain (`site.brain_repo`).
The same five steps go into `docs/messaging.md` first (the site takes its copy from there).

1. **Pick who it is.** One of 13 personas (staff engineer, DevOps/SRE, data engineer, security engineer, fractional CTO
   ...) or your own. `bin/init --persona devops-sre --client "a fintech client"` makes a private hub: one persona, one
   client, with its habits, work folders and suggested model.
2. **Give it the work.** `bin/new projects/shop --repo ...` brings in each project: its own agent, state and access list;
   the client's code stays in its own repos.
3. **It starts each day knowing what is live.** A morning briefing: what is open, waiting and stale. Every session reads
   the folders' state and the journal, so no agent starts from zero.
4. **It learns how you work, with your yes.** Correct an agent or repeat a preference and it records the rule in your
   words; it takes effect only after you confirm it in your own terminal. At most 30 lines load into each session;
   `bin/learn` shows, edits or forgets any of them.
5. **It remembers everything, locally.** `bin/brain search "what did the client decide about SMS"` finds any note,
   decision or journal entry by keyword and meaning, on your machine; nothing leaves it.

Closing line: "One hub per client, so clients never mix. Over weeks, the persona knows the client the way a senior
engineer does."

No client, person or customer names; generic examples only.

## Acceptance criteria (each named by its test, in `tests/sitePersona.test.ts`)

1. **the home page has the persona section after the story, with the owner's headline** - `#persona` follows `#story`;
   its h2 is the headline above.
2. **the five steps are cards in order** - five cards with `data-persona` pick, work, day, learn, remember, in order.
3. **the persona count is ade-brain's** - the number named equals the files in `repos/ade-brain/personas/`, and each
   persona named matches one of their titles.
4. **every command named is real** - `bin/init --persona`, `bin/new ... --repo`, `bin/learn`, `bin/brain search` exist in
   repos/ade-brain (script present; flag or subcommand in its source or README).
5. **the learning limit matches the brain** - the "30 lines" equals `HUB_LEARN_LINES`' default in repos/ade-brain, and
   the "confirm in your own terminal" claim matches `bin/learn confirm` there.
6. **messaging.md carries the same five steps**.

## Verification

`export PATH=/opt/homebrew/opt/ruby@3.3/bin:$PATH && JEKYLL_ENV=production bundle exec jekyll build -q -s site -d _site
--strict_front_matter && npm test`
