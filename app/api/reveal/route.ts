import { z } from "zod";
import { fail, HOUR_MS, readJson, refuseForeign, tooManyRequests } from "@/lib/api";
import { getQuestion, toReveal } from "@/lib/questions";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { QuestionReveal } from "@/lib/types";

const REVEALS_PER_HOUR = 120;

const BodySchema = z.object({
  questionId: z.string().min(1).max(64),
  pick: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

/**
 * Multiple-choice mode: releases the correct answer and the explanations for a
 * question, but only in answer to a pick. Nothing here calls the model, so it
 * does not count against the free plan's AI-graded answers.
 */
export async function POST(request: Request): Promise<Response> {
  const refusal = refuseForeign(request);
  if (refusal) return refusal;

  const limit = rateLimit(`reveal:${clientIp(request)}`, REVEALS_PER_HOUR, HOUR_MS);
  if (!limit.ok) {
    return tooManyRequests(
      `You have reached the limit of ${REVEALS_PER_HOUR} answers per hour.`,
      limit.retryAfterSeconds,
    );
  }

  const body = BodySchema.safeParse(await readJson(request));
  if (!body.success) {
    return fail(400, "bad_request", "Pick one of the five answer choices.");
  }

  const question = getQuestion(body.data.questionId);
  if (!question) return fail(404, "not_found", "That question does not exist.");

  const reveal: QuestionReveal = toReveal(question);
  return Response.json(reveal);
}
