/** Turns a day's detections, multipath passes, labels, and baseline calls into blocks the time bar can draw. */
import type { Block, Day, Detection, TractorId } from "../data/types";
import { TRACTORS } from "../lib/causes";

export type BlockSource = "detection" | "multipath" | "label" | "baseline";

/** One colored block on the time bar. */
export interface TimelineBlock {
  /** Unique within the day. The drawn element carries it so a pointer event can find the block. */
  key: string;
  source: BlockSource;
  cls: Block["cls"];
  start: number;
  end: number;
  tractors: TractorId[];
  /** Set on this detector's detections. Clicking such a block selects the detection. */
  detection?: Detection;
  /** The label's id on a label block, or the label a baseline call matched. */
  labelId?: string | null;
  /** A baseline call that matches no label. */
  wrong?: boolean;
}

export interface DayBlocks {
  detections: TimelineBlock[];
  passes: Record<TractorId, TimelineBlock[]>;
  labels: TimelineBlock[];
  baseline: TimelineBlock[];
  byKey: Map<string, TimelineBlock>;
}

/** Every block of a day, grouped by where it is drawn, with a lookup by key. */
export function dayBlocks(day: Day): DayBlocks {
  const detections = day.detections.map((d): TimelineBlock => ({
    key: `detection ${d.id}`,
    source: "detection",
    cls: d.cls,
    start: d.start,
    end: d.end,
    tractors: d.tractors,
    detection: d,
  }));
  const passesOf = (tractor: TractorId) =>
    day.multipath.passes[tractor].map(([start, end], i): TimelineBlock => ({
      key: `multipath ${tractor} ${i}`,
      source: "multipath",
      cls: "MULTIPATH",
      start,
      end,
      tractors: [tractor],
    }));
  const passes = { T1: passesOf("T1"), T2: passesOf("T2"), T3: passesOf("T3") };
  const fromBlock = (source: "label" | "baseline") => (b: Block, i: number): TimelineBlock => ({
    key: `${source} ${i}`,
    source,
    cls: b.cls,
    start: b.start,
    end: b.end,
    tractors: b.tractors,
    labelId: b.id,
    wrong: b.wrong === true,
  });
  const labels = day.labels.map(fromBlock("label"));
  const baseline = day.baseline.map(fromBlock("baseline"));

  const byKey = new Map<string, TimelineBlock>();
  for (const block of [...detections, ...TRACTORS.flatMap((t) => passes[t]), ...labels, ...baseline]) {
    byKey.set(block.key, block);
  }
  return { detections, passes, labels, baseline, byKey };
}

/**
 * The blocks that include one tractor, longest first. Drawn in that order, a
 * short block that sits inside a long one (jamming during a storm) ends up on top.
 */
export function blocksFor(blocks: TimelineBlock[], tractor: TractorId): TimelineBlock[] {
  return blocks
    .filter((b) => b.tractors.includes(tractor))
    .sort((a, b) => b.end - b.start - (a.end - a.start));
}
