import { useMemo } from "react";
import { TRACTORS } from "../lib/causes";
import { dayRange, useApp } from "../state/store";
import { Panel } from "../ui/Panel";
import { AxisLane } from "./AxisLane";
import { blocksFor, dayBlocks } from "./blocks";
import { BlockTooltip } from "./BlockTooltip";
import { DayPicker } from "./DayPicker";
import { EPISODE_ROW, EpisodeCuts, EpisodeLane, placeEpisodes } from "./EpisodeLane";
import { PlaybackControls } from "./PlaybackControls";
import { Playhead } from "./Playhead";
import { makeScale } from "./scale";
import { SkyLane } from "./SkyLane";
import { SpeedPicker } from "./SpeedPicker";
import { TractorLane } from "./TractorLane";
import { useScrub } from "./useScrub";
import { useWidth } from "./useWidth";

/** Sizes in pixels. The gutter holds the lane names; the right margin holds the S4 threshold's value. */
const GUTTER = 54;
const RIGHT_MARGIN = 30;
const AXIS = 20;
const SKY = 34;
const TRACTOR = 20;
const GAP = 5;

/**
 * The bar along the bottom of the screen. On top are the controls: the day,
 * play and pause, and the playback speed. Under them is the day's timeline:
 * hours, the sky's S4, the day's episodes as numbered brackets, and one lane
 * per tractor with its detections. Click or drag the timeline to move the
 * clock; click a detection to select it.
 */
export default function TimeBar() {
  const day = useApp((s) => s.day);
  const index = useApp((s) => s.index);
  const selectedId = useApp((s) => s.selectedId);
  const [box, width] = useWidth<HTMLDivElement>();

  const blocks = useMemo(() => (day ? dayBlocks(day) : null), [day]);
  const episodes = useMemo(() => placeEpisodes(blocks?.detections ?? []), [blocks]);
  const scale = useMemo(() => makeScale(day ? dayRange(day) : [0, 1], GUTTER, width - RIGHT_MARGIN), [day, width]);
  const { hover, handlers } = useScrub(scale, blocks?.byKey ?? new Map());
  if (!day || !index || !blocks) return null;

  const skyY = AXIS;
  const episodeY = skyY + SKY + GAP;
  const tractorY = episodeY + episodes.rows * EPISODE_ROW + GAP;
  const height = tractorY + TRACTORS.length * TRACTOR - 3;

  return (
    <Panel className="w-full px-3 pb-3 pt-2.5">
      <div className="mb-2 flex items-center gap-3">
        <DayPicker />
        <PlaybackControls />
        <div className="flex-1" />
        <SpeedPicker />
      </div>
      <div ref={box} className="relative">
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label="Timeline of the day. Click or drag to move the clock, or use the left and right arrow keys. Click a detection to select it."
            className="block cursor-crosshair touch-none select-none"
            {...handlers}
          >
            <AxisLane height={AXIS} bottom={height} scale={scale} midnight={day.t0} />
            <SkyLane y={skyY} height={SKY} s4={day.sky.s4} threshold={index.thresholds.sagMin} scale={scale} />
            <EpisodeLane y={episodeY} placed={episodes.placed} scale={scale} selectedId={selectedId} />
            {TRACTORS.map((tractor, i) => (
              <TractorLane
                key={tractor}
                tractor={tractor}
                y={tractorY + i * TRACTOR}
                height={TRACTOR - 3}
                blocks={blocksFor(blocks.detections, tractor)}
                scale={scale}
                selectedId={selectedId}
              />
            ))}
            <EpisodeCuts top={tractorY} bottom={height} placed={episodes.placed} scale={scale} />
            <Playhead scale={scale} top={2} bottom={height} midnight={day.t0} />
          </svg>
        )}
        {hover && <BlockTooltip block={hover.block} x={hover.x} width={width} midnight={day.t0} />}
      </div>
    </Panel>
  );
}
