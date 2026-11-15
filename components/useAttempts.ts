"use client";

import { useSyncExternalStore } from "react";
import { readStore, serverStore, subscribeToStore } from "@/lib/progress";
import { localDay } from "@/lib/stats";
import type { Attempt } from "@/lib/types";

/**
 * The student's saved attempts, oldest first, kept in sync with localStorage.
 * Empty during server rendering and hydration, then the real list.
 */
export function useAttempts(): Attempt[] {
  return useSyncExternalStore(subscribeToStore, readStore, serverStore).attempts;
}

const subscribeToNothing = () => () => {};

/**
 * Today's local date (YYYY-MM-DD), or null while rendering on the server and
 * during hydration. Besides giving the date, the null tells a component that
 * browser-only data such as saved attempts has not been read yet.
 */
export function useToday(): string | null {
  return useSyncExternalStore(
    subscribeToNothing,
    () => localDay(new Date()),
    () => null,
  );
}
