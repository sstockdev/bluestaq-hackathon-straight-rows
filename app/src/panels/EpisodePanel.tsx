import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Detection, Rules, Thresholds } from "../data/types";
import { CAUSES } from "../lib/causes";
import { useApp, useSelected } from "../state/store";
import { ConfidenceMeter, type MeterTerm } from "../ui/ConfidenceMeter";
import { Panel } from "../ui/Panel";
import { LeadChart, MoreCharts } from "./episode/EpisodeCharts";
import { EpisodeHeader } from "./episode/EpisodeHeader";
import { EvidenceRows } from "./episode/EvidenceRows";
import { Steps } from "./episode/Steps";
import { confidenceTerms } from "./how/flows";

/**
 * The selected detection: what to do, how confident the detector is and why in
 * a few chips, and the one chart that shows it. The evidence sentences, the
 * detector's steps, and the other charts wait behind a Details toggle.
 * Renders nothing when no detection is selected.
 */
export default function EpisodePanel() {
  const detection = useSelected();
  const thresholds = useApp((s) => s.index?.thresholds);
  const rules = useApp((s) => s.index?.rules);
  const dev = useApp((s) => s.day?.kind === "dev");
  const select = useApp((s) => s.select);
  if (!detection || !thresholds || !rules) return null;

  const cause = CAUSES[detection.cls];
  return (
    <Panel className="w-[420px] max-h-full overflow-y-auto">
      <EpisodeHeader detection={detection} dev={dev} onClose={() => select(null)} />

      <Section title="Confidence">
        {/* The key remounts the meter for each detection, which replays its fill. */}
        <ConfidenceMeter key={detection.id} value={detection.confidence} base={rules.confidence.base} terms={meterTerms(detection, rules)} color={cause.color} />
      </Section>
      <Section>
        <LeadChart detection={detection} thresholds={thresholds} />
      </Section>
      {/* The key closes the details again when another detection is selected. */}
      <Details key={detection.id} detection={detection} thresholds={thresholds} />
    </Panel>
  );
}

/**
 * A detection's confidence terms with a few words each. The words come from the
 * How panel's list, matched on the detector's reason. A reason that list does
 * not know keeps its own first clause.
 */
function meterTerms(detection: Detection, rules: Rules): MeterTerm[] {
  const known = confidenceTerms(detection.cls, rules);
  return detection.terms.map(([reason, weight]) => {
    const term = known.find((t) => t.reason === reason && rules.confidence.terms[detection.cls][t.key] === weight);
    const own = reason.split(",")[0];
    return { label: term?.label ?? own[0].toUpperCase() + own.slice(1), weight, reason };
  });
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
