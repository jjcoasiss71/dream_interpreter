# 🌙 Dream Interpreter

An atmospheric web app where you sit at a candlelit desk and write a dream by quill‑light. Seal it, and the words glow and burn away as a grounded, **sourced** interpretation takes their place — drawn from real dream‑psychology frameworks, never invented.

**Live:** [https://dream-interpreter-coral.vercel.app](https://dream-interpreter-coral.vercel.app)

![Dream Interpreter — the opening candlelit desk](public/preview.jpg)

## The experience

- **You open on a desk at night** — an old wooden desk, books, a quill and inkwell, a lit candle, lit only by candlelight.
- **Lean in** to a sheet of aged parchment and **write your dream** with a quill cursor.
- **Seal it.** The written words glow as golden outlines of light, dissolve, and the interpretation unrolls in their place on the same sheet.
- **Two hours of the same night** — a subtle settings toggle shifts between **Nightfall** (candlelit) and **Daybreak** (morning fog).
- **Enter the dream again** — a calm, hypnotic drift (the dream symbols rise from the page as you fall under) into a dream space *(in progress)*.

## How the interpretation works

1. **You describe a dream** on the parchment.
2. **Symbol matching** finds relevant dream symbols (water, being chased, teeth falling out, etc.) in your text.
3. **Knowledge‑base retrieval** gathers sourced perspectives from established psychological frameworks (Jungian, Continuity Hypothesis, Threat‑Simulation Theory, sleep science, etc.).
4. **Groq LLM** phrases those perspectives into a personal, readable interpretation — **grounded only in what's in the knowledge base**, never inventing meanings.
5. **You get a reflection** with attributed frameworks, the matched symbols, and a gentle question to sit with.

## Why this approach?

Dream interpretation is **not settled science** — there's no authoritative "water = X" lookup table. Instead, this app presents **credible, sourced perspectives** from real psychological theories, each attributed to its framework. The interpretation is honest: *"In Jungian theory, water often represents…"* — not *"Your dream means…"*

## Tech stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript (strict)
- **Styling:** a hand‑written CSS design system — every adaptive value is a CSS custom property driven by a `[data-mode]` attribute (Nightfall / Daybreak); no utility framework, just a vendored base reset
- **Type:** Cormorant Garamond + EB Garamond, with IM Fell English SC (an 1800s revival) for the title
- **LLM:** Groq (free tier, easily upgradeable to a premium LLM); the key stays server‑side
- **Validation:** zod — one shared API contract typed end to end (`src/types/api.ts`)
- **Knowledge base:** local JSON (`src/data/frameworks.json`, `src/data/symbols.json`)
- **Quality:** Vitest unit tests + Prettier + ESLint + typecheck, enforced by GitHub Actions CI
- **Assets:** a composed scene photo plus separate desk / candle / paper layers, a film‑grain SVG, and a quill cursor — all in `public/`
- **Hosting:** Vercel (auto‑deploys from GitHub)

## Project structure

```
dream_interpreter/
├── src/
│   ├── app/
│   │   ├── page.tsx             # The orchestrator: phase machine + camera,
│   │   │                        #   composes the scene from components
│   │   ├── layout.tsx           # Fonts + root layout (data-mode on <body>)
│   │   └── api/
│   │       ├── interpret/route.ts   # Reading for one dream (zod-validated)
│   │       └── journal/route.ts     # One reflection across the whole journal
│   ├── components/              # AppHeader, SettingsPanel, Candle,
│   │                            #   ResultFace, JournalModal, DreamOverlays
│   ├── hooks/                   # useJournal, useTimers, usePaperHeightAnimation
│   ├── lib/
│   │   ├── knowledge.ts         # Symbol matching + knowledge-base retrieval
│   │   ├── grounding.ts         # Sourced-perspective prompt grounding
│   │   ├── llm.ts               # The one LLM client (Groq, server-only)
│   │   ├── journal.ts           # On-device journal (versioned localStorage)
│   │   └── env.ts               # Validated env access
│   ├── styles/                  # The design system, split by concern —
│   │                            #   tokens, scene, letter, journal, dream…
│   ├── types/                   # api.ts (shared contract) + dream.ts
│   └── data/
│       ├── frameworks.json      # Dream-psychology theories, with sources
│       └── symbols.json         # Dream symbols, each per-framework annotated
├── docs/                        # Project plan + immersive UI roadmap
├── .github/workflows/ci.yml    # Lint, typecheck, test, build on every push
└── public/
    ├── scene.jpg                # Composed candlelit desk (opening backdrop)
    ├── desk.jpg, paper.jpg, candle.png   # Scene layers
    └── quill-cursor.svg, noise.svg       # Quill cursor + film grain
```

## Local development

### Prerequisites
- Node.js 20+
- A free Groq API key from [https://console.groq.com/keys](https://console.groq.com/keys)

### Setup

1. Clone the repo
   ```bash
   git clone https://github.com/jjcoasiss71/dream_interpreter.git
   cd dream_interpreter
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create `.env.local` and paste your key
   ```bash
   echo 'GROQ_API_KEY=your_actual_key_here' > .env.local
   ```
   *(This file is git‑ignored — your key never leaves your computer.)*

4. Start the dev server
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Grow the knowledge base

The knowledge base lives in **src/data/** as JSON. Add symbols or frameworks anytime — the app picks them up automatically, no code changes needed.

### Add a new symbol

Edit `src/data/symbols.json` and add an entry with `id`, `label`, `aliases`, and `perspectives`:

```json
{
  "id": "drowning",
  "label": "Drowning",
  "aliases": ["drowning", "suffocating", "underwater"],
  "perspectives": [
    {
      "framework": "continuity-hypothesis",
      "meaning": "May reflect waking feelings of being overwhelmed.",
      "source": "Domhoff, G. W. (2003). The Scientific Study of Dreams."
    }
  ]
}
```

Commit and push — Vercel auto‑deploys within seconds.

## Deployment

Deployed on **Vercel** — auto‑syncs with GitHub. Every push to `main` rebuilds and deploys. Set `GROQ_API_KEY` in the Vercel project settings (Settings → Environment Variables, for Production and Preview).

## Honesty & responsibility

This app is for **reflection, not diagnosis.** Dream interpretation is subjective. Every idea is attributed to its source framework. No medical or psychological claims.

## License

MIT

---

See the [project plan](./docs/project-plan.md) and the [immersive UI roadmap](./docs/immersive-ui-roadmap.md) for fuller context.
