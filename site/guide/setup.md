---
title: ade setup
description: What ade setup does. Six steps from nothing to a working hub, what happens when a step fails, the providers, the live tests and the tools it installs.
lead: One command, six steps, from nothing to a working hub. Each step is said before it runs and checked after, and a failed step tells you what to do next.
---

> What a provider does not support yet is marked <span class="coming">Coming</span> below.

## The six steps

`ade` with no hub lists the steps with their state and asks `Set up now?`. `ade setup` is the guide: one step at a
time, each said before it runs and checked after. A step already done is skipped, so running `ade setup` again resumes
where you are.

1. **Claude Code.** If it is missing, the guide shows the installer's address and runs it only after your yes.
2. **Sign in to Claude.** Claude Code's own sign-in, in your browser. `ade` stores nothing.
3. **Sign in to GitHub.** The GitHub CLI is installed after a yes and signed in with GitHub's own browser flow
   (`gh auth login --web`): a one-time code, typed in your browser. `ade` never sees a token.
4. **Your hub.** A folder in `~/hubs`, saved as a private repo on your GitHub. The guide asks the persona, the client or
   team and your name, then you pick its agents: exactly one *everything agent* (the orchestrator) and any number of
   focus providers. Each is live-tested, and `HUB_PROVIDERS_ALLOWED` in `hub.conf` becomes the ones that passed.
5. **Your first project.** `ade claude` opens the orchestrator, which asks about your work and then, with your yes for
   each change, runs `ade init`, `ade agent add`, `ade skills add` and sets the role models.
6. **Telegram** (optional). A yes asks for your bot's token at a hidden prompt, then goes one step at a time. See
   [Telegram]({{ '/guide/telegram/' | relative_url }}).

The guide ends by telling you to type `ade` to open your workspace.

## When a step fails

- **One plain line** says what went wrong, never another tool's raw output. A `details:` line says where the rest is.
- **A numbered question** offers what fits, with a default: try again, show the steps to do it by hand, use another
  AI service, stop. Answer with the number, the name or the start of it.
- **Stopping is safe.** `stop`, Ctrl-C or the end of input leave with one line on how to come back, and `ade setup`
  resumes at that step.
- **A live test that fails** says why: a usage limit and when it resets, Claude Code not signed in, or the engine's
  own reason. You can sign in with a different Claude account, enter the key again, try again, pick another AI
  service, or go on without the test. An everything agent chosen without its test shows as "not tested" in
  `ade setup --check` and is in no focus role until `ade setup --test` passes.
- **A hub that stopped half-way** is picked up, not made twice.

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
| Kimi, ChatGPT | <span class="coming">Coming</span> | <span class="coming">Coming</span> |

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
login is used and `ade` stores nothing. See [How to store keys]({{ '/guide/keys/' | relative_url }}).
