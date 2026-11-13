"""Read the farm telemetry and the SDA feeds into DataFrames with UTC timestamps."""
import json
from pathlib import Path

import pandas as pd


def load_telemetry(data_dir):
    """1 Hz telemetry in long format: one row per tractor per second."""
    tele = pd.read_csv(Path(data_dir) / "farm/tractor_telemetry.csv.gz")
    tele["ts"] = pd.to_datetime(tele["ts"], utc=True, format="ISO8601")
    return tele


def _load_feed(data_dir, filename, key):
    with open(Path(data_dir) / "sda" / filename) as f:
        frame = pd.DataFrame(json.load(f)[key])
    frame["ts"] = pd.to_datetime(frame["ts"], utc=True, format="ISO8601")
    return frame.sort_values("ts").reset_index(drop=True)


def load_s4(data_dir):
    """Regional S4 scintillation proxy, one sample every 15 minutes."""
    return _load_feed(data_dir, "scintillation_series.json", "series")


def load_kp(data_dir):
    """Planet-wide Kp index, one sample every 3 hours."""
    return _load_feed(data_dir, "sgi_indices.json", "kp")


def load_rfi(data_dir):
    """Interference reports: late, sometimes missing, sometimes false."""
    return _load_feed(data_dir, "rfi_reports.json", "reports")


def load_advisories(data_dir):
    """Constellation maintenance and storm advisories."""
    return _load_feed(data_dir, "constellation_advisories.json", "advisories")
