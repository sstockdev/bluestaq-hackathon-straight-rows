/**
 * What can break the detector, for the Limits panel.
 *
 * Every number comes from the README at the repo root: the sections "Failure modes
 * and false alarms", "Results on the dev episodes", "Design decisions", and
 * "Additional data that would improve attribution". When the README changes, change this file.
 */

import { DRIFT_EXAGGERATION } from "../lib/causes";

/** Where a limit comes from: a threshold the sweep broke, the detector's rules, or this app's drawing. */
export type LimitGroup = "threshold" | "detector" | "app";

export interface Limit {
  id: string;
  group: LimitGroup;
  /** The limit in a few words, for the row. The fields below are the full text, shown on hover. */
  brief: { case: string; wrong: string; fix: string };
  title: string;
  /** What goes wrong. */
  wrong: string;
  /** The condition that triggers it. */
  when: string;
  /** The data that would fix it. */
  fix: string;
}

/** The sensitivity sweep: each of ten thresholds moved to 0.75 and 1.25 of its value, rerun on dev. */
export const SWEEP = { thresholds: 10, moves: 20, unchanged: 17 };

export const LIMIT_GROUPS: { id: LimitGroup; title: string }[] = [
  { id: "threshold", title: "Thresholds the sweep broke" },
  { id: "detector", title: "Cases the rules get wrong" },
  { id: "app", title: "What this map gets wrong" },
];

export const LIMITS: Limit[] = [
  {
    id: "jam-trigger",
    brief: { case: "Jamming trigger 6 to 7.5 dB", wrong: "Weakest jam splits, 3 false", fix: "More weak-jam labels" },
    group: "threshold",
    title: "Jamming trigger, 6 dB",
    wrong: "The weakest jamming episode in dev splits into pieces, and three false positives appear.",
    when: "The trigger is raised from 6 to 7.5 dB.",
    fix: "More labeled episodes of weak jamming. Those are the cases the thresholds cannot yet separate.",
  },
  {
    id: "jam-member",
    brief: { case: "Affected cut 4.5 to 5.6 dB", wrong: "That jam is missed", fix: "Per-satellite C/N0" },
    group: "threshold",
    title: "Affected cut, 4.5 dB",
    wrong: "One tractor drops out of that same episode, and the episode is missed.",
    when: "The cut is raised from 4.5 to 5.6 dB. In that episode one tractor lost 5.5 dB and is in the label, and another lost 2.8 dB and is not.",
    fix: "More labeled episodes of weak jamming. Per-satellite C/N0 would show a jammer's direction and allow a lower threshold.",
  },
  {
    id: "fault-gap",
    brief: { case: "Antenna gap 12 to 9 dB", wrong: "10 false faults", fix: "Per-satellite C/N0" },
    group: "threshold",
    title: "Antenna dropout gap, 12 dB",
    wrong: "Storm and jamming noise counts as dropouts, and ten false faults are reported.",
    when: "The gap is lowered from 12 to 9 dB.",
    fix: "Per-satellite C/N0. An antenna fault has a pattern across satellites that the mean and the minimum hide.",
  },
  {
    id: "weak-jammer",
    brief: { case: "Jammer under 6 dB", wrong: "Missed", fix: "Per-satellite C/N0" },
    group: "detector",
    title: "A jammer weaker than any in dev",
    wrong: "It is not detected.",
    when: "The loss is under 6 dB on the hardest-hit tractor.",
    fix: "Per-satellite C/N0, and more labeled episodes of weak jamming.",
  },
  {
    id: "one-storm",
    brief: { case: "A storm unlike May 5", wrong: "Storm and jamming swap", fix: "A second storm" },
    group: "detector",
    title: "The sag model rests on one storm day",
    wrong: "A storm is reported as jamming, or a jammer is hidden inside a storm.",
    when: "S4 relates to signal loss differently on another day.",
    fix: "A second storm to test the model against.",
  },
  {
    id: "s4-late",
    brief: { case: "S4 late or missing", wrong: "Storm start unexplained, or max 0.40", fix: "Finer S4" },
    group: "detector",
    title: "S4 arrives late or is missing",
    wrong: "A late sample makes the first 15 minutes of a storm look unexplained. With no S4 at all, the detection is still reported, with confidence capped at 0.40 and evidence that says so.",
    when: "S4 arrives one sample late, or does not arrive.",
    fix: "S4 at a finer cadence.",
  },
  {
    id: "one-machine",
    brief: { case: "One machine alone", wrong: "Called a fault, max 0.45", fix: "A second antenna" },
    group: "detector",
    title: "One machine loses signal alone",
    wrong: "It is reported as an equipment fault at confidence 0.45 or less. A jammer that reaches only one tractor is reported the same way.",
    when: "Only one working tractor has unexplained loss. Dev has no such case.",
    fix: "Per-satellite C/N0 or a second antenna on the machine, and labeled episodes of single-machine loss.",
  },
  {
    id: "spoof-jump",
    brief: { case: "Spoofer that jumps", wrong: "Late start", fix: "IMU or odometry" },
    group: "detector",
    title: "A spoofer that jumps",
    wrong: "The reported start is late.",
    when: "The spoofer jumps the position. The start time assumes a steady drift.",
    fix: "An IMU or wheel odometry on each tractor, as an independent position source.",
  },
  {
    id: "multipath-latitude",
    brief: { case: "Multipath while spoofed", wrong: "Wrong spot", fix: "Site survey" },
    group: "detector",
    title: "Multipath is located by reported latitude",
    wrong: "The recurring spot is looked for at the wrong latitude.",
    when: "The tractor is being spoofed, which displaces its reported latitude.",
    fix: "A site survey of the headland, to name the obstruction.",
  },
  {
    id: "simulated-farm",
    brief: { case: "Simulated farm", wrong: "Surroundings are drawn, no photo", fix: "Real telemetry" },
    group: "app",
    title: "The farm is simulated",
    wrong: "The fields, roads, town blocks, and yard buildings around the field are an illustration. Nothing in the dataset says what surrounds it. The field's coordinates do not match a real field: half of that rectangle is a neighborhood on the east side of Casselton, so no aerial photo is shown.",
    when: "Always. The telemetry comes from a simulator that placed its field near the town.",
    fix: "Telemetry from real machines, with the boundary of the field they worked.",
  },
  {
    id: "drift-scale",
    brief: { case: "Spoofing drift", wrong: `Drawn ${DRIFT_EXAGGERATION}x larger`, fix: "Meters are in the evidence" },
    group: "app",
    title: "Spoofing drift is drawn larger than real",
    wrong: `The drawn path leaves its row ${DRIFT_EXAGGERATION} times farther than the tractor did.`,
    when: "Whenever a tractor is spoofed. At true scale the drift is too small to see on the map.",
    fix: "None is missing. Read the drift in meters from the detection's evidence.",
  },
];
