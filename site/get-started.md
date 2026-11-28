---
layout: page
kicker: Guide
title: Get started
permalink: /get-started/
description: Set up ADE in four steps, in the order of a software engineer's day. You, your context and access, your projects and customers, then the terminal or Telegram. On macOS or Linux.
lead: Four steps, one command each.
---

{% include downloads.html %}

## What you need

- **macOS** or **Linux**, with `git`, Bash and `python3`. `ade setup --tools` installs what is missing.
- Claude Code, on Claude Pro, Max, Team or Enterprise. `ade setup` offers to install it.
- Your own AI accounts or keys: you pay the AI services directly. ADE is free, MIT open source, and collects nothing.

## 1. You

```
curl -fsSL https://raw.githubusercontent.com/better-ade/ade-cli/main/install.sh | bash
ade setup
```

- Installs **v{{ site.data.releases.ade_cli }}** of `ade` in `~/.local/bin`
  ([changelog]({{ site.cli_repo }}/blob/main/CHANGELOG.md)). `ade update` upgrades; `ade help` lists every command.
- `ade setup` walks seven checked steps: Claude Code, Claude, GitHub, your hub, your tools (optional), your first project,
  Telegram (optional). Rerun to resume.
- Your hub is one git repo per owner or client: context, memory, journal and the agents' rules. Your code stays in its own repos.
- `ade hub new` asks for your persona, one of 13 personas, like <span data-persona>Staff Software Engineer</span>,
  <span data-persona>Tech Lead</span> or <span data-persona>Fractional CTO</span>, your client and your name.
- The team: 4 core roles from ade-method: product, architect, developer, reviewer. 10 specialists load when needed;
  `ade agent add <name>` adds one, like `support` or `forward-deployed` (with the `fde` plugin's engagement documents).
- You approve high-risk work. The verification command decides Done.

## 2. Your context, tools and access

```
ade connect clickup
```

- `ade connect <service>`: you sign in, the project keeps the name only, every change asks.
- <span data-tool="clickup">ClickUp</span>, <span data-tool="jira">Jira</span>, <span data-tool="linear">Linear</span> and
  <span data-tool="google-drive">Google Drive</span> today;
  <span data-tool="github"><b>GitHub</b> <span class="coming">Coming</span></span>,
  <span data-tool="gmail"><b>Gmail</b> <span class="coming">Coming</span></span>,
  <span data-tool="slack"><b>Slack</b> <span class="coming">Coming</span></span>,
  <span data-tool="outlook"><b>Outlook</b> <span class="coming">Coming</span></span>,
  <span data-tool="teams"><b>Microsoft Teams</b> <span class="coming">Coming</span></span>,
  <span data-tool="discord"><b>Discord</b> <span class="coming">Coming</span></span>
- <span data-truth="plugins">Each through its own server: the `clickup`, `jira`, `linear` and `orgo` plugins
  ([ade-skills' README]({{ site.skills_repo }}#readme)).</span> The <code data-truth="plugin">guard</code> plugin
  refuses commands that print a stored token.
- Keys: a key goes in only at your own terminal, at a hidden prompt, in `ade setup` or `bin/keys set <name>`.
  Agents never see a value. Never in a chat, a file or a command line. `ade-secrets vault` refuses to run inside an
  agent session. If you paste a key into a prompt by mistake, the paste guard stops it and names the command that
  stores it.
- `ade keys`: sets missing keys at hidden prompts.
- Memory: each project's state, decisions and journal load into every session, so work starts where it stopped.

<div id="services">
<p><strong>AI services per role.</strong> Each role runs on the service you pick; <code>ade roles</code> shows which. An example mix:</p>
<ul>
<li data-role="orchestrator">Orchestrator: <b>Claude</b></li>
<li data-role="product">Product: <b>Claude</b></li>
<li data-role="architect">Architect: <b>Claude</b></li>
<li data-role="developer">Developer: <b>Gemini</b></li>
<li data-role="reviewer">Reviewer: <b>DeepSeek</b></li>
</ul>
<p>Specialists such as <b class="specialist">Support</b> and <b class="specialist">Sysadmin</b> are loaded when needed.</p>
<p>Available today: <span class="svc-now"><span>Claude</span>, <span>DeepSeek</span>, <span>Gemini</span></span>. Not yet: <span class="svc-soon"><span><b>GLM</b> <span class="coming">Coming</span></span>, <span><b>Muse</b> <span class="coming">Coming</span></span></span></p>
</div>

## 3. Projects and customers

```
ade project add ~/code/agency-site
```

- `ade project add <path or git address>`: a repo becomes a project folder. `--scan ~/code` picks from a folder.
- `ade work <folder>`: its focus agent, seeing only that folder and its repos, so you run several tasks at once.
- `ade dispatch`: ready tickets to focus builders, as many as you allow.
- `ade docs`: reads the hub's plans and specs, newest first.
- `ade hub new` per customer, each running only the models it approved; `ade hub use <path>` switches.

## 4. Run it from the terminal or Telegram

```
ade ui
```

- One tmux window on `ade`'s own server: tab 0 is the orchestrator, each `ade work` adds a tab.
- <kbd>prefix</kbd> <kbd>f</kbd> fleet sidebar, <kbd>prefix</kbd> <kbd>e</kbd> file viewer, <kbd>prefix</kbd>
  <kbd>?</kbd> keys, <kbd>prefix</kbd> <kbd>d</kbd> detach (the agents keep running).
- Or click: the bar's buttons `[+ agent]`, `[tickets]`, `[files]`, `[approve]`, `[dash]` and `[? keys]`; a right click
  shows every action.
- Away: your Telegram bot, locked to you ([ade-brain's README]({{ site.brain_repo }}#readme)), or
  `ade web --tailnet`, read-only on your phone. `ade shot --tg` sends a screenshot as proof.
- One hub, one Telegram bot. The token goes in that hub's own key store.

## Then

- **One ADE Computer per engagement.** A mini PC, a compute instance or a container on your own Docker, for
  dedicated work or several contracts. Inside: an Ubuntu desktop with ADE, VS Code, a terminal and database tools,
  per project or per task. It is not given your home folder, keys or Docker socket, but agents inside have full
  rights: give it nothing you would not give them. The container is in early preview:
  [ask by email]({{ site.preview_url }}){: data-preview-mail=""} or [open a GitHub issue]({{ site.preview_url }}),
  which is public: put nothing private in it.
- **Hand off a ticket:** [ade-cli's README]({{ site.cli_repo }}#readme), and [How it works]({{ '/#how-it-works' | relative_url }}).
- **Check it yourself:** CI runs each repo's verification command on every pull request: `bash tests/run.sh` in
  ade-cli, ade-brain, ade-skills and ade-secrets, `node scripts/validate.mjs` in ade-method and ade-agent-registry.

## What ships with ADE

{% for repo in site.data.repos %}{% if repo.job %}- **[{{ repo.name }}]({{ site.org_url }}/{{ repo.name }})**{% if repo.release %} (v{{ site.data.releases[repo.release] }}){% elsif repo.state %} ({{ repo.state }}){% endif %}: {{ repo.job }}
{% endif %}{% endfor %}- **ADE Computer** (early preview): not public yet.

These are each repo's latest release. What `ade` v{{ site.data.releases.ade_cli }} installs is pinned: `ade init` copies
ade-method v{{ site.data.pins.ade_method }} into a project, a new hub runs ade-method v{{ site.data.pins.hub_method }}
(the hub template's pin), and `ade skills add` and `ade connect` read ade-skills v{{ site.data.pins.ade_skills }}.
