// The full bank, answer keys included. Importing this from a Client Component
// is a build error, which is what keeps the keys out of the browser bundle.
import "server-only";

import bank from "@/data/questions.json";
import { QuestionBankSchema } from "@/lib/schemas";
import type {
  PublicQuestion,
  Question,
  QuestionReveal,
  QuestionSummary,
} from "@/lib/types";

const QUESTIONS: Question[] = QuestionBankSchema.parse(bank);
const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

export function loadQuestions(): Question[] {
  return QUESTIONS;
}

export function getQuestion(id: string): Question | undefined {
  return BY_ID.get(id);
}

/** Everything the student may see before answering: no key, no correct answer. */
export function toPublicQuestion(q: Question): PublicQuestion {
  return {
    id: q.id,
    type: q.type,
    difficulty: q.difficulty,
    topic: q.topic,
    stimulus: q.stimulus,
    stem: q.stem,
    choices: q.choices,
  };
}

/** The answer-side fields, sent only in the response to a graded answer. */
export function toReveal(q: Question): QuestionReveal {
  return {
    correctIndex: q.correctIndex,
    choiceExplanations: q.choiceExplanations,
    choiceTraps: q.choiceTraps,
    mostTempting: q.mostTempting,
    flawTag: q.key.flawTag,
  };
}

/** A listing entry for menus and "next question" links. */
export function toSummary(q: Question): QuestionSummary {
  return { id: q.id, type: q.type, difficulty: q.difficulty, topic: q.topic };
}

export function listSummaries(): QuestionSummary[] {
  return QUESTIONS.map(toSummary);
}
