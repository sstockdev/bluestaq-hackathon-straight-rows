import clsx from "clsx";
import { SPEEDS, useApp } from "../state/store";
import { speedName } from "./format";

/** Choose how much field time passes in each real second of playback. */
export function SpeedPicker() {
  const speed = useApp((s) => s.speed);
  const setSpeed = useApp((s) => s.setSpeed);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">Speed</span>
      <div role="radiogroup" aria-label="Playback speed" className="flex gap-1 rounded-lg bg-panel-raised p-1">
        {SPEEDS.map((option) => (
          <button
            key={option}
            role="radio"
            aria-checked={option === speed}
            aria-label={speedName(option).long}
            title={speedName(option).long}
            onClick={() => setSpeed(option)}
            className={clsx(
              "whitespace-nowrap rounded-md px-2 py-1 text-xs transition-colors",
              option === speed ? "bg-accent font-semibold text-white" : "text-muted hover:text-ink",
            )}
          >
            {speedName(option).short}
          </button>
        ))}
      </div>
    </div>
  );
}
