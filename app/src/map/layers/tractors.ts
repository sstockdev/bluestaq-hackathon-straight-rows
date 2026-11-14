import type { Layer } from "@deck.gl/core";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { Detection, TractorId } from "../../data/types";
import { CAUSES, CAUSE_ORDER, TRACTOR_COLOR } from "../../lib/causes";
import { INK, LABEL_STYLE, withAlpha } from "./style";
import type { TractorState } from "./tractorState";

/** The tractor under the cursor and where the cursor is, in pixels from the map's top left. */
export interface HoveredTractor {
  id: TractorId;
  x: number;
  y: number;
}

const DOT_RADIUS = 7;
const CAUSE_RING_RADIUS = 13;
const SELECTED_RING_RADIUS = 19;
/** Opacity of a parked tractor, out of 255. */
const PARKED_ALPHA = 110;

/**
 * The tractors: a dot in each tractor's color with its name beside it, a ring
 * in the cause color while the detector reports a cause on it, and a second
 * ring while it belongs to the selected detection.
 */
export function tractorLayers(
  states: TractorState[],
  selected: Detection | null,
  onHover: (hovered: HoveredTractor | null) => void,
): Layer[] {
  const alpha = (state: TractorState) => (state.working ? 255 : PARKED_ALPHA);
  const isSelected = (state: TractorState) => selected !== null && selected.tractors.includes(state.id);
  const ring = { getPosition: (state: TractorState) => state.position, radiusUnits: "pixels", filled: false, stroked: true, lineWidthUnits: "pixels" } as const;

  return [
    new ScatterplotLayer<TractorState>({
      ...ring,
      id: "tractor-selected-rings",
      data: states.filter(isSelected),
      getRadius: SELECTED_RING_RADIUS,
      getLineColor: withAlpha(INK, 230),
      getLineWidth: 1.5,
    }),
    new ScatterplotLayer<TractorState>({
      ...ring,
      id: "tractor-cause-rings",
      data: states.filter((state) => state.cause >= 0),
      getRadius: CAUSE_RING_RADIUS,
      getLineColor: (state) => withAlpha(CAUSES[CAUSE_ORDER[state.cause]].rgb, 255),
      getLineWidth: 3,
    }),
    new ScatterplotLayer<TractorState>({
      id: "tractor-dots",
      data: states,
      getPosition: (state) => state.position,
      radiusUnits: "pixels",
      getRadius: DOT_RADIUS,
      getFillColor: (state) => withAlpha(TRACTOR_COLOR[state.id].rgb, alpha(state)),
      stroked: true,
      lineWidthUnits: "pixels",
      getLineWidth: 1.5,
      getLineColor: (state) => withAlpha(INK, alpha(state)),
      pickable: true,
      onHover: (info) => onHover(info.object ? { id: info.object.id, x: info.x, y: info.y } : null),
    }),
    new TextLayer<TractorState>({
      ...LABEL_STYLE,
      id: "tractor-names",
      data: states,
      getPosition: (state) => state.position,
      getText: (state) => state.id,
      getSize: 13,
      getColor: (state) => withAlpha(INK, alpha(state)),
      getTextAnchor: "start",
      getAlignmentBaseline: "center",
      // Clear whichever rings are drawn around the dot.
      getPixelOffset: (state) => [(isSelected(state) ? SELECTED_RING_RADIUS : state.cause >= 0 ? CAUSE_RING_RADIUS : DOT_RADIUS) + 6, 0],
    }),
  ];
}
