import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  notifyStoreChange,
  subscribeStoreChange,
  type StoreChange,
} from "@/lib/storage/bus";
import { writeProgress, clearProgress, defaultProgress } from "@/lib/progress/storage";
import {
  writeFlashcards,
  clearFlashcards,
  parseFlashcardStore,
  defaultFlashcardStore,
} from "@/lib/flashcards/storage";
import { writeWorksheets, clearWorksheets } from "@/lib/worksheet/storage";

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

describe("storage bus", () => {
  it("delivers a change to a subscribed listener", () => {
    const received: StoreChange[] = [];
    const unsubscribe = subscribeStoreChange((c) => received.push(c));
    notifyStoreChange("progress");
    unsubscribe();
    expect(received).toEqual([{ key: "progress", source: "local" }]);
  });

  it("defaults source to 'local'", () => {
    const received: StoreChange[] = [];
    const unsubscribe = subscribeStoreChange((c) => received.push(c));
    notifyStoreChange("flashcards");
    notifyStoreChange("worksheets", "remote");
    unsubscribe();
    expect(received).toEqual([
      { key: "flashcards", source: "local" },
      { key: "worksheets", source: "remote" },
    ]);
  });

  it("stops delivering after unsubscribe", () => {
    const received: StoreChange[] = [];
    const unsubscribe = subscribeStoreChange((c) => received.push(c));
    unsubscribe();
    notifyStoreChange("progress");
    expect(received).toEqual([]);
  });

  it("notifies listeners in subscription order", () => {
    const order: string[] = [];
    const unsub1 = subscribeStoreChange(() => order.push("first"));
    const unsub2 = subscribeStoreChange(() => order.push("second"));
    notifyStoreChange("progress");
    unsub1();
    unsub2();
    expect(order).toEqual(["first", "second"]);
  });

  it("a throwing listener does not prevent others from being notified", () => {
    const received: StoreChange[] = [];
    const unsub1 = subscribeStoreChange(() => {
      throw new Error("boom");
    });
    const unsub2 = subscribeStoreChange((c) => received.push(c));
    expect(() => notifyStoreChange("progress")).not.toThrow();
    unsub1();
    unsub2();
    expect(received).toEqual([{ key: "progress", source: "local" }]);
  });
});

describe("parseFlashcardStore", () => {
  it("returns an empty store for non-object input", () => {
    expect(parseFlashcardStore(null)).toEqual({});
    expect(parseFlashcardStore(undefined)).toEqual({});
    expect(parseFlashcardStore("string")).toEqual({});
    expect(parseFlashcardStore(42)).toEqual({});
    expect(parseFlashcardStore([])).toEqual({});
  });

  it("drops malformed entries and keeps valid ones", () => {
    const valid = { box: 1, due: 1700000000000, seen: 0 };
    const result = parseFlashcardStore({ good: valid, bad: { nonsense: true } });
    expect(result).toEqual({ good: valid });
  });

  it("returns default store for an empty object", () => {
    expect(parseFlashcardStore({})).toEqual(defaultFlashcardStore());
  });
});

describe("storage writes emit bus events", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
    vi.stubGlobal("window", { localStorage: storage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("writeProgress emits {key: 'progress', source: 'local'} by default", () => {
    const received: StoreChange[] = [];
    const unsubscribe = subscribeStoreChange((c) => received.push(c));
    writeProgress(defaultProgress());
    unsubscribe();
    expect(received).toEqual([{ key: "progress", source: "local" }]);
  });

  it("writeProgress honors an explicit 'remote' source", () => {
    const received: StoreChange[] = [];
    const unsubscribe = subscribeStoreChange((c) => received.push(c));
    writeProgress(defaultProgress(), "remote");
    unsubscribe();
    expect(received).toEqual([{ key: "progress", source: "remote" }]);
  });

  it("clearProgress emits {key: 'progress'}", () => {
    const received: StoreChange[] = [];
    const unsubscribe = subscribeStoreChange((c) => received.push(c));
    clearProgress();
    unsubscribe();
    expect(received).toEqual([{ key: "progress", source: "local" }]);
  });

  it("writeFlashcards and clearFlashcards emit {key: 'flashcards'}", () => {
    const received: StoreChange[] = [];
    const unsubscribe = subscribeStoreChange((c) => received.push(c));
    writeFlashcards({});
    clearFlashcards("remote");
    unsubscribe();
    expect(received).toEqual([
      { key: "flashcards", source: "local" },
      { key: "flashcards", source: "remote" },
    ]);
  });

  it("writeWorksheets and clearWorksheets emit {key: 'worksheets'}", () => {
    const received: StoreChange[] = [];
    const unsubscribe = subscribeStoreChange((c) => received.push(c));
    writeWorksheets({});
    clearWorksheets();
    unsubscribe();
    expect(received).toEqual([
      { key: "worksheets", source: "local" },
      { key: "worksheets", source: "local" },
    ]);
  });
});
