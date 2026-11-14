import type { Cause, TractorId } from "../data/types";

/** The order that Track.cause indexes into. */
export const CAUSE_ORDER: Cause[] = ["SPACE_WEATHER", "JAMMING", "SPOOFING", "EQUIPMENT_FAULT", "MULTIPATH"];

export interface CauseStyle {
  name: string;
  /** CSS color, the same value as the --color-* token in index.css. */
  color: string;
  /** The same color as [r, g, b] for deck.gl layers. */
  rgb: [number, number, number];
  action: string;
}

export const CAUSES: Record<Cause, CauseStyle> = {
  SPACE_WEATHER: { name: "Space weather", color: "#f0b429", rgb: [240, 180, 41], action: "Halt or run degraded" },
  JAMMING: { name: "Jamming", color: "#f0506e", rgb: [240, 80, 110], action: "Halt and report" },
  SPOOFING: { name: "Spoofing", color: "#9d7bf5", rgb: [157, 123, 245], action: "Halt, cross-check, report" },
  EQUIPMENT_FAULT: { name: "Equipment fault", color: "#4da3e0", rgb: [77, 163, 224], action: "Service this machine, others continue" },
  MULTIPATH: { name: "Multipath", color: "#9aa2a8", rgb: [154, 162, 168], action: "Continue, false alarm" },
};

export const TRACTORS: TractorId[] = ["T1", "T2", "T3"];

export const TRACTOR_COLOR: Record<TractorId, { color: string; rgb: [number, number, number] }> = {
  T1: { color: "#3987e5", rgb: [57, 135, 229] },
  T2: { color: "#e8703a", rgb: [232, 112, 58] },
  T3: { color: "#1fb37f", rgb: [31, 179, 127] },
};

/** A row planted with healthy guidance. */
export const HEALTHY_RGB: [number, number, number] = [120, 190, 110];

export const FIX_NAMES = ["RTK fixed", "RTK float", "DGPS", "Autonomous", "No fix"];

/**
 * Spoofing drift is at most about 12 m on an 800 m field, too small to see.
 * The map draws it this many times larger, and the Limits panel says so.
 */
export const DRIFT_EXAGGERATION = 5;
