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
// camera distance from the desk — the zoom system (DESK / PAPER / WRITING)
type CameraView = "desk" | "paper" | "writing";

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
  // The journal turns its page to reveal the interpretation; the dream page
  // stays behind it and can be turned back to.
  const [pageTurned, setPageTurned] = useState(false);
  // Camera zoom state and the settings popover. We open on the desk scene.
  const [view, setView] = useState<CameraView>("desk");
  const [settingsOpen, setSettingsOpen] = useState(false);
  // If public/candle.png exists it replaces the CSS-drawn candle.
  const [candlePhotoOk, setCandlePhotoOk] = useState(false);
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

  // Detect the candle photo via a preloader so a cached image (which can
  // finish before React attaches an onLoad handler) is still detected.
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setCandlePhotoOk(true);
    img.onerror = () => setCandlePhotoOk(false);
    img.src = "/candle.png";
  }, []);

  // If public/paper.png exists, use it as the parchment texture (the CSS
  // candlelight stays layered on top). Otherwise the CSS paper is the fallback.
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      document.body.dataset.paper = "photo";
    };
    img.src = "/paper.jpg";
  }, []);

  async function seal() {
    if (dream.trim().length < 3 || phase === "sending") return;
    const reduced = prefersReducedMotion();
    setError("");
    setResult(null);
    setPageTurned(false);
    setView("paper"); // pull back from writing so the page-turn reads
    setSentText(dream); // preserve the dream exactly as written
    setPhase("sending");

    // A calm beat so the page-turn never feels instant, even on a fast reply.
    const minDelay = new Promise((r) => setTimeout(r, reduced ? 200 : 900));
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dream }),
      });
      const data = await res.json();
      await minDelay;
      if (!res.ok) {
        setError(data.error ?? "The page stayed blank — try again.");
        setPhase("writing");
      } else {
        setResult(data);
        setPhase("result");
        // Let the interpretation page mount, then turn the journal to it.
        timers.current.push(
          setTimeout(() => setPageTurned(true), reduced ? 0 : 450)
        );
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
    setPageTurned(false);
    setDream("");
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
  // "reading" once an interpretation exists: the dream page becomes the leaf
  // that turns away to reveal it.
  const journalStage = result ? "reading" : "compose";
  const symbols = result?.matchedSymbols ?? [];

  return (
    <div className="viewport" data-phase={phase} data-view={view}>
      {/* Scenery behind the camera: the desk, the candle's light, the chair. */}
      <div className="desk" aria-hidden="true" />
      <div className="page-glow page-glow--night" aria-hidden="true" />
      <div className="page-glow page-glow--day" aria-hidden="true" />
      <div className="backrest" aria-hidden="true" />

      {/* DESK_VIEW backdrop: the fully-composed scene photo. A live flame glow
         sits over the candle so it isn't frozen. Clicking leans in, crossfading
         to the live, writable scene below. */}
      <button
        type="button"
        className="scene-backdrop"
        onClick={() => setView("paper")}
        aria-label="Begin writing"
      >
        <span className="scene-flame" aria-hidden="true" />
        <span className="scene-hint">write</span>
      </button>

      {/* UI layer — the header sits above the scene and never zooms. */}
      <header className="app-header">
        <span className="app-title">Dream Interpreter</span>
        <div className="app-header__controls">
          <button
            type="button"
            className="header-btn"
            onClick={() => setView((v) => (v === "desk" ? "paper" : "desk"))}
            aria-label={
              view === "desk" ? "Begin writing" : "Sit back from the desk"
            }
          >
            {view === "desk" ? "write" : "sit back"}
          </button>
          <button
            type="button"
            className="header-btn header-btn--icon"
            onClick={() => setSettingsOpen((s) => !s)}
            aria-label="Settings"
            aria-expanded={settingsOpen}
          >
            ✦
          </button>
        </div>
      </header>

      {settingsOpen && (
        <div className="settings-panel">
          <p className="settings-panel__label">Hour</p>
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
        </div>
      )}

      {/* The camera tilts back during the faint; the stage zooms between the
         desk / paper / writing camera views. */}
      <div className="camera">
        <div className="stage">
          <main className="shell">
            <div className="scene-content">
              {/* The candle — sits on the desk, behind the paper. A real
                 candle.png (if present) replaces the CSS candle; the
                 breathing/guttering halo stays behind it as the living light. */}
          <div className="accent-stage" aria-hidden="true">
            <div className="candle">
              <span className="candle-halo" />
              {!candlePhotoOk && (
                <>
                  <span className="holder-handle" />
                  <span className="holder-dish" />
                  <span className="holder-socket" />
                  <span className="taper" />
                  <span className="wick" />
                  <span className="flame">
                    <span className="flame-core" />
                  </span>
                </>
              )}
              {candlePhotoOk && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="candle-photo"
                  src="/candle.png"
                  alt=""
                  aria-hidden="true"
                  style={{ opacity: 1 }}
                />
              )}
              <svg className="smoke" viewBox="0 0 40 80" fill="none">
                <g className="smoke-sway">
                  <path d="M20 78 C 12 66, 28 56, 20 44 C 12 32, 28 22, 20 10 C 17 4, 22 2, 20 0" />
                </g>
              </svg>
            </div>
          </div>

          {error && <p className="notice">{error}</p>}

          {/* The journal. Page 1 is the dream you wrote (preserved); page 2 is
             the interpretation. Sealing turns the page to it — and you can
             always turn back to the dream. */}
          <div
            className="journal"
            data-stage={journalStage}
            data-turned={pageTurned ? "true" : "false"}
          >
            {/* Page 2 — the interpretation, beneath, revealed as the page turns */}
            {result && (
              <article
                className="leaf leaf--reading parchment"
                aria-hidden={!pageTurned}
              >
                <p className="interpretation">
                  {lines.map((line, i) => (
                    <span
                      key={`${i}-${line.slice(0, 12)}`}
                      className="reveal-line"
                      style={{ animationDelay: `${0.5 + i * 0.3}s` }}
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

                <div className="leaf-actions">
                  <button
                    type="button"
                    className="dream-seal"
                    onClick={enterDream}
                    aria-label="Enter the dream again"
                  >
                    <span className="dream-seal__glyph" aria-hidden="true">
                      ☾
                    </span>
                    <span className="dream-seal__label">Enter Dream Again</span>
                  </button>
                  <div className="leaf-links">
                    <button
                      type="button"
                      className="leaf-flip"
                      onClick={() => setPageTurned(false)}
                    >
                      ‹ the dream
                    </button>
                    <button
                      type="button"
                      className="write-again"
                      onClick={writeAgain}
                    >
                      write another dream
                    </button>
                  </div>
                </div>
              </article>
            )}

            {/* Page 1 — the dream; editable until sealed, then kept & turnable */}
            <article className="leaf leaf--dream">
              <span className="leaf__back parchment" aria-hidden="true" />
              {phase === "writing" ? (
                <div className="leaf__face parchment">
                  <textarea
                    className="dream-input"
                    value={dream}
                    onChange={(e) => setDream(e.target.value)}
                    placeholder="The moon was too bright, and I was walking…"
                    rows={7}
                    onFocus={() => setView("writing")}
                  />
                  <button
                    type="button"
                    className="seal-button"
                    onClick={seal}
                    disabled={dream.trim().length < 3}
                  >
                    Seal &amp; Reveal
                  </button>
                </div>
              ) : (
                <div className="leaf__face parchment">
                  <p className="dream-readback">{sentText}</p>
                  {phase === "sending" && (
                    <p className="leaf-hint">the ink is drying…</p>
                  )}
                  {phase === "result" && (
                    <button
                      type="button"
                      className="leaf-flip leaf-flip--forward"
                      onClick={() => setPageTurned(true)}
                    >
                      read the interpretation ›
                    </button>
                  )}
                </div>
              )}
            </article>
            </div>
            </div>
          </main>
        </div>
      </div>

      {/* Atmosphere: the dark room pressing in, and a faint film grain. */}
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      {/* Drifting under: the dream's symbols glow and rise from the page. */}
      {phase === "fainting" && symbols.length > 0 && (
        <div className="symbol-rise" aria-hidden="true">
          {symbols.slice(0, 6).map((symbol, i, arr) => (
            <span
              key={`${symbol}-${i}`}
              className="symbol-particle"
              style={{
                left: `${26 + i * (48 / Math.max(arr.length - 1, 1))}%`,
                animationDelay: `${0.2 + i * 0.34}s`,
              }}
            >
              {symbol.toLowerCase()}
            </span>
          ))}
        </div>
      )}

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
