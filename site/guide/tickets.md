---
title: Tickets and dispatch
description: How a ticket becomes Done. Tickets with a risk level, ade dispatch starting builders, high-risk work waiting for your approval, review by risk and the verification command.
lead: A ticket goes in, a verified change comes out. High-risk work waits for you.
---

## A ticket

A ticket is a small story in the project: what to build, its acceptance criteria, and a **risk level**. It is a BMAD
v6 ticket, written with `bmad-ticket`, by you or by the orchestrator from a request in plain words. Whoever writes it
sets the risk; a builder may raise it, never lower it.

| Risk | Typical change |
|---|---|
| low | docs, config, a small change already covered by tests |
| medium | most features |
| high | anything touching secrets, sign-in, access, personal data, production or money, whatever its size; locks and concurrency |

## Dispatch

```
ade dispatch projects/api
```

`ade dispatch <folder>` reads the project's ready tickets and starts a focus builder for each one, up to the free
slots: `HUB_DISPATCH_MAX` in `hub.conf`, 1 by default and at most 2, across the whole hub. Each builder is a focus
agent on the builder role's model, started with `bmad-build <ticket>`. A ticket that is already running is never
started twice, and only one dispatch runs at a time.

From inside a Claude Code session, the `ade` plugin from ade-skills gives you the same as `/ade:dispatch`.

## What waits for you

Only **low** and **medium** risk tickets start on their own. A **high** risk ticket, one that needs a human in the loop,
or one whose risk cannot be read is printed as *waiting for the owner* and journaled. You start it yourself:

```
ade dispatch --approve <ticket> projects/api
```

It runs only at an interactive terminal, and you type the ticket's reference back to confirm. Every session in the hub
also asks your permission before any agent runs that command.

To be precise about it: the typed confirmation is a speed bump, not a security boundary. The real gate is Claude Code's
permission prompt in your own session, and the journal shows every start.

## After the build

1. The builder writes the failing test first, then the code, and runs the verification command itself.
2. Review follows the risk: none beyond the verification command for low, one quick pass on the smaller model for
   medium, a thorough review plus one adversarial pass for high, with at most one fix round.
3. The **reviewer**, never the builder, runs the verification command and records its real output.
4. Green is Done, and one dated line goes into the project's journal. Red goes back to the builder. Unresolved material
   flaws after the fix round go to you with the findings, and the work stays not Done.

## What dispatch needs

The folder has exactly one code repo, checked out, with BMAD installed in it, and `node` on the path. On any doubt it
starts nothing and says why.
