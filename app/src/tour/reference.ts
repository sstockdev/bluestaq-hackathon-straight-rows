import type { Cause, Rules, Thresholds } from "../data/types";

/**
 * The presenter's reference: the five rules side by side, then why the
 * detector takes the approach it does and why the code is built the way it is.
 * Text between two asterisks is shown in bold. The rules' thresholds are read
 * from the export. The reasons quote numbers from the README and decisions.json.
 */

/** One row of the rules table. */
export interface RuleRow {
  name: string;
  cause: Cause;
  /** What the cause looks like in the data, in a few words. */
  footprint: string;
  flagged: string;
  check: string;
  /** What it could be mistaken for, and what keeps the two apart. */
  apart: string;
}

const percent = (share: number) => `${Math.round(share * 100)}%`;

export function ruleRows(t: Thresholds, r: Rules): RuleRow[] {
  return [
    {
      name: "Space weather",
      cause: "SPACE_WEATHER",
      footprint: "Hits every machine, and S4 measures it",
      flagged: `**every** working tractor's drop ≥ ${t.swMinDrop} dB`,
      check: `S4 median ≥ ${t.sagMin}, otherwise dropped`,
      apart: "Jamming on a quiet sky (TRN-03: S4 0.05, so the event is dropped)",
    },
    {
      name: "Jamming",
      cause: "JAMMING",
      footprint: "Loss that S4 doesn't predict",
      flagged: `**any** working tractor has unexplained ≥ ${t.jamTrigger} dB`,
      check: `tractors with median unexplained ≥ ${t.jamMember} dB: **2+ jamming**, **1 fault**, **0 dropped**`,
      apart: "A storm (unexplained loss already has the sky's share removed)",
    },
    {
      name: "Spoofing",
      cause: "SPOOFING",
      footprint: "Position moves, signal stays healthy",
      flagged: `one tractor's ${r.spoofSmoothS} s drift is ≥ ${t.spoofXte} m worse than the others, **and** unexplained < ${t.spoofMaxExcess} dB`,
      check: "start walked back by the time the drift took to double",
      apart: `Jamming (the ${t.spoofMaxExcess} dB check) and storm noise (compared with the other tractors)`,
    },
    {
      name: "Antenna fault",
      cause: "EQUIPMENT_FAULT",
      footprint: "Stays in one machine",
      flagged: `weakest satellite ≥ ${t.faultGap} dB below the mean in ≥ ${percent(t.faultFrac)} of a ${Math.round(r.faultWindowS / 60)} min window`,
      check: "none",
      apart: `Multipath (${t.mpGap} dB, one ${r.multipath.minS} to ${r.multipath.maxS} s dip) and jamming (the mean barely moves)`,
    },
    {
      name: "Link fault",
      cause: "EQUIPMENT_FAULT",
      footprint: "Stays in one machine",
      flagged: "working, and the correction link is down",
      check: "none",
      apart: "Everything else (the satellite signals are fine)",
    },
    {
      name: "Multipath",
      cause: "MULTIPATH",
      footprint: "Stays in one place",
      flagged: `weakest satellite ≥ ${t.mpGap} dB below the mean, for ${r.multipath.minS} to ${r.multipath.maxS} s`,
      check: `≥ ${r.multipath.minRecur} dips at one latitude, and only that spot is reported`,
      apart: "Storm dips (those fall anywhere in the field)",
    },
  ];
}

/** One cause's confidence terms: what adds to the score and what takes away from it. */
export interface Weights {
  name: string;
  cause: Cause;
  /** Each term as a few words and its weight. */
  adds: [string, number][];
  subtracts: [string, number][];
}

/** Every confidence term by cause, with the weights and limits read from the export. */
export function confidenceRows(r: Rules): Weights[] {
  const c = r.confidence;
  const term = (cause: Cause, key: string, label: string): [string, number] => [label, c.terms[cause][key]];
  return [
    {
      name: "Space weather",
      cause: "SPACE_WEATHER",
      adds: [
        term("SPACE_WEATHER", "sag_matches", `drop within ${c.sagMatchDb} dB of the sag`),
        term("SPACE_WEATHER", "uniform", `spread < ${c.uniformDb} dB`),
        term("SPACE_WEATHER", "kp_storm", "Kp ≥ 5"),
        term("SPACE_WEATHER", "advisory", "advisory"),
      ],
      subtracts: [],
    },
    {
      name: "Jamming",
      cause: "JAMMING",
      adds: [
        term("JAMMING", "graded", `spread ≥ ${r.gradedSpread} dB`),
        term("JAMMING", "rfi_report", "report"),
        term("JAMMING", "rfi_report_weak", `or, when the report's own confidence is < ${c.strongRfi}`),
        term("JAMMING", "quiet_sky", "quiet sky with S4 present"),
      ],
      subtracts: [term("JAMMING", "uniform_in_storm", "equal loss in a storm")],
    },
    {
      name: "Spoofing",
      cause: "SPOOFING",
      adds: [
        term("SPOOFING", "healthy_signal", `unexplained within ${c.healthySignalDb} dB of 0`),
        term("SPOOFING", "steady_ramp", "drift extrapolated"),
      ],
      subtracts: [term("SPOOFING", "in_storm", "storm")],
    },
    {
      name: "Equipment fault",
      cause: "EQUIPMENT_FAULT",
      adds: [
        term("EQUIPMENT_FAULT", "link", "link down on this machine only"),
        term("EQUIPMENT_FAULT", "antenna_one_machine", "antenna dropouts on this machine only"),
      ],
      subtracts: [term("EQUIPMENT_FAULT", "in_storm", "storm")],
    },
    {
      name: "Multipath",
      cause: "MULTIPATH",
      adds: [term("MULTIPATH", "recurs", `≥ ${r.multipath.minRecur} recurrences`)],
      subtracts: [term("MULTIPATH", "in_storm", "storm")],
    },
  ];
}

/** One choice, the reason for it, and what was turned down or what it costs. */
export interface Reason {
  choice: string;
  because: string;
  /** For an approach: what it was chosen over. For the code: what it costs. */
  other: string;
}

/** Why the detector takes this approach. */
export const APPROACH: Reason[] = [
  { choice: "Rules, with no trained model", because: "**12 labeled episodes** can't train or test a model, and a rule can be explained", other: "A classifier fitted to the labels" },
  { choice: "One detector per cause", because: "Causes overlap: a jammer can turn on **inside a storm**", other: "One cause per moment" },
  { choice: "Predict the sky's share from S4", because: "S4 is regional and arrives every **15 minutes**. Kp is planet-wide, every **3 hours**", other: "Kp as the storm test" },
  { choice: "Jamming is the loss left over", because: "In a storm every tractor loses the same amount, so equal loss can't be the test", other: "Unequal loss across tractors" },
  { choice: "Only working tractors count", because: "Labels start when work starts. Parked tractors start one storm **75 minutes** early", other: "Counting every second" },
  { choice: "Spoofing is judged against the other tractors", because: "A storm makes every tractor wander. Only the spoofed one keeps drifting", other: "A fixed drift limit" },
  { choice: "Faults are read from the weakest satellite", because: "The average signal stays normal while one satellite drops out **24%** of the time", other: "Mean signal strength" },
  { choice: "Multipath is found by place", because: "It repeats at **one latitude** on every pass. Storm dips fall anywhere", other: "Reporting every short dip" },
  { choice: "Confidence is a sum of terms", because: "12 episodes can't calibrate a score, so each term is shown", other: "One value, or a fitted model" },
  { choice: "Freeze first, then run the evaluation once", because: "With no labels there, any change after looking is a guess", other: "Tuning on the evaluation output" },
];

/** Why the code is put together the way it is. */
export const BUILD: Reason[] = [
  { choice: "One per-second table that every detector reads", because: "Drop, sag and unexplained loss are worked out **once**, so all five agree", other: "The whole file sits in memory, which is small" },
  { choice: "Five separate detector functions", because: "One can change without touching the others, and a sixth is **one function and one line**", other: "Nothing reconciles two readings of one event" },
  { choice: "Every threshold in `config.py`", because: "One place to look and to change, and the sweep can rerun with a new value", other: "The Kp level of 5 sits in `evidence.py`" },
  { choice: "One `runs()` helper for all five", because: "Joining seconds into events is the same job five times, so it is written once", other: "Every detector shares its two rules" },
  { choice: "Confidence and evidence read only the recorded `facts`", because: "The sentence and the score come from the **same numbers**, so they can't disagree", other: "A number that was not recorded can't be cited" },
  { choice: "Detecting is separate from reporting", because: "The same candidates are cut once for dev and once for eval, so both use the **same rules**", other: "All three days are always processed" },
  { choice: "It analyzes a recording", because: "The task was three recorded days, and the whole file gives a better baseline", other: "It could **not run live** as written: the medians look ahead" },
  { choice: "Medians, with no means", because: "A median ignores spikes and keeps a step sharp, so start times stay exact", other: "Needs the tractor healthy for more than half the file" },
  { choice: "Three pinned libraries and one command", because: "Anyone can rerun it, and nothing is random", other: "None" },
];
