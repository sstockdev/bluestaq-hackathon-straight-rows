import { FIX_NAMES, TRACTOR_COLOR } from "../lib/causes";
import { clock as formatClock } from "../lib/time";
import { sampleIndex, useApp } from "../state/store";
import { Panel } from "../ui/Panel";
import type { HoveredTractor } from "./layers/tractors";

/** A measurement with its unit, or "no data" when the sample is missing. */
function measured(value: number | null, digits: number, unit: string): string {
  return value === null ? "no data" : `${value.toFixed(digits)} ${unit}`;
}

/** What one tractor measured at the current moment, shown beside the cursor while it is over that tractor. */
export default function TractorTooltip({ hovered }: { hovered: HoveredTractor }) {
  const day = useApp((s) => s.day);
  const clock = useApp((s) => s.clock);
  if (!day) return null;

  const track = day.tractors[hovered.id];
  const i = sampleIndex(day, clock);
  const drop = track.drop[i];
  const excess = track.excess[i];
  const link = track.link[i];
  const rows: [string, string][] = [
    ["Mean C/N0", measured(track.cn0[i], 1, "dB-Hz")],
    ["Drop below normal", measured(drop, 1, "dB")],
    ["Explained by the sky", measured(drop === null || excess === null ? null : drop - excess, 1, "dB")],
    ["Unexplained loss", measured(excess, 1, "dB")],
    ["Cross-track error", measured(track.xte[i], 2, "m")],
    ["Fix", FIX_NAMES[track.fix[i]] ?? "no data"],
    ["Correction link", link === null ? "no data" : `${Math.round(link * 100)}% up`],
  ];

  // Open toward the middle of the screen, so the tooltip never runs off an edge or under the time bar.
  const left = hovered.x > window.innerWidth / 2;
  const up = hovered.y > window.innerHeight / 2;
  const shift = `translate(${left ? "-100%" : "0"}, ${up ? "-100%" : "0"})`;
  return (
    <div
      className="pointer-events-none absolute z-10 font-sans"
      style={{ left: hovered.x + (left ? -16 : 16), top: hovered.y + (up ? -16 : 16), transform: shift }}
    >
      <Panel className="w-60 px-3 py-2.5 text-xs">
        <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: TRACTOR_COLOR[hovered.id].color }} />
          {hovered.id}
          <span className="tabular ml-auto font-normal text-muted">{formatClock(clock, true)} UTC</span>
        </div>
        <dl className="tabular grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5">
          {rows.map(([name, value]) => (
            <div key={name} className="contents">
              <dt className="text-muted">{name}</dt>
              <dd className="text-right text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}
