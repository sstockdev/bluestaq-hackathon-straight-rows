#!/usr/bin/env python3
"""Draw one stretch of time: signal, cross-track error, the sky, and what the detector reported.

python scripts/plot_episode.py --start 2026-05-04T16:15:00Z --end 2026-05-04T17:30:00Z \
    --out figures/dev_clear_jamming.png
"""
import argparse
import json
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.dates as mdates  # noqa: E402
import matplotlib.pyplot as plt  # noqa: E402
import pandas as pd  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from straightrows import config, features, pipeline  # noqa: E402

TRACTOR_COLOR = {"T1": "#2a78d6", "T2": "#eb6834", "T3": "#1baf7a"}
CAUSE_COLOR = {"SPACE_WEATHER": "#e0a100", "JAMMING": "#c2334d", "SPOOFING": "#6b4fb3",
               "EQUIPMENT_FAULT": "#3f6c8c", "MULTIPATH": "#7d858a"}
INK, MUTED = "#16232b", "#7b8a92"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--start", required=True)
    parser.add_argument("--end", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--data", default=str(ROOT / "data"))
    args = parser.parse_args()
    start, end = pd.Timestamp(args.start), pd.Timestamp(args.end)

    f = features.build_features(args.data)
    detections = pipeline.finalize(pipeline.find_candidates(f), start, end, limit=None)
    step = f"{max(1, int((end - start).total_seconds() // 1500))}s"       # about 1500 points across
    cut = lambda frame: frame.loc[start:end].resample(step).median()

    fig, axes = plt.subplots(4, 1, figsize=(11, 8.5), sharex=True, height_ratios=[3, 2, 1.6, 1.6], layout="constrained")
    signal, drift, sky, found = axes

    cn0, xte = cut(f.cn0), cut(f.xte)
    for tractor, color in TRACTOR_COLOR.items():
        signal.plot(cn0.index, cn0[tractor], color=color, lw=1.2, label=tractor)
        drift.plot(xte.index, xte[tractor], color=color, lw=1.2, label=tractor)
    predicted = f.baseline.mean() - cut(f.sag)
    signal.plot(predicted.index, predicted, color=INK, lw=1, ls="--", label="what S4 predicts")
    signal.set_ylabel("mean C/N0 (dB-Hz)")
    signal.legend(loc="lower left", ncols=4, frameon=False)
    drift.axhline(config.SPOOF_XTE_M, color=MUTED, lw=1, ls=":")
    drift.set_ylabel("cross-track error (m)")

    s4 = f.s4.loc[start:end]
    sky.step(s4.index, s4, where="post", color="#8a6a00", lw=1.5)
    sky.axhline(config.S4_SAG_MIN, color=MUTED, lw=1, ls=":")
    sky.set_ylabel("S4")
    sky.set_ylim(0, max(0.5, float(s4.max()) * 1.15))
    for report in f.rfi[(f.rfi.ts >= start) & (f.rfi.ts <= end)].itertuples():
        sky.axvline(report.ts, color=CAUSE_COLOR["JAMMING"], lw=2)
        sky.annotate(report.id, (report.ts, sky.get_ylim()[1]), xytext=(4, -12), textcoords="offset points", color=INK, fontsize=9)

    shown = [d for d in detections if d["class"] != "MULTIPATH"]
    for row, d in enumerate(shown):
        a, b = pd.Timestamp(d["start"]), pd.Timestamp(d["end"])
        found.barh(row, b - a, left=a, height=0.34, color=CAUSE_COLOR[d["class"]])
        found.annotate(f"{d['class']} on {', '.join(d['tractors'])}, confidence {d['confidence']:.2f}",
                       (a, row - 0.2), xytext=(0, 3), textcoords="offset points", va="bottom", color=INK, fontsize=9,
                       annotation_clip=False)
    found.set_yticks([])
    found.set_ylim(len(shown) - 0.5, -0.8)
    found.set_ylabel("reported")
    multipath = len(detections) - len(shown)
    if multipath:
        found.set_title(f"plus {multipath} short multipath reports, one per headland pass", loc="right", fontsize=9, color=MUTED)

    if start < pd.Timestamp(config.DEV_END):                             # shade the dev labels
        labels = json.loads((Path(args.data) / "labels/train_episodes.json").read_text())["episodes"]
        for label in labels:
            a, b = pd.Timestamp(label["start"]), pd.Timestamp(label["end"])
            if a < end and b > start and label["class"] != "MULTIPATH":
                for ax in axes[:3]:
                    ax.axvspan(max(a, start), min(b, end), color=INK, alpha=0.06, lw=0)

    for ax in axes:
        ax.spines[["top", "right"]].set_visible(False)
        ax.grid(axis="y", color="#e3e9ec", lw=0.8)
        ax.set_xlim(start, end)
    found.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M", tz="UTC"))
    found.set_xlabel(f"{start:%B %-d, %Y} (UTC). Shaded spans are the dev labels.")
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(args.out, dpi=130)
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()
