#!/usr/bin/env python3
"""How much does the dev result depend on each threshold?

python scripts/sensitivity.py

Scales one threshold at a time to 0.75 and 1.25 of its value, reruns the detector
on the dev window, and prints what changed. Thresholds that survive both moves sit
in a wide gap; thresholds that break show where the 12 dev episodes pin the rule.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))

from score_submission import score  # noqa: E402

from straightrows import config, data, features, pipeline  # noqa: E402

THRESHOLDS = [
    "S4_SAG_MIN", "SAG_SLOPE_DB", "SW_MIN_DROP_DB", "JAM_TRIGGER_DB", "JAM_MEMBER_DB",
    "SPOOF_XTE_M", "SPOOF_MAX_EXCESS_DB", "FAULT_GAP_DB", "FAULT_DROPOUT_FRAC", "MP_GAP_DB",
]
SCALES = [0.75, 1.25]


def dev_result(tables, labels):
    """Score the detector on dev with whatever values config holds right now."""
    f = features.derive_features(*tables)
    detections = pipeline.finalize(pipeline.find_candidates(f), config.DEV_START, config.DEV_END, limit=None)
    return score({"detections": detections}, labels)


def describe(result):
    """Episodes caught, false positives, onset credit, and which episodes went wrong."""
    wrong = [e["episode"] for e in result["episodes"] if not e["correct"]]
    late = [e["episode"] for e in result["episodes"] if e["correct"] and e["timing_credit"] < 1]
    notes = []
    if wrong:
        notes.append("missed " + ", ".join(wrong))
    if late:
        notes.append("onset credit lost on " + ", ".join(late))
    if result["false_positives"]:
        notes.append("false positives: " + ", ".join(sorted({d["class"] for d in result["false_positives"]})))
    caught = sum(e["correct"] for e in result["episodes"])
    return caught, len(result["false_positives"]), result["mean_timing_credit"], "; ".join(notes) or "no change"


def main():
    data_dir = ROOT / "data"
    tables = (data.load_telemetry(data_dir), data.load_s4(data_dir), data.load_kp(data_dir),
              data.load_rfi(data_dir), data.load_advisories(data_dir))
    labels = json.loads((data_dir / "labels/train_episodes.json").read_text())

    caught, fps, timing, _ = describe(dev_result(tables, labels))
    print(f"As configured: {caught} of 12 caught, {fps} false positives, onset credit {timing:.2f}\n")
    print("| Threshold | Value | Tried | Caught | False positives | Onset credit | What changed |")
    print("|---|---|---|---|---|---|---|")
    for name in THRESHOLDS:
        original = getattr(config, name)
        for scale in SCALES:
            setattr(config, name, original * scale)
            try:
                caught, fps, timing, notes = describe(dev_result(tables, labels))
            finally:
                setattr(config, name, original)
            print(f"| `{name}` | {original:g} | {original * scale:g} | {caught} of 12 | {fps} | {timing:.2f} | {notes} |", flush=True)


if __name__ == "__main__":
    main()
