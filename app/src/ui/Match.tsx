import { CircleAlert, CircleCheck } from "lucide-react";

/** On a dev day: the true episode a detection matches, or a warning that it matches none. */
export function Match({ label }: { label: string | null }) {
  return (
    <span className="tabular flex items-center gap-1 text-[11px] font-normal text-muted" title={label ? `Matches true episode ${label}` : "Matches no true episode"}>
      {label ? <CircleCheck size={12} className="text-emerald-400" /> : <CircleAlert size={12} className="text-amber-400" />}
      {label ?? "no match"}
    </span>
  );
}
