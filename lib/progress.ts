// Student progress lives in this browser's localStorage: no account, no server.
import { z } from "zod";
import {
  FLAW_TAGS,
  QUESTION_TYPES,
  STUDENT_MISTAKE_TAGS,
  TRAP_TAGS,
  type Attempt,
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
  at: z.iso.datetime(),
});

/** Everything this app keeps in the browser. */
export type Store = { attempts: Attempt[] };

const EMPTY_STORE: Store = { attempts: [] };
const CHANGE_EVENT = "prephrase:progress";

/**
 * Reads the stored JSON leniently: an entry that no longer fits the schema is
 * dropped by itself instead of taking every other attempt down with it.
 */
function parseStore(raw: string | null): Store {
  if (!raw) return EMPTY_STORE;
  try {
    const data: unknown = JSON.parse(raw);
    const entries: unknown[] =
      typeof data === "object" && data !== null && "attempts" in data && Array.isArray(data.attempts)
        ? data.attempts
        : [];
    const attempts = entries.flatMap((entry) => {
      const parsed = AttemptSchema.safeParse(entry);
      return parsed.success ? [parsed.data] : [];
    });
    return { attempts };
  } catch {
    return EMPTY_STORE; // corrupted JSON: start clean rather than crash the page
  }
}

// useSyncExternalStore needs the same object back until the stored value changes.
let cachedRaw: string | null | undefined;
let cachedStore: Store = EMPTY_STORE;

/** The stored state. Safe to call during server rendering, where it is empty. */
export function readStore(): Store {
  if (typeof window === "undefined") return EMPTY_STORE;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null; // storage blocked (private mode, disabled cookies)
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedStore = parseStore(raw);
  }
  return cachedStore;
}

export const serverStore = (): Store => EMPTY_STORE;

function updateStore(update: (store: Store) => Store) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(update(readStore())));
  } catch {
    return; // storage full or blocked: the session still works, it just isn't saved
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Calls back whenever the stored state changes, in this tab or another one. */
export function subscribeToStore(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Adds an attempt, or replaces the one with the same timestamp. */
export function saveAttempt(attempt: Attempt) {
  updateStore((store) => ({
    ...store,
    attempts: [...store.attempts.filter((a) => a.at !== attempt.at), attempt],
  }));
}

/** Deletes every saved attempt. */
export function clearAttempts() {
  updateStore((store) => ({ ...store, attempts: [] }));
}
