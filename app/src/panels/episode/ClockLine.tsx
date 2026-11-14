import { ReferenceLine } from "recharts";
import { useApp } from "../../state/store";

/**
 * The vertical line at the map's clock, drawn inside a chart. It reads the clock
 * itself, so during playback only this line redraws and the chart around it does not.
 */
export function ClockLine() {
  const clock = useApp((s) => s.clock);
  return <ReferenceLine x={clock} stroke="var(--color-ink)" strokeWidth={1.5} ifOverflow="discard" />;
}
