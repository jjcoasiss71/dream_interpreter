// Tests for the on-device journal: storage versioning, legacy migration, the
// entry cap, and the history context sent to the interpreter.
import { beforeEach, describe, it, expect, vi } from "vitest";
import {
  loadJournal,
  saveEntry,
  clearJournal,
  buildHistoryContext,
  loadMemoryEnabled,
  setMemoryEnabled,
  type JournalEntry,
} from "./journal";

// A minimal localStorage for the node test environment.
function stubLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
    matchMedia: () => ({ matches: false }),
  });
  return store;
}

function entry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: Math.random().toString(36).slice(2),
    dreamText: "I was flying",
    interpretation: "…",
    matchedSymbols: ["Flying"],
    frameworksUsed: [],
    createdAt: Date.now(),
    ...overrides,
  };
}

let store: Map<string, string>;
beforeEach(() => {
  store = stubLocalStorage();
});

describe("journal storage", () => {
  it("saves and reloads entries through the versioned envelope", () => {
    saveEntry(entry({ id: "a" }));
    const parsed = JSON.parse(store.get("dream-journal")!);
    expect(parsed.v).toBe(1); // versioned on disk
    expect(loadJournal().map((e) => e.id)).toEqual(["a"]);
  });

  it("migrates the legacy bare-array format transparently", () => {
    store.set("dream-journal", JSON.stringify([entry({ id: "legacy" })]));
    expect(loadJournal().map((e) => e.id)).toEqual(["legacy"]);
  });

  it("returns [] for corrupt payloads instead of throwing", () => {
    store.set("dream-journal", "{not json");
    expect(loadJournal()).toEqual([]);
    store.set("dream-journal", JSON.stringify({ unexpected: true }));
    expect(loadJournal()).toEqual([]);
  });

  it("prepends new entries and caps the list at 50", () => {
    for (let i = 0; i < 55; i++) saveEntry(entry({ id: `e${i}` }));
    const all = loadJournal();
    expect(all).toHaveLength(50);
    expect(all[0].id).toBe("e54"); // newest first
  });

  it("clearJournal forgets everything", () => {
    saveEntry(entry());
    clearJournal();
    expect(loadJournal()).toEqual([]);
  });
});

describe("memory preference", () => {
  it("defaults to on, and can be explicitly disabled", () => {
    expect(loadMemoryEnabled()).toBe(true);
    setMemoryEnabled(false);
    expect(loadMemoryEnabled()).toBe(false);
    setMemoryEnabled(true);
    expect(loadMemoryEnabled()).toBe(true);
  });
});

describe("buildHistoryContext", () => {
  it("surfaces only symbols that recur (2+) and the 3 most recent dreams", () => {
    const entries = [
      entry({ dreamText: "d1", matchedSymbols: ["Water", "Snake"] }),
      entry({ dreamText: "d2", matchedSymbols: ["Water"] }),
      entry({ dreamText: "d3", matchedSymbols: ["Flying"] }),
      entry({ dreamText: "d4", matchedSymbols: [] }),
    ];
    const ctx = buildHistoryContext(entries);
    expect(ctx.recurringSymbols).toEqual([{ label: "Water", count: 2 }]);
    expect(ctx.recentDreams.map((d) => d.dreamText)).toEqual([
      "d1",
      "d2",
      "d3",
    ]);
  });
});
