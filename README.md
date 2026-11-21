# ade-website

The public website for ADE, served at https://ade.ardata.tech. ADE itself lives in the
[better-ade](https://github.com/better-ade) repos; the site's Repos page lists them.

## Layout

- `docs/messaging.md`: the source of truth for every word on the site (the story,
  positioning, tagline, pillars, audiences, comparisons, objections and tone). Change
  the copy there first, then the pages.
- `site/`: the Jekyll source: the home page, Get started, the guide (`guide/`), Repos,
  the ADE app page, and `redirects/` (old addresses, such as the app-era guide pages,
  pointing at their new home).
- `tests/`: vitest tests, run on the built site.
  - `sitePages`: every page has a title, a description and one `h1`; every internal
    link, image and `#anchor` resolves; old addresses redirect to real pages; the
    sitemap is complete; `/install.sh` and `/install.ps1` are built; no pricing, no AI
    attribution, no GitHub link outside the better-ade organisation.
  - `siteTruth`: holds the pages to `main` of the repos they describe. Every `ade`
    command and hub `bin/` script named exists; role, specialist and version numbers
    match; each repo's verification command matches its CI; and anything not merged
    yet carries a **Coming** label (the `NOT_MERGED` list).
  - `siteCsp`, `siteThemeContrast`, `fetchInstallers`: the content security policy on
    every page, the light/dark contrast rule, and the installer copy script.
- `scripts/fetch-installers.sh`: copies the ADE app's `install.sh` and `install.ps1`
  from ade-terminal (the latest release tag when it has both, else `main`) into `site/`,
  so `curl -fsSL https://ade.ardata.tech/install.sh | bash` keeps working. The
  installers are owned and tested in ade-terminal and are not committed here.
- `.github/workflows/pages.yml`: builds and deploys with GitHub Pages (source:
  GitHub Actions) on push to `main`, daily, and on demand.
- `.github/workflows/ci.yml`: the verification command below, on every PR, push to
  `main`, and daily (the repos the site describes can change without a commit here).

## Verification command

Needs Node 22, Ruby 3.3 with Bundler, and checkouts of ade-cli, ade-brain, ade-method,
ade-agent-registry and ade-skills at `main`: in `./repos/<name>` (what CI makes), in
`../<name>`, or at the paths in `ADE_CLI_DIR`, `ADE_BRAIN_DIR`, `ADE_METHOD_DIR`,
`ADE_REGISTRY_DIR` and `ADE_SKILLS_DIR`. The site is built before the tests, because
most tests read the built pages. Each line must exit 0:

```
npm ci
bundle install && scripts/fetch-installers.sh site && bundle exec jekyll build -s site -d _site --strict_front_matter
npm test
```

The build uses the `github-pages` gem, the same gem set as GitHub Pages' old branch
build. That gem needs Ruby below 4.0.

## Local preview

```
bundle exec jekyll serve -s site
```
