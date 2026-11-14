/** Formatting for UTC times. Every time in the app is UTC epoch seconds. */

const pad = (n: number) => String(n).padStart(2, "0");

/** "14:05" or "14:05:09" */
export function clock(epoch: number, seconds = false): string {
  const d = new Date(epoch * 1000);
  const hm = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  return seconds ? `${hm}:${pad(d.getUTCSeconds())}` : hm;
}

/** "May 6" */
export function dayLabel(epoch: number): string {
  return new Date(epoch * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
}

/** "17 s", "42 min", or "5 h" and "2 h 30 min" */
export function duration(seconds: number): string {
  if (seconds < 300) return `${Math.round(seconds)} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 120) return `${minutes} min`;
  const rest = minutes % 60;
  return rest ? `${Math.floor(minutes / 60)} h ${rest} min` : `${minutes / 60} h`;
}

export const DAY_SECONDS = 86400;
