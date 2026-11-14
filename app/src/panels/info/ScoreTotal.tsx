import type { ScoreSummary } from "../../data/types";

/** The most the organizers' diagnostic score can be. */
export const FULL_SCORE = 40;

/** One detector's diagnostic score as a large number out of 40, with its three supporting counts underneath. */
export function ScoreTotal({ name, score, barClass }: { name: string; score: ScoreSummary; barClass: string }) {
  return (
    <div className="rounded-lg bg-panel-raised px-3 py-3">
      <div className="text-xs text-muted">{name}</div>
      <div className="tabular mt-1 font-condensed text-[44px] font-semibold leading-none">
        {score.diagnostic.toFixed(2)}
        <span className="ml-1.5 text-lg font-medium text-faint">of {FULL_SCORE}</span>
      </div>
      <div className="mt-2.5 h-1.5 rounded-full bg-line">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${(score.diagnostic / FULL_SCORE) * 100}%` }} />
      </div>
      <dl className="tabular mt-3 flex flex-col gap-1 text-[13px]">
        <Count label="Episodes caught" value={`${score.caught} of ${score.total}`} />
        <Count label="False positives" value={String(score.falsePositives)} />
        <Count label="Onset credit" value={score.timing.toFixed(3)} />
      </dl>
    </div>
  );
}

function Count({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
