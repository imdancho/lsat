"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { Stimulus } from "@/components/Stimulus";
import { TypeBadge } from "@/components/TypeBadge";
import { saveTest } from "@/lib/progress";
import { QUESTION_TYPE_INFO, TRAP_TAG_INFO } from "@/lib/taxonomy";
import {
  QUESTION_TYPES,
  type ApiErrorBody,
  type Attempt,
  type ChoiceIndex,
  type PublicQuestion,
  type ScoreRequest,
  type ScoreResponse,
} from "@/lib/types";

const QUESTION_COUNT = 10;
const SECTION_SECONDS = 14 * 60;
const LETTERS = ["A", "B", "C", "D", "E"] as const;
const INDEXES: ChoiceIndex[] = [0, 1, 2, 3, 4];

const PRIMARY_BUTTON =
  "rounded-lg bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-strong";
const SECONDARY_BUTTON =
  "rounded-lg border border-line bg-surface px-5 py-2.5 font-medium transition-colors hover:border-accent disabled:cursor-not-allowed disabled:text-muted disabled:hover:border-line";

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Ten questions, two of each type, in random order. */
function drawSection(bank: PublicQuestion[]): PublicQuestion[] {
  const perType = QUESTION_COUNT / QUESTION_TYPES.length;
  return shuffled(
    QUESTION_TYPES.flatMap((type) =>
      shuffled(bank.filter((q) => q.type === type)).slice(0, perType),
    ),
  );
}

/** The current time in milliseconds. Only for event handlers and timers, never during render. */
const timestamp = () => Date.now();

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

type Section = {
  questions: PublicQuestion[];
  /** When the time runs out, as a timestamp: the clock keeps running while the page is hidden. */
  deadline: number;
  startedAt: number;
};
type Scored = { results: ScoreResponse["results"]; seconds: number; times: number[] };

async function requestScore(request: ScoreRequest): Promise<ScoreResponse | string> {
  try {
    const response = await fetch("/api/test/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const body: unknown = await response.json().catch(() => null);
    if (response.ok) return body as ScoreResponse;
    return (body as ApiErrorBody | null)?.error?.message ?? "Could not score the section. Try again.";
  } catch {
    return "Could not reach the server. Check your connection and try again.";
  }
}

/** The timed mini-section: ten multiple-choice questions against a 14-minute clock. */
export function TimedTest({ bank }: { bank: PublicQuestion[] }) {
  const [section, setSection] = useState<Section | null>(null);
  const [current, setCurrent] = useState(0);
  const [picks, setPicks] = useState<(ChoiceIndex | null)[]>([]);
  const [flags, setFlags] = useState<boolean[]>([]);
  const [now, setNow] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [scored, setScored] = useState<Scored | null>(null);

  // Seconds spent on each question, and when the current one came on screen.
  const spent = useRef<number[]>([]);
  const shownAt = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const running = section !== null && scored === null && !scoring && scoreError === null;
  const remaining = section ? Math.max(0, Math.ceil((section.deadline - now) / 1000)) : SECTION_SECONDS;

  // Pages stay mounted while hidden: do not come back to an open confirmation.
  useLayoutEffect(() => () => setConfirming(false), []);

  function chargeTime() {
    const t = timestamp();
    spent.current[current] = (spent.current[current] ?? 0) + (t - shownAt.current) / 1000;
    shownAt.current = t;
  }

  function start() {
    const questions = drawSection(bank);
    const t = timestamp();
    spent.current = questions.map(() => 0);
    shownAt.current = t;
    setSection({ questions, deadline: t + SECTION_SECONDS * 1000, startedAt: t });
    setPicks(questions.map(() => null));
    setFlags(questions.map(() => false));
    setCurrent(0);
    setNow(t);
    setScored(null);
    setScoreError(null);
    setConfirming(false);
  }

  function goTo(index: number) {
    chargeTime();
    setCurrent(index);
    setConfirming(false);
    headingRef.current?.focus();
  }

  async function finish() {
    if (!section || scoring) return;
    chargeTime();
    setConfirming(false);
    setScoring(true);
    setScoreError(null);
    const seconds = Math.min(SECTION_SECONDS, Math.round((timestamp() - section.startedAt) / 1000));
    const outcome = await requestScore({
      answers: section.questions.map((q, i) => ({ questionId: q.id, pick: picks[i] })),
    });
    setScoring(false);
    if (typeof outcome === "string") {
      setScoreError(outcome);
      return;
    }
    const at = timestamp();
    const attempts: Attempt[] = section.questions.flatMap((q, i) => {
      const pick = picks[i];
      const reveal = outcome.results[i];
      if (pick === null || !reveal) return [];
      return [
        {
          questionId: q.id,
          type: q.type,
          flawTag: reveal.flawTag,
          score: null,
          mistakeTags: [],
          mcqCorrect: pick === reveal.correctIndex,
          mcqTrap: reveal.choiceTraps[pick],
          inputMode: "typed" as const,
          // One millisecond apart, so each attempt keeps its own timestamp.
          at: new Date(at + i).toISOString(),
        },
      ];
    });
    const correct = attempts.filter((a) => a.mcqCorrect).length;
    saveTest(
      { at: new Date(at).toISOString(), correct, total: section.questions.length, seconds },
      attempts,
    );
    setScored({ results: outcome.results, seconds, times: [...spent.current] });
  }

  // Twice a second: move the clock, and hand the section in when time is up.
  const tick = useEffectEvent(() => {
    const t = timestamp();
    setNow(t);
    if (section && t >= section.deadline) void finish();
  });
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => tick(), 500);
    return () => window.clearInterval(timer);
  }, [running]);

  if (!section) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <ul className="space-y-2 leading-relaxed">
          <li>{QUESTION_COUNT} questions, two of each question type, in random order.</li>
          <li>14 minutes, about the pace of a real section.</li>
          <li>Multiple choice only. Flag a question to come back to it.</li>
          <li>Answers and explanations appear when you finish or time runs out.</li>
        </ul>
        <button type="button" onClick={start} className={`mt-6 ${PRIMARY_BUTTON}`}>
          Start the section
        </button>
      </div>
    );
  }

  if (scored) {
    const { questions } = section;
    const right = (i: number) => picks[i] !== null && picks[i] === scored.results[i]?.correctIndex;
    const correct = questions.filter((_, i) => right(i)).length;
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <h2 className="text-2xl font-semibold" tabIndex={-1} ref={headingRef}>
            You scored {correct} of {questions.length}
          </h2>
          <p className="mt-2 text-muted">
            Time used: {clock(scored.seconds)} of {clock(SECTION_SECONDS)}
            {scored.seconds >= SECTION_SECONDS && " — time ran out"}
          </p>
          <ul className="mt-5 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
            {QUESTION_TYPES.map((type) => {
              const ofType = questions.map((q, i) => ({ q, i })).filter(({ q }) => q.type === type);
              return (
                <li key={type} className="flex justify-between gap-4">
                  <span>{QUESTION_TYPE_INFO[type].label}</span>
                  <span className="text-muted">
                    <span className="font-semibold text-ink">
                      {ofType.filter(({ i }) => right(i)).length}
                    </span>{" "}
                    of {ofType.length}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={start} className={PRIMARY_BUTTON}>
              Start another section
            </button>
            <Link href="/progress" className={`inline-block ${SECONDARY_BUTTON}`}>
              See your progress
            </Link>
          </p>
        </section>

        <ol className="space-y-4">
          {questions.map((q, i) => {
            const reveal = scored.results[i];
            const pick = picks[i];
            if (!reveal) return null;
            return (
              <li key={q.id} className="rounded-xl border border-line bg-surface p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold">Question {i + 1}</span>
                  <TypeBadge type={q.type} />
                  <span className={`text-sm font-semibold ${right(i) ? "text-green-800" : "text-red-800"}`}>
                    {right(i) ? "✓ Correct" : pick === null ? "✗ Not answered" : "✗ Incorrect"}
                  </span>
                  <span className="ml-auto text-sm text-muted">
                    {clock(Math.round(scored.times[i] ?? 0))}
                  </span>
                </div>
                <p className="mt-2 text-muted first-letter:uppercase">{q.topic}</p>
                <p className="mt-2 leading-relaxed">
                  {pick !== null && pick !== reveal.correctIndex && (
                    <>
                      <span className="font-semibold">Your pick: {LETTERS[pick]}</span> (
                      {TRAP_TAG_INFO[reveal.choiceTraps[pick]].label}).{" "}
                    </>
                  )}
                  <span className="font-semibold">Correct answer: {LETTERS[reveal.correctIndex]}.</span>{" "}
                  {q.choices[reveal.correctIndex]}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {reveal.choiceExplanations[reveal.correctIndex]}
                </p>
                {!right(i) && (
                  <p className="mt-3">
                    <Link
                      href={`/practice/${q.id}`}
                      className="font-medium text-accent underline underline-offset-4"
                    >
                      Review in Prephrase mode
                      <span className="sr-only">: question {i + 1}</span>
                    </Link>
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  const question = section.questions[current];
  const unanswered = picks.filter((p) => p === null).length;
  const locked = scoring || scoreError !== null;

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-paper px-4 py-3 sm:-mx-6 sm:px-6">
        <p role="timer" aria-label="Time left" className="text-2xl font-semibold tabular-nums">
          {clock(remaining)}
        </p>
        <nav aria-label="Questions">
          <ol className="flex flex-wrap gap-1.5">
            {section.questions.map((q, i) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  disabled={locked}
                  aria-current={i === current ? "step" : undefined}
                  aria-label={`Question ${i + 1}${picks[i] !== null ? ", answered" : ", not answered"}${flags[i] ? ", flagged" : ""}`}
                  className={`relative size-9 rounded-md border text-sm font-semibold ${
                    i === current
                      ? "border-accent bg-accent text-white"
                      : picks[i] !== null
                        ? "border-accent/40 bg-accent-soft text-accent"
                        : "border-line bg-surface text-muted"
                  }`}
                >
                  {i + 1}
                  {flags[i] && (
                    <span aria-hidden="true" className="absolute -right-1 -top-1.5 text-xs">
                      ⚑
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <p role="status" className="sr-only">
        {remaining === 300 && "Five minutes left."}
        {remaining === 60 && "One minute left."}
        {scoring && "Scoring your section…"}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 ref={headingRef} tabIndex={-1} className="rounded-md text-xl font-semibold">
          Question {current + 1} of {section.questions.length}
        </h2>
        <button
          type="button"
          aria-pressed={flags[current]}
          disabled={locked}
          onClick={() => setFlags((f) => f.map((v, i) => (i === current ? !v : v)))}
          className="ml-auto rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent"
        >
          <span aria-hidden="true">⚑ </span>
          {flags[current] ? "Flagged" : "Flag"}
        </button>
      </div>

      <div className="mt-4">
        <Stimulus text={question.stimulus} />
      </div>
      <fieldset className="mt-6" disabled={locked}>
        <legend className="max-w-[68ch] font-medium leading-relaxed">{question.stem}</legend>
        <div className="mt-3 space-y-2">
          {INDEXES.map((i) => (
            <label
              key={i}
              className={`flex cursor-pointer gap-3 rounded-lg border px-4 py-3 leading-relaxed transition-colors hover:border-accent ${
                picks[current] === i ? "border-accent bg-accent-soft" : "border-line bg-surface"
              }`}
            >
              <input
                type="radio"
                name={`choice-${question.id}`}
                checked={picks[current] === i}
                onChange={() => setPicks((p) => p.map((v, k) => (k === current ? i : v)))}
                className="mt-1.5 size-4 shrink-0 accent-accent"
              />
              <span className="font-semibold text-muted">{LETTERS[i]}</span>
              <span>{question.choices[i]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => goTo(current - 1)} disabled={locked || current === 0} className={SECONDARY_BUTTON}>
          Previous
        </button>
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          disabled={locked || current === section.questions.length - 1}
          className={SECONDARY_BUTTON}
        >
          Next
        </button>
        <button
          type="button"
          onClick={() => (unanswered > 0 ? setConfirming(true) : void finish())}
          disabled={locked}
          className={`ml-auto ${PRIMARY_BUTTON} disabled:cursor-not-allowed disabled:bg-line disabled:text-muted`}
        >
          {scoring ? "Scoring…" : "Finish section"}
        </button>
      </div>

      {confirming && !locked && (
        <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-4">
          <p className="mr-auto">
            {unanswered === 1 ? "1 question is" : `${unanswered} questions are`} not answered. Finish anyway?
          </p>
          <button type="button" onClick={() => void finish()} className={SECONDARY_BUTTON}>
            Yes, finish
          </button>
          <button type="button" onClick={() => setConfirming(false)} className={SECONDARY_BUTTON}>
            Keep working
          </button>
        </div>
      )}

      {scoreError && (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
          <p>{scoreError} Your answers are kept.</p>
          <button
            type="button"
            onClick={() => {
              setScoreError(null);
              void finish();
            }}
            className="mt-3 rounded-md border border-red-300 bg-white px-4 py-1.5 font-medium"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
