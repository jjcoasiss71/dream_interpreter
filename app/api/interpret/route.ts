// app/api/interpret/route.ts
// ---------------------------------------------------------------------------
// The SERVER endpoint. It matches symbols, gathers their sourced per-framework
// perspectives, and asks Groq for an interpretation written as ONE SECTION PER
// FRAMEWORK plus an overall summary — so the UI can show each concept (Freud,
// Jung, …) with its own portrait. The Groq key is read here only.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import {
  matchSymbols,
  getFramework,
  frameworkSummaries,
} from "@/lib/knowledge";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// The client may send a small summary of the dreamer's on-device history so
// the interpretation can notice recurring patterns. It is never stored here.
type ClientHistory = {
  recurringSymbols?: { label: string; count: number }[];
  recentDreams?: { dreamText: string; createdAt: number }[];
};

function buildHistoryText(history: unknown): string {
  if (!history || typeof history !== "object") return "";
  const h = history as ClientHistory;
  const parts: string[] = [];

  if (Array.isArray(h.recurringSymbols) && h.recurringSymbols.length > 0) {
    const top = h.recurringSymbols
      .filter((s) => s && typeof s.label === "string")
      .slice(0, 8)
      .map((s) => `${s.label} (${s.count}×)`)
      .join(", ");
    if (top) parts.push(`Symbols that recur across their past dreams: ${top}.`);
  }

  if (Array.isArray(h.recentDreams) && h.recentDreams.length > 0) {
    const recent = h.recentDreams
      .filter((d) => d && typeof d.dreamText === "string")
      .slice(0, 3)
      .map((d, i) => `  ${i + 1}. ${d.dreamText.slice(0, 320)}`)
      .join("\n");
    if (recent) parts.push(`A few of their recent dreams:\n${recent}`);
  }

  return parts.join("\n\n");
}

/** Parse a response of "[label]\n text..." blocks into a map. */
function parseLabeled(raw: string): Map<string, string> {
  const map = new Map<string, string>();
  let current: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (current) map.set(current, buf.join("\n").trim());
    buf = [];
  };
  for (const line of raw.split("\n")) {
    const label = /^\s*\[([a-z][a-z0-9-]*)\]\s*$/.exec(line);
    if (label) {
      flush();
      current = label[1].toLowerCase();
    } else {
      buf.push(line);
    }
  }
  flush();
  return map;
}

export async function POST(request: Request) {
  try {
    const { dream, history } = await request.json();

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

    // Match symbols, then group their perspectives BY framework.
    const matched = matchSymbols(dream);
    const byFramework = new Map<string, { name: string; lines: string[] }>();
    for (const symbol of matched) {
      for (const p of symbol.perspectives) {
        const fw = getFramework(p.framework);
        const name = fw ? fw.name : p.framework;
        if (!byFramework.has(p.framework)) {
          byFramework.set(p.framework, { name, lines: [] });
        }
        byFramework
          .get(p.framework)!
          .lines.push(`    • "${symbol.label}": ${p.meaning} (Source: ${p.source})`);
      }
    }
    const frameworkIds = [...byFramework.keys()];

    const groundingText =
      frameworkIds.length > 0
        ? frameworkIds
            .map((id) => {
              const f = byFramework.get(id)!;
              return `[${id}] ${f.name}\n${f.lines.join("\n")}`;
            })
            .join("\n\n")
        : "No specific catalogued symbol was detected. General frameworks:\n" +
          frameworkSummaries();

    const labelLines =
      frameworkIds.length > 0
        ? `${frameworkIds.map((id) => `[${id}]`).join("\n")}\n[summary]`
        : "[summary]";

    const historyText = buildHistoryText(history);

    const systemPrompt = `You are a careful, empathetic dream-interpretation assistant.
Rules:
- Explain the dream ONLY using the provided sourced perspectives below; never invent meanings.
- Write ONE section per framework, then a final [summary] section.
- In each framework's section: attribute ideas to that framework ("In Jungian theory…"), use ONLY that framework's perspectives, 2–4 sentences.
- Never claim certainty; dream interpretation is subjective.
- If the dreamer's history shows a genuinely recurring theme, you may gently note it (best in the summary) — never force a connection.
- The [summary] ties the frameworks together in a few warm sentences and ends with ONE gentle, reflective question.
${
  historyText
    ? `\nThe dreamer's private dream history (use only to notice real recurring themes):\n${historyText}\n`
    : ""
}
Output format — put each label ALONE on its own line, then its text below it. Use exactly these labels in this order, and no other bracketed labels:
${labelLines}

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
    const raw: string = data.choices?.[0]?.message?.content ?? "";
    const parsed = parseLabeled(raw);

    const sections = frameworkIds
      .map((id) => ({
        framework: id,
        name: byFramework.get(id)!.name,
        text: parsed.get(id) ?? "",
      }))
      .filter((s) => s.text.length > 0);

    let summary = parsed.get("summary") ?? "";
    // If the model ignored the format entirely, fall back to the raw text.
    if (sections.length === 0 && !summary) {
      summary = raw.trim() || "No interpretation was generated.";
    }

    // A flat string for the on-device journal (and any text-only use).
    const interpretation = [
      ...sections.map((s) => `${s.name}\n${s.text}`),
      summary ? `In sum\n${summary}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    return NextResponse.json({
      sections,
      summary,
      interpretation,
      matchedSymbols: matched.map((s) => s.label),
      frameworksUsed: sections.map((s) => s.name),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong interpreting your dream." },
      { status: 500 }
    );
  }
}
