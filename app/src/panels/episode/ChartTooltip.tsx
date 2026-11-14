import type { TooltipContentProps } from "recharts";
import { clock } from "../../lib/time";
import { Dot } from "../../ui/CauseBadge";

/** The box that follows the pointer on a chart: the time, then each line's value. */
export function ChartTooltip({
  active, label, payload, suffix, digits,
}: Pick<TooltipContentProps, "active" | "label" | "payload"> & { suffix: string; digits: number }) {
  if (!active || payload.length === 0) return null;
  return (
    <div className="tabular rounded-md border border-line bg-panel-raised px-2.5 py-1.5 text-xs shadow-lg shadow-black/40">
      <p className="mb-1 text-muted">{clock(Number(label), true)} UTC</p>
      {payload.map((entry) => (
        <p key={String(entry.dataKey)} className="flex items-center gap-1.5">
          <Dot color={entry.color ?? "currentColor"} />
          <span className="text-muted">{entry.name}</span>
          <span className="ml-auto pl-3 font-medium">
            {Number(entry.value).toFixed(digits)}
            {suffix}
          </span>
        </p>
      ))}
    </div>
  );
}
