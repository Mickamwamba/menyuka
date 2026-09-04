/**
 * The app's own interface strings, pre-translated at build time.
 *
 * Nothing here comes from a menu. Menu content — dish names and the
 * plain-language blurbs — is translated per photo at runtime in
 * lib/anthropic.ts. These are the fixed strings from lib/copy.ts: buttons,
 * headings, the six question prompts, and the answer labels for the closed tag
 * vocabulary in lib/tags.ts.
 *
 * Regenerate with `npm run copy:translate` after editing lib/copy.ts;
 * `npm run copy:check` fails the build if you forget.
 *
 * Each language is a separate dynamic import so a diner downloads only the one
 * they picked (~3 KB), not all sixteen.
 */

export type LanguageStrings = {
  _sourceHash: string;
  _language: string;
  strings: Record<string, string>;
};

const LOADERS: Record<string, () => Promise<{ default: LanguageStrings }>> = {
  en: () => import("./en.json"),
  es: () => import("./es.json"),
  zh: () => import("./zh.json"),
  hi: () => import("./hi.json"),
  ar: () => import("./ar.json"),
  fr: () => import("./fr.json"),
  pt: () => import("./pt.json"),
  ru: () => import("./ru.json"),
  ja: () => import("./ja.json"),
  ko: () => import("./ko.json"),
  de: () => import("./de.json"),
  it: () => import("./it.json"),
  tr: () => import("./tr.json"),
  vi: () => import("./vi.json"),
  th: () => import("./th.json"),
  sw: () => import("./sw.json"),
};

export const TRANSLATED_CODES = Object.keys(LOADERS);

/**
 * Returns null for an unknown code rather than throwing — the caller falls
 * back to English copy, which is a worse experience but still a working app.
 */
export async function loadUiStrings(
  code: string,
): Promise<Record<string, string> | null> {
  const loader = LOADERS[code];
  if (!loader) return null;
  try {
    const loaded = await loader();
    return loaded.default.strings;
  } catch {
    return null;
  }
}
