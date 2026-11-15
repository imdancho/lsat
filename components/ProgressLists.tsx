import Link from "next/link";
import type { Tally } from "@/lib/stats";
import { MISTAKE_TAG_INFO, QUESTION_TYPE_INFO, TRAP_TAG_INFO } from "@/lib/taxonomy";
import type {
  Attempt,
  QuestionSummary,
  StudentMistakeTag,
  TrapTag,
} from "@/lib/types";

const times = (count: number) => (count === 1 ? "once" : `${count} times`);

/** The mistakes tagged most often, each with a way to work on it. */
export function MistakeList({ mistakes }: { mistakes: Tally<StudentMistakeTag>[] }) {
  if (mistakes.length === 0) {
    return (
      <p className="text-muted">
        No reasoning mistakes tagged so far. Keep going and they will show up
        here if a pattern forms.
      </p>
    );
  }
  return (
    <ol className="space-y-4">
      {mistakes.map(({ tag, count }) => (
        <li key={tag} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1 basis-56">
            <p className="font-medium">
              {MISTAKE_TAG_INFO[tag].label}{" "}
              <span className="font-normal text-muted">· {times(count)}</span>
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted">
              {MISTAKE_TAG_INFO[tag].description}
            </p>
          </div>
          <Link
            href={`/lessons/${tag}`}
            aria-label={`Fix this: ${MISTAKE_TAG_INFO[tag].label}`}
            className="shrink-0 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-accent"
          >
            Fix this
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** The kinds of wrong answer choice picked most often. */
export function TrapList({ traps }: { traps: Tally<TrapTag>[] }) {
  if (traps.length === 0) {
    return (
      <p className="text-muted">
        You have not picked a wrong answer choice yet. When you do, the kind of
        trap it was is counted here.
      </p>
    );
  }
  return (
    <ol className="space-y-4">
      {traps.map(({ tag, count }) => (
        <li key={tag}>
          <p className="font-medium">
            {TRAP_TAG_INFO[tag].label}{" "}
            <span className="font-normal text-muted">· picked {times(count)}</span>
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted">
            {TRAP_TAG_INFO[tag].description}
          </p>
        </li>
      ))}
    </ol>
  );
}

const dayFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function pickLabel(attempt: Attempt): string {
  if (attempt.mcqCorrect === null) return "No choice picked";
  return attempt.mcqCorrect ? "✓ Right choice" : "✗ Wrong choice";
}

/** The latest attempts, newest first, each with a link to try the question again. */
export function RecentAttempts({
  attempts,
  questions,
}: {
  attempts: Attempt[];
  questions: QuestionSummary[];
}) {
  const topics = new Map(questions.map((q) => [q.id, q.topic]));
  return (
    <ul className="divide-y divide-line">
      {attempts.map((attempt) => (
        <li
          key={attempt.at}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
        >
          <div className="min-w-0 flex-1 basis-56">
            <p className="font-medium first-letter:uppercase">
              {topics.get(attempt.questionId) ?? "Question no longer in the bank"}
            </p>
            <p className="text-sm text-muted">
              {QUESTION_TYPE_INFO[attempt.type].label} ·{" "}
              {dayFormat.format(new Date(attempt.at))} · {pickLabel(attempt)}
            </p>
          </div>
          <p className="text-sm text-muted">
            {attempt.score === null ? (
              "Choices only"
            ) : (
              <>
                <span className="text-base font-semibold text-ink">{attempt.score}</span> / 100
              </>
            )}
          </p>
          {topics.has(attempt.questionId) && (
            <Link
              href={`/practice/${attempt.questionId}`}
              aria-label={`Retry: ${topics.get(attempt.questionId)}`}
              className="rounded-md text-sm font-medium text-accent underline-offset-4 hover:underline"
            >
              Retry
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
