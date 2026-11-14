import { create } from "zustand";
import { loadDay, loadIndex } from "../data/load";
import type { Day, Detection, Index } from "../data/types";

/** The floating panels the left rail can open. */
export const PANEL_IDS = ["detections", "how", "why", "limits"] as const;
export type PanelId = (typeof PANEL_IDS)[number];

export interface AppState {
  index: Index | null;
  day: Day | null;
  error: string | null;

  /** The moment the map shows, in UTC epoch seconds. */
  clock: number;
  playing: boolean;
  /** Simulated seconds per real second. */
  speed: number;

  /** The selected detection's id, or null. */
  selectedId: string | null;
  panel: PanelId | null;
  /** The guided tour's current stop, or null when the tour is off. */
  tourStep: number | null;
  /**
   * Presentation mode, for a projector. The browser is zoomed in until the text
   * can be read from the back of a room, which leaves a small window. So this
   * mode drops the rail, the title, the time bar, and the cursor readout, and
   * refits the map around whatever is open.
   */
  present: boolean;

  start: () => Promise<void>;
  setDay: (date: string, clock?: number) => Promise<void>;
  setClock: (clock: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  /** Select a detection, move the clock to its start, and pause. Pass null to clear. */
  select: (detection: Detection | null) => void;
  openPanel: (panel: PanelId | null) => void;
  setTourStep: (step: number | null) => void;
  setPresent: (present: boolean) => void;
}

export const SPEEDS = [1, 10, 60, 300, 900];

export const useApp = create<AppState>((set, get) => ({
  index: null,
  day: null,
  error: null,
  clock: 0,
  playing: false,
  speed: 60,
  selectedId: null,
  panel: "detections",
  tourStep: null,
  present: false,

  start: async () => {
    try {
      const index = await loadIndex();
      set({ index });
      // The URL can name a day, a moment, a detection, and a panel (see useUrlSync).
      // Without one, open on the evaluation day, which is what was submitted.
      const params = new URLSearchParams(window.location.search);
      const wanted = index.days.find((d) => d.date === params.get("day"));
      const first = wanted ?? index.days.find((d) => d.kind === "eval") ?? index.days[0];
      const seconds = Number(params.get("t"));
      const asked = wanted && params.has("t") && Number.isFinite(seconds);
      await get().setDay(first.date, asked ? first.t0 + seconds : undefined);
      const selected = get().day?.detections.find((d) => d.id === params.get("sel"));
      if (selected) set({ selectedId: selected.id });
      const panel = PANEL_IDS.find((id) => id === params.get("panel"));
      if (panel) set({ panel });
      if (params.has("present")) set({ present: true });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  setDay: async (date, clock) => {
    try {
      const day = await loadDay(date);
      // Start a few minutes before the day's first detection, where something is about to happen.
      const firstStart = day.detections[0]?.start ?? day.working[0]?.[0] ?? day.t0;
      const end = day.t0 + day.n * day.step - 1;
      set({
        day,
        clock: Math.min(Math.max(clock ?? firstStart - 300, day.t0), end),
        selectedId: null,
        playing: false,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  setClock: (clock) => {
    const day = get().day;
    if (!day) return;
    const end = day.t0 + day.n * day.step - 1;
    set({ clock: Math.min(Math.max(clock, day.t0), end) });
  },
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
  select: (detection) =>
    set(detection ? { selectedId: detection.id, clock: detection.start, playing: false } : { selectedId: null }),
  openPanel: (panel) => set({ panel }),
  setTourStep: (tourStep) => set({ tourStep }),
  setPresent: (present) => set({ present }),
}));

/** The selected detection object, or null. */
export function useSelected(): Detection | null {
  return useApp((state) => state.day?.detections.find((d) => d.id === state.selectedId) ?? null);
}

/** A day's first and last moment, [start, end] in epoch seconds. */
export function dayRange(day: Day): [number, number] {
  return [day.t0, day.t0 + day.n * day.step];
}

/** The sample index in a day's tracks for a moment in time. */
export function sampleIndex(day: Day, clock: number): number {
  return Math.min(day.n - 1, Math.max(0, Math.floor((clock - day.t0) / day.step)));
}
