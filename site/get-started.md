---
layout: page
kicker: Guide
title: Get started
permalink: /get-started/
description: Set up ADE in the order of a software engineer's day. You, your context and access, your projects and customers, then the terminal or Telegram. On macOS or Linux.
lead: Four steps, in the order of your day.
---

## What you need

- **macOS** (Keychain, launchd) or **Linux** (`pass` or a private file, systemd user units).
- `git`, Bash, `python3`; `gh` for a GitHub hub; `tmux` for `ade ui`. `ade setup --tools` installs what is missing.
- Claude Code, on Claude Pro, Max, Team or Enterprise. `ade setup` offers to install it.

## 1. You: install ADE and make your hub

```
curl -fsSL https://raw.githubusercontent.com/better-ade/ade-cli/main/install.sh | bash
ade setup
```

- The installer puts the tagged release (never `main`) in `~/.local/bin/ade` and warns if it is not on your `PATH`.
  A failed download keeps your old `ade`.
- Today: **v{{ site.data.releases.ade_cli }}**, every command on this site not marked Coming
  ([changelog]({{ site.cli_repo }}/blob/main/CHANGELOG.md)).
- `ade setup`: Claude Code, Claude, GitHub, your hub, your first project, Telegram. Each step is checked; a rerun
  resumes ([README]({{ site.cli_repo }}#readme)).
- `ade hub new` asks for your persona (tech lead, fractional CTO and others), client and name. You approve
  high-risk work; the verification command decides Done.
- `ade update` upgrades everything; `--rollback` undoes it. Patch and minor releases self-install unless
  `ADE_NO_AUTO_UPDATE=1`. `ade help` lists every command.

## 2. Your context, tools and access

```
ade hub new my-hub     # a private GitHub repo (--no-github: a local one)
ade keys               # what each provider still needs
ade claude             # the orchestrator: Claude Code at the hub root
```

- `ade setup` by hand; `ade setup --check` says what is missing.
- Keys go in only at a hidden prompt, never in a chat, a file or a command line.
- `ade init` adds the method to any repo, at a pinned version, overwriting nothing. `ade agent add <name>` adds a
  specialist, `ade skills add <plugin>` a plugin.
- `ade connect <service>`: you sign in, the project keeps the name only, every change asks. ClickUp, Jira and
  Linear today ([ade-skills' README]({{ site.skills_repo }}#readme)).
- The GitHub, Gmail, Slack, Outlook, Microsoft Teams and Discord connectors <span class="coming">Coming</span>

## 3. Projects and customers

```
ade project add ~/code/agency-site     # a repo you already have
ade project add --scan ~/code          # pick from the repos in a folder
ade project list
```

- `ade work <folder>` opens a project's focus agent; it sees only its folder and repos.
- `ade dispatch` hands ready tickets to focus builders, as many at once as you allow.
- One hub per customer with `ade hub new`; switch with `ade hub use <path>`. Each runs only the models it allows.

## 4. Run it from the terminal or Telegram

```
ade ui
```

- One tmux window, on `ade`'s own server. Your own tmux is untouched. Tab 0 is the orchestrator; each `ade work` adds a tab with its unread count.
- <kbd>prefix</kbd> <kbd>f</kbd> fleet sidebar, <kbd>prefix</kbd> <kbd>e</kbd> file viewer, <kbd>prefix</kbd>
  <kbd>?</kbd> keys, <kbd>prefix</kbd> <kbd>d</kbd> detach (the agents keep running).
- Away: your Telegram bot, locked to you ([ade-brain's README]({{ site.brain_repo }}#readme)), or
  `ade web --tailnet`, read-only on your phone.

## Then

- **One ADE Computer per engagement.** A mini PC, a compute instance or a container on your own Docker, for
  dedicated work or several contracts. The container is in early preview:
  [ask by email]({{ site.preview_url }}){: data-preview-mail=""} or [open a GitHub issue]({{ site.preview_url }}),
  which is public: put nothing private in it.
- **Hand off a ticket:** [ade-cli's README]({{ site.cli_repo }}#readme), and [How it works]({{ '/#how-it-works' | relative_url }}).
