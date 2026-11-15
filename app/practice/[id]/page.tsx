import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticeSession } from "@/components/PracticeSession";
import {
  getQuestion,
  listSummaries,
  loadQuestions,
  toPublicQuestion,
} from "@/lib/questions";
import { QUESTION_TYPE_INFO } from "@/lib/taxonomy";

export function generateStaticParams() {
  return loadQuestions().map((question) => ({ id: question.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/practice/[id]">): Promise<Metadata> {
  const { id } = await params;
  const question = getQuestion(id);
  return {
    title: question
      ? `${QUESTION_TYPE_INFO[question.type].label} practice`
      : "Question not found",
  };
}

export default async function PracticeQuestionPage({
  params,
}: PageProps<"/practice/[id]">) {
  const { id } = await params;
  const question = getQuestion(id);
  if (!question) notFound();

  // Only the public half of the question crosses to the browser here. The key,
  // the correct answer and the explanations come back from /api/grade.
  return (
    <PracticeSession
      question={toPublicQuestion(question)}
      questions={listSummaries()}
    />
  );
}
