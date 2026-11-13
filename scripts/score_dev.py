#!/usr/bin/env python3
"""Score the starter baseline on the 12 labeled dev episodes.

python scripts/score_dev.py
python scripts/score_dev.py --output dev_pred.json --json dev_score.json

baseline.py only looks at the evaluation window, and that window has no public
answer key. This script runs the same detect() over the dev window (hours 0-48),
writes the detections to dev_pred.json, and scores them against
data/labels/train_episodes.json with the organizers' scorer.

dev_pred.json is for scoring only. validate_submission.py rejects it because
its detections sit outside the evaluation window.

scripts/score_submission.py is an unchanged copy of scoring/score_submission.py
from https://github.com/Bluestaq/ndsu-hackathon-submissions (Apache License 2.0).
"""
import argparse
import json
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "submission"))
sys.path.insert(0, str(ROOT / "scripts"))

import baseline  # noqa: E402
from score_submission import score  # noqa: E402

DEV_START = pd.Timestamp("2026-05-04T00:00:00Z")
DEV_END = pd.Timestamp("2026-05-06T00:00:00Z")


def detect_dev(data):
    """Run baseline.detect() over the dev window."""
    # detect() reads its window from these two module globals.
    baseline.EVAL_START, baseline.EVAL_END = DEV_START, DEV_END
    return baseline.detect(data)


def short(ts):
    """'2026-05-05T19:00:00+00:00' becomes '05-05 19:00'."""
    return f"{ts[5:10]} {ts[11:16]}"


def report(result):
    print(f"{'Episode':8} {'Truth':16} {'Predicted':16} {'Tractors':9} {'Onset error':>11} {'Credit':>6}")
    for ep in result["episodes"]:
        if not ep["matched"]:
            print(f"{ep['episode']:8} {ep['truth_class']:16} MISSED")
            continue
        print(f"{ep['episode']:8} {ep['truth_class']:16} {ep['predicted_class']:16} "
              f"{','.join(ep['tractors']):9} {ep['onset_error_s'] / 60:+7.1f} min {ep['timing_credit']:6.2f}")

    false_positives = result["false_positives"]
    print(f"\nFalse positives ({len(false_positives)}):")
    for d in false_positives:
        print(f"  {short(d['start'])} to {short(d['end'])}  {d['class']:16} {','.join(d['tractors'])}")

    print(f"\n{'Class':16} {'TP':>2} {'FP':>2} {'FN':>2} {'Precision':>9} {'Recall':>6} {'F1':>5}")
    for name, m in result["class_metrics"].items():
        print(f"{name:16} {m['tp']:2} {m['fp']:2} {m['fn']:2} "
              f"{m['precision']:9.3f} {m['recall']:6.3f} {m['f1']:5.3f}")

    caught = sum(ep["correct"] for ep in result["episodes"])
    print(f"\nMacro-F1 {result['macro_f1']:.3f}, mean onset credit {result['mean_timing_credit']:.3f}")
    print(f"Diagnostic on dev: {result['diagnostic_score']:.2f}/40 "
          f"({caught} of {result['episode_count']} episodes caught, "
          f"{len(false_positives)} false positives, "
          f"{result['benign_multipath_reports']} benign multipath reports)")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--data", default=str(ROOT / "data"))
    parser.add_argument("--output", default=str(ROOT / "dev_pred.json"), help="where to write the dev detections")
    parser.add_argument("--json", dest="json_output", help="also write the full scoring result here")
    args = parser.parse_args()

    labels = Path(args.data) / "labels/train_episodes.json"
    if not labels.exists():
        sys.exit(f"{labels} not found. Run: python scripts/get_data.py")

    detections = detect_dev(args.data)
    with open(args.output, "w") as f:
        json.dump({"detections": detections}, f, indent=2)
    print(f"Wrote {len(detections)} dev detections to {args.output}\n")

    with open(labels) as f:
        key = json.load(f)
    result = score({"detections": detections}, key)
    report(result)
    if args.json_output:
        with open(args.json_output, "w") as f:
            json.dump(result, f, indent=2)


if __name__ == "__main__":
    main()
