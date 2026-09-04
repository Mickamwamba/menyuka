import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod";
import { AXES, TAG_VALUES } from "./tags";
import type { ExtractedMenu, MenuItem, Translation } from "./types";

/**
 * Opus 5 is the default; override with MENYUKA_MODEL if you want to trade
 * extraction accuracy for cost. Vision quality on a crooked, dim, phone-shot
 * menu is the whole ballgame here, so the default does not skimp.
 */
const MODEL = process.env.MENYUKA_MODEL ?? "claude-opus-5";

export class MenyukaApiError extends Error {
  constructor(
    message: string,
    readonly status = 500,
  ) {
    super(message);
  }
}

let client: Anthropic | null = null;
function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new MenyukaApiError(
        "ANTHROPIC_API_KEY is not set — add it to .env.local and restart the server.",
        500,
      );
    }
    client = new Anthropic();
  }
  return client;
}

const ExtractSchema = z.object({
  menu_language_name: z
    .string()
    .describe("English name of the language the menu is printed in"),
  restaurant_name: z
    .string()
    .describe("Restaurant name if visible on the menu, otherwise an empty string"),
  server_phrase: z
    .string()
    .describe(
      "The sentence \"I would like to order this, please.\" written in the menu's own language, politely, as a diner would say it to a server",
    ),
  items: z.array(
    z.object({
      name: z.string().describe("Dish name exactly as printed, same script"),
      original_description: z
        .string()
        .describe("Description as printed, or an empty string if the menu had none"),
      price: z
        .string()
        .describe("Price as printed including currency symbol, or an empty string"),
      category: z
        .string()
        .describe("Section heading it appeared under, or an empty string"),
      protein: z.enum(TAG_VALUES.protein),
      spice: z.enum(TAG_VALUES.spice),
      format: z.enum(TAG_VALUES.format),
      familiarity: z
        .enum(TAG_VALUES.familiarity)
        .describe(
          "familiar = a dish most international diners would recognise; adventurous = regional, unusual, or unfamiliar outside this cuisine",
        ),
      prep: z.enum(TAG_VALUES.prep),
      richness: z.enum(TAG_VALUES.richness),
    }),
  ),
});

const EXTRACT_SYSTEM = `You read photographs of physical restaurant menus and turn them into structured data for a diner who cannot read the menu.

Rules:
- Transcribe every orderable dish you can read. Keep names in the menu's original language and script — do not translate here.
- Skip headings, prices tables, opening hours, addresses, allergen legends, and marketing text. Only orderable items.
- If a photo is blurry or cut off, transcribe what is legible and leave the rest out rather than inventing dishes. Never invent a dish, a price, or a description.
- If several photos are given, they are pages of the same menu. Merge them and do not duplicate items that appear twice.
- Tag every item on all six axes even when the menu is terse. Infer from the dish name and your knowledge of the cuisine — a confident inference is far more useful than defaulting to "other".
- Use "other" only when the axis genuinely does not apply to the dish.
- spice reflects how the dish is normally served at a restaurant of this cuisine, not how hot it could be made.
- richness: light = a diner leaves still hungry-ish (salads, broths, small plates); rich = heavy, fatty, or very filling.`;

const TranslateSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      blurb: z.string(),
    }),
  ),
  ui: z.array(
    z.object({
      key: z.string(),
      text: z.string(),
    }),
  ),
});

const TRANSLATE_SYSTEM = `You help a diner who does not read the menu's language understand what each dish actually is.

For every menu item return:
- "name": the dish name in the target language. If the name is a proper noun or has no real equivalent, transliterate it and keep it short — this is what appears above the description.
- "blurb": ONE plain sentence, at most 18 words, in the target language, saying what the dish physically is: main ingredient, how it is cooked, how it arrives at the table. Assume the diner has never encountered this cuisine. Do not use the dish's own name inside the blurb, do not praise the dish, do not use restaurant-marketing language, and never guess an ingredient the name and description do not support.

Also translate every string in the "ui" list into the target language. These are buttons and questions in a phone app: keep them short enough for a small button, keep the tone plain and direct, and preserve any punctuation like "2–3". Return every key you were given, unchanged, with its translated text.

If the target language is the same as the menu language, still return the name as printed and still write the blurb.`;

type ExtractInput = { media_type: string; data: string }[];

export async function extractMenu(images: ExtractInput): Promise<ExtractedMenu> {
  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: EXTRACT_SYSTEM,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: zodOutputFormat(ExtractSchema),
    },
    messages: [
      {
        role: "user",
        content: [
          ...images.map((image) => ({
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: image.media_type as "image/jpeg",
              data: image.data,
            },
          })),
          {
            type: "text" as const,
            text:
              images.length > 1
                ? `These are ${images.length} pages of one restaurant menu. Read them all.`
                : "Read this restaurant menu.",
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new MenyukaApiError(
      "We couldn't read that image. Try a photo of just the menu.",
      422,
    );
  }

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new MenyukaApiError("We couldn't make sense of that photo.", 422);
  }

  const blank = (value: string) => (value.trim() === "" ? null : value.trim());

  const items: MenuItem[] = parsed.items
    .filter((item) => item.name.trim() !== "")
    .map((item, index) => ({
      id: `i${index}`,
      name: item.name.trim(),
      originalDescription: blank(item.original_description),
      price: blank(item.price),
      category: blank(item.category),
      tags: Object.fromEntries(
        AXES.map((axis) => [axis, item[axis]]),
      ) as MenuItem["tags"],
    }));

  return {
    menuLanguageName: parsed.menu_language_name.trim() || "the menu's language",
    restaurantName: blank(parsed.restaurant_name),
    serverPhrase: parsed.server_phrase.trim(),
    items,
  };
}

export async function translateMenu(args: {
  items: Pick<MenuItem, "id" | "name" | "originalDescription" | "category">[];
  ui: Record<string, string>;
  targetLanguage: string;
  menuLanguage: string;
}): Promise<Translation> {
  const payload = {
    menu_language: args.menuLanguage,
    target_language: args.targetLanguage,
    items: args.items.map((item) => ({
      id: item.id,
      name: item.name,
      printed_description: item.originalDescription ?? "",
      section: item.category ?? "",
    })),
    ui: Object.entries(args.ui).map(([key, text]) => ({ key, text })),
  };

  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: TRANSLATE_SYSTEM,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "low",
      format: zodOutputFormat(TranslateSchema),
    },
    messages: [
      {
        role: "user",
        content: `Target language: ${args.targetLanguage}\nMenu language: ${args.menuLanguage}\n\n${JSON.stringify(payload)}`,
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new MenyukaApiError("We couldn't translate this menu.", 422);
  }

  const parsed = response.parsed_output;
  return {
    items: Object.fromEntries(
      parsed.items.map((item) => [
        item.id,
        { name: item.name.trim(), blurb: item.blurb.trim() },
      ]),
    ),
    ui: Object.fromEntries(parsed.ui.map((entry) => [entry.key, entry.text])),
  };
}

/** Turn SDK errors into something safe and useful to put on a phone screen. */
export function toClientError(error: unknown): {
  message: string;
  status: number;
} {
  if (error instanceof MenyukaApiError) {
    return { message: error.message, status: error.status };
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return { message: "Server is missing its API key.", status: 500 };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return { message: "We're busy right now — try again in a moment.", status: 429 };
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return { message: "Connection dropped. Check your signal and retry.", status: 503 };
  }
  if (error instanceof Anthropic.APIError) {
    return { message: "Something went wrong reading your menu.", status: 502 };
  }
  console.error("[menyuka] unexpected error", error);
  return { message: "Something went wrong.", status: 500 };
}
