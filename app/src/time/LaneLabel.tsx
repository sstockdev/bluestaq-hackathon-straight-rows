/** A lane's name in the gutter on the left of the time bar, centered on the lane. */
export function LaneLabel({ y, height, text, dot }: { y: number; height: number; text: string; dot?: string }) {
  const middle = y + height / 2;
  return (
    <g>
      {dot && <circle cx={5} cy={middle} r={3.5} fill={dot} />}
      <text x={dot ? 14 : 0} y={middle} dominantBaseline="central" className="fill-muted text-[11px]">
        {text}
      </text>
    </g>
  );
}
