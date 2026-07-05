// src/components/ResultFace.tsx
// The interpretation, appearing line by line on the same sheet of paper.
"use client";

import { toLines } from "@/lib/text";
import type { InterpretResponse } from "@/types/api";

export function ResultFace({
  result,
  onEnterDream,
  onWriteAgain,
}: {
  result: InterpretResponse;
  onEnterDream: () => void;
  onWriteAgain: () => void;
}) {
  // Two-part reading; older journal entries / fallbacks may have no foretelling.
  const meaningLines = toLines(result.meaning || result.interpretation);
  const foretellingLines = result.foretelling
    ? toLines(result.foretelling)
    : [];
  // The foretelling's reveal continues the meaning's stagger.
  const offset = meaningLines.length;

  return (
    <div className="sheet-face sheet-result">
      <p className="reading-part-title reveal-line">The Meaning</p>
      <p className="interpretation">
        {meaningLines.map((line, i) => (
          <span
            key={`m-${i}-${line.slice(0, 12)}`}
            className="reveal-line"
            style={{ animationDelay: `${i * 0.3}s` }}
          >
            {line}
          </span>
        ))}
      </p>

      {foretellingLines.length > 0 && (
        <>
          <p
            className="reading-part-title reading-part-title--omen reveal-line"
            style={{ animationDelay: `${offset * 0.3}s` }}
          >
            What It Foretells
          </p>
          <p className="interpretation interpretation--omen">
            {foretellingLines.map((line, i) => (
              <span
                key={`f-${i}-${line.slice(0, 12)}`}
                className="reveal-line"
                style={{ animationDelay: `${(offset + 1 + i) * 0.3}s` }}
              >
                {line}
              </span>
            ))}
          </p>
        </>
      )}

      {(result.matchedSymbols.length > 0 ||
        result.frameworksUsed.length > 0) && (
        <>
          <hr className="rule" />
          <div className="result-meta">
            {result.matchedSymbols.length > 0 && (
              <p>
                <span className="meta-key">Symbols detected:</span>{" "}
                {result.matchedSymbols.join(", ")}
              </p>
            )}
            {result.frameworksUsed.length > 0 && (
              <p>
                <span className="meta-key">Grounded in:</span>{" "}
                {result.frameworksUsed.join(", ")}
              </p>
            )}
          </div>
        </>
      )}

      <p className="disclaimer">
        Interpretation is subjective and for reflection only — not a scientific
        or medical claim.
      </p>

      <div className="leaf-actions">
        <button
          type="button"
          className="dream-seal"
          onClick={onEnterDream}
          aria-label="Enter the dream again"
        >
          <span className="dream-seal__glyph" aria-hidden="true">
            ☾
          </span>
          <span className="dream-seal__label">Enter Dream Again</span>
        </button>
        <button type="button" className="write-again" onClick={onWriteAgain}>
          write another dream
        </button>
      </div>
    </div>
  );
}
