import { X } from "lucide-react";
import type { ScoreSummary } from "../../data/types";
import { CAUSES } from "../../lib/causes";
import { Dot } from "../../ui/CauseBadge";

type EpisodeResult = ScoreSummary["episodes"][string];

/** The scorer gives full onset credit within this many seconds of the label's start (README, "5-minute grace"). */
const ONSET_GRACE_S = 300;

/** "+2.8" for 170 seconds late, "-75.0" for 4500 seconds early, "0.0" for on time. */
function onsetMinutes(seconds: number): string {
  const minutes = (Math.abs(seconds) / 60).toFixed(1);
  if (minutes === "0.0") return minutes;
  return `${seconds > 0 ? "+" : "-"}${minutes}`;
}

/** The 12 labeled dev episodes, and what each detector reported for them. */
export function EpisodeTable({ baseline, ours }: { baseline: ScoreSummary; ours: ScoreSummary }) {
  const labels = Object.keys(ours.episodes).sort();
  return (
    <div>
      <table className="w-full table-fixed border-collapse text-[13px]">
        <colgroup>
          <col className="w-[58px]" />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr className="text-left text-xs text-faint">
            <th className="pb-1 font-medium">Episode</th>
            <th className="pb-1 pl-3 font-medium">Starter baseline</th>
            <th className="pb-1 pl-3 font-medium">This detector</th>
          </tr>
        </thead>
        <tbody>
          {labels.map((label) => (
            <tr key={label} className="border-t border-line">
              <td className="tabular py-[3px] text-muted">{label}</td>
              <td className="py-[3px] pl-3">
                <Reported result={baseline.episodes[label]} />
              </td>
              <td className="py-[3px] pl-3">
                <Reported result={ours.episodes[label]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs leading-snug text-faint">
        The number is the onset error in minutes: plus is late, minus is early.{" "}
        <span className="text-amber-300">Amber</span> is outside the scorer's 5 minute grace.
      </p>
    </div>
  );
}

/** One detector's result for one episode: the cause it reported and its onset error, or "missed". */
function Reported({ result }: { result: EpisodeResult | undefined }) {
  if (!result || result.predicted === null) {
    return (
      <span className="flex items-center gap-1.5 text-faint">
        <X size={13} aria-hidden />
        missed
      </span>
    );
  }
  const { name, color } = CAUSES[result.predicted];
  const late = result.onset_s !== null && Math.abs(result.onset_s) > ONSET_GRACE_S;
  return (
    <span className="flex items-center gap-1.5">
      <Dot color={color} />
      <span className="truncate">{name}</span>
      {!result.correct && <span className="text-xs text-faint">wrong cause</span>}
      {result.onset_s !== null && (
        <span className={`tabular ml-auto text-xs ${late ? "font-semibold text-amber-300" : "text-muted"}`}>
          {onsetMinutes(result.onset_s)}
        </span>
      )}
    </span>
  );
}
