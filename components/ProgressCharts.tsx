import type { TypeStats } from "@/lib/stats";
import { QUESTION_TYPE_INFO } from "@/lib/taxonomy";
import { QUESTION_TYPES, type QuestionType } from "@/lib/types";

/** One headline number with its label. Use inside a <dl>. */
export function StatTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 text-3xl font-semibold tracking-tight">{value}</dd>
      {detail && <dd className="mt-0.5 text-sm text-muted">{detail}</dd>}
    </div>
  );
}

const attemptsLabel = (count: number) =>
  `${count} ${count === 1 ? "attempt" : "attempts"}`;

/**
 * Average reasoning score for each question type: a name, a bar and a figure
 * per row, with multiple-choice accuracy as a second figure. All five types
 * are always listed, in the same order, so a type that has not been tried
 * shows as an empty track rather than disappearing.
 *
 * The row layout follows the width of the list itself (a container query), not
 * of the screen, because the list also appears in a narrow column on the
 * landing page.
 */
export function TypeMeters({ stats }: { stats: Record<QuestionType, TypeStats> }) {
  return (
    <ul className="@container space-y-4">
      {QUESTION_TYPES.map((type) => {
        const { attempts, averageScore, picks, correctPicks } = stats[type];
        const label = QUESTION_TYPE_INFO[type].label;
        const score = averageScore === null ? null : Math.round(averageScore);
        return (
          <li
            key={type}
            className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1.5 @lg:grid-cols-[13rem_1fr_9rem] @lg:items-center"
          >
            <span className="font-medium">{label}</span>
            <span className="text-sm text-muted @lg:order-last @lg:text-right">
              {score === null ? (
                picks > 0 ? (
                  "No graded answers yet"
                ) : (
                  "Not tried yet"
                )
              ) : (
                <>
                  <span className="font-semibold text-ink">{score}</span> / 100
                  {" · "}
                  {attemptsLabel(attempts)}
                </>
              )}
              {picks > 0 && (
                <span className="block text-xs">
                  {correctPicks} of {picks} {picks === 1 ? "choice" : "choices"} right
                </span>
              )}
            </span>
            {/* The figure beside the bar carries the value, so the bar itself is decorative. */}
            <div
              aria-hidden="true"
              className="col-span-2 h-2.5 rounded-r bg-data-track @lg:col-span-1"
            >
              {score !== null && score > 0 && (
                <div
                  className="h-full rounded-r bg-data"
                  style={{ width: `${score}%` }}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
