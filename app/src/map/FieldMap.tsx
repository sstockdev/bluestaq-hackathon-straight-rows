import type { ErrorEvent } from "maplibre-gl";
// MapLibre 6 runs part of itself in a worker file that the bundler cannot find by itself.
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { useMemo, useState } from "react";
import Map from "react-map-gl/maplibre";
import { useApp } from "../state/store";
import { cameraBounds, fieldPadding } from "./camera";
import MapCredit from "./MapCredit";
import MapLayers from "./MapLayers";
import { mapStyle } from "./mapStyle";

/** Report a map error in the console without stopping the app. */
function reportMapError(event: ErrorEvent) {
  console.error(event.error);
}

/**
 * The map that fills the screen: a dark globe, and on it the simulated field,
 * the tractors, the fading trail of rows behind them, and the other data layers. It opens
 * fitted to the field, clear of the panels.
 */
export default function FieldMap() {
  const index = useApp((s) => s.index);
  const center = index?.field.center;
  // Built once: handing the map a new style object would make it reload.
  const style = useMemo(() => (center ? mapStyle(center) : null), [center]);
  // MapLibre throws if anything changes the map before its style has loaded,
  // so nothing inside the map is rendered until the map says it is ready.
  const [loaded, setLoaded] = useState(false);

  if (!index || !style) return null;
  return (
    // "isolate" keeps the map's own stacking order from rising above the panels.
    // The space around the globe is a shade darker than the ocean, so the globe's edge shows.
    <div className="absolute inset-0 isolate bg-[#050608]">
      <Map
        mapStyle={style}
        workerUrl={workerUrl}
        onError={reportMapError}
        onLoad={() => setLoaded(true)}
        // Read once, when the map is created.
        initialViewState={{
          bounds: cameraBounds(index, useApp.getState().day),
          fitBoundsOptions: { padding: fieldPadding(window.innerWidth, window.innerHeight) },
        }}
        attributionControl={false}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        maxZoom={19}
      >
        {loaded && <MapLayers center={index.field.center} />}
      </Map>
      <MapCredit />
    </div>
  );
}
