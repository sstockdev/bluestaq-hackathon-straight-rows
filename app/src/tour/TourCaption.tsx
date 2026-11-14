import clsx from "clsx";
import { useApp } from "../state/store";
import { Panel } from "../ui/Panel";
import { SCENES } from "./scenes";

/**
 * The current tour stop's number and name, as one line in a bottom corner. It
 * is shown only in presentation mode, where the audience needs to know where
 * the demo is. The presenter's notes window has everything else. It sits in
 * whichever bottom corner is free, and hides when both sides are taken.
 */
export default function TourCaption() {
  const step = useApp((s) => s.tourStep);
  const present = useApp((s) => s.present);
  const panelOpen = useApp((s) => s.panel !== null);
  const detectionOpen = useApp((s) => s.selectedId !== null);
  const scene = step === null ? undefined : SCENES[step];
  if (step === null || !scene || !present || (panelOpen && detectionOpen)) return null;

  return (
    <div className={clsx("pointer-events-none absolute bottom-3 z-20", panelOpen ? "right-3" : "left-3")} role="status" aria-live="polite">
      <Panel className="flex items-baseline gap-3 px-3.5 py-2">
        <span className="tabular text-xs text-muted">
          {step + 1} of {SCENES.length}
        </span>
        <span className="font-condensed text-xl font-semibold leading-tight">{scene.title}</span>
      </Panel>
    </div>
  );
}
