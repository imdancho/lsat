import type { Metadata } from "next";
import { PracticeMenu } from "@/components/PracticeMenu";
import { listSummaries } from "@/lib/questions";

export const metadata: Metadata = {
  title: "Practice",
};

export default function PracticePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Practice
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">
        Pick a question type. You will read an argument and explain it in your
        own words; the answer choices appear only after your reasoning is
        graded.
      </p>
      <div className="mt-8">
        <PracticeMenu questions={listSummaries()} />
      </div>
    </div>
  );
}
