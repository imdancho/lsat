"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { StatTile, TypeMeters } from "@/components/ProgressCharts";
import { MistakeList, RecentAttempts, TrapList } from "@/components/ProgressLists";
import { ManagePro } from "@/components/ProStatus";
import { ResetProgress } from "@/components/ResetProgress";
import { useAttempts, useToday } from "@/components/useAttempts";
import {
  ATTEMPTS_TO_UNLOCK,
  pickNextQuestion,
  recentAttempts,
  recommendType,
  statsByType,
  summarize,
  topMistakes,
  topTraps,
} from "@/lib/stats";
import { QUESTION_TYPE_INFO } from "@/lib/taxonomy";
import type { Attempt, QuestionSummary } from "@/lib/types";

const PRIMARY_BUTTON =
  "inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-accent-strong";

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-5 sm:p-6 ${className}`}>
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Shown on the server and during hydration, before localStorage has been read. */
function DashboardSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-line/60" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-line/60" />
    </div>
  );
}

function Locked({
  attempts,
  questions,
  headingRef,
  onReset,
}: {
  attempts: Attempt[];
  questions: QuestionSummary[];
  /** The heading takes keyboard focus after a reset, when the profile above it is gone. */
  headingRef: RefObject<HTMLHeadingElement | null>;
  onReset: () => void;
}) {
  const next = pickNextQuestion(questions, attempts);
  const remaining = ATTEMPTS_TO_UNLOCK - attempts.length;
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-surface p-6 sm:p-8">
        <h2 ref={headingRef} tabIndex={-1} className="rounded-md text-2xl font-semibold">
          Answer {ATTEMPTS_TO_UNLOCK} questions to unlock your reasoning profile
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          {attempts.length === 0
            ? "Your profile shows your score by question type, the reasoning mistakes you make most often, and the drill that will help most."
            : `You have answered ${attempts.length} so far. ${remaining} more to go.`}
        </p>
        {next && (
          <p className="mt-6">
            <Link href={`/practice/${next.id}`} className={PRIMARY_BUTTON}>
              {attempts.length === 0 ? "Answer your first question" : "Answer the next question"}
            </Link>
          </p>
        )}
      </section>
      {attempts.length > 0 && (
        <>
          <Card title="Recent attempts">
            <RecentAttempts attempts={recentAttempts(attempts)} questions={questions} />
          </Card>
          <ResetProgress onReset={onReset} />
        </>
      )}
    </div>
  );
}

function Profile({
  attempts,
  questions,
  today,
  onReset,
}: {
  attempts: Attempt[];
  questions: QuestionSummary[];
  today: string;
  onReset: () => void;
}) {
  const summary = summarize(attempts, today);
  const byType = statsByType(attempts);
  const weakType = recommendType(attempts);
  const drill = pickNextQuestion(questions, attempts);
  const weakStats = byType[weakType];

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Questions done"
          value={String(summary.questionsDone)}
          detail={`of ${questions.length} in the bank`}
        />
        <StatTile
          label="Average reasoning score"
          value={summary.averageScore === null ? "—" : String(Math.round(summary.averageScore))}
          detail="out of 100"
        />
        <StatTile
          label="Multiple-choice accuracy"
          value={
            summary.picks === 0
              ? "—"
              : `${Math.round((summary.correctPicks / summary.picks) * 100)}%`
          }
          detail={
            summary.picks === 0
              ? "No choices picked yet"
              : `${summary.correctPicks} of ${summary.picks} right`
          }
        />
        <StatTile
          label="Day streak"
          value={String(summary.streakDays)}
          detail={summary.streakDays === 1 ? "day in a row" : "days in a row"}
        />
      </dl>

      <Card title="Reasoning score by question type">
        <TypeMeters stats={byType} />
      </Card>

      <section className="rounded-xl border border-accent/30 bg-accent-soft p-5 sm:p-6">
        <h2 className="text-xl font-semibold">
          Recommended drill: {QUESTION_TYPE_INFO[weakType].label}
        </h2>
        <p className="mt-2 max-w-2xl leading-relaxed">
          {weakStats.averageScore !== null && weakStats.attempts >= 2
            ? `This is your lowest average so far: ${Math.round(weakStats.averageScore)} out of 100 over ${weakStats.attempts} attempts.`
            : "This is the question type you have practiced least."}
        </p>
        <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          {drill && (
            <Link href={`/practice/${drill.id}`} className={PRIMARY_BUTTON}>
              Start this drill
            </Link>
          )}
          <Link
            href={`/lessons/${weakType}`}
            className="rounded-md font-medium text-accent underline underline-offset-4"
          >
            Read the {QUESTION_TYPE_INFO[weakType].label} lesson first
          </Link>
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Mistakes to fix">
          <MistakeList mistakes={topMistakes(attempts)} />
        </Card>
        <Card title="Answer traps you fall for">
          <TrapList traps={topTraps(attempts)} />
        </Card>
      </div>

      <Card title="Recent attempts">
        <RecentAttempts attempts={recentAttempts(attempts)} questions={questions} />
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/lessons"
          className="rounded-md font-medium text-accent underline underline-offset-4"
        >
          All lessons
        </Link>
        <ResetProgress onReset={onReset} />
      </div>
    </div>
  );
}

/** The student's reasoning profile, built entirely from attempts saved in this browser. */
export function ProgressDashboard({ questions }: { questions: QuestionSummary[] }) {
  const attempts = useAttempts();
  const today = useToday();

  // A reset removes the content that held keyboard focus. Once the empty
  // state has replaced it, focus goes to that state's heading.
  const lockedHeading = useRef<HTMLHeadingElement>(null);
  const [resets, setResets] = useState(0);
  useEffect(() => {
    if (resets > 0) lockedHeading.current?.focus();
  }, [resets]);
  const handleReset = () => setResets((count) => count + 1);

  if (today === null) return <DashboardSkeleton />;
  return (
    <div className="space-y-6">
      {attempts.length < ATTEMPTS_TO_UNLOCK ? (
        <Locked
          attempts={attempts}
          questions={questions}
          headingRef={lockedHeading}
          onReset={handleReset}
        />
      ) : (
        <Profile
          attempts={attempts}
          questions={questions}
          today={today}
          onReset={handleReset}
        />
      )}
      <ManagePro />
    </div>
  );
}
