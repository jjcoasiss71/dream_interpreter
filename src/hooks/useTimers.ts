// src/hooks/useTimers.ts
"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * setTimeout that cleans up after itself: every scheduled timer is cleared on
 * unmount (or explicitly via clear()), so a mid-cinematic unmount can't fire
 * stale phase changes.
 */
export function useTimers() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => clear, [clear]);

  return { schedule, clear };
}
