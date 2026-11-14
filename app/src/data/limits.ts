/**
 * The six limits of this detector that matter most, for the Limits panel: what
 * was accepted, and why that was judged to be acceptable. They are in order,
 * the one that could change the output most first. The README's "Where it
 * breaks" section has the full list.
 *
 * Every number comes from the README at the repo root (the sections "Where it
 * breaks" and "Results") or from decisions.json. When those change, change this file.
 */

export interface Limit {
  id: string;
  /** What was accepted, in a few words. */
  accepted: string;
  /** Why it was acceptable, in one short line. */
  ok: string;
  /** What goes wrong and what data would fix it. Shown when the row is opened. */
  detail: string;
}

/** The sensitivity sweep: each of ten thresholds moved to 0.75 and 1.25 of its value, rerun on dev. */
export const SWEEP = { thresholds: 10, moves: 20, unchanged: 17 };

export const LIMITS: Limit[] = [
  {
    id: "twelve-episodes",
    accepted: "Thresholds come from 12 episodes on one farm",
    ok: `They sit in wide gaps: ${SWEEP.unchanged} of ${SWEEP.moves} threshold moves change nothing.`,
    detail: "The farm is simulated, and real receivers were never seen. Three moves do break dev: the jamming trigger raised from 6 to 7.5 dB, the affected cut raised from 4.5 to 5.6 dB, and the antenna gap lowered from 12 to 9 dB. Two of them involve the weakest jamming episode.",
  },
  {
    id: "one-storm",
    accepted: "The sag model rests on one storm day",
    ok: "It predicted the May 6 storm, which it never saw, to within 0.3 dB.",
    detail: "If S4 related to signal loss differently on another day, a storm could be reported as jamming, or a jammer hidden inside a storm. A second storm would test it.",
  },
  {
    id: "weak-jammer",
    accepted: "A jammer under 6 dB is missed",
    ok: "Dev's weakest jammer peaks at 8 dB. Lower would be a guess.",
    detail: "The trigger is 6 dB of unexplained loss on the hardest-hit tractor. Per-satellite C/N0 would show a jammer's direction and allow a lower trigger.",
  },
  {
    id: "one-machine",
    accepted: "One machine losing signal alone is called a fault",
    ok: "That machine stops either way, and confidence is capped at 0.45.",
    detail: "A jammer that reaches only one tractor is reported the same way, and the evidence names it as the alternative. Dev has no such case, so the rule is untested. A second antenna on the machine would separate the two.",
  },
  {
    id: "s4-late",
    accepted: "Without S4, a storm can look like jamming",
    ok: "It is still reported, capped at 0.40, and says S4 was missing.",
    detail: "S4 arrives every 15 minutes. A sample one step late makes the first 15 minutes of a storm look unexplained. S4 was present on all three days. A finer cadence would close the gap.",
  },
  {
    id: "confidence",
    accepted: "Confidence weights are judgment",
    ok: "12 episodes cannot calibrate it, so every term is shown.",
    detail: "Whether 0.8 means right 80% of the time is unknown. More labeled episodes would allow a calibration check.",
  },
];

/** One kind of data the detector does not have: what it is, and why it is needed. */
export interface Wanted {
  data: string;
  what: string;
  why: string;
}

/**
 * The data that would help: the one kind worth asking for first. The README's
 * "Data that would help" section says the same.
 */
export const WANTED: Wanted[] = [
  { data: "IMU or wheel odometry", what: "A position source that isn't GPS", why: "A real receiver can't see its own spoofed drift" },
];
