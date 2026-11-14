/** What each of a detection's four evidence sentences is about, in the order the detector writes them. */
const LABELS = ["On the farm", "Other machines", "The sky", "Action"];

/** The four evidence sentences as labeled rows. */
export function EvidenceRows({ sentences }: { sentences: string[] }) {
  return (
    <dl className="grid grid-cols-[6.25rem_1fr] gap-x-3 gap-y-2.5">
      {sentences.map((sentence, i) => (
        <div key={i} className="contents">
          <dt className="text-xs font-medium leading-[1.6] text-muted">{LABELS[i] ?? ""}</dt>
          <dd className="m-0 text-[13px] leading-snug">{sentence}</dd>
        </div>
      ))}
    </dl>
  );
}
