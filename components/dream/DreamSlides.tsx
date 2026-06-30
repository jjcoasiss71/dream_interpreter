// components/dream/DreamSlides.tsx
// ---------------------------------------------------------------------------
// A full-screen crossfading slideshow of a scene's generated images — a small
// "dream reel" of the moment, with a slow Ken Burns drift. Replaces the 3D
// look-around: flat slides, no dizziness. Pure CSS/React, no WebGL.
// ---------------------------------------------------------------------------
"use client";

import { useEffect, useState } from "react";

const HOLD_MS = 6000; // time each slide is shown before crossfading

export function DreamSlides({ images }: { images: (string | null)[] }) {
  const slides = images.filter((u): u is string => typeof u === "string" && !!u);
  const [active, setActive] = useState(0);

  // Restart from the first slide whenever a new scene's set arrives.
  useEffect(() => {
    setActive(0);
  }, [images]);

  // Auto-advance through the slides.
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(
      () => setActive((a) => (a + 1) % slides.length),
      HOLD_MS
    );
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) {
    return <div className="dreamslides dreamslides--empty" />;
  }

  return (
    <div className="dreamslides">
      {slides.map((src, i) => (
        <div
          key={i}
          className="dreamslide"
          data-active={i === active}
          style={{ backgroundImage: `url("${src}")` }}
        />
      ))}
    </div>
  );
}
