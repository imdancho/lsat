"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DifficultyLabel } from "@/components/TypeBadge";
import { useAttempts } from "@/components/useAttempts";
import {
  focusTypes,
  parseFocus,
  pickNextQuestion,
  recommendType,
} from "@/lib/stats";
import { focusInfo, QUESTION_TYPE_INFO } from "@/lib/taxonomy";
import {
  QUESTION_TYPES,
  type Attempt,
  type Focus,
  type QuestionSummary,
  type QuestionType,
} from "@/lib/types";

/** Best score per question, from the student's saved attempts. */
function bestScores(attempts: Attempt[]): Map<string, number> {
  const best = new Map<string, number>();
  for (const attempt of attempts) {
    best.set(
      attempt.questionId,
      Math.max(best.get(attempt.questionId) ?? 0, attempt.score),
    );
  }
  return best;
}

const joinWithOr = (labels: string[]) =>
  labels.length < 2
    ? labels.join("")
    : `${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`;

/** Shown when the page is opened for one mistake or type, e.g. from a lesson. */
function DrillBanner({
  focus,
  types,
  questions,
  attempts,
}: {
  focus: Focus;
  types: QuestionType[];
  questions: QuestionSummary[];
  attempts: Attempt[];
}) {
  const { label, kind } = focusInfo(focus);
  const next = pickNextQuestion(questions, attempts, { focus });
  const typeLabels = types.map((type) => QUESTION_TYPE_INFO[type].label);
  return (
    <section
      aria-labelledby="drill-heading"
      className="mb-6 rounded-xl border border-accent/30 bg-accent-soft p-5 sm:p-6"
    >
      <h2 id="drill-heading" className="text-xl font-semibold">
        Your drill: {label}
      </h2>
      <p className="mt-2 max-w-2xl leading-relaxed">
        {kind === "Reasoning mistake"
          ? `The best place to work on this is a ${joinWithOr(typeLabels)} question. Answer in your own words and watch for this one mistake.`
          : QUESTION_TYPE_INFO[types[0]].description}
      </p>
      <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        {next && (
          <Link
            href={`/practice/${next.id}`}
            className="inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-accent-strong"
          >
            Start the drill
          </Link>
        )}
        <Link
          href={`/lessons/${focus}`}
          className="rounded-md font-medium text-accent underline underline-offset-4"
        >
          Read the lesson
        </Link>
        <Link
          href="/practice"
          className="rounded-md font-medium text-muted underline underline-offset-4 hover:text-ink"
        >
          Show all question types
        </Link>
      </p>
    </section>
  );
}

function TypeCard({
  type,
  questions,
  attempts,
  scores,
  badge,
}: {
  type: QuestionType;
  questions: QuestionSummary[];
  attempts: Attempt[];
  scores: Map<string, number>;
  badge: string | null;
}) {
  const info = QUESTION_TYPE_INFO[type];
  const ofType = questions.filter((q) => q.type === type);
  const done = ofType.filter((q) => scores.has(q.id)).length;
  const next = pickNextQuestion(questions, attempts, { focus: type });

  return (
    <li
      className={`rounded-xl border bg-surface p-5 ${badge ? "border-accent/40" : "border-line"}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-xl font-semibold">{info.label}</h2>
        <p className="text-sm text-muted">
          {done} of {ofType.length} done
        </p>
      </div>
      <p className="mt-1 text-muted">{info.description}</p>
      {badge && (
        <p className="mt-3 inline-block rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
          {badge}
        </p>
      )}
      {next && (
        <p className="mt-4">
          <Link
            href={`/practice/${next.id}`}
            className="inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-accent-strong"
          >
            {done === 0 ? "Start" : done < ofType.length ? "Continue" : "Practice again"}
          </Link>
        </p>
      )}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-muted">
          All {ofType.length} questions
        </summary>
        <ul className="mt-2 divide-y divide-line">
          {ofType.map((q) => (
            <li key={q.id}>
              <Link
                href={`/practice/${q.id}`}
                className="flex items-baseline justify-between gap-3 rounded-md py-2 hover:text-accent"
              >
                <span className="first-letter:uppercase">{q.topic}</span>
                <span className="flex shrink-0 items-baseline gap-3">
                  <DifficultyLabel difficulty={q.difficulty} />
                  <span className="w-12 text-right text-sm font-semibold">
                    {scores.has(q.id) ? `${scores.get(q.id)}` : "—"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}

type PracticeMenuProps = {
  questions: QuestionSummary[];
  /** A mistake or type to drill; null shows the plain menu. */
  focus: Focus | null;
};

export function PracticeMenu({ questions, focus }: PracticeMenuProps) {
  const attempts = useAttempts();
  const scores = bestScores(attempts);
  const drillTypes = focus ? focusTypes(focus, attempts) : [];
  const recommended = recommendType(attempts);

  const badgeFor = (type: QuestionType) => {
    if (focus) return drillTypes.includes(type) ? "In your drill" : null;
    return type === recommended ? "Recommended for you" : null;
  };

  return (
    <>
      {focus && (
        <DrillBanner
          focus={focus}
          types={drillTypes}
          questions={questions}
          attempts={attempts}
        />
      )}
      <ul className="grid gap-4 sm:grid-cols-2">
        {QUESTION_TYPES.map((type) => (
          <TypeCard
            key={type}
            type={type}
            questions={questions}
            attempts={attempts}
            scores={scores}
            badge={badgeFor(type)}
          />
        ))}
      </ul>
    </>
  );
}

/**
 * The menu with its drill taken from ?focus= in the address. Reading the query
 * string is only possible in the browser, so render this inside <Suspense>
 * with the plain menu as the fallback.
 */
export function PracticeMenuFromUrl({ questions }: { questions: QuestionSummary[] }) {
  const focus = parseFocus(useSearchParams().get("focus"));
  return <PracticeMenu questions={questions} focus={focus} />;
}
