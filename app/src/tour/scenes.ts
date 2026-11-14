import { useApp } from "../state/store";
import { showDetection } from "./showDetection";

/** One stop of the guided tour. */
export interface Scene {
  title: string;
  /** One sentence, shown under the title. */
  caption: string;
  /** Shell commands shown under the caption, one per line. */
  commands?: string[];
  /**
   * Sets the store up for this stop. `stillHere` returns false once the presenter
   * has moved to another stop, so a stop that waits for a day to load can give up.
   */
  apply: (stillHere: () => boolean) => void | Promise<void>;
}

/** Open one of the left panels with no detection selected. */
function showPanel(panel: "why" | "limits") {
  const app = useApp.getState();
  app.select(null);
  app.openPanel(panel);
}

/** The four stops of the five-minute demo, in order. */
export const SCENES: Scene[] = [
  {
    title: "A clear case",
    caption: "All three machines lost signal under a quiet sky, and an interference report followed.",
    apply: async (stillHere) => {
      useApp.getState().openPanel(null);
      await showDetection("2026-05-06", (detection) => detection.id === "d0506-0212-JAMMING-T1T2T3", stillHere);
    },
  },
  {
    title: "An ambiguous case",
    caption: "A jammer inside a storm: every machine lost the same amount, and S4 explains only part of it.",
    apply: async (stillHere) => {
      useApp.getState().openPanel(null);
      await showDetection("2026-05-05", (detection) => detection.label === "TRN-05", stillHere);
    },
  },
  {
    title: "Limits",
    caption: "Three thresholds are fragile, and each limit names the data that would fix it.",
    apply: () => showPanel("limits"),
  },
  {
    title: "Reproduce it",
    caption: "Change a threshold in straightrows/config.py, run these, and reload.",
    commands: ["python make_submission.py", "python app/tools/export_data.py"],
    apply: () => showPanel("why"),
  },
];
