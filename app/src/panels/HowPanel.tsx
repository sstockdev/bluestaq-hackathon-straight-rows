import clsx from "clsx";
import { useEffect, useState, type ReactNode } from "react";
import type { Cause } from "../data/types";
import { CAUSE_ORDER, CAUSES } from "../lib/causes";
import { useApp, useSelected } from "../state/store";
import { CauseBadge, Dot } from "../ui/CauseBadge";
import { CauseBranch } from "./how/CauseBranch";
import { ConfidenceStage } from "./how/ConfidenceStage";
import { Arrow, Links, Stage } from "./how/Flow";
import { causePaths, span } from "./how/flows";
import { InfoPanel } from "./info/InfoPanel";

/** Where each of the five cause buttons sits across the panel, as a share of its width. */
const TAB_CENTERS = [10, 30, 50, 70, 90];

/**
 * The detector as a flowchart, from the raw data to one finished detection.
 * Stages 1 to 3 and 5 are the same for every cause. Stages 4, 6, and 7 follow
 * the cause picked in the row of buttons, which starts on the selected
 * detection's cause. Each box holds a few words, and the full rule is on hover.
 * Every number is read from the export, so it matches config.py.
 */
export default function HowPanel() {
  const index = useApp((s) => s.index);
  const selected = useSelected();
  const [picked, setPicked] = useState<Cause | null>(null);
  // Selecting another detection hands the choice back to that detection.
  useEffect(() => setPicked(null), [selected?.id]);
  if (!index) return null;

  const { thresholds: t, rules: r } = index;
  const cause = picked ?? selected?.cls ?? CAUSE_ORDER[0];
  const at = CAUSE_ORDER.indexOf(cause);
  const { color, action } = CAUSES[cause];

  return (
    <InfoPanel title="How" note="From the raw data to one detection" width="w-[460px]">
      <div className="flex flex-col">
        <Stage n={1} title="Data in">
          <Tiles>
            <Tile name="Telemetry" value="3 tractors, every second" title="Position, speed, signal strength, weakest satellite, drift off the line, fix, and correction link." />
            <Tile name="Sky feeds" value="S4, Kp, reports" title="S4 every 15 minutes, Kp every 3 hours, interference reports, and storm advisories." />
          </Tiles>
        </Stage>
        <Arrow />

        <Stage n={2} title="One table, a row per second">
          <Tiles>
            <Tile name="Drop" value="dB below normal" title={`How far the signal is below the tractor's own normal level, as a ${span(r.smoothS)} median. Parked seconds (speed under ${r.workingSpeed} m/s) are ignored.`} />
            <Tile name="Sag" value={`${t.sagIntercept} + ${t.sagSlope} x S4`} title={`The loss the sky explains, in dB, once S4 reaches ${t.sagMin}. Below that it is 0.`} />
            <Tile name="Unexplained" value="drop - sag" title="The loss the sky does not explain." />
          </Tiles>
        </Stage>
        <Arrow />

        <Stage n={3} title="Five detectors, each on its own" aside={<span className="text-xs text-faint">pick one</span>} />
        <Links links={TAB_CENTERS.map((x): [number, number] => [50, x])} lit={at} color={color} />
        <div className="grid grid-cols-5 gap-1">
          {CAUSE_ORDER.map((id) => (
            <button
              key={id}
              onClick={() => setPicked(id)}
              aria-pressed={id === cause}
              className={clsx(
                "flex cursor-pointer flex-col items-center gap-1 rounded-md border px-1 py-1.5 text-center text-[11px] leading-tight transition-colors",
                id === cause ? "text-ink" : "border-line text-muted hover:bg-panel-raised hover:text-ink",
              )}
              style={id === cause ? { borderColor: CAUSES[id].color, background: `${CAUSES[id].color}26` } : undefined}
            >
              <Dot color={CAUSES[id].color} />
              {CAUSES[id].name}
            </button>
          ))}
        </div>
        <Links links={[[TAB_CENTERS[at], 50]]} lit={0} color={color} />

        <CauseBranch cause={cause} paths={causePaths(cause, t, r)} />
        <Arrow color={color} />

        <Stage n={5} title="One list">
          <Tiles>
            <Tile name="Merge" value="overlaps" title="Two events of the same cause on the same tractors that overlap become one." />
            <Tile name="Cut" value="to the day" title="Each event is cut to the day being reported." />
            <Tile name="Cap" value={`${r.maxDetections} at most`} title={`The list holds at most ${r.maxDetections}. Multipath passes fill what the other causes leave, in time order.`} />
          </Tiles>
        </Stage>
        <Arrow />

        <ConfidenceStage cause={cause} rules={r} detection={selected?.cls === cause ? selected : null} />
        <Arrow color={color} />

        <Stage n={7} title="Detection out" color={color} aside={<CauseBadge cause={cause} />}>
          <p className="font-medium">{action}</p>
        </Stage>
      </div>
    </InfoPanel>
  );
}

/** A row of equal tiles inside a box. */
function Tiles({ children }: { children: ReactNode }) {
  return <div className="flex gap-1.5 [&>*]:flex-1">{children}</div>;
}

/** A name and a few words. `title` is the full explanation, shown on hover. */
function Tile({ name, value, title }: { name: string; value: string; title: string }) {
  return (
    <div title={title} className="rounded-md border border-line bg-panel px-2.5 py-1.5">
      <p className="text-xs font-semibold">{name}</p>
      <p className="tabular text-xs text-muted">{value}</p>
    </div>
  );
}
