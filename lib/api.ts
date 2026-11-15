// Small helpers shared by the route handlers in app/api.
import type { ApiErrorBody } from "@/lib/types";

export const HOUR_MS = 60 * 60 * 1000;

/** An error response in the shape every API route uses. */
export function fail(
  status: number,
  code: string,
  message: string,
  headers?: HeadersInit,
): Response {
  const body: ApiErrorBody = { error: { code, message } };
  return Response.json(body, { status, headers });
}

/** The 429 response for a caller who has used up a rate limit. */
export function tooManyRequests(message: string, retryAfterSeconds: number): Response {
  return fail(429, "rate_limited", message, {
    "Retry-After": String(retryAfterSeconds),
  });
}

/**
 * The request body parsed as JSON, or undefined when it is not valid JSON.
 * Any JSON value can come back (null, a string, an array), so validate it.
 */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    return undefined;
  }
}
