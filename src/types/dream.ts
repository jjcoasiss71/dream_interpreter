// src/types/dream.ts
// ---------------------------------------------------------------------------
// Client-side domain types for the desk experience.
// ---------------------------------------------------------------------------

export type Mode = "nightfall" | "daybreak";

/** reality flow: writing → sending → result; dream flow: fainting → dreamworld → waking */
export type Phase =
  "writing" | "sending" | "result" | "fainting" | "dreamworld" | "waking";

/** camera distance from the desk — the zoom system (DESK / PAPER / WRITING) */
export type CameraView = "desk" | "paper" | "writing";
