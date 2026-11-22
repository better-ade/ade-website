---
title: ade setup
description: What ade setup does, step by step. The everything agent, focus providers, live tests and Telegram, and what works today versus what is Coming.
lead: One command from nothing to a working hub and a guided first session. It asks before every step.
---

> `ade setup` is merged in ade-cli's `main` and not in a release yet ([install from a checkout]({{ '/get-started/' | relative_url }})). Its
> provider live tests run through a hub entry point that is not merged in ade-brain yet, so today a full run stops at
> the first live test. <span class="coming">Coming</span>. The parts that work today are marked below.

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

Everything runs through Claude Code. Gemini will run through the Gemini CLI, as a focus provider only
<span class="coming">Coming</span>. GPT and Codex are not offered.

| Provider | Everything agent | Focus agents |
|---|---|---|
| Claude, with your Claude account | yes | yes |
| Claude, with an Anthropic API key kept in the hub | <span class="coming">Coming</span> | <span class="coming">Coming</span> |
| DeepSeek | <span class="coming">Coming</span> | yes, in your own hub (refused in a customer's hub) |
| Gemini | no | <span class="coming">Coming</span> |
| GLM, Muse | <span class="coming">Coming</span>, after a passing live check | <span class="coming">Coming</span>, after a passing live check |

## Live tests

Each provider gets one tiny read-only task in a throwaway folder, run the way a real focus agent runs. It is ready only
when it answers with a line that is exactly `READY`; anything else shows the last line it printed, with key-shaped
strings hidden, and the provider is left out of every role. No key or backend setting from your shell reaches the test.
The hub's side of the test: <span class="coming">Coming</span>.

## Modes

| Command | What it does | Today |
|---|---|---|
| `ade setup` | every step above | stops at the first live test |
| `ade setup --check` | one line per step (Claude Code, sign-in, hub, projects, channel); changes nothing | works |
| `ade setup --telegram` | only the Telegram step | works |
| `ade setup --top` | change the everything agent | <span class="coming">Coming</span> (needs the live test) |
| `ade setup --test [provider]` | re-run the live tests, for one provider or `telegram`; writes nothing | <span class="coming">Coming</span> |

## Your keys

A key is typed at a hidden prompt and handed straight to the hub's `bin/keys` on standard input. It never appears in a
command line, the environment of any program, a log or a file in your repo. With a Claude account, Claude Code's own
login is used and `ade` stores nothing. See [Keys]({{ '/guide/keys/' | relative_url }}).
