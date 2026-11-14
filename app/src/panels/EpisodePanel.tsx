import type { ReactNode } from "react";
import { CAUSES } from "../lib/causes";
import { useApp, useSelected } from "../state/store";
import { ConfidenceMeter } from "../ui/ConfidenceMeter";
import { Panel } from "../ui/Panel";
import { EpisodeCharts } from "./episode/EpisodeCharts";
import { EpisodeHeader } from "./episode/EpisodeHeader";
import { EvidenceRows } from "./episode/EvidenceRows";
import { Steps } from "./episode/Steps";

/**
 * Everything about the selected detection: what to do, how confident the
 * detector is and why, its evidence, the steps it took, and the charts behind
 * them. Renders nothing when no detection is selected.
 */
export default function EpisodePanel() {
  const detection = useSelected();
  const thresholds = useApp((s) => s.index?.thresholds);
  const dev = useApp((s) => s.day?.kind === "dev");
  const select = useApp((s) => s.select);
  if (!detection || !thresholds) return null;

  const cause = CAUSES[detection.cls];
  return (
    <Panel className="w-[420px] max-h-full overflow-y-auto">
      <EpisodeHeader detection={detection} dev={dev} onClose={() => select(null)} />

      <div className="border-l-[3px] px-4 py-3" style={{ borderColor: cause.color }}>
        <p className="text-xs text-muted">Recommended action</p>
        <p className="text-[17px] font-semibold leading-snug">{cause.action}</p>
      </div>

      <Section title="Confidence">
        {/* The key remounts the meter for each detection, which replays its fill. */}
        <ConfidenceMeter key={detection.id} value={detection.confidence} terms={detection.terms} color={cause.color} />
      </Section>
      <Section title="Evidence">
        <EvidenceRows sentences={detection.evidence} />
      </Section>
      <Section title="How the detector decided">
        <Steps steps={detection.steps} />
      </Section>
      <Section title="What the tractors measured">
        <EpisodeCharts detection={detection} thresholds={thresholds} />
      </Section>
    </Panel>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line px-4 py-3.5">
      <h3 className="mb-2.5 text-xs font-semibold text-muted">{title}</h3>
      {children}
    </section>
  );
}
