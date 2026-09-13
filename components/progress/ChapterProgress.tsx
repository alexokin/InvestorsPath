"use client";

import { useProgress } from "@/components/progress/ProgressProvider";
import { ProgressBar } from "@/components/progress/ProgressBar";

export function ChapterProgress({
  chapterSlug,
  lessonSlugs,
}: {
  chapterSlug: string;
  lessonSlugs: string[];
}) {
  const { hydrated, chapterPercent } = useProgress();
  const percent = hydrated ? chapterPercent(chapterSlug, lessonSlugs) : 0;

  if (!hydrated || percent === 0) return null;

  return (
    <div className="mt-3 flex items-center gap-2">
      <ProgressBar percent={percent} />
      <span className="shrink-0 text-xs font-medium text-muted">{percent}%</span>
    </div>
  );
}
