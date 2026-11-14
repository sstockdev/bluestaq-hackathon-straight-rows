import { useEffect } from "react";
import { useApp } from "./store";

/**
 * Keep the day, the clock, the selected detection, the open panel, and the layer switches in the URL,
 * so any view can be reloaded or linked. The store reads these back in start().
 * While the clock is playing the URL is left alone.
 */
export function useUrlSync() {
  const date = useApp((s) => s.day?.date);
  const t0 = useApp((s) => s.day?.t0);
  const clock = useApp((s) => s.clock);
  const playing = useApp((s) => s.playing);
  const selectedId = useApp((s) => s.selectedId);
  const panel = useApp((s) => s.panel);
  const layers = useApp((s) => s.layers);

  useEffect(() => {
    if (!date || t0 === undefined || playing) return;
    const params = new URLSearchParams();
    params.set("day", date);
    params.set("t", String(Math.round(clock - t0)));
    if (selectedId) params.set("sel", selectedId);
    if (panel) params.set("panel", panel);
    const on = Object.entries(layers).filter(([, isOn]) => isOn).map(([id]) => id);
    params.set("layers", on.join(","));
    window.history.replaceState(null, "", `?${params}`);
  }, [date, t0, clock, playing, selectedId, panel, layers]);
}
