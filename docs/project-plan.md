---
title: Dream Interpreter — Project Plan
type: project-plan
status: planning
created: 2026-06-21
tags:
  - project/dream-interpreter
  - webapp
  - planning
---

# 🌙 Dream Interpreter — Project Plan

> A web app where a user describes a dream and gets a thoughtful, **source-grounded**
> interpretation drawn from real psychological theory — not made-up symbol lookups.
>
> **MVP scope:** stateless, free to run, single deploy.

---

## 1. Vision & Goals

- **One-line pitch:** Describe your dream → get an interpretation grounded in established
  dream-psychology frameworks, with sources.
- **Who it's for:** Curious people who want a *credible* take, not horoscope fluff.
- **Core principle:** Honest, sourced, private, and free to operate.

### Success criteria (MVP)
- [ ] User submits a dream and gets a grounded interpretation in < 10s
- [ ] Every interpretation traces back to entries in **our knowledge base** (with sources)
- [ ] Runs at **~$0/month** (free LLM tier)
- [ ] No login; nothing stored server-side
- [ ] Mobile-friendly, calm UI
- [ ] Deployed to a public URL

### Explicit non-goals (MVP)
- ❌ Accounts / auth
- ❌ Server-side history database
- ❌ Payments / native app
- ❌ Claims of scientific certainty (see [[#Honesty principle]])

---

## 2. Honesty principle (important)

> [!warning] Dream interpretation is **not** settled science.
> There is no verified table where "water = anxiety." What *is* credible and citable is the
> **psychological theory and research**. So the app presents **sourced perspectives**, framed
> as *"In Jungian theory, water often represents…"* — never as absolute fact.

This is the difference between a credible app and pseudoscience. The knowledge base stores
**theory + citation**, and the app always attributes the framework it's reasoning from.

---

## 3. Key Decisions (locked)

| Decision | Choice | Notes |
|---|---|---|
| Interpretation method | **Knowledge base + retrieval + LLM phrasing** | a.k.a. RAG |
| Output style | **LLM-phrased, grounded** | Free LLM weaves matched KB entries into prose |
| KB depth (v1) | **Theory-first** | Deep writeups of major frameworks > huge symbol list |
| Persistence | **Stateless** | Optional `localStorage` history later |
| Stack | **Next.js + TypeScript** | Single deploy, API route hides key |
| Hosting | **Vercel free tier** | |
| Cost target | **$0/month** | Free LLM tier (Groq / Gemini) |

---

## 4. The Knowledge Base (the heart of the app)

Instead of a live API, we **build and bundle our own curated, sourced dataset**. The app
searches it locally, then a free LLM explains the matches in plain language.

### 4a. Theory-first structure
v1 prioritizes **deep writeups of the major frameworks** the app reasons from, over a giant
symbol list. Core frameworks to capture:

- **Carl Jung** — archetypes, collective unconscious, symbols as compensatory
- **Sigmund Freud** — wish fulfillment, manifest vs. latent content
- **Hall & Van de Castle** — empirical content analysis of dreams
- **G. William Domhoff** — continuity hypothesis (dreams reflect waking concerns)
- **Threat-simulation theory** (Revonsuo) — evolutionary view
- **Modern sleep science** — REM, memory consolidation, emotional processing

Each framework entry = what it claims, how it reads dreams, strengths/criticisms, **sources**.

### 4b. Symbol/theme entries (smaller in v1)
A modest set of recurring symbols/themes (falling, chase, teeth, water, flying, death,
nudity…), each annotated **per framework** + citation. Grows over time.

### 4c. Entry format (sketch)
```json
{
  "id": "water",
  "label": "Water",
  "aliases": ["ocean", "flood", "drowning", "river", "rain"],
  "perspectives": [
    {
      "framework": "Jungian",
      "meaning": "Often symbolizes the unconscious; state of the water mirrors emotional state.",
      "source": "Jung, Man and His Symbols (1964)"
    },
    {
      "framework": "Continuity hypothesis",
      "meaning": "May reflect waking emotional concerns rather than fixed symbolism.",
      "source": "Domhoff, The Scientific Study of Dreams (2003)"
    }
  ]
}
```

### 4d. How we build it
- [ ] **Research** reputable sources (academic texts, peer-reviewed summaries, established theorists)
- [ ] Structure each into the entry format with **citations**
- [ ] Store as JSON (or markdown) bundled in the app — no live dependency
- [ ] Verify sources are quotable / public-domain or properly attributed

> 🛠️ *An LLM can do this research + structuring pass to seed the dataset.*

---

## 5. Interpretation Engine (the flow)

```
[ Browser ] -- dream text --> [ /api/interpret ]
                                   |
   1. RETRIEVE: find relevant KB entries
      - keyword/alias match (MVP)
      - (later) semantic search / embeddings: "I was drowning" -> water/anxiety
                                   |
   2. ASSEMBLE: gather matched perspectives + sources
                                   |
   3. PHRASE: free LLM writes a grounded interpretation
      USING ONLY the retrieved entries (no inventing)
                                   |
   <-- interpretation + cited frameworks -->
```

### Retrieval levels
- **v1 — keyword/alias match:** scan dream text for known symbols/aliases. Simple, free, fast.
- **v2 — semantic search (embeddings):** catches meaning even without exact words. Still free-capable.

### Free LLM options (for phrasing)
| Provider | Free? | Notes |
|---|---|---|
| **Groq** | Free | Very fast, Llama models — good default |
| **Google Gemini** | Free tier | Generous, good quality |
| **Ollama (local)** | 100% free | Private/offline; needs a machine (not Vercel) |
| **Premium LLM API** | Paid | Highest quality — *upgrade path* |

### Prompt (sketch)
```
System: You are a careful dream-interpretation assistant. You explain dreams ONLY using the
provided sourced perspectives. Attribute each idea to its framework. Never claim certainty.
Note that interpretation is subjective. End with a gentle reflective question.

Retrieved perspectives:
{matched_entries_with_frameworks_and_sources}

User dream: {dream_text}
```

---

## 6. Tech Stack

```
Frontend + Backend:  Next.js (App Router) + TypeScript
Styling:             Tailwind CSS
Retrieval:           Local KB (JSON) + matcher; embeddings later
LLM call:            Server-side /api/interpret (key in env var)
Hosting:             Vercel (free tier)
```

- **Why Next.js:** front + tiny backend in one repo, one deploy; API route keeps the LLM key off the client.
- **Alternatives:** Vite+React with FastAPI/Express backend; SvelteKit; Astro.

---

## 7. Core Features

### MVP (v1)
- [ ] Dream input + "Interpret" button
- [ ] KB retrieval (keyword/alias matching)
- [ ] LLM-phrased grounded interpretation
- [ ] Show which **frameworks/sources** the answer drew on
- [ ] Loading + error/rate-limit states
- [ ] Responsive, calm night theme

### Nice-to-have (v2+)
- [ ] Semantic/embeddings retrieval
- [ ] `localStorage` dream journal (no accounts)
- [ ] Framework toggle (e.g. "show me the Jungian vs. scientific view")
- [ ] Copy / export interpretation as markdown (Obsidian-friendly 😉)
- [ ] Light/dark theme

### Later / maybe
- [ ] Accounts + cloud history
- [ ] Recurring-symbol insights over time
- [ ] Premium LLM API tier

---

## 8. UI / Screens

- **Input** — big textarea, placeholder ("Describe your dream…"), Interpret button.
- **Result** — interpretation prose, "based on" framework chips with sources, "interpret another".
- **(v2) History** — past dreams from `localStorage`.

> [!note] Vibe
> Calm nighttime palette (deep indigo / soft glow), generous spacing, readable serif for the
> interpretation. Feels private and unhurried.

---

## 9. Roadmap / Milestones

### Phase 0 — Setup
- [ ] Init Next.js + TypeScript + Tailwind
- [ ] Pick free LLM provider, get key, confirm server-side call

### Phase 1 — Knowledge base
- [ ] Research + write the **major framework** entries (theory-first)
- [ ] Add initial symbol/theme entries with sources
- [ ] Bundle as JSON + build the matcher

### Phase 2 — Core loop
- [ ] `/api/interpret`: retrieve → assemble → LLM phrase
- [ ] Input → result UI wired up
- [ ] Show frameworks/sources used

### Phase 3 — Polish
- [ ] Loading/error states, night theme, mobile
- [ ] Prompt tuning (tone, attribution, no overclaiming)

### Phase 4 — Ship
- [ ] Deploy to Vercel, test mobile, share 🎉

### Phase 5 — v2 (optional)
- [ ] Embeddings retrieval, localStorage history, framework toggle, export

---

## 10. Risks & Open Questions

- [ ] **Source quality** — keep to reputable, citable material; avoid pop pseudoscience.
- [ ] **Overclaiming** — prompt + UI must frame everything as perspective, not fact.
- [ ] **Free-tier limits** — could a public demo exceed them? (throttle + friendly retry)
- [ ] **LLM straying from sources** — constrain prompt to "use only retrieved entries."
- [ ] **Licensing** — confirm we can quote/attribute each source.
- [ ] **Retrieval gaps** — keyword match misses paraphrases until embeddings land.

---

## 11. Next Action

> Start by **seeding the knowledge base**: research + write the major framework entries
> (Jung, Freud, Hall & Van de Castle, Domhoff, threat-simulation, sleep science) in the
> entry format with sources. The whole app hangs off this data.

- [ ] Decide first LLM provider: **Groq** vs. Gemini
- [ ] Kick off KB research (an LLM can draft the first entries)
- [ ] Then scaffold Next.js and wire the loop

---

## Related Notes
- [[Dream KB — framework entries]] *(to create)*
- [[Dream KB — symbol entries]] *(to create)*
- [[LLM provider comparison]] *(to create)*
- [[Prompt experiments — dream interpreter]] *(to create)*
