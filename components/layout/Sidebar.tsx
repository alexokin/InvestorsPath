"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, CheckCircle2, Circle } from "lucide-react";
import { useProgress } from "@/components/progress/ProgressProvider";
import type { Chapter } from "@/lib/content/schema";

export function Sidebar({ chapter }: { chapter: Chapter }) {
  const pathname = usePathname();
  const { isComplete, isBookmarked, hydrated } = useProgress();

  return (
    <nav aria-label="שיעורי הפרק" className="space-y-1">
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {chapter.title}
      </p>
      {chapter.lessons.map((lesson) => {
        const href = `/lessons/${chapter.slug}/${lesson.slug}/`;
        const active = pathname === href;
        const done = hydrated && isComplete(chapter.slug, lesson.slug);
        const marked = hydrated && isBookmarked(chapter.slug, lesson.slug);
        return (
          <Link
            key={lesson.slug}
            href={href}
            className={[
              "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
              active ? "bg-accent font-medium text-primary" : "text-muted hover:bg-accent/60",
            ].join(" ")}
          >
            {done ? (
              <CheckCircle2 className="size-4 shrink-0 text-primary" />
            ) : (
              <Circle className="size-4 shrink-0 text-slate-300 dark:text-slate-600" />
            )}
            <span className="flex-1">{lesson.title}</span>
            {marked && <Bookmark aria-label="בסימניות" className="size-3.5 shrink-0 fill-current text-primary" />}
          </Link>
        );
      })}
    </nav>
  );
}
