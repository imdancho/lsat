// Stripe client for the demo checkout. Test mode only: no webhooks, no database.
import "server-only";

import Stripe from "stripe";
import type { ProPlan } from "@/lib/types";

/** A Stripe environment variable is missing on the server. */
export class StripeNotConfiguredError extends Error {
  constructor(readonly variable: string) {
    super(`${variable} is not set`);
    this.name = "StripeNotConfiguredError";
  }
}

/** STRIPE_SECRET_KEY is set, but it is not a test-mode secret key. */
export class StripeKeyRefusedError extends Error {
  constructor() {
    super(
      "STRIPE_SECRET_KEY must be a Stripe test-mode key (it starts with sk_test_). " +
        "Live keys are refused: this checkout is a demo and must never charge a real card.",
    );
    this.name = "StripeKeyRefusedError";
  }
}

let cached: { key: string; stripe: Stripe } | undefined;

/**
 * The Stripe client. The key is checked on every call and never at import
 * time, so a missing key shows up as a clear error on the request that needs
 * it instead of breaking the build.
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new StripeNotConfiguredError("STRIPE_SECRET_KEY");
  // Safety: accept test-mode keys only (standard or restricted).
  if (!/^(sk|rk)_test_/.test(key)) throw new StripeKeyRefusedError();
  if (cached?.key !== key) {
    cached = { key, stripe: new Stripe(key, { maxNetworkRetries: 1, timeout: 15_000 }) };
  }
  return cached.stripe;
}

// The Stripe products behind the two plans. Product ids are not secrets. Each
// can be overridden by an environment variable holding a product id (prod_…)
// or a price id (price_…).
const DEFAULT_PRODUCT: Record<ProPlan, string> = {
  pro_monthly: "prod_Vd9DF8X7jqbtmo", // Prephrase Pro
  test_day: "prod_Vd9Dql63Yy7r7t", // Prephrase Until Test Day
};

export type PlanPrice = { price: string; recurring: boolean };

/**
 * The price to charge for a plan. A product id is resolved to the product's
 * default price, and whether that price recurs decides the checkout mode.
 */
export async function priceFor(stripe: Stripe, plan: ProPlan): Promise<PlanPrice> {
  const configured =
    plan === "pro_monthly"
      ? process.env.STRIPE_PRICE_PRO_MONTHLY
      : process.env.STRIPE_PRICE_TEST_DAY;
  const id = configured?.trim() || DEFAULT_PRODUCT[plan];
  if (!id.startsWith("prod_")) return { price: id, recurring: plan === "pro_monthly" };

  const product = await stripe.products.retrieve(id, { expand: ["default_price"] });
  const price = product.default_price;
  if (!price || typeof price === "string") {
    throw new StripeNotConfiguredError(`a default price on Stripe product ${id}`);
  }
  return { price: price.id, recurring: price.recurring !== null };
}

/**
 * The publishable key for the payment form shown on the site, or null when it
 * is not set (checkout then opens on Stripe's own page). Test-mode keys only.
 */
export function publishableKey(): string | null {
  const key = (
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY
  )?.trim();
  return key && key.startsWith("pk_test_") ? key : null;
}

export type StripeFailure = { status: number; code: string; message: string };

/**
 * Turns anything thrown while talking to Stripe into an HTTP status, a code
 * and a message. Status 503 means "checkout cannot work until the server's
 * configuration is fixed"; the pricing page then offers early access instead.
 */
export function describeStripeFailure(
  error: unknown,
  action: "create_session" | "retrieve_session",
): StripeFailure {
  if (error instanceof StripeNotConfiguredError) {
    return {
      status: 503,
      code: "stripe_not_configured",
      message: `Checkout is not configured: ${error.variable} is not set on the server.`,
    };
  }
  if (error instanceof StripeKeyRefusedError) {
    return { status: 503, code: "stripe_key_refused", message: error.message };
  }
  if (
    error instanceof Stripe.errors.StripeAuthenticationError ||
    error instanceof Stripe.errors.StripePermissionError
  ) {
    return {
      status: 503,
      code: "stripe_invalid_key",
      message: "Checkout is not configured: Stripe rejected the server's STRIPE_SECRET_KEY.",
    };
  }
  if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    if (action === "retrieve_session") {
      return { status: 404, code: "not_found", message: "Stripe has no such checkout session." };
    }
    // Typically a wrong price id, or a one-time price where a recurring one is needed.
    console.error("[stripe] checkout request rejected:", error.message);
    return {
      status: 503,
      code: "stripe_bad_request",
      message: `Checkout is not configured correctly. Stripe said: ${error.message}`,
    };
  }
  if (error instanceof Stripe.errors.StripeError) {
    console.error("[stripe]", error.type, error.statusCode, error.message);
    return {
      status: 502,
      code: "stripe_unavailable",
      message: "The payment provider is unavailable right now. Try again in a moment.",
    };
  }
  console.error("[stripe] unexpected error", error);
  return { status: 500, code: "internal", message: "Something went wrong. Try again." };
}
