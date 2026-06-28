// app/page.tsx
// ---------------------------------------------------------------------------
// First-person desk experience. "use client" so the browser can handle typing,
// the mode toggle, the seal-and-send cinematic, and the faint into the dream.
// It calls our own /api/interpret endpoint (never Groq directly).
// ---------------------------------------------------------------------------
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  loadJournal,
  saveEntry,
  clearJournal,
  buildHistoryContext,
  loadMemoryEnabled,
  setMemoryEnabled,
  loadJournalView,
  saveJournalView,
  type JournalEntry,
  type JournalView,
} from "@/lib/journal";

const dateFmt = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "long",
  day: "numeric",
});

// useLayoutEffect on the client (no SSR warning) so the paper height can be
// measured and animated before paint.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  // Daybreak mode is kept in the code (tokens/styles) but its toggle is hidden
  // for now, so the mode stays on the default.
  const [mode] = useState<Mode>("nightfall");
  const [phase, setPhase] = useState<Phase>("writing");
  // Camera zoom state and the settings popover. We open on the desk scene.
  const [view, setView] = useState<CameraView>("desk");
  const [settingsOpen, setSettingsOpen] = useState(false);
  // If public/candle.png exists it replaces the CSS-drawn candle.
  const [candlePhotoOk, setCandlePhotoOk] = useState(false);
  const [dream, setDream] = useState("");
  const [sentText, setSentText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  // The dream journal — kept only in this browser (lib/journal.ts).
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [memoryOn, setMemoryOn] = useState(true); // on by default; can opt out
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalViewMode, setJournalViewMode] = useState<JournalView>("full");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // The "ultimate interpretation" across the whole journal.
  const [ultimate, setUltimate] = useState<string | null>(null);
  const [ultimateLoading, setUltimateLoading] = useState(false);
  const [ultimateError, setUltimateError] = useState("");

  // Hold timer ids so we can clear them if the component unmounts mid-sequence.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  // The paper grows/shrinks as its content changes (write -> glow -> reveal).
  // Animate that height change instead of letting it jump.
  const paperRef = useRef<HTMLDivElement>(null);
  const prevPaperHeight = useRef<number | null>(null);
  useIsoLayoutEffect(() => {
    const el = paperRef.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.height = "";
      prevPaperHeight.current = null;
      return;
    }
    // measure the natural content height (unscaled by the stage transform)
    el.style.transition = "none";
    el.style.height = "auto";
    const target = el.offsetHeight;
    const prev = prevPaperHeight.current;
    if (prev != null && Math.abs(prev - target) > 4) {
      el.style.height = `${prev}px`;
      void el.offsetHeight; // force reflow so the next change animates
      el.style.transition = "height 800ms cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.height = `${target}px`;
    } else {
      el.style.height = `${target}px`;
    }
    prevPaperHeight.current = target;
  }, [phase, result]);

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

  // Load the on-device dream journal + preference once, in the browser.
  // (localStorage isn't available during SSR, so this happens after mount.)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setJournal(loadJournal());
    setMemoryOn(loadMemoryEnabled());
    setJournalViewMode(loadJournalView());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function chooseJournalView(mode: JournalView) {
    setJournalViewMode(mode);
    saveJournalView(mode);
  }

  function toggleMemory() {
    setMemoryOn((on) => {
      const next = !on;
      setMemoryEnabled(next);
      return next;
    });
  }

  function forgetAll() {
    clearJournal();
    setJournal([]);
    setExpanded({});
    setUltimate(null);
    setUltimateError("");
  }

  function toggleEntry(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  async function readWholeJournal() {
    if (ultimateLoading || journal.length < 2) return;
    setUltimateError("");
    setUltimate(null);
    setUltimateLoading(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dreams: journal.map((e) => ({ dreamText: e.dreamText })),
        }),
      });
      const data = await res.json();
      if (!res.ok) setUltimateError(data.error ?? "Could not read the journal.");
      else setUltimate(data.reading);
    } catch {
      setUltimateError("Could not reach the interpreter.");
    } finally {
      setUltimateLoading(false);
    }
  }

  async function seal() {
    if (dream.trim().length < 3 || phase === "sending") return;
    const reduced = prefersReducedMotion();
    setError("");
    setResult(null);
    setView("paper"); // pull back so the whole sheet is in view
    setSentText(dream); // the words that will glow and burn away
    setPhase("sending");

    // Only when the dreamer has opted in: a compact summary of past dreams so
    // the reading can notice patterns.
    const history = memoryOn ? buildHistoryContext(journal) : undefined;

    // Let the written dream glow (~3s) and erase (~0.8s) before the reveal.
    const minDelay = new Promise((r) => setTimeout(r, reduced ? 200 : 4000));
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memoryOn ? { dream, history } : { dream }),
      });
      const data = await res.json();
      await minDelay;
      if (!res.ok) {
        setError(data.error ?? "The page stayed blank — try again.");
        setPhase("writing");
      } else {
        setResult(data);
        setPhase("result");
        // Remember this dream on the device for future, deeper readings.
        if (memoryOn) {
          setJournal(
            saveEntry({
              id:
                typeof crypto !== "undefined" && crypto.randomUUID
                  ? crypto.randomUUID()
                  : String(Date.now()),
              dreamText: dream,
              interpretation: data.interpretation,
              matchedSymbols: data.matchedSymbols ?? [],
              frameworksUsed: data.frameworksUsed ?? [],
              createdAt: Date.now(),
            })
          );
        }
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
        <span className="scene-hint">write</span>
      </button>

      {/* UI layer — the header sits above the scene and never zooms. */}
      <header className="app-header">
        <button
          type="button"
          className="app-title"
          onClick={() => setView("desk")}
          aria-label="Sit back to the desk"
        >
          Dream Interpreter
        </button>
        <div className="app-header__controls">
          <button
            type="button"
            className="header-btn"
            onClick={() => setJournalOpen(true)}
          >
            Journal
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
          <p className="settings-panel__label">Dream journal</p>
          <div className="mem-row">
            <span className="mem-label">Remember my dreams</span>
            <button
              type="button"
              className="mem-switch"
              role="switch"
              aria-checked={memoryOn}
              data-on={memoryOn}
              aria-label="Remember my dreams on this device"
              onClick={toggleMemory}
            >
              <span className="mem-knob" />
            </button>
          </div>
          <p className="settings-journal__count">
            {journal.length === 0
              ? "kept only on this device · nothing yet"
              : `${journal.length} dream${
                  journal.length === 1 ? "" : "s"
                } kept on this device`}
          </p>
          {journal.length > 0 && (
            <button type="button" className="forget-all" onClick={forgetAll}>
              forget all
            </button>
          )}
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

          {/* A single sheet of paper. You write your dream on it; on sealing,
             the words glow, burn away, and the interpretation takes their place
             on the very same page. */}
          <div className="paper-sheet parchment" ref={paperRef}>
            {phase === "writing" && (
              <div className="sheet-face">
                {error && <p className="notice">{error}</p>}
                <textarea
                  className="dream-input"
                  value={dream}
                  onChange={(e) => setDream(e.target.value)}
                  placeholder="The moon was too bright, and I was walking…"
                  rows={9}
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
            )}

            {/* the written dream glows, then erases */}
            {phase === "sending" && (
              <p className="dream-vanishing">{sentText}</p>
            )}

            {/* the interpretation appears in its place on the same sheet */}
            {phase === "result" && result && (
              <div className="sheet-face sheet-result">
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
                  <button
                    type="button"
                    className="write-again"
                    onClick={writeAgain}
                  >
                    write another dream
                  </button>
                </div>
              </div>
            )}
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

      {/* The dream journal — reread your past dreams (kept on this device). */}
      {journalOpen && (
        <div className="journal-view" role="dialog" aria-modal="true">
          <div className="journal-view__inner">
            <div className="journal-view__head">
              <h2 className="journal-view__title">Your Dream Journal</h2>
              <button
                type="button"
                className="journal-view__close"
                onClick={() => setJournalOpen(false)}
                aria-label="Close journal"
              >
                ×
              </button>
            </div>
            {journal.length === 0 ? (
              <p className="journal-view__empty">No dreams remembered yet.</p>
            ) : (
              <>
                <div className="journal-modes">
                  <button
                    type="button"
                    className="journal-mode"
                    data-active={journalViewMode === "full"}
                    onClick={() => chooseJournalView("full")}
                  >
                    Full
                  </button>
                  <button
                    type="button"
                    className="journal-mode"
                    data-active={journalViewMode === "compact"}
                    onClick={() => chooseJournalView("compact")}
                  >
                    Compact
                  </button>
                </div>

                <div className="journal-view__list">
                  {/* The ultimate interpretation across the whole journal */}
                  {journal.length >= 2 && (
                    <div className="journal-ultimate">
                      {ultimate ? (
                        <>
                          <p className="journal-ultimate__label">
                            Across all your dreams
                          </p>
                          <p className="journal-ultimate__text">{ultimate}</p>
                          <button
                            type="button"
                            className="journal-ultimate__again"
                            onClick={readWholeJournal}
                            disabled={ultimateLoading}
                          >
                            {ultimateLoading ? "reading…" : "read again"}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="journal-ultimate__btn"
                          onClick={readWholeJournal}
                          disabled={ultimateLoading}
                        >
                          {ultimateLoading
                            ? "reading the whole journal…"
                            : "✦ Interpret all my dreams"}
                        </button>
                      )}
                      {ultimateError && (
                        <p className="journal-ultimate__error">{ultimateError}</p>
                      )}
                    </div>
                  )}

                  {journal.map((entry) =>
                    journalViewMode === "full" ? (
                      <article
                        className="journal-entry journal-entry--full"
                        key={entry.id}
                      >
                        <p className="journal-entry__date">
                          {dateFmt.format(entry.createdAt)}
                        </p>
                        <p className="journal-entry__dream">{entry.dreamText}</p>
                        <p className="journal-entry__reading">
                          {entry.interpretation}
                        </p>
                        {entry.matchedSymbols.length > 0 && (
                          <p className="journal-entry__symbols">
                            {entry.matchedSymbols.join(" · ")}
                          </p>
                        )}
                      </article>
                    ) : (
                      <article
                        className="journal-entry"
                        data-open={expanded[entry.id] ? "true" : "false"}
                        key={entry.id}
                      >
                        <button
                          type="button"
                          className="journal-entry__head"
                          aria-expanded={!!expanded[entry.id]}
                          onClick={() => toggleEntry(entry.id)}
                        >
                          <span className="journal-entry__meta">
                            <span className="journal-entry__date">
                              {dateFmt.format(entry.createdAt)}
                            </span>
                            <span
                              className="journal-entry__chevron"
                              aria-hidden="true"
                            >
                              ›
                            </span>
                          </span>
                          <span className="journal-entry__dream">
                            {entry.dreamText}
                          </span>
                        </button>
                        {expanded[entry.id] && (
                          <div className="journal-entry__body">
                            <p className="journal-entry__reading">
                              {entry.interpretation}
                            </p>
                            {entry.matchedSymbols.length > 0 && (
                              <p className="journal-entry__symbols">
                                {entry.matchedSymbols.join(" · ")}
                              </p>
                            )}
                          </div>
                        )}
                      </article>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
