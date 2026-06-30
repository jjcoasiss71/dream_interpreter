# Dream Interpreter — Session Log

A chronological record of the design/build conversation that turned the plain
dream‑interpreter app into the immersive candlelit experience. Reconstructed
from the working session — it's a faithful development log of each request and
what was done, not a verbatim transcript.

---

## 1. Dual‑mode adaptive redesign (Nightfall / Daybreak)
**Ask:** Redesign the app as a drowsy, intimate, candlelit interface that switches
between **Nightfall** (midnight séance) and **Daybreak** (morning fog) via a
`[data-mode]` attribute on `<body>`, with every adaptive value driven by CSS
custom properties — no hardcoded colors in component styles. Serif type only,
generous spacing, candle flame (Nightfall) ↔ smoke wisp (Daybreak), staggered
result reveal, wax‑seal submit button, etc.

**Done:**
- Read the bundled Next.js docs first (per `AGENTS.md`) — confirmed the font API
  was standard.
- `layout.tsx`: Cormorant Garamond (headings) + EB Garamond (body); default
  `data-mode="nightfall"`.
- `globals.css`: token blocks per mode, fixed ambient glow layers, candle flicker,
  smoke wisp, pill toggle, parchment textarea, "Seal & Reveal" button, custom
  scrollbar, page‑load fade, `prefers-reduced-motion` support.
- One deliberate deviation: Daybreak `--text-secondary` lifted to `#9c8a72` to
  pass WCAG AA against `--card-bg` (the spec's `#8c7a65` failed at ~4.0:1).

## 2. "Run it so I can see"
Started the dev server.

## 3. "The design is completely broken — everything white"
**Diagnosis:** the dev server was serving a **stale CSS chunk** (old Tailwind
utilities) while the HTML had updated. **Fix:** killed the dev server, cleared
`.next`, restarted clean. (This stale‑CSS pattern recurred throughout the session;
a clean restart always fixed it, and production builds were never affected.)

## 4. Push to GitHub — "no Claude mention, all by me"
Committed and pushed to `main`. First attempt was rejected for including a
`Co-Authored-By: Claude` trailer; recommitted with **no Claude attribution**.

## 5. "Is Claude mentioned anywhere in the project?"
Searched all files + git history. Found: a product reference in `README.md`, four
references in the Project Plan, and a `Co-Authored-By: Claude` trailer in the
initial commit's message.

## 6. "Remove Claude mentions"
- Replaced the product references in the docs with neutral phrasing.
- Rewrote git history with `filter-branch` to strip the co‑author trailer and the
  doc mentions across all commits; force‑pushed. Verified every commit was
  authored/committed solely by the user.

## 7. Prompt for the letter‑writing addition
**Ask:** Help write a prompt for a feature where you write the dream like a 1800s
letter — fountain‑pen cursor, on submit the pen "writes" the text, the letter
folds and is sealed/sent. **Done:** wrote a detailed design brief in the project's
voice, grounded in the real classes/tokens.

## 8. Add the desk + candle to the prompt
Extended the brief: an old wooden desk seen first‑person, a candle centered above
the letter as the actual light source, with Daybreak handing lighting to a window.

## 9. Roadmap doc — "break it into steps, dream world later"
**Ask:** Also a future "enter the dream / fake‑reality" feature with a faint
transition (head tilts back, vision fades, dream world appears); make a markdown
file breaking everything into steps. **Done:** created
`Dream Interpreter — Immersive UI Roadmap.md` — Steps 1–6 (desk, candle, letter,
pen, send cinematic, faint→dream world), each independently shippable.

## 10. "Build up to the faint transition"
Implemented Steps 1–6c: the wooden desk scene, candle relit as the light source,
parchment letter, fountain‑pen cursor (`pen-cursor.svg`), the seal‑&‑send cinematic
(write → fold → wax‑seal → fly), and the faint into a placeholder dream world.

## 11. "First, the letter should be paper — do I need 3D?"
**Answer:** No 3D needed — a still candlelit scene is the easy case for flat CSS.
Asked two questions → chose **light aged parchment + dark ink** and **pure CSS
texture**. Repainted: visible parchment letter, perceptible dark wood desk, tighter
candle light pool. (The earlier palette was too dark to see anything.)

## 12. Real wood background + bigger, realistic candle
Provided a wood photo → wired `public/desk.jpg`, darkened to a candle‑lit room with
a center light pool. Rebuilt the candle from a single flame into a realistic one
(wax body, layered flame with bright core + blue base, halo).

## 13. "It's a top‑down POV — the candle should be too"
Rebuilt the candle as **seen from above** (concentric wax rim → molten well →
flame blooming toward the viewer), and switched the smoke to a top‑down puff.

## 14. Candle refinements
**Ask:** smaller candle, flame too big vs the wax, shorter+wider wax, a finger‑loop
handle, **dark used‑bronze** metal. Also clarified the view is *slightly tilted*,
and wanted **an antique pre‑electricity candle**. **Done:** rebuilt as an **antique
brass chamberstick** (dish + finger‑loop handle + ivory taper + teardrop flame),
upright with an elliptical base for the tilted view.

## 15. Move the candle + letter up
Tightened the top spacing so the Seal & Reveal button shows without scrolling.

## 16. Delete `CLAUDE.md` / `AGENTS.md`
Confirmed they're only AI‑assistant guidance (not used by the app) and deleted both.

## 17. Zoom out the views + center the title; make it a real title
- Zoomed the camera views out and centered "Dream Interpreter."
- "Title didn't change" → it was the stale dev CSS again → clean restart fixed it.
- Made it bigger / more title‑like, then per request, an **1800s vintage type**:
  added **IM Fell English SC** (a small‑caps revival of the historic Fell types).

## 18. Paper photo + lighting
- "Make the letter match the background light" → gave the parchment a warm
  directional candle cast, edge falloff, and a flame‑synced breathing layer.
- Switched the paper to a real texture: provided `paper.png` → converted to
  `paper.jpg`, wired via a `data-paper="photo"` swap (CSS candlelight stays on top).

## 19. The composed scene photo (`scene.jpg`)
**Ask:** a single composed desk+paper+candle image — where to put it? **Decided:**
use it as the immersive **DESK_VIEW backdrop** (not a replacement for the live
layers, which would lose animation/typing/page‑turn). Built:
- A header layer (title + settings), a **camera zoom system** (`desk` / `paper` /
  `writing`) with parallax, and the candle **grounded behind the paper**.
- The scene photo as the opening backdrop with a live flame glow; clicking
  ("write") crossfades + zooms into the live writable scene.

## 20. Background fitting iterations
- Interpretation text was white on parchment → switched to **ink** color.
- Background fit: `cover` → `contain` (black gap) → blurred fill → finally **full
  `cover`** per request ("fill the background, never show bars").
- Removed the floating candle glow overlay.
- **Scroll bug:** had to scroll to see the "write" button → caused by `perspective`
  on `.viewport` sizing the fixed backdrop to the whole document; removed it
  (the old 3D effects that needed it were gone).

## 21. Memory feature — "remember the user and their past dreams"
**Branch discussion:** yes, worked on `feat/dream-memory` (keeps `main`'s live
deploy safe; Vercel gives a branch preview). Considered Supabase (explained it),
then chose **on‑device localStorage** for privacy. Built:
- `lib/journal.ts` — journal in localStorage; history context (recent dreams +
  recurring symbols) sent to deepen later interpretations; nothing stored on a server.
- A **dream journal view** with **Full / Compact** toggle (persisted).
- An **"ultimate interpretation"** across the whole journal via a new `/api/journal`
  route.
- Memory was **opt‑in (off)**, then per request switched to **on by default**
  (off only if explicitly turned off).
- Merged to `main`; later scrubbed an older commit message that referenced the
  deleted `CLAUDE.md`/`AGENTS.md` filenames (history rewrite + force‑push).

## 22. Header cleanup
Removed the top‑right write/sit‑back button; made the **title clickable = sit back**;
made **Journal** an explicit header button; **removed the Nightfall/Daybreak toggle**
(keeping all Daybreak code for later).

## 23. Sizing + smooth resize
- Journal cards use `paper.jpg` and auto‑size to content (fixed a flex clip).
- Scaled the paper, text, and the Seal & Reveal / Journal / settings controls up
  (1.3×), then made the paper **~1.5× wider** (the shell column had been clamping it)
  and raised/shortened it so the button fits.
- **Animated the paper's height** so it smoothly extends/shrinks as content changes
  (write → glow → reveal) instead of jumping.

## 24. "Are interpretations split by Freud / Jung / Threat‑Sim?"
**Answer:** Not exactly — there are 6 frameworks defined; the **Continuity
Hypothesis** is actually most common and **Freud is minor**; **Hall & Van de Castle**
is unused. The frameworks shown depend on which symbols the dream matched.

## 25. Interpretation split into concept sections with portraits
**Ask:** Separate the reading by concept — a half‑transparent portrait of the
theorist on one side (alternating sides), text on the other; images clarify as you
scroll them to center and fade away; only include the relevant frameworks + an
overall summary; make the result paper ~1.5× wider. Provided `freudian.png`,
`jungian.png`, `threat-simulation.png`. **Done:**
- `/api/interpret` now returns **per‑framework sections + a summary** (plus a flat
  string for the journal).
- A `FrameworkSection` component renders alternating image/text rows; **scroll‑driven
  opacity** clarifies the image near screen‑center.
- Wider result paper; the writing paper unchanged; height still animates.

## 26. Portraits — make them actually appear, big, and on the same paper
**Ask:** Make the result paper and fonts bigger; zoom the portraits in so one fills
about **half the screen vertically**, stuck to the side; the PNGs (no background)
must be **part of the same letter** — on one side with text on the other (e.g. Freud
on the right, text on the left), **not** on a separate parchment patch. Then:
"the letter should almost **cover the screen horizontally**, and I don't see any
images — it just says `#concept`."

**Diagnosis:** the API was returning sections correctly. The images were invisible
because `mix-blend-mode: multiply` couldn't reach the paper background through the
scene's stacking context, and the Freud/Jung PNGs were actually **RGB with solid
white backgrounds** (no alpha at all).

**Done:**
- **Baked transparency into the PNGs** with `sharp` — mapped brightness → alpha
  (`alpha = 255 · ((255 − gray)/255)^0.72`) and set RGB to grayscale, so each
  portrait reads as a half‑transparent engraving directly on the parchment.
  Removed `mix-blend-mode` entirely. Originals backed up to `.portrait-originals/`
  (gitignored).
- Result paper widened to nearly full‑screen (`width: min(98%, 1900px)`,
  `--shell-width: 2000px`) and the result camera zoom opened up (`scale(0.98)`).
- Portraits enlarged to `height: 48vh` and **flush to the paper edge** (alternating
  left/right), with the text column beside them — all on the one result sheet.
- Bigger result type (`.concept-text` ~1.8rem).

## 27. Branch for the interpretation update
**Ask:** Push this work to a new branch named "interpretation update" — and confirm a
branch won't touch `main` or the live Vercel app.
**Done:** committed the per‑framework sections + transparent portraits to
**`interpretation-update`** (git can't use spaces, so a hyphen) and pushed it.
**Confirmed:** `main` is untouched; production deploys only from `main`; the branch
gets its own Vercel **preview** URL. Note: branch‑only commits don't show on the
GitHub contribution graph until the branch is **merged into `main`**. `main` was
then checked back out clean to plan the next result‑layout pass.

## Recurring threads
- **No Claude attribution, ever** — every commit authored/committed solely by the
  user; mentions scrubbed from history when found.
- **Stale dev CSS** — the Turbopack dev server intermittently served cached
  stylesheets; a clean restart (`rm -rf .next` + restart) reliably fixed it, and
  production builds were always correct.
- **Privacy** — the dream journal lives only in the browser; nothing is stored on
  a server or in any account.

## Assets added (`public/`)
`desk.jpg`, `scene.jpg`, `paper.jpg`, `candle.png`, `noise.svg`, `quill-cursor.svg`,
`preview.jpg` (README hero), and the concept portraits `freudian.png`,
`jungian.png`, `threat-simulation.png`.

## Still open / parked
- The **dream world** (Step 6d) is a placeholder the faint lands in.
- An **app name** with an 1800s‑psychology / hypnosis vibe (candidates: *Somnium*,
  *The Mesmerist*, *Oneiron*, *The Limen*, *Hypnagogia*) — to be chosen later.
- A **new result‑paper layout** is the next task (planned from a clean `main`); the
  per‑framework + transparent‑portrait version is parked on the `interpretation-update`
  branch to revisit or merge.
- Transparency‑processed `continuity-hypothesis.png` and `sleep-science.png` (those
  sections are still text‑only).
