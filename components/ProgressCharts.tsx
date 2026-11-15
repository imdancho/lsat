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
 * per row. All five types are always listed, in the same order, so a type that
 * has not been tried shows as an empty track rather than disappearing.
 */
export function TypeMeters({ stats }: { stats: Record<QuestionType, TypeStats> }) {
  return (
    <ul className="space-y-4">
      {QUESTION_TYPES.map((type) => {
        const { attempts, averageScore } = stats[type];
        const label = QUESTION_TYPE_INFO[type].label;
        const score = averageScore === null ? null : Math.round(averageScore);
        return (
          <li
            key={type}
            className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1.5 sm:grid-cols-[13rem_1fr_9rem] sm:items-center"
          >
            <span className="font-medium">{label}</span>
            <span className="text-sm text-muted sm:order-last sm:text-right">
              {score === null ? (
                "Not tried yet"
              ) : (
                <>
                  <span className="font-semibold text-ink">{score}</span> / 100
                  {" · "}
                  {attemptsLabel(attempts)}
                </>
              )}
            </span>
            {/* The figure beside the bar carries the value, so the bar itself is decorative. */}
            <div
              aria-hidden="true"
              className="col-span-2 h-2.5 rounded-r bg-data-track sm:col-span-1"
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
