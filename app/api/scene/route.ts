// app/api/scene/route.ts
// ---------------------------------------------------------------------------
// Classifies a dream into the world to render: setting / weather / time / mood.
// The LLM reads the dream and returns strict JSON from a CLOSED set of options;
// anything missing or invalid falls back to the on-device keyword heuristic, so
// this endpoint always returns a usable classification (and works without a key).
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import {
  classifyDream,
  coerceSceneClass,
  SETTINGS,
  WEATHERS,
  TIMES,
  MOODS,
  ELEMENTS,
  ACCENTS,
  SCALES,
} from "@/lib/dreamScene";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export async function POST(request: Request) {
  try {
    const { dream } = await request.json();
    if (!dream || typeof dream !== "string" || dream.trim().length < 3) {
      return NextResponse.json(
        { error: "Please describe your dream in a little more detail." },
        { status: 400 }
      );
    }

    const heuristic = classifyDream(dream);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      // No key — the heuristic alone is a perfectly good classification.
      return NextResponse.json(heuristic);
    }

    const systemPrompt = `You translate a described dream into a 3D world to render. Your FIRST priority is to match what the dreamer actually describes. Reply with ONLY a JSON object, no prose, with exactly these keys and values chosen from these closed sets:
{
  "setting": ${JSON.stringify(SETTINGS)},   // the dominant place of the dream
  "weather": ${JSON.stringify(WEATHERS)},   // "clear" if none implied
  "timeOfDay": ${JSON.stringify(TIMES)},     // default "day" if the dream doesn't imply night/dusk
  "mood": ${JSON.stringify(MOODS)},          // emotional tenor
  "elements": ${JSON.stringify(ELEMENTS)},  // ARRAY: every notable thing the dream mentions that appears in this list
  "accent": ${JSON.stringify(ACCENTS)},     // the dominant colour the dream evokes
  "scale": ${JSON.stringify(SCALES)}         // how big/open the space feels
}
Rules:
- Pick the ONE setting that best matches where most of the dream takes place. Use "room" for any indoor place, "field" for open natural land, "void" only if there is no discernible place.
- For "elements", include EVERY item from the list that the dream actually mentions or strongly implies (e.g. a river -> "water", a burning car -> "fire", a person following -> "figures", a staircase -> "stairs"). Include 0 to 6. Do NOT invent things the dream doesn't suggest.
- Choose all values ONLY from the sets above. Output nothing but the JSON.`;

    const groqResponse = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Dream: ${dream}` },
        ],
      }),
    });

    if (!groqResponse.ok) {
      // Fall back rather than fail the dream.
      return NextResponse.json(heuristic);
    }

    const data = await groqResponse.json();
    const raw: string = data.choices?.[0]?.message?.content ?? "";
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }

    // Validate against the closed sets; fall back per-field to the heuristic.
    return NextResponse.json(coerceSceneClass(parsed, heuristic));
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong shaping the dream." },
      { status: 500 }
    );
  }
}
