// src/app/api/journal/route.ts
// ---------------------------------------------------------------------------
// The "ultimate interpretation": reads the WHOLE dream journal at once and
// reflects on the recurring symbols, themes, and threads across all of it —
// still grounded only in the sourced frameworks. The dreams are sent from the
// browser (they live on-device) and are never stored here.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { matchSymbols } from "@/lib/knowledge";
import { buildGroundingText } from "@/lib/grounding";
import { chat, LlmError } from "@/lib/llm";
import {
  journalReadRequestSchema,
  type JournalReadResponse,
} from "@/types/api";

export async function POST(request: Request) {
  try {
    const parsed = journalReadRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "There are no dreams to reflect on yet." },
        { status: 400 }
      );
    }

    const texts = parsed.data.dreams
      .map((d) => d.dreamText.trim())
      .filter(Boolean)
      .slice(0, 40);

    if (texts.length === 0) {
      return NextResponse.json(
        { error: "There are no dreams to reflect on yet." },
        { status: 400 }
      );
    }

    // Find every catalogued symbol that appears anywhere in the journal.
    const matched = matchSymbols(texts.join("\n"));
    const groundingText = buildGroundingText(matched);

    const journalText = texts
      .map((t, i) => `  ${i + 1}. ${t.slice(0, 300)}`)
      .join("\n");

    const systemPrompt = `You are a careful, empathetic dream-interpretation assistant reading a person's WHOLE dream journal at once.
Rules:
- Look ACROSS all the dreams for recurring symbols, themes, and emotional threads — what keeps returning.
- Explain ONLY using the provided sourced perspectives below. Do NOT invent meanings.
- Attribute ideas to their framework (e.g. "In Jungian theory...").
- Never claim certainty; dream interpretation is subjective.
- Be warm and unhurried. Give ONE overarching reflection on what their dream life seems to circle around, then end with a single gentle, reflective question.

Sourced perspectives you may use:
${groundingText}`;

    const reading =
      (
        await chat([
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Here is my dream journal (most recent first):\n${journalText}`,
          },
        ])
      ).trim() || "No reflection was generated.";

    const response: JournalReadResponse = {
      reading,
      matchedSymbols: matched.map((s) => s.label),
    };
    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof LlmError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong reading the journal." },
      { status: 500 }
    );
  }
}
