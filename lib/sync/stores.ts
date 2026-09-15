import type { StoreChangeSource, StoreKey } from "@/lib/storage/bus";
import {
  clearProgress,
  defaultProgress,
  readProgress,
  writeProgress,
  type ProgressState,
} from "@/lib/progress/storage";
import { progressV2Schema } from "@/lib/progress/schema";
import {
  clearFlashcards,
  parseFlashcardStore,
  readFlashcards,
  writeFlashcards,
} from "@/lib/flashcards/storage";
import {
  clearWorksheets,
  readWorksheets,
  writeWorksheets,
} from "@/lib/worksheet/storage";
import { worksheetStoreSchema } from "@/lib/worksheet/schema";

/** One store's read/write/validate surface, uniform enough for the sync engine to drive generically. */
export type StoreAdapter = {
  key: StoreKey;
  readRaw(): unknown;
  isEmpty(value: unknown): boolean;
  /** Validate + write remote data with source "remote". Returns whether it was applied. */
  applyRemote(value: unknown): boolean;
  clear(): void;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const progressAdapter: StoreAdapter = {
  key: "progress",
  readRaw: () => readProgress(),
  isEmpty: (value) => {
    if (!isPlainObject(value)) return true;
    const v = value as Partial<ProgressState>;
    const noRecords =
      Object.keys(v.completedLessons ?? {}).length === 0 &&
      Object.keys(v.quizScores ?? {}).length === 0 &&
      Object.keys(v.bookmarks ?? {}).length === 0 &&
      Object.keys(v.notes ?? {}).length === 0;
    return noRecords && !v.lastVisited && !v.certificateName;
  },
  applyRemote: (value) => {
    if (!isPlainObject(value)) return false;
    const result = progressV2Schema.safeParse({ ...defaultProgress(), ...value, version: 2 });
    if (!result.success) return false;
    writeProgress(result.data, "remote");
    return true;
  },
  clear: () => clearProgress("remote"),
};

const flashcardsAdapter: StoreAdapter = {
  key: "flashcards",
  readRaw: () => readFlashcards(),
  isEmpty: (value) => !isPlainObject(value) || Object.keys(value).length === 0,
  applyRemote: (value) => {
    if (!isPlainObject(value)) return false;
    writeFlashcards(parseFlashcardStore(value), "remote");
    return true;
  },
  clear: () => clearFlashcards("remote"),
};

const worksheetsAdapter: StoreAdapter = {
  key: "worksheets",
  readRaw: () => readWorksheets(),
  isEmpty: (value) => !isPlainObject(value) || Object.keys(value).length === 0,
  applyRemote: (value) => {
    if (!isPlainObject(value)) return false;
    const result = worksheetStoreSchema.safeParse(value);
    if (!result.success) return false;
    writeWorksheets(result.data, "remote");
    return true;
  },
  clear: () => clearWorksheets("remote"),
};

export const STORE_ADAPTERS: Record<StoreKey, StoreAdapter> = {
  progress: progressAdapter,
  flashcards: flashcardsAdapter,
  worksheets: worksheetsAdapter,
};

/** Wipe all three local learner stores (used on sign-out and owner mismatch). */
export function clearAllLearnerStores(source: StoreChangeSource = "remote"): void {
  clearProgress(source);
  clearFlashcards(source);
  clearWorksheets(source);
}
