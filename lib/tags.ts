// The candidate axes the question engine may ask about. Every menu item gets a
// value on every axis at extraction time; the engine then decides which axes are
// worth asking about *for this particular menu* (see lib/questions.ts).

export const AXES = [
  "protein",
  "spice",
  "format",
  "familiarity",
  "prep",
  "richness",
] as const;

export type Axis = (typeof AXES)[number];

export const TAG_VALUES = {
  protein: [
    "beef",
    "pork",
    "chicken",
    "seafood",
    "lamb",
    "egg",
    "tofu",
    "vegetable",
    "mixed",
    "other",
  ],
  spice: ["none", "mild", "medium", "hot"],
  format: [
    "soup",
    "noodles",
    "rice",
    "sandwich",
    "salad",
    "grill",
    "stew",
    "shareable",
    "pastry",
    "dessert",
    "side",
    "drink",
    "other",
  ],
  familiarity: ["familiar", "adventurous"],
  prep: [
    "raw",
    "fried",
    "grilled",
    "steamed",
    "stewed",
    "baked",
    "roasted",
    "cured",
    "other",
  ],
  richness: ["light", "medium", "rich"],
} as const satisfies Record<Axis, readonly string[]>;

export type TagValue<A extends Axis> = (typeof TAG_VALUES)[A][number];

// Values that carry no signal — an item tagged "other" tells the engine nothing,
// so these are excluded from option lists and from coverage.
export const NULL_VALUES: Partial<Record<Axis, readonly string[]>> = {
  protein: ["other"],
  format: ["other"],
  prep: ["other"],
};

// Axes where values sit on a line, so an adjacent value is a partial match
// rather than a miss. Used for graceful degradation in ranking (M-16).
export const ORDINAL_AXES: Partial<Record<Axis, readonly string[]>> = {
  spice: TAG_VALUES.spice,
  richness: TAG_VALUES.richness,
};
