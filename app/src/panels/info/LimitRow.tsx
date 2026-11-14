import type { Limit } from "../../data/limits";

/** The three columns every limit row shares. LimitsPanel uses the same grid for its header. */
export const LIMIT_COLUMNS = "grid grid-cols-[1.15fr_1.25fr_1fr] gap-x-3";

/**
 * One limit. Closed it is a few words: the case, what goes wrong, and the data
 * that would fix it. Clicking it, or Enter on the keyboard, opens the full text.
 */
export function LimitRow({ limit }: { limit: Limit }) {
  return (
    <li>
      <details>
        <summary
          className={`${LIMIT_COLUMNS} cursor-pointer list-none items-center px-2.5 py-2 text-xs leading-snug transition-colors hover:bg-panel-raised/60 [&::-webkit-details-marker]:hidden`}
        >
          <span className="font-medium">{limit.brief.case}</span>
          <span className="text-amber-300">{limit.brief.wrong}</span>
          <span className="text-muted">{limit.brief.fix}</span>
        </summary>
        <dl className="m-0 grid grid-cols-[76px_1fr] gap-x-3 gap-y-1.5 border-t border-line bg-panel-raised/40 px-2.5 py-2.5 text-xs leading-snug">
          <dt className="font-semibold text-amber-300">Goes wrong</dt>
          <dd className="m-0 text-ink">{limit.wrong}</dd>
          <dt className="font-semibold text-faint">When</dt>
          <dd className="m-0 text-muted">{limit.when}</dd>
          <dt className="font-semibold text-faint">Data to fix</dt>
          <dd className="m-0 text-muted">{limit.fix}</dd>
        </dl>
      </details>
    </li>
  );
}
