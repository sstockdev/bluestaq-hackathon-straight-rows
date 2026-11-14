import { useApp } from "../state/store";
import { Panel, PanelHeader } from "../ui/Panel";
import { DayPicker } from "./DayPicker";
import { dayClock } from "./format";
import { PlaybackControls } from "./PlaybackControls";
import { RangePicker } from "./RangePicker";
import { SpeedPicker } from "./SpeedPicker";

/** The Time panel: pick the day, play or step the clock, and choose the stretch of the day to look at. */
export default function TimePanel() {
  const day = useApp((s) => s.day);
  const info = useApp((s) => s.index?.days.find((d) => d.date === s.day?.date));
  const range = useApp((s) => s.range);
  if (!day) return null;

  const note = `${info?.label ?? day.date}, ${dayClock(range[0], day.t0)} to ${dayClock(range[1], day.t0)}`;
  return (
    <Panel className="max-h-full min-h-0 w-[340px] overflow-y-auto">
      <PanelHeader title="Time" note={note} />
      <div className="flex flex-col gap-4 px-4 py-4">
        <DayPicker />
        <ClockReadout />
        <PlaybackControls />
        <SpeedPicker />
        <RangePicker />
        <p className="text-xs text-faint">
          Space plays and pauses. <Key>[</Key> and <Key>]</Key> step through the detections.
        </p>
      </div>
    </Panel>
  );
}

/** The current clock in large type. It reads the clock itself, so playback redraws only this line. */
function ClockReadout() {
  const now = useApp((s) => s.clock);
  const midnight = useApp((s) => s.day?.t0 ?? 0);
  return (
    <p className="tabular text-center font-condensed text-[44px] font-semibold leading-none">
      {dayClock(now, midnight, true)}
      <span className="ml-2 font-sans text-sm font-medium text-muted">UTC</span>
    </p>
  );
}

function Key({ children }: { children: string }) {
  return <kbd className="rounded border border-line bg-panel-raised px-1 font-sans text-[11px] text-muted">{children}</kbd>;
}
