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

/**
 * Look through the dream text and return every symbol whose label or one of
 * its aliases appears in the text. Matching is lowercase and substring-based,
 * so "I was drowning in the ocean" matches the "water" symbol via its aliases.
 */
export function matchSymbols(dreamText: string): DreamSymbol[] {
  const text = dreamText.toLowerCase();

  return symbols.filter((symbol) => {
    const searchTerms = [symbol.label, ...symbol.aliases].map((t) =>
      t.toLowerCase()
    );
    return searchTerms.some((term) => text.includes(term));
  });
}

/** Find the full framework writeup for a given framework id. */
export function getFramework(id: string): Framework | undefined {
  return frameworks.find((f) => f.id === id);
}

/** Short summaries of every framework — used as fallback grounding when no
 *  specific symbol is matched, so the app can still respond sensibly. */
export function frameworkSummaries(): string {
  return frameworks
    .map((f) => `- ${f.name}: ${f.coreIdea}`)
    .join("\n");
}