"use client";

import { useSyncExternalStore } from "react";
import {
  readAttempts,
  serverAttempts,
  subscribeToProgress,
} from "@/lib/progress";
import type { Attempt } from "@/lib/types";

/**
 * The student's saved attempts, kept in sync with localStorage.
 * Empty during server rendering and hydration, then the real list.
 */
export function useAttempts(): Attempt[] {
  return useSyncExternalStore(subscribeToProgress, readAttempts, serverAttempts);
}
