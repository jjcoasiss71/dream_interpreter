// src/app/api/interpret/route.ts
// ---------------------------------------------------------------------------
// The interpretation endpoint. The browser sends a dream; this route:
//   1. validates the request (zod — see src/types/api.ts, the shared contract)
//   2. matches symbols from the knowledge base and builds sourced grounding
//   3. asks the LLM (src/lib/llm.ts) to phrase a grounded interpretation
//   4. returns InterpretResponse
// The API key is read only on the server and never reaches the browser.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { matchSymbols } from "@/lib/knowledge";
import { buildGroundingText, frameworksUsed } from "@/lib/grounding";
import { chat, LlmError } from "@/lib/llm";
import {
  interpretRequestSchema,
  type InterpretRequest,
  type InterpretResponse,
} from "@/types/api";

/** Render the dreamer's optional on-device history into prompt context. */
function buildHistoryText(history: InterpretRequest["history"]): string {
  if (!history) return "";
  const parts: string[] = [];

  if (history.recurringSymbols?.length) {
    const top = history.recurringSymbols
      .slice(0, 8)
      .map((s) => `${s.label} (${s.count}×)`)
      .join(", ");
    if (top) parts.push(`Symbols that recur across their past dreams: ${top}.`);
  }

  if (history.recentDreams?.length) {
    const recent = history.recentDreams
      .slice(0, 3)
      .map((d, i) => `  ${i + 1}. ${d.dreamText.slice(0, 320)}`)
      .join("\n");
    if (recent) parts.push(`A few of their recent dreams:\n${recent}`);
  }

  return parts.join("\n\n");
}

export async function POST(request: Request) {
  try {
    const parsed = interpretRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ??
        "Please describe your dream in a little more detail.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const { dream, history } = parsed.data;

    const matched = matchSymbols(dream);
    const groundingText = buildGroundingText(matched);
    const historyText = buildHistoryText(history);

    const systemPrompt = `You are a careful, empathetic dream-interpretation assistant.
Rules:
- Explain the dream ONLY using the provided sourced perspectives below.
- Do NOT invent symbol meanings or cite anything not provided.
- Attribute ideas to their framework (e.g. "In Jungian theory...").
- Never claim certainty; dream interpretation is subjective.
- If the dreamer's history shows a genuinely recurring theme or symbol, you may gently note the pattern — but never force a connection or invent one.
- Be warm and concise. End with one gentle, reflective question.
${
  historyText
    ? `\nThe dreamer's private dream history (use it only to notice real recurring themes and make the reading more personal):\n${historyText}\n`
    : ""
}
Sourced perspectives you may use:
${groundingText}`;

    const interpretation =
      (
        await chat([
          { role: "system", content: systemPrompt },
          { role: "user", content: `My dream: ${dream}` },
        ])
      ).trim() || "No interpretation was generated.";

    const response: InterpretResponse = {
      interpretation,
      matchedSymbols: matched.map((s) => s.label),
      frameworksUsed: frameworksUsed(matched),
    };
    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof LlmError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong interpreting your dream." },
      { status: 500 }
    );
  }
}
