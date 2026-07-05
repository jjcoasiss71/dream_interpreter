// src/lib/env.ts
// ---------------------------------------------------------------------------
// Validated access to server environment variables — one place, typed, with a
// clear error instead of undefined leaking through the app. Server-only.
// ---------------------------------------------------------------------------

import { z } from "zod";

const envSchema = z.object({
  // Optional at parse time so builds work without secrets; the LLM client
  // gives callers a graceful error when it's actually needed.
  GROQ_API_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) cached = envSchema.parse(process.env);
  return cached;
}
