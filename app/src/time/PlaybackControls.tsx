import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import type { ReactNode } from "react";
import { useApp } from "../state/store";
import { neighborDetection, stepDetection, togglePlay } from "./actions";

/** The play and pause button, with a button on each side to jump to the previous or next detection. */
export function PlaybackControls() {
  const playing = useApp((s) => s.playing);
  // Each selector returns true or false, so the clock ticking does not redraw the buttons.
  const hasPrevious = useApp((s) => s.day !== null && neighborDetection(s.day, s.clock, s.selectedId, -1) !== null);
  const hasNext = useApp((s) => s.day !== null && neighborDetection(s.day, s.clock, s.selectedId, 1) !== null);

  return (
    <div className="flex items-center gap-2">
      <StepButton label="Previous detection" disabled={!hasPrevious} onClick={() => stepDetection(-1)}>
        <SkipBack size={16} />
      </StepButton>
      <button
        onClick={togglePlay}
        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-accent font-semibold text-white transition-colors hover:bg-accent/85"
      >
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        {playing ? "Pause" : "Play"}
      </button>
      <StepButton label="Next detection" disabled={!hasNext} onClick={() => stepDetection(1)}>
        <SkipForward size={16} />
      </StepButton>
    </div>
  );
}

function StepButton({ label, disabled, onClick, children }: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-10 w-12 items-center justify-center rounded-lg bg-panel-raised text-ink transition-colors hover:bg-line disabled:text-faint disabled:hover:bg-panel-raised"
    >
      {children}
    </button>
  );
}
