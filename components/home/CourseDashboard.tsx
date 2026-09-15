import Link from "next/link";
import { Clock } from "lucide-react";
import type { Chapter } from "@/lib/content/schema";
import { ResumeCard } from "@/components/progress/ResumeCard";
import { ChapterProgress } from "@/components/progress/ChapterProgress";

type CourseDashboardProps = {
  chapters: Chapter[];
  lessons: { chapterSlug: string; slug: string; title: string }[];
};

export function CourseDashboard({ chapters, lessons }: CourseDashboardProps) {
  return (
    <>
      <div className="mx-auto mt-8 max-w-md">
        <ResumeCard lessons={lessons} />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="mb-6 text-xl font-bold text-foreground">פרקי הקורס</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chapters.map((chapter, i) => (
            <Link
              key={chapter.slug}
              href={chapter.href}
              className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary"
            >
              <p className="text-xs font-semibold text-primary">פרק {i + 1}</p>
              <h3 className="mt-1 font-bold text-foreground">{chapter.title}</h3>
              <p className="mt-2 text-sm text-muted line-clamp-3">{chapter.description}</p>
              <p className="mt-3 flex items-center gap-1 text-xs text-muted">
                <Clock className="size-3.5" />
                {chapter.estimatedMinutes} דק&apos; · {chapter.lessons.length} שיעורים
              </p>
              <ChapterProgress
                chapterSlug={chapter.slug}
                lessonSlugs={chapter.lessons.map((lesson) => lesson.slug)}
              />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
