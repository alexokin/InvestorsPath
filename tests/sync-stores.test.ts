import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORE_ADAPTERS, clearAllLearnerStores } from "@/lib/sync/stores";
import { KEY_V2, defaultProgress } from "@/lib/progress/storage";
import { FLASHCARDS_STORAGE_KEY } from "@/lib/flashcards/storage";
import { KEY_V1 as WORKSHEETS_KEY } from "@/lib/worksheet/storage";

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

describe("STORE_ADAPTERS", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
    vi.stubGlobal("window", { localStorage: storage });
    vi.stubGlobal("document", undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("progress", () => {
    it("isEmpty is true for defaults, false once anything is set", () => {
      const adapter = STORE_ADAPTERS.progress;
      expect(adapter.isEmpty(defaultProgress())).toBe(true);
      expect(adapter.isEmpty({ ...defaultProgress(), completedLessons: { a: true } })).toBe(false);
      expect(adapter.isEmpty({ ...defaultProgress(), certificateName: "x" })).toBe(false);
      expect(adapter.isEmpty({ ...defaultProgress(), lastVisited: { chapterSlug: "a", lessonSlug: "b", at: 1 } })).toBe(
        false
      );
    });

    it("applyRemote rejects invalid payloads and leaves storage untouched", () => {
      const adapter = STORE_ADAPTERS.progress;
      expect(adapter.applyRemote({ completedLessons: { a: "not-a-bool" } })).toBe(false);
      expect(adapter.applyRemote(null)).toBe(false);
      expect(adapter.applyRemote([1, 2, 3])).toBe(false);
      expect(storage.getItem(KEY_V2)).toBeNull();
    });

    it("applyRemote accepts a valid partial payload, defaulting missing fields", () => {
      const adapter = STORE_ADAPTERS.progress;
      expect(adapter.applyRemote({ completedLessons: { a: true } })).toBe(true);
      const stored = JSON.parse(storage.getItem(KEY_V2) ?? "null");
      expect(stored).toEqual({ ...defaultProgress(), completedLessons: { a: true } });
    });

    it("clear removes the v1/v2 keys", () => {
      storage.setItem(KEY_V2, JSON.stringify(defaultProgress()));
      STORE_ADAPTERS.progress.clear();
      expect(storage.getItem(KEY_V2)).toBeNull();
    });
  });

  describe("flashcards", () => {
    it("isEmpty is true for {} and false once populated", () => {
      const adapter = STORE_ADAPTERS.flashcards;
      expect(adapter.isEmpty({})).toBe(true);
      expect(adapter.isEmpty({ slug: { box: 1, due: 1, seen: 0 } })).toBe(false);
      expect(adapter.isEmpty(null)).toBe(true);
      expect(adapter.isEmpty([1, 2])).toBe(true);
    });

    it("applyRemote rejects non-plain-object payloads and leaves storage untouched", () => {
      const adapter = STORE_ADAPTERS.flashcards;
      expect(adapter.applyRemote("nope")).toBe(false);
      expect(adapter.applyRemote(null)).toBe(false);
      expect(adapter.applyRemote([1, 2])).toBe(false);
      expect(storage.getItem(FLASHCARDS_STORAGE_KEY)).toBeNull();
    });

    it("applyRemote drops malformed entries but accepts the rest", () => {
      const adapter = STORE_ADAPTERS.flashcards;
      const valid = { box: 1, due: 1700000000000, seen: 0 };
      expect(adapter.applyRemote({ good: valid, bad: { nonsense: true } })).toBe(true);
      expect(JSON.parse(storage.getItem(FLASHCARDS_STORAGE_KEY) ?? "null")).toEqual({ good: valid });
    });
  });

  describe("worksheets", () => {
    it("isEmpty is true for {} and false once populated", () => {
      const adapter = STORE_ADAPTERS.worksheets;
      expect(adapter.isEmpty({})).toBe(true);
      expect(
        adapter.isEmpty({
          w1: {
            id: "w1",
            ticker: "AAA",
            company: "Co",
            createdAt: 1,
            updatedAt: 1,
            thesis: "",
            items: {},
            verdict: "",
          },
        })
      ).toBe(false);
    });

    it("applyRemote rejects invalid payloads and leaves storage untouched", () => {
      const adapter = STORE_ADAPTERS.worksheets;
      expect(adapter.applyRemote({ w1: { bad: true } })).toBe(false);
      expect(adapter.applyRemote(null)).toBe(false);
      expect(storage.getItem(WORKSHEETS_KEY)).toBeNull();
    });

    it("applyRemote accepts a valid worksheet store", () => {
      const adapter = STORE_ADAPTERS.worksheets;
      const ws = {
        id: "w1",
        ticker: "AAA",
        company: "Co",
        createdAt: 1,
        updatedAt: 1,
        thesis: "",
        items: {},
        verdict: "" as const,
      };
      expect(adapter.applyRemote({ w1: ws })).toBe(true);
      expect(JSON.parse(storage.getItem(WORKSHEETS_KEY) ?? "null")).toEqual({ w1: ws });
    });
  });

  describe("clearAllLearnerStores", () => {
    it("clears all three stores", () => {
      storage.setItem(KEY_V2, JSON.stringify(defaultProgress()));
      storage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify({ a: { box: 1, due: 1, seen: 0 } }));
      storage.setItem(WORKSHEETS_KEY, JSON.stringify({}));

      clearAllLearnerStores();

      expect(storage.getItem(KEY_V2)).toBeNull();
      expect(storage.getItem(FLASHCARDS_STORAGE_KEY)).toBeNull();
      expect(storage.getItem(WORKSHEETS_KEY)).toBeNull();
    });
  });
});
