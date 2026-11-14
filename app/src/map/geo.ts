import type { Day, Track } from "../data/types";

const METERS_PER_DEGREE = 111320;

/** A point moved east and north by a distance in meters. */
export function offsetMeters(point: [number, number], east: number, north: number): [number, number] {
  const [lon, lat] = point;
  const metersPerDegreeLon = METERS_PER_DEGREE * Math.cos((lat * Math.PI) / 180);
  return [lon + east / metersPerDegreeLon, lat + north / METERS_PER_DEGREE];
}

/** A track's position at a moment, on the straight line between the two nearest samples. */
export function positionAt(day: Day, track: Track, clock: number): [number, number] {
  const exact = Math.min(day.n - 1, Math.max(0, (clock - day.t0) / day.step));
  const before = Math.floor(exact);
  const after = Math.min(day.n - 1, before + 1);
  const share = exact - before;
  return [
    track.lon[before] + (track.lon[after] - track.lon[before]) * share,
    track.lat[before] + (track.lat[after] - track.lat[before]) * share,
  ];
}
