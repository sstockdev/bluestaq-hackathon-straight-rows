import type { TractorId } from "../data/types";
import { CAUSES, TRACTOR_COLOR } from "../lib/causes";
import { BlockLane } from "./BlockLane";
import type { TimelineBlock } from "./blocks";
import { LaneLabel } from "./LaneLabel";
import { span, type Scale } from "./scale";

/** Height of the strip under the blocks that holds the multipath ticks. */
const TICKS = 4;

/**
 * One tractor's lane: a block for each detection that includes it, and in a
 * strip underneath a small tick for each multipath pass.
 */
export function TractorLane({ tractor, y, height, blocks, passes, scale, selectedId }: {
  tractor: TractorId;
  y: number;
  height: number;
  blocks: TimelineBlock[];
  passes: TimelineBlock[];
  scale: Scale;
  selectedId: string | null;
}) {
  const ticksY = y + height - TICKS;
  return (
    <g>
      <LaneLabel y={y} height={height} text={tractor} dot={TRACTOR_COLOR[tractor].color} />
      <BlockLane y={y} height={height - TICKS - 1} blocks={blocks} scale={scale} selectedId={selectedId} />
      {passes.map((pass) => {
        const tick = span(scale, pass.start, pass.end, 1.5);
        return (
          tick && (
            <rect key={pass.key} data-block={pass.key} x={tick.x} y={ticksY} width={tick.width} height={TICKS} fill={CAUSES.MULTIPATH.color} />
          )
        );
      })}
    </g>
  );
}
