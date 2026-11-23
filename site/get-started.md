---
layout: page
kicker: Guide
title: Get started
permalink: /get-started/
description: Install the ade command, run ade setup, and open everything in one window with ade ui. On macOS or Linux, from the release the installer names.
lead: Three commands. Install <code>ade</code>, run <code>ade setup</code>, open <code>ade ui</code>.
---

## What you need

- **macOS or Linux.** On macOS the hub keeps its keys in the Keychain and its services in launchd; on Linux (Ubuntu,
  or a server) in `pass` or a private file, and in systemd user units.
- `git`, Bash and `python3`. `gh` if the hub should be a private GitHub repo (or make a local one with `--no-github`).
  `tmux` for `ade ui`. `ade setup --tools` installs what is missing with Homebrew or apt, after one yes.
- Claude Code, signed in with your Claude account (Pro, Max, Team or Enterprise). `ade setup` offers to install it.

## 1. Install the ade command

```
curl -fsSL https://raw.githubusercontent.com/better-ade/ade-cli/main/install.sh | bash
```

It writes `~/.local/bin/ade` and tells you when that folder is not on your `PATH`. It installs the tagged release that
ade-cli's `main` names, never `main` itself, and a failed download keeps the `ade` you had.

> Today that release is **v{{ site.data.releases.ade_cli }}**. It holds every `ade` command on this site not marked Coming; its
> [changelog]({{ site.cli_repo }}/blob/main/CHANGELOG.md) lists what each release added.

`ade update` upgrades `ade`, the hub, its plugins and Claude Code, and `ade update --rollback` brings back the `ade` you
had. Patch and minor releases of `ade` install themselves; `ADE_NO_AUTO_UPDATE=1` only announces them. `ade version`
says what you have; `ade help` lists every command.

## 2. Run ade setup

```
ade setup
```

One command from nothing to a working hub, in six steps: Claude Code, sign in to Claude, sign in to GitHub, your hub,
your first project, Telegram. Each step is said before it runs and checked after. When one fails, you get one plain
line and a choice of what to do next, and `ade setup` again resumes where you are.
[ade-cli's README]({{ site.cli_repo }}#readme) says what each step does.

A key is typed only at a hidden prompt, never in a chat, a file or a command line.

`ade setup --check` reads only and says what is missing. The same steps by hand:

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
<kbd>prefix</kbd> <kbd>d</kbd> detaches while the agents keep running.

While `ade ui` runs, `ade work` opens each focus agent in a tab of its own, with its unread count.
<kbd>prefix</kbd> <kbd>e</kbd> opens the file viewer.

## Then

- **Want it all in a desktop of its own?** ADE Computer is in early preview:
  [ask for one by email]({{ site.preview_url }}){: data-preview-mail=""}, or [open a GitHub issue]({{ site.preview_url }}), which is
  public: put nothing private in it.
- **Set up a project.** In any git repo: `ade init` copies the method (the rules, the four core roles and the context
  store) at a pinned version and never overwrites a file you have. `ade agent add <name>` adds a specialist and
  `ade skills add <plugin>` a plugin.
- **Watch from your phone.** Telegram, set up by `ade setup`'s last step ([ade-brain's README]({{ site.brain_repo }}#readme) has the
  details), or `ade web --tailnet` for a read-only page.
- **Connect your tracker.** The connectors and the guard are in [ade-skills' README]({{ site.skills_repo }}#readme).
- **Hand off a ticket.** A ticket's path, and `ade dispatch`, are in [ade-cli's README]({{ site.cli_repo }}#readme).
- **See how the pieces fit.** [How it works]({{ '/#how-it-works' | relative_url }}), on the home page.
