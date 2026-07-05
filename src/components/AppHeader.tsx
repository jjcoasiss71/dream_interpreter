// src/components/AppHeader.tsx
// The quiet UI layer above the scene — it never zooms with the camera.
"use client";

export function AppHeader({
  settingsOpen,
  onSitBack,
  onOpenJournal,
  onToggleSettings,
}: {
  settingsOpen: boolean;
  onSitBack: () => void;
  onOpenJournal: () => void;
  onToggleSettings: () => void;
}) {
  return (
    <header className="app-header">
      <button
        type="button"
        className="app-title"
        onClick={onSitBack}
        aria-label="Sit back to the desk"
      >
        Dream Interpreter
      </button>
      <div className="app-header__controls">
        <button type="button" className="header-btn" onClick={onOpenJournal}>
          Journal
        </button>
        <button
          type="button"
          className="header-btn header-btn--icon"
          onClick={onToggleSettings}
          aria-label="Settings"
          aria-expanded={settingsOpen}
        >
          ✦
        </button>
      </div>
    </header>
  );
}
