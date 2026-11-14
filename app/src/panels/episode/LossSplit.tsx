import clsx from "clsx";
import type { Detection, Episode } from "../../data/types";
import { CAUSES, TRACTORS, TRACTOR_COLOR } from "../../lib/causes";
import { Dot } from "../../ui/CauseBadge";
import { medianInSpan } from "./series";

const SKY_COLOR = CAUSES.SPACE_WEATHER.color;
const UNEXPLAINED_COLOR = CAUSES.JAMMING.color;
const COLUMNS = "grid grid-cols-[2.25rem_1fr_4.75rem] items-center gap-x-2.5";

/**
 * Each tractor's drop as one bar, split into the part the sky explains and the
 * part it does not, with the two amounts beside it in the same colors. Values
 * are medians over the detection, in whole dB.
 */
export function LossSplit({ episode, detection }: { episode: Episode; detection: Detection }) {
  const sky = medianInSpan(episode, episode.sag) ?? 0;
  const drops = TRACTORS.map((id) => Math.max(0, medianInSpan(episode, episode.series[id].drop) ?? 0));
  // The bars share one scale, so a longer bar is always a larger drop.
  const full = Math.max(10, sky, ...drops);

  return (
    <div className="tabular text-xs" title="Medians over the detection. Sky is the drop that S4 predicts.">
      <p className="mb-2 flex items-center gap-3">
        <span className="text-[13px] font-semibold">Signal drop, dB</span>
        <span className="ml-auto flex items-center gap-1.5 text-muted">
          <Dot color={SKY_COLOR} />
          Sky
        </span>
        <span className="flex items-center gap-1.5 text-muted">
          <Dot color={UNEXPLAINED_COLOR} />
          Unexplained
        </span>
      </p>
      {TRACTORS.map((id, i) => {
        const explained = Math.min(drops[i], sky);
        const unexplained = Math.max(0, drops[i] - sky);
        return (
          <div key={id} className={clsx(COLUMNS, "py-1", !detection.tractors.includes(id) && "opacity-50")}>
            <span className="flex items-center gap-1.5">
              <Dot color={TRACTOR_COLOR[id].color} />
              {id}
            </span>
            <span className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-line/60">
              {explained > 0 && <span style={{ width: `${(explained / full) * 100}%`, background: SKY_COLOR }} />}
              {unexplained > 0 && <span style={{ width: `${(unexplained / full) * 100}%`, background: UNEXPLAINED_COLOR }} />}
            </span>
            <span className="text-right font-condensed text-[15px] font-semibold">
              {explained >= 0.5 && <span style={{ color: SKY_COLOR }}>{explained.toFixed(0)}</span>}
              {explained >= 0.5 && unexplained >= 0.5 && <span className="text-faint"> + </span>}
              {unexplained >= 0.5 && <span style={{ color: UNEXPLAINED_COLOR }}>{unexplained.toFixed(0)}</span>}
              {explained < 0.5 && unexplained < 0.5 && <span className="text-faint">0</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}
