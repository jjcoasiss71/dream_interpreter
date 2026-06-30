// lib/dreamScene.ts
// ---------------------------------------------------------------------------
// A dream becomes a SceneSpec — the description the 3D renderer builds a world
// from. The dream is first CLASSIFIED into a setting / weather / time / mood
// (here by keyword heuristic; the /api/scene endpoint improves this with the
// LLM), then ASSEMBLED into a full spec (palette + seed + symbol accents).
// The renderer only ever reads a SceneSpec, so smarter classification needs no
// renderer change.
// ---------------------------------------------------------------------------

export type Setting = "city" | "forest" | "ocean" | "field" | "room" | "void";
export type Weather = "rain" | "snow" | "fog" | "clear";
export type TimeOfDay = "night" | "dusk" | "day";
export type Mood = "calm" | "uneasy" | "dread";

// Discrete things we can actually build from primitives and drop into ANY
// setting, so the world reflects more of what the dreamer describes.
export type ElementKind =
  | "moon"
  | "mountains"
  | "water"
  | "path"
  | "fire"
  | "streetlights"
  | "trees"
  | "structures"
  | "doorway"
  | "bridge"
  | "stairs"
  | "figures"
  | "flowers";

export type AccentName =
  | "amber"
  | "gold"
  | "crimson"
  | "cyan"
  | "violet"
  | "green"
  | "white";

export type Scale = "intimate" | "open" | "vast";

// The compact classification of a dream — what /api/scene returns.
export type SceneClass = {
  setting: Setting;
  weather: Weather;
  timeOfDay: TimeOfDay;
  mood: Mood;
  elements: ElementKind[];
  accent: AccentName;
  scale: Scale;
};

export type SceneMarker = {
  label: string;
  position: [number, number, number];
  intensity: number;
};

export type Palette = {
  sky: string;
  fog: string;
  ground: string;
  light: string; // the candle/lamp carried into the dream
  accent: string;
};

// The full description the renderer consumes.
export type SceneSpec = SceneClass & {
  palette: Palette;
  fogDensity: number;
  markers: SceneMarker[];
  seed: number;
};

export const SETTINGS: Setting[] = ["city", "forest", "ocean", "field", "room", "void"];
export const WEATHERS: Weather[] = ["rain", "snow", "fog", "clear"];
export const TIMES: TimeOfDay[] = ["night", "dusk", "day"];
export const MOODS: Mood[] = ["calm", "uneasy", "dread"];
export const ELEMENTS: ElementKind[] = ["moon", "mountains", "water", "path",
  "fire", "streetlights", "trees", "structures", "doorway", "bridge", "stairs",
  "figures", "flowers"];
export const ACCENTS: AccentName[] = ["amber", "gold", "crimson", "cyan",
  "violet", "green", "white"];
export const SCALES: Scale[] = ["intimate", "open", "vast"];

export const ACCENT_HEX: Record<AccentName, string> = {
  amber: "#ffb670",
  gold: "#ffd9a0",
  crimson: "#ff5a4d",
  cyan: "#7fd4ff",
  violet: "#b58cff",
  green: "#7dd87f",
  white: "#eaf0ff",
};

// --- keyword heuristic (instant, offline fallback) --------------------------

const SETTING_WORDS: Record<Exclude<Setting, "void">, string[]> = {
  city: ["city", "street", "building", "town", "downtown", "road", "traffic",
    "subway", "apartment", "skyscraper", "urban", "alley", "sidewalk", "bus",
    "shop", "store", "neon", "parking"],
  forest: ["forest", "tree", "trees", "woods", "wood", "jungle", "trail",
    "branches", "leaves", "pine", "grove"],
  ocean: ["ocean", "sea", "water", "beach", "wave", "waves", "drown", "drowning",
    "flood", "river", "lake", "underwater", "tide", "shore", "boat", "ship",
    "swim", "swimming"],
  field: ["field", "meadow", "grass", "plain", "plains", "desert", "mountain",
    "hill", "hills", "valley", "cliff", "farm", "prairie", "moor"],
  room: ["room", "house", "home", "bedroom", "hallway", "corridor", "door",
    "indoor", "office", "school", "kitchen", "basement", "attic", "hall",
    "stairs", "stairway", "church", "hospital"],
};

const WEATHER_WORDS: Record<Exclude<Weather, "clear">, string[]> = {
  rain: ["rain", "raining", "rainy", "storm", "stormy", "wet", "downpour",
    "drizzle", "thunder", "lightning"],
  snow: ["snow", "snowing", "snowy", "winter", "ice", "icy", "frost", "blizzard",
    "freezing"],
  fog: ["fog", "foggy", "mist", "misty", "haze", "hazy", "smoke", "smog"],
};

const TIME_WORDS: Record<Exclude<TimeOfDay, "night">, string[]> = {
  dusk: ["dusk", "sunset", "evening", "twilight", "amber", "orange sky"],
  day: ["sun", "sunny", "morning", "noon", "daylight", "bright", "afternoon",
    "blue sky"],
};

// Words that imply a buildable element (used by the instant heuristic; the LLM
// does the richer reading).
const ELEMENT_WORDS: Record<ElementKind, string[]> = {
  moon: ["moon", "moonlight", "lunar", "crescent"],
  mountains: ["mountain", "mountains", "hill", "hills", "cliff", "peak", "ridge", "valley"],
  water: ["water", "lake", "pond", "pool", "river", "stream", "sea", "ocean", "flood", "puddle"],
  path: ["path", "road", "street", "trail", "sidewalk", "track", "walkway", "highway"],
  fire: ["fire", "flame", "flames", "burning", "burn", "ember", "embers", "candle", "torch", "blaze"],
  streetlights: ["streetlight", "streetlights", "lamp", "lamps", "lamppost", "lantern", "lanterns", "neon"],
  trees: ["tree", "trees", "forest", "woods", "branch", "branches", "leaves"],
  structures: ["building", "buildings", "ruins", "wall", "walls", "tower", "house", "houses", "temple", "column", "columns", "pillar", "pillars"],
  doorway: ["door", "doorway", "doors", "gate", "gateway", "entrance", "threshold"],
  bridge: ["bridge", "overpass", "crossing"],
  stairs: ["stairs", "staircase", "steps", "stairway", "ladder"],
  figures: ["figure", "figures", "person", "people", "man", "woman", "child", "crowd", "shadow", "silhouette", "stranger", "someone", "ghost"],
  flowers: ["flower", "flowers", "garden", "petals", "blossom", "blossoms", "meadow", "roses"],
};

const ACCENT_WORDS: Record<AccentName, string[]> = {
  crimson: ["red", "crimson", "blood", "scarlet"],
  cyan: ["blue", "cyan", "teal", "turquoise"],
  violet: ["purple", "violet", "magenta", "lavender"],
  green: ["green", "emerald", "jade"],
  gold: ["gold", "golden", "yellow"],
  white: ["white", "pale", "silver", "grey", "gray"],
  amber: ["amber", "orange", "warm"],
};

const VAST_WORDS = ["vast", "endless", "infinite", "huge", "enormous", "giant", "boundless", "massive", "horizon", "forever"];
const INTIMATE_WORDS = ["small", "tiny", "narrow", "cramped", "tight", "close", "little", "room", "closet"];

const DREAD_WORDS = ["chase", "chased", "monster", "fear", "afraid", "terror",
  "scream", "blood", "dark figure", "shadow", "falling", "fell", "death", "dead",
  "lost", "trapped", "drown", "drowning", "panic", "demon", "ghost", "haunt"];

const UNEASE_WORDS = ["strange", "unknown", "alone", "empty", "silent", "cold",
  "watching", "follow", "following", "maze", "endless", "door", "whisper"];

function scoreWords(text: string, words: string[]): number {
  let n = 0;
  for (const w of words) {
    if (text.includes(w)) n += 1;
  }
  return n;
}

function pickByScore<K extends string, F extends string>(
  text: string,
  groups: Record<K, string[]>,
  fallback: F
): K | F {
  let best: K | F = fallback;
  let bestScore = 0;
  for (const key of Object.keys(groups) as K[]) {
    const s = scoreWords(text, groups[key]);
    if (s > bestScore) {
      bestScore = s;
      best = key;
    }
  }
  return best;
}

/** Best-effort classification of a dream from its text alone. */
export function classifyDream(dreamText: string): SceneClass {
  const t = (dreamText || "").toLowerCase();

  const setting = pickByScore(t, SETTING_WORDS, "void") as Setting;
  const weather = pickByScore(t, WEATHER_WORDS, "clear") as Weather;
  // Default to day unless the dream implies otherwise.
  const timeOfDay = pickByScore(t, TIME_WORDS, "day") as TimeOfDay;

  const dread = scoreWords(t, DREAD_WORDS);
  const unease = scoreWords(t, UNEASE_WORDS);
  const mood: Mood = dread >= 1 ? "dread" : unease >= 2 ? "uneasy" : "calm";

  // Elements present in the text (skip ones the base setting already provides).
  const elements: ElementKind[] = [];
  for (const kind of ELEMENTS) {
    if (scoreWords(t, ELEMENT_WORDS[kind]) > 0) elements.push(kind);
  }
  const redundant: Record<Setting, ElementKind[]> = {
    forest: ["trees"],
    ocean: ["water"],
    city: ["structures", "streetlights"],
    field: [],
    room: [],
    void: [],
  };
  const skip = new Set(redundant[setting]);
  const elementsFiltered = elements.filter((e) => !skip.has(e)).slice(0, 6);

  // Accent colour: first explicit colour word wins, else a tone fitting time.
  let accent: AccentName = timeOfDay === "day" ? "white" : timeOfDay === "dusk" ? "amber" : "gold";
  let bestAccent = 0;
  for (const name of ACCENTS) {
    const s = scoreWords(t, ACCENT_WORDS[name]);
    if (s > bestAccent) {
      bestAccent = s;
      accent = name;
    }
  }

  const scale: Scale =
    scoreWords(t, VAST_WORDS) > 0 ? "vast" :
    setting === "room" || scoreWords(t, INTIMATE_WORDS) > 0 ? "intimate" :
    "open";

  return { setting, weather, timeOfDay, mood, elements: elementsFiltered, accent, scale };
}

// --- assembly: classification + symbols -> full SceneSpec -------------------

function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Base palettes per time of day; setting/mood nudge them below.
function basePalette(time: TimeOfDay): Palette {
  switch (time) {
    case "day":
      return { sky: "#aab4c6", fog: "#bcc4d2", ground: "#33402c", light: "#fff3df", accent: "#cfe0ff" };
    case "dusk":
      return { sky: "#4a3045", fog: "#6a4654", ground: "#2c2230", light: "#ffac7e", accent: "#ffb27a" };
    case "night":
    default:
      // A moonlit dark — blue-grey, not pitch black, so the world reads.
      return { sky: "#11141f", fog: "#1a1f2e", ground: "#22202e", light: "#ffd2a8", accent: "#9fb4cc" };
  }
}

function tintGround(p: Palette, setting: Setting): Palette {
  const ground =
    setting === "city" ? "#0b0b12" :
    setting === "forest" ? "#0c130d" :
    setting === "field" ? p.ground :
    setting === "room" ? "#191310" :
    setting === "ocean" ? "#091420" :
    p.ground;
  return { ...p, ground };
}

/** Build the full renderable spec from a classification + the dream's symbols. */
export function assembleScene(
  cls: SceneClass,
  symbols: string[],
  dreamText: string
): SceneSpec {
  const palette = tintGround(basePalette(cls.timeOfDay), cls.setting);

  // The dreamer's described colour drives the accent (element glows, markers).
  palette.accent = ACCENT_HEX[cls.accent];

  // A city at night is never truly black — light pollution gives the sky a dim
  // sodium glow, so the skyline silhouettes against it instead of vanishing.
  if (cls.setting === "city" && cls.timeOfDay !== "day") {
    palette.sky = "#1a130e";
    palette.fog = "#211711";
  }

  // Fog: denser for fog-weather and dread; lighter by day.
  let fogDensity =
    cls.weather === "fog" ? 0.12 :
    cls.weather === "snow" ? 0.07 :
    cls.weather === "rain" ? 0.06 :
    0.045;
  if (cls.mood === "dread") fogDensity += 0.02;
  if (cls.timeOfDay === "day") fogDensity *= 0.7;

  const clean = Array.from(
    new Set(symbols.map((s) => s.trim().toLowerCase()).filter(Boolean))
  ).slice(0, 6);

  const seed = hashString(dreamText + "|" + clean.join(","));
  const rand = mulberry32(seed);

  const markers: SceneMarker[] = clean.map((label, i) => {
    const baseAngle = (i / Math.max(clean.length, 1)) * Math.PI * 2;
    const angle = baseAngle + (rand() - 0.5) * 0.9;
    const radius = 6 + rand() * 10;
    const height = 1.4 + rand() * 1.6;
    return {
      label,
      position: [Math.cos(angle) * radius, height, Math.sin(angle) * radius],
      intensity: 0.4 + rand() * 0.25,
    };
  });

  return { ...cls, palette, fogDensity, markers, seed };
}

/** One-shot convenience used as the instant, on-device fallback. */
export function buildSceneFromDream(symbols: string[], dreamText: string): SceneSpec {
  return assembleScene(classifyDream(dreamText), symbols, dreamText);
}

/** Coerce arbitrary input (e.g. LLM JSON) into a valid SceneClass. */
export function coerceSceneClass(input: unknown, fallback: SceneClass): SceneClass {
  const o = (input ?? {}) as Record<string, unknown>;
  const oneOf = <T extends string>(v: unknown, allowed: T[], fb: T): T =>
    typeof v === "string" && (allowed as string[]).includes(v) ? (v as T) : fb;

  // Keep only known element kinds, de-duplicated and capped.
  const rawElements = Array.isArray(o.elements) ? o.elements : fallback.elements;
  const elements = Array.from(
    new Set(
      (rawElements as unknown[]).filter(
        (e): e is ElementKind => typeof e === "string" && (ELEMENTS as string[]).includes(e)
      )
    )
  ).slice(0, 6);

  return {
    setting: oneOf(o.setting, SETTINGS, fallback.setting),
    weather: oneOf(o.weather, WEATHERS, fallback.weather),
    timeOfDay: oneOf(o.timeOfDay, TIMES, fallback.timeOfDay),
    mood: oneOf(o.mood, MOODS, fallback.mood),
    elements,
    accent: oneOf(o.accent, ACCENTS, fallback.accent),
    scale: oneOf(o.scale, SCALES, fallback.scale),
  };
}
