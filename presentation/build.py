#!/usr/bin/env python3
"""Build presentation/index.html: an explorer for the 12 labeled dev episodes.

python presentation/build.py

The page is a viewer over the solution's feature frame. It is not part of the
detector, and nothing in straightrows/ depends on it.
"""
import json
import math
import sys
from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT))

from straightrows import config, features  # noqa: E402

MAX_POINTS = 1200
TRACTORS = list(config.TRACTORS)


def window_for(start, end, cls):
    """The stretch of time to draw: the episode plus some healthy time on each side."""
    duration = (end - start).total_seconds()
    pad = 90 if cls == "MULTIPATH" else min(max(600, 0.25 * duration), 2700)
    return start - pd.Timedelta(seconds=pad), end + pd.Timedelta(seconds=pad)


def values(series, digits=2):
    return [None if pd.isna(v) else round(float(v), digits) for v in series]


def distance_km(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = (math.sin((p2 - p1) / 2) ** 2
         + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2)
    return 2 * 6371.0 * math.asin(math.sqrt(a))


def hhmm(ts, seconds=False):
    return ts.strftime("%H:%M:%S" if seconds else "%H:%M")


def story(f, label, start, end):
    """One or two plain sentences built from the measured numbers."""
    last = end - pd.Timedelta(seconds=1)
    cls, tractors = label["class"], label["tractors"]
    drop = f.drop.loc[start:last].median()
    excess = f.excess.loc[start:last].median()
    s4, sag = f.s4.loc[start:last].median(), f.sag.loc[start:last].median()
    per = lambda s: "/".join(f"{s[t]:.0f}" for t in TRACTORS)

    if cls == "SPACE_WEATHER":
        return (f"From {hhmm(start)} to {hhmm(end)} all three tractors sat about {drop.mean():.0f} dB below normal. "
                f"S4 was {s4:.2f}, which predicts {sag:.0f} dB, so the sky accounts for the whole loss.")
    if cls == "JAMMING":
        reports = f.rfi[(f.rfi.ts >= start) & (f.rfi.ts <= start + pd.Timedelta(seconds=config.RFI_MAX_DELAY_S))]
        if len(reports):
            r = reports.iloc[0]
            km = distance_km(*f.farm_center, r.centerLat, r.centerLon)
            rfi = f" {r.id} arrived {(r.ts - start).total_seconds() / 60:.0f} min later, {km:.1f} km from the farm."
        else:
            rfi = " No interference report arrived."
        return (f"At {hhmm(start, True)} T1/T2/T3 dropped {per(drop)} dB. S4 was {s4:.2f}, which explains {sag:.0f} dB. "
                f"That leaves {per(excess)} dB with no sky cause.{rfi}")
    tractor = tractors[0]
    if cls == "SPOOFING":
        xte = f.xte[tractor].loc[start:last]
        minutes = (end - start).total_seconds() / 60
        return (f"{tractor} drifted off its line at about {xte.iloc[-60:].median() / minutes:.2f} m per minute and reached "
                f"{xte.iloc[-60:].median():.1f} m. Its signal stayed within {abs(excess[tractor]):.1f} dB of what the sky predicts.")
    if cls == "EQUIPMENT_FAULT":
        link_down = 1 - f.link_ok[tractor].loc[start:last].mean()
        if link_down > 0.05:
            return (f"{tractor}'s correction link was down {link_down:.0%} of the time, in short bursts. "
                    f"Its signal strength did not change, and the other tractors kept their link.")
        dropout = (f.gap.loc[start:last] >= config.FAULT_GAP_DB).mean()
        others = max(dropout[t] for t in TRACTORS if t != tractor)
        return (f"{tractor}'s weakest satellite sat {config.FAULT_GAP_DB:.0f} dB or more below its average {dropout[tractor]:.0%} of the time. "
                f"The other tractors did that {others:.0%} of the time. Its average signal held at {f.cn0[tractor].loc[start:last].median():.0f} dB-Hz.")
    before = f.min_cn0[tractor].loc[start - pd.Timedelta(seconds=60):start - pd.Timedelta(seconds=5)].median()
    during = f.min_cn0[tractor].loc[start:last].median()
    return (f"{tractor}'s weakest satellite fell from about {before:.0f} to {during:.0f} dB-Hz for {(end - start).total_seconds():.0f} s "
            f"at the north headland, then recovered. Its average signal held at {f.cn0[tractor].loc[start:last].median():.0f} dB-Hz.")


def episode(f, label):
    start, end = pd.Timestamp(label["start"]), pd.Timestamp(label["end"])
    a, b = window_for(start, end, label["class"])
    step = max(1, math.ceil((b - a).total_seconds() / MAX_POINTS))
    cut = lambda frame: frame.loc[a:b]
    rule = f"{step}s"
    mid = lambda frame: cut(frame).resample(rule).median()
    low = lambda frame: cut(frame).resample(rule).min()
    share = lambda frame: cut(frame).astype(float).resample(rule).mean()

    cn0, min_cn0, drop, excess = mid(f.cn0), low(f.min_cn0), mid(f.drop), mid(f.excess)
    xte, gap, sats = mid(f.xte), mid(f.gap), low(f.num_sats)
    work, link = share(f.working), share(f.link_ok)
    index = cn0.index
    reports = f.rfi[(f.rfi.ts >= a) & (f.rfi.ts <= b)] if len(f.rfi) else f.rfi

    return {
        "id": label["id"], "cls": label["class"], "action": label["recommended_action"],
        "tractors": label["tractors"], "start": start.timestamp(), "end": end.timestamp(),
        "t0": index[0].timestamp(), "step": step, "n": len(index),
        "baseline": {t: round(float(f.baseline[t]), 1) for t in TRACTORS},
        "series": {
            t: {"cn0": values(cn0[t]), "min": values(min_cn0[t]), "drop": values(drop[t]),
                "excess": values(excess[t]), "xte": values(xte[t]), "gap": values(gap[t]),
                "sats": values(sats[t], 0), "work": values(work[t]), "link": values(link[t])}
            for t in TRACTORS
        },
        "s4": values(f.s4.loc[a:b].resample(rule).last(), 3),
        "sag": values(f.sag.loc[a:b].resample(rule).last()),
        "kp": values(f.kp.loc[a:b].resample(rule).last(), 1),
        "rfi": [{"id": r.id, "t": r.ts.timestamp(), "confidence": r.confidence,
                 "km": round(distance_km(*f.farm_center, r.centerLat, r.centerLon), 1)}
                for r in reports.itertuples()],
        "story": story(f, label, start, end),
    }


def main():
    f = features.build_features(ROOT / "data")
    labels = json.loads((ROOT / "data/labels/train_episodes.json").read_text())["episodes"]
    payload = {
        "episodes": [episode(f, label) for label in labels],
        "thresholds": {
            "sagMin": config.S4_SAG_MIN, "jamTrigger": config.JAM_TRIGGER_DB, "jamMember": config.JAM_MEMBER_DB,
            "spoofXte": config.SPOOF_XTE_M, "mpGap": config.MP_GAP_DB, "faultGap": config.FAULT_GAP_DB,
            "sagIntercept": config.SAG_INTERCEPT_DB, "sagSlope": config.SAG_SLOPE_DB,
        },
    }
    page = (HERE / "template.html").read_text().replace("__DATA__", json.dumps(payload, separators=(",", ":")))
    out = HERE / "index.html"
    out.write_text(page)
    print(f"Wrote {out} ({out.stat().st_size / 1e6:.1f} MB, {len(payload['episodes'])} episodes)")


if __name__ == "__main__":
    main()
