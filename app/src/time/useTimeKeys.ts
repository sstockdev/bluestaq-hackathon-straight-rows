import { useEffect } from "react";
import { scrub, stepDetection, togglePlay } from "./actions";

/** How far one press of an arrow key moves the clock, in seconds: a minute, or ten with Shift held. */
const ARROW_STEP = 60;
const ARROW_STEP_SHIFT = 600;

/** True when the key press belongs to something the person is typing into. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * Keyboard shortcuts for time: Space plays and pauses, the left and right
 * arrows move the clock back and forward (hold one down to scrub), and [ and ]
 * select the previous and next detection. Space is taken even when a button
 * has focus, so it always means play or pause; Enter still presses the focused
 * button. While the guided tour runs, the arrows belong to the tour (see useTour).
 */
export function useTimeKeys(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return;
      if (event.key === " ") {
        event.preventDefault();
        if (!event.repeat) togglePlay();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const step = event.shiftKey ? ARROW_STEP_SHIFT : ARROW_STEP;
        scrub(event.key === "ArrowLeft" ? -step : step);
      } else if (event.key === "[") {
        stepDetection(-1);
      } else if (event.key === "]") {
        stepDetection(1);
      }
    };
    // A focused button is pressed when Space is released. Stop that, or Space would do two things.
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === " " && !isTyping(event.target)) event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);
}
