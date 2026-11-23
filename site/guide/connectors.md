---
title: Connectors and the guard
description: The ClickUp, Jira, Linear and Orgo connectors from ade-skills, each through the service's own server. Reads are free, every change asks, and the guard refuses commands that print a stored token.
lead: Agents read your tracker freely and ask before they change anything. The guard refuses the commands that would print a stored token.
---

## The connectors

Each connector is a plugin from [ade-skills](https://github.com/better-ade/ade-skills). It uses the service's own
server and your own sign-in to it, in your browser; there is no API key to store and no server of ours in between.

| Plugin | Service | What needs no question | What asks first |
|---|---|---|---|
| `clickup` | ClickUp | reads | every change |
| `jira` | Jira | reads | every change |
| `linear` | Linear | reads | every change |
| `orgo` | Orgo cloud computers | reading workspaces, a computer, its screen and its file list | creating or starting a computer, running a command, controlling a desktop |
{: data-truth="plugins"}

```
ade skills add clickup    # in a project: add the plugin
ade skills list           # what the project has
```

Where Claude Code's permission prompts are switched off, a change is refused, not waved through.

The `orgo` plugin also has an `install-ade` skill: it installs ADE on an Orgo computer with ade-cli's public
installer, and leaves `ade setup` and every sign-in to you.

## The guard

The <code data-truth="plugin">guard</code> plugin is one check that runs before an agent's command or a connector's
tool:

- **Reads of a connected service are free; every other tool asks.** Where a project does not name the service, its
  tools ask, reads included.
- **Commands that print a stored token are refused**, in every mode and every folder: `gh auth token`, a status or
  credential command asked to show the token, git's credential helpers asked for a stored value. They are refused
  also when they are wrapped in another shell, held in a variable or spelled with a wildcard.
- **Anything the guard cannot read asks.**

```
ade skills add guard
```

The guard is a speed bump for an agent's mistakes, not a wall around a hostile program. Keys stay safe first of all
because agents are never handed one: see [How to store keys]({{ '/guide/keys/' | relative_url }}).

## Coming

- More connectors (a GitHub connector, a Gmail connector, a Slack connector), and `ade connect` to connect a service
  to a project with your own sign-in. <span class="coming">Coming</span>
