import { useEffect } from "react";
import { useApp } from "../state/store";

/**
 * The longest real time one frame may count for, in seconds. The browser stops
 * sending frames while the tab is hidden; without this limit the clock would
 * leap ahead by the whole time away when the tab comes back.
 */
const LONGEST_FRAME = 1;

/**
 * Advance the clock while `playing` is on. Each animation frame moves the clock
 * by the real time that passed, multiplied by the playback speed. Playback stops
 * at the end of the day.
 */
export function usePlayback() {
  const playing = useApp((s) => s.playing);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const { clock, speed, day, setClock, setPlaying } = useApp.getState();
      const elapsed = Math.min((now - last) / 1000, LONGEST_FRAME);
      last = now;
      if (!day) return;
      const end = day.t0 + day.n * day.step - 1;
      if (clock >= end) {
        setPlaying(false);
        return;
      }
      setClock(clock + elapsed * speed);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
}
