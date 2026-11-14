import clsx from "clsx";
import type { Detection, Episode } from "../../data/types";
import { CAUSES, TRACTORS, TRACTOR_COLOR } from "../../lib/causes";
import { Dot } from "../../ui/CauseBadge";
import { medianInSpan } from "./series";

const SKY_COLOR = CAUSES.SPACE_WEATHER.color;
const UNEXPLAINED_COLOR = CAUSES.JAMMING.color;
const COLUMNS = "grid grid-cols-[2.25rem_1fr_2.75rem_3.25rem_5.75rem] items-center gap-x-2";

/**
 * Each tractor's drop as one bar, split into the part the sky explains and the
 * part it does not. Values are medians over the detection, in whole dB.
 */
export function LossSplit({ episode, detection }: { episode: Episode; detection: Detection }) {
  const sky = medianInSpan(episode, episode.sag) ?? 0;
  const drops = TRACTORS.map((id) => Math.max(0, medianInSpan(episode, episode.series[id].drop) ?? 0));
  // The bars share one scale, so a longer bar is always a larger drop.
  const full = Math.max(10, sky, ...drops);

  return (
    <div className="tabular rounded-lg bg-panel-raised/60 px-3 py-2.5 text-xs">
      <p className="text-[13px] font-semibold">Where the drop comes from</p>
      <div className={clsx(COLUMNS, "mb-1 text-muted")}>
        <span className="col-span-2" />
        <span className="text-right">Drop</span>
        <span className="flex items-center justify-end gap-1.5">
          <Dot color={SKY_COLOR} />
          Sky
        </span>
        <span className="flex items-center justify-end gap-1.5">
          <Dot color={UNEXPLAINED_COLOR} />
          Unexplained
        </span>
      </div>
      {TRACTORS.map((id, i) => {
        const explained = Math.min(drops[i], sky);
        const unexplained = Math.max(0, drops[i] - sky);
        return (
          <div key={id} className={clsx(COLUMNS, "py-0.5", !detection.tractors.includes(id) && "text-faint")}>
            <span className="flex items-center gap-1.5">
              <Dot color={TRACTOR_COLOR[id].color} />
              {id}
            </span>
            <span className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-line/60">
              {explained > 0 && <span style={{ width: `${(explained / full) * 100}%`, background: SKY_COLOR }} />}
              {unexplained > 0 && <span style={{ width: `${(unexplained / full) * 100}%`, background: UNEXPLAINED_COLOR }} />}
            </span>
            <span className="text-right font-medium">{drops[i].toFixed(0)} dB</span>
            <span className="text-right">{sky.toFixed(0)} dB</span>
            <span className="text-right">{unexplained.toFixed(0)} dB</span>
          </div>
        );
      })}
      <p className="mt-1.5 text-faint">
        Median during the detection. Drop is dB below normal, sky is what S4 predicts, and unexplained is the drop minus the sky.
      </p>
    </div>
  );
}
