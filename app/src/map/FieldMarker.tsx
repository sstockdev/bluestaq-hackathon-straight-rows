import { Marker } from "react-map-gl/maplibre";

/** A dot and a name where the field is, for the globe, where the field itself is too small to see. Must be inside a Map. */
export default function FieldMarker({ center }: { center: [number, number] }) {
  return (
    <Marker longitude={center[0]} latitude={center[1]} anchor="left" offset={[-7, 0]}>
      <div className="flex items-center gap-2 font-sans">
        <span className="h-3.5 w-3.5 rounded-full border-2 border-ink bg-accent" />
        <span className="rounded bg-panel/90 px-1.5 py-0.5 text-sm font-semibold text-ink">Casselton, North Dakota</span>
      </div>
    </Marker>
  );
}
