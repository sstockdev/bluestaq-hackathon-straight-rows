import type { Layer } from "@deck.gl/core";
import { LineLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { Day } from "../../data/types";
import { CAUSES, TRACTORS } from "../../lib/causes";
import { LABEL_STYLE, withAlpha } from "./style";
import type { TractorState } from "./tractorState";

const COLOR = CAUSES.MULTIPATH.rgb;
/** How many dashes the line across the field is cut into. */
const DASHES = 40;

/** One dash of the line across the field. */
interface Dash {
  from: [number, number];
  to: [number, number];
}

/** A ring that grows and fades around a tractor as it crosses the spot. */
interface Pulse {
  position: [number, number];
  /** How far through the pass the tractor is, 0 to 1. */
  progress: number;
}

/** The distinct latitudes where multipath recurs. The tractors usually share one. */
function spotLatitudes(day: Day): number[] {
  const latitudes = TRACTORS.map((id) => day.multipath.spotLat[id]).filter((lat): lat is number => lat !== null);
  return [...new Set(latitudes.map((lat) => Math.round(lat * 1e5) / 1e5))];
}

/** A dashed west to east line at one latitude. */
function dashes(lat: number, west: number, east: number): Dash[] {
  const step = (east - west) / DASHES;
  return Array.from({ length: DASHES }, (_, i) => ({
    from: [west + step * i, lat],
    to: [west + step * (i + 0.5), lat],
  }));
}

/** The tractors that are inside one of their reported multipath passes right now. */
function pulses(day: Day, clock: number, states: TractorState[]): Pulse[] {
  return states.flatMap((state) => {
    const pass = day.multipath.passes[state.id].find(([start, end]) => clock >= start && clock <= end);
    if (!pass) return [];
    const progress = (clock - pass[0]) / Math.max(1, pass[1] - pass[0]);
    return [{ position: state.position, progress }];
  });
}

/**
 * Multipath: a thin dashed line across the field at the latitude where it
 * recurs, and a pulse on each tractor while it crosses that spot.
 */
export function multipathLayers(
  day: Day,
  clock: number,
  bounds: [number, number, number, number],
  states: TractorState[],
): Layer[] {
  const [west, , east] = bounds;
  const latitudes = spotLatitudes(day);
  return [
    new LineLayer<Dash>({
      id: "multipath-line",
      data: latitudes.flatMap((lat) => dashes(lat, west, east)),
      getSourcePosition: (dash) => dash.from,
      getTargetPosition: (dash) => dash.to,
      getColor: withAlpha(COLOR, 220),
      getWidth: 1.5,
      widthUnits: "pixels",
    }),
    new TextLayer<number>({
      ...LABEL_STYLE,
      id: "multipath-label",
      data: latitudes,
      getPosition: (lat) => [east, lat],
      getText: () => "Multipath spot",
      getSize: 12,
      getColor: withAlpha(COLOR, 255),
      // Just above the east end of the line, inside the field, where no panel covers it.
      getTextAnchor: "end",
      getAlignmentBaseline: "bottom",
      getPixelOffset: [-6, -7],
    }),
    new ScatterplotLayer<Pulse>({
      id: "multipath-pulse",
      data: pulses(day, clock, states),
      getPosition: (pulse) => pulse.position,
      radiusUnits: "pixels",
      getRadius: (pulse) => 10 + 16 * pulse.progress,
      filled: false,
      stroked: true,
      lineWidthUnits: "pixels",
      getLineWidth: 2,
      getLineColor: (pulse) => withAlpha(COLOR, Math.round(255 * (1 - 0.7 * pulse.progress))),
    }),
  ];
}
