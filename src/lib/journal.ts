// lib/journal.ts
// ---------------------------------------------------------------------------
// The dream journal lives ONLY in the browser (localStorage). Nothing is sent
// to a server or stored in an account — so a dream stays on the dreamer's own
// device. Past dreams are used to give later interpretations more depth.
// ---------------------------------------------------------------------------

export type JournalEntry = {
  id: string;
  dreamText: string;
  interpretation: string;
  matchedSymbols: string[];
  frameworksUsed: string[];
  createdAt: number;
};

// A compact summary of the past, small enough to pass to the LLM.
export type HistoryContext = {
  recurringSymbols: { label: string; count: number }[];
  recentDreams: { dreamText: string; createdAt: number }[];
};

const KEY = "dream-journal";
const PREF_KEY = "dream-memory-enabled";
const MAX_ENTRIES = 50;

/** Whether dreams are remembered (default: on; off only if explicitly set). */
export function loadMemoryEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(PREF_KEY) !== "false";
  } catch {
    return true;
  }
}

export function setMemoryEnabled(on: boolean): void {
  try {
    window.localStorage.setItem(PREF_KEY, on ? "true" : "false");
  } catch {
    // ignore
  }
}

export type JournalView = "full" | "compact";
const VIEW_KEY = "dream-journal-view";

/** How the journal is shown — full entries (default) or collapsible. */
export function loadJournalView(): JournalView {
  if (typeof window === "undefined") return "full";
  try {
    return window.localStorage.getItem(VIEW_KEY) === "compact"
      ? "compact"
      : "full";
  } catch {
    return "full";
  }
}

export function saveJournalView(mode: JournalView): void {
  try {
    window.localStorage.setItem(VIEW_KEY, mode);
  } catch {
    // ignore
  }
}

export function loadJournal(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as JournalEntry[]) : [];
  } catch {
    return [];
  }
}

/** Prepend a new entry, cap the list, persist, and return the new list. */
export function saveEntry(entry: JournalEntry): JournalEntry[] {
  const next = [entry, ...loadJournal()].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full / disabled — fail quietly, the app still works.
  }
  return next;
}

export function clearJournal(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/**
 * Build the small context the interpreter uses to notice patterns: which
 * symbols recur across past dreams, plus the few most recent dreams.
 */
export function buildHistoryContext(journal: JournalEntry[]): HistoryContext {
  const counts = new Map<string, number>();
  for (const entry of journal) {
    for (const symbol of entry.matchedSymbols ?? []) {
      counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
    }
  }

  const recurringSymbols = [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }));

  const recentDreams = journal
    .slice(0, 3)
    .map((entry) => ({ dreamText: entry.dreamText, createdAt: entry.createdAt }));

  return { recurringSymbols, recentDreams };
}
