import { CAUSES } from "../lib/causes";
import { Dot } from "../ui/CauseBadge";
import type { TimelineBlock } from "./blocks";
import { stretchLabel } from "./format";

/** What kind of block this is, in words. */
function sourceName(block: TimelineBlock): string {
  if (block.source === "detection") return "Detection";
  if (block.source === "multipath") return "Multipath pass";
  if (block.source === "label") return block.labelId ? `Label ${block.labelId}` : "Label";
  return block.wrong ? "Baseline, matches no label" : "Baseline";
}

/** The small card shown above the time bar while the pointer is over a block. */
export function BlockTooltip({ block, x, width, midnight }: {
  block: TimelineBlock;
  /** The pointer's x position within the bar. */
  x: number;
  /** The bar's width, so the card stays on screen near the edges. */
  width: number;
  midnight: number;
}) {
  const cause = CAUSES[block.cls];
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
      <p className="text-muted">{sourceName(block)}</p>
      <p className="tabular mt-1">{block.tractors.join(", ")}</p>
      <p className="tabular">{stretchLabel(block.start, block.end, midnight)}</p>
      {block.detection && <p className="tabular">Confidence {block.detection.confidence.toFixed(2)}</p>}
    </div>
  );
}
