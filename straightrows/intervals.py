"""Turn a per-second boolean series into time intervals."""
import numpy as np
import pandas as pd

ONE_SECOND = pd.Timedelta(seconds=1)


def runs(flag, merge_gap_s=0, min_duration_s=0):
    """Intervals where `flag` is True, as (start, end) pairs with an exclusive end.

    `flag` is a boolean Series indexed by 1 Hz timestamps. Runs separated by
    at most `merge_gap_s` seconds of False are joined first. Runs shorter than
    `min_duration_s` seconds are then dropped.
    """
    times = flag.index[flag.to_numpy(dtype=bool)]
    if len(times) == 0:
        return []
    gaps_s = (times[1:] - times[:-1]).total_seconds()
    breaks = np.flatnonzero(gaps_s > 1 + merge_gap_s)   # a run ends at each break
    starts = times[np.concatenate(([0], breaks + 1))]
    ends = times[np.concatenate((breaks, [len(times) - 1]))] + ONE_SECOND
    return [(a, b) for a, b in zip(starts, ends) if (b - a).total_seconds() >= min_duration_s]
