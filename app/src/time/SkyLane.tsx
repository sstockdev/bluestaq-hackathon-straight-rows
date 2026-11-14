import type { Day } from "../data/types";
import { LaneLabel } from "./LaneLabel";
import { span, type Scale } from "./scale";

/** The S4 value that fills the lane. S4 runs from 0 (calm) to about 1 (severe). */
const S4_TOP = 1;

/** The sky lane: S4 scintillation as bars, lit where it passes the threshold, with a dotted line at the threshold. */
export function SkyLane({ y, height, s4, threshold, scale }: {
  y: number;
  height: number;
  s4: Day["sky"]["s4"];
  /** The S4 level above which the detector expects the signal to sag. */
  threshold: number;
  scale: Scale;
}) {
  const floor = y + height;
  const level = (value: number) => floor - Math.min(1, value / S4_TOP) * (height - 2);

  return (
    <g>
      <LaneLabel y={y} height={height} text="S4" />
      {s4.map(([time, value], i) => {
        const bar = span(scale, time, s4[i + 1]?.[0] ?? time + 900);
        if (!bar || bar.width < 0.5) return null;
        const top = Math.min(level(value), floor - 1);
        return (
          <rect
            key={time}
            x={bar.x}
            y={top}
            width={Math.max(0.5, bar.width - 0.5)}
            height={floor - top}
            className={value >= threshold ? "fill-sun" : "fill-faint"}
            opacity={value >= threshold ? 0.9 : 0.6}
          />
        );
      })}
      <line x1={scale.left} x2={scale.right} y1={level(threshold)} y2={level(threshold)} className="stroke-muted" strokeWidth={1} strokeDasharray="1 3" />
      <text x={scale.right + 5} y={level(threshold)} dominantBaseline="central" className="tabular fill-faint text-[10px]">
        {threshold.toFixed(2)}
      </text>
    </g>
  );
}
