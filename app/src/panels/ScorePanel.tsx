import { useApp } from "../state/store";
import { EpisodeTable } from "./info/EpisodeTable";
import { F1Bars } from "./info/F1Bars";
import { InfoPanel, SectionTitle } from "./info/InfoPanel";
import { ScoreTotal } from "./info/ScoreTotal";

/** The starter baseline against this detector on the labeled dev episodes, and what that result does not show. */
export default function ScorePanel() {
  const score = useApp((s) => s.index?.score);
  if (!score) return null;
  const { baseline, ours } = score;

  return (
    <InfoPanel
      title="Score"
      note={`${ours.total} labeled dev episodes, the organizers' scorer`}
      width="w-[420px]"
      footer={
        <p className="rounded-md border-l-2 border-amber-400 bg-amber-400/10 px-3 py-2 text-[13px] leading-snug">
          Every threshold was chosen on these {ours.total} episodes, so a full score here is expected. It does not predict
          the score on the evaluation day.
        </p>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <ScoreTotal name="Starter baseline" score={baseline} barClass="bg-faint" />
        <ScoreTotal name="This detector" score={ours} barClass="bg-accent" />
      </div>

      <section className="flex flex-col gap-2">
        <SectionTitle note="0 to 1">F1 per cause</SectionTitle>
        <F1Bars baseline={baseline} ours={ours} />
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>What each one reported</SectionTitle>
        <EpisodeTable baseline={baseline} ours={ours} />
      </section>
    </InfoPanel>
  );
}
