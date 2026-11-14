import { useEffect, useState } from "react";
import { loadEpisode } from "../../data/load";
import type { Episode } from "../../data/types";

interface Loaded {
  id: string;
  episode: Episode | null;
  failed: boolean;
}

/** The finer series for one detection. `episode` is null while it loads; `failed` is true when its file is missing. */
export function useEpisode(id: string): { episode: Episode | null; failed: boolean } {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let wanted = true;
    loadEpisode(id)
      .then((episode) => wanted && setLoaded({ id, episode, failed: false }))
      .catch(() => wanted && setLoaded({ id, episode: null, failed: true }));
    return () => {
      wanted = false;
    };
  }, [id]);

  // Right after the selection changes, the result on hand still belongs to the previous detection.
  if (loaded?.id !== id) return { episode: null, failed: false };
  return loaded;
}
