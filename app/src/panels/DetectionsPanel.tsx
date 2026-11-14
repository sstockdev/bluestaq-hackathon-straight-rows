import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Day, Detection } from "../data/types";
import { CAUSES, TRACTORS } from "../lib/causes";
import { clock, dayLabel, duration } from "../lib/time";
import { useApp } from "../state/store";
import { Match } from "../ui/Match";
import { Panel, PanelHeader } from "../ui/Panel";
import { EvidenceRows } from "./episode/EvidenceRows";
import { TractorMarks } from "./episode/TractorMarks";

/** The columns every row shares: when, what and what to do, which tractors, how sure. */
const ROW = "grid w-full grid-cols-[3rem_1fr_auto_3rem] items-center gap-x-2.5 px-4 py-2 text-left";

/**
 * The day's detections, one row each: when it started and how long it ran, the
 * cause and its action, the tractors, and the confidence. A stripe in the cause's
 * color runs down the left. Clicking a row selects it, which opens the episode panel.
 */
export default function DetectionsPanel() {
  const day = useApp((s) => s.day);
  const selectedId = useApp((s) => s.selectedId);
  const select = useApp((s) => s.select);
  if (!day) return null;

  return (
    // The wrapper takes the height left above the time bar, and the panel scrolls inside it when it is taller.
    <div className="flex min-h-0 flex-col self-stretch">
      <Panel className="min-h-0 w-[450px] overflow-y-auto">
        <PanelHeader title="Detections" note={`${day.detections.length} on ${dayLabel(day.t0)}`} />
        <ul className="m-0 list-none p-0">
          {day.detections.map((detection) => (
            <DetectionRow
              key={detection.id}
              detection={detection}
              dev={day.kind === "dev"}
              selected={detection.id === selectedId}
              onSelect={() => select(detection)}
            />
          ))}
        </ul>
        <MultipathSummary day={day} />
      </Panel>
    </div>
  );
}

function DetectionRow({ detection, dev, selected, onSelect }: { detection: Detection; dev: boolean; selected: boolean; onSelect: () => void }) {
  const { start, end, cls, tractors, confidence, label } = detection;
  const { name, color, action } = CAUSES[cls];
  return (
    <li className="border-t border-line/60 first:border-t-0">
      <button
        onClick={onSelect}
        aria-pressed={selected}
        className={clsx(ROW, "cursor-pointer transition-colors", selected ? "bg-accent/20" : "hover:bg-panel-raised")}
        style={{ boxShadow: `inset 3px 0 0 ${color}` }}
      >
        <span>
          <span className="tabular block text-[15px] font-semibold leading-tight">{clock(start)}</span>
          <span className="tabular block text-[11px] text-muted">{duration(end - start)}</span>
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-[13.5px] font-semibold leading-tight" style={{ color }}>
            {name}
            {dev && <Match label={label} />}
          </span>
          <span className="mt-0.5 block truncate text-xs leading-tight text-muted" title={action}>{action}</span>
        </span>
        <TractorMarks affected={tractors} aligned />
        <span className="text-right">
          <span className="tabular block font-condensed text-[18px] font-semibold leading-tight">{confidence.toFixed(2)}</span>
          <span className="mt-0.5 block h-1 overflow-hidden rounded-full bg-line">
            <span className="block h-full rounded-full" style={{ width: `${confidence * 100}%`, background: color }} />
          </span>
        </span>
      </button>
    </li>
  );
}

/** One row for all of the day's multipath reports, with the reason and one tractor's example behind a toggle. */
function MultipathSummary({ day }: { day: Day }) {
  const [open, setOpen] = useState(false);
  const { passes, example } = day.multipath;
  const { name, color, action } = CAUSES.MULTIPATH;
  const total = TRACTORS.reduce((sum, id) => sum + passes[id].length, 0);
  const shown = TRACTORS.find((id) => example[id] !== null);
  const sample = shown ? example[shown] : null;

  return (
    <div className="border-t border-line">
      <button
        onClick={() => setOpen(!open)}
        disabled={!sample}
        aria-expanded={open}
        className={clsx(ROW, sample && "cursor-pointer transition-colors hover:bg-panel-raised")}
        style={{ boxShadow: `inset 3px 0 0 ${color}` }}
      >
        <span>
          <span className="tabular block text-[15px] font-semibold leading-tight">{total}</span>
          <span className="block text-[11px] text-muted">passes</span>
        </span>
        <span>
          <span className="block text-[13.5px] font-semibold leading-tight" style={{ color }}>{name}</span>
          <span className="mt-0.5 block text-xs leading-tight text-muted">{action}</span>
        </span>
        <span />
        {sample && <ChevronDown size={16} className={clsx("ml-auto text-muted transition-transform", open && "rotate-180")} />}
      </button>
      {open && sample && (
        <div className="mx-4 mb-3 rounded-lg bg-panel-raised/60 px-3 py-2.5">
          <p className="tabular mb-2 text-xs text-muted">
            Every pass over the headland spot is reported, because only one is scored and nothing says which. This is
            one of {shown}'s, at confidence {sample.confidence.toFixed(2)}.
          </p>
          <EvidenceRows sentences={sample.evidence} />
        </div>
      )}
    </div>
  );
}
