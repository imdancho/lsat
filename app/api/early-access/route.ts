import { z } from "zod";
import { fail, HOUR_MS, readJson, refuseForeign, tooManyRequests } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { PRO_PLANS } from "@/lib/types";

const SIGNUPS_PER_HOUR = 5;

const BodySchema = z.object({
  email: z.email().max(254),
  plan: z.enum(PRO_PLANS),
});

/**
 * Early-access sign-up, offered when checkout is not available.
 *
 * There is no database in this project, so the sign-up is only written to the
 * server log, where the site owner can read it for as long as the host keeps
 * logs. Connect a mailing-list service here before relying on it.
 */
export async function POST(request: Request): Promise<Response> {
  const refusal = refuseForeign(request);
  if (refusal) return refusal;

  const limit = rateLimit(`early-access:${clientIp(request)}`, SIGNUPS_PER_HOUR, HOUR_MS);
  if (!limit.ok) {
    return tooManyRequests("Too many sign-ups from here. Try again later.", limit.retryAfterSeconds);
  }

  const body = BodySchema.safeParse(await readJson(request));
  if (!body.success) {
    return fail(400, "bad_request", "Enter a valid email address.");
  }

  // The values are validated above, so one JSON line per sign-up is safe to log.
  console.info(
    "[early-access]",
    JSON.stringify({ email: body.data.email, plan: body.data.plan, at: new Date().toISOString() }),
  );
  return Response.json({ ok: true });
}
