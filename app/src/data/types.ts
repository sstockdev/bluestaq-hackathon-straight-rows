/**
 * The shapes of the JSON files in public/data/.
 *
 * app/tools/export_data.py writes them; everything in src/ reads them through
 * data/load.ts. This file is the contract between the two.
 *
 * Times: `t0`, `start`, `end`, and `t` are UTC epoch seconds. Sample arrays in a
 * Track or an Episode are evenly spaced: sample i is at `t0 + i * step` seconds.
 * A missing measurement is null.
 */

export type Cause = "SPACE_WEATHER" | "JAMMING" | "SPOOFING" | "EQUIPMENT_FAULT" | "MULTIPATH";
export type TractorId = "T1" | "T2" | "T3";

/** public/data/index.json */
export interface Index {
  days: DayInfo[];
  /** [lon, lat] of the middle of the field, and its [west, south, east, north] box while working. */
  field: { center: [number, number]; bounds: [number, number, number, number] };
  thresholds: Thresholds;
  rules: Rules;
  /** How many detections submission.json holds and its SHA-256, or null when the file was not there at export time. */
  submission: { detections: number; sha256: string } | null;
  /** Dev-day results from the organizers' scorer. */
  score: { ours: ScoreSummary; baseline: ScoreSummary };
  decisions: Decision[];
}

export interface DayInfo {
  /** "2026-05-04" */
  date: string;
  /** "May 4" */
  label: string;
  /** The two dev days have labels; the eval day is what was submitted. */
  kind: "dev" | "eval";
  /** Epoch seconds of 00:00 UTC on this date. */
  t0: number;
}

export interface Thresholds {
  sagMin: number;
  sagIntercept: number;
  sagSlope: number;
  swMinDrop: number;
  jamTrigger: number;
  jamMember: number;
  spoofXte: number;
  spoofMaxExcess: number;
  faultGap: number;
  faultFrac: number;
  mpGap: number;
}

/** How flagged seconds become one event: gaps up to mergeGapS are bridged, and events under minS are dropped. */
export interface EventRule {
  mergeGapS: number;
  minS: number;
}

/** The detector's windows, limits, and confidence weights, as the How panel prints them. All from config.py. */
export interface Rules {
  /** A tractor is working above this speed, in m/s. */
  workingSpeed: number;
  /** The median window on the signal drop, in seconds. */
  smoothS: number;
  /** The most detections a submission may hold. */
  maxDetections: number;
  events: Record<"spaceWeather" | "jamming" | "spoofing" | "antenna" | "link", EventRule>;
  /** Jamming loss that differs by this many dB between tractors counts as graded. */
  gradedSpread: number;
  /** An interference report counts when it arrives within this many seconds of the start. */
  rfiMaxDelayS: number;
  spoofSmoothS: number;
  /** The window dropout seconds are counted over, in seconds. */
  faultWindowS: number;
  /** A multipath dip lasts minS to maxS seconds and needs minRecur dips at one latitude. */
  multipath: { minS: number; maxS: number; minRecur: number };
  confidence: {
    base: number;
    min: number;
    max: number;
    noS4Cap: number;
    singleLossCap: number;
    sagMatchDb: number;
    uniformDb: number;
    strongRfi: number;
    healthySignalDb: number;
    neighborDropout: number;
    /** What each piece of evidence adds or subtracts, keyed by cause and then by the term's name in config.py. */
    terms: Record<Cause, Record<string, number>>;
  };
}

export interface ScoreSummary {
  diagnostic: number;
  macroF1: number;
  timing: number;
  caught: number;
  total: number;
  falsePositives: number;
  f1: Record<Cause, number>;
  /** Keyed by dev label id, such as "TRN-05". */
  episodes: Record<string, { predicted: Cause | null; onset_s: number | null; correct: boolean }>;
}

export interface Decision {
  id: number;
  title: string;
  choice: string;
  rejected: string[];
  evidence: string;
  limitation: string;
  in_demo: boolean;
}

/** public/data/day-YYYY-MM-DD.json */
export interface Day {
  date: string;
  kind: "dev" | "eval";
  t0: number;
  /** Seconds between samples in every Track (5). */
  step: number;
  /** Samples per Track (17280 for a full day at 5 s). */
  n: number;
  tractors: Record<TractorId, Track>;
  sky: {
    /** [epoch seconds, S4] every 15 minutes. */
    s4: [number, number][];
    /** [epoch seconds, Kp] every 3 hours. */
    kp: [number, number][];
  };
  /** Stretches when the tractors are working, as [start, end] epoch seconds. */
  working: [number, number][];
  /** This detector's detections, multipath excluded, in time order. */
  detections: Detection[];
  /** Multipath is reported on every headland pass, so it is kept compact. */
  multipath: {
    /** Latitude of the recurring spot per tractor, or null when none was found. */
    spotLat: Record<TractorId, number | null>;
    /** [start, end] epoch seconds of each reported pass. */
    passes: Record<TractorId, [number, number][]>;
    /** Confidence and evidence of one representative pass per tractor. */
    example: Record<TractorId, { confidence: number; evidence: string[] } | null>;
  };
  /**
   * The starter baseline's detections. On dev days `wrong` marks one the scorer counted
   * as a false positive; it can still carry the id of a label it overlaps.
   */
  baseline: Block[];
  /** The dev labels. Empty on the eval day. */
  labels: Block[];
  reports: Report[];
  advisories: { id: string; t: number; type: string; text: string }[];
}

/** One tractor's samples for a day. Every array has Day.n entries. */
export interface Track {
  lon: number[];
  lat: number[];
  /** 1 while working, 0 while parked. */
  working: number[];
  /** Mean C/N0 in dB-Hz. */
  cn0: (number | null)[];
  /** dB below the tractor's normal level. */
  drop: (number | null)[];
  /** dB of drop that S4 does not explain. */
  excess: (number | null)[];
  /** Absolute cross-track error in meters. */
  xte: (number | null)[];
  /** Mean C/N0 minus the weakest satellite, worst value in the step. */
  gap: (number | null)[];
  /** Share of the step with the RTK correction link up, 0 to 1. */
  link: (number | null)[];
  /** Fix quality: 0 RTK_FIXED, 1 RTK_FLOAT, 2 DGPS, 3 AUTONOMOUS, 4 NO_FIX (worst in the step). */
  fix: number[];
  /**
   * The cause this detector reported on this tractor at this moment, as an index
   * into CAUSE_ORDER in lib/causes.ts, or -1 for none. Multipath is not included.
   * When causes overlap, the more specific one wins: spoofing, then jamming,
   * then equipment fault, then space weather.
   */
  cause: number[];
}

export interface Detection {
  /** Stable id, such as "d0506-0212-JAMMING-T1T2T3". Also the episode file name. */
  id: string;
  cls: Cause;
  /** For equipment faults: "antenna", "link", or "signal_loss". Otherwise null. */
  kind: string | null;
  start: number;
  end: number;
  tractors: TractorId[];
  /** The action identifier from the guide, such as "HALT_AND_REPORT". */
  action: string;
  confidence: number;
  /** What moved the confidence from its 0.60 start: [reason, weight]. */
  terms: [string, number][];
  /** Four sentences: on the farm, other machines, the sky, action. */
  evidence: string[];
  /** How the detector reached this result, in order. */
  steps: string[];
  /** The dev label this detection matches, such as "TRN-05", or null. */
  label: string | null;
  /**
   * For spoofing: when the drift first passed the limit, in epoch seconds. The
   * start is earlier, because it is walked back along the drift. Otherwise null.
   */
  noticed: number | null;
}

/** A labeled episode or a baseline detection, drawn as a block on the timeline. */
export interface Block {
  id: string | null;
  cls: Cause;
  start: number;
  end: number;
  tractors: TractorId[];
  wrong?: boolean;
}

/** An interference report from the RFI feed. */
export interface Report {
  id: string;
  t: number;
  lat: number;
  lon: number;
  semiMajorKm: number;
  semiMinorKm: number;
  confidence: number;
  text: string;
  /** Distance from the middle of the field. */
  km: number;
}

/** public/data/episode-<detection id>.json: finer samples around one detection. */
export interface Episode {
  id: string;
  /** Epoch seconds of sample 0. */
  t0: number;
  step: number;
  n: number;
  /** The detection's own start and end. */
  start: number;
  end: number;
  /** Each tractor's normal mean C/N0. */
  normal: Record<TractorId, number>;
  series: Record<TractorId, EpisodeSeries>;
  s4: (number | null)[];
  /** dB of sag that S4 predicts. */
  sag: (number | null)[];
  kp: (number | null)[];
}

export interface EpisodeSeries {
  cn0: (number | null)[];
  drop: (number | null)[];
  excess: (number | null)[];
  xte: (number | null)[];
  gap: (number | null)[];
  /** Share of the surrounding 10 minutes with a dropout, 0 to 1. */
  dropout: (number | null)[];
  link: (number | null)[];
}
