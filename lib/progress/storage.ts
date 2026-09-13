import {
  IMPORT_ERRORS,
  progressV1Schema,
  progressV2Schema,
  type ProgressV1,
} from "./schema";

export type ProgressState = {
  version: 2;
  completedLessons: Record<string, boolean>;
  quizScores: Record<string, { correct: number; total: number }>;
  lastVisited?: { chapterSlug: string; lessonSlug: string; at: number };
  bookmarks: Record<string, true>;
  notes: Record<string, string>;
  certificateName?: string;
};

export const KEY_V1 = "vip:progress:v1";
export const KEY_V2 = "vip:progress:v2";

export function defaultProgress(): ProgressState {
  return { version: 2, completedLessons: {}, quizScores: {}, bookmarks: {}, notes: {} };
}

/** Upgrade a v1 shape (or a partial v2 shape) to a complete v2 state. */
export function migrateV1(v1: Partial<ProgressV1> & Partial<ProgressState>): ProgressState {
  return { ...defaultProgress(), ...v1, version: 2 };
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readProgress(): ProgressState {
  const storage = getStorage();
  if (!storage) return defaultProgress();
  try {
    const rawV2 = storage.getItem(KEY_V2);
    if (rawV2) {
      return { ...defaultProgress(), ...JSON.parse(rawV2), version: 2 };
    }
    const rawV1 = storage.getItem(KEY_V1);
    if (rawV1) {
      // One-time migration: write v2, leave v1 untouched for older builds.
      const migrated = migrateV1(JSON.parse(rawV1));
      writeProgress(migrated);
      return migrated;
    }
    return defaultProgress();
  } catch {
    return defaultProgress();
  }
}

export function writeProgress(state: ProgressState): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(KEY_V2, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, quota) — fail silently.
  }
}

export function clearProgress(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(KEY_V2);
    storage.removeItem(KEY_V1);
  } catch {
    // ignore
  }
}

export function lessonKey(chapterSlug: string, lessonSlug: string): string {
  return `${chapterSlug}/${lessonSlug}`;
}

/** Pretty JSON of the current (or given) state plus an export timestamp. */
export function exportProgress(state: ProgressState = readProgress()): string {
  return JSON.stringify(
    { ...state, version: 2, exportedAt: new Date().toISOString() },
    null,
    2
  );
}

/**
 * Validate a user-supplied JSON string as a v1 or v2 progress export.
 * Throws an Error with a Hebrew message on anything else.
 */
export function parseImportedProgress(raw: string): ProgressState {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(IMPORT_ERRORS.notJson);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(IMPORT_ERRORS.notObject);
  }

  const version = (data as { version?: unknown }).version;
  if (version === 2) {
    const result = progressV2Schema.safeParse(data);
    if (!result.success) throw new Error(IMPORT_ERRORS.badShape);
    return result.data;
  }
  if (version === undefined || version === 1) {
    const result = progressV1Schema.safeParse(data);
    if (!result.success) throw new Error(IMPORT_ERRORS.badShape);
    return migrateV1(result.data);
  }
  throw new Error(IMPORT_ERRORS.badShape);
}
