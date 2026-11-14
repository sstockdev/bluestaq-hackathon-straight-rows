import { useEffect } from "react";
import { useApp } from "../state/store";
import { endTour, goToStop, openReference, openNotes, startTour, tourStartedAt } from "./control";
import { openTourChannel, type TourMessage } from "./presenter";

/** True when the key press belongs to a field the user is typing in. */
function isTyping(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * The guided tour's keys: T starts it at the first stop, N opens the
 * presenter's notes and reference in their own windows, C opens the reference
 * alone, P turns presentation mode on and off, the right and left arrows move
 * between stops, and Escape ends it. While the tour runs, the arrows and
 * Escape go to the tour and nowhere else.
 *
 * It also keeps a notes window in step: it tells the window which stop the
 * tour is on, and moves when the window asks.
 */
export function useTour(): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event)) return;
      const step = useApp.getState().tourStep;

      if (event.key === "t" || event.key === "T") {
        startTour();
      } else if (event.key === "n" || event.key === "N") {
        // A browser may allow only one new window per key press. If the reference is blocked, C opens it.
        openNotes();
        openReference();
      } else if (event.key === "c" || event.key === "C") {
        openReference();
      } else if (event.key === "p" || event.key === "P") {
        useApp.getState().setPresent(!useApp.getState().present);
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
      event.stopImmediatePropagation();
    };
    // Listen in the capture phase so the tour sees the key before a slider or the time bar does.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  useEffect(() => {
    const channel = openTourChannel();
    const tell = () => channel.postMessage({ type: "state", step: useApp.getState().tourStep, startedAt: tourStartedAt() } satisfies TourMessage);
    channel.onmessage = (event: MessageEvent<TourMessage>) => {
      const message = event.data;
      if (message.type === "hello") tell();
      else if (message.type !== "go") return;
      else if (message.step === null) endTour();
      else goToStop(message.step);
    };
    const stop = useApp.subscribe((state, before) => {
      if (state.tourStep !== before.tourStep) tell();
    });
    return () => {
      stop();
      channel.close();
    };
  }, []);
}
