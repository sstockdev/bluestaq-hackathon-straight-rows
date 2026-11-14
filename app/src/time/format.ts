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

/** A playback speed in words: how much field time passes in one real second. */
export function speedName(speed: number): { short: string; long: string } {
  if (speed === 1) return { short: "Real time", long: "Real time" };
  const amount = speed < 60 ? `${speed} s` : `${speed / 60} min`;
  return { short: amount, long: `${amount} per second` };
}
