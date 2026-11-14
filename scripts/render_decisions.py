#!/usr/bin/env python3
"""Render decisions.json as the README's design decisions section.

python scripts/render_decisions.py            # print the section
python scripts/render_decisions.py --write    # replace the section in README.md

decisions.json is the single source: the README and the presentation page both read it.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
START, END = "<!-- decisions:start -->", "<!-- decisions:end -->"


def render(decisions):
    """Markdown for every decision: what was chosen, what was rejected, the evidence, the limit."""
    parts = []
    for d in decisions:
        rejected = "\n".join(f"- {item}" for item in d["rejected"])
        parts.append(
            f"### {d['id']}. {d['title']}\n\n"
            f"{d['choice']}\n\n"
            f"Rejected:\n\n{rejected}\n\n"
            f"Evidence from dev: {d['evidence']}\n\n"
            f"Limitation: {d['limitation']}\n"
        )
    return "\n".join(parts)


def main():
    section = render(json.loads((ROOT / "decisions.json").read_text()))
    if "--write" not in sys.argv:
        print(section)
        return
    readme = ROOT / "README.md"
    text = readme.read_text()
    before, rest = text.split(START, 1)
    _, after = rest.split(END, 1)
    readme.write_text(f"{before}{START}\n\n{section}\n{END}{after}")
    print(f"Updated the decisions section of {readme}")


if __name__ == "__main__":
    main()
