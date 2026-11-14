import { useApp } from "../state/store";
import { PANEL_ROOM } from "./camera";
import { ATTRIBUTION } from "./mapStyle";

/**
 * The map's data credit as small text in the top right corner. It steps left
 * while a detection is selected, because the detection's panel opens in that corner.
 */
export default function MapCredit() {
  const detectionOpen = useApp((s) => s.selectedId !== null);
  return (
    <p className="pointer-events-none absolute top-3 z-10 text-[11px] text-faint" style={{ right: detectionOpen ? PANEL_ROOM.right + 12 : 12 }}>
      {ATTRIBUTION}
    </p>
  );
}
