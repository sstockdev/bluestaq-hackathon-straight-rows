import { CAUSES } from "../lib/causes";
import { useApp } from "../state/store";
import { dayClock } from "../time/format";
import { Dot } from "../ui/CauseBadge";
import { Panel } from "../ui/Panel";
import { introClips } from "./intro";

/**
 * While the opening plays: the project's name in the top corner, and in the
 * bottom corner the cause the tractors are driving through and the time.
 */
export default function IntroCaption() {
  const clip = useApp((s) => s.introClip);
  const day = useApp((s) => s.day);
  // Whole minutes, so this redraws once a simulated minute and not on every frame.
  const minute = useApp((s) => Math.floor(s.clock / 60) * 60);
  const current = clip === null || !day ? undefined : introClips(day)[clip];
  if (!day || !current) return null;
  const { name, color } = CAUSES[current.cause];

  return (
    <>
      <div className="pointer-events-none absolute left-3 top-3 z-20">
        <Panel className="px-4 py-2">
          <h1 className="font-condensed text-xl font-semibold leading-tight">Straight Rows</h1>
        </Panel>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 z-20" role="status">
        <Panel className="flex items-center gap-3 px-3.5 py-2">
          <Dot color={color} />
          <span className="font-condensed text-xl font-semibold leading-tight">{name}</span>
          <span className="tabular text-xs text-muted">{dayClock(minute, day.t0)} UTC</span>
        </Panel>
      </div>
    </>
  );
}
