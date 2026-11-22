# ADE messaging

The source of truth for every word on the site. Pages take their copy from here; when the story changes, change it
here first, then the pages. Approved by the owner.

## Core story

- **Problem.** AI agents write code fast, but nobody trusts what they ship. Teams spend their time checking,
  untangling and redoing agent work. Every session starts from zero, and the agent grades its own homework.
- **Turn.** Speed was never the hard part. Trust is.
- **Promise.** ADE gives you an AI delivery team that works like a good engineering team: it plans, builds and
  reviews, it remembers, and nothing counts as done until the tests say so.

## Positioning

For software teams and product managers who want AI to ship real work, ADE is the AI delivery team that turns tickets
into verified, reviewed changes, unlike general AI assistants that leave you to check everything they do.

## Tagline

**Verified, not vibed.**

Alternates:

- Your AI delivery team. Done means tested.
- Agents that ship work you can trust.

## Pillars, with proof

| Pillar | Proof |
|---|---|
| **Verified** | The verification command gates Done. No agent approves its own work. Review scales with risk. |
| **A team, not a chatbot** | 4 core roles plus specialists from ade-agent-registry. An orchestrator that dispatches tickets. Reviewers on a different model. |
| **It remembers** | The brain indexes decisions, the journal and project context. Crash recovery. |
| **You stay in control** | High-risk work waits for your approval. Secrets never reach agents. Each customer kept separate. |
| **Works where you are** | `ade ui` tabs and the file viewer in any terminal, the desktop app, Telegram, Remote Control, your tracker (ClickUp, Jira, Linear; every change asks first), a Mac or an Ubuntu server. |

## Audience messages

- **Developers.** "Hand off the ticket, keep the judgement. ADE builds test-first on the model you pick, reviews by
  risk, and you merge only what's green."
- **Product managers.** "Write what you want in plain words. Watch it get built from Telegram and approve what
  matters, without reading code."
- **Forward deployed engineers and consultancies.** "One hub per customer. Their approved models only, their data stays
  put, every engagement document drafted."
- **Support.** "Reproduce, investigate, draft the reply. Nothing reaches a customer without your yes."

## Versus

- **General assistants (OpenClaw, Hermes).** "They're assistants for everything; ADE is a delivery team for one thing:
  shipping verified work." Respectful; no attack.
- **Coding copilots and agents alone.** "An agent writes code; ADE runs the whole loop: ticket → build → review →
  verified → done, with memory."
- **DIY scripts.** "The method, guardrails and recovery are already built and tested."

## Objections

- **Is it safe?** Approvals, owner-only actions, secrets out of agents' reach, per-customer isolation.
- **Lock-in?** Open source, any model, your own account.
- **Just prompts?** A tested system, verified by its own test suites.

## Tone

Calm, precise, engineering-honest, no hype. Show real output.

## Rules for the pages

- **Truth.** Every claim matches what is merged on `main` in the better-ade repos today. Anything not merged yet is
  labelled **Coming**. The site's tests hold the pages to the repos where they can (see `tests/`).
- No hosted service, subscription or pricing. No person or customer names. No AI attribution.
