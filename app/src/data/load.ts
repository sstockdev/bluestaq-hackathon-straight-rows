import type { Day, Episode, Index } from "./types";

/** Fetch a JSON file from public/data/, once. Later calls reuse the first result. */
const cache = new Map<string, Promise<unknown>>();

function load<T>(file: string): Promise<T> {
  if (!cache.has(file)) {
    const request = fetch(`${import.meta.env.BASE_URL}data/${file}`).then((response) => {
      if (!response.ok) {
        throw new Error(`${file} is missing. Run: python app/tools/export_data.py`);
      }
      return response.json();
    });
    cache.set(file, request);
  }
  return cache.get(file) as Promise<T>;
}

export const loadIndex = () => load<Index>("index.json");
export const loadDay = (date: string) => load<Day>(`day-${date}.json`);
export const loadEpisode = (id: string) => load<Episode>(`episode-${id}.json`);
