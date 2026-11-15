// Student progress lives in this browser's localStorage: no account, no server.
import { z } from "zod";
import {
  FLAW_TAGS,
  QUESTION_TYPES,
  STUDENT_MISTAKE_TAGS,
  TRAP_TAGS,
  type Attempt,
  type QuestionSummary,
  type QuestionType,
} from "@/lib/types";

export const STORAGE_KEY = "prephrase:v1";

const AttemptSchema: z.ZodType<Attempt> = z.object({
  questionId: z.string(),
  type: z.enum(QUESTION_TYPES),
  flawTag: z.enum(FLAW_TAGS),
  score: z.number().min(0).max(100),
  mistakeTags: z.array(z.enum(STUDENT_MISTAKE_TAGS)),
  mcqCorrect: z.boolean().nullable(),
  mcqTrap: z.enum(TRAP_TAGS).nullable(),
  inputMode: z.enum(["typed", "voice"]),
  at: z.string(),
});

const StoreSchema = z.object({ attempts: z.array(AttemptSchema) });

const NO_ATTEMPTS: Attempt[] = [];
const CHANGE_EVENT = "prephrase:progress";

// useSyncExternalStore needs the same array back until the stored value changes.
let cachedRaw: string | null | undefined;
let cachedAttempts: Attempt[] = NO_ATTEMPTS;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage blocked (private mode, disabled cookies)
  }
}

/** All attempts, oldest first. Safe to call during server rendering. */
export function readAttempts(): Attempt[] {
  if (typeof window === "undefined") return NO_ATTEMPTS;
  const raw = readRaw();
  if (raw === cachedRaw) return cachedAttempts;

  cachedRaw = raw;
  cachedAttempts = NO_ATTEMPTS;
  if (raw) {
    try {
      const parsed = StoreSchema.safeParse(JSON.parse(raw));
      if (parsed.success) cachedAttempts = parsed.data.attempts;
    } catch {
      // corrupted JSON: treat as no progress rather than crash the page
    }
  }
  return cachedAttempts;
}

function writeAttempts(attempts: Attempt[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ attempts }));
  } catch {
    return; // storage full or blocked: the session still works, it just isn't saved
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Adds an attempt, or replaces the one with the same timestamp. */
export function saveAttempt(attempt: Attempt) {
  const others = readAttempts().filter((a) => a.at !== attempt.at);
  writeAttempts([...others, attempt]);
}

export function clearProgress() {
  writeAttempts([]);
}

/** Calls back whenever progress changes, in this tab or another one. */
export function subscribeToProgress(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export const serverAttempts = (): Attempt[] => NO_ATTEMPTS;

export type TypeStats = { attempts: number; averageScore: number | null };

export function statsByType(attempts: Attempt[]): Record<QuestionType, TypeStats> {
  const stats = {} as Record<QuestionType, TypeStats>;
  for (const type of QUESTION_TYPES) {
    const scores = attempts.filter((a) => a.type === type).map((a) => a.score);
    stats[type] = {
      attempts: scores.length,
      averageScore: scores.length
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length
        : null,
    };
  }
  return stats;
}

const MIN_ATTEMPTS_TO_JUDGE = 2;

/**
 * The type to drill next: the lowest average score among types tried at least
 * twice, otherwise the least practiced type.
 */
export function recommendType(attempts: Attempt[]): QuestionType {
  const stats = statsByType(attempts);
  const judged = QUESTION_TYPES.filter(
    (type) => stats[type].attempts >= MIN_ATTEMPTS_TO_JUDGE,
  );
  if (judged.length > 0) {
    return judged.reduce((weakest, type) =>
      (stats[type].averageScore ?? 0) < (stats[weakest].averageScore ?? 0)
        ? type
        : weakest,
    );
  }
  return QUESTION_TYPES.reduce((least, type) =>
    stats[type].attempts < stats[least].attempts ? type : least,
  );
}

/**
 * The next question of a type: the first one not yet attempted, otherwise the
 * one attempted longest ago. `excludeId` skips the question on screen.
 */
export function pickNextQuestion(
  questions: QuestionSummary[],
  attempts: Attempt[],
  type: QuestionType,
  excludeId?: string,
): QuestionSummary | undefined {
  const candidates = questions.filter(
    (q) => q.type === type && q.id !== excludeId,
  );
  const lastSeen = new Map<string, string>();
  for (const attempt of attempts) lastSeen.set(attempt.questionId, attempt.at);

  const unseen = candidates.find((q) => !lastSeen.has(q.id));
  if (unseen) return unseen;

  return [...candidates].sort((a, b) =>
    (lastSeen.get(a.id) ?? "").localeCompare(lastSeen.get(b.id) ?? ""),
  )[0];
}
