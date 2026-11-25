#!/usr/bin/env python3
"""Make the technical paper's page from the paper's source.

    scripts/paper-page.py <folder holding ade-technical-paper.md, ade-whitepaper.pdf and fig/>

Writes site/paper.md, and copies the five figures to site/assets/img/paper/ and the PDF to
site/assets/ade-whitepaper.pdf. The paper's text is copied as it is. Only what a page needs is changed, and
each change is listed here, so the page can be made again from a newer draft and its difference from the source is
never a guess:

- the title and the byline move into the page's front matter (the layout prints them);
- each figure becomes a <figure> with the site's address for the image, its caption as the alt text and shown under
  it; figures 4 and 5 are indented into the list items they follow, so the numbered list they sit in keeps counting;
- the references become a numbered list, each address a link; the citation numbers in the text stay plain text;
- the abstract's numbers are labelled "as of 23 November 2026" (section 6 says so itself);
- mentions of work that is not merged and is next get the site's Coming label, and the last item of section 8 is
  split as the site splits it: what is next (labelled Coming), and one "Later:" line for the rest, with no label.
  tests/siteTruth.test.ts requires both.
"""
import html
import os
import re
import shutil
import sys

FRONT = """---
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

"""

HEAD = """# Fast and verified: delivering software with a team of AI agents

*The ADE team · Conceived May 2025 · This edition November 2026*

"""

FIGURES = ["arch", "lifecycle", "dataflow", "keys", "sharing"]

CHANGES = [
    # ade-cli's 0.2.8 (ade shot and ade project) was released after the paper's table was made; the table shows the
    # release on main, which tests/sitePaper.test.ts holds to the repo's VERSION.
    ("| ade-cli | 56 | v0.2.7 |", "| ade-cli | 56 | v0.2.8 |"),
    ("142 pull requests merged across eight repositories in four days; all 17",
     "142 pull requests merged across eight repositories in four days (as of 23 November 2026); all 17"),
    ("Muse waiting on their\nlive test.",
     'Muse waiting on their\nlive test <span class="coming">Coming</span>.'),
    ("as buttons on the phone, Coming)",
     'as buttons on the phone <span class="coming">Coming</span>)'),
    # Section 8's last item, as the site says it: what is next carries the Coming label; the rest is one "Later:" line.
    ("- **Coming:** approval buttons and progress commands on Telegram for every focus agent; pairing without slash commands;\n"
     "  per-hub keys (`ade key`, `ade vault`); `ade connect` for GitHub; ADE Computer in the cloud; Kimi and ChatGPT as\n"
     "  services; a code-security plugin.",
     '- <span class="coming">Coming</span> Approval buttons on Telegram for every focus agent; pairing without slash commands;\n'
     "  `ade connect` for GitHub.\n"
     "- {:.later}Later: progress commands on Telegram; per-hub keys (`ade key`, `ade vault`); ADE Computer in the cloud;\n"
     "  Kimi and ChatGPT as services; a code-security plugin."),
]


def figure(match: "re.Match[str]") -> str:
    caption, name = match.group(1), match.group(2)
    if name not in FIGURES:
        sys.exit(f"unknown figure {name}.svg")
    # Figures 4 and 5 follow an item of a numbered list (the first and the sixth): indented, each stays inside its item.
    pad = "   " if name in ("keys", "sharing") else ""
    return (
        f'{pad}<figure class="paper-fig">\n'
        f"{pad}<img src=\"{{{{ '/assets/img/paper/{name}.svg' | relative_url }}}}\" alt=\"{html.escape(caption, quote=True)}\" loading=\"lazy\">\n"
        f"{pad}<figcaption>{html.escape(caption, quote=False)}</figcaption>\n"
        f"{pad}</figure>"
    )


def references(text: str) -> str:
    """The "[n] ..." paragraphs under References, as one numbered list in the same order."""
    start = text.index("\n## References\n")
    end = text.index("\n## ", start + 1)
    entries = re.findall(r"^\[(\d+)\] (.+)$", text[start:end], flags=re.M)
    if [int(n) for n, _ in entries] != list(range(1, len(entries) + 1)) or not entries:
        sys.exit("the references are not numbered 1, 2, 3 ... in order")
    items = [f"{n}. " + re.sub(r"(https://\S+)$", r"<\1>", entry) for n, entry in entries]
    return text[:start] + "\n## References\n\n" + "\n".join(items) + "\n{:.paper-refs}\n" + text[end:]


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    source = sys.argv[1]
    text = open(os.path.join(source, "ade-technical-paper.md"), encoding="utf-8").read()
    if not text.startswith(HEAD):
        sys.exit("the paper no longer starts with the title and byline this script expects")
    text = text[len(HEAD):]
    if "{{" in text or "{%" in text:
        sys.exit("the paper holds Liquid markup; escape it before publishing")
    for old, new in CHANGES:
        if text.count(old) != 1:
            sys.exit(f"expected exactly one {old!r} in the paper, found {text.count(old)}")
        text = text.replace(old, new)
    text, count = re.subn(r"^!\[([^\]]+)\]\(fig/([a-z]+)\.svg\)$", figure, text, flags=re.M)
    if count != len(FIGURES):
        sys.exit(f"expected {len(FIGURES)} figures, found {count}")
    text = references(text)
    open("site/paper.md", "w", encoding="utf-8").write(FRONT + text)
    os.makedirs("site/assets/img/paper", exist_ok=True)
    for name in FIGURES:
        shutil.copyfile(os.path.join(source, "fig", name + ".svg"), f"site/assets/img/paper/{name}.svg")
    shutil.copyfile(os.path.join(source, "ade-whitepaper.pdf"), "site/assets/ade-whitepaper.pdf")


if __name__ == "__main__":
    main()
