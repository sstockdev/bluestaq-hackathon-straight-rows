import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import type { Cause } from "../../data/types";
import { CAUSES } from "../../lib/causes";
import { CauseBadge } from "../../ui/CauseBadge";
import { EventStrip } from "./EventStrip";
import { Stage } from "./Flow";
import type { Outcome, Path } from "./flows";

/** The chosen detector's part of the flowchart: flag seconds, join them into events, check each event. */
export function CauseBranch({ cause, paths }: { cause: Cause; paths: Path[] }) {
  const { color } = CAUSES[cause];
  return (
    <Stage n={4} title="Seconds become events" color={color} aside={<CauseBadge cause={cause} />}>
      <div className="flex flex-col gap-2.5">
        {paths.map((path) => (
          <div key={path.flag} className="overflow-hidden rounded-md border border-line bg-panel">
            <Row label={path.name ?? "Flag"} title={path.detail} color={path.name ? color : undefined}>
              <span className="font-medium">{path.flag}</span>
            </Row>
            <Row label="Join">
              <EventStrip color={color} gapLabel={path.gapLabel} dropLabel={path.dropLabel} />
            </Row>
            {path.check && (
              <Row label="Check" title={path.check.detail}>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="inline-block h-2 w-2 rotate-45 border border-muted" aria-hidden />
                    {path.check.question}
                  </span>
                  {path.check.outcomes.map((outcome) => (
                    <OutcomeChip key={outcome.answer} outcome={outcome} color={color} />
                  ))}
                </span>
              </Row>
            )}
          </div>
        ))}
      </div>
    </Stage>
  );
}

/** One step of a path: a short label on the left and the step on the right. `title` is the full rule, shown on hover. */
function Row({ label, title, color, children }: { label: string; title?: string; color?: string; children: ReactNode }) {
  return (
    <div title={title} className="grid grid-cols-[4.25rem_1fr] items-center gap-2 border-t border-line px-2.5 py-2 first:border-t-0">
      <span className={clsx("text-[11px] font-medium leading-tight", !color && "text-faint")} style={color ? { color } : undefined}>
        {label}
      </span>
      {children}
    </div>
  );
}

/** One answer to a check and where it leads. A dropped event is shown faint. */
function OutcomeChip({ outcome, color }: { outcome: Outcome; color: string }) {
  return (
    <span className={clsx("flex items-center gap-1 text-xs", !outcome.kept && "text-muted")}>
      <span
        className={clsx("tabular rounded-full px-1.5 py-px font-semibold", !outcome.kept && "ring-1 ring-line")}
        style={outcome.kept ? { color, boxShadow: `0 0 0 1px ${color}80`, background: `${color}1f` } : undefined}
      >
        {outcome.answer}
      </span>
      <ArrowRight size={11} className="text-faint" aria-hidden />
      {outcome.result}
    </span>
  );
}
