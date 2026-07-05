// src/lib/text.ts

/**
 * Break the interpretation into lines so each fades in on its own beat —
 * like a scroll slowly unrolled. Honors paragraph breaks, then sentences.
 */
export function toLines(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((para) => para.match(/[^.?!]+[.?!]*\s*/g) ?? [para])
    .map((line) => line.trim())
    .filter(Boolean);
}
