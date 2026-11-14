import type { Day, Thresholds } from "../../data/types";
import { predictedSag, valueAt } from "./sky";

/** S4, Kp, and the sag S4 predicts at the clock, as three large numbers. */
export function SkyReadouts({ day, thresholds, clock }: { day: Day; thresholds: Thresholds; clock: number }) {
  const s4 = valueAt(day.sky.s4, clock);
  const kp = valueAt(day.sky.kp, clock);
  const sag = s4 === null ? null : predictedSag(s4, thresholds);
  const { sagMin, sagIntercept, sagSlope } = thresholds;

  return (
    <div className="grid grid-cols-3 gap-2">
      <Readout label="S4" value={s4 === null ? "n/a" : s4.toFixed(2)} note="regional, 15 min" />
      <Readout label="Kp" value={kp === null ? "n/a" : kp.toFixed(1)} note="global, 3 h" />
      <Readout
        label="Sag S4 predicts"
        value={sag === null ? "n/a" : sag.toFixed(1)}
        unit="dB"
        note={sag ? `${sagIntercept} + ${sagSlope} × S4` : `none below S4 ${sagMin}`}
      />
    </div>
  );
}

function Readout({ label, value, unit, note }: { label: string; value: string; unit?: string; note: string }) {
  return (
    <div className="rounded-lg bg-panel-raised px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className="tabular font-condensed text-[34px] font-semibold leading-tight">
        {value}
        {unit && <span className="ml-1 text-base font-medium text-muted">{unit}</span>}
      </div>
      <div className="text-[11px] leading-snug text-faint">{note}</div>
    </div>
  );
}
