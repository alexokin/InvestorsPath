import type { StoreKey } from "@/lib/storage/bus";
import type { SyncRemote } from "./remote";

/**
 * A structural (not the real `@supabase/supabase-js`) type covering just
 * the query surface this module needs, so it has no compile-time
 * dependency on the Supabase client package or its version.
 */
export interface MinimalSupabaseClient {
  from(table: string): {
    select(cols: string): {
      eq(col: string, value: string): PromiseLike<{
        data: { key: string; data: unknown }[] | null;
        error: unknown;
      }>;
    };
    upsert(row: object, opts: { onConflict: string }): PromiseLike<{ error: unknown }>;
  };
}

const KNOWN_KEYS: readonly StoreKey[] = ["progress", "flashcards", "worksheets"];

function isStoreKey(value: string): value is StoreKey {
  return (KNOWN_KEYS as readonly string[]).includes(value);
}

/**
 * `SyncRemote` backed by the `learner_state` table (see
 * supabase/migrations/0001_learner_state.sql). `getClient` is a factory
 * rather than a client instance so callers can lazily create/reuse the
 * browser Supabase client (`getBrowserSupabase()`).
 */
export function createSupabaseRemote(
  getClient: () => Promise<MinimalSupabaseClient>
): SyncRemote {
  return {
    async fetchAll(userId: string): Promise<Partial<Record<StoreKey, unknown>>> {
      const client = await getClient();
      const { data, error } = await client.from("learner_state").select("key,data").eq("user_id", userId);
      if (error) throw error instanceof Error ? error : new Error(String(error));
      const result: Partial<Record<StoreKey, unknown>> = {};
      for (const row of data ?? []) {
        if (isStoreKey(row.key)) result[row.key] = row.data;
      }
      return result;
    },
    // `opts.keepalive` is meaningful for a raw `fetch()` call (so a push
    // started right before unload still completes), but the Supabase JS
    // client doesn't expose a keepalive knob on its query builder, so
    // there's nothing to pass it through to here; it's accepted for
    // interface parity with the memory remote and ignored.
    async upsert(userId: string, key: StoreKey, data: unknown): Promise<void> {
      const client = await getClient();
      const { error } = await client
        .from("learner_state")
        .upsert({ user_id: userId, key, data }, { onConflict: "user_id,key" });
      if (error) throw error instanceof Error ? error : new Error(String(error));
    },
  };
}
