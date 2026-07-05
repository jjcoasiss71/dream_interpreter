// src/lib/grounding.ts
// ---------------------------------------------------------------------------
// Turns matched symbols into the sourced reference text the LLM is allowed to
// use — shared by every interpreting route so the grounding format can't drift.
// ---------------------------------------------------------------------------

import {
  getFramework,
  frameworkSummaries,
  type DreamSymbol,
} from "@/lib/knowledge";

/**
 * Build the "sourced perspectives you may use" block. When no symbol matched,
 * fall back to the general framework summaries so the LLM can still respond
 * sensibly instead of inventing meanings.
 */
export function buildGroundingText(matched: DreamSymbol[]): string {
  if (matched.length === 0) {
    return (
      "No specific catalogued symbol was detected. General frameworks:\n" +
      frameworkSummaries()
    );
  }

  return matched
    .map((symbol) => {
      const lines = symbol.perspectives.map((p) => {
        const fw = getFramework(p.framework);
        const fwName = fw ? fw.name : p.framework;
        return `    • [${fwName}] ${p.meaning} (Source: ${p.source})`;
      });
      return `Symbol "${symbol.label}":\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

/** The framework names used across the matched symbols, deduplicated. */
export function frameworksUsed(matched: DreamSymbol[]): string[] {
  return Array.from(
    new Set(matched.flatMap((s) => s.perspectives.map((p) => p.framework)))
  )
    .map((id) => getFramework(id)?.name)
    .filter((name): name is string => Boolean(name));
}
