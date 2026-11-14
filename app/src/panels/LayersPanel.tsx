import clsx from "clsx";
import type { ReactNode } from "react";
import type { Cause, Thresholds } from "../data/types";
import { CAUSES, DRIFT_EXAGGERATION, HEALTHY_RGB, TRACTOR_COLOR } from "../lib/causes";
import { useApp, type LayerId } from "../state/store";
import { Panel, PanelHeader } from "../ui/Panel";
import { Switch } from "../ui/Switch";

const LAYERS: { id: LayerId; title: string; text: string }[] = [
  { id: "rows", title: "Rows planted", text: "Each row takes the color of the cause detected while it was planted." },
  { id: "hexes", title: "Unexplained signal loss", text: "The largest loss seen in each cell during the last 30 minutes." },
  { id: "spoofing", title: "Spoofing drift", text: `Where the receiver says the tractor is. The drift is drawn ${DRIFT_EXAGGERATION} times larger than real.` },
  { id: "reports", title: "Interference reports", text: "Reports arrive 10 to 30 minutes late and carry no direction." },
  { id: "multipath", title: "Multipath spot", text: "The headland where a short dip recurs on every pass." },
  { id: "labels", title: "True episodes (dev days)", text: "A lane on the time bar with the labeled episodes." },
  { id: "baseline", title: "Starter baseline", text: "A lane on the time bar with the simpler detector's calls." },
];

/** The causes a planted row can be colored by. Multipath is never drawn on rows. */
const ROW_CAUSES: Cause[] = ["SPACE_WEATHER", "JAMMING", "SPOOFING", "EQUIPMENT_FAULT"];
const HEALTHY = `rgb(${HEALTHY_RGB.join(" ")})`;
const JAM = CAUSES.JAMMING.color;
const SPOOF = CAUSES.SPOOFING.color;

/** A switch and a legend for every map layer and time bar lane. */
export default function LayersPanel() {
  const layers = useApp((s) => s.layers);
  const toggleLayer = useApp((s) => s.toggleLayer);
  const thresholds = useApp((s) => s.index?.thresholds);
  // The evaluation day has no labels, so that lane cannot be switched on.
  const noLabels = useApp((s) => s.day?.kind === "eval");
  if (!thresholds) return null;

  const isOn = (id: LayerId) => layers[id] && !(id === "labels" && noLabels);
  return (
    // The wrapper takes the height left above the time bar, and the panel scrolls inside it when it is taller.
    <div className="flex min-h-0 flex-col self-stretch">
      <Panel className="min-h-0 w-[340px] overflow-y-auto">
        <PanelHeader title="Layers" note={`${LAYERS.filter(({ id }) => isOn(id)).length} of ${LAYERS.length} on`} />
        {LAYERS.map(({ id, title, text }) => {
          const disabled = id === "labels" && noLabels;
          return (
            <div key={id} className="border-b border-line/60 px-4 py-3 last:border-b-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className={clsx("text-[13.5px] font-medium", disabled && "text-faint")}>{title}</h3>
                {/* Switch has no disabled prop, so `inert` takes it out of reach instead. */}
                <div inert={disabled} className={clsx("flex", disabled && "opacity-40")}>
                  <Switch checked={isOn(id)} onChange={() => toggleLayer(id)} label={title} />
                </div>
              </div>
              <p className="mt-0.5 pr-10 text-xs text-muted">{disabled ? "The evaluation day has no labels." : text}</p>
              <div className={clsx("mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5", disabled && "opacity-40")}>
                <Legend id={id} thresholds={thresholds} />
              </div>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}

/** The legend for one layer, drawn in the colors the layer uses. */
function Legend({ id, thresholds }: { id: LayerId; thresholds: Thresholds }) {
  switch (id) {
    case "rows":
      return (
        <>
          <Key label="Healthy">{line(HEALTHY)}</Key>
          {ROW_CAUSES.map((cause) => (
            <Key key={cause} label={CAUSES[cause].name}>{line(CAUSES[cause].color)}</Key>
          ))}
        </>
      );
    case "hexes":
      return (
        <>
          <Key label={`Low, ${thresholds.jamMember} dB`}>{hexagon(0.3)}</Key>
          <Key label={`Medium, ${thresholds.jamTrigger} dB`}>{hexagon(0.6)}</Key>
          <Key label="High, 10 dB">{hexagon(1)}</Key>
        </>
      );
    case "spoofing":
      return (
        <Key label="Reported position, joined to the tractor">
          <svg width="46" height="14" aria-hidden>
            <line x1="8" x2="38" y1="7" y2="7" stroke={SPOOF} strokeWidth="1.5" />
            <circle cx="7" cy="7" r="5" fill="var(--color-panel)" stroke={SPOOF} strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="39" cy="7" r="5" fill={TRACTOR_COLOR.T1.color} />
          </svg>
        </Key>
      );
    case "reports":
      return (
        <Key label="Area the report covers">
          <svg width="26" height="14" aria-hidden>
            <ellipse cx="13" cy="7" rx="11" ry="5.5" fill={JAM} fillOpacity="0.12" stroke={JAM} strokeWidth="1.5" />
          </svg>
        </Key>
      );
    case "multipath":
      return <Key label="Across the field at the spot">{line(CAUSES.MULTIPATH.color, true)}</Key>;
    case "labels":
      return <Key label="One block per episode">{lane(["JAMMING", "SPOOFING"], false)}</Key>;
    case "baseline":
      return <Key label="One block per call">{lane(["SPACE_WEATHER", "JAMMING"], true)}</Key>;
  }
}

function Key({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted">
      {children}
      {label}
    </span>
  );
}

const line = (color: string, dashed = false) => (
  <svg width="20" height="6" aria-hidden>
    <line x1="2" x2="18" y1="3" y2="3" stroke={color} strokeWidth="3" strokeLinecap={dashed ? "butt" : "round"} strokeDasharray={dashed ? "4 3" : undefined} />
  </svg>
);

const hexagon = (strength: number) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <polygon points="8,1 14.1,4.5 14.1,11.5 8,15 1.9,11.5 1.9,4.5" fill={JAM} fillOpacity={strength} stroke={JAM} strokeOpacity="0.5" />
  </svg>
);

const lane = (causes: Cause[], outlined: boolean) => (
  <span className="flex h-2.5 w-14 items-stretch gap-2 rounded-sm bg-line/70 px-1.5">
    {causes.map((cause) => (
      <span
        key={cause}
        className="flex-1 rounded-[1px]"
        style={outlined ? { boxShadow: `inset 0 0 0 1.5px ${CAUSES[cause].color}` } : { background: CAUSES[cause].color }}
      />
    ))}
  </span>
);
