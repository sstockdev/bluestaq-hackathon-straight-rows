import { useMemo } from "react";
import type { Detection, Episode, Thresholds } from "../../data/types";
import { CAUSES } from "../../lib/causes";
import { driftChart, dropoutChart, linkChart, lossChart, signalChart, type ChartSpec } from "./charts";
import { LossSplit } from "./LossSplit";
import { TimeChart } from "./TimeChart";
import { useEpisode } from "./useEpisode";

/** Space weather, jamming, and a fault of kind "signal_loss" all show up as lost signal. */
function isSignalLoss({ cls, kind }: Detection): boolean {
  return cls === "SPACE_WEATHER" || cls === "JAMMING" || (cls === "EQUIPMENT_FAULT" && kind === "signal_loss");
}

/** Which charts explain a detection. Each cause is shown by the measurement that gave it away. */
function chartsFor(detection: Detection, episode: Episode, thresholds: Thresholds): ChartSpec[] {
  if (isSignalLoss(detection)) return [signalChart(episode), lossChart(episode, thresholds, false)];
  if (detection.cls === "SPOOFING") return [driftChart(episode, thresholds), lossChart(episode, thresholds, true)];
  if (detection.kind === "link") return [linkChart(episode)];
  return [dropoutChart(episode, thresholds)];
}

/** The charts for the selected detection, loaded from its episode file. */
export function EpisodeCharts({ detection, thresholds }: { detection: Detection; thresholds: Thresholds }) {
  const { episode, failed } = useEpisode(detection.id);
  const specs = useMemo(() => (episode ? chartsFor(detection, episode, thresholds) : []), [detection, episode, thresholds]);

  if (failed) return <p className="text-xs text-muted">The series for this detection is missing.</p>;
  if (!episode) return <p className="text-xs text-muted">Loading the charts.</p>;

  return (
    <div className="space-y-4">
      {isSignalLoss(detection) && <LossSplit episode={episode} detection={detection} />}
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-sm" style={{ background: CAUSES[detection.cls].color, opacity: 0.3 }} />
          This detection
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-ink" />
          Time on the map
        </span>
        <span className="text-faint">Click a chart to move the time.</span>
      </p>
      {specs.map((spec) => (
        <TimeChart key={spec.title} spec={spec} detection={detection} />
      ))}
    </div>
  );
}
