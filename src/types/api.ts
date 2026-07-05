// src/types/api.ts
// ---------------------------------------------------------------------------
// The API contract, shared by both sides: the browser imports the types, the
// route handlers import the zod schemas that *produce* those types. One source
// of truth — client and server can't drift apart.
// ---------------------------------------------------------------------------

import { z } from "zod";

/** A compact, privacy-preserving summary of on-device history the client may
 *  send so a reading can notice recurring patterns. Never stored server-side. */
export const historyContextSchema = z
  .object({
    recurringSymbols: z
      .array(z.object({ label: z.string(), count: z.number() }))
      .max(16)
      .optional(),
    recentDreams: z
      .array(z.object({ dreamText: z.string(), createdAt: z.number() }))
      .max(5)
      .optional(),
  })
  .optional();

export const interpretRequestSchema = z.object({
  dream: z
    .string({ error: "Please describe your dream in a little more detail." })
    .trim()
    .min(3, "Please describe your dream in a little more detail.")
    .max(8000, "That dream is too long for one reading."),
  history: historyContextSchema,
});
export type InterpretRequest = z.infer<typeof interpretRequestSchema>;

export type InterpretResponse = {
  /** Part one — what the dream means, grounded in the sourced frameworks. */
  meaning: string;
  /** Part two — what the dream may foretell: gentle, forward-looking reading. */
  foretelling: string;
  /** Both parts as one flat text (stored in the on-device journal). */
  interpretation: string;
  matchedSymbols: string[];
  frameworksUsed: string[];
};

export const journalReadRequestSchema = z.object({
  dreams: z
    .array(z.object({ dreamText: z.string() }))
    .min(1, "There are no dreams to reflect on yet.")
    .max(60),
});
export type JournalReadRequest = z.infer<typeof journalReadRequestSchema>;

export type JournalReadResponse = {
  reading: string;
  matchedSymbols: string[];
};

/** Every route returns this shape on failure. */
export type ApiError = { error: string };
