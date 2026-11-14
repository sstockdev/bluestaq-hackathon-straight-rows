import { useRef, useState, type PointerEvent } from "react";
import type { Detection } from "../data/types";
import { useApp } from "../state/store";
import type { TimelineBlock } from "./blocks";
import type { Scale } from "./scale";

/** How far the pointer must travel, in pixels, before a press on a detection counts as a drag. */
const DRAG_START = 4;

type BarEvent = PointerEvent<SVGSVGElement>;

/**
 * Pointer handling for the time bar. Pressing or dragging moves the clock.
 * A press and release on a detection block selects that detection instead.
 * Resting the pointer on a block reports it as `hover`, for the tooltip.
 */
export function useScrub(scale: Scale, byKey: Map<string, TimelineBlock>) {
  const [hover, setHover] = useState<{ block: TimelineBlock; x: number } | null>(null);
  const press = useRef<{ x: number; detection: Detection | null; dragged: boolean } | null>(null);

  const blockAt = (target: EventTarget): TimelineBlock | null => {
    const key = target instanceof Element ? target.closest("[data-block]")?.getAttribute("data-block") : null;
    return (key && byKey.get(key)) || null;
  };
  const xOf = (event: BarEvent) => event.clientX - event.currentTarget.getBoundingClientRect().left;
  const moveClock = (event: BarEvent) => useApp.getState().setClock(Math.round(scale.time(xOf(event))));

  return {
    hover,
    handlers: {
      onPointerDown: (event: BarEvent) => {
        // Presses on the lane names in the gutter are not on the timeline.
        if (event.button !== 0 || xOf(event) < scale.left - 4) return;
        const detection = blockAt(event.target)?.detection ?? null;
        press.current = { x: event.clientX, detection, dragged: false };
        event.currentTarget.setPointerCapture(event.pointerId);
        setHover(null);
        if (!detection) moveClock(event);
      },
      onPointerMove: (event: BarEvent) => {
        const pressed = press.current;
        if (!pressed) {
          const block = blockAt(event.target);
          setHover(block ? { block, x: xOf(event) } : null);
          return;
        }
        if (!pressed.dragged && Math.abs(event.clientX - pressed.x) < DRAG_START) return;
        pressed.dragged = true;
        moveClock(event);
      },
      onPointerUp: () => {
        const pressed = press.current;
        press.current = null;
        if (pressed && !pressed.dragged && pressed.detection) useApp.getState().select(pressed.detection);
      },
      onPointerCancel: () => {
        press.current = null;
      },
      onPointerLeave: () => setHover(null),
    },
  };
}
