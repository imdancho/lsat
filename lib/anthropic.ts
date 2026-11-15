import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";

/** Model used for grading, generation and blind verification. */
export const MODEL = "claude-sonnet-5-5";

/**
 * If the model declines a request on policy grounds, let the API retry it on
 * the model's default fallback instead of failing outright.
 */
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

const JSON_ONLY = "Return ONLY valid JSON, no markdown fences.";

export type Effort = "low" | "medium" | "high";

export type CallJSONOptions = {
  /** Ceiling for thinking plus the reply. */
  maxTokens: number;
  /** How hard the model thinks; "low" keeps interactive grading fast. */
  effort?: Effort;
};

/** ANTHROPIC_API_KEY is not configured on the server. */
export class MissingApiKeyError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set");
    this.name = "MissingApiKeyError";
  }
}

/** The model declined to answer. */
export class ModelRefusalError extends Error {
  constructor(readonly category: string | null) {
    super(`The model declined the request (${category ?? "no category"})`);
    this.name = "ModelRefusalError";
  }
}

/** The model answered twice with something that is not the JSON we asked for. */
export class InvalidModelOutputError extends Error {
  constructor(detail: string) {
    super(`The model did not return valid JSON: ${detail}`);
    this.name = "InvalidModelOutputError";
  }
}

let client: Anthropic | undefined;
// Cleared if the API rejects a request that asks for the fallback.
let fallbackAccepted = true;

function getClient(): Anthropic {
  // Checked per request, not at import time, so a missing key never breaks the build.
  if (!process.env.ANTHROPIC_API_KEY) throw new MissingApiKeyError();
  client ??= new Anthropic({ timeout: 45_000, maxRetries: 1 });
  return client;
}

/** Removes an accidental ```json fence or stray prose around the JSON value. */
function extractJSON(text: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.search(/[{[]/);
  const end = Math.max(body.lastIndexOf("}"), body.lastIndexOf("]"));
  return start !== -1 && end > start ? body.slice(start, end + 1) : body;
}

type MessageParams = Anthropic.Beta.MessageCreateParamsNonStreaming;

/**
 * Sends the request with the refusal fallback switched on. The fallback is a
 * beta feature, so if the API rejects a request because of it, the same
 * request goes out once more without it and later calls skip it.
 */
async function createMessage(params: MessageParams) {
  const messages = getClient().beta.messages;
  if (!fallbackAccepted) return messages.create(params);
  try {
    return await messages.create({
      ...params,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
    });
  } catch (error) {
    if (!(error instanceof Anthropic.BadRequestError)) throw error;
    const response = await messages.create(params);
    fallbackAccepted = false;
    console.warn("[anthropic] refusal fallback rejected by the API; continuing without it");
    return response;
  }
}

type Attempt<T> = { ok: true; value: T } | { ok: false; problem: string };

async function attempt<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
  options: CallJSONOptions,
): Promise<Attempt<T>> {
  const response = await createMessage({
    model: MODEL,
    max_tokens: options.maxTokens,
    // No temperature: this model rejects non-default sampling parameters.
    output_config: { effort: options.effort ?? "low" },
    system: [
      {
        type: "text",
        text: `${system}\n\n${JSON_ONLY}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: user }],
  });

  if (response.stop_reason === "refusal") {
    throw new ModelRefusalError(response.stop_details?.category ?? null);
  }
  if (response.stop_reason === "max_tokens") {
    return { ok: false, problem: "the reply was cut off before the JSON was complete" };
  }

  // A reply can open with thinking blocks, so read blocks by type.
  const text = response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("");

  let json: unknown;
  try {
    json = JSON.parse(extractJSON(text));
  } catch {
    return { ok: false, problem: "the reply was not parseable JSON" };
  }

  const parsed = schema.safeParse(json);
  if (parsed.success) return { ok: true, value: parsed.data };

  const problem = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
  return { ok: false, problem };
}

/**
 * Asks the model for JSON and validates it with zod. If the first reply is
 * malformed, asks once more with the validation error attached, then throws.
 */
export async function callJSON<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
  options: CallJSONOptions,
): Promise<T> {
  const first = await attempt(system, user, schema, options);
  if (first.ok) return first.value;

  const retryUser = `${user}

Your previous reply was rejected: ${first.problem}.
${JSON_ONLY} It must match the required shape exactly.`;
  const second = await attempt(system, retryUser, schema, options);
  if (second.ok) return second.value;

  throw new InvalidModelOutputError(second.problem);
}
