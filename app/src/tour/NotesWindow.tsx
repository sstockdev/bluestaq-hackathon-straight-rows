import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { openTourChannel, type TourMessage, type TourState } from "./presenter";
import { SCENES } from "./scenes";

/** Where the notes' text size is remembered between visits. */
const SCALE_KEY = "straight-rows-notes-scale";

/** The whole demo, in seconds: the sum of the stops. */
const TOTAL = SCENES.reduce((sum, scene) => sum + scene.seconds, 0);

/** "1:45" */
const minutes = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

/**
 * The presenter's notes, in their own window. It shows what to say and what to
 * point at for the tour stop the app window is on, the next stop, and a timer
 * against the five minutes. The arrow keys here move the tour in the app
 * window, so the presenter can keep this window in front.
 */
export default function NotesWindow() {
  const [tour, setTour] = useState<TourState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // Chrome keeps one zoom level per site, so zooming the app for the projector zooms these notes too.
  // The presenter sets the size back with - and +, and the choice is remembered.
  const [scale, setScale] = useState(() => Number(window.localStorage.getItem(SCALE_KEY)) || 1);
  const resize = (factor: number) =>
    setScale((before) => {
      const next = factor === 0 ? 1 : Math.min(2, Math.max(0.3, before * factor));
      window.localStorage.setItem(SCALE_KEY, String(next));
      return next;
    });
  const channel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    document.title = "Straight Rows notes";
    const link = openTourChannel();
    channel.current = link;
    link.onmessage = (event: MessageEvent<TourMessage>) => {
      if (event.data.type === "state") setTour(event.data);
    };
    link.postMessage({ type: "hello" } satisfies TourMessage);
    const tick = window.setInterval(() => setNow(Date.now()), 500);
    return () => {
      window.clearInterval(tick);
      link.close();
    };
  }, []);

  const step = tour?.step ?? null;
  const go = (to: number | null) => channel.current?.postMessage({ type: "go", step: to } satisfies TourMessage);
  const next = () => go(step === null ? 0 : Math.min(step + 1, SCENES.length - 1));
  const previous = () => step !== null && step > 0 && go(step - 1);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " ") next();
      else if (event.key === "ArrowLeft") previous();
      else if (event.key === "Escape") go(null);
      else if (event.key === "-") resize(0.9);
      else if (event.key === "=" || event.key === "+") resize(1 / 0.9);
      else if (event.key === "0") resize(0);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (tour === null) {
    return <Waiting title="Waiting for the app" body="Open the app in another window. These notes follow its tour." />;
  }
  if (step === null) {
    return (
      <Waiting title="The tour is not running" body="Press the right arrow here, or T in the app, to start at the first stop.">
        <ol className="mt-5 list-none space-y-1.5 p-0 text-[15px] text-muted">
          {SCENES.map((scene, i) => (
            <li key={scene.title} className="tabular flex gap-3">
              <span className="w-10 text-faint">{minutes(SCENES.slice(0, i).reduce((sum, s) => sum + s.seconds, 0))}</span>
              {scene.title}
            </li>
          ))}
        </ol>
      </Waiting>
    );
  }

  const scene = SCENES[step];
  const elapsed = tour.startedAt === null ? 0 : Math.max(0, (now - tour.startedAt) / 1000);
  const due = SCENES.slice(0, step + 1).reduce((sum, s) => sum + s.seconds, 0);
  const upcoming = SCENES[step + 1];

  return (
    <div className="flex flex-col gap-5 overflow-y-auto bg-page p-6" style={{ zoom: scale, height: `${100 / scale}%` }}>
      <header className="flex items-center gap-3">
        <span className="tabular text-sm text-muted">
          Stop {step + 1} of {SCENES.length}
        </span>
        <span className="flex gap-1" aria-hidden>
          {SCENES.map((stop, i) => (
            <span key={stop.title} className={clsx("h-1.5 w-6 rounded-full", i === step ? "bg-accent" : i < step ? "bg-faint" : "bg-line")} />
          ))}
        </span>
        <span className="ml-auto text-right">
          <span className={clsx("tabular block font-condensed text-[34px] font-semibold leading-none", elapsed > TOTAL ? "text-rose-400" : elapsed > due ? "text-amber-300" : "text-ink")}>
            {minutes(elapsed)}
          </span>
          <span className="tabular text-xs text-muted">
            move on by {minutes(due)}, end by {minutes(TOTAL)}
          </span>
        </span>
      </header>

      <div>
        <h1 className="font-condensed text-[38px] font-semibold leading-tight">{scene.title}</h1>
        <p className="mt-1 text-[15px] leading-snug text-muted">{scene.caption}</p>
      </div>

      <p className="rounded-lg bg-accent/15 px-4 py-3 text-[16px] leading-snug ring-1 ring-accent/50">
        <span className="mr-2 text-xs font-semibold text-muted">On screen</span>
        {scene.cue}
      </p>

      {scene.commands && (
        <pre className="m-0 rounded-lg bg-panel-raised px-4 py-3 font-mono text-[15px] leading-relaxed text-ink">{scene.commands.join("\n")}</pre>
      )}

      <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
        {scene.notes.map((line) => (
          <li key={line} className="border-l-2 border-line pl-4 text-[20px] leading-snug">
            {line}
          </li>
        ))}
      </ul>

      <footer className="mt-auto flex items-center gap-3 border-t border-line pt-4">
        <span className="text-sm text-muted">
          {upcoming ? `Next: ${upcoming.title}` : "Last stop. Questions are next."}
          <span className="ml-3 text-faint">- and + resize</span>
        </span>
        <button onClick={previous} disabled={step === 0} className="ml-auto flex h-9 items-center gap-1 rounded-md border border-line px-3 text-sm text-ink hover:bg-panel-raised disabled:opacity-35">
          <ChevronLeft size={16} aria-hidden />
          Previous
        </button>
        <button onClick={next} disabled={!upcoming} className="flex h-9 items-center gap-1 rounded-md bg-accent px-3 text-sm font-medium text-white hover:bg-accent/85 disabled:opacity-35">
          Next
          <ChevronRight size={16} aria-hidden />
        </button>
      </footer>
    </div>
  );
}

function Waiting({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <div className="flex h-full flex-col justify-center bg-page p-8">
      <h1 className="font-condensed text-[30px] font-semibold">{title}</h1>
      <p className="mt-2 text-[16px] text-muted">{body}</p>
      {children}
    </div>
  );
}
