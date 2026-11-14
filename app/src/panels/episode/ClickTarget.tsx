import { usePlotArea, useXAxisInverseScale, ZIndexLayer } from "recharts";

/** Above every other layer of the chart, so a click anywhere on the plot reaches the sheet. */
const ON_TOP = 3000;

/**
 * An invisible sheet over a chart's plot. A click on it reports the time under
 * the pointer. The chart's own onClick only knows the time while its tooltip is
 * showing, so this reads the position from the x axis instead.
 */
export function ClickTarget({ onPick }: { onPick: (time: number) => void }) {
  const plot = usePlotArea();
  const timeAt = useXAxisInverseScale();
  if (!plot || !timeAt) return null;
  return (
    <ZIndexLayer zIndex={ON_TOP}>
      <rect
        x={plot.x}
        y={plot.y}
        width={plot.width}
        height={plot.height}
        fill="transparent"
        onClick={(event) => {
          const chart = event.currentTarget.ownerSVGElement;
          if (!chart) return;
          const time = Number(timeAt(event.clientX - chart.getBoundingClientRect().left));
          if (Number.isFinite(time)) onPick(Math.round(time));
        }}
      />
    </ZIndexLayer>
  );
}
