import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  callJSON,
  InvalidModelOutputError,
  MissingApiKeyError,
  ModelRefusalError,
} from "@/lib/anthropic";
import {
  buildGraderUser,
  GRADER_SYSTEM,
  type StudentSubmission,
} from "@/lib/prompts";
import { getQuestion, toReveal } from "@/lib/questions";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { GradeResultSchema } from "@/lib/schemas";
import type { ApiErrorBody, GradeResponse } from "@/lib/types";

// Grading is one model call; allow for a slow one.
export const maxDuration = 60;

const GRADES_PER_HOUR = 40;
const HOUR_MS = 60 * 60 * 1000;
const MAX_ANSWER_CHARS = 600;
const MAX_TRANSCRIPT_CHARS = 1500;

const questionId = z.string().min(1).max(64);
const answer = z.string().trim().max(MAX_ANSWER_CHARS);
const FieldsBodySchema = z.object({
  questionId,
  answers: z.object({ conclusion: answer.min(1), main: answer }),
  inputMode: z.enum(["typed", "voice"]).optional(),
});
// One-take voice mode: a single recording covers both answers.
const VoiceBodySchema = z.object({
  questionId,
  mode: z.literal("voice_single"),
  transcript: z.string().trim().min(1).max(MAX_TRANSCRIPT_CHARS),
});
const BodySchema = z.union([VoiceBodySchema, FieldsBodySchema]);

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
      `Your answer is missing or too long. Typed answers can be up to ${MAX_ANSWER_CHARS} characters each, a voice answer up to ${MAX_TRANSCRIPT_CHARS}.`,
    );
  }

  const question = getQuestion(body.data.questionId);
  if (!question) return fail(404, "not_found", "That question does not exist.");

  const submission: StudentSubmission =
    "mode" in body.data
      ? { mode: "voice_single", transcript: body.data.transcript }
      : {
          mode: "fields",
          answers: body.data.answers,
          dictated: body.data.inputMode === "voice",
        };
  if (
    submission.mode === "fields" &&
    question.type !== "main_conclusion" &&
    submission.answers.main.length === 0
  ) {
    return fail(400, "bad_request", "Answer the second question before checking.");
  }

  try {
    const result = await callJSON(
      GRADER_SYSTEM,
      buildGraderUser(question, submission),
      GradeResultSchema,
      { maxTokens: 2000, effort: "low" },
    );
    const response: GradeResponse = { result, ...toReveal(question) };
    return Response.json(response);
  } catch (error) {
    return modelFailure(error);
  }
}
