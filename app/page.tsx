// app/page.tsx
// ---------------------------------------------------------------------------
// The page the user sees. "use client" means this runs in the browser so it
// can handle typing, button clicks, and showing results. It calls our own
// /api/interpret endpoint (never Groq directly — that keeps the key secret).
// ---------------------------------------------------------------------------
"use client";

import { useState } from "react";

type Result = {
  interpretation: string;
  matchedSymbols: string[];
  frameworksUsed: string[];
};

export default function Home() {
  const [dream, setDream] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

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
        setError(data.error ?? "Something went wrong.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Could not reach the interpreter. Is the app running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-black text-slate-100">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">
            🌙 Dream Interpreter
          </h1>
          <p className="mt-3 text-slate-400">
            Describe a dream and get a reflection grounded in dream-psychology
            frameworks.
          </p>
        </header>

        <textarea
          value={dream}
          onChange={(e) => setDream(e.target.value)}
          placeholder="Describe your dream… e.g. I was being chased through a flooded city and couldn't run."
          rows={6}
          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-400"
        />

        <button
          onClick={interpret}
          disabled={loading || dream.trim().length < 3}
          className="mt-4 w-full rounded-xl bg-indigo-500 py-3 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Interpreting…" : "Interpret my dream"}
        </button>

        {error && (
          <p className="mt-6 rounded-lg bg-red-950/60 p-4 text-red-300">
            {error}
          </p>
        )}

        {result && (
          <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
            <p className="whitespace-pre-wrap leading-relaxed text-slate-100">
              {result.interpretation}
            </p>

            {(result.matchedSymbols.length > 0 ||
              result.frameworksUsed.length > 0) && (
              <div className="mt-6 border-t border-slate-700 pt-4 text-sm text-slate-400">
                {result.matchedSymbols.length > 0 && (
                  <p>
                    <span className="text-slate-300">Symbols detected:</span>{" "}
                    {result.matchedSymbols.join(", ")}
                  </p>
                )}
                {result.frameworksUsed.length > 0 && (
                  <p className="mt-1">
                    <span className="text-slate-300">Grounded in:</span>{" "}
                    {result.frameworksUsed.join(", ")}
                  </p>
                )}
              </div>
            )}

            <p className="mt-6 text-xs text-slate-500">
              Interpretation is subjective and for reflection only — not a
              scientific or medical claim.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
