"use client";

import Link from "next/link";
import { DifficultyLabel } from "@/components/TypeBadge";
import { useAttempts } from "@/components/useAttempts";
import { pickNextQuestion, recommendType } from "@/lib/progress";
import { QUESTION_TYPE_INFO } from "@/lib/taxonomy";
import {
  QUESTION_TYPES,
  type Attempt,
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
  scores: Map<string, number>;
  recommended: boolean;
}) {
  const info = QUESTION_TYPE_INFO[type];
  const ofType = questions.filter((q) => q.type === type);
  const done = ofType.filter((q) => scores.has(q.id)).length;
  const next = pickNextQuestion(questions, attempts, type);

  return (
    <li className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-xl font-semibold">{info.label}</h2>
        <p className="text-sm text-muted">
          {done} of {ofType.length} done
        </p>
      </div>
      <p className="mt-1 text-muted">{info.description}</p>
      {recommended && (
        <p className="mt-3 inline-block rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
          Recommended for you
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

export function PracticeMenu({ questions }: { questions: QuestionSummary[] }) {
  const attempts = useAttempts();
  const scores = bestScores(attempts);
  const recommended = recommendType(attempts);

  return (
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
  );
}
