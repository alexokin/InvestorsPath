import type { StoreKey } from "@/lib/storage/bus";
import type { SyncRemote } from "./remote";

/**
 * In-memory `SyncRemote`, keyed by `userId:key`. Used by mock auth mode
 * (so sync still "works" across client navigations within one server
 * process/browser tab) and by the sync-engine tests.
 */
export function createMemoryRemote(
  seed?: Record<string, Partial<Record<StoreKey, unknown>>>
): SyncRemote {
  const data = new Map<string, unknown>();
  if (seed) {
    for (const [userId, rows] of Object.entries(seed)) {
      for (const [key, value] of Object.entries(rows)) {
        data.set(`${userId}:${key}`, value);
      }
    }
  }

  return {
    async fetchAll(userId: string): Promise<Partial<Record<StoreKey, unknown>>> {
      const result: Partial<Record<StoreKey, unknown>> = {};
      const keys: StoreKey[] = ["progress", "flashcards", "worksheets"];
      for (const key of keys) {
        const mapKey = `${userId}:${key}`;
        if (data.has(mapKey)) {
          result[key] = data.get(mapKey);
        }
      }
      return result;
    },
    async upsert(userId: string, key: StoreKey, value: unknown): Promise<void> {
      data.set(`${userId}:${key}`, value);
    },
  };
}

// Module-level singleton so a mock-mode session survives client-side
// navigations (each of which would otherwise re-import a fresh module
// instance in some bundling setups) within one server process.
let singleton: SyncRemote | null = null;

export function getMemoryRemote(): SyncRemote {
  if (!singleton) {
    singleton = createMemoryRemote();
  }
  return singleton;
}
