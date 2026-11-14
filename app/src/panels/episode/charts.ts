import type { Detection, Episode, Thresholds } from "../../data/types";
import { clock } from "../../lib/time";
import { TRACTORS } from "../../lib/causes";
import { axis, tractorRows, valueRange, type ChartRow } from "./series";

/** Everything TimeChart needs to draw one chart. */
export interface ChartSpec {
  title: string;
  /** What the chart measures, shown when the title is hovered. */
  unit: string;
  /** Written after a value in the tooltip, such as " dB". */
  suffix: string;
  /** Decimal places in the tooltip. */
  digits: number;
  rows: ChartRow[];
  /** A dashed line drawn besides the three tractors, or null. */
  dashed: { key: string; name: string } | null;
  /** Horizontal reference lines. The label sits above the line, or under it with `below`. */
  marks: { y: number; label: string; below?: boolean }[];
  /** Vertical lines at moments in time, each with a short label at its top. */
  moments?: { t: number; label: string }[];
  /** The y axis: its limits and its ticks. */
  axis: { domain: [number, number]; ticks: number[] };
}

/** Mean C/N0 per tractor against the level S4 predicts (normal minus the predicted sag). */
export function signalChart(episode: Episode): ChartSpec {
  // The three normals are within a tenth of a dB of each other, so one line stands for all of them.
  const normal = TRACTORS.reduce((sum, id) => sum + episode.normal[id], 0) / TRACTORS.length;
  const predicted = episode.sag.map((sag) => (sag === null ? null : normal - sag));
  const rows = tractorRows(episode, "cn0", { extra: { predicted } });
  const [low] = valueRange(rows, [...TRACTORS, "predicted"]);
  return {
    title: "Signal strength, dB-Hz",
    unit: "Mean C/N0 per tractor, against the level S4 predicts.",
    suffix: " dB-Hz",
    digits: 1,
    rows,
    dashed: { key: "predicted", name: "S4 predicts" },
    marks: [{ y: normal, label: `normal ${normal.toFixed(1)}` }],
    axis: axis(Math.floor(low - 1), normal + 2.5),
  };
}

/**
 * Unexplained loss per tractor. For spoofing the one reference line is the level
 * a healthy signal stays under; otherwise the two lines are the jamming limits.
 */
export function lossChart(episode: Episode, thresholds: Thresholds, spoofing: boolean): ChartSpec {
  const rows = tractorRows(episode, "excess");
  const [low, high] = valueRange(rows, TRACTORS);
  const marks = spoofing
    ? [{ y: thresholds.spoofMaxExcess, label: `healthy < ${thresholds.spoofMaxExcess} dB` }]
    : [
        { y: thresholds.jamTrigger, label: `trigger ${thresholds.jamTrigger} dB` },
        { y: thresholds.jamMember, label: `affected ≥ ${thresholds.jamMember} dB`, below: true },
      ];
  return {
    title: "Unexplained loss, dB",
    unit: "The drop minus what S4 predicts.",
    suffix: " dB",
    digits: 1,
    rows,
    dashed: null,
    marks,
    axis: axis(Math.min(Math.floor(low), -2), Math.max(high + 1, thresholds.jamTrigger + 3)),
  };
}

/**
 * Absolute cross-track error per tractor, with the spoofing limit. Two moments
 * are marked: when the drift passed the limit and was noticed, and the earlier
 * start the detector walked back to.
 */
export function driftChart(episode: Episode, thresholds: Thresholds, detection: Detection): ChartSpec {
  const rows = tractorRows(episode, "xte");
  const [, high] = valueRange(rows, TRACTORS);
  return {
    title: "Drift off the row, m",
    unit: "Cross-track error: the distance off the planned row.",
    suffix: " m",
    digits: 2,
    rows,
    dashed: null,
    marks: [{ y: thresholds.spoofXte, label: `limit ${thresholds.spoofXte} m` }],
    moments:
      detection.noticed === null
        ? []
        : [
            { t: detection.start, label: `start ${clock(detection.start)}` },
            { t: detection.noticed, label: `noticed ${clock(detection.noticed)}` },
          ],
    axis: axis(0, Math.max(high, thresholds.spoofXte * 3)),
  };
}

/** Share of the surrounding 10 minutes with a dropout per tractor, with the fault limit. */
export function dropoutChart(episode: Episode, thresholds: Thresholds): ChartSpec {
  const rows = tractorRows(episode, "dropout", { scale: 100 });
  const [, high] = valueRange(rows, TRACTORS);
  const limit = Math.round(thresholds.faultFrac * 100);
  return {
    title: "Dropout share, %",
    unit: "The share of the surrounding 10 minutes with a dropout.",
    suffix: "%",
    digits: 0,
    rows,
    dashed: null,
    marks: [{ y: limit, label: `limit ${limit}%` }],
    axis: axis(0, Math.max(high, limit * 2)),
  };
}

/** Share of each minute with the RTK correction link up, per tractor. */
export function linkChart(episode: Episode): ChartSpec {
  const minutes = Math.ceil((episode.n * episode.step) / 60);
  return {
    title: "Correction link up, %",
    unit: "The share of each minute with the RTK correction link up.",
    suffix: "%",
    digits: 0,
    rows: tractorRows(episode, "link", { scale: 100, maxPoints: minutes }),
    dashed: null,
    marks: [],
    axis: { domain: [0, 100], ticks: [0, 25, 50, 75, 100] },
  };
}
