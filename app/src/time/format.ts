/** Text for the time controls: clock times within a day and the names of the playback speeds. */
import { clock, DAY_SECONDS, duration } from "../lib/time";

/** A UTC clock time within a day. The end of the day reads "24:00" instead of "00:00". */
export function dayClock(epoch: number, midnight: number, seconds = false): string {
  if (epoch - midnight >= DAY_SECONDS) return seconds ? "24:00:00" : "24:00";
  return clock(epoch, seconds);
}

/** "20:00 to 20:36, 36 min". Short stretches show seconds, and a single moment shows one time. */
export function stretchLabel(start: number, end: number, midnight: number): string {
  const seconds = end - start < 300;
  if (end <= start) return `At ${dayClock(start, midnight)}`;
  return `${dayClock(start, midnight, seconds)} to ${dayClock(end, midnight, seconds)}, ${duration(end - start)}`;
}

/**
 * A playback speed as a multiple of real time, the way a video player writes
 * it, and in words for the hover: how long a full day takes to play.
 */
export function speedName(speed: number): { short: string; long: string } {
  const seconds = DAY_SECONDS / speed;
  const takes = seconds < 120 ? `${Math.round(seconds)} s` : duration(Math.round(seconds / 60) * 60);
  if (speed === 1) return { short: "1x", long: `Real time. A full day takes ${takes}.` };
  return { short: `${speed}x`, long: `${speed} times real time. A full day plays in ${takes}.` };
}
