import { useEffect } from "react";
import { useApp } from "./store";

/**
 * Keep the day, the clock, the selected detection, and the open panel in the URL,
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

  useEffect(() => {
    if (!date || t0 === undefined || playing) return;
    const params = new URLSearchParams();
    params.set("day", date);
    params.set("t", String(Math.round(clock - t0)));
    if (selectedId) params.set("sel", selectedId);
    if (panel) params.set("panel", panel);
    window.history.replaceState(null, "", `?${params}`);
  }, [date, t0, clock, playing, selectedId, panel]);
}
