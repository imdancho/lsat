import type { Metadata } from "next";
import Link from "next/link";
import { LESSONS } from "@/data/lessons";
import { MISTAKE_TAG_INFO, QUESTION_TYPE_INFO } from "@/lib/taxonomy";
import { QUESTION_TYPES, STUDENT_MISTAKE_TAGS, type Focus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Lessons",
};

function LessonLinks({
  items,
}: {
  items: { id: Focus; label: string; description: string }[];
}) {
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {items.map(({ id, label, description }) => (
        <li key={id}>
          <Link
            href={`/lessons/${id}`}
            className="block h-full rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent"
          >
            <span className="text-sm font-semibold uppercase tracking-wide text-accent">
              {label}
            </span>
            <span className="mt-1 block font-serif text-lg font-semibold">
              {LESSONS[id].title}
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-muted">
              {description}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function LessonsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Lessons</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">
        Short lessons, each with one worked example and a three-step checklist.
        Your progress page points you to the ones that match your mistakes.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">By question type</h2>
        <LessonLinks
          items={QUESTION_TYPES.map((id) => ({ id, ...QUESTION_TYPE_INFO[id] }))}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">By reasoning mistake</h2>
        <LessonLinks
          items={STUDENT_MISTAKE_TAGS.map((id) => ({ id, ...MISTAKE_TAG_INFO[id] }))}
        />
      </section>
    </div>
  );
}
