import { Clock } from "lucide-react";
import type { Day, Report } from "../../data/types";
import { clock as clockText } from "../../lib/time";

/** "SPACE_WEATHER" as "Space weather". */
function plainType(type: string): string {
  const words = type.toLowerCase().replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** The day's advisories: when each was issued, its type, and its text. */
export function AdvisoryList({ advisories }: { advisories: Day["advisories"] }) {
  if (advisories.length === 0) return <p className="text-xs text-faint">No advisories on this day.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {advisories.map((advisory) => (
        <li key={advisory.id} className="rounded-lg border border-line px-3 py-2">
          <div className="tabular flex items-baseline gap-2 text-xs">
            <span className="font-semibold text-ink">{advisory.id}</span>
            <span className="text-muted">{clockText(advisory.t)} UTC</span>
            <span className="ml-auto text-muted">{plainType(advisory.type)}</span>
          </div>
          <p className="mt-1 text-[13px] leading-snug text-muted">{advisory.text}</p>
        </li>
      ))}
    </ul>
  );
}

/** The day's interference reports. Clicking one moves the clock to the time it arrived. */
export function ReportList({ reports, onPick }: { reports: Report[]; onPick: (report: Report) => void }) {
  if (reports.length === 0) return <p className="text-xs text-faint">No interference reports on this day.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {reports.map((report) => (
        <li key={report.id}>
          <button
            onClick={() => onPick(report)}
            title="Move the clock to this report"
            className="w-full rounded-lg border border-line px-3 py-2 text-left transition-colors hover:border-faint hover:bg-panel-raised"
          >
            <div className="tabular flex items-center gap-2 text-xs">
              <span className="font-semibold text-ink">{report.id}</span>
              <span className="flex items-center gap-1 rounded-full bg-panel-raised px-2 py-0.5 text-ink">
                <Clock size={11} aria-hidden />
                {clockText(report.t)} UTC
              </span>
            </div>
            <dl className="tabular mt-1.5 flex gap-4 text-xs text-muted">
              <div className="flex gap-1.5">
                <dt>Its confidence</dt>
                <dd className="text-ink">{report.confidence.toFixed(2)}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>From the field</dt>
                <dd className="text-ink">{report.km.toFixed(2)} km</dd>
              </div>
            </dl>
            <p className="mt-1 text-[13px] leading-snug text-muted">{report.text}</p>
          </button>
        </li>
      ))}
    </ul>
  );
}
