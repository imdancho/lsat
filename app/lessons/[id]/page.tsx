import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonCard } from "@/components/LessonCard";
import { LESSON_IDS, LESSONS } from "@/data/lessons";
import { parseFocus } from "@/lib/stats";
import { focusInfo } from "@/lib/taxonomy";

export function generateStaticParams() {
  return LESSON_IDS.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/lessons/[id]">): Promise<Metadata> {
  const focus = parseFocus((await params).id);
  return { title: focus ? `Lesson: ${LESSONS[focus].title}` : "Lesson not found" };
}

export default async function LessonPage({ params }: PageProps<"/lessons/[id]">) {
  const focus = parseFocus((await params).id);
  if (!focus) notFound();

  const lesson = LESSONS[focus];
  const { label, kind } = focusInfo(focus);

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">
        {kind} · {label}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {lesson.title}
      </h1>
      <div className="mt-6">
        <LessonCard lesson={lesson} />
      </div>
      <p className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link
          href={`/practice?focus=${focus}`}
          className="inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-accent-strong"
        >
          Practice this now
        </Link>
        <Link
          href="/lessons"
          className="rounded-md font-medium text-accent underline underline-offset-4"
        >
          All lessons
        </Link>
      </p>
    </article>
  );
}
