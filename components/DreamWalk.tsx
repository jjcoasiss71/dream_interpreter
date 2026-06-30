// components/DreamWalk.tsx
// ---------------------------------------------------------------------------
// The Dream Walk — a second-person, LLM-narrated exploration of the dreamer's
// own dream. The dreamer reads each moment, then chooses an action (or types
// their own) to move deeper. Text-only and infinitely flexible; imagery/audio
// can layer on later.
// ---------------------------------------------------------------------------
"use client";

import { useEffect, useRef, useState } from "react";
import { DreamSlides } from "@/components/dream/DreamSlides";

type Turn = { type: "scene" | "action"; text: string };

export function DreamWalk({
  dream,
  symbols,
  onWake,
}: {
  dream: string;
  symbols: string[];
  onWake: () => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState("");
  // The 4-image skybox for the current moment (empty = dark fallback).
  const [panoImages, setPanoImages] = useState<(string | null)[]>([]);
  const [panoLoading, setPanoLoading] = useState(false);
  const started = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Generate the look-around panorama for a scene; keep the previous one until
  // the new image is ready, and never block the narration on it.
  async function loadPano(narration: string) {
    setPanoLoading(true);
    try {
      const res = await fetch("/api/panorama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ narration, dream }),
      });
      const data = await res.json();
      // Keep the previous walls until the new set has at least one image.
      if (data && Array.isArray(data.images) && data.images.some(Boolean)) {
        setPanoImages(data.images);
      }
    } catch {
      /* keep the previous panorama / gradient */
    } finally {
      setPanoLoading(false);
    }
  }

  async function step(action: string | null, currentTurns: Turn[]) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dreamwalk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dream, symbols, turns: currentTurns, action }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "lost");
      const next: Turn[] = [...currentTurns];
      if (action) next.push({ type: "action", text: action });
      next.push({ type: "scene", text: data.narration });
      setTurns(next);
      setChoices(Array.isArray(data.choices) ? data.choices.slice(0, 4) : []);
      loadPano(data.narration); // fire-and-forget; text doesn't wait on the image
    } catch {
      setError("The dream slips from your grasp. Try once more.");
    } finally {
      setLoading(false);
    }
  }

  // Begin the walk once, when we arrive in the dream.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    step(null, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the latest moment in view.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns, loading]);

  function choose(action: string) {
    if (loading) return;
    step(action, turns);
  }

  function submitCustom(e: React.FormEvent) {
    e.preventDefault();
    const a = custom.trim();
    if (!a || loading) return;
    setCustom("");
    step(a, turns);
  }

  return (
    <div className="dreamwalk">
      {/* Full-screen crossfading slideshow of the scene behind everything. */}
      <div className="dreamwalk__pano">
        <DreamSlides images={panoImages} />
      </div>

      {panoLoading && (
        <p className="dreamwalk__look" aria-hidden="true">
          the dream is taking shape…
        </p>
      )}

      {/* The narration + choices, as a panel over the panorama. */}
      <div className="dreamwalk__panel">
        <div className="dreamwalk__log" ref={logRef}>
          {turns.map((t, i) =>
            t.type === "scene" ? (
              <p key={i} className="dreamwalk__scene">
                {t.text}
              </p>
            ) : (
              <p key={i} className="dreamwalk__choice-made">
                ❯ {t.text}
              </p>
            )
          )}
          {loading && <p className="dreamwalk__loading">the dream shifts…</p>}
          {error && <p className="dreamwalk__error">{error}</p>}
        </div>

        <div className="dreamwalk__controls">
          {!loading && choices.length > 0 && (
            <div className="dreamwalk__choices">
              {choices.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  className="dreamwalk__choice"
                  onClick={() => choose(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <form className="dreamwalk__custom" onSubmit={submitCustom}>
            <input
              type="text"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="…or do something else"
              disabled={loading}
              aria-label="Do something else in the dream"
            />
            <button type="submit" disabled={loading || !custom.trim()}>
              Do
            </button>
          </form>

          <button type="button" className="dreamwalk__wake" onClick={onWake}>
            Wake up
          </button>
        </div>
      </div>
    </div>
  );
}
