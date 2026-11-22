---
title: Telegram
description: Reach your orchestrator from Telegram. One-time setup, how it stays locked to you, keeping it running, and what is Coming.
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

`ade setup --telegram` stores the bot token and prints the steps below.

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

- **Allowlist, no groups.** Started without a terminal (by launchd), the orchestrator refuses to run unless the channel
  is locked to an allowlist with no groups.
- **Every permission prompt goes to you.** The orchestrator runs in manual permission mode by default, and a setting or
  argument that would skip permissions stops it from starting.
- **The token stays out of the session.** At each start it goes from the Keychain into a short-lived private file for
  the plugin, deleted once read and within 60 seconds. It is never in the session's environment, an argument or the
  log.
- **Remote Control** is on, named after the orchestrator, so the same session is open in the Claude app too.

## Keep it running

Set `HUB_CHAT=telegram` in `hub.conf` and run `bin/schedule install` in the hub: launchd keeps the orchestrator
running and restarts it. `ade chat status` shows whether it is running, since when, and the channel's policy.

## Coming

- Replies formatted for Telegram, with a status card. <span class="coming">Coming</span>
- Approvals as buttons in Telegram. <span class="coming">Coming</span>
- Talking to focus agents from Telegram (`/to <agent>`, `/agents`). <span class="coming">Coming</span>
- `ade setup --test telegram`, a live test of the channel. <span class="coming">Coming</span>
