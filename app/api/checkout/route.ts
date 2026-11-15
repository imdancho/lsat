import { z } from "zod";
import { fail, HOUR_MS, readJson, tooManyRequests } from "@/lib/api";
import { publicOrigin } from "@/lib/origin";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { describeStripeFailure, getStripe, priceFor } from "@/lib/stripe";
import { PRO_PLANS, type CheckoutResponse } from "@/lib/types";

// One call to Stripe; the client gives up after 15 seconds and retries once.
export const maxDuration = 40;

const CHECKOUTS_PER_HOUR = 20;

const BodySchema = z.object({ plan: z.enum(PRO_PLANS) });

/** Starts a Stripe Checkout (test mode) for a plan and returns the URL to send the browser to. */
export async function POST(request: Request): Promise<Response> {
  const limit = rateLimit(`checkout:${clientIp(request)}`, CHECKOUTS_PER_HOUR, HOUR_MS);
  if (!limit.ok) {
    return tooManyRequests(
      "Too many checkout attempts. Try again later.",
      limit.retryAfterSeconds,
    );
  }

  const body = BodySchema.safeParse(await readJson(request));
  if (!body.success) return fail(400, "bad_request", "Unknown plan.");
  const { plan } = body.data;

  try {
    const stripe = getStripe();
    const price = priceFor(plan);
    const origin = publicOrigin(request);
    const session = await stripe.checkout.sessions.create({
      mode: plan === "pro_monthly" ? "subscription" : "payment",
      line_items: [{ price, quantity: 1 }],
      // Stripe fills in {CHECKOUT_SESSION_ID} itself, so it has to stay literal.
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=1`,
      allow_promotion_codes: true,
      metadata: { plan },
    });
    if (!session.url) {
      console.error("[checkout] Stripe returned a session without a URL", session.id);
      return fail(502, "stripe_unavailable", "Could not start checkout. Try again.");
    }
    const response: CheckoutResponse = { url: session.url };
    return Response.json(response);
  } catch (error) {
    const { status, code, message } = describeStripeFailure(error, "create_session");
    return fail(status, code, message);
  }
}
