import { LIMIT_GROUPS, LIMITS } from "../data/limits";
import { InfoPanel, SectionTitle } from "./info/InfoPanel";
import { LIMIT_COLUMNS, LimitRow } from "./info/LimitRow";
import { SweepSquares } from "./info/SweepSquares";

/**
 * What can break the detector or mislead on this map, as a table: the case,
 * what goes wrong, and the data that would fix it. Each row holds a few words
 * and opens to the full text when clicked.
 */
export default function LimitsPanel() {
  return (
    <InfoPanel title="Limits" note={`${LIMITS.length} ways the result or this map can be wrong`} width="w-[440px]">
      <SweepSquares />
      <div className="flex flex-col gap-3">
        <div className={`${LIMIT_COLUMNS} px-2.5 text-[11px] text-faint`}>
          <span>Case</span>
          <span>Goes wrong</span>
          <span>Data to fix</span>
        </div>
        {LIMIT_GROUPS.map((group) => (
          <section key={group.id} className="flex flex-col gap-1.5">
            <SectionTitle>{group.title}</SectionTitle>
            <ul className="m-0 list-none divide-y divide-line rounded-lg border border-line p-0">
              {LIMITS.filter((limit) => limit.group === group.id).map((limit) => (
                <LimitRow key={limit.id} limit={limit} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </InfoPanel>
  );
}
