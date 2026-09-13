"use client";

import Link from "next/link";
import { Bookmark, CheckCircle2, Circle, Clock } from "lucide-react";
import { useProgress } from "@/components/progress/ProgressProvider";
import type { Chapter } from "@/lib/content/schema";

export function LessonList({ chapter }: { chapter: Chapter }) {
  const { isComplete, isBookmarked, hydrated } = useProgress();

  return (
    <ol className="space-y-2">
      {chapter.lessons.map((lesson, i) => {
        const done = hydrated && isComplete(chapter.slug, lesson.slug);
        const marked = hydrated && isBookmarked(chapter.slug, lesson.slug);
        return (
          <li key={lesson.slug}>
            <Link
              href={lesson.href}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 hover:border-primary"
            >
              <div className="flex items-center gap-3">
                {done ? (
                  <CheckCircle2 className="size-5 shrink-0 text-primary" />
                ) : (
                  <Circle className="size-5 shrink-0 text-slate-300 dark:text-slate-600" />
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {i + 1}. {lesson.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{lesson.description}</p>
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                {marked && <Bookmark aria-label="בסימניות" className="size-3.5 fill-current text-primary" />}
                <Clock className="size-3.5" />
                {lesson.estimatedMinutes} דק&apos;
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
