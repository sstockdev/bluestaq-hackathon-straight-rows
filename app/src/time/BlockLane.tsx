import { CAUSES } from "../lib/causes";
import type { TimelineBlock } from "./blocks";
import { span, type Scale } from "./scale";

/** The id of the hatch pattern for a cause. HatchDefs defines the patterns once per time bar. */
export const hatchId = (cause: TimelineBlock["cls"]) => `hatch-${cause}`;

/**
 * One row of blocks on the time bar, colored by cause. The selected detection
 * is outlined, and a baseline call that matches no label is hatched. Each block
 * carries its key in `data-block`, which is how the bar finds it under the pointer.
 */
export function BlockLane({ y, height, blocks, scale, selectedId }: {
  y: number;
  height: number;
  /** The blocks for this row, longest first so short ones are drawn on top. */
  blocks: TimelineBlock[];
  scale: Scale;
  selectedId: string | null;
}) {
  return (
    <g>
      <rect x={scale.left} y={y} width={scale.right - scale.left} height={height} rx={2} className="fill-panel-raised" />
      {blocks.map((block) => {
        const box = span(scale, block.start, block.end, 3);
        if (!box) return null;
        const color = CAUSES[block.cls].color;
        const selected = block.detection !== undefined && block.detection.id === selectedId;
        return (
          <rect
            key={block.key}
            data-block={block.key}
            x={box.x}
            y={y}
            width={box.width}
            height={height}
            rx={2}
            fill={block.wrong ? `url(#${hatchId(block.cls)})` : color}
            stroke={selected ? "var(--color-ink)" : block.wrong ? color : "var(--color-panel)"}
            strokeWidth={selected ? 2 : 1}
            className={block.detection ? "cursor-pointer" : undefined}
          />
        );
      })}
    </g>
  );
}

/** Diagonal hatch patterns, one per cause, for baseline calls that match no label. */
export function HatchDefs() {
  return (
    <defs>
      {Object.entries(CAUSES).map(([cause, { color }]) => (
        <pattern key={cause} id={hatchId(cause as TimelineBlock["cls"])} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={5} height={5} className="fill-panel" />
          <rect width={2} height={5} fill={color} />
        </pattern>
      ))}
    </defs>
  );
}
