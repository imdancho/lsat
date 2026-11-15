"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useId } from "react";
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

/**
 * Best reasoning score per attempted question. A question answered only in
 * multiple-choice mode is in the map with null: done, but never graded.
 */
function bestScores(attempts: Attempt[]): Map<string, number | null> {
  const best = new Map<string, number | null>();
  for (const { questionId, score } of attempts) {
    const previous = best.get(questionId) ?? null;
    best.set(
      questionId,
      score === null ? previous : Math.max(previous ?? 0, score),
    );
  }
  return best;
}

const joinWithOr = (labels: string[]) =>
  labels.length < 2
    ? labels.join("")
    : `${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`;

/**
 * The drill this page was opened for, from ?focus= in the address. The query
 * string only exists in the browser, so everything that calls this must sit
 * inside its own <Suspense>; keeping those boundaries small lets the rest of
 * the menu be served as ready HTML and stay in place when the scripts load.
 */
function useFocus(): Focus | null {
  return parseFocus(useSearchParams().get("focus"));
}

/** Shown when the page is opened for one mistake or type, e.g. from a lesson. */
function DrillBanner({
  questions,
  attempts,
}: {
  questions: QuestionSummary[];
  attempts: Attempt[];
}) {
  const headingId = useId();
  const focus = useFocus();
  if (!focus) return null;
  const types = focusTypes(focus, attempts);
  const { label, kind } = focusInfo(focus);
  const next = pickNextQuestion(questions, attempts, { focus });
  const typeLabels = types.map((type) => QUESTION_TYPE_INFO[type].label);
  return (
    <section
      aria-labelledby={headingId}
      className="mb-6 rounded-xl border border-accent/30 bg-accent-soft p-5 sm:p-6"
    >
      <h2 id={headingId} className="text-xl font-semibold">
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

/** A card's badge. The card's border picks up on it through data-badge. */
function Badge({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p
      data-badge
      className="mt-3 inline-block rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent"
    >
      {text}
    </p>
  );
}

/** The badge once the address is known: during a drill it marks the drill's types instead. */
function BadgeFromUrl({
  type,
  recommended,
  attempts,
}: {
  type: QuestionType;
  recommended: boolean;
  attempts: Attempt[];
}) {
  const focus = useFocus();
  if (focus) {
    return (
      <Badge text={focusTypes(focus, attempts).includes(type) ? "In your drill" : null} />
    );
  }
  return <Badge text={recommended ? "Recommended for you" : null} />;
}

function TypeCard({
  type,
  questions,
  attempts,
  scores,
  recommended,
}: {
  type: QuestionType;
  questions: QuestionSummary[];
  attempts: Attempt[];
  scores: Map<string, number | null>;
  /** Whether this is the type the student should practice next. */
  recommended: boolean;
}) {
  const info = QUESTION_TYPE_INFO[type];
  const ofType = questions.filter((q) => q.type === type);
  const done = ofType.filter((q) => scores.has(q.id)).length;
  const next = pickNextQuestion(questions, attempts, { focus: type });

  return (
    <li className="rounded-xl border border-line bg-surface p-5 has-[[data-badge]]:border-accent/40">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-xl font-semibold">{info.label}</h2>
        <p className="text-sm text-muted">
          {done} of {ofType.length} done
        </p>
      </div>
      <p className="mt-1 text-muted">{info.description}</p>
      <Suspense fallback={<Badge text={recommended ? "Recommended for you" : null} />}>
        <BadgeFromUrl type={type} recommended={recommended} attempts={attempts} />
      </Suspense>
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
                    {scores.has(q.id) ? (scores.get(q.id) ?? "done") : "—"}
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

/**
 * The five question types with the student's progress in each. Opened with
 * ?focus=<mistake or type>, it also shows a drill banner and marks the types
 * that belong to the drill.
 */
export function PracticeMenu({ questions }: { questions: QuestionSummary[] }) {
  const attempts = useAttempts();
  const scores = bestScores(attempts);
  const recommended = recommendType(attempts);

  return (
    <>
      <Suspense fallback={null}>
        <DrillBanner questions={questions} attempts={attempts} />
      </Suspense>
      <ul className="grid gap-4 sm:grid-cols-2">
        {QUESTION_TYPES.map((type) => (
          <TypeCard
            key={type}
            type={type}
            questions={questions}
            attempts={attempts}
            scores={scores}
            recommended={type === recommended}
          />
        ))}
      </ul>
    </>
  );
}
