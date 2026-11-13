"""One detector per cause.

Each detector reads the Features frame, scans the whole file, and returns
Candidate intervals. Detectors do not know about each other, so causes can
overlap: a storm and a jammer inside it come back as two candidates.
"""
import math
from dataclasses import dataclass

import pandas as pd

from . import config
from .intervals import ONE_SECOND, runs

FIX_ORDER = ["RTK_FIXED", "RTK_FLOAT", "DGPS", "AUTONOMOUS", "NO_FIX"]   # best to worst


@dataclass
class Candidate:
    cls: str                # one of the five class names
    start: pd.Timestamp
    end: pd.Timestamp       # exclusive: the last flagged second plus one
    tractors: list          # sorted tractor ids
    facts: dict             # measured numbers; confidence and evidence read only this


def _span(data, start, end):
    """Rows from start up to, but not including, end."""
    return data.loc[start:end - ONE_SECOND]


def _rounded(series, digits=1):
    return {name: round(float(value), digits) for name, value in series.items()}


def _number(value, digits=2):
    return None if pd.isna(value) else round(float(value), digits)


def _sky_facts(f, start, end):
    """What the sky feeds said during an interval."""
    s4 = _span(f.s4, start, end)
    return {
        "s4_median": _number(s4.median()),
        "s4_max": _number(s4.max()),
        "s4_available": bool(s4.isna().mean() <= 0.5),
        "expected_sag_db": _number(_span(f.sag, start, end).median(), 1),
        "kp_max": _number(_span(f.kp, start, end).max(), 1),
    }


def _worst_fix(f, start, end, tractors):
    """The worst fix state each tractor reached during an interval."""
    states = _span(f.fix_state, start, end)
    return {t: max(states[t].unique(), key=FIX_ORDER.index) for t in tractors}


def _distance_km(lat1, lon1, lat2, lon2):
    """Great-circle distance between two points."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = (math.sin((p2 - p1) / 2) ** 2
         + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2)
    return 2 * 6371.0 * math.asin(math.sqrt(a))


def _matching_rfi(f, start):
    """The earliest interference report that could belong to an episode starting at `start`.

    A report matches when it arrives within RFI_MAX_DELAY_S after the start and its
    uncertainty ellipse could cover the farm (center within the semi-major length).
    """
    if len(f.rfi) == 0:
        return None
    delay_s = (f.rfi.ts - start).dt.total_seconds()
    for report, delay in zip(f.rfi.itertuples(), delay_s):
        km = _distance_km(*f.farm_center, report.centerLat, report.centerLon)
        if 0 <= delay <= config.RFI_MAX_DELAY_S and km <= report.semiMajor_km:
            return {"id": report.id, "ts": report.ts.isoformat(), "delay_min": round(delay / 60, 1),
                    "distance_km": round(km, 2), "confidence": float(report.confidence)}
    return None


def _storm_advisory(f, end):
    """The latest space weather advisory issued before `end`, or None."""
    if len(f.advisories) == 0:
        return None
    issued = f.advisories[(f.advisories.type == "SPACE_WEATHER") & (f.advisories.ts <= end)]
    return None if issued.empty else issued.iloc[-1].id


def detect_space_weather(f):
    """Every working tractor sags together, and S4 is high enough to explain it."""
    working_drop = f.drop.where(f.working)                       # NaN while parked
    all_sagging = working_drop.min(axis=1) >= config.SW_MIN_DROP_DB
    found = []
    for start, end in runs(all_sagging, config.SW_MERGE_GAP_S, config.SW_MIN_DURATION_S):
        sky = _sky_facts(f, start, end)
        if sky["s4_median"] is None or sky["s4_median"] < config.S4_SAG_MIN:
            continue                                             # the sky does not explain this one
        tractors = sorted(t for t in f.working.columns if _span(f.working[t], start, end).mean() > 0.5)
        drop = _span(working_drop, start, end)[tractors].median()
        found.append(Candidate("SPACE_WEATHER", start, end, tractors, {
            **sky,
            "drop_db": _rounded(drop),
            "spread_db": round(float(drop.max() - drop.min()), 1),
            "advisory_id": _storm_advisory(f, end),
        }))
    return found


def detect_jamming(f):
    """Signal loss on working tractors that S4 does not explain.

    Two or more affected tractors make a JAMMING candidate. A single affected
    tractor is reported as an EQUIPMENT_FAULT of kind "signal_loss": one machine
    alone cannot tell a nearby jammer from its own hardware.
    """
    working_excess = f.excess.where(f.working)
    triggered = working_excess.max(axis=1) >= config.JAM_TRIGGER_DB
    found = []
    for start, end in runs(triggered, config.JAM_MERGE_GAP_S, config.JAM_MIN_DURATION_S):
        excess = _span(working_excess, start, end).median().dropna()   # one number per working tractor
        members = sorted(t for t, value in excess.items() if value >= config.JAM_MEMBER_DB)
        if not members:
            members = [excess.idxmax()]
        facts = {
            **_sky_facts(f, start, end),
            "excess_db": _rounded(excess),
            "drop_db": _rounded(_span(f.drop, start, end)[list(excess.index)].median()),
            "spread_db": round(float(excess.max() - excess.min()), 1),
            "worst_fix": _worst_fix(f, start, end, members),
            "rfi": _matching_rfi(f, start),
        }
        if len(members) >= 2:
            found.append(Candidate("JAMMING", start, end, members, facts))
        else:
            found.append(Candidate("EQUIPMENT_FAULT", start, end, members, {**facts, "kind": "signal_loss"}))
    return found
