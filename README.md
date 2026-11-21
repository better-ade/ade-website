# ade-website

The public website for ADE, served at https://ade.ardata.tech. ADE itself lives in
[better-ade/ade-terminal](https://github.com/better-ade/ade-terminal).

## Layout

- `site/`: the Jekyll source (landing page, user guide, training, agent hub, assets).
- `tests/`: vitest tests. Several hold the site to ADE's code (agent counts, role
  colours, the MCP catalog, palette commands), so they read an ade-terminal checkout.
- `scripts/fetch-installers.sh`: copies `install.sh` and `install.ps1` from
  ade-terminal (the latest release tag when it has both, else `main`) into `site/`,
  so `curl -fsSL https://ade.ardata.tech/install.sh | bash` keeps working. The
  installers are owned and tested in ade-terminal and are not committed here.
- `.github/workflows/pages.yml`: builds and deploys with GitHub Pages (source:
  GitHub Actions) on push to `main`, daily, and on demand.
- `.github/workflows/ci.yml`: the verification command below, on every PR, push to
  `main`, and daily (ade-terminal can change what the site describes).

## Verification command

Needs Node 22, Ruby 3.3 with Bundler, and an ade-terminal checkout at `./ade-terminal`,
`../ade-terminal`, or the path in `ADE_TERMINAL_DIR`. Each line must exit 0:

```
npm ci && npm test
bundle install && scripts/fetch-installers.sh site && bundle exec jekyll build -s site -d _site --strict_front_matter
```

The build uses the `github-pages` gem, the same gem set as GitHub Pages' old branch
build, so pages render as they did when the site lived in ade-terminal's `docs/`. That
gem needs Ruby below 4.0.

## Local preview

```
bundle exec jekyll serve -s site
```
