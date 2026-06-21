# 🌙 Dream Interpreter

A web app that interprets your dreams using **psychological frameworks** and **AI**. Describe a dream, get a grounded, sourced interpretation that respects the complexity of dream analysis.

**Live:** [https://dream-interpreter-coral.vercel.app](https://dream-interpreter-coral.vercel.app)

## How it works

1. **You describe a dream** in the app.
2. **Symbol matching** finds relevant dream symbols (water, being chased, teeth falling out, etc.) in your text.
3. **Knowledge base retrieval** gathers sourced perspectives from established psychological frameworks (Jungian, Freudian, Continuity Hypothesis, Threat-Simulation Theory, etc.).
4. **Groq LLM** phrases those perspectives into a personalized, readable interpretation — **grounded only in what's in the knowledge base**, never inventing meanings.
5. **You get a reflection** with attributed frameworks, matched symbols, and a gentle question for reflection.

## Why this approach?

Dream interpretation is **not settled science**. There's no authoritative "water = X" lookup table. Instead, this app presents **credible, sourced perspectives** from real psychological theories — each attributed to its framework. The interpretation is honest: *"In Jungian theory, water often represents…"* not *"Your dream means…"*

## Tech stack

- **Frontend & Backend:** Next.js 16 + TypeScript
- **Styling:** Tailwind CSS
- **LLM:** Groq (free tier, easily upgradeable to a premium LLM)
- **Knowledge base:** Local JSON files (`data/frameworks.json`, `data/symbols.json`)
- **Hosting:** Vercel (auto-deploys from GitHub)

## Project structure

```
dream_interpreter/
├── data/
│   ├── frameworks.json      # 6 major dream-psychology theories with sources
│   └── symbols.json         # 10+ dream symbols, each per-framework annotated
├── app/
│   ├── page.tsx            # UI: dream input + results
│   ├── api/interpret/route.ts  # Server: matches symbols, calls Groq
│   └── globals.css         # Tailwind styles
├── lib/
│   └── knowledge.ts        # Symbol matching + KB retrieval logic
└── Dream Interpreter — Project Plan.md  # Full planning (Obsidian-friendly)
```

## Local development

### Prerequisites
- Node.js 18+
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
   *(This file is git-ignored — your key never leaves your computer.)*

4. Start the dev server
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Grow the knowledge base

The knowledge base lives in **data/** as JSON. Add symbols or frameworks anytime — the app picks them up automatically.

### Add a new symbol

Edit `data/symbols.json` and add an entry with `id`, `label`, `aliases`, and `perspectives`:

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

Commit and push — Vercel auto-deploys within seconds.

## Deployment

Deployed on **Vercel** — auto-syncs with GitHub. Every push to `main` rebuilds and deploys.

Set `GROQ_API_KEY` in Vercel project settings (Settings → Environment Variables, Production and Preview).

## Limitations & future

- **Current:** Free Groq tier has rate limits. Upgrade as needed.
- **Future:** localStorage history, framework toggle, semantic search, markdown export.

## Honesty & responsibility

This app is for **reflection, not diagnosis.** Dream interpretation is subjective. Every idea is attributed to its source framework. No medical or psychological claims.

## Contributing

PRs welcome. Keep knowledge-base additions well-sourced.

## License

MIT

---

**Built with:** Next.js, Tailwind, Groq, and honest interpretation.

See the [project plan](./Dream%20Interpreter%20—%20Project%20Plan.md) for full context.
