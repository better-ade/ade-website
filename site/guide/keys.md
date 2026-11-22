---
title: Keys
description: How ADE stores provider keys and the Telegram token today with ade keys and the macOS Keychain, and the ade-secrets vault that is Coming.
lead: Keys go from a hidden prompt to the macOS Keychain. They never sit where an agent or another program can read them.
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
| `anthropic` | none: Claude Code's own login is used |
| `deepseek` | the DeepSeek API key |
| `glm`, `muse` | stored, not usable until their provider is connected <span class="coming">Coming</span> |
| `gemini` | stored, not usable until the Gemini engine is in <span class="coming">Coming</span> |
| `telegram` | the bot token for the [Telegram]({{ '/guide/telegram/' | relative_url }}) channel |

`ade keys` never prints a value. A key on the command line is refused, because a command line is visible to other
programs.

## Where they live, and who can read them

- **The macOS Keychain** of the hub, written through `security` with the value on standard input, then read back to
  confirm.
- **A stored key enables nothing.** A provider runs only when the hub allows it (`HUB_PROVIDERS_ALLOWED`), and a
  provider marked for your own work only is refused in a customer's hub.
- **Agents never get the key.** Claude Code fetches a provider's key itself, through its key helper, so it is never in
  a session's environment. Delegated read-only agents run with a cleared environment.
- **`ade setup`** hands a key straight to `bin/keys` on standard input. It never appears in an argument, an
  environment, a log or a file in your repo.

## Coming: ade-secrets

[ade-secrets](https://github.com/better-ade/ade-secrets) is a local-only key store and terminal vault, like a small
password manager that lives on your machine. It never runs inside an agent session; the only programmatic read is
Claude Code's own key helper. <span class="coming">Coming</span>

- `ade key`: the local key store, with the clipboard as the only way in and out. <span class="coming">Coming</span>
- `ade vault`: a password manager in the terminal. <span class="coming">Coming</span>
