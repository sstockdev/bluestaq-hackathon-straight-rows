#!/usr/bin/env python3
"""Regenerate the results: score the detector on dev, then write submission.json.

python make_submission.py

Writes dev_pred.json and prints the dev score against the 12 labeled episodes.
Then writes submission.json for the evaluation window and checks it with the
starter validator. Submissions are public: no email address, no student ID.
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "submission"))
sys.path.insert(0, str(ROOT / "scripts"))

from score_dev import report  # noqa: E402
from score_submission import score  # noqa: E402
from validate_submission import validate  # noqa: E402

from straightrows import config, features, pipeline  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--data", default=str(ROOT / "data"))
    parser.add_argument("--out-dir", default=str(ROOT), help="where dev_pred.json and submission.json are written")
    parser.add_argument("--github-handle", default="sstockdev")
    parser.add_argument("--repo-url", default="https://github.com/sstockdev/bluestaq-hackathon-straight-rows")
    args = parser.parse_args()
    data, out = Path(args.data), Path(args.out_dir)
    if not (data / "farm/tractor_telemetry.csv.gz").exists():
        sys.exit(f"{data} has no telemetry. Run: python scripts/get_data.py")

    f = features.build_features(data)
    candidates = pipeline.find_candidates(f)

    # Dev: two days hold more multipath passes than one submission allows, so no cap here.
    dev = pipeline.finalize(candidates, config.DEV_START, config.DEV_END, limit=None)
    (out / "dev_pred.json").write_text(json.dumps({"detections": dev}, indent=2))
    labels = json.loads((data / "labels/train_episodes.json").read_text())
    print(f"Wrote {len(dev)} dev detections to {out / 'dev_pred.json'}\n")
    report(score({"detections": dev}, labels))

    detections = pipeline.finalize(candidates, config.EVAL_START, config.EVAL_END)
    submission = {
        "participant": {"github_handle": args.github_handle},
        "repository_url": args.repo_url,
        "detections": detections,
    }
    (out / "submission.json").write_text(json.dumps(submission, indent=2))
    print(f"\nWrote {len(detections)} detections to {out / 'submission.json'}")
    problems = validate(submission)
    if problems:
        sys.exit("FAIL: " + "; ".join(problems))
    print(f"OK: {len(detections)} detection(s); submission is well-formed.")


if __name__ == "__main__":
    main()
