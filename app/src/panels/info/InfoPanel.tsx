import clsx from "clsx";
import type { ReactNode } from "react";
import { Panel, PanelHeader } from "../../ui/Panel";

/**
 * The frame the Sky, Why, Score, and Limits panels share: a fixed width, a header
 * that stays put, a body that scrolls, and an optional footer that stays in view.
 *
 * `self-stretch` is what keeps the panel above the time bar. The row it sits in
 * (in App.tsx) has no definite height, so `max-h-full` alone resolves to nothing.
 * `relative z-10` keeps it above the map's deck.gl canvas, which sits at z-index 2.
 */
export function InfoPanel({
  title,
  note,
  width,
  footer,
  children,
}: {
  title: string;
  note?: string;
  /** A Tailwind width class, such as "w-[420px]". */
  width: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Panel
      className={clsx(
        width,
        "relative z-10 max-h-full self-stretch overflow-y-auto [scrollbar-color:var(--color-line)_transparent] [scrollbar-width:thin]",
      )}
    >
      <div className="sticky top-0 z-10 rounded-t-xl bg-panel">
        <PanelHeader title={title} note={note} />
      </div>
      <div className="flex flex-col gap-4 px-4 py-4">{children}</div>
      {footer && <div className="sticky bottom-0 z-10 rounded-b-xl border-t border-line bg-panel px-4 py-3">{footer}</div>}
    </Panel>
  );
}

/** A small heading inside a panel, with an optional note on the right. */
export function SectionTitle({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="text-[13px] font-semibold">{children}</h3>
      {note && <span className="text-xs text-faint">{note}</span>}
    </div>
  );
}
