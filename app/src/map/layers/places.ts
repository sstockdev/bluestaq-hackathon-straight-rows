import type { Layer } from "@deck.gl/core";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { Day } from "../../data/types";
import { TRACTORS } from "../../lib/causes";
import { LABEL_STYLE, withAlpha, type Rgb } from "./style";

/** The app's muted text color (--color-muted). */
const MUTED: Rgb = [154, 164, 175];

/** The center of the town of Casselton, North Dakota: 46 deg 54 min 02 s N, 97 deg 12 min 39 s W. */
const CASSELTON: [number, number] = [-97.2108, 46.9006];

/** A named point on the map. */
interface Place {
  name: string;
  position: [number, number];
  /** Which side of the marker the name sits on. */
  label: "below" | "left";
}

const yardByDay = new WeakMap<Day, [number, number] | null>();

/** Where the tractors park: the average of their positions at the first moment all three are parked. */
function yard(day: Day): [number, number] | null {
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
 * Two landmarks that give the empty map some bearings: the town of Casselton
 * to the west of the field, and the yard where the tractors park overnight.
 */
export function placeLayers(day: Day): Layer[] {
  const parkedAt = yard(day);
  const places: Place[] = [
    { name: "Casselton", position: CASSELTON, label: "below" },
    // The parked tractors' names sit to the right of the yard, so its name goes on the left.
    ...(parkedAt ? [{ name: "Yard", position: parkedAt, label: "left" as const }] : []),
  ];
  return [
    new ScatterplotLayer<Place>({
      id: "places",
      data: places,
      getPosition: (place) => place.position,
      radiusUnits: "pixels",
      getRadius: 4,
      getFillColor: withAlpha(MUTED, 60),
      stroked: true,
      getLineColor: withAlpha(MUTED, 220),
      lineWidthUnits: "pixels",
      getLineWidth: 1.5,
    }),
    new TextLayer<Place>({
      ...LABEL_STYLE,
      id: "place-labels",
      data: places,
      getPosition: (place) => place.position,
      getText: (place) => place.name,
      getSize: 12,
      getColor: withAlpha(MUTED, 255),
      getTextAnchor: (place) => (place.label === "left" ? "end" : "middle"),
      getAlignmentBaseline: (place) => (place.label === "left" ? "center" : "top"),
      getPixelOffset: (place) => (place.label === "left" ? [-16, 0] : [0, 10]),
    }),
  ];
}
