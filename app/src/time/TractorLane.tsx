import type { TractorId } from "../data/types";
import { TRACTOR_COLOR } from "../lib/causes";
import { BlockLane } from "./BlockLane";
import type { TimelineBlock } from "./blocks";
import { LaneLabel } from "./LaneLabel";
import type { Scale } from "./scale";

/** One tractor's lane: its name, and a block for each detection that includes it. */
export function TractorLane({ tractor, y, height, blocks, scale, selectedId }: {
  tractor: TractorId;
  y: number;
  height: number;
  blocks: TimelineBlock[];
  scale: Scale;
  selectedId: string | null;
}) {
  return (
    <g>
      <LaneLabel y={y} height={height} text={tractor} dot={TRACTOR_COLOR[tractor].color} />
      <BlockLane y={y} height={height} blocks={blocks} scale={scale} selectedId={selectedId} />
    </g>
  );
}
