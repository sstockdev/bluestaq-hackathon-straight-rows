import type { MapMouseEvent } from "maplibre-gl";
import { useEffect, useState } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useApp } from "../state/store";
import { Panel } from "../ui/Panel";
import { PANEL_ROOM } from "./camera";
import { formatLatLon } from "./geo";
import { ATTRIBUTION } from "./mapStyle";

/**
 * The latitude and longitude under the cursor, in the top right corner, with
 * the map credit beneath. It shows the given point until the cursor first
 * moves, and steps left while a detection is selected, because the detection's
 * panel opens in that corner. Must be inside a Map.
 */
export default function CursorReadout({ start }: { start: [number, number] }) {
  const map = useMap().current;
  const detectionOpen = useApp((s) => s.selectedId !== null);
  const [point, setPoint] = useState({ lon: start[0], lat: start[1] });

  useEffect(() => {
    if (!map) return;
    const follow = (event: MapMouseEvent) => setPoint({ lon: event.lngLat.lng, lat: event.lngLat.lat });
    map.on("mousemove", follow);
    return () => {
      map.off("mousemove", follow);
    };
  }, [map]);

  return (
    <div className="pointer-events-none absolute top-3 z-10 font-sans" style={{ right: detectionOpen ? PANEL_ROOM.right + 12 : 12 }}>
      <Panel className="px-3 py-2 text-right">
        <p className="tabular text-sm text-ink">{formatLatLon(point.lat, point.lon)}</p>
        <p className="mt-0.5 text-[11px] text-faint">{ATTRIBUTION}</p>
      </Panel>
    </div>
  );
}
