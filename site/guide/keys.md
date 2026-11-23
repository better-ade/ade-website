---
title: How to store keys
description: How to store keys with ADE. A key is typed only at a hidden prompt in your own terminal, lives in your system's key store, and is never shown to an agent. What to do if one was exposed.
lead: A key is typed once, at a hidden prompt in your own terminal. It never goes into a chat, a file or a command line, and no agent ever sees its value.
---

## The one rule

Type a key only where the screen does not show it: at a hidden prompt, in a terminal you opened yourself. There are two
such places.

```
ade setup                 # the guide asks for a key when a step needs one
bin/keys set <name>       # in the hub; ade keys set <name> does the same
```

Never paste a key into a chat with an agent, a Telegram message, a ticket, a file in a repo, or after a command on the
command line. A command line can be read by other programs and is kept in your shell's history; `bin/keys` refuses a
key given that way.

```
ade keys                  # each name: stored or missing, and what it still needs
ade keys set deepseek     # store or replace a key, at a hidden prompt
ade keys forget deepseek  # remove it
```

`ade keys` never prints a value.

## Where each one lives

| What | Where it lives | How it gets there |
|---|---|---|
| Your Claude sign-in | Claude Code's own store | Claude Code's own sign-in, in your browser. `ade` stores nothing and reads no token. |
| Your GitHub sign-in | the GitHub CLI's store, in your system's keychain | `gh auth login --web`, which `ade setup` runs for you: a one-time code and your browser. Never `--insecure-storage`, which writes the token to a plain file. |
| `anthropic` | the macOS Keychain | optional: an Anthropic API key, used by the live test; without it, your Claude sign-in |
| `deepseek` | the macOS Keychain | the DeepSeek API key, at the hidden prompt |
| `gemini` | the macOS Keychain | the Gemini API key, at the hidden prompt (or sign in with your Google account, which stores no key) |
| `telegram` | the macOS Keychain | your bot's token, at the hidden prompt; see [Telegram]({{ '/guide/telegram/' | relative_url }}) |
| `glm`, `muse` | the macOS Keychain | stored, not usable until their provider is connected <span class="coming">Coming</span> |

On Linux the hub uses `pass` or a private file store instead of the Keychain (folders 0700, values 0600), set by
`HUB_SECRET_STORE` in `hub.conf`.

**`ACCESS.md` and `hub.conf` hold names and locations only**: which repo, which checkout, which provider is allowed,
which store is used. Never a value. The hub's sync refuses to run without a gitleaks scan, so a key that slipped into
a file is caught before it is pushed.

## Agents never see a value

- **Claude Code fetches a provider's key itself**, through its key helper, when it starts. The key is never in a
  session's environment, an argument or a log. That one key is what Claude Code runs on, so Claude Code and what it
  runs can ask the helper for it; no other key in the store can be read that way.
- **A stored key enables nothing.** A provider runs only when the hub allows it (`HUB_PROVIDERS_ALLOWED`), and a
  provider marked for your own work only is refused in a customer's hub.
- **The Telegram token** goes from the key store into a short-lived private file for the plugin at each start,
  deleted once read. It is never in the session's environment.
- **The Gemini CLI is the exception:** it takes a key only from its environment, so with a Gemini API key the hub
  passes it there and turns on the CLI's own redaction of that variable.
- **Token-printing commands are refused.** With the `guard` plugin (`ade skills add guard`), a command that prints a
  stored token, such as `gh auth token`, is refused in every mode, also when it is hidden inside another command. See
  [Connectors and the guard]({{ '/guide/connectors/' | relative_url }}).
- **What you see is cleaned too.** `ade web`, `ade chat logs` and `ade shot agent` hide key-shaped strings before they
  show anything.

## If a key was exposed

A key that appeared in a chat, a log, a screenshot, a commit or a command line counts as exposed, even if you deleted
it afterwards.

1. **Revoke it at the provider first.** In the provider's own console, delete or rotate the key (for a Telegram bot:
   ask @BotFather for a new token; for GitHub: revoke the token or the app's access in your GitHub settings). Until
   you do, the old key still works for whoever saw it.
2. **Then sign in again.** Store the new key at the hidden prompt with `ade keys set <name>`, or sign in again with
   `gh auth login --web` for GitHub, or Claude Code's own sign-in for Claude.
3. **Check it works:** `ade setup --test` re-runs the live tests, and `ade setup --check` says what is still missing.
4. **Clean up where it was.** Deleting the message or the file does not undo the exposure, and a key in a pushed
   commit stays in the history. That is why step 1 comes first.

## ade-secrets

[ade-secrets](https://github.com/better-ade/ade-secrets) is a local-only key store and terminal vault, like a small
password manager that lives on your machine, on the macOS Keychain, `pass` or `age`. It refuses to run inside an agent
session; the only programmatic read is Claude Code's own key helper, for an entry you set with `--helper`.

```
ade-secrets set openai --helper   # hidden prompt
ade-secrets copy openai           # to the clipboard, cleared after 10 s if unchanged
ade-secrets vault                 # full screen: search, add, copy, rotate behind a live test, notes, reminders
```

The vault never lists a value; a reveal is opt-in, confirmed and lasts 10 seconds.

## Coming

- `ade key` and `ade vault` inside `ade`, with keys kept per hub, and the hub's `ade keys` on ade-secrets. <span class="coming">Coming</span>
