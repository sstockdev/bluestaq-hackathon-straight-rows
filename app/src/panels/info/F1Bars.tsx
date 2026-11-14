import type { Cause, ScoreSummary } from "../../data/types";
import { CAUSE_ORDER, CAUSES } from "../../lib/causes";
import { Dot } from "../../ui/CauseBadge";

/** F1 per cause as paired bars: the baseline in grey above, this detector in the cause's color below. */
export function F1Bars({ baseline, ours }: { baseline: ScoreSummary; ours: ScoreSummary }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-faint" />
          Starter baseline
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-2 w-4 overflow-hidden rounded-sm">
            {CAUSE_ORDER.map((cause) => (
              <span key={cause} className="flex-1" style={{ background: CAUSES[cause].color }} />
            ))}
          </span>
          This detector
        </span>
      </div>
      {CAUSE_ORDER.map((cause) => (
        <CauseRow key={cause} cause={cause} baseline={baseline.f1[cause]} ours={ours.f1[cause]} />
      ))}
    </div>
  );
}

function CauseRow({ cause, baseline, ours }: { cause: Cause; baseline: number; ours: number }) {
  const { name, color } = CAUSES[cause];
  return (
    <div className="grid grid-cols-[124px_1fr] items-center gap-2">
      <span className="flex items-center gap-2 text-[13px]">
        <Dot color={color} />
        {name}
      </span>
      <div className="flex flex-col gap-0.5">
        <F1Bar value={baseline} color="var(--color-faint)" label={`Starter baseline, ${name}`} muted />
        <F1Bar value={ours} color={color} label={`This detector, ${name}`} />
      </div>
    </div>
  );
}

/** One horizontal bar on a 0 to 1 scale, with its value at the right. */
function F1Bar({ value, color, label, muted }: { value: number; color: string; label: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2" title={`${label}: F1 ${value.toFixed(2)}`}>
      <div className="h-2 flex-1 rounded-r bg-line/40">
        <div className="h-full rounded-r" style={{ width: `${value * 100}%`, background: color }} />
      </div>
      <span className={`tabular w-8 text-right text-xs leading-none ${muted ? "text-muted" : "text-ink"}`}>{value.toFixed(2)}</span>
    </div>
  );
}
