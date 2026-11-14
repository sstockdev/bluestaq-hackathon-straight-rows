import { useApp } from "../state/store";
import { WANTED_ID } from "../panels/LimitsPanel";
import { showDetection } from "./showDetection";

/** One stop of the guided tour. */
export interface Scene {
  title: string;
  /** One sentence, shown under the title. */
  caption: string;
  /** Shell commands shown under the caption, one per line. */
  commands?: string[];
  /** How long to spend on this stop, in seconds. The stops add up to the five-minute demo. */
  seconds: number;
  /** What to point at or click on screen. Shown only in the presenter's notes window. */
  cue: string;
  /** What to say, one line per thought. Shown only in the presenter's notes window. */
  notes: string[];
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

/** The jammer inside a storm on May 5, which two stops use. */
const showAmbiguous = (stillHere: () => boolean) =>
  showDetection("2026-05-05", (detection) => detection.label === "TRN-05", stillHere);

/** How long to wait for the Limits panel to be on screen before scrolling inside it, in milliseconds. */
const PANEL_SETTLE_MS = 120;

/**
 * The seven stops of the five-minute demo, in order: the result, an episode
 * with its evidence, an ambiguous case, how the detector decided it, the
 * limits, how the code reproduces the submission, and the data that would help.
 */
export const SCENES: Scene[] = [
  {
    title: "The result",
    caption: "40.00 of 40 on dev, against 20.15 for the starter baseline. The thresholds were set on these same episodes.",
    seconds: 30,
    cue: "The Why panel is open. Point at the two scores.",
    notes: [
      "Three tractors plant a field under GPS guidance. My job is to find each time that guidance degraded, say what caused it, and say what to do.",
      "On the two labeled days the starter baseline scores 20.15 out of 40. Mine scores 40.",
      "I set every threshold on those same 12 episodes, so that score is expected. It is not a claim about new data.",
      "Here is one detection from the evaluation day.",
    ],
    apply: () => showPanel("why"),
  },
  {
    title: "A clear case",
    caption: "All three machines lost signal under a quiet sky, and an interference report followed.",
    seconds: 65,
    cue: "Point at the action, the three chips, then the bars. Click Details for the evidence.",
    notes: [
      "This is May 6 at 02:12. All three tractors are flagged for jamming, for 42 minutes.",
      "The action is the headline: halt and report.",
      "Confidence is 0.95. It starts at 0.60, and three things raise it: the loss differs by tractor, an interference report arrived near the farm, and the sky is quiet.",
      "The bars are the signal each tractor lost: 12, 8, and 10 dB. The sky explains none of it.",
      "Under Details are the four evidence sentences as submitted, and the steps the detector took.",
    ],
    apply: async (stillHere) => {
      useApp.getState().openPanel(null);
      await showDetection("2026-05-06", (detection) => detection.id === "d0506-0212-JAMMING-T1T2T3", stillHere);
    },
  },
  {
    title: "An ambiguous case",
    caption: "A jammer inside a storm: every machine lost the same amount, and S4 explains only part of it.",
    seconds: 55,
    cue: "Point at the 10 + 12 on the bars, then the 0.50.",
    notes: [
      "This is a dev day, so there is a label to check against: TRN-05.",
      "A storm is already under way, and a jammer turns on inside it.",
      "Every tractor loses the same 22 dB. The sky explains 10 of it. The other 12 has no sky cause, so it is reported as jamming.",
      "Equal loss during a storm could also be scintillation stronger than S4 shows. So the confidence drops to 0.50, and the evidence says so.",
      "Either reading halts the machines.",
    ],
    apply: async (stillHere) => {
      useApp.getState().openPanel(null);
      await showAmbiguous(stillHere);
    },
  },
  {
    title: "How it decided",
    caption: "Flag each second, join the seconds into events, check each event, then score the confidence.",
    seconds: 40,
    cue: "The How panel follows the same detection. Scroll from box 4 down to box 6.",
    notes: [
      "This panel is the detector as a flowchart, following the detection I just showed.",
      "Every second gets a yes or no: does any tractor have 6 dB or more of loss the sky does not explain?",
      "Seconds are joined into events. Gaps of up to two minutes are bridged, and anything under three minutes is dropped.",
      "Then the check: two or more tractors at 4.5 dB makes it jamming.",
      "And this is its confidence: 0.60, minus 0.10 for equal loss in a storm.",
    ],
    apply: async (stillHere) => {
      if (await showAmbiguous(stillHere)) useApp.getState().openPanel("how");
    },
  },
  {
    title: "Limits",
    caption: "Six limits were accepted, and each row says why.",
    seconds: 40,
    cue: "Read the first three rows. Open one if a judge asks.",
    notes: [
      "These are the six limits I accepted, and why.",
      "Every threshold comes from 12 episodes on one simulated farm. I moved each one by a quarter, and 17 of 20 moves change nothing.",
      "The sag model comes from one storm day. It still predicted the May 6 storm to within 0.3 dB.",
      "A jammer weaker than 6 dB is missed. The weakest one in dev peaks at 8, so a lower trigger would have been a guess.",
    ],
    apply: () => showPanel("limits"),
  },
  {
    title: "Reproduce it",
    caption: "One command rebuilds the submission, and its checksum matches the submitted file.",
    commands: ["python make_submission.py", "sha256sum submission.json"],
    seconds: 40,
    cue: "Switch to the terminal and run the two commands. The checksum starts 58281673.",
    notes: [
      "Everything comes from one command. It loads the data, runs the five detectors, scores the dev days, writes the submission, and validates it.",
      "It takes about three seconds.",
      "The checksum of the file it writes starts 5828 1673. That is the file I froze before I looked at any evaluation output.",
      "I can change any threshold in config.py and rerun it, if you want to see what moves.",
    ],
    apply: () => showPanel("why"),
  },
  {
    title: "Data that would help",
    caption: "Five kinds of data would fix most of the limits, starting with per-satellite signal strength.",
    seconds: 30,
    cue: "Switch back to the app. The Limits panel has scrolled to the list. Read down it.",
    notes: [
      "If I could ask for more data, this is the order I would ask in.",
      "Per-satellite signal strength first. A jammer has a direction, and a failing antenna has a pattern across satellites. The average and the minimum hide both.",
      "Then more labeled episodes, especially weak jamming. Twelve is what every threshold rests on.",
      "A second storm would test the sag model, which comes from one day.",
      "And an IMU or wheel odometry, because a real receiver cannot see its own spoofed drift.",
      "That is the detector. I am happy to open any of the code.",
    ],
    apply: (stillHere) => {
      showPanel("limits");
      window.setTimeout(() => {
        if (stillHere()) document.getElementById(WANTED_ID)?.scrollIntoView({ block: "start", behavior: "smooth" });
      }, PANEL_SETTLE_MS);
    },
  },
];
