# W-download-count: the download count on the website

Status: **Approved** (owner, 2026-11-28: "please go", the wording and what is counted as written). Risk: **low** (public
numbers from GitHub, fetched at build time; no secret, sign-in, data or money; the CSP is unchanged).
Verification: the repo's verification command (README.md).
Owner's words (2026-11-28): "on the website - add the download count".

## What is counted (the default; the owner may change it)
The release asset downloads of **ade-terminal** (the desktop app) and **ade-cli** (`ade`), from GitHub's releases
API. On 2026-11-28 that is 1,792 + 606 = 2,398. Installs from a package manager or a `git clone` are not counted,
and the page never claims they are.

## Acceptance criteria (each named by its test, tests/siteDownloads.test.ts)
1. **downloads_fetch**:
   - `scripts/fetch-downloads.sh site` runs in pages.yml beside "Fetch the installers", with the workflow's own token.
   - It sums `assets[].download_count` over every page of each repo's releases and writes
     `site/_data/downloads.json`: the total, each repo's count and the date.
   - The daily scheduled build keeps it fresh.
2. **downloads_shown**:
   - The home page's hero, under the download and get-started buttons, shows one line: "**2,300+ downloads** of ADE
     and ade-terminal".
   - The number is rounded down to the hundred, so it never overstates. It is plain text, not a badge image.
   - Get started shows the same line.
3. **downloads_fallback**: if the fetch fails, the line is left out. The build does not fail, the scheduled build keeps
   working, and the page never shows 0 or a stale number marked as current. The test runs the script against a fake
   API with an error, an empty list and two pages.
4. **downloads_no_new_source**: nothing is loaded from GitHub or shields.io in the browser. The CSP in
   `site/_includes/head.html` is unchanged, and the test checks it.
5. **downloads_truth**: `docs/messaging.md` gets the line and says what is counted. siteTruth checks that the page's
   wording matches.

## Out of scope
A live counter, per-platform or per-version numbers, stars, and counts from other repos (ade-brain, ade-skills).
