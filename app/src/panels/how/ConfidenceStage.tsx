import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import type { Cause, Detection, Rules } from "../../data/types";
import { CAUSES } from "../../lib/causes";
import { clock } from "../../lib/time";
import { Stage } from "./Flow";
import { confidenceTerms } from "./flows";

const signed = (weight: number) => `${weight >= 0 ? "+" : "-"}${Math.abs(weight).toFixed(2)}`;

/**
 * How a confidence score is built: start, add or subtract, stay in range. Under
 * that, one chip per term the chosen cause can earn, with its condition on
 * hover. When the selected detection is of this cause, the terms it earned
 * stay lit and its own sum is written out.
 */
export function ConfidenceStage({ cause, rules, detection }: { cause: Cause; rules: Rules; detection: Detection | null }) {
  const c = rules.confidence;
  const { color } = CAUSES[cause];
  const earned = (reason: string, weight: number) =>
    detection?.terms.some(([r, w]) => r === reason && w === weight) ?? false;

  const steps = [
    { value: c.base.toFixed(2), note: "start" },
    { value: "+ / -", note: "evidence" },
    { value: `${c.min.toFixed(2)} to ${c.max.toFixed(2)}`, note: "limits" },
  ];
  const caps = [`No S4: max ${c.noS4Cap.toFixed(2)}`];
  if (cause === "EQUIPMENT_FAULT") caps.push(`Signal loss on one machine: max ${c.singleLossCap.toFixed(2)}`);

  return (
    <Stage n={6} title="Score the confidence">
      <div className="flex items-stretch gap-0.5">
        {steps.map((step, i) => (
          <Fragment key={step.note}>
            {i > 0 && <ChevronRight size={14} className="shrink-0 self-center text-faint" aria-hidden />}
            <div className="flex flex-1 items-baseline justify-center gap-1.5 rounded-md border border-line bg-panel px-1.5 py-1.5">
              <span className="tabular font-condensed text-[17px] font-semibold leading-tight">{step.value}</span>
              <span className="text-[11px] text-muted">{step.note}</span>
            </div>
          </Fragment>
        ))}
      </div>

      <ul className="m-0 mt-2.5 flex list-none flex-wrap gap-1.5 p-0">
        {confidenceTerms(cause, rules).map((term) => {
          const weight = c.terms[cause][term.key];
          return (
            <li
              key={term.key}
              title={term.when}
              className={clsx(
                "flex items-center gap-1.5 rounded-full bg-panel py-0.5 pl-1 pr-2.5 text-xs ring-1 ring-line transition-opacity",
                detection && !earned(term.reason, weight) && "opacity-35",
              )}
            >
              <span
                className={clsx(
                  "tabular rounded-full px-1.5 py-px font-semibold",
                  weight >= 0 ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300",
                )}
              >
                {signed(weight)}
              </span>
              {term.label}
            </li>
          );
        })}
        {caps.map((cap) => (
          <li key={cap} className="rounded-full px-2.5 py-0.5 text-xs text-muted ring-1 ring-line">
            {cap}
          </li>
        ))}
      </ul>

      {detection && <Sum detection={detection} rules={rules} color={color} />}
    </Stage>
  );
}

/** The selected detection's own sum, with the cap named when one lowered the result. */
function Sum({ detection, rules, color }: { detection: Detection; rules: Rules; color: string }) {
  const c = rules.confidence;
  const total = detection.terms.reduce((sum, [, weight]) => sum + weight, c.base);
  const inRange = Math.min(Math.max(total, c.min), c.max);
  const capped = detection.confidence < inRange - 0.001;
  const parts = [c.base.toFixed(2), ...detection.terms.map(([, weight]) => `${weight >= 0 ? "+" : "-"} ${Math.abs(weight).toFixed(2)}`)];
  return (
    <div className="mt-2.5 flex items-baseline justify-between gap-3 rounded-md px-2.5 py-1.5" style={{ background: `${color}1f`, boxShadow: `inset 3px 0 0 ${color}` }}>
      <span className="tabular font-condensed text-[19px] font-semibold leading-tight">
        {parts.join(" ")} = {inRange.toFixed(2)}
        {capped && `, capped at ${detection.confidence.toFixed(2)}`}
      </span>
      <span className="tabular shrink-0 text-xs text-muted">
        {clock(detection.start)} {detection.tractors.join(" ")}
      </span>
    </div>
  );
}
