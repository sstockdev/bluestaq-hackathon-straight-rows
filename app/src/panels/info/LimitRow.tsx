import { Check, ChevronDown } from "lucide-react";
import type { Limit } from "../../data/limits";

/**
 * One limit: what was accepted, and under it why that was acceptable. Clicking
 * it, or Enter on the keyboard, opens what goes wrong and what data would fix it.
 */
export function LimitRow({ limit }: { limit: Limit }) {
  return (
    <li>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-start gap-3 px-3 py-2.5 transition-colors hover:bg-panel-raised/60 [&::-webkit-details-marker]:hidden">
          <span className="flex-1">
            <span className="block text-[13.5px] font-medium leading-snug">{limit.accepted}</span>
            <span className="mt-1 flex items-start gap-1.5 text-xs leading-snug text-muted">
              <Check size={13} strokeWidth={2.5} aria-hidden className="mt-px shrink-0 text-emerald-400" />
              {limit.ok}
            </span>
          </span>
          <ChevronDown size={15} aria-hidden className="mt-0.5 shrink-0 text-faint group-open:rotate-180" />
        </summary>
        <p className="m-0 border-t border-line bg-panel-raised/40 px-3 py-2.5 text-xs leading-snug text-muted">{limit.detail}</p>
      </details>
    </li>
  );
}
