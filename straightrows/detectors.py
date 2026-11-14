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


def _work_start(f, tractor, moment):
    """The first second of the working stretch that contains `moment`."""
    before = f.working[tractor].loc[:moment]
    parked = before.index[~before.to_numpy()]
    return before.index[0] if len(parked) == 0 else parked[-1] + ONE_SECOND


def ramp_onset(rel, trigger):
    """Estimate when a steady drift began.

    `rel` crossed SPOOF_XTE_M at `trigger`. A drift that climbs at a constant
    rate and later reaches twice that level at t2 took as long to get from zero
    to the trigger as it took from the trigger to t2, so it began near
    trigger - (t2 - trigger). If it never doubles, the trigger time is the best
    estimate available.
    """
    later = rel.loc[trigger:]
    doubled = later[later >= 2 * config.SPOOF_XTE_M]
    if doubled.empty:
        return trigger, "trigger"
    return trigger - (doubled.index[0] - trigger), "extrapolated"


def detect_spoofing(f):
    """One tractor drifts off its line while its signal stays healthy.

    Each tractor's cross-track error is compared with the other working tractors,
    because a storm makes every machine's guidance noisy at once. The signal check
    (unexplained loss under SPOOF_MAX_EXCESS_DB) keeps jamming out: a jammed
    tractor also wanders, but its signal collapses.
    """
    smooth = f.xte.rolling(config.SPOOF_SMOOTH_S, center=True, min_periods=1).median()
    found = []
    for tractor in smooth.columns:
        others = [t for t in smooth.columns if t != tractor]
        others_xte = smooth[others].where(f.working[others]).median(axis=1).fillna(0.0)
        rel = smooth[tractor] - others_xte                       # meters worse than the other machines
        flagged = f.working[tractor] & (rel >= config.SPOOF_XTE_M) & (f.excess[tractor] < config.SPOOF_MAX_EXCESS_DB)
        for trigger, end in runs(flagged, config.SPOOF_MERGE_GAP_S, config.SPOOF_MIN_DURATION_S):
            onset, method = ramp_onset(_span(rel, trigger, end), trigger)
            start = max(onset, _work_start(f, tractor, trigger))
            minutes_to_trigger = (trigger - start).total_seconds() / 60
            sky = _sky_facts(f, start, end)
            found.append(Candidate("SPOOFING", start, end, [tractor], {
                "trigger_time": trigger.isoformat(),
                "onset_method": method,
                "xte_max_m": round(float(_span(smooth[tractor], start, end).max()), 2),
                "xte_rate_m_per_min": round(config.SPOOF_XTE_M / minutes_to_trigger, 2) if minutes_to_trigger > 0 else None,
                "others_xte_m": round(float(_span(others_xte, trigger, end).median()), 2),
                "excess_db": round(float(_span(f.excess[tractor], trigger, end).median()), 1),
                "s4_median": sky["s4_median"],
                "s4_available": sky["s4_available"],
                "in_storm": bool(sky["expected_sag_db"] and sky["expected_sag_db"] > 0),
                "worst_fix": _worst_fix(f, start, end, [tractor]),
            }))
    return found


def _fault_facts(f, tractor, start, end, kind, dropout):
    """Measurements for a single-machine fault. `dropout` is the per-second dropout flag for every tractor."""
    others = [t for t in f.gap.columns if t != tractor]
    sky = _sky_facts(f, start, end)
    return {
        "kind": kind,
        "dropout_frac": round(float(_span(dropout[tractor], start, end).mean()), 2),
        "neighbor_dropout_frac": round(float(_span(dropout[others], start, end).mean().max()), 2),
        "min_cn0_p05": round(float(_span(f.min_cn0[tractor], start, end).quantile(0.05)), 1),
        "sats_min": int(_span(f.num_sats[tractor], start, end).min()),
        "cn0_median": round(float(_span(f.cn0[tractor], start, end).median()), 1),
        "link_down_frac": round(float(1 - _span(f.link_ok[tractor], start, end).mean()), 2),
        "float_frac": round(float((_span(f.fix_state[tractor], start, end) != "RTK_FIXED").mean()), 2),
        "s4_median": sky["s4_median"],
        "s4_available": sky["s4_available"],
        "in_storm": bool(sky["expected_sag_db"] and sky["expected_sag_db"] > 0),
    }


def detect_equipment_fault(f):
    """A problem on one machine that its neighbors do not share.

    Antenna: the weakest satellite keeps dropping far below the average signal.
    A dropout second is one where cn0 - min_cn0 reaches FAULT_GAP_DB, and the fault
    is a stretch where dropout seconds make up FAULT_DROPOUT_FRAC of a moving window.

    Correction link: base_link_ok goes false in short bursts. Bursts closer together
    than LINK_MERGE_GAP_S are one fault.
    """
    dropout = (f.gap >= config.FAULT_GAP_DB) & f.working
    dropout_share = dropout.astype(float).rolling(config.FAULT_WINDOW_S, center=True, min_periods=1).mean()
    found = []
    for tractor in f.gap.columns:
        frequent = dropout_share[tractor] >= config.FAULT_DROPOUT_FRAC
        for start, end in runs(frequent, config.FAULT_MERGE_GAP_S, config.FAULT_MIN_DURATION_S):
            found.append(Candidate("EQUIPMENT_FAULT", start, end, [tractor],
                                   _fault_facts(f, tractor, start, end, "antenna", dropout)))
        link_down = f.working[tractor] & ~f.link_ok[tractor]
        for start, end in runs(link_down, config.LINK_MERGE_GAP_S, config.LINK_MIN_DURATION_S):
            found.append(Candidate("EQUIPMENT_FAULT", start, end, [tractor],
                                   _fault_facts(f, tractor, start, end, "link", dropout)))
    return found


def detect_multipath(f):
    """Short dips of the weakest satellite that keep happening at the same latitude.

    A dip is 10 to 40 seconds where cn0 - min_cn0 reaches MP_GAP_DB. Storm noise
    produces dips like that anywhere in the field, so only dips at the tractor's
    recurring spot are reported: the latitude where most of its dips happen. A dip
    that repeats at one place on every pass is something fixed beside the field.
    Every pass is reported as its own short detection.
    """
    found = []
    for tractor in f.gap.columns:
        dipping = ((f.gap[tractor] >= config.MP_GAP_DB) & f.working[tractor]).astype(float)
        dipping = dipping.rolling(config.MP_BRIDGE_S, center=True, min_periods=1).median() > 0.5   # close 1-2 s holes
        dips = [(a, b) for a, b in runs(dipping)
                if config.MP_MIN_S <= (b - a).total_seconds() <= config.MP_MAX_S]
        if not dips:
            continue
        spots = [round(float(_span(f.lat[tractor], a, b).median()), config.MP_SPOT_DECIMALS) for a, b in dips]
        counts = pd.Series(spots).value_counts()
        home, recurrences = float(counts.index[0]), int(counts.iloc[0])
        if recurrences < config.MP_MIN_RECUR:
            continue                                             # nothing recurs, so nothing fixed is causing it
        for (start, end), spot in zip(dips, spots):
            if spot != home:
                continue
            sag = float(f.sag.loc[start])
            found.append(Candidate("MULTIPATH", start, end, [tractor], {
                "duration_s": int((end - start).total_seconds()),
                "min_cn0_db": round(float(_span(f.min_cn0[tractor], start, end).median()), 1),
                "cn0_db": round(float(_span(f.cn0[tractor], start, end).median()), 1),
                "spot_lat": home,
                "lon": round(float(_span(f.lon[tractor], start, end).median()), 5),
                "recurrences": recurrences,
                "s4": _number(f.s4.loc[start]),
                "s4_available": not pd.isna(f.s4.loc[start]),
                "in_storm": sag > 0,
            }))
    return found
