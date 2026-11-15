import { z } from "zod";
import { fail, HOUR_MS, readJson, refuseForeign, tooManyRequests } from "@/lib/api";
import { getQuestion, toReveal } from "@/lib/questions";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { ScoreResponse } from "@/lib/types";

const SECTIONS_PER_HOUR = 30;

const pick = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
const BodySchema = z.object({
  answers: z
    .array(z.object({ questionId: z.string().min(1).max(64), pick: pick.nullable() }))
    .min(1)
    .max(10),
});

/**
 * Scores a finished timed section: releases the correct answers and
 * explanations for its questions, once, after the student has handed it in.
 */
export async function POST(request: Request): Promise<Response> {
  const refusal = refuseForeign(request);
  if (refusal) return refusal;

  const limit = rateLimit(`score:${clientIp(request)}`, SECTIONS_PER_HOUR, HOUR_MS);
  if (!limit.ok) {
    return tooManyRequests(
      `You have reached the limit of ${SECTIONS_PER_HOUR} timed sections per hour.`,
      limit.retryAfterSeconds,
    );
  }

  const body = BodySchema.safeParse(await readJson(request));
  if (!body.success) return fail(400, "bad_request", "That is not a finished section.");

  const results: ScoreResponse["results"] = [];
  for (const { questionId } of body.data.answers) {
    const question = getQuestion(questionId);
    if (!question) return fail(404, "not_found", "That question does not exist.");
    results.push({ questionId, ...toReveal(question) });
  }
  const response: ScoreResponse = { results };
  return Response.json(response);
}
