// src/hooks/useJournal.ts
// ---------------------------------------------------------------------------
// All journal-related client state in one place: the on-device entries, the
// remember-my-dreams preference, the Full/Compact view, per-entry expansion,
// and the "ultimate interpretation" across the whole journal.
// ---------------------------------------------------------------------------
"use client";

import { useEffect, useState } from "react";
import {
  loadJournal,
  saveEntry,
  clearJournal,
  loadMemoryEnabled,
  setMemoryEnabled,
  loadJournalView,
  saveJournalView,
  type JournalEntry,
  type JournalView,
} from "@/lib/journal";
import type { JournalReadResponse, ApiError } from "@/types/api";

export function useJournal() {
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [memoryOn, setMemoryOn] = useState(true); // on by default; can opt out
  const [viewMode, setViewMode] = useState<JournalView>("full");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [ultimate, setUltimate] = useState<string | null>(null);
  const [ultimateLoading, setUltimateLoading] = useState(false);
  const [ultimateError, setUltimateError] = useState("");

  // Load the on-device journal + preferences once, in the browser.
  // (localStorage isn't available during SSR, so this happens after mount.)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setJournal(loadJournal());
    setMemoryOn(loadMemoryEnabled());
    setViewMode(loadJournalView());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function chooseViewMode(mode: JournalView) {
    setViewMode(mode);
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

  /** Remember a new reading on this device (used after a successful seal). */
  function remember(entry: JournalEntry) {
    setJournal(saveEntry(entry));
  }

  /** The "ultimate interpretation": one reflection across the whole journal. */
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
      const data = (await res.json()) as JournalReadResponse & ApiError;
      if (!res.ok) setUltimateError(data.error ?? "Could not read the journal.");
      else setUltimate(data.reading);
    } catch {
      setUltimateError("Could not reach the interpreter.");
    } finally {
      setUltimateLoading(false);
    }
  }

  return {
    journal,
    memoryOn,
    viewMode,
    expanded,
    ultimate,
    ultimateLoading,
    ultimateError,
    chooseViewMode,
    toggleMemory,
    forgetAll,
    toggleEntry,
    remember,
    readWholeJournal,
  };
}
