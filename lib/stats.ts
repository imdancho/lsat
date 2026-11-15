// Pure functions that turn saved attempts into the numbers and recommendations
// the app shows. No storage, no clock: callers pass in "today".
import { MISTAKE_FOCUS_TYPES } from "@/lib/taxonomy";
import {
  QUESTION_TYPES,
  STUDENT_MISTAKE_TAGS,
  type Attempt,
  type Focus,
  type QuestionSummary,
  type QuestionType,
  type StudentMistakeTag,
  type TrapTag,
} from "@/lib/types";

/** Different questions a student must answer before the reasoning profile is shown. */
export const QUESTIONS_TO_UNLOCK = 3;

/** How many different questions the attempts cover. */
export const questionsAnswered = (attempts: Attempt[]): number =>
  new Set(attempts.map((a) => a.questionId)).size;

const mean = (values: number[]): number | null =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;

/**
 * Reasoning scores of the attempts that have one. Attempts answered in
 * multiple-choice mode carry no score and are left out.
 */
const scoresOf = (attempts: Attempt[]): number[] =>
  attempts.flatMap((a) => (a.score === null ? [] : [a.score]));

/** Local calendar day of a moment, as YYYY-MM-DD. */
export function localDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dayBefore(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  // Built from calendar parts, so a 23- or 25-hour day cannot skip or repeat a date.
  return localDay(new Date(year, month - 1, date - 1));
}

/**
 * Consecutive days with at least one attempt, counting back from today. A day
 * without practice only breaks the streak once it is over, so the count still
 * stands if the latest attempt was yesterday.
 */
export function dayStreak(attempts: Attempt[], today: string): number {
  const practiced = new Set(attempts.map((a) => localDay(new Date(a.at))));
  let day = practiced.has(today) ? today : dayBefore(today);
  let streak = 0;
  while (practiced.has(day)) {
    streak += 1;
    day = dayBefore(day);
  }
  return streak;
}

export type Summary = {
  /** Distinct questions from the bank answered at least once. */
  questionsDone: number;
  /** Mean reasoning score over the AI-graded attempts, 0–100. */
  averageScore: number | null;
  /** Multiple-choice picks made, and how many were right. */
  picks: number;
  correctPicks: number;
  streakDays: number;
};

export function summarize(
  attempts: Attempt[],
  questions: QuestionSummary[],
  today: string,
): Summary {
  const picked = attempts.filter((a) => a.mcqCorrect !== null);
  // An attempt can outlive its question (the bank changes between versions).
  const inBank = new Set(questions.map((q) => q.id));
  const done = attempts.map((a) => a.questionId).filter((id) => inBank.has(id));
  return {
    questionsDone: new Set(done).size,
    averageScore: mean(scoresOf(attempts)),
    picks: picked.length,
    correctPicks: picked.filter((a) => a.mcqCorrect).length,
    streakDays: dayStreak(attempts, today),
  };
}

/** One question type: its AI-graded attempts with their mean reasoning score, and its multiple-choice picks. */
export type TypeStats = {
  attempts: number;
  averageScore: number | null;
  picks: number;
  correctPicks: number;
};

export function statsByType(attempts: Attempt[]): Record<QuestionType, TypeStats> {
  const stats = {} as Record<QuestionType, TypeStats>;
  for (const type of QUESTION_TYPES) {
    const ofType = attempts.filter((a) => a.type === type);
    const scores = scoresOf(ofType);
    stats[type] = {
      attempts: scores.length,
      averageScore: mean(scores),
      picks: ofType.filter((a) => a.mcqCorrect !== null).length,
      correctPicks: ofType.filter((a) => a.mcqCorrect === true).length,
    };
  }
  return stats;
}

export type Tally<T> = { tag: T; count: number };

/** Counts tags, most frequent first; ties go to the tag seen most recently. */
function rank<T>(occurrences: T[], limit: number): Tally<T>[] {
  const tallies = new Map<T, { count: number; lastIndex: number }>();
  occurrences.forEach((tag, index) => {
    const tally = tallies.get(tag) ?? { count: 0, lastIndex: index };
    tallies.set(tag, { count: tally.count + 1, lastIndex: index });
  });
  return [...tallies.entries()]
    .sort(([, a], [, b]) => b.count - a.count || b.lastIndex - a.lastIndex)
    .slice(0, limit)
    .map(([tag, { count }]) => ({ tag, count }));
}

/** The reasoning mistakes the grader tagged most often. */
export function topMistakes(attempts: Attempt[], limit = 3): Tally<StudentMistakeTag>[] {
  return rank(attempts.flatMap((a) => a.mistakeTags), limit);
}

/** The kinds of wrong answer choice the student picked most often. */
export function topTraps(attempts: Attempt[], limit = 3): Tally<TrapTag>[] {
  const traps = attempts.flatMap((a) =>
    a.mcqCorrect === false && a.mcqTrap && a.mcqTrap !== "correct" ? [a.mcqTrap] : [],
  );
  return rank(traps, limit);
}

/** The newest attempts first. */
export function recentAttempts(attempts: Attempt[], limit = 10): Attempt[] {
  return [...attempts].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

/** Graded attempts a type needs before its average says anything. */
export const MIN_ATTEMPTS_TO_JUDGE = 2;

export type Recommendation = {
  type: QuestionType;
  reason: "lowest_average" | "least_practiced";
};

/**
 * The type to drill next: the lowest average among types graded at least
 * twice, otherwise the least practiced type.
 *
 * Averages are only compared once every type has one. Until then the student
 * is sent to the type they have practiced least; otherwise the drill would
 * lock onto whichever type happened to reach two attempts first and never
 * give the others a chance to be judged.
 */
export function recommend(attempts: Attempt[]): Recommendation {
  const stats = statsByType(attempts);
  const leastPracticed = QUESTION_TYPES.reduce((least, type) =>
    stats[type].attempts < stats[least].attempts ? type : least,
  );
  const judged = QUESTION_TYPES.filter(
    (type) => stats[type].attempts >= MIN_ATTEMPTS_TO_JUDGE,
  );
  if (judged.length < QUESTION_TYPES.length) {
    return { type: leastPracticed, reason: "least_practiced" };
  }

  const average = (type: QuestionType) => stats[type].averageScore ?? 0;
  // Equal averages: the one with fewer attempts is the less settled of the two.
  const weakest = judged.reduce((low, type) =>
    average(type) < average(low) ||
    (average(type) === average(low) && stats[type].attempts < stats[low].attempts)
      ? type
      : low,
  );
  return { type: weakest, reason: "lowest_average" };
}

export const recommendType = (attempts: Attempt[]): QuestionType =>
  recommend(attempts).type;

const isQuestionType = (value: string): value is QuestionType =>
  (QUESTION_TYPES as readonly string[]).includes(value);
const isMistakeTag = (value: string): value is StudentMistakeTag =>
  (STUDENT_MISTAKE_TAGS as readonly string[]).includes(value);

/** Reads a ?focus= value, ignoring anything that is not a known type or tag. */
export function parseFocus(value: string | null | undefined): Focus | null {
  return value && (isQuestionType(value) || isMistakeTag(value)) ? value : null;
}

/**
 * The question types a focus sends the student to, weakest first. A mistake
 * tag maps to the types where that mistake is most at home.
 */
export function focusTypes(focus: Focus, attempts: Attempt[]): QuestionType[] {
  if (isQuestionType(focus)) return [focus];
  const stats = statsByType(attempts);
  return [...MISTAKE_FOCUS_TYPES[focus]].sort(
    (a, b) => (stats[a].averageScore ?? 0) - (stats[b].averageScore ?? 0),
  );
}

/**
 * The next question to practice. With a focus, it comes from that focus's
 * types; without one, from the student's weakest type. Questions not yet
 * attempted come first, then the one attempted longest ago.
 */
export function pickNextQuestion(
  questions: QuestionSummary[],
  attempts: Attempt[],
  options: { focus?: Focus | null; excludeId?: string } = {},
): QuestionSummary | undefined {
  const types = options.focus
    ? focusTypes(options.focus, attempts)
    : [recommendType(attempts)];
  const lastSeen = new Map<string, string>();
  for (const attempt of attempts) lastSeen.set(attempt.questionId, attempt.at);

  const candidates = types.flatMap((type) =>
    questions.filter((q) => q.type === type && q.id !== options.excludeId),
  );
  const unseen = candidates.find((q) => !lastSeen.has(q.id));
  if (unseen) return unseen;

  return [...candidates].sort((a, b) =>
    (lastSeen.get(a.id) ?? "").localeCompare(lastSeen.get(b.id) ?? ""),
  )[0];
}
