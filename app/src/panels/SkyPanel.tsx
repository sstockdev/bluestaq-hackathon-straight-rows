import { clock as clockText, dayLabel } from "../lib/time";
import { useApp } from "../state/store";
import { InfoPanel, SectionTitle } from "./info/InfoPanel";
import { KpChart } from "./info/KpChart";
import { S4Chart } from "./info/S4Chart";
import { AdvisoryList, ReportList } from "./info/SkyFeeds";
import { SkyReadouts } from "./info/SkyReadouts";

/** The day's space context: S4 and Kp at the clock and through the day, advisories, and interference reports. */
export default function SkyPanel() {
  const day = useApp((s) => s.day);
  const thresholds = useApp((s) => s.index?.thresholds);
  const clock = useApp((s) => s.clock);
  const setClock = useApp((s) => s.setClock);
  if (!day || !thresholds) return null;

  return (
    <InfoPanel title="Sky" note={`${dayLabel(day.t0)}, ${clockText(clock)} UTC`} width="w-[380px]">
      <SkyReadouts day={day} thresholds={thresholds} clock={clock} />
      <p className="text-[13px] leading-snug text-muted">
        Kp is a planet-wide index, shown for context. S4 is measured for this region, and it is the one the detector uses.
      </p>

      <section>
        <SectionTitle note="hours UTC">S4 scintillation</SectionTitle>
        <S4Chart day={day} sagMin={thresholds.sagMin} clock={clock} />
      </section>
      <section>
        <SectionTitle note="hours UTC">Kp index</SectionTitle>
        <KpChart day={day} clock={clock} />
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>Advisories</SectionTitle>
        <AdvisoryList advisories={day.advisories} />
      </section>
      <section className="flex flex-col gap-2">
        <SectionTitle note={day.reports.length > 0 ? "click one to go to its time" : undefined}>Interference reports</SectionTitle>
        <ReportList reports={day.reports} onPick={(report) => setClock(report.t)} />
      </section>
    </InfoPanel>
  );
}
