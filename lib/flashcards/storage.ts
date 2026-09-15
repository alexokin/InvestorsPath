import { notifyStoreChange, type StoreChangeSource } from "@/lib/storage/bus";
import { isCardState, type CardState } from "./scheduler";

/** Shape persisted in localStorage: one Leitner state per glossary slug. */
export type FlashcardStore = Record<string, CardState>;

export const FLASHCARDS_STORAGE_KEY = "vip:flashcards:v1";

export function defaultFlashcardStore(): FlashcardStore {
  return {};
}

/**
 * Validate an arbitrary parsed value as a flashcard store, dropping any
 * malformed entries instead of letting one bad value poison the deck.
 * Non-object input (or arrays/null) yields an empty store.
 */
export function parseFlashcardStore(raw: unknown): FlashcardStore {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return defaultFlashcardStore();
  }
  const store: FlashcardStore = {};
  for (const [slug, state] of Object.entries(raw as Record<string, unknown>)) {
    if (isCardState(state)) store[slug] = state;
  }
  return store;
}

export function readFlashcards(): FlashcardStore {
  if (typeof window === "undefined") return defaultFlashcardStore();
  try {
    const raw = window.localStorage.getItem(FLASHCARDS_STORAGE_KEY);
    if (!raw) return defaultFlashcardStore();
    return parseFlashcardStore(JSON.parse(raw));
  } catch {
    return defaultFlashcardStore();
  }
}

export function writeFlashcards(store: FlashcardStore, source: StoreChangeSource = "local"): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(store));
    notifyStoreChange("flashcards", source);
  } catch {
    // localStorage unavailable (private mode, quota) — fail silently.
  }
}

export function clearFlashcards(source: StoreChangeSource = "local"): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(FLASHCARDS_STORAGE_KEY);
    notifyStoreChange("flashcards", source);
  } catch {
    // ignore
  }
}
