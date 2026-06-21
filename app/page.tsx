// app/page.tsx
// ---------------------------------------------------------------------------
// First-person desk experience. "use client" so the browser can handle typing,
// the mode toggle, the seal-and-send cinematic, and the faint into the dream.
// It calls our own /api/interpret endpoint (never Groq directly).
// ---------------------------------------------------------------------------
"use client";

import { useEffect, useRef, useState } from "react";

type Result = {
  interpretation: string;
  matchedSymbols: string[];
  frameworksUsed: string[];
};

type Mode = "nightfall" | "daybreak";
// reality flow: writing → sending → result; dream flow: fainting → dreamworld → waking
type Phase = "writing" | "sending" | "result" | "fainting" | "dreamworld" | "waking";
type CineStage = "write" | "fold" | "seal" | "fly";

// Break the interpretation into lines so each fades in on its own beat —
// like a scroll slowly unrolled. Honors paragraph breaks, then sentences.
function toLines(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((para) => para.match(/[^.?!]+[.?!]*\s*/g) ?? [para])
    .map((line) => line.trim())
    .filter(Boolean);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("nightfall");
  const [phase, setPhase] = useState<Phase>("writing");
  const [cineStage, setCineStage] = useState<CineStage>("write");
  const [dream, setDream] = useState("");
  const [sentText, setSentText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  // Hold timer ids so we can clear them if the component unmounts mid-sequence.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  // Drive the adaptive UI from a single attribute on <body>.
  useEffect(() => {
    document.body.dataset.mode = mode;
  }, [mode]);

  async function seal() {
    if (dream.trim().length < 3 || phase === "sending") return;
    const reduced = prefersReducedMotion();
    setError("");
    setResult(null);
    setSentText(dream);
    setCineStage("write");
    setPhase("sending");

    // Choreograph the write → fold → seal → fly stages (skipped if reduced).
    const cinematicMs = reduced ? 350 : 3200;
    if (!reduced) {
      timers.current.push(setTimeout(() => setCineStage("fold"), 1300));
      timers.current.push(setTimeout(() => setCineStage("seal"), 2300));
      timers.current.push(setTimeout(() => setCineStage("fly"), 2700));
    }

    const minDelay = new Promise((r) => setTimeout(r, cinematicMs));
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dream }),
      });
      const data = await res.json();
      await minDelay; // let the letter finish sending before the reveal
      if (!res.ok) {
        setError(data.error ?? "The letter came back unopened.");
        setPhase("writing");
      } else {
        setResult(data);
        setPhase("result");
      }
    } catch {
      await minDelay;
      setError("Could not reach the interpreter. Is the app running?");
      setPhase("writing");
    }
  }

  function writeAgain() {
    clearTimers();
    setResult(null);
    setError("");
    setPhase("writing");
  }

  function enterDream() {
    clearTimers();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase("fainting");
    const ms = prefersReducedMotion() ? 500 : 3000;
    timers.current.push(setTimeout(() => setPhase("dreamworld"), ms));
  }

  function wakeUp() {
    clearTimers();
    setPhase("waking");
    const ms = prefersReducedMotion() ? 500 : 2200;
    timers.current.push(setTimeout(() => setPhase("result"), ms));
  }

  const lines = result ? toLines(result.interpretation) : [];
  const inDream = phase === "fainting" || phase === "dreamworld" || phase === "waking";

  return (
    <div className="viewport" data-phase={phase}>
      {/* Scenery behind the camera: the desk, the candle's light, the chair. */}
      <div className="desk" aria-hidden="true" />
      <div className="page-glow page-glow--night" aria-hidden="true" />
      <div className="page-glow page-glow--day" aria-hidden="true" />
      <div className="backrest" aria-hidden="true" />

      {/* The camera tilts back during the faint. */}
      <div className="camera">
        <main className="shell">
          <header className="masthead">
            <h1 className="title">Dream Interpreter</h1>
            <p className="subtitle">
              Write down a dream by candlelight, seal it, and read what it
              wanted to say.
            </p>
          </header>

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

          {/* The candle — an antique brass chamberstick above the letter. */}
          <div className="accent-stage" aria-hidden="true">
            <div className="candle">
              <span className="candle-halo" />
              <span className="holder-handle" />
              <span className="holder-dish" />
              <span className="holder-socket" />
              <span className="taper" />
              <span className="wick" />
              <span className="flame">
                <span className="flame-core" />
              </span>
              <svg className="smoke" viewBox="0 0 40 80" fill="none">
                <g className="smoke-sway">
                  <path d="M20 78 C 12 66, 28 56, 20 44 C 12 32, 28 22, 20 10 C 17 4, 22 2, 20 0" />
                </g>
              </svg>
            </div>
          </div>

          {/* The letter */}
          {phase === "writing" && (
            <section className="composer">
              <textarea
                className="dream-input"
                value={dream}
                onChange={(e) => setDream(e.target.value)}
                placeholder="The moon was too bright, and I was walking…"
                rows={7}
                autoFocus
              />
              <button
                type="button"
                className="seal-button"
                onClick={seal}
                disabled={dream.trim().length < 3}
              >
                Seal &amp; Reveal
              </button>
            </section>
          )}

          {/* The send cinematic */}
          {phase === "sending" && (
            <div className="cinematic" data-stage={cineStage} aria-hidden="true">
              <div className="cine-stage">
                <div className="cine-paper">
                  <p className="cine-text">{sentText}</p>
                  <span className="cine-nib" />
                  <div className="cine-fold cine-fold--top" />
                  <div className="cine-fold cine-fold--bottom" />
                  <span className="cine-wax" />
                </div>
              </div>
            </div>
          )}

          {error && <p className="notice">{error}</p>}

          {/* The interpretation */}
          {phase === "result" && result && (
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

              <div className="after">
                <button type="button" className="enter-dream" onClick={enterDream}>
                  Step inside the dream
                </button>
                <button type="button" className="write-again" onClick={writeAgain}>
                  write another letter
                </button>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Consciousness fading */}
      <div className="faint-veil" aria-hidden="true" />

      {/* The dream world we fall into (placeholder — to be built out later) */}
      {inDream && (
        <div className="dreamworld" aria-hidden={phase !== "dreamworld"}>
          <h2>You are inside the dream</h2>
          <p>
            The room is gone. What you wrote is taking shape around you — though
            it has not finished becoming anything yet.
          </p>
          <button type="button" className="wake" onClick={wakeUp}>
            Wake up
          </button>
        </div>
      )}
    </div>
  );
}
