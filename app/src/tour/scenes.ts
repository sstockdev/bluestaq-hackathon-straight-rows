import { useApp } from "../state/store";
import { showDetection } from "./showDetection";

/** One stop of the guided tour. */
export interface Scene {
  title: string;
  /** One or two sentences, shown under the title. */
  caption: string;
  /** Shell commands shown under the caption, one per line. */
  commands?: string[];
  /** True when the stop selects a detection, so the caption card shows its cause and confidence. */
  showsDetection?: boolean;
  /**
   * Sets the store up for this stop. `stillHere` returns false once the presenter
   * has moved to another stop, so a stop that waits for a day to load can give up.
   */
  apply: (stillHere: () => boolean) => void | Promise<void>;
}

/** The six stops of the five-minute demo, in order. */
export const SCENES: Scene[] = [
  {
    title: "The problem",
    caption: "Three tractors plant a field near Casselton by GPS. When guidance degrades, the cause decides what the operator should do.",
    apply: () => {
      const app = useApp.getState();
      app.setPlaying(false);
      app.openPanel(null);
      app.select(null);
      app.setView("globe");
    },
  },
  {
    title: "A clear case",
    caption:
      "On the evaluation day the signal fell on all three machines while the sky was quiet. An interference report arrived near the farm soon after.",
    showsDetection: true,
    apply: async (stillHere) => {
      useApp.getState().openPanel(null);
      await showDetection("2026-05-06", (detection) => detection.id === "d0506-0212-JAMMING-T1T2T3", stillHere);
    },
  },
  {
    title: "An ambiguous case",
    caption:
      "A jammer inside a storm, on a dev day. The loss is equal on every machine, and S4 explains only part of it, so the confidence is low.",
    showsDetection: true,
    apply: async (stillHere) => {
      useApp.getState().openPanel(null);
      await showDetection("2026-05-05", (detection) => detection.label === "TRN-05", stillHere);
    },
  },
  {
    title: "Against the baseline",
    caption: "The organizers' scorer, run on the 12 labeled dev episodes for the starter baseline and for this detector.",
    apply: () => useApp.getState().openPanel("score"),
  },
  {
    title: "Limits",
    caption: "Three thresholds are fragile, and some cases have no dev episode behind them. Each limit names the data that would fix it.",
    apply: () => useApp.getState().openPanel("limits"),
  },
  {
    title: "Reproduce it",
    caption: "Change a threshold in straightrows/config.py, run these two commands, and reload this page.",
    commands: ["python make_submission.py", "python app/tools/export_data.py"],
    apply: () => useApp.getState().openPanel("why"),
  },
];
