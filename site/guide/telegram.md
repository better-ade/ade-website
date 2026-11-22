---
title: Telegram
description: Reach your orchestrator from Telegram. One-time setup, approvals, talking to focus agents, how it stays locked to you, and keeping it running.
lead: Message your orchestrator from your phone. It is paired to you alone, and it never skips a permission check.
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

`ade setup --telegram` stores the bot token and prints the steps below. `ade setup --test telegram` sends one message
and waits for your reply, to check the channel end to end.

## From your phone

- **Replies fit Telegram:** short, formatted, and a status card (`bin/chat status --card`): the orchestrator, then one
  line per agent, busy, idle or blocked, with its folder, role and ticket.
- **Approvals:** when the orchestrator asks you to approve something, you reply 1 to approve or 2 to deny, with the
  ask's reference, and your answer is a line in the journal. Claude Code's permission prompts come with Allow and Deny
  buttons.
- **Talking to focus agents:** `/agents` lists the running ones; `/to <agent> <text>` passes your message to one.
- **The agents' news:** when a focus agent goes idle, ends or leaves a note, the orchestrator forwards it to you.

## One-time setup

1. In Telegram, message @BotFather: `/newbot`, pick a name and a username ending in `bot`. Copy the token it gives you.
2. `ade keys set telegram`, and paste the token at the hidden prompt. Never in a chat or a file.
3. Install `bun` (the plugin runs on it), then in any Claude Code session:
   `/plugin install telegram@claude-plugins-official`.
4. Run `ade chat start` in a terminal at the hub root the first time, so you can answer its prompts.
5. Message your bot. It replies with a pairing code; in the session: `/telegram:access pair <code>`.
6. Lock it to you: `/telegram:access policy allowlist`, with no groups.
7. Send a test message from Telegram and check the session answers.

## Locked to you

- **Allowlist, no groups.** Started without a terminal (by launchd or systemd), the orchestrator refuses to run unless the channel
  is locked to an allowlist with no groups.
- **Every permission prompt goes to you.** The orchestrator runs in manual permission mode by default, and a setting or
  argument that would skip permissions stops it from starting.
- **The token stays out of the session.** At each start it goes from the key store into a short-lived private file for
  the plugin, deleted once read and within 60 seconds. It is never in the session's environment, an argument or the
  log.
- **Remote Control** is on, named after the orchestrator, so the same session is open in the Claude app too.

## Keep it running

Set `HUB_CHAT=telegram` in `hub.conf` and run `bin/schedule install` in the hub: launchd on macOS, or a systemd user
unit on Linux, keeps the orchestrator running and restarts it. After a crash it says so in the chat, with how many
agents are running and waiting. `ade chat status` shows whether it is running, since when, and the channel's policy.
