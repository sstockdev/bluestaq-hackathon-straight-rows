import clsx from "clsx";
import { ChartColumn, Clock, Layers, Lightbulb, ListChecks, Satellite, TriangleAlert, type LucideIcon } from "lucide-react";
import { useApp, type PanelId } from "../state/store";
import { Panel } from "../ui/Panel";

const ITEMS: { id: PanelId; label: string; icon: LucideIcon }[] = [
  { id: "time", label: "Time", icon: Clock },
  { id: "layers", label: "Layers", icon: Layers },
  { id: "detections", label: "Detections", icon: ListChecks },
  { id: "sky", label: "Sky", icon: Satellite },
  { id: "why", label: "Why", icon: Lightbulb },
  { id: "score", label: "Score", icon: ChartColumn },
  { id: "limits", label: "Limits", icon: TriangleAlert },
];

/** The column of icons on the left. Each one opens its panel; clicking the open one closes it. */
export default function Rail() {
  const panel = useApp((s) => s.panel);
  const openPanel = useApp((s) => s.openPanel);
  return (
    <Panel className="flex flex-col gap-1 p-1.5">
      {ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => openPanel(panel === id ? null : id)}
          aria-pressed={panel === id}
          title={label}
          className={clsx(
            "flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] transition-colors",
            panel === id ? "bg-accent/20 text-ink ring-1 ring-accent" : "text-muted hover:bg-panel-raised hover:text-ink",
          )}
        >
          <Icon size={17} strokeWidth={1.75} />
          {label}
        </button>
      ))}
    </Panel>
  );
}
