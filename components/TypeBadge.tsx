import { QUESTION_TYPE_INFO } from "@/lib/taxonomy";
import type { Difficulty, QuestionType } from "@/lib/types";

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};

export function TypeBadge({ type }: { type: QuestionType }) {
  return (
    <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
      {QUESTION_TYPE_INFO[type].label}
    </span>
  );
}

export function DifficultyLabel({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className="text-sm text-muted">{DIFFICULTY_LABEL[difficulty]}</span>
  );
}
