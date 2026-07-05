// src/components/DreamOverlays.tsx
// The layers that carry the faint: rising symbol particles and the dream world
// (a placeholder — to be built out later).
"use client";

export function SymbolRise({ symbols }: { symbols: string[] }) {
  return (
    <div className="symbol-rise" aria-hidden="true">
      {symbols.slice(0, 6).map((symbol, i, arr) => (
        <span
          key={`${symbol}-${i}`}
          className="symbol-particle"
          style={{
            left: `${26 + i * (48 / Math.max(arr.length - 1, 1))}%`,
            animationDelay: `${0.2 + i * 0.34}s`,
          }}
        >
          {symbol.toLowerCase()}
        </span>
      ))}
    </div>
  );
}

export function Dreamworld({
  active,
  onWake,
}: {
  active: boolean;
  onWake: () => void;
}) {
  return (
    <div className="dreamworld" aria-hidden={!active}>
      <h2>You are inside the dream</h2>
      <p>
        The room is gone. What you wrote is taking shape around you — though it
        has not finished becoming anything yet.
      </p>
      <button type="button" className="wake" onClick={onWake}>
        Wake up
      </button>
    </div>
  );
}
