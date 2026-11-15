"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnswerField } from "@/components/AnswerField";
import { ChoiceList } from "@/components/ChoiceList";
import { FeedbackCard, FeedbackCardSkeleton } from "@/components/FeedbackCard";
import { Stimulus } from "@/components/Stimulus";
import { DifficultyLabel, TypeBadge } from "@/components/TypeBadge";
import { useAttempts } from "@/components/useAttempts";
import { pickNextQuestion, recommendType, saveAttempt } from "@/lib/progress";
import { QUESTION_TYPE_INFO } from "@/lib/taxonomy";
import type {
  ApiErrorBody,
  Attempt,
  ChoiceIndex,
  GradeResponse,
  PublicQuestion,
  QuestionSummary,
} from "@/lib/types";

const MAX_ANSWER_CHARS = 600;
const CONCLUSION_PROMPT =
  "In one sentence, what is the author's main conclusion?";

type GradeError = { message: string; rateLimited: boolean };

function isApiError(body: unknown): body is ApiErrorBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as ApiErrorBody).error?.message === "string"
  );
}

type GradeOutcome =
  | { ok: true; grade: GradeResponse }
  | { ok: false; error: GradeError };

/** Calls the grading API and turns every failure into a message for the student. */
async function requestGrade(
  questionId: string,
  answers: { conclusion: string; main: string },
): Promise<GradeOutcome> {
  let response: Response;
  try {
    response = await fetch("/api/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, answers }),
    });
  } catch {
    return {
      ok: false,
      error: {
        message: "Could not reach the grader. Check your connection and try again.",
        rateLimited: false,
      },
    };
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      ok: false,
      error: {
        message: isApiError(body)
          ? body.error.message
          : "Something went wrong while grading. Try again.",
        rateLimited: response.status === 429,
      },
    };
  }
  return { ok: true, grade: body as GradeResponse };
}

function StepHeading({ step, children }: { step: number; children: string }) {
  return (
    <h2 className="flex items-baseline gap-3 text-xl font-semibold">
      <span className="font-sans text-sm font-semibold uppercase tracking-wide text-accent">
        Step {step}
      </span>
      {children}
    </h2>
  );
}

type PracticeFlowProps = {
  question: PublicQuestion;
  /** Every question in the bank, for the "next question" links. */
  questions: QuestionSummary[];
};

export function PracticeFlow({ question, questions }: PracticeFlowProps) {
  const [conclusion, setConclusion] = useState("");
  const [main, setMain] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState<GradeError | null>(null);
  // Holds the correct answer and explanations from the moment of grading.
  // They are rendered only after the student picks a choice.
  const [grade, setGrade] = useState<GradeResponse | null>(null);
  const [attemptAt, setAttemptAt] = useState<string | null>(null);
  const [picked, setPicked] = useState<ChoiceIndex | null>(null);

  const feedbackRef = useRef<HTMLElement>(null);
  const attempts = useAttempts();

  const typeInfo = QUESTION_TYPE_INFO[question.type];
  const mainIsOptional = question.type === "main_conclusion";
  const canSubmit =
    !isGrading &&
    conclusion.trim().length > 0 &&
    (mainIsOptional || main.trim().length > 0);

  // Move the reader (and keyboard focus) to the feedback when it arrives.
  useEffect(() => {
    if (grade) feedbackRef.current?.focus();
  }, [grade]);

  function attemptFor(response: GradeResponse, at: string, pick: ChoiceIndex | null): Attempt {
    return {
      questionId: question.id,
      type: question.type,
      flawTag: response.flawTag,
      score: response.result.overallScore,
      mistakeTags: response.result.mistakeTags,
      mcqCorrect: pick === null ? null : pick === response.correctIndex,
      mcqTrap: pick === null ? null : response.choiceTraps[pick],
      inputMode: "typed",
      at,
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsGrading(true);
    setError(null);
    const outcome = await requestGrade(question.id, {
      conclusion: conclusion.trim(),
      main: main.trim(),
    });
    setIsGrading(false);
    if (!outcome.ok) {
      setError(outcome.error);
      return;
    }
    const at = new Date().toISOString();
    setGrade(outcome.grade);
    setAttemptAt(at);
    saveAttempt(attemptFor(outcome.grade, at, null));
  }

  function handlePick(index: ChoiceIndex) {
    if (!grade || !attemptAt) return;
    setPicked(index);
    saveAttempt(attemptFor(grade, attemptAt, index));
  }

  const next = pickNextQuestion(questions, attempts, question.type, question.id);
  const weakType = recommendType(attempts);
  const drill = pickNextQuestion(questions, attempts, weakType, question.id);

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="sr-only">{typeInfo.label} practice question</h1>
        <TypeBadge type={question.type} />
        <DifficultyLabel difficulty={question.difficulty} />
        <Link
          href="/practice"
          className="ml-auto rounded-md text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          All questions
        </Link>
      </header>

      <section aria-label="Argument" className="mt-6">
        <Stimulus text={question.stimulus} />
      </section>

      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        <div>
          <StepHeading step={1}>Find the conclusion</StepHeading>
          <div className="mt-3">
            <AnswerField
              id="answer-conclusion"
              label={CONCLUSION_PROMPT}
              value={conclusion}
              onChange={setConclusion}
              maxLength={MAX_ANSWER_CHARS}
              readOnly={isGrading || grade !== null}
            />
          </div>
        </div>

        <div>
          <StepHeading step={2}>Answer in your own words</StepHeading>
          <p className="mt-3 max-w-[68ch] border-l-2 border-accent pl-4 leading-relaxed">
            {question.stem}
          </p>
          <div className="mt-4">
            <AnswerField
              id="answer-main"
              label={typeInfo.prompt}
              value={main}
              onChange={setMain}
              maxLength={MAX_ANSWER_CHARS}
              readOnly={isGrading || grade !== null}
            />
          </div>
        </div>

        {grade === null && (
          <div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
            >
              {isGrading ? "Grading your reasoning…" : "Check my reasoning"}
            </button>
            <p className="mt-2 text-sm text-muted">
              The answer choices stay hidden until your reasoning is graded.
            </p>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
            <p>{error.message}</p>
            {error.rateLimited ? (
              <p className="mt-2">
                <Link href="/pricing" className="font-semibold underline underline-offset-4">
                  See plans with unlimited grading
                </Link>
              </p>
            ) : (
              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-3 rounded-md border border-red-300 bg-white px-4 py-1.5 font-medium disabled:opacity-60"
              >
                Try again
              </button>
            )}
          </div>
        )}
      </form>

      <p role="status" className="sr-only">
        {isGrading && "Grading your reasoning…"}
        {grade && `Graded: ${grade.result.overallScore} out of 100.`}
      </p>

      {isGrading && (
        <div className="mt-10">
          <FeedbackCardSkeleton />
        </div>
      )}

      {grade && (
        <>
          <section
            ref={feedbackRef}
            tabIndex={-1}
            aria-label="Feedback on your reasoning"
            className="mt-10 scroll-mt-6 outline-none"
          >
            <FeedbackCard result={grade.result} type={question.type} />
          </section>

          <section className="mt-10">
            <StepHeading step={3}>Confirm on the real format</StepHeading>
            <p className="mt-3 max-w-[68ch] leading-relaxed">{question.stem}</p>
            <div className="mt-4">
              <ChoiceList
                choices={question.choices}
                picked={picked}
                reveal={grade}
                onPick={handlePick}
              />
            </div>
          </section>
        </>
      )}

      {picked !== null && (
        <nav aria-label="What next" className="mt-8 flex flex-wrap gap-3">
          {next && (
            <Link
              href={`/practice/${next.id}`}
              className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-accent-strong"
            >
              Next question
            </Link>
          )}
          {drill && drill.id !== next?.id && (
            <Link
              href={`/practice/${drill.id}`}
              className="rounded-lg border border-line bg-surface px-5 py-2.5 font-medium transition-colors hover:border-accent"
            >
              Drill my weak spot: {QUESTION_TYPE_INFO[weakType].label}
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
