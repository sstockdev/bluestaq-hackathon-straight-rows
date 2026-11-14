import type { Cause } from "../data/types";
import { CAUSES } from "../lib/causes";

/** A colored pill with the cause's name. */
export function CauseBadge({ cause }: { cause: Cause }) {
  const { name, color } = CAUSES[cause];
  return (
    <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-page" style={{ background: color }}>
      {name}
    </span>
  );
}

/** A small colored dot, used beside a cause or tractor name. */
export function Dot({ color }: { color: string }) {
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />;
}
