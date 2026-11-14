import { useApp } from "../state/store";
import { dayClock } from "./format";
import type { Scale } from "./scale";

const FLAG_WIDTH = 60;
const FLAG_HEIGHT = 16;

/**
 * The line at the clock, with the time in a flag on top. When the clock is
 * outside the visible range the flag waits at that edge with an arrow. It reads
 * the clock itself, so playback redraws only this and not the lanes.
 */
export function Playhead({ scale, top, bottom, midnight }: { scale: Scale; top: number; bottom: number; midnight: number }) {
  const now = useApp((s) => s.clock);
  const side = now < scale.start ? "before" : now > scale.end ? "after" : "inside";
  const x = side === "inside" ? scale.x(now) : side === "before" ? scale.left : scale.right;
  const flagX = Math.min(scale.right - FLAG_WIDTH / 2 + 8, Math.max(scale.left + FLAG_WIDTH / 2 - 8, x)) - FLAG_WIDTH / 2;
  const middle = top + FLAG_HEIGHT / 2;
  const arrowX = side === "before" ? flagX + 7 : flagX + FLAG_WIDTH - 7;
  const arrowTip = side === "before" ? -4 : 4;

  return (
    <g pointerEvents="none">
      {side === "inside" && <line x1={x} x2={x} y1={top + FLAG_HEIGHT} y2={bottom} className="stroke-ink" strokeWidth={1.5} />}
      <rect x={flagX} y={top} width={FLAG_WIDTH} height={FLAG_HEIGHT} rx={4} className={side === "inside" ? "fill-ink" : "fill-muted"} />
      {side !== "inside" && (
        <path d={`M ${arrowX + arrowTip / 2} ${middle - 4} l ${-arrowTip} 4 l ${arrowTip} 4 z`} className="fill-page" />
      )}
      <text
        x={flagX + FLAG_WIDTH / 2 + (side === "before" ? 5 : side === "after" ? -5 : 0)}
        y={middle}
        textAnchor="middle"
        dominantBaseline="central"
        className="tabular fill-page text-[11px] font-semibold"
      >
        {dayClock(now, midnight, true)}
      </text>
    </g>
  );
}
