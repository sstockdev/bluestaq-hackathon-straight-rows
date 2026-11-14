/** The detector's steps as a numbered list, in the order it took them. */
export function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="m-0 list-none space-y-2.5 p-0">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-[13px] leading-snug">
          <span className="tabular flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-panel-raised text-[11px] font-semibold text-muted ring-1 ring-line">
            {i + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}
