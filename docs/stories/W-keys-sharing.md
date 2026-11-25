# W-keys-sharing: the paper shows how a hub's keys go to one person

risk: low (copy and a figure on the public site; no secret, sign-in, data or money)

## Story

As someone reading how ADE keeps keys safe, I want the paper to show how keys are shared with another person, so I can
see that a handover never means sending keys in plain text.

The paper's security model gains a sixth point and Figure 5: `bin/keys share` seals keys with age to one person's
public SSH keys (or a one-off age key), the sealed block travels any way, and `bin/keys receive` opens it straight into
the recipient's own secure storage, after checking the hub and expiry and asking first. Only what is merged on
ade-brain's main is shown (story I4); a signed sender (I5) and one-time links (I6) are added when they merge.

## Acceptance criteria (tests/sitePaper.test.ts)

1. The paper shows five figures from the site's own files, Figure 5 being `sharing.svg`, a drawing of its own
   (nothing fetched or run), with its caption as the alt text and under it.
2. The security model is one numbered list of six points; figure 4 stays in the first, figure 5 sits in the sixth,
   which names `bin/keys share` and `bin/keys receive`.
3. The PDF is rebuilt from the paper's source with the same point and figure; scripts/paper-page.py knows figure 5.
