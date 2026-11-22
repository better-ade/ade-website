---
title: Keys
description: How ADE stores provider keys and the Telegram token with ade keys, in the macOS Keychain or on Linux, and ade-secrets, the local key store and terminal vault.
lead: Keys go from a hidden prompt to the hub&rsquo;s key store. They never sit in an argument, a log or a file in your repo.
---

## Today: ade keys

`ade keys` runs the hub's `bin/keys`:

```
ade keys                  # each tool: stored or missing, and what it still needs
ade keys set deepseek     # store or replace a key, at a hidden prompt (or on standard input)
ade keys forget deepseek  # remove it
```

| Tool | Key |
|---|---|
| `anthropic` | optional: an Anthropic API key, used by the live test; without it, Claude Code's own login |
| `deepseek` | the DeepSeek API key |
| `glm`, `muse` | stored, not usable until their provider is connected <span class="coming">Coming</span> |
| `gemini` | the Gemini API key, for the Gemini CLI (or sign in with your Google account instead) |
| `telegram` | the bot token for the [Telegram]({{ '/guide/telegram/' | relative_url }}) channel |

`ade keys` never prints a value. A key on the command line is refused, because a command line is visible to other
programs.

## Where they live, and who can read them

- **The macOS Keychain** of the hub, written through `security` with the value on standard input, then read back to
  confirm. On Linux, `pass` or a private file store (folders 0700, values 0600), set by `HUB_SECRET_STORE` in
  `hub.conf`.
- **A stored key enables nothing.** A provider runs only when the hub allows it (`HUB_PROVIDERS_ALLOWED`), and a
  provider marked for your own work only is refused in a customer's hub.
- **Claude Code sessions never get the key.** Claude Code fetches a provider's key itself, through its key helper, so
  it is never in a session's environment. Delegated read-only agents run with a cleared environment.
- **The Gemini CLI is the exception:** it takes a key only from its environment, so with a Gemini API key the hub
  passes it there, and turns on the CLI's own redaction of that variable. Signing in with a Google account stores no
  key.
- **`ade setup`** hands a key straight to `bin/keys` on standard input. It never appears in an argument, an
  environment, a log or a file in your repo.

## ade-secrets

[ade-secrets](https://github.com/better-ade/ade-secrets) is a local-only key store and terminal vault, like a small
password manager that lives on your machine, on the macOS Keychain, `pass` or `age`. It refuses to run inside an agent
session; the only programmatic read is Claude Code's own key helper, for an entry you set with `--helper`.

```
ade-secrets set openai --helper   # hidden prompt (or --clipboard)
ade-secrets copy openai           # to the clipboard, cleared after 10 s if unchanged
ade-secrets vault                 # full screen: search, add, copy, rotate behind a live test, notes, reminders
```

The vault never lists a value; a reveal is opt-in, confirmed and lasts 10 seconds.

- The hub's `ade keys` on ade-secrets, and `ade key` and `ade vault` inside `ade`. <span class="coming">Coming</span>
