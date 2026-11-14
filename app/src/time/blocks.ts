/** Turns a day's detections into the blocks the time bar draws. */
import type { Day, Detection, TractorId } from "../data/types";

/** One colored block on the time bar: a detection on the tractors it names. */
export interface TimelineBlock {
  /** Unique within the day. The drawn element carries it so a pointer event can find the block. */
  key: string;
  detection: Detection;
}

export interface DayBlocks {
  detections: TimelineBlock[];
  byKey: Map<string, TimelineBlock>;
}

/** Every block of a day, with a lookup by key. */
export function dayBlocks(day: Day): DayBlocks {
  const detections = day.detections.map((detection): TimelineBlock => ({ key: `detection ${detection.id}`, detection }));
  return { detections, byKey: new Map(detections.map((block) => [block.key, block])) };
}

/**
 * The blocks that include one tractor, longest first. Drawn in that order, a
 * short block that sits inside a long one (jamming during a storm) ends up on top.
 */
export function blocksFor(blocks: TimelineBlock[], tractor: TractorId): TimelineBlock[] {
  const length = (block: TimelineBlock) => block.detection.end - block.detection.start;
  return blocks.filter((block) => block.detection.tractors.includes(tractor)).sort((a, b) => length(b) - length(a));
}
