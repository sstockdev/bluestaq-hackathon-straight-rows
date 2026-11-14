import { useEffect } from "react";
import type { Cause, Day } from "../data/types";
import { useApp } from "../state/store";

/** How much of each detection one clip plays, in simulated seconds. */
const CLIP_S = 600;
/** The speed the opening plays at. A clip of ten minutes takes ten real seconds. */
const INTRO_SPEED = 60;

/** One stretch of the day the opening plays: a cause, and the moments it runs between. */
export interface Clip {
  cause: Cause;
  start: number;
  end: number;
}

/**
 * The clips the opening loops through: the last ten minutes of the first
 * detection of each cause, in the order they happen that day. The end of a
 * detection is where the map shows the most: a spoofed tractor is furthest
 * off its line, and an interference report has had time to arrive.
 */
export function introClips(day: Day): Clip[] {
  const seen = new Set<Cause>();
  const clips: Clip[] = [];
  for (const detection of day.detections) {
    if (seen.has(detection.cls)) continue;
    seen.add(detection.cls);
    clips.push({ cause: detection.cls, start: Math.max(detection.start, detection.end - CLIP_S), end: detection.end });
  }
  return clips;
}

/**
 * Start the opening: close everything, load the evaluation day, and play its
 * clips. It does nothing if the presenter leaves presentation mode or starts
 * the tour while the day is loading.
 */
export async function startIntro(): Promise<void> {
  const app = useApp.getState();
  app.openPanel(null);
  app.select(null);
  const evaluation = app.index?.days.find((day) => day.kind === "eval");
  if (evaluation && app.day?.date !== evaluation.date) await app.setDay(evaluation.date);
  const now = useApp.getState();
  if (now.present && now.tourStep === null) now.setIntroClip(0);
}

/** Stop the opening and pause the clock. Does nothing when the opening is not playing. */
export function endIntro(): void {
  const app = useApp.getState();
  if (app.introClip === null) return;
  app.setIntroClip(null);
  app.setPlaying(false);
}

/**
 * Plays the opening while the store's `introClip` is set: moves the clock to
 * the clip's start, plays it, and goes to the next clip when the clock reaches
 * its end. After the last clip it starts again at the first.
 */
export function useIntro(): void {
  const clip = useApp((s) => s.introClip);
  const day = useApp((s) => s.day);

  useEffect(() => {
    if (clip === null || !day) return;
    const clips = introClips(day);
    const current = clips[clip];
    if (!current) return;
    const app = useApp.getState();
    app.setClock(current.start);
    app.setSpeed(INTRO_SPEED);
    app.setPlaying(true);
    // Changing the store from inside this listener calls the listener again, so it must move on only once.
    let moved = false;
    return useApp.subscribe((state) => {
      if (moved || state.clock < current.end) return;
      const next = (clip + 1) % clips.length;
      if (next === clip) {
        // With one clip there is no next one to move to, so play the same one again.
        state.setClock(current.start);
        return;
      }
      moved = true;
      state.setIntroClip(next);
    });
  }, [clip, day]);
}
