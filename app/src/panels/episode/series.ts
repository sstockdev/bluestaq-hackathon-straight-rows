import type { Episode, EpisodeSeries } from "../../data/types";
import { TRACTORS } from "../../lib/causes";

/** One point on a chart: a time in epoch seconds and a value per line. A missing value is null. */
export type ChartRow = { t: number } & Record<string, number | null>;

/** How many points a chart draws. The plot is about 340 px wide, so more would not show. */
const MAX_POINTS = 280;

type Samples = (number | null)[];

function mean(values: Samples, from: number, to: number): number | null {
  let sum = 0;
  let count = 0;
  for (let i = from; i < to; i++) {
    const value = values[i];
    if (value != null) {
      sum += value;
      count += 1;
    }
  }
  return count ? sum / count : null;
}

/**
 * Chart rows for one measurement: a column per tractor (T1, T2, T3) plus any
 * `extra` columns. Samples are averaged into at most `maxPoints` buckets, and
 * every value is multiplied by `scale` (100 turns a share into a percent).
 */
export function tractorRows(
  episode: Episode,
  key: keyof EpisodeSeries,
  { extra = {}, scale = 1, maxPoints = MAX_POINTS }: { extra?: Record<string, Samples>; scale?: number; maxPoints?: number } = {},
): ChartRow[] {
  const size = Math.ceil(episode.n / maxPoints);
  const rows: ChartRow[] = [];
  for (let from = 0; from < episode.n; from += size) {
    const to = Math.min(from + size, episode.n);
    const row: ChartRow = { t: Math.round(episode.t0 + ((from + to - 1) / 2) * episode.step) };
    const put = (name: string, values: Samples) => {
      const value = mean(values, from, to);
      row[name] = value === null ? null : value * scale;
    };
    for (const id of TRACTORS) put(id, episode.series[id][key]);
    for (const [name, values] of Object.entries(extra)) put(name, values);
    rows.push(row);
  }
  return rows;
}

/** The median of a series between the detection's start and end, or null when it has no samples there. */
export function medianInSpan(episode: Episode, values: Samples): number | null {
  const first = Math.max(0, Math.ceil((episode.start - episode.t0) / episode.step));
  const last = Math.min(episode.n - 1, Math.floor((episode.end - episode.t0) / episode.step));
  const inside = values.slice(first, last + 1).filter((value): value is number => value != null);
  if (inside.length === 0) return null;
  inside.sort((a, b) => a - b);
  const middle = Math.floor(inside.length / 2);
  return inside.length % 2 ? inside[middle] : (inside[middle - 1] + inside[middle]) / 2;
}

/** The smallest and largest value in the named columns. */
export function valueRange(rows: ChartRow[], keys: string[]): [number, number] {
  let low = Infinity;
  let high = -Infinity;
  for (const row of rows) {
    for (const key of keys) {
      const value = row[key];
      if (value != null) {
        low = Math.min(low, value);
        high = Math.max(high, value);
      }
    }
  }
  return [low, high];
}

/**
 * A y axis that covers low to high: at most six round ticks, the lowest at or
 * above `low`. The axis runs from `low` to the top tick.
 */
export function axis(low: number, high: number): { domain: [number, number]; ticks: number[] } {
  const step = [0.5, 1, 2, 5, 10, 20, 25, 50].find((s) => (high - low) / s <= 5) ?? 100;
  const first = Math.ceil(low / step);
  const last = Math.ceil(high / step);
  const ticks = Array.from({ length: last - first + 1 }, (_, i) => (first + i) * step);
  return { domain: [low, last * step], ticks };
}

/** Round clock times between two moments, at most six of them, for a time axis. */
export function timeTicks(from: number, to: number): number[] {
  const step = [300, 600, 900, 1800, 3600, 7200].find((s) => (to - from) / s <= 6) ?? 14400;
  const ticks: number[] = [];
  for (let t = Math.ceil(from / step) * step; t <= to; t += step) ticks.push(t);
  return ticks;
}
