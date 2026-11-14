/**
 * Each design decision in a few words, for the closed rows of the Why panel:
 * a short title, what was chosen, what was rejected, and the one number from
 * dev that backs it. The full text is in decisions.json at the repo root, and
 * every number here comes from it. When that file changes, change this one.
 */
export interface DecisionBrief {
  title: string;
  chosen: string;
  rejected: string;
  /** The number that backs the decision, and what it counts. */
  stat: string;
  note: string;
}

/** Keyed by decision id. */
export const DECISION_BRIEFS: Record<number, DecisionBrief> = {
  1: { title: "One detector per cause", chosen: "5 detectors, overlaps kept", rejected: "One cause per moment", stat: "3 of 12", note: "episodes overlap" },
  2: { title: "Working tractors set the clock", chosen: "Telemetry, working seconds only", rejected: "Timing from the sky feeds", stat: "75 min", note: "baseline starts early" },
  3: { title: "A model of what the sky explains", chosen: "Sag = 2.1 + 18 x S4", rejected: "Kp as the storm test", stat: "< 0.1 dB", note: "fit error" },
  4: { title: "Jamming is unexplained loss", chosen: "≥ 6 dB beyond the sag", rejected: "Unequal loss as the test", stat: "12 dB", note: "found inside a storm" },
  5: { title: "Kp is context only", chosen: "Adds 0.05 at most", rejected: "Kp as a gate", stat: "2 of 5", note: "baseline false alarms" },
  6: { title: "Reports support, never decide", chosen: "A report adds 0.15", rejected: "Requiring a report", stat: "10 to 30 min", note: "reports arrive late" },
  7: { title: "Spoofing is drift with a healthy signal", chosen: "Drift against the other tractors", rejected: "A fixed drift limit", stat: "1 to 170 s", note: "from the true start" },
  8: { title: "Faults are dropouts and link flaps", chosen: "Dropout rate and link bursts", rejected: "Mean signal strength", stat: "24% vs 3%", note: "dropout share" },
  9: { title: "Multipath recurs at one spot", chosen: "Every pass at the spot", rejected: "Dips anywhere in the field", stat: "324", note: "dips at one latitude" },
  10: { title: "Confidence from measured facts", chosen: "0.60 plus fixed weights", rejected: "A fitted model", stat: "0.50 to 0.95", note: "range on dev" },
  11: { title: "One machine alone is a fault", chosen: "Fault, at most 0.45", rejected: "Calling it jamming", stat: "0", note: "cases in dev" },
  12: { title: "Frozen on dev, eval run once", chosen: "Thresholds frozen first", rejected: "Tuning on eval output", stat: "17 of 20", note: "moves change nothing" },
};
