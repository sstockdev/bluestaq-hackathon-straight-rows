/** The dev episode that illustrates a design decision, for the "Show it on the map" button. */
export interface DecisionEpisode {
  /** The dev label, such as "TRN-05". */
  label: string;
  /** The dev day the episode is on. */
  date: string;
}

const MAY_4 = "2026-05-04";
const MAY_5 = "2026-05-05";

/** Keyed by decision id. A decision without an entry has no single episode that shows it. */
export const DECISION_EPISODES: Record<number, DecisionEpisode> = {
  1: { label: "TRN-05", date: MAY_5 }, // a jammer inside a storm: two overlapping detections
  2: { label: "TRN-01", date: MAY_5 }, // the storm that began while the tractors were parked
  3: { label: "TRN-02", date: MAY_5 }, // the storm the sag model follows
  4: { label: "TRN-05", date: MAY_5 }, // equal loss on every machine, beyond what S4 explains
  6: { label: "TRN-03", date: MAY_4 }, // jamming with an interference report
  7: { label: "TRN-07", date: MAY_5 }, // a drift on one tractor with a healthy signal
  8: { label: "TRN-09", date: MAY_4 }, // an antenna fault that the mean signal hides
  10: { label: "TRN-05", date: MAY_5 }, // the lowest confidence on dev
};
