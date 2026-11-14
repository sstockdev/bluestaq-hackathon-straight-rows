import type { Layer } from "@deck.gl/core";
import { TripsLayer } from "@deck.gl/geo-layers";
import type { Day, Track } from "../../data/types";
import { CAUSES, CAUSE_ORDER, HEALTHY_RGB, TRACTORS } from "../../lib/causes";
import type { Rgb } from "./style";

/** A stretch of planted row with one cause (or none) from start to end. */
interface RowSegment {
  path: [number, number][];
  /** Seconds since the start of the day at each point of the path. */
  times: number[];
  color: Rgb;
}

/**
 * The most samples one segment may hold (30 minutes). The tractors plant over
 * each other's rows a few hours apart, and segments are drawn oldest first so
 * the newest pass shows on top. Short segments keep that order true.
 */
const MAX_SAMPLES = 360;

const segmentsByDay = new WeakMap<Day, RowSegment[]>();

/** Split one track into runs of working samples that share a cause, none longer than MAX_SAMPLES. */
function splitTrack(track: Track, day: Day): RowSegment[] {
  const segments: RowSegment[] = [];
  let current: RowSegment | null = null;
  let currentCause = -1;
  for (let i = 0; i < day.n; i++) {
    if (track.working[i] !== 1) {
      current = null;
      continue;
    }
    const point: [number, number] = [track.lon[i], track.lat[i]];
    const cause = track.cause[i];
    if (current && (cause !== currentCause || current.path.length >= MAX_SAMPLES)) {
      // End the old segment on this point too, so the two segments touch.
      current.path.push(point);
      current.times.push(i * day.step);
      current = null;
    }
    if (!current) {
      const color = cause < 0 ? HEALTHY_RGB : CAUSES[CAUSE_ORDER[cause]].rgb;
      current = { path: [], times: [], color };
      currentCause = cause;
      segments.push(current);
    }
    current.path.push(point);
    current.times.push(i * day.step);
  }
  return segments.filter((segment) => segment.path.length > 1);
}

/** Every tractor's row segments for a day, oldest first, worked out once per day. */
function rowSegments(day: Day): RowSegment[] {
  let segments = segmentsByDay.get(day);
  if (!segments) {
    segments = TRACTORS.flatMap((id) => splitTrack(day.tractors[id], day)).sort((a, b) => a.times[0] - b.times[0]);
    segmentsByDay.set(day, segments);
  }
  return segments;
}

/** The rows planted so far today, colored by what the detector reported while each was planted. */
export function rowLayers(day: Day, clock: number): Layer[] {
  return [
    new TripsLayer<RowSegment>({
      id: "rows",
      data: rowSegments(day),
      getPath: (segment) => segment.path,
      getTimestamps: (segment) => segment.times,
      getColor: (segment) => segment.color,
      // Everything planted before the clock stays drawn; nothing after it is.
      currentTime: clock - day.t0,
      trailLength: day.n * day.step,
      fadeTrail: false,
      getWidth: 5,
      widthUnits: "meters",
      widthMinPixels: 1.5,
      capRounded: true,
      jointRounded: true,
      opacity: 0.85,
    }),
  ];
}
