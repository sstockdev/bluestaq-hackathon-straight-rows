import type { Layer } from "@deck.gl/core";
import { PathLayer, PolygonLayer, TextLayer } from "@deck.gl/layers";
import type { Day } from "../../data/types";
import { TRACTORS } from "../../lib/causes";
import type { Frame } from "./frame";
import { LABEL_STYLE, withAlpha, type Rgb } from "./style";
import { ROAD_Y } from "./surroundings";

const GRAVEL: Rgb = [70, 67, 60];
const SHED: Rgb = [96, 106, 118];
const RIDGE: Rgb = [160, 170, 182];
const MUTED: Rgb = [154, 164, 175];

const yardByDay = new WeakMap<Day, [number, number] | null>();

/** Where the tractors park: the average of their positions at the first moment all three are parked. */
function parkedAt(day: Day): [number, number] | null {
  if (!yardByDay.has(day)) {
    const tracks = TRACTORS.map((id) => day.tractors[id]);
    const parked = tracks[0].working.findIndex((_, i) => tracks.every((track) => track.working[i] === 0));
    const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    yardByDay.set(
      day,
      parked < 0 ? null : [mean(tracks.map((track) => track.lon[parked])), mean(tracks.map((track) => track.lat[parked]))],
    );
  }
  return yardByDay.get(day) ?? null;
}

/**
 * The yard where the tractors park overnight: a gravel pad, a machine shed
 * beside it, and a lane down to the road. The spot comes from the data. The
 * pad, the shed, and the lane are drawn around it to show what the spot is.
 */
export function yardLayers(day: Day, frame: Frame): Layer[] {
  const point = parkedAt(day);
  if (!point) return [];
  const [x, y] = frame.meters(point);
  const shed = frame.rect(x - 50, y - 26, x - 22, y + 26);
  return [
    new PathLayer<[number, number][]>({
      id: "yard-lane",
      data: [[frame.at(x, ROAD_Y), frame.at(x, y - 38)]],
      getPath: (path) => path,
      getColor: withAlpha(GRAVEL, 255),
      getWidth: 7,
      widthUnits: "meters",
      widthMinPixels: 1,
    }),
    new PolygonLayer<[number, number][]>({
      id: "yard-pad",
      data: [frame.rect(x - 58, y - 40, x + 30, y + 40)],
      getPolygon: (ring) => ring,
      getFillColor: withAlpha(GRAVEL, 255),
      stroked: false,
    }),
    new PolygonLayer<[number, number][]>({
      id: "yard-shed",
      data: [shed],
      getPolygon: (ring) => ring,
      getFillColor: withAlpha(SHED, 255),
      getLineColor: withAlpha(RIDGE, 255),
      lineWidthUnits: "pixels",
      getLineWidth: 1,
    }),
    new PathLayer<[number, number][]>({
      id: "yard-shed-ridge",
      data: [[frame.at(x - 36, y - 26), frame.at(x - 36, y + 26)]],
      getPath: (path) => path,
      getColor: withAlpha(RIDGE, 255),
      getWidth: 1,
      widthUnits: "pixels",
    }),
    new TextLayer<[number, number]>({
      ...LABEL_STYLE,
      id: "yard-label",
      data: [frame.at(x - 58, y)],
      getPosition: (edge) => edge,
      getText: () => "Yard",
      getSize: 12,
      getColor: withAlpha(MUTED, 255),
      getTextAnchor: "end",
      getAlignmentBaseline: "center",
      getPixelOffset: [-8, 0],
    }),
  ];
}
