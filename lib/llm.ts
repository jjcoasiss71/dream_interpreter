// lib/llm.ts
// ---------------------------------------------------------------------------
// One chat-completion helper for all text. Prefers NVIDIA's Llama 4 Maverick
// (OpenAI-compatible API, free credits) and falls back to Groq's Llama-3.3-70B
// on any error or if NVIDIA isn't configured — so the app never breaks if a
// provider is down or out of credits. Both are US-made (Meta models), per the
// project's no-Chinese-provider rule.
// ---------------------------------------------------------------------------

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
type ChatOptions = { temperature?: number; maxTokens?: number };

const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODEL =
  process.env.NVIDIA_TEXT_MODEL || "meta/llama-4-maverick-17b-128e-instruct";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

async function callOpenAICompatible(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  opts: ChatOptions
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: opts.temperature ?? 0.7,
  };
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${model} ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/** True if any text provider is configured. */
export function hasLLM(): boolean {
  return Boolean(process.env.NVIDIA_API_KEY || process.env.GROQ_API_KEY);
}

/**
 * Run a chat completion. Tries NVIDIA Llama 4 Maverick first, then Groq.
 * Throws only if no provider is configured or both fail.
 */
export async function chat(
  messages: ChatMessage[],
  opts: ChatOptions = {}
): Promise<string> {
  const nvKey = process.env.NVIDIA_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (nvKey) {
    try {
      return await callOpenAICompatible(NVIDIA_CHAT_URL, nvKey, NVIDIA_MODEL, messages, opts);
    } catch (err) {
      console.error("NVIDIA text failed, falling back to Groq:", err);
    }
  }
  if (groqKey) {
    return callOpenAICompatible(GROQ_CHAT_URL, groqKey, GROQ_MODEL, messages, opts);
  }
  throw new Error("No LLM provider configured (set NVIDIA_API_KEY or GROQ_API_KEY).");
}
