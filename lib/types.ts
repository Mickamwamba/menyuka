import type { Axis } from "./tags";

export type MenuItem = {
  id: string;
  /** Dish name exactly as printed on the physical menu. */
  name: string;
  /** Description as printed, if the menu had one. */
  originalDescription: string | null;
  /** Price as printed, currency symbol included. */
  price: string | null;
  /** Section heading it appeared under, if any. */
  category: string | null;
  tags: Record<Axis, string>;
};

export type ExtractedMenu = {
  /** English name of the language the menu is printed in. */
  menuLanguageName: string;
  restaurantName: string | null;
  /** "I'd like to order this, please." rendered in the menu's own language. */
  serverPhrase: string;
  items: MenuItem[];
};

/** Per-item translation + plain-language explanation, keyed by MenuItem.id. */
export type ItemTranslation = {
  name: string;
  blurb: string;
};

export type Translation = {
  items: Record<string, ItemTranslation>;
  /** Flow-critical UI strings, translated. Keys match lib/copy.ts. */
  ui: Record<string, string>;
};

export type Answer = {
  axis: Axis;
  /** A tag value, or "any" when the diner had no preference. */
  value: string;
};

export type QuestionOption = {
  value: string;
  count: number;
};

export type Question = {
  axis: Axis;
  options: QuestionOption[];
};

export type Language = {
  code: string;
  /** Name in the language itself, so a non-English speaker can find it. */
  label: string;
  /** English name, sent to the model. */
  english: string;
};
