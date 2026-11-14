import clsx from "clsx";
import { useEffect, useRef } from "react";

const percent = (score: number) => `${score * 100}%`;

/** One thing that moved a score: a few words for the chip, the weight, and the full reason for the hover. */
export interface MeterTerm {
  label: string;
  weight: number;
  reason: string;
}

/**
 * A confidence score: the number, a meter from 0 to 1 with a tick at the
 * starting score, and one chip per term that moved it. A chip shows a few
 * words, and the whole reason on hover. The fill grows from zero when the
 * meter mounts, so give it a `key` that changes with the detection.
 */
export function ConfidenceMeter({ value, base, terms, color }: { value: number; base: number; terms: MeterTerm[]; color: string }) {
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
              title={`Every detection starts at ${base.toFixed(2)}`}
              className="absolute -top-1 h-[18px] w-0.5 -translate-x-1/2 rounded bg-ink"
              style={{ left: percent(base) }}
            />
          </div>
        </div>
      </div>

      <ul className="m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0">
        {terms.map(({ label, weight, reason }) => (
          <li key={reason} title={reason} className="flex items-center gap-1.5 rounded-full bg-panel-raised py-0.5 pl-1 pr-2.5 text-xs ring-1 ring-line">
            <span
              className={clsx(
                "tabular rounded-full px-1.5 py-px font-semibold",
                weight >= 0 ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300",
              )}
            >
              {weight >= 0 ? "+" : "-"}
              {Math.abs(weight).toFixed(2)}
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
