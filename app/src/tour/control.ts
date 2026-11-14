import { useApp } from "../state/store";
import { endIntro } from "./intro";
import { SCENES } from "./scenes";

/** When the tour was started, in epoch milliseconds, for the notes window's timer. Null while the tour is off. */
let startedAt: number | null = null;
export const tourStartedAt = () => startedAt;

/**
 * Go to a tour stop by its index (0 is the first) and set the screen up for it.
 * An index outside the tour does nothing. The opening stops if it was playing.
 */
export function goToStop(step: number): void {
  if (step < 0 || step >= SCENES.length) return;
  endIntro();
  if (useApp.getState().tourStep === null) startedAt = Date.now();
  useApp.getState().setTourStep(step);
  void SCENES[step].apply(() => useApp.getState().tourStep === step);
}

/** Start the tour at its first stop, and its timer at zero. */
export function startTour(): void {
  startedAt = Date.now();
  goToStop(0);
}

/** End the tour and leave the screen as the last stop set it. */
export function endTour(): void {
  startedAt = null;
  useApp.getState().setTourStep(null);
}

/** Open the presenter's reference in its own window: the five rules side by side. */
export function openReference(): void {
  window.open(`${window.location.pathname}?reference=1`, "straight-rows-reference", "popup=yes,width=1100,height=900,left=580,top=40");
}

/** Open the presenter's notes in their own window. They follow the tour in this one. */
export function openNotes(): void {
  window.open(`${window.location.pathname}?notes=1`, "straight-rows-notes", "popup=yes,width=560,height=860");
}
