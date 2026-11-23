#!/usr/bin/env python3
"""Make the technical paper's page from the paper's source.

    scripts/paper-page.py <folder holding ade-technical-paper.md, ade-whitepaper.pdf and fig/>

Writes site/paper.md, and copies the four figures to site/assets/img/paper/ and the PDF to
site/assets/ade-whitepaper.pdf. The paper's text is copied as it is. Only what a page needs is changed, and
each change is listed here, so the page can be made again from a newer draft and its difference from the source is
never a guess:

- the title and the byline move into the page's front matter (the layout prints them);
- each figure becomes a <figure> with the site's address for the image, its caption as the alt text and shown under
  it; figure 4 is indented into the list item it follows, so the numbered list it sits in keeps counting;
- the references become a numbered list, each address a link; the citation numbers in the text stay plain text;
- the numbers are labelled "as of 23 November 2026" (twice: the abstract and section 6);
- three mentions of work that is not merged get the site's Coming label, which tests/siteTruth.test.ts requires.
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
lead: "The ADE team &middot; November 2026"
---

<p class="paper-actions"><a class="btn btn-ghost btn-small" href="{{ '/assets/ade-whitepaper.pdf' | relative_url }}">Download PDF</a></p>

## Contents
{:.no_toc}

* The sections of this paper
{:toc}

"""

HEAD = """# Fast and verified: delivering software with a team of AI agents

*The ADE team · November 2026*

"""

FIGURES = ["arch", "lifecycle", "dataflow", "keys"]

CHANGES = [
    ("138 pull requests merged across seven repositories in four days, with",
     "138 pull requests merged across seven repositories in four days (as of 23 November 2026), with"),
    ("over four days (20 to 23 November 2026):",
     "over four days (20 to 23 November 2026). The numbers are as of 23 November 2026:"),
    ("Muse waiting on their\nlive test.",
     'Muse waiting on their\nlive test <span class="coming">Coming</span>.'),
    ("as buttons on the phone, Coming)",
     'as buttons on the phone <span class="coming">Coming</span>)'),
    ("- **Coming:** approval buttons",
     '- <span class="coming">Coming</span> Approval buttons'),
]


def figure(match: "re.Match[str]") -> str:
    caption, name = match.group(1), match.group(2)
    if name not in FIGURES:
        sys.exit(f"unknown figure {name}.svg")
    # Figure 4 follows the first item of a numbered list: indented, it stays inside that item.
    pad = "   " if name == "keys" else ""
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
