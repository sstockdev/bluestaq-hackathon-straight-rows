import type { Map as MapLibreMap, PaddingOptions } from "maplibre-gl";
import type { Day, Index } from "../data/types";
import { TRACTORS } from "../lib/causes";

/** A [west, south, east, north] box in degrees. */
export type Bounds = [number, number, number, number];

/** The space the panels take on each side of a large window, in pixels. */
export const PANEL_ROOM = { left: 430, right: 440, top: 90, bottom: 200 };

/** How long a flight between the field and the globe takes, in milliseconds. */
const FLIGHT_MS = 3500;

/** The share of the free height above the time bar that the globe fills. */
const GLOBE_SHARE = 0.9;

/**
 * Padding that keeps the field clear of the panels. On a small window the
 * padding shrinks so the field always keeps at least 40% of the width and height.
 */
export function fieldPadding(width: number, height: number): Required<PaddingOptions> {
  const x = Math.min(1, (width * 0.6) / (PANEL_ROOM.left + PANEL_ROOM.right));
  const y = Math.min(1, (height * 0.6) / (PANEL_ROOM.top + PANEL_ROOM.bottom));
  return {
    left: PANEL_ROOM.left * x,
    right: PANEL_ROOM.right * x,
    top: PANEL_ROOM.top * y,
    bottom: PANEL_ROOM.bottom * y,
  };
}

/**
 * The box the camera fits: the field, stretched to take in wherever the
 * tractors go that day. They park just outside the field, and without this
 * they would sit under the time bar.
 */
export function cameraBounds(index: Index, day: Day | null): Bounds {
  const [west, south, east, north] = index.field.bounds;
  const box = { west, south, east, north };
  const tracks = day ? TRACTORS.map((id) => day.tractors[id]) : [];
  for (const { lon, lat } of tracks) {
    for (let i = 0; i < lon.length; i++) {
      box.west = Math.min(box.west, lon[i]);
      box.east = Math.max(box.east, lon[i]);
      box.south = Math.min(box.south, lat[i]);
      box.north = Math.max(box.north, lat[i]);
    }
  }
  return [box.west, box.south, box.east, box.north];
}

/** Fly in until the field fills the space between the panels. */
export function flyToField(map: MapLibreMap, bounds: Bounds) {
  const canvas = map.getCanvas();
  map.fitBounds(bounds, {
    padding: fieldPadding(canvas.clientWidth, canvas.clientHeight),
    bearing: 0,
    pitch: 0,
    duration: FLIGHT_MS,
  });
}

/**
 * The zoom at which MapLibre's globe looks a given number of pixels across
 * when the camera is centered on a latitude.
 */
function globeZoom(map: MapLibreMap, diameter: number, latitude: number): number {
  // The camera looks straight down from this far above the middle of the screen, in pixels.
  const cameraHeight = map.getCanvas().clientHeight / 2 / Math.tan((map.getVerticalFieldOfView() * Math.PI) / 360);
  // A sphere this close looks smaller than it is, so the real radius must be a little larger.
  const looks = diameter / 2;
  const radius = (looks * looks + looks * Math.hypot(looks, cameraHeight)) / cameraHeight;
  // MapLibre's globe has a radius of 256 * 2^zoom / (pi * cos(latitude)) pixels.
  return Math.log2((radius * Math.PI * Math.cos((latitude * Math.PI) / 180)) / 256);
}

/** Fly out until the whole globe is in view above the time bar, with the field at its middle. */
export function flyToGlobe(map: MapLibreMap, center: [number, number]) {
  const canvas = map.getCanvas();
  // The globe sits in the middle of the window, so the time bar limits how far down it can reach.
  const room = canvas.clientHeight - 2 * fieldPadding(canvas.clientWidth, canvas.clientHeight).bottom;
  const zoom = globeZoom(map, room * GLOBE_SHARE, center[1]);
  map.flyTo({ center, zoom, bearing: 0, pitch: 0, duration: FLIGHT_MS });
}
