# ADE messaging

The source of truth for every word on the site. Pages take their copy from here; when the story changes, change it
here first, then the pages. Approved by the owner.

## Core story

- **Problem.** AI agents write code fast, but nobody trusts what they ship. Teams spend their time checking,
  untangling and redoing agent work. Every session starts from zero, and the agent grades its own homework.
- **Turn.** Speed was never the hard part. Trust is.
- **Promise.** ADE gives you an AI delivery team that works like a good engineering team: it plans, builds and
  reviews, it remembers, and nothing counts as done until the tests say so.

## One engineer's day (the thread across the site)

Owner, 2026-11-24. The site follows one software engineer who builds several projects, for several customers. Every
page that introduces ADE tells it in the same four steps, in this order (story `docs/stories/W-narrative.md`):

1. **You.** Your persona (one of ade-brain's personas, picked by `ade hub new`), the roles around you (ade-method's
   core roles, ade-agent-registry's specialists) and your responsibilities (you approve; the verification command
   decides Done).
2. **Your context, tools and access.** Claude, each project's memory, and services connected one at a time with
   `ade connect <service>`. Name a service only if ade-skills has a recipe or a plugin for it; a `held` recipe
   (GitHub, Gmail, Slack, Outlook, Microsoft Teams, Discord in v0.9.0) is labelled Coming.
3. **Projects and customers.** `ade project add`, one focus agent per project (`ade work`), several tasks at once
   (`ade dispatch`), one hub per customer (`ade hub new`).
4. **Run it from the terminal or Telegram.** `ade ui` at the desk, the bot locked to you on the phone.

Then the **ADE Computer**: one machine per engagement (a mini PC, a compute instance, or the container on your own
Docker), for dedicated work or several contracts. Examples stay generic: "a fintech client", "an agency project".
On the home page the story is the section right after the hero, one line per step, before the ADE Computer line.
The detail of each step is on Get started.

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
- **Headline.** "Your AI delivery team, in a computer you control." (the gradient is on "in a computer you control.").
  The tagline stays **Verified, not vibed.** The page title and the meta description say the same.
- **Sub-text, word for word.** "A separate Ubuntu desktop for each project, with your AI agents inside. Watch from your browser or your phone. Work counts as done only when the tests pass."
- **Early preview.** The image and its launcher are not public yet. The home page's first button is **Ask for an
  early preview**: it opens an email to the preview address (the mailbox "preview" at ardata.tech), with the subject
  "ADE Computer early preview" and a short body asking what they would use it for, their team size and their
  platform. The address is never written in a page: a small script (`site/assets/js/preview.js`) builds the link on
  click. Without JavaScript the button opens this repo's issue form
  (`.github/ISSUE_TEMPLATE/ade-computer-preview.yml`), and a small link under the button, "or open a GitHub issue",
  opens the same form. The form itself says that an issue is public.
- **Honest about the wall.** A computer is a container, not a separate machine. It is not given your home folder,
  your keys or the Docker socket, and a project folder is shared only when you name one. It can reach the internet
  and, on Docker Desktop, services on your machine that listen on localhost. Say this wherever "isolated" is said.
- **In the cloud.** Coming. Name no provider and promise no service: it is a computer you start, not one we run.
- **Never on the site:** a link to its repo (private), a command that installs or starts it, a date.
- **The hero.** Two columns on a wide screen (from 1024px), the drawing's column the wider one: the kicker,
  headline, sub-text, buttons and the two short lines under them on the left, left-aligned; the drawing on the right.
  Below that, the words first, then the drawing. On a 1280x800, 1440x900 or 1920x1080 screen the whole hero is on
  the first screen, and no text in the drawing is under 13px.
- **The hero drawing.** Three things, clearly apart: two phones, and beside them an ADE Computer window of our own
  drawing (a top bar, a terminal window in the middle, and a dock along the bottom with plain icons for a code
  editor, a terminal, a database tool and a browser). The phones never overlap the window or each other. Beyond
  Telegram's own logo, no logo, mascot, character, brand colour or style of any other product, provider or game. Its
  words are copy:
  - **Phone 1, "ADE on your phone".** ADE's own logo and the word **ADE**: the agents and their states (busy, working,
    idle) in step with the loop, then "tests pass ✓ Done". It is the read-only web view (`ade web --tailnet`) over your
    own Tailscale network, and the line under the drawing says so.
  - **Phone 2, Telegram.** Telegram's own logo (the white paper plane in the blue circle, unmodified, used only to show
    the integration) beside the word **Telegram**. The owner's message in it is "can't log in"; the reply is "Done.
    Tests pass.", with a small picture of the proof (`ade shot --tg` sends one). No approval buttons in the chat: they
    are Coming.
  - **The team.** Five badges around the terminal, as a team at a table and not a list, joined by dotted hand-off
    lines: **Orchestrator** (lower left, next to the phone), **Product**, **Architect** (top), **Developer**,
    **Reviewer** (lower right). They are ade-method's four core roles and the orchestrator. No specialists here.
  - **Agent faces.** Each role has the same small face of our own: a rounded screen with two eyes and a status light,
    in the role's colour along the orange-to-violet gradient, with the role's job icon as a corner badge. The light
    glows while that role works; the Reviewer's shows a check at Done.
  - **Services, as plain names, an example mix.** A small second line on each badge: Orchestrator, Product and
    Architect on **Claude**, Developer on **Gemini**, Reviewer on **DeepSeek**. The page says it is an example mix:
    the defaults are in ade-brain (the builder on Claude Opus, the reviewer on DeepSeek or Claude Sonnet), and with
    only Claude signed in the builder runs on Claude Opus and the reviewer on Claude Sonnet. Only what ADE runs
    today is shown running a role;
    the orchestrator is only ever shown on Claude. Nothing Coming is in the drawing. On a phone the second line goes.
  - **The terminal is never empty.** It opens on a prompt and a line of output, `$ git pull` and
    "Already up to date.", which stay through the whole loop.
  - **The loop, about 12 seconds:** "can't log in" leaves the phone and reaches the Orchestrator; a small tag,
    "Login fails after reset", appears by Product; the Architect takes its turn; the Developer's terminal runs
    `bash tests/run.sh`, shows "not ok login after reset", then "# fix: keep the session", runs it again and shows
    "ok all tests pass", and the test dot turns from red to green; the Reviewer shows "tests pass ✓ Done"; the note
    returns to the Orchestrator, and "Done. Tests pass." arrives on the phone.
  - **Not in the hero:** a ticket card, the specialists, "loaded when needed", the list of services. They are in the
    section under it.
  - It is an illustration of the method, not a recording: no customer, no person, no real project in it.

## AI services per role (on Get started, under step 2)

- **Headline.** "Mix AI services per role." Each role runs on the service you pick for it; `ade roles` shows which.
- **Roles.** One line per role, with the service it runs on in the hero's drawing: Orchestrator,
  Product and Architect on Claude, Developer on Gemini, Reviewer on DeepSeek.
- **Specialists.** **Support** and **Sysadmin**, "loaded when needed" (from ade-agent-registry).
- **Later, one quiet line (not a section, no labels).** "Later: Kimi and ChatGPT as services, ADE Computer in the
  cloud, keys per hub (`ade key`, `ade vault`), the `codesec` plugin, and Telegram commands for status and progress."
  Once on the home page (in "What works today") and once in the paper; nowhere else.
- **Services.** Available today: **Claude**, **DeepSeek**, **Gemini**. Then **GLM**, **Muse**, **Kimi** and
  **ChatGPT**, each with its own Coming label.

## The pages

- The site is three pages: the home page, **Get started** and the **technical paper**.
- **The home page** is about 500 words in six sections, in this order: the hero (one line, the install command, the
  drawing); "A day with ADE" (the four steps, one line each); "One ADE Computer per engagement" (one line); "How it
  works" (the five steps of the loop, one line each); "What works today" (a short list, Coming labels kept, and the
  Later line); "Used on real work", with links to Get started and the paper. Everything else is on Get started.
- **Get started** is numbered steps, one command each, then the ADE Computer, the verification commands and what
  ships. The guide, the Repos page
  and the ADE app page are gone; their addresses, and every older address that pointed at them, redirect to the
  home page.
- **The paper** (`/paper/`, "Paper" in the menu): "Fast and verified: delivering software with a team of AI
  agents", by "The ADE team · Conceived May 2025 · This edition November 2026", with the conception sentence after the abstract. Its text is the paper's own, copied as it is; the page adds a table of
  contents, a "Download PDF" link and the site's Coming label where the paper names work that is not merged. Its
  numbers are as of 23 November 2026 and say so. The home page links it as "Read the technical paper".
- Where a page used to link to a guide page, it links to the README of the public better-ade repo that documents the
  same thing, or to nothing.

## What works today, in plain words

- **The guided first run.** `ade setup`: six steps from nothing to a working hub (Claude Code, sign in to Claude, sign
  in to GitHub, your hub, your first project, Telegram), each said before it runs and checked after. A step that fails
  says what went wrong in one line and offers what fits; `ade setup` again resumes where you are.
- **Telegram control.** Your own bot, locked to you alone. Once it is locked, the chat runs in auto mode: your main
  agent acts on your messages without asking at the terminal, Claude Code's auto mode still refuses risky actions,
  and one line in `hub.conf` turns it off.
- **`ade web`.** A read-only page of your agents, their logs and the journal, keys hidden: on this machine, or on
  your tailnet for your phone.
- **`ade project`.** `ade project add <path or git address>` brings a repo you already have into the hub; `list`
  shows them; `--scan` finds the repos in a folder. Released in ade-cli v0.2.8.
- **`ade shot`.** Screenshots as proof, kept with the project; `--tg` sends one to you on Telegram. Released in
  ade-cli v0.2.8.
- **Connectors and the guard.** ClickUp, Jira, Linear and Orgo, each through the service's own server; reads are free,
  every change asks. The guard refuses the commands that print a stored token.
  `ade connect <service>` connects ClickUp, Jira or Linear to a project with your own sign-in; the project records
  names only.
- **Keys.** Typed only at a hidden prompt in your own terminal. Agents never see a value.

## Coming, and later

There is no Coming section on the home page. Whatever is not merged and is **next** keeps a small **Coming** label
where it is mentioned. Only three things are next: **approval buttons on Telegram**, **Telegram pairing without
commands**, and **the connectors beyond ClickUp, Jira and Linear** (`ade connect` is merged; the GitHub, Gmail,
Slack, Outlook, Microsoft Teams and Discord recipes are held). The GLM and
Muse providers, Gemini in `ade setup`'s live test and an Anthropic API key or DeepSeek for the orchestrator keep their
label too.

**Later** is one quiet line without labels: Kimi and ChatGPT, ADE Computer in the cloud, keys per hub, the `codesec`
plugin, Telegram commands for status and progress. Every sentence that says approvals happen on Telegram says what
works today (approvals are given at your own terminal) or carries the Coming label.

## What ships with ADE (Get started)

One line per public better-ade repo listed with a `job` in `site/_data/repos.yml`: its job, its latest release (from
`site/_data/releases.yml`, held to each repo's `VERSION` by the tests) and a link to the repo. ADE Computer is a line
marked early preview, with no link. `/repos/` redirects to `/get-started/#what-ships-with-ade`.

## Built on BMAD v6

The footer says: "Built on Claude Code and the open-source BMAD Method (v6)."

## Questions (said on Get started, under "What you need" and step 1)

- **Who pays for the AI models?** You do, directly: your own Claude account, or your own API key with each AI service
  you choose. ADE is free and open source, under the MIT license.
- **What is a hub?** One git repository per owner or per client, made from ade-brain. It holds each project's context,
  the memory, the journal and the agents' rules. Your code stays in its own repos.
- **Where do my prompts go?** Only to the AI services you choose. ADE runs no server and collects nothing. Telegram
  messages pass through Telegram.

## Audience messages

- **Developers.** "Hand off the ticket, keep the judgement. ADE builds test-first on the model you pick, reviews by
  risk, and you merge only what's green."
- **Product managers.** "Write what you want in plain words. Follow it from Telegram and get proof when it is
  done, without reading code. Approvals are given at your own terminal today; approval buttons in Telegram are Coming."
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

**Short** (owner, 2026-11-24: "too wordy"). Headlines of 2 to 6 words, one short sentence under each (two at most),
bullets over paragraphs, and each point made once on a page. The messages in this file are the meaning; the pages
may say them in fewer words. The home page has no separate pillars section: each pillar's proof sits in the story,
the ADE Computer, How it works or What works today.

## Rules for the pages

- **Truth.** Every claim matches what is merged on `main` in the better-ade repos today. Anything not merged yet is
  labelled **Coming**. The site's tests hold the pages to the repos where they can (see `tests/`).
- No hosted service, subscription or pricing. No person or customer names. No AI attribution.
- GitHub links go only to better-ade's public repos (the Repos page's list). Never a private repo.
- **Keys.** The site never shows a key, and never tells anyone to paste one into a chat, a file or a command line.
