import type { Metadata } from "next";
import { TimedTest } from "@/components/TimedTest";
import { loadQuestions, toPublicQuestion } from "@/lib/questions";

export const metadata: Metadata = {
  title: "Timed LR mini-section (LSAT-style)",
};

export default function TimedTestPage() {
  // Only the public half of each question goes to the browser. Answers come
  // back from /api/test/score after the section is handed in.
  const bank = loadQuestions().map(toPublicQuestion);
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Timed LR mini-section (LSAT-style)
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">
        Practice under test conditions with original LSAT-style questions. This
        is not an official LSAT section.
      </p>
      <div className="mt-8">
        <TimedTest bank={bank} />
      </div>
    </div>
  );
}
