import { TRACTORS } from "../lib/causes";
import { BlockLane } from "./BlockLane";
import { blocksFor, type TimelineBlock } from "./blocks";
import { LaneLabel } from "./LaneLabel";
import type { Scale } from "./scale";

/** Three thin rows, one per tractor in the order T1, T2, T3, under one name. Used for the labels and the baseline. */
export function LaneGroup({ title, y, rowHeight, blocks, scale }: {
  title: string;
  y: number;
  /** Height of one tractor's row, including the 1 px gap below it. */
  rowHeight: number;
  blocks: TimelineBlock[];
  scale: Scale;
}) {
  return (
    <g>
      <LaneLabel y={y} height={rowHeight * TRACTORS.length} text={title} />
      {TRACTORS.map((tractor, i) => (
        <BlockLane
          key={tractor}
          y={y + i * rowHeight}
          height={rowHeight - 1}
          blocks={blocksFor(blocks, tractor)}
          scale={scale}
          selectedId={null}
        />
      ))}
    </g>
  );
}
