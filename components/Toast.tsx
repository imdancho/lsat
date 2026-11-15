"use client";

import { useEffect, useEffectEvent, type ReactNode } from "react";

type ToastProps = {
  /** "error" is announced at once and stays until dismissed. */
  tone: "info" | "error";
  children: ReactNode;
  onDismiss: () => void;
  /** Close by itself after this many milliseconds. */
  autoDismissMs?: number;
};

/** A short message pinned to the bottom of the screen, with a close button. */
export function Toast({ tone, children, onDismiss, autoDismissMs }: ToastProps) {
  const dismiss = useEffectEvent(onDismiss);
  useEffect(() => {
    if (autoDismissMs === undefined) return;
    const timer = window.setTimeout(() => dismiss(), autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [autoDismissMs]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div
        role={tone === "error" ? "alert" : "status"}
        className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${
          tone === "error"
            ? "border-red-300 bg-red-50 text-red-900"
            : "border-line bg-ink text-white"
        }`}
      >
        <p className="leading-snug">{children}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-my-2 -mr-2 flex size-10 shrink-0 items-center justify-center rounded-md text-xl leading-none opacity-80 hover:opacity-100"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
