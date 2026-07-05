// src/components/Candle.tsx
// ---------------------------------------------------------------------------
// The candle — sits on the desk, behind the paper. A real candle.png (if
// present) replaces the CSS-drawn candle; the breathing/guttering halo stays
// behind it as the living light.
// ---------------------------------------------------------------------------
"use client";

import { useEffect, useState } from "react";

export function Candle() {
  // Detect the candle photo via a preloader so a cached image (which can
  // finish before React attaches an onLoad handler) is still detected.
  const [photoOk, setPhotoOk] = useState(false);
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setPhotoOk(true);
    img.onerror = () => setPhotoOk(false);
    img.src = "/candle.png";
  }, []);

  return (
    <div className="accent-stage" aria-hidden="true">
      <div className="candle">
        <span className="candle-halo" />
        {!photoOk && (
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
        {photoOk && (
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
  );
}
