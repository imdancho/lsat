import { z } from "zod";
import { fail, HOUR_MS, readJson, refuseForeign, tooManyRequests } from "@/lib/api";
import { publicOrigin } from "@/lib/origin";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  describeStripeFailure,
  getStripe,
  priceFor,
  publishableKey,
} from "@/lib/stripe";
import { PRO_PLANS, type CheckoutResponse } from "@/lib/types";

// Up to two calls to Stripe; the client gives up on each after 15 seconds.
export const maxDuration = 60;

const CHECKOUTS_PER_HOUR = 20;

const BodySchema = z.object({ plan: z.enum(PRO_PLANS) });

/**
 * Starts a Stripe Checkout (test mode) for a plan. With a publishable key
 * configured, the answer is the secret for a payment form shown on the pricing
 * page itself; without one, it is the URL of Stripe's hosted checkout page.
 */
export async function POST(request: Request): Promise<Response> {
  const refusal = refuseForeign(request);
  if (refusal) return refusal;

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
    const { price, recurring } = await priceFor(stripe, plan);
    const origin = publicOrigin(request);
    // Stripe fills in {CHECKOUT_SESSION_ID} itself, so it has to stay literal.
    const successUrl = `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`;
    const common = {
      mode: recurring ? ("subscription" as const) : ("payment" as const),
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { plan },
    };
    const formKey = publishableKey();

    let response: CheckoutResponse;
    if (formKey) {
      const session = await stripe.checkout.sessions.create({
        ...common,
        ui_mode: "embedded_page",
        return_url: successUrl,
      });
      if (!session.client_secret) {
        console.error("[checkout] Stripe returned no client secret", session.id);
        return fail(502, "stripe_unavailable", "Could not start checkout. Try again.");
      }
      response = {
        kind: "embedded",
        clientSecret: session.client_secret,
        publishableKey: formKey,
      };
    } else {
      const session = await stripe.checkout.sessions.create({
        ...common,
        success_url: successUrl,
        cancel_url: `${origin}/pricing?canceled=1`,
      });
      if (!session.url) {
        console.error("[checkout] Stripe returned a session without a URL", session.id);
        return fail(502, "stripe_unavailable", "Could not start checkout. Try again.");
      }
      response = { kind: "hosted", url: session.url };
    }
    return Response.json(response);
  } catch (error) {
    const { status, code, message } = describeStripeFailure(error, "create_session");
    return fail(status, code, message);
  }
}
