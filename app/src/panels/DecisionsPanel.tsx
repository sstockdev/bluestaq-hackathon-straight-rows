import { useMemo, useState } from "react";
import { useApp } from "../state/store";
import { DecisionCard } from "./info/DecisionCard";
import { InfoPanel } from "./info/InfoPanel";
import { ScoreLine } from "./info/ScoreLine";

/**
 * The dev score, then the design decisions behind the detector, the ones shown
 * in the demo first. A decision opens when clicked, one at a time.
 */
export default function DecisionsPanel() {
  const decisions = useApp((s) => s.index?.decisions);
  const ordered = useMemo(
    () => [...(decisions ?? [])].sort((a, b) => Number(b.in_demo) - Number(a.in_demo) || a.id - b.id),
    [decisions],
  );
  const [openId, setOpenId] = useState<number | null>(null);
  if (ordered.length === 0) return null;

  return (
    <InfoPanel title="Why" note={`${ordered.length} design decisions`} width="w-[380px]">
      <ScoreLine />
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
