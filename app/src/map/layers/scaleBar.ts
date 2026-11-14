import type { Layer } from "@deck.gl/core";
import { PathLayer, TextLayer } from "@deck.gl/layers";
import { GRASS_EDGE } from "./field";
import type { Frame } from "./frame";
import { LABEL_STYLE, withAlpha, type Rgb } from "./style";

const MUTED: Rgb = [154, 164, 175];
const LENGTH = 200;

/** A 200 m bar under the field's south-east corner, drawn on the ground so it is true at any zoom. */
export function scaleBarLayers(frame: Frame): Layer[] {
  const right = frame.width + GRASS_EDGE;
  const left = right - LENGTH;
  const y = -GRASS_EDGE - 30;
  const tick = 7;
  return [
    new PathLayer<[number, number][]>({
      id: "scale-bar",
      data: [[frame.at(left, y + tick), frame.at(left, y), frame.at(right, y), frame.at(right, y + tick)]],
      getPath: (path) => path,
      getColor: withAlpha(MUTED, 255),
      getWidth: 1.5,
      widthUnits: "pixels",
    }),
    new TextLayer<[number, number]>({
      ...LABEL_STYLE,
      id: "scale-bar-label",
      data: [frame.at((left + right) / 2, y)],
      getPosition: (middle) => middle,
      getText: () => `${LENGTH} m`,
      getSize: 11,
      getColor: withAlpha(MUTED, 255),
      getTextAnchor: "middle",
      getAlignmentBaseline: "top",
      getPixelOffset: [0, 6],
    }),
  ];
}
