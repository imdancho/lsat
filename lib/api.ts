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

/**
 * Turns away requests that the app's own pages would never send: a call made
 * from another website's page, or a POST that is not JSON. Other sites can
 * make a visitor's browser send plain-text POSTs without asking, which would
 * otherwise spend that visitor's rate limits and the server's model calls.
 * Returns the refusal, or null when the request may proceed.
 */
export function refuseForeign(request: Request): Response | null {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return fail(403, "forbidden", "This endpoint only accepts requests from this site.");
  }
  if (
    request.method === "POST" &&
    !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")
  ) {
    return fail(415, "unsupported_media_type", "Send the request body as JSON.");
  }
  return null;
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
