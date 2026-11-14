import { useApp } from "../state/store";
import { SCENES } from "./scenes";

/** Go to a tour stop by its index (0 is the first) and set the screen up for it. An index outside the tour does nothing. */
export function goToStop(step: number): void {
  if (step < 0 || step >= SCENES.length) return;
  useApp.getState().setTourStep(step);
  void SCENES[step].apply(() => useApp.getState().tourStep === step);
}

/** Start the tour at its first stop. */
export function startTour(): void {
  goToStop(0);
}

/** End the tour and leave the screen as the last stop set it. */
export function endTour(): void {
  useApp.getState().setTourStep(null);
}
