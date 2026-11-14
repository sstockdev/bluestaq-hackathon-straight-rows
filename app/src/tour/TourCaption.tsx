import clsx from "clsx";
import { ChevronLeft, ChevronRight, NotebookText, X } from "lucide-react";
import { useApp } from "../state/store";
import { Panel } from "../ui/Panel";
import { endTour, goToStop, openNotes } from "./control";
import { SCENES } from "./scenes";

const BUTTON = "flex h-8 items-center gap-1 rounded-md px-2.5 text-[13px] font-medium transition-colors disabled:opacity-35";

/** The card for the current tour stop, at the bottom center above the time bar. Renders nothing when the tour is off. */
export default function TourCaption() {
  const step = useApp((s) => s.tourStep);
  const scene = step === null ? undefined : SCENES[step];
  if (step === null || !scene) return null;

  return (
    <div className="pointer-events-none absolute bottom-[256px] left-[calc(50%+40px)] z-20 w-[540px] max-w-[calc(100%-24px)] -translate-x-1/2">
      <Panel className="px-4 py-3">
        <div className="flex items-center gap-3" role="status" aria-live="polite">
          <span className="tabular text-xs text-muted">
            {step + 1} of {SCENES.length}
          </span>
          <span className="flex gap-1" aria-hidden>
            {SCENES.map((stop, i) => (
              <span key={stop.title} className={clsx("h-1.5 w-5 rounded-full", i === step ? "bg-accent" : "bg-line")} />
            ))}
          </span>
          <button onClick={openNotes} title="Open the speaker notes in their own window (N)" className="ml-auto flex items-center gap-1 text-xs text-muted hover:text-ink">
            <NotebookText size={14} aria-hidden />
            Notes
          </button>
          <button onClick={endTour} title="End the tour (Esc)" aria-label="End the tour" className="text-muted hover:text-ink">
            <X size={16} />
          </button>
        </div>

        <h2 className="mt-1.5 font-condensed text-[22px] font-semibold leading-tight">{scene.title}</h2>
        <p className="mt-1 text-[14px] leading-snug text-muted">{scene.caption}</p>
        {scene.commands && (
          <pre className="mt-2 rounded-md bg-page px-3 py-2 font-mono text-xs leading-relaxed text-ink">{scene.commands.join("\n")}</pre>
        )}

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => goToStop(step - 1)}
            disabled={step === 0}
            className={clsx(BUTTON, "ml-auto border border-line text-ink hover:bg-panel-raised")}
          >
            <ChevronLeft size={15} aria-hidden />
            Previous
          </button>
          <button
            onClick={() => goToStop(step + 1)}
            disabled={step === SCENES.length - 1}
            className={clsx(BUTTON, "bg-accent text-white hover:bg-accent/85")}
          >
            Next
            <ChevronRight size={15} aria-hidden />
          </button>
        </div>
      </Panel>
    </div>
  );
}
