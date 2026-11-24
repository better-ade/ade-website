---
layout: page
kicker: Guide
title: Get started
permalink: /get-started/
description: Set up ADE the way a software engineer's day runs. You and your hub, your context and access, your projects and customers, then run it all from the terminal or Telegram. On macOS or Linux.
lead: Four steps, in the order of your day. You, your context and access, your projects, and where you run it from.
---

## What you need

- **macOS or Linux.** On macOS the hub keeps its keys in the Keychain and its services in launchd; on Linux (Ubuntu,
  or a server) in `pass` or a private file, and in systemd user units.
- `git`, Bash and `python3`. `gh` if the hub should be a private GitHub repo (or make a local one with `--no-github`).
  `tmux` for `ade ui`. `ade setup --tools` installs what is missing with Homebrew or apt, after one yes.
- Claude Code, signed in with your Claude account (Pro, Max, Team or Enterprise). `ade setup` offers to install it.

## 1. You: install ADE and make your hub

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

Then run the guide:

```
ade setup
```

One command from nothing to a working hub, in six steps: Claude Code, sign in to Claude, sign in to GitHub, your hub,
your first project, Telegram. Each step is said before it runs and checked after. When one fails, you get one plain
line and a choice of what to do next, and `ade setup` again resumes where you are.
[ade-cli's README]({{ site.cli_repo }}#readme) says what each step does.

Your hub is built around you. `ade hub new` asks for a persona (a staff software engineer, a tech lead, a fractional
CTO and others), the client or team the hub works for, and your name, then makes it your default hub. The agents take
the roles around you: the four core roles, and specialists when a task needs one. You approve high-risk work; the
verification command decides Done.

## 2. Your context, tools and access

`ade setup` signs you in to Claude and to GitHub. A key is typed only at a hidden prompt, never in a chat, a file or a
command line.

`ade setup --check` reads only and says what is missing. The same steps by hand:

```
ade hub new my-hub     # a private GitHub repo (--no-github: a local one)
ade keys               # what each provider still needs
ade claude             # the orchestrator: Claude Code at the hub root
```

In any git repo, `ade init` copies the method (the rules, the four core roles and the context store) at a pinned
version and never overwrites a file you have. `ade agent add <name>` adds a specialist and `ade skills add <plugin>` a
plugin.

To give a project access to a service, run `ade connect <service>` at your own terminal. You sign in yourself; the
project records the service's name only, and every change through it asks first. ClickUp, Jira and Linear connect
today. The connectors and the guard are in [ade-skills' README]({{ site.skills_repo }}#readme).

- The GitHub, Gmail, Slack, Outlook, Microsoft Teams and Discord connectors <span class="coming">Coming</span>

## 3. Projects and customers

```
ade project add ~/code/agency-site     # a repo you already have
ade project add --scan ~/code          # pick from the repos in a folder
ade project list
```

Each repo becomes a project folder in your hub. `ade work <folder>` opens that project's focus agent, which sees only
its folder and the repos it lists. `ade dispatch` hands ready tickets to focus builders, as many at once as you allow,
so several tasks run at once.

Working for several customers? Make one hub per customer with `ade hub new`, and switch with `ade hub use <path>`. Each
hub runs only the models that customer allows.

## 4. Run it from the terminal or Telegram

```
ade ui
```

One tmux window on `ade`'s own tmux server, so your own tmux setup is never touched. Tab 0 is the orchestrator;
<kbd>prefix</kbd> <kbd>f</kbd> shows the fleet sidebar, <kbd>prefix</kbd> <kbd>?</kbd> lists the keys and
<kbd>prefix</kbd> <kbd>d</kbd> detaches while the agents keep running.

While `ade ui` runs, `ade work` opens each focus agent in a tab of its own, with its unread count.
<kbd>prefix</kbd> <kbd>e</kbd> opens the file viewer.

Away from your desk, use Telegram: your own bot, set up by `ade setup`'s last step and locked to you
([ade-brain's README]({{ site.brain_repo }}#readme) has the details). Or run `ade web --tailnet` for a read-only page on
your phone.

## Then

- **Give each engagement its own machine.** One ADE Computer is one machine: a mini PC, a compute instance, or a
  container on your own Docker, for dedicated work or several contracts. The container is in early preview:
  [ask for one by email]({{ site.preview_url }}){: data-preview-mail=""}, or [open a GitHub issue]({{ site.preview_url }}), which is
  public: put nothing private in it.
- **Hand off a ticket.** A ticket's path, and `ade dispatch`, are in [ade-cli's README]({{ site.cli_repo }}#readme).
- **See how the pieces fit.** [How it works]({{ '/#how-it-works' | relative_url }}), on the home page.
