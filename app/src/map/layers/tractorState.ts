import type { Day, TractorId } from "../../data/types";
import { TRACTORS } from "../../lib/causes";
import { sampleIndex } from "../../state/store";
import { positionAt } from "../geo";

/** Where one tractor is and what it is doing at a moment. */
export interface TractorState {
  id: TractorId;
  /** [lon, lat], interpolated between samples. */
  position: [number, number];
  /** The sample this moment falls in. */
  sample: number;
  working: boolean;
  /** Index into CAUSE_ORDER, or -1 when the detector reports nothing. */
  cause: number;
}

/** The state of all three tractors at a moment. The tractor, spoofing, and multipath layers share it. */
export function tractorStates(day: Day, clock: number): TractorState[] {
  const sample = sampleIndex(day, clock);
  return TRACTORS.map((id) => {
    const track = day.tractors[id];
    return {
      id,
      position: positionAt(day, track, clock),
      sample,
      working: track.working[sample] === 1,
      cause: track.cause[sample],
    };
  });
}
