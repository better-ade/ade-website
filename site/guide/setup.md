---
title: ade setup
description: What ade setup does, step by step. The everything agent, focus providers, live tests, Telegram and the tools it installs.
lead: One command from nothing to a working hub and a guided first session. It asks before every step.
---

> What a provider does not support yet is marked <span class="coming">Coming</span> below.

## The steps, in order

1. **Claude Code.** If it is missing, `ade setup` shows the installer's URL and runs it only after your yes. A "no"
   prints the command to run yourself.
2. **The hub.** If you have none, it makes one with `ade hub new`: a name, and whether it should be a private GitHub
   repo.
3. **The everything agent.** Exactly one: the orchestrator. It is signed in, then live-tested.
4. **Focus providers.** Any number, for the focus agents. Each is signed in, then live-tested; a failure shows its
   reason.
5. **The allowed list.** `HUB_PROVIDERS_ALLOWED` in `hub.conf` becomes the everything agent plus every focus provider
   that passed, so the hub's roles never pick a provider that failed.
6. **Telegram.** Asked once. See [Telegram]({{ '/guide/telegram/' | relative_url }}).
7. **The guided session.** `ade claude` opens the orchestrator, which asks about your projects and then, with your yes
   for each, runs `ade init`, `ade agent add`, `ade skills add` and sets the role models.

## Providers

Everything runs through Claude Code, except Gemini: it runs in the Gemini CLI, for focus agents and builders only, when
a role in `hub.conf` names a `gemini:<model>` entry and the hub allows `gemini`. The orchestrator stays on Claude Code.
GPT and Codex are not offered.

| Provider | Everything agent | Focus agents |
|---|---|---|
| Claude, with your Claude account | yes | yes |
| Claude, with an Anthropic API key kept in the hub | <span class="coming">Coming</span> | <span class="coming">Coming</span> |
| DeepSeek | <span class="coming">Coming</span> | yes, in your own hub (refused in a customer's hub) |
| Gemini | no | yes, through a role entry; in `ade setup` its live test fails until it runs the Gemini CLI <span class="coming">Coming</span> |
| GLM, Muse | <span class="coming">Coming</span>, after a passing live check | <span class="coming">Coming</span>, after a passing live check |

## Live tests

Each provider gets one tiny read-only task in a throwaway folder, run the way a real focus agent runs. It is ready only
when it answers with a line that is exactly `READY`; anything else shows the last line it printed, with key-shaped
strings hidden, and the provider is left out of every role. No key or backend setting from your shell reaches the test.
The hub runs it, with `bin/agent --live-test`.

## Modes

| Command | What it does | Today |
|---|---|---|
| `ade setup` | every step above | works |
| `ade setup --check` | one line per step (Claude Code, sign-in, hub, projects, channel); changes nothing | works |
| `ade setup --telegram` | only the Telegram step | works |
| `ade setup --top` | change the everything agent | works |
| `ade setup --test [provider]` | re-run the live tests, for one provider or `telegram`; writes nothing | works |
| `ade setup --tools` | install the missing tools with Homebrew or apt, after one yes | works |

## Your keys

A key is typed at a hidden prompt and handed straight to the hub's `bin/keys` on standard input. It never appears in a
command line, a log or a file in your repo, and Claude Code reads it through its key helper, never from its
environment. With a Claude account, Claude Code's own
login is used and `ade` stores nothing. See [Keys]({{ '/guide/keys/' | relative_url }}).
