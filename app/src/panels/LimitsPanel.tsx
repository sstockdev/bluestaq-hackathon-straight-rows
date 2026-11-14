import { LIMIT_GROUPS, LIMITS } from "../data/limits";
import { InfoPanel, SectionTitle } from "./info/InfoPanel";
import { LimitCard } from "./info/LimitCard";
import { SweepSquares } from "./info/SweepSquares";

/** What can break the detector or mislead on this map: for each limit, what goes wrong, when, and what data would fix it. */
export default function LimitsPanel() {
  return (
    <InfoPanel title="Limits" note={`${LIMITS.length} ways the result or this map can be wrong`} width="w-[420px]">
      <SweepSquares />
      {LIMIT_GROUPS.map((group) => (
        <section key={group.id} className="flex flex-col gap-2">
          <SectionTitle>{group.title}</SectionTitle>
          <ul className="flex flex-col gap-2">
            {LIMITS.filter((limit) => limit.group === group.id).map((limit) => (
              <LimitCard key={limit.id} limit={limit} />
            ))}
          </ul>
        </section>
      ))}
    </InfoPanel>
  );
}
