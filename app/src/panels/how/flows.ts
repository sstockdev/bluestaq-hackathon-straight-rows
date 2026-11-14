import type { Cause, Rules, Thresholds } from "../../data/types";

/** A length of time the way a person would say it: "61 s", "2 min". */
export function span(seconds: number): string {
  return seconds < 120 ? `${seconds} s` : `${Math.round(seconds / 60)} min`;
}

const percent = (share: number) => `${Math.round(share * 100)}%`;

/** One answer to a check, and what happens to the event. */
export interface Outcome {
  answer: string;
  result: string;
  /** False when the event is thrown away. */
  kept: boolean;
}

/**
 * One route from flagged seconds to events. Equipment fault has two; the other
 * causes have one. The short texts are what the chart shows. Each `detail` is
 * the full rule, shown on hover.
 */
export interface Path {
  name?: string;
  /** What makes one second count. */
  flag: string;
  detail: string;
  /** The two labels on the strip drawing: the gap that is bridged and the stretch that is dropped. */
  gapLabel: string;
  dropLabel: string;
  check?: { question: string; detail: string; outcomes: Outcome[] };
}

/** The usual joining rule as the two labels on the strip. */
function joined(rule: { mergeGapS: number; minS: number }) {
  return { gapLabel: `gap ≤ ${span(rule.mergeGapS)}: joined`, dropLabel: `< ${span(rule.minS)}: dropped` };
}

const DROPPED: Outcome = { answer: "No", result: "Dropped", kept: false };

/** How one cause's detector turns the per-second table into events. Every number comes from the export. */
export function causePaths(cause: Cause, t: Thresholds, r: Rules): Path[] {
  switch (cause) {
    case "SPACE_WEATHER":
      return [
        {
          flag: `Every tractor ≥ ${t.swMinDrop} dB drop`,
          detail: `Every working tractor is ${t.swMinDrop} dB or more below its normal signal in the same second.`,
          ...joined(r.events.spaceWeather),
          check: {
            question: `S4 ≥ ${t.sagMin}?`,
            detail: `The median S4 over the event has to reach ${t.sagMin}. Below that, the sky does not explain the sag and the event is dropped.`,
            outcomes: [{ answer: "Yes", result: "Space weather", kept: true }, DROPPED],
          },
        },
      ];
    case "JAMMING":
      return [
        {
          flag: `Any tractor ≥ ${t.jamTrigger} dB unexplained`,
          detail: `Some working tractor has ${t.jamTrigger} dB or more of loss the sky does not explain.`,
          ...joined(r.events.jamming),
          check: {
            question: `Tractors ≥ ${t.jamMember} dB?`,
            detail: `Counts the tractors whose median unexplained loss over the event is ${t.jamMember} dB or more. One machine alone cannot tell a nearby jammer from its own hardware, so it is reported as an equipment fault and its confidence cannot pass ${r.confidence.singleLossCap.toFixed(2)}.`,
            outcomes: [
              { answer: "2+", result: "Jamming", kept: true },
              { answer: "1", result: "Equipment fault", kept: true },
              { answer: "0", result: "Dropped", kept: false },
            ],
          },
        },
      ];
    case "SPOOFING":
      return [
        {
          flag: `Drift ≥ ${t.spoofXte} m past the others, signal healthy`,
          detail: `Checked for each tractor. Its drift off the line (${span(r.spoofSmoothS)} median) is ${t.spoofXte} m or more worse than the other working tractors, and its unexplained loss stays under ${t.spoofMaxExcess} dB.`,
          ...joined(r.events.spoofing),
          check: {
            question: `Drift doubles to ${2 * t.spoofXte} m?`,
            detail: "A steady drift took as long to climb from zero to the trigger as from the trigger to twice that, so the start moves back by that time. If the drift never doubles, the start stays where it crossed the trigger.",
            outcomes: [
              { answer: "Yes", result: "Start traced back", kept: true },
              { answer: "No", result: "Start at trigger", kept: true },
            ],
          },
        },
      ];
    case "EQUIPMENT_FAULT":
      return [
        {
          name: "Antenna",
          flag: `Weak satellite ≥ ${t.faultGap} dB low, ${percent(t.faultFrac)}+ of ${span(r.faultWindowS)}`,
          detail: `Checked for each tractor. A dropout second is one where the weakest satellite sits ${t.faultGap} dB or more below the mean signal. A second is flagged when dropouts fill ${percent(t.faultFrac)} or more of the ${span(r.faultWindowS)} around it.`,
          ...joined(r.events.antenna),
        },
        {
          name: "Correction link",
          flag: "RTK correction link down",
          detail: "Checked for each tractor. The tractor is working and its RTK correction link is down.",
          ...joined(r.events.link),
        },
      ];
    case "MULTIPATH":
      return [
        {
          flag: `Weak satellite ≥ ${t.mpGap} dB low`,
          detail: `Checked for each tractor. The weakest satellite sits ${t.mpGap} dB or more below the mean signal while the tractor works.`,
          gapLabel: "1 to 2 s hole: closed",
          dropLabel: `not ${r.multipath.minS} to ${r.multipath.maxS} s: dropped`,
          check: {
            question: `${r.multipath.minRecur}+ dips at one spot?`,
            detail: `Each dip's latitude is rounded to bins of about 110 m. The busiest bin needs ${r.multipath.minRecur} or more dips, and only dips there are reported, one per pass. Dips that do not repeat have nothing fixed causing them.`,
            outcomes: [{ answer: "Yes", result: "Each pass reported", kept: true }, DROPPED],
          },
        },
      ];
  }
}

/** One thing that can move a cause's confidence. */
export interface Term {
  /** The term's name in config.py, which is also its key in Rules.confidence.terms. */
  key: string;
  /** A few words for the chip. */
  label: string;
  /** The reason as the detector writes it. A detection's own terms are matched on this text. */
  reason: string;
  /** When the term applies. Shown on hover. */
  when: string;
}

/** The terms a cause can earn, in the order the detector checks them. */
export function confidenceTerms(cause: Cause, r: Rules): Term[] {
  const c = r.confidence;
  switch (cause) {
    case "SPACE_WEATHER":
      return [
        { key: "sag_matches", label: "Drop matches S4", reason: "the drop matches what S4 predicts", when: `The median drop is within ${c.sagMatchDb} dB of the predicted sag.` },
        { key: "uniform", label: "Same on every tractor", reason: "every machine lost the same amount", when: `The tractors are within ${c.uniformDb} dB of each other.` },
        { key: "kp_storm", label: "Kp storm", reason: "Kp reached storm level", when: "Kp reached 5 or higher." },
        { key: "advisory", label: "Storm advisory", reason: "a storm advisory is on file", when: "One was issued before the event ended." },
      ];
    case "JAMMING":
      return [
        { key: "graded", label: "Differs by tractor", reason: "the loss differs by machine, as distance from a transmitter would", when: `The tractors differ by ${r.gradedSpread} dB or more, as distance from a transmitter would make them.` },
        {
          key: "rfi_report",
          label: "Interference report",
          reason: "an interference report arrived near the farm",
          when: `A report within ${span(r.rfiMaxDelayS)} of the start, its area reaching the farm, at report confidence ${c.strongRfi} or higher.`,
        },
        { key: "rfi_report_weak", label: "Weak report", reason: "an interference report arrived near the farm", when: `The same report, at report confidence under ${c.strongRfi}.` },
        { key: "quiet_sky", label: "Quiet sky", reason: "the sky is quiet, so it explains none of the loss", when: "S4 predicts no sag, so the sky explains none of the loss." },
        { key: "uniform_in_storm", label: "Equal loss in a storm", reason: "equal loss during a storm could be scintillation beyond what S4 shows", when: "A storm is in progress and the loss is the same on every tractor, which could be scintillation beyond what S4 shows." },
      ];
    case "SPOOFING":
      return [
        { key: "healthy_signal", label: "Signal healthy", reason: "the signal is as strong as the sky predicts", when: `The unexplained loss is within ${c.healthySignalDb} dB of zero.` },
        { key: "steady_ramp", label: "Steady drift", reason: "the drift climbs at a steady rate", when: "The drift doubled, so its start could be traced back." },
        { key: "in_storm", label: "Storm", reason: "a storm makes every machine's guidance noisy", when: "S4 predicts a sag, and a storm makes every machine's guidance noisy." },
      ];
    case "EQUIPMENT_FAULT":
      return [
        { key: "link", label: "Link down on one machine", reason: "the correction link drops out on this machine only", when: `Link fault, and the other tractors' link was down under ${percent(c.neighborDropout)} of the time.` },
        { key: "antenna_one_machine", label: "Dropouts on one machine", reason: "the other machines do not show the dropouts", when: `Antenna fault, and the other tractors had dropouts under ${percent(c.neighborDropout)} of the time.` },
        { key: "in_storm", label: "Storm", reason: "a storm is in progress", when: "S4 predicts a sag." },
      ];
    case "MULTIPATH":
      return [
        { key: "recurs", label: "Repeats at one spot", reason: "the dip repeats at the same place", when: `${r.multipath.minRecur} or more dips at the spot, which every reported dip has.` },
        { key: "in_storm", label: "Storm", reason: "a storm makes the dip harder to separate from noise", when: "S4 predicts a sag, and a storm makes the dip harder to separate from noise." },
      ];
  }
}
