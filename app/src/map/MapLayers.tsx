import { useState } from "react";
import DeckOverlay from "./DeckOverlay";
import FieldMarker from "./FieldMarker";
import type { HoveredTractor } from "./layers/tractors";
import TractorTooltip from "./TractorTooltip";
import { useGlobeWhenZoomedOut } from "./useGlobeWhenZoomedOut";
import { useMapLayers } from "./useMapLayers";

/**
 * Everything drawn on the map from the data, plus the tooltip for the tractor
 * under the cursor. Zoomed out to the globe, the field is a single marker
 * instead. Must be inside a Map.
 */
export default function MapLayers({ center }: { center: [number, number] }) {
  const [hovered, setHovered] = useState<HoveredTractor | null>(null);
  const zoomedOut = useGlobeWhenZoomedOut();
  const layers = useMapLayers(setHovered);
  return (
    <>
      <DeckOverlay layers={zoomedOut ? [] : layers} />
      {zoomedOut && <FieldMarker center={center} />}
      {hovered && !zoomedOut && <TractorTooltip hovered={hovered} />}
    </>
  );
}
