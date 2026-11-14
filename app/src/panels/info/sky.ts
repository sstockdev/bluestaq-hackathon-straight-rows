import type { Thresholds } from "../../data/types";

/** The latest value at or before a moment in a [time, value] series, or null before the first sample. */
export function valueAt(series: [number, number][], clock: number): number | null {
  let value: number | null = null;
  for (const [t, v] of series) {
    if (t > clock) break;
    value = v;
  }
  return value;
}

/** The dB of signal sag the detector's sky model predicts for an S4 reading. */
export function predictedSag(s4: number, thresholds: Thresholds): number {
  return s4 >= thresholds.sagMin ? thresholds.sagIntercept + thresholds.sagSlope * s4 : 0;
}

/** Kp at or above this is storm level. */
export const KP_STORM = 5;
