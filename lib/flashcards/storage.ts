import { isCardState, type CardState } from "./scheduler";

/** Shape persisted in localStorage: one Leitner state per glossary slug. */
export type FlashcardStore = Record<string, CardState>;

export const FLASHCARDS_STORAGE_KEY = "vip:flashcards:v1";

export function defaultFlashcardStore(): FlashcardStore {
  return {};
}

export function readFlashcards(): FlashcardStore {
  if (typeof window === "undefined") return defaultFlashcardStore();
  try {
    const raw = window.localStorage.getItem(FLASHCARDS_STORAGE_KEY);
    if (!raw) return defaultFlashcardStore();
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return defaultFlashcardStore();
    }
    // Drop malformed entries instead of letting one bad value poison the deck.
    const store: FlashcardStore = {};
    for (const [slug, state] of Object.entries(parsed as Record<string, unknown>)) {
      if (isCardState(state)) store[slug] = state;
    }
    return store;
  } catch {
    return defaultFlashcardStore();
  }
}

export function writeFlashcards(store: FlashcardStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage unavailable (private mode, quota) — fail silently.
  }
}
