import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Detection, Thresholds } from "../data/types";
import { CAUSES } from "../lib/causes";
import { useApp, useSelected } from "../state/store";
import { ConfidenceMeter } from "../ui/ConfidenceMeter";
import { Panel } from "../ui/Panel";
import { LeadChart, MoreCharts } from "./episode/EpisodeCharts";
import { EpisodeHeader } from "./episode/EpisodeHeader";
import { EvidenceRows } from "./episode/EvidenceRows";
import { Steps } from "./episode/Steps";

/**
 * The selected detection: what it is, what to do, how confident the detector
 * is and why, and the one chart that shows it. The evidence sentences, the
 * detector's steps, and the other charts wait behind a Details toggle.
 * Renders nothing when no detection is selected.
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
      <Section>
        <LeadChart detection={detection} thresholds={thresholds} />
      </Section>
      {/* The key closes the details again when another detection is selected. */}
      <Details key={detection.id} detection={detection} thresholds={thresholds} />
    </Panel>
  );
}

/** The rest of what is known about a detection, closed until asked for. */
function Details({ detection, thresholds }: { detection: Detection; thresholds: Thresholds }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between border-t border-line px-4 py-3 text-[13px] font-medium text-muted transition-colors hover:text-ink"
      >
        Details
        <ChevronDown size={16} className={clsx("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <Section title="Evidence as submitted">
            <EvidenceRows sentences={detection.evidence} />
          </Section>
          <Section title="How the detector decided">
            <Steps steps={detection.steps} />
          </Section>
          <MoreCharts detection={detection} thresholds={thresholds} wrap={(charts) => <Section title="What the tractors measured">{charts}</Section>} />
        </>
      )}
    </>
  );
}

function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="border-t border-line px-4 py-3.5">
      {title && <h3 className="mb-2.5 text-xs font-semibold text-muted">{title}</h3>}
      {children}
    </section>
  );
}
