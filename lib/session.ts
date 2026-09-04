import type { ExtractedMenu, Translation } from "./types";

/**
 * No accounts, no database — a session lives in sessionStorage and dies with
 * the tab. Persisting it at all is only so a mis-tap on the browser back
 * button doesn't cost the diner their photo.
 */
const KEY = "menyuka.session.v2";

export type StoredSession = {
  menu: ExtractedMenu | null;
  languageCode: string | null;
  translations: Record<string, Translation>;
};

export const EMPTY_SESSION: StoredSession = {
  menu: null,
  languageCode: null,
  translations: {},
};

export function loadSession(): StoredSession {
  if (typeof window === "undefined") return EMPTY_SESSION;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return EMPTY_SESSION;
    return { ...EMPTY_SESSION, ...(JSON.parse(raw) as StoredSession) };
  } catch {
    return EMPTY_SESSION;
  }
}

export function saveSession(session: StoredSession) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Private mode or a menu too big to store — the in-memory copy still works.
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to do.
  }
}
