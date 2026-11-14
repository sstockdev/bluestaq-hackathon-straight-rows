import { useEffect, type ComponentType } from "react";
import FieldMap from "./map/FieldMap";
import DecisionsPanel from "./panels/DecisionsPanel";
import DetectionsPanel from "./panels/DetectionsPanel";
import EpisodePanel from "./panels/EpisodePanel";
import LayersPanel from "./panels/LayersPanel";
import LimitsPanel from "./panels/LimitsPanel";
import Rail from "./panels/Rail";
import ScorePanel from "./panels/ScorePanel";
import SkyPanel from "./panels/SkyPanel";
import { useApp, type PanelId } from "./state/store";
import { useUrlSync } from "./state/useUrlSync";
import TimeBar from "./time/TimeBar";
import TimePanel from "./time/TimePanel";
import { usePlayback } from "./time/usePlayback";
import TourCaption from "./tour/TourCaption";
import { useTour } from "./tour/useTour";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { Panel } from "./ui/Panel";

/** Which component each rail icon opens. */
const PANELS: Record<PanelId, ComponentType> = {
  time: TimePanel,
  layers: LayersPanel,
  detections: DetectionsPanel,
  sky: SkyPanel,
  why: DecisionsPanel,
  score: ScorePanel,
  limits: LimitsPanel,
};

/**
 * The whole screen: the map underneath, and floating over it a title card, the
 * icon rail with one open panel, the episode panel on the right, and the time
 * bar along the bottom. Every component reads what it needs from the store.
 */
export default function App() {
  const ready = useApp((s) => s.index !== null && s.day !== null);
  const error = useApp((s) => s.error);
  const panel = useApp((s) => s.panel);
  const start = useApp((s) => s.start);

  useEffect(() => {
    void start();
  }, [start]);
  usePlayback();
  useUrlSync();
  useTour();

  if (error) return <Message title="The app's data is missing" body={error} />;
  if (!ready) return <Message title="Straight Rows" body="Loading the field." />;

  const OpenPanel = panel ? PANELS[panel] : null;
  return (
    <div className="relative h-full w-full overflow-hidden">
      <ErrorBoundary fallback={<MapFailed />}>
        <FieldMap />
      </ErrorBoundary>
      {/* z-10 keeps the panels above the map's own canvases. */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-3 p-3">
        <div className="flex min-h-0 flex-1 items-start gap-3">
          {/* A definite height here lets an open panel cap itself with max-h-full and scroll. */}
          <div className="flex h-full min-h-0 flex-col gap-3">
            <TitleCard />
            <div className="flex min-h-0 flex-1 items-start gap-3">
              <Rail />
              {OpenPanel && <OpenPanel />}
            </div>
          </div>
          <div className="flex-1" />
          <EpisodePanel />
        </div>
        <TimeBar />
      </div>
      <TourCaption />
    </div>
  );
}

/** Shown in place of the map if it fails to draw. The panels keep working. */
function MapFailed() {
  return (
    <div className="flex h-full items-center justify-center text-muted">
      The map could not be drawn. Reload the page to try again.
    </div>
  );
}

function TitleCard() {
  return (
    <Panel className="w-fit px-4 py-2.5">
      <h1 className="font-condensed text-xl font-semibold leading-tight">Straight Rows</h1>
      <p className="text-xs text-muted">Why is the tractor drifting? Casselton, North Dakota.</p>
    </Panel>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <Panel className="max-w-md px-6 py-5">
        <h1 className="font-condensed text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-muted">{body}</p>
      </Panel>
    </div>
  );
}
