import type { StyleSpecification } from "maplibre-gl";
import type { Feature, FeatureCollection, LineString } from "geojson";

/** Credit for the land outline. Shown in the cursor readout. */
export const ATTRIBUTION = "Land outline: Natural Earth.";

/**
 * The folder the basemap files are served from, as a full address on this
 * site. MapLibre loads some files in a worker, where a relative path would
 * not resolve, so every path is made absolute here.
 */
const BASEMAP = new URL(`${import.meta.env.BASE_URL}basemap/`, document.baseURI).href;

/** Spacing of the fine grid around the field, in degrees: about 280 m north to south. */
const LOCAL_STEP = 0.0025;
/** How far the fine grid reaches from the field, in degrees. */
const LOCAL_REACH = 0.05;

const line = (points: [number, number][]): Feature<LineString> => ({
  type: "Feature",
  properties: {},
  geometry: { type: "LineString", coordinates: points },
});

/** Lines of latitude and longitude every 10 degrees, for the globe. */
function worldGrid(): FeatureCollection<LineString> {
  const lines: Feature<LineString>[] = [];
  for (let lon = -180; lon <= 180; lon += 10) lines.push(line([[lon, -80], [lon, 80]]));
  for (let lat = -80; lat <= 80; lat += 10) {
    // Many points per parallel, so it curves with the globe.
    lines.push(line(Array.from({ length: 73 }, (_, i) => [-180 + i * 5, lat])));
  }
  return { type: "FeatureCollection", features: lines };
}

/** A fine grid around the field, so the map has a sense of scale when zoomed in. */
function localGrid([lon, lat]: [number, number]): FeatureCollection<LineString> {
  const lines: Feature<LineString>[] = [];
  const snap = (value: number) => Math.round(value / LOCAL_STEP) * LOCAL_STEP;
  const [west, east, south, north] = [lon - LOCAL_REACH, lon + LOCAL_REACH, lat - LOCAL_REACH, lat + LOCAL_REACH];
  for (let x = snap(west); x <= east; x += LOCAL_STEP) lines.push(line([[x, south], [x, north]]));
  for (let y = snap(south); y <= north; y += LOCAL_STEP) lines.push(line([[west, y], [east, y]]));
  return { type: "FeatureCollection", features: lines };
}

/**
 * The dark basemap: the world's land outline and two grids, a coarse one for
 * the globe and a fine one around the field. There is no aerial photo. The
 * dataset's field is simulated and its coordinates fall partly on a real
 * neighborhood, so a photo would show tractors driving through houses.
 *
 * Every file is local, so the map works with no internet. The style starts in
 * the flat (mercator) projection because the map opens zoomed in on the field.
 * useGlobeWhenZoomedOut switches to the globe.
 */
export function mapStyle(fieldCenter: [number, number]): StyleSpecification {
  return {
    version: 8,
    projection: { type: "mercator" },
    sources: {
      land: { type: "geojson", data: `${BASEMAP}land.geojson`, attribution: ATTRIBUTION },
      "world-grid": { type: "geojson", data: worldGrid() },
      "local-grid": { type: "geojson", data: localGrid(fieldCenter) },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#0c0e11" } },
      { id: "land", type: "fill", source: "land", paint: { "fill-color": "#171c22" } },
      { id: "land-outline", type: "line", source: "land", paint: { "line-color": "#3a4450", "line-width": 0.8 } },
      { id: "world-grid", type: "line", source: "world-grid", maxzoom: 9, paint: { "line-color": "#232b34", "line-width": 0.6 } },
      { id: "local-grid", type: "line", source: "local-grid", minzoom: 11, paint: { "line-color": "#27303a", "line-width": 0.8 } },
    ],
  };
}
