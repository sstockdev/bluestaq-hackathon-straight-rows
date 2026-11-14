import type { Limit } from "../../data/limits";

/** One limit: its title, then what goes wrong, when, and what data would fix it. */
export function LimitCard({ limit }: { limit: Limit }) {
  return (
    <li className="rounded-lg border border-line px-3 py-2.5">
      <h4 className="text-[14px] font-medium leading-snug">{limit.title}</h4>
      <dl className="mt-2 grid grid-cols-[76px_1fr] gap-x-3 gap-y-1.5 text-[13px] leading-snug">
        <dt className="font-semibold text-amber-300">Goes wrong</dt>
        <dd className="text-ink">{limit.wrong}</dd>
        <dt className="font-semibold text-faint">When</dt>
        <dd className="text-muted">{limit.when}</dd>
        <dt className="font-semibold text-faint">Data to fix</dt>
        <dd className="text-muted">{limit.fix}</dd>
      </dl>
    </li>
  );
}
