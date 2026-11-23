---
title: Telegram
description: Reach your orchestrator from Telegram. One-time setup with ade setup, how the bot is locked to you, what auto mode does, approvals, and keeping it running.
lead: Message your orchestrator from your phone. The bot is locked to you alone, and once it is, your main agent acts on your messages without asking at the terminal.
---

## What works today

The hub's orchestrator runs with a Telegram channel attached, so you can ask it for status or new work from Telegram.
One orchestrator per hub:

```
ade orchestrator new my-hub --hub ~/hubs/my-hub --channel telegram
ade orchestrator start my-hub
ade orchestrator list            # each one: running or stopped, and its channels
ade orchestrator logs my-hub -n 50
ade orchestrator stop my-hub
```

`ade setup --telegram` is the guide's Telegram step on its own. `ade setup --test telegram` sends one message and
waits for your reply, to check the channel end to end.

## From your phone

- **Replies fit Telegram:** short, formatted, and a status card (`bin/chat status --card`): the orchestrator, then one
  line per agent, busy, idle or blocked, with its folder, role and ticket.
- **Approvals:** when the orchestrator asks you to approve something, you reply 1 to approve or 2 to deny, with the
  ask's reference, and your answer is a line in the journal. Claude Code's permission prompts come with Allow and Deny
  buttons.
- **Talking to focus agents:** `/agents` lists the running ones; `/to <agent> <text>` passes your message to one.
- **The agents' news:** when a focus agent goes idle, ends or leaves a note, the orchestrator forwards it to you.
- **Pictures:** `ade shot --tg` sends a screenshot to you through the hub's `bin/chat send`, only while the bot is
  locked to you. See [Tickets and dispatch]({{ '/guide/tickets/' | relative_url }}#proof-ade-shot).

## One-time setup

```
ade setup --telegram
```

1. In Telegram, message @BotFather: `/newbot`, pick a name and a username ending in `bot`. It gives you a token.
2. Run `ade setup --telegram` and paste the token at the hidden prompt. It is asked once. Never put it in a chat or
   a file.
3. `ade` then does each step it can, said before and checked after: `bun` (after a yes), the Telegram plugin, a test
   message, `HUB_CHAT=telegram` in `hub.conf` and `bin/schedule install`.
4. Three steps only you can do are shown one at a time, with the exact text to type, and checked: start the session
   in a second terminal window, pair with `/telegram:access pair <code>`, and lock the bot to you with
   `/telegram:access policy allowlist`.

It ends in one of two lines: "Telegram is working", or "Telegram is not finished" with the one thing left.
`ade setup --telegram` resumes there. `ade` and `ade setup --check` show `telegram: on (auto)`,
`telegram: on (manual: not locked)`, `not finished` or `off`.

## Locked to you

- **Locked means:** the bot's policy is an allowlist, your account is the only one in it, and there are no groups.
  The Telegram step is not "working" until that is so.
- **Started without a terminal** (by launchd or systemd), the orchestrator refuses to run unless the bot is locked.
- **A setting or argument that would skip permission checks** stops it from starting.
- **The token stays out of the session.** At each start it goes from the key store into a short-lived private file for
  the plugin, deleted once read and within 60 seconds. It is never in the session's environment, an argument or the
  log.
- **Remote Control** is on, named after the orchestrator, so the same session is open in the Claude app too.

## Auto mode

Until the bot is locked to you, the chat runs in **manual** mode: every permission prompt goes to you.

Once it is locked, the chat runs in **auto** mode, and you are told so once, in the chat:

- Your main agent acts on your Telegram messages without asking at the terminal. That is the point: you are not at
  the terminal.
- Claude Code's auto mode still refuses risky actions.
- `HUB_CHAT_MODE=manual` in `hub.conf` turns it off, and always wins.
- A session that started before the lock is restarted so the new mode applies, only when your main agent is idle. A
  busy one is never interrupted.
- If the lock stops holding while an auto session runs, you are told, and it is journaled.

## Coming

- Pairing without typing commands in the session. <span class="coming">Coming</span>
- Approval buttons for focus agents. <span class="coming">Coming</span>
- The commands `/status`, `/progress`, `/start` and `/stop`, with progress messages while work runs. <span class="coming">Coming</span>

## Keep it running

Set `HUB_CHAT=telegram` in `hub.conf` and run `bin/schedule install` in the hub: launchd on macOS, or a systemd user
unit on Linux, keeps the orchestrator running and restarts it. After a crash it says so in the chat, with how many
agents are running and waiting. `ade chat status` shows whether it is running, since when, and the channel's policy.
