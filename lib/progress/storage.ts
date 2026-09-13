export type ProgressState = {
  completedLessons: Record<string, boolean>;
  quizScores: Record<string, { correct: number; total: number }>;
  lastVisited?: { chapterSlug: string; lessonSlug: string; at: number };
};

const KEY = "vip:progress:v1";

export function defaultProgress(): ProgressState {
  return { completedLessons: {}, quizScores: {} };
}

export function readProgress(): ProgressState {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
    return { ...defaultProgress(), ...parsed };
  } catch {
    return defaultProgress();
  }
}

export function writeProgress(state: ProgressState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, quota) — fail silently.
  }
}

export function lessonKey(chapterSlug: string, lessonSlug: string): string {
  return `${chapterSlug}/${lessonSlug}`;
}
