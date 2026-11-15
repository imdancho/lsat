"use client";

import { useSyncExternalStore } from "react";
import { resolveAccess, type Access } from "@/lib/plan";
import {
  readDemoMode,
  readStore,
  serverStore,
  subscribeToStore,
} from "@/lib/progress";
import { localDay } from "@/lib/stats";
import type { Attempt, Membership } from "@/lib/types";

/**
 * The student's saved attempts, oldest first, kept in sync with localStorage.
 * Empty during server rendering and hydration, then the real list.
 */
export function useAttempts(): Attempt[] {
  return useSyncExternalStore(subscribeToStore, readStore, serverStore).attempts;
}

/** The Pro flag saved in this browser, or null (also during server rendering and hydration). */
export function useMembership(): Membership | null {
  return useSyncExternalStore(subscribeToStore, readStore, serverStore).membership;
}

/** Checks the clock again once a minute and whenever the tab comes back into view. */
function subscribeToClock(onChange: () => void): () => void {
  const timer = window.setInterval(onChange, 60_000);
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

/**
 * Today's local date (YYYY-MM-DD), or null while rendering on the server and
 * during hydration. Besides giving the date, the null tells a component that
 * browser-only data such as saved attempts has not been read yet. The value
 * rolls over at local midnight, even in a tab that was left open.
 */
export function useToday(): string | null {
  return useSyncExternalStore(
    subscribeToClock,
    () => localDay(new Date()),
    () => null,
  );
}

/**
 * What the student may do right now: Pro, demo mode, or the free plan with its
 * count of AI-graded answers left today. Null until the browser's storage has
 * been read (server rendering and hydration).
 */
export function useAccess(): Access | null {
  const store = useSyncExternalStore(subscribeToStore, readStore, serverStore);
  const demoMode = useSyncExternalStore(subscribeToStore, readDemoMode, () => false);
  const today = useToday();
  return today === null ? null : resolveAccess(store, demoMode, today);
}
