#!/usr/bin/env python3
"""Write the JSON files the map app reads from app/public/data/.

python app/tools/export_data.py

Three kinds of file come out, in the shapes app/src/data/types.ts defines:

  index.json                   the days, the field, the thresholds, the rules, the dev scoreboard, the decisions
  day-YYYY-MM-DD.json          one UTC day: a track per tractor every 5 s, the sky, and what was detected
  episode-<detection id>.json  finer samples around one detection that is not multipath

The script reads the detector in straightrows/ and changes nothing in it.
"""
import json
import math
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "app" / "public" / "data"
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))
sys.path.insert(0, str(ROOT / "submission"))

import baseline  # noqa: E402
import score_dev  # noqa: E402
from score_submission import score  # noqa: E402

from straightrows import config, evidence, features, pipeline  # noqa: E402
from straightrows.detectors import Candidate  # noqa: E402
from straightrows.intervals import ONE_SECOND, runs  # noqa: E402

TRACTORS = list(config.TRACTORS)
STEP_S = 5                    # seconds between samples in a day's tracks
MAX_POINTS = 1200             # samples in one episode file, at most
ONE_DAY = pd.Timedelta(days=1)
FIX_CODE = {"RTK_FIXED": 0, "RTK_FLOAT": 1, "DGPS": 2, "AUTONOMOUS": 3, "NO_FIX": 4}   # best to worst
CAUSE_ORDER = ["SPACE_WEATHER", "JAMMING", "SPOOFING", "EQUIPMENT_FAULT", "MULTIPATH"]  # Track.cause stores this index
CAUSE_PRIORITY = ["SPACE_WEATHER", "EQUIPMENT_FAULT", "JAMMING", "SPOOFING"]            # painted in this order, so the last wins


def epoch(ts):
    """UTC epoch seconds as a whole number."""
    return round(pd.Timestamp(ts).timestamp())


def values(series, digits=2):
    """A column as a plain list of rounded numbers, with None where a value is missing."""
    return [None if pd.isna(v) else round(float(v), digits) for v in series]


def whole(series):
    """A column as a plain list of whole numbers."""
    return [int(v) for v in series]


def hhmm(ts, seconds=False):
    return ts.strftime("%H:%M:%S" if seconds else "%H:%M")


def distance_km(lat1, lon1, lat2, lon2):
    """Great-circle distance between two points."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = (math.sin((p2 - p1) / 2) ** 2
         + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2)
    return 2 * 6371.0 * math.asin(math.sqrt(a))


def window_for(start, end):
    """The stretch of time an episode file covers: the detection plus some healthy time on each side."""
    duration = (end - start).total_seconds()
    pad = min(max(600, 0.25 * duration), 2700)
    return start - pd.Timedelta(seconds=pad), end + pd.Timedelta(seconds=pad)


def overlapping(items, a, b):
    """The labels or baseline detections that overlap [a, b)."""
    return [d for d in items if pd.Timestamp(d["start"]) < b and pd.Timestamp(d["end"]) > a]


def label_for(cls, tractors, start, end, labels):
    """The dev label a detection stands for: same class, a shared tractor, overlapping time."""
    start, end = pd.Timestamp(start), pd.Timestamp(end)
    for label in labels:
        if (label["class"] == cls and set(label["tractors"]) & set(tractors)
                and start < pd.Timestamp(label["end"]) and end > pd.Timestamp(label["start"])):
            return label["id"]
    return None


def steps(c):
    """How the detector reached this candidate, in order, with its measured numbers."""
    facts, span = c.facts, f"{hhmm(c.start, True)} to {hhmm(c.end, True)}"
    per = lambda values: ", ".join(f"{t} {v}" for t, v in values.items())
    if c.cls == "SPACE_WEATHER":
        # The same test the confidence uses: is the middle tractor's drop close to what the sky predicts?
        beyond = pd.Series(facts["drop_db"]).median() - facts["expected_sag_db"]
        fit = ("Nothing is left over." if abs(beyond) <= config.CONF_SAG_MATCH_DB
               else f"That is about {beyond:.1f} dB more than predicted, so the sky does not account for all of it." if beyond > 0
               else f"That is about {-beyond:.1f} dB less than predicted, so the prediction does not fit this stretch.")
        return [
            f"Found a stretch where every working tractor is at least {config.SW_MIN_DROP_DB:.0f} dB below normal: {span}. Parked seconds are ignored.",
            f"Checked the sky. S4 over the stretch is {facts['s4_median']}, at or above {config.S4_SAG_MIN}, so the sky can cause a sag.",
            f"The sky predicts {facts['expected_sag_db']} dB. The tractors lost {per(facts['drop_db'])} dB. {fit}",
            f"Result: space weather on {', '.join(c.tractors)}.",
        ]
    if c.cls == "JAMMING" or facts.get("kind") == "signal_loss":
        report = facts["rfi"]
        rfi = (f"{report['id']} arrived {report['delay_min']} min after the start, {report['distance_km']} km from the farm. That supports jamming."
               if report else "No interference report arrived. Reports are often missing, so that counts for nothing.")
        verdict = (f"{len(c.tractors)} tractors qualify, so this is jamming on {', '.join(c.tractors)}." if c.cls == "JAMMING"
                   else f"Only {c.tractors[0]} qualifies. One machine alone could be its own hardware, so this is reported as an equipment fault.")
        return [
            f"Found a stretch where some working tractor has at least {config.JAM_TRIGGER_DB:.0f} dB of unexplained loss: {span}.",
            f"The sky explains {facts['expected_sag_db']} dB here (S4 {facts['s4_median']}). Median unexplained loss per tractor: {per(facts['excess_db'])} dB.",
            f"Kept the tractors at or above {config.JAM_MEMBER_DB} dB. {verdict}",
            rfi,
        ]
    if c.cls == "SPOOFING":
        t, trigger = c.tractors[0], pd.Timestamp(facts["trigger_time"])
        onset = (f"The drift climbs steadily, so it was walked back to where it began: about {hhmm(c.start, True)}, at {facts['xte_rate_m_per_min']} m per minute."
                 if facts["onset_method"] == "extrapolated" else "The drift never doubled, so the trigger time is used as the start.")
        storm = " This is inside a storm, so every machine's guidance is noisier and the confidence will be lower." if facts["in_storm"] else ""
        return [
            f"Compared each tractor's cross-track error with the other two. {t} became at least {config.SPOOF_XTE_M:.0f} m worse at {hhmm(trigger, True)} and reached {facts['xte_max_m']} m. The others sat at {facts['others_xte_m']} m.",
            f"Checked {t}'s signal. Its unexplained loss is {facts['excess_db']} dB, under {config.SPOOF_MAX_EXCESS_DB:.0f} dB, so the signal is healthy. A jammed tractor would fail this check.",
            onset,
            f"Result: spoofing on {t}, {span}.{storm}",
        ]
    if c.cls == "EQUIPMENT_FAULT" and facts.get("kind") == "antenna":
        t = c.tractors[0]
        return [
            f"Counted dropout seconds on each tractor: seconds where the weakest satellite is at least {config.FAULT_GAP_DB:.0f} dB below the average signal.",
            f"Over {span}, {t} had dropouts {facts['dropout_frac']:.0%} of the time. The limit is {config.FAULT_DROPOUT_FRAC:.0%}. The other tractors had at most {facts['neighbor_dropout_frac']:.0%}.",
            f"{t}'s average signal held at {facts['cn0_median']} dB-Hz while its satellite count dipped to {facts['sats_min']}. A healthy average with a failing weakest signal, on one machine only, points at that machine's antenna.",
            f"Result: equipment fault (antenna) on {t}. The start is blurred by about a minute because dropouts are counted over a {config.FAULT_WINDOW_S // 60}-minute window.",
        ]
    if c.cls == "EQUIPMENT_FAULT" and facts.get("kind") == "link":
        t = c.tractors[0]
        return [
            f"Found {t}'s correction link dropping in and out over {span}. It was down {facts['link_down_frac']:.0%} of the time, in bursts closer together than {config.LINK_MERGE_GAP_S // 60} minutes.",
            f"{t}'s signal strength stayed at {facts['cn0_median']} dB-Hz, and it fell out of RTK fixed {facts['float_frac']:.0%} of the time. The satellites are fine; the corrections are not arriving.",
            f"Result: equipment fault (correction link) on {t}. The other machines can keep working.",
        ]
    return [f"Found {span} on {', '.join(c.tractors)}."]


def summary(result):
    """The scorer's result, trimmed to what the scoreboard draws."""
    return {
        "diagnostic": round(result["diagnostic_score"], 2), "macroF1": round(result["macro_f1"], 3),
        "timing": round(result["mean_timing_credit"], 3),
        "caught": sum(e["correct"] for e in result["episodes"]), "total": result["episode_count"],
        "falsePositives": len(result["false_positives"]),
        "f1": {name: round(m["f1"], 3) for name, m in result["class_metrics"].items()},
        "episodes": {e["episode"]: {"predicted": e.get("predicted_class"), "onset_s": e.get("onset_error_s"),
                                    "correct": e["correct"]} for e in result["episodes"]},
    }


def baseline_detections(data_dir):
    """The starter baseline's detections over the dev days and over the eval day."""
    eval_window = baseline.EVAL_START, baseline.EVAL_END
    on_eval = baseline.detect(data_dir)
    on_dev = score_dev.detect_dev(data_dir, "baseline")     # this points the baseline at the dev window
    baseline.EVAL_START, baseline.EVAL_END = eval_window
    return on_dev, on_eval


def detection_id(c):
    """A stable id built from the unclipped start, such as d0506-0212-JAMMING-T1T2T3."""
    return f"d{c.start:%m%d-%H%M}-{c.cls}-{''.join(c.tractors)}"


def detection(c, a, b, labels):
    """One candidate as the app's Detection, clipped to the day [a, b) the way pipeline.finalize() clips."""
    clipped = Candidate(c.cls, max(c.start, a), min(c.end, b), c.tractors, c.facts)
    return {
        "id": detection_id(c), "cls": c.cls, "kind": c.facts.get("kind"),
        "start": epoch(clipped.start), "end": epoch(clipped.end), "tractors": c.tractors,
        "action": config.ACTION[c.cls], "confidence": evidence.confidence(clipped),
        "terms": [[reason, weight] for reason, weight in evidence.confidence_terms(clipped)],
        "evidence": evidence.evidence(clipped), "steps": steps(clipped),
        "label": label_for(c.cls, c.tractors, c.start, c.end, labels),
    }


def cause_track(times, tractor, found):
    """The index in CAUSE_ORDER of the cause reported on this tractor at each sample time, or -1."""
    cause = pd.Series(-1, index=times)
    for cls in CAUSE_PRIORITY:
        for c in found:
            if c.cls == cls and tractor in c.tractors:
                cause.loc[c.start:c.end - ONE_SECOND] = CAUSE_ORDER.index(cls)
    return whole(cause)


def track(f, tractor, a, b, found):
    """One tractor's day, one sample every STEP_S seconds."""
    bins = lambda frame: frame[tractor].loc[a:b - ONE_SECOND].resample(f"{STEP_S}s")
    lon = bins(f.lon).first()
    return {
        "lon": values(lon, 6), "lat": values(bins(f.lat).first(), 6),
        "working": whole(bins(f.working).mean() > 0.5),
        "cn0": values(bins(f.cn0).median(), 1), "drop": values(bins(f.drop).median(), 1),
        "excess": values(bins(f.excess).median(), 1), "xte": values(bins(f.xte).median(), 2),
        "gap": values(bins(f.gap).max(), 1), "link": values(bins(f.link_ok).mean(), 2),
        "fix": whole(f.fix_state[tractor].loc[a:b - ONE_SECOND].map(FIX_CODE).resample(f"{STEP_S}s").max()),
        "cause": cause_track(lon.index, tractor, found),
    }


def feed(series, every_s, digits, a, b):
    """[epoch seconds, value] pairs from a sky feed, one every `every_s` seconds of the day."""
    picked = series.loc[a:b - ONE_SECOND].iloc[::every_s].dropna()
    return [[epoch(t), round(float(v), digits)] for t, v in picked.items()]


def multipath(cands, a, b):
    """Each tractor's multipath passes that start on this day, with its first pass as the example."""
    out = {"spotLat": {}, "passes": {}, "example": {}}
    for t in TRACTORS:
        passes = sorted((c for c in cands if c.cls == "MULTIPATH" and c.tractors == [t] and a <= c.start < b),
                        key=lambda c: c.start)
        first = passes[0] if passes else None
        out["spotLat"][t] = first.facts["spot_lat"] if first else None
        out["passes"][t] = [[epoch(c.start), epoch(c.end)] for c in passes]
        out["example"][t] = {"confidence": evidence.confidence(first), "evidence": evidence.evidence(first)} if first else None
    return out


def block(item, a, b, **extra):
    """A label or a baseline detection as a timeline block, clipped to the day [a, b)."""
    return {**extra, "cls": item["class"], "start": epoch(max(pd.Timestamp(item["start"]), a)),
            "end": epoch(min(pd.Timestamp(item["end"]), b)), "tractors": item["tractors"]}


def baseline_blocks(items, a, b, labels, false_positives):
    """The baseline's detections on one day. On a dev day, `wrong` marks the scorer's false positives."""
    blocks = []
    for d in overlapping(items, a, b):
        made = block(d, a, b, id=label_for(d["class"], d["tractors"], d["start"], d["end"], labels))
        if false_positives is not None:
            made["wrong"] = d in false_positives
        blocks.append(made)
    return blocks


def reports(f, a, b):
    """Interference reports whose time falls on this day, with their distance from the field."""
    rfi = f.rfi[(f.rfi.ts >= a) & (f.rfi.ts < b)] if len(f.rfi) else f.rfi
    return [{"id": r.id, "t": epoch(r.ts), "lat": float(r.centerLat), "lon": float(r.centerLon),
             "semiMajorKm": float(r.semiMajor_km), "semiMinorKm": float(r.semiMinor_km),
             "confidence": float(r.confidence), "text": r.text,
             "km": round(distance_km(*f.farm_center, r.centerLat, r.centerLon), 2)}
            for r in rfi.itertuples()]


def advisories(f, a, b):
    """Constellation advisories whose time falls on this day."""
    adv = f.advisories[(f.advisories.ts >= a) & (f.advisories.ts < b)] if len(f.advisories) else f.advisories
    return [{"id": r.id, "t": epoch(r.ts), "type": r.type, "text": r.text} for r in adv.itertuples()]


def day_file(f, a, kind, cands, labels, baseline_items, false_positives):
    """Everything the app draws for the UTC day that starts at `a`."""
    b = a + ONE_DAY
    found = sorted((c for c in cands if c.cls != "MULTIPATH" and c.start < b and c.end > a), key=lambda c: c.start)
    tracks = {t: track(f, t, a, b, found) for t in TRACTORS}
    return {
        "date": f"{a:%Y-%m-%d}", "kind": kind, "t0": epoch(a), "step": STEP_S, "n": len(tracks[TRACTORS[0]]["lon"]),
        "tractors": tracks,
        "sky": {"s4": feed(f.s4, 900, 3, a, b), "kp": feed(f.kp, 10800, 1, a, b)},
        "working": [[epoch(s), epoch(e)] for s, e in runs(f.working.any(axis=1).loc[a:b - ONE_SECOND])],
        "detections": [detection(c, a, b, labels) for c in found],
        "multipath": multipath(cands, a, b),
        "baseline": baseline_blocks(baseline_items, a, b, labels, false_positives),
        "labels": [block(d, a, b, id=d["id"]) for d in overlapping(labels, a, b)],
        "reports": reports(f, a, b),
        "advisories": advisories(f, a, b),
    }


def episode(f, c, dropout_share):
    """Finer samples around one detection, at most about MAX_POINTS of them."""
    a, b = window_for(c.start, c.end)
    step = max(1, math.ceil((b - a).total_seconds() / MAX_POINTS))
    bins = lambda frame: frame.loc[a:b].resample(f"{step}s")
    cn0, drop, excess, xte = (bins(frame).median() for frame in (f.cn0, f.drop, f.excess, f.xte))
    gap, dropout, link = bins(f.gap).max(), bins(dropout_share).median(), bins(f.link_ok).mean()
    return {
        "id": detection_id(c), "t0": epoch(cn0.index[0]), "step": step, "n": len(cn0),
        "start": epoch(c.start), "end": epoch(c.end),
        "normal": {t: round(float(f.baseline[t]), 1) for t in TRACTORS},
        "series": {
            t: {"cn0": values(cn0[t]), "drop": values(drop[t]), "excess": values(excess[t]), "xte": values(xte[t]),
                "gap": values(gap[t]), "dropout": values(dropout[t], 3), "link": values(link[t])}
            for t in TRACTORS
        },
        "s4": values(bins(f.s4).last(), 3), "sag": values(bins(f.sag).last()), "kp": values(bins(f.kp).last(), 1),
    }


def field(f):
    """The middle of the field as [lon, lat] and its [west, south, east, north] box while working."""
    lat, lon = f.lat[f.working], f.lon[f.working]
    box = [lon.min().min(), lat.min().min(), lon.max().max(), lat.max().max()]
    return {"center": [round(f.farm_center[1], 6), round(f.farm_center[0], 6)],
            "bounds": [round(float(v), 5) for v in box]}


def thresholds():
    """The detector's thresholds the app draws as reference lines."""
    return {
        "sagMin": config.S4_SAG_MIN, "sagIntercept": config.SAG_INTERCEPT_DB, "sagSlope": config.SAG_SLOPE_DB,
        "swMinDrop": config.SW_MIN_DROP_DB, "jamTrigger": config.JAM_TRIGGER_DB, "jamMember": config.JAM_MEMBER_DB,
        "spoofXte": config.SPOOF_XTE_M, "spoofMaxExcess": config.SPOOF_MAX_EXCESS_DB,
        "faultGap": config.FAULT_GAP_DB, "faultFrac": config.FAULT_DROPOUT_FRAC, "mpGap": config.MP_GAP_DB,
    }


def rules():
    """The windows, limits, and confidence weights the How panel prints, so the app copies no number by hand."""
    def event(merge_gap_s, min_s):
        return {"mergeGapS": merge_gap_s, "minS": min_s}
    return {
        "workingSpeed": config.WORKING_SPEED_MPS, "smoothS": config.SMOOTH_CN0_S, "maxDetections": config.MAX_DETECTIONS,
        "events": {
            "spaceWeather": event(config.SW_MERGE_GAP_S, config.SW_MIN_DURATION_S),
            "jamming": event(config.JAM_MERGE_GAP_S, config.JAM_MIN_DURATION_S),
            "spoofing": event(config.SPOOF_MERGE_GAP_S, config.SPOOF_MIN_DURATION_S),
            "antenna": event(config.FAULT_MERGE_GAP_S, config.FAULT_MIN_DURATION_S),
            "link": event(config.LINK_MERGE_GAP_S, config.LINK_MIN_DURATION_S),
        },
        "gradedSpread": config.GRADED_SPREAD_DB, "rfiMaxDelayS": config.RFI_MAX_DELAY_S,
        "spoofSmoothS": config.SPOOF_SMOOTH_S, "faultWindowS": config.FAULT_WINDOW_S,
        "multipath": {"minS": config.MP_MIN_S, "maxS": config.MP_MAX_S, "minRecur": config.MP_MIN_RECUR},
        "confidence": {
            "base": config.CONF_BASE, "min": config.CONF_MIN, "max": config.CONF_MAX,
            "noS4Cap": config.CONF_NO_S4_CAP, "singleLossCap": config.CONF_SINGLE_MACHINE_LOSS_CAP,
            "sagMatchDb": config.CONF_SAG_MATCH_DB, "uniformDb": config.CONF_UNIFORM_DB,
            "strongRfi": config.CONF_STRONG_RFI, "healthySignalDb": config.CONF_HEALTHY_SIGNAL_DB,
            "neighborDropout": config.CONF_NEIGHBOR_DROPOUT, "terms": config.CONF_TERMS,
        },
    }


def write(name, payload):
    """Write one JSON file and print its size. json refuses NaN here, so none can reach the app."""
    path = OUT / name
    path.write_text(json.dumps(payload, separators=(",", ":"), allow_nan=False))
    print(f"{path.relative_to(ROOT)}  {path.stat().st_size / 1e3:,.1f} kB")


def main():
    data_dir = ROOT / "data"
    f = features.build_features(data_dir)
    labels = json.loads((data_dir / "labels/train_episodes.json").read_text())["episodes"]
    found = pipeline.find_candidates(f)
    cands = pipeline._merge_overlaps(found)

    ours = pipeline.finalize(found, config.DEV_START, config.DEV_END, limit=None)
    baseline_dev, baseline_eval = baseline_detections(str(data_dir))
    ours_result = score({"detections": ours}, {"episodes": labels})
    baseline_result = score({"detections": baseline_dev}, {"episodes": labels})

    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("episode-*.json"):      # a detection that no longer exists must not leave its file behind
        old.unlink()

    days = []
    for a in pd.date_range(config.DEV_START, config.EVAL_END, freq="1D", inclusive="left"):
        dev = a < pd.Timestamp(config.DEV_END)
        kind = "dev" if dev else "eval"
        days.append({"date": f"{a:%Y-%m-%d}", "label": f"{a:%B} {a.day}", "kind": kind, "t0": epoch(a)})
        write(f"day-{a:%Y-%m-%d}.json",
              day_file(f, a, kind, cands, labels, baseline_dev if dev else baseline_eval,
                       baseline_result["false_positives"] if dev else None))

    write("index.json", {
        "days": days, "field": field(f), "thresholds": thresholds(), "rules": rules(),
        "score": {"ours": summary(ours_result), "baseline": summary(baseline_result)},
        "decisions": json.loads((ROOT / "decisions.json").read_text()),
    })

    dropout_seconds = ((f.gap >= config.FAULT_GAP_DB) & f.working).astype(float)
    dropout_share = dropout_seconds.rolling(config.FAULT_WINDOW_S, center=True, min_periods=1).mean()
    for c in sorted((c for c in cands if c.cls != "MULTIPATH"), key=lambda c: c.start):
        write(f"episode-{detection_id(c)}.json", episode(f, c, dropout_share))


if __name__ == "__main__":
    main()
