import type { Day } from "../data/types";
import { LaneLabel } from "./LaneLabel";
import { span, type Scale } from "./scale";

/** Height of the row of Kp values above the S4 bars. */
const KP_ROW = 13;
/** The S4 value that fills the lane. S4 runs from 0 (calm) to about 1 (severe). */
const S4_TOP = 1;
/** Kp at or above this is a geomagnetic storm, and is written bolder. */
const KP_STORM = 5;

/** The sky lane: S4 scintillation as bars, a dotted line at the threshold, and the Kp values above. */
export function SkyLane({ y, height, sky, threshold, scale }: {
  y: number;
  height: number;
  sky: Day["sky"];
  /** The S4 level above which the detector expects the signal to sag. */
  threshold: number;
  scale: Scale;
}) {
  const floor = y + height;
  const tallest = height - KP_ROW - 2;
  const level = (s4: number) => floor - Math.min(1, s4 / S4_TOP) * tallest;

  return (
    <g>
      <LaneLabel y={y} height={KP_ROW} text="Kp" />
      <LaneLabel y={y + KP_ROW} height={height - KP_ROW} text="S4" />

      {sky.s4.map(([time, s4], i) => {
        const bar = span(scale, time, sky.s4[i + 1]?.[0] ?? time + 900);
        if (!bar || bar.width < 0.5) return null;
        const top = Math.min(level(s4), floor - 1);
        return (
          <rect
            key={time}
            x={bar.x}
            y={top}
            width={Math.max(0.5, bar.width - 0.5)}
            height={floor - top}
            className={s4 >= threshold ? "fill-sun" : "fill-faint"}
            opacity={s4 >= threshold ? 0.9 : 0.6}
          />
        );
      })}

      <line x1={scale.left} x2={scale.right} y1={level(threshold)} y2={level(threshold)} className="stroke-muted" strokeWidth={1} strokeDasharray="1 3" />
      <text x={scale.right + 5} y={level(threshold)} dominantBaseline="central" className="tabular fill-faint text-[10px]">
        {threshold.toFixed(2)}
      </text>

      {sky.kp.map(([time, kp], i) => {
        const cell = span(scale, time, sky.kp[i + 1]?.[0] ?? time + 10800);
        if (!cell || cell.width < 30) return null;
        return (
          <text
            key={time}
            x={cell.x + 3}
            y={y + KP_ROW / 2}
            dominantBaseline="central"
            className={kp >= KP_STORM ? "tabular fill-ink text-[11px] font-semibold" : "tabular fill-faint text-[11px]"}
          >
            {kp.toFixed(1)}
          </text>
        );
      })}
    </g>
  );
}
