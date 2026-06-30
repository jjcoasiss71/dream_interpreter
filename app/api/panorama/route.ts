// app/api/panorama/route.ts
// ---------------------------------------------------------------------------
// Generates a set of images for one Dream Walk scene — shown as a crossfading
// slideshow (a little "dream reel" of the moment). Per the project's vendor
// rule we use FLUX — no Chinese-provider models. Providers auto-selected:
//
//   NVIDIA_API_KEY=...     -> NVIDIA API catalog FLUX.1-dev (free credits).
//   TOGETHER_API_KEY=...   -> Together.ai FLUX.1-schnell (free endpoint).
//
// Returns { images: (string|null)[] } of length 4 (index = wall). Any failure
// becomes null for that wall, and the viewer fills it with a dark fallback.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";

const NVIDIA_URL = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev";
const TOGETHER_URL = "https://api.together.ai/v1/images/generations";

// Only the artistic MEDIUM — no mood, colour, or lighting cues here, so the
// dream's own feeling decides those. Stylized art hides "AI" tells far better
// than fake photos. Override via IMAGE_STYLE in .env.local to experiment, e.g.:
//   watercolour: "loose watercolour painting, soft washes, paper texture, ..."
//   etching:     "fine ink etching, engraving, cross-hatching, ..."
//   oil:         "rich oil painting, visible brushwork, impasto, ..."
const STYLE_SUFFIX =
  process.env.IMAGE_STYLE ||
  "an intricate 19th-century steel engraving, fine ink etching with dense " +
    "cross-hatching and stippling, detailed antique book-plate illustration, " +
    "monochrome ink on aged paper, realistic proportions, highly detailed, " +
    "no text, no watermark, not a cartoon, not a photo, not a 3d render";

// One prompt per slide — different shots of the same dream moment (a montage).
// Fewer shots = faster + cheaper per scene.
const SHOTS = [
  "a wide establishing shot",
  "a closer, more intimate view",
];

function buildPrompt(narration: string, dream: string, shot: string): string {
  const scene = narration.replace(/\s+/g, " ").trim().slice(0, 300);
  const ctx = dream
    ? ` (the dreamer's dream: ${dream.replace(/\s+/g, " ").trim().slice(0, 140)})`
    : "";
  // Render the moment faithfully — let the dream dictate the scene and mood,
  // impose nothing of the app's own vibe.
  return `${shot} of this exact dream moment, rendered faithfully, keeping the dream's own setting, time of day, weather, lighting and emotional mood — add no unrelated darkness: ${scene}.${ctx} ${STYLE_SUFFIX}`;
}

// NVIDIA API catalog FLUX.1-dev. Returns base64 -> data URL.
async function viaNvidia(prompt: string): Promise<string | null> {
  const key = process.env.NVIDIA_API_KEY!;
  const res = await fetch(NVIDIA_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      prompt,
      mode: "base",
      cfg_scale: 3.5, // higher = commits to the engraving style
      width: 1024,
      height: 1024,
      steps: 40,
      seed: 0,
      samples: 1,
    }),
  });
  if (!res.ok) {
    console.error("nvidia panorama error:", await res.text());
    return null;
  }
  const data = await res.json();
  const b64: unknown =
    data?.artifacts?.[0]?.base64 ?? data?.image ?? data?.data?.[0]?.b64_json;
  if (typeof b64 !== "string") return null;
  const mime = b64.startsWith("/9j/") ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${b64}`;
}

// Together.ai FLUX.1-schnell (free).
async function viaTogether(prompt: string): Promise<string | null> {
  const key = process.env.TOGETHER_API_KEY!;
  const res = await fetch(TOGETHER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.TOGETHER_IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell-Free",
      prompt,
      width: 1024,
      height: 1024,
      steps: 4,
      n: 1,
    }),
  });
  if (!res.ok) {
    console.error("Together panorama error:", await res.text());
    return null;
  }
  const data = await res.json();
  const url = data?.data?.[0]?.url;
  return typeof url === "string" ? url : null;
}

function generateOne(prompt: string): Promise<string | null> {
  if (process.env.NVIDIA_API_KEY) return viaNvidia(prompt);
  if (process.env.TOGETHER_API_KEY) return viaTogether(prompt);
  return Promise.resolve(null);
}

export async function POST(request: Request) {
  try {
    const { narration, dream } = await request.json();
    if (!narration || typeof narration !== "string") {
      return NextResponse.json({ images: [] });
    }
    const dreamText = typeof dream === "string" ? dream : "";
    // Generate the slides in parallel so the wait stays ~one image long.
    const images = await Promise.all(
      SHOTS.map((shot) => generateOne(buildPrompt(narration, dreamText, shot)))
    );
    return NextResponse.json({ images });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ images: [] });
  }
}
