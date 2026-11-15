"use client";

import { useEffect, useState } from "react";

const TEST_CARD = "4242 4242 4242 4242";

/** Tells visitors that checkout is a Stripe test-mode demo and which card to use. */
export function TestModeBanner() {
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");

  // Put the button's label back a moment after it reported the result.
  useEffect(() => {
    if (copy === "idle") return;
    const timer = window.setTimeout(() => setCopy("idle"), 2500);
    return () => window.clearTimeout(timer);
  }, [copy]);

  async function copyCardNumber() {
    try {
      await navigator.clipboard.writeText(TEST_CARD.replaceAll(" ", ""));
      setCopy("copied");
    } catch {
      setCopy("failed"); // no clipboard access (permission denied, or not a secure page)
    }
  }

  return (
    <aside
      aria-label="Test mode"
      className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-accent/30 bg-accent-soft p-4 sm:px-5"
    >
      <p className="min-w-0 flex-1 basis-72 leading-relaxed">
        <span className="font-semibold">
          Demo checkout in Stripe test mode — no real charge.
        </span>{" "}
        Use card{" "}
        <span className="whitespace-nowrap font-mono font-semibold">{TEST_CARD}</span>
        , any future date, any CVC, any ZIP.
      </p>
      <button
        type="button"
        onClick={copyCardNumber}
        className="shrink-0 rounded-lg border border-accent/40 bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-accent"
      >
        {copy === "copied"
          ? "✓ Copied"
          : copy === "failed"
            ? "Couldn't copy — select it instead"
            : "Copy card number"}
      </button>
      <span role="status" className="sr-only">
        {copy === "copied" && "Card number copied."}
        {copy === "failed" && "The card number could not be copied."}
      </span>
    </aside>
  );
}

/** The one-line version, for inside a pricing card. */
export function TestModeNote() {
  return (
    <p className="text-sm text-muted">Stripe test mode · no real charge</p>
  );
}
