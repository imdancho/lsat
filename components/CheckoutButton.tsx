"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { EarlyAccessDialog } from "@/components/EarlyAccessDialog";
import { PaymentDialog } from "@/components/PaymentDialog";
import { Toast } from "@/components/Toast";
import { useMembership } from "@/components/useAttempts";
import { PAID_PLANS } from "@/lib/plan";
import type {
  ApiErrorBody,
  CheckoutRequest,
  CheckoutResponse,
  ProPlan,
} from "@/lib/types";

type CheckoutOutcome =
  | { kind: "redirect"; url: string }
  | { kind: "form"; clientSecret: string; publishableKey: string }
  /** The server has no working Stripe setup. */
  | { kind: "unavailable" }
  | { kind: "error"; message: string };

const GENERIC_ERROR = "Could not start checkout. Try again.";

/** Asks the server for a Stripe Checkout URL for the plan. */
async function startCheckout(plan: ProPlan): Promise<CheckoutOutcome> {
  const request: CheckoutRequest = { plan };
  let response: Response;
  try {
    response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    return {
      kind: "error",
      message: "Could not reach the server. Check your connection and try again.",
    };
  }
  const body: unknown = await response.json().catch(() => null);
  if (response.ok) {
    const checkout = body as CheckoutResponse | null;
    if (checkout?.kind === "embedded" && checkout.clientSecret && checkout.publishableKey) {
      return {
        kind: "form",
        clientSecret: checkout.clientSecret,
        publishableKey: checkout.publishableKey,
      };
    }
    if (checkout?.kind === "hosted" && checkout.url) {
      return { kind: "redirect", url: checkout.url };
    }
    return { kind: "error", message: GENERIC_ERROR };
  }
  // 503: Stripe is not set up on this server, so offer early access instead.
  if (response.status === 503) return { kind: "unavailable" };
  return {
    kind: "error",
    message: (body as ApiErrorBody | null)?.error?.message ?? GENERIC_ERROR,
  };
}

/**
 * Starts checkout for a plan: a payment form on this page, or Stripe's own
 * page when the form is not configured. If the server cannot offer checkout
 * at all, it opens the early-access form instead, so the button never dead-ends.
 */
export function CheckoutButton({
  plan,
  emphasized = false,
}: {
  plan: ProPlan;
  /** Solid accent style, for the highlighted plan. */
  emphasized?: boolean;
}) {
  const membership = useMembership();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [earlyAccess, setEarlyAccess] = useState(false);
  const [payment, setPayment] = useState<{ clientSecret: string; publishableKey: string } | null>(null);

  // Pages stay mounted while hidden. If the visitor moves to another page,
  // drop anything in progress here: an answer that arrives later must not
  // pull them into checkout, and a modal dialog must not be left open.
  const onScreen = useRef(true);
  useLayoutEffect(() => {
    onScreen.current = true;
    return () => {
      onScreen.current = false;
      setStarting(false);
      setError(null);
      setEarlyAccess(false);
      setPayment(null);
    };
  }, []);

  // Coming back from Stripe with the Back button can restore this page from
  // the browser's cache with the button still in its "redirecting" state.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setStarting(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  async function handleClick() {
    if (starting) return;
    setStarting(true);
    setError(null);
    const outcome = await startCheckout(plan);
    if (!onScreen.current) return;
    if (outcome.kind === "redirect") {
      window.location.href = outcome.url; // stays "starting" until the browser leaves
      return;
    }
    setStarting(false);
    if (outcome.kind === "form") setPayment(outcome);
    else if (outcome.kind === "unavailable") setEarlyAccess(true);
    else setError(outcome.message);
  }

  const isCurrentPlan = membership?.plan === plan;
  const style = emphasized
    ? "bg-accent text-white hover:bg-accent-strong"
    : "border border-accent bg-surface text-accent hover:bg-accent-soft";

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        // While checkout is opening the button is only marked as busy, not
        // disabled: a disabled button drops keyboard focus, and the
        // early-access dialog hands focus back to this button when it closes.
        aria-disabled={starting || undefined}
        disabled={isCurrentPlan}
        className={`w-full rounded-lg px-5 py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:border-transparent disabled:bg-line disabled:text-muted aria-disabled:cursor-progress aria-disabled:opacity-70 ${style}`}
      >
        {isCurrentPlan
          ? "✓ Your current plan"
          : starting
            ? "Opening checkout…"
            : PAID_PLANS[plan].cta}
      </button>
      {error && (
        <Toast tone="error" onDismiss={() => setError(null)}>
          {error}
        </Toast>
      )}
      {payment && (
        <PaymentDialog
          plan={plan}
          clientSecret={payment.clientSecret}
          publishableKey={payment.publishableKey}
          onClose={() => setPayment(null)}
        />
      )}
      {earlyAccess && (
        <EarlyAccessDialog plan={plan} onClose={() => setEarlyAccess(false)} />
      )}
    </>
  );
}
