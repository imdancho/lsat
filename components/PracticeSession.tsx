"use client";

import { useRouter } from "next/navigation";
import { PracticeFlow } from "@/components/PracticeFlow";
import type { PublicQuestion, QuestionSummary } from "@/lib/types";

type PracticeSessionProps = {
  question: PublicQuestion;
  questions: QuestionSummary[];
};

/**
 * Pages stay mounted across navigations (Cache Components), which would bring
 * back a finished attempt when the student opens the question again. Keying on
 * bfcacheId starts a fresh attempt on every new visit, while Back and Forward
 * still restore the attempt in progress.
 */
export function PracticeSession(props: PracticeSessionProps) {
  const { bfcacheId } = useRouter();
  return <PracticeFlow key={bfcacheId} {...props} />;
}
