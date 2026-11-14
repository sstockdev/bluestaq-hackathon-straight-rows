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
  /** Which way it is driving, in degrees clockwise from north. A tractor standing still points north. */
  heading: number;
  working: boolean;
  /** Index into CAUSE_ORDER, or -1 when the detector reports nothing. */
  cause: number;
}

/** The state of all three tractors at a moment. The tractor and spoofing layers share it. */
export function tractorStates(day: Day, clock: number): TractorState[] {
  const sample = sampleIndex(day, clock);
  return TRACTORS.map((id) => {
    const track = day.tractors[id];
    const position = positionAt(day, track, clock);
    // The direction from one sample back to one sample ahead.
    const behind = positionAt(day, track, clock - day.step);
    const ahead = positionAt(day, track, clock + day.step);
    const east = (ahead[0] - behind[0]) * Math.cos((position[1] * Math.PI) / 180);
    const north = ahead[1] - behind[1];
    const moving = Math.hypot(east, north) > 1e-6;
    return {
      id,
      position,
      heading: moving ? (Math.atan2(east, north) * 180) / Math.PI : 0,
      sample,
      working: track.working[sample] === 1,
      cause: track.cause[sample],
    };
  });
}
