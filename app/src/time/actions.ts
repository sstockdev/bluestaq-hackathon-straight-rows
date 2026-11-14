/** Playback and detection stepping, shared by the Time panel's buttons and the keyboard shortcuts. */
import type { Day, Detection } from "../data/types";
import { useApp } from "../state/store";

/**
 * The detection before (-1) or after (1) the clock, or null at either end of the day.
 * Selecting a detection puts the clock on its start, so when the clock is still
 * there the step is taken from the selected detection itself.
 */
export function neighborDetection(day: Day, clock: number, selectedId: string | null, step: -1 | 1): Detection | null {
  const list = day.detections;
  const at = list.findIndex((d) => d.id === selectedId);
  if (at >= 0 && list[at].start === clock) return list[at + step] ?? null;
  if (step === 1) return list.find((d) => d.start > clock) ?? null;
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].start < clock) return list[i];
  }
  return null;
}

/** Select the previous (-1) or next (1) detection. Does nothing when there is none. */
export function stepDetection(step: -1 | 1): void {
  const { day, clock, selectedId, select } = useApp.getState();
  const next = day && neighborDetection(day, clock, selectedId, step);
  if (next) select(next);
}

/** Start or pause playback. Starting at the end of the day goes back to the start of the range first. */
export function togglePlay(): void {
  const { day, clock, playing, range, setClock, setPlaying } = useApp.getState();
  if (!day) return;
  const end = day.t0 + day.n * day.step - 1;
  if (!playing && clock >= end) setClock(range[0]);
  setPlaying(!playing);
}
