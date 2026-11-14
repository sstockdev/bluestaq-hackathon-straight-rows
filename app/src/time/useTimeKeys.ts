import { useEffect } from "react";
import { stepDetection, togglePlay } from "./actions";

/** True when the key press belongs to something the person is typing into. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * Keyboard shortcuts for time: Space plays and pauses, [ and ] select the
 * previous and next detection. Space is taken even when a button has focus, so
 * it always means play or pause; Enter still presses the focused button.
 */
export function useTimeKeys(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return;
      if (event.key === " ") {
        event.preventDefault();
        if (!event.repeat) togglePlay();
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
