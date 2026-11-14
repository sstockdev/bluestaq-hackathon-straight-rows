import type { TractorId } from "../../data/types";
import { TRACTORS, TRACTOR_COLOR } from "../../lib/causes";

/**
 * The tractors a detection affects, each as a pill in its color. With `aligned`,
 * every tractor keeps its own slot and the unaffected ones leave theirs empty,
 * so the pills line up down a table column.
 */
export function TractorMarks({ affected, aligned = false }: { affected: TractorId[]; aligned?: boolean }) {
  const shown = aligned ? TRACTORS : TRACTORS.filter((id) => affected.includes(id));
  return (
    <span className="inline-flex gap-1" aria-label={affected.join(", ")}>
      {shown.map((id) => (
        <span
          key={id}
          aria-hidden
          className="tabular w-6 rounded text-center text-[11px] font-semibold leading-[18px] text-page"
          style={affected.includes(id) ? { background: TRACTOR_COLOR[id].color } : { visibility: "hidden" }}
        >
          {id}
        </span>
      ))}
    </span>
  );
}
