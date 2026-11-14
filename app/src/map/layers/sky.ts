import type { Layer } from "@deck.gl/core";
import { PolygonLayer, TextLayer } from "@deck.gl/layers";
import type { Day, Thresholds } from "../../data/types";
import { CAUSES } from "../../lib/causes";
import { GRASS_EDGE } from "./field";
import type { Frame } from "./frame";
import { LABEL_STYLE, withAlpha } from "./style";

const COLOR = CAUSES.SPACE_WEATHER.rgb;
/** An S4 sample older than this many seconds no longer counts, as in the detector. */
const MAX_AGE = 1200;

/** The latest S4 sample at or before a moment, or null when there is none recent enough. */
function s4At(day: Day, clock: number): number | null {
  let latest: [number, number] | null = null;
  for (const sample of day.sky.s4) {
    if (sample[0] > clock) break;
    latest = sample;
  }
  return latest && clock - latest[0] <= MAX_AGE ? latest[1] : null;
}

/**
 * The sky over the field. While S4 is at or above the level where the detector
 * expects the signal to sag, the field glows in the space weather color and
 * carries the S4 reading. Below that level nothing is drawn.
 */
export function skyLayers(day: Day, clock: number, frame: Frame, thresholds: Thresholds): Layer[] {
  const s4 = s4At(day, clock);
  if (s4 === null || s4 < thresholds.sagMin) return [];
  const { width, height } = frame;
  return [
    new PolygonLayer<[number, number][]>({
      id: "sky",
      data: [frame.rect(-GRASS_EDGE, -GRASS_EDGE, width + GRASS_EDGE, height + GRASS_EDGE)],
      getPolygon: (ring) => ring,
      getFillColor: withAlpha(COLOR, 30),
      getLineColor: withAlpha(COLOR, 255),
      lineWidthUnits: "pixels",
      getLineWidth: 2.5,
    }),
    new TextLayer<[number, number]>({
      ...LABEL_STYLE,
      id: "sky-label",
      data: [frame.at(-GRASS_EDGE, height + GRASS_EDGE)],
      getPosition: (corner) => corner,
      getText: () => `Sky active, S4 ${s4.toFixed(2)}`,
      getSize: 12,
      getColor: withAlpha(COLOR, 255),
      // Just above the north-west corner.
      getTextAnchor: "start",
      getAlignmentBaseline: "bottom",
      getPixelOffset: [0, -8],
      updateTriggers: { getText: s4 },
    }),
  ];
}
