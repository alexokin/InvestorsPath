"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useProgress } from "@/components/progress/ProgressProvider";

export function BookmarkButton({
  chapterSlug,
  lessonSlug,
}: {
  chapterSlug: string;
  lessonSlug: string;
}) {
  const { isBookmarked, toggleBookmark, hydrated } = useProgress();
  const saved = hydrated && isBookmarked(chapterSlug, lessonSlug);
  const Icon = saved ? BookmarkCheck : Bookmark;

  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => toggleBookmark(chapterSlug, lessonSlug)}
      className={[
        "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
        saved
          ? "border-primary bg-accent text-primary"
          : "border-border bg-surface text-foreground hover:bg-accent",
      ].join(" ")}
    >
      <Icon className="size-4" />
      {saved ? "בסימניות" : "שמור לסימניות"}
    </button>
  );
}
