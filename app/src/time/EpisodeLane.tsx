import { CAUSES } from "../lib/causes";
import type { TimelineBlock } from "./blocks";
import { LaneLabel } from "./LaneLabel";
import { span, type Scale } from "./scale";

/** The height of one row of brackets, in pixels. */
export const EPISODE_ROW = 17;

/** One episode placed in the lane: its number in the day, and the row it sits on. */
export interface PlacedEpisode {
  block: TimelineBlock;
  number: number;
  row: number;
}

/**
 * Number the day's detections in time order and give each a row. An episode
 * that overlaps an earlier one (a jammer inside a storm) drops to the next row,
 * so every episode keeps its own bracket.
 */
export function placeEpisodes(blocks: TimelineBlock[]): { placed: PlacedEpisode[]; rows: number } {
  const ordered = [...blocks].sort((a, b) => a.detection.start - b.detection.start);
  const rowEnds: number[] = [];
  const placed = ordered.map((block, i) => {
    let row = rowEnds.findIndex((end) => end <= block.detection.start);
    if (row < 0) row = rowEnds.length;
    rowEnds[row] = block.detection.end;
    return { block, number: i + 1, row };
  });
  return { placed, rows: Math.max(1, rowEnds.length) };
}

/**
 * The episodes lane: one bracket per detection from its start to its end, in
 * the cause's color, with the episode's number on it. This is the day cut into
 * episodes. The tractor lanes under it show which machines each one touched.
 */
export function EpisodeLane({ y, placed, scale, selectedId }: { y: number; placed: PlacedEpisode[]; scale: Scale; selectedId: string | null }) {
  const rows = Math.max(1, ...placed.map((episode) => episode.row + 1));
  return (
    <g>
      <LaneLabel y={y} height={rows * EPISODE_ROW} text="Episodes" />
      {placed.map(({ block, number, row }) => {
        const { detection, key } = block;
        const box = span(scale, detection.start, detection.end);
        if (!box) return null;
        const { color } = CAUSES[detection.cls];
        const top = y + row * EPISODE_ROW;
        const middle = top + EPISODE_ROW / 2;
        const left = box.x;
        const right = box.x + Math.max(box.width, 2);
        const selected = detection.id === selectedId;
        return (
          <g key={key} data-block={key} className="cursor-pointer">
            {/* A clear box over the whole bracket, so it is easy to point at. */}
            <rect x={left - 2} y={top} width={right - left + 4} height={EPISODE_ROW} fill="transparent" />
            <path
              d={`M${left} ${top + 2}V${top + EPISODE_ROW - 2}M${right} ${top + 2}V${top + EPISODE_ROW - 2}M${left} ${middle}H${right}`}
              stroke={color}
              strokeWidth={selected ? 3 : 2}
              fill="none"
            />
            <circle cx={(left + right) / 2} cy={middle} r={7.5} fill={color} stroke={selected ? "var(--color-ink)" : "var(--color-panel)"} strokeWidth={1.5} />
            <text x={(left + right) / 2} y={middle + 0.5} textAnchor="middle" dominantBaseline="central" className="tabular fill-page text-[10px] font-semibold">
              {number}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** A dotted line at each episode's start and end, down through the tractor lanes, so the cuts show on every machine. */
export function EpisodeCuts({ top, bottom, placed, scale }: { top: number; bottom: number; placed: PlacedEpisode[]; scale: Scale }) {
  return (
    <g pointerEvents="none">
      {placed.flatMap(({ block }) => {
        const { detection, key } = block;
        const box = span(scale, detection.start, detection.end);
        if (!box) return [];
        return [box.x, box.x + box.width].map((x, i) => (
          <line key={`${key} ${i}`} x1={x} x2={x} y1={top} y2={bottom} stroke={CAUSES[detection.cls].color} strokeWidth={1} strokeDasharray="2 3" opacity={0.7} />
        ));
      })}
    </g>
  );
}
