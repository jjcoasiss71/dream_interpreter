// src/components/JournalModal.tsx
// ---------------------------------------------------------------------------
// The dream journal — reread your past dreams (kept on this device), switch
// between Full and Compact views, and ask for the "ultimate interpretation"
// across the whole journal.
// ---------------------------------------------------------------------------
"use client";

import type { JournalEntry, JournalView } from "@/lib/journal";

const dateFmt = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function JournalModal({
  journal,
  viewMode,
  expanded,
  ultimate,
  ultimateLoading,
  ultimateError,
  onChooseViewMode,
  onToggleEntry,
  onReadWholeJournal,
  onClose,
}: {
  journal: JournalEntry[];
  viewMode: JournalView;
  expanded: Record<string, boolean>;
  ultimate: string | null;
  ultimateLoading: boolean;
  ultimateError: string;
  onChooseViewMode: (mode: JournalView) => void;
  onToggleEntry: (id: string) => void;
  onReadWholeJournal: () => void;
  onClose: () => void;
}) {
  return (
    <div className="journal-view" role="dialog" aria-modal="true">
      <div className="journal-view__inner">
        <div className="journal-view__head">
          <h2 className="journal-view__title">Your Dream Journal</h2>
          <button
            type="button"
            className="journal-view__close"
            onClick={onClose}
            aria-label="Close journal"
          >
            ×
          </button>
        </div>
        {journal.length === 0 ? (
          <p className="journal-view__empty">No dreams remembered yet.</p>
        ) : (
          <>
            <div className="journal-modes">
              <button
                type="button"
                className="journal-mode"
                data-active={viewMode === "full"}
                onClick={() => onChooseViewMode("full")}
              >
                Full
              </button>
              <button
                type="button"
                className="journal-mode"
                data-active={viewMode === "compact"}
                onClick={() => onChooseViewMode("compact")}
              >
                Compact
              </button>
            </div>

            <div className="journal-view__list">
              {/* The ultimate interpretation across the whole journal */}
              {journal.length >= 2 && (
                <div className="journal-ultimate">
                  {ultimate ? (
                    <>
                      <p className="journal-ultimate__label">
                        Across all your dreams
                      </p>
                      <p className="journal-ultimate__text">{ultimate}</p>
                      <button
                        type="button"
                        className="journal-ultimate__again"
                        onClick={onReadWholeJournal}
                        disabled={ultimateLoading}
                      >
                        {ultimateLoading ? "reading…" : "read again"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="journal-ultimate__btn"
                      onClick={onReadWholeJournal}
                      disabled={ultimateLoading}
                    >
                      {ultimateLoading
                        ? "reading the whole journal…"
                        : "✦ Interpret all my dreams"}
                    </button>
                  )}
                  {ultimateError && (
                    <p className="journal-ultimate__error">{ultimateError}</p>
                  )}
                </div>
              )}

              {journal.map((entry) =>
                viewMode === "full" ? (
                  <article
                    className="journal-entry journal-entry--full"
                    key={entry.id}
                  >
                    <p className="journal-entry__date">
                      {dateFmt.format(entry.createdAt)}
                    </p>
                    <p className="journal-entry__dream">{entry.dreamText}</p>
                    <p className="journal-entry__reading">
                      {entry.interpretation}
                    </p>
                    {entry.matchedSymbols.length > 0 && (
                      <p className="journal-entry__symbols">
                        {entry.matchedSymbols.join(" · ")}
                      </p>
                    )}
                  </article>
                ) : (
                  <article
                    className="journal-entry"
                    data-open={expanded[entry.id] ? "true" : "false"}
                    key={entry.id}
                  >
                    <button
                      type="button"
                      className="journal-entry__head"
                      aria-expanded={!!expanded[entry.id]}
                      onClick={() => onToggleEntry(entry.id)}
                    >
                      <span className="journal-entry__meta">
                        <span className="journal-entry__date">
                          {dateFmt.format(entry.createdAt)}
                        </span>
                        <span
                          className="journal-entry__chevron"
                          aria-hidden="true"
                        >
                          ›
                        </span>
                      </span>
                      <span className="journal-entry__dream">
                        {entry.dreamText}
                      </span>
                    </button>
                    {expanded[entry.id] && (
                      <div className="journal-entry__body">
                        <p className="journal-entry__reading">
                          {entry.interpretation}
                        </p>
                        {entry.matchedSymbols.length > 0 && (
                          <p className="journal-entry__symbols">
                            {entry.matchedSymbols.join(" · ")}
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
