import { X } from "lucide-react";
import type { Detection } from "../../data/types";
import { CAUSES } from "../../lib/causes";
import { clock, dayLabel, duration } from "../../lib/time";
import { CauseBadge } from "../../ui/CauseBadge";
import { Match } from "../../ui/Match";
import { TractorMarks } from "./TractorMarks";

/** Plain names for the kinds of equipment fault. */
const FAULT_KIND: Record<string, string> = { antenna: "Antenna", link: "Correction link", signal_loss: "Signal loss" };

/**
 * The top of the episode panel. The action is the headline, because it is what
 * the operator does next. Above it: the cause, the tractors, and on a dev day
 * the true episode the detection matches. Under it: when it happened.
 */
export function EpisodeHeader({ detection, dev, onClose }: { detection: Detection; dev: boolean; onClose: () => void }) {
  const { cls, kind, start, end, tractors, label } = detection;
  const { color, action } = CAUSES[cls];
  return (
    <header className="sticky top-0 z-10 rounded-t-xl border-b border-line bg-panel px-4 py-3" style={{ boxShadow: `inset 3px 0 0 ${color}` }}>
      <div className="flex items-center gap-2">
        <CauseBadge cause={cls} />
        {kind && <span className="text-xs text-muted">{FAULT_KIND[kind] ?? kind}</span>}
        <TractorMarks affected={tractors} />
        {dev && <Match label={label} />}
        <button
          onClick={onClose}
          aria-label="Close"
          title="Close"
          className="-mr-1.5 ml-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-panel-raised hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>
      <p className="mt-2 font-condensed text-[26px] font-semibold leading-tight">{action}</p>
      <p className="tabular mt-0.5 text-xs text-muted">
        {dayLabel(start)}, {clock(start)} to {clock(end)} UTC, {duration(end - start)}
      </p>
    </header>
  );
}
