import { useEffect } from "react";
import { useApp } from "../state/store";
import { endTour, goToStop, startTour } from "./control";

/** True when the key press belongs to a field the user is typing in. */
function isTyping(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * The guided tour's keys: T starts it at the first stop, the right and left
 * arrows move between stops, and Escape ends it. While the tour runs, these
 * keys go to the tour and nowhere else.
 */
export function useTour(): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event)) return;
      const step = useApp.getState().tourStep;

      if (event.key === "t" || event.key === "T") {
        startTour();
      } else if (step === null) {
        return;
      } else if (event.key === "ArrowRight") {
        goToStop(step + 1);
      } else if (event.key === "ArrowLeft") {
        goToStop(step - 1);
      } else if (event.key === "Escape") {
        endTour();
      } else {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };
    // Listen in the capture phase so the tour sees the key before a slider or the time bar does.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);
}
