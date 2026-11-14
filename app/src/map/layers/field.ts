import type { Layer } from "@deck.gl/core";
import { PolygonLayer, TextLayer } from "@deck.gl/layers";
import { HEALTHY_RGB } from "../../lib/causes";
import { LABEL_STYLE, withAlpha, type Rgb } from "./style";

/** Tilled soil, a little lighter than the land around it. */
const SOIL: Rgb = [50, 41, 31];
/** Room around the rows for the headland turns, in degrees: about 25 m each way. */
const LAT_MARGIN = 0.00022;
const LON_MARGIN = 0.00033;

/**
 * The simulated field, drawn as a patch of soil and labeled as simulated.
 *
 * The dataset places its field at real coordinates on the east side of
 * Casselton, and half of that rectangle is a neighborhood in real life. That
 * is why the map shows this patch and no aerial photo.
 */
export function fieldLayers(bounds: [number, number, number, number]): Layer[] {
  const [west, south, east, north] = bounds;
  const w = west - LON_MARGIN, e = east + LON_MARGIN, s = south - LAT_MARGIN, n = north + LAT_MARGIN;
  const outline: [number, number][] = [[w, n], [e, n], [e, s], [w, s]];
  return [
    new PolygonLayer<[number, number][]>({
      id: "field",
      data: [outline],
      getPolygon: (ring) => ring,
      getFillColor: withAlpha(SOIL, 255),
      getLineColor: withAlpha(HEALTHY_RGB, 120),
      lineWidthUnits: "pixels",
      getLineWidth: 1,
    }),
    new TextLayer<[number, number]>({
      ...LABEL_STYLE,
      id: "field-label",
      data: [[w, s]],
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
