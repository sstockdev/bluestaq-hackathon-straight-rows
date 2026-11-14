#!/usr/bin/env python3
"""Render decisions.json as docs/DECISIONS.md.

python scripts/render_decisions.py            # print the decisions
python scripts/render_decisions.py --write    # write docs/DECISIONS.md

decisions.json is the single source: docs/DECISIONS.md and the map app both read it.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INTRO = """# Design decisions

The twelve decisions behind the detector. Each has what I chose, what I rejected, the evidence from the dev episodes, and its limitation.

This file is generated from `decisions.json`. To change it, edit that file and run `python scripts/render_decisions.py --write`.
"""


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
    doc = ROOT / "docs" / "DECISIONS.md"
    doc.write_text(f"{INTRO}\n{section}")
    print(f"Wrote {doc}")


if __name__ == "__main__":
    main()
