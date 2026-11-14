import type { ReactNode } from "react";
import type { Detection, Episode, Thresholds } from "../../data/types";
import { driftChart, dropoutChart, linkChart, lossChart, signalChart, type ChartSpec } from "./charts";
import { LossSplit } from "./LossSplit";
import { TimeChart } from "./TimeChart";
import { useEpisode } from "./useEpisode";

/** Space weather, jamming, and a fault of kind "signal_loss" all show up as lost signal. */
function isSignalLoss({ cls, kind }: Detection): boolean {
  return cls === "SPACE_WEATHER" || cls === "JAMMING" || (cls === "EQUIPMENT_FAULT" && kind === "signal_loss");
}

/** The time charts that explain a detection, the one that gave the cause away first. */
function chartsFor(detection: Detection, episode: Episode, thresholds: Thresholds): ChartSpec[] {
  if (isSignalLoss(detection)) return [lossChart(episode, thresholds, false), signalChart(episode)];
  if (detection.cls === "SPOOFING") return [driftChart(episode, thresholds), lossChart(episode, thresholds, true)];
  if (detection.kind === "link") return [linkChart(episode)];
  return [dropoutChart(episode, thresholds)];
}

interface Props {
  detection: Detection;
  thresholds: Thresholds;
}

/**
 * The one picture that shows a detection. Lost signal is shown as each
 * tractor's drop, split into what the sky explains and what it does not.
 * Every other cause is shown by the measurement that gave it away, over time.
 */
export function LeadChart({ detection, thresholds }: Props) {
  const { episode, failed } = useEpisode(detection.id);
  if (failed) return <p className="text-xs text-muted">The series for this detection is missing.</p>;
  if (!episode) return <p className="text-xs text-muted">Loading the chart.</p>;

  if (isSignalLoss(detection)) return <LossSplit episode={episode} detection={detection} />;
  return <TimeChart spec={chartsFor(detection, episode, thresholds)[0]} detection={detection} />;
}

/**
 * The time charts LeadChart did not show, handed to `wrap` so the caller can
 * put a heading around them. Renders nothing when there are none.
 */
export function MoreCharts({ detection, thresholds, wrap }: Props & { wrap: (charts: ReactNode) => ReactNode }) {
  const { episode } = useEpisode(detection.id);
  if (!episode) return null;

  const all = chartsFor(detection, episode, thresholds);
  const rest = isSignalLoss(detection) ? all : all.slice(1);
  if (rest.length === 0) return null;
  return wrap(
    <div className="space-y-4">
      {rest.map((spec) => (
        <TimeChart key={spec.title} spec={spec} detection={detection} />
      ))}
    </div>,
  );
}
