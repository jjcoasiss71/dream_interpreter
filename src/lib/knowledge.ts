// lib/knowledge.ts
// ---------------------------------------------------------------------------
// This file loads the knowledge base (your JSON data files) and finds which
// symbols appear in a user's dream. It does NOT talk to the LLM — it just
// prepares the grounded material that the LLM will later phrase.
// ---------------------------------------------------------------------------

import frameworksData from "@/data/frameworks.json";
import symbolsData from "@/data/symbols.json";

// ---- Types: these describe the shape of our JSON so the editor can help us ---
export type Perspective = {
  framework: string; // matches an "id" in frameworks.json
  meaning: string;
  source: string;
};

export type DreamSymbol = {
  id: string;
  label: string;
  aliases: string[];
  perspectives: Perspective[];
};

export type Framework = {
  id: string;
  name: string;
  founder: string;
  coreIdea: string;
  howItReadsDreams: string;
  sources: string[];
};

// ---- Pull the lists out of the JSON files --------------------------------
const symbols = symbolsData.symbols as DreamSymbol[];
const frameworks = frameworksData.frameworks as Framework[];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Match a term as whole words (so "cat" never fires inside "vacation"),
// tolerating light inflection: plurals for all words, -d/-ed for longer ones
// (short words stay strict so "war" can't swallow "ward"). Richer verb forms
// (chasing, burnt…) belong in the aliases themselves.
function termToPattern(term: string): RegExp {
  const words = term.toLowerCase().trim().split(/\s+/);
  const last = words.length - 1;
  const suffix = words[last].length >= 4 ? "(?:s|es|d|ed)?" : "s?";
  const escaped = words.map(escapeRegExp);
  escaped[last] = `${escaped[last]}${suffix}`;
  return new RegExp(`\\b${escaped.join("\\s+")}\\b`, "i");
}

// Precompile every symbol's patterns once at module load.
const compiled = symbols.map((symbol) => ({
  symbol,
  patterns: [symbol.label, ...symbol.aliases].map(termToPattern),
}));

/**
 * Look through the dream text and return every symbol whose label or one of
 * its aliases appears as a whole word/phrase. "I was drowning in the ocean"
 * matches the "water" symbol via its aliases; "vacation" does not match "cat".
 */
export function matchSymbols(dreamText: string): DreamSymbol[] {
  return compiled
    .filter(({ patterns }) => patterns.some((p) => p.test(dreamText)))
    .map(({ symbol }) => symbol);
}

/** Find the full framework writeup for a given framework id. */
export function getFramework(id: string): Framework | undefined {
  return frameworks.find((f) => f.id === id);
}

/** Short summaries of every framework — used as fallback grounding when no
 *  specific symbol is matched, so the app can still respond sensibly. */
export function frameworkSummaries(): string {
  return frameworks.map((f) => `- ${f.name}: ${f.coreIdea}`).join("\n");
}
