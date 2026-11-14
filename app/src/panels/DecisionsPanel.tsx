import { useMemo, useState } from "react";
import { useApp } from "../state/store";
import { DecisionCard } from "./info/DecisionCard";
import { InfoPanel } from "./info/InfoPanel";

/** The design decisions behind the detector, the ones shown in the demo first. One card is open at a time. */
export default function DecisionsPanel() {
  const decisions = useApp((s) => s.index?.decisions);
  const ordered = useMemo(
    () => [...(decisions ?? [])].sort((a, b) => Number(b.in_demo) - Number(a.in_demo) || a.id - b.id),
    [decisions],
  );
  const [openId, setOpenId] = useState<number | null>(ordered[0]?.id ?? null);
  if (ordered.length === 0) return null;

  const inDemo = ordered.filter((decision) => decision.in_demo).length;
  return (
    <InfoPanel title="Why" note={`${ordered.length} design decisions, the ${inDemo} in the demo first`} width="w-[420px]">
      <ol className="flex flex-col gap-2">
        {ordered.map((decision) => (
          <DecisionCard
            key={decision.id}
            decision={decision}
            open={decision.id === openId}
            onToggle={() => setOpenId(decision.id === openId ? null : decision.id)}
          />
        ))}
      </ol>
    </InfoPanel>
  );
}
