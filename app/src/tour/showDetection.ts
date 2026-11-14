import type { Detection } from "../data/types";
import { useApp } from "../state/store";

/**
 * Load a day, switch to the field view, and select the first detection that matches.
 * Resolves to false when no detection matches, or when `stillWanted` says the caller
 * moved on while the day was loading. The tour and the Why panel both use this.
 */
export async function showDetection(
  date: string,
  matches: (detection: Detection) => boolean,
  stillWanted: () => boolean = () => true,
): Promise<boolean> {
  const app = useApp.getState();
  await app.setDay(date);
  if (!stillWanted()) return false;
  const detection = useApp.getState().day?.detections.find(matches);
  if (!detection) return false;
  app.setView("field");
  app.select(detection);
  return true;
}
