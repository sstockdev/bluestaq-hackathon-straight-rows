/** Where the flagged seconds sit in the drawing: two runs with a short gap between them, and one stray run. */
const RUNS: [number, number][] = [[2, 120], [146, 236], [300, 322]];
const TICK = 4;

/**
 * A drawing of how flagged seconds become events. The top row is the seconds a
 * detector flagged. In the bottom row the two runs with a short gap between them
 * have become one event, and the stray run is gone. The two labels say how long
 * a gap is bridged and how short an event is dropped.
 */
export function EventStrip({ color, gapLabel, dropLabel }: { color: string; gapLabel: string; dropLabel: string }) {
  const [first, second, stray] = RUNS;
  const ticks = RUNS.flatMap(([from, to]) => Array.from({ length: Math.floor((to - from) / TICK) }, (_, i) => from + i * TICK));
  return (
    <svg viewBox="0 0 340 50" className="block w-full" role="img" aria-label={`Flagged seconds become one event. ${gapLabel}. ${dropLabel}.`}>
      {ticks.map((x) => (
        <rect key={x} x={x} y="1" width="2.4" height="10" rx="1" fill={color} opacity="0.75" />
      ))}
      <g className="fill-muted text-[10px]">
        <text x={(first[1] + second[0]) / 2} y="27" textAnchor="middle">{gapLabel}</text>
        <text x="338" y="27" textAnchor="end">{dropLabel}</text>
      </g>
      <rect x={first[0]} y="36" width={second[1] - first[0]} height="11" rx="3" fill={color} />
      <rect x={stray[0]} y="36.5" width={stray[1] - stray[0]} height="10" rx="3" fill="none" stroke="var(--color-faint)" strokeDasharray="3 2.5" />
    </svg>
  );
}
