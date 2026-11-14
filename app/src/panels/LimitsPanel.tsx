import { ArrowRight } from "lucide-react";
import { LIMITS, WANTED } from "../data/limits";
import { InfoPanel, SectionTitle } from "./info/InfoPanel";
import { LimitRow } from "./info/LimitRow";
import { SweepSquares } from "./info/SweepSquares";

/** The id of the "Data that would help" section, so the tour can scroll to it. */
export const WANTED_ID = "data-that-would-help";

/**
 * The six limits that matter most, then the data that would help. Each limit
 * says what was accepted and, under it, why that was judged acceptable, and it
 * opens to what goes wrong. Each kind of data says what it would fix.
 */
export default function LimitsPanel() {
  return (
    <InfoPanel title="Limits" note={`${LIMITS.length} we accepted, and why`} width="w-[440px]">
      <SweepSquares />
      <ul className="m-0 list-none divide-y divide-line rounded-lg border border-line p-0">
        {LIMITS.map((limit) => (
          <LimitRow key={limit.id} limit={limit} />
        ))}
      </ul>
      <section id={WANTED_ID} className="flex scroll-mt-16 flex-col gap-1.5">
        <SectionTitle>Data that would help</SectionTitle>
        <ol className="m-0 list-none divide-y divide-line rounded-lg border border-line p-0">
          {WANTED.map(({ data, fixes }, i) => (
            <li key={data} className="flex gap-3 px-3 py-2.5">
              <span className="tabular flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-panel-raised text-[11px] font-semibold text-muted ring-1 ring-line">
                {i + 1}
              </span>
              <span>
                <span className="block text-[13.5px] font-medium leading-snug">{data}</span>
                <span className="mt-1 flex items-start gap-1.5 text-xs leading-snug text-muted">
                  <ArrowRight size={13} aria-hidden className="mt-px shrink-0 text-accent" />
                  {fixes}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </InfoPanel>
  );
}
