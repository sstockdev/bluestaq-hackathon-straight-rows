import { useEffect, useRef, useState } from "react";
import { useMap } from "react-map-gl/maplibre";

/**
 * Below this zoom the map is a globe. MapLibre's globe is identical to the
 * flat map from zoom 12 up, so switching here cannot be seen.
 */
const GLOBE_BELOW_ZOOM = 12;

/**
 * Shows the globe while the map is zoomed out and the flat map while it is
 * zoomed in, and returns true while zoomed out. On the globe deck.gl drew no
 * text or lines when this was built, and its positions are less exact there,
 * so the field is always shown flat. Must be inside a Map whose style has loaded.
 */
export function useGlobeWhenZoomedOut(): boolean {
  const map = useMap().current;
  const [zoomedOut, setZoomedOut] = useState(false);
  // The projection the map has now. The style starts flat (see mapStyle.ts).
  const projection = useRef<"mercator" | "globe">("mercator");

  useEffect(() => {
    if (!map) return;
    const update = () => setZoomedOut(map.getZoom() < GLOBE_BELOW_ZOOM);
    update();
    map.on("zoom", update);
    return () => {
      map.off("zoom", update);
    };
  }, [map]);

  useEffect(() => {
    const wanted = zoomedOut ? "globe" : "mercator";
    // Only touch the map when the projection really changes.
    if (!map || wanted === projection.current) return;
    map.getMap().setProjection({ type: wanted });
    projection.current = wanted;
  }, [map, zoomedOut]);

  return zoomedOut;
}
