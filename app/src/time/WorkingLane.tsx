import { LaneLabel } from "./LaneLabel";
import { span, type Scale } from "./scale";

/** A thin band that is lit during the stretches when the tractors are working. */
export function WorkingLane({ y, height, working, scale }: {
  y: number;
  height: number;
  working: [number, number][];
  scale: Scale;
}) {
  return (
    <g>
      <LaneLabel y={y} height={height} text="Working" />
      <rect x={scale.left} y={y} width={scale.right - scale.left} height={height} rx={height / 2} className="fill-line" opacity={0.6} />
      {working.map(([start, end]) => {
        const lit = span(scale, start, end);
        return lit && <rect key={start} x={lit.x} y={y} width={lit.width} height={height} rx={height / 2} className="fill-muted" opacity={0.75} />;
      })}
    </g>
  );
}
