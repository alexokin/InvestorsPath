/**
 * In-memory event bus for learner-store writes (progress, flashcards,
 * worksheets). Lets the sync engine (Phase 3) and providers react to local
 * writes without polling, and lets remote pulls announce themselves the
 * same way. SSR-safe: no `window` access, just a module-level Set.
 */

export type StoreKey = "progress" | "flashcards" | "worksheets";
export type StoreChangeSource = "local" | "remote";
export type StoreChange = { key: StoreKey; source: StoreChangeSource };

type Listener = (change: StoreChange) => void;

const listeners = new Set<Listener>();

/** Announce that `key` changed. Call after a successful write/remove. */
export function notifyStoreChange(key: StoreKey, source: StoreChangeSource = "local"): void {
  const change: StoreChange = { key, source };
  for (const fn of listeners) {
    try {
      fn(change);
    } catch {
      // A listener's own bug must not stop the others from being notified.
    }
  }
}

/** Subscribe to store changes. Returns an unsubscribe function. */
export function subscribeStoreChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
