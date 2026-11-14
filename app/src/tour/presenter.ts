/**
 * The link between the app window and the presenter's notes window. Both are
 * on the same site, so they talk over a BroadcastChannel: the app says which
 * stop the tour is on, and the notes window can ask it to move.
 */

/** What the app tells the notes window. */
export interface TourState {
  type: "state";
  /** The current stop, or null while the tour is off. */
  step: number | null;
  /** When the tour started, in epoch milliseconds. */
  startedAt: number | null;
}

export type TourMessage =
  | TourState
  /** A notes window has opened and wants the current state. */
  | { type: "hello" }
  /** The notes window asks for a stop, or null to end the tour. */
  | { type: "go"; step: number | null };

/** Open the shared channel. Close it when done. */
export function openTourChannel(): BroadcastChannel {
  return new BroadcastChannel("straight-rows-tour");
}
