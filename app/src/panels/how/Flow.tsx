import type { ReactNode } from "react";

/** One numbered box of the flowchart. `color` tints it for the chosen cause. */
export function Stage({ n, title, color, aside, children }: {
  n: number;
  title: string;
  color?: string;
  /** Shown at the right end of the title row. */
  aside?: ReactNode;
  /** Left out, the box is its title row alone. */
  children?: ReactNode;
}) {
  return (
    <section
      className="rounded-lg border border-line bg-panel-raised/50 px-3 py-2.5"
      style={color ? { borderColor: `${color}80`, background: `${color}12` } : undefined}
    >
      <header className="flex items-center gap-2">
        <span className="tabular flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-panel text-[11px] font-semibold text-muted ring-1 ring-line">
          {n}
        </span>
        <h3 className="text-[13px] font-semibold">{title}</h3>
        {aside && <span className="ml-auto">{aside}</span>}
      </header>
      {children && <div className="mt-2 text-[13px] leading-snug">{children}</div>}
    </section>
  );
}

/** The arrow from one box down to the next. */
export function Arrow({ color = "var(--color-faint)", short }: { color?: string; short?: boolean }) {
  const height = short ? 14 : 18;
  return (
    <svg width="12" height={height} viewBox={`0 0 12 ${height}`} className="mx-auto block shrink-0" aria-hidden>
      <path d={`M6 1V${height - 3}`} stroke={color} strokeWidth="1.5" />
      <path d={`M2 ${height - 6}L6 ${height - 2}L10 ${height - 6}`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Curved lines from the box above to the boxes below. Each link is [from, to],
 * both as a share of the width from 0 to 100. The `lit` link is drawn in `color`.
 */
export function Links({ links, lit, color }: { links: [number, number][]; lit?: number; color?: string }) {
  const path = ([from, to]: [number, number]) => `M${from} 0C${from} 14 ${to} 10 ${to} 24`;
  return (
    // The drawing stretches to the width, and the strokes keep their thickness.
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="block h-6 w-full" aria-hidden>
      {links.map((link, i) => i !== lit && (
        <path key={i} d={path(link)} fill="none" stroke="var(--color-line)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      ))}
      {lit !== undefined && <path d={path(links[lit])} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}
