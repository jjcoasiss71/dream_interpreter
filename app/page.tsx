// app/page.tsx
// ---------------------------------------------------------------------------
// The page the user sees. "use client" means this runs in the browser so it
// can handle typing, the mode toggle, button clicks, and revealing results.
// It calls our own /api/interpret endpoint (never Groq directly).
// ---------------------------------------------------------------------------
"use client";

import { useEffect, useState } from "react";

type Result = {
  interpretation: string;
  matchedSymbols: string[];
  frameworksUsed: string[];
};

type Mode = "nightfall" | "daybreak";

// Break the interpretation into lines so each can fade in on its own beat —
// like a scroll slowly unrolled. Honors paragraph breaks, then sentences.
function toLines(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((para) => para.match(/[^.?!]+[.?!]*\s*/g) ?? [para])
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("nightfall");
  const [dream, setDream] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  // Drive the adaptive UI from a single attribute on <body>.
  useEffect(() => {
    document.body.dataset.mode = mode;
  }, [mode]);

  async function interpret() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dream }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went astray.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Could not reach the interpreter. Is the app running?");
    } finally {
      setLoading(false);
    }
  }

  const lines = result ? toLines(result.interpretation) : [];

  return (
    <>
      {/* Ambient glow layers — cross-fade between modes. */}
      <div className="page-glow page-glow--night" aria-hidden="true" />
      <div className="page-glow page-glow--day" aria-hidden="true" />

      <main className="shell">
        {/* Candle flame (Nightfall) / smoke wisp (Daybreak). */}
        <div className="accent-stage" aria-hidden="true">
          <span className="flame" />
          <svg className="smoke" viewBox="0 0 40 64" fill="none">
            <g className="smoke-sway">
              <path d="M20 62 C 13 52, 27 44, 20 35 C 13 26, 27 18, 20 9 C 17 4.5, 22 2, 20 0" />
            </g>
          </svg>
        </div>

        <header className="masthead">
          <h1 className="title">Dream Interpreter</h1>
          <p className="subtitle">
            Describe a dream and receive a quiet reflection, grounded in
            dream-psychology frameworks.
          </p>
        </header>

        {/* Mode toggle */}
        <div className="toggle-row">
          <button
            type="button"
            className="toggle-label toggle-label--night"
            onClick={() => setMode("nightfall")}
          >
            Nightfall
          </button>
          <button
            type="button"
            className="toggle"
            role="switch"
            aria-checked={mode === "daybreak"}
            aria-label="Toggle between Nightfall and Daybreak"
            onClick={() =>
              setMode((m) => (m === "nightfall" ? "daybreak" : "nightfall"))
            }
          >
            <span className="toggle-knob" />
          </button>
          <button
            type="button"
            className="toggle-label toggle-label--day"
            onClick={() => setMode("daybreak")}
          >
            Daybreak
          </button>
        </div>

        {/* Composer */}
        <section className="composer">
          <textarea
            className="dream-input"
            value={dream}
            onChange={(e) => setDream(e.target.value)}
            placeholder="The moon was too bright, and I was walking…"
            rows={6}
          />
          <button
            type="button"
            className="seal-button"
            onClick={interpret}
            disabled={loading || dream.trim().length < 3}
          >
            {loading ? "Revealing…" : "Seal & Reveal"}
          </button>
        </section>

        {error && <p className="notice">{error}</p>}

        {result && (
          <section className="result-card">
            <p className="interpretation">
              {lines.map((line, i) => (
                <span
                  key={`${i}-${line.slice(0, 12)}`}
                  className="reveal-line"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  {line}
                </span>
              ))}
            </p>

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
              Interpretation is subjective and for reflection only — not a
              scientific or medical claim.
            </p>
          </section>
        )}
      </main>
    </>
  );
}
