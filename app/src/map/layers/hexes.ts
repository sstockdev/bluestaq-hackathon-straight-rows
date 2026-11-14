import type { Layer } from "@deck.gl/core";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { latLngToCell } from "h3-js";
import type { Day, Thresholds, TractorId } from "../../data/types";
import { CAUSES, TRACTORS } from "../../lib/causes";
import { PANEL, withAlpha } from "./style";

/** H3 resolution 12: cells about 19 m across, a little wider than one planter pass. */
const RESOLUTION = 12;
/** How far back from the clock the layer looks, in seconds. */
export const HEX_WINDOW_S = 1800;
/** Unexplained loss above this many dB is drawn as high. */
const HIGH_DB = 10;

/**
 * The same steps as the legend in the Layers panel: the jamming color at three
 * strengths, out of 255, for low, medium, and high.
 */
const COLOR = CAUSES.JAMMING.rgb;
const LOW_ALPHA = Math.round(255 * 0.3);
const MEDIUM_ALPHA = Math.round(255 * 0.6);
const HIGH_ALPHA = 255;

/** One hexagon and the largest unexplained loss seen inside it, in dB. */
interface HexCell {
  hex: string;
  excess: number;
}

const cellsByDay = new WeakMap<Day, Record<TractorId, string[]>>();
let last: { day: Day; start: number; end: number; minimum: number; cells: HexCell[] } | null = null;

/** The H3 cell of every sample of every tractor, worked out once per day. */
function sampleCells(day: Day): Record<TractorId, string[]> {
  let cells = cellsByDay.get(day);
  if (!cells) {
    const cellsOf = (id: TractorId) => {
      const track = day.tractors[id];
      return track.lat.map((lat, i) => (track.working[i] === 1 ? latLngToCell(lat, track.lon[i], RESOLUTION) : ""));
    };
    cells = { T1: cellsOf("T1"), T2: cellsOf("T2"), T3: cellsOf("T3") };
    cellsByDay.set(day, cells);
  }
  return cells;
}

/** The cells whose largest unexplained loss inside the range reaches the minimum. */
function hexCells(day: Day, range: [number, number], minimum: number): HexCell[] {
  if (last && last.day === day && last.start === range[0] && last.end === range[1] && last.minimum === minimum) {
    return last.cells;
  }
  const cells = sampleCells(day);
  const first = Math.max(0, Math.ceil((range[0] - day.t0) / day.step));
  const end = Math.min(day.n, Math.floor((range[1] - day.t0) / day.step) + 1);
  const worst = new Map<string, number>();
  for (const id of TRACTORS) {
    const excess = day.tractors[id].excess;
    for (let i = first; i < end; i++) {
      const hex = cells[id][i];
      const value = excess[i];
      if (hex && value !== null && value > (worst.get(hex) ?? -Infinity)) worst.set(hex, value);
    }
  }
  const result = [...worst].filter(([, excess]) => excess >= minimum).map(([hex, excess]) => ({ hex, excess }));
  last = { day, start: range[0], end: range[1], minimum, cells: result };
  return result;
}

/**
 * Hexagons over the field colored by the largest unexplained signal loss seen
 * in each one during the half hour before the clock: low, medium, or high.
 * Looking back a fixed time keeps the layer from filling the whole field over a
 * day. The window never reaches outside the selected range. Cells below the
 * detector's jamming member threshold are not drawn.
 */
export function hexLayers(day: Day, range: [number, number], clock: number, thresholds: Thresholds): Layer[] {
  const window: [number, number] = [Math.max(range[0], clock - HEX_WINDOW_S), Math.min(range[1], clock)];
  const alpha = (cell: HexCell) =>
    cell.excess > HIGH_DB ? HIGH_ALPHA : cell.excess >= thresholds.jamTrigger ? MEDIUM_ALPHA : LOW_ALPHA;
  return [
    new H3HexagonLayer<HexCell>({
      id: "hexes",
      data: hexCells(day, window, thresholds.jamMember),
      getHexagon: (cell) => cell.hex,
      getFillColor: (cell) => withAlpha(COLOR, alpha(cell)),
      // A dark edge keeps neighboring cells of the same strength apart.
      getLineColor: withAlpha(PANEL, 140),
      // The whole layer is see-through, so the field and its rows show under even the strongest cells.
      opacity: 0.7,
      extruded: false,
      stroked: true,
      lineWidthUnits: "pixels",
      getLineWidth: 1,
      updateTriggers: { getFillColor: thresholds.jamTrigger },
    }),
  ];
}
