import clsx from "clsx";
import { ChevronDown, CircleAlert, CircleCheck } from "lucide-react";
import { useState } from "react";
import type { Day, Detection } from "../data/types";
import { CAUSES, TRACTORS } from "../lib/causes";
import { clock, dayLabel } from "../lib/time";
import { useApp } from "../state/store";
import { CauseBadge } from "../ui/CauseBadge";
import { Panel, PanelHeader } from "../ui/Panel";
import { EvidenceRows } from "./episode/EvidenceRows";
import { TractorMarks } from "./episode/TractorMarks";

/** The day's detections as a table. Clicking a row selects it, which opens the episode panel. */
export default function DetectionsPanel() {
  const day = useApp((s) => s.day);
  const selectedId = useApp((s) => s.selectedId);
  const select = useApp((s) => s.select);
  if (!day) return null;
  const dev = day.kind === "dev";

  return (
    // The wrapper takes the height left above the time bar, and the panel scrolls inside it when it is taller.
    <div className="flex min-h-0 flex-col self-stretch">
      <Panel className={clsx("min-h-0 overflow-y-auto", dev ? "w-[450px]" : "w-[380px]")}>
        <PanelHeader title="Detections" note={`${day.detections.length} on ${dayLabel(day.t0)}`} />
        <table className="w-full border-collapse whitespace-nowrap text-[13px]">
          <thead>
            <tr className="text-left text-xs text-faint [&>th]:px-1.5 [&>th]:pb-1.5 [&>th]:pt-2.5 [&>th]:font-normal">
              <th className="!pl-4">Start</th>
              <th>Cause</th>
              <th>Tractors</th>
              <th className={dev ? undefined : "!pr-4"}>Confidence</th>
              {dev && <th className="!pr-4">True episode</th>}
            </tr>
          </thead>
          <tbody>
            {day.detections.map((detection) => (
              <DetectionRow key={detection.id} detection={detection} dev={dev} selected={detection.id === selectedId} onSelect={() => select(detection)} />
            ))}
          </tbody>
        </table>
        <MultipathSummary day={day} />
      </Panel>
    </div>
  );
}

function DetectionRow({ detection, dev, selected, onSelect }: { detection: Detection; dev: boolean; selected: boolean; onSelect: () => void }) {
  const { start, cls, tractors, confidence, label } = detection;
  return (
    <tr
      onClick={onSelect}
      onKeyDown={(event) => event.key === "Enter" && onSelect()}
      tabIndex={0}
      aria-selected={selected}
      className={clsx(
        "cursor-pointer border-t border-line/60 transition-colors [&>td]:px-1.5 [&>td]:py-2",
        selected ? "bg-accent/20 shadow-[inset_3px_0_0_var(--color-accent)]" : "hover:bg-panel-raised",
      )}
    >
      <td className="tabular !pl-4 font-medium">{clock(start)}</td>
      <td>
        <CauseBadge cause={cls} />
      </td>
      <td>
        <TractorMarks affected={tractors} aligned />
      </td>
      <td className={dev ? undefined : "!pr-4"}>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-10 overflow-hidden rounded-full bg-line">
            <span className="block h-full rounded-full" style={{ width: `${confidence * 100}%`, background: CAUSES[cls].color }} />
          </span>
          <span className="tabular">{confidence.toFixed(2)}</span>
        </span>
      </td>
      {dev && (
        <td className="!pr-4">
          <span className="tabular flex items-center gap-1.5 text-muted">
            {label ? <CircleCheck size={14} className="text-emerald-400" /> : <CircleAlert size={14} className="text-amber-400" />}
            {label ?? "none"}
          </span>
        </td>
      )}
    </tr>
  );
}

/** One row for all of the day's multipath reports, with one tractor's example behind a toggle. */
function MultipathSummary({ day }: { day: Day }) {
  const [open, setOpen] = useState(false);
  const { passes, example } = day.multipath;
  const total = TRACTORS.reduce((sum, id) => sum + passes[id].length, 0);
  const shown = TRACTORS.find((id) => example[id] !== null);
  const sample = shown ? example[shown] : null;

  return (
    <div className="border-t border-line px-4 py-3">
      <button onClick={() => setOpen(!open)} disabled={!sample} aria-expanded={open} className="flex w-full cursor-pointer items-center gap-2 text-left">
        <CauseBadge cause="MULTIPATH" />
        <span className="tabular text-[13px] font-medium">{total} passes reported</span>
        <span className="tabular text-xs text-muted">{TRACTORS.map((id) => `${id} ${passes[id].length}`).join(", ")}</span>
        {sample && <ChevronDown size={16} className={clsx("ml-auto text-muted transition-transform", open && "rotate-180")} />}
      </button>
      <p className="mt-1.5 text-xs text-muted">
        Only one pass is scored and nothing says which, so every pass over the headland spot is reported.
      </p>
      {open && sample && (
        <div className="mt-3 rounded-lg bg-panel-raised/60 px-3 py-2.5">
          <p className="tabular mb-2 text-xs text-muted">
            One of {shown}'s passes, confidence {sample.confidence.toFixed(2)}
          </p>
          <EvidenceRows sentences={sample.evidence} />
        </div>
      )}
    </div>
  );
}
