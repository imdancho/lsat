import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  callJSON,
  InvalidModelOutputError,
  MissingApiKeyError,
  ModelRefusalError,
} from "@/lib/anthropic";
import { buildGraderUser, GRADER_SYSTEM } from "@/lib/prompts";
import { getQuestion, toReveal } from "@/lib/questions";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { GradeResultSchema } from "@/lib/schemas";
import type { ApiErrorBody, GradeResponse } from "@/lib/types";

// Grading is one model call; allow for a slow one.
export const maxDuration = 60;

const GRADES_PER_HOUR = 40;
const HOUR_MS = 60 * 60 * 1000;
const MAX_ANSWER_CHARS = 600;

const answer = z.string().trim().max(MAX_ANSWER_CHARS);
const BodySchema = z.object({
  questionId: z.string().min(1).max(64),
  answers: z.object({ conclusion: answer.min(1), main: answer }),
});

function fail(
  status: number,
  code: string,
  message: string,
  headers?: HeadersInit,
): Response {
  const body: ApiErrorBody = { error: { code, message } };
  return Response.json(body, { status, headers });
}

/** Turns a failure of the model call into a response the student can act on. */
function modelFailure(error: unknown): Response {
  if (error instanceof MissingApiKeyError) {
    return fail(
      503,
      "missing_api_key",
      "AI grading is not configured: ANTHROPIC_API_KEY is not set on the server.",
    );
  }
  if (error instanceof ModelRefusalError) {
    return fail(
      422,
      "refused",
      "The grader could not assess that answer. Rephrase it and try again.",
    );
  }
  if (error instanceof InvalidModelOutputError) {
    console.error("[grade]", error.message);
    return fail(502, "bad_model_output", "The grader returned an unreadable result. Try again.");
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return fail(
      503,
      "invalid_api_key",
      "AI grading is not configured: the server's ANTHROPIC_API_KEY was rejected.",
    );
  }
  if (error instanceof Anthropic.RateLimitError) {
    return fail(503, "grader_busy", "The grader is busy right now. Try again in a moment.");
  }
  if (error instanceof Anthropic.APIError) {
    console.error("[grade] Anthropic API error", error.status, error.message);
    return fail(502, "grader_unavailable", "The grader is unavailable right now. Try again.");
  }
  console.error("[grade] unexpected error", error);
  return fail(500, "internal", "Something went wrong while grading. Try again.");
}

export async function POST(request: Request): Promise<Response> {
  const limit = rateLimit(`grade:${clientIp(request)}`, GRADES_PER_HOUR, HOUR_MS);
  if (!limit.ok) {
    return fail(
      429,
      "rate_limited",
      `You have reached the limit of ${GRADES_PER_HOUR} graded answers per hour.`,
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail(400, "bad_request", "The request body is not valid JSON.");
  }
  const body = BodySchema.safeParse(json);
  if (!body.success) {
    return fail(
      400,
      "bad_request",
      `Write the conclusion, and keep each answer under ${MAX_ANSWER_CHARS} characters.`,
    );
  }

  const question = getQuestion(body.data.questionId);
  if (!question) return fail(404, "not_found", "That question does not exist.");

  const { answers } = body.data;
  if (question.type !== "main_conclusion" && answers.main.length === 0) {
    return fail(400, "bad_request", "Answer the second question before checking.");
  }

  try {
    const result = await callJSON(
      GRADER_SYSTEM,
      buildGraderUser(question, answers),
      GradeResultSchema,
      { maxTokens: 2000, effort: "low" },
    );
    const response: GradeResponse = { result, ...toReveal(question) };
    return Response.json(response);
  } catch (error) {
    return modelFailure(error);
  }
}
