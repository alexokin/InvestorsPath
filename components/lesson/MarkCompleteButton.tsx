"use client";

import { Check } from "lucide-react";
import { useProgress } from "@/components/progress/ProgressProvider";

export function MarkCompleteButton({
  chapterSlug,
  lessonSlug,
}: {
  chapterSlug: string;
  lessonSlug: string;
}) {
  const { isComplete, markComplete, hydrated } = useProgress();
  const done = hydrated && isComplete(chapterSlug, lessonSlug);

  return (
    <button
      type="button"
      onClick={() => markComplete(chapterSlug, lessonSlug, !done)}
      className={[
        "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
        done
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-primary text-primary-foreground hover:bg-primary-hover",
      ].join(" ")}
    >
      <Check className="size-4" />
      {done ? "השיעור סומן כהושלם" : "סימון כהושלם"}
    </button>
  );
}
