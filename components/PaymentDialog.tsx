"use client";

import { loadStripe } from "@stripe/stripe-js/pure";
import { useEffect, useId, useRef, useState } from "react";
import { PAID_PLANS } from "@/lib/plan";
import type { ProPlan } from "@/lib/types";

/**
 * The payment form, shown on the pricing page itself. Stripe draws the card
 * fields inside this dialog; card details never touch this site's code. When
 * the payment goes through, Stripe sends the browser to /pricing/success.
 */
export function PaymentDialog({
  plan,
  clientSecret,
  publishableKey,
  onClose,
}: {
  plan: ProPlan;
  clientSecret: string;
  publishableKey: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;
    (async () => {
      try {
        const stripe = await loadStripe(publishableKey);
        if (!stripe) throw new Error("Stripe.js did not load");
        const checkout = await stripe.createEmbeddedCheckoutPage({ clientSecret });
        if (cancelled || !formRef.current) {
          checkout.destroy();
          return;
        }
        checkout.mount(formRef.current);
        destroy = () => checkout.destroy();
        setStatus("ready");
      } catch (error) {
        console.error("[checkout] could not show the payment form", error);
        if (!cancelled) setStatus("failed");
      }
    })();
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [clientSecret, publishableKey]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto max-h-[92dvh] w-[calc(100%-1rem)] max-w-2xl overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-left text-ink shadow-xl backdrop:bg-ink/50"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <h2 id={titleId} className="text-xl font-semibold">
          {PAID_PLANS[plan].name} — {PAID_PLANS[plan].price} {PAID_PLANS[plan].period}
        </h2>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:border-accent"
        >
          Close
        </button>
      </div>
      <div className="p-2 sm:p-4">
        {status === "loading" && (
          <p role="status" className="p-6 text-center text-muted">
            Loading the payment form…
          </p>
        )}
        {status === "failed" && (
          <p role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
            The payment form could not be loaded. Check your connection, close
            this window and try again.
          </p>
        )}
        <div ref={formRef} />
      </div>
    </dialog>
  );
}
