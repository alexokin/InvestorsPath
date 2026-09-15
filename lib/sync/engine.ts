import { subscribeStoreChange, type StoreChange, type StoreKey } from "@/lib/storage/bus";
import { readOwner, writeOwner } from "./owner";
import { clearAllLearnerStores, STORE_ADAPTERS, type StoreAdapter } from "./stores";
import type { SyncRemote } from "./remote";

export type PullDecision = "apply-remote" | "upload-local" | "noop";

/**
 * Pure decision for what to do with one store on sign-in:
 * - a remote row wins over local (multi-device is remote's job)
 * - with no remote row, an empty-owner browser uploads its legacy local
 *   data once (first sign-in on this browser)
 * - otherwise there's nothing to do
 */
export function decidePull(args: {
  remote: unknown;
  hasRemote: boolean;
  localIsEmpty: boolean;
  ownerAbsent: boolean;
}): PullDecision {
  if (args.hasRemote) return "apply-remote";
  if (!args.localIsEmpty && args.ownerAbsent) return "upload-local";
  return "noop";
}

export type SyncState = "idle" | "syncing" | "error";

export type SyncEngine = {
  start(): Promise<void>;
  flush(opts?: { keepalive?: boolean }): Promise<void>;
  stop(): Promise<void>;
  readonly state: SyncState;
  onStateChange(cb: (s: SyncState) => void): () => void;
};

const STORE_KEYS: StoreKey[] = ["progress", "flashcards", "worksheets"];

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("sync: fetchAll timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    );
  });
}

function hasBrowserGlobals(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Drives one signed-in user's local <-> remote sync: an initial pull on
 * `start()`, then a debounced push on every local store write, flushed
 * immediately on tab-hide/page-hide/back-online.
 */
export function createSyncEngine(
  userId: string,
  remote: SyncRemote,
  deps?: {
    debounceMs?: number;
    timeoutMs?: number;
    adapters?: Record<StoreKey, StoreAdapter>;
    now?: () => number;
  }
): SyncEngine {
  const debounceMs = deps?.debounceMs ?? 1500;
  const timeoutMs = deps?.timeoutMs ?? 4000;
  const adapters = deps?.adapters ?? STORE_ADAPTERS;

  let state: SyncState = "idle";
  const stateListeners = new Set<(s: SyncState) => void>();
  const dirty = new Set<StoreKey>();
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let flushPromise: Promise<void> | null = null;
  let unsubscribeBus: (() => void) | null = null;
  let started = false;

  function setState(next: SyncState): void {
    if (state === next) return;
    state = next;
    for (const fn of stateListeners) {
      try {
        fn(state);
      } catch {
        // a listener's own bug must not break sync
      }
    }
  }

  function clearDebounce(): void {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  function scheduleFlush(): void {
    clearDebounce();
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void flush();
    }, debounceMs);
  }

  function markDirty(key: StoreKey): void {
    dirty.add(key);
    scheduleFlush();
  }

  function onBusChange(change: StoreChange): void {
    if (change.source !== "local") return;
    markDirty(change.key);
  }

  function onVisibility(): void {
    if (typeof document !== "undefined" && document.hidden) {
      void flush({ keepalive: true });
    }
  }
  function onPageHide(): void {
    void flush({ keepalive: true });
  }
  function onOnline(): void {
    void flush();
  }

  function attachListeners(): void {
    if (!hasBrowserGlobals()) return;
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("online", onOnline);
  }
  function detachListeners(): void {
    if (!hasBrowserGlobals()) return;
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("online", onOnline);
  }

  async function start(): Promise<void> {
    if (started) return;
    started = true;

    const owner = readOwner();
    if (owner !== null && owner !== userId) {
      clearAllLearnerStores("remote");
    }
    const ownerAbsent = owner === null;

    // Subscribe before the pull so a failed/slow fetchAll never drops a
    // local write that happens while we're waiting on it.
    unsubscribeBus = subscribeStoreChange(onBusChange);
    attachListeners();

    let rows: Partial<Record<StoreKey, unknown>>;
    try {
      rows = await withTimeout(remote.fetchAll(userId), timeoutMs);
    } catch {
      setState("error");
      return;
    }

    const uploadKeys: StoreKey[] = [];
    for (const key of STORE_KEYS) {
      const adapter = adapters[key];
      const value = rows[key];
      const hasRemote = value !== undefined;
      const localIsEmpty = adapter.isEmpty(adapter.readRaw());
      const decision = decidePull({ remote: value, hasRemote, localIsEmpty, ownerAbsent });
      if (decision === "apply-remote") {
        adapter.applyRemote(value); // invalid payloads are silently ignored
      } else if (decision === "upload-local") {
        uploadKeys.push(key);
      }
    }

    writeOwner(userId);

    if (uploadKeys.length > 0) {
      for (const key of uploadKeys) dirty.add(key);
      await flush();
    }
  }

  async function doFlush(opts?: { keepalive?: boolean }): Promise<void> {
    clearDebounce();
    if (dirty.size === 0) {
      setState("idle");
      return;
    }
    setState("syncing");
    const keys = Array.from(dirty);
    const results = await Promise.allSettled(
      keys.map(async (key) => {
        const adapter = adapters[key];
        const value = adapter.readRaw(); // latest wins: read at flush time, not at markDirty time
        await remote.upsert(userId, key, value, opts);
        return key;
      })
    );
    let anyFailed = false;
    results.forEach((result, i) => {
      const key = keys[i];
      if (result.status === "fulfilled") {
        dirty.delete(key);
      } else {
        anyFailed = true;
      }
    });
    setState(anyFailed ? "error" : "idle");
  }

  function flush(opts?: { keepalive?: boolean }): Promise<void> {
    if (flushPromise) return flushPromise;
    const p = doFlush(opts).finally(() => {
      flushPromise = null;
    });
    flushPromise = p;
    return p;
  }

  async function stop(): Promise<void> {
    clearDebounce();
    if (unsubscribeBus) {
      unsubscribeBus();
      unsubscribeBus = null;
    }
    detachListeners();
    await flush();
  }

  return {
    start,
    flush,
    stop,
    get state() {
      return state;
    },
    onStateChange(cb) {
      stateListeners.add(cb);
      return () => {
        stateListeners.delete(cb);
      };
    },
  };
}
