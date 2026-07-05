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

/** Split the model's "[meaning] … [foretelling] …" output into its two parts.
 *  If the labels are missing, the whole text becomes the meaning. */
function parseTwoPartReading(raw: string): {
  meaning: string;
  foretelling: string;
} {
  const match = /\[meaning\]\s*([\s\S]*?)\s*\[foretelling\]\s*([\s\S]*)/i.exec(
    raw
  );
  if (match) {
    return { meaning: match[1].trim(), foretelling: match[2].trim() };
  }
  const cleaned = raw.replace(/^\[meaning\]\s*/i, "").trim();
  return {
    meaning: cleaned || "No interpretation was generated.",
    foretelling: "",
  };
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

    const systemPrompt = `You are a careful, empathetic dream-interpretation assistant with the voice of a thoughtful 19th-century dream reader.
Write the reading in TWO parts, each under its exact label on its own line:

[meaning]
What the dream means. Ground every idea ONLY in the sourced perspectives below and attribute them ("In Jungian theory…", "The continuity hypothesis suggests…"). Go deep rather than broad: pick the 2-4 most relevant symbols and weave them into ONE coherent reading of THIS dream — refer to the dreamer's actual details (places, people, feelings, what happened) rather than reciting generic symbol meanings. If perspectives disagree, let them speak to each other. 2-3 paragraphs.

[foretelling]
What the dream may foretell. Reading the same perspectives forward, gently suggest what this dream hints about the dreamer's near path — what may be approaching, what deserves watching, what the dream seems to be preparing them for. Phrase it as soft foresight ("this often comes before…", "keep an eye on…", "the weeks ahead may ask…"), never as certain prophecy, and never medical, legal, or financial advice. 1-2 paragraphs, ending with ONE gentle, reflective question.

Rules for both parts:
- ONLY the provided sourced perspectives; never invent symbol meanings.
- Never claim certainty; dreams are subjective.
- If the dreamer's history shows a genuinely recurring theme, you may note the pattern — never force one.
- Output nothing but the two labeled parts.
${
  historyText
    ? `\nThe dreamer's private dream history (use it only to notice real recurring themes and make the reading more personal):\n${historyText}\n`
    : ""
}
Sourced perspectives you may use:
${groundingText}`;

    const raw = (
      await chat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: `My dream: ${dream}` },
        ],
        { temperature: 0.75 }
      )
    ).trim();

    const { meaning, foretelling } = parseTwoPartReading(raw);
    const interpretation = foretelling
      ? `${meaning}\n\nWhat it may foretell\n${foretelling}`
      : meaning;

    const response: InterpretResponse = {
      meaning,
      foretelling,
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
