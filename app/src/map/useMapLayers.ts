import type { Layer } from "@deck.gl/core";
import { dayRange, useApp, useSelected } from "../state/store";
import { fieldLayers } from "./layers/field";
import { fieldFrame } from "./layers/frame";
import { hexLayers } from "./layers/hexes";
import { multipathLayers } from "./layers/multipath";
import { placeLayers } from "./layers/places";
import { reportLayers } from "./layers/reports";
import { rowLayers } from "./layers/rows";
import { scaleBarLayers } from "./layers/scaleBar";
import { skyLayers } from "./layers/sky";
import { spoofingLayers } from "./layers/spoofing";
import { surroundingLayers } from "./layers/surroundings";
import { tractorStates } from "./layers/tractorState";
import { tractorLayers, type HoveredTractor } from "./layers/tractors";
import { yardLayers } from "./layers/yard";

/**
 * Every deck.gl layer for the current moment, bottom to top: the land around
 * the field, the yard, the field itself, then what the data shows on it. The
 * sky glow, the hexagons, the report ellipses, and the spoofing drift line
 * draw nothing until the data calls for them.
 */
export function useMapLayers(onHover: (hovered: HoveredTractor | null) => void): Layer[] {
  const index = useApp((s) => s.index);
  const day = useApp((s) => s.day);
  const clock = useApp((s) => s.clock);
  const selected = useSelected();

  if (!index || !day) return [];

  const frame = fieldFrame(index.field.bounds);
  const states = tractorStates(day, clock);
  return [
    ...surroundingLayers(frame),
    ...yardLayers(day, frame),
    ...fieldLayers(frame),
    ...multipathLayers(day, frame),
    ...skyLayers(day, clock, frame, index.thresholds),
    ...placeLayers(),
    ...scaleBarLayers(frame),
    ...hexLayers(day, dayRange(day), clock, index.thresholds),
    ...rowLayers(day, clock),
    ...reportLayers(day, clock, index.field.center),
    ...spoofingLayers(day, states),
    ...tractorLayers(states, selected, onHover),
  ];
}
