import type { Layer } from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { useControl } from "react-map-gl/maplibre";

/** Every layer is flat on the ground, so the order of the list alone decides which is on top. */
const FLAT = { depthCompare: "always", depthWriteEnabled: false } as const;

/** Draws deck.gl layers over the map and keeps them in step with its camera. Must be inside a Map. */
export default function DeckOverlay({ layers }: { layers: Layer[] }) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay({ layers, parameters: FLAT }));
  overlay.setProps({ layers });
  return null;
}
