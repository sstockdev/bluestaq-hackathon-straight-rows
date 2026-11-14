import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useApp } from "../state/store";
import { cameraBounds, fieldPadding, presentPadding } from "./camera";

/**
 * Keeps the field framed in presentation mode. Whenever a panel opens or
 * closes, the day changes, or the window is resized, the map is fitted to the
 * space the panels leave. Leaving presentation mode fits it once for the
 * normal layout. Outside presentation mode the camera is left alone. Must be
 * inside a Map.
 */
export default function PresentCamera() {
  const map = useMap().current;
  const index = useApp((s) => s.index);
  const day = useApp((s) => s.day);
  const present = useApp((s) => s.present);
  const panelOpen = useApp((s) => s.panel !== null);
  const detectionOpen = useApp((s) => s.selectedId !== null);
  const wasPresent = useRef(false);

  useEffect(() => {
    if (!map || !index) return;
    const leaving = wasPresent.current && !present;
    wasPresent.current = present;
    if (!present && !leaving) return;

    const fit = () => {
      const { clientWidth, clientHeight } = map.getContainer();
      const padding = present ? presentPadding(clientWidth, panelOpen, detectionOpen) : fieldPadding(clientWidth, clientHeight);
      map.fitBounds(cameraBounds(index, day), { padding, duration: 400 });
    };
    fit();
    if (!present) return;
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [map, index, day, present, panelOpen, detectionOpen]);

  return null;
}
