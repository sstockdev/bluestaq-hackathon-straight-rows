/** The mapping between times and x positions in the time bar, and the hour ticks that go with it. */

export interface Scale {
  /** The visible stretch of the day, in epoch seconds. */
  start: number;
  end: number;
  /** The x positions of the plot's left and right edges, in pixels. */
  left: number;
  right: number;
  /** The x position of a time. Times outside the visible stretch land outside the plot. */
  x: (time: number) => number;
  /** The time at an x position, held inside the visible stretch. */
  time: (x: number) => number;
}

/** Build the scale that spreads a time range across the plot between `left` and `right`. */
export function makeScale([start, end]: [number, number], left: number, right: number): Scale {
  const perSecond = Math.max(1, right - left) / Math.max(1, end - start);
  return {
    start,
    end,
    left,
    right,
    x: (time) => left + (time - start) * perSecond,
    time: (x) => Math.min(end, Math.max(start, start + (x - left) / perSecond)),
  };
}

/** Where a stretch of time sits in the plot, cut off at the plot's edges, or null when it is out of view. */
export function span(scale: Scale, start: number, end: number, minWidth = 0): { x: number; width: number } | null {
  if (end < scale.start || start > scale.end) return null;
  const x = Math.max(scale.left, scale.x(start));
  const right = Math.min(scale.right, scale.x(end));
  return { x, width: Math.max(minWidth, right - x) };
}

/** Tick spacings to choose from, in seconds: 5 minutes up to 6 hours. */
const TICK_STEPS = [300, 900, 1800, 3600, 7200, 10800, 21600];

/** The times to label along the axis: the finest round spacing that leaves `minGap` pixels between labels. */
export function tickTimes(scale: Scale, midnight: number, minGap = 58): number[] {
  const perSecond = (scale.right - scale.left) / Math.max(1, scale.end - scale.start);
  const step = TICK_STEPS.find((s) => s * perSecond >= minGap) ?? TICK_STEPS[TICK_STEPS.length - 1];
  const times: number[] = [];
  const first = midnight + Math.ceil((scale.start - midnight) / step) * step;
  for (let time = first; time <= scale.end; time += step) times.push(time);
  return times;
}
