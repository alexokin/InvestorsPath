"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  clearProgress,
  defaultProgress,
  lessonKey,
  readProgress,
  writeProgress,
  type ProgressState,
} from "@/lib/progress/storage";

type ProgressContextValue = {
  hydrated: boolean;
  /** Read-only snapshot of the full persisted state. */
  state: Readonly<ProgressState>;
  isComplete: (chapterSlug: string, lessonSlug: string) => boolean;
  markComplete: (chapterSlug: string, lessonSlug: string, complete?: boolean) => void;
  setQuizResult: (
    chapterSlug: string,
    lessonSlug: string,
    correct: number,
    total: number
  ) => void;
  getQuizResult: (
    chapterSlug: string,
    lessonSlug: string
  ) => { correct: number; total: number } | undefined;
  chapterPercent: (chapterSlug: string, lessonSlugs: string[]) => number;
  lastVisited: ProgressState["lastVisited"];
  setLastVisited: (chapterSlug: string, lessonSlug: string) => void;
  isBookmarked: (chapterSlug: string, lessonSlug: string) => boolean;
  toggleBookmark: (chapterSlug: string, lessonSlug: string) => void;
  getNote: (chapterSlug: string, lessonSlug: string) => string;
  /** Empty / whitespace-only text removes the note. */
  setNote: (chapterSlug: string, lessonSlug: string, text: string) => void;
  setCertificateName: (name: string) => void;
  /** Replace the whole state (e.g. after import). Missing fields are defaulted. */
  replaceState: (next: ProgressState) => void;
  /** Wipe all progress from memory and localStorage. */
  resetProgress: () => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(defaultProgress());
  const [hydrated, setHydrated] = useState(false);
  // React runs child effects before parent effects, so a child such as
  // LastVisitedTracker can call update() before this provider has read
  // localStorage. Track hydration in a ref (state is stale inside the
  // setState updater) so early updates merge into the persisted state
  // instead of overwriting it with defaults.
  const hydratedRef = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage on mount
    setState(readProgress());
    hydratedRef.current = true;
    setHydrated(true);
  }, []);

  const update = (updater: (prev: ProgressState) => ProgressState) => {
    setState((prev) => {
      const base = hydratedRef.current ? prev : readProgress();
      const next = updater(base);
      writeProgress(next);
      return next;
    });
  };

  const value = useMemo<ProgressContextValue>(
    () => ({
      hydrated,
      state,
      isComplete: (chapterSlug, lessonSlug) =>
        Boolean(state.completedLessons[lessonKey(chapterSlug, lessonSlug)]),
      markComplete: (chapterSlug, lessonSlug, complete = true) =>
        update((prev) => ({
          ...prev,
          completedLessons: {
            ...prev.completedLessons,
            [lessonKey(chapterSlug, lessonSlug)]: complete,
          },
        })),
      setQuizResult: (chapterSlug, lessonSlug, correct, total) =>
        update((prev) => ({
          ...prev,
          quizScores: {
            ...prev.quizScores,
            [lessonKey(chapterSlug, lessonSlug)]: { correct, total },
          },
        })),
      getQuizResult: (chapterSlug, lessonSlug) =>
        state.quizScores[lessonKey(chapterSlug, lessonSlug)],
      chapterPercent: (chapterSlug, lessonSlugs) => {
        if (lessonSlugs.length === 0) return 0;
        const done = lessonSlugs.filter((slug) =>
          Boolean(state.completedLessons[lessonKey(chapterSlug, slug)])
        ).length;
        return Math.round((done / lessonSlugs.length) * 100);
      },
      lastVisited: state.lastVisited,
      setLastVisited: (chapterSlug, lessonSlug) =>
        update((prev) => ({
          ...prev,
          lastVisited: { chapterSlug, lessonSlug, at: Date.now() },
        })),
      isBookmarked: (chapterSlug, lessonSlug) =>
        Boolean(state.bookmarks[lessonKey(chapterSlug, lessonSlug)]),
      toggleBookmark: (chapterSlug, lessonSlug) =>
        update((prev) => {
          const key = lessonKey(chapterSlug, lessonSlug);
          const bookmarks = { ...prev.bookmarks };
          if (bookmarks[key]) delete bookmarks[key];
          else bookmarks[key] = true;
          return { ...prev, bookmarks };
        }),
      getNote: (chapterSlug, lessonSlug) => state.notes[lessonKey(chapterSlug, lessonSlug)] ?? "",
      setNote: (chapterSlug, lessonSlug, text) =>
        update((prev) => {
          const key = lessonKey(chapterSlug, lessonSlug);
          const notes = { ...prev.notes };
          if (text.trim().length === 0) delete notes[key];
          else notes[key] = text;
          return { ...prev, notes };
        }),
      setCertificateName: (name) =>
        update((prev) => {
          const trimmed = name.trim();
          const next = { ...prev };
          if (trimmed) next.certificateName = trimmed;
          else delete next.certificateName;
          return next;
        }),
      replaceState: (next) => update(() => ({ ...defaultProgress(), ...next, version: 2 })),
      resetProgress: () => {
        clearProgress();
        setState(defaultProgress());
      },
    }),
    [state, hydrated]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
}
