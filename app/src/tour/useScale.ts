import { useEffect, useState } from "react";

/**
 * A text size the presenter sets with - and + (0 resets it), remembered under
 * `key`. The browser keeps one zoom level for the whole site, so zooming the
 * app for a projector also zooms the presenter's own windows. This lets each
 * of them be brought back to a readable size.
 *
 * Spread the returned `style` on the window's root element.
 */
export function useScale(key: string): { style: { zoom: number; height: string } } {
  const [scale, setScale] = useState(() => Number(window.localStorage.getItem(key)) || 1);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Typing in a field is not a resize.
      if (event.target instanceof HTMLInputElement) return;
      const factor = event.key === "-" ? 0.9 : event.key === "=" || event.key === "+" ? 1 / 0.9 : event.key === "0" ? 0 : null;
      if (factor === null) return;
      setScale((before) => {
        const next = factor === 0 ? 1 : Math.min(2, Math.max(0.3, before * factor));
        window.localStorage.setItem(key, String(next));
        return next;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key]);

  // With a zoom of z, a height of 100/z percent fills the window exactly.
  return { style: { zoom: scale, height: `${100 / scale}%` } };
}
