import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSyncEngine, decidePull } from "@/lib/sync/engine";
import { createMemoryRemote } from "@/lib/sync/memory-remote";
import type { SyncRemote } from "@/lib/sync/remote";
import { readOwner, writeOwner } from "@/lib/sync/owner";
import { defaultProgress, readProgress, writeProgress } from "@/lib/progress/storage";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => Array.from(map.keys())[i] ?? null,
    removeItem: (k) => {
      map.delete(k);
    },
    setItem: (k, v) => {
      map.set(k, String(v));
    },
  };
}

function setupBrowserGlobals() {
  const store = memoryStorage();
  const win = {
    localStorage: store,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  const doc = {
    hidden: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", doc);
  return { store, win, doc };
}

describe("decidePull", () => {
  it("applies remote whenever a remote row exists", () => {
    expect(
      decidePull({ remote: { a: 1 }, hasRemote: true, localIsEmpty: false, ownerAbsent: false })
    ).toBe("apply-remote");
    expect(
      decidePull({ remote: {}, hasRemote: true, localIsEmpty: true, ownerAbsent: true })
    ).toBe("apply-remote");
  });

  it("uploads local when there's no remote row, local isn't empty, and no owner", () => {
    expect(
      decidePull({ remote: undefined, hasRemote: false, localIsEmpty: false, ownerAbsent: true })
    ).toBe("upload-local");
  });

  it("no-ops when local is empty", () => {
    expect(
      decidePull({ remote: undefined, hasRemote: false, localIsEmpty: true, ownerAbsent: true })
    ).toBe("noop");
  });

  it("no-ops when an owner is already set (even with non-empty local)", () => {
    expect(
      decidePull({ remote: undefined, hasRemote: false, localIsEmpty: false, ownerAbsent: false })
    ).toBe("noop");
  });
});

describe("createSyncEngine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("start() applies a remote row over local state", async () => {
    setupBrowserGlobals();
    const remote = createMemoryRemote({
      u1: { progress: { completedLessons: { "a/b": true } } },
    });
    const engine = createSyncEngine("u1", remote);

    await engine.start();

    expect(readProgress().completedLessons).toEqual({ "a/b": true });
    expect(readOwner()).toBe("u1");
    expect(engine.state).toBe("idle");

    await engine.stop();
  });

  it("start() uploads legacy local data when owner is absent and there's no remote row", async () => {
    setupBrowserGlobals();
    writeProgress({ ...defaultProgress(), completedLessons: { "a/b": true } });
    const remote = createMemoryRemote();
    const engine = createSyncEngine("u1", remote);

    await engine.start();

    const rows = await remote.fetchAll("u1");
    expect((rows.progress as { completedLessons: Record<string, boolean> }).completedLessons).toEqual({
      "a/b": true,
    });
    expect(readOwner()).toBe("u1");

    await engine.stop();
  });

  it("owner mismatch clears local before the pull and never uploads it", async () => {
    setupBrowserGlobals();
    writeOwner("someone-else");
    writeProgress({ ...defaultProgress(), completedLessons: { "a/b": true } });
    const remote = createMemoryRemote();
    const engine = createSyncEngine("u1", remote);

    await engine.start();

    expect(readProgress()).toEqual(defaultProgress());
    const rows = await remote.fetchAll("u1");
    expect(rows.progress).toBeUndefined();
    expect(readOwner()).toBe("u1");

    await engine.stop();
  });

  it("debounces three quick local writes into one upsert with the latest value", async () => {
    setupBrowserGlobals();
    const remote = createMemoryRemote();
    const upsertSpy = vi.spyOn(remote, "upsert");
    const engine = createSyncEngine("u1", remote, { debounceMs: 1500 });

    await engine.start();
    upsertSpy.mockClear();

    writeProgress({ ...defaultProgress(), completedLessons: { one: true } });
    await vi.advanceTimersByTimeAsync(500);
    writeProgress({ ...defaultProgress(), completedLessons: { two: true } });
    await vi.advanceTimersByTimeAsync(500);
    writeProgress({ ...defaultProgress(), completedLessons: { three: true } });

    await vi.advanceTimersByTimeAsync(1500);

    const progressUpserts = upsertSpy.mock.calls.filter(([, key]) => key === "progress");
    expect(progressUpserts).toHaveLength(1);
    expect((progressUpserts[0][2] as { completedLessons: Record<string, boolean> }).completedLessons).toEqual({
      three: true,
    });

    await engine.stop();
  });

  it("keeps a key dirty after a failed upsert and retries on the next flush", async () => {
    let attempt = 0;
    const remote: SyncRemote = {
      async fetchAll() {
        return {};
      },
      async upsert() {
        attempt += 1;
        if (attempt === 1) throw new Error("network down");
      },
    };
    setupBrowserGlobals();
    const engine = createSyncEngine("u1", remote, { debounceMs: 1500 });
    await engine.start();

    writeProgress({ ...defaultProgress(), completedLessons: { a: true } });
    await vi.advanceTimersByTimeAsync(1500);
    expect(engine.state).toBe("error");
    expect(attempt).toBe(1);

    // Next flush (e.g. triggered by another local write) retries the still-dirty key.
    writeProgress({ ...defaultProgress(), completedLessons: { a: true, b: true } });
    await vi.advanceTimersByTimeAsync(1500);
    expect(attempt).toBe(2);
    expect(engine.state).toBe("idle");

    await engine.stop();
  });

  it("fetchAll rejection sets state to 'error' and start() still resolves", async () => {
    setupBrowserGlobals();
    const remote: SyncRemote = {
      async fetchAll() {
        throw new Error("offline");
      },
      async upsert() {},
    };
    const engine = createSyncEngine("u1", remote, { timeoutMs: 4000 });

    await expect(engine.start()).resolves.toBeUndefined();
    expect(engine.state).toBe("error");
    // Owner must not be written on a failed pull.
    expect(readOwner()).toBeNull();

    await engine.stop();
  });

  it("stop() flushes pending writes before returning", async () => {
    setupBrowserGlobals();
    const remote = createMemoryRemote();
    const upsertSpy = vi.spyOn(remote, "upsert");
    const engine = createSyncEngine("u1", remote, { debounceMs: 1500 });
    await engine.start();
    upsertSpy.mockClear();

    writeProgress({ ...defaultProgress(), completedLessons: { pending: true } });
    // Stop immediately, well before the debounce timer would fire.
    await engine.stop();

    const progressUpserts = upsertSpy.mock.calls.filter(([, key]) => key === "progress");
    expect(progressUpserts).toHaveLength(1);
    expect((progressUpserts[0][2] as { completedLessons: Record<string, boolean> }).completedLessons).toEqual({
      pending: true,
    });
  });
});
