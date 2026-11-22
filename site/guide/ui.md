---
title: ade ui
description: ade ui puts the orchestrator and the fleet in one tmux window, in any terminal. Its keys, its tab bar, ade dash, and what is Coming.
lead: One window for the whole team, in whatever terminal you already use.
---

> `ade ui` is merged in ade-cli's `main` and not in a release yet ([install from a checkout]({{ '/get-started/' | relative_url }})).

## What you get

```
ade ui             # create the window once, then attach to it
ade ui --detach    # create it without attaching (scripts)
```

`ade ui` runs on `ade`'s own tmux server (`tmux -L ade`), so its keys, status bar and theme never change your own tmux.
The session is named `ade-<hub>`. Tab 0 is the orchestrator (`ade claude`). The tab bar shows each tab's state:
`●` the orchestrator, `⟳` busy, `○` idle, `⚠` blocked, with the folder, role and ticket.

It needs `tmux` and `python3`.

## Keys

| Keys | What they do |
|---|---|
| <kbd>prefix</kbd> <kbd>n</kbd> | new agent: pick a folder, then a role (it opens in its own Terminal window until the tab is in) |
| <kbd>prefix</kbd> <kbd>a</kbd> | approve a ticket waiting for you, typing its ref back in the popup <span class="coming">Coming</span> |
| <kbd>prefix</kbd> <kbd>t</kbd> | tickets ready and waiting <span class="coming">Coming</span> |
| <kbd>prefix</kbd> <kbd>p</kbd> | preview the current agent's plan (`PLAN.md`, else `STATE.md`) |
| <kbd>prefix</kbd> <kbd>f</kbd> | show or hide the fleet sidebar (`ade dash`) |
| <kbd>prefix</kbd> <kbd>?</kbd> | the key list |
| <kbd>prefix</kbd> <kbd>0</kbd>–<kbd>9</kbd>, <kbd>prefix</kbd> <kbd>←</kbd> <kbd>→</kbd> | switch tabs |
| <kbd>prefix</kbd> <kbd>d</kbd> | detach; the agents keep running |

## The fleet panel

`ade dash` is the fleet panel on its own: the agents and the last events, redrawn every 2 seconds. Its tickets
list: <span class="coming">Coming</span>
`ade dash --once` prints it once. Token counts show `-` until the hub reports them.

## Theme

`~/.config/ade/theme` sets the colours: `bg fg accent orchestrator busy idle blocked unread`, each a `#rrggbb` value
or a tmux colour word. Anything else falls back to the default.

## Coming

These need hub pieces that are not merged in ade-brain yet. Until then `ade work` opens a focus agent in its own
Terminal window, and you approve a waiting ticket with `ade dispatch --approve` ([Tickets and dispatch]({{ '/guide/tickets/' | relative_url }})).

- A tab per focus agent, opened by `ade work` while `ade ui` runs. <span class="coming">Coming</span>
- Unread counts on each tab. <span class="coming">Coming</span>
- The ticket lists behind <kbd>prefix</kbd> <kbd>t</kbd> and <kbd>prefix</kbd> <kbd>a</kbd>. <span class="coming">Coming</span>
- A file viewer, with every file link viewable in the window. <span class="coming">Coming</span>
