// app/api/journal/route.ts
// ---------------------------------------------------------------------------
// The "ultimate interpretation": reads the WHOLE dream journal at once and
// reflects on the recurring symbols, themes, and threads across all of it —
// still grounded only in the sourced frameworks. The dreams are sent from the
// browser (they live on-device) and are never stored here.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import {
  matchSymbols,
  getFramework,
  frameworkSummaries,
} from "@/lib/knowledge";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

type IncomingDream = { dreamText?: string };

export async function POST(request: Request) {
  try {
    const { dreams } = await request.json();

    if (!Array.isArray(dreams) || dreams.length === 0) {
      return NextResponse.json(
        { error: "There are no dreams to reflect on yet." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing its GROQ_API_KEY." },
        { status: 500 }
      );
    }

    const texts = (dreams as IncomingDream[])
      .map((d) => (typeof d?.dreamText === "string" ? d.dreamText.trim() : ""))
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

    let groundingText: string;
    if (matched.length > 0) {
      groundingText = matched
        .map((symbol) => {
          const lines = symbol.perspectives.map((p) => {
            const fw = getFramework(p.framework);
            const fwName = fw ? fw.name : p.framework;
            return `    • [${fwName}] ${p.meaning} (Source: ${p.source})`;
          });
          return `Symbol "${symbol.label}":\n${lines.join("\n")}`;
        })
        .join("\n\n");
    } else {
      groundingText =
        "No specific catalogued symbol was detected. General frameworks:\n" +
        frameworkSummaries();
    }

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

    const groqResponse = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Here is my dream journal (most recent first):\n${journalText}`,
          },
        ],
      }),
    });

    if (!groqResponse.ok) {
      const detail = await groqResponse.text();
      console.error("Groq error:", detail);
      return NextResponse.json(
        { error: "The interpreter is busy right now. Please try again." },
        { status: 502 }
      );
    }

    const data = await groqResponse.json();
    const reading: string =
      data.choices?.[0]?.message?.content ?? "No reflection was generated.";

    return NextResponse.json({
      reading,
      matchedSymbols: matched.map((s) => s.label),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong reading the journal." },
      { status: 500 }
    );
  }
}
