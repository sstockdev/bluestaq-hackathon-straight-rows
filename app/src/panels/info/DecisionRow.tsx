import clsx from "clsx";
import { Check, FlaskConical, MapPin, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Decision } from "../../data/types";
import { showDetection } from "../../tour/showDetection";
import { DECISION_BRIEFS } from "./decisionBriefs";
import { DECISION_EPISODES, type DecisionEpisode } from "./decisionEpisodes";

/**
 * One design decision. Closed it reads at a glance: a short title, what was
 * chosen, what was rejected, and the number that backs it. Clicking it opens
 * the full reasoning from decisions.json.
 */
export function DecisionRow({ decision, open, onToggle }: { decision: Decision; open: boolean; onToggle: () => void }) {
  const brief = DECISION_BRIEFS[decision.id];
  const episode = DECISION_EPISODES[decision.id];
  return (
    <li className={clsx("rounded-lg border", open ? "border-faint bg-panel-raised/60" : "border-line")}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        title={open ? undefined : "Open the full reasoning"}
        className="grid w-full cursor-pointer grid-cols-[1.25rem_1fr_auto] items-center gap-x-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-panel-raised/60"
      >
        <span className="tabular self-start font-condensed text-lg font-semibold leading-tight text-faint">{decision.id}</span>
        <span>
          <span className="flex items-center gap-2 text-[13.5px] font-medium leading-snug">
            {brief?.title ?? decision.title}
            {decision.in_demo && (
              <span className="rounded-full bg-accent/20 px-1.5 text-[10px] font-medium leading-4 text-ink ring-1 ring-accent/60">demo</span>
            )}
          </span>
          {brief && (
            <>
              <Mark icon={Check} tone="text-emerald-400">{brief.chosen}</Mark>
              <Mark icon={X} tone="text-rose-400">{brief.rejected}</Mark>
            </>
          )}
        </span>
        {brief && (
          <span className="text-right">
            <span className="tabular block font-condensed text-[18px] font-semibold leading-tight">{brief.stat}</span>
            <span className="block text-[11px] leading-tight text-muted">{brief.note}</span>
          </span>
        )}
      </button>

      {open && (
        <div className="flex flex-col gap-3 px-3 pb-3">
          <Part icon={Check} label="Chosen" tone="text-ink">
            <p>{decision.choice}</p>
          </Part>
          <Part icon={X} label="Rejected" tone="text-muted">
            <ul className="flex flex-col gap-1.5">
              {decision.rejected.map((option) => (
                <li key={option} className="border-l-2 border-line pl-2.5">
                  {option}
                </li>
              ))}
            </ul>
          </Part>
          <Part icon={FlaskConical} label="Evidence from dev" tone="text-muted">
            <p>{decision.evidence}</p>
          </Part>
          <div className="rounded-md border-l-2 border-amber-400 bg-amber-400/10 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
              <TriangleAlert size={13} aria-hidden />
              Limitation
            </div>
            <p className="mt-1 text-[13px] leading-snug text-ink">{decision.limitation}</p>
          </div>
          {episode && <ShowOnMap episode={episode} />}
        </div>
      )}
    </li>
  );
}

/** One line under the title: a green check for what was chosen, a red cross for what was rejected. */
function Mark({ icon: Icon, tone, children }: { icon: LucideIcon; tone: string; children: string }) {
  return (
    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
      <Icon size={12} strokeWidth={2.5} aria-hidden className={clsx("shrink-0", tone)} />
      {children}
    </span>
  );
}

/** One labeled part of an open row. */
function Part({ icon: Icon, label, tone, children }: { icon: LucideIcon; label: string; tone: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-2.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-faint">
        <Icon size={13} aria-hidden />
        {label}
      </div>
      <div className={clsx("mt-1 text-[13px] leading-snug", tone)}>{children}</div>
    </section>
  );
}

/** Loads the episode's day and selects its detection on the field map. */
function ShowOnMap({ episode }: { episode: DecisionEpisode }) {
  const [missing, setMissing] = useState(false);
  const show = async () => {
    const found = await showDetection(episode.date, (detection) => detection.label === episode.label);
    setMissing(!found);
  };
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => void show()}
        className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent/85"
      >
        <MapPin size={14} aria-hidden />
        Show it on the map
      </button>
      <span className="tabular text-xs text-muted">
        {missing ? `${episode.label} is not in this day's detections` : `Dev episode ${episode.label}`}
      </span>
    </div>
  );
}
