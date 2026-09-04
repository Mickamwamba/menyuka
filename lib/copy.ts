import { AXES, TAG_VALUES, type Axis } from "./tags";
import type { Language } from "./types";

/**
 * Flow-critical copy only. Per the MVP scope, menu content is the translation
 * priority — this is the subset of chrome the diner has to read to get through
 * the flow, not the whole UI.
 */
export const UI_COPY: Record<string, string> = {
  confirmTitle: "Here's what we read",
  confirmSubtitle:
    "Spot-check a few names against the paper menu before we go further.",
  confirmCount: "dishes found",
  confirmContinue: "Looks right",
  confirmRetake: "Retake photo",

  forkTitle: "How do you want to decide?",
  forkBrowse: "Browse full menu",
  forkBrowseSub: "Every dish, translated and explained",
  forkHelp: "Help me choose",
  forkHelpSub: "Answer 2–3 quick questions",

  browseTitle: "Full menu",
  browseDone: "Done browsing",

  resultsTitle: "Your best matches",
  resultsApprox: "Not every dish here matches exactly — these are the closest",
  shuffle: "Show me others",
  startOver: "Start over",
  pickThis: "I'll have this",

  serverTitle: "Show this to your server",
  serverDone: "Done",

  back: "Back",
  noPreference: "No preference",
  skipQuestions: "Just show me everything",
};

/** The question asked for each axis. */
export const AXIS_QUESTION: Record<Axis, string> = {
  protein: "What are you in the mood for?",
  spice: "How much heat do you want?",
  format: "What kind of dish?",
  familiarity: "Play it safe, or try something new?",
  prep: "How should it be cooked?",
  richness: "Light, or something substantial?",
};

/** Tap-target label for each tag value. */
export const TAG_LABEL: Record<string, string> = {
  "protein.beef": "Beef",
  "protein.pork": "Pork",
  "protein.chicken": "Chicken",
  "protein.seafood": "Seafood",
  "protein.lamb": "Lamb",
  "protein.game": "Game or offal",
  "protein.egg": "Egg",
  "protein.tofu": "Tofu or beans",
  "protein.vegetable": "Vegetables",
  "protein.mixed": "A mix",
  "protein.other": "Something else",

  "spice.none": "No heat",
  "spice.mild": "A little",
  "spice.medium": "Medium",
  "spice.hot": "Bring the heat",

  "format.soup": "Soup",
  "format.noodles": "Noodles",
  "format.rice": "Rice dish",
  "format.sandwich": "Sandwich or wrap",
  "format.salad": "Salad",
  "format.plate": "A main plate",
  "format.grill": "Off the grill",
  "format.stew": "Stew or braise",
  "format.shareable": "Small plates to share",
  "format.pastry": "Pastry or bread",
  "format.dessert": "Dessert",
  "format.side": "Side dish",
  "format.drink": "Drink",
  "format.other": "Something else",

  "familiarity.familiar": "Something familiar",
  "familiarity.adventurous": "Something new to me",

  "prep.raw": "Raw or fresh",
  "prep.fried": "Fried",
  "prep.grilled": "Grilled",
  "prep.steamed": "Steamed",
  "prep.stewed": "Slow-cooked",
  "prep.baked": "Baked",
  "prep.roasted": "Roasted",
  "prep.cured": "Cured or pickled",
  "prep.other": "Any way",

  "richness.light": "Light",
  "richness.medium": "In between",
  "richness.rich": "Rich and filling",
};

export const tagKey = (axis: Axis, value: string) => `${axis}.${value}`;

/** Every string the translate route needs to return, assembled once. */
export function translatableCopy(): Record<string, string> {
  const out: Record<string, string> = { ...UI_COPY };
  for (const axis of AXES) {
    out[`q.${axis}`] = AXIS_QUESTION[axis];
    for (const value of TAG_VALUES[axis]) {
      const key = tagKey(axis, value);
      out[`t.${key}`] = TAG_LABEL[key];
    }
  }
  return out;
}

/** Look up translated copy, falling back to English if a key is missing. */
export function makeCopy(translated: Record<string, string> | null) {
  const source = { ...translatableCopy(), ...(translated ?? {}) };
  return {
    t: (key: string) => source[key] ?? UI_COPY[key] ?? key,
    question: (axis: Axis) => source[`q.${axis}`] ?? AXIS_QUESTION[axis],
    option: (axis: Axis, value: string) =>
      source[`t.${tagKey(axis, value)}`] ?? TAG_LABEL[tagKey(axis, value)] ?? value,
  };
}

export type Copy = ReturnType<typeof makeCopy>;

export const LANGUAGES: Language[] = [
  { code: "en", label: "English", english: "English" },
  { code: "es", label: "Español", english: "Spanish" },
  { code: "zh", label: "中文", english: "Simplified Chinese" },
  { code: "hi", label: "हिन्दी", english: "Hindi" },
  { code: "ar", label: "العربية", english: "Arabic" },
  { code: "fr", label: "Français", english: "French" },
  { code: "pt", label: "Português", english: "Portuguese" },
  { code: "ru", label: "Русский", english: "Russian" },
  { code: "ja", label: "日本語", english: "Japanese" },
  { code: "ko", label: "한국어", english: "Korean" },
  { code: "de", label: "Deutsch", english: "German" },
  { code: "it", label: "Italiano", english: "Italian" },
  { code: "tr", label: "Türkçe", english: "Turkish" },
  { code: "vi", label: "Tiếng Việt", english: "Vietnamese" },
  { code: "th", label: "ไทย", english: "Thai" },
  { code: "sw", label: "Kiswahili", english: "Swahili" },
];

export const RTL_LANGUAGES = new Set(["ar", "he", "fa", "ur"]);
