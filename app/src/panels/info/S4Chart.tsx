import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Day } from "../../data/types";
import { clock as clockText, DAY_SECONDS } from "../../lib/time";
import { AXIS_LINE, AXIS_TICK, CHART_MARGIN, hourTick, threeHourTicks, TOOLTIP_STYLE, Y_AXIS_WIDTH } from "./chartStyle";

/** The top of the S4 axis. Every day uses it unless a reading goes higher, so days can be compared by eye. */
const S4_AXIS_TOP = 0.8;

/** S4 through the day as a stepped line, with the level where sag starts and a marker at the clock. */
export function S4Chart({ day, sagMin, clock }: { day: Day; sagMin: number; clock: number }) {
  const points = useMemo(() => {
    const samples = day.sky.s4.map(([t, s4]) => ({ t, s4 }));
    const last = samples[samples.length - 1];
    // Carry the last reading to midnight so its step is drawn at full width.
    return last ? [...samples, { t: day.t0 + DAY_SECONDS, s4: last.s4 }] : samples;
  }, [day]);
  const highest = Math.max(...points.map((p) => p.s4), 0);
  const top = Math.max(S4_AXIS_TOP, Math.ceil(highest * 10) / 10);

  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={points} margin={CHART_MARGIN}>
        <CartesianGrid vertical={false} stroke="var(--color-line)" />
        <XAxis
          dataKey="t"
          type="number"
          domain={[day.t0, day.t0 + DAY_SECONDS]}
          ticks={threeHourTicks(day.t0)}
          tickFormatter={(t: number) => hourTick(t, day.t0)}
          tick={AXIS_TICK}
          axisLine={AXIS_LINE}
          tickLine={false}
        />
        <YAxis
          domain={[0, top]}
          ticks={[0, 0.2, 0.4, 0.6, 0.8].filter((v) => v <= top)}
          width={Y_AXIS_WIDTH}
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          isAnimationActive={false}
          cursor={{ stroke: "var(--color-faint)" }}
          labelFormatter={(t) => `${clockText(Number(t))} UTC`}
          formatter={(value) => [Number(value).toFixed(3), "S4"]}
        />
        <ReferenceLine
          y={sagMin}
          stroke="var(--color-muted)"
          strokeDasharray="4 3"
          label={{ value: `sag starts at ${sagMin}`, position: "insideBottomLeft", fill: "var(--color-muted)", fontSize: 11 }}
        />
        <Line type="stepAfter" dataKey="s4" stroke="var(--color-sun)" strokeWidth={2} dot={false} isAnimationActive={false} />
        <ReferenceLine x={clock} stroke="var(--color-ink)" strokeWidth={1.5} />
      </LineChart>
    </ResponsiveContainer>
  );
}
