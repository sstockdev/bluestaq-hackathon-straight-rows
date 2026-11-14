import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Detection } from "../../data/types";
import { CAUSES, TRACTORS, TRACTOR_COLOR } from "../../lib/causes";
import { clock } from "../../lib/time";
import { useApp } from "../../state/store";
import { Dot } from "../../ui/CauseBadge";
import type { ChartSpec } from "./charts";
import { ChartTooltip } from "./ChartTooltip";
import { ClickTarget } from "./ClickTarget";
import { ClockLine } from "./ClockLine";
import { timeTicks } from "./series";

const AXIS_TEXT = { fontSize: 11, fill: "var(--color-faint)" };
/** Reference line labels get an outline in the panel color, so they stay readable where a line crosses them. */
const MARK_TEXT = { fontSize: 10, fill: "var(--color-muted)", stroke: "var(--color-panel)", strokeWidth: 3, paintOrder: "stroke" };
const DASHED_COLOR = "#d5d8dc";

/**
 * One chart over the time around a detection: a line per tractor, the detection's
 * span shaded in its cause color, and a line at the map's clock. Clicking moves the clock.
 */
export function TimeChart({ spec, detection }: { spec: ChartSpec; detection: Detection }) {
  const setClock = useApp((s) => s.setClock);
  const { rows, axis, dashed } = spec;
  const from = rows[0].t;
  const to = rows[rows.length - 1].t;

  return (
    <figure className="m-0">
      <figcaption className="mb-1.5">
        <p>
          <span className="text-[13px] font-semibold">{spec.title}</span>
          <span className="ml-2 text-xs text-faint">{spec.unit}</span>
        </p>
        <ChartLegend detection={detection} dashed={dashed?.name} />
      </figcaption>
      {/* A click focuses one of the chart's inner layers. Only the chart itself should show a focus ring. */}
      <div className="h-[150px] cursor-pointer [&_g]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-line)" strokeOpacity={0.7} />
            <XAxis
              dataKey="t"
              type="number"
              domain={[from, to]}
              ticks={timeTicks(from, to)}
              tickFormatter={(t: number) => clock(t)}
              tick={AXIS_TEXT}
              tickLine={false}
              axisLine={{ stroke: "var(--color-line)" }}
            />
            <YAxis domain={axis.domain} ticks={axis.ticks} interval={0} tick={AXIS_TEXT} tickLine={false} axisLine={false} width={34} />
            <ReferenceArea x1={detection.start} x2={detection.end} fill={CAUSES[detection.cls].color} fillOpacity={0.14} ifOverflow="hidden" />
            {spec.marks.map((mark) => (
              <ReferenceLine
                key={mark.label}
                y={mark.y}
                stroke="var(--color-muted)"
                strokeWidth={1}
                strokeOpacity={0.7}
                // Recharts names the position by the edge the text hugs, so "insideBottom" is above the line.
                label={{ value: mark.label, position: mark.below ? "insideTopRight" : "insideBottomRight", ...MARK_TEXT }}
              />
            ))}
            {TRACTORS.map((id) => (
              <Line
                key={id}
                dataKey={id}
                name={id}
                stroke={TRACTOR_COLOR[id].color}
                strokeWidth={detection.tractors.includes(id) ? 2 : 1.25}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            ))}
            {dashed && (
              <Line dataKey={dashed.key} name={dashed.name} stroke={DASHED_COLOR} strokeWidth={1.5} strokeDasharray="5 4" dot={false} activeDot={false} isAnimationActive={false} />
            )}
            <ClockLine />
            <ClickTarget onPick={setClock} />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: "var(--color-faint)", strokeWidth: 1 }}
              content={(props) => <ChartTooltip {...props} suffix={spec.suffix} digits={spec.digits} />}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

/** The tractors by color, the affected ones in brighter text, and the dashed line when the chart has one. */
function ChartLegend({ detection, dashed }: { detection: Detection; dashed?: string }) {
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      {TRACTORS.map((id) => (
        <span key={id} className={detection.tractors.includes(id) ? "flex items-center gap-1.5" : "flex items-center gap-1.5 text-faint"}>
          <Dot color={TRACTOR_COLOR[id].color} />
          {id}
        </span>
      ))}
      {dashed && (
        <span className="flex items-center gap-1.5 text-muted">
          <svg width="20" height="4" aria-hidden>
            <line x1="0" x2="20" y1="2" y2="2" stroke={DASHED_COLOR} strokeWidth="1.5" strokeDasharray="5 4" />
          </svg>
          {dashed}
        </span>
      )}
    </p>
  );
}
