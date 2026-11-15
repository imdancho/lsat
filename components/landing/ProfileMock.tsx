import { SAMPLE_SUMMARY, SAMPLE_TYPE_STATS } from "@/components/landing/sample";
import { StatTile, TypeMeters } from "@/components/ProgressCharts";

/** A still picture of the progress page, drawn with its real components and sample numbers. */
export function ProfileMock() {
  const { questionsDone, averageScore, correctPicks, picks, streakDays } = SAMPLE_SUMMARY;
  return (
    <figure>
      <div
        inert
        aria-hidden="true"
        className="rounded-2xl border border-line bg-paper p-4 shadow-sm sm:p-5"
      >
        <dl className="grid grid-cols-2 gap-3">
          <StatTile label="Questions done" value={String(questionsDone)} />
          <StatTile
            label="Average reasoning score"
            value={String(averageScore)}
            detail="out of 100"
          />
          <StatTile
            label="Multiple-choice accuracy"
            value={`${Math.round((correctPicks / picks) * 100)}%`}
            detail={`${correctPicks} of ${picks} right`}
          />
          <StatTile label="Day streak" value={String(streakDays)} detail="days in a row" />
        </dl>
        <div className="mt-3 rounded-xl border border-line bg-surface p-4 sm:p-5">
          <p className="font-serif text-lg font-semibold">
            Reasoning score by question type
          </p>
          <div className="mt-4">
            <TypeMeters stats={SAMPLE_TYPE_STATS} />
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-sm leading-relaxed text-muted">
        A sample profile after 18 questions. Flaw questions score lowest here,
        so that is the drill Prephrase would recommend.
      </figcaption>
    </figure>
  );
}
