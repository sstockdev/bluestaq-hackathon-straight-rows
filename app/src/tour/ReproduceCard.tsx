import { useApp } from "../state/store";
import { Panel } from "../ui/Panel";
import { REPRODUCE_COMMANDS, SCENES } from "./scenes";

/** The most the organizers' diagnostic score can be. */
const FULL_SCORE = 40;

/**
 * The card for the tour's "Reproduce it" stop: the two commands, and under
 * each one what it prints. The presenter runs them in a terminal. The card
 * tells the audience what to look for, and stands in if the terminal is hard
 * to read. The numbers come from the export, so they are what the command
 * really wrote. Renders nothing at any other stop.
 */
export default function ReproduceCard() {
  const step = useApp((s) => s.tourStep);
  const index = useApp((s) => s.index);
  if (step === null || !SCENES[step]?.commands || !index) return null;

  const { ours } = index.score;
  const written = index.submission ?? null;
  const prints = [
    [
      `Diagnostic on dev: ${ours.diagnostic.toFixed(2)}/${FULL_SCORE}`,
      written ? `OK: ${written.detections} detection(s); submission is well-formed.` : "OK: submission is well-formed.",
    ],
    [written ? `${written.sha256.slice(0, 16)}...` : "the checksum of the file"],
  ];

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-[560px] max-w-[calc(100%-24px)] -translate-x-1/2 -translate-y-1/2">
      <Panel className="px-5 py-4">
        <h2 className="font-condensed text-[26px] font-semibold leading-tight">One command rebuilds the submission</h2>
        <div className="mt-3 rounded-lg bg-page px-4 py-3 font-mono text-[13px] leading-relaxed">
          {REPRODUCE_COMMANDS.map((command, i) => (
            <div key={command} className={i > 0 ? "mt-3" : undefined}>
              <p className="m-0 text-ink">
                <span className="mr-2 text-faint">$</span>
                {command}
              </p>
              {prints[i].map((line) => (
                <p key={line} className="m-0 text-emerald-300">
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>
        <p className="mt-3 text-[14px] leading-snug text-muted">
          The checksum matches the file frozen before the evaluation output was looked at.
        </p>
      </Panel>
    </div>
  );
}
