---
title: How ADE works
description: The pieces of ADE and how they fit. A hub per customer or team, an orchestrator, focus agents on the models you pick, the method in each project, and a brain that remembers.
lead: A hub holds the work's memory, an orchestrator runs the team, focus agents do the building, and the method decides when anything is Done.
---

## The pieces

| Piece | What it is | Where it comes from |
|---|---|---|
| `ade` | One command for ADE in any terminal: hubs, agents, the method, specialists, skills | [ade-cli](https://github.com/better-ade/ade-cli) |
| The hub | A private repo per customer or team that holds the context, state and history of the work | [ade-brain](https://github.com/better-ade/ade-brain), the template |
| The method | The rules, the four core roles and the BMAD v6 settings a project follows | [ade-method](https://github.com/better-ade/ade-method) |
| Specialists | Frontend, backend, devops, support and more, loaded only when a task needs one | [ade-agent-registry](https://github.com/better-ade/ade-agent-registry) |
| Skills | Claude Code plugins: git, browser, notes, `fde` documents, the `ade` commands, the ClickUp, Jira, Linear and Orgo [connectors]({{ '/guide/connectors/' | relative_url }}) and the guard | [ade-skills](https://github.com/better-ade/ade-skills) |

`ade` holds no state about your work. Inside a hub it runs the hub's own `bin/` scripts, so the hub stays the single
source of truth. Inside a project it copies the method, specialists and skills from their repos at pinned versions.
All of them are listed on [Repos]({{ '/repos/' | relative_url }}).

## The hub

A hub is one private repo, made from the ade-brain template with `ade hub new`, for one customer or one team. It holds
Bash and Markdown: a folder per project (`projects/<name>`) or system (`ops/<name>`), each with its `STATE.md`, plus the
journal and the hub's memory. The customer's code stays in its own repos; the hub records where each checkout lives.

One hub per customer keeps customers apart: each has its own folders, keys, allowed models and history.

## The orchestrator

`ade claude` opens Claude Code at the hub root as the orchestrator, the *everything agent*. It reads every folder's
state, proposes the day's tasks, and on your go hands each one to the folder that owns it. It confirms the result in
that folder's `STATE.md` and the journal, then reports in a few lines. You can also reach it from
[Telegram]({{ '/guide/telegram/' | relative_url }}). `ade web` shows the same team on a read-only page in your browser
([more]({{ '/guide/ui/' | relative_url }}#ade-web)).

## Focus agents and roles

`ade work <folder>` starts or resumes a focus agent: a Claude Code session in the folder's checkout, with that
folder's hooks, in its own terminal. `ade status` lists the ones running. `--role` picks the model for the job:

| Role | Default model, first choice first |
|---|---|
| `builder` | Opus |
| `architect` | Opus |
| `reviewer` | DeepSeek where the hub allows it, else Sonnet |
| `routine` | Sonnet, then DeepSeek |
| `triage` | Haiku, then DeepSeek |

The builder and the reviewer run on different models by default. `ade roles` shows which model each role gets in your
hub, and why an earlier choice was skipped; `HUB_ROLE_<ROLE>` in `hub.conf` changes a role's list.

## The method in a project

`ade init`, in any git repo, copies ade-method at a pinned version and never overwrites a file you have:

- `.ade/rules.md`, the rules: plan only as much as the change needs, build test-first, and the reviewer's run of the
  verification command decides Done.
- `.ade/agents/`: the four core roles, product, architect, developer and reviewer.
- `.ade/context/`: the context store and decision records the agents read before inventing anything shared.

The **verification command** lives in the project's `docs/architecture.md`. You approve it; changing it later needs
your approval again. Review scales with risk:

| Risk | Typical change | Review |
|---|---|---|
| low | docs, config, a small change already covered by tests | none beyond the verification command |
| medium | most features | one quick review, on the smaller model |
| high | secrets, sign-in, access, personal data, production, money, locks | a thorough review plus one adversarial pass, at most one fix round |

## Memory

Every session starts from what is live, open and waiting:

- **Hooks** read the folder's state and the hub rules back at session start, and on every prompt show what the other
  sessions changed.
- **The brain** (`bin/brain` in the hub) is a local search index over the hub's Markdown (each folder's `STATE.md`,
  the journal, the hub's memory) and each project's `.ade/context` and `.ade/knowledge`, including its decision
  records. Keyword search with SQLite, plus vector search when a local Ollama runs. It is rebuilt from the files, never
  committed, and a chunk that looks like a secret is never indexed.
- **At session end** the hub journals the session's commits, commits the folder's hub files, refreshes the brain and
  syncs. Sync refuses to run without a gitleaks scan.
- **Crash recovery**: `bin/recover` runs each time the orchestrator starts, at login on macOS, and on every monitor
  run for agents that died. It removes stale locks, repairs a torn event log, marks a dead agent's ticket blocked and tells you what that agent left
  and how to resume it. It never commits, resets or checks out anything. `bin/recover --check` changes nothing.
