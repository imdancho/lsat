// Everything the app remembers lives in this browser's storage: no account, no server.
import { z } from "zod";
import {
  FLAW_TAGS,
  PRO_PLANS,
  QUESTION_TYPES,
  STUDENT_MISTAKE_TAGS,
  TRAP_TAGS,
  type Attempt,
  type Membership,
  type TestResult,
  type Usage,
} from "@/lib/types";

export const STORAGE_KEY = "prephrase:v1";
/** sessionStorage flag set by ?demo=1: the daily limit is off for this tab. */
export const DEMO_KEY = "prephrase:demo";

const AttemptSchema: z.ZodType<Attempt> = z.object({
  questionId: z.string(),
  type: z.enum(QUESTION_TYPES),
  flawTag: z.enum(FLAW_TAGS),
  score: z.number().min(0).max(100).nullable(),
  mistakeTags: z.array(z.enum(STUDENT_MISTAKE_TAGS)),
  mcqCorrect: z.boolean().nullable(),
  mcqTrap: z.enum(TRAP_TAGS).nullable(),
  inputMode: z.enum(["typed", "voice"]),
  at: z.iso.datetime(),
});

const MembershipSchema: z.ZodType<Membership> = z.object({
  pro: z.literal(true),
  plan: z.enum(PRO_PLANS),
  since: z.iso.datetime(),
});

const UsageSchema: z.ZodType<Usage> = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().int().min(0),
});

const TestResultSchema: z.ZodType<TestResult> = z.object({
  at: z.iso.datetime(),
  correct: z.number().int().min(0),
  total: z.number().int().min(1),
  seconds: z.number().min(0),
});

/** Everything this app keeps in localStorage. */
export type Store = {
  attempts: Attempt[];
  /** Finished timed sections, oldest first. */
  tests: TestResult[];
  /** Set after a confirmed checkout; null on the free plan. */
  membership: Membership | null;
  /** AI-graded answers used on the most recent day of practice. */
  usage: Usage | null;
};

const EMPTY_STORE: Store = { attempts: [], tests: [], membership: null, usage: null };
const CHANGE_EVENT = "prephrase:progress";

function parsePart<T>(schema: z.ZodType<T>, value: unknown): T | null {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * Reads the stored JSON leniently: a part that no longer fits its schema is
 * dropped by itself instead of taking everything else down with it.
 */
function parseStore(raw: string | null): Store {
  if (!raw) return EMPTY_STORE;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return EMPTY_STORE;
    const fields = data as Record<string, unknown>;
    const entries: unknown[] = Array.isArray(fields.attempts) ? fields.attempts : [];
    return {
      attempts: entries.flatMap((entry) => {
        const attempt = parsePart(AttemptSchema, entry);
        return attempt ? [attempt] : [];
      }),
      tests: (Array.isArray(fields.tests) ? fields.tests : []).flatMap((entry: unknown) => {
        const test = parsePart(TestResultSchema, entry);
        return test ? [test] : [];
      }),
      membership: parsePart(MembershipSchema, fields.membership),
      usage: parsePart(UsageSchema, fields.usage),
    };
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

/** The stored object exactly as it is, including anything this version does not understand. */
function readRawFields(): Record<string, unknown> {
  try {
    const data: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    return typeof data === "object" && data !== null && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/**
 * Saves a change to part of the store. Everything else in storage is written
 * back untouched, including fields and attempt entries this version of the app
 * cannot read: a tab still running an older version must not erase what a
 * newer one saved.
 */
function updateStore(
  change: (store: Store) => Partial<Store>,
  { keepUnreadableAttempts = true } = {},
) {
  try {
    const stored = readRawFields();
    const patch = change(readStore());
    const next: Record<string, unknown> = { ...stored, ...patch };
    if (patch.attempts && keepUnreadableAttempts && Array.isArray(stored.attempts)) {
      const unreadable = stored.attempts.filter(
        (entry: unknown) => !AttemptSchema.safeParse(entry).success,
      );
      next.attempts = [...unreadable, ...patch.attempts];
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return; // storage full or blocked: the session still works, it just isn't saved
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Calls back whenever stored state changes, in this tab or another one. */
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
    attempts: [...store.attempts.filter((a) => a.at !== attempt.at), attempt],
  }));
}

/**
 * Saves a finished timed section: its result, and one attempt per answered
 * question so the picks count toward the progress page.
 */
export function saveTest(result: TestResult, attempts: Attempt[]) {
  updateStore((store) => ({
    tests: [...store.tests, result].slice(-50),
    attempts: [...store.attempts, ...attempts],
  }));
}

/** Deletes every saved attempt, readable or not. The plan and today's usage count are kept. */
export function clearAttempts() {
  updateStore(() => ({ attempts: [] }), { keepUnreadableAttempts: false });
}

/** Counts one AI-graded answer against the given local day (YYYY-MM-DD). */
export function recordGradedAnswer(day: string) {
  updateStore((store) => ({
    usage: { day, count: (store.usage?.day === day ? store.usage.count : 0) + 1 },
  }));
}

/** Turns Pro on in this browser. An existing membership on the same plan keeps its start date. */
export function saveMembership(membership: Membership) {
  updateStore((store) => ({
    membership:
      store.membership?.plan === membership.plan ? store.membership : membership,
  }));
}

/** Turns Pro off in this browser (the demo's way to get back to the free plan). */
export function clearMembership() {
  updateStore(() => ({ membership: null }));
}

/**
 * Whether demo mode (no daily limit) is on for this tab. False on the server.
 * A page opened with ?demo=1 counts at once, before the flag has been stored.
 */
export function readDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  const requested = new URLSearchParams(window.location.search).get("demo");
  if (requested === "1") return true;
  if (requested === "0") return false;
  try {
    return window.sessionStorage.getItem(DEMO_KEY) === "1";
  } catch {
    return false;
  }
}

/** Switches demo mode for this tab; it ends when the tab is closed. */
export function setDemoMode(on: boolean) {
  try {
    if (on) window.sessionStorage.setItem(DEMO_KEY, "1");
    else window.sessionStorage.removeItem(DEMO_KEY);
  } catch {
    return; // storage blocked: demo mode simply stays off
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
