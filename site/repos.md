---
layout: page
title: Repos
kicker: Source
permalink: /repos/
description: The better-ade repos behind ADE, what each one is, and the verification command each one is held to. All open source under the MIT license.
lead: ADE is a handful of small repos, each with its own verification command. All open source, MIT licensed.
---

| Repo | What it is | Verification command |
|---|---|---|
{% for r in site.data.repos %}| [{{ r.name }}]({{ site.org_url }}/{{ r.name }}) | {{ r.what }}{% if r.coming %} <span class="coming">Coming</span>{% endif %}{% if r.link %} See [{{ r.link_label }}]({{ r.link | relative_url }}).{% endif %} | {% if r.verify %}`{{ r.verify }}`{% else %}-{% endif %} |
{% endfor %}

## How they fit

- **ade-cli** is the command you type. Inside a hub it runs the hub's own scripts; inside a project it copies the
  method, specialists and skills from their repos at pinned versions.
- **ade-brain** is the template every hub is made from, one hub per customer or team.
- **ade-method**, **ade-agent-registry** and **ade-skills** are what a project loads: the rules and core roles always,
  a specialist or a plugin only when a task needs one.
- **.github** holds the shared CI the repos call: every pull request and every push to `main` runs the repo's verification command
  and a gitleaks scan, and a release is cut when `VERSION` changes on `main`.

Contributions come in as pull requests, one story at a time, built test-first. Every commit and pull request follows
the same shape: overview, implementation details, verification with the real output, a Definition of Done checklist,
and related work.
