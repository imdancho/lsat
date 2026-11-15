"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AnswerField } from "@/components/AnswerField";
import { ChoiceList } from "@/components/ChoiceList";
import { FeedbackCard, FeedbackCardSkeleton } from "@/components/FeedbackCard";
import { Stimulus } from "@/components/Stimulus";
import { DifficultyLabel, TypeBadge } from "@/components/TypeBadge";
import { useAccess, useAttempts } from "@/components/useAttempts";
import { useSpeechSupport } from "@/components/useSpeechRecognition";
import { VoiceInput } from "@/components/VoiceInput";
import { FREE_GRADES_PER_DAY, resolveAccess, type Access } from "@/lib/plan";
import {
  readDemoMode,
  readStore,
  recordGradedAnswer,
  saveAttempt,
} from "@/lib/progress";
import { localDay, pickNextQuestion, recommendType } from "@/lib/stats";
import { QUESTION_TYPE_INFO } from "@/lib/taxonomy";
import type {
  ApiErrorBody,
  Attempt,
  ChoiceIndex,
  GradeRequest,
  GradeResponse,
  InputMode,
  PublicQuestion,
  QuestionReveal,
  QuestionSummary,
  QuestionType,
  RevealRequest,
} from "@/lib/types";

const MAX_ANSWER_CHARS = 600;
const MAX_TRANSCRIPT_CHARS = 1500;
const CONCLUSION_PROMPT =
  "In one sentence, what is the author's main conclusion?";

/** What to say in one-take voice mode, where one recording covers both answers. */
const ONE_TAKE_PROMPT: Record<QuestionType, string> = {
  main_conclusion:
    "Say the conclusion, then how the other statements support it.",
  flaw: "Say the conclusion, then what's wrong with the reasoning.",
  necessary_assumption:
    "Say the conclusion, then what's missing: what must be true for it to follow.",
  strengthen:
    "Say the conclusion, then one new fact that would strengthen the argument.",
  weaken:
    "Say the conclusion, then one new fact that would weaken the argument.",
};

const LETTERS = ["A", "B", "C", "D", "E"] as const;

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
async function requestGrade(request: GradeRequest): Promise<GradeOutcome> {
  let response: Response;
  try {
    response = await fetch("/api/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
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

type RevealOutcome =
  | { ok: true; reveal: QuestionReveal }
  | { ok: false; message: string };

/** Multiple-choice mode: trades a pick for the correct answer and the explanations. */
async function requestReveal(request: RevealRequest): Promise<RevealOutcome> {
  let response: Response;
  try {
    response = await fetch("/api/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    return {
      ok: false,
      message: "Could not reach the server. Check your connection and pick again.",
    };
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      ok: false,
      message: isApiError(body)
        ? body.error.message
        : "Something went wrong while checking your pick. Pick again.",
    };
  }
  return { ok: true, reveal: body as QuestionReveal };
}

/** Adds a dictated phrase to the text already in a field. */
function withSpoken(current: string, spoken: string, maxLength: number): string {
  return (current ? `${current} ${spoken}` : spoken).slice(0, maxLength);
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

/** How much AI grading is left. Keeps its height while storage is still unread. */
function QuotaLine({ access }: { access: Access | null }) {
  let text = "";
  if (access?.kind === "pro") text = "Pro: unlimited AI grading.";
  else if (access?.kind === "demo") text = "Demo mode: the daily limit is off.";
  else if (access?.kind === "free") {
    text = `Free plan: ${access.remaining} of ${FREE_GRADES_PER_DAY} AI-graded answers left today.`;
  }
  return <p className="mt-1 min-h-5 text-sm text-muted">{text}</p>;
}

/** Shown in place of the answer form once the free plan's daily grades are used up. */
function LimitNotice() {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="mt-10 rounded-xl border border-accent/30 bg-accent-soft p-5 sm:p-6"
    >
      <h2 id={headingId} className="text-xl font-semibold">
        You&rsquo;ve used today&rsquo;s {FREE_GRADES_PER_DAY} free AI-graded answers
      </h2>
      <p className="mt-2 max-w-2xl leading-relaxed">
        They come back at midnight. Until then, every question is open in
        multiple-choice mode: pick an answer and see why each choice is right
        or wrong. Pro grades every answer you write, with no daily limit.
      </p>
      <p className="mt-4">
        <Link
          href="/pricing"
          className="inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-accent-strong"
        >
          See Pro plans
        </Link>
      </p>
    </section>
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
  // One-take voice mode: a single recording covers both answers.
  const [oneTake, setOneTake] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [dictated, setDictated] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState<GradeError | null>(null);
  // Holds the correct answer and explanations from the moment of grading.
  // They are rendered only after the student picks a choice.
  const [grade, setGrade] = useState<GradeResponse | null>(null);
  const [attemptAt, setAttemptAt] = useState<string | null>(null);
  const [picked, setPicked] = useState<ChoiceIndex | null>(null);
  // Multiple-choice mode (no AI grade): the answer arrives only after a pick.
  const [choiceReveal, setChoiceReveal] = useState<QuestionReveal | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);

  // Earlier questions can stay mounted in the background, so field ids must
  // be unique per instance for each label to reach its own field.
  const fieldId = useId();
  const feedbackRef = useRef<HTMLElement>(null);
  const choicesRef = useRef<HTMLElement>(null);
  const attempts = useAttempts();
  const access = useAccess();
  const speech = useSpeechSupport();

  const typeInfo = QUESTION_TYPE_INFO[question.type];
  const mainIsOptional = question.type === "main_conclusion";
  const locked = isGrading || grade !== null;
  const hasAnswer = oneTake
    ? transcript.trim().length > 0
    : conclusion.trim().length > 0 &&
      (mainIsOptional || main.trim().length > 0);
  const canSubmit = !isGrading && hasAnswer;
  const inputMode: InputMode = oneTake || dictated ? "voice" : "typed";

  const reveal: QuestionReveal | null = grade ?? choiceReveal;
  const answered = picked !== null && reveal !== null;
  const outOfGrades = access?.kind === "free" && access.remaining === 0;
  // No AI grading for this question: the free grades are used up, or the
  // student has already started answering it by picking a choice.
  const choicesOnly = grade === null && !isGrading && (picked !== null || outOfGrades);

  // Focus moves once, when something new arrives; not again each time this
  // page is shown after a visit elsewhere (effects re-run then).
  const focusedFeedback = useRef(false);
  const focusedChoices = useRef(false);

  // Move the reader (and keyboard focus) to the feedback when it arrives.
  useEffect(() => {
    if (!grade || focusedFeedback.current) return;
    focusedFeedback.current = true;
    feedbackRef.current?.focus();
  }, [grade]);

  // Picking replaces the choice buttons with the explained answers, which
  // would drop keyboard focus; keep it on the section instead.
  useEffect(() => {
    if (!answered || focusedChoices.current) return;
    focusedChoices.current = true;
    choicesRef.current?.focus();
  }, [answered]);

  function attemptFor(response: GradeResponse, at: string, pick: ChoiceIndex | null): Attempt {
    return {
      questionId: question.id,
      type: question.type,
      flawTag: response.flawTag,
      score: response.result.overallScore,
      mistakeTags: response.result.mistakeTags,
      mcqCorrect: pick === null ? null : pick === response.correctIndex,
      mcqTrap: pick === null ? null : response.choiceTraps[pick],
      inputMode,
      at,
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    // Checked against the clock and storage as they are now, not as of the last render.
    const accessNow = resolveAccess(readStore(), readDemoMode(), localDay(new Date()));
    if (accessNow.kind === "free" && accessNow.remaining === 0) {
      setError({
        message: `You have used today's ${FREE_GRADES_PER_DAY} free AI-graded answers.`,
        rateLimited: true,
      });
      return;
    }
    setIsGrading(true);
    setError(null);
    const outcome = await requestGrade(
      oneTake
        ? {
            questionId: question.id,
            mode: "voice_single",
            transcript: transcript.trim(),
          }
        : {
            questionId: question.id,
            answers: { conclusion: conclusion.trim(), main: main.trim() },
            inputMode,
          },
    );
    setIsGrading(false);
    if (!outcome.ok) {
      setError(outcome.error);
      return;
    }
    const now = new Date();
    const at = now.toISOString();
    setGrade(outcome.grade);
    setAttemptAt(at);
    saveAttempt(attemptFor(outcome.grade, at, null));
    if (accessNow.kind === "free") recordGradedAnswer(localDay(now));
  }

  async function handlePick(index: ChoiceIndex) {
    if (picked !== null) return;
    setPicked(index);
    if (grade && attemptAt) {
      saveAttempt(attemptFor(grade, attemptAt, index));
      return;
    }

    // Multiple-choice mode: the server releases the answer in exchange for the pick.
    setRevealError(null);
    const outcome = await requestReveal({ questionId: question.id, pick: index });
    if (!outcome.ok) {
      setPicked(null);
      setRevealError(outcome.message);
      return;
    }
    setChoiceReveal(outcome.reveal);
    saveAttempt({
      questionId: question.id,
      type: question.type,
      flawTag: outcome.reveal.flawTag,
      score: null,
      mistakeTags: [],
      mcqCorrect: index === outcome.reveal.correctIndex,
      mcqTrap: outcome.reveal.choiceTraps[index],
      inputMode: "typed",
      at: new Date().toISOString(),
    });
  }

  /** A mic button that dictates into one of the answer fields. */
  function micFor(
    setText: (update: (current: string) => string) => void,
    label: string,
    maxLength: number,
  ) {
    if (speech !== "supported") return undefined;
    return (
      <VoiceInput
        label={label}
        disabled={locked}
        onText={(spoken) => {
          setDictated(true);
          setText((current) => withSpoken(current, spoken, maxLength));
        }}
      />
    );
  }

  const next = pickNextQuestion(questions, attempts, {
    focus: question.type,
    excludeId: question.id,
  });
  const weakType = recommendType(attempts);
  const drill = pickNextQuestion(questions, attempts, { excludeId: question.id });

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

      {choicesOnly && (
        <>
          <LimitNotice />
          <section
            ref={choicesRef}
            tabIndex={-1}
            aria-label="Answer choices"
            className="mt-10 scroll-mt-6 outline-none"
          >
            <StepHeading step={1}>Pick the best answer</StepHeading>
            <p className="mt-3 max-w-[68ch] leading-relaxed">{question.stem}</p>
            <div className="mt-4">
              <ChoiceList
                choices={question.choices}
                picked={picked}
                reveal={choiceReveal}
                onPick={handlePick}
              />
            </div>
            {revealError && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900"
              >
                {revealError}
              </p>
            )}
          </section>
        </>
      )}

      {!choicesOnly && (
      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        {speech === "supported" && (
          <label className="flex w-fit cursor-pointer items-center gap-2.5 font-medium">
            <input
              type="checkbox"
              checked={oneTake}
              disabled={locked}
              onChange={(event) => setOneTake(event.target.checked)}
              className="size-4 accent-accent"
            />
            Answer by voice in one go
          </label>
        )}
        {speech === "unsupported" && (
          <p className="text-sm text-muted">
            Voice answers work in Chrome, Edge and Safari.
          </p>
        )}

        {oneTake ? (
          <div>
            <StepHeading step={1}>Say your answer</StepHeading>
            <p className="mt-3 max-w-[68ch] border-l-2 border-accent pl-4 leading-relaxed">
              {question.stem}
            </p>
            <p className="mt-4 italic text-muted">
              {ONE_TAKE_PROMPT[question.type]}
            </p>
            <div className="mt-3">
              <AnswerField
                id={`${fieldId}-transcript`}
                name="transcript"
                label={grade ? "What we heard" : "Your spoken answer"}
                value={transcript}
                onChange={setTranscript}
                maxLength={MAX_TRANSCRIPT_CHARS}
                readOnly={locked}
                action={micFor(setTranscript, "Start recording", MAX_TRANSCRIPT_CHARS)}
              />
            </div>
          </div>
        ) : (
          <>
            <div>
              <StepHeading step={1}>Find the conclusion</StepHeading>
              <div className="mt-3">
                <AnswerField
                  id={`${fieldId}-conclusion`}
                  name="conclusion"
                  label={CONCLUSION_PROMPT}
                  value={conclusion}
                  onChange={setConclusion}
                  maxLength={MAX_ANSWER_CHARS}
                  readOnly={locked}
                  action={micFor(setConclusion, "Speak", MAX_ANSWER_CHARS)}
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
                  id={`${fieldId}-main`}
                  name="main"
                  label={typeInfo.prompt}
                  value={main}
                  onChange={setMain}
                  maxLength={MAX_ANSWER_CHARS}
                  readOnly={locked}
                  action={micFor(setMain, "Speak", MAX_ANSWER_CHARS)}
                />
              </div>
            </div>
          </>
        )}

        {grade === null && (
          <div>
            <button
              type="submit"
              // While grading, the button is marked busy instead of disabled:
              // a disabled button drops keyboard focus, which would be lost
              // for good if the grade then failed.
              disabled={!hasAnswer}
              aria-disabled={isGrading || undefined}
              className="rounded-lg bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-line disabled:text-muted aria-disabled:cursor-progress aria-disabled:opacity-70"
            >
              {isGrading ? "Grading your reasoning…" : "Check my reasoning"}
            </button>
            <p className="mt-2 text-sm text-muted">
              The answer choices stay hidden until your reasoning is graded.
            </p>
            <QuotaLine access={access} />
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
            <p>{error.message}</p>
            {error.rateLimited ? (
              // The hourly limit protects the server and applies on every plan,
              // so only the free plan is pointed to pricing.
              access?.kind === "free" && (
                <p className="mt-2">
                  <Link href="/pricing" className="font-semibold underline underline-offset-4">
                    See plans with unlimited grading
                  </Link>
                </p>
              )
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
      )}

      <p role="status" className="sr-only">
        {isGrading && "Grading your reasoning…"}
        {picked !== null && reveal === null && "Checking your pick…"}
        {grade && !answered && `Graded: ${grade.result.overallScore} out of 100.`}
        {answered &&
          (picked === reveal.correctIndex
            ? `Your pick, ${LETTERS[picked]}, is correct.`
            : `Your pick, ${LETTERS[picked]}, is not correct. The correct answer is ${LETTERS[reveal.correctIndex]}.`)}
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

          <section
            ref={choicesRef}
            tabIndex={-1}
            aria-label="Answer choices"
            className="mt-10 scroll-mt-6 outline-none"
          >
            <StepHeading step={oneTake ? 2 : 3}>Confirm on the real format</StepHeading>
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

      {answered && (
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

      {answered && grade !== null && outOfGrades && (
        <p className="mt-6 max-w-2xl leading-relaxed text-muted">
          That was your last free AI-graded answer for today. The next
          questions open in multiple-choice mode.{" "}
          <Link
            href="/pricing"
            className="font-medium text-accent underline underline-offset-4"
          >
            Go Pro for unlimited grading
          </Link>
        </p>
      )}
    </article>
  );
}
