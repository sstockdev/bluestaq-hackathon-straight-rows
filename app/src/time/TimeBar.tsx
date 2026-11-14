import { useMemo } from "react";
import { TRACTORS } from "../lib/causes";
import { useApp } from "../state/store";
import { Panel } from "../ui/Panel";
import { AxisLane } from "./AxisLane";
import { HatchDefs } from "./BlockLane";
import { blocksFor, dayBlocks } from "./blocks";
import { BlockTooltip } from "./BlockTooltip";
import { LaneGroup } from "./LaneGroup";
import { Playhead } from "./Playhead";
import { makeScale } from "./scale";
import { SkyLane } from "./SkyLane";
import { TractorLane } from "./TractorLane";
import { useScrub } from "./useScrub";
import { useTimeKeys } from "./useTimeKeys";
import { useWidth } from "./useWidth";
import { WorkingLane } from "./WorkingLane";

/** Sizes in pixels. The gutter holds the lane names; the right margin holds the S4 threshold's value. */
const GUTTER = 62;
const RIGHT_MARGIN = 30;
const AXIS = 20;
const SKY = 56;
const WORKING = 6;
const TRACTOR = 20;
const THIN_ROW = 8;
const GAP = 5;

/**
 * The timeline along the bottom of the screen. It spans the selected range, so
 * narrowing the range zooms it. Top to bottom: hours, the sky, when the tractors
 * work, one lane per tractor, then the labels and the baseline when those layers
 * are on. Click or drag to move the clock; click a detection to select it.
 */
export default function TimeBar() {
  const day = useApp((s) => s.day);
  const index = useApp((s) => s.index);
  const range = useApp((s) => s.range);
  const selectedId = useApp((s) => s.selectedId);
  const layers = useApp((s) => s.layers);
  const [box, width] = useWidth<HTMLDivElement>();
  // The bar is always on screen, so the time shortcuts live here and work with any panel open.
  useTimeKeys();

  const blocks = useMemo(() => (day ? dayBlocks(day) : null), [day]);
  const scale = useMemo(() => makeScale(range, GUTTER, width - RIGHT_MARGIN), [range, width]);
  const { hover, handlers } = useScrub(scale, blocks?.byKey ?? new Map());
  if (!day || !index || !blocks) return null;

  const showLabels = layers.labels && blocks.labels.length > 0;
  const showBaseline = layers.baseline && blocks.baseline.length > 0;
  const skyY = AXIS;
  const workingY = skyY + SKY + GAP;
  const tractorY = workingY + WORKING + GAP;
  const labelsY = tractorY + TRACTORS.length * TRACTOR + GAP;
  const baselineY = labelsY + (showLabels ? TRACTORS.length * THIN_ROW + GAP : 0);
  const height = baselineY + (showBaseline ? TRACTORS.length * THIN_ROW + GAP : 0) - GAP;

  return (
    <Panel className="w-full px-3 pb-3 pt-2.5">
      <div ref={box} className="relative">
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label="Timeline of the day. Click or drag to move the clock. Click a detection to select it."
            className="block cursor-crosshair touch-none select-none"
            {...handlers}
          >
            <HatchDefs />
            <AxisLane height={AXIS} bottom={height} scale={scale} midnight={day.t0} />
            <SkyLane y={skyY} height={SKY} sky={day.sky} threshold={index.thresholds.sagMin} scale={scale} />
            <WorkingLane y={workingY} height={WORKING} working={day.working} scale={scale} />
            {TRACTORS.map((tractor, i) => (
              <TractorLane
                key={tractor}
                tractor={tractor}
                y={tractorY + i * TRACTOR}
                height={TRACTOR - 3}
                blocks={blocksFor(blocks.detections, tractor)}
                passes={blocks.passes[tractor]}
                scale={scale}
                selectedId={selectedId}
              />
            ))}
            {showLabels && <LaneGroup title="Labels" y={labelsY} rowHeight={THIN_ROW} blocks={blocks.labels} scale={scale} />}
            {showBaseline && <LaneGroup title="Baseline" y={baselineY} rowHeight={THIN_ROW} blocks={blocks.baseline} scale={scale} />}
            <Playhead scale={scale} top={2} bottom={height} midnight={day.t0} />
          </svg>
        )}
        {hover && <BlockTooltip block={hover.block} x={hover.x} width={width} midnight={day.t0} />}
      </div>
    </Panel>
  );
}
