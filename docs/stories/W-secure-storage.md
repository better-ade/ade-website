# W-secure-storage: the home page shows where keys live

risk: low (copy and a figure on the public site; no secret, sign-in, data or money)

## Story

As someone deciding whether to give ADE my keys, I want the home page to show where a key lives and who can see it,
so I can trust it without reading the paper.

A home section, "Secure storage", between How it works and What works today: the paper's Figure 4, and four lines
(where it lives: the macOS Keychain, pass, or the weaker owner-only file store on Linux; how it goes in: `bin/keys set`
at a hidden prompt; how it is used: Claude Code's key helper, names only in the hub's files; how it is shared:
`bin/keys share` and `bin/keys receive`), with a link to the paper. Only what ade-brain's main has is claimed.

## Acceptance criteria (tests/siteStorage.test.ts)

1. The section exists with its kicker and heading, between How it works and What works today.
2. The home sections still alternate plain and tinted.
3. It shows Figure 4 from the site's own files, with alt text, and links to /paper/.
4. It names the stores ade-brain's main has (Keychain, pass, file) and says the file store is the weaker one.
5. It names only commands ade-brain's bin/keys has: set at a hidden prompt, the key helper, share and receive.
