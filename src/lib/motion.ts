// src/lib/motion.ts

/** True when the OS asks for reduced motion (always false during SSR). */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
