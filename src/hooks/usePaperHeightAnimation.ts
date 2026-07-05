// src/hooks/usePaperHeightAnimation.ts
"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type DependencyList,
  type RefObject,
} from "react";
import { prefersReducedMotion } from "@/lib/motion";

// useLayoutEffect on the client (no SSR warning) so the paper height can be
// measured and animated before paint.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * The paper grows/shrinks as its content changes (write → glow → reveal).
 * Animate that height change instead of letting it jump. Re-measures whenever
 * `deps` change.
 */
export function usePaperHeightAnimation(
  paperRef: RefObject<HTMLDivElement | null>,
  deps: DependencyList
) {
  const prevHeight = useRef<number | null>(null);

  useIsoLayoutEffect(() => {
    const el = paperRef.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.height = "";
      prevHeight.current = null;
      return;
    }
    // measure the natural content height (unscaled by the stage transform)
    el.style.transition = "none";
    el.style.height = "auto";
    const target = el.offsetHeight;
    const prev = prevHeight.current;
    if (prev != null && Math.abs(prev - target) > 4) {
      el.style.height = `${prev}px`;
      void el.offsetHeight; // force reflow so the next change animates
      el.style.transition = "height 800ms cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.height = `${target}px`;
    } else {
      el.style.height = `${target}px`;
    }
    prevHeight.current = target;
  }, deps);
}
