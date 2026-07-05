// src/lib/llm.ts
// ---------------------------------------------------------------------------
// The one LLM client. Both API routes speak to Groq through this helper, so
// the provider, model, and error handling live in exactly one place. The API
// key never leaves the server.
// ---------------------------------------------------------------------------

import { getEnv } from "@/lib/env";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

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

/**
 * Run a chat completion and return the assistant's text.
 * Throws LlmError with an HTTP status suited to the failure:
 *   500 — server misconfigured (no key); 502 — provider failed.
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
    console.error("Groq error:", await res.text());
    throw new LlmError(
      "The interpreter is busy right now. Please try again.",
      502
    );
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
