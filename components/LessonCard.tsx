import { useId } from "react";
import type { Lesson } from "@/data/lessons";

/** One mini-lesson: the idea, a worked example, and a three-item checklist. */
export function LessonCard({ lesson }: { lesson: Lesson }) {
  const { example } = lesson;
  // Unique per instance: another lesson may stay mounted in the background.
  const exampleId = useId();
  const checklistId = useId();
  return (
    <div className="space-y-8">
      <p className="max-w-[68ch] text-[1.0625rem] leading-[1.7]">
        {lesson.explanation}
      </p>

      <section aria-labelledby={exampleId}>
        <h2 id={exampleId} className="text-xl font-semibold">
          A worked example
        </h2>
        <blockquote className="mt-3 max-w-[68ch] border-l-2 border-accent pl-4 leading-relaxed">
          {example.argument}
        </blockquote>
        <dl className="mt-4 space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <dt className="font-semibold">
              <span aria-hidden="true">✗ </span>An answer that misses
            </dt>
            <dd className="mt-1 leading-relaxed">{example.weak}</dd>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
            <dt className="font-semibold">
              <span aria-hidden="true">✓ </span>An answer that works
            </dt>
            <dd className="mt-1 leading-relaxed">{example.strong}</dd>
          </div>
        </dl>
        <p className="mt-4 max-w-[68ch] leading-relaxed">{example.why}</p>
      </section>

      <section aria-labelledby={checklistId}>
        <h2 id={checklistId} className="text-xl font-semibold">
          On your next question
        </h2>
        <ol className="mt-3 max-w-[68ch] list-decimal space-y-2 pl-5 leading-relaxed marker:font-semibold marker:text-accent">
          {lesson.avoid.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
