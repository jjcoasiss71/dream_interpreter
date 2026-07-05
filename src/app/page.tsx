// src/app/page.tsx
// ---------------------------------------------------------------------------
// First-person desk experience — the orchestrator. Owns the phase machine and
// the camera, wires the hooks together, and composes the scene from the
// components in src/components. It calls our own /api routes (never Groq
// directly).
// ---------------------------------------------------------------------------
"use client";

import { useEffect, useRef, useState } from "react";
import { buildHistoryContext } from "@/lib/journal";
import { prefersReducedMotion } from "@/lib/motion";
import { useJournal } from "@/hooks/useJournal";
import { useTimers } from "@/hooks/useTimers";
import { usePaperHeightAnimation } from "@/hooks/usePaperHeightAnimation";
import { AppHeader } from "@/components/AppHeader";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Candle } from "@/components/Candle";
import { ResultFace } from "@/components/ResultFace";
import { SymbolRise, Dreamworld } from "@/components/DreamOverlays";
import { JournalModal } from "@/components/JournalModal";
import type { Mode, Phase, CameraView } from "@/types/dream";
import type { InterpretResponse, ApiError } from "@/types/api";

export default function Home() {
  // Daybreak mode is kept in the code (tokens/styles) but its toggle is hidden
  // for now, so the mode stays on the default.
  const [mode] = useState<Mode>("nightfall");
  const [phase, setPhase] = useState<Phase>("writing");
  // Camera zoom state and the settings popover. We open on the desk scene.
  const [view, setView] = useState<CameraView>("desk");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [dream, setDream] = useState("");
  const [sentText, setSentText] = useState("");
  const [result, setResult] = useState<InterpretResponse | null>(null);
  const [error, setError] = useState("");

  const journal = useJournal();
  const timers = useTimers();

  // The paper grows/shrinks as its content changes; animate it.
  const paperRef = useRef<HTMLDivElement>(null);
  usePaperHeightAnimation(paperRef, [phase, result]);

  // Drive the adaptive UI from a single attribute on <body>.
  useEffect(() => {
    document.body.dataset.mode = mode;
  }, [mode]);

  // If public/paper.jpg exists, use it as the parchment texture (the CSS
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
    // Stay on the "writing" camera position (don't pull back to "paper") so
    // the result sheet keeps the exact same top line position it had while
    // typing — no vertical jump between writing and reveal.
    setSentText(dream); // the words that will glow and burn away
    setPhase("sending");

    // Only when the dreamer has opted in: a compact summary of past dreams so
    // the reading can notice patterns.
    const history = journal.memoryOn
      ? buildHistoryContext(journal.journal)
      : undefined;

    // Let the written dream glow (~3s) and erase (~0.8s) before the reveal.
    const minDelay = new Promise((r) => setTimeout(r, reduced ? 200 : 4000));
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(journal.memoryOn ? { dream, history } : { dream }),
      });
      const data = (await res.json()) as InterpretResponse & ApiError;
      await minDelay;
      if (!res.ok) {
        setError(data.error ?? "The page stayed blank — try again.");
        setPhase("writing");
      } else {
        setResult(data);
        setPhase("result");
        // Remember this dream on the device for future, deeper readings.
        if (journal.memoryOn) {
          journal.remember({
            id:
              typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : String(Date.now()),
            dreamText: dream,
            interpretation: data.interpretation,
            matchedSymbols: data.matchedSymbols ?? [],
            frameworksUsed: data.frameworksUsed ?? [],
            createdAt: Date.now(),
          });
        }
      }
    } catch {
      await minDelay;
      setError("Could not reach the interpreter. Is the app running?");
      setPhase("writing");
    }
  }

  function writeAgain() {
    timers.clear();
    setResult(null);
    setError("");
    setDream("");
    setPhase("writing");
  }

  function enterDream() {
    timers.clear();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPhase("fainting");
    const ms = prefersReducedMotion() ? 500 : 3000;
    timers.schedule(() => setPhase("dreamworld"), ms);
  }

  function wakeUp() {
    timers.clear();
    setPhase("waking");
    const ms = prefersReducedMotion() ? 500 : 2200;
    timers.schedule(() => setPhase("result"), ms);
  }

  const inDream =
    phase === "fainting" || phase === "dreamworld" || phase === "waking";
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

      <AppHeader
        settingsOpen={settingsOpen}
        onSitBack={() => setView("desk")}
        onOpenJournal={() => setJournalOpen(true)}
        onToggleSettings={() => setSettingsOpen((s) => !s)}
      />

      {settingsOpen && (
        <SettingsPanel
          memoryOn={journal.memoryOn}
          journalCount={journal.journal.length}
          onToggleMemory={journal.toggleMemory}
          onForgetAll={journal.forgetAll}
        />
      )}

      {/* The camera tilts back during the faint; the stage zooms between the
         desk / paper / writing camera views. */}
      <div className="camera">
        <div className="stage">
          <main className="shell">
            <div className="scene-content">
              <Candle />

              {/* A single sheet of paper. You write your dream on it; on
                 sealing, the words glow, burn away, and the interpretation
                 takes their place on the very same page. */}
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
                  <ResultFace
                    result={result}
                    onEnterDream={enterDream}
                    onWriteAgain={writeAgain}
                  />
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
        <SymbolRise symbols={symbols} />
      )}

      {/* Consciousness fading */}
      <div className="faint-veil" aria-hidden="true" />

      {/* The dream world we fall into (placeholder — to be built out later) */}
      {inDream && (
        <Dreamworld active={phase === "dreamworld"} onWake={wakeUp} />
      )}

      {journalOpen && (
        <JournalModal
          journal={journal.journal}
          viewMode={journal.viewMode}
          expanded={journal.expanded}
          ultimate={journal.ultimate}
          ultimateLoading={journal.ultimateLoading}
          ultimateError={journal.ultimateError}
          onChooseViewMode={journal.chooseViewMode}
          onToggleEntry={journal.toggleEntry}
          onReadWholeJournal={journal.readWholeJournal}
          onClose={() => setJournalOpen(false)}
        />
      )}
    </div>
  );
}
