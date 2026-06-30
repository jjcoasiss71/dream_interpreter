// app/api/dreamwalk/route.ts
// ---------------------------------------------------------------------------
// The "Dream Walk" narrator. Given the dreamer's own dream (+ its symbols) and
// the journey so far, it narrates the next moment in second person and offers a
// few possible next actions — a surreal, candlelit text exploration of the
// dream. Stateless: the client sends the whole journey each turn.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { chat, hasLLM } from "@/lib/llm";

type Turn = { type: "scene" | "action"; text: string };

const FALLBACK_CHOICES = ["Look closer", "Walk on", "Call out", "Wake yourself"];

function fallback(action: string | null) {
  return {
    narration: action
      ? "The dream folds around your choice. For a moment the way ahead blurs — shapes that won't quite settle, a hush pressing close."
      : "You step inside. The air is warm and dim, lit as if by a single candle somewhere out of sight. The dream waits, patient, for you to move.",
    choices: FALLBACK_CHOICES,
  };
}

/** Parse JSON even if the model wraps it in prose or ```code fences. */
function parseJsonLoose(raw: string): { narration?: unknown; choices?: unknown } | null {
  if (!raw) return null;
  const s = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(s);
  } catch {
    const a = s.indexOf("{");
    const b = s.lastIndexOf("}");
    if (a >= 0 && b > a) {
      try {
        return JSON.parse(s.slice(a, b + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { dream, symbols, turns, action } = await request.json();

    if (!dream || typeof dream !== "string" || dream.trim().length < 3) {
      return NextResponse.json(
        { error: "There is no dream to walk into yet." },
        { status: 400 }
      );
    }

    if (!hasLLM()) {
      return NextResponse.json(fallback(typeof action === "string" ? action : null));
    }

    const symbolText =
      Array.isArray(symbols) && symbols.length > 0 ? symbols.join(", ") : "—";

    const journey =
      Array.isArray(turns) && turns.length > 0
        ? (turns as Turn[])
            .map((t) => (t.type === "scene" ? `[the dream] ${t.text}` : `[you] ${t.text}`))
            .join("\n")
        : "(the dreamer is only now stepping inside)";

    const systemPrompt = `You are the voice of a dream — narrating a surreal, second-person exploration of the dreamer's OWN dream.
- Write in present tense, second person ("you...").
- Ground everything in the dreamer's described dream and its symbols, then let it drift and transform the way dreams do.
- TONE MUST MIRROR THE DREAMER'S DREAM: match its actual mood, setting, time of day, and emotional register. If their dream is peaceful, be gentle and bright; if it is frightening, let unease surface; if joyful, tender, or strange, reflect exactly that. Do NOT impose a dark, candlelit, vintage, or dreadful mood unless the dream itself calls for it. Keep gore and jump-scares out; intensity should track the dream, never exceed it.
- Each response: 2 to 4 sentences of vivid narration that RESPOND to what the dreamer just did, then invent 2 to 4 short possible next actions (each 2-6 words, imperative).
- Keep continuity with the journey so far. Never mention that this is a game, a story, or an AI.
Respond ONLY as a JSON object: {"narration": string, "choices": string[]}`;

    const userPrompt = `THE DREAM (as the dreamer wrote it): ${dream}
KEY SYMBOLS: ${symbolText}

THE JOURNEY SO FAR:
${journey}

THE DREAMER NOW: ${
      typeof action === "string" && action.trim()
        ? action.trim()
        : "steps into the dream and looks around"
    }

Continue the dream from here.`;

    let raw = "";
    try {
      raw = await chat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        { temperature: 0.9, maxTokens: 600 }
      );
    } catch (err) {
      console.error("dreamwalk LLM error:", err);
      return NextResponse.json(fallback(typeof action === "string" ? action : null));
    }

    const parsed = parseJsonLoose(raw);

    const narration =
      parsed && typeof parsed.narration === "string" && parsed.narration.trim()
        ? parsed.narration.trim()
        : "The dream blurs, shapes refusing to settle, as if it isn't ready to be seen.";

    const choices = Array.isArray(parsed?.choices)
      ? parsed!.choices
          .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
          .slice(0, 4)
      : [];

    return NextResponse.json({
      narration,
      choices: choices.length > 0 ? choices : FALLBACK_CHOICES,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "The dream slips away for a moment." },
      { status: 500 }
    );
  }
}
