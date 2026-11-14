"""Run every detector and turn the candidates into submission detections."""
import pandas as pd

from . import config, detectors, evidence, features

DETECTORS = (
    detectors.detect_space_weather,
    detectors.detect_jamming,
    detectors.detect_spoofing,
    detectors.detect_equipment_fault,
    detectors.detect_multipath,
)


def find_candidates(f):
    """Every candidate from every detector, over the whole file."""
    found = []
    for detect in DETECTORS:
        found += detect(f)
    return found


def _merge_overlaps(cands):
    """Join candidates of the same class and the same tractors whose intervals overlap.

    Two such candidates are one event seen twice, and the scorer would count the
    second as a false positive. The merged candidate keeps the facts of the longer one.
    """
    merged = []
    for c in sorted(cands, key=lambda c: (c.cls, c.tractors, c.start)):
        last = merged[-1] if merged else None
        if last and last.cls == c.cls and last.tractors == c.tractors and c.start < last.end:
            longer = max(last, c, key=lambda x: x.end - x.start)
            merged[-1] = detectors.Candidate(c.cls, last.start, max(last.end, c.end), c.tractors, longer.facts)
        else:
            merged.append(c)
    return merged


def finalize(cands, start, end, limit=config.MAX_DETECTIONS):
    """Merge duplicates, clip to the window [start, end), order, cap, and format.

    Every non-multipath detection is kept. Multipath reports fill what is left of
    `limit` in time order. Pass limit=None to skip the cap.
    """
    start, end = pd.Timestamp(start), pd.Timestamp(end)
    inside = []
    for c in _merge_overlaps(cands):
        if c.end <= start or c.start >= end:
            continue
        inside.append(detectors.Candidate(c.cls, max(c.start, start), min(c.end, end), c.tractors, c.facts))

    others = sorted((c for c in inside if c.cls != "MULTIPATH"), key=lambda c: c.start)
    multipath = sorted((c for c in inside if c.cls == "MULTIPATH"), key=lambda c: c.start)
    ordered = others + multipath
    if limit is not None and len(ordered) > limit:
        print(f"Dropped {len(ordered) - limit} multipath reports to stay within {limit} detections.")
        ordered = ordered[:limit]

    return [{
        "start": c.start.isoformat(),
        "end": c.end.isoformat(),
        "tractors": c.tractors,
        "class": c.cls,
        "action": config.ACTION[c.cls],
        "confidence": evidence.confidence(c),
        "evidence": evidence.evidence(c),
    } for c in ordered]


def run(data_dir, start, end, limit=config.MAX_DETECTIONS):
    """Detections for one window, straight from the data directory."""
    f = features.build_features(data_dir)
    return finalize(find_candidates(f), start, end, limit)
