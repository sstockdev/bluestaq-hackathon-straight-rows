import { Fragment, useEffect, useState, type ReactNode } from "react";
import { loadIndex } from "../data/load";
import type { Index } from "../data/types";
import { CAUSES } from "../lib/causes";
import { Dot } from "../ui/CauseBadge";
import clsx from "clsx";
import type { Rules } from "../data/types";
import { APPROACH, BUILD, confidenceRows, ruleRows, type Reason } from "./reference";
import { useScale } from "./useScale";

/** Text with **bold** and `code` marks, as elements. */
function marked(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((part, i) => {
    if (part.startsWith("**")) return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`")) return <code key={i} className="rounded bg-panel-raised px-1 py-px font-mono text-[0.92em] text-ink">{part.slice(1, -1)}</code>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

const HEAD = "text-left text-xs text-faint [&>th]:border-b [&>th]:border-line [&>th]:px-2.5 [&>th]:py-1.5 [&>th]:font-normal";
const ROW = "align-top [&>td]:border-b [&>td]:border-line/60 [&>td]:px-2.5 [&>td]:py-2.5";

/** A table of choices: what was chosen, why, and what it was chosen over or what it costs. */
function Reasons({ title, last, rows }: { title: string; last: string; rows: Reason[] }) {
  return (
    <section>
      <h2 className="mb-1 text-[15px] font-semibold">{title}</h2>
      <table className="w-full border-collapse text-[14px] leading-snug">
        <thead>
          <tr className={HEAD}>
            <th className="w-[27%]">I chose</th>
            <th>Because</th>
            <th className="w-[27%]">{last}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.choice} className={ROW}>
              <td className="font-semibold">{marked(row.choice)}</td>
              <td>{marked(row.because)}</td>
              <td className="text-muted">{marked(row.other)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** One confidence term as a chip: its weight, then a few words. */
function Term({ label, weight }: { label: string; weight: number }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-panel py-0.5 pl-1 pr-2.5 text-[13px] ring-1 ring-line">
      <span className={clsx("tabular rounded-full px-1.5 py-px font-semibold", weight >= 0 ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300")}>
        {weight >= 0 ? "+" : "-"}
        {Math.abs(weight).toFixed(2)}
      </span>
      {label}
    </span>
  );
}

/** What adds to and what subtracts from the confidence of each cause. */
function Confidence({ rules }: { rules: Rules }) {
  const c = rules.confidence;
  return (
    <section>
      <h2 className="mb-1 flex items-baseline gap-3 text-[15px] font-semibold">
        Confidence
        <span className="tabular text-xs font-normal text-muted">
          starts at {c.base.toFixed(2)}, kept between {c.min.toFixed(2)} and {c.max.toFixed(2)}, capped at {c.noS4Cap.toFixed(2)} with no S4 and {c.singleLossCap.toFixed(2)} for one machine alone
        </span>
      </h2>
      <table className="w-full border-collapse text-[14px] leading-snug">
        <thead>
          <tr className={HEAD}>
            <th className="w-[16%]">Cause</th>
            <th>Adds</th>
            <th className="w-[27%]">Subtracts</th>
          </tr>
        </thead>
        <tbody>
          {confidenceRows(rules).map(({ name, cause, adds, subtracts }) => (
            <tr key={name} className={ROW}>
              <td className="whitespace-nowrap font-semibold">
                <span className="flex items-center gap-2">
                  <Dot color={CAUSES[cause].color} />
                  {name}
                </span>
              </td>
              <td>
                <span className="flex flex-wrap gap-1.5">
                  {adds.map(([label, weight]) => (
                    <Term key={label} label={label} weight={weight} />
                  ))}
                </span>
              </td>
              <td>
                {subtracts.length === 0 ? (
                  <span className="text-muted">none</span>
                ) : (
                  <span className="flex flex-wrap gap-1.5">
                    {subtracts.map(([label, weight]) => (
                      <Term key={label} label={label} weight={weight} />
                    ))}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/**
 * The presenter's second window, titled "Presenting Notes 2". It is a
 * reference: the five rules side by side, what adds to and subtracts from
 * confidence, why the detector takes the approach it does, and why the code is
 * built the way it is.
 */
export default function Reference() {
  const [index, setIndex] = useState<Index | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const { style } = useScale("straight-rows-reference-scale");

  useEffect(() => {
    document.title = "Presenting Notes 2";
    loadIndex().then(setIndex, (error: unknown) => setFailed(error instanceof Error ? error.message : String(error)));
  }, []);

  return (
    <div className="flex flex-col gap-6 overflow-y-auto bg-page p-5" style={style}>
      <header className="flex items-baseline gap-4">
        <h1 className="font-condensed text-[28px] font-semibold leading-none">Presenting Notes 2</h1>
        <span className="ml-auto text-xs text-faint">- and + resize</span>
      </header>
      {failed && <p className="text-sm text-muted">{failed}</p>}
      {index && (
        <section>
        <h2 className="mb-1 text-[15px] font-semibold">The five rules, each as a footprint</h2>
        <table className="w-full border-collapse text-[14px] leading-snug">
          <thead>
            <tr className={HEAD}>
              <th>Cause</th>
              <th>Footprint</th>
              <th>A second is flagged when</th>
              <th>Check on each event</th>
              <th>What it is kept apart from</th>
            </tr>
          </thead>
          <tbody>
            {ruleRows(index.thresholds, index.rules).map((row) => (
              <tr key={row.name} className={ROW}>
                <td className="whitespace-nowrap font-semibold">
                  <span className="flex items-center gap-2">
                    <Dot color={CAUSES[row.cause].color} />
                    {row.name}
                  </span>
                </td>
                <td className="text-muted">{row.footprint}</td>
                <td>{marked(row.flagged)}</td>
                <td>{marked(row.check)}</td>
                <td className="text-muted">{row.apart}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </section>
      )}
      {index && <Confidence rules={index.rules} />}
      <Reasons title="Why this approach" last="Instead of" rows={APPROACH} />
      <Reasons title="Why the code is built this way" last="What it costs" rows={BUILD} />
    </div>
  );
}
