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
| **Works where you are** | `ade ui` tabs and the file viewer in any terminal, `ade web` on your phone, the desktop app, Telegram, Remote Control, your tracker (ClickUp, Jira, Linear; every change asks first), a Mac or an Ubuntu server, an ADE Computer. |

## ADE Computer (the home page leads with it)

- **What it is.** An isolated Ubuntu desktop with ADE, VS Code, a terminal and database tools already installed. One
  per project or per task, on your own Docker today. You watch its desktop in your browser, on your own machine only.
- **Headline.** "A computer of its own for your AI delivery team." The tagline stays **Verified, not vibed.**
- **Early preview.** The image and its launcher are not public yet. The home page's first button is **Ask for an
  early preview**: it opens this repo's issue form (`.github/ISSUE_TEMPLATE/ade-computer-preview.yml`). The request
  is a public issue, and the page says so: put nothing private in it.
- **Honest about the wall.** A computer is a container, not a separate machine. It is not given your home folder,
  your keys or the Docker socket, and a project folder is shared only when you name one. It can reach the internet
  and, on Docker Desktop, services on your machine that listen on localhost. Say this wherever "isolated" is said.
- **In the cloud.** Coming. Name no provider and promise no service: it is a computer you start, not one we run.
- **Never on the site:** a link to its repo (private), a command that installs or starts it, a date.
- **The hero.** Two columns on a wide screen (from 1024px): the kicker, headline, sub-text, buttons and the two
  notes on the left, left-aligned; the drawing on the right. Below that, the words first, then the drawing.
- **The hero drawing.** An ADE Computer desktop of our own drawing (a top bar, a dock with plain icons for a code
  editor, a terminal, a database tool and a browser, and a terminal window), with the agents at work on it. No logo,
  mascot, character, brand colour or style of any other product, provider or game. Its words are copy:
  - **The chat.** A small chat panel at the window's corner, a plain speech-bubble icon and the word **Telegram**.
    The owner's message in it is "can't log in"; the reply is "Done. Tests pass.", with a small picture of the proof
    (`ade shot --tg` sends one). No approval buttons in the chat: they are Coming.
  - **Role labels, exactly:** **Orchestrator**, **Product**, **Architect**, **Developer**, **Reviewer** (ade-method's
    four core roles and the orchestrator), and two specialists drawn dimmer, **Support** and **Sysadmin**, with
    "loaded when needed" (they come from ade-agent-registry).
  - **Agent faces.** Each role has the same small face of our own: a rounded screen with two eyes and a status light,
    in the role's colour along the orange-to-violet gradient, with the role's job icon as a corner badge. The light
    glows while that role works; the Reviewer's shows a check at Done. Specialists have the face, dimmer.
  - **Models, as plain names.** Under each role, what it runs on in this scene: Orchestrator, Product and Architect
    on **Claude**, Developer on **Gemini**, Reviewer on **DeepSeek**. A strip at the bottom reads "Runs on Claude ·
    DeepSeek · Gemini", then **Coming** "GLM · Muse · Kimi · ChatGPT". Only what ADE runs today is shown running a
    role; the orchestrator is only ever shown on Claude. On a phone the strip stays and the per-role names go.
  - **The loop, about 12 seconds:** "can't log in" leaves the chat and reaches the Orchestrator; a ticket, "Login
    fails after reset", goes to Product; the Architect adds "design note ✓"; the Developer's terminal runs
    `bash tests/run.sh`, shows "not ok login after reset", then "ok login after reset" and "ok all tests pass", and
    the test dot turns from red to green; the Reviewer shows "tests pass ✓ Done"; the note returns to the
    Orchestrator, and "Done. Tests pass." arrives in the chat.
  - It is an illustration of the method, not a recording: no customer, no person, no real project in it.

## What works today, in plain words

- **The guided first run.** `ade setup`: six steps from nothing to a working hub (Claude Code, sign in to Claude, sign
  in to GitHub, your hub, your first project, Telegram), each said before it runs and checked after. A step that fails
  says what went wrong in one line and offers what fits; `ade setup` again resumes where you are.
- **Telegram control.** Your own bot, locked to you alone. Once it is locked, the chat runs in auto mode: your main
  agent acts on your messages without asking at the terminal, Claude Code's auto mode still refuses risky actions,
  and one line in `hub.conf` turns it off.
- **`ade web`.** A read-only page of your agents, their logs and the journal, keys hidden: on this machine, or on
  your tailnet for your phone.
- **`ade shot`.** Screenshots as proof, kept with the project; `--tg` sends one to you on Telegram.
- **Connectors and the guard.** ClickUp, Jira, Linear and Orgo, each through the service's own server; reads are free,
  every change asks. The guard refuses the commands that print a stored token.
- **Keys.** Typed only at a hidden prompt in your own terminal. Agents never see a value.

## Coming (not merged; every mention carries the label)

`ade project add`, `list` and `--scan`; `ade key` and `ade vault`, with keys per hub; `ade connect`; Telegram pairing
without typing commands; approval buttons for focus agents; the Telegram commands `/status`, `/progress`, `/start`
and `/stop`; ADE Computer in the cloud; the `codesec` plugin; the GLM, Muse, Kimi and ChatGPT providers; Gemini in `ade setup`'s live
test; an Anthropic API key or DeepSeek for the orchestrator; connectors beyond the four above.

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
- GitHub links go only to better-ade's public repos (the Repos page's list). Never a private repo.
- **Keys.** The site never shows a key, and never tells anyone to paste one into a chat, a file or a command line.
