"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { PAID_PLANS } from "@/lib/plan";
import type { ApiErrorBody, EarlyAccessRequest, ProPlan } from "@/lib/types";

type Status =
  | { step: "form"; error: string | null }
  | { step: "sending" }
  | { step: "done" };

/** Sends the sign-up and returns an error message, or null when it went through. */
async function requestEarlyAccess(request: EarlyAccessRequest): Promise<string | null> {
  try {
    const response = await fetch("/api/early-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (response.ok) return null;
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    return body?.error?.message ?? "Something went wrong. Try again.";
  } catch {
    return "Could not reach the server. Check your connection and try again.";
  }
}

/**
 * Shown instead of checkout when the server has no working Stripe setup, so a
 * plan button always leads somewhere. Mount it to open it; `onClose` fires
 * when the visitor closes it (button, Escape or a click outside).
 */
export function EarlyAccessDialog({
  plan,
  onClose,
}: {
  plan: ProPlan;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ step: "form", error: null });
  const planName = PAID_PLANS[plan].name;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus({ step: "sending" });
    const error = await requestEarlyAccess({ email: email.trim(), plan });
    setStatus(error ? { step: "form", error } : { step: "done" });
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      // A click on the backdrop lands on the dialog element itself.
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      // Explicit alignment and width: a dialog inherits text alignment from
      // wherever it sits in the page, and would otherwise touch the screen edges.
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-surface p-0 text-left text-ink shadow-xl backdrop:bg-ink/50"
    >
      <div className="p-6 sm:p-7">
        <h2 id={titleId} className="text-2xl font-semibold">
          Get early access to {planName}
        </h2>
        {status.step === "done" ? (
          <>
            <p role="status" className="mt-3 leading-relaxed">
              You&rsquo;re on the list. We&rsquo;ll email{" "}
              <span className="font-medium">{email.trim()}</span> when {planName}{" "}
              checkout opens. Until then, the free plan stays free.
            </p>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="mt-6 rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-accent-strong"
            >
              Done
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="mt-3 leading-relaxed text-muted">
              Checkout isn&rsquo;t open yet. Leave your email and we&rsquo;ll
              tell you when {planName} opens.
            </p>
            <label htmlFor={emailId} className="mt-5 block font-medium">
              Email
            </label>
            <input
              id={emailId}
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2.5"
            />
            {status.step === "form" && status.error && (
              <p role="alert" className="mt-2 text-sm text-red-800">
                {status.error}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={status.step === "sending"}
                className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
              >
                {status.step === "sending" ? "Sending…" : "Get early access"}
              </button>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="rounded-lg border border-line bg-surface px-5 py-2.5 font-medium transition-colors hover:border-accent"
              >
                Not now
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
