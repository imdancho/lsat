import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { fail, HOUR_MS, tooManyRequests } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { describeStripeFailure, getStripe } from "@/lib/stripe";
import { PRO_PLANS, type ProPlan, type VerifyResponse } from "@/lib/types";

export const maxDuration = 40;

const VERIFICATIONS_PER_HOUR = 60;
const NO_STORE = { "Cache-Control": "no-store" };
// Test-mode session ids only: this checkout is a demo.
const SESSION_ID = /^cs_test_[A-Za-z0-9_]{8,250}$/;

const isProPlan = (value: unknown): value is ProPlan =>
  typeof value === "string" && (PRO_PLANS as readonly string[]).includes(value);

/** The plan a session paid for: recorded at checkout, else told from its mode. */
function planOf(session: Stripe.Checkout.Session): ProPlan {
  const recorded = session.metadata?.plan;
  if (isProPlan(recorded)) return recorded;
  return session.mode === "subscription" ? "pro_monthly" : "test_day";
}

/** Confirms with Stripe that the checkout session in ?session_id= was completed and paid. */
export async function GET(request: NextRequest): Promise<Response> {
  // Reading the request comes first, outside any try block: `next build` runs
  // GET handlers once, and whatever happens before this line would be baked
  // into the build as the answer to every later request.
  const sessionId = request.nextUrl.searchParams.get("session_id");

  const limit = rateLimit(`verify:${clientIp(request)}`, VERIFICATIONS_PER_HOUR, HOUR_MS);
  if (!limit.ok) {
    return tooManyRequests("Too many attempts. Try again later.", limit.retryAfterSeconds);
  }
  if (!sessionId || !SESSION_ID.test(sessionId)) {
    return fail(400, "bad_request", "Missing or malformed session_id.", NO_STORE);
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const paid =
      session.status === "complete" &&
      (session.payment_status === "paid" ||
        session.payment_status === "no_payment_required");
    const body: VerifyResponse = paid
      ? {
          ok: true,
          plan: planOf(session),
          email: session.customer_details?.email ?? null,
        }
      : { ok: false };
    return Response.json(body, { headers: NO_STORE });
  } catch (error) {
    const { status, code, message } = describeStripeFailure(error, "retrieve_session");
    return fail(status, code, message, NO_STORE);
  }
}
