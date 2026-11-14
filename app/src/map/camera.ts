import type { PaddingOptions } from "maplibre-gl";
import type { Day, Index } from "../data/types";
import { TRACTORS } from "../lib/causes";

/** A [west, south, east, north] box in degrees. */
export type Bounds = [number, number, number, number];

/** The space the panels take on each side of a large window, in pixels. */
export const PANEL_ROOM = { left: 470, right: 440, top: 70, bottom: 245 };

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
 * Padding for presentation mode: room for the left panel when one is open and
 * for the episode panel when a detection is selected, and a small margin
 * otherwise. The field always keeps at least 40% of the width.
 */
export function presentPadding(width: number, panelOpen: boolean, detectionOpen: boolean): Required<PaddingOptions> {
  const left = panelOpen ? 484 : 20;
  const right = detectionOpen ? 444 : 20;
  const x = Math.min(1, (width * 0.6) / (left + right));
  return { left: left * x, right: right * x, top: 44, bottom: 44 };
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
