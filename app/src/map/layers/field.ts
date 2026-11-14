import type { Layer } from "@deck.gl/core";
import { PathLayer, PolygonLayer, TextLayer } from "@deck.gl/layers";
import { HEALTHY_RGB } from "../../lib/causes";
import type { Frame } from "./frame";
import { LABEL_STYLE, withAlpha, type Rgb } from "./style";

/** Tilled soil, and the lighter lines of its furrows. */
const SOIL: Rgb = [58, 46, 34];
const FURROW: Rgb = [74, 60, 44];
/** The grass strip around the soil. */
const GRASS: Rgb = [46, 62, 38];
/** How far the soil and the grass reach past the tractors' outermost rows, in meters. */
const SOIL_EDGE = 10;
export const GRASS_EDGE = 28;
/** The spacing of the drawn furrows in meters. They are a texture, not the tractors' real rows. */
const FURROW_SPACING = 12;

const furrowsByFrame = new WeakMap<Frame, [number, number][][]>();

function furrows(frame: Frame): [number, number][][] {
  let lines = furrowsByFrame.get(frame);
  if (!lines) {
    lines = [];
    for (let x = 0; x <= frame.width; x += FURROW_SPACING) lines.push([frame.at(x, 0), frame.at(x, frame.height)]);
    furrowsByFrame.set(frame, lines);
  }
  return lines;
}

/**
 * The simulated field: a grass edge, the soil, and furrows running north to
 * south the way the tractors drive, labeled as simulated.
 *
 * The dataset places its field at real coordinates on the east side of
 * Casselton, and half of that rectangle is a neighborhood in real life. That
 * is why the map shows this drawing and no aerial photo.
 */
export function fieldLayers(frame: Frame): Layer[] {
  const { width, height } = frame;
  return [
    new PolygonLayer<[number, number][]>({
      id: "field-edge",
      data: [frame.rect(-GRASS_EDGE, -GRASS_EDGE, width + GRASS_EDGE, height + GRASS_EDGE)],
      getPolygon: (ring) => ring,
      getFillColor: withAlpha(GRASS, 255),
      getLineColor: withAlpha(HEALTHY_RGB, 150),
      lineWidthUnits: "pixels",
      getLineWidth: 1,
    }),
    new PolygonLayer<[number, number][]>({
      id: "field",
      data: [frame.rect(-SOIL_EDGE, -SOIL_EDGE, width + SOIL_EDGE, height + SOIL_EDGE)],
      getPolygon: (ring) => ring,
      getFillColor: withAlpha(SOIL, 255),
      stroked: false,
    }),
    new PathLayer<[number, number][]>({
      id: "furrows",
      data: furrows(frame),
      getPath: (line) => line,
      getColor: withAlpha(FURROW, 170),
      getWidth: 1,
      widthUnits: "pixels",
    }),
    new TextLayer<[number, number]>({
      ...LABEL_STYLE,
      id: "field-label",
      data: [frame.at(-GRASS_EDGE, -GRASS_EDGE)],
      getPosition: (corner) => corner,
      getText: () => "Simulated field",
      getSize: 12,
      getColor: withAlpha(HEALTHY_RGB, 255),
      // Just under the south-west corner.
      getTextAnchor: "start",
      getAlignmentBaseline: "top",
      getPixelOffset: [0, 8],
    }),
  ];
}
