import { create } from "zustand";
import { loadDay, loadIndex } from "../data/load";
import type { Day, Detection, Index } from "../data/types";

/** The floating panels the left rail can open. */
export type PanelId = "time" | "layers" | "detections" | "sky" | "why" | "score" | "limits";

/** The map layers that can be switched on and off. */
export type LayerId = "rows" | "hexes" | "spoofing" | "reports" | "multipath" | "labels" | "baseline";

/** Where the camera should be. The map flies there when this changes. */
export type View = "globe" | "field";

export interface AppState {
  index: Index | null;
  day: Day | null;
  error: string | null;

  /** The moment the map shows, in UTC epoch seconds. */
  clock: number;
  playing: boolean;
  /** Simulated seconds per real second. */
  speed: number;
  /** The stretch of the day the time bar zooms to and the hexagon layer stays inside, [start, end] in epoch seconds. */
  range: [number, number];

  /** The selected detection's id, or null. */
  selectedId: string | null;
  panel: PanelId | null;
  layers: Record<LayerId, boolean>;
  view: View;
  /** The guided tour's current stop, or null when the tour is off. */
  tourStep: number | null;

  start: () => Promise<void>;
  setDay: (date: string, clock?: number) => Promise<void>;
  setClock: (clock: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  setRange: (range: [number, number]) => void;
  /** Select a detection, move the clock to its start, and pause. Pass null to clear. */
  select: (detection: Detection | null) => void;
  openPanel: (panel: PanelId | null) => void;
  toggleLayer: (layer: LayerId) => void;
  setView: (view: View) => void;
  setTourStep: (step: number | null) => void;
}

export const SPEEDS = [1, 10, 60, 300, 900];

export const useApp = create<AppState>((set, get) => ({
  index: null,
  day: null,
  error: null,
  clock: 0,
  playing: false,
  speed: 60,
  range: [0, 0],
  selectedId: null,
  panel: "time",
  layers: { rows: true, hexes: false, spoofing: true, reports: true, multipath: true, labels: false, baseline: false },
  view: "field",
  tourStep: null,

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
      await get().setDay(first.date, wanted && params.has("t") ? first.t0 + seconds : undefined);
      const selected = get().day?.detections.find((d) => d.id === params.get("sel"));
      if (selected) set({ selectedId: selected.id });
      if (params.has("panel")) set({ panel: params.get("panel") as PanelId });
      if (params.has("layers")) {
        const on = (params.get("layers") ?? "").split(",");
        const layers = { ...get().layers };
        for (const id of Object.keys(layers) as LayerId[]) layers[id] = on.includes(id);
        set({ layers });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  setDay: async (date, clock) => {
    try {
      const day = await loadDay(date);
      // Start a few minutes before the day's first detection, where something is about to happen.
      const firstStart = day.detections[0]?.start ?? day.working[0]?.[0] ?? day.t0;
      set({
        day,
        clock: clock ?? Math.max(day.t0, firstStart - 300),
        range: [day.t0, day.t0 + day.n * day.step],
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
  setRange: (range) => set({ range }),
  select: (detection) =>
    set(detection ? { selectedId: detection.id, clock: detection.start, playing: false } : { selectedId: null }),
  openPanel: (panel) => set({ panel }),
  toggleLayer: (layer) => set((state) => ({ layers: { ...state.layers, [layer]: !state.layers[layer] } })),
  setView: (view) => set({ view }),
  setTourStep: (tourStep) => set({ tourStep }),
}));

/** The selected detection object, or null. */
export function useSelected(): Detection | null {
  return useApp((state) => state.day?.detections.find((d) => d.id === state.selectedId) ?? null);
}

/** The sample index in a day's tracks for a moment in time. */
export function sampleIndex(day: Day, clock: number): number {
  return Math.min(day.n - 1, Math.max(0, Math.floor((clock - day.t0) / day.step)));
}
