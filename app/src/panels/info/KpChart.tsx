import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Day } from "../../data/types";
import { clock as clockText, DAY_SECONDS } from "../../lib/time";
import { AXIS_LINE, AXIS_TICK, CHART_MARGIN, hourTick, threeHourTicks, TOOLTIP_STYLE, Y_AXIS_WIDTH } from "./chartStyle";
import { KP_STORM } from "./sky";

/** Seconds that one Kp reading covers. */
const KP_SPAN = 3 * 3600;

/** Kp as eight 3-hour bars on the same time axis as the S4 chart, with the storm level and a marker at the clock. */
export function KpChart({ day, clock }: { day: Day; clock: number }) {
  // Each bar is placed at the middle of its three hours, so it spans the time it covers.
  const bars = useMemo(() => day.sky.kp.map(([t, kp]) => ({ start: t, middle: t + KP_SPAN / 2, kp })), [day]);

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={bars} margin={CHART_MARGIN} barCategoryGap={2}>
        <CartesianGrid vertical={false} stroke="var(--color-line)" />
        <XAxis
          dataKey="middle"
          type="number"
          domain={[day.t0, day.t0 + DAY_SECONDS]}
          ticks={threeHourTicks(day.t0)}
          tickFormatter={(t: number) => hourTick(t, day.t0)}
          tick={AXIS_TICK}
          axisLine={AXIS_LINE}
          tickLine={false}
        />
        <YAxis domain={[0, 9]} ticks={[0, 3, 6, 9]} width={Y_AXIS_WIDTH} tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <Tooltip
          {...TOOLTIP_STYLE}
          isAnimationActive={false}
          cursor={{ fill: "var(--color-ink)", fillOpacity: 0.06 }}
          labelFormatter={(middle) => {
            const start = Number(middle) - KP_SPAN / 2;
            return `${clockText(start)} to ${hourTick(start + KP_SPAN, day.t0)}:00 UTC`;
          }}
          formatter={(value) => [Number(value).toFixed(1), "Kp"]}
        />
        <Bar dataKey="kp" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {bars.map((bar) => (
            <Cell key={bar.start} fill={bar.kp >= KP_STORM ? "var(--color-sun)" : "var(--color-faint)"} />
          ))}
        </Bar>
        <ReferenceLine
          y={KP_STORM}
          stroke="var(--color-muted)"
          strokeDasharray="4 3"
          label={{ value: `storm level ${KP_STORM}`, position: "insideBottomLeft", fill: "var(--color-muted)", fontSize: 11 }}
        />
        <ReferenceLine x={clock} stroke="var(--color-ink)" strokeWidth={1.5} />
      </BarChart>
    </ResponsiveContainer>
  );
}
