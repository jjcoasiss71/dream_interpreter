// app/api/interpret/route.ts
// ---------------------------------------------------------------------------
// This is the SERVER endpoint. The browser sends a dream here; this code:
//   1. matches symbols from the knowledge base
//   2. gathers their sourced perspectives
//   3. asks Groq's LLM to phrase a grounded interpretation
//   4. sends the result back
//
// The Groq API key is read here on the server (process.env.GROQ_API_KEY) and
// is NEVER sent to the browser, so users can't see or steal it.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import {
  matchSymbols,
  getFramework,
  frameworkSummaries,
} from "@/lib/knowledge";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile"; // a free, capable Groq model

export async function POST(request: Request) {
  try {
    const { dream } = await request.json();

    // Basic validation
    if (!dream || typeof dream !== "string" || dream.trim().length < 3) {
      return NextResponse.json(
        { error: "Please describe your dream in a little more detail." },
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

    // 1 + 2. Retrieve matching symbols and build grounded reference text.
    const matched = matchSymbols(dream);

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
      // No specific symbol matched — give the LLM the general frameworks so it
      // can still respond sensibly instead of inventing meanings.
      groundingText =
        "No specific catalogued symbol was detected. General frameworks:\n" +
        frameworkSummaries();
    }

    // 3. Ask Groq to phrase the interpretation, constrained to our sources.
    const systemPrompt = `You are a careful, empathetic dream-interpretation assistant.
Rules:
- Explain the dream ONLY using the provided sourced perspectives below.
- Do NOT invent symbol meanings or cite anything not provided.
- Attribute ideas to their framework (e.g. "In Jungian theory...").
- Never claim certainty; dream interpretation is subjective.
- Be warm and concise. End with one gentle, reflective question.

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
          { role: "user", content: `My dream: ${dream}` },
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
    const interpretation: string =
      data.choices?.[0]?.message?.content ?? "No interpretation was generated.";

    // 4. Send back the interpretation plus which symbols/frameworks were used.
    const frameworksUsed = Array.from(
      new Set(matched.flatMap((s) => s.perspectives.map((p) => p.framework)))
    )
      .map((id) => getFramework(id)?.name)
      .filter(Boolean);

    return NextResponse.json({
      interpretation,
      matchedSymbols: matched.map((s) => s.label),
      frameworksUsed,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong interpreting your dream." },
      { status: 500 }
    );
  }
}
