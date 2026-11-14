import { CircleAlert, CircleCheck, X } from "lucide-react";
import type { Detection } from "../../data/types";
import { clock, dayLabel, duration } from "../../lib/time";
import { CauseBadge } from "../../ui/CauseBadge";
import { TractorMarks } from "./TractorMarks";

/** Plain names for the kinds of equipment fault. */
const FAULT_KIND: Record<string, string> = { antenna: "Antenna", link: "Correction link", signal_loss: "Signal loss" };

/**
 * The top of the episode panel: cause, tractors, when it happened, and a close
 * button. On a dev day it also says which labeled episode the detection matches.
 */
export function EpisodeHeader({ detection, dev, onClose }: { detection: Detection; dev: boolean; onClose: () => void }) {
  const { cls, kind, start, end, tractors, label } = detection;
  return (
    <header className="sticky top-0 z-10 rounded-t-xl border-b border-line bg-panel px-4 py-3">
      <div className="flex items-center gap-2">
        <CauseBadge cause={cls} />
        {kind && <span className="text-xs text-muted">{FAULT_KIND[kind] ?? kind}</span>}
        <TractorMarks affected={tractors} />
        <button
          onClick={onClose}
          aria-label="Close"
          title="Close"
          className="-mr-1.5 ml-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-panel-raised hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>
      <p className="tabular mt-2 text-[15px] font-semibold leading-tight">
        {dayLabel(start)}, {clock(start)} to {clock(end)} UTC
        <span className="ml-2 text-xs font-normal text-muted">{duration(end - start)}</span>
      </p>
      {dev && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
          {label ? <CircleCheck size={14} className="text-emerald-400" /> : <CircleAlert size={14} className="text-amber-400" />}
          {label ? `Matches true episode ${label}` : "Matches no true episode"}
        </p>
      )}
    </header>
  );
}
