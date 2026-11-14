import type { ScoreSummary } from "../../data/types";
import { useApp } from "../../state/store";

/** The most the organizers' diagnostic score can be. */
const FULL_SCORE = 40;

/** The dev score of this detector beside the starter baseline's, with the one caveat that goes with it. */
export function ScoreLine() {
  const score = useApp((s) => s.index?.score);
  if (!score) return null;
  return (
    <div className="rounded-lg bg-panel-raised px-3 py-2.5">
      <div className="grid grid-cols-2 gap-3">
        <Total name="This detector" score={score.ours} />
        <Total name="Starter baseline" score={score.baseline} muted />
      </div>
      <p className="mt-2 text-xs text-faint">
        Out of {FULL_SCORE}, on the {score.ours.total} dev episodes the thresholds were set on.
      </p>
    </div>
  );
}

function Total({ name, score, muted }: { name: string; score: ScoreSummary; muted?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted">{name}</p>
      <p className={`tabular font-condensed text-[30px] font-semibold leading-tight ${muted ? "text-muted" : ""}`}>
        {score.diagnostic.toFixed(2)}
      </p>
      <div className="mb-1.5 mt-1 h-1.5 overflow-hidden rounded-full bg-line">
        <div className={`h-full rounded-full ${muted ? "bg-faint" : "bg-emerald-400"}`} style={{ width: `${(score.diagnostic / FULL_SCORE) * 100}%` }} />
      </div>
      <p className="tabular text-xs text-muted">
        {score.caught} of {score.total} caught, {score.falsePositives} false
      </p>
    </div>
  );
}
