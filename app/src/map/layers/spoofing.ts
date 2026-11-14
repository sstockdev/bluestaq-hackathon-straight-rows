import type { Layer } from "@deck.gl/core";
import { LineLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { Day, Track, TractorId } from "../../data/types";
import { CAUSES, CAUSE_ORDER, DRIFT_EXAGGERATION } from "../../lib/causes";
import { offsetMeters } from "../geo";
import { LABEL_STYLE, withAlpha } from "./style";
import type { TractorState } from "./tractorState";

const SPOOFING = CAUSE_ORDER.indexOf("SPOOFING");
/** A longitude step larger than this between two samples is a move to the next pass, not drift. */
const PASS_CHANGE_DEGREES = 0.00005;

/** One spoofed tractor: where it reports being, where it should be, and the real drift in meters. */
interface Drift {
  reported: [number, number];
  intended: [number, number];
  meters: number;
  /** True when the tractor has drifted east of its line, false when west. */
  driftedEast: boolean;
}

const directionsByDay = new WeakMap<Day, Record<TractorId, Int8Array>>();

/**
 * Which way each spoofed sample drifted: 1 for east, -1 for west, 0 when not
 * spoofed. The data gives only the size of the drift, so the direction comes
 * from whether the longitude rises or falls as the drift grows along a pass.
 */
function driftDirections(track: Track, n: number): Int8Array {
  const directions = new Int8Array(n);
  let i = 0;
  while (i < n) {
    if (track.cause[i] !== SPOOFING) {
      i++;
      continue;
    }
    let end = i;
    let agreement = 0;
    while (end + 1 < n && track.cause[end + 1] === SPOOFING) {
      const lonStep = track.lon[end + 1] - track.lon[end];
      const driftStep = (track.xte[end + 1] ?? 0) - (track.xte[end] ?? 0);
      if (Math.abs(lonStep) < PASS_CHANGE_DEGREES) agreement += lonStep * driftStep;
      end++;
    }
    directions.fill(agreement < 0 ? -1 : 1, i, end + 1);
    i = end + 1;
  }
  return directions;
}

/** The drift of every tractor the detector says is being spoofed right now. */
function currentDrifts(day: Day, states: TractorState[]): Drift[] {
  let directions = directionsByDay.get(day);
  if (!directions) {
    const of = (id: TractorId) => driftDirections(day.tractors[id], day.n);
    directions = { T1: of("T1"), T2: of("T2"), T3: of("T3") };
    directionsByDay.set(day, directions);
  }
  return states
    .filter((state) => state.cause === SPOOFING)
    .map((state) => {
      const meters = day.tractors[state.id].xte[state.sample] ?? 0;
      const driftedEast = directions[state.id][state.sample] > 0;
      const back = (driftedEast ? -1 : 1) * meters * DRIFT_EXAGGERATION;
      return { reported: state.position, intended: offsetMeters(state.position, back, 0), meters, driftedEast };
    });
}

/**
 * While a tractor is being spoofed: a ghost marker on the line it should be
 * on, joined to where it reports being. The gap is drawn DRIFT_EXAGGERATION
 * times larger than the real drift, and the label gives the real distance.
 */
export function spoofingLayers(day: Day, states: TractorState[]): Layer[] {
  const drifts = currentDrifts(day, states);
  const color = CAUSES.SPOOFING.rgb;
  return [
    new LineLayer<Drift>({
      id: "spoofing-drift",
      data: drifts,
      getSourcePosition: (drift) => drift.intended,
      getTargetPosition: (drift) => drift.reported,
      getColor: withAlpha(color, 255),
      getWidth: 2.5,
      widthUnits: "pixels",
    }),
    new ScatterplotLayer<Drift>({
      id: "spoofing-ghost",
      data: drifts,
      getPosition: (drift) => drift.intended,
      radiusUnits: "pixels",
      getRadius: 6,
      getFillColor: withAlpha(color, 90),
      stroked: true,
      lineWidthUnits: "pixels",
      getLineWidth: 2,
      getLineColor: withAlpha(color, 255),
    }),
    new TextLayer<Drift>({
      ...LABEL_STYLE,
      id: "spoofing-distance",
      data: drifts,
      getPosition: (drift) => drift.intended,
      getText: (drift) => `${drift.meters.toFixed(1)} m off line`,
      getSize: 12,
      getColor: withAlpha(color, 255),
      // The label sits on the far side of the ghost, clear of the tractor and its rings.
      getTextAnchor: (drift) => (drift.driftedEast ? "end" : "start"),
      getAlignmentBaseline: "center",
      getPixelOffset: (drift) => [drift.driftedEast ? -14 : 14, 0],
    }),
  ];
}
