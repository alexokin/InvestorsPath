import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  KEY_V1,
  KEY_V2,
  defaultProgress,
  exportProgress,
  migrateV1,
  parseImportedProgress,
  readProgress,
  writeProgress,
  type ProgressState,
} from "@/lib/progress/storage";
import { IMPORT_ERRORS } from "@/lib/progress/schema";

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

const v1Sample = {
  completedLessons: { "before-you-start/what-is-value": true, "before-you-start/mindset": false },
  quizScores: { "before-you-start/what-is-value": { correct: 3, total: 4 } },
  lastVisited: { chapterSlug: "before-you-start", lessonSlug: "mindset", at: 1700000000000 },
};

const v2Sample: ProgressState = {
  version: 2,
  ...v1Sample,
  bookmarks: { "before-you-start/mindset": true },
  notes: { "before-you-start/mindset": "לחזור על מושג מרווח הביטחון" },
  certificateName: "ישראל ישראלי",
};

describe("progress storage", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
    vi.stubGlobal("window", { localStorage: storage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns defaults when nothing is stored", () => {
    expect(readProgress()).toEqual(defaultProgress());
    expect(storage.getItem(KEY_V2)).toBeNull();
  });

  it("migrates v1 to v2, writes v2 and leaves v1 in place", () => {
    storage.setItem(KEY_V1, JSON.stringify(v1Sample));

    const state = readProgress();

    expect(state.version).toBe(2);
    expect(state.completedLessons).toEqual(v1Sample.completedLessons);
    expect(state.quizScores).toEqual(v1Sample.quizScores);
    expect(state.lastVisited).toEqual(v1Sample.lastVisited);
    expect(state.bookmarks).toEqual({});
    expect(state.notes).toEqual({});

    expect(storage.getItem(KEY_V1)).toBe(JSON.stringify(v1Sample));
    expect(JSON.parse(storage.getItem(KEY_V2) ?? "null")).toEqual(state);
  });

  it("prefers v2 over v1 when both exist", () => {
    storage.setItem(KEY_V1, JSON.stringify(v1Sample));
    storage.setItem(KEY_V2, JSON.stringify(v2Sample));
    expect(readProgress()).toEqual(v2Sample);
  });

  it("fills missing v2 fields with defaults", () => {
    storage.setItem(KEY_V2, JSON.stringify({ version: 2, completedLessons: { a: true } }));
    const state = readProgress();
    expect(state).toEqual({ ...defaultProgress(), completedLessons: { a: true } });
  });

  it("falls back to defaults on corrupt storage", () => {
    storage.setItem(KEY_V2, "{not json");
    expect(readProgress()).toEqual(defaultProgress());
  });

  it("migrateV1 is idempotent on v2 input", () => {
    expect(migrateV1(v2Sample)).toEqual(v2Sample);
  });

  it("export round-trips through import", () => {
    writeProgress(v2Sample);
    const json = exportProgress();
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(2);
    expect(typeof parsed.exportedAt).toBe("string");
    expect(json).toContain("\n"); // pretty printed

    expect(parseImportedProgress(json)).toEqual(v2Sample);
  });

  it("exportProgress accepts an explicit state", () => {
    const json = exportProgress({ ...defaultProgress(), notes: { x: "y" } });
    expect(parseImportedProgress(json).notes).toEqual({ x: "y" });
  });
});

describe("parseImportedProgress", () => {
  it("accepts a v1 shape and upgrades it", () => {
    const state = parseImportedProgress(JSON.stringify(v1Sample));
    expect(state).toEqual({ ...defaultProgress(), ...v1Sample });
  });

  it("accepts a v2 shape and strips unknown keys", () => {
    const state = parseImportedProgress(JSON.stringify({ ...v2Sample, exportedAt: "2026-01-01" }));
    expect(state).toEqual(v2Sample);
    expect("exportedAt" in state).toBe(false);
  });

  it("rejects invalid JSON with a Hebrew message", () => {
    expect(() => parseImportedProgress("{oops")).toThrow(IMPORT_ERRORS.notJson);
  });

  it("rejects non-object JSON", () => {
    expect(() => parseImportedProgress("[]")).toThrow(IMPORT_ERRORS.notObject);
    expect(() => parseImportedProgress("null")).toThrow(IMPORT_ERRORS.notObject);
    expect(() => parseImportedProgress('"text"')).toThrow(IMPORT_ERRORS.notObject);
  });

  it("rejects objects with the wrong shape", () => {
    expect(() => parseImportedProgress(JSON.stringify({ foo: "bar" }))).toThrow(
      IMPORT_ERRORS.badShape
    );
    expect(() =>
      parseImportedProgress(JSON.stringify({ completedLessons: { a: "yes" }, quizScores: {} }))
    ).toThrow(IMPORT_ERRORS.badShape);
    expect(() =>
      parseImportedProgress(JSON.stringify({ ...v2Sample, bookmarks: { a: false } }))
    ).toThrow(IMPORT_ERRORS.badShape);
  });

  it("rejects unknown versions", () => {
    expect(() => parseImportedProgress(JSON.stringify({ ...v2Sample, version: 3 }))).toThrow(
      IMPORT_ERRORS.badShape
    );
  });
});
