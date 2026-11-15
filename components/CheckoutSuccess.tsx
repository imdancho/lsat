"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PAID_PLANS } from "@/lib/plan";
import { saveMembership } from "@/lib/progress";
import type { ProPlan, VerifyResponse } from "@/lib/types";

type Confirmation =
  | { status: "confirmed"; plan: ProPlan; email: string | null }
  | { status: "failed" };

const PRIMARY_BUTTON =
  "inline-block rounded-lg bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-strong";
const SECONDARY_BUTTON =
  "inline-block rounded-lg border border-line bg-surface px-6 py-3 font-medium transition-colors hover:border-accent";

/** Asks the server whether Stripe reports the session as completed and paid. */
async function confirmSession(sessionId: string): Promise<Confirmation> {
  try {
    const response = await fetch(
      `/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`,
      { cache: "no-store" },
    );
    const body = (await response.json().catch(() => null)) as VerifyResponse | null;
    if (response.ok && body?.ok === true) {
      return { status: "confirmed", plan: body.plan, email: body.email };
    }
  } catch {
    // Network failure: reported as "could not confirm" below.
  }
  return { status: "failed" };
}

export function CheckoutPending() {
  return (
    <div role="status">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Confirming your payment…
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        One moment while we check with Stripe.
      </p>
    </div>
  );
}

/**
 * Where Stripe sends the visitor after checkout. Confirms the session with the
 * server and, if it was paid, turns Pro on in this browser. Needs a <Suspense>
 * boundary because it reads the query string.
 */
export function CheckoutSuccess() {
  const sessionId = useSearchParams().get("session_id");
  const [retries, setRetries] = useState(0);
  // The answer for one particular check, so an old answer is never shown for a new one.
  const [checked, setChecked] = useState<{ key: string; result: Confirmation } | null>(null);
  const key = `${sessionId}#${retries}`;

  useEffect(() => {
    if (!sessionId) return;
    let stale = false;
    void confirmSession(sessionId).then((result) => {
      // A confirmed payment counts even if the visitor has already left this page.
      if (result.status === "confirmed") {
        saveMembership({ pro: true, plan: result.plan, since: new Date().toISOString() });
      }
      if (!stale) setChecked({ key, result });
    });
    return () => {
      stale = true;
    };
  }, [sessionId, key]);

  const result: Confirmation | null = !sessionId
    ? { status: "failed" }
    : checked?.key === key
      ? checked.result
      : null;

  if (result === null) return <CheckoutPending />;

  if (result.status === "confirmed") {
    const planName = PAID_PLANS[result.plan].name;
    return (
      <div role="status">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Welcome to Pro 🎉
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Your {planName} payment is confirmed
          {result.email ? ` for ${result.email}` : ""}. The daily limit is gone
          on this device, so you can have every answer graded.
        </p>
        <p className="mt-8">
          <Link href="/practice" className={PRIMARY_BUTTON}>
            Start practicing
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div role="alert">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        We couldn&rsquo;t confirm the payment
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        {sessionId
          ? "Stripe did not report a completed payment for this checkout, so Pro was not turned on. If you finished paying, try again in a moment."
          : "This page opens after a checkout. There is no checkout to confirm here."}
      </p>
      <p className="mt-8 flex flex-wrap gap-3">
        {sessionId && (
          <button
            type="button"
            onClick={() => setRetries((count) => count + 1)}
            className={PRIMARY_BUTTON}
          >
            Check again
          </button>
        )}
        <Link href="/pricing" className={SECONDARY_BUTTON}>
          Back to pricing
        </Link>
      </p>
    </div>
  );
}
