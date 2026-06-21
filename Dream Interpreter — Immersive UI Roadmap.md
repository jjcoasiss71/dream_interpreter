# Dream Interpreter — Immersive UI Roadmap

A staged plan for turning the current dual-mode interface into a first-person
"writing a letter by candlelight, then falling into the dream" experience.

Each **Step** is independently shippable: after finishing one, the app still
builds and works. Implement them in order — later steps assume earlier ones
exist. Nothing here has to be built at once.

> Concept in one line: you are sitting at an old desk at 2 AM, writing a letter
> about your dream by candlelight. You seal and send it. Later, you tilt back in
> your chair, your eyes fall shut — and you wake inside the dream you described.

---

## Progress

- [ ] **Step 1 — The desk (scene foundation)**
- [ ] **Step 2 — The candle as the light source**
- [ ] **Step 3 — The letter (stationery textarea)**
- [ ] **Step 4 — The fountain-pen cursor**
- [ ] **Step 5 — The send cinematic (write → fold → seal → send)**
- [ ] **Step 6 — Enter the dream + the faint transition** *(future / largest)*

---

## Global conventions (apply to every step)

These are non-negotiable and carry over from the existing design spec. Re-read
before each step.

- **Token-driven.** All adaptive color comes from CSS custom properties defined
  in the `body[data-mode="…"]` blocks in `app/globals.css`. **No raw hex inside
  component styles.** When a step needs new colors, add tokens (named below) to
  *both* mode blocks.
- **Dual-mode.** Everything must read correctly in **Nightfall** (default) and
  **Daybreak**. Same choreography, mode-colored. "Two hours of the same night."
- **No sans-serif. Anywhere. Ever.** Cormorant Garamond (headings) / EB Garamond
  (body) only.
- **`prefers-reduced-motion`.** Every animated step must degrade to a calm
  fade/instant state. The existing `@media (prefers-reduced-motion: reduce)`
  block at the bottom of `globals.css` is where these opt-outs live.
- **Accessibility.** The textarea stays a real, focusable, screen-reader field.
  All scenery, cursors, and cinematics are decorative → `aria-hidden`, must not
  trap focus or block typing/submit.
- **Master constraint.** Before every decision ask: *would this feel right at
  2 AM with a candle, or 7 AM with fog?* If it's too sharp, bright, glossy, or
  modern — pull it back. The desk is worn and quiet; it is not a game asset.

**Current code touchpoints** (so you know where things live):

- `app/page.tsx` — client component. `.accent-stage` (holds `.flame` + `.smoke`
  SVG), `.masthead`, `.toggle-row`, `.composer` (`.dream-input` textarea +
  `.seal-button`), `.notice` (error), `.result-card` (staggered `.reveal-line`).
- `app/globals.css` — token blocks at `body[data-mode="nightfall"]` (line ~39)
  and `body[data-mode="daybreak"]` (line ~57); fixed glow layers
  `.page-glow--night` / `.page-glow--day`; `.flame` flicker; `.smoke` wisp.
- `app/layout.tsx` — fonts + `data-mode="nightfall"` default on `<body>`.

---

## Step 1 — The desk (scene foundation)

**Goal:** Replace the flat `--bg` with a very old wooden desk seen first-person
(above-and-slightly-forward). Empty desk space stays intentional dark space.

**Scope**
- Introduce a `.scene` (or reuse `<body>`/`.shell` wrapper) that paints the desk:
  dark, worn hardwood, long grain running roughly vertical, faint scratches /
  ring stains / wax flecks. Matte, never glossy.
- Build the texture **cheaply**: CSS gradients + one subtle tiled SVG noise or
  repeating-linear-gradient grain. **No heavy raster image** — must not hurt the
  1.5s page-load fade or legibility.
- First-person depth: desk falls into shadow toward the **top** edge (far side)
  and sits warmer/closer toward the **bottom** (your side). A gentle vertical
  gradient is enough; true perspective optional.

**New tokens** (add to both mode blocks)
- `--desk` — base wood tone (Nightfall: warm near-black around `--bg`;
  Daybreak: lighter, greyer, lit by `#2A2420` daylight).
- `--desk-grain` — low-contrast grain/scratch color.

**Dual-mode**
- Nightfall: deep, warm, almost-black wood.
- Daybreak: same desk, lighter and cooler, as if morning light fills the room.

**Acceptance**
- Wood reads at a glance but stays quiet; text legibility unchanged.
- Switching modes recolors the desk via tokens only (no JS color logic).
- Lighthouse/page-load feel unchanged; no large asset added.

**Notes / open decisions**
- Recommended: **fixed desk** (no parallax). The desk holds still; only the
  letter ever moves. Keeps it calm and readable.

---

## Step 2 — The candle as the light source

**Goal:** Stop treating the candle as a top-of-page decoration. Move it to the
**center, just above the letter**, and make it the reason you can see the page.

**Scope**
- Reposition `.flame` (currently in `.accent-stage` at top) to sit centered,
  directly above the `.composer`/letter.
- Make the existing center/bottom `page-glow` read as **candlelight pooling
  down onto the letter**: brightest on the paper under the flame, falling off
  into dark wood at the edges.
- **Link light to flame.** The flame's flicker should make the pool of light
  subtly breathe — letter brightens/dims a hair as the flame moves. Drive the
  glow opacity from the same cadence as `@keyframes flicker` (shared keyframes
  or an animated custom property). Gentle — no strobing.
- A faint warm rim catches the **top edge** of the letter (closest to the
  flame), reinforcing the existing `.result-card` "light catching the top of
  the paper" effect — now physically motivated.

**Dual-mode**
- Nightfall: lit candle, warm amber pool, deep wooden dark elsewhere.
- Daybreak: candle is **OUT** → it's the existing `.smoke` wisp. The letter is
  lit by **pale cool morning light from the top/side** (a window off-frame) —
  reuse the existing `.page-glow--day` top-center layer. Lighting source moves
  from candle (center, warm) to window (top, cool, diffuse).

**Acceptance**
- One candle only (no duplicate accents).
- In Nightfall, the light pool visibly breathes with the flame, subtly.
- Mode switch hands lighting from candle → window using existing flame↔smoke
  and glow layers; no new mechanism required.

**Depends on:** Step 1 (needs the desk to cast light onto).

---

## Step 3 — The letter (stationery textarea)

**Goal:** Turn `.dream-input` from a rounded box into a sheet of letter paper
lying on the desk under the candle.

**Scope**
- Paper sheet: slightly lighter than `--bg` (around `--card-bg`), soft/irregular
  edges (not a hard rectangle), a faint inner vignette so corners fall into
  shadow.
- Barely-there horizontal **ruling lines** in `--accent` at very low opacity
  (~15%), spaced to the body line-height. Must not compete with the text.
- **No visible border.** Paper is defined by glow + vignette, not an outline.
  Keep the existing adaptive focus glow on focus.
- Placeholder unchanged: `"The moon was too bright, and I was walking…"`,
  italic, warm cream, low opacity.

**New tokens** (both mode blocks)
- `--paper` — sheet color (warm under candle / cooler in morning).
- `--ink` — the user's text color (warm cream; can reuse `--text-primary`).

**Dual-mode**
- Nightfall: candle-warm paper, light pooling from the flame above.
- Daybreak: cooler paper, pale morning wash from the top.

**Acceptance**
- Reads as a sheet of stationery, not a form field.
- Ruling lines visible but never distracting; text stays fully legible.
- Still a real `<textarea>`: focusable, typeable, screen-reader friendly.

**Depends on:** Step 1 (desk), benefits from Step 2 (candle light pooling).

---

## Step 4 — The fountain-pen cursor

**Goal:** The text caret reads as a fountain-pen nib poised over the paper, not
an I-beam.

**Scope**
- A thin, tapered nib shape with a faint amber ink-glint at the tip (glint from
  `--glow-primary`).
- It **breathes**, not blinks: slow opacity pulse (~1.2s), never hard on/off.
  Wet ink catching candlelight.
- Approach options: `caret-color` + a custom cursor over the field, **or** a
  small absolutely-positioned nib element tracking the caret. Keep it subtle.
- The user's typed text stays in **EB Garamond** — the nib is an accent, not a
  handwriting-font swap.

**Acceptance**
- At rest, looks like a pen poised over paper, not a UI gimmick.
- No harsh blink; legibility and typing unaffected.
- Decorative bits are `aria-hidden`.

**Depends on:** Step 3 (the letter).

---

## Step 5 — The send cinematic (write → fold → seal → send)

**Goal:** On submit ("Seal & Reveal"), play a ~2.5–3.5s deliberate sequence
*before* the interpretation appears. Fire the `/api/interpret` request at the
**start** so animation and network overlap; if the response is slow, hold on
the "sent / waiting" beat rather than speeding up.

**The sequence**
1. **Ink / write (~1.2s)** — the already-typed text re-renders as if being
   written: a left-to-right reveal wipe (mask/clip) over the existing text, a
   nib riding the leading edge with a faint ink trail. *Not* retyping
   character-by-character; *not* a handwriting font. The pen re-traces what you
   wrote, then the page settles.
2. **Fold (~0.8s)** — the sheet folds into a neat shape (thirds-fold = classic
   letter; recommended). CSS 3D transforms (`rotateX`/`scaleY` on stacked
   panels) so creases catch light. Result: a small tidy rectangle.
3. **Seal + send (~0.8s)** — tie into the existing wax-seal aesthetic: a small
   wax seal presses onto the fold (quick scale-down "stamp," accent/amber, soft
   `--glow-primary` glow), then the folded letter drifts upward and fades. In
   Nightfall it lifts toward the flame; in Daybreak it dissolves into the mist.
   Then the interpretation reveals with the **existing staggered `.reveal-line`
   animation**.

**Scope**
- The `.composer` (textarea + button) fades/slides out as the letter folds, so
  the folded letter is the only thing on screen during step 3; then the
  `.result-card` takes its place.
- Keep submit guarding (disabled state, min-length). If the API errors, abort
  the sequence gracefully and show the existing `.notice`.

**Motion rules**
- Everything ease-in-out, unhurried. No bounce/snap/spring overshoot.
- Both modes: same choreography, mode-colored.
- `prefers-reduced-motion`: skip write/fold/send; just fade composer out and
  result in. No 3D transforms.

**New tokens** (as needed)
- `--crease` — fold-line highlight.
- `--wax` — seal color (can derive from `--accent` / `--glow-primary`).

**Acceptance**
- Submitting plays the cinematic, overlapping the network call.
- Slow API holds on "sent," never rushes; API error aborts cleanly.
- Reduced-motion path is calm and correct.

**Depends on:** Steps 3 + 4 (letter + pen).

---

## Step 6 — Enter the dream + the faint transition *(future, largest)*

> Build this **last**. It introduces a whole second "world" view and the most
> complex animation. Treat the dream-world itself as a placeholder for now —
> this step is really about the **transition shell** and the faint.

**Goal:** A function that lets the user step into a "fake-reality" of the dream
they wrote. Activating it plays a first-person faint: sitting at the desk
(in a chair with a backrest), the head tilts back, the view falls back, and as
it falls the dream world fades up to replace reality.

**Sub-steps (build in this order)**
1. **6a — State + entry point.** Add a "step inside" action that appears with
   the interpretation (e.g. a quiet button on/under `.result-card`). Add app
   state: `reality | fainting | dreamworld`. No animation yet — just swap to a
   placeholder dream-world view instantly.
2. **6b — The first-person camera.** Wrap the scene in a "view"/"camera"
   element that all the faint transforms apply to. Establish a subtle implied
   foreground: the **chair backrest** (a soft dark shape at the bottom edge) so
   the POV reads as *seated*. Still no faint — just the framing.
3. **6c — The faint animation.** On `fainting`:
   - The camera **tilts back and up** as if the head falls against the backrest
     — 3D transform on the view element: rotate the pitch upward
     (`rotateX`), drift up/back (`translate`), as though slumping into the chair.
   - Consciousness fades: **blur increases, color desaturates, a vignette
     closes inward** (tunnel-vision), eyelids implied by a darkening from the
     top and bottom edges meeting in the middle.
   - The candlelit desk recedes/dims as this happens.
   - **Crossfade** at the bottom of the fall: as the view reaches "head back,
     eyes shut," the dream world fades up to full. The desk is gone; the dream
     is now reality.
   - Duration: slow, ~2.5–4s. It should feel like *drifting under*, not
     fainting violently. One long exhale.
4. **6d — The dream world (placeholder).** A minimal second view that the faint
   lands in. Real content is out of scope here — establish the container, a
   "you are inside the dream" treatment, and a way back (waking up = the faint
   in reverse: eyes open, view tilts forward, desk fades back).

**Dual-mode**
- Nightfall: faint by candlelight, warm tunnel closing to black.
- Daybreak: faint into pale morning light, tunnel closing to soft white/grey.
- The dream world can ignore mode or pick its own palette — decide in 6d.

**Motion rules**
- `prefers-reduced-motion`: **no** tilt/blur/spin. Use a plain slow crossfade
  reality → dream world. Provide the same "wake up" crossfade back.
- Never trap the user: there must always be a clear way back to reality.

**Acceptance (per sub-step)**
- 6a: clicking "step inside" swaps to a placeholder dreamworld and back.
- 6b: the POV reads as seated (backrest present), framing stable.
- 6c: the faint reads as the head tilting back and consciousness fading, then
  crossfading into the dream; reduced-motion uses a plain crossfade.
- 6d: there is a dream-world container and a working "wake up" return.

**Depends on:** Steps 1–2 (the first-person desk scene must exist to fall away
from). Ideally after Step 5 so the dream is entered *from* the sealed letter /
result.

---

## Suggested build order (recap)

1 → 2 → 3 → 4 → 5 → 6 (and within 6: 6a → 6b → 6c → 6d).

Ship and look at each before starting the next. If a step ever feels too sharp
or too "animated," pull it back — the whole thing should feel like something you
do with half-open eyes.
