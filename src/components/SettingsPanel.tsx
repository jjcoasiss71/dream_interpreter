// src/components/SettingsPanel.tsx
// The ✦ popover: the remember-my-dreams switch and the forget-all control.
"use client";

export function SettingsPanel({
  memoryOn,
  journalCount,
  onToggleMemory,
  onForgetAll,
}: {
  memoryOn: boolean;
  journalCount: number;
  onToggleMemory: () => void;
  onForgetAll: () => void;
}) {
  return (
    <div className="settings-panel">
      <p className="settings-panel__label">Dream journal</p>
      <div className="mem-row">
        <span className="mem-label">Remember my dreams</span>
        <button
          type="button"
          className="mem-switch"
          role="switch"
          aria-checked={memoryOn}
          data-on={memoryOn}
          aria-label="Remember my dreams on this device"
          onClick={onToggleMemory}
        >
          <span className="mem-knob" />
        </button>
      </div>
      <p className="settings-journal__count">
        {journalCount === 0
          ? "kept only on this device · nothing yet"
          : `${journalCount} dream${journalCount === 1 ? "" : "s"} kept on this device`}
      </p>
      {journalCount > 0 && (
        <button type="button" className="forget-all" onClick={onForgetAll}>
          forget all
        </button>
      )}
    </div>
  );
}
