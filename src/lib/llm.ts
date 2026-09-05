// src/lib/llm.ts
// ---------------------------------------------------------------------------
// The one LLM client. Both API routes speak to Groq through this helper, so
// the provider, model, and error handling live in exactly one place. The API
// key never leaves the server.
// ---------------------------------------------------------------------------

import { getEnv } from "@/lib/env";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
export const MODEL = "openai/gpt-oss-120b";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export class LlmError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "LlmError";
  }
}

/** Groq's own code for a failed call, e.g. "model_not_found". "" if absent. */
function providerCode(body: string): string {
  try {
    const code = JSON.parse(body)?.error?.code ?? JSON.parse(body)?.error?.type;
    return typeof code === "string" ? code : "";
  } catch {
    return "";
  }
}

/**
 * Turn a failed Groq response into the error the dreamer sees.
 * Only 429 is genuinely "busy". Everything else used to wear that same
 * message, which is how a decommissioned model spent weeks looking like load.
 */
export function describeFailure(status: number, body: string): LlmError {
  const code = providerCode(body);
  const detail = `(Groq ${status}${code ? `: ${code}` : ""})`;

  if (status === 429) {
    return new LlmError(
      `The interpreter is busy right now. Please try again in a moment. ${detail}`,
      429
    );
  }
  if (status === 401 || status === 403) {
    return new LlmError(
      `The interpreter's key was refused — the server needs a valid GROQ_API_KEY. ${detail}`,
      500
    );
  }
  if (status === 404) {
    return new LlmError(
      `The interpreter's model "${MODEL}" is no longer available. ${detail}`,
      500
    );
  }
  if (status >= 500) {
    return new LlmError(
      `The interpreter could not be reached. Please try again. ${detail}`,
      502
    );
  }
  return new LlmError(`The interpreter refused the request. ${detail}`, 502);
}

/**
 * Run a chat completion and return the assistant's text.
 * Throws LlmError with an HTTP status suited to the failure:
 *   500 — server misconfigured (no key, bad key, retired model);
 *   429 — provider rate limit; 502 — provider failed or refused.
 */
export async function chat(
  messages: ChatMessage[],
  opts: { temperature?: number } = {}
): Promise<string> {
  const { GROQ_API_KEY } = getEnv();
  if (!GROQ_API_KEY) {
    throw new LlmError("Server is missing its GROQ_API_KEY.", 500);
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: opts.temperature ?? 0.7,
      messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Groq error:", res.status, body);
    throw describeFailure(res.status, body);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
