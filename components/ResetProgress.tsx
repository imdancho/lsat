"use client";

import { useLayoutEffect, useState } from "react";
import { clearAttempts } from "@/lib/progress";

/**
 * Deletes the saved attempts, after a confirmation shown in the page itself.
 * `onReset` runs once the attempts are gone, so the page can move keyboard
 * focus to whatever replaces the content that was just removed.
 */
export function ResetProgress({ onReset }: { onReset?: () => void }) {
  const [confirming, setConfirming] = useState(false);
  // Set when the student cancels: the trigger then takes focus back as it
  // reappears, instead of leaving the keyboard at the top of the page.
  const [returnFocus, setReturnFocus] = useState(false);

  // Pages stay mounted while hidden, so close the question when the student
  // leaves; otherwise it would still be open on their next visit.
  useLayoutEffect(
    () => () => {
      setConfirming(false);
      setReturnFocus(false);
    },
    [],
  );

  if (!confirming) {
    return (
      <button
        type="button"
        autoFocus={returnFocus}
        onClick={() => setConfirming(true)}
        className="rounded-md text-sm font-medium text-muted underline underline-offset-4 hover:text-ink"
      >
        Reset progress
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Confirm reset"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900"
    >
      <p className="mr-auto">
        Delete every saved attempt on this device? This cannot be undone.
      </p>
      <button
        type="button"
        onClick={() => {
          clearAttempts();
          onReset?.();
        }}
        className="rounded-md bg-red-700 px-4 py-1.5 font-medium text-white hover:bg-red-800"
      >
        Yes, reset
      </button>
      <button
        type="button"
        autoFocus
        onClick={() => {
          setReturnFocus(true);
          setConfirming(false);
        }}
        className="rounded-md border border-red-300 bg-white px-4 py-1.5 font-medium"
      >
        Cancel
      </button>
    </div>
  );
}
