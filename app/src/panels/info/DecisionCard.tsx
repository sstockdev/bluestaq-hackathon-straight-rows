import clsx from "clsx";
import { Check, ChevronDown, FlaskConical, MapPin, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Decision } from "../../data/types";
import { showDetection } from "../../tour/showDetection";
import { DECISION_EPISODES, type DecisionEpisode } from "./decisionEpisodes";

/** One design decision. Closed it shows the title; open it shows the choice, what was rejected, the evidence, and the limitation. */
export function DecisionCard({ decision, open, onToggle }: { decision: Decision; open: boolean; onToggle: () => void }) {
  const episode = DECISION_EPISODES[decision.id];
  return (
    <li className={clsx("rounded-lg border", open ? "border-faint bg-panel-raised/60" : "border-line")}>
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-start gap-3 px-3 py-2.5 text-left">
        <span className="tabular w-5 shrink-0 font-condensed text-lg font-semibold leading-tight text-faint">{decision.id}</span>
        <span className="flex-1">
          <span className="block text-[14px] font-medium leading-snug">{decision.title}</span>
          {decision.in_demo && (
            <span className="mt-1 inline-block rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-medium text-ink ring-1 ring-accent/60">
              In the demo
            </span>
          )}
        </span>
        <ChevronDown size={16} aria-hidden className={clsx("mt-0.5 shrink-0 text-muted", open && "rotate-180")} />
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

/** One labeled part of an open card. */
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
