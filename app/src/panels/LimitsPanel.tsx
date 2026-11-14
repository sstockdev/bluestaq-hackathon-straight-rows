import { LIMITS } from "../data/limits";
import { InfoPanel } from "./info/InfoPanel";
import { LimitRow } from "./info/LimitRow";
import { SweepSquares } from "./info/SweepSquares";

/**
 * The six limits that matter most. Each row says what was accepted and, under
 * it, why that was judged acceptable. A row opens to what goes wrong and what
 * data would fix it.
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
    </InfoPanel>
  );
}
