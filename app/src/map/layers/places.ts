import type { Layer } from "@deck.gl/core";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { LABEL_STYLE, withAlpha, type Rgb } from "./style";

/** The app's muted text color (--color-muted). */
const MUTED: Rgb = [154, 164, 175];

/** The center of the town of Casselton, North Dakota: 46 deg 54 min 02 s N, 97 deg 12 min 39 s W. */
const CASSELTON: [number, number] = [-97.2108, 46.9006];

/** The town of Casselton, west of the field, as a marker and a name over its drawn blocks. */
export function placeLayers(): Layer[] {
  return [
    new ScatterplotLayer<[number, number]>({
      id: "places",
      data: [CASSELTON],
      getPosition: (place) => place,
      radiusUnits: "pixels",
      getRadius: 4,
      getFillColor: withAlpha(MUTED, 60),
      stroked: true,
      getLineColor: withAlpha(MUTED, 220),
      lineWidthUnits: "pixels",
      getLineWidth: 1.5,
    }),
    new TextLayer<[number, number]>({
      ...LABEL_STYLE,
      id: "place-labels",
      data: [CASSELTON],
      getPosition: (place) => place,
      getText: () => "Casselton",
      getSize: 12,
      getColor: withAlpha(MUTED, 255),
      getTextAnchor: "middle",
      getAlignmentBaseline: "top",
      getPixelOffset: [0, 10],
    }),
  ];
}
