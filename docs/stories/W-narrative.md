# W-narrative: the site tells one engineer's day

risk: low (copy and tests on the public site; no secret, sign-in, data or money)

## Story

As a software engineer with several projects or clients, I want the site to show my day with ADE in four plain steps,
so I can see where I fit and what ADE does for each part of my work.

The four steps, in this order, on every page that introduces ADE:

1. **You:** your persona, roles and responsibilities.
2. **Your context, tools and access:** Claude, and the connectors that exist (anything not built is labelled Coming).
3. **Projects and customers:** focus agents, one per project, one hub per customer, several tasks at once.
4. **Run it from the terminal or Telegram.**

Then the ADE Computer: one compute instance or mini PC per engagement, for dedicated work or several contracts.

No client, person or customer names in the new copy; generic examples only ("a fintech client", "an agency project").

## Acceptance criteria (each named by its test, in `tests/siteNarrative.test.ts`)

1. **the home page tells the four steps in order, then the ADE Computer line** - each step is a card in `#story`, in
   order, with its name, and the ADE Computer line that follows names a mini PC, a compute instance, dedicated work and
   several contracts.
2. **step 1 names the hub's personas and ADE's roles as they are** - the persona count is ade-brain's `personas/`, each
   persona named is one of them, and the roles are ade-method's core roles and ade-agent-registry's specialists.
3. **step 2 names Claude, and every tool or connector it names has a recipe or a plugin, or is marked Coming** - a
   `ready` recipe is not marked Coming, a `held` one is, and no service is named outside a `data-tool` item.
4. **step 3 names the commands that bring projects in and run focus agents** - `ade project add`, `ade work`,
   `ade dispatch` and `ade hub new`.
5. **step 4 names the terminal and Telegram** - `ade ui` and the Telegram bot locked to you.
6. **Get started follows the same four steps, in the same order, then the ADE Computer**.
7. **the paper introduces ADE with the same four steps, in order**.

## Notes

- `ade connect` (ade-cli A16) is merged on `main`, so its Coming label goes; the GitHub, Gmail, Slack, Outlook,
  Microsoft Teams and Discord recipes are `held` in ade-skills v0.9.0 and stay Coming.
- The hero, and the video's place in it, are unchanged.
