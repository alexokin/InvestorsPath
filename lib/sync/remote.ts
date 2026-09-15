import type { StoreKey } from "@/lib/storage/bus";

/**
 * A backend for the sync engine (Phase 3). Two implementations exist:
 * an in-memory mock (`memory-remote.ts`, used in mock auth mode and tests)
 * and a Supabase-backed one (`supabase-remote.ts`).
 */
export interface SyncRemote {
  /** All rows currently stored for this user, keyed by store. */
  fetchAll(userId: string): Promise<Partial<Record<StoreKey, unknown>>>;
  /** Upsert a single store's data for this user. */
  upsert(
    userId: string,
    key: StoreKey,
    data: unknown,
    opts?: { keepalive?: boolean }
  ): Promise<void>;
}
