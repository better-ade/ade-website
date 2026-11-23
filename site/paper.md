---
layout: page
title: "Fast and verified: delivering software with a team of AI agents"
kicker: Technical paper
permalink: /paper/
description: "The ADE technical paper: the method, the architecture, the security model, and what was learned building ADE with ADE. Work is Done only when a verification command passes, run by an agent that did not build it."
lead: "The ADE team &middot; Conceived May 2025 &middot; This edition November 2026"
---

<p class="paper-actions"><a class="btn btn-ghost btn-small" href="{{ '/assets/ade-whitepaper.pdf' | relative_url }}">Download PDF</a></p>

## Contents
{:.no_toc}

* The sections of this paper
{:toc}

## Abstract

AI coding agents now write working code quickly. What they cannot yet do on their own is tell you, reliably, that the
work is finished. An agent that reports "done" has usually run something, and usually believes it; neither is proof.
ADE (an AI delivery environment) is an open set of tools and working rules that let a team of AI agents deliver software
while a person stays in control. Its central rule is simple: **work is Done only when a verification command passes, and
that command is run by an agent other than the one that built the work.** Around that rule ADE adds roles, risk-scaled
review, a per-project memory, separate computers, a control surface on the owner's phone, and a security model designed so agents never need a key. This paper describes the method, the architecture, the security model and what we learned
building ADE with ADE: 142 pull requests merged across eight repositories in four days (as of 23 November 2026); all 17 adversarial reviews with a recorded verdict found at least one blocking flaw before merge.

*ADE was conceived in May 2025; this paper reports on the system as built and released in November 2026.*

**Keywords:** AI agents; software delivery; verification; code review; agentic security; human oversight

## 1. The problem: "done" is not a fact

A language-model agent can plan, edit files, run tests and open a pull request. Three things go wrong often enough to
matter:

1. **Self-certification.** The agent that wrote the code also decides whether it works. It runs the tests it thought of,
   reads the output it expects, and reports success. Errors of omission are invisible to it.
2. **Scope drift.** Asked for one change, an agent improves three nearby things. Each is plausible; together they make a
   review impossible and a rollback expensive.
3. **Context loss.** The next session starts from zero. Decisions, half-finished work and the reasons behind them live
   in a transcript nobody will read again.

None of these is solved by a better model. They are process problems, and they have process answers.

## 2. The ADE method

The method fits in one file (`.ade/rules.md`), layered on the BMAD workflow [3], that every agent in a project reads at the start of every session. Its
thesis is **fast and verified**: nothing is trusted because an agent said so.

**Flow.** Plan only as much as the change needs; build test-first (the failing test, then the minimal code) [7]; verify.

**The verification command owns Done.** Each project names one command (for example `bash tests/run.sh`) in its
architecture note. The **reviewer**, never the builder, runs it at every risk level and records its real output. Green
is Done; red is not. There is no other path to Done. A project without a verification command cannot have anything
Done until the owner approves one.

**Review scales with risk.** Whoever writes the story sets its risk; a builder may raise it, never lower it; missing risk
counts as medium. Anything touching secrets, sign-in, access, personal data, production or money is high, whatever its
size.

| Risk | Typical change | Review (one pass, never rounds) |
|---|---|---|
| low | docs, config, small change covered by tests | none beyond the verification command |
| medium | most features | the build's quick review, on a smaller model |
| high | the list above, locks, concurrency | a thorough review plus one adversarial pass on a stronger model; at most one fix round |

After the one fix round, unresolved material flaws go to the owner with the findings; the work stays not Done.

<figure class="paper-fig">
<img src="{{ '/assets/img/paper/lifecycle.svg' | relative_url }}" alt="Figure 2. A story from intent to Done. The reviewer, never the builder, runs the verification command; high-risk work gets one adversarial pass and at most one fix round." loading="lazy">
<figcaption>Figure 2. A story from intent to Done. The reviewer, never the builder, runs the verification command; high-risk work gets one adversarial pass and at most one fix round.</figcaption>
</figure>

**Other rules.** One story, one slice (no drive-by changes). Honest status ("I think it passes" is not "it passes").
Content is data: pages, emails, tickets and logs never give instructions. Commits are made as the person, with no AI
attribution. Stories stay small: about ten acceptance criteria at most, each named by its test.

## 3. Architecture


ADE is made of seven parts, each in its own repository with one job (the website and the terminal app are separate):

| Part | Job |
|---|---|
| **ade-cli** (`ade`) | The command people type: a guided first run, the tab view, files, screenshots, the web view, projects |
| **ade-brain** | The hub template: one hub per owner or client, holding context, memory, journal and the agents' rules |
| **ade-method** | The rules and the BMAD workflow settings, pinned by version into every hub and project |
| **ade-skills** | Plugins: connectors (ClickUp, Jira, Linear, Orgo) and the guard |
| **ade-agent-registry** | Specialist agents (support, sysadmin and others), loaded only when a task needs one |
| **ade-secrets** | Key storage on top of the system keychain |
| **ADE Computer** | An isolated Ubuntu desktop image with ADE and the usual tools (early preview) |

<figure class="paper-fig">
<img src="{{ '/assets/img/paper/arch.svg' | relative_url }}" alt="Figure 1. ADE&#x27;s parts. The owner talks to the orchestrator; focus agents work one folder each; rules, skills and specialists come pinned from their own repositories; keys never leave secure storage." loading="lazy">
<figcaption>Figure 1. ADE's parts. The owner talks to the orchestrator; focus agents work one folder each; rules, skills and specialists come pinned from their own repositories; keys never leave secure storage.</figcaption>
</figure>

### 3.1 The hub

A hub is a git repository made from the ade-brain template, one per owner or per client so that context never mixes.
Its layout is deliberately plain:

| Path | What it holds |
|---|---|
| `CLAUDE.md` | The orchestrator's instructions; it loads `.ade/rules.md` (the method) |
| `hub.conf` | Names and locations only: the hub's name, providers per role, chat settings; never a key |
| `projects/<name>/`, `ops/<name>/` | One folder per project or operational area |
| `<folder>/STATE.md` | What is live, open, waiting, and what the next session starts with |
| `<folder>/ACCESS.md` | Which repositories, machines and services the folder may touch, and where each credential lives (by name) |
| `memory/` | The memory index and the owner's confirmed preferences and corrections |
| `journal/` | One dated file per day: what happened, by whom, and why |
| `bin/` | The hub's own scripts: `work`, `chat`, `sessions`, `sync`, `keys`, `brain` and others |

Every session starts by reading its folder's state and the recent journal, and ends by updating them. A hook at
compaction time writes the state before the conversation is summarised, so nothing in progress is lost.

### 3.2 Roles

Four core roles do the work. **Product** turns intent into small stories with a risk level. **Architect** keeps
separately built parts consistent and owns the decision records and the verification command. **Developer** builds one
story test-first and stops. **Reviewer** runs the verification command, checks that every criterion has a real test,
and reviews as deep as the risk asks; it never edits code. A **coordinator** (the orchestrator) is the owner's main
session: it writes tickets, picks roles, dispatches work and reports. Specialists such as support and sysadmin come from
the registry when a task needs them and are not loaded otherwise, which keeps every session's context small.

### 3.3 Focus agents

Each project folder runs its own agent, started by `ade work <folder>` (or by the orchestrator) as a tab beside the
orchestrator in `ade ui`. A focus agent sees only its folder's state and the repositories its `ACCESS.md` lists; it
changes code only on a branch, as a draft pull request. It carries an in-folder copy of the hub's rules and memory
index, refreshed at every start, so it never stops at a startup question nobody can see. If it has not started within
90 seconds, the orchestrator is told, and tells the owner.

### 3.4 The learning loop

What the owner teaches (a correction, a preference, a rule for one folder) is captured as a pending entry, shown back in
the morning briefing as quoted data, and only becomes part of the agents' context after the owner confirms it at a
terminal. Entries are scanned for instruction-like content before they load, so a planted "rule" cannot steer an agent.

### 3.5 Mixed AI services

Each role can run on a different service. Today ADE runs Claude, DeepSeek and Gemini, with GLM and Muse waiting on their
live test <span class="coming">Coming</span>. Every service is tested live before a role may use it; a failed test offers to sign in again, retry, switch
service, or go on untested, which is recorded as untested and keeps that service out of focus roles.

### 3.6 ADE Computer

One container is one computer: an Ubuntu desktop served to the browser on the owner's own machine, with its own home
volume, its own network and its own desktop password, created per project or per task and optionally saved as an
image. It is a container, not a separate machine: it reaches the internet and, on Docker Desktop, services listening on
the host. Inside it, ADE is installed from its tagged release, checked against published checksums.

### 3.7 Data flow: a request from the owner's phone

<figure class="paper-fig">
<img src="{{ '/assets/img/paper/dataflow.svg' | relative_url }}" alt="Figure 3. One request, end to end. Only the locked owner&#x27;s messages reach the orchestrator; the focus agent works on a branch; the reviewer decides Done; proof returns through a send path that talks only to Telegram." loading="lazy">
<figcaption>Figure 3. One request, end to end. Only the locked owner's messages reach the orchestrator; the focus agent works on a branch; the reviewer decides Done; proof returns through a send path that talks only to Telegram.</figcaption>
</figure>

1. The owner sends a message to the hub's bot. The Telegram plugin delivers it only if the sender is the one id on the
   bot's allowlist; everything else is dropped.
2. The orchestrator, running in auto mode only because the bot is locked, writes the ticket and starts a focus agent on
   the right folder.
3. The focus agent loads its folder's rules and state, works test-first on a branch, and opens a draft pull request; CI
   runs the project's verification command.
4. Any tool call that needs permission asks (at the terminal today; as buttons on the phone <span class="coming">Coming</span>). An unanswered
   request is a deny, never an allow.
5. A reviewer agent runs the verification command itself and records the output. High-risk work gets the adversarial
   pass and at most one fix round.
6. Proof (a screenshot of the page or the agent's terminal) is saved as evidence and sent with the reply through
   `bin/chat send`, which only talks to Telegram's own address and refuses key files, links and disguised files.

## 4. The owner's control surface

The owner should not have to sit at a terminal. ADE's chat channel connects the orchestrator to the owner's Telegram:

- **Locked to one person.** The chat runs in Claude Code's auto mode only when the bot is locked to exactly one account
  (allowlist, one numeric id, no groups); otherwise it stays in manual mode and says why. If the lock is lost while the
  chat runs, the owner is told within seconds.
- **Ask, never assume.** Changing who may reach the bot always asks, even in auto mode. Skipping permissions entirely is
  refused by the hub's own scripts.
- **Proof travels.** `ade shot` saves screenshots of a page, an agent's terminal or (only after the owner's approval)
  the screen as evidence, and `--tg` sends one to the owner through a send path that only talks to Telegram's own
  address and refuses key files, links and disguised files.
- **A read-only view.** `ade web` serves the agents' state, logs and journal on the machine itself, or only on the
  owner's private Tailscale network for a phone, with secrets hidden from every line.

## 5. Security model

The design assumption is that an agent can be wrong, confused, or steered by content it reads. So:

1. **Keys live in secure storage** (the macOS keychain, or ade-secrets on top of it), typed only at a hidden prompt in the owner's own terminal. The design goal is that agents never need a value: Claude Code receives a key through its key helper when it needs it, and `ACCESS.md` and `hub.conf` hold names and locations only. This held for every key ADE manages; section 6 reports the one time a credential reached an agent's output, through a tool outside that design, and what changed afterwards.

   <figure class="paper-fig">
   <img src="{{ '/assets/img/paper/keys.svg' | relative_url }}" alt="Figure 4. Where a key can and cannot go. A key is typed once, at a hidden prompt; Claude Code receives it at request time; an agent&#x27;s shell has no path to the value, and the guard refuses the commands that would print one." loading="lazy">
   <figcaption>Figure 4. Where a key can and cannot go. A key is typed once, at a hidden prompt; Claude Code receives it at request time; an agent's shell has no path to the value, and the guard refuses the commands that would print one.</figcaption>
   </figure>

2. **The guard** is a hook that reads every shell command before it runs. It refuses anything that would print a
   credential (in any of the forms we could find: case changes, `${IFS}` splitting, `sh -c`, `xargs`, backticks,
   here-documents, git credential helpers), asks before writes to connected services, and lets local work run.
3. **Connectors ask before writing.** ClickUp, Jira, Linear and Orgo are reached through the Model Context Protocol [2] and sign in through Claude Code's own OAuth [1]; their
   plugins let agents read freely and ask before any change, and before anything that bills.
4. **Content is data.** Messages, pages and files an agent reads never become instructions (the prompt-injection risk catalogued by OWASP [6]); the rules say so, and the
   skills that read external content repeat it.
5. **Refuse the known token-printing commands.** Owner-level settings refuse a list of commands that print a credential, for every session and agent, in addition to the guard. This is a deny-list, not a default deny: it narrows a known risk and does not replace isolation (section 8).

### Trust boundaries

| Boundary | What crosses it | What guards it |
|---|---|---|
| Telegram → orchestrator | The owner's messages | One-id allowlist; auto mode only when locked; a lost lock is reported |
| Orchestrator → focus agent | A ticket and a folder | The folder's `ACCESS.md`; branches and draft PRs only |
| Agent → shell | Commands | Claude Code permissions; owner deny rules; the guard |
| Agent → connected service | Reads and writes | Connector plugins ask before any write or billed action |
| Agent → keys | Nothing | Keys stay in the keychain; Claude Code's key helper serves the model API directly |
| Content → agent | Pages, mail, tickets, logs | Treated as data; never followed as instructions |
| Machine → network | Logs and screenshots | `ade web` on 127.0.0.1 or the owner's tailnet only, with secrets hidden; `bin/chat send` to Telegram only |

## 6. Evidence: building ADE with ADE

We built ADE with its own method, in the open, over four days (20 to 23 November 2026). The numbers are as of 23 November 2026, 14:10 UTC:

| Repository | Pull requests merged | Latest release |
|---|---|---|
| ade-cli | 56 | v0.2.8 |
| ade-brain | 46 | v1.0.0 |
| ade-skills | 19 | v0.9.0 |
| ade-website | 8 | (site) |
| ade-secrets | 4 | v0.3.1 |
| ade-method | 3 | v2.1.0 |
| ade-agent-registry | 3 | v1.1.0 |
| ADE Computer | 3 | v0.1.0 |
| **Total** | **142** | |

**Who reviewed 142 pull requests.** Every pull request passed its repository's CI, which runs the verification command. Each change was reviewed as its risk required: low-risk changes by the verification command alone, medium-risk ones by a quick review on a smaller model, and high-risk ones by a thorough review plus an adversarial pass on a stronger model, by an agent that had not built the change. The owner set direction, answered the questions the agents raised, and merged. These figures show throughput; we did not run a controlled comparison against the same work done without ADE, so we make no claim about speed beyond them.

**Adversarial review earns its cost.** Between 21 and 23 November the hub's journal records 17 adversarial reviews with a verdict (some covered two or three related changes). All 17 found at least one blocking flaw in a change they covered; of the changes those reviews covered, one (the hub's `bin/chat send`) had none. A sample:

- **Self-unlocking chat.** In auto mode the agent could have edited its own access list, letting a group in, because the
  messaging plugin re-reads that file on every message. Fixed with an ask rule and a lost-lock notice.
- **A token pointed elsewhere.** A setting meant for tests could send the bot token to any web address. Fixed by pinning
  the API host, for the new send path and the older one.
- **Screen capture approved by the wrong file.** The approval check read only the nearest settings file, so permissions
  skipped elsewhere still counted. Fixed by reading every settings level and the real project root.
- **A one-line denial of service.** One 250,000-character log line froze the log viewer for 74 seconds, because a
  redaction pattern is quadratic on long lines. Fixed by capping lines before redaction.
- **Guard bypasses.** Capital letters, `${IFS}` and quoted forms slipped past the first guard. The fix round grew the guard's table to 407 cases.
- **A timing bug mistaken for flakiness.** A test that failed only on Linux CI was a whole-second comparison in "learned
  since the last briefing"; a fast machine put two events in the same second.

**Are the tests any good?** Verification is only as strong as the tests, and the builder writes them. The sign-off check of the guard answered this directly: it reverted the fix round's changes one at a time and confirmed a test failed for each. Fourteen of fifteen were caught; the one that was not (deny words compared in any case) was a missing test, recorded for follow-up. Reviewers did the same on other changes ("undo the fix, show the test fails"). We now consider this revert check part of what a high-risk review should do (section 8).

**Failures, reported as they happened.** During one fix round an agent tested the guard by passing hostile command
lines through a shell here-document. One test line contained the here-document's end marker; the shell ended the block
early and ran the following lines, one of which printed the owner's live GitHub CLI token into the agent's output. It
reached no repository, commit or pull request. The remedy for an exposed token is to revoke it at the provider and sign
in again, which moves the new one into the keychain; we added owner-level
deny rules for every token-printing command, a rule that test inputs for shell-parsing code come from files and never
pass through a shell, and empty credential folders for test runs. We report it because it is the clearest evidence for
the paper's thesis: agents make mistakes with confidence, and the defence is layers that do not depend on the agent
being right.

## 7. Related work

Benchmarks such as SWE-bench [5] measure whether a model can resolve a real issue; they score the patch, not the process around it. ADE takes the complementary view that in production the question is not only whether an agent can write the fix but who is allowed to say it is finished. Its central rule is an old one, separation of duties (the four-eyes principle of change management), applied to agents, with the reviewer bound to an executable check rather than to judgement alone. Test-driven development [7] supplies the order of work. The BMAD method [3] supplies the planning and story workflow on which ADE's roles are layered. Claude Code [1] supplies the agent runtime, its permission system and its hooks, on which the guard is built; the Model Context Protocol [2] is the interface to external services. OWASP's catalogue of risks for LLM applications [6] names prompt injection and excessive agency, which ADE addresses with the content-is-data rule, ask-before-write connectors and keys that agents never hold. Telegram's Bot API [4] carries the owner's control surface.

## 8. Limits and future work

- **Prefix rules are not a sandbox.** Permission rules match command text; a command wrapped inside another can slip
  past them. The guard narrows that gap; real isolation is a container (ADE Computer) or a separate account.
- **Test strength.** The revert check of section 6 is done by hand in reviews today; making it a standard, automated step of every high-risk review is the next change to the method.
- **No speed baseline.** We report throughput, not a measured comparison.
- **Self-reported approvals.** Where ADE checks that an approval rule exists, it cannot see the moment a person clicked
  Allow; Claude Code's own prompt remains the boundary.
- <span class="coming">Coming</span> Approval buttons on Telegram for every focus agent; pairing without slash commands;
  `ade connect` for GitHub.
- {:.later}Later: progress commands on Telegram; per-hub keys (`ade key`, `ade vault`); ADE Computer in the cloud;
  Kimi and ChatGPT as services; a code-security plugin.

## 9. Conclusion

Agents are fast. Making them trustworthy is mostly not about the model: it is about who decides Done, how much review a
change gets, where keys live, and whether a person can see and stop what is happening from wherever they are. ADE puts
those decisions in a short set of rules and a small set of tools, and tests itself by the same rules.

## References

1. Anthropic. *Claude Code documentation.* <https://code.claude.com/docs>
2. Model Context Protocol. *Specification.* <https://modelcontextprotocol.io>
3. BMAD Code Org. *BMAD Method.* <https://github.com/bmad-code-org/BMAD-METHOD>
4. Telegram. *Bot API.* <https://core.telegram.org/bots/api>
5. C. E. Jimenez, J. Yang, A. Wettig, S. Yao, K. Pei, O. Press, K. Narasimhan. *SWE-bench: Can Language Models Resolve Real-World GitHub Issues?* ICLR 2024.
6. OWASP. *Top 10 for Large Language Model Applications.* <https://owasp.org/www-project-top-10-for-large-language-model-applications/>
7. K. Beck. *Test-Driven Development: By Example.* Addison-Wesley, 2002.
{:.paper-refs}

## Appendix A: the rules file (abridged)

1. **Flow:** plan as much as the change needs; build test-first; the reviewer verifies.
2. **The verification command owns Done.** No agent marks its own work Done.
3. **One story, one slice.** Honest status. Stay in your lane. Commit as the user.
4. **Review scales with risk** (table in section 2); at most one fix round for high risk.
5. **Definition of Done:** each criterion has an automated test; the verification command passes and its real output is
   recorded by the reviewer; the change stays within its story; any shared contract is recorded.

## Appendix B: a story, end to end

*Owner: "I think if telegram is on, auto mode should be on?"* The orchestrator proposed a condition (auto only once the
bot is locked to the owner), and on the owner's yes wrote it as one high-risk change across two repositories. A
developer agent built it test-first: the hub chooses auto or manual from the bot's access file and says why; the guide
locks the bot before saying Telegram works. A reviewer agent on a stronger model, which had not built it, attacked it
with crafted access files and found two blocking flaws: the agent in auto mode could loosen its own lock without a
question, and the guide explained auto mode only after switching to it. The one fix round closed both, plus six smaller
findings, each with a test. CI passed on macOS and Linux; the change was merged and released in ade-cli v0.2.7.
