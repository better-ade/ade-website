# W-paste-guard: the home page says a pasted key is stopped

risk: low (copy on the public site; no secret, sign-in, data or money)
Status: **Approved** (owner, 2026-11-28: "Approve as written"). Owner's words (2026-11-28): "add this feature to the
website - hook to prevent accidentally pasting keys".

## Story

As someone deciding whether to give ADE my keys, I want to know what happens if I paste one into a chat with Claude by
mistake, so I trust that a slip does not send it.

The feature is ade-brain's paste guard (story K2, `bin/paste-guard` on main): a Claude Code `UserPromptSubmit` hook in
the hub and in every folder. A prompt that holds a key is stopped before it is sent; the message names only the kind of
key and the command that stores it. Only what ade-brain's main has is claimed.

## The text (home, "Secure storage" list, a fifth line after "How it is shared")

> **If you paste one by mistake:** the paste guard stops a message to Claude that holds a key, before it is sent, and
> names the command that stores it instead. It knows the common key shapes (Anthropic, OpenAI, GitHub, GitLab, Slack,
> AWS, Google, Telegram, private keys).

## Acceptance criteria (tests/siteStorage.test.ts)

1. **paste_line**: the Secure storage list has the paste-guard line, after "How it is shared".
2. **paste_true**: every key kind it names is in `KEYS` in ade-brain's `bin/paste-guard` (the site's truth check reads
   the pinned ade-brain clone), and the line does not claim the key never reaches local files (Claude Code's limit).
3. The site gate stays green (`npm test`, `jekyll build --strict_front_matter`).

## Out of scope

The paper (a later paper refresh, W-paper-refresh), a new figure.
