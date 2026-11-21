---
layout: guide
title: Get started
permalink: /get-started/
description: Install the ade command, run ade setup, and open everything in one window with ade ui. Each step says what works today and what is Coming.
lead: Three commands. Install <code>ade</code>, run <code>ade setup</code>, open <code>ade ui</code>. Each step says what works today and what is Coming.
---

## What you need

- **macOS** for the hub: its keys live in the macOS Keychain and its services in launchd. The `ade` command itself
  runs on macOS and Linux. The hub on Linux: <span class="coming">Coming</span>
- `git`, Bash and `python3`. `gh` if the hub should be a private GitHub repo (or make a local one with `--no-github`).
  `tmux` for `ade ui`.
- Claude Code, signed in with your Claude account (Pro, Max, Team or Enterprise). `ade setup` offers to install it.

## 1. Install the ade command

```
curl -fsSL https://raw.githubusercontent.com/better-ade/ade-cli/main/install.sh | bash
```

It writes `~/.local/bin/ade` and tells you when that folder is not on your `PATH`. It installs the tagged release that
ade-cli's `main` names, never `main` itself, and a failed download keeps the `ade` you had.

> Today that release is **v0.1.0**: the hub commands (`ade work`, `ade status`, `ade dispatch`, `ade keys`, ...) and
> the project commands (`ade init`, `ade agent`, `ade skills add`). `ade setup`, `ade ui`, `ade hub new` and
> `ade claude` are merged on `main` but not in a release yet. Until the next release, install from a checkout:

```
git clone https://github.com/better-ade/ade-cli && cd ade-cli && ./install.sh
```

Re-run `./install.sh` after a `git pull` to upgrade. `ade version` says what you have; `ade help` lists every command.

## 2. Run ade setup

```
ade setup
```

One command from nothing to a working hub, and it asks before every step. It installs Claude Code if it is missing
(after a yes), makes a hub when you have none, has you pick one *everything agent* (the orchestrator) and any number of
*focus* providers, signs each in and live-tests it, offers Telegram, and ends in a guided session with the
orchestrator. [What each step does]({{ '/guide/setup/' | relative_url }}).

> **The live tests:** <span class="coming">Coming</span>. They run through the hub's live-test entry point, which is
> not merged in ade-brain yet, so today a full `ade setup` stops at the first live test. What works today is
> `ade setup --check` (it reads only), `ade setup --telegram`, and the same steps by hand:

```
ade hub new my-hub     # a private GitHub repo (--no-github: a local one)
ade keys               # what each provider still needs
ade claude             # the orchestrator: Claude Code at the hub root
```

`ade hub new` asks for a persona, the client or team the hub works for, and your name, then makes it your default hub.

## 3. Open ade ui

```
ade ui
```

One tmux window on `ade`'s own tmux server, so your own tmux setup is never touched. Tab 0 is the orchestrator;
<kbd>prefix</kbd> <kbd>f</kbd> shows the fleet sidebar, <kbd>prefix</kbd> <kbd>?</kbd> lists the keys and
<kbd>prefix</kbd> <kbd>d</kbd> detaches while the agents keep running. [More on ade ui]({{ '/guide/ui/' | relative_url }}).

> **A tab per focus agent:** <span class="coming">Coming</span>, with the unread counts and the ticket lists.
> They need hub pieces that are not merged yet. Today `ade work` opens a focus agent in its own Terminal window.

## Then

- **Set up a project.** In any git repo: `ade init` copies the method (the rules, the four core roles and the context
  store) at a pinned version and never overwrites a file you have. `ade agent add <name>` adds a specialist and
  `ade skills add <plugin>` a plugin.
- **Hand off a ticket.** [Tickets and dispatch]({{ '/guide/tickets/' | relative_url }}).
- **See how the pieces fit.** [How ADE works]({{ '/guide/' | relative_url }}).
