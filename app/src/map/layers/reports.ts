import type { Layer } from "@deck.gl/core";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { Day, Report } from "../../data/types";
import { CAUSES } from "../../lib/causes";
import { offsetMeters } from "../geo";
import { LABEL_STYLE, withAlpha } from "./style";

/** How long a report stays on the map after it arrives, in seconds. */
const SHOWN_FOR = 3600;

/** Reports are about radio interference, so they share the jamming color. */
const COLOR = CAUSES.JAMMING.rgb;

/** A report's id and where to write it. */
interface ReportLabel {
  text: string;
  position: [number, number];
}

/**
 * The point on a report's inner circle nearest the field. A report's center is
 * often off screen when the camera is on the field, so the id is repeated here.
 */
function nearestEdge(report: Report, field: [number, number]): [number, number] {
  const east = (field[0] - report.lon) * Math.cos((report.lat * Math.PI) / 180);
  const north = field[1] - report.lat;
  const length = Math.hypot(east, north) || 1;
  const radius = report.semiMinorKm * 1000;
  return offsetMeters([report.lon, report.lat], (east / length) * radius, (north / length) * radius);
}

/**
 * Interference reports, each shown for an hour after it arrives: an outline at
 * the semi-major radius, a faint fill at the semi-minor radius, a dot at the
 * center, and the report's id. The feed gives no orientation, so both are circles.
 */
export function reportLayers(day: Day, clock: number, field: [number, number]): Layer[] {
  const shown = day.reports.filter((report) => clock >= report.t && clock < report.t + SHOWN_FOR);
  const center = (report: Report): [number, number] => [report.lon, report.lat];
  const labels: ReportLabel[] = shown.flatMap((report) => [
    { text: report.id, position: center(report) },
    { text: `${report.id} report area`, position: nearestEdge(report, field) },
  ]);
  return [
    new ScatterplotLayer<Report>({
      id: "report-inner",
      data: shown,
      getPosition: center,
      radiusUnits: "meters",
      getRadius: (report) => report.semiMinorKm * 1000,
      getFillColor: withAlpha(COLOR, 24),
      stroked: true,
      lineWidthUnits: "pixels",
      getLineWidth: 1,
      getLineColor: withAlpha(COLOR, 110),
    }),
    new ScatterplotLayer<Report>({
      id: "report-outer",
      data: shown,
      getPosition: center,
      radiusUnits: "meters",
      getRadius: (report) => report.semiMajorKm * 1000,
      filled: false,
      stroked: true,
      lineWidthUnits: "pixels",
      getLineWidth: 2,
      getLineColor: withAlpha(COLOR, 230),
    }),
    new ScatterplotLayer<Report>({
      id: "report-centers",
      data: shown,
      getPosition: center,
      radiusUnits: "pixels",
      getRadius: 4,
      getFillColor: withAlpha(COLOR, 255),
    }),
    new TextLayer<ReportLabel>({
      ...LABEL_STYLE,
      id: "report-labels",
      data: labels,
      getPosition: (label) => label.position,
      getText: (label) => label.text,
      getSize: 12,
      getColor: withAlpha(COLOR, 255),
      getTextAnchor: "start",
      getAlignmentBaseline: "center",
      getPixelOffset: [9, 0],
    }),
  ];
}
