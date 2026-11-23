# ade-website

The public website for ADE, served at https://ade.ardata.tech. ADE itself lives in the
[better-ade](https://github.com/better-ade) repos.

## Layout

- `docs/messaging.md`: the source of truth for every word on the site (the story,
  positioning, tagline, pillars, audiences, comparisons, objections and tone). Change
  the copy there first, then the pages.
- `site/`: the Jekyll source. Three pages: the home page, Get started and the technical
  paper (`paper.md`, made by `scripts/paper-page.py`). `redirects/` holds every old
  address (the guide, the Repos page, the ADE app page and everything older), each
  pointing at the home page or Get started. `_data/repos.yml` lists the public
  better-ade repos, the only ones a page may link to.
- `site/assets/js/preview.js`: builds the "Ask for an early preview" email link on
  click, so the address is in no page. Without JavaScript the button opens the issue
  form `.github/ISSUE_TEMPLATE/ade-computer-preview.yml`.
- `tests/`: vitest tests, run on the built site.
  - `sitePages`: the site is its three pages; every page has a title, a description
    and one `h1`; every internal link, image and `#anchor` resolves; every removed and
    older address redirects to the home page (or Get started) and nothing links to
    one; the header's menu; the sitemap is complete; `/install.sh` and `/install.ps1`
    are built; no pricing, no AI attribution, no GitHub link outside the better-ade
    organisation and none to a repo that is not in `_data/repos.yml` (a private repo is
    never linked); no command that installs an ADE Computer. The home page leads with
    ADE Computer; the issue form is held to its four questions and its "issues are
    public" note; the home page says where a key is typed; no page shows anything
    shaped like a key.
  - `sitePreview`: the early preview button. Its fallback address, the small "or open
    a GitHub issue" link under it, the script loaded the way `site.js` is, the mailto
    it builds on click (address, subject and body), and that the address is in no built
    page and not in one piece in the script.
  - `siteTruth`: holds the pages to `main` of the repos they describe. Every `ade`
    command and hub `bin/` script named exists, and each `ade` command is in `ade help`;
    every `ade ui` key and `ade-secrets` command named exists; the connectors named are
    ade-skills plugins that ask before a change; role, specialist and version numbers
    (`site/_data/releases.yml`) match; each repo's verification command, as the home
    page gives it, matches its CI; and anything not merged yet carries a **Coming**
    label (the `NOT_MERGED` list), and the home page's Coming list names every item
    on it.
  - `siteHero`: the home page hero. Two columns from 1024px up (the words, then the
    drawing in the wider column), the headline still the largest text. The drawing
    (`site/_includes/hero-computer.html`, one inline SVG moved by CSS keyframes) is a
    phone beside an ADE Computer window. It has an accessible name and comes after the
    headline and buttons; no text in it is under 13px in the column, and it fits a
    1280x800 first screen; the five roles (the orchestrator and ade-method's core
    roles) go once round a central terminal with hand-off lines between them, each
    with the same agent face and the service it runs on; the phone names Telegram in
    plain words and never touches the window; the terminal always shows a prompt and
    a line of output; no ticket card, specialist or list of services is in it; it
    stands still on its last frame under reduced motion; its text is readable in both
    themes; it uses no script, image or address, and stays a few KB as served.
  - `siteServices`: "Mix AI services per role", the section under the hero. A card for
    each role with its service, two ade-agent-registry specialists "loaded when
    needed", and the services: one is listed as available only when ade-cli runs it
    today, and each of the rest carries its own Coming label.
  - `sitePaper`: the technical paper's page. One `h1`, in the sitemap and the menu,
    linked from the home page; its table of contents, tables, figures (the site's own
    files, caption as alt text), references and PDF link; and its roles, releases,
    services and plugins against the repos.
  - `siteCsp`, `siteThemeContrast`, `fetchInstallers`: the content security policy on
    every page (scripts connect to nothing but the site), the light/dark contrast rule,
    and the installer copy script.
- `scripts/paper-page.py <folder>`: makes `site/paper.md` from the paper's source
  (`ade-technical-paper.md`), and copies its four figures and its PDF
  (`ade-whitepaper.pdf`) into `site/assets/`. The text is copied as it is; the few
  changes a page needs are listed at the top of the script. The PDF is made where the
  paper is written, not here.
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
ade-agent-registry, ade-skills and ade-secrets at `main`: in `./repos/<name>` (what CI
makes), in `../<name>`, or at the paths in `ADE_CLI_DIR`, `ADE_BRAIN_DIR`, `ADE_METHOD_DIR`,
`ADE_REGISTRY_DIR`, `ADE_SKILLS_DIR` and `ADE_SECRETS_DIR`. The site is built before the tests, because
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
