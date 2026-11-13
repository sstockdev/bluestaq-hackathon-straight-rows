"""Build the per-second feature frame that every detector reads."""
from dataclasses import dataclass

import pandas as pd

from . import config, data


@dataclass
class Features:
    # DataFrames indexed by ts (UTC, 1 Hz) with one column per tractor
    working: pd.DataFrame     # bool: speed_mps above WORKING_SPEED_MPS
    cn0: pd.DataFrame         # mean_cn0_dbhz, raw
    min_cn0: pd.DataFrame     # min_cn0_dbhz, raw
    num_sats: pd.DataFrame
    fix_state: pd.DataFrame
    link_ok: pd.DataFrame     # bool: RTK correction link available
    lat: pd.DataFrame
    lon: pd.DataFrame
    xte: pd.DataFrame         # absolute cross-track error in meters, raw
    drop: pd.DataFrame        # dB below the tractor's baseline, smoothed
    gap: pd.DataFrame         # cn0 - min_cn0: how far the weakest signal sits below the mean
    excess: pd.DataFrame      # drop minus the loss S4 explains
    # Series on the same index
    s4: pd.Series             # latest S4 sample, NaN when older than S4_MAX_AGE_S
    sag: pd.Series            # dB of loss S4 explains
    kp: pd.Series             # latest Kp sample
    # Everything else
    baseline: pd.Series       # per-tractor median of cn0 over the whole file
    rfi: pd.DataFrame
    advisories: pd.DataFrame
    farm_center: tuple        # (lat, lon) averaged over working rows


def expected_sag(s4):
    """dB of C/N0 loss that S4 explains. Zero below S4_SAG_MIN and where S4 is missing."""
    sag = config.SAG_INTERCEPT_DB + config.SAG_SLOPE_DB * s4
    return sag.where(s4 >= config.S4_SAG_MIN, 0.0)


def _wide(tele, column):
    """One telemetry column as a table: a row per second, a column per tractor."""
    return tele.pivot(index="ts", columns="tractor_id", values=column)


def _as_of(feed, column, index, max_age_s=None):
    """The latest feed value at or before each second.

    NaN before the first sample, and NaN once the latest sample is older than max_age_s.
    """
    if feed is None or len(feed) == 0:
        return pd.Series(float("nan"), index=index, name=column)
    seconds = pd.DataFrame({"ts": index})
    samples = feed[["ts", column]].sort_values("ts").astype({"ts": seconds["ts"].dtype})
    tolerance = pd.Timedelta(seconds=max_age_s) if max_age_s else None
    joined = pd.merge_asof(seconds, samples, on="ts", direction="backward", tolerance=tolerance)
    return pd.Series(joined[column].to_numpy(), index=index, name=column)


def derive_features(tele, s4, kp, rfi, advisories):
    """Compute Features from long-format telemetry and the feed tables. A feed may be None."""
    cn0 = _wide(tele, "mean_cn0_dbhz")
    min_cn0 = _wide(tele, "min_cn0_dbhz")
    lat, lon = _wide(tele, "lat"), _wide(tele, "lon")
    working = _wide(tele, "speed_mps") > config.WORKING_SPEED_MPS

    baseline = cn0.median()
    drop = (baseline - cn0).rolling(config.SMOOTH_CN0_S, center=True, min_periods=1).median()
    s4_now = _as_of(s4, "s4", cn0.index, config.S4_MAX_AGE_S)
    sag = expected_sag(s4_now)

    return Features(
        working=working,
        cn0=cn0,
        min_cn0=min_cn0,
        num_sats=_wide(tele, "num_sats"),
        fix_state=_wide(tele, "fix_state"),
        link_ok=_wide(tele, "base_link_ok").astype(bool),
        lat=lat,
        lon=lon,
        xte=_wide(tele, "cross_track_error_m").abs(),
        drop=drop,
        gap=cn0 - min_cn0,
        excess=drop.sub(sag, axis=0),
        s4=s4_now,
        sag=sag,
        kp=_as_of(kp, "kp", cn0.index),
        baseline=baseline,
        rfi=rfi if rfi is not None else pd.DataFrame(),
        advisories=advisories if advisories is not None else pd.DataFrame(),
        farm_center=(float(lat[working].stack().mean()), float(lon[working].stack().mean())),
    )


def build_features(data_dir):
    """Load every input from data_dir and compute Features."""
    return derive_features(
        data.load_telemetry(data_dir),
        data.load_s4(data_dir),
        data.load_kp(data_dir),
        data.load_rfi(data_dir),
        data.load_advisories(data_dir),
    )
