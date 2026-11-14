import { useEffect } from "react";
import { useApp } from "./store";

/** How long the state must hold still before the URL is rewritten, in milliseconds. */
const SETTLE_MS = 250;

/**
 * Keep the day, the clock, the selected detection, and the open panel in the URL,
 * so any view can be reloaded or linked. The store reads these back in start().
 * While the clock is playing the URL is left alone.
 *
 * The write waits until the state has held still for a moment. Dragging the
 * timeline changes the clock on every pointer move, and Safari and Firefox
 * refuse a URL that changes more than about a hundred times in half a minute.
 */
export function useUrlSync() {
  const date = useApp((s) => s.day?.date);
  const t0 = useApp((s) => s.day?.t0);
  const clock = useApp((s) => s.clock);
  const playing = useApp((s) => s.playing);
  const selectedId = useApp((s) => s.selectedId);
  const panel = useApp((s) => s.panel);
  const present = useApp((s) => s.present);

  useEffect(() => {
    if (!date || t0 === undefined || playing) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      params.set("day", date);
      params.set("t", String(Math.round(clock - t0)));
      if (selectedId) params.set("sel", selectedId);
      if (panel) params.set("panel", panel);
      if (present) params.set("present", "1");
      try {
        window.history.replaceState(null, "", `?${params}`);
      } catch {
        // The browser refused this write. The next one carries the same state, so nothing is lost.
      }
    }, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [date, t0, clock, playing, selectedId, panel, present]);
}
