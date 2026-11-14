import clsx from "clsx";
import type { ReactNode } from "react";

/** A floating card over the map: the dark, slightly translucent surface every panel sits on. */
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={clsx(
        "pointer-events-auto rounded-xl border border-line bg-panel/95 shadow-2xl shadow-black/50 backdrop-blur",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** The title row at the top of a panel. */
export function PanelHeader({ title, note, children }: { title: string; note?: string; children?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
      <div>
        <h2 className="text-[15px] font-semibold leading-tight">{title}</h2>
        {note && <p className="tabular mt-0.5 text-xs text-muted">{note}</p>}
      </div>
      {children}
    </header>
  );
}
