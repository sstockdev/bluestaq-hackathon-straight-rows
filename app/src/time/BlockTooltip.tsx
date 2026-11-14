import { CAUSES } from "../lib/causes";
import { Dot } from "../ui/CauseBadge";
import type { TimelineBlock } from "./blocks";
import { stretchLabel } from "./format";

/** The small card shown above the time bar while the pointer is over a detection. */
export function BlockTooltip({ block, x, width, midnight }: {
  block: TimelineBlock;
  /** The pointer's x position within the bar. */
  x: number;
  /** The bar's width, so the card stays on screen near the edges. */
  width: number;
  midnight: number;
}) {
  const { cls, tractors, start, end, confidence } = block.detection;
  const cause = CAUSES[cls];
  const left = Math.min(width - 110, Math.max(110, x));
  return (
    <div
      role="tooltip"
      style={{ left }}
      className="pointer-events-none absolute bottom-full z-10 mb-3 w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-line bg-panel-raised px-3 py-2 text-xs shadow-xl shadow-black/50"
    >
      <p className="flex items-center gap-1.5 text-[13px] font-semibold">
        <Dot color={cause.color} />
        {cause.name}
      </p>
      <p className="tabular mt-1">{tractors.join(", ")}</p>
      <p className="tabular">{stretchLabel(start, end, midnight)}</p>
      <p className="tabular">Confidence {confidence.toFixed(2)}</p>
    </div>
  );
}
