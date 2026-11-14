import { dayClock } from "./format";
import { tickTimes, type Scale } from "./scale";

/** The hour labels along the top of the time bar, with a faint line under each one down through the lanes. */
export function AxisLane({ height, bottom, scale, midnight }: {
  height: number;
  /** The y position where the grid lines stop. */
  bottom: number;
  scale: Scale;
  midnight: number;
}) {
  return (
    <g>
      <text x={0} y={height / 2} dominantBaseline="central" className="fill-faint text-[11px]">
        UTC
      </text>
      {tickTimes(scale, midnight).map((time) => {
        const x = scale.x(time);
        return (
          <g key={time}>
            <line x1={x} x2={x} y1={height - 3} y2={bottom} className="stroke-line" strokeWidth={1} opacity={0.7} />
            <text x={x} y={height / 2} textAnchor="middle" dominantBaseline="central" className="tabular fill-muted text-[11px]">
              {dayClock(time, midnight)}
            </text>
          </g>
        );
      })}
    </g>
  );
}
