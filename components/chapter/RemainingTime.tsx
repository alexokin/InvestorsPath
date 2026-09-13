"use client";

import { Clock } from "lucide-react";
import { useProgress } from "@/components/progress/ProgressProvider";

type RemainingTimeProps = {
  chapterSlug: string;
  lessons: { slug: string; estimatedMinutes: number }[];
};

/**
 * Shows how many minutes of the chapter are still ahead of the reader, based
 * on the sum of estimatedMinutes of lessons not yet marked complete. Renders
 * nothing until progress is hydrated from localStorage so the static HTML and
 * the first client render match.
 */
export function RemainingTime({ chapterSlug, lessons }: RemainingTimeProps) {
  const { hydrated, isComplete } = useProgress();
  if (!hydrated) return null;

  const remaining = lessons
    .filter((lesson) => !isComplete(chapterSlug, lesson.slug))
    .reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0);

  return (
    <p className="flex items-center gap-1.5 text-sm text-muted">
      <Clock className="size-4 shrink-0 text-primary" />
      {remaining === 0 ? (
        <span className="font-medium text-foreground">סיימתם את הפרק!</span>
      ) : (
        <span>נותרו כ-{remaining} דק׳ בפרק</span>
      )}
    </p>
  );
}
