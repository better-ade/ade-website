---
title: ade ui
description: ade ui puts the orchestrator and the fleet in one tmux window, in any terminal. Its keys, its tabs, ade dash and the file viewer.
lead: One window for the whole team, in whatever terminal you already use.
---

## What you get

```
ade ui             # create the window once, then attach to it
ade ui --detach    # create it without attaching (scripts)
```

`ade ui` runs on `ade`'s own tmux server (`tmux -L ade`), so its keys, status bar and theme never change your own tmux.
The session is named `ade-<hub>`. Tab 0 is the orchestrator (`ade claude`). The tab bar shows each tab's state:
`●` the orchestrator, `⟳` busy, `○` idle, `⚠` blocked, with the folder, role, ticket and unread count. While `ade ui`
runs, `ade work` opens each focus agent in a tab of its own.

It needs `tmux` and `python3`.

## Keys

| Keys | What they do |
|---|---|
| <kbd>prefix</kbd> <kbd>n</kbd> | new agent: pick a folder, then a role; it opens in a new tab |
| <kbd>prefix</kbd> <kbd>a</kbd> | approve a ticket waiting for you, typing its ref back in the popup |
| <kbd>prefix</kbd> <kbd>t</kbd> | tickets ready, waiting and running |
| <kbd>prefix</kbd> <kbd>p</kbd> | preview the current agent's plan (`PLAN.md`, else `STATE.md`) |
| <kbd>prefix</kbd> <kbd>f</kbd> | show or hide the fleet sidebar (`ade dash`) |
| <kbd>prefix</kbd> <kbd>e</kbd> | the file viewer (`ade files`) |
| <kbd>prefix</kbd> <kbd>l</kbd> | the file paths and links in this tab: a path opens in `ade view` at its line, a link in the browser |
| <kbd>prefix</kbd> <kbd>?</kbd> | the key list |
| <kbd>prefix</kbd> <kbd>0</kbd>–<kbd>9</kbd>, <kbd>prefix</kbd> <kbd>←</kbd> <kbd>→</kbd> | switch tabs |
| <kbd>prefix</kbd> <kbd>d</kbd> | detach; the agents keep running |

## The fleet panel

`ade dash` is the fleet panel on its own: the agents, the tickets and the last events, redrawn every 2 seconds.
`ade dash --once` prints it once. Token counts show `-` until the hub reports them.

## Theme

`~/.config/ade/theme` sets the colours: `bg fg accent orchestrator busy idle blocked unread`, each a `#rrggbb` value
or a tmux colour word. Anything else falls back to the default.

## The file viewer

```
ade files [<folder>]          # explore the hub and its projects, with name search and preview
ade view <path[:line[:col]]>  # code at the line, Markdown, images and PDF pages
```

Read-only. Code shows with `bat` (or `less -N`), Markdown with `glow`, images and PDF pages inline on a graphics
terminal. <kbd>o</kbd> opens a document, <kbd>f</kbd> reveals it, <kbd>y</kbd> copies the path. A path outside the hub
and its projects asks first, and is listed, never previewed. `ade setup --tools extras` installs the viewer's tools.
