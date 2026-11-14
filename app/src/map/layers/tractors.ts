import type { Layer } from "@deck.gl/core";
import { IconLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
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

const ICON_SIZE = 40;
const CAUSE_RING_RADIUS = 24;
const SELECTED_RING_RADIUS = 30;
/** Opacity of a parked tractor, out of 255. */
const PARKED_ALPHA = 130;

/**
 * A tractor seen from above, facing up: the hood and cab in the tractor's
 * color, four wheels, and the planter it pulls as a bar across the back.
 */
function tractorIcon(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect x="30" y="40" width="4" height="9" fill="#cfd6dd"/>
    <rect x="5" y="47" width="54" height="7" rx="2" fill="#cfd6dd" stroke="#0c0e11" stroke-width="1.5"/>
    <rect x="15" y="25" width="9" height="17" rx="3" fill="#0c0e11" stroke="#f4f3ee" stroke-width="1.5"/>
    <rect x="40" y="25" width="9" height="17" rx="3" fill="#0c0e11" stroke="#f4f3ee" stroke-width="1.5"/>
    <rect x="19" y="8" width="6" height="10" rx="2" fill="#0c0e11" stroke="#f4f3ee" stroke-width="1.5"/>
    <rect x="39" y="8" width="6" height="10" rx="2" fill="#0c0e11" stroke="#f4f3ee" stroke-width="1.5"/>
    <rect x="25" y="4" width="14" height="38" rx="4" fill="${color}" stroke="#f4f3ee" stroke-width="2"/>
    <rect x="24" y="24" width="16" height="13" rx="3" fill="#12161b" stroke="#f4f3ee" stroke-width="1.5"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const ICONS: Record<TractorId, string> = {
  T1: tractorIcon(TRACTOR_COLOR.T1.color),
  T2: tractorIcon(TRACTOR_COLOR.T2.color),
  T3: tractorIcon(TRACTOR_COLOR.T3.color),
};

/**
 * The tractors: an icon in each tractor's color turned the way it is driving,
 * with its name beside it, a ring in the cause color while the detector
 * reports a cause on it, and a second ring while it belongs to the selected detection.
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
    new IconLayer<TractorState>({
      id: "tractor-icons",
      data: states,
      getPosition: (state) => state.position,
      getIcon: (state) => ({ url: ICONS[state.id], width: 64, height: 64 }),
      sizeUnits: "pixels",
      getSize: ICON_SIZE,
      // deck.gl turns icons counter-clockwise, and a heading is clockwise from north.
      getAngle: (state) => -state.heading,
      getColor: (state) => [255, 255, 255, alpha(state)],
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
      // Clear the icon and whichever rings are drawn around it.
      getPixelOffset: (state) => [(isSelected(state) ? SELECTED_RING_RADIUS : state.cause >= 0 ? CAUSE_RING_RADIUS : ICON_SIZE / 2) + 6, 0],
    }),
  ];
}
