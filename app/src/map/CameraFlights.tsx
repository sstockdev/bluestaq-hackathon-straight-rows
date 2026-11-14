import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl/maplibre";
import type { Index } from "../data/types";
import { useApp, type View } from "../state/store";
import { cameraBounds, flyToField, flyToGlobe } from "./camera";

/** Flies the camera out to the globe or back to the field when the store's view changes. Must be inside a Map. */
export default function CameraFlights({ index }: { index: Index }) {
  const map = useMap().current;
  const view = useApp((s) => s.view);
  // The map opens fitted to the field, so that is the view it starts in.
  const current = useRef<View>("field");

  useEffect(() => {
    if (!map || view === current.current) return;
    current.current = view;
    if (view === "globe") flyToGlobe(map.getMap(), index.field.center);
    else flyToField(map.getMap(), cameraBounds(index, useApp.getState().day));
  }, [map, view, index]);

  return null;
}
