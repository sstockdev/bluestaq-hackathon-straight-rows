/** Shared looks for the Recharts charts in the Sky panel, so the two charts line up and match. */

import { DAY_SECONDS } from "../../lib/time";

export const AXIS_TICK = { fill: "var(--color-muted)", fontSize: 11 };
export const AXIS_LINE = { stroke: "var(--color-line)" };
export const CHART_MARGIN = { top: 8, right: 10, bottom: 0, left: 0 };
/** Both charts give the y axis this width, so their time axes start at the same place. */
export const Y_AXIS_WIDTH = 30;

export const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--color-panel-raised)",
    border: "1px solid var(--color-line)",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
  },
  labelStyle: { color: "var(--color-muted)" },
  itemStyle: { color: "var(--color-ink)", padding: 0 },
};

/** Epoch seconds of every third hour of a day, 00:00 through 24:00, for the time axis. */
export function threeHourTicks(t0: number): number[] {
  return Array.from({ length: 9 }, (_, i) => t0 + (i * DAY_SECONDS) / 8);
}

/** "06" for an axis tick, counted from the start of the day so that the last tick reads 24. */
export function hourTick(epoch: number, t0: number): string {
  return String(Math.round((epoch - t0) / 3600)).padStart(2, "0");
}
