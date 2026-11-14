import { CAUSES } from "../lib/causes";
import type { TimelineBlock } from "./blocks";
import { span, type Scale } from "./scale";

/**
 * One row of detections on the time bar, colored by cause, with the selected
 * one outlined. Each block carries its key in `data-block`, which is how the
 * bar finds it under the pointer.
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
      {blocks.map(({ key, detection }) => {
        const box = span(scale, detection.start, detection.end, 3);
        if (!box) return null;
        const selected = detection.id === selectedId;
        return (
          <rect
            key={key}
            data-block={key}
            x={box.x}
            y={y}
            width={box.width}
            height={height}
            rx={2}
            fill={CAUSES[detection.cls].color}
            stroke={selected ? "var(--color-ink)" : "var(--color-panel)"}
            strokeWidth={selected ? 2 : 1}
            className="cursor-pointer"
          />
        );
      })}
    </g>
  );
}
