import clsx from "clsx";
import { useEffect, useRef } from "react";

/** Every detection starts at this score, and its terms move it up or down. */
const STARTING_SCORE = 0.6;

const percent = (score: number) => `${score * 100}%`;

/**
 * A confidence score: the number, a meter from 0 to 1 with a tick at the
 * starting score, and one chip per term that moved it. A chip shows the start of
 * its reason, and the whole reason on hover. The fill grows from zero when the
 * meter mounts, so give it a `key` that changes with the detection.
 */
export function ConfidenceMeter({ value, terms, color }: { value: number; terms: [string, number][]; color: string }) {
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    fill.current?.animate([{ width: "0%" }, { width: percent(value) }], { duration: 500, easing: "ease-out" });
  }, [value]);

  return (
    <div>
      <div className="flex items-center gap-4">
        <p className="tabular font-condensed text-[40px] font-semibold leading-none">{value.toFixed(2)}</p>
        <div className="flex-1">
          <div className="relative h-2.5 rounded-full bg-panel-raised ring-1 ring-line" role="meter" aria-label="Confidence" aria-valuemin={0} aria-valuemax={1} aria-valuenow={value}>
            <div ref={fill} className="h-full rounded-full" style={{ width: percent(value), background: color }} />
            <span
              title={`Every detection starts at ${STARTING_SCORE.toFixed(2)}`}
              className="absolute -top-1 h-[18px] w-0.5 -translate-x-1/2 rounded bg-ink"
              style={{ left: percent(STARTING_SCORE) }}
            />
          </div>
        </div>
      </div>

      <ul className="m-0 mt-3 list-none space-y-1.5 p-0">
        {terms.map(([reason, weight]) => (
          <li key={reason} title={reason} className="flex items-baseline gap-2 text-[13px] leading-snug">
            <span
              className={clsx(
                "tabular w-12 shrink-0 rounded-full py-px text-center text-xs font-semibold ring-1",
                weight >= 0 ? "bg-emerald-400/15 text-emerald-300 ring-emerald-400/40" : "bg-rose-400/15 text-rose-300 ring-rose-400/40",
              )}
            >
              {weight >= 0 ? "+" : "-"}
              {Math.abs(weight).toFixed(2)}
            </span>
            <span className={weight >= 0 ? undefined : "text-muted"}>{reason.split(",")[0]}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-xs text-faint">Rule-based, not statistically calibrated.</p>
    </div>
  );
}
