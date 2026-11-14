import clsx from "clsx";
import { SWEEP } from "../../data/limits";

/** The sensitivity sweep as one square per threshold move: grey changed nothing on dev, amber broke something. */
export function SweepSquares() {
  const broke = SWEEP.moves - SWEEP.unchanged;
  return (
    <div className="rounded-lg bg-panel-raised px-3 py-3">
      <div className="flex gap-1" role="img" aria-label={`${SWEEP.unchanged} of ${SWEEP.moves} threshold moves change nothing on dev`}>
        {Array.from({ length: SWEEP.moves }, (_, i) => (
          <span key={i} className={clsx("h-3 flex-1 rounded-sm", i < SWEEP.unchanged ? "bg-faint/60" : "bg-amber-400")} />
        ))}
      </div>
      <p className="mt-2 text-[13px] leading-snug text-muted">
        {SWEEP.thresholds} thresholds, each moved down and up by a quarter.{" "}
        <span className="text-ink">{SWEEP.unchanged} moves change nothing on dev.</span>{" "}
        <span className="font-semibold text-amber-300">{broke}</span> break something.
      </p>
    </div>
  );
}
