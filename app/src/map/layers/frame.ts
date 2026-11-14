/** A flat grid over the field, in meters, so the drawn objects can be laid out like a site plan. */

const METERS_PER_DEGREE = 111320;

export interface Frame {
  /** The field's size in meters: west to east, and south to north. */
  width: number;
  height: number;
  /** The [lon, lat] of a point `x` meters east and `y` meters north of the field's south-west corner. */
  at: (x: number, y: number) => [number, number];
  /** The reverse: meters east and north of that corner for a [lon, lat]. */
  meters: (point: [number, number]) => [number, number];
  /** A rectangle's four corners, for a polygon. */
  rect: (x0: number, y0: number, x1: number, y1: number) => [number, number][];
}

const frames = new WeakMap<object, Frame>();

/** The frame for a field's [west, south, east, north] box. Built once per box. */
export function fieldFrame(bounds: [number, number, number, number]): Frame {
  let frame = frames.get(bounds);
  if (!frame) {
    const [west, south, east, north] = bounds;
    const perLon = METERS_PER_DEGREE * Math.cos((south * Math.PI) / 180);
    const at = (x: number, y: number): [number, number] => [west + x / perLon, south + y / METERS_PER_DEGREE];
    frame = {
      width: (east - west) * perLon,
      height: (north - south) * METERS_PER_DEGREE,
      at,
      meters: ([lon, lat]) => [(lon - west) * perLon, (lat - south) * METERS_PER_DEGREE],
      rect: (x0, y0, x1, y1) => [at(x0, y1), at(x1, y1), at(x1, y0), at(x0, y0)],
    };
    frames.set(bounds, frame);
  }
  return frame;
}
