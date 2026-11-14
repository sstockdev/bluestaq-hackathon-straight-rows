import type { Layer } from "@deck.gl/core";
import { useApp, useSelected } from "../state/store";
import { fieldLayers } from "./layers/field";
import { hexLayers } from "./layers/hexes";
import { multipathLayers } from "./layers/multipath";
import { placeLayers } from "./layers/places";
import { reportLayers } from "./layers/reports";
import { rowLayers } from "./layers/rows";
import { spoofingLayers } from "./layers/spoofing";
import { tractorStates } from "./layers/tractorState";
import { tractorLayers, type HoveredTractor } from "./layers/tractors";

/**
 * Every deck.gl layer for the current moment, bottom to top, with the Layers
 * panel's switches applied.
 */
export function useMapLayers(onHover: (hovered: HoveredTractor | null) => void): Layer[] {
  const index = useApp((s) => s.index);
  const day = useApp((s) => s.day);
  const clock = useApp((s) => s.clock);
  const range = useApp((s) => s.range);
  const shown = useApp((s) => s.layers);
  const selected = useSelected();

  if (!index || !day) return [];

  const states = tractorStates(day, clock);
  return [
    ...fieldLayers(index.field.bounds),
    ...placeLayers(day),
    ...(shown.hexes ? hexLayers(day, range, clock, index.thresholds) : []),
    ...(shown.rows ? rowLayers(day, clock) : []),
    ...(shown.reports ? reportLayers(day, clock, index.field.center) : []),
    ...(shown.multipath ? multipathLayers(day, clock, index.field.bounds, states) : []),
    ...(shown.spoofing ? spoofingLayers(day, states) : []),
    ...tractorLayers(states, selected, onHover),
  ];
}
