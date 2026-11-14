import clsx from "clsx";
import { SWEEP } from "../../data/limits";

/** The sensitivity sweep as one number and one square per threshold move: grey changed nothing on dev, amber broke something. */
export function SweepSquares() {
  const broke = SWEEP.moves - SWEEP.unchanged;
  const full = `${SWEEP.thresholds} thresholds, each moved down and up by a quarter and rerun on dev. ${SWEEP.unchanged} moves change nothing. ${broke} break something. The first limit below names them.`;
  return (
    <div title={full} className="rounded-lg bg-panel-raised px-3 py-2.5">
      <p className="flex items-baseline gap-2">
        <span className="tabular font-condensed text-[26px] font-semibold leading-none">
          {SWEEP.unchanged} of {SWEEP.moves}
        </span>
        <span className="text-xs text-muted">threshold moves change nothing</span>
        <span className="tabular ml-auto text-xs font-semibold text-amber-300">{broke} break</span>
      </p>
      <div className="mt-2 flex gap-1" role="img" aria-label={`${SWEEP.unchanged} of ${SWEEP.moves} threshold moves change nothing on dev`}>
        {Array.from({ length: SWEEP.moves }, (_, i) => (
          <span key={i} className={clsx("h-3 flex-1 rounded-sm", i < SWEEP.unchanged ? "bg-faint/60" : "bg-amber-400")} />
        ))}
      </div>
    </div>
  );
}
