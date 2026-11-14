import clsx from "clsx";
import { SPEEDS, useApp } from "../state/store";
import { speedName } from "./format";

/** Choose how much field time passes in each real second of playback. */
export function SpeedPicker() {
  const speed = useApp((s) => s.speed);
  const setSpeed = useApp((s) => s.setSpeed);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="text-muted">Speed</span>
        <span className="tabular text-ink">{speedName(speed).long}</span>
      </div>
      <div role="radiogroup" aria-label="Playback speed" className="flex gap-1 rounded-lg bg-panel-raised p-1">
        {SPEEDS.map((option) => (
          <button
            key={option}
            role="radio"
            aria-checked={option === speed}
            aria-label={speedName(option).long}
            onClick={() => setSpeed(option)}
            className={clsx(
              "flex-1 whitespace-nowrap rounded-md px-1 py-1 text-xs transition-colors",
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
