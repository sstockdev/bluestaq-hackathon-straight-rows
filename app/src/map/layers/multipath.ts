import type { Layer } from "@deck.gl/core";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { Day } from "../../data/types";
import { CAUSES, TRACTORS } from "../../lib/causes";
import type { Frame } from "./frame";
import { LABEL_STYLE, withAlpha } from "./style";

const COLOR = CAUSES.MULTIPATH.rgb;
/** The spacing of the dots along the line, in meters. */
const DOT_SPACING = 14;

/**
 * The latitude where the weakest satellite dips on every pass, as a dotted
 * line across the field. The detector finds the latitude, not the thing that
 * causes the dips, so the line marks where and says nothing about what.
 */
export function multipathLayers(day: Day, frame: Frame): Layer[] {
  const found = TRACTORS.map((id) => day.multipath.spotLat[id]).filter((lat): lat is number => lat !== null);
  const latitudes = [...new Set(found)];
  if (latitudes.length === 0) return [];

  const dots: [number, number][] = [];
  const ends: [number, number][] = [];
  for (const lat of latitudes) {
    const y = frame.meters([0, lat])[1];
    for (let x = 0; x <= frame.width; x += DOT_SPACING) dots.push(frame.at(x, y));
    ends.push(frame.at(frame.width, y));
  }
  return [
    new ScatterplotLayer<[number, number]>({
      id: "multipath-line",
      data: dots,
      getPosition: (dot) => dot,
      radiusUnits: "pixels",
      getRadius: 1.6,
      getFillColor: withAlpha(COLOR, 230),
    }),
    new TextLayer<[number, number]>({
      ...LABEL_STYLE,
      id: "multipath-label",
      data: ends,
      getPosition: (end) => end,
      getText: () => "Multipath spot",
      getSize: 12,
      getColor: withAlpha(COLOR, 255),
      getTextAnchor: "start",
      getAlignmentBaseline: "center",
      getPixelOffset: [40, 0],
    }),
  ];
}
