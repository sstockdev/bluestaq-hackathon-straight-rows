import { ChevronDown } from "lucide-react";
import type { Limit } from "../../data/limits";

/** One limit. Closed it shows its title; open it shows what goes wrong, when, and what data would fix it. */
export function LimitCard({ limit }: { limit: Limit }) {
  return (
    <li className="rounded-lg border border-line">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-3 py-2.5 text-[14px] font-medium leading-snug">
          {limit.title}
          <ChevronDown size={16} aria-hidden className="mt-0.5 shrink-0 text-muted group-open:rotate-180" />
        </summary>
        <dl className="grid grid-cols-[76px_1fr] gap-x-3 gap-y-1.5 px-3 pb-3 text-[13px] leading-snug">
          <dt className="font-semibold text-amber-300">Goes wrong</dt>
          <dd className="text-ink">{limit.wrong}</dd>
          <dt className="font-semibold text-faint">When</dt>
          <dd className="text-muted">{limit.when}</dd>
          <dt className="font-semibold text-faint">Data to fix</dt>
          <dd className="text-muted">{limit.fix}</dd>
        </dl>
      </details>
    </li>
  );
}
