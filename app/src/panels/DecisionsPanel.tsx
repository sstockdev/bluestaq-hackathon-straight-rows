import { useMemo, useState } from "react";
import { useApp } from "../state/store";
import { DecisionRow } from "./info/DecisionRow";
import { InfoPanel } from "./info/InfoPanel";
import { ScoreLine } from "./info/ScoreLine";

/**
 * The dev score, then the design decisions behind the detector, the ones shown
 * in the demo first. Each row reads at a glance, and opens to the full reasoning
 * when clicked, one at a time.
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
    <InfoPanel title="Why" note={`${ordered.length} design decisions`} width="w-[440px]">
      <ScoreLine />
      <ol className="flex flex-col gap-1.5">
        {ordered.map((decision) => (
          <DecisionRow
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
