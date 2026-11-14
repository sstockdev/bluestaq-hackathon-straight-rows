import type { Layer } from "@deck.gl/core";
import { dayRange, useApp, useSelected } from "../state/store";
import { fieldLayers } from "./layers/field";
import { hexLayers } from "./layers/hexes";
import { placeLayers } from "./layers/places";
import { reportLayers } from "./layers/reports";
import { rowLayers } from "./layers/rows";
import { spoofingLayers } from "./layers/spoofing";
import { tractorStates } from "./layers/tractorState";
import { tractorLayers, type HoveredTractor } from "./layers/tractors";

/**
 * Every deck.gl layer for the current moment, bottom to top. The hexagons, the
 * report ellipses, and the spoofing drift line draw nothing until the data calls for them.
 */
export function useMapLayers(onHover: (hovered: HoveredTractor | null) => void): Layer[] {
  const index = useApp((s) => s.index);
  const day = useApp((s) => s.day);
  const clock = useApp((s) => s.clock);
  const selected = useSelected();

  if (!index || !day) return [];

  const states = tractorStates(day, clock);
  return [
    ...fieldLayers(index.field.bounds),
    ...placeLayers(day),
    ...hexLayers(day, dayRange(day), clock, index.thresholds),
    ...rowLayers(day, clock),
    ...reportLayers(day, clock, index.field.center),
    ...spoofingLayers(day, states),
    ...tractorLayers(states, selected, onHover),
  ];
}
